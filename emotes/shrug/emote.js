// Palms up, shoulders bouncing: who knows?
export default {
  pose(t) {
    const k = Math.min(1, t / 0.25, (2.2 - t) / 0.25), s = Math.max(0, Math.sin(t * 7));
    return { y: -s * 2.5 * k, arms: { l: { a: 0.12 + 0.8 * k, f: 1.3 * k }, r: { a: 0.12 + 0.8 * k, f: 1.3 * k } } };
  },
  draw(c, P, t, fx) {
    const k = Math.min(1, t / 0.25, (2.2 - t) / 0.3);
    fx.text(c, '?', P.x, P.y - 88, 24 * Math.max(0, k) + 2, '#fde047', Math.max(0, k));
  },
};
