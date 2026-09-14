# Simply Kids × Dawn — integration notes

The theme in `simplykids-dawn-theme/` is the store's **original Dawn 15.5.0
export with the Simply Kids site built on top of it**. It is not a new theme:
every Dawn file that was in the export is still there, and the store's own
earlier customisations (the bespoke footer, the "SimplyKids premium" header,
product page, cart and collection-grid styling, and the `sk-quick-add-grid`
section) are untouched.

An untouched copy of the original export is kept at
`_backup/original-dawn-theme/` for reference and rollback.

---

## 1. How the brand layer attaches to Dawn

| Concern | How it is handled |
| --- | --- |
| Colour | 13 colour schemes in `config/settings_data.json`, so Dawn generates `.color-scheme-1 … 13` itself. No colour is hard-coded over Dawn's. |
| Type | `assets/simplykids-brand.css` overrides only `--font-body-family` / `--font-heading-family`, and only when `<body>` carries `sk-brand-type`. Faces are self-hosted from `snippets/sk-fonts.liquid`. |
| Components | Everything else in the brand stylesheet is prefixed `.sk-`. There are no global element resets and no `.color-scheme-*` rules. |
| Dawn tweaks | Four narrow tweaks (footer radius, announcement type, card radius, PDP type) are each gated behind a `body` class that only turns on from **Theme settings → Simply Kids**. |
| Behaviour | `assets/simplykids.js` registers six custom elements. Each guards against re-registration, reads only its own DOM, and touches no Dawn global. |

### Class-name collision that was resolved

The store's existing custom footer already owns `.sk-newsletter`,
`.sk-newsletter__form` and `.sk-newsletter__success`. The new newsletter
section therefore uses `.sk-offer*` so the two never interfere.

---

## 2. Affiliate page → Shopify mapping

| Affiliate file | Shopify implementation | Notes |
| --- | --- | --- |
| `index.html` | `templates/index.json` | 13 sections, in the source order |
| `shop.html` | `templates/collection.json` | Dawn's collection banner, facets, sorting and product grid, plus brand category pills and the trust band |
| `product.html` | `templates/product.json` | Dawn `main-product` with native `rating`, `text`, `icon-with-text`, four `collapsible_tab` and `complementary` blocks |
| `cart.html` | `templates/cart.json` | Dawn cart, plus the trust band |
| `story.html` | `templates/page.about.json` | 12 sections |
| `science.html` | `templates/page.science.json` | |
| `routine.html` | `templates/page.routine.json` | |
| `faq.html` | `templates/page.faq.json` | 10 questions (5 from the FAQ page + 5 from the About page) with FAQPage structured data |
| `journal.html` | `templates/blog.json` + `templates/article.json` | Real Shopify blog; the homepage journal grid also reads real articles |
| `community.html` | `templates/page.community.json` | |
| `contact.html` | `templates/page.contact.json` | Shopify's native contact form |
| `affiliate.html` | `templates/page.affiliate.json` | |
| `privacy.html` | `templates/page.privacy.json` | Copy pre-filled, editable in the Theme Editor |
| `returns.html` | `templates/page.returns.json` | ditto |
| `shipping.html` | `templates/page.shipping.json` | ditto |
| `terms.html` | `templates/page.terms.json` | ditto |

The affiliate export's `.pv-*` classes (`pv-header`, `pv-nav`, `pv-footer`,
`pv-announce`, `pv-grid-*`, `pv-cart-grid`, `pv-pdp-grid`) are the static
preview's stand-ins for chrome that Dawn already provides. They were
deliberately **not** ported: Dawn's real header, navigation, announcement bar,
footer, cart and product layouts are used instead. Every `.sk-*` class from the
source design **is** present in `assets/simplykids-brand.css`.

---

## 3. Pages you need to create in Shopify Admin

Create each page under **Online Store → Pages**, then set its **Theme template**
in the page's sidebar. The handle must match, because the buttons in the
sections link to these paths.

| Page title | Handle (URL) | Template to select |
| --- | --- | --- |
| About Us | `about-us` | `page.about` |
| Our Science | `our-science` | `page.science` |
| Build a Routine | `build-a-routine` | `page.routine` |
| FAQ | `faq` | `page.faq` |
| Be The Pride (Community) | `community` | `page.community` |
| Affiliate | `affiliate` | `page.affiliate` |
| Contact | `contact` | `page.contact` |
| Privacy Policy | `privacy-policy` | `page.privacy` |
| Return & Refund Policy | `return-refund-policy` | `page.returns` |
| Shipping Policy | `shipping-policy` | `page.shipping` |
| Terms & Conditions | `terms-conditions` | `page.terms` |

Page **body content is optional**: every one of these templates already carries
its copy in Theme Editor sections. Each also includes an **SK Page content**
section that renders the Admin page body underneath when you add one, and
disappears when the body is empty.

A blog with the handle `journal` gives you `/blogs/journal`, matching the
source design's Journal.

---

## 4. Navigation to set up

**Online Store → Navigation.**

**Main menu** (the header menu, already selected in the header section):

- Shop → `/collections/all`
- Best Sellers → your best-sellers collection
- Build a Routine → `/pages/build-a-routine`
- Our Science → `/pages/our-science`
- Journal → `/blogs/journal`

**Footer menus.** The store's existing footer section has two menu pickers —
*Our Story menu* and *Policies menu*. Leave them blank to keep its built-in
defaults, or point them at menus you create. Suggested:

- *Our Story*: About Us, Journal, Affiliate, FAQ
- *Policies*: Privacy Policy, Return & Refund Policy, Shipping Policy, Terms & Conditions

If you switch to the optional **SK Brand footer** (see §6), create a *Shop* menu
as well and assign each menu column in the Theme Editor.

---

## 5. Connecting real product data

Nothing about products is hard-coded.

- **SK Product grid** (homepage "The Essentials"): pick a collection in the
  Theme Editor. Until you do, it shows the packaged Simply Kids product
  photography as onboarding cards.
- **Prices, sale badges, availability, add-to-cart** all come from the chosen
  products. "Add to bag" posts to Shopify's Cart AJAX API and hands the
  response to Dawn's cart drawer / cart notification.
- **Star ratings** read the `reviews.rating` and `reviews.rating_count` product
  metafields, which Judge.me, Shopify Product Reviews and most review apps
  populate. Ratings simply don't render if the metafield is absent.
- **Product tagline** on the PDP reads `custom.tagline`. Create that metafield
  under **Settings → Custom data → Products** (single line text), or connect
  the block to a different source in the Theme Editor, or delete the block.
- **Journal cards** read real articles from the blog you select, and fall back
  to editable placeholder cards only while the blog is empty.

The five packaged product photos (`assets/sk-product-*.jpg`) are the source
design's product photography. Upload them as product images in Admin so the
real product pages use them.

---

## 6. Theme Editor settings to review

**Theme settings → Simply Kids**

| Setting | Shipped as | Why |
| --- | --- | --- |
| Use Simply Kids typography | **On** | Nunito Sans + Dancing Script site-wide |
| Round the top corners of the footer | **Off** | Your existing custom footer is not a rounded blue band; turning this on would round the wrong element |
| Apply brand type to the announcement bar | **On** | |
| Round product card media | **Off** | Your collection grid already has its own custom card styling |
| Apply Simply Kids styling to product pages | **Off** | Your PDP already has its own "SimplyKids premium" styling |
| WhatsApp button | **On**, `916297450751` | Change the number, prefilled message, or switch it off |

**Header group** — the announcement bar is now enabled with the source design's
copy on the pink scheme (scheme 11), and the header uses the pale-blue scheme 4.
Both are one-click changes if you prefer the previous look.

**Footer group** — your existing footer is still the active one. An **SK Brand
footer** section (the midnight-blue, rounded-top footer from the source design)
sits below it, hidden. To switch: hide *Footer*, unhide *SK Brand footer*, and
assign its menu columns.

---

## 7. What could not be carried over verbatim, and why

1. **The affiliate export ships no JavaScript.** It is a static visual preview
   (its own CSS says so). Every interaction the design implies — the age quiz,
   routine tabs, ingredient tooltips, the two community widgets, add-to-cart —
   was rebuilt from scratch in `assets/simplykids.js` as custom elements, with
   keyboard support and no-JS fallbacks. Nothing was copied, because there was
   nothing to copy.

2. **The preview's own chrome is intentionally discarded.** `pv-header`,
   `pv-nav`, `pv-footer` and `pv-announce` are static stand-ins. Replacing
   Dawn's header/footer with them would have cost the cart drawer, predictive
   search, mega menus, localisation, the mobile drawer and customer accounts.

3. **The preview's cart, PDP and collection pages are mock-ups.** They are
   reproduced as configuration of Dawn's real sections, so variants, quantity
   rules, discounts, taxes, dynamic checkout and facets keep working. A
   pixel-identical copy of the static mock would have been a non-functional
   page.

4. **Community artwork upload.** The source design shows a "Submit entry" form.
   Shopify's contact form cannot accept file uploads, so the section collects
   the child's first name, age, parent email and a message, and the guidelines
   text asks the parent to reply to the confirmation email with the artwork
   attached. A file-upload app or a Shopify Form is required for true uploads.

5. **The community counters** ("247 young creators", "609 artworks shared",
   "429 families") are editable text. Shopify has no data source for them.

6. **Efficacy statistics and review counts** are editable content, not computed
   values — they come from the brand's own studies.

7. **The affiliate programme CTA** has no destination in the source. The source
   page notes the live site links out to an external GoAffPro portal; paste that
   URL into the section's button link.

8. **The FAQ page** notes that the live build has 13 questions but shows 5. All
   5 are included, plus the 5 genuine questions from the About page, for 10.
   Add the rest as blocks — the FAQPage structured data is generated from the
   same blocks, so it can never drift from the visible copy.

9. **`judgeme_widgets`** is referenced by the pre-existing collection grid and
   `sk-quick-add-grid` sections. That snippet is installed by the Judge.me app,
   not shipped with a theme. Both call sites are behind a "show rating" toggle.
   This predates this work.

10. **Stale footer settings.** `sections/footer-group.json` still carries
    settings (`newsletter_enable`, `payment_enable`, …) from stock Dawn's footer
    that your customised footer no longer declares. Shopify ignores unknown
    settings; they were left in place so nothing is lost if the stock footer is
    ever restored.

---

## 8. Validation performed

- All 84 JSON files parse; all 75 section schemas parse.
- Every template, section group, block type, block setting, select value and
  `color_scheme` reference resolves against the section schemas and the 13
  defined schemes.
- Every `asset_url`, `render`, `section` and `sections` reference resolves to a
  file in the theme (the only exception is the app-provided `judgeme_widgets`).
- Every Liquid file has balanced tags; all 33 Simply Kids files parse cleanly
  through a Liquid parser. The 10 stock Dawn files that the parser rejects use
  `{% render block %}` and multi-line filter chains — valid Shopify Liquid the
  parser does not implement.
- Every Simply Kids section produces balanced HTML on **every** branch of every
  conditional.
- `assets/simplykids.js` passes `node --check`;
  `assets/simplykids-brand.css` has balanced braces across 268 rules with
  breakpoints at 749px and 989px, matching Dawn's.
- No `.html`, `./css/`, `./js/` or `../assets/` path survives anywhere.
