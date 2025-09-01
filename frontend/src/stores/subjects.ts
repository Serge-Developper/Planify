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
      subjects.value = Array.isArray(res?.subjects) ? res.subjects : [];
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

  const fetchStaticRules = async () => {
    try {
      const res = await secureApiCall('/subjects/static-rules');
      staticRules.value = Array.isArray(res?.rules) ? res.rules : [];
    } catch {
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
    await secureApiCall('/subjects/static-rules', {
      method: 'POST',
      body: JSON.stringify({ subjectName, yearsAllowed, specialitesAllowed, groupsAllowed: groupsAllowed || [] })
    });
    await fetchStaticRules();
  };
  const deleteStaticRule = async (subjectName: string) => {
    await secureApiCall(`/subjects/static-rules/${encodeURIComponent(subjectName)}`, { method: 'DELETE' });
    await fetchStaticRules();
  };

  const createSubject = async (subject: Omit<Subject, '_id' | 'createdAt' | 'updatedAt'>) => {
    const res = await secureApiCall('/subjects', {
      method: 'POST',
      body: JSON.stringify(subject)
    });
    await fetchSubjects(true);
    return res?.subject as Subject;
  };
  const updateSubject = async (id: string, updates: Partial<Subject>) => {
    await secureApiCall(`/subjects/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    await fetchSubjects(true);
  };
  const deleteSubject = async (id: string) => {
    await secureApiCall(`/subjects/${encodeURIComponent(id)}`, { method: 'DELETE' });
    await fetchSubjects(true);
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

