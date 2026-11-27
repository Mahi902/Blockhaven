// A polite bow: dip, hold, and rise.
export default {
  pose(t) {
    const b = Math.max(0, Math.min(1, t / 0.5, (2.2 - t) / 0.5));
    return { sy: 1 - 0.15 * b, sx: 1 + 0.05 * b, y: 1 * b, arms: { l: { a: 0.12 + 0.25 * b }, r: { a: 0.12 + 0.25 * b } } };
  },
};
