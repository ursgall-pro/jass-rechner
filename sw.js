'use strict';
// Startet sofort aus dem Cache und holt im Hintergrund die neuste Version fuer den naechsten Start.
const CACHE = 'jass-rechner-v8';
const DATEIEN = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png', './icon-maskable-512.png'];

self.addEventListener('install', (ev) => {
  ev.waitUntil(caches.open(CACHE).then((c) => c.addAll(DATEIEN)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (ev) => {
  ev.waitUntil(
    caches.keys()
      .then((namen) => Promise.all(namen.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (ev) => {
  const req = ev.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const netz = fetch(req).then((res) => {
    if (res.ok) {
      const kopie = res.clone();
      caches.open(CACHE).then((c) => c.put(req, kopie));
    }
    return res;
  });
  ev.waitUntil(netz.catch(() => {}));
  ev.respondWith(
    caches.match(req, { ignoreSearch: true }).then((treffer) => {
      if (treffer) return treffer;
      return netz.catch(() => (req.mode === 'navigate' ? caches.match('./index.html') : Response.error()));
    })
  );
});