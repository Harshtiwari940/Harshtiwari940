# SimplyKids — Shopify header fix

`sections/header.liquid` — drop-in replacement for the theme's header section.
Copy it over `sections/header.liquid` in the theme (Online Store → Themes →
Edit code), or push it with the Shopify CLI.

## What was broken

The mobile menu drawer. Three rules in the custom `SimplyKids premium header`
`<style>` block collided with how Dawn builds that drawer. The Liquid markup,
the inline `StickyHeader` JavaScript and the schema were fine and are
unchanged — only that one `<style>` block differs.

### 1. `transform` on the hamburger — the main one

```css
.header__icon:hover { transform: translateY(-1px); }   /* before */
```

`.header__icon` does not only match the cart and account icons. It also
matches the hamburger itself:

```html
<summary class="header__icon header__icon--menu header__icon--summary ...">
```

Dawn's full-screen dimming scrim is that summary's `::before`
(`component-menu-drawer.css`):

```css
.js menu-drawer > details > summary::before {
  position: absolute;
  top: 100%;
  width: 100%;
  height: calc(var(--viewport-height, 100vh) - var(--header-bottom-position, 100%));
  z-index: 2;
}
```

Any `transform` other than `none` makes an element a containing block **and** a
stacking context for its absolutely positioned descendants. So on hover the
scrim stopped resolving against `.header-wrapper` and collapsed to the
44×44px icon box.

That scrim is also the tap-outside-to-close hit area — Dawn routes clicks on it
back through `MenuDrawer.onSummaryClick`. With it collapsed, the menu could not
be dismissed by tapping away, while `<body>` stayed scroll-locked by
`overflow-hidden-tablet`. On touch devices `:hover` latches after a tap, so
this triggered on the very tap that opened the menu.

Dawn itself animates `.header__icon:hover .icon` — the inner `<svg>`, never the
container — for exactly this reason (`base.css`).

**Fixed:** the lift now applies only to `.header__icon--cart` and
`.header__icon--account` (neither owns an overlay pseudo-element), and sits
behind `@media (hover: hover) and (pointer: fine)` so it cannot latch on touch.
The hamburger still gets colour feedback, just no `transform`.

### 2. `backdrop-filter` on the sticky header

```css
.section-header.shopify-section-header-sticky .header-wrapper {
  backdrop-filter: blur(14px) saturate(160%);          /* before */
}
```

`backdrop-filter` other than `none` also creates a stacking context and a
containing block for absolute descendants. `.menu-drawer` is
`position: absolute; top: 100%` and extends a full viewport *below* the header
box, so iOS Safari and older Chrome clip it away — the panel opens blank once
the header has gone sticky.

**Fixed:** frosted glass is now `min-width: 990px` only, additionally excluded
while a drawer is open via `:not(.menu-open)`, with a top-level
`.section-header.menu-open .header-wrapper { backdrop-filter: none !important }`
safety net. Mobile and tablet keep the same `box-shadow` lift with no filter.

Two side fixes in the same rule: `background-color` instead of the `background`
shorthand (which was wiping the `gradient` class's background-image), and
`rgba(var(--color-background), 0.86)` instead of hardcoded white, so the
section's colour scheme is respected.

### 3. The header's bottom border

```css
.header-wrapper--border-bottom { border-bottom: 0; }   /* before */
```

`HeaderDrawer.openMenuDrawer()` reads that class to compute a `borderOffset` of
1 and subtracts it from `--header-bottom-position`, so removing the border left
the drawer 1px taller than its gap.

**Fixed:** `border-bottom-color: transparent` — the 1px box the JS measures is
kept, only the visible line goes. The gradient hairline still covers it.

## Rule of thumb for future edits

Never apply `transform`, `filter`, `backdrop-filter` or `contain` to
`.header-wrapper`, `.header__icon--menu`, or any ancestor of `.menu-drawer`.
All four re-anchor or clip the drawer. Animate inner elements instead.

## Two things to check on your side

- **Free-shipping bar.** That compensation block is unchanged. Its 768px switch
  needs to match the height breakpoint of the bar itself in `theme.liquid`
  (Dawn's own mobile breakpoint is 749px) — worth confirming the two agree, but
  I left it alone rather than guess at markup I can't see.
- **Header menu setting.** The hamburger only renders when
  `section.settings.menu` is set. If the drawer is missing entirely rather than
  misbehaving, check Header → Menu in the theme editor.

## How to verify

On a real phone, or DevTools device mode at 390px wide, with `sections/header.liquid` replaced:

1. Tap the hamburger — the panel slides in and the page behind dims.
2. Tap the dimmed area — the menu closes and the page scrolls again.
3. Scroll down so the header goes sticky, then repeat 1–2. The panel must still
   be visible (this is the case that was blank on iOS).
4. Open a menu item with children — the submenu slides in, back button returns.

---

## Follow-up: transparent drawer panel, no scrim

A screenshot showed a second, separate problem: the drawer opens and sits
above the page, but the panel has no background and there is no dimming
scrim. This is **not** the failure the three fixes above address — those
concerned the scrim's geometry and iOS clipping the panel away entirely.

Dawn paints those two surfaces from colour-scheme custom properties:

```css
.menu-drawer                { background-color: rgb(var(--color-background)); }
menu-drawer summary::before { background: rgba(var(--color-foreground), 0.5); }
```

`layout/theme.liquid` emits the first colour scheme onto `:root` as well as
its own class:

```liquid
{% if forloop.index == 1 -%}
  :root,
{%- endif %}
.color-{{ scheme.id }} { --color-background: ...; --color-foreground: ...; }
```

So both variables always resolve, whatever `menu_color_scheme` is set to. A
blank or missing scheme class therefore cannot be the cause — something else
in the theme is overriding these two declarations, and that cannot be
identified from a screenshot.

`drawer-visibility-patch.css` restores the panel explicitly. Paste its
contents inside the existing `SimplyKids premium header` `<style>` block,
just before the closing `</style>`. It is not a standalone `<style>` block.

### Pin down the real cause (about 20 seconds)

Open the store on desktop at a narrow window, open the menu, then in DevTools:

1. **Is the stylesheet live?** Network tab, filter `menu-drawer`. It is loaded
   with `media="print" onload="this.media='all'"`, so a blocked `onload` (a CSP
   `script-src`/`style-src` rule, or an optimiser app rewriting the tag) leaves
   it at `media="print"` and it never applies.
2. **Inspect `#menu-drawer`.** In Computed, look up `background-color`.
   - `rgba(0, 0, 0, 0)` → something set it transparent. Click through to Styles
     and read which rule wins; the filename in the right margin names the
     culprit (often a speed-optimiser or a custom CSS asset).
   - An opaque colour → the background is fine and the problem is stacking, not
     paint. Report what you see.
3. **Check the variable.** In Console:
   `getComputedStyle(document.getElementById('menu-drawer')).getPropertyValue('--color-background')`
   Expect something like ` 255,255,255`. Empty means the scheme CSS did not
   emit — send that back.
4. **Check the scrim.** Inspect the hamburger `<summary>`, tick `::before` in
   the element tree, and read its computed `width`/`height`. A 44px box means
   an ancestor `transform` is re-anchoring it (the bug fixed above); a
   full-viewport box with a transparent background means the colour override
   again.
