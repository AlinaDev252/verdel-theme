if (!customElements.get('verdel-picker')) {
  customElements.define(
    'verdel-picker',
    class VerdelPicker extends HTMLElement {
      connectedCallback() {
        this.dialog = this.querySelector('dialog');
        this.heading = this.querySelector('#VerdelPickerHeading');
        this.goals = this.querySelector('[data-verdel-picker-goals]');
        this.results = this.querySelector('[data-verdel-picker-results]');
        this.back = this.querySelector('[data-verdel-picker-back]');
        this.body = this.querySelector('.verdel-picker__body');
        this.defaultHeading = this.heading.textContent;
        this.pages = new Map();

        this.onOpenClick = (event) => {
          if (!event.target.closest('[data-verdel-picker-open]')) return;
          event.preventDefault();
          this.showGoals();
          this.dialog.showModal();
        };
        document.addEventListener('click', this.onOpenClick);
        this.addEventListener('click', (event) => this.onClick(event));
      }

      disconnectedCallback() {
        document.removeEventListener('click', this.onOpenClick);
      }

      onClick(event) {
        const goal = event.target.closest('[data-verdel-picker-goal]');
        if (event.target === this.dialog || event.target.closest('[data-verdel-picker-close]')) {
          this.dialog.close();
        } else if (event.target.closest('[data-verdel-picker-back]')) {
          this.showGoals();
          this.lastGoal.focus();
        } else if (goal) {
          event.preventDefault();
          this.showResults(goal);
        }
      }

      showGoals() {
        this.request = null;
        this.goals.hidden = false;
        this.results.hidden = true;
        this.back.hidden = true;
        this.heading.textContent = this.defaultHeading;
        this.body.scrollTop = 0;
      }

      loadPage(goal) {
        const url = `${goal.pathname}?section_id=verdel-picker-results`;
        if (!this.pages.has(url)) {
          const page = fetch(url).then((response) => {
            if (!response.ok) throw new Error(response.statusText);
            return response.text();
          });
          page.catch(() => this.pages.delete(url));
          this.pages.set(url, page);
        }
        return this.pages.get(url);
      }

      async showResults(goal) {
        this.lastGoal = goal;
        this.request = goal;
        goal.setAttribute('aria-busy', 'true');

        try {
          const html = await this.loadPage(goal);
          if (this.request !== goal) return;
          const list = new DOMParser().parseFromString(html, 'text/html').querySelector('[data-verdel-picker-list]');
          this.results.replaceChildren(list);
          this.heading.textContent = list.dataset.title;
          this.goals.hidden = true;
          this.results.hidden = false;
          this.back.hidden = false;
          this.body.scrollTop = 0;
          this.heading.focus();
        } catch {
          window.location.href = goal.href;
        } finally {
          goal.removeAttribute('aria-busy');
        }
      }
    }
  );
}
