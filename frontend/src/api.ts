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
  const token = getValidAuthToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
    'X-Requested-With': 'XMLHttpRequest',
  };
};

let hasRedirectedFor401 = false;

// Helpers JWT/token
function decodeJwtPayload(token?: string): any | null {
  try {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '==='.slice((base64.length + 3) % 4);
    const json = atob(padded);
    return JSON.parse(json);
  } catch { return null; }
}

function getStoredToken(): string | null {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    const obj = JSON.parse(raw);
    return obj?.token || null;
  } catch { return null; }
}

export function getValidAuthToken(): string | null {
  const token = getStoredToken();
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  const exp = payload?.exp ? Number(payload.exp) : 0;
  if (!exp || Date.now() >= exp * 1000) {
    try { localStorage.removeItem('user'); } catch {}
    return null;
  }
  return token;
}

export const secureApiCall = async (url: string, options: RequestInit = {}) => {
  const config = { ...options, headers: { ...getAuthHeaders(), ...options.headers } };
  try {
    const response = await fetch(`${API_URL}${url}`, config);
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('user');
        // Rediriger uniquement depuis des pages protégées (évite les boucles sur les pages publiques)
        const path = (typeof window !== 'undefined' && window.location && window.location.pathname) ? window.location.pathname : '';
        const isProtected = /^\/(admin|dashboard|profil|profile|account|compte)/i.test(path);
        if (isProtected && !hasRedirectedFor401) {
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