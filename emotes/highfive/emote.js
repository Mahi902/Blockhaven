// Both raise a hand and slap them together with a flash.
export default {
  pose(t, P, fx, ctx) {
    const swing = t < 1 ? fx.clamp(t / 1) : 1, hit = t >= 1.15 && t < 1.6;
    return {
      y: hit ? -3 : 0, sy: hit ? 1.03 : 1,
      arms: { r: { a: 0.12 + 1.98 * swing, f: 0, hand: 'open' } },
      face: { eyes: 'happy', mouth: 'grin', blush: true },
    };
  },
  draw(c, P, t, fx, ctx) {
    if (ctx.role || t < 1.12 || t > 1.7) return;
    const p = (t - 1.12) / 0.58;
    fx.shape(c, 'spark', ctx.mid.x, ctx.mid.y - 16, 16 + 18 * p, '#fde047', 1 - p, p * 2);
    fx.shape(c, 'spark', ctx.mid.x - 10, ctx.mid.y - 26, 9 + 9 * p, '#ffffff', 1 - p, -p * 2);
  },
};
