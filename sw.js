const CACHE_NAME = 'appshell-v1';
const PRECACHE = [
    '/ItsRaven-13.github.io-AppMoney/',
    '/ItsRaven-13.github.io-AppMoney/index.html',
    '/ItsRaven-13.github.io-AppMoney/app.js',
    '/ItsRaven-13.github.io-AppMoney/style.css',
    '/ItsRaven-13.github.io-AppMoney/manifest.json'
];

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE))
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    event.respondWith(
        caches.match(event.request).then(cached =>
            cached || fetch(event.request).then(resp => {
                if (!resp || resp.status !== 200 || resp.type !== 'basic') return resp;
                const copy = resp.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
                return resp;
            }).catch(() => caches.match('/index.html'))
        )
    );
});