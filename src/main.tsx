import React from 'react';
import ReactDOM from 'react-dom/client';
import HomePage from '@/app/page';
import '@/styles/landing.css';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/firebase-messaging-sw.js').catch((error) => {
      console.warn('[TENTREM] Offline cache unavailable:', error);
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HomePage />
  </React.StrictMode>
);
