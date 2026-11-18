if (!customElements.get('verdel-sticky-buy')) {
  customElements.define(
    'verdel-sticky-buy',
    class VerdelStickyBuy extends HTMLElement {
      connectedCallback() {
        const form = document.getElementById(this.dataset.formId);
        this.mainButton = form && form.querySelector('[name="add"]');
        if (!this.mainButton) return;

        this.button = this.querySelector('button');
        this.button.addEventListener('click', () => this.mainButton.click());

        this.observer = new IntersectionObserver(([entry]) => this.toggle(!entry.isIntersecting), {
          root: document,
          rootMargin: '0px 0px 100000px 0px',
        });
        this.observer.observe(this.mainButton);
      }

      disconnectedCallback() {
        if (this.observer) this.observer.disconnect();
      }

      toggle(visible) {
        this.button.disabled = this.mainButton.disabled;
        this.classList.toggle('is-visible', visible);
        this.inert = !visible;
      }
    }
  );
}
