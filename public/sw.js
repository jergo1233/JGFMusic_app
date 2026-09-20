// JGFMusic Progressive Web App Service Worker
// Version: 2.2.0 (Automatic Cache Invalidation & Network-First for App Shell)
const CACHE_NAME = 'jgfmusic-cache-v2.2.0';

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

// Helper to compute next trigger time in Service Worker
function getSWNextTrigger(sched, now = Date.now()) {
  if (sched.nextTriggerTimestamp && sched.nextTriggerTimestamp > now) {
    return sched.nextTriggerTimestamp;
  }
  const nowDate = new Date(now);
  const [h, m] = (sched.time || '00:00').split(':').map(Number);

  if (sched.repeat === 'daily') {
    let target = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate(), h, m, 0, 0);
    if (target.getTime() <= now) {
      target.setDate(target.getDate() + 1);
    }
    return target.getTime();
  }

  if (sched.repeat === 'weekdays') {
    let target = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate(), h, m, 0, 0);
    if (target.getTime() <= now) {
      target.setDate(target.getDate() + 1);
    }
    while (target.getDay() === 0 || target.getDay() === 6) {
      target.setDate(target.getDate() + 1);
    }
    return target.getTime();
  }

  // Once or default:
  if (sched.date) {
    const parts = sched.date.split('-').map(Number);
    let target = new Date(parts[0], parts[1] - 1, parts[2], h, m, 0, 0);
    if (target.getTime() <= now && (sched.autoRenew || sched.reusable)) {
      let nextTarget = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate(), h, m, 0, 0);
      if (nextTarget.getTime() <= now) {
        nextTarget.setDate(nextTarget.getDate() + 1);
      }
      return nextTarget.getTime();
    }
    return target.getTime();
  }

  let defaultTarget = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate(), h, m, 0, 0);
  if (defaultTarget.getTime() <= now) {
    defaultTarget.setDate(defaultTarget.getDate() + 1);
  }
  return defaultTarget.getTime();
}

// Background Schedule Timers map
let activeScheduleTimers = new Map();

function scheduleSWTimer(sched) {
  if (!sched || !sched.enabled) return;

  const now = Date.now();
  const targetTime = getSWNextTrigger(sched, now);
  const delay = targetTime - now;

  // Clear existing timer if any
  if (activeScheduleTimers.has(sched.id)) {
    clearTimeout(activeScheduleTimers.get(sched.id));
    activeScheduleTimers.delete(sched.id);
  }

  // Schedule within next 48 hours
  if (delay > 0 && delay < 48 * 60 * 60 * 1000) {
    const timerId = setTimeout(async () => {
      try {
        // Attempt to notify active clients to play immediately
        const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        let clientNotified = false;
        for (const client of clientsList) {
          client.postMessage({
            type: 'AUTO_PLAY_SCHEDULED',
            targetId: sched.targetId,
            targetType: sched.type,
            title: sched.title,
            repeat: sched.repeat,
            scheduleId: sched.id
          });
          clientNotified = true;
        }

        // Show loud interactive alarm notification on Lock Screen
        await self.registration.showNotification(`⏰ ALARM: ${sched.title}`, {
          body: `Scheduled music is playing! ${clientNotified ? 'Now playing in background.' : 'Tap to start playback.'}`,
          icon: '/icon.svg',
          badge: '/icon.svg',
          tag: `sched_alarm_${sched.id}`,
          renotify: true,
          requireInteraction: true,
          vibrate: [500, 200, 500, 200, 800, 300, 1000],
          actions: [
            { action: 'play', title: '▶ PLAY NOW ✅' },
            { action: 'dismiss', title: '✖ DISMISS' }
          ],
          data: {
            targetId: sched.targetId,
            type: sched.type,
            title: sched.title,
            repeat: sched.repeat,
            scheduleId: sched.id,
            url: `/?playSchedule=${sched.targetId}&type=${sched.type}&alarm=true`
          }
        });

        // If this schedule is recurring (Daily or Weekdays), automatically re-arm for next occurrence!
        if (sched.repeat === 'daily' || sched.repeat === 'weekdays' || sched.autoRenew) {
          scheduleSWTimer(sched);
        }
      } catch (err) {
        console.error('Failed to trigger SW alarm notification:', err);
      }
    }, delay);

    activeScheduleTimers.set(sched.id, timerId);
  }
}

// Listen for message events (e.g. manual skipWaiting, CLEAR_CACHE, or SYNC_SCHEDULES)
self.addEventListener('message', async (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      console.log('Service Worker caches cleared.');
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ success: true });
      }
    } catch (err) {
      console.error('Failed to clear caches:', err);
    }
  }

  if (event.data && event.data.type === 'SYNC_SCHEDULES') {
    const schedules = event.data.schedules || [];
    
    // Clear previous timers
    for (const timer of activeScheduleTimers.values()) {
      clearTimeout(timer);
    }
    activeScheduleTimers.clear();

    schedules.forEach(sched => {
      scheduleSWTimer(sched);
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

