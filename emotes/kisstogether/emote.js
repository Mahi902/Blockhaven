// A sweet peck on the cheek: the asker leans in, the other blushes and smiles, hearts pop up.
export default {
  pose(t, P, fx, ctx) {
    const peck = fx.hump((t - 0.7) / 1.0);                      // 0 -> 1 -> 0 around the kiss
    if (ctx.role === 0) {
      return {
        x: ctx.fwd * 3 * peck, rot: ctx.fwd * 0.13 * peck,
        arms: { r: { a: 0.12 + 1.0 * peck, f: 0.4 * peck } },
        face: { eyes: 'closed', mouth: peck > 0.5 ? 'o' : 'smile', mo: 0.1, blush: true },
      };
    }
    return {
      rot: -ctx.fwd * 0.05 * peck, y: -1.5 * peck,
      arms: { r: { a: 0.12 + 0.5 * peck, f: 1.2 * peck, hand: 'fist' } },
      face: { eyes: peck > 0.3 ? 'closed' : 'open', mouth: 'smile', brows: 'up', blush: true },
    };
  },
  draw(c, P, t, fx, ctx) {
    if (ctx.role) return;
    if (t > 1.0 && t < 1.7) fx.text(c, 'mwah!', ctx.mid.x, ctx.mid.y - 64 - (t - 1.0) * 12, 13, '#fda4af', Math.sin(((t - 1.0) / 0.7) * Math.PI));
    if (t < 1.0) return;
    for (let i = 0; i < 4; i++) {
      const p = ((t - 1.0) * 0.6 + i * 0.25) % 1;
      fx.shape(c, 'heart', ctx.mid.x + Math.sin(p * 6 + i * 1.7) * 11, ctx.mid.y - 34 - p * 34, 9 + 6 * (1 - p), '#f43f5e', (1 - p) * Math.min(1, (3.2 - t) / 0.4));
    }
  },
};
