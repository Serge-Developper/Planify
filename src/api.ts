// Configuration sécurisée de l'API pour Vercel
export const API_URL = import.meta.env.VITE_API_URL || 'https://planify-snowy.vercel.app/api';

// Headers de sécurité par défaut
export const getAuthHeaders = () => {
  let token = null;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const user = localStorage.getItem('user');
      if (user) {
        const parsed = JSON.parse(user);
        token = parsed?.token || null;
      }
    }
  } catch (error) {
    console.error('Erreur lors de la lecture du token:', error);
  }
  
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
    'X-Requested-With': 'XMLHttpRequest',
  };
};

let hasRedirectedFor401 = false;

// Fonction pour les requêtes API sécurisées
export const secureApiCall = async (url: string, options: RequestInit = {}) => {
  const config = {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${API_URL}${url}`, config);
    
    if (!response.ok) {
      if (response.status === 401) {
        // Token expiré ou invalide
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.removeItem('user');
          }
        } catch (error) {
          console.error('Erreur lors de la suppression du localStorage:', error);
        }
        // Ne pas rediriger automatiquement si on est déjà sur la page d'accueil
        // ou si l'URL contient '/items' (appel API public)
        const currentPath = window.location.pathname;
        const isPublicItemsCall = url.includes('/items') && !url.includes('/weekly');
        
        if (!hasRedirectedFor401 && currentPath !== '/' && !isPublicItemsCall) {
          hasRedirectedFor401 = true;
          // éviter la boucle de refresh si le backend est down
          try { window.location.href = '/'; } catch { /* noop */ }
        }
        throw new Error('Session expirée');
      }
      throw new Error(`Erreur ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error: any) {
    // Ne pas rediriger sur erreur réseau (TypeError: Failed to fetch)
    if (error && (error.name === 'TypeError' || String(error).includes('Failed to fetch'))) {
      console.error('Erreur réseau API (sans redirection):', error);
      throw error;
    }
    console.error('Erreur API:', error);
    throw error;
  }
}; 