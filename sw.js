// Blockhaven service worker: network first (so updates arrive), with a cached copy for offline play.
const CACHE = 'blockhaven-' + (new URL(self.location).searchParams.get('v') || '0');
const CORE = ['./', 'index.html', 'play.html', 'manifest.webmanifest', 'css/game.css', 'img/logo.svg', 'img/pwa/icon-192.png', 'img/pwa/icon-512.png', 'furniture/index.json'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => Promise.all(CORE.map(u => c.add(u).catch(() => null)))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k.startsWith('blockhaven-')).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET' || !r.url.startsWith('http')) return;
  const same = new URL(r.url).origin === self.location.origin;
  e.respondWith(fetch(r).then(res => { if (res && res.ok && (same || res.type === 'cors')) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); } return res; })
    .catch(() => caches.match(r, { ignoreSearch: false }).then(m => m || caches.match(r, { ignoreSearch: true }))));
});
