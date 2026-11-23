const test = require('node:test');
const assert = require('node:assert/strict');
const { parseHash, toHash, pickStack } = require('../assets/verdel-quiz-logic.js');

const handles = ['sleep', 'focus', 'energy', 'daily-essentials', 'training'];
const baseHandle = 'no-12-daily-multi';
const base = { handle: baseHandle, available: true };
const product = (handle, available = true) => ({ handle, available });
const goals = () => [
  { handle: 'sleep', title: 'Sleep', lead: 'no-01-rest', products: [product('no-01-rest')] },
  { handle: 'focus', title: 'Focus', lead: 'no-02-focus', products: [product('no-02-focus')] },
  {
    handle: 'energy',
    title: 'Energy',
    lead: 'no-04-energy',
    products: [product('no-11-creatine'), product('no-10-hydrate'), product('no-04-energy')],
  },
  {
    handle: 'daily-essentials',
    title: 'Daily essentials',
    lead: 'no-06-sun',
    products: [product('no-05-greens'), product('no-06-sun'), product('no-07-omega'), product(baseHandle)],
  },
  {
    handle: 'training',
    title: 'Training',
    lead: 'no-11-creatine',
    products: [product('no-09-protein'), product('no-10-hydrate'), product('no-11-creatine')],
  },
];
const setAvailable = (list, handle, available) =>
  list.forEach((goal) => goal.products.forEach((p) => p.handle === handle && (p.available = available)));

test('parseHash reads a full answer set as the result step', () => {
  assert.deepEqual(parseHash('#quiz=sleep,focus/plant/no', handles), {
    step: 4,
    goals: ['sleep', 'focus'],
    diet: 'plant',
    multi: 'no',
  });
});

test('parseHash drops unknown values and stops at the first unanswered question', () => {
  assert.deepEqual(parseHash('#quiz=sleep,nope/vegan/x', handles), {
    step: 2,
    goals: ['sleep'],
    diet: null,
    multi: null,
  });
});

test('parseHash keeps at most two goals', () => {
  assert.deepEqual(parseHash('#quiz=sleep,focus,energy', handles).goals, ['sleep', 'focus']);
});

test('parseHash ignores a multivitamin answer when diet is missing', () => {
  assert.equal(parseHash('#quiz=sleep//no', handles).step, 2);
  assert.equal(parseHash('#quiz=sleep//no', handles).multi, null);
});

test('parseHash starts at step 1 for an empty quiz hash', () => {
  assert.equal(parseHash('#quiz=', handles).step, 1);
  assert.equal(parseHash('#quiz=garbage', handles).step, 1);
});

test('parseHash returns null for other hashes', () => {
  assert.equal(parseHash('#other', handles), null);
  assert.equal(parseHash('', handles), null);
});

test('toHash round-trips every valid hash', () => {
  for (const hash of ['#quiz=', '#quiz=sleep', '#quiz=sleep,focus/plant', '#quiz=sleep,focus/plant/no']) {
    assert.equal(toHash(parseHash(hash, handles)), hash);
  }
});

test('pickStack gives one formula per goal with a reason', () => {
  assert.deepEqual(pickStack({ goals: goals(), chosen: ['sleep', 'energy'], diet: 'neither', multi: 'no', base }), [
    { handle: 'no-01-rest', reason: 'For sleep' },
    { handle: 'no-04-energy', reason: 'For energy' },
  ]);
});

test('pickStack adds the base for a fully plant-based diet', () => {
  const picks = pickStack({ goals: goals(), chosen: ['sleep', 'energy'], diet: 'plant', multi: 'no', base });
  assert.equal(picks.length, 3);
  assert.deepEqual(picks[2], { handle: baseHandle, reason: 'Base for a fully plant-based diet' });
});

test('pickStack never adds the base for someone already taking a multivitamin', () => {
  const picks = pickStack({ goals: goals(), chosen: ['sleep', 'energy'], diet: 'plant', multi: 'yes', base });
  assert.ok(!picks.some((pick) => pick.handle === baseHandle));
});

test('pickStack skips the base as a goal lead when multivitamin is yes', () => {
  const list = goals();
  list[3].lead = baseHandle;
  const picks = pickStack({ goals: list, chosen: ['daily-essentials'], diet: 'neither', multi: 'yes', base });
  assert.deepEqual(picks, [{ handle: 'no-05-greens', reason: 'For daily essentials' }]);
});

test('pickStack falls through a sold-out lead to the next available product', () => {
  const list = goals();
  setAvailable(list, 'no-04-energy', false);
  const picks = pickStack({ goals: list, chosen: ['energy'], diet: 'neither', multi: 'no', base });
  assert.deepEqual(picks, [{ handle: 'no-11-creatine', reason: 'For energy' }]);
});

test('pickStack adds nothing for a goal with everything sold out', () => {
  const list = goals();
  ['no-04-energy', 'no-11-creatine', 'no-10-hydrate'].forEach((h) => setAvailable(list, h, false));
  const picks = pickStack({ goals: list, chosen: ['sleep', 'energy'], diet: 'neither', multi: 'no', base });
  assert.deepEqual(picks, [{ handle: 'no-01-rest', reason: 'For sleep' }]);
});

test('pickStack never picks the same formula twice', () => {
  const list = goals();
  list[2].lead = 'no-11-creatine';
  const picks = pickStack({ goals: list, chosen: ['energy', 'training'], diet: 'neither', multi: 'no', base });
  assert.deepEqual(picks, [
    { handle: 'no-11-creatine', reason: 'For energy' },
    { handle: 'no-09-protein', reason: 'For training' },
  ]);
});

test('pickStack keeps the goal reason when the base is already a goal pick', () => {
  const list = goals();
  list[3].lead = baseHandle;
  const picks = pickStack({ goals: list, chosen: ['daily-essentials'], diet: 'plant', multi: 'no', base });
  assert.deepEqual(picks, [{ handle: baseHandle, reason: 'For daily essentials' }]);
});

test('pickStack adds the base even when no chosen goal contains it', () => {
  const list = goals().filter((goal) => goal.handle !== 'daily-essentials');
  const picks = pickStack({ goals: list, chosen: ['sleep'], diet: 'plant', multi: 'no', base });
  assert.deepEqual(picks[1], { handle: baseHandle, reason: 'Base for a fully plant-based diet' });
});

test('pickStack skips a sold-out base', () => {
  const picks = pickStack({ goals: goals(), chosen: ['sleep'], diet: 'plant', multi: 'no', base: { handle: baseHandle, available: false } });
  assert.equal(picks.length, 1);
});
