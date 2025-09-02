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

  const getSubjects = computed(() => subjects.value);
  const getSubjectById = computed(() => (id: string) => subjects.value.find(subject => subject._id === id));
  const getSubjectByName = computed(() => (name: string) => subjects.value.find(subject => subject.name.toLowerCase() === name.toLowerCase()));

  const fetchSubjects = async (force = false) => {
    if (loading.value && !force) return;
    loading.value = true; error.value = null;
    try {
      // Essaye de récupérer depuis l'API de l'hébergeur IONOS (ou Netlify)
      // Structure attendue: [{ name, color, color2?, gradientAngle?, yearsAllowed?, groupsAllowed?, specialitesAllowed? }]
      const res = await secureApiCall('/subjects');
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
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Erreur inconnue';
      // Fallback silencieux: on laisse la liste vide si l'endpoint n'existe pas
      subjects.value = [];
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
      const response = await fetch(`${API_URL}/subjects/rules/static`, { headers: getAuthHeaders() });
      if (response.status === 404) {
        // Endpoint pas encore déployé côté backend → pas d'erreur console
        staticRules.value = staticRules.value || [];
        return;
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const res = await response.json();
      staticRules.value = Array.isArray(res) ? res : (Array.isArray(res?.rules) ? res.rules : []);
    } catch (e) {
      staticRules.value = staticRules.value || [];
    }
  };

  // Placeholders avec signatures compatibles, persistance en mémoire
  const saveStaticRule = async (
    subjectName: string,
    yearsAllowed: string[] = [],
    specialitesAllowed: string[] = [],
    groupsAllowed?: string[]
  ) => {
    try {
      const payload = { subjectName, yearsAllowed, specialitesAllowed, groupsAllowed: groupsAllowed || [] } as any;
      const saved = await secureApiCall('/subjects/rules/static', { method: 'POST', body: JSON.stringify(payload) });
      const idx = staticRules.value.findIndex(r => r.subjectName === subjectName);
      const record = saved || payload;
      if (idx >= 0) staticRules.value[idx] = record as any; else staticRules.value.push(record as any);
    } catch (e) {
      throw e;
    }
  };
  const deleteStaticRule = async (subjectName: string) => {
    try {
      await secureApiCall(`/subjects/rules/static/${encodeURIComponent(subjectName)}`, { method: 'DELETE' });
      staticRules.value = staticRules.value.filter(r => r.subjectName !== subjectName);
    } catch (e) {
      throw e;
    }
  };

  const createSubject = async (subject: Omit<Subject, '_id' | 'createdAt' | 'updatedAt'>) => {
    const saved = await secureApiCall('/subjects', { method: 'POST', body: JSON.stringify(subject as any) });
    await fetchSubjects(true);
    return saved as any;
  };
  const updateSubject = async (id: string, updates: Partial<Subject>) => {
    await secureApiCall(`/subjects/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(updates as any) });
    await fetchSubjects(true);
  };
  const deleteSubject = async (id: string) => {
    await secureApiCall(`/subjects/${encodeURIComponent(id)}`, { method: 'DELETE' });
    subjects.value = subjects.value.filter(s => s._id !== id);
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

