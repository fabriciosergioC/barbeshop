/* ============================================================
   sw.js — Service Worker (PWA)
   Estratégia: network-first para páginas, cache-first para
   assets estáticos. Sempre bump versão ao alterar assets.
   ============================================================ */

const CACHE = "barbearia-v8";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./assets/css/tokens.css",
  "./assets/css/base.css",
  "./assets/css/components.css",
  "./assets/js/core/businessConfig.js",
  "./assets/js/core/demoData.js",
  "./assets/js/core/availability.js",
  "./assets/js/core/api.js",
  "./assets/js/icons/icons.js",
  "./assets/js/utils/helpers.js",
  "./assets/js/sections/services.js",
  "./assets/js/sections/gallery.js",
  "./assets/js/sections/team.js",
  "./assets/js/sections/faq.js",
  "./assets/js/components/booking-wizard.js",
  "./assets/js/components/ui.js",
  "./assets/js/main.js",
  "./assets/img/icons/icon.svg"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;

  // Navegações: rede primeiro, cache como fallback (offline)
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request).catch(() => caches.match("./index.html"))
    );
    return;
  }

  // Same-origin assets: cache primeiro, atualiza em background
  if (url.origin === location.origin) {
    e.respondWith(
      caches.match(e.request).then((cached) => {
        const network = fetch(e.request)
          .then((res) => {
            if (res.ok) caches.open(CACHE).then((c) => c.put(e.request, res.clone()));
            return res;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
  }
});
