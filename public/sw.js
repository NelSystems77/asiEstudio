// Service Worker. El id de build se inyecta al compilar (ver vite.config.ts) para purgar cachés viejas.
const CACHE = 'asiestudio-__BUILD_ID__';
const scope = self.registration.scope; // funciona bajo cualquier base path (p. ej. /asiEstudio/)
const SHELL = ['', 'index.html', 'manifest.webmanifest', 'icon.svg', 'icon-192.png'].map((p) => new URL(p, scope).href);

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin || !req.url.startsWith(scope)) return;

  // Navegación: red primero (así se recibe la versión nueva), caché si no hay conexión.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(new URL('index.html', scope).href, copy)); return res; })
        .catch(() => caches.match(new URL('index.html', scope).href)),
    );
    return;
  }
  // Recursos (con hash en el nombre): caché primero.
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    })),
  );
});
