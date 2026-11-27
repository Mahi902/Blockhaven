// A friendly handshake: reach out, grip and shake, let go.
export default {
  pose(t, P, fx, ctx) {
    const reach = Math.min(1, t / 0.6, (3 - t) / 0.5), grip = t > 0.8 && t < 2.3;
    const shake = grip ? Math.sin(t * 14) * 0.3 : 0;
    return {
      y: grip ? Math.abs(Math.sin(t * 14)) * -0.8 : 0,
      arms: { r: { a: 0.12 + 1.25 * reach, f: shake, hand: 'fist' } },
      face: { eyes: 'open', mouth: 'smile', brows: 'up' },
    };
  },
};
