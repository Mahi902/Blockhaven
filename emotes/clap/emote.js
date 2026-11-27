// Clapping in front of you until you move.
export default {
  pose(t) {
    const c = Math.sin(t * 14);
    return { y: -Math.abs(Math.sin(t * 7)) * 1.2, arms: { l: { a: 0.1, f: -1.32 + c * 0.1 }, r: { a: 0.1, f: -1.32 + c * 0.1 } } };
  },
};
