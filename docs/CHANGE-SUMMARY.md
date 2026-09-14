# Change summary

## What was done

The store's original **Dawn 15.5.0** export was taken as the base and the
complete Simply Kids site was built on top of it. No Dawn file was deleted; the
store's own existing customisations (bespoke footer, "SimplyKids premium"
header / product page / cart / collection-grid styling, and the
`sk-quick-add-grid` section) were left byte-for-byte intact.

| | |
| --- | --- |
| Files added | 68 |
| Files modified | 13 |
| Files deleted | **0** |
| Files untouched | 348 |

The affiliate ZIP turned out to be **16 self-contained static HTML previews**
with one shared 185 KB `<style>` block, base64-embedded fonts and images, and
**no JavaScript at all** — its own CSS comment describes it as a
"visual/content preview, not a live render" of a Dawn theme. So the work was:
extract the embedded assets into real theme files, port the design system into
a Dawn-safe stylesheet, and rebuild every implied interaction as real code.

## Added

**Assets (26)**

- `simplykids-brand.css` — the ported design system, 268 rules, `.sk-`-scoped
- `simplykids.js` — six custom elements (age quiz, tabs, tooltips, creativity
  spark, DOB tip finder, quick add)
- 7 self-hosted `.woff2` faces (Nunito Sans 400–800, Dancing Script 600/700),
  extracted from base64
- 17 images extracted from base64: logo, hero, 5 product photos, 3 ritual
  photos, 1 lifestyle photo, 6 certification medallion SVGs

**Sections (28)** — all with full schemas, blocks and presets:
`sk-hero`, `sk-shop-by-age`, `sk-age-quiz`, `sk-product-grid`,
`sk-ritual-lines`, `sk-science-stats`, `sk-just-right-zone`, `sk-photo-break`,
`sk-reviews`, `sk-journal-grid`, `sk-newsletter-offer`, `sk-medallion-row`,
`sk-trust-badges`, `sk-page-hero`, `sk-page-content`, `sk-rich-content`,
`sk-faq-accordion`, `sk-routine-builder`, `sk-founders`, `sk-timeline`,
`sk-card-grid`, `sk-statement-banner`, `sk-community-hero`,
`sk-community-gallery`, `sk-community-tools`, `sk-community-submit`,
`sk-contact-split`, `sk-collection-pills`, `sk-footer-brand`.

**Snippets (3)** — `sk-fonts`, `sk-product-card`, `sk-whatsapp-fab`.

**Templates (11)** — `page.about`, `page.science`, `page.routine`, `page.faq`,
`page.community`, `page.affiliate`, `page.privacy`, `page.returns`,
`page.shipping`, `page.terms` (all pre-filled with the real copy), and the
rebuilt `index.json`.

## Modified

| File | Change |
| --- | --- |
| `layout/theme.liquid` | Loads the fonts snippet, brand CSS and brand JS after `base.css`; adds setting-gated body classes; renders the WhatsApp button |
| `config/settings_data.json` | 13 brand colour schemes, page width 1240, brand radii/shadows, Simply Kids settings |
| `config/settings_schema.json` | New "Simply Kids" settings group |
| `locales/en.default.json` | Four `sk.product_card.*` strings |
| `sections/header-group.json` | Announcement bar enabled with brand copy on scheme 11; header on scheme 4 |
| `sections/footer-group.json` | Optional `SK Brand footer` added, hidden; existing footer still active |
| `templates/index.json` | Rebuilt as the Simply Kids homepage (13 sections) |
| `templates/product.json` | Dawn `main-product` gains native rating, tagline, benefits, four tabs and complementary blocks; scheme 12 |
| `templates/collection.json` | Category pills + trust band around Dawn's untouched banner/facets/grid |
| `templates/cart.json`, `article.json` | Trust band (and newsletter on article) appended |
| `templates/blog.json` | Journal hero, newsletter and trust band around Dawn's `main-blog` |
| `templates/page.contact.json` | Brand hero + Shopify-native contact form split + trust band |

## Dawn functionality preserved

Header, navigation, mega menus, mobile drawer, announcement bar, cart, cart
drawer, cart notification, product pages, variant pickers, quantity rules,
add-to-cart, dynamic checkout, complementary products, collections, facets,
sorting, pagination, search, predictive search, customer accounts, login,
register, addresses, orders, gift cards, password page, 404, localisation and
all Dawn JavaScript are **unmodified** — every one of those files is in the
348-file untouched set. The brand layer adds CSS classes and new sections; it
never rewrites a Dawn component.

## Validation

See `INTEGRATION-NOTES.md` §8. Summary: all JSON and all section schemas parse;
every template/block/setting/select/colour-scheme reference resolves; every
asset, snippet and section reference resolves; all Liquid tags balance and all
33 Simply Kids Liquid files parse through a Liquid parser; every Simply Kids
section emits balanced HTML on every conditional branch; JS passes
`node --check`; CSS braces balance; no local `.html` / `./css/` / `../assets/`
path remains anywhere.
