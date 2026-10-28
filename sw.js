/* Neon Bubble – service worker (çevrimdışı çalışma) */
const VER = 'nb-v2';
const CORE = ['./', './index.html', './manifest.webmanifest', './logo.png', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(VER)
      .then(c => Promise.all(CORE.map(u => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== VER).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; /* reklam vb. dış istekler olduğu gibi gider */

  /* Sayfa: önce ağ (güncel sürüm), ağ yoksa önbellek */
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(r => {
        const copy = r.clone();
        caches.open(VER).then(c => c.put('./index.html', copy)).catch(() => {});
        return r;
      }).catch(() => caches.match('./index.html', { ignoreSearch: true }))
    );
    return;
  }

  /* Diğer dosyalar: önbellekten hemen ver, arkada güncelle */
  e.respondWith(
    caches.match(req).then(hit => {
      const net = fetch(req).then(r => {
        if (r && r.ok) { const copy = r.clone(); caches.open(VER).then(c => c.put(req, copy)).catch(() => {}); }
        return r;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
