// Pull the fist back, then bump.
export default {
  pose(t, P, fx, ctx) {
    const back = fx.hump((t - 0.4) / 0.6), a = t < 0.4 ? 0.12 + 1.38 * (t / 0.4) : 1.5 - 0.35 * back + (t > 1.0 ? 0 : 0);
    const bump = t >= 1.0 && t < 1.3;
    return {
      x: ctx.fwd * (bump ? 1.5 : 0), rot: ctx.fwd * (bump ? 0.04 : -0.02 * back),
      arms: { r: { a: Math.min(1.5, a), f: 0, hand: 'fist' } },
      face: { eyes: 'open', mouth: 'smirk', brows: 'flat' },
    };
  },
  draw(c, P, t, fx, ctx) {
    if (ctx.role || t < 1.0 || t > 1.6) return;
    const p = (t - 1.0) / 0.6;
    for (let i = 0; i < 5; i++) { const a = i * 1.2566 + 0.4; fx.shape(c, 'star', ctx.mid.x + Math.cos(a) * (6 + 16 * p), ctx.mid.y - 14 + Math.sin(a) * (6 + 16 * p), 8, '#fde047', 1 - p, a + p * 3); }
  },
};
