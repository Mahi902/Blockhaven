// Facing front: hand to the lips, then throw the kiss up and out.
const AM = -1.29, FM = 4.59;                                   // arm angles that put the hand at the mouth
export default {
  pose(t, P, fx) {
    const lerp = (x, y, u) => x + (y - x) * u;
    let a, f;
    if (t < 0.9) { const u = fx.clamp(t / 0.4); a = lerp(0.12, AM, u); f = lerp(0, FM, u); }
    else if (t < 1.5) { const u = fx.clamp((t - 0.9) / 0.25); a = lerp(AM, 2.0, u); f = lerp(FM, -0.3, u); }
    else { const u = fx.clamp((t - 1.5) / 0.45); a = lerp(2.0, 0.12, u); f = lerp(-0.3, 0, u); }
    return { rot: t > 0.9 && t < 1.5 ? -0.04 : 0, arms: { r: { a, f, hand: 'open' } }, face: { eyes: 'wink', mouth: t < 0.9 ? 'o' : 'smile', mo: 0.1, blush: true } };
  },
  draw(c, P, t, fx) {
    if (t < 0.95 || t > 2.2) return;
    const p = (t - 0.95) / 1.25;
    for (let i = 0; i < 2; i++) { const q = Math.max(0, p - i * 0.18); fx.shape(c, 'heart', P.x + 12 + q * 44, P.y - 22 - q * 30 + Math.sin(q * 9) * 3, 9 + 5 * (1 - q), '#f43f5e', 1 - q); }
  },
};
