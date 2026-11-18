if (!customElements.get('verdel-pair')) {
  customElements.define(
    'verdel-pair',
    class VerdelPair extends HTMLElement {
      connectedCallback() {
        const select = this.querySelector('select[name="id"]');
        const price = this.querySelector('[data-pair-price]');
        if (!select || !price) return;
        select.addEventListener('change', () => {
          price.textContent = select.selectedOptions[0].dataset.price;
        });
      }
    }
  );
}
