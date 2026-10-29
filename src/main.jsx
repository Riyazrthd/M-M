import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// PWA Service Worker Registration with relative path & auto-update
if ('serviceWorker' in navigator && process.env.NODE_ENV !== 'development') {
  window.addEventListener('load', () => {
    // Resolve relative path for GitHub Pages compatibility
    const swPath = './sw.js';
    navigator.serviceWorker.register(swPath)
      .then((reg) => {
        console.log('[IFS AMC PWA] Service worker registered. Scope:', reg.scope);
        // Force check for updates on each launch
        reg.update().catch(() => {});
      })
      .catch((err) => {
        console.warn('[IFS AMC PWA] Service worker registration notice:', err);
      });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
