<template>
  <div>
    <ListeDevoirs 
      v-if="events.length > 0 || !loading" 
      :events="events" 
      @refresh-events="loadEvents"
    />
    <div v-else-if="loading" class="loading">
      Chargement des devoirs...
    </div>
    <div v-else class="no-events">
      Aucun devoir trouvé
    </div>

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
import { ref, onMounted } from 'vue'
import axios from 'axios'
import ListeDevoirs from '@/components/ListeDevoirs.vue'
import { API_URL, secureApiCall } from '@/api'
import { useAuthStore } from '@/stores/auth'
import LoginPopup from '@/components/LoginPopup.vue'
import closeImg from '@/assets/img/bouton_supprimer_decocher.png'
import closeHoverImg from '@/assets/img/bouton_supprimer_cocher.png'

const events = ref([])
const loading = ref(true)
const authStore = useAuthStore()
const showLoginWarning = ref(false)
const showLoginPopup = ref(false)
const hoverCloseLoginWarn = ref(false)

const loadEvents = async () => {
  try {
    loading.value = true
    if (!authStore.isLoggedIn) {
      showLoginWarning.value = true
      events.value = []
      return
    }
    // Utiliser l'appel sécurisé qui injecte le token
    const res = await secureApiCall('/events')
    const raw = Array.isArray(res) ? res : (Array.isArray(res?.events) ? res.events : [])
    const userId = authStore.user?.id || authStore.user?._id
    const userYear = authStore.user?.year || ''
    const userGroup = authStore.user?.groupe || ''

    // Normaliser pour ListeDevoirs (champs FR)
    const normalized = raw.map(e => {
      const titre = e.titre ?? e.title ?? ''
      const matiere = e.matiere ?? e.subject ?? ''
      const date = e.date ?? (e.dueDate ? new Date(e.dueDate).toISOString().slice(0,10) : '')
      const heure = e.heure ?? ''
      let type = (e.type ?? '').toLowerCase()
      // Harmoniser sur 'exam' pour rester cohérent avec ListeDevoirs
      if (type === 'examen') type = 'exam'
      if (!type) type = 'devoir'
      const checked = Array.isArray(e.checkedBy) ? e.checkedBy.some((id) => String(id) === String(userId)) : !!e.isCompleted
      const archived = Array.isArray(e.archivedBy) ? e.archivedBy.some((id) => String(id) === String(userId)) : false
      const hidden = Array.isArray(e.hiddenBy) ? e.hiddenBy.some((id) => String(id) === String(userId)) : false
      return {
        _id: e._id,
        titre,
        matiere,
        date,
        heure,
        type,
        groupe: e.groupe ?? 'Promo',
        groupes: Array.isArray(e.groupes) ? e.groupes : [],
        year: e.year ?? '',
        description: e.description ?? '',
        createdBy: e.createdBy || e.userId || '',
        checked,
        archived,
        hidden,
      }
    })

    // Filtre de sécurité côté client (en plus du backend) : année et groupe
    const role = (authStore.user && authStore.user.role) || ''
    if (role === 'admin' || role === 'prof') {
      // Admin/Prof : voient tout sans filtrage côté client
      events.value = normalized
    } else {
      // Élèves : filtrage année + groupe
      events.value = normalized.filter(ev => {
        const okYear = !ev.year || !userYear || ev.year === userYear
        const allowedGroups = new Set([userGroup, 'Promo'])
        const okGroup = allowedGroups.has(ev.groupe) || ev.groupes.some(g => allowedGroups.has(g))
        return okYear && okGroup
      })
    }
  } catch (error) {
    console.error('Erreur lors du chargement des events:', error)
    events.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (!authStore.isLoggedIn) {
    showLoginWarning.value = true
    loading.value = false
    events.value = []
  } else {
    loadEvents()
  }
})

function openLoginPopup() {
  showLoginWarning.value = false
  showLoginPopup.value = true
  try { document.body.style.overflow = 'hidden' } catch (e) {}
}

function handleLoginSuccess(payload) {
  authStore.login(payload.user)
  showLoginPopup.value = false
  showLoginWarning.value = false
  try { document.body.style.overflow = '' } catch (e) {}
  loadEvents()
}
</script>

<style scoped>
.loading, .no-events {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: 1.2em;
  color: #666;
}

.loading {
  font-family: 'Cobe Heavy', Inter, sans-serif;
}

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
.lock-icon-popup { width: 80px; height: 80px; margin-bottom: 18px; display: block; margin-left: auto; margin-right: auto; }
.btn-login-popup { background: #6366f1; color: #fff; border: none; border-radius: 12px; padding: 12px 32px; font-size: 1.1em; margin-top: 24px; cursor: pointer; font-family: 'Cobe Heavy', Inter, sans-serif; transition: background 0.2s; }
.btn-login-popup:hover { background: #4f46e5; }
.slide-fade-enter-active, .slide-fade-leave-active { transition: all 0.4s cubic-bezier(.25,.8,.25,1); }
.slide-fade-enter-from { opacity: 0; transform: translateY(-40px); }
.slide-fade-enter-to { opacity: 1; transform: translateY(0); }
.slide-fade-leave-from { opacity: 1; transform: translateY(0); }
.slide-fade-leave-to { opacity: 0; transform: translateY(-40px); }
</style>