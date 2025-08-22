// Configuration sécurisée de l'API
export const API_URL = import.meta.env.VITE_API_URL || '/api';

// Headers de sécurité par défaut
export const getAuthHeaders = () => {
  const user = localStorage.getItem('user');
  const token = user ? JSON.parse(user).token : null;
  
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
    'X-Requested-With': 'XMLHttpRequest',
  };
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
        // Token expiré ou invalide
        localStorage.removeItem('user');
        window.location.href = '/';
        throw new Error('Session expirée');
      }
      throw new Error(`Erreur ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erreur API:', error);
    throw error;
  }
}; 