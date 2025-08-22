<template>
  <div class="secret-questions-overlay">
    <div class="secret-questions-popup">
      <button class="close-btn" @click="close">✕</button>
      <h2>Définir vos questions secrètes</h2>
      <div class="warning-text">
        ⚠️ Veuillez choisir des questions et des réponses sérieuses et mémorisables. Ces informations sont très importantes : elles serviront à vérifier votre identité si vous devez réinitialiser votre mot de passe.
      </div>
      <form @submit.prevent="handleSave">
        <div v-for="(q, i) in questions" :key="i" class="question-row">
          <label :for="'q'+i">Question {{ i+1 }}</label>
          <select v-model="q.question" :id="'q'+i">
            <option disabled value="">Choisissez une question...</option>
            <option v-for="option in filteredOptions(i)" :key="option" :value="option">{{ option }}</option>
          </select>
          <input v-model="q.answer" type="text" placeholder="Votre réponse" :required="!!q.question" />
        </div>
        <button type="submit" :disabled="loading">Valider</button>
      </form>
      <div v-if="error" class="error">{{ error }}</div>
    </div>
    <SuccessModal :show="showSuccess" message="Vos questions secrètes ont bien été enregistrées." @close="closeSuccess" />
  </div>
</template>
<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { API_URL } from '@/api';
import SuccessModal from './SuccessModal.vue';
const emit = defineEmits(['save']);
const props = defineProps({
  username: {
    type: String,
    required: true
  }
});
const questionOptions = [
  "Quel est le nom de votre premier animal ?",
  "Quel est le prénom de votre mère ?",
  "Quelle est votre ville de naissance ?",
  "Quel est votre film préféré ?",
  "Quel est le nom de votre école primaire ?"
];
const questions = ref([
  { question: '', answer: '' },
  { question: '', answer: '' },
  { question: '', answer: '' }
]);
const loading = ref(false);
const error = ref('');
const showSuccess = ref(false);

function filteredOptions(index) {
  // Retourne les options qui ne sont pas déjà sélectionnées dans les autres selects
  const selected = questions.value.map((q, i) => i !== index ? q.question : null).filter(Boolean);
  return questionOptions.filter(opt => !selected.includes(opt));
}
async function handleSave() {
  // On ne garde que les questions/réponses remplies
  const filled = questions.value.filter(q => q.question && q.answer);
  if (filled.length === 0) {
    error.value = 'Veuillez remplir au moins une question et sa réponse.';
    return;
  }
  // Vérifie unicité (précaution supplémentaire)
  const uniqueQuestions = new Set(filled.map(q => q.question));
  if (uniqueQuestions.size !== filled.length) {
    error.value = 'Chaque question doit être unique.';
    return;
  }
  loading.value = true;
  error.value = '';
  
  try {
    const response = await fetch(`${API_URL}/users/secret-questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: props.username,
        secretQuestions: filled
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      showSuccess.value = true;
    } else {
      error.value = data.message || 'Erreur lors de la sauvegarde des questions secrètes';
    }
  } catch (err) {
    error.value = 'Erreur réseau lors de la sauvegarde';
    console.error('Erreur sauvegarde questions secrètes:', err);
  } finally {
    loading.value = false;
  }
}

function closeSuccess() {
  showSuccess.value = false;
  emit('save', questions.value.filter(q => q.question && q.answer));
}

function close() {
  // Ferme simplement la popup sans connecter l'utilisateur
  emit('close');
}

onMounted(() => {
  // Désactive le scroll du body
  document.body.style.overflow = 'hidden';
  
  // Empêche le scroll de l'arrière-plan sur mobile
  const preventScroll = (e) => {
    // Permet le scroll si l'événement vient de la popup
    if (e.target.closest('.secret-questions-popup')) {
      return;
    }
    // Empêche le scroll pour tout le reste
    e.preventDefault();
    e.stopPropagation();
  };
  
  // Ajoute les listeners pour empêcher le scroll
  document.addEventListener('touchmove', preventScroll, { passive: false });
  document.addEventListener('scroll', preventScroll, { passive: false });
  
  // Stocke la fonction pour la nettoyer plus tard
  window.preventScrollHandler = preventScroll;
});

onUnmounted(() => {
  // Réactive le scroll du body
  document.body.style.overflow = '';
  
  // Nettoie les listeners
  if (window.preventScrollHandler) {
    document.removeEventListener('touchmove', window.preventScrollHandler);
    document.removeEventListener('scroll', window.preventScrollHandler);
    delete window.preventScrollHandler;
  }
});
</script>
<style scoped>
.secret-questions-popup,
.secret-questions-popup *,
.secret-questions-popup label,
.secret-questions-popup input,
.secret-questions-popup select,
.secret-questions-popup textarea,
.secret-questions-popup button,
.secret-questions-popup h2,
.secret-questions-popup .warning-text,
.secret-questions-popup .error {
  color: #000 !important;
}

.secret-questions-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.18);
  z-index: 4000;
  display: flex; align-items: center; justify-content: center;
  /* Empêche le scroll de l'arrière-plan */
  overscroll-behavior: contain;
  touch-action: none;
  overflow: hidden;
}
.secret-questions-popup {
  background: #fff;
  /* border-radius: 18px; */
  box-shadow: 0 2px 24px #0003;
  padding: 36px 32px 28px;
  min-width: 320px;
  /* max-width: 60vw; */
  position: relative;
  text-align: center;
  font-family: 'Cobe Heavy', Inter, sans-serif;
  max-height: 90vh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-y;
}
.secret-questions-popup input,
.secret-questions-popup select,
.secret-questions-popup button[type="submit"] {
  font-family: 'Cobe Heavy', Inter, sans-serif !important;
}
.secret-questions-popup button[type="submit"] {
  color: #fff !important;
}
@media (max-width: 320px) {
  .secret-questions-popup {
    min-width: 0;
    width: 100vw;
    max-width: 100vw;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
    padding: 60px 16px 24px 16px; /* Plus d'espace en haut */
    box-sizing: border-box;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    touch-action: pan-y;
    display: flex;
    flex-direction: column;
  }
  
  .secret-questions-popup form {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  
  .secret-questions-popup button[type="submit"] {
    margin-top: auto;
    margin-bottom: 20px;
  }
  
  .close-btn {
    top: 80px; /* Position beaucoup plus basse pour être visible */
    right: 20px;
    font-size: 1.8em; /* Croix plus grande */
    z-index: 10; /* S'assurer qu'elle est au-dessus du contenu */
  }
  
  .secret-questions-popup h2 {
    margin-top: 0;
    margin-bottom: 20px; /* Plus d'espace après le titre */
    font-size: 1.8em; /* Titre plus grand */
  }
}
.close-btn {
  position: absolute;
  top: 12px;
  right: 16px;
  background: none;
  border: none;
  font-size: 1.5em;
  color: #222;
  cursor: pointer;
}
.question-row {
  margin-bottom: 18px;
  text-align: left;
}
.question-row label {
  display: block;
  margin-bottom: 4px;
}
.question-row select, .question-row input {
  width: 100%;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  margin-bottom: 6px;
  font-size: 1em;
}
button[type="submit"] {
  background: #6366f1;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 0;
  cursor: pointer;
  font-size: 1.1rem;
  width: 100%;
  max-width: 120px;
  margin: 0 auto;
  margin-top: 8px;
  transition: background 0.2s;
}
button[type="submit"]:hover {
  background: #4f46e5;
}
.warning-text {
  background: #fffbe6;
  color: #b45309;
  border: 1px solid #fde68a;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 18px;
  font-size: 1em;
  text-align: left;
}
.error {
  color: #ef4444;
  margin-top: 10px;
}
</style> 