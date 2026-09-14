# Simply Kids — Shopify theme

An Online Store 2.0 theme for Simply Kids. Every part of every page is editable
from **Online Store → Customize**: sections can be edited, reordered, hidden,
duplicated, added and removed, and repeating items (cards, reviews, FAQ rows,
badges, menu columns) are blocks you can drag.

## What changed from the earlier draft

The previous package converted each HTML page into a single monolithic Liquid
section with `"settings": []`. Nothing in the theme editor could be changed —
all copy, images, links, prices and colors were hardcoded, and the header and
footer were copy-pasted into all 15 page sections.

This version splits those pages into **38 reusable sections** carrying
**583 editable fields**, plus **41 theme settings**. The homepage alone went from
one frozen block to 12 independent sections.

### Bugs found in the earlier draft and fixed here

| Problem | Effect | Fix |
| --- | --- | --- |
| `assets/affiliate.css` contained Liquid (`{{ 'asset-000.woff2' \| asset_url }}`) | Shopify does not process Liquid in a `.css` file, so all 7 bundled fonts 404'd and the site fell back to system fonts | Liquid removed; fonts referenced by relative URL, which resolves because Shopify serves every theme asset from one path |
| No root font size, but the `sk-*` design system was authored for a 10px root | Content rendered roughly 1.6× too large (the hero title computed to 83px) | `html{font-size:62.5%}` set, and the `pv-*` chrome font sizes rescaled to match |
| `--sk-pink-pastel`, `--sk-pink-accent`, `--sk-cyclamen-pastel` used but never defined | Pink accents fell back to transparent | Defined from theme settings, so they are editable |
| `.pv-nav{display:none}` on mobile with no replacement | Mobile visitors had no navigation at all | Added a menu button and drawer driven by the Shopify menu |
| Only `index` and `page.*` templates existed | `/products/…`, `/collections/…`, `/cart`, `/search`, `/blogs/…`, `/account/…` and 404 had no template | Added every required template, wired to real Shopify objects |

## Editing the theme

**Online Store → Customize**, then pick a page from the top dropdown.

- **Header, announcement bar, footer, trust icons** live in the *Header* and
  *Footer* groups in the sidebar, so editing them once changes every page.
- **Theme settings** (the gear icon) hold logo, colors, fonts, page width,
  contact details, social links, the reviews badge and the WhatsApp button.
  Sections read from these, so changing a brand color updates the whole store.

### Images

Sections with images ship with a **Built-in image file** field naming one of the
files in `assets/` (for example `hero.jpg`). That is what makes the theme look
finished on a fresh install. Pick your own image in the picker above it and
yours wins; clear both to show nothing.

### Connecting real products

Product cards work two ways. Pick a **Collection** on *Featured products* and it
pulls live titles, images, prices and add-to-cart. Leave it empty and it uses the
manual **Product card** blocks, which is how the sample copy ships. Do the same on
*Article cards* with a **Blog**.

`templates/product.json` is the real product page and `templates/collection.json`
the real collection page — both read the live Shopify object. `page.product` and
`page.shop` are editable landing pages kept so the existing `/pages/…` URLs
still work.

### Menus

The header and the footer columns take Shopify menus (**Navigation**). Until you
assign one, each footer column falls back to a typed list (`label | /url`, one per
line) pre-filled with the original links.

## Structure

```
assets/        affiliate.css, fonts, product and badge images
config/        settings_schema.json (theme settings), settings_data.json
layout/        theme.liquid, password.liquid
locales/       en.default.json (73 keys, all used)
sections/      38 sections + header-group.json / footer-group.json
snippets/      button, price, stars, product-card, image-or-asset, icon, social-icon, meta-tags, whatsapp-float
templates/     25 JSON templates + gift_card, password, customers/*
```

## Installing

Upload the zip under **Online Store → Themes → Add theme → Upload zip file**,
then **Preview** before publishing. Or with the Shopify CLI:

```sh
shopify theme push --unpublished
```

After installing: set the logo in theme settings, create your **Navigation**
menus, and point *Featured products* at a real collection.

## Checks

Both of these pass clean on this theme:

```sh
npx @shopify/theme-check-node      # 0 offenses
```

Schema JSON, template/section references, setting ids, block limits, snippet and
asset references, translation keys and Liquid tag balance were all verified, and
all 16 pages were rendered offline and screenshotted at desktop and 390px mobile
widths with no console errors and no horizontal overflow.

## Known limits

- Customer account pages (`templates/customers/*.liquid`) are plain Liquid, not
  section-based — they work, but are not editable in the theme customizer.
- The homepage quiz, routine tabs and community "tools" are presentation only, as
  in the original. The quiz and tabs switch panels with CSS and no JavaScript;
  the community tools need an app or custom JS to actually generate a tip.
- Prices in the manual sample cards are text. Connect a collection for live pricing.
