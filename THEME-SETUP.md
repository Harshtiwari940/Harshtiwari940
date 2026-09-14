# Simply Kids — Dawn theme

The full Simply Kids site, rebuilt as a Shopify **Dawn 15.5.0** theme: every page
from the visual preview, the same header and footer, and the brand design system
as real Liquid sections you can edit in the theme editor.

Upload it by zipping this folder's contents (`assets/`, `config/`, `layout/`,
`locales/`, `sections/`, `snippets/`, `templates/` at the top level of the zip)
and adding it under **Online Store → Themes → Add theme → Upload zip file**.

---

## 1. Navigation — `main-menu-1` (required)

The header reads the menu handle **`main-menu-1`**. Create it under
**Content → Menus → Add menu**. Shopify derives the handle from the title, so
title the menu **Main Menu 1** and confirm the handle reads `main-menu-1`.

| Menu item | Links to |
| --- | --- |
| Shop | Collection → All (`/collections/all`) |
| Best Sellers | Collection → your best-sellers collection |
| Build a Routine | Page → Build Their Routine |
| Our Science | Page → Our Science |

Three more menus fill the footer columns. Create each and set it on the footer
section in the theme editor (**Footer → Column 2/3/4 menu**):

| Menu | Handle | Items |
| --- | --- | --- |
| Footer | `footer` | Shampoo, Hair Oil, Body Wash, Body Lotion, Body Oil |
| Footer Our Story | `footer-our-story` | About Us, Journal, Affiliate, FAQ |
| Footer Policies | `footer-policies` | Privacy Policy, Return & Refund Policy, Shipping Policy, Terms & Conditions |

If column 4 has no menu, the footer falls back to your store's own policy pages
automatically.

---

## 2. Pages to create

Each page below ships with its own template, already filled with the copy from
the preview. Create the page under **Content → Pages**, leave the body empty,
and pick the matching template in the **Theme template** dropdown on the right.

| Page title | Handle | Template |
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

The homepage, collection, product, cart, blog, article, search and 404 pages use
`templates/index.json`, `collection.json`, `product.json`, `cart.json`,
`blog.json`, `article.json`, `search.json` and `404.json` — no setup needed.

The four policy templates hold their copy as editable blocks in the theme
editor. If you would rather keep policy text in the Shopify admin instead, tick
**Also show the page's own content** on the section and clear the blocks.

### Blog

Create a blog titled **Journal** (handle `journal`) under **Content → Blogs**.
The homepage journal strip and the article page's "More from the Journal" strip
both read from it.

---

## 3. Images to upload

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

## 4. What was built

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

## 5. Carried over from the previous theme

These were already live and are preserved as-is:

- The sticky cart bar with milestone discounts and confetti (`layout/theme.liquid`).
- The fixed "Free Shipping on all orders" bar at the top of every page.

The sticky bar loads `canvas-confetti` from jsDelivr. That is the one
third-party request in the theme; remove the `<script>` in `layout/theme.liquid`
if you would rather drop it.

---

## 6. Theme settings

**Theme settings → Simply Kids** holds the floating WhatsApp button:
number (with country code, no plus), pre-filled message, and accessible label.
Clear the number to hide the button.
