<template>
  <div class="forgot-overlay">
    <div class="forgot-popup">
      <button class="close-btn" @click="close">✕</button>
      <h2>Réinitialiser le mot de passe</h2>
      <form v-if="!stepReset" @submit.prevent="handleCheck">
        <input v-model="username" placeholder="Identifiant" required />
        <div v-if="questions.length" class="questions-section">
          <div v-for="(q, i) in questions" :key="i" class="question-row">
            <label>{{ q.question }}</label>
            <input v-model="q.answer" type="text" placeholder="Votre réponse" required />
          </div>
        </div>
        <button type="submit" :disabled="loading">{{ loading ? 'Vérification...' : 'Valider' }}</button>
        <div v-if="error" class="error">{{ error }}</div>
      </form>
      <form v-else @submit.prevent="handleReset">
        <input v-model="newPassword" type="password" placeholder="Nouveau mot de passe (min. 8)" required class="new-password-input" />
        <button type="submit" :disabled="loading">{{ loading ? 'Réinitialisation...' : 'Réinitialiser' }}</button>
        <div v-if="error" class="error">{{ error }}</div>
      </form>
      <div v-if="showAdminMsg" class="admin-msg">Contactez l'administration.</div>
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue';
import { API_URL } from '@/api';

const emit = defineEmits(['close', 'reset-success']);
const username = ref('');
const questions = ref([]); // [{question, answer}]
const loading = ref(false);
const error = ref('');
const stepReset = ref(false);
const newPassword = ref('');
const showAdminMsg = ref(false);

async function handleCheck() {
  error.value = '';
  showAdminMsg.value = false;
  loading.value = true;
  
  try {
    if (!questions.value.length) {
      // Première étape : récupérer les questions
      const res = await fetch(`${API_URL}/users/forgot-password/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.value })
      });
      
      if (!res.ok) {
        const data = await res.json();
        error.value = data.message || 'Identifiant inconnu';
        return;
      }
      
      const data = await res.json();
      questions.value = data.questions.map(q => ({ question: q.question, answer: '' }));
    } else {
      // Deuxième étape : vérifier les réponses
      const answers = questions.value.map(q => q.answer);
      const res = await fetch(`${API_URL}/users/forgot-password/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.value, answers })
      });
      
      const data = await res.json();
      if (res.ok && data.success) {
        stepReset.value = true;
      } else {
        error.value = data.message || 'Réponses incorrectes';
      }
    }
  } catch (e) {
    error.value = 'Erreur réseau';
  } finally {
    loading.value = false;
  }
}

async function handleReset() {
  error.value = '';
  loading.value = true;
  
  // Validation côté frontend
  if (!newPassword.value || newPassword.value.length < 8) {
    error.value = 'Le mot de passe doit contenir au moins 8 caractères';
    loading.value = false;
    return;
  }
  
  try {
    console.log('Envoi de la requête de réinitialisation:', {
      username: username.value,
      newPassword: newPassword.value,
      passwordLength: newPassword.value.length
    });
    
    const res = await fetch(`${API_URL}/users/forgot-password/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.value, newPassword: newPassword.value })
    });
    
    const data = await res.json();
    if (res.ok && data.success) {
      emit('reset-success', { username: username.value, newPassword: newPassword.value });
      close();
    } else {
      error.value = data.message || 'Erreur lors de la réinitialisation';
    }
  } catch (e) {
    console.error('Erreur lors de la réinitialisation:', e);
    error.value = 'Erreur réseau';
  } finally {
    loading.value = false;
  }
}

function close() {
  emit('close');
}
</script>
<style scoped>
.forgot-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.18);
  z-index: 4000;
  display: flex; align-items: center; justify-content: center;
  font-family: 'Cobe Heavy', Inter, sans-serif !important;
}
.forgot-popup {
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 2px 24px #0003;
  padding: 36px 32px 28px 32px;
  min-width: 320px;
  max-width: 90vw;
  position: relative;
  text-align: center;
  font-family: 'Cobe Heavy', Inter, sans-serif !important;
}
.forgot-popup h2 {
  color: #111;
  font-family: 'Cobe Heavy', Inter, sans-serif !important;
  font-size: 1.7em;
  margin-bottom: 20px;
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
.questions-section {
  margin-top: 20px;
}

.question-row {
  margin-bottom: 18px;
  text-align: left;
  font-family: 'Cobe Heavy', Inter, sans-serif !important;
}
.question-row label {
  display: block;
  margin-top: 20px;
  margin-bottom: 4px;
  font-family: 'Cobe Heavy', Inter, sans-serif !important;
  color: #111;
}
.question-row input {
  width: 100%;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  margin-bottom: 6px;
  font-size: 1em;
  font-family: 'Cobe Heavy', Inter, sans-serif !important;
  color: #111;
}
input {
  font-family: 'Cobe Heavy', Inter, sans-serif !important;
  font-size: 1em;
}

.new-password-input {
  width: 89%;
  max-width: 230px;
}
button[type="submit"] {
  background: #6366f1;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 0;
  cursor: pointer;
  font-size: 1.1rem;
  width: 50%;
  margin-top: 25px;
  transition: background 0.2s;
  font-family: 'Cobe Heavy', Inter, sans-serif !important;
}
button[type="submit"]:hover {
  background: #4f46e5;
}
.error {
  color: #ef4444;
  margin-top: 10px;
  font-family: 'Cobe Heavy', Inter, sans-serif !important;
}
.admin-msg {
  color: #2563eb;
  margin-top: 16px;
  font-weight: bold;
  font-family: 'Cobe Heavy', Inter, sans-serif !important;
}
</style> 