import { defineStore } from 'pinia';
import { ref } from 'vue';
import { secureApiCall } from '@/api';
import { useAuthStore } from '@/stores/auth';
import { useSubjectsStore } from '@/stores/subjects';

export const useEventsStore = defineStore('events', () => {
  const events = ref<any[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const initialized = ref(false);
  const CACHE_KEY = 'planify_events_cache_v1';
  function readCache(userId?: string) {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const obj = JSON.parse(raw);
      if (!obj || String(obj.userId || '') !== String(userId || '')) return null;
      const items = Array.isArray(obj.events) ? obj.events : [];
      return { events: items, ts: Number(obj.ts || 0) || 0 };
    } catch { return null; }
  }
  function writeCache(userId: any, list: any[]) {
    try {
      const payload = { userId: String(userId || ''), ts: Date.now(), events: list };
      localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
    } catch {}
  }

  function normalize(raw: any[], userId?: string) {
    return raw.map((e: any) => {
      const titre = e.titre ?? e.title ?? '';
      const matiere = e.matiere ?? e.subject ?? '';
      const date = e.date ?? (e.dueDate ? new Date(e.dueDate).toISOString().slice(0, 10) : '');
      const heureRaw = e.heure ?? '';
      const heure = typeof heureRaw === 'string' ? heureRaw.replace('h', ':') : '';
      let type = (e.type ?? '').toLowerCase();
      if (type === 'examen') type = 'exam';
      if (!type) type = 'devoir';
      const checked = (typeof e.checked === 'boolean') ? e.checked : (Array.isArray(e.checkedBy) ? e.checkedBy.includes(userId!) : !!e.isCompleted);
      const archived = (typeof e.archived === 'boolean') ? e.archived : (Array.isArray(e.archivedBy) ? e.archivedBy.includes(userId!) : false);
      const hidden = Array.isArray(e.hiddenBy) ? e.hiddenBy.includes(userId!) : false;
      return {
        _id: e._id,
        titre,
        matiere,
        date,
        heure,
        type,
        groupe: e.groupe ?? 'Promo',
        groupes: Array.isArray(e.groupes) ? e.groupes : [],
        year: e.year ?? '',
        description: e.description ?? '',
        checked,
        archived,
        hidden,
        archivedBy: Array.isArray(e.archivedBy) ? e.archivedBy : [],
        checkedBy: Array.isArray(e.checkedBy) ? e.checkedBy : [],
        createdBy: e.createdBy ?? e.creatorId ?? null,
        submissionEnabled: !!e.submissionEnabled,
        isProposal: !!e.isProposal,
      };
    });
  }

  async function loadIfNeeded() {
    if (initialized.value) return;
    const auth = useAuthStore();
    const uid = auth.user?.id || auth.user?._id;
    const cached = readCache(uid);
    if (cached && Array.isArray(cached.events) && cached.events.length) {
      events.value = normalize(cached.events, uid);
      initialized.value = true;
      error.value = null;
    }
    const hydrated = !!(cached && cached.events && cached.events.length);
    if (!hydrated) {
      await refresh();
    } else {
      try { refresh(); } catch {}
    }
  }

  async function refresh() {
    try {
      loading.value = true;
      const auth = useAuthStore();
      if (!auth.isLoggedIn) {
        events.value = [];
        initialized.value = false;
        error.value = null;
        return;
      }
      try { useSubjectsStore().initializeStore?.(); } catch {}
      const res: any = await secureApiCall('/events');
      const raw = Array.isArray(res) ? res : (Array.isArray(res?.events) ? res.events : []);
      const userId = auth.user?.id || auth.user?._id;
      events.value = normalize(raw, userId);
      try { writeCache(userId, raw) } catch {}
      initialized.value = true;
      error.value = null;
    } catch (e: any) {
      error.value = e?.message || String(e);
      events.value = [];
      initialized.value = false;
    } finally {
      loading.value = false;
    }
  }

  function clear() {
    events.value = [];
    initialized.value = false;
    loading.value = false;
    error.value = null;
  }

  return { events, loading, error, initialized, loadIfNeeded, refresh, clear };
});