/* ==========================================================================
   Simply Kids — small interactive components
   --------------------------------------------------------------------------
   Two custom elements that were previously inline <script> blocks inside the
   v19 page sections:

     <sk-tabs>  — the routine builder's morning / evening / weekly panels
     <sk-quiz>  — the "which routine fits?" age picker

   Both follow the WAI-ARIA patterns rather than just toggling classes, so they
   work with a keyboard and announce correctly in a screen reader. The previous
   markup set aria-selected but had no key handling, so the tabs were reachable
   only by mouse.

   Both degrade safely: with JavaScript off, <sk-tabs> shows every panel (the
   `hidden` attributes are added by script, not by Liquid) and <sk-quiz> simply
   shows nothing extra.
   ========================================================================== */

if (!customElements.get('sk-tabs')) {
  customElements.define(
    'sk-tabs',
    class SkTabs extends HTMLElement {
      connectedCallback() {
        this.tabs = Array.from(this.querySelectorAll('[role="tab"]'));
        this.panels = Array.from(this.querySelectorAll('[role="tabpanel"]'));
        if (!this.tabs.length) return;

        // Hide the non-active panels here rather than in Liquid, so a
        // no-JavaScript visitor sees all the content instead of one panel.
        this.select(this.tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true') || 0);

        this.tabs.forEach((tab, i) => {
          tab.addEventListener('click', () => this.select(i));
          tab.addEventListener('keydown', (e) => this.onKeydown(e, i));
        });
      }

      select(index) {
        if (index < 0 || index >= this.tabs.length) index = 0;

        this.tabs.forEach((tab, i) => {
          const selected = i === index;
          tab.setAttribute('aria-selected', selected ? 'true' : 'false');
          tab.setAttribute('tabindex', selected ? '0' : '-1');
        });

        this.panels.forEach((panel, i) => {
          panel.hidden = i !== index;
        });
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

        let next = keys[event.key];
        if (next < 0) next = this.tabs.length - 1;
        if (next >= this.tabs.length) next = 0;

        this.select(next);
        this.tabs[next].focus();
      }
    }
  );
}

if (!customElements.get('sk-quiz')) {
  customElements.define(
    'sk-quiz',
    class SkQuiz extends HTMLElement {
      connectedCallback() {
        this.result = this.querySelector('[data-sk-quiz-result]');
        this.options = Array.from(this.querySelectorAll('[data-sk-quiz-option]'));

        this.options.forEach((btn) => {
          btn.addEventListener('click', () => this.choose(btn));
        });
      }

      choose(btn) {
        this.options.forEach((o) => o.setAttribute('aria-pressed', o === btn ? 'true' : 'false'));
        if (!this.result) return;

        const text = btn.dataset.resultText || '';
        const url = btn.dataset.resultUrl || '';
        const label = btn.dataset.resultLabel || '';

        this.result.innerHTML = '';

        if (text) {
          const p = document.createElement('p');
          p.textContent = text;
          p.style.margin = '0 0 1.2rem';
          this.result.appendChild(p);
        }

        if (url && label) {
          const a = document.createElement('a');
          a.className = 'sk-btn sk-btn--hero';
          a.href = url;
          a.textContent = label;
          this.result.appendChild(a);
        }

        this.result.hidden = !(text || url);
      }
    }
  );
}
