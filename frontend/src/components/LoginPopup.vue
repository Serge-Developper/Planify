<template>
  <div class="login-popup-overlay" @click.self="close">
    <div class="login-popup">
      <button class="close-btn" @click="() => { hoverClose = false; close() }" @mouseover="hoverClose = true" @mouseleave="hoverClose = false">
        <img :src="hoverClose ? closeHoverImg : closeImg" alt="Fermer" class="close-img" />
      </button>
      <h2>Connexion</h2>
      <form @submit.prevent="handleLogin">
        <input v-model="username" placeholder="Identifiant" required />
        <input v-model="password" type="password" placeholder="Mot de passe" required />
        <div class="remember-row">
          <label class="remember-label">
            <input type="checkbox" v-model="rememberMe" />
            Rester connecté
          </label>
        </div>
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
import { ref, defineEmits, watch, onMounted, onUnmounted } from 'vue';
import { API_URL } from '@/api';
import ForgotPasswordPopup from './ForgotPasswordPopup.vue';
import SecretQuestionsSetup from './SecretQuestionsSetup.vue';
import errorSound from '@/assets/son/erreur.mp3'
import closeImg from '@/assets/img/bouton_supprimer_decocher.png'
import closeHoverImg from '@/assets/img/bouton_supprimer_cocher.png'

const emit = defineEmits(['close', 'login-success']);
const username = ref('');
const password = ref('');
const rememberMe = ref(true);
const error = ref('');
const loading = ref(false);
const showForgotPassword = ref(false);
const showSecretQuestionsSetup = ref(false);
let userData = null;
const hoverClose = ref(false);
watch(() => showForgotPassword.value, (v) => { if (v === true) hoverClose.value = false })

function close() {
  emit('close');
  try { document.body.style.overflow = '' } catch (e) {}
}

function openForgotPassword() {
  showForgotPassword.value = true;
}
onMounted(() => {
  try { document.body.style.overflow = 'hidden' } catch (e) {}
});
onUnmounted(() => {
  try { document.body.style.overflow = '' } catch (e) {}
});

async function handleLogin() {
  loading.value = true;
  error.value = '';
  try {
    // Normaliser identifiant/mot de passe: supprimer les espaces
    const cleanUsername = String(username.value || '').replace(/\s+/g, '')
    const cleanPassword = String(password.value || '').replace(/\s+/g, '')
    const res = await fetch(`${API_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: cleanUsername, password: cleanPassword, rememberMe: !!rememberMe.value })
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
        // Laisser le parent décider du stockage (rememberMe)
        emit('login-success', { user: data, password: cleanPassword, rememberMe: rememberMe.value });
        close();
      }
    } else {
      // Erreur du backend (400, 404, etc.)
      error.value = data.message || 'Nom d\'utilisateur ou mot de passe incorrect';
      try { const a = new Audio(errorSound); a.volume = 0.7; a.play().catch(() => {}) } catch {}
    }
  } catch (e) {
    // Erreur réseau ou autre erreur
    if (e.message === 'Erreur réseau') {
      error.value = 'Erreur réseau - Vérifiez votre connexion internet';
    } else {
      error.value = 'Nom d\'utilisateur ou mot de passe incorrect';
    }
    try { const a = new Audio(errorSound); a.volume = 0.7; a.play().catch(() => {}) } catch {}
  } finally {
    loading.value = false;
  }
}

function handleSecretQuestionsSaved() {
  showSecretQuestionsSetup.value = false;
  // Déléguer le stockage au parent selon rememberMe
  emit('login-success', { user: userData, password: String(password.value || '').replace(/\s+/g, ''), rememberMe: rememberMe.value });
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
  overscroll-behavior: contain;
  touch-action: none;
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
  max-height: 90vh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}
.close-btn {
  position: absolute;
  top: 12px;
  right: 16px;
  background: transparent;
  border: none;
  width: 40px;
  height: 40px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  transition: transform 0.25s, filter 0.25s;
}
.close-img {
  width: 32px;
  height: 32px;
  display: block;
  filter: grayscale(0.5) brightness(0.95);
  transition: transform 0.25s, filter 0.25s;
}
.close-btn:hover .close-img {
  transform: scale(1.18);
  filter: grayscale(0) brightness(1.1);
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
  font-size: 1rem;
  width: 100%;
  margin-top: 16px;
  transition: background 0.2s;
  font-family: 'Cobe Heavy', Inter, sans-serif !important;
}
.login-popup button[type="submit"]:hover {
  background: #4f46e5;
}
.remember-row { display: flex; align-items: center; justify-content: flex-start; margin: 6px 0 0 0; }
.remember-label { display: flex; gap: 8px; align-items: center; color: #111; white-space: nowrap; }
.remember-label input[type="checkbox"] { margin: 0; width: 18px; height: 18px; accent-color: #6366f1; border-radius: 6px; cursor: pointer; }
.remember-label input[type="checkbox"]:focus { outline: none; box-shadow: 0 0 0 3px rgba(99,102,241,0.35); }
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