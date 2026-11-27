// Blockhaven - emotes. Every folder in /emotes/ is one emote (see docs/EMOTES.md):
//   emotes/<id>/info.txt   name=Wave / duration=2.6 / loop=0 / order=10 / preview=0.9   (preview = the moment drawn as the tray silhouette)
//   emotes/<id>/emote.js   export default { pose(t, P, fx) { ... }, draw(c, P, t, fx) { ... } }
//   together=1 / gap=24 / ask=shake hands   makes it a two-player emote (see docs/EMOTES.md); those are not in the tray
//   emotes/<id>/icon.svg   optional hand drawn tray icon; without it a silhouette is generated from the pose
// The folder list comes from emotes/index.json (tools/build_index.py), with the GitHub contents API as a fallback,
// exactly like the furniture catalog, so dropping in a new folder is all it takes.
import { REPO, VERSION, BUILDS } from './config.js';
import { S } from './state.js';
import { h, toast } from './ui.js';
import { sound } from './audio.js';

const Q = `?v=${VERSION}`;
const BASE = new URL('../emotes/', import.meta.url).href;
export const emotes = new Map();   // id -> { id, name, icon, duration, loop, order, mod }
export const order = [];           // solo emotes, in tray order
export const togetherOrder = [];   // two-player emotes, in menu order

const parseInfo = txt => Object.fromEntries(txt.split(/\r?\n/).map(l => l.match(/^\s*(\w+)\s*=\s*(.*)$/)).filter(Boolean).map(m => [m[1].toLowerCase(), m[2].trim()]));

async function listFolders() {
  try {
    const r = await fetch(`${BASE}index.json${Q}`, { cache: 'no-cache' });
    if (r.ok) return await r.json();
  } catch (e) { /* fall through to the API */ }
  const api = p => fetch(`https://api.github.com/repos/${REPO}/contents/${p}`).then(r => r.json());
  const out = {};
  const dirs = (await api('emotes')).filter(f => f.type === 'dir');
  await Promise.all(dirs.map(async d => { out[d.name] = (await api(`emotes/${d.name}`)).map(f => f.name); }));
  return out;
}

async function loadOne(id, files) {
  if (!files.includes('emote.js')) return;
  const info = parseInfo(await (await fetch(`${BASE}${encodeURIComponent(id)}/info.txt${Q}`)).text());
  const mod = (await import(`${BASE}${encodeURIComponent(id)}/emote.js${Q}`)).default;
  if (!mod || typeof mod.pose !== 'function') throw new Error('emote.js needs a default export with a pose(t) function');
  emotes.set(id, {
    id, name: info.name || id, iconUrl: files.includes('icon.svg') ? `${BASE}${encodeURIComponent(id)}/icon.svg${Q}` : null,
    preview: Number.isFinite(Number(info.preview)) && info.preview !== undefined ? Number(info.preview) : 0.5,
    together: info.together === '1' || info.together === 'true', gap: Number(info.gap) || 24, ask: info.ask || ('do ' + (info.name || id)),
    duration: Math.max(0.2, Number(info.duration) || 2), loop: info.loop === '1' || info.loop === 'true',
    order: Number.isFinite(Number(info.order)) && info.order !== undefined ? Number(info.order) : 999, mod,
  });
}

export async function loadEmotes() {
  const folders = await listFolders();
  await Promise.all(Object.entries(folders).map(([id, files]) => loadOne(id, files).catch(e => console.warn('[emotes] skipped', id, e))));
  order.length = 0; togetherOrder.length = 0;
  for (const d of [...emotes.values()].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))) (d.together ? togetherOrder : order).push(d.id);
  return emotes;
}

// ---- helpers handed to every emote.js ------------------------------------------------------------
// Effects are drawn from SVG path data (24 x 24 boxes) so they look the same on every device.
const SHAPES = {
  heart: { d: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z' },
  star: { d: 'M12 2l2.9 6.9 7.1.6-5.4 4.7 1.7 7.3L12 17.8 5.7 21.5l1.7-7.3L2 9.5l7.1-.6z' },
  spark: { d: 'M12 1l2 8 8 3-8 3-2 8-2-8-8-3 8-3z' },
  note: { d: 'M9 3v10.3A3.5 3.5 0 1 0 11 16.5V7l7-1.5v6.8A3.5 3.5 0 1 0 20 15.5V3z' },
  drop: { d: 'M12 2C12 2 5 10 5 14.5a7 7 0 0 0 14 0C19 10 12 2 12 2z' },
  anger: { d: 'M4 9c3 0 5-2 5-5M20 9c-3 0-5-2-5-5M4 15c3 0 5 2 5 5M20 15c-3 0-5 2-5 5', line: true },
};
const paths = {};
export const fx = {
  clamp: (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)),
  /** 0 -> 1 -> 0 hump over [0, 1] (clamped), handy for easing an emote in and out. */
  hump: u => Math.sin(Math.PI * Math.max(0, Math.min(1, u))),
  /** Deterministic pseudo random in [0, 1) from a number - the same on every device. */
  rand: n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); },
  /** Draw a built-in SVG shape: heart, star, spark, note, drop, anger. */
  shape(c, name, x, y, size = 16, color = '#fff', alpha = 1, rot = 0) {
    const sh = SHAPES[name]; if (!sh) return;
    const path = paths[name] || (paths[name] = new Path2D(sh.d));
    c.save(); c.globalAlpha = alpha; c.translate(x, y); c.rotate(rot); c.scale(size / 24, size / 24); c.translate(-12, -12);
    c.lineJoin = 'round'; c.lineCap = 'round';
    if (sh.line) { c.strokeStyle = 'rgba(15,23,42,.9)'; c.lineWidth = 6; c.stroke(path); c.strokeStyle = color; c.lineWidth = 3.4; c.stroke(path); }
    else { c.strokeStyle = 'rgba(15,23,42,.85)'; c.lineWidth = 2; c.stroke(path); c.fillStyle = color; c.fill(path); }
    c.restore();
  },
  text(c, s, x, y, size = 14, color = '#fff', alpha = 1) {
    c.save(); c.globalAlpha = alpha; c.font = `800 ${size}px Fredoka, "Plus Jakarta Sans", sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.lineWidth = 3; c.strokeStyle = 'rgba(15,23,42,.85)'; c.strokeText(s, x, y); c.fillStyle = color; c.fillText(s, x, y); c.restore();
  },
};

// ---- playback ----------------------------------------------------------------------------------------
let seq = Math.floor(Math.random() * 1e6);
const clocks = new Map();   // player key -> { n, t0 } (when we first saw that play of the emote, so remote players animate from the start)

/** Start an emote on your own character. */
export function playEmote(id) {
  const d = emotes.get(id), P = S.player;
  if (!d || d.together || !S.started) return false;
  if (P.seat || P.lock) { toast('Stand up first to emote', 1800); return false; }
  S.path = null; S.pendingInteract = null; P.moving = false;
  P.emote = { id, n: ++seq, t0: performance.now() };
  sound('click');
  return true;
}
/** Start a two-player emote after both players agreed. role 0 asked, role 1 accepted; side -1 = stands on the left. */
export function startTogether(id, n, withId, role, side) {
  const d = emotes.get(id), P = S.player;
  if (!d || !d.together || !S.started) return false;
  S.path = null; S.pendingInteract = null; P.moving = false;
  P.emote = { id, n, t0: performance.now(), with: withId, role, side };
  return true;
}
export function stopEmote() { S.player.emote = null; }

/** The other player of a two-player emote (null if gone). */
export function partnerOf(P, e = P.emote) {
  if (!e || !e.with) return null;
  if (P === S.player) return S.remote.find(r => r.id === e.with) || null;
  return e.with === S.myId ? S.player : (S.remote.find(r => r.id === e.with) || null);
}

/** Called every frame for your own player: ends one-shot emotes when they finish. */
export function tickEmote(P) {
  const e = P.emote; if (!e) return;
  const d = emotes.get(e.id);
  if (!d || (!d.loop && (performance.now() - e.t0) / 1000 > d.duration)) { P.emote = null; return; }
  if (d.together && performance.now() - e.t0 > 1200) {      // the other player moved away or stopped: end it for you too
    const o = partnerOf(P, e);
    if (!o || !o.emote || o.emote.n !== e.n) P.emote = null;
  }
}

/** The current pose of a player's emote (local player or a remote one), or null. */
export function poseFor(P) {
  const e = P.emote; if (!e) return null;
  const d = emotes.get(e.id); if (!d) return null;
  const key = P.id || 'me';
  let k = clocks.get(key);
  if (!k || k.n !== e.n) { k = { n: e.n, t0: e.t0 || performance.now() }; clocks.set(key, k); }
  const t = (performance.now() - k.t0) / 1000;
  if (!d.loop && t > d.duration) return null;
  try {
    let ctx = null;
    if (d.together) {                                          // both players walk to a meeting spot, face each other and play matching poses
      const o = partnerOf(P, e); if (!o) return null;
      const side = e.side === 1 ? 1 : -1;
      ctx = { role: e.role | 0, side, fwd: -side, other: o, gap: d.gap, dist: Math.hypot(o.x - P.x, o.y - P.y), mid: { x: (P.x + o.x) / 2, y: (P.y + o.y) / 2 } };
    }
    const pose = d.mod.pose(t, P, fx, ctx) || {};
    if (ctx) {
      const m = fx.clamp(pose.meet == null ? Math.min(1, t / 0.5, (d.duration - t) / 0.5) : pose.meet);
      pose.x = (pose.x || 0) + (ctx.mid.x + ctx.side * d.gap / 2 - P.x) * m;
      pose.y = (pose.y || 0) + (ctx.mid.y - P.y) * m;
      if (pose.dir == null) pose.dir = ctx.fwd > 0 ? 'right' : 'left';
    }
    return { pose, t, def: d, ctx };
  } catch (err) { console.warn('[emotes]', d.id, err); return null; }
}

// ---- arms ---------------------------------------------------------------------------------------------
// The stock sprite has its arms baked in, so while an emote poses them we draw a sprite without arms (player.js emoteSprites)
// and draw posed arms on top. Angles: 0 hangs down, PI/2 points out sideways, PI points straight up; `f` bends the forearm.
const OL = '#1b2336', SHOULDER_Y = 31, U = 8, V = 8, DEFAULT_ARM = { a: 0.12, f: 0 };
export function drawArms(c, look, dir, arms, sc) {
  const fem = look.gender === 'female';
  const bs = ((BUILDS.find(b => b.id === look.build) || { sx: 1 }).sx) * (fem ? 1.02 : 1);
  const sy = (SHOULDER_Y - 56.96) * sc;                     // sprite y 56.96 is where the feet sit (see drawPlayer)
  const side = dir === 'left' || dir === 'right';
  const limbs = [];
  if (side) {                                                // seen from the side only the near arm shows: use the livelier one
    const l = { ...DEFAULT_ARM, ...arms.l }, r = { ...DEFAULT_ARM, ...arms.r };
    limbs.push({ x: 0, fwd: dir === 'left' ? -1 : 1, ...(Math.abs(l.a - 0.12) > Math.abs(r.a - 0.12) ? l : r) });
  } else {
    limbs.push({ x: -12 * bs * sc, fwd: -1, ...DEFAULT_ARM, ...arms.l }, { x: 12 * bs * sc, fwd: 1, ...DEFAULT_ARM, ...arms.r });
  }
  const v = (a, fwd) => [fwd * Math.sin(a), Math.cos(a)];
  for (const L of limbs) {
    const [ux, uy] = v(L.a, L.fwd), [vx, vy] = v(L.a + L.f, L.fwd);
    const ex = L.x + ux * U * sc, ey = sy + uy * U * sc, hx = ex + vx * V * sc, hy = ey + vy * V * sc;
    c.lineCap = 'round'; c.lineJoin = 'round';
    c.strokeStyle = OL; c.lineWidth = 9.2 * sc; c.beginPath(); c.moveTo(L.x, sy); c.lineTo(ex, ey); c.lineTo(hx, hy); c.stroke();
    c.strokeStyle = look.shirt || '#4a6fd8'; c.lineWidth = 6.4 * sc; c.beginPath(); c.moveTo(L.x, sy); c.lineTo(ex, ey); c.lineTo(hx, hy); c.stroke();
    const skin = look.skin || '#f1c27d', hd = L.hand;
    const finger = (ax, ay, bx, by, w) => {
      c.lineCap = 'round'; c.strokeStyle = OL; c.lineWidth = (w + 1.6) * sc; c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.stroke();
      c.strokeStyle = skin; c.lineWidth = w * sc; c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.stroke();
    };
    const fa = Math.atan2(vy, vx);                              // direction the forearm points
    if (hd === 'thumb') finger(hx, hy - 1 * sc, hx, hy - 6.6 * sc, 2.6);
    else if (hd === 'peace') for (const o of [-0.3, 0.3]) finger(hx, hy, hx + Math.cos(fa + o) * 6.4 * sc, hy + Math.sin(fa + o) * 6.4 * sc, 1.9);
    else if (hd === 'open') for (const o of [-0.55, -0.18, 0.18, 0.55]) finger(hx, hy, hx + Math.cos(fa + o) * 5 * sc, hy + Math.sin(fa + o) * 5 * sc, 1.7);
    c.fillStyle = skin; c.strokeStyle = OL; c.lineWidth = 1.2 * sc;
    c.beginPath(); c.arc(hx, hy, (hd === 'fist' || hd === 'thumb' ? 3.9 : hd === 'open' ? 3.7 : 3.4) * sc, 0, Math.PI * 2); c.fill(); c.stroke();
  }
}

// hand: 'thumb' | 'peace' | 'fist' | 'open' on an arm ({ a, f, hand }) changes how the hand is drawn.
// ---- faces --------------------------------------------------------------------------------------------------------
// While an emote plays the stock face is removed and this one is drawn instead. An emote's pose() may return
//   face: { eyes, brows, mouth, mo, blush }
//   eyes   'open' (blinks by itself) | 'happy' | 'closed' | 'squint' | 'spiral' | 'heart' | 'wink'
//   brows  'flat' | 'angry' | 'sad' | 'up' | 'none'          (default: flat for the male look, none for the female look)
//   mouth  'smile' | 'grin' | 'open' | 'o' | 'frown' | 'flat' | 'smirk' | 'wavy' | 'grit'
//   mo     0..1 how wide 'open' / 'o' mouths are (animate it for talking, laughing, snoring...)
//   blush  true / false (default: on for the female look)
const DEFAULT_FACE = { eyes: 'open', mouth: 'smile' };
const FACE_FILL = '#4a1d24';
export function drawFace(c, look, dir, face, sc, t = 0) {
  if (dir === 'up') return;
  const f = { ...DEFAULT_FACE, ...face }, fem = look.gender === 'female';
  const bs = ((BUILDS.find(b => b.id === look.build) || { sx: 1 }).sx) * (fem ? 1.02 : 1);
  const side = dir === 'left' || dir === 'right';
  const eyes = side ? [{ x: 18, inner: -1 }] : [{ x: 18.8, inner: 1 }, { x: 29.2, inner: -1 }];
  const ey = fem ? 18.6 : 18.2, mx = side ? 17.2 : 24, mk = side ? 0.62 : 1, my = 24.4, mo = fx.clamp(f.mo == null ? 0.5 : f.mo);
  const line = w => { c.strokeStyle = OL; c.lineWidth = w; c.lineCap = 'round'; c.lineJoin = 'round'; };
  c.save();
  c.scale(sc * bs, sc); c.translate(-24, -56.96);        // draw in sprite units
  if (dir === 'right') { c.translate(48, 0); c.scale(-1, 1); }

  if ((f.blush == null ? fem : f.blush) && !side) {
    c.fillStyle = '#ff7a8a'; c.globalAlpha = fem ? 0.5 : 0.4;
    for (const x of [14.8, 33.2]) { c.beginPath(); c.arc(x, 23, fem ? 2.9 : 2.3, 0, Math.PI * 2); c.fill(); }
    c.globalAlpha = 1;
  }
  const blink = f.eyes === 'open' && (t % 3.4) < 0.11;
  for (const e of eyes) {
    const x = e.x, type = blink ? 'closed' : f.eyes === 'wink' ? (e.inner === -1 && !side ? 'closed' : 'open') : f.eyes;
    if (type === 'happy') { line(1.8); c.beginPath(); c.moveTo(x - 2.9, ey + 1.3); c.quadraticCurveTo(x, ey - 3.2, x + 2.9, ey + 1.3); c.stroke(); }
    else if (type === 'closed') { line(1.7); c.beginPath(); c.moveTo(x - 2.9, ey); c.quadraticCurveTo(x, ey + 2.6, x + 2.9, ey); c.stroke(); }
    else if (type === 'squint') { line(1.8); c.beginPath(); c.moveTo(x - e.inner * 2.4, ey - 2.5); c.lineTo(x + e.inner * 1.9, ey); c.lineTo(x - e.inner * 2.4, ey + 2.5); c.stroke(); }
    else if (type === 'spiral') {
      line(1.3); c.beginPath();
      for (let a = 0; a < 12.5; a += 0.35) { const r = 0.4 + a * 0.2, px = x + Math.cos(a + t * 9 * e.inner) * r, py = ey + Math.sin(a + t * 9 * e.inner) * r; if (a === 0) c.moveTo(px, py); else c.lineTo(px, py); }
      c.stroke();
    }
    else if (type === 'heart') fx.shape(c, 'heart', x, ey, 7.4 + Math.sin(t * 9) * 0.8, '#ef4444', 1);
    else {
      const r = fem ? 2.9 : 2.1;
      c.fillStyle = OL; c.beginPath(); c.arc(x, ey, r, 0, Math.PI * 2); c.fill();
      if (fem) { c.fillStyle = '#fff'; c.beginPath(); c.arc(x - 0.9, ey - 1, r * 0.38, 0, Math.PI * 2); c.fill(); c.beginPath(); c.arc(x + 0.9, ey + 0.9, r * 0.18, 0, Math.PI * 2); c.fill(); }
    }
    const br = f.brows || (fem ? 'none' : 'flat'), iy = ey - 4.2;
    if (br !== 'none' && type !== 'heart') {
      line(1.5); c.beginPath();
      const ox = x - e.inner * 3, nx = x + e.inner * 2.6;
      if (br === 'angry') { c.moveTo(ox, iy - 2); c.lineTo(nx, iy + 1.2); }
      else if (br === 'sad') { c.moveTo(ox, iy + 0.8); c.lineTo(nx, iy - 2.2); }
      else if (br === 'up') { c.moveTo(ox, iy - 1.2); c.quadraticCurveTo(x, iy - 4, nx, iy - 1.2); }
      else { c.moveTo(x - 2.6, iy); c.lineTo(x + 2.6, iy); }
      c.stroke();
    }
  }

  c.translate(mx, my); c.scale(mk, 1);                     // mouth, centred on (0, 0)
  const m = f.mouth;
  if (m === 'smile') { line(1.5); c.beginPath(); c.moveTo(-3.6, -0.9); c.quadraticCurveTo(0, 3.4, 3.6, -0.9); c.stroke(); }
  else if (m === 'frown') { line(1.5); c.beginPath(); c.moveTo(-3.4, 1.8); c.quadraticCurveTo(0, -2.3, 3.4, 1.8); c.stroke(); }
  else if (m === 'flat') { line(1.5); c.beginPath(); c.moveTo(-3, 0.5); c.lineTo(3, 0.5); c.stroke(); }
  else if (m === 'smirk') { line(1.5); c.beginPath(); c.moveTo(-3, 1); c.quadraticCurveTo(1.5, 1.8, 3.8, -1.5); c.stroke(); }
  else if (m === 'wavy') { line(1.5); c.beginPath(); for (let i = 0; i <= 8; i++) { const px = -4 + i, py = Math.sin(i * 1.6 + t * 10) * 1.1; if (i === 0) c.moveTo(px, py); else c.lineTo(px, py); } c.stroke(); }
  else if (m === 'grit') {
    c.fillStyle = '#fff'; line(1.3); c.beginPath(); c.roundRect(-4.2, -1.9, 8.4, 4.3, 1.2); c.fill(); c.stroke();
    c.lineWidth = 0.9; c.beginPath(); for (const x of [-2.1, 0, 2.1]) { c.moveTo(x, -1.9); c.lineTo(x, 2.4); } c.moveTo(-4.2, 0.25); c.lineTo(4.2, 0.25); c.stroke();
  }
  else if (m === 'grin') {
    c.fillStyle = FACE_FILL; line(1.3); c.beginPath(); c.moveTo(-4.2, -1.2); c.quadraticCurveTo(0, 0.2, 4.2, -1.2); c.quadraticCurveTo(3.4, 5.2, 0, 5.2); c.quadraticCurveTo(-3.4, 5.2, -4.2, -1.2); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#f87171'; c.beginPath(); c.ellipse(0, 4, 1.9, 1, 0, 0, Math.PI * 2); c.fill();
  }
  else if (m === 'open' || m === 'o') {
    const rx = m === 'o' ? 1.5 + mo * 1.1 : 2.8 + mo * 1.2, ry = m === 'o' ? 1.7 + mo * 1.3 : 0.9 + mo * 3.6;
    c.fillStyle = FACE_FILL; line(1.3); c.beginPath(); c.ellipse(0, ry * 0.5, rx, ry, 0, 0, Math.PI * 2); c.fill(); c.stroke();
    if (m === 'open' && mo > 0.5) { c.fillStyle = '#f87171'; c.beginPath(); c.ellipse(0, ry * 1.1, rx * 0.6, ry * 0.35, 0, 0, Math.PI * 2); c.fill(); }
  }
  c.restore();
}

// ---- tray icons: a silhouette of the pose, generated from the emote's own pose() --------------------------------
export function silhouetteSvg(d) {
  let pose = {};
  try { pose = d.mod.pose(d.preview, { x: 0, y: 0, dir: 'down', look: {} }, fx) || {}; } catch (e) { /* draw the neutral pose */ }
  const arms = pose.arms || {};
  const limb = (x0, fwd, A) => {
    const a = { ...DEFAULT_ARM, ...A }, ex = x0 + fwd * Math.sin(a.a) * U, ey = SHOULDER_Y + Math.cos(a.a) * U;
    const hx = ex + fwd * Math.sin(a.a + a.f) * V, hy = ey + Math.cos(a.a + a.f) * V;
    return `<path d="M${x0} ${SHOULDER_Y}L${ex.toFixed(1)} ${ey.toFixed(1)}L${hx.toFixed(1)} ${hy.toFixed(1)}" fill="none" stroke-width="7.5" stroke-linecap="round" stroke-linejoin="round"/>`;
  };
  const tf = `translate(24 57) rotate(${((pose.rot || 0) * 180 / Math.PI).toFixed(1)}) scale(${pose.sx == null ? 1 : pose.sx} ${pose.sy == null ? 1 : pose.sy}) translate(-24 -57)`;
  return `<svg viewBox="-8 2 64 62" aria-hidden="true"><g transform="${tf}" fill="currentColor" stroke="currentColor">`
    + `<rect x="14" y="45" width="8.5" height="13" rx="3.5" stroke="none"/><rect x="25.5" y="45" width="8.5" height="13" rx="3.5" stroke="none"/>`
    + `<rect x="11" y="27" width="26" height="22" rx="8" stroke="none"/><circle cx="24" cy="17" r="12" stroke="none"/>`
    + limb(12, -1, arms.l) + limb(36, 1, arms.r) + `</g></svg>`;
}

// Two-player icon: both players in side view, facing each other, in the pose at `preview`.
export function duoSilhouetteSvg(d) {
  const g = d.gap / 0.82, figs = [];
  for (const role of [0, 1]) {
    const side = role === 0 ? -1 : 1, fwd = -side;
    let pose = {};
    try { pose = d.mod.pose(d.preview, { x: 0, y: 0, dir: 'left', look: {} }, fx, { role, side, fwd, gap: d.gap, dist: d.gap, other: { x: 0, y: 0 }, mid: { x: 0, y: 0 } }) || {}; } catch (e) { /* neutral */ }
    const l = { ...DEFAULT_ARM, ...(pose.arms || {}).l }, r = { ...DEFAULT_ARM, ...(pose.arms || {}).r };
    const a = Math.abs(l.a - 0.12) > Math.abs(r.a - 0.12) ? l : r;
    const ex = 24 + fwd * Math.sin(a.a) * U, ey = SHOULDER_Y + Math.cos(a.a) * U, hx = ex + fwd * Math.sin(a.a + a.f) * V, hy = ey + Math.cos(a.a + a.f) * V;
    const tf = `translate(${(50 + side * g / 2 - 24).toFixed(1)} 0) translate(24 57) rotate(${(((pose.rot || 0) * 180) / Math.PI).toFixed(1)}) scale(${pose.sx == null ? 1 : pose.sx} ${pose.sy == null ? 1 : pose.sy}) translate(-24 -57)`;
    figs.push(`<g transform="${tf}" fill="currentColor" stroke="currentColor"><rect x="17" y="45" width="7" height="13" rx="3" stroke="none"/><rect x="24" y="45" width="7" height="13" rx="3" stroke="none"/>`
      + `<rect x="15" y="27" width="18" height="22" rx="7" stroke="none"/><circle cx="${24 + fwd * 1.5}" cy="17" r="12" stroke="none"/>`
      + `<path d="M24 ${SHOULDER_Y}L${ex.toFixed(1)} ${ey.toFixed(1)}L${hx.toFixed(1)} ${hy.toFixed(1)}" fill="none" stroke-width="7.5" stroke-linecap="round" stroke-linejoin="round"/></g>`);
  }
  return `<svg viewBox="0 2 100 62" aria-hidden="true">${figs.join('')}</svg>`;
}

// ---- the emote tray (sits under the chat box) ------------------------------------------------------------
export function mountTray(el) {
  el.replaceChildren();
  for (const id of order) {
    const d = emotes.get(id);
    const ico = h('span', { class: 'emote-ico' });
    if (d.iconUrl) ico.append(h('img', { src: d.iconUrl, alt: '', draggable: 'false' })); else ico.innerHTML = silhouetteSvg(d);
    const b = h('button', { class: 'emote-btn', type: 'button', title: d.name, 'aria-label': d.name }, ico, h('span', { class: 'emote-name' }, d.name));
    b.addEventListener('click', () => {
      const chat = document.getElementById('chatInput'); if (chat) chat.blur();   // so WASD / arrows work again straight away
      b.blur();
      playEmote(id);
    });
    el.append(b);
  }
}
