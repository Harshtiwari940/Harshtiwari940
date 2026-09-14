/*
 * Simply Kids — interactive behaviours.
 *
 * The affiliate export is a static visual preview and ships no JavaScript, so
 * every interaction it implies (age quiz, routine tabs, ingredient tooltips,
 * the community widgets, quick add-to-cart) is rebuilt here as a self-guarding
 * custom element. Nothing here touches Dawn's own scripts, globals or DOM:
 * each element only reads markup inside itself, and re-registration is guarded
 * so Theme Editor section reloads are safe.
 */

(function () {
  'use strict';

  const define = (name, ctor) => {
    if (!customElements.get(name)) customElements.define(name, ctor);
  };

  /* ------------------------------------------------------------------ *
   * <sk-age-quiz> — pick an age band, reveal the matching result copy.
   * ------------------------------------------------------------------ */
  define(
    'sk-age-quiz',
    class SkAgeQuiz extends HTMLElement {
      connectedCallback() {
        this.options = Array.from(this.querySelectorAll('[data-sk-quiz-option]'));
        this.results = Array.from(this.querySelectorAll('[data-sk-quiz-result]'));
        if (!this.options.length) return;

        this.options.forEach((option) => {
          option.addEventListener('click', () => this.select(option.dataset.skQuizOption));
        });

        const preselected = this.options.find((option) => option.getAttribute('aria-pressed') === 'true');
        this.select(preselected ? preselected.dataset.skQuizOption : this.options[0].dataset.skQuizOption);
      }

      select(value) {
        this.options.forEach((option) => {
          option.setAttribute('aria-pressed', String(option.dataset.skQuizOption === value));
        });
        this.results.forEach((result) => {
          result.hidden = result.dataset.skQuizResult !== value;
        });
      }
    }
  );

  /* ------------------------------------------------------------------ *
   * <sk-tabs> — routine builder (and any other tabbed panel set).
   * Full keyboard support: arrows, Home/End, as per the WAI-ARIA pattern.
   * ------------------------------------------------------------------ */
  define(
    'sk-tabs',
    class SkTabs extends HTMLElement {
      connectedCallback() {
        this.tabs = Array.from(this.querySelectorAll('[role="tab"]'));
        this.panels = Array.from(this.querySelectorAll('[role="tabpanel"]'));
        if (!this.tabs.length) return;

        this.tabs.forEach((tab, index) => {
          tab.addEventListener('click', () => this.activate(index));
          tab.addEventListener('keydown', (event) => this.onKeydown(event, index));
        });

        const active = this.tabs.findIndex((tab) => tab.getAttribute('aria-selected') === 'true');
        this.activate(active > -1 ? active : 0);
      }

      onKeydown(event, index) {
        const keys = {
          ArrowRight: index + 1,
          ArrowLeft: index - 1,
          Home: 0,
          End: this.tabs.length - 1,
        };
        if (!(event.key in keys)) return;
        event.preventDefault();
        const next = (keys[event.key] + this.tabs.length) % this.tabs.length;
        this.activate(next);
        this.tabs[next].focus();
      }

      activate(index) {
        this.tabs.forEach((tab, i) => {
          const selected = i === index;
          tab.setAttribute('aria-selected', String(selected));
          tab.setAttribute('tabindex', selected ? '0' : '-1');
        });
        this.panels.forEach((panel, i) => {
          panel.hidden = i !== index;
        });
      }
    }
  );

  /* ------------------------------------------------------------------ *
   * <sk-tooltip-chips> — ingredient chips. Hover/focus is handled in CSS;
   * this adds tap-to-toggle so the tooltips are reachable on touch devices.
   * ------------------------------------------------------------------ */
  define(
    'sk-tooltip-chips',
    class SkTooltipChips extends HTMLElement {
      connectedCallback() {
        this.chips = Array.from(this.querySelectorAll('[data-tip]'));
        if (!this.chips.length) return;

        this.chips.forEach((chip) => {
          chip.setAttribute('tabindex', '0');
          chip.addEventListener('click', (event) => {
            event.preventDefault();
            const open = chip.classList.contains('is-open');
            this.closeAll();
            chip.classList.toggle('is-open', !open);
          });
        });

        this.onDocumentClick = (event) => {
          if (!this.contains(event.target)) this.closeAll();
        };
        document.addEventListener('click', this.onDocumentClick);
      }

      disconnectedCallback() {
        if (this.onDocumentClick) document.removeEventListener('click', this.onDocumentClick);
      }

      closeAll() {
        this.chips.forEach((chip) => chip.classList.remove('is-open'));
      }
    }
  );

  /* ------------------------------------------------------------------ *
   * <sk-creativity-spark> — pick a random drawing prompt from the blocks.
   * ------------------------------------------------------------------ */
  define(
    'sk-creativity-spark',
    class SkCreativitySpark extends HTMLElement {
      connectedCallback() {
        this.output = this.querySelector('[data-sk-spark-output]');
        this.button = this.querySelector('[data-sk-spark-button]');
        this.ideas = JSON.parse(this.querySelector('[data-sk-spark-ideas]')?.textContent || '[]');
        if (!this.output || !this.button || !this.ideas.length) return;

        this.button.addEventListener('click', (event) => {
          event.preventDefault();
          let next = this.output.textContent.trim();
          if (this.ideas.length > 1) {
            while (next === this.output.textContent.trim()) {
              next = this.ideas[Math.floor(Math.random() * this.ideas.length)];
            }
          } else {
            next = this.ideas[0];
          }
          this.output.textContent = next;
        });
      }
    }
  );

  /* ------------------------------------------------------------------ *
   * <sk-dob-tip> — a date of birth maps to an age band, which maps to a tip.
   * ------------------------------------------------------------------ */
  define(
    'sk-dob-tip',
    class SkDobTip extends HTMLElement {
      connectedCallback() {
        this.input = this.querySelector('input[type="date"]');
        this.button = this.querySelector('[data-sk-dob-button]');
        this.output = this.querySelector('[data-sk-dob-output]');
        this.tips = JSON.parse(this.querySelector('[data-sk-dob-tips]')?.textContent || '{}');
        if (!this.input || !this.button || !this.output) return;

        this.button.addEventListener('click', (event) => {
          event.preventDefault();
          this.output.textContent = this.tipFor(this.input.value);
        });
      }

      tipFor(value) {
        if (!value) return this.tips.empty || 'Pick a date of birth to see today’s tip.';
        const dob = new Date(value);
        if (Number.isNaN(dob.getTime())) return this.tips.empty || '';
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const monthDelta = today.getMonth() - dob.getMonth();
        if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < dob.getDate())) age -= 1;
        if (age < 4) return this.tips.under || this.tips.empty || '';
        if (age <= 6) return this.tips['4-6'] || '';
        if (age <= 9) return this.tips['7-9'] || '';
        if (age <= 12) return this.tips['10-12'] || '';
        return this.tips.over || this.tips['10-12'] || '';
      }
    }
  );

  /* ------------------------------------------------------------------ *
   * <sk-quick-add> — "Add to bag" on the Simply Kids product cards.
   * Posts to Shopify's own Cart AJAX API and hands the refreshed sections
   * back to Dawn (cart drawer / notification / icon bubble) rather than
   * re-implementing any cart UI.
   * ------------------------------------------------------------------ */
  define(
    'sk-quick-add',
    class SkQuickAdd extends HTMLElement {
      connectedCallback() {
        this.addEventListener('submit', this.onSubmit.bind(this));
      }

      get cartElement() {
        // Same preference order as Dawn's own product-form.js.
        return (
          document.querySelector('cart-notification') ||
          document.querySelector('cart-drawer') ||
          null
        );
      }

      sectionsToRender() {
        const cart = this.cartElement;
        if (cart && typeof cart.getSectionsToRender === 'function') {
          return cart.getSectionsToRender().map((section) => section.id);
        }
        return ['cart-icon-bubble'];
      }

      async onSubmit(event) {
        const form = event.target.closest('form[data-sk-quick-add-form]');
        if (!form) return;
        event.preventDefault();

        const wrapper = form.closest('.sk-product-card__actions') || form;
        const errorTarget = form.querySelector('[data-sk-quick-add-error]');
        wrapper.classList.add('is-busy');
        if (errorTarget) errorTarget.textContent = '';

        const cartBeforeAdd = this.cartElement;
        if (cartBeforeAdd && typeof cartBeforeAdd.setActiveElement === 'function') {
          cartBeforeAdd.setActiveElement(document.activeElement);
        }

        const body = new FormData(form);
        body.append('sections', this.sectionsToRender().join(','));
        body.append('sections_url', window.location.pathname);

        try {
          const routes = (window.routes && window.routes.cart_add_url) || '/cart/add';
          const response = await fetch(`${routes}.js`, {
            method: 'POST',
            headers: { Accept: 'application/javascript' },
            body,
          });
          const data = await response.json();

          if (data.status) {
            throw new Error(data.description || data.message || data.status);
          }

          const cart = this.cartElement;
          if (cart && typeof cart.renderContents === 'function') {
            if (cart.classList) cart.classList.remove('is-empty');
            cart.renderContents(data);
          } else {
            this.updateCartBubble(data.sections);
          }

          if (typeof window.publish === 'function' && window.PUB_SUB_EVENTS) {
            window.publish(window.PUB_SUB_EVENTS.cartUpdate, {
              source: 'sk-quick-add',
              productVariantId: body.get('id'),
              cartData: data,
            });
          }
        } catch (error) {
          if (errorTarget) errorTarget.textContent = error.message;
          else form.submit();
        } finally {
          wrapper.classList.remove('is-busy');
        }
      }

      updateCartBubble(sections) {
        if (!sections || !sections['cart-icon-bubble']) return;
        const bubble = document.getElementById('cart-icon-bubble');
        if (!bubble) return;
        const parsed = new DOMParser().parseFromString(sections['cart-icon-bubble'], 'text/html');
        const inner = parsed.querySelector('.shopify-section');
        if (inner) bubble.innerHTML = inner.innerHTML;
      }
    }
  );
})();
