// Peace sign, wink, big grin.
export default {
  pose(t, P, fx) {
    const k = Math.min(1, t / 0.3, (2.4 - t) / 0.3);
    return { y: -Math.abs(Math.sin(t * 5)) * 2 * k, rot: Math.sin(t * 5) * 0.03 * k, arms: { r: { a: 0.12 + 2.45 * k, f: -0.15 * k, hand: 'peace' } }, face: { eyes: 'wink', mouth: 'grin', blush: true } };
  },
  draw(c, P, t, fx) {
    for (let i = 0; i < 2; i++) { const p = ((t * 0.9 + i * 0.5) % 1); fx.shape(c, 'star', P.x + (i ? 30 : -26), P.y - 30 - p * 30, 11, '#fde047', 1 - p, p * 4); }
  },
};
