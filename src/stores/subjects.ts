import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface Subject {
  _id?: string;
  name: string;
  color: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export const useSubjectsStore = defineStore('subjects', () => {
  const subjects = ref<Subject[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const initialized = ref(false);

  // Getters
  const getSubjects = computed(() => subjects.value);
  const getSubjectById = computed(() => (id: string) => 
    subjects.value.find(subject => subject._id === id)
  );
  const getSubjectByName = computed(() => (name: string) => 
    subjects.value.find(subject => 
      subject.name.toLowerCase() === name.toLowerCase()
    )
  );

  // Actions
  const fetchSubjects = async (force = false) => {
    // Éviter de recharger si déjà en cours et pas forcé
    if (loading.value && !force) return;
    
    loading.value = true;
    error.value = null;
    
    try {
      const response = await fetch('/.netlify/functions/subjects');
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des matières');
      }
      
      const data = await response.json();
      subjects.value = data;
      initialized.value = true;
      console.log('Matières chargées:', data.length, 'matières');
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Erreur inconnue';
      console.error('Erreur fetchSubjects:', err);
      // En cas d'erreur, vider la liste pour éviter les données corrompues
      subjects.value = [];
    } finally {
      loading.value = false;
    }
  };

  const initializeStore = async () => {
    if (!initialized.value && !loading.value) {
      await fetchSubjects();
    }
  };

  const refreshSubjects = async () => {
    return fetchSubjects(true);
  };

  const createSubject = async (subject: Omit<Subject, '_id' | 'createdAt' | 'updatedAt'>) => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await fetch('/.netlify/functions/subjects', {
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
      const response = await fetch(`/.netlify/functions/subjects?id=${id}`, {
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

      // Mettre à jour le sujet dans le store
      const index = subjects.value.findIndex(subject => subject._id === id);
      if (index !== -1) {
        subjects.value[index] = { ...subjects.value[index], ...updates, updatedAt: new Date() };
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
      const response = await fetch(`/.netlify/functions/subjects?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la suppression');
      }

      // Supprimer le sujet du store
      subjects.value = subjects.value.filter(subject => subject._id !== id);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Erreur inconnue';
      console.error('Erreur deleteSubject:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const clearError = () => {
    error.value = null;
  };

  return {
    // State
    subjects,
    loading,
    error,
    initialized,
    
    // Getters
    getSubjects,
    getSubjectById,
    getSubjectByName,
    
    // Actions
    fetchSubjects,
    refreshSubjects,
    initializeStore,
    createSubject,
    updateSubject,
    deleteSubject,
    clearError,
  };
});
