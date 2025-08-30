import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
  state: () => {
    let user = null;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem('user');
        if (stored) {
          user = JSON.parse(stored);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la lecture du localStorage:', error);
    }
    return { user };
  },
  getters: {
    isLoggedIn: (state) => !!state.user,
    isAdmin: (state) => state.user && state.user.role === 'admin',
    token: (state) => state.user?.token || null,
  },
  actions: {
    login(user: any) {
      this.user = user;
      localStorage.setItem('user', JSON.stringify(user));
    },
    logout() {
      this.user = null;
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    },
  },
}); 