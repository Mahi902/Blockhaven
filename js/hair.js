// Blockhaven - hairstyles. Each style returns two SVG fragments per facing direction:
//   back  = drawn behind the head (long hair, ponytail tails ...)
//   front = drawn on top of the head (before the face is drawn)
// Both use {{hair}} for the colour, which player.js fills in with the chosen hair colour.
export const HAIR_STYLES = [
  { id: 'short', name: 'Short' },
  { id: 'buzz', name: 'Buzz' },
  { id: 'spiky', name: 'Spiky' },
  { id: 'long', name: 'Long' },
  { id: 'ponytail', name: 'Ponytail' },
  { id: 'bun', name: 'Bun' },
  { id: 'mohawk', name: 'Mohawk' },
  { id: 'bald', name: 'Bald' },
];
export const DEFAULT_HAIR_STYLE = 'short';

const OUT = '#1b2336';
const path = d => `<path d="${d}" fill="{{hair}}" stroke="${OUT}" stroke-width="1.4" stroke-linejoin="round"/>`;
const dot = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="{{hair}}" stroke="${OUT}" stroke-width="1.4"/>`;

// ---- front view (facing the camera) -----------------------------------------
const CAP_DOWN = 'M10.5 14 Q11 3 24 3.5 Q37 3 37.5 14 Q31 9 24 10 Q17 9 10.5 14Z';
const DOWN = {
  short: () => ({ front: path(CAP_DOWN) }),
  buzz: () => ({ front: path('M11.5 13 Q12 5 24 5 Q36 5 36.5 13 Q31 10 24 10.5 Q17 10 11.5 13Z') }),
  spiky: () => ({ front: path('M10.5 14 L10 6 L15 9 L17 1.5 L21 7.5 L24 0.5 L27 7.5 L31 1.5 L33 9 L38 6 L37.5 14 Q31 9 24 10 Q17 9 10.5 14Z') }),
  long: () => ({ back: path('M9.5 15 Q9 2 24 2.5 Q39 2 38.5 15 L40 38 Q40 41 36 41 L12 41 Q8 41 8.5 38Z'), front: path(CAP_DOWN) }),
  ponytail: () => ({ back: path('M34 12 Q44 13 42 25 Q41 33 37.5 30 Q40 23 34 18Z'), front: path(CAP_DOWN) }),
  bun: () => ({ back: dot(24, 4.8, 4.5), front: path(CAP_DOWN) }),
  mohawk: () => ({ front: path('M20.5 11 L20 4 Q24 1 28 4 L27.5 11 Q24 8.5 20.5 11Z') }),
  bald: () => ({}),
};

// ---- back view (facing away) -------------------------------------------------
const CAP_UP = 'M10.5 18 Q9 3 24 3 Q39 3 37.5 18 Q36 25 24 26 Q12 25 10.5 18Z';
const UP = {
  short: () => ({ front: path(CAP_UP) }),
  buzz: () => ({ front: path('M11 17 Q10 5 24 5 Q38 5 37 17 Q36 23 24 24 Q12 23 11 17Z') }),
  spiky: () => ({ front: path('M10.5 18 L9 7 L14 9 L16 1.5 L20.5 7 L24 0.5 L27.5 7 L32 1.5 L34 9 L39 7 L37.5 18 Q36 25 24 26 Q12 25 10.5 18Z') }),
  long: () => ({ front: path('M9.5 17 Q8 2 24 2.5 Q40 2 38.5 17 L40 40 Q40 43 36 43 L12 43 Q8 43 8 40Z') }),
  ponytail: () => ({ front: path(CAP_UP) + path('M21 22 Q19 36 24 41 Q29 36 27 22Z') }),
  bun: () => ({ front: path(CAP_UP) + dot(24, 5, 4.5) }),
  mohawk: () => ({ front: path('M20.5 3.5 Q24 0.5 27.5 3.5 L27 24 Q24 26 21 24Z') }),
  bald: () => ({}),
};

// ---- side view: dx is measured from the head centre, positive = the way the face points
function side(sgn) {
  const X = dx => +(24 + sgn * dx).toFixed(2);
  const pt = (x, y) => `${X(x)} ${y}`;
  const poly = (cmds) => cmds.map(([c, ...p]) => c + p.map((v, i) => (i % 2 === 0 ? X(v) : v)).join(' ')).join('');
  const cap = path(poly([['M', -12, 17], ['Q', -12, 3, 0, 3.5], ['Q', 12, 3, 12, 15], ['Q', 3, 8, -3, 12], ['Q', -6, 12, -12, 17], ['Z']]));
  return {
    short: () => ({ front: cap }),
    buzz: () => ({ front: path(poly([['M', -11.5, 15], ['Q', -11.5, 5, 0, 5], ['Q', 11.5, 5, 11.5, 13], ['Q', 4, 9.5, -2, 11], ['Q', -7, 11, -11.5, 15], ['Z']])) }),
    spiky: () => ({ front: path(poly([['M', -12, 17], ['L', -13, 8], ['L', -8, 8.5], ['L', -9, 1.5], ['L', -3, 6], ['L', 1, 0], ['L', 4, 5.5], ['L', 8, 2], ['L', 9.5, 8.5], ['L', 13, 9], ['L', 12, 15], ['Q', 3, 8.5, -3, 12], ['Q', -6, 12, -12, 17], ['Z']])) }),
    long: () => ({ back: path(poly([['M', -11, 14], ['Q', -15, 28, -12, 40], ['L', -5, 40], ['Q', -7, 28, -4, 14], ['Z']])), front: cap }),
    ponytail: () => ({ back: path(poly([['M', -11, 10], ['Q', -21, 12, -18, 26], ['Q', -16, 33, -12.5, 29], ['Q', -14, 21, -9, 17], ['Z']])), front: cap }),
    bun: () => ({ front: cap + dot(X(-8), 6, 5) }),
    mohawk: () => ({ front: path(poly([['M', -9, 9], ['Q', -9, 3, -6, 1.5], ['Q', 0, -0.5, 7, 3], ['L', 9, 8], ['Q', 0, 3.5, -9, 9], ['Z']])) }),
    bald: () => ({}),
  };
}
const LEFT = side(-1), RIGHT = side(1);

/** {back, front} SVG fragments for a hairstyle id and facing ('down' | 'up' | 'left' | 'right'). */
export function hairParts(style, dir) {
  const set = dir === 'down' ? DOWN : dir === 'up' ? UP : dir === 'left' ? LEFT : RIGHT;
  const f = set[style] || set[DEFAULT_HAIR_STYLE];
  const r = f();
  return { back: r.back || '', front: r.front || '' };
}
