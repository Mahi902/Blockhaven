// A wink and a thumbs up.
export default {
  pose(t, P, fx) {
    const k = Math.min(1, t / 0.3, (2.2 - t) / 0.3), bob = Math.abs(Math.sin(t * 6)) * (t > 0.5 && t < 1.7 ? 1.5 : 0);
    return { y: -bob, arms: { r: { a: 0.12 + 0.6 * k, f: 2.3 * k, hand: 'thumb' } }, face: { eyes: 'wink', mouth: 'grin', blush: true } };
  },
  draw(c, P, t, fx) {
    if (t < 0.6 || t > 1.6) return;
    const p = (t - 0.6) / 1;
    fx.shape(c, 'spark', P.x + 28, P.y - 44 - p * 6, 12, '#fde047', Math.sin(p * Math.PI), p * 2);
  },
};
