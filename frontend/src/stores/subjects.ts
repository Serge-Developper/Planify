import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { secureApiCall } from '@/api';

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
      const res = await secureApiCall('/subjects');
      subjects.value = (res && res.success && Array.isArray(res.subjects)) ? res.subjects : [];
      initialized.value = true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Erreur inconnue';
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

  const fetchStaticRules = async () => { staticRules.value = staticRules.value || []; };

  // Placeholders avec signatures compatibles, persistance en mémoire
  const saveStaticRule = async (
    subjectName: string,
    yearsAllowed: string[] = [],
    specialitesAllowed: string[] = [],
    groupsAllowed?: string[]
  ) => {
    const idx = staticRules.value.findIndex(r => r.subjectName === subjectName);
    const record = { subjectName, yearsAllowed, specialitesAllowed, groupsAllowed: groupsAllowed || [] };
    if (idx >= 0) staticRules.value[idx] = record as any; else staticRules.value.push(record as any);
  };
  const deleteStaticRule = async (subjectName: string) => {
    staticRules.value = staticRules.value.filter(r => r.subjectName !== subjectName);
  };

  const createSubject = async (subject: Omit<Subject, '_id' | 'createdAt' | 'updatedAt'>) => {
    const res = await secureApiCall('/subjects', { method: 'POST', body: JSON.stringify(subject) });
    if (res && res.success && res.subject) subjects.value.unshift(res.subject);
    return res?.subject;
  };
  const updateSubject = async (id: string, updates: Partial<Subject>) => {
    const res = await secureApiCall(`/subjects/${id}`, { method: 'PUT', body: JSON.stringify(updates) });
    if (res && res.success && res.subject) {
      const idx = subjects.value.findIndex(s => s._id === id);
      if (idx >= 0) subjects.value.splice(idx, 1, res.subject);
    }
  };
  const deleteSubject = async (id: string) => {
    const res = await secureApiCall(`/subjects/${id}`, { method: 'DELETE' });
    if (res && res.success) subjects.value = subjects.value.filter(s => s._id !== id);
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

