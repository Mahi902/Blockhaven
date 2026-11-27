// Both bow politely to each other.
export default {
  pose(t, P, fx, ctx) {
    const b = Math.max(0, Math.min(1, t / 0.6, (2.8 - t) / 0.6));
    return {
      rot: ctx.fwd * 0.1 * b, sy: 1 - 0.1 * b, y: b,
      arms: { r: { a: 0.12 + 0.2 * b }, l: { a: 0.12 + 0.2 * b } },
      face: b > 0.4 ? { eyes: 'closed', mouth: 'smile' } : { eyes: 'open', mouth: 'smile' },
    };
  },
  draw(c, P, t, fx, ctx) {
    if (ctx.role || t < 1.4 || t > 2.4) return;
    const p = (t - 1.4) / 1;
    fx.shape(c, 'spark', ctx.mid.x, ctx.mid.y - 36 - p * 8, 14, '#fde047', Math.sin(p * Math.PI), p * 2);
  },
};
