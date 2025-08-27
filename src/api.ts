// Configuration sécurisée de l'API
// Par défaut, utilise l'API interne Netlify/Vite sous "/api" (redirigée vers les fonctions)
export const API_URL = import.meta.env.VITE_API_URL || '/api';

// Headers de sécurité par défaut
export const getAuthHeaders = () => {
  let token = null;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const user = localStorage.getItem('user');
      if (user) {
        const parsed = JSON.parse(user);
        token = parsed?.token || null;
        console.log('🔍 Token récupéré:', token ? `${token.substring(0, 20)}...` : 'null');
      }
    }
  } catch (error) {
    console.error('Erreur lors de la lecture du token:', error);
  }
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
    'X-Requested-With': 'XMLHttpRequest',
  };
  
  console.log('🔍 Headers d\'authentification:', {
    hasToken: !!token,
    authHeader: token ? `Bearer ${token.substring(0, 20)}...` : 'none'
  });
  
  return headers;
};



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
        // Token expiré ou invalide - laisser les composants gérer
        console.warn('Token expiré ou invalide pour:', url);
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