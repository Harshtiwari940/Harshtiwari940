# Simply Kids — Dawn 15.5.0 theme

`simply-kids-dawn-theme.zip` is a complete, uploadable Shopify theme: stock **Dawn 15.5.0**
with the Simply Kids homepage rebuilt as Online Store 2.0 sections.

## Uploading

1. Shopify admin → **Online Store → Themes**
2. **Add theme → Upload zip file** → choose `simply-kids-dawn-theme.zip`
3. **Customize** to open the theme editor, then **Publish** when you're happy.

Upload it as a new theme first and preview it — do not publish over a live theme
until you've checked the homepage, a product page and checkout.

## What's on the homepage

`templates/index.json` renders these sections, in the affiliate design's order:

| # | Section | File |
|---|---------|------|
| 1 | Hero — age spectrum | `sections/simply-kids-hero.liquid` |
| 2 | Shop by age (3 cards) | `sections/simply-kids-age-range.liquid` |
| 3 | Build a routine (age picker) | `sections/simply-kids-routine.liquid` |
| 4 | The Essentials (real products) | `sections/simply-kids-essentials.liquid` |
| 5 | Three rituals | `sections/simply-kids-rituals.liquid` |
| 6 | Science & ingredients | `sections/simply-kids-science.liquid` |
| 7 | Baby vs adult care | `sections/simply-kids-comparison.liquid` |
| 8 | Photo statement | `sections/simply-kids-photo-break.liquid` |
| 9 | Testimonials | `sections/simply-kids-testimonials.liquid` |
| 10 | Journal (real blog) | `sections/simply-kids-journal.liquid` |
| 11 | 10% first-order offer + signup | `sections/simply-kids-offer.liquid` |
| 12 | Trust badges | `sections/simply-kids-trust-badges.liquid` |
| 13 | Guarantees & payments | `sections/simply-kids-guarantees.liquid` |
| 14 | WhatsApp button | `sections/simply-kids-whatsapp.liquid` |

`sections/simply-kids-newsletter.liquid` ships too but is **not** on the homepage — it's a
plain newsletter block for other pages (the homepage's 10% band already carries the signup form).

Header, navigation, announcement bar, footer, cart drawer, product pages, variant pickers,
search, customer accounts and checkout are all untouched Dawn.

## Connecting real data

Three sections need a picker set before they show live content:

- **The Essentials** → pick a **Collection**. Until then Dawn's product-card placeholders show.
- **Journal** → pick a **Blog**.
- **Shop by age** / **Build a routine** → pick a **Collection** per block (or set a custom link).

## Colour schemes

Schemes 1–5 are Dawn's originals, untouched. Schemes 6–11 were added for this design:

| Scheme | Use |
|--------|-----|
| `scheme-6` | SK White — hero, essentials, comparison, journal, badges, guarantees |
| `scheme-7` | SK Blue Wash — shop by age, rituals, testimonials |
| `scheme-8` | SK Sky — science |
| `scheme-9` | SK Blush — 10% offer band |
| `scheme-10` | SK Pink — announcement bar |
| `scheme-11` | SK Deep Blue — spare dark band |

Edit them in **Theme settings → Colors**.

## Typography

The brand faces (Nunito Sans, Dancing Script) are self-hosted in `assets/` and applied only
inside the Simply Kids sections, so the rest of the store keeps its current Dawn typography.
To use Nunito Sans store-wide, set it in **Theme settings → Typography**.

## Development

- Styles: `assets/simply-kids.css` (all `.sk-*` classes; nothing overrides Dawn)
- Age picker behaviour: `assets/simply-kids-routine.js`
- Shared snippets: `snippets/simply-kids-image.liquid`, `simply-kids-icon.liquid`,
  `simply-kids-subscribe-form.liquid`

Lint with `shopify theme check`.
