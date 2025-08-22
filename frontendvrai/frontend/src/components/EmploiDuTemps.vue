

<template>
  <div>
    <ListeDevoirs :events="filteredEvents" @refresh-events="reloadEvents" />
    <transition name="slide-fade">
      <div v-if="showLoginWarning" class="popup-overlay-login">
        <div class="popup-content-login">
          <button class="close-btn-login" @click="showLoginWarning = false">✕</button>
          <img src="@/assets/lock.svg" alt="lock" class="lock-icon-popup" />
          <h3>Connectez-vous pour voir vos devoirs</h3>
          <button class="btn-login-popup" @click="openLoginPopup">Se connecter</button>
        </div>
      </div>
    </transition>
    <LoginPopup v-if="showLoginPopup" @close="showLoginPopup = false" @login-success="handleLoginSuccess" />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import axios from 'axios';
import { API_URL } from '@/api';
import ListeDevoirs from './ListeDevoirs.vue'
import LoginPopup from './LoginPopup.vue';

const auth = useAuthStore();
const router = useRouter();
const events = ref([]);
const showLoginPopup = ref(false);
const showLoginWarning = ref(false);

onMounted(async () => {
  showLoginWarning.value = !auth.isLoggedIn;
  if (!auth.isLoggedIn) {
    events.value = [];
    return; // NE PAS faire la requête si non connecté
  }
  try {
    const res = await axios.get(`${API_URL}/events`);
    if (Array.isArray(res.data)) {
      events.value = res.data.map(event => ({
        ...event,
        start: new Date(event.start),
        end: new Date(event.end),
      }));
    }
  } catch (e) {
    events.value = [];
  }
});

const filteredEvents = computed(() => {
  return events.value;
});

async function reloadEvents() {
  try {
    const res = await axios.get(`${API_URL}/events`);
    if (Array.isArray(res.data)) {
      events.value = res.data.map(event => ({
        ...event,
        start: new Date(event.start),
        end: new Date(event.end),
      }));
    }
  } catch (e) {
    events.value = [];
  }
}

function openLoginPopup() {
  showLoginWarning.value = false;
  showLoginPopup.value = true;
}

function handleLoginSuccess(payload) {
  auth.login(payload.user);
  showLoginPopup.value = false;
  showLoginWarning.value = false;
  window.location.reload(); // Recharge la page après connexion
}
</script>

<style>
.popup-overlay-login {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}
.popup-content-login {
  background: #fff;
  border-radius: 18px;
  padding: 40px 36px;
  max-width: 90vw;
  min-height: 120px;
  box-shadow: 0 2px 24px #0003;
  text-align: center;
  color: #111;
  font-family: 'Cobe Heavy', Inter, sans-serif;
  position: relative;
}
.close-btn-login {
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  font-size: 2em;
  color: #222;
  cursor: pointer;
  z-index: 10;
}
.lock-icon-popup {
  width: 80px;
  height: 80px;
  margin-bottom: 18px;
  display: block;
  margin-left: auto;
  margin-right: auto;
}
.btn-login-popup {
  background: #6366f1;
  color: #fff;
  border: none;
  border-radius: 12px;
  padding: 12px 32px;
  font-size: 1.1em;
  margin-top: 24px;
  cursor: pointer;
  font-family: 'Cobe Heavy', Inter, sans-serif;
  transition: background 0.2s;
}
.btn-login-popup:hover {
  background: #4f46e5;
}
.slide-fade-enter-active, .slide-fade-leave-active {
  transition: all 0.4s cubic-bezier(.25,.8,.25,1);
}
.slide-fade-enter-from {
  opacity: 0;
  transform: translateY(-40px);
}
.slide-fade-enter-to {
  opacity: 1;
  transform: translateY(0);
}
.slide-fade-leave-from {
  opacity: 1;
  transform: translateY(0);
}
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-40px);
}
</style>
 