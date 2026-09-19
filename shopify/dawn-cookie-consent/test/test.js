const { chromium } = require('playwright');
const path = require('path');

const URL = 'file://' + path.join(__dirname, 'index.html');

// Stub of Shopify's Customer Privacy API, installed before the page scripts run.
function shopifyStub({ shouldShowBanner = true, consent = {}, available = true } = {}) {
  return `
    window.__calls = [];
    window.Shopify = {
      loadFeatures(features, cb) {
        window.__calls.push(['loadFeatures', features.map(f => f.name).join(',')]);
        if (!${available}) { cb(null); return; }
        window.Shopify.customerPrivacy = {
          shouldShowBanner: () => ${shouldShowBanner},
          currentVisitorConsent: () => (${JSON.stringify(consent)}),
          setTrackingConsent: (payload, cb2) => {
            window.__calls.push(['setTrackingConsent', payload]);
            document.dispatchEvent(new CustomEvent('visitorConsentCollected', { detail: payload }));
            cb2 && cb2({});
          },
        };
        cb(null);
      },
    };
  `;
}

const isOpen = (page) => page.evaluate(() => !document.querySelector('cookie-consent').hasAttribute('hidden'));
const dialogVisible = (page) => page.locator('[data-cc-dialog]').isVisible();
const pick = (page, value) => page.locator(`label:has(input[value="${value}"])`).click();

const results = [];
function check(name, pass, detail) {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail && !pass ? ' -> ' + detail : ''}`);
}

(async () => {
  const browser = await chromium.launch();

  // --- 1. Prompts when the API says the visitor must be asked -------------
  let ctx = await browser.newContext();
  let page = await ctx.newPage();
  await page.addInitScript(shopifyStub({ shouldShowBanner: true }));
  await page.goto(URL);
  await page.waitForTimeout(300);

  check('banner opens when shouldShowBanner() is true', (await isOpen(page)) && (await dialogVisible(page)));
  check(
    'native Shopify banner is hidden once our JS runs',
    !(await page.locator('#shopify-pc__banner').isVisible())
  );
  check(
    'focus moves into the dialog',
    await page.evaluate(() => document.activeElement === document.querySelector('[data-cc-dialog]'))
  );
  check('page scroll is locked', await page.evaluate(() => getComputedStyle(document.documentElement).overflow === 'hidden'));

  // Save the pre-selected "essential" choice.
  await page.locator('[data-cc-save]').click();
  await page.waitForTimeout(400);
  let calls = await page.evaluate(() => window.__calls);
  const essentialCall = calls.find((c) => c[0] === 'setTrackingConsent');
  check(
    'saving "essential" sends preferences only',
    JSON.stringify(essentialCall && essentialCall[1]) ===
      JSON.stringify({ analytics: false, marketing: false, preferences: true, sale_of_data: false }),
    JSON.stringify(essentialCall)
  );
  check('dialog closes after saving', !(await isOpen(page)));
  check('scroll unlocks after saving', await page.evaluate(() => getComputedStyle(document.documentElement).overflow !== 'hidden'));
  check('reopen button appears after a choice', await page.locator('[data-cc-reopen]').isVisible());
  check(
    'choice is persisted to localStorage',
    (await page.evaluate(() => JSON.parse(localStorage.getItem('cookie-consent')).level)) === 'essential'
  );

  // Reopening through the footer link.
  await page.locator('#footer-link').click();
  await page.waitForTimeout(200);
  check('footer #cookie-preferences link reopens the dialog', (await isOpen(page)) && (await dialogVisible(page)));
  check(
    'previous choice is restored when reopened',
    await page.locator('input[value="essential"]').isChecked()
  );

  // Escape closes and restores focus.
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  check('Escape closes the dialog', !(await isOpen(page)));
  check(
    'focus returns to the element that opened it',
    await page.evaluate(() => document.activeElement === document.querySelector('#footer-link'))
  );
  await ctx.close();

  // --- 2. Accept all ------------------------------------------------------
  ctx = await browser.newContext();
  page = await ctx.newPage();
  await page.addInitScript(shopifyStub({ shouldShowBanner: true }));
  await page.goto(URL);
  await page.waitForTimeout(300);
  await pick(page, 'all');
  check(
    'selecting a card marks it for the :has()-free styling',
    await page.locator('label:has(input[value="all"])').evaluate((el) => el.hasAttribute('data-selected'))
  );
  await page.locator('[data-cc-save]').click();
  await page.waitForTimeout(400);
  calls = await page.evaluate(() => window.__calls.filter((c) => c[0] === 'setTrackingConsent'));
  check(
    'saving "all" grants every category',
    JSON.stringify(calls[0][1]) ===
      JSON.stringify({ analytics: true, marketing: true, preferences: true, sale_of_data: true }),
    JSON.stringify(calls[0])
  );
  await ctx.close();

  // --- 3. Decline all -----------------------------------------------------
  ctx = await browser.newContext();
  page = await ctx.newPage();
  await page.addInitScript(shopifyStub({ shouldShowBanner: true }));
  await page.goto(URL);
  await page.waitForTimeout(300);
  await page.locator('[data-cc-decline]').click();
  await page.waitForTimeout(400);
  calls = await page.evaluate(() => window.__calls.filter((c) => c[0] === 'setTrackingConsent'));
  check(
    'declining grants nothing',
    JSON.stringify(calls[0][1]) ===
      JSON.stringify({ analytics: false, marketing: false, preferences: false, sale_of_data: false }),
    JSON.stringify(calls[0])
  );
  await ctx.close();

  // --- 4. Region that does not require consent ----------------------------
  ctx = await browser.newContext();
  page = await ctx.newPage();
  await page.addInitScript(shopifyStub({ shouldShowBanner: false }));
  await page.goto(URL);
  await page.waitForTimeout(400);
  check(
    'no prompt where the region does not require consent',
    !(await isOpen(page))
  );
  await ctx.close();

  // --- 5. Privacy API never loads -----------------------------------------
  ctx = await browser.newContext();
  page = await ctx.newPage();
  await page.addInitScript(shopifyStub({ available: false }));
  await page.goto(URL);
  await page.waitForTimeout(500);
  check(
    'still prompts when the Customer Privacy API is unavailable',
    (await isOpen(page)) && (await dialogVisible(page))
  );
  await page.locator('[data-cc-save]').click();
  await page.waitForTimeout(300);
  check(
    'fallback choice is remembered locally',
    (await page.evaluate(() => JSON.parse(localStorage.getItem('cookie-consent')).level)) === 'essential'
  );
  await ctx.close();

  // --- 6. Legacy visitors are not re-prompted -----------------------------
  ctx = await browser.newContext();
  page = await ctx.newPage();
  await page.addInitScript(shopifyStub({ available: false }));
  await page.addInitScript(() => {
    localStorage.setItem('cookieConsentSaved', 'true');
    localStorage.setItem('cookieConsentLevel', 'all');
  });
  await page.goto(URL);
  await page.waitForTimeout(500);
  check(
    'visitors who answered the old banner are not asked again',
    !(await isOpen(page))
  );
  await ctx.close();

  // --- 7. Global Privacy Control ------------------------------------------
  ctx = await browser.newContext();
  page = await ctx.newPage();
  await page.addInitScript(shopifyStub({ shouldShowBanner: true }));
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'globalPrivacyControl', { value: true });
  });
  await page.goto(URL);
  await page.waitForTimeout(300);
  check('GPC pre-selects the most restrictive option', await page.locator('input[value="none"]').isChecked());
  await pick(page, 'all');
  await page.locator('[data-cc-save]').click();
  await page.waitForTimeout(400);
  calls = await page.evaluate(() => window.__calls.filter((c) => c[0] === 'setTrackingConsent'));
  check('GPC forces sale_of_data off even on "accept all"', calls[0][1].sale_of_data === false, JSON.stringify(calls[0]));
  await ctx.close();

  // --- 8. Nothing pre-selected --------------------------------------------
  ctx = await browser.newContext();
  page = await ctx.newPage();
  await page.addInitScript(shopifyStub({ shouldShowBanner: true }));
  await page.goto(URL);
  await page.evaluate(() => document.querySelectorAll('input[name="cookie_consent_level"]').forEach((i) => (i.checked = false)));
  await page.waitForTimeout(200);
  await page.locator('[data-cc-save]').click();
  await page.waitForTimeout(200);
  check(
    'saving with no selection shows a hint instead of silently accepting',
    (await page.locator('[data-cc-hint]').textContent()).trim().length > 0 &&
      (await isOpen(page))
  );
  check(
    'no consent is sent when nothing is selected',
    (await page.evaluate(() => window.__calls.filter((c) => c[0] === 'setTrackingConsent').length)) === 0
  );
  await ctx.close();

  // --- 9. Keyboard focus trap ---------------------------------------------
  ctx = await browser.newContext();
  page = await ctx.newPage();
  await page.addInitScript(shopifyStub({ shouldShowBanner: true }));
  await page.goto(URL);
  await page.waitForTimeout(300);
  for (let i = 0; i < 25; i++) await page.keyboard.press('Tab');
  const outside = await page.evaluate(() => {
    const consent = document.querySelector('cookie-consent');
    const el = document.activeElement;
    return !consent.contains(el) && el !== document.body ? el.id || el.tagName : null;
  });
  check('Tab stays inside the modal', outside === null, 'focus escaped to ' + outside);
  await ctx.close();

  // --- 9b. Clicking the backdrop dismisses without granting consent -------
  ctx = await browser.newContext();
  page = await ctx.newPage();
  await page.addInitScript(shopifyStub({ shouldShowBanner: true }));
  await page.goto(URL);
  await page.waitForTimeout(300);
  await page.mouse.click(20, 20);
  await page.waitForTimeout(400);
  check('clicking the backdrop closes the modal', !(await isOpen(page)));
  check(
    'dismissing grants no consent',
    (await page.evaluate(() => window.__calls.filter((c) => c[0] === 'setTrackingConsent').length)) === 0 &&
      (await page.evaluate(() => localStorage.getItem('cookie-consent'))) === null
  );
  await ctx.close();

  // --- 10. Bottom-banner layout -------------------------------------------
  ctx = await browser.newContext();
  page = await ctx.newPage();
  await page.addInitScript(shopifyStub({ shouldShowBanner: true }));
  await page.goto('file://' + path.join(__dirname, 'banner.html'));
  await page.waitForTimeout(300);
  check('banner layout opens', (await isOpen(page)) && (await dialogVisible(page)));
  check(
    'banner layout does not lock page scrolling',
    await page.evaluate(() => getComputedStyle(document.documentElement).overflow !== 'hidden')
  );
  check(
    'banner layout does not steal focus on load',
    await page.evaluate(() => document.activeElement === document.body)
  );
  check(
    'banner layout leaves the page clickable',
    await page.evaluate(() => {
      const container = document.querySelector('.cookie-consent__container');
      return getComputedStyle(container).pointerEvents === 'none';
    })
  );
  check('banner layout has no backdrop', !(await page.locator('.cookie-consent__backdrop').isVisible()));
  await ctx.close();

  await browser.close();

  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  process.exit(failed.length ? 1 : 0);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
