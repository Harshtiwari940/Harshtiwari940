# Brand colour schemes

## Why this file exists

Your V20 theme's `config/settings_data.json` still carries **Dawn's stock colour
schemes** — untouched. `scheme-3` there is dark navy (`#242833`, white text) and
`scheme-4` is near-black.

Meanwhile `assets/v19.css` hardcoded a parallel set of classes — `.sk-cs-1`
through `.sk-cs-13` — that described the *Simply Kids* palette, with a comment
claiming they matched `config/settings_data.json` "exactly". They did not. The
two systems disagreed, and because the page markup used `.sk-cs-*`, changing a
colour scheme in the theme editor had no effect on any of those pages.

The new sections use Dawn's native `color_scheme` setting instead, so the theme
editor is once again the source of truth for colour. That only works if the
schemes actually hold the brand palette — which is what this file is for.

## How to apply (recommended: the theme editor)

**Theme editor → Theme settings → Colors.** Edit each scheme to match the table
below. This is the safe path: it never touches a file, and it is how a merchant
would change these later.

| Scheme | Role | Background | Text | Button | Button label |
|---|---|---|---|---|---|
| `scheme-1` | Default sections | `#FFFFFF` | `#4A4744` | `#004987` | `#FFFFFF` |
| `scheme-2` | Soft wash — alternating bands, promo bar | `#E8F5FB` | `#4A4744` | `#004987` | `#FFFFFF` |
| `scheme-3` | Hero gradient | `#E8F5FB` → `#FFFFFF` | `#4A4744` | `#004987` | `#FFFFFF` |
| `scheme-4` | Deep blue — emphasis bands | `#004987` → `#003666` | `#FFFFFF` | `#FFFFFF` | `#004987` |
| `scheme-5` | Pink pastel — sanctioned accent only | `#FCE0EC` → `#F6B1D4` | `#4A4744` | `#004987` | `#FFFFFF` |

For the gradient rows, set the solid background first, then add the gradient in
the scheme's **Gradient** field:

- `scheme-3`: `linear-gradient(180deg, #E8F5FB 0%, #FFFFFF 100%)`
- `scheme-4`: `linear-gradient(180deg, #004987 0%, #003666 100%)`
- `scheme-5`: `linear-gradient(100deg, #FCE0EC 0%, #FAD3E6 50%, #F6B1D4 100%)`

## On the pink

The brand book restricts the pastel accents to three places: the announcement
bar, the product page, and Community. `scheme-5` exists for exactly those.
Applying it to a general content section is the one thing here that would read
as off-brand — the dominant palette is white, ink and blue, carrying roughly
90% of the site.

## If you would rather paste JSON

Replacing `config/settings_data.json` wholesale would also overwrite your logo,
page width, typography and every section's saved content. Don't. If you want to
edit it directly, change **only** the `color_schemes` object inside
`current`, leaving every sibling key alone. The editor route above is safer and
produces the same result.
