if (!customElements.get('verdel-hero-picker')) {
  customElements.define(
    'verdel-hero-picker',
    class VerdelHeroPicker extends HTMLElement {
      connectedCallback() {
        this.tabs = [...this.querySelectorAll('[role="tab"]')];
        this.tabs.forEach((tab, index) => {
          tab.addEventListener('click', () => this.show(tab));
          tab.addEventListener('keydown', (event) => {
            const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
            if (!step) return;
            event.preventDefault();
            const next = this.tabs[(index + step + this.tabs.length) % this.tabs.length];
            this.show(next);
            next.focus();
          });
        });
        this.addEventListener('shopify:block:select', (event) => this.show(event.target));
      }

      show(active) {
        this.tabs.forEach((tab) => {
          const selected = tab === active;
          tab.setAttribute('aria-selected', String(selected));
          tab.tabIndex = selected ? 0 : -1;
          document.getElementById(tab.getAttribute('aria-controls')).dataset.active = String(selected);
        });
      }
    }
  );
}
