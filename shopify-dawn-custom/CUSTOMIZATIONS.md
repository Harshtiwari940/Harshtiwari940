# Simply Kids — customization record

**Keep this file in the theme.** Shopify ignores unknown files in the theme
root, so it rides along with the code and is readable in the code editor. It is
the checklist you work from the next time Dawn ships a release.

Built against **Dawn 16.0.0**. Last updated when this file was written.

---

## The one rule

There is exactly **one** modified Dawn file. Everything else is a file Dawn
does not ship, so an update can never conflict with it.

If you ever find yourself editing a second Dawn file, stop and ask whether a
new section pointed at from a JSON template would do the same job. It almost
always will — that is the whole reason this list is one line long.

---

## Tier 0 — modified Dawn files (re-apply after EVERY Dawn update)

### `layout/theme.liquid`

**One line added.** In Dawn 16.0.0 the anchor is at **line 281**.

Find:

```liquid
{{ 'base.css' | asset_url | stylesheet_tag }}
```

Add immediately after it:

```liquid

    {% render 'sk-head' %}
```

That is the entire Dawn-side change. `snippets/sk-head.liquid` carries the font
links and the brand stylesheet, so anything you add to `<head>` later goes in
that snippet and this line never changes again.

> Dawn's `layout/theme.liquid` was **byte-identical** between 15.5.0 and
> 16.0.0. This anchor is stable across releases, but check the line number
> rather than trusting it — search for the `base.css` line instead of jumping
> to 281.

---

## Tier 1 — files we add (re-copy after an update; they never conflict)

Every one is prefixed `sk-` except the Judge.me shim, which must keep its
app-given name. Dawn will never ship a file with these names.

### `assets/` — 4 files

| File | What it does |
|---|---|
| `sk-brand.css` | The entire design system, plus the polish that used to be appended to Dawn's header, cart and product sections. ~34 KB, replacing 186 KB + 25 KB. |
| `sk-quick-add.js` | `<sk-quick-add>` custom element — add-to-cart and quantity stepping on a product card. |
| `sk-sticky-cart.js` | Sticky cart bar, milestone discount messaging, on-demand confetti. |
| `sk-interactions.js` | `<sk-tabs>` and `<sk-quiz>` custom elements. |

### `snippets/` — 4 files

| File | What it does |
|---|---|
| `sk-head.liquid` | Font links + `sk-brand.css`. The only thing `theme.liquid` renders. |
| `sk-product-card.liquid` | Product card with inline quick-add. Used by the collection grid and product rows. |
| `sk-section-padding.liquid` | Emits the scoped padding rule so section spacing is a theme-editor setting. |
| `judgeme_widgets.liquid` | **Do not delete.** Liquid cannot test whether a snippet exists, so a missing one is a fatal page error. See the comment at the top of the file. |

### `sections/` — 16 Liquid files

Chrome: `sk-promo-bar`, `sk-sticky-cart`, `sk-trust-badges`
Commerce: `sk-collection-grid`, `sk-product-row`
Content: `sk-hero`, `sk-card-grid`, `sk-rich-text`, `sk-faq`, `sk-timeline`,
`sk-stat-table`, `sk-routine-tabs`, `sk-quiz`, `sk-zone-cards`,
`sk-age-cards`, `sk-gallery`

### `CUSTOMIZATIONS.md`

This file.

---

## Tier 2 — your content (Shopify carries these; never overwrite with Dawn's)

These hold your store's content and settings. A Dawn update must not replace
them with Dawn's defaults.

- `templates/index.json`, `templates/collection.json`
- `templates/page.*.json` — 12 files
- `sections/header-group.json` — Dawn's, plus `sk-promo-bar` first in `order`
- `sections/footer-group.json` — Dawn's, plus `sk-trust-badges` first and
  `sk-sticky-cart` last in `order`
- `config/settings_data.json` — logo, page width, colour schemes

---

## Tier 3 — Dawn, untouched

Everything else: all 51 locale files, every Dawn asset and snippet, and every
`main-*.liquid` section including `main-product.liquid`,
`main-collection-product-grid.liquid`, `footer.liquid`, `header.liquid` and
`main-cart-items.liquid`. Roughly 340 files stay byte-identical to the official
release, so they update with zero conflicts.

---

## Updating Dawn: the procedure

### What Shopify will and will not do

Shopify's **Update** button creates a new copy of the theme on the newer Dawn
and carries your **theme settings and JSON template content** across. It does
**not** merge your code. Your one `theme.liquid` line is gone, and every Tier 1
file is gone. Both must be re-applied by hand.

No file layout or naming convention changes this. Plan for it.

### The safe sequence

1. **Duplicate your live theme first.** Actions → Duplicate. This is your
   rollback, and it costs nothing.
2. Add the new Dawn version as a **separate, unpublished** theme. Do not update
   the live one in place.
3. Copy the Tier 1 files into it. They are additive — nothing to merge.
4. Re-apply the single `theme.liquid` line (search for the `base.css` line).
5. Copy your Tier 2 JSON templates and both section groups across.
6. Check the list under **After every update** below on a preview URL.
7. Publish only once it is right. Keep the duplicate for a week.

### Using Git instead (recommended)

This makes "compare the new Dawn with my version" a real operation rather than
reading two code editors side by side.

```sh
# one-time
shopify theme pull --store simplykids.in --theme <live-theme-id>
git init && git add -A && git commit -m "SimplyKids on Dawn 16.0.0"
git remote add dawn https://github.com/Shopify/dawn.git
git fetch dawn --tags
git branch dawn-upstream v16.0.0     # pristine Dawn, never edited

# when a new Dawn ships
git fetch dawn --tags
git diff v16.0.0 v16.1.0 --stat                  # what changed at all
git diff v16.0.0 v16.1.0 -- layout/theme.liquid  # does it touch OUR file?
git merge v16.1.0                                # conflicts only where we edited
shopify theme push --theme <preview-theme-id>    # test before publishing
```

Because only `theme.liquid` is modified, the merge conflicts on at most one
file — and if that file is unchanged upstream, on none.

---

## After every update — check these

Ordered by how quietly they fail.

- [ ] **Fonts and brand styling load.** If the whole site looks like stock
      Dawn, the `theme.liquid` line did not get re-applied.
- [ ] **Collection page filtering still works.** `sk-collection-grid.liquid`
      calls Dawn's `facets` snippet and relies on `facets.js` finding
      `#ProductGridContainer` and `#product-grid` by id. If Dawn renames
      either, AJAX filtering breaks silently — the page still renders, filters
      just stop updating it. Click a filter and confirm the grid changes.
- [ ] **Quick-add works on a collection card**, and the cart drawer updates.
      `sk-quick-add.js` publishes Dawn's `cart-update` event via the globals
      `publish` and `PUB_SUB_EVENTS`. If Dawn moves to modules, that call needs
      updating.
- [ ] **The sticky cart bar appears** once the cart has items, and hides on the
      cart page.
- [ ] **The promo bar sits above the header** and nothing overlaps.
- [ ] **Product page analytics.** Confirm `<product-component>` is still in
      Dawn's `main-product.liquid`. It was removed in the previous build,
      which silently broke Shopify's `product_viewed` event.
- [ ] **Dawn's icon set.** `sk-trust-badges`, `sk-promo-bar` and `sk-card-grid`
      offer Dawn icons by filename (`icon-truck`, `icon-return`, `icon-lock`,
      `icon-heart`, `icon-star`, `icon-checkmark`, `icon-leaf`,
      `icon-chat-bubble`, `icon-question-mark`, `icon-discount`, `icon-share`,
      `icon-price-tag`, `icon-plane`). A removed icon renders as nothing —
      no error.
- [ ] **Translation keys.** Our schemas reference Dawn's `t:` keys. A removed
      key shows as "Translation missing" in the theme editor. Dawn 16.0.0
      already dropped `...filter_type.info`, which we had to stop using.
- [ ] **Classic customer accounts**, if you still use them. Dawn 16.0.0 deleted
      all of those templates and sections.

---

## Things that will bite you

**`box-sizing`.** Dawn's `base.css` has no global `box-sizing: border-box` —
only a handful of selectors. `sk-brand.css` sets it, scoped to our own
subtrees, in section 0. Remove that block and every padded component becomes
its width *plus* its padding, and the page scrolls sideways on a phone.

**Dawn's rem scale is 10px, not 16px.** `layout/theme.liquid` sets
`html { font-size: calc(var(--font-body-scale) * 62.5%) }`. The previous
`v19.css` was authored at 16px/rem and converted to px, making every dimension
1.6× too large — a 5.2rem heading became 83.2px. A whole second stylesheet
(`v19-responsive.css`, 25 KB of `!important` and `[style*="…"]` selectors)
existed only to fight that back down. Both files are retired. **Write new CSS
in rem**, and remember 1rem = 10px here.

**Never redefine Dawn globals.** The old CSS redefined `body`, bare `h1`–`h4`
and `.page-width` (to 1984px, overriding the theme's own page-width setting).
Every rule in `sk-brand.css` is scoped to an `sk-` class for that reason.

**Colour comes from Dawn's colour schemes.** Sections use the native
`color_scheme` setting, not hardcoded classes. See `config/color-schemes.md` —
the schemes must actually hold the brand palette or these sections render in
Dawn's stock greys.

---

## Known, accepted theme-check warnings

Run `shopify theme check`. Pristine Dawn 16.0.0 reports 9 offenses of its own.
This theme reports 13. The difference is exactly four:

- `snippets/sk-head.liquid` × 4 — `RemoteAsset`, the Google Fonts links.
  Deliberate; the trade-off is documented in the file's header comment.

Anything beyond those four is new and worth reading.
