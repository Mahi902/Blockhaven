// Bouncy dance until you move. Arms pump in turns, hips sway.
export default {
  pose(t) {
    const s = Math.sin(t * 6);
    return {
      x: Math.sin(t * 3) * 3, y: -Math.abs(s) * 5, rot: s * 0.1, sy: 1 + Math.abs(Math.cos(t * 6)) * 0.03,
      arms: { l: { a: 2.2 + s * 0.7, f: s * 0.4 }, r: { a: 2.2 - s * 0.7, f: -s * 0.4 } },
    };
  },
  draw(c, P, t, fx) {
    for (let i = 0; i < 2; i++) { const p = ((t * 0.7 + i * 0.5) % 1); fx.shape(c, 'note', P.x + (i ? 26 : -26), P.y - 36 - p * 30, 15, i ? '#38bdf8' : '#c084fc', 1 - p, (i ? 1 : -1) * 0.2); }
  },
};
