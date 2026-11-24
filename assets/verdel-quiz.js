if (!customElements.get('verdel-quiz')) {
  customElements.define(
    'verdel-quiz',
    class VerdelQuizPage extends HTMLElement {
      connectedCallback() {
        this.intro = this.querySelector('[data-verdel-quiz-intro]');
        this.flow = this.querySelector('[data-verdel-quiz-flow]');
        this.heading = this.querySelector('#VerdelQuizHeading');
        this.count = this.querySelector('[data-verdel-quiz-count]');
        this.error = this.querySelector('[data-verdel-quiz-error]');
        this.form = this.querySelector('[data-verdel-quiz-form]');
        this.steps = [...this.querySelectorAll('[data-verdel-quiz-step]')];
        this.resultSlot = this.querySelector('[data-verdel-quiz-result-slot]');
        this.root = window.Shopify.routes.root;
        const data = JSON.parse(document.querySelector('[data-verdel-quiz-goals]').textContent);
        this.goals = data.goals;
        this.base = data.base;
        this.handles = this.goals.map((goal) => goal.handle);
        this.pages = new Map();

        this.onPopState = () => this.sync();
        window.addEventListener('popstate', this.onPopState);
        this.addEventListener('click', (event) => this.onClick(event));
        this.form.addEventListener('change', () => this.updateControls());
        this.sync(true);
      }

      disconnectedCallback() {
        window.removeEventListener('popstate', this.onPopState);
      }

      navigate(hash) {
        history.pushState({ ...history.state, quiz: (history.state?.quiz || 0) + 1 }, '', hash);
        this.sync();
      }

      sync(initial = false) {
        if (this.restarting) {
          this.restarting = false;
          this.navigate('#quiz=');
          return;
        }
        if (location.hash && !location.hash.startsWith('#quiz=')) return;
        const state = VerdelQuiz.parseHash(location.hash, this.handles);
        if (!state) {
          this.showIntro(initial);
          return;
        }
        this.render(state);
      }

      onClick(event) {
        const next = event.target.closest('[data-verdel-quiz-next]');
        if (event.target.closest('[data-verdel-quiz-start]')) {
          event.preventDefault();
          this.navigate('#quiz=');
        } else if (event.target.closest('[data-verdel-quiz-back]')) {
          this.back();
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
          const hash = VerdelQuiz.toHash({
            goals: this.checked('goal'),
            diet: step > 1 ? this.form.elements.diet.value : null,
            multi: step > 2 ? this.form.elements.multi.value : null,
          });
          if (hash === location.hash) this.sync();
          else this.navigate(hash);
        } else if (event.target.closest('[data-verdel-add-stack]') && !document.querySelector('cart-drawer')) {
          this.addAndGoToCart(event.target.closest('[data-verdel-add-stack]'));
        }
      }

      async addAndGoToCart(button) {
        button.disabled = true;
        button.setAttribute('aria-busy', 'true');
        this.error.textContent = '';
        try {
          const response = await fetch(window.routes.cart_add_url, {
            ...fetchConfig(),
            body: JSON.stringify({
              items: button.dataset.verdelAddStack.split(',').map((id) => ({ id: Number(id), quantity: 1 })),
            }),
          });
          const state = await response.json();
          if (!response.ok) throw new Error(state.description);
          window.location.href = window.routes.cart_url;
        } catch (error) {
          button.disabled = false;
          button.removeAttribute('aria-busy');
          this.error.textContent = (error.name === 'Error' && error.message) || window.cartStrings.error;
        }
      }

      back() {
        if (history.state?.quiz) {
          history.back();
          return;
        }
        const { step, goals, diet } = VerdelQuiz.parseHash(location.hash, this.handles);
        const previous = [
          location.pathname + location.search,
          '#quiz=',
          VerdelQuiz.toHash({ goals }),
          VerdelQuiz.toHash({ goals, diet }),
        ][step - 1];
        history.replaceState(history.state, '', previous);
        this.sync();
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

      showIntro(initial) {
        this.request = null;
        this.error.textContent = '';
        this.classList.remove('is-active');
        this.intro.hidden = false;
        this.flow.hidden = true;
        if (!initial) this.focus(this.intro.querySelector('h1'));
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
        this.classList.add('is-active');
        this.intro.hidden = true;
        this.flow.hidden = false;
        this.steps.forEach((pane, index) => {
          pane.hidden = index + 1 !== step;
        });
        this.heading.textContent = step === 4 ? 'Your formulas' : this.steps[step - 1].querySelector('legend').textContent;
        this.count.hidden = step === 4;
        this.count.textContent = `Step ${step} of 3`;
        this.focus(this.heading);
      }

      focus(target) {
        target.focus({ preventScroll: true });
        if (this.getBoundingClientRect().top < 0) this.scrollIntoView({ block: 'start' });
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
        if (this.flow.hidden || this.steps[2].hidden) this.show(3);
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
