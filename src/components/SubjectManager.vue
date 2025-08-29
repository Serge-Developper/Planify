<template>
  <div class="subject-manager">
    <div class="subject-manager-header">
      <h2>Gestion des Matières</h2>
      <div class="header-actions">
        <button @click="showAddForm = true" class="add-subject-btn">
          <span>+</span> Ajouter une matière
        </button>
      </div>
    </div>

    <!-- Règles pour matières statiques (sélection de matière existante) -->
    <div class="subjects-list" style="margin-top:24px;">
      <h3>Règles pour matières statiques</h3>
      <div class="form-group">
        <label>Matière statique</label>
        <div class="subjects-grid">
          <button v-for="name in matieresStatiques" :key="name" class="edit-btn" @click="openStaticRule(name)">{{ name }}</button>
        </div>
      </div>
      <div v-if="staticEditName" class="subject-form" style="margin-top:12px;">
        <h4>Paramètres pour: {{ staticEditName }}</h4>
        <div class="form-group">
          <label>Années visibles</label>
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            <label><input type="checkbox" value="BUT1" v-model="staticRulesForm.yearsAllowed" /> BUT1</label>
            <label><input type="checkbox" value="BUT2" v-model="staticRulesForm.yearsAllowed" /> BUT2</label>
            <label><input type="checkbox" value="BUT3" v-model="staticRulesForm.yearsAllowed" /> BUT3</label>
          </div>
        </div>
        <div class="form-group">
          <label>Groupes visibles</label>
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            <label><input type="checkbox" value="Promo" v-model="staticRulesForm.groupsAllowed" /> Promo</label>
            <label><input type="checkbox" value="A" v-model="staticRulesForm.groupsAllowed" /> A</label>
            <label><input type="checkbox" value="A'" v-model="staticRulesForm.groupsAllowed" /> A'</label>
            <label><input type="checkbox" value="A&quot;" v-model="staticRulesForm.groupsAllowed" /> A"</label>
            <label><input type="checkbox" value="B" v-model="staticRulesForm.groupsAllowed" /> B</label>
            <label><input type="checkbox" value="B'" v-model="staticRulesForm.groupsAllowed" /> B'</label>
            <label><input type="checkbox" value="B&quot;" v-model="staticRulesForm.groupsAllowed" /> B"</label>
          </div>
        </div>
        <div class="form-group">
          <label>Spécialités visibles</label>
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            <label><input type="checkbox" value="gestion" v-model="staticRulesForm.specialitesAllowed" /> Gestion</label>
            <label><input type="checkbox" value="devweb" v-model="staticRulesForm.specialitesAllowed" /> Dev Web</label>
            <label><input type="checkbox" value="creation" v-model="staticRulesForm.specialitesAllowed" /> Création</label>
          </div>
        </div>
        <div class="form-actions">
          <button class="submit-btn" :disabled="savingStatic" @click="() => saveStatic(staticEditName)">{{ savingStatic ? 'Sauvegarde...' : 'Sauvegarder règle' }}</button>
          <button class="cancel-btn" @click="() => { staticEditName = ''; clearStaticForm(); }">Fermer</button>
        </div>
      </div>
      <div style="margin-top:12px;">
        <h4>Règles existantes</h4>
        <ul>
          <li v-for="r in subjectsStore.staticRules" :key="r.subjectName" style="display:flex;gap:8px;align-items:center;">
            <span style="min-width:240px;">{{ r.subjectName }}</span>
            <span>Années: {{ (r.yearsAllowed||[]).join(', ') || '—' }}</span>
            <span>Groupes: {{ (r.groupsAllowed||[]).join(', ') || '—' }}</span>
            <span>Spécialités: {{ (r.specialitesAllowed||[]).join(', ') || '—' }}</span>
            <button class="delete-btn" title="Supprimer" @click="() => removeStatic(r.subjectName)">🗑️</button>
          </li>
        </ul>
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
          :style="subjectCardStyle(subject)"
        >
          <div class="subject-info">
            <div class="subject-color" :style="subjectColorStyle(subject)"></div>
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
            <label>Années autorisées</label>
            <div style="display:flex;gap:10px;flex-wrap:wrap">
              <label><input type="checkbox" value="BUT1" v-model="formData.yearsAllowed" /> BUT1</label>
              <label><input type="checkbox" value="BUT2" v-model="formData.yearsAllowed" /> BUT2</label>
              <label><input type="checkbox" value="BUT3" v-model="formData.yearsAllowed" /> BUT3</label>
            </div>
          </div>

          <div class="form-group">
            <label>Groupes autorisés</label>
            <div style="display:flex;gap:10px;flex-wrap:wrap">
              <label><input type="checkbox" value="Promo" v-model="formData.groupsAllowed" /> Promo</label>
              <label><input type="checkbox" value="A" v-model="formData.groupsAllowed" /> A</label>
              <label><input type="checkbox" value="A'" v-model="formData.groupsAllowed" /> A'</label>
              <label><input type="checkbox" value="A&quot;" v-model="formData.groupsAllowed" /> A"</label>
              <label><input type="checkbox" value="B" v-model="formData.groupsAllowed" /> B</label>
              <label><input type="checkbox" value="B'" v-model="formData.groupsAllowed" /> B'</label>
              <label><input type="checkbox" value="B&quot;" v-model="formData.groupsAllowed" /> B"</label>
            </div>
          </div>

          <div class="form-group">
            <label>Spécialités autorisées</label>
            <div style="display:flex;gap:10px;flex-wrap:wrap">
              <label><input type="checkbox" value="gestion" v-model="formData.specialitesAllowed" /> Gestion de projet</label>
              <label><input type="checkbox" value="devweb" v-model="formData.specialitesAllowed" /> Développement web</label>
              <label><input type="checkbox" value="creation" v-model="formData.specialitesAllowed" /> Création numérique</label>
            </div>
          </div>
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
            <label for="subjectColor">Couleur principale *</label>
            <div class="color-picker">
              <input id="subjectColor" v-model="formData.color" type="color" required />
              <input type="range" min="0" max="1" step="0.01" v-model.number="formData.colorOpacity" />
              <span class="color-preview" :style="{ background: rgbaColor(formData.color, formData.colorOpacity) }"></span>
            </div>
          </div>

          <div class="form-group">
            <label for="subjectColor2">Deuxième couleur (optionnelle)</label>
            <div class="color-picker">
              <label style="display:flex;align-items:center;gap:8px;margin-right:12px;">
                <input type="checkbox" v-model="formData.useGradient" /> Activer le dégradé
              </label>
              <input id="subjectColor2" v-model="formData.color2" type="color" />
              <input type="range" min="0" max="1" step="0.01" v-model.number="formData.color2Opacity" />
              <span class="color-preview" :style="{ background: rgbaColor(formData.color2, formData.color2Opacity) }"></span>
            </div>
          </div>

          <div class="form-group">
            <label for="angle">Angle du dégradé (°)</label>
            <input id="angle" type="number" min="0" max="360" v-model.number="formData.gradientAngle" />
            <div class="color-preview" :style="{ background: gradientPreview }"></div>
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
import { ref, onMounted, reactive, watch, computed } from 'vue';
import { useSubjectsStore, type Subject } from '@/stores/subjects';

const subjectsStore = useSubjectsStore();
const staticRulesForm = reactive<{ subjectName: string; yearsAllowed: string[]; groupsAllowed: string[]; specialitesAllowed: string[] }>({ subjectName: '', yearsAllowed: [], groupsAllowed: [], specialitesAllowed: [] })
const savingStatic = ref(false)
const staticEditName = ref('')
// Liste des matières statiques (base du site)
const matieresStatiques = [
  "Anglais",
  "Culture artistique",
  "Culture numérique",
  "Production graphique",
  "Gestion de projet",
  "Hébergement",
  "Stratégies de communication",
  "Système d'information",
  "Développement web",
  "Gestion de contenus",
  "Ergonomie et accessibilité",
  "Projet personnel et professionnel",
  "Intégration",
  "Production audio et vidéo",
  "Expression, communication et rhétorique",
  "Ecriture multimédia et narration",
  "Représentation et traitement de l'information",
  "Economie et droit du numérique"
]

// State
const showAddForm = ref(false);
const editingSubject = ref<Subject | null>(null);
const formData = reactive({
  name: '',
  color: '#3B82F6',
  color2: '#60A5FA',
  gradientAngle: 135,
  colorOpacity: 1,
  color2Opacity: 1,
  useGradient: true,
  yearsAllowed: [] as string[],
  groupsAllowed: [] as string[],
  specialitesAllowed: [] as string[],
});

// Computed
const { subjects, loading, error } = subjectsStore;

// Methods
const formatDate = (date: Date | string | undefined) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('fr-FR');
};

function clearStaticForm() {
  staticRulesForm.subjectName = ''
  staticRulesForm.yearsAllowed = []
  staticRulesForm.groupsAllowed = []
  staticRulesForm.specialitesAllowed = []
}

function openStaticRule(name: string) {
  staticEditName.value = name
  const existing = (subjectsStore.staticRules || []).find(r => String(r.subjectName).toLowerCase() === String(name).toLowerCase())
  if (existing) {
    staticRulesForm.subjectName = existing.subjectName
    staticRulesForm.yearsAllowed = Array.isArray(existing.yearsAllowed) ? [...existing.yearsAllowed] : []
    staticRulesForm.groupsAllowed = Array.isArray(existing.groupsAllowed) ? [...existing.groupsAllowed] : []
    staticRulesForm.specialitesAllowed = Array.isArray(existing.specialitesAllowed) ? [...existing.specialitesAllowed] : []
  } else {
    staticRulesForm.subjectName = name
    staticRulesForm.yearsAllowed = []
    staticRulesForm.groupsAllowed = []
    staticRulesForm.specialitesAllowed = []
  }
}

async function saveStatic(name?: string) {
  const subjectName = (name || staticRulesForm.subjectName || '').trim()
  if (!subjectName) return;
  try {
    savingStatic.value = true
    await subjectsStore.saveStaticRule(subjectName, [...staticRulesForm.yearsAllowed], [...staticRulesForm.specialitesAllowed], [...staticRulesForm.groupsAllowed])
  } finally {
    savingStatic.value = false
  }
}

async function removeStatic(name: string) {
  try {
    await subjectsStore.deleteStaticRule(name)
  } catch {}
}

const closeForm = () => {
  showAddForm.value = false;
  editingSubject.value = null;
  resetForm();
};

const resetForm = () => {
  formData.name = '';
  formData.color = '#3B82F6';
  formData.color2 = '#60A5FA';
  formData.gradientAngle = 135;
  formData.colorOpacity = 1;
  formData.color2Opacity = 1;
  formData.useGradient = true;
  formData.yearsAllowed = [];
  formData.groupsAllowed = [];
  formData.specialitesAllowed = [];
};

const editSubject = (subject: Subject) => {
  editingSubject.value = subject;
  formData.name = subject.name;
  formData.color = subject.color;
  formData.color2 = (subject as any).color2 || '#60A5FA';
  formData.gradientAngle = (subject as any).gradientAngle ?? 135;
  formData.colorOpacity = (subject as any).colorOpacity ?? 1;
  formData.color2Opacity = (subject as any).color2Opacity ?? 1;
  // Conserver la dernière valeur de color2 affichée même si le dégradé est désactivé
  formData.useGradient = (subject as any).useGradient ?? !!(subject as any).color2;
  formData.yearsAllowed = Array.isArray((subject as any).yearsAllowed) ? [...(subject as any).yearsAllowed] : [];
  formData.groupsAllowed = Array.isArray((subject as any).groupsAllowed) ? [...(subject as any).groupsAllowed] : [];
  formData.specialitesAllowed = Array.isArray((subject as any).specialitesAllowed) ? [...(subject as any).specialitesAllowed] : [];
};

const handleSubmit = async () => {
  try {
    const payload:any = {
      name: formData.name,
      color: formData.color,
      gradientAngle: formData.gradientAngle,
      colorOpacity: formData.colorOpacity,
      yearsAllowed: formData.yearsAllowed,
      groupsAllowed: formData.groupsAllowed,
      specialitesAllowed: formData.specialitesAllowed,
    };
    if (formData.useGradient) {
      payload.color2 = formData.color2;
      payload.color2Opacity = formData.color2Opacity;
      payload.useGradient = true;
    } else {
      // On n'efface PAS la valeur locale de color2. On persiste la dernière valeur
      // mais on indique au rendu de ne pas l'utiliser
      payload.color2 = (editingSubject.value as any)?.color2 || formData.color2 || null;
      payload.color2Opacity = (editingSubject.value as any)?.color2Opacity ?? formData.color2Opacity ?? undefined;
      payload.useGradient = false;
    }
    if (editingSubject.value) {
      await subjectsStore.updateSubject(editingSubject.value._id!, payload);
    } else {
      await subjectsStore.createSubject(payload);
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
  try { await subjectsStore.fetchStaticRules(); } catch {}
});

// Recharger les matières si elles ne sont pas chargées et que le store n'est pas initialisé
watch(() => [subjectsStore.subjects, subjectsStore.initialized], ([newSubjects, initialized]) => {
  if (Array.isArray(newSubjects) && newSubjects.length === 0 && !subjectsStore.loading && !initialized) {
    // Si aucune matière n'est chargée, qu'on n'est pas en train de charger et que le store n'est pas initialisé
    subjectsStore.initializeStore();
  }
}, { immediate: true });

// Helpers pour l'aperçu
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '');
  return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : null;
}
function rgbaColor(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex || '#000000';
  const a = typeof alpha === 'number' ? Math.min(1, Math.max(0, alpha)) : 1;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a})`;
}
const gradientPreview = computed(() => {
  const c1 = rgbaColor(formData.color, formData.colorOpacity);
  if (!formData.useGradient) return c1;
  const c2 = rgbaColor(formData.color2, formData.color2Opacity);
  return `linear-gradient(${formData.gradientAngle || 0}deg, ${c1}, ${c2})`;
});

function subjectGradient(s: any): string | null {
  if (s && s.useGradient && s.color2) {
    const c1 = rgbaColor(s.color || '#000000', s.colorOpacity ?? 1);
    const c2 = rgbaColor(s.color2 || '#000000', s.color2Opacity ?? 1);
    const angle = typeof s.gradientAngle === 'number' ? s.gradientAngle : 135;
    return `linear-gradient(${angle}deg, ${c1}, ${c2})`;
  }
  return null;
}
function subjectCardStyle(s: any) {
  const gradient = subjectGradient(s);
  return gradient
    ? { borderLeftColor: s.color, background: gradient }
    : { borderLeftColor: s.color };
}
function subjectColorStyle(s: any) {
  const gradient = subjectGradient(s);
  return gradient ? { background: gradient } : { backgroundColor: s.color };
}
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
