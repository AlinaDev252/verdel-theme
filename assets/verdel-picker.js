if (!customElements.get('verdel-picker')) {
  customElements.define(
    'verdel-picker',
    class VerdelPicker extends HTMLElement {
      connectedCallback() {
        this.dialog = this.querySelector('dialog');
        this.heading = this.querySelector('#VerdelPickerHeading');
        this.back = this.querySelector('[data-verdel-picker-back]');
        this.body = this.querySelector('.verdel-picker__body');
        this.error = this.querySelector('[data-verdel-picker-error]');
        this.count = this.querySelector('[data-verdel-quiz-count]');
        this.form = this.querySelector('[data-verdel-quiz]');
        this.steps = [...this.querySelectorAll('[data-verdel-quiz-step]')];
        this.resultSlot = this.querySelector('[data-verdel-quiz-result-slot]');
        this.root = window.Shopify.routes.root;
        const data = JSON.parse(document.querySelector('[data-verdel-quiz-goals]').textContent);
        this.goals = data.goals;
        this.base = data.base;
        this.handles = this.goals.map((goal) => goal.handle);
        this.pages = new Map();

        this.onOpenClick = (event) => {
          if (!event.target.closest('[data-verdel-picker-open]')) return;
          event.preventDefault();
          this.navigate('#quiz=');
        };
        this.onPopState = () => this.sync();
        document.addEventListener('click', this.onOpenClick);
        window.addEventListener('popstate', this.onPopState);
        this.addEventListener('click', (event) => this.onClick(event));
        this.form.addEventListener('change', () => this.updateControls());
        this.dialog.addEventListener('close', () => this.onClose());
        this.sync();
      }

      disconnectedCallback() {
        document.removeEventListener('click', this.onOpenClick);
        window.removeEventListener('popstate', this.onPopState);
      }

      navigate(hash) {
        history.pushState({ ...history.state, quiz: (history.state?.quiz || 0) + 1 }, '', hash);
        this.sync();
      }

      sync() {
        const state = VerdelQuiz.parseHash(location.hash, this.handles);
        if (this.restarting) {
          this.restarting = false;
          this.navigate('#quiz=');
          return;
        }
        if (this.closing) {
          this.closing = false;
          if (state) history.replaceState(history.state, '', location.pathname + location.search);
          return;
        }
        if (!state) {
          if (this.dialog.open) this.dialog.close();
          return;
        }
        if (!this.dialog.open) this.dialog.showModal();
        this.render(state);
      }

      onClose() {
        this.request = null;
        const depth = history.state?.quiz || 0;
        if (depth) {
          this.closing = true;
          history.go(-depth);
        } else if (location.hash.startsWith('#quiz=')) {
          history.replaceState(history.state, '', location.pathname + location.search);
        }
      }

      onClick(event) {
        const next = event.target.closest('[data-verdel-quiz-next]');
        if (event.target === this.dialog || event.target.closest('[data-verdel-picker-close]')) {
          this.dialog.close();
        } else if (event.target.closest('[data-verdel-picker-back]')) {
          history.back();
        } else if (event.target.closest('[data-verdel-quiz-restart]')) {
          this.form.reset();
          const depth = history.state?.quiz || 0;
          if (depth) {
            this.restarting = true;
            history.go(-depth);
          } else {
            this.navigate('#quiz=');
          }
        } else if (next) {
          const step = Number(next.closest('[data-verdel-quiz-step]').dataset.verdelQuizStep);
          this.navigate(
            VerdelQuiz.toHash({
              goals: this.checked('goal'),
              diet: step > 1 ? this.form.elements.diet.value : null,
              multi: step > 2 ? this.form.elements.multi.value : null,
            })
          );
        }
      }

      checked(name) {
        return [...this.form.querySelectorAll(`[name="${name}"]:checked`)].map((input) => input.value);
      }

      updateControls() {
        const goals = this.checked('goal');
        this.form.querySelectorAll('[name="goal"]').forEach((input) => {
          input.disabled = !input.checked && goals.length >= 2;
        });
        const [first, second, third] = this.form.querySelectorAll('[data-verdel-quiz-next]');
        first.disabled = !goals.length;
        second.disabled = !this.form.elements.diet.value;
        third.disabled = !this.form.elements.multi.value;
      }

      render(state) {
        this.error.textContent = '';
        this.request = null;
        this.form.querySelectorAll('[name="goal"]').forEach((input) => {
          input.checked = state.goals.includes(input.value);
        });
        ['diet', 'multi'].forEach((name) => {
          if (state[name]) this.form.elements[name].value = state[name];
        });
        this.updateControls();
        if (state.step === 4) this.showResult(state);
        else this.show(state.step);
      }

      show(step) {
        this.steps.forEach((pane, index) => {
          pane.hidden = index + 1 !== step;
        });
        this.heading.textContent = step === 4 ? 'Your stack' : this.steps[step - 1].querySelector('legend').textContent;
        this.count.hidden = step === 4;
        this.count.textContent = `Step ${step} of 3`;
        this.back.hidden = step === 1;
        this.body.scrollTop = 0;
        this.heading.focus();
      }

      load(url) {
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

      async showResult(state) {
        const picks = VerdelQuiz.pickStack({ ...state, goals: this.goals, chosen: state.goals, base: this.base });
        const terms = `${picks.map((pick) => pick.handle).join(',')}/${state.multi}/${this.base.handle}`;
        const url = `${this.root}search?type=product&q=${encodeURIComponent(terms)}&section_id=verdel-quiz-result`;
        const next = this.steps[2].querySelector('[data-verdel-quiz-next]');
        this.request = url;
        if (this.steps[2].hidden) this.show(3);
        next.disabled = true;
        next.setAttribute('aria-busy', 'true');

        try {
          const html = await this.load(url);
          if (this.request !== url) return;
          const result = new DOMParser().parseFromString(html, 'text/html').querySelector('[data-verdel-quiz-result]');
          picks.forEach((pick) => {
            const reason = result.querySelector(`[data-verdel-quiz-pick="${pick.handle}"] [data-verdel-quiz-reason]`);
            if (reason) reason.textContent = pick.reason;
          });
          this.resultSlot.replaceChildren(result);
          this.show(4);
        } catch {
          if (this.request !== url) return;
          const link = document.createElement('a');
          link.href = `${this.root}collections/all-formulas`;
          link.textContent = 'See all formulas';
          this.error.replaceChildren(`${window.cartStrings.error} `, link);
        } finally {
          next.removeAttribute('aria-busy');
          this.updateControls();
        }
      }
    }
  );
}
