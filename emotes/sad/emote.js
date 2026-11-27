// Shoulders slumped, a couple of tears.
export default {
  pose(t, P, fx) {
    const k = Math.min(1, t / 0.5, (3.2 - t) / 0.5);
    return { sy: 1 - 0.06 * k, y: 1 * k, arms: { l: { a: 0.08 }, r: { a: 0.08 } } };
  },
  draw(c, P, t, fx) {
    if (P.dir !== 'down') return;
    const fade = Math.min(1, t / 0.5, (3.2 - t) / 0.5);
    for (let i = 0; i < 2; i++) {
      const p = ((t * 1.1 + i * 0.5) % 1);
      fx.emoji(c, '💧', P.x + (i ? 7 : -7), P.y - 21 + p * 20, 8, (1 - p * 0.7) * Math.max(0, fade));
    }
  },
};
