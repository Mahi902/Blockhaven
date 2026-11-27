// A little hop while turning all the way round (three times).
const FACES = ['down', 'left', 'up', 'right'];
export default {
  pose(t, P, fx) {
    return { dir: FACES[Math.floor(t * 9) % 4], y: -9 * fx.hump(t / 1.3), arms: { l: { a: 1.4 }, r: { a: 1.4 } } };
  },
};
