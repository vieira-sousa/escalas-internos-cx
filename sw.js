// Aumenta a versão (v3, v4...) sempre que fizeres grandes alterações estruturais
const CACHE_NAME = 'ulssj-escalas-v3';
const ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  // Força o novo Service Worker a ativar-se de imediato sem esperar que as abas fechem
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  // Apaga imediatamente todas as caches antigas
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // 1. Dados do Sheets e Apps Script passam SEMPRE direto pela rede
  if (
    event.request.method !== 'GET' ||
    url.includes('docs.google.com') ||
    url.includes('script.google.com')
  ) {
    return;
  }
  
  function handleDateFilter() {
  const selectedDate = document.getElementById("date-filter").value; // ex: 2026-10-12
  searchQuery = selectedDate.toLowerCase();
  document.getElementById("search-input").value = ""; // Limpa a pesquisa de texto
  renderView();
}

  // 2. Estratégia Network First: tenta sempre a versão mais recente online.
  // Se estiver sem net (offline), usa a cópia guardada na cache.
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const resClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
        }
        return networkResponse;
      })
      .catch(() => caches.match(event.request))
  );
});