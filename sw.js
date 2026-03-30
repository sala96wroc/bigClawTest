const CACHE_NAME = 'sundrift-cache-v4';
const FILES = ['index.html','main.js','trip.html','trip.js','detail.html','detail.js','settings.html','settings.js','manifest.json'];
self.addEventListener('install', evt=>{
  evt.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(FILES)));
  self.skipWaiting();
});
self.addEventListener('activate', evt=>{
  evt.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>{if(k!==CACHE_NAME) return caches.delete(k);}))))
  self.clients.claim();
});
self.addEventListener('fetch', evt=>{
  if(evt.request.method !== 'GET') return;
  evt.respondWith(caches.match(evt.request).then(r=>r || fetch(evt.request)));
});