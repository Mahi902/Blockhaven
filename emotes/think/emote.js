// Facing front: one hand on the chin, the other arm across the body, head tilted, with a thought bubble.
export default {
  pose(t, P, fx) {
    const k = Math.min(1, t / 0.4, (3.4 - t) / 0.4);
    return {
      rot: 0.035 * k,
      arms: { r: { a: 0.12 - 0.87 * k, f: 4.0 * k, hand: 'fist' }, l: { a: 0.12 - 1.12 * k, f: -0.57 * k } },
      face: { eyes: 'open', mouth: 'flat', brows: 'up', blush: false },
    };
  },
  draw(c, P, t, fx) {
    const k = Math.min(1, (t - 0.5) / 0.3, (3.4 - t) / 0.3);
    if (k <= 0) return;
    const n = 1 + Math.floor(t * 2.2) % 3;
    fx.text(c, '.'.repeat(n), P.x + 28, P.y - 64, 22, '#e2e8f0', k);
  },
};
