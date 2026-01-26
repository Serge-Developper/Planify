import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { secureApiCall, API_URL, getAuthHeaders } from '@/api';

export interface Subject {
  _id?: string;
  name: string;
  color: string;
  color2?: string;
  gradientAngle?: number;
  colorOpacity?: number;
  color2Opacity?: number;
  yearsAllowed?: string[];
  groupsAllowed?: string[];
  specialitesAllowed?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export const useSubjectsStore = defineStore('subjects', () => {
  const subjects = ref<Subject[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const initialized = ref(false);
  const staticRules = ref<Array<{ subjectName: string; yearsAllowed: string[]; groupsAllowed?: string[]; specialitesAllowed: string[] }>>([]);

  // --- Fallback local si l'API n'est pas disponible (404) ---
  const STATIC_KEY = 'planify_static_rules';
  function loadStaticRulesLocal() {
    try {
      const raw = localStorage.getItem(STATIC_KEY);
      if (!raw) return [] as any[];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch { return [] as any[]; }
  }
  function saveStaticRulesLocal(rules: any[]) {
    try { localStorage.setItem(STATIC_KEY, JSON.stringify(rules || [])); } catch {}
  }

  // --- Fallback local pour les matières dynamiques quand l'API n'est pas disponible ---
  const SUBJECTS_KEY = 'planify_subjects';
  function loadSubjectsLocal(): Subject[] {
    try {
      const raw = localStorage.getItem(SUBJECTS_KEY);
      if (!raw) return [] as Subject[];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch { return [] as Subject[]; }
  }
  function saveSubjectsLocal(list: Subject[]) {
    try { localStorage.setItem(SUBJECTS_KEY, JSON.stringify(list || [])); } catch {}
  }

  const getSubjects = computed(() => subjects.value);
  const getSubjectById = computed(() => (id: string) => subjects.value.find(subject => subject._id === id));
  const getSubjectByName = computed(() => (name: string) => subjects.value.find(subject => subject.name.toLowerCase() === name.toLowerCase()));

  const fetchSubjects = async (force = false) => {
    if (loading.value && !force) return;
    loading.value = true; error.value = null;
    try {
      // Essaye de récupérer depuis l'API de l'hébergeur IONOS (ou Netlify)
      // Structure attendue: [{ name, color, color2?, gradientAngle?, yearsAllowed?, groupsAllowed?, specialitesAllowed? }]
      const response = await fetch(`${API_URL}/subjects`, { headers: getAuthHeaders() });
      if (response.status === 404) {
        const local = loadSubjectsLocal();
        subjects.value = local;
        initialized.value = true;
        return;
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const res = await response.json();
      const arr = Array.isArray(res) ? res : (Array.isArray(res?.subjects) ? res.subjects : []);
      subjects.value = arr.map((s: any) => ({
        _id: s._id,
        name: s.name || s.matiere || s.title || '',
        color: s.color || '#6db4ff',
        color2: s.color2 || s.secondaryColor || undefined,
        gradientAngle: typeof s.gradientAngle === 'number' ? s.gradientAngle : (typeof s.angle === 'number' ? s.angle : 90),
        colorOpacity: s.colorOpacity,
        color2Opacity: s.color2Opacity,
        yearsAllowed: Array.isArray(s.yearsAllowed) ? s.yearsAllowed : [],
        groupsAllowed: Array.isArray(s.groupsAllowed) ? s.groupsAllowed : [],
        specialitesAllowed: Array.isArray(s.specialitesAllowed) ? s.specialitesAllowed : [],
        createdAt: s.createdAt ? new Date(s.createdAt) : undefined,
        updatedAt: s.updatedAt ? new Date(s.updatedAt) : undefined,
      }));
      initialized.value = true;
      saveSubjectsLocal(subjects.value as any);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Erreur inconnue';
      // Fallback: charger depuis localStorage
      const local = loadSubjectsLocal();
      subjects.value = local;
    } finally {
      loading.value = false;
    }
  };

  const initializeStore = async () => {
    if (!initialized.value && !loading.value) {
      await fetchSubjects();
      await fetchStaticRules();
    }
  };

  const refreshSubjects = async () => fetchSubjects(true);

  const fetchStaticRules = async () => {
    try {
      // Nouveau endpoint propre (/api/subjects/rules). On garde un fallback silencieux si 404
      let response = await fetch(`${API_URL}/subjects/rules`, { headers: getAuthHeaders() });
      if (response.status === 404) {
        // Ancien endpoint pour compat
        response = await fetch(`${API_URL}/subjects/static-rules`, { headers: getAuthHeaders() });
      }
      if (response.status === 404) {
        // Endpoint pas encore déployé côté backend → pas d'erreur console
        const local = loadStaticRulesLocal();
        staticRules.value = local;
        return;
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const res = await response.json();
      staticRules.value = Array.isArray(res) ? res : (Array.isArray(res?.rules) ? res.rules : []);
      // synchroniser localement pour avoir un cache en cas d'indispo
      saveStaticRulesLocal(staticRules.value as any);
    } catch (e) {
      const local = loadStaticRulesLocal();
      staticRules.value = local;
    }
  };

  // Placeholders avec signatures compatibles, persistance en mémoire
  const saveStaticRule = async (
    subjectName: string,
    yearsAllowed: string[] = [],
    specialitesAllowed: string[] = [],
    groupsAllowed?: string[]
  ) => {
    const payload = { subjectName, yearsAllowed, specialitesAllowed, groupsAllowed: groupsAllowed || [] } as any;
    try {
      let res = await fetch(`${API_URL}/subjects/rules`, { method: 'POST', headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.status === 404) {
        res = await fetch(`${API_URL}/subjects/static-rules`, { method: 'POST', headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      }
      if (res.status === 404) {
        // Fallback local
        const idx = staticRules.value.findIndex(r => r.subjectName === subjectName);
        if (idx >= 0) staticRules.value[idx] = payload as any; else staticRules.value.push(payload as any);
        saveStaticRulesLocal(staticRules.value as any);
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const saved = await res.json();
      const idx = staticRules.value.findIndex(r => r.subjectName === subjectName);
      const record = saved || payload;
      if (idx >= 0) staticRules.value[idx] = record as any; else staticRules.value.push(record as any);
      saveStaticRulesLocal(staticRules.value as any);
    } catch (e) {
      // Fallback local en cas d'erreur réseau
      const idx = staticRules.value.findIndex(r => r.subjectName === subjectName);
      if (idx >= 0) staticRules.value[idx] = payload as any; else staticRules.value.push(payload as any);
      saveStaticRulesLocal(staticRules.value as any);
    }
  };
  const deleteStaticRule = async (subjectName: string) => {
    try {
      let res = await fetch(`${API_URL}/subjects/rules/${encodeURIComponent(subjectName)}`, { method: 'DELETE', headers: getAuthHeaders() });
      if (res.status === 404) {
        res = await fetch(`${API_URL}/subjects/static-rules/${encodeURIComponent(subjectName)}`, { method: 'DELETE', headers: getAuthHeaders() });
      }
      if (res.status === 404) {
        staticRules.value = staticRules.value.filter(r => r.subjectName !== subjectName);
        saveStaticRulesLocal(staticRules.value as any);
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      staticRules.value = staticRules.value.filter(r => r.subjectName !== subjectName);
      saveStaticRulesLocal(staticRules.value as any);
    } catch (e) {
      // Fallback local si l'API n'est pas dispo
      staticRules.value = staticRules.value.filter(r => r.subjectName !== subjectName);
      saveStaticRulesLocal(staticRules.value as any);
    }
  };

  const createSubject = async (subject: Omit<Subject, '_id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const res = await fetch(`${API_URL}/subjects`, { method: 'POST', headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify(subject as any) });
      if (res.status === 404) {
        const local = loadSubjectsLocal();
        const newSubject: Subject = { ...subject, _id: Math.random().toString(36).slice(2), createdAt: new Date(), updatedAt: new Date() } as any;
        const next = [...local, newSubject];
        saveSubjectsLocal(next);
        subjects.value = next;
        return newSubject as any;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await fetchSubjects(true);
      return await res.json();
    } catch (e) {
      // Fallback local en cas d'erreur réseau
      const local = loadSubjectsLocal();
      const newSubject: Subject = { ...subject, _id: Math.random().toString(36).slice(2), createdAt: new Date(), updatedAt: new Date() } as any;
      const next = [...local, newSubject];
      saveSubjectsLocal(next);
      subjects.value = next;
      return newSubject as any;
    }
  };
  const updateSubject = async (id: string, updates: Partial<Subject>) => {
    try {
      const res = await fetch(`${API_URL}/subjects/${encodeURIComponent(id)}`, { method: 'PUT', headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify(updates as any) });
      if (res.status === 404) {
        const local = loadSubjectsLocal();
        const next = local.map(s => s._id === id ? ({ ...s, ...updates, updatedAt: new Date() } as any) : s);
        saveSubjectsLocal(next);
        subjects.value = next;
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await fetchSubjects(true);
    } catch (e) {
      const local = loadSubjectsLocal();
      const next = local.map(s => s._id === id ? ({ ...s, ...updates, updatedAt: new Date() } as any) : s);
      saveSubjectsLocal(next);
      subjects.value = next;
    }
  };
  const deleteSubject = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/subjects/${encodeURIComponent(id)}`, { method: 'DELETE', headers: getAuthHeaders() });
      if (res.status === 404) {
        const next = (subjects.value || []).filter(s => s._id !== id);
        saveSubjectsLocal(next as any);
        subjects.value = next;
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      subjects.value = subjects.value.filter(s => s._id !== id);
      saveSubjectsLocal(subjects.value as any);
    } catch (e) {
      const next = (subjects.value || []).filter(s => s._id !== id);
      saveSubjectsLocal(next as any);
      subjects.value = next;
    }
  };

  const clearError = () => { error.value = null; };

  return {
    subjects, loading, error, initialized, staticRules,
    getSubjects, getSubjectById, getSubjectByName,
    fetchSubjects, refreshSubjects, initializeStore,
    createSubject, updateSubject, deleteSubject,
    clearError, fetchStaticRules, saveStaticRule, deleteStaticRule,
  };
});