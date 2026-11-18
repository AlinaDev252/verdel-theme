if (!customElements.get('verdel-subscribe')) {
  customElements.define(
    'verdel-subscribe',
    class VerdelSubscribe extends HTMLElement {
      connectedCallback() {
        this.addEventListener('change', () => this.syncButton());
        this.syncButton();
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

        const match = chosen && chosen.value && this.querySelector(`input[name="selling_plan"][value="${chosen.value}"]`);
        if (match) match.checked = true;
        this.syncButton();
      }

      syncButton() {
        const form = document.getElementById(`product-form-${this.dataset.sectionId}`);
        const button = form && form.querySelector('[name="add"]');
        const label = button && button.querySelector('span');
        const chosen = this.querySelector('input[name="selling_plan"]:checked');
        if (!label || !chosen || button.disabled) return;

        const text = label.textContent.split(' · ')[0].trim();
        label.textContent = `${text} · ${chosen.closest('label').querySelector('.verdel-subscribe__price').textContent}`;
      }
    }
  );
}
