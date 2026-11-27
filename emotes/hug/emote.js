// Two players lean in and hug, swaying a little, with hearts floating up from between them.
export default {
  pose(t, P, fx, ctx) {
    const k = Math.min(1, t / 0.7, (3.4 - t) / 0.7);
    return {
      rot: ctx.fwd * 0.07 * k + Math.sin(t * 2.4) * 0.02 * k,
      arms: { r: { a: 0.12 + 1.8 * k, f: 0.35 * k }, l: { a: 0.12 + 1.65 * k, f: 0.3 * k } },
      face: { eyes: 'closed', mouth: 'smile', blush: true },
    };
  },
  draw(c, P, t, fx, ctx) {
    if (ctx.role) return;                                     // one of the two draws the shared effect
    const k = Math.min(1, (t - 0.6) / 0.4, (3.4 - t) / 0.5);
    if (k <= 0) return;
    for (let i = 0; i < 4; i++) {
      const p = ((t * 0.5 + i * 0.25) % 1);
      fx.shape(c, 'heart', ctx.mid.x + Math.sin(p * 6 + i * 1.7) * 10, ctx.mid.y - 30 - p * 36, 10 + 7 * (1 - p), '#ef4444', (1 - p) * k);
    }
  },
};
