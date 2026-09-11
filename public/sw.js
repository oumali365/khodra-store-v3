// ============================================================
// ملف: sw.js – Service Worker لتطبيق خُضرة
// ============================================================

const CACHE_NAME = 'khodra-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/site.webmanifest',
  '/favicon.ico',
  '/favicon-96x96.png',
  '/favicon.svg',
  '/apple-touch-icon.png',
  '/web-app-manifest-192x192.png',
  '/web-app-manifest-512x512.png'
];

// ─── تثبيت Service Worker ───
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('✅ تم تخزين الملفات في الكاش');
        return cache.addAll(ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// ─── تفعيل Service Worker ───
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('🗑️ حذف الكاش القديم:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// ─── اعتراض الطلبات ───
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request)
          .then((response) => {
            // تخزين الملفات الجديدة
            if (event.request.url.includes('/icons/') || 
                event.request.url.includes('/web-app-manifest-')) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseClone);
              });
            }
            return response;
          });
      })
      .catch(() => {
        return caches.match('/');
      })
  );
});

// ─── إرسال إشعارات ───
self.addEventListener('push', (event) => {
  const data = event.data.json();
  const options = {
    body: data.body || 'عروض جديدة في متجر خُضرة!',
    icon: '/web-app-manifest-192x192.png',
    badge: '/favicon-96x96.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'خُضرة', options)
  );
});

// ─── فتح التطبيق عند النقر على الإشعار ───
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});