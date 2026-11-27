// Blockhaven - boot, game loop and top bar
import { HAIR_STYLES } from './hair.js';
import { TILE, PLAYER_KEY, SETTINGS_KEY, SKIN_TONES, HAIR_COLORS, SHIRT_COLORS, PANTS_COLORS, VERSION, GENDERS, BUILDS } from './config.js';
import * as Wm from './worlds.js';
import { S } from './state.js';
import * as W from './world.js';
import { loadCatalog, catalog, getImage, getFunction, previewUrl } from './catalog.js';
import { stopMusic } from './music.js';
import { loadPlayerTemplates, updatePlayer, nearestInteractive, setLook, sprites } from './player.js';
import { initRender, render, resize } from './render.js';
import { initInput, doInteract, setZoom, clampCamera } from './input.js';
import * as B from './build.js';
import { buildStarter, SPAWN } from './starter.js';
import { setSound, soundOn, sound } from './audio.js';
import { button, toast, h, openModal, closeModal, swatches, choice } from './ui.js';
import './api.js';
import { updateNpcs } from './npc.js';
import * as MPm from './multiplayer.js';

const $ = id => document.getElementById(id);
let bar = {};

function placeAtSpawn() {
  const P = S.player;
  for (let r = 0; r < 12; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
    const x = (Math.floor(SPAWN.x) + dx + .5) * TILE, y = (Math.floor(SPAWN.y) + dy + .5) * TILE;
    if (W.inBounds(Math.floor(x / TILE), Math.floor(y / TILE)) && !W.circleHits(x, y, 14)) { P.x = x; P.y = y; return; }
  }
  P.x = SPAWN.x * TILE; P.y = SPAWN.y * TILE;
}

function toggleBuild() {
  if (!MPm.canEdit()) return;
  B.setMode(S.mode === 'build' ? 'play' : 'build');
  if (S.mode === 'build' && S.player.seat) S.player.seat = null;
  syncBar();
}

function syncBar() {
  const build = S.mode === 'build';
  bar.mode.querySelector('img').src = `img/icons/${build ? 'play' : 'build'}.svg`;
  bar.mode.querySelector('span').textContent = build ? 'Play' : 'Build';
  bar.ceil.classList.toggle('hidden', !build);
  bar.mode.classList.toggle('hidden', !MPm.canEdit());
  bar.night.classList.toggle('hidden', !MPm.canEdit());
  bar.night.querySelector('img').src = `img/icons/${S.night ? 'sun' : 'moon'}.svg`;
  bar.snd.querySelector('img').src = `img/icons/sound-${soundOn ? 'on' : 'off'}.svg`;
  applyChat();
  $('dpad').classList.toggle('off', build);
}

function buildBar() {
  bar.mode = button('Build', { kind: 'blue', icon: 'build', onClick: toggleBuild, title: 'Build mode (B)' });
  bar.ceil = button('', { kind: 'dark', small: true, icon: 'ceiling', title: 'Show ceilings', onClick: () => { S.showCeilings = !S.showCeilings; bar.ceil.classList.toggle('on', S.showCeilings); } });
  bar.night = button('', { kind: 'dark', small: true, icon: 'moon', title: 'Day / night', onClick: () => { if (!MPm.canEdit()) return; if (MPm.active()) MPm.requestNight(!S.night); else { S.night = !S.night; syncBar(); } } });
  bar.snd = button('', { kind: 'dark', small: true, icon: 'sound-on', title: 'Sound', onClick: () => { setSound(!soundOn); syncBar(); } });
  bar.chat = button('', { kind: 'dark', small: true, icon: 'chat', title: 'Chat (Enter)', onClick: toggleChat });
  bar.chat.id = 'chatBtn';
  const zi = button('', { kind: 'dark', small: true, icon: 'zoom-in', title: 'Zoom in', onClick: () => setZoom(S.camera.zoom * 1.2) });
  const zo = button('', { kind: 'dark', small: true, icon: 'zoom-out', title: 'Zoom out', onClick: () => setZoom(S.camera.zoom / 1.2) });
  $('topLeft').append(bar.mode, bar.ceil);
  bar.set = button('', { kind: 'dark', small: true, icon: 'gear', title: 'Settings', onClick: openSettings });
  zo.classList.add('zoom-btn'); zi.classList.add('zoom-btn');
  const canFs = !!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen);
  bar.fs = button('', { kind: 'dark', small: true, icon: 'fullscreen', title: 'Full screen', onClick: toggleFullscreen });
  $('topRight').append(bar.chat, bar.night, zo, zi, ...(canFs ? [bar.fs] : []), bar.set);
  ['fullscreenchange', 'webkitfullscreenchange'].forEach(ev => document.addEventListener(ev, syncFs));
  document.addEventListener('bh-night', syncBar);
  $('topbar').classList.remove('hidden');
}

const fsElement = () => document.fullscreenElement || document.webkitFullscreenElement || null;
function toggleFullscreen() {
  const d = document, el = d.documentElement;
  try {
    if (fsElement()) (d.exitFullscreen || d.webkitExitFullscreen).call(d);
    else (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
  } catch (e) { toast('Full screen is not available here'); }
}
function fitViewport() {
  const hh = (window.visualViewport && window.visualViewport.height) || window.innerHeight;
  document.documentElement.style.setProperty('--ah', Math.round(hh) + 'px');
  resize(); clampCamera();
}
['resize', 'orientationchange'].forEach(ev => window.addEventListener(ev, () => { fitViewport(); setTimeout(fitViewport, 250); }));
if (window.visualViewport) window.visualViewport.addEventListener('resize', fitViewport);
function syncFs() {
  const on = !!fsElement();
  document.body.classList.toggle('fs', on);
  [0, 120, 400, 900].forEach(ms => setTimeout(fitViewport, ms));
  bar.fs.querySelector('img').src = `img/icons/${on ? 'fullscreen-exit' : 'fullscreen'}.svg`;
  bar.fs.title = on ? 'Exit full screen' : 'Full screen';
  bar.fs.classList.toggle('on', on);
}

function saveSettings() { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...S.settings, sound: soundOn })); } catch (e) { /* ignore */ } }

function openSettings() {
  const row = (label, sub, get, set) => {
    const b = button(get() ? 'On' : 'Off', { kind: get() ? 'green' : 'dark', small: true, onClick: () => {
      set(!get()); saveSettings(); syncBar();
      const t = b.querySelector('span'); t.textContent = get() ? 'On' : 'Off';
      b.className = `bh-btn bh-${get() ? 'green' : 'dark'} bh-small`;
    } });
    return h('div', { class: 'bh-setrow' }, h('div', {}, h('div', { class: 'bh-set-t' }, label), h('div', { class: 'bh-set-s' }, sub)), b);
  };
  const nameIn = h('input', { class: 'bh-input', type: 'text', maxlength: 16, value: S.player.name, placeholder: 'Guest' });
  const applyName = () => { S.player.name = nameIn.value.trim() || 'Guest'; nameIn.value = S.player.name; savePlayer(); };
  nameIn.addEventListener('change', applyName);
  nameIn.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') { applyName(); nameIn.blur(); } });
  const body = h('div', { class: 'bh-stack' },
    h('div', { class: 'bh-setrow' }, h('div', { style: { flex: '1' } }, h('div', { class: 'bh-set-t' }, 'Your name'), nameIn),
      button('Save', { kind: 'blue', small: true, onClick: applyName })),
    row('Click to move', 'Tap or click the ground to walk there. Off = keyboard / d-pad only.', () => S.settings.clickMove, v => { S.settings.clickMove = v; if (!v) { S.path = null; S.pendingInteract = null; } }),
    row('Sound', 'Sound effects.', () => soundOn, v => setSound(v)),
    ...(MPm.isHost() ? [h('div', { class: 'bh-setrow' }, h('div', {}, h('div', { class: 'bh-set-t' }, 'Multiplayer'), h('div', { class: 'bh-set-s' }, 'Permissions, invites and stopping the session.')),
      button('Permissions', { kind: 'blue', small: true, onClick: MPm.openPermissions }))] : []),
    h('div', { class: 'bh-setrow' }, h('div', {}, h('div', { class: 'bh-set-t' }, MPm.isGuest() ? 'Session' : 'Worlds'), h('div', { class: 'bh-set-s' }, MPm.isGuest() ? 'Leave this multiplayer game.' : 'Save and go back to the home screen.')),
      button(MPm.isGuest() ? 'Leave' : 'Exit', { kind: 'blue', small: true, onClick: () => MPm.isGuest() ? MPm.leave() : exitToMenu() })),
    ...(MPm.active() && !MPm.isHost() ? [] : [h('div', { class: 'bh-setrow' }, h('div', {}, h('div', { class: 'bh-set-t' }, 'Reset home'), h('div', { class: 'bh-set-s' }, 'Go back to the starter apartment. Removes your changes.')),
      button('Reset', { kind: 'red', small: true, onClick: () => {
        if (!confirm('Reset your home to the starter apartment? This removes your changes.')) return;
        buildStarter(); placeAtSpawn(); B.select(null); toast('Home reset'); import('./ui.js').then(u => u.closeModal());
      } }))]));
  openModal({ title: 'Settings', body, onClose: applyName });
}

let chatOpen = false;   // user's own open/closed choice; only the chat button / Escape change it
function applyChat() {
  const show = chatOpen && S.mode !== 'build';
  $('chatbar').classList.toggle('hidden', !show);
  bar.chat.classList.toggle('on', show);
}
function toggleChat() {
  if (S.mode === 'build') return;
  chatOpen = !chatOpen;
  applyChat();
  if (chatOpen) $('chatInput').focus(); else $('chatInput').blur();
}
function closeChat() { chatOpen = false; applyChat(); $('chatInput').blur(); }

function updatePrompt() {
  const el = $('prompt');
  let text = null;
  if (S.mode === 'play' && !S.modalOpen) {
    if (S.player.seat) text = S.player.seat.run ? 'Stop running' : (S.player.seat.swim ? 'Climb out' : 'Stand up');
    else if (S.nearby) text = S.nearby.def.tip;
  }
  el.classList.toggle('hidden', !text);
  if (text) $('promptText').textContent = text;
}

let last = 0;
function frame(t) {
  const dt = Math.min(0.05, (t - last) / 1000 || 0.016); last = t;
  S.tick++;
  if (S.started) {
    if (S.mode === 'play') {
      updatePlayer(dt);
      S.nearby = S.player.seat ? null : nearestInteractive(46);
      const c = S.camera, k = 1 - Math.pow(0.001, dt);
      c.x += (S.player.x - c.x) * k; c.y += (S.player.y - c.y) * k;
      clampCamera();
    } else S.nearby = null;
    if (!MPm.canEdit() && S.mode === 'build') { B.setMode('play'); syncBar(); }
    MPm.tickRemote(dt);
    updateNpcs(dt);
    S.bubbles.forEach(b => { b.ttl -= dt; });
    S.bubbles = S.bubbles.filter(b => b.ttl > 0);
    updatePrompt();
  }
  render();
  requestAnimationFrame(frame);
}

const bootT0 = performance.now();
async function boot() {
  const canvas = $('game');
  initRender(canvas);
  window.addEventListener('resize', () => { resize(); clampCamera(); });
  try {
    const saved = JSON.parse(localStorage.getItem(PLAYER_KEY) || 'null');
    if (saved) { S.player.name = saved.name || 'Guest'; Object.assign(S.player.look, saved.look || {}); $('nameInput').value = saved.name || ''; }
  } catch (e) { /* ignore */ }
  try {
    const st = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null');
    if (st) { S.settings.clickMove = st.clickMove !== false; if (st.sound === false) setSound(false); }
  } catch (e) { /* ignore */ }
  if (Math.min(window.innerWidth, window.innerHeight) < 600) S.camera.zoom = 0.6;
  await loadCatalog();
  await loadPlayerTemplates();
  W.listeners.push(B.refreshHistory);
  document.addEventListener('bh-look', savePlayer);
  B.initBuild(); buildBar();
  initInput(canvas, { toggleBuild });
  $('prompt').addEventListener('click', doInteract);
  $('chatInput').addEventListener('keydown', e => { if (e.key === 'Escape') closeChat(); });
  const noSelect = e => { if (!e.target.closest('input')) e.preventDefault(); };
  document.addEventListener('contextmenu', noSelect);
  document.addEventListener('selectstart', noSelect);
  document.addEventListener('dragstart', noSelect);
  placeAtSpawn();
  S.camera.x = S.player.x; S.camera.y = S.player.y;
  syncBar();
  Wm.init(); curId = Wm.last(); buildLook(); buildHome();
  $('startBtn').addEventListener('click', start);
  MPm.init({ syncBar, exitToMenu, startHost: id => { curId = id; start(); MPm.onHostStart(); }, startGuest });
  const mpBtn = button('Multiplayer', { kind: 'dgreen', icon: 'multiplayer', onClick: () => { S.player.name = $('nameInput').value.trim() || 'Guest'; savePlayer(); MPm.openMultiplayer(Wm.list()); } });
  mpBtn.classList.add('mp-btn'); $('startBtn').after(mpBtn);
  const tabs = { Play: ['tabPlay', 'panePlayTitle'], Look: ['tabLook', 'paneLook'] };
  Object.values(tabs).forEach(([t]) => $(t).addEventListener('click', () => Object.values(tabs).forEach(([tt, pp]) => { $(tt).classList.toggle('on', tt === t); $(pp).classList.toggle('hidden', tt !== t); })));
  $('nameInput').addEventListener('keydown', e => { if (e.key === 'Enter') start(); });
  $('verTag').textContent = 'v' + VERSION;
  requestAnimationFrame(frame);
  await warmUp();
  const left = Math.max(0, 2600 - (performance.now() - bootT0));
  setTimeout(() => $('splash').classList.add('out'), left);
}

// Everything the game needs for normal play, loaded while the splash screen is up.
async function warmUp() {
  const waits = [];
  try { if (document.fonts && document.fonts.ready) waits.push(document.fonts.ready); } catch (e) { /* ignore */ }
  for (const d of catalog.values()) {
    waits.push(new Promise(res => { const im = new Image(); im.onload = im.onerror = res; im.src = previewUrl(d, d.colors && d.colors[0]); }));
    if (d.hasFunction) waits.push(getFunction(d).catch(() => null));
    getImage(d, d.colors && d.colors[0]);
  }
  await Promise.race([Promise.allSettled(waits), new Promise(r => setTimeout(r, 6000))]);
}

function refreshPreview() {
  const src = sprites.down && sprites.down.src;
  if (src) { $('preview').src = src; $('preview2').src = src; }
}
function buildLook() {
  const L = S.player.look, box = $('lookSwatches');
  const row = (label, key, colors) => [h('div', { class: 'bh-label' }, label), swatches({ colors, value: L[key], onPick: c => setLook({ [key]: c }) })];
  const styleBtns = HAIR_STYLES.map(st => {
    const b = h('button', { class: `bh-tab${(L.style || 'short') === st.id ? ' on' : ''}`, type: 'button' }, st.name);
    b.addEventListener('click', () => { sound('click'); setLook({ style: st.id }); });
    b.dataset.style = st.id;
    return b;
  });
  const styleRow = h('div', { class: 'bh-chips' }, ...styleBtns);
  document.addEventListener('bh-look', () => styleBtns.forEach(b => b.classList.toggle('on', b.dataset.style === (S.player.look.style || 'short'))));
  const chips = (key, list, def) => {
    const bs = list.map(o => { const b = h('button', { class: `bh-tab${(L[key] || def) === o.id ? ' on' : ''}`, type: 'button' }, o.name); b.addEventListener('click', () => {
      sound('click');
      const part = { [key]: o.id };
      if (key === 'gender') {
        const st = S.player.look.style || 'short';
        if (o.id === 'female' && ['short', 'buzz', 'spiky', 'mohawk', 'bald'].includes(st)) part.style = 'long';
        if (o.id === 'male' && ['long', 'ponytail', 'bun'].includes(st)) part.style = 'short';
      }
      setLook(part);
    }); b.dataset.v = o.id; return b; });
    document.addEventListener('bh-look', () => bs.forEach(b => b.classList.toggle('on', b.dataset.v === (S.player.look[key] || def))));
    return h('div', { class: 'bh-chips' }, ...bs);
  };
  box.append(h('div', { class: 'bh-label' }, 'Gender'), chips('gender', GENDERS, 'male'), h('div', { class: 'bh-label' }, 'Build'), chips('build', BUILDS, 'average'),
    ...row('Skin', 'skin', SKIN_TONES), h('div', { class: 'bh-label' }, 'Hairstyle'), styleRow, ...row('Hair colour', 'hair', HAIR_COLORS), ...row('Shirt', 'shirt', SHIRT_COLORS), ...row('Pants', 'pants', PANTS_COLORS));
  document.addEventListener('bh-look', refreshPreview);
  refreshPreview();
}

function savePlayer() { try { localStorage.setItem(PLAYER_KEY, JSON.stringify({ name: S.player.name, look: S.player.look })); } catch (e) { /* ignore */ } }

function start() {
  stopMusic();
  S.player.name = $('nameInput').value.trim() || 'Guest';
  savePlayer();
  if (!Wm.get(curId)) curId = Wm.list()[0].id;
  Wm.setLast(curId);
  W.useKey(Wm.keyOf(curId));
  if (!W.load()) buildStarter();
  S.player.seat = null; S.path = null; S.pendingInteract = null; S.selected = null;
  B.setMode('play'); placeAtSpawn();
  S.camera.x = S.player.x; S.camera.y = S.player.y;
  syncBar();
  S.started = true;
  $('intro').classList.add('hidden');
}

function startGuest(snap) {
  stopMusic(); closeModal();
  W.useKey(null); W.applySnapshot(snap);
  S.player.seat = null; S.path = null; S.pendingInteract = null; S.selected = null;
  B.setMode('play'); placeAtSpawn();
  S.camera.x = S.player.x; S.camera.y = S.player.y;
  S.started = true; syncBar();
  $('intro').classList.add('hidden');
}

function exitToMenu() {
  if (MPm.isHost()) MPm.stop(true);
  stopMusic(); closeModal(); W.save(); Wm.setLast(curId);
  S.started = false; S.player.seat = null; B.setMode('play'); syncBar();
  renderWorlds();
  $('intro').classList.remove('hidden');
}

// ---- home screen: worlds, import / export, credits
let curId = null;
const fmt = t => new Date(t).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
function ago(t) {
  const m = Math.round((Date.now() - t) / 60000);
  return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`;
}

function renderWorlds() {
  const box = $('worldList'); box.innerHTML = '';
  for (const w of Wm.list()) {
    const main = h('div', { class: 'world-main' }, h('div', { class: 'world-n' }, w.name), h('div', { class: 'world-s' }, 'Played ' + ago(w.played)));
    const row = h('div', { class: 'world' + (w.id === curId ? ' on' : '') }, main,
      button('', { kind: 'dark', small: true, icon: 'info', title: 'Info and options', onClick: () => openInfo(w.id) }));
    main.addEventListener('click', () => { curId = w.id; renderWorlds(); });
    main.addEventListener('dblclick', start);
    box.append(row);
  }
}

function openInfo(id) {
  const w = Wm.get(id), inf = Wm.info(id);
  const nameIn = h('input', { class: 'bh-input', type: 'text', maxlength: 24, value: w.name });
  nameIn.addEventListener('keydown', e => e.stopPropagation());
  const rows = [['Created', fmt(inf.created)], ['Last played', fmt(inf.played)],
    ['Furniture', inf.items], ['Walls, doors and windows', inf.edges], ['Rooms', inf.rooms], ['Floor tiles', inf.floors],
    ['Save size', inf.fresh ? 'Not built yet' : inf.kb + ' KB']];
  openModal({
    title: 'World info', subtitle: 'Rename, export or delete this world',
    body: h('div', { class: 'bh-stack' }, h('div', {}, h('div', { class: 'bh-label' }, 'Name'), nameIn),
      h('div', { class: 'bh-info' }, rows.map(([k, v]) => h('div', { class: 'bh-inforow' }, h('span', {}, k), h('b', {}, String(v)))))),
    buttons: [
      { label: 'Save name', kind: 'blue', onClick: () => {
        const want = nameIn.value.trim(); Wm.rename(id, want); renderWorlds(); closeModal();
        const got = Wm.get(id).name; if (want && got.toLowerCase() !== want.slice(0, 24).toLowerCase()) toast(`That name is taken, so it is now "${got}"`, 3200);
      } },
      { label: 'Export', kind: 'gold', icon: 'download', onClick: () => { if (inf.fresh) { toast('Play this world once before exporting it'); return; } Wm.exportWorld(id); } },
      { label: 'Delete', kind: 'red', icon: 'trash', onClick: () => {
        if (!confirm(`Delete "${w.name}" forever? Export it first if you want a copy.`)) return;
        Wm.remove(id); if (!Wm.get(curId)) curId = Wm.list()[0].id; renderWorlds(); closeModal();
      } },
    ],
  });
}

// Step 1: choose what to do. Step 2 (create): name it and pick a starting point.
function openNewWorld() {
  openModal({
    title: 'New world', subtitle: 'What would you like to do?',
    body: h('div', { class: 'bh-stack' },
      choice('Create a new world', 'Start fresh with a starter apartment or an empty plot', openCreateWorld),
      choice('Import a world', 'Load a world you exported earlier (.json file)', () => { closeModal(); $('importFile').click(); })),
  });
}

function openCreateWorld() {
  const nameIn = h('input', { class: 'bh-input', type: 'text', maxlength: 24, value: Wm.uniqueName(`World ${Wm.list().length + 1}`) });
  nameIn.addEventListener('keydown', e => e.stopPropagation());
  const make = data => {
    const want = nameIn.value.trim(); curId = Wm.create(nameIn.value, data); renderWorlds(); closeModal();
    const got = Wm.get(curId).name; if (want && got.toLowerCase() !== want.slice(0, 24).toLowerCase()) toast(`That name is taken, so it is now "${got}"`, 3200);
  };
  openModal({
    title: 'Create a new world', subtitle: 'Name it, then pick a starting point',
    body: h('div', { class: 'bh-stack' }, h('div', {}, h('div', { class: 'bh-label' }, 'Name'), nameIn),
      choice('Starter apartment', 'Four furnished rooms to explore', () => make(null)),
      choice('Empty plot', 'A blank plot to build from scratch', () => make(Wm.emptyWorld())),
      button('Back', { kind: 'dark', small: true, onClick: openNewWorld })),
  });
}

function openCredits() {
  openModal({
    title: 'Credits', body: h('div', { class: 'credits' },
      h('img', { src: 'img/logo.svg', alt: '' }), h('h3', {}, 'Blockhaven'),
      h('p', {}, 'Version ' + VERSION),
      h('p', {}, 'Created, designed and developed by'),
      h('p', {}, h('a', { href: 'https://github.com/mahi902', target: '_blank', rel: 'noopener' }, 'mahi902')),
      h('p', {}, 'All art, code and sounds in this game are by mahi902.')),
  });
}

function buildHome() {
  $('menuRow').append(button('New world', { kind: 'blue', icon: 'plus', onClick: openNewWorld }));
  $('introCorner').append(button('Credits', { kind: 'dark', small: true, onClick: openCredits }));
  $('importFile').addEventListener('change', async e => {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    try { curId = Wm.importText(await f.text()); renderWorlds(); toast('Imported "' + Wm.get(curId).name + '"'); }
    catch (err) { toast(err.message || 'Could not import that file'); }
  });
  renderWorlds();
}

boot().catch(e => { console.error(e); document.body.insertAdjacentHTML('beforeend', '<pre style="position:fixed;inset:auto 8px 8px;color:#fda4af;z-index:99">Blockhaven failed to start: ' + String(e.message).replace(/</g, '&lt;') + '</pre>'); });
