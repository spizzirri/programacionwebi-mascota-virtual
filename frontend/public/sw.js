const CACHE_NAME = 'mascota-virtual-v2';
const PRECACHE_ASSETS = [
    '/logo.svg',
    '/manifest.json'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(PRECACHE_ASSETS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const request = event.request;

    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .catch(() => caches.match(request))
                .then((response) => response || caches.match('/'))
        );
        return;
    }

    event.respondWith(
        caches.match(request).then((cached) => {
            if (cached) return cached;

            return fetch(request).then((response) => {
                if (response.ok && request.url.match(/\.(js|css|svg|png|jpg|webp|woff2?)$/)) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                }
                return response;
            });
        })
    );
});

self.addEventListener('widgetinstall', (event) => {
    event.waitUntil(updateWidget(event.widget));
});

self.addEventListener('widgetresume', (event) => {
    event.waitUntil(updateWidget(event.widget));
});

self.addEventListener('widgetclick', (event) => {
    if (event.action === 'openApp') {
        event.waitUntil(self.clients.openWindow('/'));
    }
});

async function updateWidget(widget) {
    const streak = await getStoredStreak();

    await self.widgets.updateByTag('streak-widget', {
        template: 'streak-template',
        data: { streak }
    });
}

async function getStoredStreak() {
    return 0;
}
