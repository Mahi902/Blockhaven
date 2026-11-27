// Turns to the side, hand on chin, deep in thought.
export default {
  pose(t, P, fx) {
    const k = Math.min(1, t / 0.4, (3.4 - t) / 0.4);
    return { dir: k > 0.3 ? 'left' : undefined, arms: { r: { a: 0.12 + 1.1 * k, f: 1.9 * k, hand: 'fist' } }, face: { eyes: 'open', mouth: 'flat', brows: 'up', blush: false } };
  },
  draw(c, P, t, fx) {
    const k = Math.min(1, (t - 0.5) / 0.3, (3.4 - t) / 0.3);
    if (k <= 0) return;
    const n = 1 + Math.floor(t * 2.2) % 3;
    fx.text(c, '.'.repeat(n), P.x - 26, P.y - 66, 22, '#e2e8f0', k);
  },
};
