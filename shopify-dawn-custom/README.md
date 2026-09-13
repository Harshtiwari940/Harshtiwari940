# Simply Kids — customizations for official Shopify Dawn

Everything in this folder is designed to be added to a **clean, official Dawn
theme installed from the Shopify Theme Store** — never uploaded as a ZIP.

Built and checked against **Dawn 16.0.0**.

- **[CUSTOMIZATIONS.md](CUSTOMIZATIONS.md)** — the change record. Read this
  before any Dawn update.
- **[config/color-schemes.md](config/color-schemes.md)** — the brand palette,
  and why the colour schemes have to be set before these sections look right.

---

## Why not upload the ZIP

Shopify only tracks update lineage for themes added *from the Theme Store*. A
ZIP upload has none, whatever version string sits in `settings_schema.json` —
which is why the admin says *"Updates are not supported for uploaded themes."*

So the theme is installed the normal way, and these files are added on top.

---

## Installing, first time

1. **Online Store → Themes → Add theme → Popular free themes → Dawn.**
   Do not publish it yet. Note the version you get.
2. **Duplicate your current live theme** (Actions → Duplicate) so you have a
   rollback that costs nothing.
3. On the new Dawn copy: **Actions → Edit code**, and add the files from this
   folder at the matching paths:
   - `assets/` → 4 files
   - `snippets/` → 4 files
   - `sections/` → 16 `.liquid` files
   - `sections/header-group.json`, `sections/footer-group.json` → replace
   - `templates/` → 14 `.json` files → replace
   - `CUSTOMIZATIONS.md` → theme root
4. **Edit `layout/theme.liquid`** — the only Dawn file that changes. Find
   `{{ 'base.css' | asset_url | stylesheet_tag }}` (line 281 in Dawn 16.0.0)
   and add one line after it:
   ```liquid
   {% render 'sk-head' %}
   ```
5. **Set the colour schemes** per `config/color-schemes.md`. Skipping this is
   the most likely reason the site looks grey and wrong on first load.
6. Set the logo under Theme settings, and pick the collections for the two
   product rows on the homepage.
7. Preview every page. Publish only when it is right.

### Page templates

Each `page.*.json` binds to a page by handle. In **Content → Pages**, confirm
the handle matches, or assign the template explicitly in the page's
**Theme template** dropdown.

| Template | Page handle |
|---|---|
| `page.about-us.json` | `about-us` |
| `page.science.json` | `science` |
| `page.routine.json` | `routine` |
| `page.journal.json` | `journal` |
| `page.faq.json` | `faq` |
| `page.contact.json` | `contact` |
| `page.our-community-2.json` | `our-community-2` |
| `page.affiliate.json` | `affiliate` |
| `page.terms.json` | `terms` |
| `page.returns.json` | `returns` |
| `page.shipping.json` | `shipping` |
| `page.privacy.json` | `privacy` |

The old build handled handle mismatches with a `v19-page-router` section — a
`case` statement mapping 28 handle spellings to content. That is gone: a
template bound to a handle is how Online Store 2.0 does this, and it means the
theme editor can see and edit each page.

---

## What changed from the V20 theme

| | Before | After |
|---|---|---|
| Modified Dawn Liquid files | 6 | **1** (one line) |
| Page files | 24 (each page in `sections/` *and* `snippets/`) | 16 reusable sections |
| Editable in the theme editor | Nothing on 12 of 12 pages | Every section, via blocks |
| Brand CSS | 186 KB + 25 KB override layer | ~34 KB, no override layer |
| Homepage | One 40 KB section, 4 settings | 8 sections, reorderable |
| Trust badges | Copy-pasted 24× | 1 section |
| Dawn analytics on PDP | Removed | Restored |
| Contact form | None (a dead `href="#"`) | Dawn's `contact-form` section |

### Notable fixes carried in

- **The 1.6× scale bug.** Dawn's rem base is 10px, not 16px. The old CSS was
  authored at 16px/rem, so every dimension was 1.6× too large, and a second
  25 KB stylesheet existed only to fight it back down. Rewritten in rem.
- **The tablet dead zone.** Every responsive rule in the old CSS was gated at
  `max-width: 749px`, so iPad portrait got the full desktop layout.
- **The promo bar overlapping the header.** It was `position: fixed` with a
  clearance rule pointing at a class the page no longer had. It is a normal
  section in the header group now, so nothing overlaps.
- **Fonts loaded twice.** `v19.css` embedded seven base64 WOFF2 faces *and*
  `theme.liquid` pulled the same families from Google Fonts.
- **`box-sizing`.** Dawn sets no global `border-box`; it is now scoped to our
  own components rather than forced globally.

---

## Not included, and why

**Affiliate tracking.** `page.affiliate.json` is a landing page. There is no
referral-link generation or commission tracking in it, because a theme cannot
do that — it needs a Shopify affiliate app or a custom app with a backend. The
Apply button is unlinked; point it at whatever you choose.

**Judge.me.** `snippets/judgeme_widgets.liquid` is a fallback shim so the page
does not fatal when the app is not installed. Ratings are off by default; turn
them on per section once the Judge.me app embed is enabled.

---

## Verification already done

- **Shopify theme-check** (official, `@shopify/theme-check-node`) against the
  full assembled theme: **no errors**. Pristine Dawn 16.0.0 reports 9 offenses
  of its own; this theme reports 13 — the four extra are the deliberate Google
  Fonts warnings in `sk-head.liquid`.
- Every `t:` translation key resolves against Dawn 16.0.0's locale files.
- Every `{% render %}` target, `asset_url` and `inline_asset_content` reference
  resolves to a file that exists.
- Every section type, block type and setting id used in the JSON templates
  exists in the matching schema.
- All JavaScript parses (`node --check`).
- Rendered in Chromium at 1440 / 768 / 390 px: no horizontal overflow at any
  width, grids collapse 4→2→2 and 3→2→1, and type resolves to sane sizes on
  Dawn's 10px rem base (hero 52px desktop / 35.6px mobile, not the old 83.2px).
