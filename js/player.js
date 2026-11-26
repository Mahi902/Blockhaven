// Blockhaven - the player character: sprites, movement, sitting/lying, click-to-move pathfinding
import { TILE, VERSION, BUILDS } from './config.js';
import { hairParts } from './hair.js';
import { S } from './state.js';
import { catalog } from './catalog.js';
import * as W from './world.js';
import { sound } from './audio.js';

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

export function rebuildSprites() {
  for (const d of DIRS) {
    if (!templates[d]) continue;
    const hair = hairParts(S.player.look.style, d);
    const svg = templates[d]
      .replace('{{hairBack}}', hair.back).replace('{{hairFront}}', hair.front)
      .replace(/\{\{(\w+)\}\}/g, (m, k) => S.player.look[k] || '#888');
    const L = S.player.look, fem = L.gender === 'female';
    const sx = ((BUILDS.find(b => b.id === L.build) || { sx: 1 }).sx) * (fem ? 0.94 : 1);
    let face = '';
    if (d === 'down') face = fem
      ? '<path d="M16.2 16.3 L18 17.2 M21.8 16.3 L20 17.2 M26.2 16.3 L28 17.2 M31.8 16.3 L30 17.2" stroke="#1b2336" stroke-width="1.1" stroke-linecap="round" fill="none"/><path d="M21 23.6 Q24 26.4 27 23.6" fill="none" stroke="#d9455f" stroke-width="1.6" stroke-linecap="round"/>'
      : '<path d="M16.5 14.2 H21.5 M26.5 14.2 H31.5" stroke="#1b2336" stroke-width="1.5" stroke-linecap="round" fill="none"/>';
    const body = svg.replace(/(<svg[^>]*>)/, `$1<g transform="translate(24 0) scale(${sx} 1) translate(-24 0)">`).replace('</svg>', face + '</g></svg>');
    const img = new Image();
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(body);
    sprites[d] = img;
  }
}

export function setLook(part) {
  Object.assign(S.player.look, part);
  rebuildSprites();
  document.dispatchEvent(new CustomEvent('bh-look'));
}

export function say(text) {
  text = String(text || '').trim().slice(0, 140);
  if (!text) return;
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
  P.seat = { id: item.id, lying, back, rot: item.rot };
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
  if (S.modalOpen || document.activeElement === document.getElementById('chatInput')) { P.moving = false; return; }
  const k = S.keys, t = S.touchDir;
  let dx = 0, dy = 0;
  if (k['a'] || k['arrowleft'] || t.left) dx -= 1;
  if (k['d'] || k['arrowright'] || t.right) dx += 1;
  if (k['w'] || k['arrowup'] || t.up) dy -= 1;
  if (k['s'] || k['arrowdown'] || t.down) dy += 1;
  const manual = dx !== 0 || dy !== 0;

  if (P.lock) {
    if (Date.now() >= P.lock.until) { P.lock = null; S.path = null; }
    else { P.moving = false; S.path = null; S.pendingInteract = null; return; }
  }

  if (P.seat) {
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
    if (P.seat.swim) { updateSwim(dt, dx, dy, manual); return; }      // paddling around the tub: keys swim, E / click climbs out
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
    if (!d || !d.hasFunction) continue;
    const dd = distToRect(P.x, P.y, W.itemRect(it));
    const e = { kind: 'item', obj: it, def: d };
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