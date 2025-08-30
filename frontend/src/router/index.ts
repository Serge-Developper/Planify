import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import EmploiDuTemps from '../components/EmploiDuTemps.vue'
import AboutView from '../views/AboutView.vue'
import LoginView from '../views/LoginView.vue'
import AdminDashboard from '@/components/AdminDashboard.vue';
import ContactView from '../views/ContactView.vue'
import { useAuthStore } from '../stores/auth';
import { storeToRefs } from 'pinia';
import { getActivePinia, setActivePinia, createPinia } from 'pinia';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/devoirs',
      name: 'devoirs',
      component: EmploiDuTemps,
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: AboutView
    },
    // Route login supprimée
    {
      path: '/admin',
      name: 'admin',
      component: AdminDashboard
    },
    {
      path: '/contact',
      name: 'contact',
      component: ContactView
    }
  ],
})

// Ajout du guard de navigation pour la route admin
router.beforeEach((to, from, next) => {
  // Initialisation de Pinia si nécessaire
  if (!getActivePinia()) {
    setActivePinia(createPinia());
  }
  const authStore = useAuthStore();
  if (to.path === '/admin') {
    if (!authStore.user || authStore.user.role !== 'admin') {
      // Redirige vers la page d'accueil si l'utilisateur n'est pas admin
      return next('/');
    }
  }
  next();
});

export default router
