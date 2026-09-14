# Simply Kids — Shopify theme

| Path | What it is |
| --- | --- |
| `simplykids-dawn-theme/` | The deliverable. The store's original Dawn 15.5.0 export with the complete Simply Kids site integrated. Upload this to Shopify. |
| `_backup/original-dawn-theme/` | The original export, untouched, for reference and rollback. |
| `docs/CHANGE-SUMMARY.md` | What changed, and what was preserved. |
| `docs/FILE-MANIFEST.md` | Every file added and modified. |
| `docs/INTEGRATION-NOTES.md` | Setup steps, pages and menus to create, Theme Editor settings, and known limitations. |

## Uploading

```bash
cd simplykids-dawn-theme
zip -r -X ../simplykids-dawn-theme.zip assets config layout locales sections snippets templates
```

Then **Online Store → Themes → Add theme → Upload zip file**. Publish only
after previewing.

Or, with the Shopify CLI:

```bash
cd simplykids-dawn-theme
shopify theme push --unpublished
```

## After uploading

Work through `docs/INTEGRATION-NOTES.md` §3 (pages), §4 (menus) and §5
(connecting the collection and blog). Everything else renders out of the box.
