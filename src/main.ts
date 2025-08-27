import './assets/main.css'
import axios from 'axios'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { useSubjectsStore } from './stores/subjects'

import '@fortawesome/fontawesome-free/css/all.min.css';

// Désactiver console.log en production (garde console.error, warn, etc.)
if (import.meta.env && (import.meta.env.PROD || import.meta.env.MODE === 'production')) {
  // eslint-disable-next-line no-console
  console.log = () => {};
}

// Intercepteur pour ajouter le token JWT à chaque requête
axios.interceptors.request.use(config => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const user = localStorage.getItem('user');
      if (user) {
        const parsed = JSON.parse(user);
        if (parsed?.token) {
          config.headers.Authorization = `Bearer ${parsed.token}`;
        }
      }
    }
  } catch (error) {
    console.error('Erreur lors de la configuration du token:', error);
  }
  return config;
}, error => {
  return Promise.reject(error);
});

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Initialiser les matières au démarrage de l'application
const subjectsStore = useSubjectsStore()
subjectsStore.initializeStore().catch(error => {
  console.warn('Erreur lors de l\'initialisation des matières:', error);
})

app.mount('#app')
