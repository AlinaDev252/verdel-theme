if (!customElements.get('verdel-shop-panel')) {
  customElements.define(
    'verdel-shop-panel',
    class VerdelShopPanel extends HTMLElement {
      connectedCallback() {
        this.tabs = [...this.querySelectorAll('.verdel-shop__tab')];
        this.tabs.forEach((tab) => {
          tab.addEventListener('click', () => this.show(tab));
          tab.addEventListener('pointerenter', (event) => {
            if (event.pointerType !== 'mouse') return;
            clearTimeout(this.timer);
            this.timer = setTimeout(() => this.show(tab), 120);
          });
          tab.addEventListener('pointerleave', () => clearTimeout(this.timer));
        });
      }

      disconnectedCallback() {
        clearTimeout(this.timer);
      }

      show(active) {
        this.tabs.forEach((tab) => {
          const isActive = tab === active;
          tab.setAttribute('aria-expanded', String(isActive));
          document.getElementById(tab.getAttribute('aria-controls')).hidden = !isActive;
        });
      }
    }
  );
}
