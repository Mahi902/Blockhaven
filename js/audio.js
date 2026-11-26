// Blockhaven - soft procedural sound effects (no audio files needed).
// Everything is a quiet, muffled tap: short filtered-noise "ticks" and low sine "thocks" run through a
// low-pass filter and kept at a low level, so nothing is sharp, buzzy or loud.
let ctx = null, master = null, noiseBuf = null;
export let soundOn = true;

export function setSound(v) { soundOn = !!v; }

const VOLUME = 0.5;           // overall level (0-1)
const MUFFLE_HZ = 1800;       // everything above this is cut off

function ac() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = MUFFLE_HZ; lp.Q.value = 0.4;
    master = ctx.createGain(); master.gain.value = VOLUME;
    master.connect(lp); lp.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.25), ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// a soft envelope: ~3 ms fade-in (no pops), then a quick fade-out
function env(a, t, vol, dur) {
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.003);
  g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.01, dur));
  g.connect(master);
  return g;
}

/** low, round "thock": a sine that dips a little in pitch */
function thock(freq, dur, vol, delay = 0, slideTo = null) {
  const a = ac(), t = a.currentTime + delay;
  const o = a.createOscillator(); o.type = 'sine';
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  o.connect(env(a, t, vol, dur));
  o.start(t); o.stop(t + dur + 0.02);
}

/** dry "tick": a very short burst of band-limited noise (lower cutoff = more muffled) */
function tick(cutoff, dur, vol, delay = 0) {
  const a = ac(), t = a.currentTime + delay;
  const s = a.createBufferSource(); s.buffer = noiseBuf;
  const f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = cutoff; f.Q.value = 0.7;
  s.connect(f); f.connect(env(a, t, vol * 2.5, dur));   // filtered noise is naturally quiet
  s.start(t, Math.random() * 0.1); s.stop(t + dur + 0.02);
}

const SOUNDS = {
  step: () => tick(380 + Math.random() * 160, 0.035, 0.28),
  click: () => { tick(1300, 0.022, 0.30); thock(240, 0.04, 0.10); },
  pop: () => thock(330, 0.06, 0.16, 0, 210),
  place: () => { thock(210, 0.08, 0.16, 0, 120); tick(850, 0.03, 0.14); },
  delete: () => { tick(650, 0.08, 0.16); thock(150, 0.1, 0.14, 0, 80); },
  error: () => { thock(150, 0.07, 0.16); thock(115, 0.09, 0.16, 0.09); },
  sit: () => { thock(130, 0.13, 0.20, 0, 90); tick(420, 0.07, 0.10); },
  door: () => { thock(105, 0.11, 0.18, 0, 80); tick(300, 0.09, 0.12, 0.02); },
  good: () => { thock(330, 0.08, 0.13); thock(415, 0.08, 0.13, 0.08); thock(495, 0.12, 0.13, 0.16); },
  chat: () => { tick(1200, 0.02, 0.15); thock(380, 0.04, 0.09); },
  switch: () => { tick(1500, 0.016, 0.18); tick(1000, 0.022, 0.14, 0.035); },
  snack: () => { tick(800, 0.03, 0.14); tick(700, 0.03, 0.14, 0.06); },
};

export function sound(name) {
  if (!soundOn) return;
  try { (SOUNDS[name] || SOUNDS.click)(); } catch (e) { /* audio can be blocked until a gesture */ }
}
