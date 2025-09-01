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
    // Pas d'endpoint IONOS actuellement; persistance en mémoire uniquement
    staticRules.value = staticRules.value || [];
  };

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
    const newSubject: Subject = {
      ...subject,
      _id: Math.random().toString(36).slice(2),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    subjects.value.push(newSubject);
    return newSubject;
  };
  const updateSubject = async (id: string, updates: Partial<Subject>) => {
    const idx = subjects.value.findIndex(s => s._id === id);
    if (idx === -1) return;
    subjects.value[idx] = { ...subjects.value[idx], ...updates, updatedAt: new Date() } as Subject;
  };
  const deleteSubject = async (id: string) => {
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

