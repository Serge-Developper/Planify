import { defineStore } from 'pinia';
import { getValidAuthToken } from '@/api';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: ((): any => {
      try { return localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : (sessionStorage.getItem('user') ? JSON.parse(sessionStorage.getItem('user')!) : null) } catch { return null }
    })(),
  }),
  getters: {
    isLoggedIn: (state) => !!state.user,
    isAdmin: (state) => state.user && state.user.role === 'admin',
    token: (state) => state.user?.token || null,
  },
  actions: {
    rehydrateFromStorage() {
      try {
        const rawLocal = localStorage.getItem('user');
        const rawSession = sessionStorage.getItem('user');
        const raw = rawLocal || rawSession;
        this.user = raw ? JSON.parse(raw) : null;
      } catch { this.user = null; }
    },
    initCrossTabSync() {
      try {
        window.addEventListener('storage', (e) => {
          if (e.key === 'user') {
            this.rehydrateFromStorage();
          }
        });
        // Event personnalisé déclenché par secureApiCall sur 401
        window.addEventListener('auth-logout', () => {
          this.logout();
        });
      } catch {}
    },
    ensureValidSession() {
      try {
        const token = getValidAuthToken();
        if (!token) {
          this.logout();
        }
      } catch {}
    },
    login(user: any, rememberMe: boolean = true) {
      // Préserver le token si l'objet fourni ne l'a pas (ex: réponses d'API partielles)
      const prev = this.user as any;
      const tokenToKeep = user?.token ?? prev?.token ?? null;

      const mergedUser = { ...(prev || {}), ...(user || {}) };
      if (tokenToKeep) mergedUser.token = tokenToKeep;

      this.user = mergedUser;

      try {
        // Nettoyer ancien stockage
        localStorage.removeItem('user');
        sessionStorage.removeItem('user');
      } catch {}
      try {
        (rememberMe ? localStorage : sessionStorage).setItem('user', JSON.stringify(this.user));
      } catch {}
    },
    logout() {
      this.user = null;
      localStorage.removeItem('user');
      sessionStorage.removeItem('user');
      localStorage.removeItem('token');
    },
  },
});