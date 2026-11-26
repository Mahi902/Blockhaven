// Blockhaven - visual effects for furniture: washer drum, sink foam, flying clothes, wobbles
import { S } from './state.js';
import { COLOR_HEX } from './config.js';

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
  if (it.type === 'fan') { drawFan(c, it, st, now); return; }
  if (it.type === 'gclock') { drawClockHands(c, now); return; }
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

// ---- fan: blades seen edge-on from above, spinning with the speed setting, plus moving wind streaks in front ----
const FAN_RPS = [0, 5, 9, 15];             // blade turns per second (off / low / medium / high)
const FAN_REACH_PX = [0, 96, 144, 192];    // wind length from the fan centre (matches player.js windPush)
function drawFan(c, it, st, now) {
  const sp = Math.max(0, Math.min(3, (st.speed | 0)));
  const col = COLOR_HEX[it.color] || '#8a919a';
  // local frame: origin = tile centre, the fan faces +y. The guard is the strip y 8..18.
  const phi = sp ? now / 1000 * FAN_RPS[sp] * Math.PI * 2 : 0.5;
  if (sp) { c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(-17, 9, 34, 8); }
  c.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const x = Math.cos(phi + i * Math.PI * 2 / 3) * 16;
    c.strokeStyle = 'rgba(20,24,34,0.55)'; c.lineWidth = 4.4; c.beginPath(); c.moveTo(0, 13); c.lineTo(x, 13); c.stroke();
    c.strokeStyle = col; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 13); c.lineTo(x, 13); c.stroke();
  }
  c.fillStyle = '#4a515b'; c.beginPath(); c.arc(0, 13, 2.2, 0, 7); c.fill();
  if (!sp) return;
  const reach = FAN_REACH_PX[sp] - 24, n = 8 + sp * 3, speed = 0.55 + sp * 0.3;
  for (let i = 0; i < n; i++) {
    const ph = (now / 1000 * speed + i * 0.6180339) % 1;
    const x = (((i * 37) % 100) / 100 - 0.5) * 42 + Math.sin(now / 400 + i) * 1.5;
    const y = 22 + ph * reach, a = Math.sin(ph * Math.PI) * 0.8, len = 7 + sp * 2;
    c.strokeStyle = `rgba(70,130,200,${a * 0.7})`; c.lineWidth = 3.6; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + len); c.stroke();
    c.strokeStyle = `rgba(255,255,255,${Math.min(1, a * 1.2)})`; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + len); c.stroke();
  }
}

// ---- grandfather clock: the hands show your real local time ----
function drawClockHands(c, now) {
  const d = new Date(now), ms = d.getMilliseconds() / 1000, s = d.getSeconds() + ms, m = d.getMinutes() + s / 60, h = (d.getHours() % 12) + m / 60;
  const hand = (turn, len, w, col) => {
    const a = turn * Math.PI * 2; c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round';
    c.beginPath(); c.moveTo(0, -2); c.lineTo(Math.sin(a) * len, -2 - Math.cos(a) * len); c.stroke();
  };
  hand(h / 12, 6, 2.2, '#2a2a2a'); hand(m / 60, 9, 1.5, '#2a2a2a'); hand(s / 60, 9.6, 0.8, '#d13b3b');
  c.fillStyle = '#2a2a2a'; c.beginPath(); c.arc(0, -2, 1.3, 0, 7); c.fill();
}

// ---- shower: water falls over whoever is inside (drawn above the player), with steam, foam and splashes ----
export function drawShowerWater(c, it, ctr) {
  const sh = it.state && it.state._shower; if (!sh) return;
  const now = performance.now(), t = (Date.now() - sh.start) / 1000;
  if (t < 0) return;
  const hot = sh.temp === 'hot', cold = sh.temp === 'cold';
  const on = Math.min(1, t / 0.5);
  c.save();
  // fogged glass
  c.fillStyle = `rgba(235,246,255,${Math.min(cold ? 0.06 : 0.2, t * 0.03) * on})`;
  c.fillRect(ctr.x - 22, ctr.y - 24, 44, 48);
  // falling water from the rain head down over the body to the tray
  c.lineCap = 'round';
  for (let i = 0; i < 34; i++) {
    const ph = (now / 1000 * 1.7 + i * 0.618) % 1;
    const x = ctr.x + (((i * 41) % 100) / 100 - 0.5) * 34, y = ctr.y - 26 + ph * 46;
    if (y > ctr.y + 16) continue;
    c.strokeStyle = 'rgba(120,180,235,0.55)'; c.lineWidth = 2.6; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 0.5, y + 8); c.stroke();
    c.strokeStyle = 'rgba(235,248,255,0.95)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 0.5, y + 8); c.stroke();
  }
  // splashes on the tray
  for (let i = 0; i < 7; i++) {
    const ph = (now / 1000 * 2.2 + i * 0.37) % 1;
    const x = ctr.x + (((i * 53) % 100) / 100 - 0.5) * 30, y = ctr.y + 15 + ((i * 7) % 5);
    c.strokeStyle = `rgba(255,255,255,${0.7 * (1 - ph)})`; c.lineWidth = 1;
    c.beginPath(); c.ellipse(x, y, 2 + ph * 6, 1 + ph * 2.4, 0, 0, 7); c.stroke();
  }
  // steam rising (warm and hot water only)
  if (!cold) {
    const n = hot ? 9 : 5;
    for (let i = 0; i < n; i++) {
      const ph = (now / 1000 * 0.35 + i / n) % 1;
      const x = ctr.x + Math.sin(i * 2.3 + now / 900) * 14, y = ctr.y - 16 - ph * 40;
      c.fillStyle = `rgba(255,255,255,${(hot ? 0.3 : 0.18) * Math.sin(ph * Math.PI) * on})`;
      c.beginPath(); c.arc(x, y, 7 + ph * 9, 0, 7); c.fill();
    }
  }
  // lather foam while scrubbing is handled by drawScrub (player.js seat.scrub); a little foam collects at the feet
  if (sh.phase === 'lather') {
    for (let i = 0; i < 9; i++) {
      const x = ctr.x + (((i * 29) % 100) / 100 - 0.5) * 28, y = ctr.y + 12 + ((i * 11) % 6);
      c.fillStyle = 'rgba(255,255,255,0.9)'; c.strokeStyle = 'rgba(150,190,230,0.8)'; c.lineWidth = 0.6;
      c.beginPath(); c.arc(x, y, 2 + (i % 3), 0, 7); c.fill(); c.stroke();
    }
  }
  c.restore();
}
