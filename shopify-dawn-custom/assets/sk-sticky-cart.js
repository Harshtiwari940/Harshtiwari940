/* ==========================================================================
   Simply Kids — sticky cart bar with milestone discounts
   --------------------------------------------------------------------------
   Replaces ~200 lines that lived inline in layout/theme.liquid.

   What changed from that version, and why:

   · TIERS ARE SETTINGS, NOT CONSTANTS. The old code hardcoded
     tier1..tier4 = 1399/1999/2799/3499 and the matching copy. They are now
     `tier` blocks on the sk-sticky-cart section, editable in the theme editor.

   · MONEY IS FORMATTED, NOT CONCATENATED. The old code built strings like
     '₹ ' + slashed, where `slashed` was a raw float — so a 1299.5 cart showed
     "₹ 1299.5", and any non-INR currency showed a rupee sign anyway. It also
     parsed its own output back with substring(2) to compare totals.
     Intl.NumberFormat now does the formatting, with the shop's real currency.

   · IT LISTENS TO DAWN INSTEAD OF MONKEY-PATCHING fetch. The old code
     reassigned window.fetch for every request on the page. We subscribe to
     Dawn's own `cart-update` pubsub event, and keep a narrow fetch hook only
     as a fallback for third-party apps that post to /cart/* without telling
     Dawn.

   · NO RECURSIVE setTimeout. The old `counter` variable re-ran the whole
     fetch 300ms after the first call, once per page load, for no clear reason.
   ========================================================================== */

(function () {
  'use strict';

  var root = document.getElementById('SkStickyCart');
  if (!root) return;

  var els = {
    bar: root,
    message: root.querySelector('[data-sk-message]'),
    count: root.querySelectorAll('[data-sk-count]'),
    total: root.querySelector('[data-sk-total]'),
    was: root.querySelector('[data-sk-was]'),
  };

  var config = {};
  try {
    config = JSON.parse(root.getAttribute('data-config') || '{}');
  } catch (e) {
    config = {};
  }

  var tiers = Array.isArray(config.tiers) ? config.tiers.slice() : [];
  tiers.sort(function (a, b) {
    return a.threshold - b.threshold;
  });

  var formatter;
  try {
    formatter = new Intl.NumberFormat(config.locale || 'en', {
      style: 'currency',
      currency: config.currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  } catch (e) {
    formatter = { format: function (n) { return String(Math.round(n)); } };
  }

  function money(cents) {
    return formatter.format(cents / 100);
  }

  function rootUrl() {
    return (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) || '/';
  }

  /* ----------------------------------------------------------------------
     BOGO handling.
     The original excluded items whose product_description was exactly 'BOGO'
     from the progress total, so a free/bundled line did not push the customer
     over a discount threshold. That rule is preserved, but it now matches on
     a product tag, which is what merchandisers can actually edit in Admin.
     Set config.bogoTag in the section settings; leave it blank to disable.
     ---------------------------------------------------------------------- */
  function progressTotal(cart) {
    var excludedCents = 0;
    var tag = (config.bogoTag || '').toLowerCase();

    if (tag) {
      cart.items.forEach(function (item) {
        var haystack = []
          .concat(item.product_description || '')
          .concat((item.properties && Object.values(item.properties)) || [])
          .join(' ')
          .toLowerCase();
        if (haystack.indexOf(tag) !== -1) {
          excludedCents += item.price;
        }
      });
    }

    return Math.max(0, cart.original_total_price - excludedCents);
  }

  function tierFor(amountCents) {
    var amount = amountCents / 100;
    var current = null;
    var next = null;

    for (var i = 0; i < tiers.length; i++) {
      if (amount >= tiers[i].threshold) {
        current = tiers[i];
      } else {
        next = tiers[i];
        break;
      }
    }
    return { current: current, next: next, index: current ? tiers.indexOf(current) + 1 : 0 };
  }

  function buildMessage(amountCents) {
    var state = tierFor(amountCents);
    var unlocked = state.current ? state.current.label : config.baseLabel || '';
    var parts = [];

    if (unlocked) parts.push('<b>' + unlocked + '</b>');

    if (state.next) {
      var gapCents = state.next.threshold * 100 - amountCents;
      if (gapCents > 0) {
        parts.push(
          (config.addMoreText || 'Add {{amount}} more to unlock {{reward}}')
            .replace('{{amount}}', '<b>' + money(gapCents) + '</b>')
            .replace('{{reward}}', '<b>' + state.next.label + '</b>')
        );
      }
    } else if (state.current) {
      parts.push(config.maxedText || '');
    }

    return { html: parts.filter(Boolean).join(' '), index: state.index };
  }

  /* ----------------------------------------------------------------------
     Confetti — loaded on demand, only the first time a tier is reached in
     this session. The old build loaded the library on every page of the site
     whether or not the cart had anything in it.
     ---------------------------------------------------------------------- */
  var confettiLoading = null;

  function loadConfetti() {
    if (window.confetti) return Promise.resolve(window.confetti);
    if (confettiLoading) return confettiLoading;

    confettiLoading = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js';
      s.async = true;
      s.onload = function () { resolve(window.confetti); };
      s.onerror = reject;
      document.head.appendChild(s);
    });
    return confettiLoading;
  }

  function celebrate(tierIndex) {
    if (!tierIndex || config.confetti === false) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var key = 'sk_tier_' + tierIndex;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch (e) {
      return; // storage blocked — skip rather than repeat on every update
    }

    loadConfetti()
      .then(function (confetti) {
        if (typeof confetti !== 'function') return;
        var end = Date.now() + 2500;
        var defaults = { startVelocity: 35, spread: 360, ticks: 100, zIndex: 5 };

        (function frame() {
          var left = end - Date.now();
          if (left <= 0) return;
          var particleCount = 60 * (left / 2500);
          confetti(Object.assign({}, defaults, { particleCount, origin: { x: 0.1 + Math.random() * 0.2, y: Math.random() - 0.2 } }));
          confetti(Object.assign({}, defaults, { particleCount, origin: { x: 0.7 + Math.random() * 0.2, y: Math.random() - 0.2 } }));
          setTimeout(frame, 250);
        })();
      })
      .catch(function () { /* CDN blocked — the bar still works */ });
  }

  function render(cart) {
    var count = cart.item_count || 0;

    els.count.forEach(function (el) { el.textContent = count; });
    els.bar.hidden = count === 0;

    if (count === 0) return;

    els.total.textContent = money(cart.total_price);

    if (els.was) {
      var discounted = cart.total_discount > 0;
      els.was.hidden = !discounted;
      if (discounted) els.was.textContent = money(cart.original_total_price);
    }

    if (els.message && tiers.length) {
      var msg = buildMessage(progressTotal(cart));
      els.message.innerHTML = msg.html;
      celebrate(msg.index);
    }
  }

  var inFlight = null;

  function refresh() {
    if (inFlight) return inFlight;
    inFlight = fetch(rootUrl() + 'cart.js', { headers: { Accept: 'application/json' } })
      .then(function (r) { return r.json(); })
      .then(function (cart) {
        render(cart);
        return cart;
      })
      .catch(function () { /* leave the bar in its last good state */ })
      .finally(function () { inFlight = null; });
    return inFlight;
  }

  /* Dawn's own event — fired by the cart drawer, cart page and quick-add. */
  if (typeof subscribe === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
    subscribe(PUB_SUB_EVENTS.cartUpdate, refresh);
  }

  /* Fallback for apps that hit /cart/* directly without publishing to Dawn. */
  (function (win) {
    var original = win.fetch;
    if (typeof original !== 'function') return;

    var CART_WRITE = /\/cart\/(add|update|change|clear)(\.js)?$/;

    win.fetch = function () {
      var result = original.apply(this, arguments);
      try {
        var url = String((arguments[0] && arguments[0].url) || arguments[0] || '');
        if (CART_WRITE.test(url.split('?')[0])) {
          result.then(function () { setTimeout(refresh, 100); }).catch(function () {});
        }
      } catch (e) { /* never let instrumentation break a cart request */ }
      return result;
    };
  })(window);

  document.addEventListener('DOMContentLoaded', refresh);
  if (document.readyState !== 'loading') refresh();
})();
