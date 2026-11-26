// Blockhaven - boot, game loop and top bar
import { TILE, PLAYER_KEY, SETTINGS_KEY } from './config.js';
import { S } from './state.js';
import * as W from './world.js';
import { loadCatalog, catalog } from './catalog.js';
import { loadPlayerTemplates, updatePlayer, nearestInteractive } from './player.js';
import { initRender, render, resize } from './render.js';
import { initInput, doInteract, setZoom, clampCamera } from './input.js';
import * as B from './build.js';
import { buildStarter, SPAWN } from './starter.js';
import { setSound, soundOn } from './audio.js';
import { button, toast, h, openModal } from './ui.js';
import './api.js';

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
  B.setMode(S.mode === 'build' ? 'play' : 'build');
  if (S.mode === 'build' && S.player.seat) S.player.seat = null;
  syncBar();
}

function syncBar() {
  const build = S.mode === 'build';
  bar.mode.querySelector('img').src = `img/icons/${build ? 'play' : 'build'}.svg`;
  bar.mode.querySelector('span').textContent = build ? 'Play' : 'Build';
  bar.ceil.classList.toggle('hidden', !build);
  bar.night.querySelector('img').src = `img/icons/${S.night ? 'sun' : 'moon'}.svg`;
  bar.snd.querySelector('img').src = `img/icons/sound-${soundOn ? 'on' : 'off'}.svg`;
  $('chatbar').classList.toggle('hidden', build);
  $('dpad').classList.toggle('off', build);
}

function buildBar() {
  bar.mode = button('Build', { kind: 'blue', icon: 'build', onClick: toggleBuild, title: 'Build mode (B)' });
  bar.ceil = button('', { kind: 'dark', small: true, icon: 'ceiling', title: 'Show ceilings', onClick: () => { S.showCeilings = !S.showCeilings; bar.ceil.classList.toggle('on', S.showCeilings); } });
  bar.night = button('', { kind: 'dark', small: true, icon: 'moon', title: 'Day / night', onClick: () => { S.night = !S.night; syncBar(); } });
  bar.snd = button('', { kind: 'dark', small: true, icon: 'sound-on', title: 'Sound', onClick: () => { setSound(!soundOn); syncBar(); } });
  bar.chat = button('', { kind: 'dark', small: true, icon: 'chat', title: 'Chat (Enter)', onClick: toggleChat });
  bar.chat.id = 'chatBtn';
  const zi = button('', { kind: 'dark', small: true, icon: 'zoom-in', title: 'Zoom in', onClick: () => setZoom(S.camera.zoom * 1.2) });
  const zo = button('', { kind: 'dark', small: true, icon: 'zoom-out', title: 'Zoom out', onClick: () => setZoom(S.camera.zoom / 1.2) });
  $('topLeft').append(bar.mode, bar.ceil);
  bar.set = button('', { kind: 'dark', small: true, icon: 'grid', title: 'Settings', onClick: openSettings });
  zo.classList.add('zoom-btn'); zi.classList.add('zoom-btn');
  $('topRight').append(bar.chat, bar.night, zo, zi, bar.set);
  document.addEventListener('bh-night', syncBar);
  $('topbar').classList.remove('hidden');
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
  const body = h('div', { class: 'bh-stack' },
    row('Click to move', 'Tap or click the ground to walk there. Off = keyboard / d-pad only.', () => S.settings.clickMove, v => { S.settings.clickMove = v; if (!v) { S.path = null; S.pendingInteract = null; } }),
    row('Sound', 'Sound effects.', () => soundOn, v => setSound(v)),
    h('div', { class: 'bh-setrow' }, h('div', {}, h('div', { class: 'bh-set-t' }, 'Reset home'), h('div', { class: 'bh-set-s' }, 'Go back to the starter apartment. Removes your changes.')),
      button('Reset', { kind: 'red', small: true, onClick: () => {
        if (!confirm('Reset your home to the starter apartment? This removes your changes.')) return;
        buildStarter(); placeAtSpawn(); B.select(null); toast('Home reset'); import('./ui.js').then(u => u.closeModal());
      } })));
  openModal({ title: 'Settings', body });
}

function toggleChat() {
  const cb = $('chatbar'), open = cb.classList.contains('hidden');
  cb.classList.toggle('hidden', !open);
  bar.chat.classList.toggle('on', open);
  if (open) $('chatInput').focus(); else $('chatInput').blur();
}
function closeChat() { $('chatbar').classList.add('hidden'); bar.chat.classList.remove('on'); }

function updatePrompt() {
  const el = $('prompt');
  let text = null;
  if (S.mode === 'play' && !S.modalOpen) {
    if (S.player.seat) text = 'Stand up';
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
    S.bubbles.forEach(b => { b.ttl -= dt; });
    S.bubbles = S.bubbles.filter(b => b.ttl > 0);
    updatePrompt();
  }
  render();
  requestAnimationFrame(frame);
}

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
  if (!W.load()) buildStarter();
  W.listeners.push(B.refreshHistory);
  document.addEventListener('bh-look', savePlayer);
  B.initBuild(); buildBar();
  initInput(canvas, { toggleBuild });
  $('prompt').addEventListener('click', doInteract);
  $('chatSend').addEventListener('click', closeChat);
  $('chatInput').addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === 'Escape') closeChat(); });
  const noSelect = e => { if (!e.target.closest('input')) e.preventDefault(); };
  document.addEventListener('contextmenu', noSelect);
  document.addEventListener('selectstart', noSelect);
  document.addEventListener('dragstart', noSelect);
  placeAtSpawn();
  S.camera.x = S.player.x; S.camera.y = S.player.y;
  syncBar();
  $('startBtn').addEventListener('click', start);
  $('nameInput').addEventListener('keydown', e => { if (e.key === 'Enter') start(); });
  requestAnimationFrame(frame);
}

function savePlayer() { try { localStorage.setItem(PLAYER_KEY, JSON.stringify({ name: S.player.name, look: S.player.look })); } catch (e) { /* ignore */ } }

function start() {
  S.player.name = $('nameInput').value.trim() || 'Guest';
  savePlayer();
  S.started = true;
  $('intro').classList.add('hidden');
}

boot().catch(e => { console.error(e); document.body.insertAdjacentHTML('beforeend', '<pre style="position:fixed;inset:auto 8px 8px;color:#fda4af;z-index:99">Blockhaven failed to start: ' + String(e.message).replace(/</g, '&lt;') + '</pre>'); });
