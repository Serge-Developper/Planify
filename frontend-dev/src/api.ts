// Configuration sécurisée de l'APII
let RAW_API_URL = (import.meta.env.VITE_API_URL ?? '').toString().trim();

if (!RAW_API_URL) {
  try {
    const host = typeof window !== 'undefined' ? window.location.hostname : '';
    if (/^planifymmi\.fr$/i.test(host)) {
      RAW_API_URL = 'https://api.planifymmi.fr';
    } else {
      RAW_API_URL = '/api';
    }
  } catch { RAW_API_URL = '/api'; }
}

RAW_API_URL = RAW_API_URL
  .replace(/^([a-z]+)(?=\/\/)/i, '$1:')
  .replace(/^(https?:\/\/)https?:\/\//i, '$1')
  .replace(/\s+/g, '');

const BASE_URL = RAW_API_URL.replace(/\/+$/,'');
export const API_URL = BASE_URL.endsWith('/api') ? BASE_URL : `${BASE_URL}/api`;

// Headers de sécurité par défaut
// getAuthHeaders()
export const getAuthHeaders = () => {
  const token = getValidAuthToken();
  const headers: Record<string, string> = { 'X-Requested-With': 'XMLHttpRequest' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

let hasRedirectedFor401 = false;
const inflight = new Map<string, Promise<any>>();

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
    const rawLocal = localStorage.getItem('user');
    const rawSession = sessionStorage.getItem('user');
    const raw = rawLocal || rawSession;
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
    try { localStorage.removeItem('user'); sessionStorage.removeItem('user'); } catch {}
    return null;
  }
  return token;
}

export const secureApiCall = async (url: string, options: RequestInit = {}) => {
  const headers = { ...getAuthHeaders(), ...(options.headers || {}) } as Record<string, string>;
  const hasBody = typeof options.body !== 'undefined' && options.body !== null;
  const method = (options.method || (hasBody ? 'POST' : 'GET')).toString().toUpperCase();
  if (hasBody && !('Content-Type' in headers)) headers['Content-Type'] = 'application/json';
  const config: RequestInit = { ...options, method, headers };

  const key = (method === 'GET' && !hasBody) ? `${headers['Authorization'] || ''}:${url}` : '';
  if (key && inflight.has(key)) return await inflight.get(key)!;

  const run = (async () => {
    const response = await fetch(`${API_URL}${url}`, config);
    if (!response.ok) {
      let serverMessage = '';
      try {
        const errorText = await response.text();
        if (errorText) {
          try { const json = JSON.parse(errorText); serverMessage = json?.message || json?.error || errorText; } catch { serverMessage = errorText; }
        }
      } catch {}
      if (response.status === 401) {
        try { localStorage.removeItem('user'); sessionStorage.removeItem('user'); } catch {}
        try { window.dispatchEvent(new CustomEvent('auth-logout')); } catch {}
        const path = (typeof window !== 'undefined' && window.location && window.location.pathname) ? window.location.pathname : '';
        const isProtected = /^\/(admin|dashboard|profil|profile|account|compte)/i.test(path);
        if (isProtected && !hasRedirectedFor401) { hasRedirectedFor401 = true; try { window.location.href = '/'; } catch {} }
        throw new Error('Session expirée');
      }
      throw new Error(`Erreur ${response.status}: ${response.statusText}${serverMessage ? ` - ${serverMessage}` : ''}`);
    }
    return await response.json().catch(() => ({ success: true }));
  })();

  if (key) {
    inflight.set(key, run);
    try { const r = await run; inflight.delete(key); return r; } catch (e) { inflight.delete(key); throw e; }
  } else {
    return await run;
  }
};