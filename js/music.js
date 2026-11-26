// Blockhaven - procedural music. Original loops, synthesised live with Web Audio (no audio files).
import { musicContext, soundOn } from './audio.js';
import * as W from './world.js';

const hz = m => 440 * Math.pow(2, (m - 69) / 12);
let ctx = null, bus = null, noiseBuf = null, out = null, cur = null, volume = 0.55;

function setup() { const m = musicContext(); ctx = m.ctx; bus = m.bus; noiseBuf = m.noise; }

function mulberry32(a) {
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// ---- voices ---------------------------------------------------------------------------
function env(t, vol, atk, dur, dest) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + atk);
  g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(atk + 0.02, dur));
  g.connect(dest || out || bus);
  return g;
}
/** one note (MIDI number). o: type, vol, atk, lp, det, slide (semitones), dest */
export function tone(m, t, dur, o = {}) {
  const { type = 'sine', vol = 0.12, atk = 0.01, lp = 0, det = 0, slide = 0, dest = null } = o;
  const osc = ctx.createOscillator(); osc.type = type;
  osc.frequency.setValueAtTime(hz(m), t);
  if (slide) osc.frequency.exponentialRampToValueAtTime(hz(m + slide), t + dur);
  osc.detune.value = det;
  const g = env(t, vol, atk, dur, dest);
  if (lp) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp; osc.connect(f); f.connect(g); } else osc.connect(g);
  osc.start(t); osc.stop(t + dur + 0.05);
}
function noise(t, dur, o = {}) {
  const { vol = 0.1, hp = 0, lp = 0, bp = 0, dest = null } = o;
  const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
  let node = s;
  const chain = (type, f) => { const b = ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; node.connect(b); node = b; };
  if (hp) chain('highpass', hp);
  if (lp) chain('lowpass', lp);
  if (bp) chain('bandpass', bp);
  node.connect(env(t, vol, 0.002, dur, dest));
  s.start(t, Math.random() * 0.1); s.stop(t + dur + 0.05);
}
function kick(t, v = 0.5) {
  const o = ctx.createOscillator();
  o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
  o.connect(env(t, v, 0.002, 0.2)); o.start(t); o.stop(t + 0.25);
}
const snare = (t, v = 0.25) => { noise(t, 0.14, { vol: v, bp: 1900 }); tone(55, t, 0.08, { vol: v * 0.6 }); };
const hat = (t, v = 0.05, open = false) => noise(t, open ? 0.16 : 0.03, { vol: v, hp: 7000 });
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];

// ---- tracks: step(i, t, sd, st) is called once per 16th note (sd seconds long) ---------------
export const TRACKS = {
  lofi: {
    name: 'Lo-fi beats', radio: true, bpm: 78,
    step(i, t, sd, st) {
      const bar = Math.floor(i / 16) % 4, s = i % 16, r = st.r;
      const chords = [[57, 60, 64, 67], [53, 57, 60, 64], [50, 57, 60, 65], [52, 56, 59, 62]];
      const roots = [45, 41, 38, 40];
      const ts = s % 2 ? t + sd * 0.12 : t;
      if (s === 0) chords[bar].forEach(n => tone(n, t, sd * 14, { type: 'triangle', vol: 0.045, lp: 1100, atk: 0.04 }));
      if (s === 10) chords[bar].forEach(n => tone(n, t, sd * 3, { type: 'triangle', vol: 0.03, lp: 1100, atk: 0.02 }));
      if (s === 0) tone(roots[bar], t, sd * 6, { vol: 0.2, lp: 400 });
      if (s === 10) tone(roots[bar], t, sd * 3, { vol: 0.15, lp: 400 });
      if (s === 0 || s === 10 || (s === 7 && r() < 0.3)) kick(ts, 0.38);
      if (s === 4 || s === 12) snare(ts, 0.1);
      if (s % 2 === 0) hat(ts, 0.02 + r() * 0.03);
      if (s % 2 === 0 && r() < 0.22) tone(pick(r, [69, 72, 74, 76, 79, 81]), ts, sd * 3, { vol: 0.06, lp: 2000, atk: 0.02 });
      if (r() < 0.12) noise(t, 0.01, { vol: 0.04, hp: 3000 });
    },
  },
  jazz: {
    name: 'Jazz', radio: true, bpm: 132,
    init: () => ({ m: 5 }),
    step(i, t, sd, st) {
      const bar = Math.floor(i / 16) % 4, s = i % 16, r = st.r;
      const bass = [[38, 41, 45, 42], [43, 47, 50, 47], [48, 52, 55, 46], [45, 49, 52, 37]];
      const comp = [[53, 57, 60, 64], [53, 59, 62, 67], [52, 55, 59, 64], [55, 61, 64, 69]];
      const sc = [60, 62, 64, 65, 67, 69, 71, 72, 74, 76, 79];
      const jt = s % 4 === 2 ? t + sd * 0.67 : t;
      if (s % 4 === 0) tone(bass[bar][s / 4], t, sd * 3.6, { type: 'triangle', vol: 0.22, lp: 600 });
      if (s === 6 || s === 14) comp[bar].forEach(n => tone(n, jt, sd * 2.5, { type: 'triangle', vol: 0.04, lp: 1500 }));
      if ([0, 4, 6, 8, 12, 14].includes(s)) noise(jt, 0.12, { vol: 0.05, hp: 6000 });
      if (s % 8 === 4) hat(t, 0.05);
      if (s === 0 && bar % 2 === 0) kick(t, 0.12);
      if (s % 2 === 0 && r() > 0.35) {
        st.m = Math.max(0, Math.min(sc.length - 1, st.m + Math.floor(r() * 5) - 2));
        tone(sc[st.m], jt, sd * 1.8, { type: 'triangle', vol: 0.07, lp: 2600 });
      }
    },
  },
  rock: {
    name: 'Rock', radio: true, bpm: 128,
    init: r => ({ riff: Array.from({ length: 4 }, () => Array.from({ length: 16 }, (_, s) => (s % 2 === 0 && r() < 0.5 ? pick(r, [64, 67, 69, 71, 74, 76]) : 0))) }),
    step(i, t, sd, st) {
      const bar = Math.floor(i / 16) % 4, s = i % 16, r = st.r;
      const roots = [40, 36, 43, 38], root = roots[bar];
      if (s % 2 === 0) {
        const acc = s === 0 || s === 6 || s === 10;
        [root + 12, root + 19, root + 24].forEach(n => tone(n, t, sd * (acc ? 3 : 1.6), { type: 'sawtooth', vol: acc ? 0.035 : 0.028, lp: acc ? 2200 : 1500 }));
        tone(root, t, sd * 1.8, { type: 'triangle', vol: 0.25, lp: 500 });
      }
      if (s === 0 || s === 8 || (s === 6 && bar % 2) || s === 14) kick(t, 0.5);
      if (s === 4 || s === 12) snare(t, 0.3);
      if (s % 2 === 0) hat(t, 0.05, s === 14);
      const n = st.riff[bar][s];
      if (n) tone(n, t, sd * 1.7, { type: 'square', vol: 0.03, lp: 2400 });
    },
  },
  classical: {
    name: 'Classical', radio: true, bpm: 66,
    step(i, t, sd, st) {
      const k = Math.floor((i % 64) / 8), s = i % 16, r = st.r;
      const tri = [[62, 66, 69], [57, 61, 64], [59, 62, 66], [54, 57, 61], [55, 59, 62], [62, 66, 69], [55, 59, 62], [57, 61, 64]][k];
      const roots = [38, 45, 47, 42, 43, 38, 43, 45];
      const mel = [78, 76, 74, 73, 71, 69, 71, 73];
      if (s % 2 === 0) tone([tri[0], tri[1], tri[2], tri[1]][(s / 2) % 4], t, sd * 3, { type: 'triangle', vol: 0.07, lp: 3200, atk: 0.005 });
      if (s % 8 === 0) {
        tone(roots[k], t, sd * 7, { vol: 0.2 });
        tone(mel[k], t, sd * 7.5, { vol: 0.075, atk: 0.08, lp: 3500 });
      }
      if (s % 8 === 4 && r() < 0.6) tone(pick(r, tri) + 12, t, sd * 3, { vol: 0.05, lp: 3500, atk: 0.02 });
    },
  },
  chiptune: {
    name: 'Chiptune', radio: true, bpm: 140,
    init: r => ({ lead: Array.from({ length: 4 }, () => Array.from({ length: 16 }, (_, s) => (s % 2 === 0 && r() < 0.55 ? pick(r, [72, 74, 76, 79, 81, 84]) : 0))) }),
    step(i, t, sd, st) {
      const bar = Math.floor(i / 16) % 4, s = i % 16;
      const arp = [[60, 64, 67, 72], [57, 60, 64, 69], [53, 57, 60, 65], [55, 59, 62, 67]][bar];
      const roots = [48, 45, 41, 43];
      tone(arp[s % 4], t, sd * 0.9, { type: 'square', vol: 0.025 });
      if (s % 2 === 0) tone(roots[bar], t, sd * 1.8, { type: 'triangle', vol: 0.2 });
      if (s === 0 || s === 8) kick(t, 0.35);
      if (s === 4 || s === 12) noise(t, 0.08, { vol: 0.1, bp: 3000 });
      if (s % 2 === 0) hat(t, 0.025);
      const n = st.lead[bar][s];
      if (n) tone(n, t, sd * 1.8, { type: 'square', vol: 0.035, det: 6 });
    },
  },
};
export const TRACK_LIST = Object.entries(TRACKS).filter(([, v]) => v.radio).map(([id, v]) => [id, v.name]);

// ---- player ---------------------------------------------------------------------------------
function tick() {
  if (!cur) return;
  if (!soundOn || (cur.owner != null && !W.byId('item', cur.owner))) { stopMusic(); return; }
  if (cur.next < ctx.currentTime - 0.5) cur.next = ctx.currentTime + 0.05;       // catch up after a pause
  while (cur.next < ctx.currentTime + 0.35) {
    try { cur.tr.step(cur.i, cur.next, cur.sd, cur.st); } catch (e) { console.error('[music]', cur.id, e); }
    cur.next += cur.sd; cur.i++;
  }
}

/** Start a track. Only one plays at a time; `owner` is the furniture id, `onEnd` runs when it stops. */
export function playMusic(id, owner = null, onEnd = null) {
  const tr = TRACKS[id]; if (!tr || !soundOn) return false;
  stopMusic(); setup();
  out = ctx.createGain(); out.gain.value = 1; out.connect(bus);       // each track gets its own gain so stop() is instant
  bus.gain.setTargetAtTime(volume, ctx.currentTime, 0.02);
  const rng = mulberry32((Math.random() * 1e9) | 0);
  cur = { id, owner, onEnd, tr, sd: 60 / tr.bpm / 4, i: 0, next: ctx.currentTime + 0.08, st: { r: rng } };
  if (tr.init) Object.assign(cur.st, tr.init(rng));
  cur.timer = setInterval(tick, 80);
  tick();
  return true;
}

export function stopMusic() {
  if (!cur) return;
  const c = cur; cur = null;
  clearInterval(c.timer);
  if (c.tr.stop) { try { c.tr.stop(c.st); } catch (e) { /* ignore */ } }
  const o = out; out = null;
  if (o) { o.gain.setTargetAtTime(0, ctx.currentTime, 0.05); setTimeout(() => { try { o.disconnect(); } catch (e) { /* ignore */ } }, 600); }
  if (c.onEnd) { try { c.onEnd(); } catch (e) { console.error(e); } }
}

export const musicNow = () => (cur ? { id: cur.id, owner: cur.owner } : null);
export function setMusicVolume(v) {
  volume = Math.max(0, Math.min(1, v));
  if (bus) bus.gain.setTargetAtTime(volume, ctx.currentTime, 0.03);
}
