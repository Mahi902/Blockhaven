// Wobbling about with stars circling your head.
export default {
  pose(t, P, fx) {
    const k = Math.min(1, t / 0.2, (3 - t) / 0.4);
    return { x: Math.sin(t * 5) * 5 * k, rot: Math.sin(t * 5) * 0.16 * k };
  },
  draw(c, P, t, fx) {
    const k = Math.min(1, t / 0.2, (3 - t) / 0.4);
    for (let i = 0; i < 3; i++) {
      const a = t * 5 + i * 2.094;
      fx.emoji(c, '⭐', P.x + Math.cos(a) * 20, P.y - 42 + Math.sin(a) * 6, 12, k);
    }
  },
};
