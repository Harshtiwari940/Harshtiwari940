# Browser tests

`index.html` and `banner.html` are standalone copies of the markup the section
renders. They load the real `../assets/cookie-consent.js` and
`../assets/section-cookie-consent.css`; the test injects a stub of Shopify's
Customer Privacy API before the page scripts run.

```bash
npm i -g playwright
NODE_PATH=$(npm root -g) node test.js
```

Covered: when the banner is and is not shown, the consent payload each choice
sends, persistence and restore, reopening, dismissal, the focus trap, Escape and
focus return, Global Privacy Control, the no-API fallback, migration from the
previous banner, and both layouts.
