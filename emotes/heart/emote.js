// Arms curved over your head, hearts floating up.
export default {
  pose(t, P, fx) {
    const k = Math.min(1, t / 0.3, (2.8 - t) / 0.3);
    return { y: Math.sin(t * 5) * -1.5 * k, arms: { l: { a: 0.12 + 2.3 * k, f: 1.4 * k }, r: { a: 0.12 + 2.3 * k, f: 1.4 * k } } };
  },
  draw(c, P, t, fx) {
    const fade = Math.min(1, (2.8 - t) / 0.4);
    for (let i = 0; i < 5; i++) {
      const p = ((t * 0.55 + i * 0.2) % 1);
      fx.shape(c, 'heart', P.x + (i % 2 ? 1 : -1) * (24 + Math.sin(p * 6 + i * 2) * 6), P.y - 36 - p * 46, 11 + 8 * (1 - p), '#ef4444', (1 - p) * Math.max(0, fade));
    }
  },
};
