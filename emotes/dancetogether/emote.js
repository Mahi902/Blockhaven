// Face to face, bouncing in turns with arms swinging.
export default {
  pose(t, P, fx, ctx) {
    const ph = t * 6 + ctx.role * Math.PI, s = Math.sin(ph), k = Math.min(1, t / 0.5, (5 - t) / 0.5);
    return {
      y: -Math.abs(s) * 5 * k, rot: s * 0.07 * k, sy: 1 + Math.abs(Math.cos(ph)) * 0.03 * k,
      arms: { r: { a: 0.12 + (1.3 + s * 0.8) * k, f: s * 0.4 * k }, l: { a: 0.12 + (1.3 - s * 0.8) * k } },
      face: { eyes: 'happy', mouth: 'grin', blush: true },
    };
  },
  draw(c, P, t, fx, ctx) {
    if (ctx.role) return;
    for (let i = 0; i < 3; i++) { const p = ((t * 0.5 + i / 3) % 1); fx.shape(c, 'note', ctx.mid.x + (i - 1) * 18, ctx.mid.y - 40 - p * 30, 14, ['#c084fc', '#38bdf8', '#4ade80'][i], 1 - p, (i - 1) * 0.25); }
  },
};
