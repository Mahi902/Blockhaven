// Standing tall with a crisp salute.
export default {
  pose(t) {
    const k = Math.min(1, t / 0.25, (2.2 - t) / 0.25);
    return { sy: 1 + 0.03 * k, arms: { r: { a: 0.12 + 2.0 * k, f: 1.9 * k, hand: 'open' } }, face: { eyes: 'open', mouth: 'flat', brows: 'flat', blush: false } };
  },
};
