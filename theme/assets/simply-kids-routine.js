/* Simply Kids — age routine picker.
   Progressive enhancement: without JS the first result stays visible and every
   option is a normal in-page control, so the section is still readable. */
if (!customElements.get('sk-routine-picker')) {
  customElements.define(
    'sk-routine-picker',
    class SkRoutinePicker extends HTMLElement {
      connectedCallback() {
        this.options = Array.from(this.querySelectorAll('[data-sk-routine-option]'));
        this.panels = Array.from(this.querySelectorAll('[data-sk-routine-panel]'));
        if (this.options.length === 0) return;

        this.options.forEach((option) => {
          option.addEventListener('click', this.onSelect.bind(this));
          option.addEventListener('keydown', this.onKeydown.bind(this));
        });

        const active = this.options.findIndex((option) => option.getAttribute('aria-selected') === 'true');
        this.select(active === -1 ? 0 : active);
      }

      onSelect(event) {
        this.select(this.options.indexOf(event.currentTarget));
      }

      onKeydown(event) {
        const keys = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 };
        const step = keys[event.key];
        if (!step) return;
        event.preventDefault();
        const current = this.options.indexOf(event.currentTarget);
        const next = (current + step + this.options.length) % this.options.length;
        this.select(next);
        this.options[next].focus();
      }

      select(index) {
        this.options.forEach((option, i) => {
          const selected = i === index;
          option.setAttribute('aria-selected', selected ? 'true' : 'false');
          option.setAttribute('tabindex', selected ? '0' : '-1');
        });
        this.panels.forEach((panel, i) => {
          panel.hidden = i !== index;
        });
      }
    }
  );
}
