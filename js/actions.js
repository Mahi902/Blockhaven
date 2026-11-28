// Blockhaven - the action buttons (bottom left). Everything usable right now gets a button and they stack:
// one action -> key E; several -> E x1 (bottom), E x2 (above it), E x3 ... Press E that many times in a row to pick one.
// On a phone just tap the button.
import { S } from './state.js';
import { interactWith } from './api.js';
import { leaveSeatNow, interactablesNear } from './player.js';

const CAP = 6;          // most buttons at once
const PRESS_MS = 320;   // pause after the last E press before the action runs
const $ = id => document.getElementById(id);
let sig = '', presses = 0, pressTimer = 0;

const seatText = seat => (seat.run ? 'Stop running' : seat.swim ? 'Climb out' : seat.sway ? 'Get out' : 'Stand up');
const keyLabel = (i, n) => (n === 1 ? 'E' : 'E\u00d7' + (i + 1));

/** Every frame: work out what can be done right now and show a button for each. */
export function updateActions() {
  const A = [];
  S.nearbyAll = [];
  if (S.mode === 'play' && S.started && !S.modalOpen) {
    const P = S.player;
    if (P.seat) A.push({ label: seatText(P.seat), run: () => leaveSeatNow() });
    else {
      S.nearbyAll = interactablesNear(46);
      for (const e of S.nearbyAll.slice(0, CAP)) A.push({ label: e.def.tip, target: e, run: () => interactWith(e.kind, e.obj) });
      if (S.partner && A.length < CAP) A.push({ label: 'Perform Emote Together', run: () => { if (S.onTogether && S.partner) S.onTogether(S.partner); } });
    }
  }
  S.nearby = S.nearbyAll[0] || null;
  S.actions = A;
  if (!A.length) cancelPresses();
  paint(A);
}

function paint(A) {
  const list = $('actionList'); if (!list) return;
  const s = A.map(a => a.label).join('|');
  if (s !== sig) {
    sig = s; list.replaceChildren();
    A.forEach((a, i) => {
      const b = document.createElement('button');
      b.className = 'bh-btn bh-gold'; b.type = 'button';
      const k = document.createElement('kbd'); k.textContent = keyLabel(i, A.length);
      const t = document.createElement('span'); t.textContent = a.label;
      b.append(k, t);
      b.addEventListener('click', () => runAction(i));
      b.addEventListener('pointerenter', () => { S.actionHover = i; });
      b.addEventListener('pointerleave', () => { if (S.actionHover === i) S.actionHover = -1; });
      list.append(b);
    });
    if (S.actionHover >= A.length) S.actionHover = -1;
  }
  [...list.children].forEach((b, i) => b.classList.toggle('armed', A.length > 1 && presses === i + 1));
  S.actionFocus = S.actionHover >= 0 ? S.actionHover : (A.length > 1 && presses ? presses - 1 : -1);
}

export function runAction(i) {
  if (S.modalOpen || !S.started || S.mode !== 'play') return;
  const a = S.actions && S.actions[i];
  if (a) a.run();
}

function cancelPresses() { presses = 0; clearTimeout(pressTimer); pressTimer = 0; }

/** The E key. One action runs at once; with several, the number of presses in a row picks which. */
export function pressAction() {
  if (S.modalOpen || !S.started || S.mode !== 'play') return;
  const n = (S.actions || []).length;
  if (!n) return;
  if (n === 1) { runAction(0); return; }
  presses++;
  clearTimeout(pressTimer);
  const fire = () => { const i = Math.min(presses, S.actions.length) - 1; cancelPresses(); runAction(i); };
  if (presses >= n) fire(); else pressTimer = setTimeout(fire, PRESS_MS);
}
