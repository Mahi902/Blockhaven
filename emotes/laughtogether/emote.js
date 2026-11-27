// Cracking up together, leaning back and holding bellies.
export default {
  pose(t, P, fx, ctx) {
    const k = Math.min(1, t / 0.3, (3.4 - t) / 0.4), ph = t * 15 + ctx.role * 1.3;
    return {
      y: -Math.abs(Math.sin(ph)) * 3 * k, rot: -ctx.fwd * 0.05 * k + Math.sin(ph * 0.8) * 0.04 * k,
      arms: { r: { a: 0.3, f: 0.9 * k }, l: { a: 0.3, f: 0.9 * k } },
      face: { eyes: 'squint', mouth: 'open', mo: 0.55 + 0.45 * Math.sin(ph), brows: 'up', blush: true },
    };
  },
  draw(c, P, t, fx, ctx) {
    const k = Math.min(1, t / 0.3, (3.4 - t) / 0.4);
    fx.text(c, ctx.role ? 'ha!' : 'ha ha!', P.x, P.y - 88 - Math.abs(Math.sin(t * 8 + ctx.role)) * 4, 14 * Math.max(0, k) + 2, '#fde047', Math.max(0, k));
  },
};
