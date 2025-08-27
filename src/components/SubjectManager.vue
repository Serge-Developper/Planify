<template>
  <div class="subject-manager">
    <div class="subject-manager-header">
      <h2>Gestion des Matières</h2>
      <div class="header-actions">
        <button @click="refreshSubjects" class="refresh-btn" :disabled="loading" title="Actualiser">
          🔄
        </button>
        <button @click="showAddForm = true" class="add-subject-btn">
          <span>+</span> Ajouter une matière
        </button>
      </div>
    </div>

         <!-- Liste des matières -->
     <div class="subjects-list" v-if="!loading && !error">
       <div v-if="subjects.length === 0" class="no-subjects">
         <p>Aucune matière créée. Ajoutez votre première matière !</p>
       </div>
      
      <div v-else class="subjects-grid">
        <div 
          v-for="subject in subjects" 
          :key="subject._id" 
          class="subject-card"
          :style="{ borderLeftColor: subject.color }"
        >
          <div class="subject-info">
            <div class="subject-color" :style="{ backgroundColor: subject.color }"></div>
            <div class="subject-details">
              <h3>{{ subject.name }}</h3>
              <p class="subject-date">
                Créé le {{ formatDate(subject.createdAt) }}
              </p>
            </div>
          </div>
          
          <div class="subject-actions">
            <button @click="editSubject(subject)" class="edit-btn" title="Modifier">
              ✏️
            </button>
            <button @click="deleteSubject(subject._id!)" class="delete-btn" title="Supprimer">
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>

         <!-- Loading -->
     <div v-if="loading" class="loading">
       <div class="spinner"></div>
       <p>Chargement des matières...</p>
     </div>

     <!-- Error state -->
     <div v-if="error && !loading" class="error-state">
       <p>Erreur lors du chargement des matières</p>
       <button @click="refreshSubjects" class="retry-btn">Réessayer</button>
     </div>

    <!-- Formulaire d'ajout/modification -->
    <div v-if="showAddForm || editingSubject" class="modal-overlay" @click="closeForm">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ editingSubject ? 'Modifier la matière' : 'Ajouter une matière' }}</h3>
          <button @click="closeForm" class="close-btn">×</button>
        </div>

        <form @submit.prevent="handleSubmit" class="subject-form">
          <div class="form-group">
            <label for="subjectName">Nom de la matière *</label>
            <input
              id="subjectName"
              v-model="formData.name"
              type="text"
              required
              placeholder="Ex: Mathématiques"
              maxlength="50"
            />
          </div>

          <div class="form-group">
            <label for="subjectColor">Couleur *</label>
            <div class="color-picker">
              <input
                id="subjectColor"
                v-model="formData.color"
                type="color"
                required
              />
              <span class="color-preview" :style="{ backgroundColor: formData.color }"></span>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" @click="closeForm" class="cancel-btn">
              Annuler
            </button>
            <button type="submit" :disabled="loading" class="submit-btn">
              {{ loading ? 'Enregistrement...' : (editingSubject ? 'Modifier' : 'Ajouter') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Messages d'erreur -->
    <div v-if="error" class="error-message">
      <p>{{ error }}</p>
      <button @click="clearError" class="close-error">×</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, watch } from 'vue';
import { useSubjectsStore, type Subject } from '@/stores/subjects';

const subjectsStore = useSubjectsStore();

// State
const showAddForm = ref(false);
const editingSubject = ref<Subject | null>(null);
const formData = reactive({
  name: '',
  color: '#3B82F6'
});

// Computed
const { subjects, loading, error } = subjectsStore;

// Methods
const formatDate = (date: Date | string | undefined) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('fr-FR');
};

const closeForm = () => {
  showAddForm.value = false;
  editingSubject.value = null;
  resetForm();
};

const resetForm = () => {
  formData.name = '';
  formData.color = '#3B82F6';
};

const editSubject = (subject: Subject) => {
  editingSubject.value = subject;
  formData.name = subject.name;
  formData.color = subject.color;
};

const handleSubmit = async () => {
  try {
    if (editingSubject.value) {
      await subjectsStore.updateSubject(editingSubject.value._id!, {
        name: formData.name,
        color: formData.color
      });
    } else {
      await subjectsStore.createSubject({
        name: formData.name,
        color: formData.color
      });
    }
    
    closeForm();
  } catch (err) {
    // L'erreur est déjà gérée dans le store
  }
};

const deleteSubject = async (id: string) => {
  if (!confirm('Êtes-vous sûr de vouloir supprimer cette matière ?')) {
    return;
  }
  
  try {
    await subjectsStore.deleteSubject(id);
  } catch (err) {
    // L'erreur est déjà gérée dans le store
  }
};

const clearError = () => {
  subjectsStore.clearError();
};

const refreshSubjects = async () => {
  try {
    await subjectsStore.refreshSubjects();
  } catch (error) {
    console.error('Erreur lors du rafraîchissement:', error);
  }
};

// Lifecycle
onMounted(async () => {
  try {
    await subjectsStore.initializeStore();
  } catch (error) {
    console.error('Erreur lors du chargement des matières:', error);
  }
});

// Recharger les matières si elles ne sont pas chargées et que le store n'est pas initialisé
watch(() => [subjectsStore.subjects, subjectsStore.initialized], ([newSubjects, initialized]) => {
  if (Array.isArray(newSubjects) && newSubjects.length === 0 && !subjectsStore.loading && !initialized) {
    // Si aucune matière n'est chargée, qu'on n'est pas en train de charger et que le store n'est pas initialisé
    subjectsStore.initializeStore();
  }
}, { immediate: true });
</script>

<style scoped>
.subject-manager {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.subject-manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.refresh-btn {
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  color: #374151;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.2rem;
  transition: all 0.2s ease;
}

.refresh-btn:hover:not(:disabled) {
  background: #e5e7eb;
  transform: rotate(180deg);
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.subject-manager-header h2 {
  margin: 0;
  color: #1f2937;
  font-size: 1.8rem;
}

.add-subject-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.add-subject-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.add-subject-btn span {
  font-size: 1.2rem;
  font-weight: bold;
}

.subjects-list {
  margin-top: 20px;
}

.no-subjects {
  text-align: center;
  padding: 60px 20px;
  color: #6b7280;
}

.subjects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.subject-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-left: 4px solid;
  transition: all 0.3s ease;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.subject-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.subject-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.subject-color {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid #e5e7eb;
}

.subject-details h3 {
  margin: 0 0 4px 0;
  color: #1f2937;
  font-size: 1.1rem;
}

.subject-date {
  margin: 0;
  color: #6b7280;
  font-size: 0.9rem;
}

.subject-actions {
  display: flex;
  gap: 8px;
}

.edit-btn, .delete-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: background-color 0.2s ease;
}

.edit-btn:hover {
  background-color: #f3f4f6;
}

.delete-btn:hover {
  background-color: #fef2f2;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #6b7280;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f4f6;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 0;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  color: #1f2937;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
  padding: 4px;
}

.close-btn:hover {
  color: #1f2937;
}

.subject-form {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #374151;
  font-weight: 500;
}

.form-group input[type="text"] {
  width: 100%;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s ease;
}

.form-group input[type="text"]:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.color-picker {
  display: flex;
  align-items: center;
  gap: 12px;
}

.color-picker input[type="color"] {
  width: 60px;
  height: 40px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.color-preview {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: 2px solid #e5e7eb;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

.cancel-btn {
  padding: 12px 20px;
  border: 1px solid #d1d5db;
  background: white;
  color: #374151;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.cancel-btn:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.submit-btn {
  padding: 12px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  position: fixed;
  top: 20px;
  right: 20px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 1001;
  max-width: 400px;
}

 .close-error {
   background: none;
   border: none;
   color: #dc2626;
   cursor: pointer;
   font-size: 1.2rem;
   padding: 4px;
 }

 .error-state {
   text-align: center;
   padding: 40px;
   color: #dc2626;
 }

 .retry-btn {
   background: #dc2626;
   color: white;
   border: none;
   padding: 12px 24px;
   border-radius: 8px;
   cursor: pointer;
   font-weight: 500;
   margin-top: 16px;
   transition: background-color 0.2s ease;
 }

 .retry-btn:hover {
   background: #b91c1c;
 }

@media (max-width: 768px) {
  .subject-manager-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .subjects-grid {
    grid-template-columns: 1fr;
  }
  
  .subject-card {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .subject-actions {
    justify-content: center;
  }
}
</style>
