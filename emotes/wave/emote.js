// Right arm swings up and waves.
export default {
  pose(t) {
    const up = Math.min(1, t / 0.25, (2.6 - t) / 0.25);   // raise, hold, lower
    return {
      rot: Math.sin(t * 9) * 0.02 * up,
      arms: { r: { a: 0.12 + 2.35 * up, f: Math.sin(t * 10) * 0.55 * up } },
    };
  },
};
