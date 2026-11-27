// Blockhaven - emotes. Every folder in /emotes/ is one emote (see docs/EMOTES.md):
//   emotes/<id>/info.txt   name=Wave / duration=2.6 / loop=0 / order=10 / preview=0.9   (preview = the moment drawn as the tray silhouette)
//   emotes/<id>/emote.js   export default { pose(t, P, fx) { ... }, draw(c, P, t, fx) { ... } }
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
export const order = [];           // ids in tray order

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
    duration: Math.max(0.2, Number(info.duration) || 2), loop: info.loop === '1' || info.loop === 'true',
    order: Number.isFinite(Number(info.order)) && info.order !== undefined ? Number(info.order) : 999, mod,
  });
}

export async function loadEmotes() {
  const folders = await listFolders();
  await Promise.all(Object.entries(folders).map(([id, files]) => loadOne(id, files).catch(e => console.warn('[emotes] skipped', id, e))));
  order.length = 0;
  order.push(...[...emotes.values()].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name)).map(d => d.id));
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
  if (!d || !S.started) return false;
  if (P.seat || P.lock) { toast('Stand up first to emote', 1800); return false; }
  S.path = null; S.pendingInteract = null; P.moving = false;
  P.emote = { id, n: ++seq, t0: performance.now() };
  sound('click');
  return true;
}
export function stopEmote() { S.player.emote = null; }

/** Called every frame for your own player: ends one-shot emotes when they finish. */
export function tickEmote(P) {
  const e = P.emote; if (!e) return;
  const d = emotes.get(e.id);
  if (!d || (!d.loop && (performance.now() - e.t0) / 1000 > d.duration)) P.emote = null;
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
  try { return { pose: d.mod.pose(t, P, fx) || {}, t, def: d }; } catch (err) { console.warn('[emotes]', d.id, err); return null; }
}

// ---- arms ---------------------------------------------------------------------------------------------
// The stock sprite has its arms baked in, so while an emote poses them we draw a sprite without arms (player.js armlessSet)
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
    c.fillStyle = look.skin || '#f1c27d'; c.strokeStyle = OL; c.lineWidth = 1.2 * sc;
    c.beginPath(); c.arc(hx, hy, 3.4 * sc, 0, Math.PI * 2); c.fill(); c.stroke();
  }
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
