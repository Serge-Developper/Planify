import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const apiUrl = import.meta.env.VITE_API_URL || 'https://api.planifymmi.fr';
      const response = await fetch(`${apiUrl}/api/subjects`, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des matières');
      }
      
      const data = await response.json();
      subjects.value = data;
      initialized.value = true;
      console.log('Matières chargées:', data.length, 'matières');
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        error.value = 'Délai d\'attente dépassé. Vérifiez votre connexion.';
      } else {
        error.value = err instanceof Error ? err.message : 'Erreur inconnue';
      }
      console.error('Erreur fetchSubjects:', err);
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
      const apiUrl = import.meta.env.VITE_API_URL || 'https://api.planifymmi.fr';
      const res = await fetch(`${apiUrl}/api/subjects/static-rules/all`);
      if (!res.ok) throw new Error('Erreur chargement règles statiques');
      const data = await res.json();
      staticRules.value = Array.isArray(data) ? data : [];
    } catch (e) {
      console.warn('fetchStaticRules:', e);
      staticRules.value = [];
    }
  };

  const saveStaticRule = async (
    subjectName: string,
    yearsAllowed: string[] = [],
    specialitesAllowed: string[] = [],
    groupsAllowed?: string[]
  ) => {
    const apiUrl = import.meta.env.VITE_API_URL || 'https://api.planifymmi.fr';
    const payload: any = { subjectName, yearsAllowed, specialitesAllowed };
    if (groupsAllowed) payload.groupsAllowed = groupsAllowed;
    const res = await fetch(`${apiUrl}/api/subjects/static-rules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Erreur sauvegarde règle statique');
    await fetchStaticRules();
  };
  const deleteStaticRule = async (subjectName: string) => {
    const apiUrl = import.meta.env.VITE_API_URL || 'https://api.planifymmi.fr';
    const res = await fetch(`${apiUrl}/api/subjects/static-rules/${encodeURIComponent(subjectName)}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Erreur suppression règle statique');
    await fetchStaticRules();
  };

  const createSubject = async (subject: Omit<Subject, '_id' | 'createdAt' | 'updatedAt'>) => {
    loading.value = true;
    error.value = null;
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://api.planifymmi.fr';
      const response = await fetch(`${apiUrl}/api/subjects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subject),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la création');
      }

      const newSubject = await response.json();
      subjects.value.push(newSubject);
      return newSubject;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Erreur inconnue';
      console.error('Erreur createSubject:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };
  const updateSubject = async (id: string, updates: Partial<Subject>) => {
    loading.value = true;
    error.value = null;
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://api.planifymmi.fr';
      const response = await fetch(`${apiUrl}/api/subjects/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la mise à jour');
      }

      const updatedSubject = await response.json();
      const index = subjects.value.findIndex(subject => subject._id === id);
      if (index !== -1) {
        subjects.value[index] = updatedSubject;
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Erreur inconnue';
      console.error('Erreur updateSubject:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };
  const deleteSubject = async (id: string) => {
    loading.value = true;
    error.value = null;
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://api.planifymmi.fr';
      const response = await fetch(`${apiUrl}/api/subjects/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la suppression');
      }

      subjects.value = subjects.value.filter(subject => subject._id !== id);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Erreur inconnue';
      console.error('Erreur deleteSubject:', err);
      throw err;
    } finally {
      loading.value = false;
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

