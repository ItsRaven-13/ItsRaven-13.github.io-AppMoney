importScripts("https://cdn.pushalert.co/sw-86305.js");

const CACHE_NAME = 'appshell-v1.2';
const PRECACHE = [
    '/ItsRaven-13.github.io-AppMoney/',
    '/ItsRaven-13.github.io-AppMoney/index.html',
    '/ItsRaven-13.github.io-AppMoney/app.js',
    '/ItsRaven-13.github.io-AppMoney/style.css',
    '/ItsRaven-13.github.io-AppMoney/manifest.json'
];

// Configuración de notificaciones
const NOTIFICATION_ICON = '/ItsRaven-13.github.io-AppMoney/icons/icon-192x192.png';
const NOTIFICATION_BADGE = '/ItsRaven-13.github.io-AppMoney/icons/icon-72x72.png';

self.addEventListener('install', (event) => {
    console.log('Service Worker instalado');
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(PRECACHE))
            .then(() => console.log('Recursos precacheados'))
    );
});

self.addEventListener('activate', (event) => {
    console.log('Service Worker activado');
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.filter(k => k !== CACHE_NAME)
                    .map(k => {
                        console.log('Eliminando cache viejo:', k);
                        return caches.delete(k);
                    })
            )
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request).then(cached => {
            // Intentar con la red primero, luego cache
            return fetch(event.request)
                .then(networkResponse => {
                    // Cachear respuesta válida
                    if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                        const responseClone = networkResponse.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => cache.put(event.request, responseClone));
                    }
                    return networkResponse;
                })
                .catch(() => {
                    // Fallback a cache
                    return cached || caches.match('/ItsRaven-13.github.io-AppMoney/index.html');
                });
        })
    );
});

// ================= NOTIFICACIONES PUSH =================

self.addEventListener('push', (event) => {
    console.log('Evento push recibido:', event);

    if (!event.data) return;

    let data = {};
    try {
        data = event.data.json();
    } catch (e) {
        data = {
            title: 'Mensaje nuevo',
            body: event.data.text() || 'Tienes una nueva notificación',
            icon: NOTIFICATION_ICON
        };
    }

    const options = {
        body: data.body || 'Actualización de divisas',
        icon: data.icon || NOTIFICATION_ICON,
        badge: NOTIFICATION_BADGE,
        image: data.image,
        data: data.data || { url: data.url || '/' },
        actions: data.actions || [
            {
                action: 'open',
                title: 'Abrir app',
                icon: '/ItsRaven-13.github.io-AppMoney/icons/icon-72x72.png'
            },
            {
                action: 'close',
                title: 'Cerrar',
                icon: '/ItsRaven-13.github.io-AppMoney/icons/icon-72x72.png'
            }
        ],
        requireInteraction: data.requireInteraction || false,
        tag: data.tag || 'currency-notification',
        renotify: data.renotify || true,
        vibrate: [100, 50, 100],
        timestamp: Date.now()
    };

    event.waitUntil(
        self.registration.showNotification(
            data.title || 'AppMoney - Divisas',
            options
        )
    );
});

self.addEventListener('notificationclick', (event) => {
    console.log('Notificación clickeada:', event.notification.tag);
    event.notification.close();

    const urlToOpen = event.notification.data.url || '/ItsRaven-13.github.io-AppMoney/';

    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then(windowClients => {
            // Buscar si ya hay una ventana abierta
            for (let client of windowClients) {
                if (client.url.includes(urlToOpen) && 'focus' in client) {
                    return client.focus();
                }
            }

            // Abrir nueva ventana si no existe
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

self.addEventListener('notificationclose', (event) => {
    console.log('Notificación cerrada:', event.notification.tag);
});

// ================= SINCRONIZACIÓN EN SEGUNDO PLANO =================

self.addEventListener('sync', (event) => {
    console.log('Sincronización en background:', event.tag);

    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

async function doBackgroundSync() {
    // Aquí puedes implementar sincronización en segundo plano
    // Por ejemplo, obtener tasas de cambio actualizadas
    console.log('Ejecutando sincronización en background...');

    // Ejemplo: Enviar notificación de tasas actualizadas
    self.registration.showNotification('Tasas Actualizadas', {
        body: 'Las tasas de cambio se han actualizado en segundo plano',
        icon: NOTIFICATION_ICON,
        badge: NOTIFICATION_BADGE,
        tag: 'background-sync'
    });
}

// ================= MENSAJES DEL CLIENTE =================

self.addEventListener('message', (event) => {
    console.log('Mensaje recibido del cliente:', event.data);

    switch (event.data.type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;

        case 'SEND_NOTIFICATION':
            const { title, body, data } = event.data;
            self.registration.showNotification(title, {
                body,
                icon: NOTIFICATION_ICON,
                badge: NOTIFICATION_BADGE,
                data: data || {}
            });
            break;

        case 'GET_SUBSCRIPTION':
            // Responder con información de suscripción
            event.ports[0].postMessage({
                type: 'SUBSCRIPTION_INFO',
                subscribed: true
            });
            break;
    }
});

// ================= UTILIDADES =================

// Función para enviar notificación programada
function scheduleNotification(title, body, delay = 5000) {
    setTimeout(() => {
        self.registration.showNotification(title, {
            body,
            icon: NOTIFICATION_ICON,
            badge: NOTIFICATION_BADGE,
            tag: 'scheduled-notification'
        });
    }, delay);
}

// Función para notificar a todos los clients
function notifyClients(message) {
    clients.matchAll().then(allClients => {
        allClients.forEach(client => {
            client.postMessage(message);
        });
    });
}