// Blockhaven - "Perform Emote Together" (multiplayer only).
// Walk up to another player and a button appears. It opens a menu of two-player emotes (hug, handshake...). The other
// player sees it as a chat bubble above them: one click accepts, a double click declines. A pair then has to wait COOL_MS before doing another
// one together (they can still do them with anybody else). Requests travel as 'duo' messages (js/multiplayer.js).
import { S } from './state.js';
import { h, openModal, closeModal, toast } from './ui.js';
import { sound } from './audio.js';
import * as MPm from './multiplayer.js';
import { emotes, togetherOrder, startTogether, duoSilhouetteSvg } from './emotes.js';
import { buildSprites } from './player.js';

const COOL_MS = 20000;    // wait between two players' emotes together
const ASK_MS = 15000;     // how long a request stays open
const NEAR = 72;          // px: how close counts as "near"
const DOUBLE_MS = 300;    // two taps within this are a double tap

const cool = new Map();   // other player's id -> time (ms) they can emote with you again
let out = null;           // my request, waiting for an answer: { to, name, id, n, left, timer }
let incoming = null;      // a request I can answer: { from, name, def, n, left, timer }
let tapTimer = 0;

const byId = id => S.remote.find(r => r.id === id) || null;
export const coolLeft = id => Math.max(0, (cool.get(id) || 0) - Date.now());
const setCool = (id, ms) => cool.set(id, Date.now() + ms);
const inDuo = P => !!(P.emote && P.emote.with);

/** The player the "Perform Emote Together" button would be for, or null (also null while on cooldown with everyone near). */
export function nearestPartner() {
  if (!MPm.active() || !S.started || S.mode !== 'play' || !togetherOrder.length) return null;
  const P = S.player;
  if (P.seat || P.lock || inDuo(P) || out || incoming) return null;
  let best = null, bd = NEAR;
  for (const r of S.remote) {
    if (r.seat || r.lock || inDuo(r) || coolLeft(r.id)) continue;
    const d = Math.hypot(r.x - P.x, r.y - P.y);
    if (d < bd) { bd = d; best = r; }
  }
  return best;
}

// ---- the menu --------------------------------------------------------------------------------------------------------
const portrait = (look, name, cls) => {
  const img = h('img', { class: 'tg-av', alt: '', draggable: 'false' });
  try { const s = buildSprites(look || S.player.look); if (s.down) img.src = s.down.src; } catch (e) { /* no portrait */ }
  return h('div', { class: `tg-who ${cls}` }, img, h('div', { class: 'tg-name' }, name));
};

export function openTogether(partner) {
  if (!partner || S.modalOpen) return;
  const grid = h('div', { class: 'tg-grid' });
  for (const id of togetherOrder) {
    const d = emotes.get(id);
    const ico = h('span', { class: 'emote-ico tg-ico' });
    if (d.iconUrl) ico.append(h('img', { src: d.iconUrl, alt: '', draggable: 'false' })); else ico.innerHTML = duoSilhouetteSvg(d);
    const b = h('button', { class: 'emote-btn tg-btn', type: 'button', title: d.name }, ico, h('span', { class: 'emote-name' }, d.name));
    b.addEventListener('click', () => sendRequest(partner, d));
    grid.append(b);
  }
  openModal({
    title: 'Perform Emote Together', subtitle: 'Pick something to do with ' + partner.name,
    body: h('div', { class: 'bh-stack' },
      h('div', { class: 'tg-pair' }, portrait(S.player.look, S.player.name || 'You', 'me'), h('div', { class: 'tg-link', 'aria-hidden': 'true' }), portrait(partner.look, partner.name, 'them')),
      grid),
    wide: true,
  });
}

// The request is the sender's own chat bubble: "I want to hug you. Click to hug or double click to decline :(".
// On the other player's screen that bubble sits above the sender and is the thing to click.
const askText = d => `I want to ${d.ask}. Click to ${d.accept} or double click to decline :(`;
const clearOwnBubble = () => { if (S.bubbles[0] && S.bubbles[0].req) S.bubbles = []; };
const clearBubbleOf = id => { const r = byId(id); if (r && r.bubble && r.bubble.req) r.bubble = null; };

function sendRequest(r, def) {
  if (out) return;
  closeModal();
  const n = Math.floor(Math.random() * 1e9), left = S.player.x <= r.x, text = askText(def), ttl = ASK_MS / 1000;
  out = { to: r.id, name: r.name, id: def.id, n, left, timer: setTimeout(() => endOut('timeout'), ASK_MS + 2500) };
  S.bubbles = [{ text, ttl, max: ttl, req: true }];
  MPm.sendDuo(r.id, { k: 'req', id: def.id, n, left });
}
function cancelOut() {
  if (!out) return;
  MPm.sendDuo(out.to, { k: 'cancel', n: out.n });
  clearTimeout(out.timer); out = null; clearOwnBubble();
}
function endOut(why) {
  if (!out) return;
  const o = out; clearTimeout(o.timer); out = null; clearOwnBubble();
  if (why === 'timeout') { setCool(o.to, COOL_MS); toast(o.name + ' did not answer', 2500); }
  else if (why === 'no') { setCool(o.to, COOL_MS); toast(o.name + ' said no thanks :(', 2500); }
}

// ---- answering: click the sender's bubble (once = yes, twice = no) ----------------------------------------------------------------
/** Called by the canvas on a press at screen (x, y). Returns true if it hit the request bubble. */
export function bubbleTap(x, y) {
  if (!incoming) return false;
  const r = byId(incoming.from), b = r && r.bubble, q = b && b.req && b.rect;
  if (!q || x < q.x || x > q.x + q.w || y < q.y || y > q.y + q.h) return false;
  if (tapTimer) { clearTimeout(tapTimer); tapTimer = 0; answer(false); }               // second tap: decline
  else tapTimer = setTimeout(() => { tapTimer = 0; answer(true); }, DOUBLE_MS);          // single tap: accept, unless a second follows
  return true;
}
function answer(yes, why) {
  const inc = incoming; if (!inc) return;
  clearTimeout(inc.timer); clearTimeout(tapTimer); tapTimer = 0; incoming = null; clearBubbleOf(inc.from);
  MPm.sendDuo(inc.from, { k: yes ? 'yes' : 'no', n: inc.n, id: inc.def.id, why });
  if (yes) { if (startTogether(inc.def.id, inc.n, inc.from, 1, inc.left ? 1 : -1)) setCool(inc.from, inc.def.duration * 1000 + COOL_MS); }
  else setCool(inc.from, COOL_MS);
}

// ---- messages ---------------------------------------------------------------------------------------------------------------
function got(m) {
  if (m.k === 'req') return onRequest(m);
  if (m.k === 'cancel') { if (incoming && incoming.from === m.from && incoming.n === m.n) { clearTimeout(incoming.timer); clearTimeout(tapTimer); tapTimer = 0; incoming = null; clearBubbleOf(m.from); } return; }
  if (!out || out.to !== m.from || out.n !== m.n) return;
  if (m.k === 'yes') {
    const o = out; clearTimeout(o.timer); out = null; clearOwnBubble();
    const d = emotes.get(o.id);
    if (d && startTogether(o.id, o.n, o.to, 0, o.left ? -1 : 1)) setCool(o.to, d.duration * 1000 + COOL_MS);
  } else if (m.k === 'no') endOut('no');
}
function onRequest(m) {
  const from = byId(m.from), def = emotes.get(m.id), P = S.player;
  const no = why => MPm.sendDuo(m.from, { k: 'no', n: m.n, id: m.id, why });
  if (!from || !def || !def.together) return no('invalid');
  if (incoming || out || coolLeft(m.from) || P.seat || P.lock || inDuo(P) || Math.hypot(from.x - P.x, from.y - P.y) > NEAR * 2) return no('busy');
  const text = askText(def);
  incoming = { from: m.from, name: from.name, def, n: m.n, left: !!m.left, timer: setTimeout(() => answer(false, 'timeout'), ASK_MS) };
  from.bubble = { text, ttl: ASK_MS / 1000, req: true };       // drawn (and made clickable) by render.js
  toast(from.name + ': ' + text, 4200); sound('chat');
}

/** Every frame: forget everything when the session ends, cancel when someone leaves or walks off. */
export function tickTogether() {
  if (!MPm.active()) {
    if (out) { clearTimeout(out.timer); out = null; clearOwnBubble(); }
    if (incoming) { clearTimeout(incoming.timer); clearTimeout(tapTimer); tapTimer = 0; incoming = null; }
    cool.clear(); return;
  }
  if (out) { const r = byId(out.to); if (!r || Math.hypot(r.x - S.player.x, r.y - S.player.y) > NEAR * 2 || S.player.seat) cancelOut(); }
  if (incoming && !byId(incoming.from)) { clearTimeout(incoming.timer); clearTimeout(tapTimer); tapTimer = 0; incoming = null; }
}

export function initTogether() {
  MPm.onDuo(got);
  S.onTogether = openTogether;
  S.onBubbleTap = bubbleTap;
}
