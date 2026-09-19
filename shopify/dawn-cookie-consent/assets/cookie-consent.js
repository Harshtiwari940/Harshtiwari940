/**
 * Cookie consent for Shopify Dawn.
 *
 * Shopify's Customer Privacy API is the source of truth for whether a visitor
 * has answered and what they answered. localStorage is only used to remember
 * the selection for the UI and as a fallback when the API is unavailable.
 */
(function () {
  'use strict';

  if (window.customElements.get('cookie-consent')) return;

  // Shopify's own banner is hidden from here rather than from the stylesheet:
  // if this file fails to load, the visitor still gets a working consent UI.
  document.documentElement.classList.add('cookie-consent-active');

  const STORAGE_KEY = 'cookie-consent';
  const LEGACY_LEVEL_KEY = 'cookieConsentLevel';
  const LEGACY_SAVED_KEY = 'cookieConsentSaved';
  const API_TIMEOUT = 5000;
  const FOCUSABLE =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  // What each choice means to the Customer Privacy API. "essential" keeps
  // preference cookies (language, currency, recently viewed) because those are
  // what make the storefront work; it grants nothing to analytics or ads.
  const LEVELS = {
    all: { analytics: true, marketing: true, preferences: true, sale_of_data: true },
    essential: { analytics: false, marketing: false, preferences: true, sale_of_data: false },
    none: { analytics: false, marketing: false, preferences: false, sale_of_data: false },
  };

  const storage = {
    read() {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);

        // Migrate visitors who already answered the previous banner so they
        // are not asked a second time.
        if (window.localStorage.getItem(LEGACY_SAVED_KEY) === 'true') {
          const level = window.localStorage.getItem(LEGACY_LEVEL_KEY);
          if (LEVELS[level]) return { level: level, at: null };
        }
      } catch (error) {
        // Private browsing, blocked storage, disabled cookies.
      }
      return null;
    },
    write(value) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
        window.localStorage.removeItem(LEGACY_SAVED_KEY);
        window.localStorage.removeItem(LEGACY_LEVEL_KEY);
      } catch (error) {
        // Nothing to do: the Customer Privacy API still holds the real consent.
      }
    },
  };

  function privacyApi() {
    const api = window.Shopify && window.Shopify.customerPrivacy;
    return api && typeof api.setTrackingConsent === 'function' ? api : null;
  }

  let apiPromise = null;

  /** Resolves with the Customer Privacy API, or null if it never arrives. */
  function loadPrivacyApi() {
    if (apiPromise) return apiPromise;

    apiPromise = new Promise(function (resolve) {
      const ready = privacyApi();
      if (ready) {
        resolve(ready);
        return;
      }

      if (!window.Shopify || typeof window.Shopify.loadFeatures !== 'function') {
        resolve(null);
        return;
      }

      let settled = false;
      const finish = function () {
        if (settled) return;
        settled = true;
        resolve(privacyApi());
      };

      const timer = setTimeout(finish, API_TIMEOUT);

      window.Shopify.loadFeatures([{ name: 'consent-tracking-api', version: '0.1' }], function (error) {
        clearTimeout(timer);
        if (error) console.warn('[cookie-consent] Customer Privacy API failed to load.', error);
        finish();
      });
    });

    return apiPromise;
  }

  /** Global Privacy Control is a legally binding opt-out signal under CPRA. */
  function gpcEnabled() {
    return window.navigator.globalPrivacyControl === true;
  }

  class CookieConsent extends HTMLElement {
    constructor() {
      super();
      this.isOpen = false;
      this.lastFocused = null;
      this.onKeydown = this.onKeydown.bind(this);
      this.onDocumentClick = this.onDocumentClick.bind(this);
      this.onConsentCollected = this.onConsentCollected.bind(this);
    }

    connectedCallback() {
      this.dialog = this.querySelector('[data-cc-dialog]');
      this.hint = this.querySelector('[data-cc-hint]');
      this.reopenButton = document.querySelector('[data-cc-reopen]');
      this.inputs = Array.from(this.querySelectorAll('input[name="cookie_consent_level"]'));
      this.designMode = this.dataset.designMode === 'true';
      this.displayRegion = this.dataset.displayRegion || 'required';

      this.addEventListener('change', this.onChange.bind(this));
      this.addEventListener('click', this.onClick.bind(this));
      document.addEventListener('click', this.onDocumentClick);
      document.addEventListener('visitorConsentCollected', this.onConsentCollected);

      this.syncSelectionState();
      this.init();
    }

    disconnectedCallback() {
      document.removeEventListener('click', this.onDocumentClick);
      document.removeEventListener('visitorConsentCollected', this.onConsentCollected);
      document.removeEventListener('keydown', this.onKeydown);
      this.unlockScroll();
    }

    async init() {
      // In the theme editor the banner is always visible so it can be styled.
      if (this.designMode) {
        this.toggleReopenButton(true);
        this.open({ focus: false, restoreFocus: false });
        return;
      }

      const api = await loadPrivacyApi();
      const saved = storage.read();

      this.restoreSelection(api, saved);
      this.toggleReopenButton(Boolean(saved) || this.hasApiConsent(api));

      if (this.shouldPrompt(api, saved)) this.open();
    }

    isModal() {
      return this.dataset.layout === 'modal';
    }

    hasApiConsent(api) {
      if (!api || typeof api.currentVisitorConsent !== 'function') return false;
      const consent = api.currentVisitorConsent();
      if (!consent) return false;
      return ['analytics', 'marketing', 'preferences', 'sale_of_data'].some(function (key) {
        return consent[key] === 'yes' || consent[key] === 'no';
      });
    }

    /**
     * `shouldShowBanner()` already accounts for the visitor's region and for
     * consent that has expired or been withdrawn, so it wins whenever the API
     * is available and the merchant has not asked to prompt everyone.
     */
    shouldPrompt(api, saved) {
      if (this.displayRegion === 'always') return !saved && !this.hasApiConsent(api);
      if (!api || typeof api.shouldShowBanner !== 'function') return !saved;
      return api.shouldShowBanner();
    }

    restoreSelection(api, saved) {
      // A visitor sending GPC has opted out of data sales; start from the most
      // restrictive option rather than a pre-ticked "accept all".
      if (gpcEnabled() && !saved) {
        this.select('none');
        return;
      }
      if (saved && LEVELS[saved.level]) {
        this.select(saved.level);
        return;
      }
      if (this.hasApiConsent(api)) {
        const consent = api.currentVisitorConsent();
        if (consent.analytics === 'yes' && consent.marketing === 'yes') this.select('all');
        else if (consent.preferences === 'yes') this.select('essential');
        else this.select('none');
      }
    }

    select(level) {
      this.inputs.forEach(function (input) {
        input.checked = input.value === level;
      });
      this.syncSelectionState();
    }

    selectedLevel() {
      const checked = this.inputs.find(function (input) {
        return input.checked;
      });
      return checked ? checked.value : null;
    }

    /** Mirrors :checked onto the label for browsers without `:has()`. */
    syncSelectionState() {
      this.inputs.forEach(function (input) {
        const option = input.closest('[data-cc-option]');
        if (option) option.toggleAttribute('data-selected', input.checked);
      });
    }

    onChange(event) {
      if (!event.target.matches('input[name="cookie_consent_level"]')) return;
      this.syncSelectionState();
      if (this.hint) this.hint.textContent = '';
    }

    onClick(event) {
      const target = event.target;
      if (!(target instanceof Element)) return;

      if (target.closest('[data-cc-save]')) {
        const level = this.selectedLevel();
        if (!level) {
          if (this.hint) this.hint.textContent = this.dataset.hintText || 'Please choose an option to continue.';
          if (this.inputs[0]) this.inputs[0].focus();
          return;
        }
        this.save(level);
        return;
      }

      if (target.closest('[data-cc-decline]')) {
        this.save('none');
        return;
      }

      if (target.closest('[data-cc-dismiss]')) {
        // Dismissing grants nothing, so the banner comes back on the next page.
        this.close();
      }
    }

    onDocumentClick(event) {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const trigger = target.closest(
        '[data-cookie-preferences], a[href="#cookie-preferences"], a[href$="#cookie-preferences"], #shopify-pc__banner__btn-manage-prefs'
      );
      if (!trigger || this.contains(trigger)) return;

      event.preventDefault();
      this.open({ focus: true });
    }

    onConsentCollected() {
      // Consent was recorded elsewhere (another tab, an app, Shopify's own UI).
      if (this.isOpen && !this.designMode) this.close();
      this.toggleReopenButton(true);
    }

    onKeydown(event) {
      if (event.key === 'Escape') {
        event.stopPropagation();
        this.close();
        return;
      }
      if (event.key === 'Tab' && this.isModal()) this.trapFocus(event);
    }

    trapFocus(event) {
      const focusable = Array.from(this.querySelectorAll(FOCUSABLE)).filter(function (element) {
        return element.offsetParent !== null || element.getClientRects().length > 0;
      });
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || active === this.dialog)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    open(options) {
      if (this.isOpen) return;

      const settings = Object.assign({ focus: this.isModal(), restoreFocus: true }, options);

      this.isOpen = true;
      this.lastFocused = settings.restoreFocus ? document.activeElement : null;
      this.removeAttribute('hidden');
      this.classList.remove('is-closing');
      this.lockScroll();
      document.addEventListener('keydown', this.onKeydown);

      if (settings.focus) {
        // Wait a frame so the dialog is painted before focus moves into it.
        window.requestAnimationFrame(
          function () {
            if (this.dialog) this.dialog.focus({ preventScroll: true });
          }.bind(this)
        );
      }
    }

    close() {
      if (!this.isOpen) return;

      this.isOpen = false;
      document.removeEventListener('keydown', this.onKeydown);
      this.unlockScroll();

      const finish = function () {
        this.classList.remove('is-closing');
        this.setAttribute('hidden', '');
        if (this.lastFocused && typeof this.lastFocused.focus === 'function') {
          this.lastFocused.focus({ preventScroll: true });
          this.lastFocused = null;
        }
      }.bind(this);

      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reducedMotion || !this.dialog) {
        finish();
        return;
      }

      this.classList.add('is-closing');
      let done = false;
      const once = function () {
        if (done) return;
        done = true;
        this.dialog.removeEventListener('animationend', once);
        finish();
      }.bind(this);

      this.dialog.addEventListener('animationend', once);
      setTimeout(once, 400);
    }

    save(level) {
      const consent = Object.assign({}, LEVELS[level] || LEVELS.none);
      if (gpcEnabled()) consent.sale_of_data = false;

      this.select(level);
      storage.write({ level: level, at: new Date().toISOString() });
      this.toggleReopenButton(true);
      this.close();

      loadPrivacyApi().then(function (api) {
        if (!api) return;
        api.setTrackingConsent(consent, function (result) {
          if (result && result.error) console.warn('[cookie-consent] Consent was not saved.', result.error);
        });
      });

      this.dispatchEvent(
        new CustomEvent('cookie-consent:saved', { bubbles: true, detail: { level: level, consent: consent } })
      );
    }

    toggleReopenButton(show) {
      if (this.reopenButton) this.reopenButton.toggleAttribute('hidden', !show);
    }

    lockScroll() {
      if (!this.isModal()) return;
      const scrollbar = window.innerWidth - document.documentElement.clientWidth;
      document.documentElement.style.setProperty('--cc-scrollbar-width', scrollbar + 'px');
      document.documentElement.classList.add('cookie-consent-open');
    }

    unlockScroll() {
      document.documentElement.classList.remove('cookie-consent-open');
      document.documentElement.style.removeProperty('--cc-scrollbar-width');
    }
  }

  window.customElements.define('cookie-consent', CookieConsent);

  // Lets the footer, an app, or the console reopen the picker:
  // window.cookieConsent.open()
  window.cookieConsent = {
    open: function () {
      const element = document.querySelector('cookie-consent');
      if (element) element.open();
    },
    close: function () {
      const element = document.querySelector('cookie-consent');
      if (element) element.close();
    },
    get level() {
      const saved = storage.read();
      return saved ? saved.level : null;
    },
  };
})();
