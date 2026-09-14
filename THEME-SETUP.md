# Simply Kids — Dawn theme

The full Simply Kids site, rebuilt as a Shopify **Dawn 15.5.0** theme: every page
from the visual preview, the same header and footer, and the brand design system
as real Liquid sections you can edit in the theme editor.

---

## Seeing "404 — Page not found"? Start here.

**A theme cannot create pages.** Pages are store data (Content → Pages), not
theme files. The theme ships a *template* for each page, but a template has
nothing to attach to until the page itself exists — so every `/pages/...` link
404s on a fresh store. Same for `/blogs/journal`.

Pick one of the two paths below. Both create the same 11 pages and 1 blog.

### Path A — one command (recommended)

1. In Shopify admin: **Settings → Apps and sales channels → Develop apps →
   Create an app**. Name it anything.
2. **Configure Admin API scopes** → tick **`write_content`** → **Save**.
3. **Install app** → **Reveal token once** → copy the `shpat_…` token.
4. Run:

   ```bash
   SHOPIFY_STORE=your-store.myshopify.com \
   SHOPIFY_ADMIN_TOKEN=shpat_xxx \
   node scripts/setup-store.mjs
   ```

   Add `--dry-run` first if you want to see what it would do without writing.

It creates every missing page, assigns the right template to each, creates the
Journal blog, and prints the resulting URLs. Safe to re-run — it never deletes
anything, and leaves correct pages untouched.

### Path B — by hand

For each row: **Content → Pages → Add page**, type the title, leave the body
**empty** (the template carries the content), then set **Theme template** in the
right-hand panel.

| Page title | Handle | Theme template |
| --- | --- | --- |
| About Us | `about-us` | `page.about` |
| Our Science | `our-science` | `page.science` |
| Build Their Routine | `build-a-routine` | `page.routine` |
| Be the Pride | `be-the-pride` | `page.community` |
| Affiliate | `affiliate` | `page.affiliate` |
| Contact Us | `contact` | `page.contact` |
| FAQ | `faq` | `page.faq` |
| Privacy Policy | `privacy-policy` | `page.privacy` |
| Return & Refund Policy | `return-refund-policy` | `page.returns` |
| Shipping Policy | `shipping-policy` | `page.shipping` |
| Terms & Conditions | `terms-conditions` | `page.terms` |

Then **Content → Blogs → Add blog**, titled **Journal** (handle `journal`).

---

## Wire up the menu

Your `main-menu-1` menu already renders. Once the pages exist, point each item
at its page — **Content → Menus → Main Menu 1**, edit each item, and use the
page picker so Shopify fills the URL for you.

| Menu item | Links to |
| --- | --- |
| Home | Home page |
| Shop | Collection → All (`/collections/all`) |
| Our Story | Page → About Us |
| Science | Page → Our Science |
| Our Routine | Page → Build Their Routine |
| Journal | Blog → Journal |
| Community | Page → Be the Pride |
| Affiliate Program | Page → Affiliate |
| FAQ | Page → FAQ |
| Contact Us | Page → Contact Us |

Three more menus fill the footer columns. Create each, then set it on the footer
section in the theme editor (**Footer → Column 2/3/4 menu**):

| Menu | Handle | Items |
| --- | --- | --- |
| Footer | `footer` | Shampoo, Hair Oil, Body Wash, Body Lotion, Body Oil |
| Footer Our Story | `footer-our-story` | About Us, Journal, Affiliate, FAQ |
| Footer Policies | `footer-policies` | Privacy Policy, Return & Refund Policy, Shipping Policy, Terms & Conditions |

If column 4 has no menu, the footer falls back to your store's own policy pages
automatically.

---

## Images to upload

Everything renders without images, using placeholders. Add the real ones in the
theme editor:

- **Header logo** — Theme settings → Logo (set to 130px wide).
- **Footer logo** — Footer section → Footer logo.
- **Home hero** — SK Hero section → Image.
- **Ritual lines** — one image per ritual block.
- **Photo break** — the full-bleed lifestyle shot.
- **Medallions** — six badges: Dermatologically Tested, pH 5.5 Balanced,
  Vegan & Cruelty-Free, Made in India, DPIIT Recognised, Udyam Registered.
- **Community gallery** — one artwork per creator block.

---

## Installing the theme

Zip this folder's contents so `assets/`, `config/`, `layout/`, `locales/`,
`sections/`, `snippets/` and `templates/` sit at the **top level** of the zip,
then **Online Store → Themes → Add theme → Upload zip file**.

---

## What was built

### Assets
- `simplykids-brand.css` — the whole design system: tokens, buttons, pills,
  hero, quiz, just-right zone, age cards, rituals, science stats, story,
  timeline, routine, community, trust, accordion, WhatsApp button.
- `simplykids.js` — four custom elements: `sk-age-quiz`, `sk-routine-builder`,
  `sk-dob-tip`, `sk-creativity-spark`.
- `dancing-script-600.woff2` / `dancing-script-700.woff2` — the script accent,
  self-hosted so the page makes no third-party font request.

### Sections (all editable in the theme editor)
`sk-hero-age-spectrum`, `sk-page-hero`, `sk-shop-by-age`, `sk-age-quiz`,
`sk-ritual-lines`, `sk-science-stats`, `sk-just-right-zone`, `sk-photo-break`,
`sk-reviews-strip`, `sk-journal-strip`, `sk-trust-badges`, `sk-medallions`,
`sk-routine-builder`, `sk-faq-accordion`, `sk-card-grid`, `sk-founders`,
`sk-timeline`, `sk-community-hero`, `sk-community-gallery`,
`sk-community-tools`, `sk-community-submit`, `sk-contact-split`,
`sk-statement-banner`, `sk-rich-text`.

`header.liquid` and `footer.liquid` are rebuilt to the brand design. The trust
band (Free Shipping / COD / No Question Asked + payment icons) sits in the
footer group, so it appears on every page exactly as in the preview.

### Colour schemes
Thirteen schemes in `config/settings_data.json`, matching the preview one for
one — white and Sky Wash for most surfaces, Midnight Blue for the footer and
statement banners, and the pink pastels reserved for the three sanctioned
placements (announcement bar, PDP, Community).

### Typography
Nunito Sans for display, label and body (via Shopify's font library), with
Dancing Script used sparingly — hero accent, routine time-of-day labels, the
Community wordmark and the creativity-spark output.

---

## Changed from the previous theme

**The fixed "Free Shipping on all orders" bar was removed.** It was
`position: fixed; top: 0; z-index: 999999`, so it sat on top of the
announcement bar and hid it, while its 44px padding compensation left dead
space in the header. Its message now rides in the announcement bar instead,
which rotates four messages, is editable in the theme editor, and needs no
`!important` overrides. Edit them under **Header → Announcement bar**.

**Kept as-is:** the sticky cart bar with milestone discounts and confetti in
`layout/theme.liquid`. It loads `canvas-confetti` from jsDelivr — the one
third-party request in the theme. Remove that `<script>` if you'd rather drop it.

---

## Theme settings

**Theme settings → Simply Kids** holds the floating WhatsApp button:
number (with country code, no plus), pre-filled message, and accessible label.
Clear the number to hide the button.
