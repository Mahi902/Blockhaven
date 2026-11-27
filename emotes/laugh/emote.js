// Holding your belly and shaking with laughter.
export default {
  pose(t, P, fx) {
    const k = Math.min(1, t / 0.2, (3 - t) / 0.3);
    return {
      face: { eyes: 'squint', mouth: 'open', mo: 0.55 + 0.45 * Math.sin(t * 16), brows: 'up', blush: true },
      y: -Math.abs(Math.sin(t * 16)) * 3 * k, rot: Math.sin(t * 13) * 0.07 * k,
      arms: { l: { a: 0.2, f: -1.15 * k }, r: { a: 0.2, f: -1.15 * k } },
    };
  },
  draw(c, P, t, fx) {
    const k = Math.min(1, t / 0.2, (3 - t) / 0.3);
    fx.text(c, 'ha ha!', P.x, P.y - 88 - Math.abs(Math.sin(t * 8)) * 4, 15 * k + 2, '#fde047', k);
  },
};
