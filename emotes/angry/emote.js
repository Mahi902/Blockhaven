// Fists down, trembling, with a throbbing anger mark.
export default {
  pose(t, P, fx) {
    const k = Math.min(1, t / 0.15, (2.2 - t) / 0.3);
    return { face: { eyes: 'open', brows: 'angry', mouth: 'grit', blush: false }, x: Math.sin(t * 45) * 1.4 * k, sx: 1 + 0.04 * k, arms: { l: { a: 0.35, f: -0.2 }, r: { a: 0.35, f: -0.2 } } };
  },
  draw(c, P, t, fx) {
    const k = Math.min(1, t / 0.15, (2.2 - t) / 0.3);
    fx.shape(c, 'anger', P.x + 27, P.y - 36, (17 + Math.sin(t * 12) * 3) * Math.max(0, k) + 2, '#ef4444', Math.max(0, k));
  },
};
