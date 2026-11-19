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

        this.onPlanChange = (event) => {
          if (event.target.name === 'selling_plan') this.syncPlanPrice();
        };
        document.addEventListener('change', this.onPlanChange);

        if (typeof subscribe === 'function') {
          this.unsubscribe = subscribe(PUB_SUB_EVENTS.variantChange, (event) => this.onVariantChange(event));
        }

        this.syncPlanPrice();
      }

      disconnectedCallback() {
        if (this.observer) this.observer.disconnect();
        if (this.unsubscribe) this.unsubscribe();
        if (this.onPlanChange) document.removeEventListener('change', this.onPlanChange);
      }

      onVariantChange({ data }) {
        if (!data || !data.html || this.dataset.formId !== `product-form-${data.sectionId}`) return;
        const fresh = data.html.querySelector('verdel-sticky-buy');
        if (!fresh) return;

        this.querySelector('.verdel-sticky-buy__text').innerHTML =
          fresh.querySelector('.verdel-sticky-buy__text').innerHTML;
        const freshButton = fresh.querySelector('button');
        this.button.textContent = freshButton.textContent;
        this.button.disabled = freshButton.disabled;
        queueMicrotask(() => this.syncPlanPrice());
      }

      syncPlanPrice() {
        const chosen = document.querySelector('verdel-subscribe input[name="selling_plan"]:checked');
        const price = chosen && chosen.closest('label').querySelector('.verdel-subscribe__price');
        if (price) this.querySelector('[data-sticky-price]').textContent = price.textContent;
      }

      toggle(visible) {
        if (!visible && this.contains(document.activeElement)) this.mainButton.focus();
        this.classList.toggle('is-visible', visible);
        this.inert = !visible;
      }
    }
  );
}
