

<template>
  <div>
    <ListeDevoirs :events="filteredEvents" @refresh-events="reloadEvents" />
    <transition name="slide-fade">
      <div v-if="showLoginWarning" class="popup-overlay-login">
        <div class="popup-content-login">
          <button class="close-btn-login" @click="() => { hoverCloseLoginWarn = false; showLoginWarning = false }" @mouseover="hoverCloseLoginWarn = true" @mouseleave="hoverCloseLoginWarn = false">
            <img :src="hoverCloseLoginWarn ? closeHoverImg : closeImg" alt="Fermer" class="close-img" />
          </button>
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
import { API_URL, secureApiCall } from '@/api';
import ListeDevoirs from './ListeDevoirs.vue'
import LoginPopup from './LoginPopup.vue';
import closeImg from '@/assets/img/bouton_supprimer_decocher.png'
import closeHoverImg from '@/assets/img/bouton_supprimer_cocher.png'

const auth = useAuthStore();
const router = useRouter();
const events = ref([]);
const showLoginPopup = ref(false);
const showLoginWarning = ref(false);
const hoverCloseLoginWarn = ref(false);

onMounted(async () => {
  showLoginWarning.value = !auth.isLoggedIn;
  if (!auth.isLoggedIn) {
    events.value = [];
    return; // NE PAS faire la requête si non connecté
  }
  try {
    const res = await secureApiCall('/events');
    if (Array.isArray(res)) {
      events.value = res.map(event => ({
        ...event,
        start: new Date(event.start),
        end: new Date(event.end),
      }));
    }
  } catch (e) {
    console.error('Erreur lors du chargement des événements:', e);
    events.value = [];
  }
});

const filteredEvents = computed(() => {
  return events.value;
});

async function reloadEvents() {
  try {
    const res = await secureApiCall('/events');
    if (Array.isArray(res)) {
      events.value = res.map(event => ({
        ...event,
        start: new Date(event.start),
        end: new Date(event.end),
      }));
    }
  } catch (e) {
    console.error('Erreur lors du rechargement des événements:', e);
    events.value = [];
  }
}

function openLoginPopup() {
  showLoginWarning.value = false;
  showLoginPopup.value = true;
  try { document.body.style.overflow = 'hidden' } catch (e) {}
}

function handleLoginSuccess(payload) {
  auth.login(payload.user);
  showLoginPopup.value = false;
  showLoginWarning.value = false;
  try { document.body.style.overflow = '' } catch (e) {}
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
  overscroll-behavior: contain;
  touch-action: none;
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
  max-height: 90vh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}
.close-btn-login {
  position: absolute;
  top: 16px;
  right: 16px;
  background: transparent;
  border: none;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
}

.close-img { width: 32px; height: 32px; display: block; filter: grayscale(0.5) brightness(0.95); transition: transform 0.25s, filter 0.25s; }
.close-btn-login:hover .close-img { transform: scale(1.18); filter: grayscale(0) brightness(1.1); }
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
 