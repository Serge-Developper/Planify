<template>
  <div class="login-popup-overlay" @click.self="close">
    <div class="login-popup">
      <button class="close-btn" @click="close">✕</button>
      <h2>Connexion</h2>
      <form @submit.prevent="handleLogin">
        <input v-model="username" placeholder="Identifiant" required />
        <input v-model="password" type="password" placeholder="Mot de passe" required />
        <button type="submit" :disabled="loading">{{ loading ? 'Connexion...' : 'Se connecter' }}</button>
        <div v-if="error" class="error">{{ error }}</div>
      </form>
      <div class="forgot-password-link">
        <a href="#" @click.prevent="openForgotPassword">Mot de passe oublié&nbsp;?</a>
      </div>
    </div>
  </div>
  <ForgotPasswordPopup v-if="showForgotPassword" @close="showForgotPassword = false" />
  <SecretQuestionsSetup v-if="showSecretQuestionsSetup" :username="username" @save="handleSecretQuestionsSaved" @close="handleSecretQuestionsClose" />
</template>

<script setup>
import { ref, defineEmits } from 'vue';
import { API_URL } from '@/api';
import ForgotPasswordPopup from './ForgotPasswordPopup.vue';
import SecretQuestionsSetup from './SecretQuestionsSetup.vue';

const emit = defineEmits(['close', 'login-success']);
const username = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);
const showForgotPassword = ref(false);
const showSecretQuestionsSetup = ref(false);
let userData = null;

function close() {
  emit('close');
}

function openForgotPassword() {
  showForgotPassword.value = true;
}

async function handleLogin() {
  loading.value = true;
  error.value = '';
  try {
    const res = await fetch(`${API_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.value, password: password.value })
    });
    
    // Essayer de récupérer la réponse JSON
    let data;
    try {
      data = await res.json();
    } catch (jsonError) {
      // Si on ne peut pas parser le JSON, c'est probablement une erreur réseau
      throw new Error('Erreur réseau');
    }
    
    if (res.ok && data) {
      userData = data; // Stocke temporairement les données
      if (!data.hasSecretQuestions) {
        showSecretQuestionsSetup.value = true;
        // NE PAS stocker dans localStorage ici - attendre que les questions soient définies
      } else {
        // Seulement stocker dans localStorage si l'utilisateur a déjà des questions secrètes
        localStorage.setItem('user', JSON.stringify(data));
        emit('login-success', { user: data, password: password.value });
        close();
      }
    } else {
      // Erreur du backend (400, 404, etc.)
      error.value = data.message || 'Nom d\'utilisateur ou mot de passe incorrect';
    }
  } catch (e) {
    // Erreur réseau ou autre erreur
    if (e.message === 'Erreur réseau') {
      error.value = 'Erreur réseau - Vérifiez votre connexion internet';
    } else {
      error.value = 'Nom d\'utilisateur ou mot de passe incorrect';
    }
  } finally {
    loading.value = false;
  }
}

function handleSecretQuestionsSaved() {
  showSecretQuestionsSetup.value = false;
  // Maintenant on peut stocker dans localStorage car les questions secrètes sont définies
  localStorage.setItem('user', JSON.stringify(userData));
  emit('login-success', { user: userData, password: password.value });
  close();
}

function handleSecretQuestionsClose() {
  showSecretQuestionsSetup.value = false;
}
</script>

<style scoped>
.login-popup-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
  font-family: 'Cobe Heavy', Inter, sans-serif !important;
}
.login-popup {
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
.login-popup h2 {
  margin-bottom: 18px;
  color: #111;
  font-size: 2em;
}
.login-popup input {
  display: block;
  width: 100%;
  margin-bottom: 16px;
  padding: 10px 16px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  font-size: 1rem;
  font-family: 'Cobe Heavy', Inter, sans-serif !important;
}
.login-popup button[type="submit"] {
  background: #6366f1;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 0;
  cursor: pointer;
  font-size: 1.1rem;
  width: 100%;
  margin-top: 8px;
  transition: background 0.2s;
  font-family: 'Cobe Heavy', Inter, sans-serif !important;
}
.login-popup button[type="submit"]:hover {
  background: #4f46e5;
}
.error {
  color: #ef4444;
  margin-top: 10px;
}
.forgot-password-link {
  margin-top: 10px;
  text-align: center;
}
.forgot-password-link a {
  color: #2563eb;
  text-decoration: underline;
  font-size: 1em;
  cursor: pointer;
  font-family: 'Cobe Heavy', Inter, sans-serif !important;
}
.forgot-password-link a:hover {
  color: #1d4ed8;
}
</style> 