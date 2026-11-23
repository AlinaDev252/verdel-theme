(() => {
  const renderBag = (state, sections) => {
    sections.forEach((section) => {
      const target = document.getElementById(section.id).querySelector(section.selector) || document.getElementById(section.id);
      const fresh = new DOMParser().parseFromString(state.sections[section.section], 'text/html');
      target.innerHTML = fresh.querySelector(section.selector).innerHTML;
    });
  };

  const send = async (button, url, payload) => {
    const items = document.querySelector('cart-drawer-items');
    const sections = items.getSectionsToRender();
    const errors =
      button.closest('verdel-quiz')?.querySelector('[data-verdel-quiz-error]') ||
      document.getElementById('CartDrawer-CartErrors');
    const focusKey = button.dataset.line
      ? `[data-line="${button.dataset.line}"]`
      : button.dataset.verdelAdd && `[data-verdel-add="${button.dataset.verdelAdd}"]`;
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    errors.textContent = '';

    try {
      const response = await fetch(url, {
        ...fetchConfig(),
        body: JSON.stringify({
          ...payload,
          sections: sections.map((section) => section.section),
          sections_url: window.location.pathname,
        }),
      });
      const state = await response.json();
      if (!response.ok) throw new Error(state.description);
      renderBag(state, sections);
      const drawer = document.querySelector('cart-drawer');
      drawer.classList.toggle('is-empty', state.item_count === 0);
      publish(PUB_SUB_EVENTS.cartUpdate, { source: 'cart-items', cartData: state });

      if (!drawer.classList.contains('active')) {
        drawer.open(button);
      } else {
        trapFocus(drawer, (focusKey && drawer.querySelector(focusKey)) || drawer.querySelector('.drawer__inner'));
      }
    } catch (error) {
      button.disabled = false;
      button.removeAttribute('aria-busy');
      errors.textContent = (error.name === 'Error' && error.message) || window.cartStrings.error;
    }
  };

  document.addEventListener('click', (event) => {
    const plan = event.target.closest('[data-verdel-plan]');
    const add = event.target.closest('[data-verdel-add]');
    const stack = event.target.closest('[data-verdel-add-stack]');
    const arrow = event.target.closest('[data-verdel-scroll]');

    if (plan) {
      send(plan, routes.cart_change_url, {
        line: Number(plan.dataset.line),
        quantity: Number(plan.dataset.quantity),
        selling_plan: plan.dataset.verdelPlan ? Number(plan.dataset.verdelPlan) : null,
      });
    } else if (add) {
      send(add, routes.cart_add_url, { items: [{ id: Number(add.dataset.verdelAdd), quantity: 1 }] });
    } else if (stack) {
      send(stack, routes.cart_add_url, {
        items: stack.dataset.verdelAddStack.split(',').map((id) => ({ id: Number(id), quantity: 1 })),
      });
    } else if (arrow) {
      const track = arrow.closest('.verdel-bag-picks').querySelector('.verdel-bag-picks__track');
      track.scrollBy({
        left: Number(arrow.dataset.verdelScroll) * track.clientWidth * 0.85,
        behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      });
    }
  });
})();
