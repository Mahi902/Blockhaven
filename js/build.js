// Blockhaven - build mode: placing furniture, walls, floors and rooms
import { TILE, COLOR_NAMES } from './config.js';
import { S } from './state.js';
import { catalog, order, previewUrl } from './catalog.js';
import * as W from './world.js';
import { sound } from './audio.js';
import { h, icon, button, swatches, toast } from './ui.js';

const TOOLS = [
  ['select', 'select', 'Select / move'],
  ['place', 'place', 'Furniture & walls'],
  ['floor', 'floor', 'Floor paint'],
  ['room', 'room', 'Draw a room'],
  ['erase', 'erase', 'Erase'],
];
let drag = null;
let tab = 'furniture';
let dom = {};

// ------------------------------------------------------------------ public API
export function initBuild() {
  dom.root = document.getElementById('buildUI');
  dom.toolbar = h('div', { class: 'bh-toolbar bh-panel' });
  dom.strip = h('div', { class: 'bh-strip bh-panel hidden' });
  dom.props = h('div', { class: 'bh-props bh-panel hidden' });
  dom.root.append(dom.props, dom.strip, dom.toolbar);
  buildToolbar();
  refreshPanels();
}

export function setMode(mode) {
  S.mode = mode;
  document.body.classList.toggle('building', mode === 'build');
  if (mode === 'play') { S.selected = null; S.ghost = null; S.linePreview = null; S.rectPreview = null; drag = null; }
  else { S.path = null; S.pendingInteract = null; }
  refreshPanels();
}

export function setTool(t) {
  S.tool = t; S.ghost = null; S.linePreview = null; S.rectPreview = null; drag = null;
  if (t !== 'select') S.selected = S.selected && S.selected.kind === 'room' && t === 'room' ? S.selected : null;
  if (t === 'place' && !S.place.type) pickType((order[tab][0]) || null);
  refreshPanels();
}

export function select(kind, id) {
  S.selected = kind ? { kind, id } : null;
  refreshPanels();
}

export function rotateCurrent() {
  if (S.tool === 'place' && S.place.type && !catalog.get(S.place.type).edge) {
    S.place.rot = (S.place.rot + 1) % 4; sound('click'); return;
  }
  const sel = S.selected;
  if (!sel || sel.kind !== 'item') return;
  const it = W.byId('item', sel.id); if (!it) return;
  const d = catalog.get(it.type);
  const nr = (it.rot + 1) % 4;
  const f = W.footprint(it);
  const swapped = (nr % 2) !== (it.rot % 2);
  const tries = [[it.x, it.y]];
  if (swapped) tries.push([Math.round(it.x + (f.w - f.h) / 2), Math.round(it.y + (f.h - f.w) / 2)]);
  const ok = tries.find(([x, y]) => W.canPlace(it.type, x, y, nr, it.id));
  if (!ok) { sound('error'); toast(`No room to rotate the ${d.name.toLowerCase()}`); return; }
  W.begin(); it.x = ok[0]; it.y = ok[1]; it.rot = nr; W.touch(); sound('click');
}

export function deleteSelected() {
  const sel = S.selected; if (!sel) return;
  const o = W.byId(sel.kind, sel.id); if (!o) return;
  W.begin();
  if (sel.kind === 'item') { if (S.player.seat && S.player.seat.id === o.id) S.player.seat = null; W.removeItem(o); }
  else if (sel.kind === 'edge') W.removeEdge(o);
  else { W.world.rooms.splice(W.world.rooms.indexOf(o), 1); }
  S.selected = null; W.touch(); sound('delete'); refreshPanels();
}

// ------------------------------------------------------------------ pointer handling
const cellOf = px => Math.floor(px / TILE);

function pick(wp) {
  const e = W.edgeAtPx(wp.x, wp.y, 9);
  if (e) return { kind: 'edge', obj: e };
  const it = W.itemAtPx(wp.x, wp.y);
  if (it) return { kind: 'item', obj: it };
  return null;
}

function ghostAt(wp) {
  const d = catalog.get(S.place.type); if (!d || d.edge) return null;
  const f = W.footprintFor(d.id, 0, 0, S.place.rot);
  const x = Math.round(wp.x / TILE - f.w / 2), y = Math.round(wp.y / TILE - f.h / 2);
  return { type: d.id, x, y, rot: S.place.rot, ok: W.canPlace(d.id, x, y, S.place.rot) };
}

function linePreviewTo(wp) {
  if (!drag || drag.type !== 'line') return;
  const list = [];
  if (drag.o === 'h') {
    const cx = Math.max(0, Math.min(W.world.w - 1, cellOf(wp.x)));
    for (let x = Math.min(drag.sx, cx); x <= Math.max(drag.sx, cx); x++) list.push({ o: 'h', x, y: drag.sy });
  } else {
    const cy = Math.max(0, Math.min(W.world.h - 1, cellOf(wp.y)));
    for (let y = Math.min(drag.sy, cy); y <= Math.max(drag.sy, cy); y++) list.push({ o: 'v', x: drag.sx, y });
  }
  S.linePreview = list;
}

function rectTo(wp) {
  const cx = Math.max(0, Math.min(W.world.w - 1, cellOf(wp.x))), cy = Math.max(0, Math.min(W.world.h - 1, cellOf(wp.y)));
  const x = Math.min(drag.sx, cx), y = Math.min(drag.sy, cy);
  S.rectPreview = { x, y, w: Math.abs(cx - drag.sx) + 1, h: Math.abs(cy - drag.sy) + 1, kind: drag.kind };
}

function eraseAt(wp) {
  const hit = pick(wp);
  if (!hit) return;
  if (!drag.began) { W.begin(); drag.began = true; }
  if (hit.kind === 'item') { if (S.player.seat && S.player.seat.id === hit.obj.id) S.player.seat = null; W.removeItem(hit.obj); }
  else W.removeEdge(hit.obj);
  if (S.selected && S.selected.id === hit.obj.id) S.selected = null;
  W.touch(); sound('delete');
}

/** Returns true when the build tool consumed the press (otherwise the camera pans). */
export function onDown(wp) {
  S.hoverWorld = wp;
  switch (S.tool) {
    case 'select': {
      const hit = pick(wp);
      if (!hit) return false;
      select(hit.kind, hit.obj.id);
      if (hit.kind === 'item') {
        const r = W.itemRect(hit.obj);
        drag = { type: 'move', item: hit.obj, grab: { x: wp.x - r.x, y: wp.y - r.y }, moved: false };
      }
      return true;
    }
    case 'place': {
      const d = catalog.get(S.place.type); if (!d) return false;
      if (d.edge) {
        const e = W.nearestEdge(wp.x, wp.y);
        if (!W.edgeInBounds(e.o, e.x, e.y)) return true;
        drag = { type: 'line', o: e.o, sx: e.x, sy: e.y };
        S.linePreview = [{ o: e.o, x: e.x, y: e.y }];
        return true;
      }
      const g = ghostAt(wp); S.ghost = g;
      if (g && g.ok) {
        W.begin();
        const it = W.placeItem(g.type, g.x, g.y, g.rot, S.place.color);
        W.touch(); sound('place');
        S.ghost = ghostAt(wp);
        return true;
      }
      sound('error'); return true;
    }
    case 'floor': case 'room': {
      drag = { type: 'rect', kind: S.tool, sx: Math.max(0, Math.min(W.world.w - 1, cellOf(wp.x))), sy: Math.max(0, Math.min(W.world.h - 1, cellOf(wp.y))) };
      rectTo(wp);
      return true;
    }
    case 'erase': drag = { type: 'erase', began: false }; eraseAt(wp); return true;
  }
  return false;
}

export function onMove(wp) {
  S.hoverWorld = wp;
  if (S.tool === 'place' && !drag) {
    const d = catalog.get(S.place.type);
    if (d && d.edge) { const e = W.nearestEdge(wp.x, wp.y); S.linePreview = W.edgeInBounds(e.o, e.x, e.y) ? [e] : null; S.ghost = null; }
    else { S.ghost = ghostAt(wp); S.linePreview = null; }
  }
  if (!drag) return;
  if (drag.type === 'move') {
    const it = drag.item;
    const nx = Math.round((wp.x - drag.grab.x) / TILE), ny = Math.round((wp.y - drag.grab.y) / TILE);
    if ((nx !== it.x || ny !== it.y) && W.canPlace(it.type, nx, ny, it.rot, it.id)) {
      if (!drag.moved) { W.begin(); drag.moved = true; }
      it.x = nx; it.y = ny; W.touch();
    }
  } else if (drag.type === 'rect') rectTo(wp);
  else if (drag.type === 'line') linePreviewTo(wp);
  else if (drag.type === 'erase') eraseAt(wp);
}

export function onUp(wp) {
  const d = drag; drag = null;
  if (!d) return;
  if (d.type === 'move' && d.moved) sound('place');
  if (d.type === 'rect' && S.rectPreview) {
    const r = S.rectPreview; S.rectPreview = null;
    if (d.kind === 'floor') {
      const cells = [];
      for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) cells.push([x, y]);
      W.begin(); W.paintFloor(cells, S.floorChoice); W.touch(); sound('place');
    } else {
      W.begin(); const room = W.addRoom(r.x, r.y, r.w, r.h); W.touch(); sound('good');
      S.selected = { kind: 'room', id: room.id }; refreshPanels();
    }
  } else if (d.type === 'line' && S.linePreview) {
    const list = S.linePreview; S.linePreview = null;
    W.begin();
    for (const e of list) if (W.edgeInBounds(e.o, e.x, e.y)) W.placeEdge(S.place.type, e.o, e.x, e.y, S.place.color);
    W.touch(); sound('place');
  }
}

/** A press+release without dragging that started on empty ground (select tool). */
export function onClick(wp) {
  if (S.tool !== 'select') return;
  const r = W.roomAt(cellOf(wp.x), cellOf(wp.y));
  if (r) select('room', r.id); else select(null);
}

// ------------------------------------------------------------------ UI
function pickType(id) {
  S.place.type = id; S.place.rot = 0; S.ghost = null; S.linePreview = null;
  refreshPanels();
}

function buildToolbar() {
  dom.toolBtns = {};
  const wrap = h('div', { class: 'bh-toolrow' });
  for (const [id, ic, label] of TOOLS) {
    const b = h('button', { class: 'bh-tool', type: 'button', title: label }, icon(ic), h('span', {}, label.split(' ')[0]));
    b.addEventListener('click', () => { sound('click'); setTool(id); });
    dom.toolBtns[id] = b; wrap.appendChild(b);
  }
  dom.undoBtn = button('', { kind: 'dark', small: true, icon: 'undo', title: 'Undo (Ctrl+Z)', onClick: () => { if (W.undo()) { S.selected = null; refreshPanels(); } } });
  dom.redoBtn = button('', { kind: 'dark', small: true, icon: 'redo', title: 'Redo (Ctrl+Y)', onClick: () => { if (W.redo()) { S.selected = null; refreshPanels(); } } });
  const rotBtn = button('', { kind: 'dark', small: true, icon: 'rotate', title: 'Rotate (R)', onClick: rotateCurrent });
  dom.toolbar.append(wrap, h('div', { class: 'bh-toolsep' }), rotBtn, dom.undoBtn, dom.redoBtn);
}

/** Cheap refresh used on every world change: only the undo/redo buttons. */
export function refreshHistory() {
  if (!dom.undoBtn) return;
  dom.undoBtn.disabled = !W.canUndo(); dom.redoBtn.disabled = !W.canRedo();
}

export function refreshPanels() {
  if (!dom.root) return;
  const build = S.mode === 'build';
  dom.root.classList.toggle('hidden', !build);
  if (!build) return;
  for (const [id, b] of Object.entries(dom.toolBtns)) b.classList.toggle('on', id === S.tool);
  dom.undoBtn.disabled = !W.canUndo(); dom.redoBtn.disabled = !W.canRedo();
  renderStrip();
  renderProps();
}

function renderStrip() {
  const el = dom.strip; el.innerHTML = '';
  if (S.tool === 'place') {
    el.classList.remove('hidden');
    const tabs = h('div', { class: 'bh-tabs' });
    for (const [id, label] of [['furniture', 'Furniture'], ['structure', 'Walls & doors'], ['npc', 'NPC']]) {
      const b = h('button', { class: `bh-tab${tab === id ? ' on' : ''}`, type: 'button' }, label);
      b.addEventListener('click', () => { sound('click'); tab = id; if (!(S.place.type && order[tab].includes(S.place.type))) pickType(order[tab][0] || null); else renderStrip(); });
      tabs.appendChild(b);
    }
    const cards = h('div', { class: 'bh-cards' });
    for (const id of order[tab]) {
      const d = catalog.get(id);
      const card = h('button', { class: `bh-card${S.place.type === id ? ' on' : ''}`, type: 'button', title: d.description },
        h('div', { class: 'bh-card-img' }, h('img', { src: previewUrl(d, S.place.color), alt: '', draggable: 'false' })),
        h('div', { class: 'bh-card-name' }, d.name),
        h('div', { class: 'bh-card-meta' }, d.edge ? 'edge' : `${d.w}x${d.h}`, d.hasFunction ? ' \u2022 fn' : ''));
      card.addEventListener('click', () => { sound('click'); pickType(id); });
      cards.appendChild(card);
    }
    const colors = swatches({ colors: COLOR_NAMES, value: S.place.color, onPick: c => { S.place.color = c; renderStrip(); } });
    el.append(tabs, cards, h('div', { class: 'bh-strip-row' }, h('span', { class: 'bh-label' }, 'Colour'), colors));
  } else if (S.tool === 'floor') {
    el.classList.remove('hidden');
    el.append(
      h('div', { class: 'bh-strip-row' }, h('span', { class: 'bh-label' }, 'Floor'),
        swatches({ colors: COLOR_NAMES, kind: 'floor', none: true, value: S.floorChoice, onPick: c => { S.floorChoice = c; } })),
      h('p', { class: 'bh-hint' }, 'Drag over tiles to paint them. Pick the cross to clear the floor.'));
  } else if (S.tool === 'room') {
    el.classList.remove('hidden');
    el.append(h('p', { class: 'bh-hint' }, 'Drag a box over an area to outline a room, then name it and set its floor, walls and ceiling.'));
  } else if (S.tool === 'erase') {
    el.classList.remove('hidden');
    el.append(h('p', { class: 'bh-hint' }, 'Click or drag over furniture and walls to remove them.'));
  } else if (S.tool === 'select') {
    el.classList.add('hidden');
  }
}

function renderProps() {
  const el = dom.props; el.innerHTML = '';
  const sel = S.selected;
  if (!sel) { el.classList.add('hidden'); return; }
  const o = W.byId(sel.kind, sel.id);
  if (!o) { el.classList.add('hidden'); S.selected = null; return; }
  el.classList.remove('hidden');
  const head = (title, sub) => h('div', { class: 'bh-props-head' },
    h('div', {}, h('div', { class: 'bh-props-title' }, title), sub ? h('div', { class: 'bh-props-sub' }, sub) : null),
    button('', { kind: 'dark', small: true, icon: 'close', title: 'Deselect', onClick: () => select(null) }));

  if (sel.kind === 'room') {
    const input = h('input', { class: 'bh-input', value: o.name, maxlength: 24, type: 'text' });
    input.addEventListener('change', () => { W.begin(); o.name = input.value.trim() || o.name; W.touch(); });
    el.append(head('Room', `${o.w} x ${o.h} tiles`),
      h('label', { class: 'bh-label' }, 'Name'), input,
      h('div', { class: 'bh-label' }, 'Floor'),
      swatches({ colors: COLOR_NAMES, kind: 'floor', none: true, value: o.floor, onPick: c => { W.begin(); W.setRoomFloor(o, c); W.touch(); } }),
      h('div', { class: 'bh-label' }, 'Walls'),
      swatches({ colors: COLOR_NAMES, none: true, value: o.wall, onPick: c => { W.begin(); W.setRoomWalls(o, c); W.touch(); } }),
      h('div', { class: 'bh-label' }, 'Ceiling'),
      swatches({ colors: COLOR_NAMES, none: true, value: o.ceiling, onPick: c => { W.begin(); o.ceiling = c; W.touch(); if (c) toast('Ceilings hide when you step inside. Toggle them in the top bar.'); } }),
      h('div', { class: 'bh-props-foot' }, button('Delete room', { kind: 'red', small: true, icon: 'trash', onClick: deleteSelected })));
    return;
  }
  const d = catalog.get(o.type);
  if (!d) { el.append(head('Unknown piece', o.type)); return; }
  el.append(head(d.name, d.description),
    d.hasFunction ? h('div', { class: 'bh-fn' }, 'Function: ', h('b', {}, d.tip)) : h('div', { class: 'bh-fn dim' }, 'Decoration only'),
    h('div', { class: 'bh-label' }, 'Colour'),
    swatches({ colors: COLOR_NAMES, value: o.color, onPick: c => { W.begin(); o.color = c; W.touch(); } }),
    h('div', { class: 'bh-props-foot' },
      sel.kind === 'item' ? button('Rotate', { kind: 'blue', small: true, icon: 'rotate', onClick: rotateCurrent }) : null,
      button('Delete', { kind: 'red', small: true, icon: 'trash', onClick: deleteSelected })));
}