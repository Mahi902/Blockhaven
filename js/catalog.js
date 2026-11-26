// Blockhaven - furniture catalog. Every folder in /furniture/ is a piece; its colour SVGs are its variations.
// Folder listing comes from furniture/index.json (rebuilt by tools/build_index.py / the GitHub Action),
// with the GitHub contents API as a fallback so a newly pushed folder is still found.
import { TILE, REPO, COLOR_NAMES } from './config.js';

export const catalog = new Map();
export const order = { furniture: [], structure: [], npc: [] };
const BASE = new URL('../furniture/', import.meta.url).href;
const images = new Map(), fnCache = new Map();

const parseInfo = txt => Object.fromEntries(txt.split(/\r?\n/).map(l => l.match(/^\s*(\w+)\s*=\s*(.*)$/)).filter(Boolean).map(m => [m[1].toLowerCase(), m[2].trim()]));

async function listFolders() {
  try {
    const r = await fetch(`${BASE}index.json`, { cache: 'no-cache' });
    if (r.ok) return await r.json();
  } catch (e) { /* fall through to the API */ }
  const api = p => fetch(`https://api.github.com/repos/${REPO}/contents/${p}`).then(r => r.json());
  const out = {};
  const dirs = (await api('furniture')).filter(f => f.type === 'dir');
  await Promise.all(dirs.map(async d => { out[d.name] = (await api(`furniture/${d.name}`)).map(f => f.name); }));
  return out;
}

async function loadOne(id, files) {
  const info = parseInfo(await (await fetch(`${BASE}${encodeURIComponent(id)}/info.txt`)).text());
  const colors = files.filter(f => f.toLowerCase().endsWith('.svg')).map(f => f.slice(0, -4).toLowerCase())
    .sort((a, b) => (COLOR_NAMES.indexOf(a) + 99) % 99 - (COLOR_NAMES.indexOf(b) + 99) % 99);
  if (!colors.length) return;
  const block = Number(info.block) || 0;
  const svg = await (await fetch(`${BASE}${encodeURIComponent(id)}/${encodeURIComponent(colors[0])}.svg`)).text();
  const vb = (svg.match(/viewBox="[\d.\-]+\s+[\d.\-]+\s+([\d.]+)\s+([\d.]+)"/) || []).slice(1).map(Number);
  const spriteW = vb[0] || TILE * Math.max(1, block), spriteH = vb[1] || TILE;
  const edge = block === 0;
  const def = {
    id, name: info.name || id, description: info.description || '', block, tip: info.function || '',
    edge, npc: !edge && info.npc === '1', colors, spriteW, spriteH,
    w: Math.max(1, Math.round(spriteW / TILE)), h: Math.max(1, Math.round(spriteH / TILE)),
    hasFunction: files.includes('function.js') && !!info.function,
  };
  catalog.set(id, def);
}

export async function loadCatalog() {
  const folders = await listFolders();
  await Promise.all(Object.entries(folders).map(([id, files]) => loadOne(id, files).catch(e => console.warn('[catalog] skipped', id, e))));
  const sorted = [...catalog.values()].sort((a, b) => a.name.localeCompare(b.name));
  order.furniture = sorted.filter(d => !d.edge && !d.npc).map(d => d.id);
  order.npc = sorted.filter(d => d.npc).map(d => d.id);
  order.structure = sorted.filter(d => d.edge).map(d => d.id);
  return catalog;
}

const colorOf = (d, c) => (d.colors.includes(c) ? c : d.colors[0]);
export const previewUrl = (d, color) => `${BASE}${encodeURIComponent(d.id)}/${encodeURIComponent(colorOf(d, color))}.svg`;

/** The loaded sprite, or null while it is still loading (the render loop just tries again next frame). */
export function getImage(d, color) {
  const url = previewUrl(d, color);
  let rec = images.get(url);
  if (!rec) { const img = new Image(); rec = { img, ok: false }; img.onload = () => { rec.ok = true; }; img.src = url; images.set(url, rec); }
  return rec.ok ? rec.img : null;
}

export function getFunction(def) {
  if (!fnCache.has(def.id)) fnCache.set(def.id, import(`${BASE}${encodeURIComponent(def.id)}/function.js`).catch(e => { console.error('[function.js]', def.id, e); return null; }));
  return fnCache.get(def.id);
}
