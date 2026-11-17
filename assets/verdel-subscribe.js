if (!customElements.get('verdel-subscribe')) {
  customElements.define(
    'verdel-subscribe',
    class VerdelSubscribe extends HTMLElement {
      connectedCallback() {
        if (typeof subscribe !== 'function') return;
        this.unsubscribe = subscribe(PUB_SUB_EVENTS.variantChange, (event) => this.onVariantChange(event));
      }

      disconnectedCallback() {
        if (this.unsubscribe) this.unsubscribe();
      }

      onVariantChange(event) {
        const data = event.data;
        if (!data || data.sectionId !== this.dataset.sectionId || !data.html) return;

        const fresh = data.html.querySelector(`verdel-subscribe[data-section-id="${this.dataset.sectionId}"]`);
        if (!fresh) return;

        const chosen = this.querySelector('input[name="selling_plan"]:checked');
        this.innerHTML = fresh.innerHTML;

        if (!chosen || !chosen.value) return;
        const match = this.querySelector(`input[name="selling_plan"][value="${chosen.value}"]`);
        if (match) match.checked = true;
      }
    }
  );
}
