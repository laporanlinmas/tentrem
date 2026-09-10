// firebase-messaging-sw.js — Firebase Cloud Messaging Service Worker (Website Warga)
// Menangani notifikasi background agar tampil profesional di status bar HP

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

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
