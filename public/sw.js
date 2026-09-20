// JGFMusic Progressive Web App Service Worker
// Version: 2.1.0
const CACHE_NAME = 'jgfmusic-cache-v2.1';

// Critical core assets to precache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.png',
  '/favicon.png',
  '/icon.svg',
  '/apple-touch-icon.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png'
];

// Install Event: Precache static core shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('Precache partial warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Clear outdated caches and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Cache strategy tailored for lightweight offline PWA
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Do NOT intercept blob:, data:, chrome-extension:, or idb:// schemes
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // Do NOT cache range requests or large audio/media streams in SW cache
  // (User audio files are safely stored in browser IndexedDB via idb-keyval)
  if (request.headers.get('range') || request.destination === 'audio' || request.destination === 'video') {
    return;
  }

  // Navigation requests (HTML pages / client-side routes)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          // Update cached index.html in the background
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put('/index.html', responseClone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // When offline, serve cached index.html for SPA client-side routing
          const cachedIndex = await caches.match('/index.html');
          if (cachedIndex) return cachedIndex;
          const cachedRoot = await caches.match('/');
          if (cachedRoot) return cachedRoot;
          return new Response('Offline: Please connect to the internet to load JGFMusic for the first time.', {
            headers: { 'Content-Type': 'text/plain' }
          });
        })
    );
    return;
  }

  // Same-origin static assets (JS, CSS, SVGs, PNGs, fonts)
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        // Return from cache immediately if present, and update cache in background
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseToCache);
              });
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Third-party resources (e.g. web fonts, CDN icons)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => null);
    })
  );
});

// Background Schedule Timers map
let activeScheduleTimers = new Map();

// Listen for message events (e.g. manual skipWaiting or SYNC_SCHEDULES)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'SYNC_SCHEDULES') {
    const schedules = event.data.schedules || [];
    
    // Clear previous timers
    for (const timer of activeScheduleTimers.values()) {
      clearTimeout(timer);
    }
    activeScheduleTimers.clear();

    const now = Date.now();
    schedules.forEach(sched => {
      if (!sched.enabled) return;
      const targetTime = new Date(`${sched.date}T${sched.time}:00`).getTime();
      const delay = targetTime - now;

      // If scheduled within next 24 hours
      if (delay > 0 && delay < 24 * 60 * 60 * 1000) {
        const timerId = setTimeout(async () => {
          try {
            // First attempt to notify existing clients to auto-play if app is open/minimized
            const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
            let clientNotified = false;
            for (const client of clientsList) {
              client.postMessage({
                type: 'AUTO_PLAY_SCHEDULED',
                targetId: sched.targetId,
                targetType: sched.type,
                title: sched.title
              });
              clientNotified = true;
            }

            // Always show high-priority system alarm notification with audio chime & action buttons
            // This ensures it rings and wakes the phone even when closed or standing
            await self.registration.showNotification(`⏰ ALARM: ${sched.title}`, {
              body: `Oras na ng kanta! ${clientNotified ? 'Kasalukuyang nagpe-play na!' : 'I-tap para mag-play agad.'}`,
              icon: '/icon.svg',
              badge: '/icon.svg',
              tag: `sched_alarm_${sched.id}`,
              renotify: true,
              requireInteraction: true,
              vibrate: [300, 100, 300, 100, 400],
              actions: [
                { action: 'play', title: '▶ PLAY AGAD' },
                { action: 'dismiss', title: '✖ DISMISS' }
              ],
              data: {
                targetId: sched.targetId,
                type: sched.type,
                title: sched.title,
                url: `/?playSchedule=${sched.targetId}&type=${sched.type}`
              }
            });
          } catch (err) {
            console.error('Failed to trigger SW alarm notification:', err);
          }
        }, delay);

        activeScheduleTimers.set(sched.id, timerId);
      }
    });
  }
});

// Notification click event: focus or open app and auto-play song
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  const data = event.notification.data || {};
  const targetUrl = data.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.postMessage({
            type: 'AUTO_PLAY_SCHEDULED',
            targetId: data.targetId,
            targetType: data.type,
            title: data.title
          });
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

