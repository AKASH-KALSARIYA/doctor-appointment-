const CACHE_NAME = 'ruralcare-v2';
const urlsToCache = [
    '/',
    '/index.html',
    '/admin.html',
    '/doctor.html',
    '/booking.html',
    '/confirmation.html',
    '/style.css',
    '/firebase.js',
    '/app.js',
    '/admin.js',
    '/doctor.js',
    '/booking.js',
    '/confirmation.js',
    '/doctors-data.js',
    '/notification.js',
    '/analytics.js',
    '/offline.js',
    '/accessibility.js',
    'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js',
    'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js',
    'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js',
    'https://fonts.googleapis.com/css2?family=Segoe+UI:wght@400;600;700&display=swap'
];

// Install Service Worker
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate Service Worker
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch Event - Cache First, Network Fallback
self.addEventListener('fetch', event => {
    // Skip non-GET requests and Firebase requests
    if (event.request.method !== 'GET' || 
        event.request.url.includes('firebase') ||
        event.request.url.includes('googleapis')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Return cached response if found
                if (response) {
                    return response;
                }

                // Clone the request
                const fetchRequest = event.request.clone();

                // Make network request
                return fetch(fetchRequest)
                    .then(response => {
                        // Check if valid response
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Clone the response
                        const responseToCache = response.clone();

                        // Open cache and store response
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    })
                    .catch(() => {
                        // If offline and not in cache, return offline page
                        if (event.request.mode === 'navigate') {
                            return caches.match('/index.html');
                        }
                        
                        // For other requests, return a fallback
                        return new Response('Offline. Please check your connection.', {
                            status: 503,
                            statusText: 'Service Unavailable',
                            headers: new Headers({
                                'Content-Type': 'text/plain'
                            })
                        });
                    });
            })
    );
});

// Background Sync for offline data
self.addEventListener('sync', event => {
    if (event.tag === 'sync-appointments') {
        event.waitUntil(syncAppointments());
    } else if (event.tag === 'sync-notifications') {
        event.waitUntil(syncNotifications());
    }
});

// Sync appointments when back online
async function syncAppointments() {
    console.log('Background sync: Syncing appointments...');
    
    try {
        // Get pending appointments from IndexedDB
        const db = await openIndexedDB();
        const appointments = await getAllFromStore(db, 'pending_actions');
        
        for (const appointment of appointments) {
            if (appointment.type === 'appointment' && appointment.status === 'pending') {
                await syncAppointmentToServer(appointment);
            }
        }
        
        console.log('Background sync completed');
    } catch (error) {
        console.error('Background sync error:', error);
    }
}

// Sync notifications when back online
async function syncNotifications() {
    console.log('Background sync: Syncing notifications...');
    
    try {
        // Get pending notifications
        const notifications = JSON.parse(localStorage.getItem('notificationQueue') || '[]');
        const pending = notifications.filter(n => n.status === 'pending');
        
        for (const notification of pending) {
            await processNotification(notification);
        }
        
        console.log('Notification sync completed');
    } catch (error) {
        console.error('Notification sync error:', error);
    }
}

// Helper function to open IndexedDB
function openIndexedDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('ruralcare_offline', 1);
        
        request.onsuccess = (event) => {
            resolve(event.target.result);
        };
        
        request.onerror = (event) => {
            reject('Failed to open IndexedDB');
        };
    });
}

// Helper function to get all items from a store
function getAllFromStore(db, storeName) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        
        request.onsuccess = (event) => {
            resolve(event.target.result);
        };
        
        request.onerror = (event) => {
            reject('Failed to get items from store');
        };
    });
}

// Simulated sync function
async function syncAppointmentToServer(appointment) {
    // In production, this would make an actual API call
    console.log('Syncing appointment:', appointment.data.bookingId);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate success
    return { success: true };
}

// Simulated notification processing
async function processNotification(notification) {
    console.log('Processing notification:', notification.id);
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true };
}

// Push Notification Support
self.addEventListener('push', event => {
    const data = event.data ? event.data.json() : {};
    
    const options = {
        body: data.body || 'New update from RuralCare',
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        vibrate: [200, 100, 200],
        data: {
            url: data.url || '/'
        },
        actions: [
            {
                action: 'view',
                title: 'View'
            },
            {
                action: 'close',
                title: 'Close'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title || 'RuralCare', options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    if (event.action === 'close') {
        return;
    }
    
    event.waitUntil(
        clients.matchAll({ type: 'window' })
            .then(clientList => {
                // If a window is already open, focus it
                for (const client of clientList) {
                    if (client.url === event.notification.data.url && 'focus' in client) {
                        return client.focus();
                    }
                }
                
                // Otherwise open a new window
                if (clients.openWindow) {
                    return clients.openWindow(event.notification.data.url);
                }
            })
    );
});

// Periodic sync (requires periodic-background-sync permission)
if ('periodicSync' in self.registration) {
    self.addEventListener('periodicsync', event => {
        if (event.tag === 'update-cache') {
            event.waitUntil(updateCache());
        }
    });
}

// Update cache periodically
async function updateCache() {
    console.log('Periodic cache update started');
    
    const cache = await caches.open(CACHE_NAME);
    
    for (const url of urlsToCache) {
        try {
            const response = await fetch(url);
            if (response.ok) {
                await cache.put(url, response);
                console.log('Updated cache for:', url);
            }
        } catch (error) {
            console.error('Failed to update cache for', url, error);
        }
    }
    
    console.log('Periodic cache update completed');
}