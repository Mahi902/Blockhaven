// Fists down, trembling, with a throbbing anger mark.
export default {
  pose(t, P, fx) {
    const k = Math.min(1, t / 0.15, (2.2 - t) / 0.3);
    return { x: Math.sin(t * 45) * 1.4 * k, sx: 1 + 0.04 * k, arms: { l: { a: 0.35, f: -0.2 }, r: { a: 0.35, f: -0.2 } } };
  },
  draw(c, P, t, fx) {
    const k = Math.min(1, t / 0.15, (2.2 - t) / 0.3);
    fx.emoji(c, '💢', P.x + 27, P.y - 36, (16 + Math.sin(t * 12) * 4) * Math.max(0, k) + 2, Math.max(0, k));
  },
};
