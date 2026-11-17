if (!customElements.get('b2b-tier-pricing')) {
  customElements.define(
    'b2b-tier-pricing',
    class B2BTierPricing extends HTMLElement {
      connectedCallback() {
        if (typeof subscribe !== 'function' || !this.dataset.url) return;
        this.variantIds = (this.dataset.variantIds || '').split(',');
        this.unsubscribe = subscribe(PUB_SUB_EVENTS.variantChange, (event) => this.onVariantChange(event));
      }

      disconnectedCallback() {
        if (this.unsubscribe) this.unsubscribe();
        if (this.controller) this.controller.abort();
      }

      onVariantChange(event) {
        const variant = event.data && event.data.variant;
        if (!variant) return;

        const id = String(variant.id);
        if (id === this.dataset.variantId || !this.variantIds.includes(id)) return;

        this.dataset.variantId = id;
        this.render(id);
      }

      render(variantId) {
        if (this.controller) this.controller.abort();
        this.controller = new AbortController();

        const url = new URL(this.dataset.url, window.location.origin);
        url.searchParams.set('variant', variantId);
        url.searchParams.set('section_id', this.dataset.sectionId);

        this.setAttribute('aria-busy', 'true');

        fetch(url, { signal: this.controller.signal })
          .then((response) => response.text())
          .then((text) => {
            const html = new DOMParser().parseFromString(text, 'text/html');
            const fresh = html.querySelector('b2b-tier-pricing .page-width');
            const current = this.querySelector('.page-width');
            if (fresh && current) current.replaceWith(fresh);
            this.removeAttribute('aria-busy');
          })
          .catch((error) => {
            if (error.name !== 'AbortError') this.removeAttribute('aria-busy');
          });
      }
    }
  );
}
