// Show off those muscles.
export default {
  pose(t, P, fx) {
    const k = Math.min(1, t / 0.3, (2.6 - t) / 0.3), pump = Math.sin(t * 8) * 0.12 * k;
    return {
      sx: 1 + 0.05 * k, sy: 1 + 0.02 * k, y: -Math.abs(Math.sin(t * 8)) * 1.2 * k,
      arms: { l: { a: 0.12 + 1.45 * k, f: (1.6 + pump) * k, hand: 'fist' }, r: { a: 0.12 + 1.45 * k, f: (1.6 + pump) * k, hand: 'fist' } },
      face: { eyes: 'open', mouth: 'grin', brows: 'angry', blush: false },
    };
  },
  draw(c, P, t, fx) {
    for (let i = 0; i < 3; i++) { const on = Math.sin(t * 7 + i * 2) > 0.2; if (on) fx.shape(c, 'spark', P.x + (i - 1) * 26, P.y - 12 - (i === 1 ? 14 : 0), 10, '#fde047', 0.9, i); }
  },
};
