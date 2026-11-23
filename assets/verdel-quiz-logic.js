(() => {
  const DIETS = ['plant', 'mostly', 'neither'];
  const MULTI = ['yes', 'no'];

  const parseHash = (hash, goalHandles) => {
    if (!hash || !hash.startsWith('#quiz=')) return null;
    const [goalPart = '', dietPart, multiPart] = hash.slice(6).split('/');
    const goals = [...new Set(goalPart.split(',').filter((handle) => goalHandles.includes(handle)))].slice(0, 2);
    const diet = goals.length && DIETS.includes(dietPart) ? dietPart : null;
    const multi = diet && MULTI.includes(multiPart) ? multiPart : null;
    const step = !goals.length ? 1 : !diet ? 2 : !multi ? 3 : 4;
    return { step, goals, diet, multi };
  };

  const toHash = ({ goals, diet, multi }) => `#quiz=${[goals.join(','), diet, multi].filter(Boolean).join('/')}`;

  const pickStack = ({ goals, chosen, diet, multi, base }) => {
    const picks = [];
    const taken = (handle) => picks.some((pick) => pick.handle === handle);
    const allowed = (product) =>
      product.available && !taken(product.handle) && !(multi === 'yes' && product.handle === base.handle);

    chosen.slice(0, 2).forEach((handle) => {
      const goal = goals.find((item) => item.handle === handle);
      if (!goal) return;
      const ordered = [
        ...goal.products.filter((product) => product.handle === goal.lead),
        ...goal.products.filter((product) => product.handle !== goal.lead),
      ];
      const product = ordered.find(allowed);
      if (product) picks.push({ handle: product.handle, reason: `For ${goal.title.toLowerCase()}` });
    });

    if (diet === 'plant' && multi === 'no' && base && allowed(base)) {
      picks.push({ handle: base.handle, reason: 'Base for a fully plant-based diet' });
    }

    return picks.slice(0, 3);
  };

  const api = { parseHash, toHash, pickStack };
  if (typeof module !== 'undefined') module.exports = api;
  else window.VerdelQuiz = api;
})();
