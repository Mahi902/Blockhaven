// Blockhaven - keyboard, mouse, touch, d-pad and chat input
import { TILE } from './config.js';
import { S, screenToWorld } from './state.js';
import * as W from './world.js';
import { catalog } from './catalog.js';
import { walkTo, walkToAndUse, leaveSeatNow, say } from './player.js';
import { interactWith } from './api.js';
import * as B from './build.js';
import { closeModal } from './ui.js';
import { sound } from './audio.js';

const pointers = new Map();
let pan = null, pinch = null, handlers = {};
const ZMIN = 0.35, ZMAX = 2.2;

export function initInput(canvas, h) {
  handlers = h;
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', e => { S.keys[e.key.toLowerCase()] = false; });
  window.addEventListener('blur', () => { S.keys = {}; });
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);
  canvas.addEventListener('contextmenu', e => e.preventDefault());
  canvas.addEventListener('wheel', onWheel, { passive: false });

  document.querySelectorAll('.bh-dpad [data-dir]').forEach(btn => {
    const dir = btn.dataset.dir;
    const set = v => { S.touchDir[dir] = v; };
    btn.addEventListener('pointerdown', e => { e.preventDefault(); btn.setPointerCapture(e.pointerId); set(true); });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => btn.addEventListener(ev, () => set(false)));
  });

  const chat = document.getElementById('chatInput');
  chat.addEventListener('keydown', e => {
    e.stopPropagation();
    if (e.key === 'Enter') { sendChat(chat); }
    else if (e.key === 'Escape') { chat.value = ''; }
  });
  document.getElementById('chatSend').addEventListener('click', () => sendChat(chat));
}

function sendChat(input) {
  const t = input.value.trim();
  input.value = '';
  if (t) { say(t); sound('chat'); }
  input.focus();   // keep the chat box open and ready for the next message
}

export function doInteract() {
  if (S.modalOpen || !S.started || S.mode !== 'play') return;
  if (S.player.seat) { leaveSeatNow(); return; }
  if (S.nearby) interactWith(S.nearby.kind, S.nearby.obj);
}

function onKeyDown(e) {
  if (!S.started) return;
  const key = e.key.toLowerCase();
  const typing = ['INPUT', 'TEXTAREA'].includes((document.activeElement || {}).tagName);
  if (typing) return;
  if (e.ctrlKey || e.metaKey) {
    if (key === 'z' && S.mode === 'build') { e.preventDefault(); if (e.shiftKey) W.redo(); else W.undo(); S.selected = null; B.refreshPanels(); }
    else if (key === 'y' && S.mode === 'build') { e.preventDefault(); W.redo(); S.selected = null; B.refreshPanels(); }
    return;
  }
  S.keys[key] = true;
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) e.preventDefault();

  if (key === 'escape') {
    if (S.modalOpen) closeModal();
    else if (S.mode === 'build') {
      if (S.selected) B.select(null);
      else if (S.tool !== 'select') B.setTool('select');
    }
    return;
  }
  if (S.modalOpen) return;
  if (key === 'enter') { e.preventDefault(); const cb = document.getElementById('chatBtn'); if (cb && S.mode === 'play') cb.click(); return; }
  if (key === 'b') { handlers.toggleBuild && handlers.toggleBuild(); return; }
  if (S.mode === 'play') {
    if (key === 'e' || key === ' ') { e.preventDefault(); doInteract(); }
  } else {
    if (key === 'r') B.rotateCurrent();
    else if (key === 'delete' || key === 'backspace') { e.preventDefault(); B.deleteSelected(); }
    else if (key >= '1' && key <= '5') B.setTool(['select', 'place', 'floor', 'room', 'erase'][Number(key) - 1]);
  }
}

// ---- pointer ----------------------------------------------------------------
const wpFrom = e => { const r = e.target.getBoundingClientRect(); return screenToWorld(e.clientX - r.left, e.clientY - r.top); };

function onPointerDown(e) {
  if (!S.started || S.modalOpen) return;
  e.target.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pointers.size === 2) { startPinch(); pan = null; return; }
  const wp = wpFrom(e);
  const wantsPan = e.button === 1 || e.button === 2;
  if (S.mode === 'build' && !wantsPan) {
    if (B.onDown(wp)) { pan = { consumed: true }; return; }
  }
  if (S.mode === 'build' && e.button === 2 && S.tool !== 'select') { B.setTool('select'); }
  pan = { x: e.clientX, y: e.clientY, sx: S.camera.x, sy: S.camera.y, moved: false, wp, button: e.button, panning: S.mode === 'build' || wantsPan };
}

function onPointerMove(e) {
  const rec = pointers.get(e.pointerId);
  const r = e.target.getBoundingClientRect();
  const wp = screenToWorld(e.clientX - r.left, e.clientY - r.top);
  if (S.mode === 'build' && (!rec || !pan || pan.consumed)) B.onMove(wp);
  if (!rec) return;
  rec.x = e.clientX; rec.y = e.clientY;
  if (pinch && pointers.size >= 2) { updatePinch(); return; }
  if (pan && !pan.consumed) {
    const dx = e.clientX - pan.x, dy = e.clientY - pan.y;
    if (Math.hypot(dx, dy) > 6) pan.moved = true;
    if (pan.panning && pan.moved) {
      S.camera.x = pan.sx - dx / S.camera.zoom; S.camera.y = pan.sy - dy / S.camera.zoom;
      clampCamera();
    }
  }
}

function onPointerUp(e) {
  pointers.delete(e.pointerId);
  if (pinch && pointers.size < 2) pinch = null;
  const wp = wpFrom(e);
  if (pan && pan.consumed) { if (S.mode === 'build') B.onUp(wp); pan = null; return; }
  if (pan && !pan.moved && pan.button === 0) {
    if (S.mode === 'build') B.onClick(pan.wp);
    else playClick(pan.wp);
  }
  pan = null;
}

function playClick(wp) {
  if (S.player.seat && S.settings.clickMove) leaveSeatNow();
  const cx = Math.floor(wp.x / TILE), cy = Math.floor(wp.y / TILE);
  const e = W.edgeAtPx(wp.x, wp.y, 10);
  const it = W.itemAtCell(cx, cy);
  const hit = e && catalog.get(e.type).hasFunction ? { kind: 'edge', obj: e } : (it && catalog.get(it.type).hasFunction ? { kind: 'item', obj: it } : null);
  if (!S.settings.clickMove) {          // click-to-move is off: only use what is already within reach
    if (hit && S.nearby && S.nearby.obj === hit.obj) interactWith(hit.kind, hit.obj);
    return;
  }
  if (hit) { walkToAndUse(hit.kind, hit.obj); return; }
  walkTo(wp.x, wp.y);
}

// ---- zoom --------------------------------------------------------------------
export function setZoom(z, ax, ay) {
  const old = S.camera.zoom;
  z = Math.max(ZMIN, Math.min(ZMAX, z));
  if (ax != null) {                    // keep the world point under (ax, ay) fixed
    const w = screenToWorld(ax, ay);
    S.camera.zoom = z;
    S.camera.x = w.x - (ax - S.view.w / 2) / z; S.camera.y = w.y - (ay - S.view.h / 2) / z;
  } else S.camera.zoom = z;
  if (old !== z) clampCamera();
}

function onWheel(e) {
  e.preventDefault();
  const r = e.target.getBoundingClientRect();
  setZoom(S.camera.zoom * (e.deltaY < 0 ? 1.12 : 1 / 1.12), e.clientX - r.left, e.clientY - r.top);
}

function startPinch() {
  const [a, b] = [...pointers.values()];
  pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: S.camera.zoom };
}
function updatePinch() {
  const [a, b] = [...pointers.values()];
  const d = Math.hypot(a.x - b.x, a.y - b.y);
  if (pinch && pinch.d > 0) setZoom(pinch.z * d / pinch.d, (a.x + b.x) / 2, (a.y + b.y) / 2);
}

export function clampCamera() {
  const ww = W.world.w * TILE, wh = W.world.h * TILE, c = S.camera;
  const hw = S.view.w / 2 / c.zoom, hh = S.view.h / 2 / c.zoom;
  const m = 3 * TILE;
  c.x = ww + 2 * m < hw * 2 ? ww / 2 : Math.max(hw - m, Math.min(ww + m - hw, c.x));
  c.y = wh + 2 * m < hh * 2 ? wh / 2 : Math.max(hh - m, Math.min(wh + m - hh, c.y));
}