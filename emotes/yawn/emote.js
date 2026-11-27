// A big stretch and a bigger yawn.
export default {
  pose(t, P, fx) {
    const k = fx.hump((t - 0.2) / 2.8);
    return {
      sy: 1 + 0.04 * k, y: -1 * k, arms: { l: { a: 0.12 + 2.8 * k, f: 0.1 }, r: { a: 0.12 + 2.8 * k, f: -0.1 } },
      face: { eyes: 'closed', mouth: 'open', mo: 0.3 + 0.7 * k, brows: 'none' },
    };
  },
};
