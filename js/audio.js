// Blockhaven - tiny procedural sound effects (no audio files needed)
let ctx = null;
export let soundOn = true;

export function setSound(v) { soundOn = !!v; }

function ac() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, dur, type = 'sine', vol = 0.12, slideTo = null, delay = 0) {
  const a = ac();
  const t = a.currentTime + delay;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(a.destination);
  o.start(t); o.stop(t + dur + 0.02);
}

const SOUNDS = {
  step: () => tone(150 + Math.random() * 40, 0.06, 'triangle', 0.05),
  click: () => tone(520, 0.06, 'square', 0.05),
  pop: () => { tone(380, 0.09, 'sine', 0.13, 760); },
  place: () => { tone(300, 0.08, 'triangle', 0.14, 520); tone(620, 0.07, 'sine', 0.06, null, 0.05); },
  delete: () => tone(300, 0.14, 'sawtooth', 0.07, 90),
  error: () => { tone(180, 0.12, 'square', 0.07); tone(140, 0.14, 'square', 0.07, null, 0.1); },
  sit: () => tone(210, 0.16, 'sine', 0.12, 120),
  door: () => { tone(120, 0.12, 'square', 0.06, 80); tone(95, 0.1, 'triangle', 0.08, null, 0.08); },
  good: () => { tone(523, 0.1, 'triangle', 0.1); tone(659, 0.1, 'triangle', 0.1, null, 0.09); tone(784, 0.16, 'triangle', 0.1, null, 0.18); },
  chat: () => tone(700, 0.05, 'sine', 0.06, 900),
  switch: () => { tone(900, 0.03, 'square', 0.05); tone(600, 0.04, 'square', 0.04, null, 0.04); },
  snack: () => { tone(260, 0.05, 'square', 0.06); tone(300, 0.05, 'square', 0.06, null, 0.07); },
};

export function sound(name) {
  if (!soundOn) return;
  try { (SOUNDS[name] || SOUNDS.click)(); } catch (e) { /* audio can be blocked until a gesture */ }
}