// Blockhaven - UI helpers built on the game's own CSS (css/game.css).
// function.js files get these through `api.ui`, so they never need CSS of their own.
import { COLOR_HEX, COLOR_NAMES } from './config.js';
import { S } from './state.js';
import { sound } from './audio.js';

const ICON_BASE = new URL('../img/icons/', import.meta.url).href;
export const FLOOR_BASE = new URL('../img/floor/', import.meta.url).href;

/** h('div', {class:'x', onClick: fn}, 'text', childNode) */
export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'html') el.innerHTML = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    el.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
  }
  return el;
}

export const icon = (name, cls = '') => h('img', { class: `bh-ico ${cls}`, src: `${ICON_BASE}${name}.svg`, alt: '', draggable: 'false' });

/** button(label, {kind:'green'|'red'|'blue'|'gold'|'dark', icon, onClick, small}) */
export function button(label, opts = {}) {
  const b = h('button', {
    class: `bh-btn bh-${opts.kind || 'green'}${opts.small ? ' bh-small' : ''}`,
    type: 'button', title: opts.title || '',
  }, opts.icon ? icon(opts.icon) : null, label ? h('span', {}, label) : null);
  b.addEventListener('click', e => { sound('click'); opts.onClick && opts.onClick(e); });
  return b;
}

/** A big blue list entry: choice('Title', 'small subtitle', onClick) */
export function choice(title, sub, onClick) {
  const b = h('button', { class: 'bh-choice', type: 'button' },
    h('span', { class: 'bh-choice-t' }, title), sub ? h('span', { class: 'bh-choice-s' }, sub) : null);
  b.addEventListener('click', e => { sound('click'); onClick && onClick(e); });
  return b;
}

/**
 * swatches({ colors:['red', ...] | ['#ff0000', ...], value, onPick, kind:'color'|'floor', none:false })
 * Colour names from the 16-colour list are looked up, anything starting with # is used as-is.
 */
export function swatches({ colors = COLOR_NAMES, value = null, onPick, kind = 'color', none = false }) {
  const wrap = h('div', { class: 'bh-swatches' });
  const items = none ? [null, ...colors] : colors;
  const els = [];
  const mark = v => els.forEach(([c, el]) => el.classList.toggle('on', c === v));
  for (const c of items) {
    const el = h('button', { class: `bh-swatch${kind === 'floor' ? ' bh-swatch-tex' : ''}${c === null ? ' bh-swatch-none' : ''}`, type: 'button', title: c === null ? 'None' : String(c) });
    if (c === null) el.appendChild(icon('close'));
    else if (kind === 'floor') el.style.backgroundImage = `url("${FLOOR_BASE}${encodeURIComponent(c)}.svg")`;
    else el.style.background = c.startsWith('#') ? c : (COLOR_HEX[c] || c);
    el.addEventListener('click', () => { sound('click'); mark(c); onPick && onPick(c); });
    els.push([c, el]);
    wrap.appendChild(el);
  }
  mark(value);
  wrap.setValue = mark;
  return wrap;
}

// ---- toast -----------------------------------------------------------------
let toastTimer = 0;
export function toast(text, ms = 2200) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = text;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), ms);
}

// ---- modal -----------------------------------------------------------------
let currentOnClose = null;

/** modal({ title, subtitle, body: Node|string, buttons:[{label,kind,onClick}], onClose }) */
export function openModal({ title = '', subtitle = '', body = null, buttons = [], onClose = null, wide = false, locked = false } = {}) {
  const root = document.getElementById('modalRoot');
  if (currentOnClose) { const f = currentOnClose; currentOnClose = null; try { f(); } catch (e) { console.error(e); } }
  root.innerHTML = '';
  const card = h('div', { class: `bh-panel bh-modal-card${wide ? ' bh-wide' : ''}` },
    h('div', { class: 'bh-modal-head' },
      h('div', {},
        h('h2', { class: 'bh-modal-title' }, title),
        subtitle ? h('p', { class: 'bh-modal-sub' }, subtitle) : null),
      locked ? null : button('', { kind: 'red', small: true, icon: 'close', title: 'Close', onClick: closeModal })),
    h('div', { class: 'bh-modal-body' }, typeof body === 'string' ? h('p', { class: 'bh-text' }, body) : body),
    buttons.length ? h('div', { class: 'bh-modal-foot' }, buttons.map(b => button(b.label, { kind: b.kind || 'green', icon: b.icon, onClick: b.onClick }))) : null);
  const overlay = h('div', { class: 'bh-overlay' }, card);
  overlay.addEventListener('pointerdown', e => { if (e.target === overlay && !locked) closeModal(); });
  root.appendChild(overlay);
  S.modalOpen = true;
  currentOnClose = onClose;
  return card;
}

export function closeModal() {
  const root = document.getElementById('modalRoot');
  if (!root) return;
  root.innerHTML = '';
  S.modalOpen = false;
  if (currentOnClose) { const f = currentOnClose; currentOnClose = null; try { f(); } catch (e) { console.error(e); } }
}