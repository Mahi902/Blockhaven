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

/** low, round "thock" (kept below ~220 Hz so it reads as a soft thud, never a beep) */
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
  click: () => { tick(1500, 0.016, 0.18); tick(520, 0.03, 0.16, 0.004); },   // noise only: no pitch, so no beep
  pop: () => { tick(900, 0.035, 0.24); tick(380, 0.05, 0.2, 0.004); },
  place: () => { thock(170, 0.08, 0.16, 0, 110); tick(850, 0.03, 0.14); },
  delete: () => { tick(650, 0.08, 0.16); thock(150, 0.1, 0.14, 0, 80); },
  error: () => { thock(150, 0.07, 0.16); thock(115, 0.09, 0.16, 0.09); },
  sit: () => { thock(130, 0.13, 0.20, 0, 90); tick(420, 0.07, 0.10); },
  door: () => { thock(105, 0.11, 0.18, 0, 80); tick(300, 0.09, 0.12, 0.02); },
  good: () => { tick(700, 0.035, 0.22); tick(950, 0.035, 0.22, 0.08); tick(1250, 0.05, 0.22, 0.16); },
  chat: () => { tick(1300, 0.018, 0.20); tick(600, 0.03, 0.16, 0.004); },
  switch: () => { tick(1500, 0.016, 0.18); tick(1000, 0.022, 0.14, 0.035); },
  splash: () => { tick(950, 0.10, 0.24); tick(520, 0.14, 0.16, 0.035); thock(230, 0.09, 0.10, 0, 140); },
  snack: () => { tick(800, 0.03, 0.14); tick(700, 0.03, 0.14, 0.06); },
};

export function sound(name) {
  if (!soundOn) return;
  try { (SOUNDS[name] || SOUNDS.click)(); } catch (e) { /* audio can be blocked until a gesture */ }
}

// ---- unlocking audio ----
// Browsers keep audio suspended until a tap / key press, and iOS also mutes Web Audio while the ring switch is
// on silent unless a media element is playing. The first gesture anywhere in the game fixes both, so the TV
// and piano are already live by the time you open them.
const SILENT_WAV = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
let mediaKick = null, kicked = false;
export function unlockAudio() {
  try {
    const a = ac();
    if (kicked && a.state === 'running') return true;      // already awake: nothing to do
    const b = a.createBuffer(1, 1, 22050), s = a.createBufferSource();
    s.buffer = b; s.connect(a.destination); s.start(0);
    kicked = a.state === 'running';
    if (!mediaKick) { mediaKick = new Audio(SILENT_WAV); mediaKick.loop = true; mediaKick.setAttribute('playsinline', ''); }
    const pr = mediaKick.play(); if (pr && pr.catch) pr.catch(() => {});
  } catch (e) { /* no audio support */ }
  return audioReady();
}
export const audioReady = () => !!ctx && ctx.state === 'running';
const UNLOCK_EVENTS = ['pointerdown', 'touchend', 'keydown', 'click'];
function onGesture() {
  if (!unlockAudio()) { if (ctx && ctx.resume) ctx.resume().catch(() => {}); }
  if (audioReady()) UNLOCK_EVENTS.forEach(ev => window.removeEventListener(ev, onGesture, true));
}
if (typeof window !== 'undefined' && window.addEventListener) UNLOCK_EVENTS.forEach(ev => window.addEventListener(ev, onGesture, true));


// ---- music bus: full-range (the effects above are deliberately muffled; music is not) ----
let musicBus = null;
export function musicContext() {
  const a = ac();
  if (!musicBus) {
    musicBus = a.createGain(); musicBus.gain.value = 0.55;
    const lp = a.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 9000;
    // the synthesised tracks are written quietly, so lift them and let a limiter catch the peaks
    const lift = a.createGain(); lift.gain.value = 1.8;
    const lim = a.createDynamicsCompressor();
    lim.threshold.value = -10; lim.knee.value = 6; lim.ratio.value = 12; lim.attack.value = 0.003; lim.release.value = 0.2;
    musicBus.connect(lp); lp.connect(lift); lift.connect(lim); lim.connect(a.destination);
  }
  return { ctx: a, bus: musicBus, noise: noiseBuf };
}
