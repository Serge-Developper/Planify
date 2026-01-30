import './assets/main.css'
import axios from 'axios'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import '@fortawesome/fontawesome-free/css/all.min.css';

// Désactiver console.log en production (garde console.error, warn, etc.)
if (import.meta.env && (import.meta.env.PROD || import.meta.env.MODE === 'production')) {
  // eslint-disable-next-line no-console
  console.log = () => {};
}

// Intercepteur pour ajouter le token JWT à chaque requête
axios.interceptors.request.use(config => {
  const user = localStorage.getItem('user') || sessionStorage.getItem('user');
  if (user) {
    const token = JSON.parse(user).token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
}, error => {
  return Promise.reject(error);
});

const app = createApp(App)

app.use(createPinia())
app.use(router)

try {
    const userRaw = localStorage.getItem('user') || sessionStorage.getItem('user');
    const userObj = userRaw ? JSON.parse(userRaw) : null;
    const saved = (userObj && userObj.theme) || localStorage.getItem('theme');
    const initial = saved || 'light';
    const applied = initial === 'auto'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : initial;
    document.documentElement.setAttribute('data-theme', applied);
} catch {}
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const swUrl = `${import.meta.env.BASE_URL}sw.js`;
      const registration = await navigator.serviceWorker.register(swUrl);
      console.log('Service Worker registered with scope:', registration.scope);
    } catch (e) {
      console.error('Service Worker registration failed:', e);
    }
  });
}
app.mount('#app')
