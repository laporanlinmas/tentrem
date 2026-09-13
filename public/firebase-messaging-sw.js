// firebase-messaging-sw.js — Firebase Cloud Messaging Service Worker (Website Warga)
// Menangani notifikasi background agar tampil profesional di status bar HP

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// ─── Offline application cache ─────────────────────────────────────────────
// Keep the public shell and emergency contact branding available offline.
// Runtime API data is intentionally excluded so stale operational data is not
// presented as current information.
const CACHE_VERSION = 'tentrem-shell-v2';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/tentrem.txt',
  '/assets/favicon-32.png',
  '/assets/icon-192.png',
  '/assets/icon-512.png',
  '/assets/linmas.svg',
  '/assets/satpol.svg',
  '/assets/tugurejo.webp',
  '/assets/peta.jpg',
  '/assets/logo/desa.png',
  '/assets/logo/polres.png',
  '/assets/logo/kodim.png',
  '/assets/logo/damkar.png',
  '/assets/logo/psc.png',
  '/assets/logo/pusdalops.png',
  '/assets/logo/rt.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith('tentrem-') && key !== CACHE_VERSION)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

function isDynamicRequest(request, url) {
  return request.method !== 'GET'
    || url.pathname.startsWith('/api/')
    || url.hostname.includes('googleapis.com')
    || url.hostname.includes('gstatic.com')
    || url.hostname.includes('firebaseio.com')
    || url.hostname.includes('cloudinary.com')
    || url.hostname.includes('bmkg.go.id')
    || url.hostname.includes('openstreetmap.org');
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (url.origin !== self.location.origin || isDynamicRequest(request, url)) return;

  // Client-side routes all use the cached application shell when offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put('/index.html', copy));
          return response;
        })
        .catch(() => caches.match('/index.html').then((cached) => cached || caches.match('/')))
    );
    return;
  }

  // Local JS/CSS/images/fonts use cache-first for fast repeat visits.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok && response.type === 'basic') {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});

// ─── Konfigurasi Firebase ─────────────────────────────────────────────────────
const urlParams = new URLSearchParams(location.search);
const firebaseConfig = {
  apiKey:            urlParams.get('apiKey')            || "AIzaSyC4dtS_MPlvlNjiCxNJ37R0X95uIznqsnc",
  authDomain:        urlParams.get('authDomain')        || "tentrem.firebaseapp.com",
  projectId:         urlParams.get('projectId')         || "tentrem",
  storageBucket:     urlParams.get('storageBucket')     || "tentrem.firebasestorage.app",
  messagingSenderId: urlParams.get('messagingSenderId') || "536621352207",
  appId:             urlParams.get('appId')             || "1:536621352207:web:e8d15de81269e536b4aa7a",
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// ─── BACKGROUND MESSAGE HANDLER ──────────────────────────────────────────────
messaging.onBackgroundMessage((payload) => {
  console.info('[FCM SW Website] Background message received:', payload);

  const data   = payload.data || {};
  const notif  = payload.notification || {};

  const title  = notif.title || data.title || '📢 Notifikasi Linmas Tugurejo';
  const body   = notif.body  || data.body  || 'Ada informasi baru untuk Anda dari Linmas Desa Tugurejo.';
  const url    = data.url    || '/';
  const ticket = data.ticket || '';

  const tag = 'tentrem-notif-' + (ticket || Date.now());

  self.registration.showNotification(title, {
    body,
    icon:  '/assets/icon-192.png',
    badge: '/assets/icon-192.png',
    vibrate: [400, 100, 400, 100, 300],
    tag,
    renotify: true,
    requireInteraction: false,
    silent: false,
    data: { url, ticket },
    actions: [
      { action: 'open',    title: '🔍 Lihat Detail' },
      { action: 'dismiss', title: '✕ Tutup' },
    ],
  });
});

// ─── NOTIFICATION CLICK HANDLER ───────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const action       = event.action;
  const targetUrl    = notification.data?.url || '/';

  notification.close();

  if (action === 'dismiss') return;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          if (client.navigate) client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
