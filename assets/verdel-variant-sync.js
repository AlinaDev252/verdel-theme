if (!customElements.get('verdel-variant-sync')) {
  customElements.define(
    'verdel-variant-sync',
    class VerdelVariantSync extends HTMLElement {
      connectedCallback() {
        if (typeof subscribe !== 'function') return;
        this.unsubscribe = subscribe(PUB_SUB_EVENTS.variantChange, ({ data }) => {
          if (!data || data.sectionId !== this.dataset.sectionId || !data.html) return;
          const fresh = data.html.querySelector(`verdel-variant-sync[data-key="${this.dataset.key}"]`);
          if (fresh) this.innerHTML = fresh.innerHTML;
        });
      }

      disconnectedCallback() {
        if (this.unsubscribe) this.unsubscribe();
      }
    }
  );
}
