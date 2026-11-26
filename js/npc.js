// Blockhaven - NPCs. An NPC is a furniture folder with npc=1 in info.txt; the piece on the grid is its dock/home,
// and the live character (position, mood, speech) is kept here, per placed item. Right now: the Cleaning Robot.
import { TILE, COLOR_HEX } from './config.js';
import { S, worldToScreen } from './state.js';
import * as W from './world.js';
import { catalog } from './catalog.js';

const SPEED = 62, R = 14;
const bots = new Map();   // item id -> live robot
const keyOf = (cx, cy) => cy * 100 + cx;
const cellOf = v => Math.floor(v / TILE);
const ctr = c => (c + 0.5) * TILE;

export function botOf(it) {
  let b = bots.get(it.id);
  if (!b) {
    const st = it.state || (it.state = {}), d = W.itemCenter(it);
    if (st.rest && st.restFor !== `${it.x},${it.y},${it.rot}`) delete st.rest;
    const home = st.rest || d;
    b = { x: home.x, y: home.y, ang: Math.PI / 2, mode: 'idle', path: null, todo: new Set(), dirty: 0, clean: 0, sv: null, bubble: null, cool: 0, wait: 0, fails: 0, after: null, resume: false, shine: [], t: 0 };
    bots.set(it.id, b);
  }
  return b;
}

// ---- world queries
function hit(px, py, r, ignore) {
  const t = rc => Math.hypot(Math.max(rc.x - px, 0, px - (rc.x + rc.w)), Math.max(rc.y - py, 0, py - (rc.y + rc.h))) < r;
  for (const it of W.world.items) if (it.id !== ignore && catalog.get(it.type) && t(W.itemRect(it))) return true;
  for (const e of W.world.edges) if (W.isClosedEdge(e) && e.type !== 'door' && t(W.edgeRect(e))) return true;
  return false;
}
const playerNear = (x, y, r) => S.started && Math.hypot(S.player.x - x, S.player.y - y) < r;

function bfs(it, b, noPlayer) {
  const w = W.world.w, h = W.world.h, id = it.id;
  const sx = cellOf(b.x), sy = cellOf(b.y), dist = new Map([[keyOf(sx, sy), 0]]), prev = new Map(), q = [[sx, sy]];
  const okCell = (cx, cy) => cx >= 0 && cy >= 0 && cx < w && cy < h && !hit(ctr(cx), ctr(cy), R, id) && (noPlayer || !playerNear(ctr(cx), ctr(cy), 34));
  for (let i = 0; i < q.length; i++) {
    const [cx, cy] = q[i];
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cx + dx, ny = cy + dy, k = keyOf(nx, ny);
      if (dist.has(k) || !okCell(nx, ny)) continue;
      if (hit(ctr(cx) + dx * TILE / 2, ctr(cy) + dy * TILE / 2, R, id)) continue;   // a wall between the two cells
      dist.set(k, dist.get(keyOf(cx, cy)) + 1); prev.set(k, keyOf(cx, cy)); q.push([nx, ny]);
    }
  }
  return { dist, prev, start: keyOf(sx, sy) };
}
function pathTo(res, k) {
  const out = [], sc = { x: ctr(res.start % 100), y: ctr(Math.floor(res.start / 100)) };
  while (k !== res.start && k != null) { out.push({ x: ctr(k % 100), y: ctr(Math.floor(k / 100)) }); k = res.prev.get(k); }
  out.reverse(); out.unshift(sc);
  return out;
}

// ---- speech
export function npcSay(b, text) { b.bubble = { text, ttl: 3.2 + Math.min(4, text.length * 0.05) }; }

// ---- control (used by api.bot)
export function botApi(it) {
  const b = () => botOf(it);
  const st = () => it.state || (it.state = {});
  return {
    get status() { return b().mode; },
    get servicing() { return b().mode === 'service'; },
    get moving() { return ['clean', 'return', 'wait', 'home'].includes(b().mode); },
    get busy() { return b().mode !== 'idle'; },
    get near() { return Math.hypot(S.player.x - b().x, S.player.y - b().y) < 52; },
    get rooms() { return W.world.rooms.map(r => ({ id: r.id, name: r.name, w: r.w, h: r.h })); },
    get chosen() { return (st().rooms || []).filter(id => W.byId('room', id)); },
    choose: ids => { st().rooms = ids.slice(); },
    start: ids => start(it, ids),
    stop: () => stop(it),
  };
}

function start(it, ids) {
  const b = botOf(it);
  if (b.mode !== 'idle') return false;
  b.todo = new Set(); b.fails = 0;
  const res = bfs(it, b, true);
  for (const id of ids) {
    const r = W.byId('room', id); if (!r) continue;
    for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) if (res.dist.has(keyOf(x, y))) b.todo.add(keyOf(x, y));
  }
  if (!b.todo.size) { npcSay(b, "I can't do it"); return false; }
  b.total = b.todo.size; b.path = null; b.mode = 'clean'; b.resume = false;
  npcSay(b, 'Starting to clean');
  return true;
}
function stop(it) {
  const b = botOf(it);
  if (!['clean', 'return', 'wait', 'home'].includes(b.mode)) return false;
  b.mode = 'idle'; b.path = null; b.todo = new Set();
  const st = it.state || (it.state = {});
  st.rest = { x: Math.round(b.x), y: Math.round(b.y) }; st.restFor = `${it.x},${it.y},${it.rot}`;
  npcSay(b, 'Stopped. This is my new home');
  W.touch();
  return true;
}

// ---- brain
function openDoors(b) {
  for (const e of W.world.edges) {
    if (e.type !== 'door' || !W.isClosedEdge(e)) continue;
    const r = W.edgeRect(e);
    if (Math.hypot(Math.max(r.x - b.x, 0, b.x - (r.x + r.w)), Math.max(r.y - b.y, 0, b.y - (r.y + r.h))) < 30) { (e.state || (e.state = {})).open = true; W.touch(); }
  }
}
function move(b, tx, ty, dt) {
  openDoors(b);
  const dx = tx - b.x, dy = ty - b.y, d = Math.hypot(dx, dy), s = SPEED * dt;
  if (d > 0.5) { let da = Math.atan2(dy, dx) - b.ang; da = Math.atan2(Math.sin(da), Math.cos(da)); b.ang += da * Math.min(1, dt * 12); }
  if (d <= s) { b.x = tx; b.y = ty; return true; }
  b.x += dx / d * s; b.y += dy / d * s; return false;
}
function giveUp(b) { npcSay(b, "I can't do it"); b.mode = 'idle'; b.path = null; b.todo = new Set(); b.fails = 0; }
function waitFor(b, after) {
  if (++b.fails > 10) return giveUp(b);
  if (b.fails === 1) npcSay(b, "I can't do it");
  b.mode = 'wait'; b.after = after; b.wait = 1.5; b.path = null;
}
function goDock(it, b) {
  const dc = W.itemCenter(it), k = keyOf(cellOf(dc.x), cellOf(dc.y));
  if (Math.hypot(b.x - dc.x, b.y - dc.y) < 3) { b.mode = 'service'; b.sv = { ph: 0, t: 0, d0: b.dirty }; npcSay(b, 'Draining dirty water'); return; }
  let res = bfs(it, b, false);
  if (!res.dist.has(k)) { if (!bfs(it, b, true).dist.has(k)) return giveUp(b); return waitFor(b, 'return'); }
  b.mode = 'return'; b.path = pathTo(res, k); b.path.push({ x: dc.x, y: dc.y });
}
function planClean(it, b) {
  let res = bfs(it, b, false), best = null, bd = 1e9;
  for (const k of b.todo) { const d = res.dist.get(k); if (d != null && d < bd) { bd = d; best = k; } }
  if (best == null) {
    const all = bfs(it, b, true);
    for (const k of [...b.todo]) if (!all.dist.has(k)) b.todo.delete(k);   // cut off for good
    return b.todo.size ? 'wait' : null;
  }
  b.path = pathTo(res, best); return 'ok';
}
function blocked(it, b, wp) {
  const dx = wp.x - b.x, dy = wp.y - b.y, d = Math.hypot(dx, dy) || 1, ax = b.x + dx / d * 20, ay = b.y + dy / d * 20;
  return hit(wp.x, wp.y, R - 1, it.id) || playerNear(ax, ay, 30) || playerNear(wp.x, wp.y, 30);
}
function follow(it, b, dt, replan) {
  const wp = b.path[0];
  if (blocked(it, b, wp)) {
    if (b.cool <= 0) { npcSay(b, 'Obstacle detected...rerouting'); b.cool = 4; }
    b.path = null; replan(); return;
  }
  if (move(b, wp.x, wp.y, dt)) {
    b.path.shift();
    const k = keyOf(cellOf(b.x), cellOf(b.y));
    if (b.mode === 'clean' && b.todo.delete(k)) { b.dirty = Math.min(1, b.dirty + 0.015); b.shine.push({ x: cellOf(b.x), y: cellOf(b.y), a: 1 }); }
  }
}

function step(it, b, dt) {
  b.t += dt; b.cool = Math.max(0, b.cool - dt);
  b.shine = b.shine.filter(s => (s.a -= dt * 0.5) > 0);
  if (b.bubble && (b.bubble.ttl -= dt) <= 0) b.bubble = null;
  const dc = W.itemCenter(it);
  if (b.mode === 'clean') {
    if (b.dirty >= 0.97 && !b.path) { b.resume = true; goDock(it, b); return; }
    if (!b.path || !b.path.length) {
      if (!b.todo.size) { b.resume = false; goDock(it, b); return; }
      const r = planClean(it, b);
      if (r === 'wait') return waitFor(b, 'clean');
      if (r === null) { b.resume = false; goDock(it, b); return; }
    }
    if (b.path && b.path.length) follow(it, b, dt, () => { b.fails = 0; });
  } else if (b.mode === 'return' || b.mode === 'home') {
    if (!b.path || !b.path.length) { if (b.mode === 'return') goDock(it, b); else b.mode = 'idle'; return; }
    follow(it, b, dt, () => { if (b.mode === 'return') goDock(it, b); else b.mode = 'idle'; });
  } else if (b.mode === 'wait') {
    b.ang += dt * 4;   // turns on the spot, looking for a way round
    if ((b.wait -= dt) <= 0) { b.mode = b.after || 'clean'; b.path = null; if (b.mode === 'return') goDock(it, b); }
  } else if (b.mode === 'service') {
    const s = b.sv; s.t += dt;
    if (s.ph === 0) { b.dirty = Math.max(0, s.d0 * (1 - s.t / 3)); if (s.t >= 3) { b.dirty = 0; s.ph = 1; s.t = 0; npcSay(b, 'Filling clean water'); } }
    else if (s.ph === 1) { b.clean = Math.min(1, s.t / 2.5); if (s.t >= 2.5) { s.ph = 2; s.t = 0; npcSay(b, 'Emptying tank'); } }
    else { b.clean = Math.max(0, 1 - s.t / 2.5); if (s.t >= 2.5) {
      b.clean = 0; b.sv = null; b.fails = 0;
      if (b.resume && b.todo.size) { b.resume = false; b.mode = 'clean'; b.path = null; npcSay(b, 'Back to cleaning'); }
      else {
        npcSay(b, 'Done'); const st = it.state || {};
        if (st.rest && Math.hypot(st.rest.x - b.x, st.rest.y - b.y) > 8) {
          const res = bfs(it, b, true), k = keyOf(cellOf(st.rest.x), cellOf(st.rest.y));
          if (res.dist.has(k)) { b.path = pathTo(res, k); b.mode = 'home'; } else b.mode = 'idle';
        } else b.mode = 'idle';
      }
    } }
  }
}

export function updateNpcs(dt) {
  const seen = new Set();
  for (const it of W.world.items) {
    const d = catalog.get(it.type); if (!d || !d.npc) continue;
    seen.add(it.id); step(it, botOf(it), dt);
  }
  for (const id of [...bots.keys()]) if (!seen.has(id)) bots.delete(id);
}

/** Distance from (px,py) to the robot's body, for "chase it and press E". */
export function botDist(it, px, py) { const b = botOf(it); return Math.hypot(px - b.x, py - b.y) - 17; }
export function botRect(it) { const b = botOf(it); return { x: b.x - 20, y: b.y - 20, w: 40, h: 40 }; }
export const botDepth = it => botOf(it).y + 12;

// ---- drawing
function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, bl = n & 255;
  const m = v => Math.max(0, Math.min(255, Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f)));
  return `rgb(${m(r)},${m(g)},${m(bl)})`;
}
export function drawBot(c, it) {
  const b = botOf(it), base = COLOR_HEX[it.color] || '#f4f4f2', mv = ['clean', 'return', 'home'].includes(b.mode);
  for (const s of b.shine) { c.fillStyle = `rgba(255,255,255,${(s.a * 0.35).toFixed(3)})`; c.fillRect(s.x * TILE + 3, s.y * TILE + 3, TILE - 6, TILE - 6); }
  c.save(); c.translate(b.x, b.y);
  c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(1, 4, 18, 14, 0, 0, 7); c.fill();
  c.rotate(b.ang);
  // side brushes
  for (const sy of [-1, 1]) {
    c.save(); c.translate(14, sy * 11); c.rotate(b.t * (mv ? 14 : 0) * sy);
    c.strokeStyle = '#2a2c33'; c.lineWidth = 1.6;
    for (let i = 0; i < 4; i++) { c.rotate(Math.PI / 2); c.beginPath(); c.moveTo(0, 0); c.lineTo(5, 0); c.stroke(); }
    c.restore();
  }
  c.fillStyle = shade(base, -0.18); c.beginPath(); c.arc(0, 0, 17.5, 0, 7); c.fill();
  c.fillStyle = base; c.strokeStyle = shade(base, -0.45); c.lineWidth = 1.5; c.beginPath(); c.arc(0, 0, 16, 0, 7); c.fill(); c.stroke();
  c.fillStyle = '#2a2c33'; c.fillRect(13, -5, 3.5, 10);   // front sensor bar
  // transparent dome with the water inside
  c.save(); c.beginPath(); c.arc(-1, 0, 11, 0, 7); c.clip();
  c.fillStyle = 'rgba(210,235,255,.35)'; c.fillRect(-14, -14, 28, 28);
  const lvl = Math.max(b.dirty, b.clean), top = 11 - 22 * lvl + Math.sin(b.t * 5) * (lvl > 0 && lvl < 1 ? 1 : 0.4);
  if (lvl > 0.01) {
    c.save(); c.rotate(-b.ang);   // water stays level on screen
    const col = b.dirty >= b.clean ? 'rgba(108,88,52,.9)' : 'rgba(90,190,255,.9)';
    c.fillStyle = col; c.fillRect(-14, top, 28, 26);
    c.restore();
  }
  c.restore();
  c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 1.4; c.beginPath(); c.arc(-1, 0, 11, 0, 7); c.stroke();
  c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.ellipse(-4, -5, 4, 2, -0.6, 0, 7); c.fill();
  // status light
  c.fillStyle = b.mode === 'service' ? '#f59e0b' : mv ? '#38bdf8' : b.mode === 'wait' ? '#ef4444' : '#4ade80';
  c.beginPath(); c.arc(9, 0, 2, 0, 7); c.fill();
  c.restore();
  if (b.mode === 'service' && b.sv && b.sv.ph < 2) {   // drips while draining / filling
    c.fillStyle = b.sv.ph === 0 ? 'rgba(108,88,52,.9)' : 'rgba(90,190,255,.9)';
    for (let i = 0; i < 3; i++) { const p = (b.t * 1.6 + i / 3) % 1; c.beginPath(); c.arc(b.x - 6 + i * 6, b.y + 16 + p * 8, 1.8, 0, 7); c.fill(); }
  }
}

export function drawBotTags(c) {
  const z = S.camera.zoom;
  for (const it of W.world.items) {
    const d = catalog.get(it.type); if (!d || !d.npc) continue;
    const b = botOf(it), s = worldToScreen(b.x, b.y - 24), ty = s.y - 8 * z;
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '700 12px "Plus Jakarta Sans", sans-serif';
    const tw = c.measureText(d.name).width + 14;
    c.fillStyle = 'rgba(2,6,23,.72)'; c.beginPath(); c.roundRect(s.x - tw / 2, ty - 10, tw, 20, 8); c.fill();
    c.fillStyle = '#fff'; c.fillText(d.name, s.x, ty + 0.5);
    if (!b.bubble) continue;
    c.globalAlpha = Math.min(1, b.bubble.ttl / 0.6);
    c.font = '700 14px Fredoka, "Plus Jakarta Sans", sans-serif';
    const lines = []; let cur = '';
    for (const w of b.bubble.text.split(/\s+/)) { if ((cur + ' ' + w).trim().length > 24) { lines.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); }
    if (cur) lines.push(cur);
    const lh = 18, bw = Math.max(...lines.map(l => c.measureText(l).width)) + 24, bh = lines.length * lh + 16;
    const bx = Math.max(8, Math.min(S.view.w - bw - 8, s.x - bw / 2)), by = Math.max(8, ty - 18 - bh);
    c.fillStyle = '#fff'; c.strokeStyle = '#0f172a'; c.lineWidth = 3;
    c.beginPath(); c.roundRect(bx, by, bw, bh, 12); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(s.x - 7, by + bh - 1); c.lineTo(s.x + 7, by + bh - 1); c.lineTo(s.x, by + bh + 9); c.closePath(); c.fill();
    c.fillStyle = '#0f172a';
    lines.forEach((l, i) => c.fillText(l, bx + bw / 2, by + 8 + lh / 2 + i * lh));
    c.globalAlpha = 1;
  }
}
