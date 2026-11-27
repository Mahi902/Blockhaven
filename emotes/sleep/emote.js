// Dozing on your feet, swaying slowly, with floating Zs.
export default {
  pose(t) {
    return { face: { eyes: 'closed', mouth: 'o', mo: 0.5 + 0.5 * Math.sin(t * 2.2), brows: 'none' }, rot: Math.sin(t * 1.4) * 0.07, sy: 0.96 + Math.sin(t * 2.2) * 0.012, y: 1.5 };
  },
  draw(c, P, t, fx) {
    for (let i = 0; i < 3; i++) {
      const p = ((t * 0.4 + i / 3) % 1);
      fx.text(c, 'z', P.x + 26 + p * 12, P.y - 36 - p * 40, 9 + p * 12, '#bfdbfe', Math.min(1, (1 - p) * 2));
    }
  },
};
