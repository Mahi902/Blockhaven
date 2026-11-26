// Blockhaven - the list of saved worlds (stored in localStorage; each world is its own save)
import { SAVE_KEY, WORLD_W, WORLD_H, VERSION } from './config.js';

const INDEX_KEY = 'blockhaven.worlds.v1', PREFIX = 'blockhaven.world.';
let idx = { worlds: [], last: null };

export const keyOf = id => PREFIX + id;
const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
const persist = () => { try { localStorage.setItem(INDEX_KEY, JSON.stringify(idx)); } catch (e) { /* storage blocked */ } };
export const emptyWorld = () => ({ w: WORLD_W, h: WORLD_H, next: 1, items: [], edges: [], floors: {}, rooms: [] });

export function init() {
  try { const r = JSON.parse(localStorage.getItem(INDEX_KEY) || 'null'); if (r && Array.isArray(r.worlds)) idx = r; } catch (e) { /* start fresh */ }
  if (!idx.worlds.length) {
    const id = create('My Home', null);
    const legacy = localStorage.getItem(SAVE_KEY);           // a home saved before worlds existed
    if (legacy) { try { localStorage.setItem(keyOf(id), legacy); } catch (e) { /* ignore */ } }
  }
  if (!get(idx.last)) idx.last = idx.worlds[0].id;
  persist();
}

export const list = () => [...idx.worlds].sort((a, b) => b.played - a.played);
export const get = id => idx.worlds.find(w => w.id === id) || null;
export const last = () => idx.last;
export function setLast(id) { idx.last = id; const w = get(id); if (w) w.played = Date.now(); persist(); }

/** data = null makes the world start as the starter apartment the first time it is opened. */
export function create(name, data) {
  const id = newId(), now = Date.now();
  idx.worlds.push({ id, name: (name || 'New World').trim().slice(0, 24) || 'New World', created: now, played: now });
  if (data) { try { localStorage.setItem(keyOf(id), JSON.stringify(data)); } catch (e) { /* ignore */ } }
  persist(); return id;
}
export function rename(id, name) { const w = get(id); if (w) { w.name = (name || '').trim().slice(0, 24) || w.name; persist(); } }
export function remove(id) {
  idx.worlds = idx.worlds.filter(w => w.id !== id);
  try { localStorage.removeItem(keyOf(id)); } catch (e) { /* ignore */ }
  if (!idx.worlds.length) idx.last = create('My Home', null);
  else if (idx.last === id) idx.last = idx.worlds[0].id;
  persist();
}

export function info(id) {
  const w = get(id); let d = null, raw = '';
  try { raw = localStorage.getItem(keyOf(id)) || ''; d = raw ? JSON.parse(raw) : null; } catch (e) { /* unreadable */ }
  return {
    created: w.created, played: w.played, fresh: !d,
    items: d ? d.items.length : 0, edges: d ? d.edges.length : 0, rooms: d ? d.rooms.length : 0,
    floors: d ? Object.keys(d.floors || {}).length : 0, kb: Math.max(1, Math.round(raw.length / 1024)),
  };
}

// ---- export / import (a plain .json file)
export function exportWorld(id) {
  const w = get(id); let data = null;
  try { data = JSON.parse(localStorage.getItem(keyOf(id)) || 'null'); } catch (e) { /* ignore */ }
  const file = { game: 'Blockhaven', version: VERSION, name: w.name, exported: Date.now(), world: data };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(file)], { type: 'application/json' }));
  a.download = `${w.name.replace(/[^\w\- ]+/g, '').trim() || 'world'}.blockhaven.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

export function importText(text) {
  let f; try { f = JSON.parse(text); } catch (e) { throw new Error('That file is not a Blockhaven world'); }
  const d = f && f.game === 'Blockhaven' ? f.world : null;
  if (f && f.game === 'Blockhaven' && d === null) return create(f.name || 'Imported World', null);
  if (!d || !Array.isArray(d.items) || !Array.isArray(d.edges) || typeof d.floors !== 'object' || !Array.isArray(d.rooms)) throw new Error('That file is not a Blockhaven world');
  return create(f.name || 'Imported World', Object.assign(emptyWorld(), d));
}
