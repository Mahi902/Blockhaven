// Blockhaven - the world model: items, wall/door/window edges, floors, rooms, undo/redo, saving
import { TILE, WALL_T, WORLD_W, WORLD_H, SAVE_KEY } from './config.js';
import { catalog } from './catalog.js';

export let world = fresh();
export let version = 0;
export const listeners = [];
let undoStack = [], redoStack = [], saveTimer = 0;
const MAX_UNDO = 60;

function fresh() { return { w: WORLD_W, h: WORLD_H, next: 1, items: [], edges: [], floors: {}, rooms: [] }; }
const snap = () => JSON.stringify(world);
export const ckey = (x, y) => `${x},${y}`;
export const inBounds = (x, y) => x >= 0 && y >= 0 && x < world.w && y < world.h;
const nid = () => world.next++;

// ---- history / saving
export function touch() {
  version++;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(save, 400);
  listeners.forEach(f => f());
}
export function begin() { undoStack.push(snap()); if (undoStack.length > MAX_UNDO) undoStack.shift(); redoStack = []; }
export const canUndo = () => undoStack.length > 0;
export const canRedo = () => redoStack.length > 0;
export function undo() { if (!undoStack.length) return false; redoStack.push(snap()); world = JSON.parse(undoStack.pop()); touch(); return true; }
export function redo() { if (!redoStack.length) return false; undoStack.push(snap()); world = JSON.parse(redoStack.pop()); touch(); return true; }
export function clearHistory() { undoStack = []; redoStack = []; }
export function clearAll() { world = fresh(); clearHistory(); }
export function save() { try { localStorage.setItem(SAVE_KEY, snap()); } catch (e) { /* storage full or blocked */ } }
export function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY); if (!raw) return false;
    const w = JSON.parse(raw); if (!w || !Array.isArray(w.items)) return false;
    world = Object.assign(fresh(), w); clearHistory(); version++; return true;
  } catch (e) { return false; }
}

export function byId(kind, id) {
  const list = kind === 'item' ? world.items : kind === 'edge' ? world.edges : world.rooms;
  return list.find(o => o.id === id) || null;
}

// ---- items
export function footprintFor(type, x, y, rot) {
  const d = catalog.get(type), odd = rot % 2 === 1;
  return { x, y, w: odd ? d.h : d.w, h: odd ? d.w : d.h };
}
export const footprint = it => footprintFor(it.type, it.x, it.y, it.rot);
export function itemRect(it) { const f = footprint(it); return { x: f.x * TILE, y: f.y * TILE, w: f.w * TILE, h: f.h * TILE }; }
export function itemCenter(it) { const r = itemRect(it); return { x: r.x + r.w / 2, y: r.y + r.h / 2 }; }
export function itemAtCell(cx, cy) {
  return world.items.find(it => { if (!catalog.get(it.type)) return false; const f = footprint(it); return cx >= f.x && cy >= f.y && cx < f.x + f.w && cy < f.y + f.h; }) || null;
}
export const itemAtPx = (px, py) => itemAtCell(Math.floor(px / TILE), Math.floor(py / TILE));

export function canPlace(type, x, y, rot, ignoreId = null) {
  if (!catalog.get(type)) return false;
  const f = footprintFor(type, x, y, rot);
  if (x < 0 || y < 0 || x + f.w > world.w || y + f.h > world.h) return false;
  for (const it of world.items) {
    if (it.id === ignoreId || !catalog.get(it.type)) continue;
    const g = footprint(it);
    if (f.x < g.x + g.w && g.x < f.x + f.w && f.y < g.y + g.h && g.y < f.y + f.h) return false;
  }
  for (const e of world.edges) {      // a wall may not run through the middle of a piece
    if (e.o === 'v' && e.x > f.x && e.x < f.x + f.w && e.y >= f.y && e.y < f.y + f.h) return false;
    if (e.o === 'h' && e.y > f.y && e.y < f.y + f.h && e.x >= f.x && e.x < f.x + f.w) return false;
  }
  return true;
}
export function placeItem(type, x, y, rot, color) {
  const it = { id: nid(), type, x, y, rot, color, state: {} };
  world.items.push(it); return it;
}
export function removeItem(it) { world.items.splice(world.items.indexOf(it), 1); }

// ---- edges (walls, doors, windows live on tile borders)
export const edgeInBounds = (o, x, y) => o === 'h' ? x >= 0 && x < world.w && y >= 0 && y <= world.h : x >= 0 && x <= world.w && y >= 0 && y < world.h;
export const edgeAtKey = (o, x, y) => world.edges.find(e => e.o === o && e.x === x && e.y === y) || null;
export function edgeCenter(e) { return e.o === 'h' ? { x: (e.x + .5) * TILE, y: e.y * TILE } : { x: e.x * TILE, y: (e.y + .5) * TILE }; }
export function edgeRect(e) {
  const c = edgeCenter(e), t = WALL_T;
  return e.o === 'h' ? { x: c.x - TILE / 2, y: c.y - t / 2, w: TILE, h: t } : { x: c.x - t / 2, y: c.y - TILE / 2, w: t, h: TILE };
}
export function placeEdge(type, o, x, y, color) {
  const old = edgeAtKey(o, x, y); if (old) world.edges.splice(world.edges.indexOf(old), 1);
  const e = { id: nid(), type, o, x, y, color, state: {} };
  world.edges.push(e); return e;
}
export function removeEdge(e) { world.edges.splice(world.edges.indexOf(e), 1); }
export function nearestEdge(px, py) {
  const cx = Math.floor(px / TILE), cy = Math.floor(py / TILE), fx = px / TILE - cx, fy = py / TILE - cy;
  const m = Math.min(fx, 1 - fx, fy, 1 - fy);
  if (m === fx) return { o: 'v', x: cx, y: cy };
  if (m === 1 - fx) return { o: 'v', x: cx + 1, y: cy };
  if (m === fy) return { o: 'h', x: cx, y: cy };
  return { o: 'h', x: cx, y: cy + 1 };
}
export function edgeAtPx(px, py, tol = 8) {
  let best = null, bd = Infinity;
  for (const e of world.edges) {
    const r = edgeRect(e);
    const dx = Math.max(r.x - px, 0, px - (r.x + r.w)), dy = Math.max(r.y - py, 0, py - (r.y + r.h)), d = Math.hypot(dx, dy);
    if (d <= tol && d < bd) { bd = d; best = e; }
  }
  return best;
}
export const isClosedEdge = e => !(e.state && e.state.open === true);

/** Does a circle at (px,py) touch furniture or a closed wall piece? */
export function circleHits(px, py, r) {
  const hit = rc => Math.hypot(Math.max(rc.x - px, 0, px - (rc.x + rc.w)), Math.max(rc.y - py, 0, py - (rc.y + rc.h))) < r;
  for (const it of world.items) if (catalog.get(it.type) && hit(itemRect(it))) return true;
  for (const e of world.edges) if (isClosedEdge(e) && hit(edgeRect(e))) return true;
  return false;
}

// ---- floors + rooms
export function paintFloor(cells, name) {
  for (const [x, y] of cells) { if (!inBounds(x, y)) continue; if (name) world.floors[ckey(x, y)] = name; else delete world.floors[ckey(x, y)]; }
}
export function addRoom(x, y, w, h) {
  const r = { id: nid(), name: `Room ${world.rooms.length + 1}`, x, y, w, h, floor: null, wall: null, ceiling: null };
  world.rooms.push(r); return r;
}
export const roomAt = (cx, cy) => [...world.rooms].reverse().find(r => cx >= r.x && cy >= r.y && cx < r.x + r.w && cy < r.y + r.h) || null;
export function setRoomFloor(room, name) {
  room.floor = name || null;
  const cells = []; for (let y = room.y; y < room.y + room.h; y++) for (let x = room.x; x < room.x + room.w; x++) cells.push([x, y]);
  paintFloor(cells, name);
}
export function setRoomWalls(room, color) {
  room.wall = color || null; if (!color) return;
  for (const e of world.edges) {
    if (e.type !== 'wall') continue;
    const onH = e.o === 'h' && e.x >= room.x && e.x < room.x + room.w && (e.y === room.y || e.y === room.y + room.h);
    const onV = e.o === 'v' && e.y >= room.y && e.y < room.y + room.h && (e.x === room.x || e.x === room.x + room.w);
    if (onH || onV) e.color = color;
  }
}
