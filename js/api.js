// Blockhaven - the API handed to every furniture function.js
import { COLOR_NAMES, COLOR_HEX, SKIN_TONES, HAIR_COLORS, SHIRT_COLORS, PANTS_COLORS } from './config.js';
import { S } from './state.js';
import * as W from './world.js';
import { catalog, getFunction } from './catalog.js';
import { hooks, sitOn, runOn, standUp, say, setLook } from './player.js';
import { sound } from './audio.js';
import { HAIR_STYLES } from './hair.js';
import { h, button, choice, swatches, openModal, closeModal, toast } from './ui.js';

const ui = { h, button, choice, swatches, toast };
const palette = { hairStyles: HAIR_STYLES.map(s => s.id), skin: SKIN_TONES, hair: HAIR_COLORS, shirt: SHIRT_COLORS, pants: PANTS_COLORS };

function makeApi(kind, obj) {
  const def = catalog.get(obj.type);
  const api = {
    kind, item: obj, def,
    get state() { return obj.state || (obj.state = {}); },
    player: {
      get name() { return S.player.name; },
      get isSeated() { return !!S.player.seat; },
      get look() { return S.player.look; },
      get x() { return S.player.x; },
      get y() { return S.player.y; },
    },
    get isNight() { return S.night; },
    colors: COLOR_NAMES, colorHex: COLOR_HEX, palette,
    ui,
    // --- the player
    sit: () => sitOn(obj, false),
    lie: () => sitOn(obj, true),
    run: (rate = 1, offset) => runOn(obj, rate, offset),   // stand on it and run in place
    stand: () => standUp(),
    say, toast,
    setLook,
    setNight: v => { S.night = !!v; document.dispatchEvent(new CustomEvent('bh-night')); },
    // --- the furniture
    glow: (color, radius = 3) => {
      const st = obj.state || (obj.state = {});
      if (color) st.glow = { color, r: radius }; else delete st.glow;
      W.touch();
    },
    save: () => W.touch(),
    // --- feedback / UI
    sound,
    modal: opts => openModal(opts),
    closeModal,
    after: (ms, fn) => setTimeout(() => { try { fn(); } catch (e) { console.error(e); } }, ms),
  };
  return api;
}

/** Runs the function of a furniture item or edge piece. */
export async function runFunction(kind, obj) {
  const def = catalog.get(obj.type);
  if (!def || !def.hasFunction) return;
  const mod = await getFunction(def);
  if (!mod || typeof mod.default !== 'function') return;
  const api = makeApi(kind, obj);
  try { await mod.default(api); } catch (e) { console.error(`[function.js] "${def.id}" failed`, e); toast('That did not work.'); }
  W.touch();
}

/** What E / the action button does. */
export async function interactWith(kind, obj) {
  if (kind === 'item' && S.player.seat && S.player.seat.id === obj.id) return leaveItem(obj);
  return runFunction(kind, obj);
}

async function leaveItem(obj) {
  const def = catalog.get(obj.type);
  const mod = def && def.hasFunction ? await getFunction(def) : null;
  if (mod && typeof mod.leave === 'function') {
    try { mod.leave(makeApi('item', obj)); } catch (e) { console.error(e); }
  }
  if (S.player.seat) standUp();
  W.touch();
}

hooks.interact = (kind, obj) => interactWith(kind, obj);
hooks.leave = obj => { leaveItem(obj); };