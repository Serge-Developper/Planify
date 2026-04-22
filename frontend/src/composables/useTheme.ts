import { useDark, useToggle, usePreferredDark } from '@vueuse/core';
import { secureApiCall, getValidAuthToken } from '@/api'
import { useAuthStore } from '@/stores/auth'

export function useTheme() {
  const isDark = useDark({
    selector: document.documentElement,   // applique sur <html>
    attribute: 'data-theme',              // data-theme="dark"/"light"
    valueDark: 'dark',
    valueLight: 'light',
  });
  const toggleDark = useToggle(isDark);

  const prefersDark = usePreferredDark();

  try {
      const storedUserRaw = localStorage.getItem('user') || sessionStorage.getItem('user');
      const storedUser = storedUserRaw ? JSON.parse(storedUserRaw) : null;
      const userTheme = storedUser && storedUser.theme ? String(storedUser.theme) : '';
      const saved = userTheme || localStorage.getItem('theme');
  
      if (!saved) {
        isDark.value = false;
        document.documentElement.setAttribute('data-theme', 'light');
        try { localStorage.setItem('theme', 'light') } catch {}
      } else if (saved === 'dark') {
        isDark.value = true;
        document.documentElement.setAttribute('data-theme', 'dark');
      } else if (saved === 'light') {
        isDark.value = false;
        document.documentElement.setAttribute('data-theme', 'light');
      } else if (saved === 'auto') {
        isDark.value = !!prefersDark.value;
        document.documentElement.setAttribute('data-theme', prefersDark.value ? 'dark' : 'light');
      }
  } catch {}

  async function setThemePreference(pref: 'dark' | 'light' | 'auto') {
    try {
      const nextIsDark = pref === 'dark' || (pref === 'auto' && !!prefersDark.value);
      isDark.value = nextIsDark;
      document.documentElement.setAttribute('data-theme', nextIsDark ? 'dark' : 'light');
      localStorage.setItem('theme', pref);

      const auth = useAuthStore();
      const token = auth.user?.token || getValidAuthToken();

      if (token) {
        await secureApiCall('/users/me/theme', {
          method: 'PUT',
          body: JSON.stringify({ theme: pref })
        });
      }

      try {
        const rawLocal = localStorage.getItem('user');
        const rawSession = sessionStorage.getItem('user');
        const raw = rawLocal || rawSession;
        if (raw) {
          const obj = JSON.parse(raw);
          obj.theme = pref;
          if (rawLocal) localStorage.setItem('user', JSON.stringify(obj));
          if (rawSession) sessionStorage.setItem('user', JSON.stringify(obj));
        }
      } catch {}
    } catch {}
  }

  return { isDark, toggleDark, setThemePreference };
}