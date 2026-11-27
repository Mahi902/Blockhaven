// Hand over the face. Oh no.
export default {
  pose(t, P, fx) {
    const k = Math.min(1, t / 0.4, (2.6 - t) / 0.4);
    return { rot: -0.05 * k, sy: 1 - 0.03 * k, arms: { r: { a: 0.12 + 2.3 * k, f: 1.8 * k, hand: 'open' } }, face: { eyes: 'closed', mouth: 'frown', brows: 'sad', blush: false } };
  },
  draw(c, P, t, fx) {
    if (t < 0.6) return;
    const p = ((t - 0.6) * 0.7) % 1;
    fx.shape(c, 'drop', P.x - 18, P.y - 44 + p * 12, 8, '#60a5fa', 1 - p);
  },
};
