// Both arms up, hopping, with confetti.
const COLORS = ['#f87171', '#fbbf24', '#4ade80', '#38bdf8', '#c084fc', '#f472b6'];
export default {
  pose(t) {
    const hop = Math.abs(Math.sin(t * 7));
    return { y: -hop * 10, sy: 1 + hop * 0.04, arms: { l: { a: 2.8, f: Math.sin(t * 14) * 0.3 }, r: { a: 2.8, f: -Math.sin(t * 14) * 0.3 } } };
  },
  draw(c, P, t, fx) {
    const fade = Math.min(1, (2.6 - t) / 0.5);
    for (let i = 0; i < 16; i++) {
      const p = ((t * (0.5 + fx.rand(i + 9) * 0.5) + fx.rand(i + 3)) % 1);
      const x = P.x + (fx.rand(i) - 0.5) * 80 + Math.sin(t * 3 + i) * 5, y = P.y - 100 + p * 105;
      c.save(); c.globalAlpha = Math.max(0, fade); c.translate(x, y); c.rotate(t * 5 + i); c.fillStyle = COLORS[i % COLORS.length]; c.fillRect(-2.5, -1.5, 5, 3); c.restore();
    }
    for (let i = 0; i < 3; i++) fx.shape(c, i === 1 ? 'star' : 'spark', P.x + (i - 1) * 24, P.y - 88 - (i === 1 ? 6 : 0) + Math.sin(t * 6 + i) * 3, 16, COLORS[(i * 2 + 1) % COLORS.length], Math.max(0, fade), t * 2 + i);
  },
};
