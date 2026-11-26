// Blockhaven - the list of saved worlds (stored in localStorage; each world is its own save)
import { SAVE_KEY, WORLD_W, WORLD_H, VERSION } from './config.js';

const INDEX_KEY = 'blockhaven.worlds.v1', PREFIX = 'blockhaven.world.';
let idx = { worlds: [], last: null };

export const keyOf = id => PREFIX + id;
const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
const persist = () => { try { localStorage.setItem(INDEX_KEY, JSON.stringify(idx)); } catch (e) { /* storage blocked */ } };
export const emptyWorld = () => ({ w: WORLD_W, h: WORLD_H, next: 1, items: [], edges: [], floors: {}, rooms: [] });

// ---- unique names: no two worlds may share a name (case-insensitive).
// Name ends in a number -> bump it ("World 2" -> "World 3"); no number -> add one ("My Home" -> "My Home 2").
const MAX_NAME = 24;
const clean = n => String(n || '').trim().replace(/\s+/g, ' ').slice(0, MAX_NAME);
export function uniqueName(name, exceptId = null, fallback = 'New World') {
  const base = clean(name) || fallback;
  const taken = new Set(idx.worlds.filter(w => w.id !== exceptId).map(w => w.name.toLowerCase()));
  if (!taken.has(base.toLowerCase())) return base;
  const m = base.match(/^(.*?)(\d+)$/);
  const stem = m ? m[1] : base + ' ';
  let n = m ? parseInt(m[2], 10) : 1;
  for (let guard = 0; guard < 10000; guard++) {
    n++;
    const tail = String(n), cand = stem.slice(0, MAX_NAME - tail.length) + tail;
    if (!taken.has(cand.toLowerCase())) return cand;
  }
  return base.slice(0, MAX_NAME - 4) + Date.now().toString(36).slice(-4);
}
function dedupeAll() {          // repairs saves that somehow already contain duplicate names
  const kept = [];
  for (const w of [...idx.worlds].sort((a, b) => a.created - b.created)) {
    if (kept.some(x => x.name.toLowerCase() === w.name.toLowerCase())) {
      const taken = new Set(kept.map(x => x.name.toLowerCase()));
      let cand = w.name, n = 1;
      const m = w.name.match(/^(.*?)(\d+)$/); const stem = m ? m[1] : w.name + ' '; if (m) n = parseInt(m[2], 10);
      while (taken.has(cand.toLowerCase())) { n++; cand = stem.slice(0, MAX_NAME - String(n).length) + n; }
      w.name = cand;
    }
    kept.push(w);
  }
}

export function init() {
  try { const r = JSON.parse(localStorage.getItem(INDEX_KEY) || 'null'); if (r && Array.isArray(r.worlds)) idx = r; } catch (e) { /* start fresh */ }
  if (!idx.worlds.length) {
    const id = create('My Home', null);
    const legacy = localStorage.getItem(SAVE_KEY);           // a home saved before worlds existed
    if (legacy) { try { localStorage.setItem(keyOf(id), legacy); } catch (e) { /* ignore */ } }
  }
  dedupeAll();
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
  idx.worlds.push({ id, name: uniqueName(name), created: now, played: now });
  if (data) { try { localStorage.setItem(keyOf(id), JSON.stringify(data)); } catch (e) { /* ignore */ } }
  persist(); return id;
}
export function rename(id, name) { const w = get(id); if (w) { w.name = uniqueName(name, id, w.name); persist(); } }
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
