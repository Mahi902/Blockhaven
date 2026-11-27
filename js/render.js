// Blockhaven - canvas renderer
import { TILE, COLOR_HEX } from './config.js';
import { S, worldToScreen } from './state.js';
import { drawItemFx, drawFlies, drawScrub, wobbleOf, drawShowerWater, drawTopDownPerson } from './fx.js';
import { catalog, getImage } from './catalog.js';
import * as W from './world.js';
import { sprites, buildSprites } from './player.js';
import { FLOOR_BASE } from './ui.js';
import { drawBot, drawBotTags, botDepth, botRect } from './npc.js';

let canvas, ctx, night;
const floorImgs = new Map();
let groundPattern = null, groundImg = null;
const ceilAlpha = new Map();
let floorCells = [], floorVersion = -1;

export function initRender(c) {
  canvas = c; ctx = c.getContext('2d');
  night = document.createElement('canvas');
  groundImg = new Image();
  groundImg.src = new URL('../img/ground.svg', import.meta.url).href;
  resize();
}

export function resize() {
  const app = canvas.parentElement;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  S.view.w = app.clientWidth; S.view.h = app.clientHeight; S.view.dpr = dpr;
  canvas.width = Math.round(S.view.w * dpr); canvas.height = Math.round(S.view.h * dpr);
  night.width = canvas.width; night.height = canvas.height;
}

function floorImg(name) {
  let rec = floorImgs.get(name);
  if (!rec) {
    const img = new Image(); rec = { img, ok: false };
    img.onload = () => { rec.ok = true; };
    img.src = `${FLOOR_BASE}${encodeURIComponent(name)}.svg`;
    floorImgs.set(name, rec);
  }
  return rec.ok ? rec.img : null;
}

function rr(c, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}

// ---------------------------------------------------------------- drawing pieces
function drawItem(c, it) {
  if (it.type === 'cat') return;   // the live cat is drawn by npc.js
  const d = catalog.get(it.type); if (!d) return;
  const img = getImage(d, it.color); if (!img) return;
  const f = W.footprint(it);
  const wb = wobbleOf(it) || { dx: 0, dy: 0, rot: 0 };
  c.save();
  c.translate((f.x + f.w / 2) * TILE + wb.dx, (f.y + f.h / 2) * TILE + wb.dy);
  c.rotate(it.rot * Math.PI / 2 + wb.rot);
  c.drawImage(img, -d.w * TILE / 2, -d.h * TILE / 2, d.w * TILE, d.h * TILE);
  if (it.state) drawItemFx(c, it);
  c.restore();
  const badge = badgeOf(it);
  if (badge) {
    c.save(); c.font = '22px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(badge, (f.x + f.w / 2) * TILE, f.y * TILE - 6 + Math.sin(performance.now() / 350) * 2);
    c.restore();
  }
}

/** Floating emoji above a piece: state.badge (saved) or state._badge (temporary), {t, until?, then?, seat?} */
function badgeOf(it) {
  const st = it.state; const b = st && (st.badge || st._badge); if (!b) return null;
  if (b.seat && !(S.player.seat && S.player.seat.id === it.id)) return null;
  if (b.until && Date.now() > b.until) return b.then || null;
  return b.t;
}

function drawEdge(c, e) {
  const d = catalog.get(e.type); if (!d) return;
  const img = getImage(d, e.color); if (!img) return;
  const ctr = W.edgeCenter(e);
  const w = d.spriteW, h = d.spriteH;
  c.save();
  c.translate(ctr.x, ctr.y);
  if (e.o === 'v') c.rotate(Math.PI / 2);
  if (d.hasFunction && e.state && e.state.open === true) {
    const ends = 6;
    c.save(); c.beginPath(); c.rect(-w / 2, -h / 2, ends, h); c.rect(w / 2 - ends, -h / 2, ends, h); c.clip();
    c.drawImage(img, -w / 2, -h / 2, w, h); c.restore();
    // swung-open leaf
    c.save(); c.translate(-w / 2 + ends, 0); c.rotate(-Math.PI / 2); c.translate(w / 2 - ends, 0);
    c.beginPath(); c.rect(-w + 2 * ends, -h / 2, w - 2 * ends, h); c.clip();
    c.drawImage(img, -w + ends, -h / 2, w, h);
    c.restore();
  } else {
    c.drawImage(img, -w / 2, -h / 2, w, h);
  }
  c.restore();
}

/** Swimming in a tub: head and shoulders above a wavy waterline, arms paddling, ripples, bubbles and splashes. */
function drawSwimmer(c, P = S.player, spr = sprites) {
  const sw = P.seat.swim, img = spr[P.dir] || spr.down;
  if (!img || !img.complete) return;
  const sc = 0.82, dw = 48 * sc, dh = 64 * sc, look = P.look;
  for (const r of sw.rip) { c.strokeStyle = `rgba(255,255,255,${Math.max(0, r.a)})`; c.lineWidth = 1.6; c.beginPath(); c.ellipse(r.x, r.y, r.r, r.r * 0.4, 0, 0, Math.PI * 2); c.stroke(); }
  const bob = Math.sin(sw.t * 2.6) * 1.5 + (P.moving ? Math.sin(sw.stroke * 2) * 1.3 : 0);
  c.save();
  c.translate(P.x, P.y + 4 + bob);
  const WL = -14;                                         // waterline, relative to the swimmer
  c.save(); c.beginPath(); c.rect(-30, -70, 60, 70 + WL); c.clip();
  c.drawImage(img, -dw / 2, -dh * 0.89, dw, dh);
  c.restore();
  // arms: resting on the surface, or alternating front-crawl strokes while moving
  for (const side of [-1, 1]) {
    const ph = sw.stroke + (side > 0 ? Math.PI : 0);
    const reach = P.moving ? Math.max(0, Math.sin(ph)) : 0;
    const hx = side * (17 + (P.moving ? Math.cos(ph) * 3 : 0)), hy = WL - 1 - reach * 13 + (P.moving ? 0 : Math.sin(sw.t * 2 + side) * 1.2);
    c.strokeStyle = look.shirt || '#4a6fd8'; c.lineWidth = 6; c.lineCap = 'round';
    c.beginPath(); c.moveTo(side * 12, -21); c.lineTo(hx, hy); c.stroke();
    c.fillStyle = look.skin || '#f1c27d'; c.beginPath(); c.arc(hx, hy, 3.4, 0, Math.PI * 2); c.fill();
  }
  // water over the body, with a little foam line
  c.beginPath(); c.moveTo(-22, WL + 11);
  for (let x = -22; x <= 22; x += 4) c.lineTo(x, WL + Math.sin(x * 0.28 + sw.t * 4) * 1.3);
  c.lineTo(22, WL + 11); c.closePath();
  c.fillStyle = 'rgba(160,220,255,0.88)'; c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 1.2; c.beginPath();
  for (let x = -22; x <= 22; x += 4) { const y = WL + Math.sin(x * 0.28 + sw.t * 4) * 1.3; if (x === -22) c.moveTo(x, y); else c.lineTo(x, y); }
  c.stroke();
  c.restore();
  for (const b of sw.bub) { c.strokeStyle = `rgba(255,255,255,${Math.min(1, b.life)})`; c.fillStyle = 'rgba(255,255,255,0.25)'; c.lineWidth = 1; c.beginPath(); c.arc(b.x, b.y, b.r, 0, Math.PI * 2); c.fill(); c.stroke(); }
  c.fillStyle = 'rgba(255,255,255,0.9)';
  for (const d of sw.drops) { c.beginPath(); c.arc(d.x, d.y, 1.8, 0, Math.PI * 2); c.fill(); }
}

// soft-body secondary motion for the female character: chest and hips lag behind the walking bounce and settle with a small wobble
const jig = { c: 0, cv: 0, h: 0, hv: 0, last: 0, prev: 0 };
function stepJig(bob) {
  const now = performance.now(), dt = Math.min(0.04, Math.max(0.001, (now - (jig.last || now - 16)) / 1000)); jig.last = now;
  const acc = (bob - jig.prev) / dt; jig.prev = bob;                     // body motion drives the springs
  const drive = Math.max(-260, Math.min(260, acc));
  jig.cv += (-170 * jig.c - 9 * jig.cv - drive * 0.055) * dt; jig.c += jig.cv * dt;
  jig.hv += (-150 * jig.h - 8 * jig.hv + drive * 0.04) * dt; jig.h += jig.hv * dt;
  jig.c = Math.max(-2.24, Math.min(2.24, jig.c)); jig.h = Math.max(-1.82, Math.min(1.82, jig.h));
}
function drawSliced(c, img, dw, dh, bob) {
  stepJig(bob);
  const k = img.width / 48, u = dw / 48, x0 = -dw / 2, y0 = -dh * 0.89 + bob;
  const band = (a, b, off, sq) => c.drawImage(img, 0, a * k, img.width, (b - a) * k, x0 - dw * 0.5 * sq, y0 + a * u + off, dw * (1 + sq), (b - a) * u + 0.4);
  band(41, 64, jig.h * u * 1.26, jig.h * 0.0168);          // hips
  band(26.5, 42, jig.c * u * 1.54, -jig.c * 0.0196);       // chest
  band(0, 27.2, 0, 0);                                   // head and shoulders
}

const remoteSprites = new Map();
function drawRemote(c, r) {
  const key = JSON.stringify(r.look || {});
  let set = remoteSprites.get(key); if (!set) { set = buildSprites(r.look || S.player.look); remoteSprites.set(key, set); }
  r.moving = !!r.mv; if (!r.look) r.look = S.player.look;
  drawPlayer(c, r, set);
}
function drawRemoteTags(c) {
  c.textAlign = 'center'; c.textBaseline = 'middle';
  for (const r of S.remote) {
    const s = worldToScreen(r.x, r.y - 50), ty = s.y - 8 * S.camera.zoom;
    c.font = '700 12px "Plus Jakarta Sans", sans-serif';
    const label = r.name || 'Guest', tw = c.measureText(label).width + 14;
    c.fillStyle = 'rgba(2,6,23,.72)'; rr(c, s.x - tw / 2, ty - 10, tw, 20, 8); c.fill();
    c.fillStyle = '#fff'; c.fillText(label, s.x, ty + 0.5);
    const b = r.bubble; if (!b || b.ttl <= 0) continue;
    c.globalAlpha = Math.min(1, b.ttl / 0.6); c.font = '700 14px Fredoka, "Plus Jakarta Sans", sans-serif';
    const bw = Math.min(220, c.measureText(b.text).width + 24), bh = 30, bx = s.x - bw / 2, by = ty - 18 - bh;
    c.fillStyle = '#fff'; c.strokeStyle = '#0f172a'; c.lineWidth = 3; rr(c, bx, by, bw, bh, 12); c.fill(); c.stroke();
    c.fillStyle = '#0f172a'; c.fillText(b.text.slice(0, 30), s.x, by + bh / 2); c.globalAlpha = 1;
  }
}

function drawPlayer(c, P = S.player, spr = sprites) {
  if (P.seat && P.seat.swim) { drawSwimmer(c, P, spr); return; }
  if (P.seat && P.seat.stand && (!P.seat.glide || P.seat.glide.t > 0.55)) { drawTopDownPerson(c, P.look, P.x, P.y, !!P.seat.scrub); return; }   // in the shower: seen from above, fully inside the stall
  const img = spr[P.dir] || spr.down;
  if (!img || !img.complete) return;
  const sc = 0.82 * (P.look.gender === 'female' ? 1.07 : 1), dw = 48 * sc, dh = 64 * sc;
  c.save();
  if (P.seat && P.seat.lying) {
    const it = W.byId('item', P.seat.id);
    c.save();
    if (P.seat.sway && it) { const f0 = W.footprint(it), cx0 = (f0.x + f0.w / 2) * TILE, cy0 = (f0.y + f0.h / 2) * TILE; c.translate(cx0, cy0); c.rotate(P.seat.sway.rot); c.translate(-cx0, -cy0); }   // sways with the hammock
    c.translate(P.x, P.y); c.rotate(P.seat.rot * Math.PI / 2);
    c.drawImage(spr.down || img, -dw / 2, -dh * 0.34, dw, dh);
    c.restore();
    if (it) {                      // blanket on top of the sleeper
      const d = catalog.get(it.type), bimg = d && getImage(d, it.color), f = W.footprint(it);
      if (bimg) {
        c.save(); c.translate((f.x + f.w / 2) * TILE, (f.y + f.h / 2) * TILE); c.rotate(it.rot * Math.PI / 2 + (P.seat.sway ? P.seat.sway.rot : 0));
        c.beginPath(); c.rect(-d.w * TILE / 2, -d.h * TILE / 2 + 52, d.w * TILE, d.h * TILE); c.clip();
        c.drawImage(bimg, -d.w * TILE / 2, -d.h * TILE / 2, d.w * TILE, d.h * TILE);
        c.restore();
      }
    }
    c.restore();
    return;
  }
  const stand = P.seat && (P.seat.run || P.seat.stand);
  const scrub = (P.lock && P.lock.anim === 'scrub') || (P.seat && P.seat.scrub);
  if (!P.seat || stand) {
    c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(P.x, P.y + 9, 12, 5, 0, 0, Math.PI * 2); c.fill();
  }
  let bob = P.moving ? -Math.abs(Math.sin(P.walk)) * 3 : 0;
  let ox = 0, extraRot = 0;
  if (scrub) { ox = Math.sin(performance.now() / 55) * 1.6; bob = -Math.abs(Math.sin(performance.now() / 110)) * 1.5; }
  if (P.lock && P.lock.anim === 'suck') { const k = (performance.now() - P.lock.t0) / P.lock.ms, tw = P.lock.toward; if (tw) { ox = Math.sign(tw.x - P.x) * Math.min(1, k * 3) * 6 + Math.sin(performance.now() / 40) * 1.5; } extraRot = Math.sin(performance.now() / 70) * 0.09; }
  if (P.seat && P.seat.spin) { extraRot = Math.sin(performance.now() / 420) * 0.07; }
  const tilt = P.moving ? Math.sin(P.walk) * 0.07 : 0;
  c.translate(P.x, P.y + 9 + (P.seat && !stand ? 5 : 0));
  c.translate(ox, 0);
  c.rotate(tilt + extraRot);
  if (P.seat && !stand) { c.beginPath(); c.rect(-30, -70, 60, 70 - 5 + 0); c.clip(); }
  if (P.look.gender === 'female' && !(P.seat && P.seat.lying)) drawSliced(c, img, dw, dh, bob);
  else c.drawImage(img, -dw / 2, -dh * 0.89 + bob, dw, dh);
  c.restore();
  if (scrub) drawScrub(c, P);
  if (P.seat && P.seat.spin && Math.abs(P.seat.spin.v) > 5) {   // motion swirl
    c.save(); c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = 2;
    const a0 = performance.now() / 90 * Math.sign(P.seat.spin.v);
    for (let i = 0; i < 3; i++) { c.beginPath(); c.ellipse(P.x, P.y + 4, 20, 8, 0, a0 + i * 2.1, a0 + i * 2.1 + 1.1); c.stroke(); }
    c.restore();
  }
}

// ---------------------------------------------------------------- main render
export function render() {
  const c = ctx, V = S.view, z = S.camera.zoom, dpr = V.dpr;
  const build = S.mode === 'build';
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.fillStyle = '#0b1220'; c.fillRect(0, 0, canvas.width, canvas.height);
  c.setTransform(dpr * z, 0, 0, dpr * z, dpr * (V.w / 2 - S.camera.x * z), dpr * (V.h / 2 - S.camera.y * z));
  const worldW = W.world.w * TILE, worldH = W.world.h * TILE;

  // ground
  if (!groundPattern && groundImg.complete && groundImg.naturalWidth) {
    groundPattern = c.createPattern(groundImg, 'repeat');
    if (groundPattern.setTransform) groundPattern.setTransform(new DOMMatrix().scale(0.5));
  }
  c.fillStyle = groundPattern || '#2f6b45';
  c.fillRect(0, 0, worldW, worldH);
  c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 4 / z; c.strokeRect(0, 0, worldW, worldH);

  // floors
  if (floorVersion !== W.version) {
    floorVersion = W.version;
    floorCells = Object.entries(W.world.floors).map(([k, v]) => { const [x, y] = k.split(',').map(Number); return [x, y, v]; });
  }
  for (const [x, y, name] of floorCells) {
    const img = floorImg(name);
    if (img) c.drawImage(img, x * TILE, y * TILE, TILE + 0.6, TILE + 0.6);
    else { c.fillStyle = COLOR_HEX[name] || '#777'; c.fillRect(x * TILE, y * TILE, TILE, TILE); }
  }

  // grid (build mode)
  if (build) {
    c.strokeStyle = 'rgba(255,255,255,.10)'; c.lineWidth = 1 / z; c.beginPath();
    for (let x = 0; x <= W.world.w; x++) { c.moveTo(x * TILE, 0); c.lineTo(x * TILE, worldH); }
    for (let y = 0; y <= W.world.h; y++) { c.moveTo(0, y * TILE); c.lineTo(worldW, y * TILE); }
    c.stroke();
    drawRooms(c, z);
  }

  // walls, then furniture + player depth sorted
  for (const e of W.world.edges) drawEdge(c, e);
  const list = [];
  for (const it of W.world.items) {
    if (!catalog.get(it.type)) continue;
    const f = W.footprint(it);
    list.push({ y: (f.y + f.h) * TILE, fn: () => drawItem(c, it), it });
    if (catalog.get(it.type).npc) list.push({ y: botDepth(it), fn: () => drawBot(c, it) });
    if (it.type === 'shower' && it.state && it.state._shower) list.push({ y: (f.y + f.h) * TILE + 0.9, fn: () => drawShowerWater(c, it, W.itemCenter(it)) });   // water falls over whoever is inside
  }
  const P = S.player;
  let py = P.y + 10;
  if (P.seat) { const it = W.byId('item', P.seat.id); if (it) py = (W.footprint(it).y + W.footprint(it).h) * TILE + 0.5; }
  list.push({ y: py, fn: () => drawPlayer(c) });
  for (const r of S.remote) {
    let ry = r.y + 10;
    if (r.seat) { const it = W.byId('item', r.seat.id); if (it) ry = (W.footprint(it).y + W.footprint(it).h) * TILE + 0.5; }
    list.push({ y: ry, fn: () => drawRemote(c, r) });
  }
  list.push({ y: 1e9, fn: () => drawFlies(c) });
  list.sort((a, b) => a.y - b.y);
  for (const o of list) o.fn();

  // soft light from lamps / screens
  c.save(); c.globalCompositeOperation = 'lighter';
  for (const g of glows()) {
    const grd = c.createRadialGradient(g.x, g.y, 4, g.x, g.y, g.r);
    grd.addColorStop(0, hexA(g.color, S.night ? 0.42 : 0.2)); grd.addColorStop(1, hexA(g.color, 0));
    c.fillStyle = grd; c.fillRect(g.x - g.r, g.y - g.r, g.r * 2, g.r * 2);
  }
  c.restore();

  drawCeilings(c, build);

  // selection / build helpers
  if (build) drawBuildOverlay(c, z);
  else if (S.nearby) {
    const o = S.nearby.obj;
    const r = S.nearby.bot ? botRect(o) : S.nearby.kind === 'item' ? W.itemRect(o) : W.edgeRect(o);
    c.strokeStyle = 'rgba(253,224,71,.9)'; c.lineWidth = 2.5 / z; c.setLineDash([6 / z, 5 / z]); c.lineDashOffset = -S.tick * 0.4 / z;
    rr(c, r.x - 3, r.y - 3, r.w + 6, r.h + 6, 6); c.stroke(); c.setLineDash([]);
  }

  // night
  c.setTransform(1, 0, 0, 1, 0, 0);
  if (S.night) drawNight(c, z);

  // screen-space overlays: name tag + speech bubble
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawTags(c);
  drawBotTags(c);
}

function glows() {
  const out = [];
  for (const it of W.world.items) {
    const g = it.state && (it.state.glow || it.state._glow); if (!g || !catalog.get(it.type)) continue;
    if (g.until && Date.now() > g.until) continue;
    const ctr = W.itemCenter(it);
    const col = Array.isArray(g.color) ? g.color[Math.floor(performance.now() / 650) % g.color.length] : g.color;
    out.push({ x: ctr.x, y: ctr.y, r: g.r * TILE, color: col });
  }
  return out;
}

function hexA(hex, a) {
  const h = hex.replace('#', '');
  const n = h.length === 3 ? h.split('').map(x => x + x).join('') : h;
  return `rgba(${parseInt(n.slice(0, 2), 16)},${parseInt(n.slice(2, 4), 16)},${parseInt(n.slice(4, 6), 16)},${a})`;
}

function drawCeilings(c, build) {
  const P = S.player, pcx = Math.floor(P.x / TILE), pcy = Math.floor(P.y / TILE);
  for (const r of W.world.rooms) {
    if (!r.ceiling) continue;
    const inside = pcx >= r.x && pcy >= r.y && pcx < r.x + r.w && pcy < r.y + r.h;
    const target = (build && !S.showCeilings) || inside ? 0 : 1;
    let a = ceilAlpha.has(r.id) ? ceilAlpha.get(r.id) : target;
    a += (target - a) * 0.12; if (Math.abs(target - a) < 0.01) a = target;
    ceilAlpha.set(r.id, a);
    if (a <= 0.01) continue;
    const col = COLOR_HEX[r.ceiling] || '#888';
    c.save(); c.globalAlpha = a;
    c.fillStyle = col; c.fillRect(r.x * TILE, r.y * TILE, r.w * TILE, r.h * TILE);
    c.strokeStyle = 'rgba(0,0,0,.14)'; c.lineWidth = 2;
    c.beginPath();
    for (let x = 1; x < r.w; x++) { c.moveTo((r.x + x) * TILE, r.y * TILE); c.lineTo((r.x + x) * TILE, (r.y + r.h) * TILE); }
    for (let y = 1; y < r.h; y++) { c.moveTo(r.x * TILE, (r.y + y) * TILE); c.lineTo((r.x + r.w) * TILE, (r.y + y) * TILE); }
    c.stroke();
    c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 5; c.strokeRect(r.x * TILE + 2.5, r.y * TILE + 2.5, r.w * TILE - 5, r.h * TILE - 5);
    c.restore();
  }
}

function drawNight(c, z) {
  const V = S.view, dpr = V.dpr, n = night.getContext('2d');
  n.setTransform(1, 0, 0, 1, 0, 0);
  n.globalCompositeOperation = 'source-over';
  n.clearRect(0, 0, night.width, night.height);
  n.fillStyle = 'rgba(6,10,38,0.66)'; n.fillRect(0, 0, night.width, night.height);
  n.globalCompositeOperation = 'destination-out';
  const hole = (wx, wy, r, a) => {
    const s = worldToScreen(wx, wy), R = r * z * dpr, x = s.x * dpr, y = s.y * dpr;
    const g = n.createRadialGradient(x, y, R * 0.1, x, y, R);
    g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(1, 'rgba(0,0,0,0)');
    n.fillStyle = g; n.fillRect(x - R, y - R, R * 2, R * 2);
  };
  for (const g of glows()) hole(g.x, g.y, g.r * 1.15, 0.92);
  hole(S.player.x, S.player.y, 120, 0.42);          // you can always see a little around yourself
  c.drawImage(night, 0, 0);
}

function drawRooms(c, z) {
  c.save();
  for (const r of W.world.rooms) {
    const sel = S.selected && S.selected.kind === 'room' && S.selected.id === r.id;
    c.strokeStyle = sel ? '#fde047' : 'rgba(94,234,212,.75)';
    c.lineWidth = (sel ? 3.5 : 2) / z; c.setLineDash([10 / z, 6 / z]);
    c.strokeRect(r.x * TILE + 2, r.y * TILE + 2, r.w * TILE - 4, r.h * TILE - 4);
    c.setLineDash([]);
    if (sel) { c.fillStyle = 'rgba(253,224,71,.08)'; c.fillRect(r.x * TILE, r.y * TILE, r.w * TILE, r.h * TILE); }
    c.font = `700 ${13 / z}px Fredoka, sans-serif`;
    const tw = c.measureText(r.name).width;
    c.fillStyle = 'rgba(2,6,23,.75)'; rr(c, r.x * TILE + 6, r.y * TILE + 6, tw + 14 / z, 20 / z, 6 / z); c.fill();
    c.fillStyle = sel ? '#fde047' : '#99f6e4'; c.textBaseline = 'middle'; c.fillText(r.name, r.x * TILE + 6 + 7 / z, r.y * TILE + 6 + 10.5 / z);
  }
  c.restore();
}

function drawBuildOverlay(c, z) {
  // hover cell
  if (S.hoverWorld && ['select', 'floor', 'erase'].includes(S.tool) && !S.rectPreview) {
    const cx = Math.floor(S.hoverWorld.x / TILE), cy = Math.floor(S.hoverWorld.y / TILE);
    if (W.inBounds(cx, cy)) { c.fillStyle = 'rgba(255,255,255,.10)'; c.fillRect(cx * TILE, cy * TILE, TILE, TILE); }
  }
  // selection
  const sel = S.selected;
  if (sel && sel.kind !== 'room') {
    const o = W.byId(sel.kind, sel.id);
    if (o && catalog.get(o.type)) {
      const r = sel.kind === 'item' ? W.itemRect(o) : W.edgeRect(o);
      c.strokeStyle = '#fde047'; c.lineWidth = 3 / z; c.setLineDash([8 / z, 5 / z]); c.lineDashOffset = -S.tick * 0.5 / z;
      rr(c, r.x - 3, r.y - 3, r.w + 6, r.h + 6, 6); c.stroke(); c.setLineDash([]);
    }
  }
  // placement ghost
  const g = S.ghost;
  if (g) {
    const d = catalog.get(g.type), img = d && getImage(d, S.place.color);
    if (d && img) {
      const f = W.footprintFor(g.type, g.x, g.y, g.rot);
      c.save(); c.globalAlpha = 0.78;
      c.translate((f.x + f.w / 2) * TILE, (f.y + f.h / 2) * TILE); c.rotate(g.rot * Math.PI / 2);
      c.drawImage(img, -d.w * TILE / 2, -d.h * TILE / 2, d.w * TILE, d.h * TILE);
      c.restore();
      c.fillStyle = g.ok ? 'rgba(74,222,128,.22)' : 'rgba(244,63,94,.38)';
      c.fillRect(f.x * TILE, f.y * TILE, f.w * TILE, f.h * TILE);
    }
  }
  // wall line preview
  if (S.linePreview) {
    const d = catalog.get(S.place.type), img = d && getImage(d, S.place.color);
    for (const e of S.linePreview) {
      if (!img) break;
      const ctr = W.edgeCenter(e);
      c.save(); c.globalAlpha = 0.75; c.translate(ctr.x, ctr.y); if (e.o === 'v') c.rotate(Math.PI / 2);
      c.drawImage(img, -d.spriteW / 2, -d.spriteH / 2, d.spriteW, d.spriteH); c.restore();
    }
  }
  // rectangle drag (floor / room)
  const rp = S.rectPreview;
  if (rp) {
    c.fillStyle = rp.kind === 'room' ? 'rgba(94,234,212,.22)' : 'rgba(253,224,71,.25)';
    c.fillRect(rp.x * TILE, rp.y * TILE, rp.w * TILE, rp.h * TILE);
    c.strokeStyle = rp.kind === 'room' ? '#5eead4' : '#fde047'; c.lineWidth = 3 / z;
    c.strokeRect(rp.x * TILE, rp.y * TILE, rp.w * TILE, rp.h * TILE);
  }
}

function drawTags(c) {
  drawRemoteTags(c);
  const P = S.player;
  const s = worldToScreen(P.x, P.y - (P.seat && P.seat.lying ? 30 : 50));
  const z = S.camera.zoom;
  c.textAlign = 'center'; c.textBaseline = 'middle';
  // name tag
  c.font = '700 12px "Plus Jakarta Sans", sans-serif';
  const label = P.name || 'Guest';
  const tw = c.measureText(label).width + 14;
  const ty = s.y - 8 * z;
  c.fillStyle = 'rgba(2,6,23,.72)'; rr(c, s.x - tw / 2, ty - 10, tw, 20, 8); c.fill();
  c.fillStyle = '#fff'; c.fillText(label, s.x, ty + 0.5);
  // speech bubble
  const b = S.bubbles[0];
  if (b) {
    const alpha = Math.min(1, b.ttl / 0.6);
    c.globalAlpha = alpha;
    c.font = '700 14px Fredoka, "Plus Jakarta Sans", sans-serif';
    const words = b.text.split(/\s+/), lines = []; let cur = '';
    for (const w of words) { if ((cur + ' ' + w).trim().length > 24) { lines.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); }
    if (cur) lines.push(cur);
    const lh = 18, bw = Math.max(...lines.map(l => c.measureText(l).width)) + 24, bh = lines.length * lh + 16;
    const bx = Math.max(8, Math.min(S.view.w - bw - 8, s.x - bw / 2)), by = Math.max(8, ty - 18 - bh);
    c.fillStyle = 'rgba(0,0,0,.3)'; rr(c, bx + 1, by + 4, bw, bh, 12); c.fill();
    c.fillStyle = '#fff'; c.strokeStyle = '#0f172a'; c.lineWidth = 3; rr(c, bx, by, bw, bh, 12); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(s.x - 7, by + bh - 1); c.lineTo(s.x + 7, by + bh - 1); c.lineTo(s.x, by + bh + 9); c.closePath(); c.fill();
    c.fillStyle = '#0f172a';
    lines.forEach((l, i) => c.fillText(l, bx + bw / 2, by + 8 + lh / 2 + i * lh));
    c.globalAlpha = 1;
  }
}