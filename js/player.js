// Blockhaven - the player character: sprites, movement, sitting/lying, click-to-move pathfinding
import { TILE, VERSION, BUILDS } from './config.js';
import { hairParts } from './hair.js';
import { S } from './state.js';
import { catalog } from './catalog.js';
import * as W from './world.js';
import { sound } from './audio.js';
import { botDist } from './npc.js';
import { tickEmote } from './emotes.js';

export const hooks = { interact: null };      // set by api.js (avoids a circular import)
export const RADIUS = 12;
const SPEED = 175;                            // world px / second
const PLAYER_BASE = new URL('../img/player/', import.meta.url).href;
const DIRS = ['down', 'up', 'left', 'right'];
const templates = {};
export const sprites = {};

export async function loadPlayerTemplates() {
  await Promise.all(DIRS.map(async d => { templates[d] = await (await fetch(`${PLAYER_BASE}${d}.svg?v=${VERSION}`)).text(); }));
  rebuildSprites();
}

// Female silhouette: fuller chest, narrower waist, wider hips / rear (simple cartoon shapes drawn over the torso).
const OL = '#1b2336';
function femaleBody(tpl, d) {
  let shape;
  if (d === 'down' || d === 'up') {
    const torso = `<path d="M13.5 29 Q10 31.5 8.6 35.6 Q10 39 14.6 40.6 Q12 44 9 48 Q24 52.5 39 48 Q36 44 33.4 40.6 Q38 39 39.4 35.6 Q38 31.5 34.5 29 Q24 26 13.5 29Z" fill="{{shirt}}" stroke="${OL}" stroke-width="1.6" stroke-linejoin="round"/>`;
    const hips = `<path d="M12 44.4 Q24 47 36 44.4 Q40.6 48 40.2 51.6 Q24 55 7.8 51.6 Q7.4 48 12 44.4Z" fill="{{pants}}" stroke="${OL}" stroke-width="1.4" stroke-linejoin="round"/>`;
    const bust = d === 'down' ? `<path d="M14.4 35.2 Q19 42 23.4 35.2 M24.6 35.2 Q29 42 33.6 35.2" fill="none" stroke="${OL}" stroke-width="1" opacity="0.5" stroke-linecap="round"/>` : `<path d="M16 46 Q24 49.5 32 46" fill="none" stroke="${OL}" stroke-width="0.9" opacity="0.4" stroke-linecap="round"/>`;
    shape = torso + bust + hips;
  } else {
    const torso = `<path d="M19 28 Q14 28.6 11.8 34 Q11.8 38 15.6 39.4 Q17 41.4 16.8 43.4 Q15 46.6 16 49.4 Q25 52 35.4 48.6 Q39 44.6 36.2 41.4 Q34.4 39.6 34.6 37.6 Q36.6 32.6 32.6 29 Q26 26.4 19 28Z" fill="{{shirt}}" stroke="${OL}" stroke-width="1.6" stroke-linejoin="round"/>`;
    const hips = `<path d="M16.4 45.6 Q25 47.4 36 45.4 Q39.6 49 36 52 Q25 54 14.6 52 Q12.6 48.6 16.4 45.6Z" fill="{{pants}}" stroke="${OL}" stroke-width="1.4" stroke-linejoin="round"/>`;
    shape = d === 'right' ? `<g transform="translate(48 0) scale(-1 1)">${torso}${hips}</g>` : torso + hips;
  }
  if (d === 'down') tpl = tpl.replace(/(\{\{hairFront\}\})[\s\S]*<\/svg>/, '$1</svg>');
  return tpl.replace(/<rect x="1[15]" y="27"[^>]*\/>/, shape);
}

// Male silhouette (kept light): broader shoulders tapering to a narrower waist, a hint of chest / shoulder blades and a belt line.
function maleBody(tpl, d) {
  let shape;
  const fill = '{{shirt}}', sk = `stroke="${OL}" stroke-width="1.6" stroke-linejoin="round"`;
  if (d === 'down' || d === 'up') {
    const torso = `<path d="M14 28 Q24 25.6 34 28 Q38.6 29.6 38.4 34 Q36.6 40 35.6 44 Q36 47 35.2 49 Q24 51 12.8 49 Q12 47 12.4 44 Q11.4 40 9.6 34 Q9.4 29.6 14 28Z" fill="${fill}" ${sk}/>`;
    const lines = d === 'down'
      ? `<path d="M15.2 34.4 Q19.6 37.6 23.4 34.4 M24.6 34.4 Q28.4 37.6 32.8 34.4" fill="none" stroke="${OL}" stroke-width="0.9" opacity="0.28" stroke-linecap="round"/>`
      : `<path d="M17 33 Q21 37 23.4 33 M24.6 33 Q27 37 31 33" fill="none" stroke="${OL}" stroke-width="0.9" opacity="0.22" stroke-linecap="round"/>`;
    const belt = `<path d="M12.9 47.2 Q24 49.2 35.1 47.2" fill="none" stroke="${OL}" stroke-width="1.1" opacity="0.3" stroke-linecap="round"/>`;
    shape = torso + lines + belt;
  } else {
    const torso = `<path d="M19.5 28 Q15 28.6 14.8 33 Q15.6 38 16.6 42 Q16.2 46 17 49 Q25 51 32 49 Q33 45 32.2 41.6 Q33.6 36 33 32 Q31.6 28 25.5 27.4 Q22 27.2 19.5 28Z" fill="${fill}" ${sk}/>`;
    const belt = `<path d="M16.7 47.2 Q24.5 49 32.2 47.2" fill="none" stroke="${OL}" stroke-width="1.1" opacity="0.3" stroke-linecap="round"/>`;
    shape = d === 'right' ? `<g transform="translate(48 0) scale(-1 1)">${torso}${belt}</g>` : torso + belt;
  }
  return tpl.replace(/<rect x="1[15]" y="27"[^>]*\/>/, shape);
}

// Sprites without the baked-in arms, used while an emote poses the arms itself (see js/emotes.js drawArms).
const stripArms = tpl => tpl.replace(/<rect x="(?:6|35|21)" y="29"[^>]*\/>/g, '').replace(/<circle cx="(?:9\.5|38\.5|24)" cy="46"[^>]*\/>/g, '');

export function buildSprites(L0, opts = {}) {
  const out = {};
  for (const d of DIRS) {
    if (!templates[d]) continue;
    const hair = hairParts(L0.style, d);
    const tpl = opts.noArms ? stripArms(templates[d]) : templates[d];
    const svg = (L0.gender === 'female' ? femaleBody(tpl, d) : maleBody(tpl, d))
      .replace('{{hairBack}}', hair.back).replace('{{hairFront}}', hair.front)
      .replace(/\{\{(\w+)\}\}/g, (m, k) => L0[k] || '#888');
    const L = L0, fem = L.gender === 'female';
    const sx = ((BUILDS.find(b => b.id === L.build) || { sx: 1 }).sx) * (fem ? 1.02 : 1);
    let face = '';
    const O = '#1b2336';
    const eye = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${O}"/><circle cx="${x - 0.9}" cy="${y - 1}" r="${r * 0.38}" fill="#fff"/><circle cx="${x + 0.9}" cy="${y + 0.9}" r="${r * 0.18}" fill="#fff"/>`;
    if (d === 'down') face = fem
      ? `<circle cx="14.6" cy="23" r="2.9" fill="#ff7a8a" opacity="0.5"/><circle cx="33.4" cy="23" r="2.9" fill="#ff7a8a" opacity="0.5"/>${eye(18.6, 18.6, 3.1)}${eye(29.4, 18.6, 3.1)}<path d="M15.6 16.4 L13.8 15.2 M15.2 18.4 L13.4 18.2 M32.4 16.4 L34.2 15.2 M32.8 18.4 L34.6 18.2" stroke="${O}" stroke-width="1.1" stroke-linecap="round" fill="none"/><path d="M21.6 23.4 Q22.8 25.2 24 23.8 Q25.2 25.2 26.4 23.4" fill="none" stroke="#d9455f" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>`
      : '<path d="M16.5 14.2 H21.5 M26.5 14.2 H31.5" stroke="#1b2336" stroke-width="1.5" stroke-linecap="round" fill="none"/>';
    else if (fem && d === 'left') face = `${eye(18, 18.4, 2.8)}<path d="M15.6 16.2 L13.8 15.2" stroke="${O}" stroke-width="1.1" stroke-linecap="round"/>`;
    else if (fem && d === 'right') face = `${eye(30, 18.4, 2.8)}<path d="M32.4 16.2 L34.2 15.2" stroke="${O}" stroke-width="1.1" stroke-linecap="round"/>`;
    const body = svg.replace(/(<svg[^>]*>)/, `$1<g transform="translate(24 0) scale(${sx} 1) translate(-24 0)">`).replace('</svg>', face + '</g></svg>');
    const img = new Image();
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(body);
    out[d] = img;
  }
  return out;
}
const armless = new Map();
export function armlessSet(look) {
  const key = JSON.stringify(look || {});
  let s = armless.get(key);
  if (!s) { if (armless.size > 24) armless.clear(); s = buildSprites(look || S.player.look, { noArms: true }); armless.set(key, s); }
  return s;
}
export function rebuildSprites() { Object.assign(sprites, buildSprites(S.player.look)); armlessSet(S.player.look); }

export function setLook(part) {
  Object.assign(S.player.look, part);
  rebuildSprites();
  document.dispatchEvent(new CustomEvent('bh-look'));
}

export function say(text) {
  text = String(text || '').trim().slice(0, 140);
  if (!text) return;
  if (S.onSay) S.onSay(text);
  S.bubbles = [{ text, ttl: 4 + Math.min(5, text.length * 0.06), max: 4 + Math.min(5, text.length * 0.06) }];
}

// ---- sitting / lying -------------------------------------------------------
const FACE = ['down', 'left', 'up', 'right'];

export function sitOn(item, lying = false) {
  const P = S.player;
  if (P.seat) standUp();
  const f = W.footprint(item);
  const back = { x: P.x, y: P.y };
  let sx, sy;
  if (lying) {
    const d = catalog.get(item.type);
    const c = W.itemCenter(item);
    const th = item.rot * Math.PI / 2;
    const lx = 0, ly = -d.spriteH / 2 + 40;   // head end of the sprite (pillow side)
    sx = c.x + lx * Math.cos(th) - ly * Math.sin(th);
    sy = c.y + lx * Math.sin(th) + ly * Math.cos(th);
  } else {
    let best = null, bd = Infinity;
    for (let y = f.y; y < f.y + f.h; y++) for (let x = f.x; x < f.x + f.w; x++) {
      const cx = (x + .5) * TILE, cy = (y + .5) * TILE;
      const dd = Math.hypot(cx - P.x, cy - P.y);
      if (dd < bd) { bd = dd; best = { x: cx, y: cy }; }
    }
    sx = best.x; sy = best.y;
  }
  P.seat = { id: item.id, lying, back, rot: item.rot, shift: item.type === 'couch' };   // couch: arrow keys slide you between seats
  P.x = sx; P.y = sy; P.dir = FACE[item.rot]; P.moving = false;
  S.path = null; S.pendingInteract = null;
  sound('sit');
}

/** Get in a tub and swim: WASD / arrows paddle you around inside it (local tub coordinates), E / click climbs out. */
const SWIM_SPEED = 80, SW_X = [-30, 40], SW_Y = [6, 14];
const clampTo = (v, r) => Math.max(r[0], Math.min(r[1], v));
export function swimIn(item) {
  const P = S.player;
  if (P.seat) standUp();
  const back = { x: P.x, y: P.y };
  const sw = { lx: 0, ly: 10, t: 0, stroke: 0, dist: 0, rip: [], drops: [], bub: [], ripT: 0, bubT: 0.4, splT: 0 };
  P.seat = { id: item.id, lying: false, swim: sw, back, rot: item.rot };
  P.dir = 'down'; P.moving = false;
  S.path = null; S.pendingInteract = null;
  placeSwimmer(item, sw);
  for (let i = 0; i < 9; i++) sw.drops.push({ x: P.x, y: P.y - 8, vx: (Math.random() - .5) * 90, vy: -60 - Math.random() * 70, life: 0.5 + Math.random() * 0.3 });
  sw.rip.push({ x: P.x, y: P.y - 4, r: 6, a: 0.7 });
  sound('splash');
}
function placeSwimmer(it, sw) {
  const c = W.itemCenter(it), th = it.rot * Math.PI / 2, cs = Math.cos(th), sn = Math.sin(th);
  S.player.x = c.x + sw.lx * cs - sw.ly * sn;
  S.player.y = c.y + sw.lx * sn + sw.ly * cs;
}
function updateSwim(dt, dx, dy, manual) {
  const P = S.player, sw = P.seat.swim, it = W.byId('item', P.seat.id);
  if (!it) { standUp(); return; }
  sw.t += dt; sw.splT -= dt; sw.ripT -= dt; sw.bubT -= dt;
  let moved = false;
  if (manual) {
    const th = it.rot * Math.PI / 2, cs = Math.cos(th), sn = Math.sin(th), len = Math.hypot(dx, dy) || 1;
    const vx = dx / len * SWIM_SPEED * dt, vy = dy / len * SWIM_SPEED * dt;
    const nx = clampTo(sw.lx + vx * cs + vy * sn, SW_X), ny = clampTo(sw.ly - vx * sn + vy * cs, SW_Y);
    moved = Math.hypot(nx - sw.lx, ny - sw.ly) > 0.01;
    sw.dist += Math.hypot(nx - sw.lx, ny - sw.ly); sw.lx = nx; sw.ly = ny;
    if (Math.abs(dx) > Math.abs(dy)) P.dir = dx > 0 ? 'right' : 'left'; else P.dir = dy > 0 ? 'down' : 'up';
  }
  P.moving = moved;
  if (moved) sw.stroke += dt * 7;
  placeSwimmer(it, sw);
  if (moved && sw.splT <= 0) {
    sw.splT = 0.42; sound('splash');
    for (let i = 0; i < 4; i++) sw.drops.push({ x: P.x + (Math.random() - .5) * 26, y: P.y - 6, vx: (Math.random() - .5) * 70, vy: -45 - Math.random() * 55, life: 0.4 + Math.random() * 0.25 });
  }
  if (sw.ripT <= 0) { sw.ripT = moved ? 0.22 : 0.9; sw.rip.push({ x: P.x, y: P.y - 2, r: 5, a: moved ? 0.6 : 0.35 }); }
  if (sw.bubT <= 0) { sw.bubT = 0.5 + Math.random() * 0.7; sw.bub.push({ x: P.x + (Math.random() - .5) * 40, y: P.y - 4, r: 1.5 + Math.random() * 2.5, life: 1.3 }); }
  sw.rip.forEach(r => { r.r += 26 * dt; r.a -= 0.55 * dt; }); sw.rip = sw.rip.filter(r => r.a > 0);
  sw.drops.forEach(d => { d.vy += 260 * dt; d.x += d.vx * dt; d.y += d.vy * dt; d.life -= dt; }); sw.drops = sw.drops.filter(d => d.life > 0);
  sw.bub.forEach(b => { b.y -= 14 * dt; b.life -= dt; }); sw.bub = sw.bub.filter(b => b.life > 0);
}

/** Stand ON an item and run in place (treadmill). The runner faces the sprite's left (console) side.
 *  `rate` scales the stride/step speed; `offset` shifts the spot along the sprite (px, rotates with it). */
export function runOn(item, rate = 1, offset = { x: 0, y: 0 }) {
  const P = S.player;
  if (P.seat) standUp();
  const back = { x: P.x, y: P.y };
  const c = W.itemCenter(item);
  const th = item.rot * Math.PI / 2;
  P.x = c.x + offset.x * Math.cos(th) - offset.y * Math.sin(th);
  P.y = c.y + offset.x * Math.sin(th) + offset.y * Math.cos(th) - 7;   // feet land on the belt
  P.seat = { id: item.id, lying: false, run: true, rate, back, rot: item.rot };
  P.dir = ['left', 'up', 'right', 'down'][item.rot % 4];
  P.moving = true; P.walk = 0;
  S.path = null; S.pendingInteract = null;
  sound('sit');
}

/** Step INSIDE an item (shower): glide into it and stand there. E / click / a move key steps back out.
 *  opts: { offset:{x,y} px from the item centre (rotates with it), scrub:bool (lather animation) } */
export function stepInto(item, opts = {}) {
  const P = S.player;
  if (P.seat) standUp();
  const back = { x: P.x, y: P.y };
  const c = W.itemCenter(item), th = item.rot * Math.PI / 2, o = opts.offset || { x: 0, y: 0 };
  const tx = c.x + o.x * Math.cos(th) - o.y * Math.sin(th), ty = c.y + o.x * Math.sin(th) + o.y * Math.cos(th) + 2;
  P.seat = { id: item.id, lying: false, stand: true, scrub: !!opts.scrub, back, rot: item.rot, glide: { fx: P.x, fy: P.y, tx, ty, t: 0 } };
  P.moving = true; S.path = null; S.pendingInteract = null;
  sound('door');
}

/** Hammock: lie down and sway. Left / right arrows (or A / D) rock you; up / down gets you off. */
export function swayOn(item) {
  sitOn(item, true);
  S.player.seat.sway = { a: 0, v: 0, rot: 0, t: 0, snd: 0 };
}

/** Rocking chair that spins: arrow keys / A D spin you left or right. */
export function spinOn(item) {
  sitOn(item, false);
  P_spin(item);
}
function P_spin(item) { S.player.seat.spin = { a: 0, v: 0, t: 0, snd: 0 }; }

/** Freeze the player for a while (washing hands, laundry). opts: { ms, face:{x,y}, anim:'scrub'|'suck', toward:{x,y} } */
export function lockPlayer(opts) {
  const P = S.player;
  if (P.seat) standUp();
  P.moving = false; S.path = null; S.pendingInteract = null;
  if (opts.face) { const dx = opts.face.x - P.x, dy = opts.face.y - P.y; P.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'); }
  P.lock = { until: Date.now() + (opts.ms || 1000), anim: opts.anim || null, toward: opts.toward || null, t0: performance.now(), ms: opts.ms || 1000 };
}
export function unlockPlayer() { S.player.lock = null; S.path = null; }

export function standUp() {
  const P = S.player;
  if (!P.seat) return;
  P.moving = false;
  const it = W.byId('item', P.seat.id);
  const back = P.seat.back;
  P.seat = null;
  if (!it) return;
  const f = W.footprint(it);
  let best = null, bd = Infinity;
  for (let y = f.y - 2; y <= f.y + f.h + 1; y++) for (let x = f.x - 2; x <= f.x + f.w + 1; x++) {
    if (!W.inBounds(x, y)) continue;
    if (x >= f.x && x < f.x + f.w && y >= f.y && y < f.y + f.h) continue;
    const cx = (x + .5) * TILE, cy = (y + .5) * TILE;
    if (W.circleHits(cx, cy, RADIUS + 1)) continue;
    const dd = Math.hypot(cx - back.x, cy - back.y) + Math.hypot(cx - (f.x + f.w / 2) * TILE, cy - (f.y + f.h / 2) * TILE) * 0.15;
    if (dd < bd) { bd = dd; best = { x: cx, y: cy }; }
  }
  if (best) { P_set(best.x, best.y); } else { P_set(back.x, back.y); }
}
function P_set(x, y) { S.player.x = x; S.player.y = y; }

// ---- movement ----------------------------------------------------------------
function tryMove(dx, dy) {
  const P = S.player;
  let moved = false;
  if (dx) { if (!W.circleHits(P.x + dx, P.y, RADIUS)) { P.x += dx; moved = true; } }
  if (dy) { if (!W.circleHits(P.x, P.y + dy, RADIUS)) { P.y += dy; moved = true; } }
  P.x = Math.max(RADIUS, Math.min(W.world.w * TILE - RADIUS, P.x));
  P.y = Math.max(RADIUS, Math.min(W.world.h * TILE - RADIUS, P.y));
  return moved;
}

let stepClock = 0, stuck = 0;

export function updatePlayer(dt) {
  const P = S.player;
  if (P.emote) tickEmote(P);
  if (S.modalOpen || document.activeElement === document.getElementById('chatInput')) { P.moving = false; return; }
  const k = S.keys, t = S.touchDir;
  let dx = 0, dy = 0;
  if (k['a'] || k['arrowleft'] || t.left) dx -= 1;
  if (k['d'] || k['arrowright'] || t.right) dx += 1;
  if (k['w'] || k['arrowup'] || t.up) dy -= 1;
  if (k['s'] || k['arrowdown'] || t.down) dy += 1;
  const manual = dx !== 0 || dy !== 0;
  if (P.emote && (manual || P.seat || P.lock || (S.path && S.path.length))) P.emote = null;   // moving, sitting or using something ends an emote

  if (P.lock) {
    if (Date.now() >= P.lock.until) { P.lock = null; S.path = null; }
    else { P.moving = false; S.path = null; S.pendingInteract = null; return; }
  }

  if (P.seat) {
    if (P.seat.sway) {                        // hammock: a damped swing pushed by the arrow keys
      const sw = P.seat.sway;
      if (dy !== 0) { leaveSeat(W.byId('item', P.seat.id)); return; }
      sw.v += (dx * 16 - sw.a * 14 - sw.v * 1.1) * dt;
      sw.v = Math.max(-2.2, Math.min(2.2, sw.v));
      sw.a = Math.max(-0.32, Math.min(0.32, sw.a + sw.v * dt));
      sw.t += dt; sw.snd -= dt;
      sw.rot = sw.a + Math.sin(sw.t * 1.6) * 0.02;
      P.moving = false;
      if (Math.abs(sw.v) > 0.9 && sw.snd <= 0) { sound('step'); sw.snd = 0.7; }
      return;
    }
    if (P.seat.spin) {
      const sp = P.seat.spin;
      if (dy !== 0) { leaveSeat(W.byId('item', P.seat.id)); return; }     // up / down gets you off
      sp.v += dx * 16 * dt;
      sp.v *= Math.pow(0.32, dt);
      sp.v = Math.max(-11, Math.min(11, sp.v));
      sp.a += sp.v * dt; sp.t += dt; sp.snd -= dt;
      const q = Math.round(sp.a / (Math.PI / 2)); P.dir = FACE[((q % 4) + 4) % 4];
      P.moving = false;
      if (Math.abs(sp.v) > 2 && sp.snd <= 0) { sound('step'); sp.snd = 0.35 - Math.min(0.2, Math.abs(sp.v) * 0.015); }
      return;
    }
    if (P.seat.stand) {                       // standing inside a stall: walk in, then just stand there
      const g = P.seat.glide;
      if (g) {
        if (manual) { leaveSeat(W.byId('item', P.seat.id)); return; }
        g.t = Math.min(1, g.t + dt / 0.42);
        const e = g.t * g.t * (3 - 2 * g.t);
        P.x = g.fx + (g.tx - g.fx) * e; P.y = g.fy + (g.ty - g.fy) * e;
        P.moving = true; P.walk += dt * 11;
        const ddx = g.tx - g.fx, ddy = g.ty - g.fy;
        P.dir = Math.abs(ddx) > Math.abs(ddy) ? (ddx > 0 ? 'right' : 'left') : (ddy > 0 ? 'down' : 'up');
        if (g.t >= 1) { P.seat.glide = null; P.moving = false; P.dir = 'down'; }
        return;
      }
      if (manual) { leaveSeat(W.byId('item', P.seat.id)); return; }
      P.moving = false;
      return;
    }
    if (P.seat.swim) { updateSwim(dt, dx, dy, manual); return; }      // paddling around the tub: keys swim, E / click climbs out
    if (P.seat.shift) {                       // couch: slide between seats along its length, anything else gets you off
      const q = P.seat, horiz = q.rot % 2 === 0, along = horiz ? dx : dy, across = horiz ? dy : dx;
      if (q.slide) {
        q.slide.t = Math.min(1, q.slide.t + dt / 0.16);
        const e = q.slide.t * q.slide.t * (3 - 2 * q.slide.t);
        P.x = q.slide.fx + (q.slide.tx - q.slide.fx) * e; P.y = q.slide.fy + (q.slide.ty - q.slide.fy) * e;
        if (q.slide.t >= 1) q.slide = null;
      }
      q.cd = Math.max(0, (q.cd || 0) - dt);
      if (across !== 0) { leaveSeat(W.byId('item', q.id)); return; }
      if (along !== 0) {
        if (!q.slide && (along !== q.prev || q.cd <= 0)) {          // a fresh press, or held down: move one seat
          const it = W.byId('item', q.id), f = it && W.footprint(it);
          const cx = Math.floor(P.x / TILE) + (horiz ? along : 0), cy = Math.floor(P.y / TILE) + (horiz ? 0 : along);
          if (f && cx >= f.x && cx < f.x + f.w && cy >= f.y && cy < f.y + f.h) {
            q.slide = { fx: P.x, fy: P.y, tx: (cx + .5) * TILE, ty: (cy + .5) * TILE, t: 0 };
            sound('step');
          }
          q.cd = 0.3;
        }
        q.prev = along; P.moving = false;
        return;
      }
      q.prev = 0;
    }
    if (manual) { leaveSeat(W.byId('item', P.seat.id)); return; }
    if (P.seat.run) {                         // running in place: keep the stride going
      const rate = P.seat.rate || 1;
      P.moving = true; P.walk += dt * 11 * rate;
      stepClock -= dt;
      if (stepClock <= 0) { sound('step'); stepClock = 0.3 / rate; }
      return;
    }
    P.moving = false;
    return;
  }

  windPush(dt);

  if (manual) { S.path = null; S.pendingInteract = null; stuck = 0; }
  else if (S.path && S.path.length) {
    const wp = S.path[0];
    const vx = wp.x - P.x, vy = wp.y - P.y, d = Math.hypot(vx, vy);
    if (d < 5) { S.path.shift(); stuck = 0; }
    else { dx = vx / d; dy = vy / d; }
  }
  if (!manual && !(S.path && S.path.length)) {
    if (S.path && !S.path.length) {
      S.path = null;
      const pi = S.pendingInteract; S.pendingInteract = null;
      if (pi) { const o = W.byId(pi.kind, pi.id); if (o && hooks.interact) hooks.interact(pi.kind, o); }
    }
    P.moving = false;
    return;
  }

  const len = Math.hypot(dx, dy) || 1;
  const mx = dx / len * SPEED * dt, my = dy / len * SPEED * dt;
  const moved = tryMove(mx, my);
  if (moved) {
    stuck = 0; P.moving = true; P.walk += dt * 11;
    if (Math.abs(dx) > Math.abs(dy)) P.dir = dx > 0 ? 'right' : 'left'; else P.dir = dy > 0 ? 'down' : 'up';
    stepClock -= dt;
    if (stepClock <= 0) { sound('step'); stepClock = 0.3; }
  } else {
    P.moving = false;
    if (S.path && S.path.length && ++stuck > 8) {
      stuck = 0;
      // blocked: maybe a closed door - ask the nearest one to open
      const door = nearestInteractive(55, e => e.kind === 'edge' && W.isClosedEdge(e.obj));
      if (door && hooks.interact) { hooks.interact('edge', door.obj); }
      else { S.path = null; S.pendingInteract = null; }
    }
  }
}

/** A running fan blows you straight back, at your own walking speed, while you stand in front of it.
 *  The fan faces down at rotation 0 (R rotates it); wind reach grows with its speed setting. */
export const FAN_REACH = [0, 2, 3, 4];          // tiles of wind (from the fan's centre) for off / low / medium / high
export function windPush(dt) {
  const P = S.player;
  if (P.seat || P.lock) return;
  for (const it of W.world.items) {
    if (it.type !== 'fan') continue;
    const sp = (it.state && it.state.speed) | 0; if (sp < 1) continue;
    const c = W.itemCenter(it), th = it.rot * Math.PI / 2, fx = -Math.sin(th), fy = Math.cos(th);
    const rx = P.x - c.x, ry = P.y - c.y;
    const along = rx * fx + ry * fy, side = -rx * fy + ry * fx;
    if (along > 4 && along < FAN_REACH[Math.min(3, sp)] * TILE && Math.abs(side) < 26) {
      tryMove(fx * SPEED * dt, fy * SPEED * dt);
      return;
    }
  }
}

function leaveSeat(it) {
  const mod = it && hooks.leave;
  if (mod) hooks.leave(it); else standUp();
  if (S.player.seat) standUp();
}

// ---- finding things to interact with ---------------------------------------------
export function distToRect(px, py, r) {
  const dx = Math.max(r.x - px, 0, px - (r.x + r.w));
  const dy = Math.max(r.y - py, 0, py - (r.y + r.h));
  return Math.hypot(dx, dy);
}

export function nearestInteractive(reach = 46, filter = null) {
  const P = S.player;
  let best = null, bd = reach;
  for (const it of W.world.items) {
    const d = catalog.get(it.type);
    if (!d || !d.hasFunction || it.type === 'cat') continue;
    const dd = distToRect(P.x, P.y, W.itemRect(it));
    const e = { kind: 'item', obj: it, def: d };
    if (dd < bd && (!filter || filter(e))) { bd = dd; best = e; }
  }
  for (const it of W.world.items) {   // an NPC away from its dock can be reached where it stands
    const d = catalog.get(it.type);
    if (!d || !d.npc || !d.hasFunction) continue;
    const dd = botDist(it, P.x, P.y);
    const e = { kind: 'item', obj: it, def: d, bot: true };
    if (dd < bd && (!filter || filter(e))) { bd = dd; best = e; }
  }
  for (const ed of W.world.edges) {
    const d = catalog.get(ed.type);
    if (!d || !d.hasFunction) continue;
    const dd = distToRect(P.x, P.y, W.edgeRect(ed)) - 4;
    const e = { kind: 'edge', obj: ed, def: d };
    if (dd < bd && (!filter || filter(e))) { bd = dd; best = e; }
  }
  return best;
}

// ---- path finding (breadth first on the tile grid) ---------------------------------------
function stepBlocked(x, y, nx, ny) {
  let e;
  if (nx > x) e = W.edgeAtKey('v', nx, y);
  else if (nx < x) e = W.edgeAtKey('v', x, y);
  else if (ny > y) e = W.edgeAtKey('h', x, ny);
  else e = W.edgeAtKey('h', x, y);
  if (!e) return false;
  if (!W.isClosedEdge(e)) return false;
  const d = catalog.get(e.type);
  return !(d && d.hasFunction);       // closed but openable pieces (doors) are fine, we open them on the way
}

export function findPath(goals) {
  const P = S.player;
  const sx = Math.floor(P.x / TILE), sy = Math.floor(P.y / TILE);
  if (!goals.length) return null;
  const goalSet = new Set(goals.map(g => W.ckey(g.x, g.y)));
  const prev = new Map();
  const start = W.ckey(sx, sy);
  prev.set(start, null);
  const q = [[sx, sy]];
  let found = goalSet.has(start) ? start : null;
  for (let i = 0; i < q.length && !found; i++) {
    const [x, y] = q[i];
    for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + ox, ny = y + oy, k = W.ckey(nx, ny);
      if (!W.inBounds(nx, ny) || prev.has(k)) continue;
      if (W.itemAtCell(nx, ny)) continue;
      if (stepBlocked(x, y, nx, ny)) continue;
      prev.set(k, W.ckey(x, y));
      if (goalSet.has(k)) { found = k; break; }
      q.push([nx, ny]);
    }
  }
  if (!found) return null;
  const cells = [];
  for (let k = found; k && k !== start; k = prev.get(k)) { const [cx, cy] = k.split(',').map(Number); cells.unshift({ x: cx, y: cy }); }
  return cells.map(c => ({ x: (c.x + .5) * TILE, y: (c.y + .5) * TILE }));
}

/** Click-to-move: walk to a world point. */
export function walkTo(px, py) {
  const cx = Math.floor(px / TILE), cy = Math.floor(py / TILE);
  if (!W.inBounds(cx, cy)) return false;
  if (W.itemAtCell(cx, cy)) return false;
  const path = findPath([{ x: cx, y: cy }]);
  if (!path) { sound('error'); return false; }
  if (path.length && !W.circleHits(px, py, RADIUS)) path[path.length - 1] = { x: px, y: py };
  S.path = path; S.pendingInteract = null;
  return true;
}

/** Click a functional piece: walk next to it, then use it. */
export function walkToAndUse(kind, obj) {
  const goals = [];
  if (kind === 'item') {
    const f = W.footprint(obj);
    for (let y = f.y - 1; y <= f.y + f.h; y++) for (let x = f.x - 1; x <= f.x + f.w; x++) {
      const inside = x >= f.x && x < f.x + f.w && y >= f.y && y < f.y + f.h;
      const corner = (x < f.x || x >= f.x + f.w) && (y < f.y || y >= f.y + f.h);
      if (!inside && !corner && W.inBounds(x, y) && !W.itemAtCell(x, y)) goals.push({ x, y });
    }
  } else {
    const e = obj;
    const cells = e.o === 'h' ? [[e.x, e.y - 1], [e.x, e.y]] : [[e.x - 1, e.y], [e.x, e.y]];
    for (const [x, y] of cells) if (W.inBounds(x, y) && !W.itemAtCell(x, y)) goals.push({ x, y });
  }
  const path = findPath(goals);
  if (!path) { sound('error'); return false; }
  S.path = path; S.pendingInteract = { kind, id: obj.id };
  if (!path.length) { S.path = null; S.pendingInteract = null; if (hooks.interact) hooks.interact(kind, obj); }
  return true;
}

/** Stand up from whatever the player is sitting/lying on (runs the piece's leave() if it has one). */
export function leaveSeatNow() {
  if (!S.player.seat) return;
  leaveSeat(W.byId('item', S.player.seat.id));
}