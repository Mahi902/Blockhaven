// Crouch, leap with both arms up, land with a squash.
export default {
  pose(t) {
    if (t < 0.18) { const k = t / 0.18; return { sy: 1 - 0.14 * k, sx: 1 + 0.07 * k, arms: { l: { a: 0.12 + 0.5 * k }, r: { a: 0.12 + 0.5 * k } } }; }
    if (t < 0.88) {
      const u = (t - 0.18) / 0.7;
      return { y: -38 * 4 * u * (1 - u), sy: 1.06 - 0.06 * u, sx: 0.97, arms: { l: { a: 2.6, f: 0.2 }, r: { a: 2.6, f: -0.2 } } };
    }
    const k = (t - 0.88) / 0.22;
    return { sy: 0.86 + 0.14 * k, sx: 1.08 - 0.08 * k, arms: { l: { a: 0.8 * (1 - k) + 0.12 }, r: { a: 0.8 * (1 - k) + 0.12 } } };
  },
};
