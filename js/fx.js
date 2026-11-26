// Blockhaven - visual effects for furniture: washer drum, sink foam, flying clothes, wobbles
import { S } from './state.js';

const flies = [];
export function flyCloth(from, to, type, color, ms = 900, delay = 0, done) {
  flies.push({ from, to, type, color, ms, t0: performance.now() + delay, done });
}
const ease = t => t * t * (3 - 2 * t);

export function drawFlies(c) {
  const now = performance.now();
  for (let i = flies.length - 1; i >= 0; i--) {
    const f = flies[i], t = (now - f.t0) / f.ms;
    if (t < 0) continue;
    if (t >= 1) { flies.splice(i, 1); if (f.done) f.done(); continue; }
    const e = ease(t), arc = Math.sin(e * Math.PI) * 34;
    const x = f.from.x + (f.to.x - f.from.x) * e + Math.sin(e * 9) * 6 * (1 - e);
    const y = f.from.y + (f.to.y - f.from.y) * e - arc;
    const s = 1 - e * 0.55;
    c.save(); c.translate(x, y); c.rotate(e * 9); c.scale(s, s);
    c.fillStyle = f.color; c.strokeStyle = '#1b2336'; c.lineWidth = 1.5;
    if (f.type === 'shirt') {
      c.beginPath(); c.rect(-8, -7, 16, 14); c.rect(-13, -7, 6, 6); c.rect(7, -7, 6, 6); c.fill(); c.stroke();
    } else {
      c.beginPath(); c.rect(-7, -8, 6, 16); c.rect(1, -8, 6, 16); c.fill(); c.stroke();
    }
    c.restore();
  }
}

/** Offsets for shaking / rocking furniture: { dx, dy, rot } */
export function wobbleOf(it) {
  const st = it.state, now = Date.now();
  if (it.type === 'washer' && st && st.laundry && !st.laundry.collected) {
    const L = st.laundry, p = (now - L.start) / L.dur;
    if (p >= 0 && p < 1) {
      const spin = p > 0.8, k = spin ? 1.8 : 0.9;
      return { dx: Math.sin(now / 38) * k, dy: Math.cos(now / 47) * k * 0.7, rot: 0 };
    }
  }
  if (it.type === 'rocker' && S.player.seat && S.player.seat.id === it.id) {
    const sp = S.player.seat.spin;
    return { dx: 0, dy: 0, rot: Math.sin(now / 420) * 0.07 + (sp ? Math.max(-0.12, Math.min(0.12, sp.v * 0.012)) : 0) };
  }
  return null;
}

export function washerPhase(L, now = Date.now()) {
  const p = (now - L.start) / L.dur;
  if (L.collected) return 'empty';
  if (p >= 1) return 'done';
  if (p < 0.6) return 'wash';
  if (p < 0.82) return 'rinse';
  return 'spin';
}

/** Drawn inside the item's rotated frame; local units: 48 = one tile, origin = centre. */
export function drawItemFx(c, it) {
  const st = it.state; if (!st) return;
  const now = Date.now();
  if (it.type === 'sink' && st._sink) {
    const s = st._sink, t = (now - s.start) / 1000;
    if (t > 9) return;
    c.save(); c.beginPath(); c.roundRect(-12, -6, 24, 18, 6); c.clip();
    let level = 0, water = null, foam = 0;
    if (t < 1.6) { level = t / 1.6; foam = 1; }
    else if (t < 5) { level = 1; foam = 1; }
    else if (t < 6.6) { level = 1; foam = 1 - (t - 5) / 1.6; water = (t - 5) / 1.6; }
    else { level = 1 - (t - 6.6) / 2.4; water = 1; }
    const top = 12 - 18 * Math.max(0, level);
    c.fillStyle = water != null ? `rgba(${Math.round(191 - 110 * water)},${Math.round(232 - 60 * water)},255,0.95)` : 'rgba(210,240,255,0.9)';
    c.fillRect(-12, top, 24, 20);
    if (foam > 0) {
      for (let i = 0; i < 26; i++) {
        const bx = -11 + ((i * 7.3) % 22), by = top + 2 + ((i * 5.1) % 9) + Math.sin(now / 300 + i) * 0.8;
        const r = 1.8 + (i % 4) * 0.7 * foam;
        c.fillStyle = `rgba(255,255,255,${0.95 * foam})`; c.strokeStyle = `rgba(150,190,230,${0.7 * foam})`; c.lineWidth = 0.4;
        c.beginPath(); c.arc(bx, by, r, 0, 7); c.fill(); c.stroke();
      }
    }
    if (t > 6.6) {   // whirlpool
      const a = now / 120;
      c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 0.9;
      for (let k = 0; k < 2; k++) { c.beginPath(); for (let j = 0; j < 22; j++) { const r = 8 - j * 0.34, an = a + j * 0.5 + k * 3.14; c.lineTo(Math.cos(an) * r, 3 + Math.sin(an) * r * 0.7); } c.stroke(); }
    }
    c.restore();
    if (t < 6.6) {   // tap stream
      c.fillStyle = water != null ? 'rgba(80,150,255,0.9)' : 'rgba(150,215,255,0.9)';
      c.fillRect(-1, -17, 2, 15 + Math.sin(now / 60) * 1);
    }
    return;
  }
  if (it.type === 'washer' && st.laundry) {
    const L = st.laundry, ph = washerPhase(L), p = (now - L.start) / L.dur;
    if (ph === 'empty') return;
    c.save(); c.beginPath(); c.arc(0, 5, 9.5, 0, 7); c.clip();
    c.fillStyle = ph === 'done' ? '#cfe9f7' : '#7fb9dc'; c.fillRect(-10, -5, 20, 20);
    if (ph === 'wash' || ph === 'rinse') {
      const lvl = ph === 'wash' ? Math.max(0, Math.min(1, p / 0.12)) : 1 - (p - 0.6) / 0.22 * 0.3;
      c.fillStyle = ph === 'wash' ? 'rgba(240,250,255,.9)' : 'rgba(90,170,255,.85)';
      c.fillRect(-10, 14 - 17 * lvl, 20, 20);
    }
    const rate = ph === 'spin' ? 14 : ph === 'done' ? 0 : 4;
    const ang = ph === 'done' ? 0.4 : now / 1000 * rate;
    const cols = [L.shirt, L.pants, L.shirt, '#ffffff'];
    cols.forEach((col, i) => {
      const a = ang + i * 1.57, r = ph === 'spin' ? 6.4 : 4.5;
      c.save(); c.translate(Math.cos(a) * r, 5 + Math.sin(a) * r); c.rotate(a * 2);
      c.fillStyle = col; c.strokeStyle = '#1b2336'; c.lineWidth = 0.6; c.fillRect(-3, -2.4, 6, 4.8); c.strokeRect(-3, -2.4, 6, 4.8); c.restore();
    });
    if (ph === 'wash') for (let i = 0; i < 8; i++) { c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.arc(Math.sin(now / 400 + i * 2) * 7, 5 + Math.cos(now / 330 + i * 3) * 7, 1.1 + (i % 3) * .5, 0, 7); c.fill(); }
    if (ph === 'spin') { c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 1; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(0, 5, 3 + i * 3, ang * 2 + i, ang * 2 + i + 2); c.stroke(); } }
    c.restore();
    c.fillStyle = ph === 'done' ? '#3ddc84' : '#ffb347'; c.beginPath(); c.arc(-12, -9.5, 1.7, 0, 7); c.fill();
    if (ph === 'done') {   // ready marker, drawn upright
      c.save(); c.rotate(-it.rot * Math.PI / 2); c.font = '18px sans-serif'; c.textAlign = 'center';
      c.fillText('\u{1F455}', 0, -26 + Math.sin(now / 300) * 3); c.restore();
    }
  }
}

/** Soap bubbles around the player's hands while scrubbing. */
export function drawScrub(c, P) {
  const now = performance.now();
  for (let i = 0; i < 7; i++) {
    const a = now / 260 + i * 1.9, r = 6 + (i % 3) * 3;
    c.fillStyle = 'rgba(255,255,255,.85)'; c.strokeStyle = 'rgba(140,190,235,.8)'; c.lineWidth = 0.8;
    c.beginPath(); c.arc(P.x + Math.cos(a) * r, P.y - 14 - ((now / 40 + i * 9) % 18), 1.6 + (i % 3), 0, 7); c.fill(); c.stroke();
  }
}
