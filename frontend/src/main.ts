import './assets/main.css'
import axios from 'axios'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

axios.defaults.baseURL = 'https://150c-88-166-249-67.ngrok-free.app'
axios.defaults.headers.common['ngrok-skip-browser-warning'] = 'true'

// Intercepteur pour ajouter le token JWT à chaque requête
axios.interceptors.request.use(config => {
  const user = localStorage.getItem('user');
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

app.mount('#app')
