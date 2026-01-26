<template>
  <div v-if="visible" class="ephemeral-overlay" @click.self="dismiss">
    <div class="ephemeral-popup">
      <button class="close-btn" @click="dismiss" @mouseover="hoverClose = true" @mouseleave="hoverClose = false">
        <img :src="hoverClose ? closeHoverImg : closeImg" alt="Fermer" class="close-img" />
      </button>
      <div class="content" v-html="html"></div>
      <div class="actions">
        <button class="ok-btn" @click="dismiss">OK</button>
      </div>
    </div>
  </div>
  
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { secureApiCall, getValidAuthToken } from '@/api';
import closeImg from '@/assets/img/bouton_supprimer_decocher.png'
import closeHoverImg from '@/assets/img/bouton_supprimer_cocher.png'

const visible = ref(false);
const html = ref('');
const popupId = ref('');
const hoverClose = ref(false);

// Clés de persistance locale
const STORAGE_ID_KEY = 'pendingPopupId';
const STORAGE_HTML_KEY = 'pendingPopupHtml';
// Remplace la déclaration typée par JS simple
// const pollHandle = ref<number | null>(null)
const pollHandle = ref(null)

function loadFromStorage() {
  try {
    const sid = localStorage.getItem(STORAGE_ID_KEY);
    const shtml = localStorage.getItem(STORAGE_HTML_KEY);
    if (sid && shtml) {
      popupId.value = sid;
      html.value = shtml;
      visible.value = true;
    }
  } catch {}
}

async function fetchForMe() {
  try {
    const token = getValidAuthToken();
    if (!token) return; // ne rien faire si non connecté
    const res = await secureApiCall('/popups/for-me', { method: 'GET' });
    if (res && res.id && res.html) {
      popupId.value = String(res.id);
      html.value = String(res.html);
      visible.value = true;
      try {
        localStorage.setItem(STORAGE_ID_KEY, popupId.value);
        localStorage.setItem(STORAGE_HTML_KEY, html.value);
      } catch {}
    }
  } catch (e) {
    // 204 -> pas de contenu
  }
}

function startPolling() {
  if (pollHandle.value !== null) return;
  // Rafraîchit toutes les 30s pour capter les nouvelles annonces
  // pollHandle.value = (setInterval(fetchForMe, 30000) as unknown as number)
  pollHandle.value = setInterval(fetchForMe, 30000)
}

async function dismiss() {
  const id = popupId.value;
  visible.value = false;
  html.value = '';
  try {
    localStorage.removeItem(STORAGE_ID_KEY);
    localStorage.removeItem(STORAGE_HTML_KEY);
  } catch {}
  if (id) {
    try { await secureApiCall(`/popups/ack/${encodeURIComponent(id)}`, { method: 'POST' }); } catch {}
  }
}

onMounted(() => {
  loadFromStorage();
  if (!visible.value) {
    fetchForMe();
  }
  startPolling();
});

onUnmounted(() => {
  if (pollHandle.value !== null) {
    // clearInterval(pollHandle.value as any)
    if (pollHandle.value) {
      clearInterval(pollHandle.value)
      pollHandle.value = null
    }
  }
});
</script>

<style scoped>
.ephemeral-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; z-index: 4000; }
.ephemeral-popup {
    background: #fff;
    border-radius: 18px;
    box-shadow: 0 2px 24px #0003;
    padding: 40px 24px 20px 24px; /* +16px en haut pour dégager la croix */
    min-width: 320px;
    max-width: min(720px, 92vw);
    max-height: 90vh;
    overflow: auto;
    position: relative;
  }
  .content {
    color: #111;
    font-size: 1rem;
    line-height: 1.5;
    padding-right: 56px; /* couloir à droite pour le bouton (40px) */
  }
.actions { margin-top: 16px; text-align: right; }
.ok-btn { background: #16a34a; color: #fff; border: none; border-radius: 10px; padding: 10px 18px; cursor: pointer; font-family: 'Cobe Heavy', Inter, sans-serif !important; }
.ok-btn:hover { background: #15803d; }
.close-btn { position: absolute; top: 10px; right: 12px; background: transparent; border: none; width: 40px; height: 40px; padding: 0; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 10; transition: transform 0.25s, filter 0.25s; }
.close-img { width: 28px; height: 28px; display: block; filter: grayscale(0.5) brightness(0.95); transition: transform 0.25s, filter 0.25s; }
.close-btn:hover .close-img { transform: scale(1.18); filter: grayscale(0) brightness(1.1); }
</style>


