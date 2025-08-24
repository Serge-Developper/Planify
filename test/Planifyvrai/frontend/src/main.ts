import './assets/main.css'
import axios from 'axios'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import '@fortawesome/fontawesome-free/css/all.min.css';

// Configuration de l'URL de base pour Axios
axios.defaults.baseURL = 'https://api.planify.tovmassian.but24.tovmassian.but24.mmi-nancy.fr'

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
