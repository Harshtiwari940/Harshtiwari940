/* Simply Kids — interactive widgets.
   Every widget is a custom element so it survives Shopify section re-renders
   in the theme editor without any extra wiring. */

/* ---- Age quiz: pick an age band, reveal the matching routine ---- */
if (!customElements.get('sk-age-quiz')) {
  customElements.define(
    'sk-age-quiz',
    class SkAgeQuiz extends HTMLElement {
      connectedCallback() {
        this.options = Array.from(this.querySelectorAll('.sk-quiz__opt'));
        this.result = this.querySelector('.sk-quiz__result');
        this.options.forEach((btn) => {
          btn.addEventListener('click', () => this.select(btn));
        });
        const preselected = this.options.find((b) => b.getAttribute('aria-pressed') === 'true');
        if (preselected) this.select(preselected);
      }

      select(btn) {
        this.options.forEach((b) => b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'));
        if (!this.result) return;
        const text = this.result.querySelector('.sk-quiz__result-text');
        const link = this.result.querySelector('.sk-quiz__result-link');
        if (text && btn.dataset.result) text.textContent = btn.dataset.result;
        if (link && btn.dataset.url) link.setAttribute('href', btn.dataset.url);
        this.result.classList.add('is-visible');
      }
    }
  );
}

/* ---- Routine builder: one tab per age stage ---- */
if (!customElements.get('sk-routine-builder')) {
  customElements.define(
    'sk-routine-builder',
    class SkRoutineBuilder extends HTMLElement {
      connectedCallback() {
        this.tabs = Array.from(this.querySelectorAll('.sk-routine-tab'));
        this.panels = Array.from(this.querySelectorAll('.sk-routine-panel'));
        this.tabs.forEach((tab, i) => {
          tab.addEventListener('click', () => this.show(i));
          tab.addEventListener('keydown', (e) => this.onKey(e, i));
        });
      }

      show(index) {
        this.tabs.forEach((tab, i) => {
          tab.setAttribute('aria-selected', i === index ? 'true' : 'false');
          tab.setAttribute('tabindex', i === index ? '0' : '-1');
        });
        this.panels.forEach((panel, i) => panel.classList.toggle('is-active', i === index));
      }

      onKey(event, index) {
        const keys = { ArrowRight: 1, ArrowLeft: -1 };
        if (!(event.key in keys)) return;
        event.preventDefault();
        const next = (index + keys[event.key] + this.tabs.length) % this.tabs.length;
        this.show(next);
        this.tabs[next].focus();
      }
    }
  );
}

/* ---- Date-of-birth care tip: maps a birthday to its age-stage advice ---- */
if (!customElements.get('sk-dob-tip')) {
  customElements.define(
    'sk-dob-tip',
    class SkDobTip extends HTMLElement {
      connectedCallback() {
        this.input = this.querySelector('input[type="date"]');
        this.button = this.querySelector('button');
        this.output = this.querySelector('.sk-spark-output');
        try {
          this.tips = JSON.parse(this.querySelector('script[type="application/json"]').textContent);
        } catch (e) {
          this.tips = [];
        }
        if (this.button) this.button.addEventListener('click', () => this.reveal());
      }

      reveal() {
        if (!this.output) return;
        if (!this.input || !this.input.value) {
          this.output.textContent = this.dataset.emptyMessage || 'Pick a date of birth first.';
          return;
        }
        const age = this.ageFrom(this.input.value);
        const match = this.tips.find((tip) => age >= tip.min && age <= tip.max);
        this.output.textContent = match
          ? match.text
          : this.dataset.outOfRangeMessage || 'Simply Kids is formulated for ages 4 to 12.';
      }

      ageFrom(value) {
        const dob = new Date(value);
        const now = new Date();
        let age = now.getFullYear() - dob.getFullYear();
        const monthDiff = now.getMonth() - dob.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) age -= 1;
        return age;
      }
    }
  );
}

/* ---- Creativity spark: a random drawing prompt, never the same one twice in a row ---- */
if (!customElements.get('sk-creativity-spark')) {
  customElements.define(
    'sk-creativity-spark',
    class SkCreativitySpark extends HTMLElement {
      connectedCallback() {
        this.output = this.querySelector('.sk-spark-output');
        this.button = this.querySelector('button');
        try {
          // Liquid's newline_to_br/split leaves stray newlines on each entry.
          this.ideas = JSON.parse(this.querySelector('script[type="application/json"]').textContent)
            .map((idea) => String(idea).trim())
            .filter(Boolean);
        } catch (e) {
          this.ideas = [];
        }
        this.lastIndex = -1;
        if (this.button) this.button.addEventListener('click', () => this.spark());
      }

      spark() {
        if (!this.output || !this.ideas.length) return;
        let index = this.lastIndex;
        if (this.ideas.length > 1) {
          while (index === this.lastIndex) index = Math.floor(Math.random() * this.ideas.length);
        } else {
          index = 0;
        }
        this.lastIndex = index;
        this.output.textContent = this.ideas[index];
      }
    }
  );
}
