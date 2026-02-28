const CACHE_NAME = 'mascota-virtual-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/src/styles.css',
    '/logo.svg',
    '/manifest.json'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});

// PWA Widget logic
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
    // In a real scenario, we might fetch the latest streak from an API or sync with the app
    // For now, we rely on the app sending updates via the widget API
    const streak = await getStoredStreak();

    await self.widgets.updateByTag('streak-widget', {
        template: 'streak-template',
        data: { streak }
    });
}

async function getStoredStreak() {
    // This could be from IndexedDB or similar
    return 0;
}
