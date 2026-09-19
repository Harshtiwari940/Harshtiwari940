const { chromium } = require('playwright');
const path = require('path');

const stub = `
  window.Shopify = { loadFeatures(f, cb) {
    window.Shopify.customerPrivacy = {
      shouldShowBanner: () => true,
      currentVisitorConsent: () => ({}),
      setTrackingConsent: (p, cb2) => cb2 && cb2({}),
    };
    cb(null);
  }};
`;

(async () => {
  const browser = await chromium.launch();
  const shots = [
    ['desktop-modal.png', 'index.html', { width: 1280, height: 860 }],
    ['mobile-modal.png', 'index.html', { width: 390, height: 780 }],
    ['desktop-banner.png', 'banner.html', { width: 1280, height: 860 }],
    ['mobile-banner.png', 'banner.html', { width: 390, height: 780 }],
  ];
  for (const [name, file, viewport] of shots) {
    const ctx = await browser.newContext({ viewport });
    const page = await ctx.newPage();
    await page.addInitScript(stub);
    await page.goto('file://' + path.join(__dirname, file));
    await page.waitForTimeout(600);
    await page.screenshot({ path: name });
    await ctx.close();
  }
  await browser.close();
  console.log('screenshots written');
})();
