// Blockhaven - the player character: sprites, movement, sitting/lying, click-to-move pathfinding
import { TILE, VERSION } from './config.js';
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
    const img = new Image();
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
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

  if (P.seat) {
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