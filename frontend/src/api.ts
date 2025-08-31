// Configuration sécurisée de l'API
let RAW_API_URL = (import.meta.env.VITE_API_URL ?? '/api').toString().trim();

// Corrige “https//”, double protocole, espaces, et supprime le slash final
RAW_API_URL = RAW_API_URL
  .replace(/^([a-z]+)(?=\/\/)/i, '$1:')           // ajoute ":" si absent après le schéma
  .replace(/^(https?:\/\/)https?:\/\//i, '$1')    // retire protocole dupliqué
  .replace(/\s+/g, '');

const BASE_URL = RAW_API_URL.replace(/\/+$/, '');
export const API_URL = BASE_URL.endsWith('/api') ? BASE_URL : `${BASE_URL}/api`;

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

let hasRedirectedFor401 = false;

export const secureApiCall = async (url: string, options: RequestInit = {}) => {
  const config = { ...options, headers: { ...getAuthHeaders(), ...options.headers } };
  try {
    const response = await fetch(`${API_URL}${url}`, config);
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('user');
        if (!hasRedirectedFor401) {
          hasRedirectedFor401 = true;
          try { window.location.href = '/'; } catch {}
        }
        throw new Error('Session expirée');
      }
      throw new Error(`Erreur ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error: any) {
    if (error && (error.name === 'TypeError' || String(error).includes('Failed to fetch'))) {
      console.error('Erreur réseau API (sans redirection):', error);
      throw error;
    }
    console.error('Erreur API:', error);
    throw error;
  }
};