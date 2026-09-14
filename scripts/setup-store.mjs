#!/usr/bin/env node
/**
 * Creates the pages and blog the Simply Kids theme expects.
 *
 * A theme cannot create pages — they are store data, not theme files — so the
 * templates in templates/page.*.json have nothing to attach to until the
 * matching page exists. This script creates each one and assigns its template.
 *
 * Safe to re-run: existing pages are left alone apart from their template
 * assignment, and nothing is ever deleted.
 *
 *   SHOPIFY_STORE=your-store.myshopify.com \
 *   SHOPIFY_ADMIN_TOKEN=shpat_xxx \
 *   node scripts/setup-store.mjs [--dry-run]
 */

const API_VERSION = process.env.SHOPIFY_API_VERSION || '2025-07';
const STORE = (process.env.SHOPIFY_STORE || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN || '';
const DRY_RUN = process.argv.includes('--dry-run');

/** Every page the theme ships a template for. */
const PAGES = [
  { title: 'About Us', handle: 'about-us', suffix: 'about' },
  { title: 'Our Science', handle: 'our-science', suffix: 'science' },
  { title: 'Build Their Routine', handle: 'build-a-routine', suffix: 'routine' },
  { title: 'Be the Pride', handle: 'be-the-pride', suffix: 'community' },
  { title: 'Affiliate', handle: 'affiliate', suffix: 'affiliate' },
  { title: 'Contact Us', handle: 'contact', suffix: 'contact' },
  { title: 'FAQ', handle: 'faq', suffix: 'faq' },
  { title: 'Privacy Policy', handle: 'privacy-policy', suffix: 'privacy' },
  { title: 'Return & Refund Policy', handle: 'return-refund-policy', suffix: 'returns' },
  { title: 'Shipping Policy', handle: 'shipping-policy', suffix: 'shipping' },
  { title: 'Terms & Conditions', handle: 'terms-conditions', suffix: 'terms' },
];

const BLOGS = [{ title: 'Journal', handle: 'journal' }];

function die(message) {
  console.error(`\n  ${message}\n`);
  process.exit(1);
}

if (!STORE || !TOKEN) {
  die(
    'Set SHOPIFY_STORE and SHOPIFY_ADMIN_TOKEN first.\n\n' +
      '  In Shopify admin: Settings -> Apps and sales channels -> Develop apps\n' +
      '  -> Create an app -> Configure Admin API scopes -> tick write_content\n' +
      '  -> Install app -> reveal the Admin API access token (shpat_...).\n\n' +
      '  Then:\n' +
      '    SHOPIFY_STORE=your-store.myshopify.com \\\n' +
      '    SHOPIFY_ADMIN_TOKEN=shpat_xxx \\\n' +
      '    node scripts/setup-store.mjs'
  );
}

async function api(method, path, body) {
  const res = await fetch(`https://${STORE}/admin/api/${API_VERSION}/${path}`, {
    method,
    headers: {
      'X-Shopify-Access-Token': TOKEN,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  // Shopify asks callers to back off rather than hammer the endpoint.
  if (res.status === 429) {
    const wait = Number(res.headers.get('Retry-After') || 2) * 1000;
    await new Promise((r) => setTimeout(r, wait));
    return api(method, path, body);
  }

  const text = await res.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { raw: text };
  }

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      die(
        `Shopify rejected the token (HTTP ${res.status}).\n` +
          '  Check the token is an Admin API token for this store and has the write_content scope.'
      );
    }
    throw new Error(`${method} ${path} -> HTTP ${res.status}: ${JSON.stringify(payload)}`);
  }
  return payload;
}

/** Walks Shopify's Link-header pagination so large stores are handled too. */
async function listAll(resource) {
  const out = [];
  let path = `${resource}.json?limit=250`;
  while (path) {
    const res = await fetch(`https://${STORE}/admin/api/${API_VERSION}/${path}`, {
      headers: { 'X-Shopify-Access-Token': TOKEN, Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`GET ${path} -> HTTP ${res.status}`);
    const payload = await res.json();
    out.push(...(payload[resource] || []));

    const link = res.headers.get('Link') || '';
    const next = link.split(',').find((part) => part.includes('rel="next"'));
    const match = next && next.match(/page_info=([^>&]+)/);
    path = match ? `${resource}.json?limit=250&page_info=${match[1]}` : null;
  }
  return out;
}

const created = [];
const updated = [];
const skipped = [];

async function ensurePage(spec, existingByHandle) {
  const existing = existingByHandle.get(spec.handle);

  if (!existing) {
    if (DRY_RUN) {
      created.push(spec.handle);
      return;
    }
    await api('POST', 'pages.json', {
      page: {
        title: spec.title,
        handle: spec.handle,
        template_suffix: spec.suffix,
        body_html: '',
        published: true,
      },
    });
    created.push(spec.handle);
    return;
  }

  if (existing.template_suffix === spec.suffix) {
    skipped.push(spec.handle);
    return;
  }

  if (DRY_RUN) {
    updated.push(spec.handle);
    return;
  }
  await api('PUT', `pages/${existing.id}.json`, {
    page: { id: existing.id, template_suffix: spec.suffix },
  });
  updated.push(spec.handle);
}

async function ensureBlog(spec, existingByHandle) {
  if (existingByHandle.has(spec.handle)) {
    skipped.push(`blogs/${spec.handle}`);
    return;
  }
  if (DRY_RUN) {
    created.push(`blogs/${spec.handle}`);
    return;
  }
  await api('POST', 'blogs.json', { blog: { title: spec.title, handle: spec.handle } });
  created.push(`blogs/${spec.handle}`);
}

const shop = (await api('GET', 'shop.json')).shop;
console.log(`\n  Store: ${shop.name} (${shop.myshopify_domain})`);
console.log(`  API:   ${API_VERSION}${DRY_RUN ? '   [dry run — nothing will be written]' : ''}\n`);

const existingPages = new Map((await listAll('pages')).map((p) => [p.handle, p]));
const existingBlogs = new Map((await listAll('blogs')).map((b) => [b.handle, b]));

for (const spec of PAGES) await ensurePage(spec, existingPages);
for (const spec of BLOGS) await ensureBlog(spec, existingBlogs);

const label = DRY_RUN ? 'would be' : '';
console.log(`  Created ${label}  (${created.length}): ${created.join(', ') || '—'}`);
console.log(`  Template set ${label} (${updated.length}): ${updated.join(', ') || '—'}`);
console.log(`  Already correct (${skipped.length}): ${skipped.join(', ') || '—'}`);

console.log('\n  Pages now live at:');
for (const spec of PAGES) console.log(`    https://${STORE}/pages/${spec.handle}`);

console.log(
  '\n  Next: Content -> Menus -> Main Menu 1, and point each item at its page\n' +
    '  using the page picker. Then preview the theme again.\n'
);
