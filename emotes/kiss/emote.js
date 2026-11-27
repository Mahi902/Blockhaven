// Hand to the lips, then a kiss flies off.
export default {
  pose(t, P, fx) {
    const to = Math.min(1, t / 0.4), fling = fx.clamp((t - 0.9) / 0.2), back = fx.clamp((t - 1.5) / 0.4);
    const a = (0.12 + 1.1 * to) + 0.7 * fling - 1.0 * back, f = 1.9 * to - 2.4 * fling + 2.0 * back;
    return { dir: to > 0.3 ? 'left' : undefined, arms: { r: { a, f, hand: 'open' } }, face: { eyes: 'wink', mouth: t < 0.9 ? 'o' : 'smile', mo: 0.1, blush: true } };
  },
  draw(c, P, t, fx) {
    if (t < 0.95 || t > 2.2) return;
    const p = (t - 0.95) / 1.25;
    for (let i = 0; i < 2; i++) { const q = Math.max(0, p - i * 0.18); fx.shape(c, 'heart', P.x - 14 - q * 40, P.y - 22 - q * 26 + Math.sin(q * 9) * 3, 9 + 5 * (1 - q), '#f43f5e', 1 - q); }
  },
};
