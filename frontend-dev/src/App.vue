<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import { ref, onMounted, watch, onUnmounted } from 'vue'
import Navbar from './components/Navbar.vue'
import Footer from './components/Footer.vue'
import ItemReceivedPopup from './components/ItemReceivedPopup.vue'
import { useCoinsStore } from './stores/coins'
import { useAuthStore } from './stores/auth'
import { secureApiCall, getValidAuthToken } from './api'
import questsLogo from '@/assets/Quetes.svg'

const route = useRoute();
const coinsStore = useCoinsStore();
const authStore = useAuthStore();

// État pour la popup de notification d'items reçus
const showItemReceivedPopup = ref(false);
const currentItems = ref<any[]>([]);
const currentAdminMessage = ref('');

const questToasts = ref<{ id: number, title: string, reward: number, type: 'quest'|'task'|'achievement', questId?: string, desc?: string }[]>([])
const TWO_LINE_IDS = new Set<string>(['leaderboard-profile', 'task-info-3'])
function normalizeTitle(s: string) { return String(s || '').toLowerCase().replace(/[“”"'’]/g,'"').replace(/\s+/g,' ') }
function isTwoLine(t: any) { if (!t || t.type !== 'quest') return false; const id = String((t && t.questId) || ''); if (id && TWO_LINE_IDS.has(id)) return true; const n = normalizeTitle(t.title); return (n.includes('plus d"infos') && n.includes('3 tâches')) || (n.includes('leaderboard') && n.includes('profil')) }
function isNarrow(t: any) { if (!isTwoLine(t)) return false; const id = String((t && t.questId) || ''); if (id === 'task-info-3') return true; const n = normalizeTitle(t.title); return n.includes('plus d"infos') && n.includes('3 tâches') }
function isWide(t: any) { if (!isTwoLine(t)) return false; const id = String((t && t.questId) || ''); if (id === 'leaderboard-profile') return true; const n = normalizeTitle(t.title); return n.includes('leaderboard') }
function showGlobalToast(type: 'quest'|'task', title: string, reward = 0, questId?: string) {
  const id = Date.now() + Math.random()
  questToasts.value.push({ id, title, reward, type, questId })
  setTimeout(() => { questToasts.value = questToasts.value.filter(x => x.id !== id) }, 4500)
}
function handleQuestCompleted(e: any) { const d = (e && e.detail) || {}; const r = Number(d.reward) || 0; showGlobalToast('quest', d.title || 'Quête', r, String(d.id || '')); try { coinsStore.addCoins(r, { reason: 'daily-quest' }) } catch {} try { localStorage.setItem('questsProgressVersion', String(Date.now())) } catch {} setTimeout(() => { try { loadAchievementsStatus(false) } catch {} }, 50) }
function handleTaskCompleted(e: any) { const d = (e && e.detail) || {}; showGlobalToast('task', d.title || 'Tâche', Number(d.reward) || 0); try { loadAchievementsStatus(false) } catch {} }
function handleWheelSpun() { try { localStorage.setItem('questsProgressVersion', String(Date.now())) } catch {} setTimeout(() => { try { loadAchievementsStatus(false) } catch {} }, 50) }

function showAchToast(title: string, desc: string) {
  const id = Date.now() + Math.random()
  questToasts.value.push({ id, title, reward: 0, type: 'achievement', desc })
  setTimeout(() => { questToasts.value = questToasts.value.filter(x => x.id !== id) }, 4500)
}
const achievementsCatalog = [
  { id: 'ach-first-quest', title: 'Premier pas', description: 'Compléter votre première quête' },
  { id: 'ach-wheel-once', title: 'Début de la chance', description: 'Tourner la roue une fois' },
  { id: 'ach-task-streak', title: 'Routine héroïque', description: 'Valider des tâches sur plusieurs jours' },
  { id: 'wheel-first-loss', title: 'Début de la malchance', description: 'Perdre à la roue de la fortune pour la première fois' },
  { id: 'wheel-lose-30', title: 'Chanceux d’être malchanceux', description: 'Perdre 30 fois à la roue de la fortune' },
  { id: 'wheel-weekend-lose-2', title: 'Week-end maudit', description: 'Perdre deux fois à la roue de la fortune le week-end' },
  { id: 'wheel-spin-10', title: 'Chance montante', description: 'Tourner la roue de la fortune 10 fois' },
  { id: 'wheel-spin-50', title: 'Accro de la roue', description: 'Tourner la roue de la fortune 50 fois' },
  { id: 'wheel-spin-100', title: 'Maître de la fortune', description: 'Tourner la roue de la fortune 100 fois' },
  { id: 'wheel-weekend-spin-2', title: 'Un week-end souriant', description: 'Tourner la roue de la fortune deux fois durant le week-end' },
  { id: 'tasks-validate-10', title: 'Apprenti organisé', description: 'Valider 10 tâches' },
  { id: 'tasks-validate-50', title: 'Productivité en marche', description: 'Valider 50 tâches' },
  { id: 'tasks-validate-100', title: 'Machine à accomplir', description: 'Valider 100 tâches' },
  { id: 'tasks-validate-250', title: 'Légende de la productivité', description: 'Valider 250 tâches' },
  { id: 'tasks-info-multi', title: 'Curieux de nature', description: 'Cliquer sur “Plus d’infos” sur plusieurs tâches différentes' },
  { id: 'tasks-details-10', title: 'Observateur attentif', description: 'Consulter les détails de 10 tâches' },
  { id: 'tasks-details-25', title: 'Expert en organisation', description: 'Consulter les détails de 25 tâches' },
  { id: 'daily-complete-5', title: 'Rituel quotidien', description: 'Compléter 5 quêtes journalières' },
  { id: 'daily-complete-15', title: 'Habitude solide', description: 'Compléter 15 quêtes journalières' },
  { id: 'daily-complete-30', title: 'Discipline absolue', description: 'Compléter 30 quêtes journalières' },
  { id: 'daily-complete-50', title: 'Maître des quêtes journalières', description: 'Compléter 50 quêtes journalières' },
  { id: 'daily-no-reroll', title: 'No re-roll', description: 'Compléter les 3 quêtes journalières sans utiliser de re-roll' },
  { id: 'repeat-complete-5', title: 'Persévérance', description: 'Compléter 5 quêtes répétables' },
  { id: 'repeat-complete-20', title: 'Toujours plus loin', description: 'Compléter 20 quêtes répétables' },
  { id: 'repeat-complete-50', title: 'Infatigable', description: 'Compléter 50 quêtes répétables' },
  { id: 'repeat-complete-100', title: 'Inarrêtable', description: 'Compléter 100 quêtes répétables' },
  { id: 'reroll-used', title: 'Deuxième chance', description: 'Utiliser un re-roll' },
  { id: 'faction-join', title: 'Nouveau membre', description: 'Rejoindre une faction' },
  { id: 'homework-propose-5', title: 'Petit professeur', description: 'Proposer 5 devoirs' },
  { id: 'homework-propose-20', title: 'Prof en herbe', description: 'Proposer 20 devoirs' },
  { id: 'homework-propose-50', title: 'Maître des devoirs', description: 'Proposer 50 devoirs' },
  { id: 'cosmetics-border-all', title: 'Collectionneur de cadres', description: 'Avoir toutes les couleurs de bordure' },
  { id: 'cosmetics-item-3styles', title: 'Styliste ultime', description: 'Avoir un item avec 3 styles différents' }
]
const ACH_BY_ID = new Map(achievementsCatalog.map(x => [x.id, x]))
const seenAch = ref(new Set<string>())
function getAchSeenKey() {
  try {
    const uid = String(authStore?.user?._id || authStore?.user?.id || authStore?.user?.username || '').trim()
    return uid ? 'achSeen:' + uid : 'achSeen'
  } catch {
    return 'achSeen'
  }
}
function loadSeenFromStorage() {
  try {
    const raw = localStorage.getItem(getAchSeenKey()) || '[]'
    const arr = JSON.parse(raw)
    seenAch.value = new Set(Array.isArray(arr) ? arr.map(String) : [])
  } catch {
    seenAch.value = new Set<string>()
  }
}
function persistSeen() { try { localStorage.setItem(getAchSeenKey(), JSON.stringify(Array.from(seenAch.value))) } catch {} }
function handleAchievementUnlocked(e: any) {
  const d = (e && e.detail) || {}
  const id = String(d.id || '')
  if (!id) return
  // Afficher immédiatement le succès signalé par l'événement (déblocage en direct),
  // puis marquer comme "vu" pour éviter toute duplication ultérieure.
  const ref = ACH_BY_ID.get(id)
  const title = d.title || (ref ? ref.title : 'Succès')
  const desc = d.description || (ref ? ref.description : '')
  showAchToast(title, desc)
  seenAch.value.add(id)
  persistSeen()
}
async function loadAchievementsStatus(initial = false) {
  try {
    const r: any = await secureApiCall('/quests/achievements')
    const list: string[] = Array.isArray(r?.achievements) ? r.achievements.map(String) : []
    const prev = new Set(Array.from(seenAch.value))
    if (initial) { seenAch.value = new Set(list); persistSeen(); return }
    for (const id of list) {
      if (!prev.has(id)) {
        seenAch.value.add(id)
        const ref = ACH_BY_ID.get(id)
        showAchToast(ref ? ref.title : 'Succès', ref ? ref.description : '')
      }
    }
    persistSeen()
  } catch {}
}

// Ouvre la popup cadeau à la demande (sans message)
function handleOpenItemReceived(e: any) {
  const detail = (e && e.detail) || {}
  const items = Array.isArray(detail.items) ? detail.items : []
  currentItems.value = items
  currentAdminMessage.value = '' // pas de message Planify
  showItemReceivedPopup.value = true
}

function getBgClass() {
  if (route.path === '/') return 'bg-accueil';
  if (route.path.startsWith('/devoir') || route.path.startsWith('/liste')) return 'bg-gris';
  return 'bg-accueil'; // fallback
}

// Fonction pour vérifier les nouveaux items (avec ou sans message)
async function checkForNewItemsWithMessages() {
  if (!authStore.user) return;
  // Ne garder que les items offerts par un admin et non encore lus
  const unread = (coinsStore.purchasedItems || []).filter((pi: any) => pi && pi.adminGiftRead === false && Number(pi.itemId) !== 0)
  if (!unread.length) return

  // Normaliser vers { id, name, colorId? }
  let list: any[] = unread.map((it: any) => ({ id: Number(it.itemId), name: it.itemName, colorId: (it as any).colorId || null }))

  // Enrichir avec les items dynamiques (créés via Admin Editor)
  try {
    const res: any = await secureApiCall('/items')
    if (res && res.success && Array.isArray(res.items)) {
      const byId = new Map<number, any>()
      for (const it of res.items) {
        if (typeof it.legacyId !== 'undefined') byId.set(Number(it.legacyId), it)
        if (typeof it.id === 'number') byId.set(Number(it.id), it)
      }
      list = list.map((lite) => {
        const dyn = byId.get(Number(lite.id))
        if (dyn) {
          return {
            id: Number(dyn.legacyId),
            name: dyn.name,
            isDynamic: true,
            // assets au niveau racine si présents
            assets: Array.isArray(dyn.assets) ? dyn.assets : [],
            // >>> IMPORTANT: inclure aussi les variantes (où se trouvent souvent les styles)
            variants: Array.isArray(dyn.variants)
              ? dyn.variants.map((v: any) => ({
                  name: v?.name || 'Style',
                  assets: Array.isArray(v?.assets) ? v.assets : [],
                  backgrounds: v?.backgrounds || {},
                  textOnly: !!v?.textOnly,
                  textContent: v?.textContent || ''
                }))
              : [],
            backgrounds: dyn.backgrounds || {}
          }
        }
        return lite
      })
    }
  } catch {}

  currentItems.value = list

  // Message: s'il y en a un, prendre celui du premier item qui en possède
  const withMsg = unread.find((it: any) => Number(it.itemId) !== 0 && typeof it.adminMessage === 'string' && it.adminMessage.trim().length > 0)
  currentAdminMessage.value = withMsg && typeof withMsg.adminMessage === 'string' ? withMsg.adminMessage : ''

  showItemReceivedPopup.value = true
}

// Note: Pas de watch sur purchasedItems pour éviter d'ouvrir la pop-up
// lors d'actions locales (équiper/déséquiper/achat). La vérification
// s'effectue au chargement initial uniquement.

// Fermer la popup
async function closeItemReceivedPopup() {
  showItemReceivedPopup.value = false;
  // Acquitter tous les items affichés
  try {
    const list = Array.isArray(currentItems.value) ? currentItems.value : []
    for (const it of list) {
      await secureApiCall(`/users/ack-gift/${it.id}`, { method: 'POST' })
    }
  } catch {}
  currentItems.value = [];
  currentAdminMessage.value = '';
}

onMounted(() => {
  // Rehydrate et sync cross-onglets
  try { authStore.rehydrateFromStorage(); authStore.initCrossTabSync(); authStore.ensureValidSession(); } catch {}
  window.addEventListener('open-item-received', handleOpenItemReceived);
  window.addEventListener('quest-completed', handleQuestCompleted);
  window.addEventListener('task-completed', handleTaskCompleted);
  window.addEventListener('wheel-spun', handleWheelSpun);
  window.addEventListener('achievement-unlocked', handleAchievementUnlocked);
  // Vérifier les nouveaux items après le chargement initial
  setTimeout(async () => {
    await checkForNewItemsWithMessages();
  }, 1000);
  setTimeout(async () => {
    try { loadSeenFromStorage() } catch {}
    try { if (getValidAuthToken()) await loadAchievementsStatus(true) } catch {}
  }, 200);
});

onUnmounted(() => {
  try { window.removeEventListener('open-item-received', handleOpenItemReceived) } catch {}
  try { window.removeEventListener('quest-completed', handleQuestCompleted) } catch {}
  try { window.removeEventListener('task-completed', handleTaskCompleted) } catch {}
  try { window.removeEventListener('wheel-spun', handleWheelSpun) } catch {}
  try { window.removeEventListener('achievement-unlocked', handleAchievementUnlocked) } catch {}
});
</script>

<template>
  <div :class="['app-bg', getBgClass()]">
    <Navbar />
    <RouterView />
    <Footer />
    
    <!-- Popup de notification d'item reçu -->
    <ItemReceivedPopup
      :show="showItemReceivedPopup"
      :items="currentItems"
      :admin-message="currentAdminMessage"
      @close="closeItemReceivedPopup"
    />

    <transition-group name="quest-toast" tag="div" class="quest-toast-container">
      <div v-for="t in questToasts" :key="t.id" class="quest-toast" :class="{ narrow: isNarrow(t), wide: isWide(t) }">
        <div class="toast-icon-circle">
          <img :src="questsLogo" alt="Quêtes" class="toast-quests-logo" />
        </div>
        <div class="toast-content">
          <div class="toast-title">{{ t.type === 'task' ? 'Tâche terminée' : (t.type === 'achievement' ? 'Succès débloqué' : 'Quête terminée') }}</div>
          <div class="toast-sub" :class="{ 'two-lines': isTwoLine(t) }">{{ t.title }}</div>
          <div v-if="t.type === 'achievement'" class="toast-reward">
            <span>{{ t.desc }}</span>
          </div>
          <div v-else-if="t.reward" class="toast-reward">
            <img src="@/assets/img/planicoins.webp" alt="Coins" class="coin-icon" />
            <span>+{{ t.reward }} Planify Coins</span>
          </div>
        </div>
        <div class="toast-check">{{ t.type === 'achievement' ? '★' : '✓' }}</div>
      </div>
    </transition-group>


  </div>
</template>

<style scoped>
.app-bg {
  min-height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
}
.bg-accueil {
  background: linear-gradient(90deg, #a8ffce 0%, #faffd1 100%);
}
.bg-gris {
  background: #23272a;
}
.odoo-banner {
  background: rgb(255, 255, 255);
  padding: 48px 0 32px 0;
}
@media (max-width: 768px) {
  .odoo-banner { padding: 20px 0 32px }
}
.odoo-banner-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 48px;
}
.odoo-banner-left {
  flex: 1;
}
.odoo-banner-title {
  font-size: 3em;
  font-weight: bold;
  color: #222;
  margin-bottom: 18px;
}
.odoo-banner-highlight {
  color: #5fffa1;
  background: #fff;
  border-radius: 12px;
  padding: 0 12px;
}
.odoo-banner-desc {
  font-size: 1.3em;
  color: #444;
  margin-bottom: 24px;
}
.odoo-banner-btn {
  background: #6366f1;
  color: #fff;
  font-weight: bold;
  font-size: 1.1em;
  border: none;
  border-radius: 999px;
  padding: 12px 36px;
  box-shadow: 0 2px 8px #0001;
  transition: background 0.2s;
}
.odoo-banner-btn:hover {
  background: #4f46e5;
}
.odoo-banner-right {
  flex: 1;
  display: flex;
  justify-content: center;
}
.odoo-banner-img {
  max-width: 340px;
  border-radius: 24px;
  box-shadow: 0 2px 16px #0002;
}
.odoo-section {
  padding: 56px 0 32px 0;
}
.odoo-section-green {
  background: linear-gradient(90deg, #a8ffce 0%, #5fffa1 100%);
}
.odoo-section-white {
  background: #fff;
}
.odoo-section-title {
  font-size: 2.2em;
  font-weight: bold;
  color: #222;
  text-align: center;
  margin-bottom: 18px;
}
.odoo-section-flex {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 48px;
  max-width: 1200px;
  margin: 0 auto;
}
.odoo-section-text {
  flex: 1;
  font-size: 1.2em;
  color: #444;
}
.odoo-section-img {
  flex: 1;
  display: flex;
  justify-content: center;
}
.odoo-section-img img {
  max-width: 320px;
  border-radius: 24px;
  box-shadow: 0 2px 16px #0002;
}
.odoo-section-team {
  background: #f3f3f3;
}
.odoo-team-cards {
    display: flex;
  justify-content: center;
  gap: 48px;
  max-width: 900px;
  margin: 0 auto;
}
.odoo-team-card {
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 2px 12px #0001;
  padding: 32px 24px;
  max-width: 340px;
  text-align: center;
}
.odoo-team-img {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 12px;
  }
.odoo-team-role {
  color: #6366f1;
  font-weight: bold;
  margin-bottom: 8px;
}
.odoo-section-faq {
  background: #fff;
  }
.odoo-faq {
  max-width: 700px;
  margin: 0 auto;
    display: flex;
  flex-direction: column;
  gap: 18px;
}
.odoo-faq details {
  background: #f3f3f3;
  border-radius: 12px;
  padding: 18px 24px;
  font-size: 1.1em;
  box-shadow: 0 2px 8px #0001;
}
.odoo-faq, .odoo-faq details, .odoo-faq p, .odoo-faq summary {
  color: #111;
}
.odoo-section-cta {
  background: linear-gradient(90deg, #a8ffce 0%, #5fffa1 100%);
  text-align: center;
}
.odoo-cta-card {
  max-width: 600px;
  margin: 0 auto;
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 2px 12px #0001;
  padding: 40px 32px;
}
.odoo-cta-btn {
  background: #6366f1;
  color: #fff;
  font-weight: bold;
  font-size: 1.1em;
  border: none;
  border-radius: 999px;
  padding: 12px 36px;
  margin-top: 18px;
  box-shadow: 0 2px 8px #0001;
  transition: background 0.2s;
}
.odoo-cta-btn:hover {
  background: #4f46e5;
}
.footer-bar-liste {
  background: linear-gradient(90deg, rgba(110, 255, 121, 255) 50%, rgba(110, 255, 226, 255) 100%);
  padding: 32px 0 16px 0;
  text-align: center;
  color: #fff;
  font-weight: bold;
  font-size: 1.1em;
  box-shadow: 0 -2px 12px #0001;
  margin-top: auto;
}
.footer-content-liste {
  max-width: 900px;
  margin: 0 auto;
}
.footer-links-liste {
  margin-bottom: 8px;
  color: #222;
  font-size: 1.1em;
}
.footer-links-liste a {
  color: #222;
  text-decoration: none;
  margin: 0 6px;
  font-weight: bold;
}
.footer-contact-liste {
  font-size: 1.2em;
  margin-bottom: 12px;
}
.footer-legal-liste {
  font-size: 1em;
  color: #e0ffe6;
  margin-bottom: 8px;
}
@media (max-width: 900px) {
  .odoo-banner-inner, .odoo-section-flex, .odoo-team-cards {
    flex-direction: column;
    gap: 24px;
    align-items: stretch;
  }
  .odoo-banner-img, .odoo-section-img img {
    max-width: 90vw;
  }
}
.odoo-team-card, .odoo-team-card p, .odoo-team-card h4, .odoo-team-role, .odoo-cta-card, .odoo-cta-card h2, .odoo-cta-card p {
  color: #111;
}
</style>

<style scoped>
.quest-toast-container { position: fixed; bottom: 16px; right: 16px; display: flex; flex-direction: column; align-items: flex-end; gap: 10px; z-index: 2000; pointer-events: none; }
.quest-toast { background: #0f1620; border: 1px solid #1f2a37; border-radius: 14px; padding: 10px 12px; display: flex; align-items: center; gap: 12px; min-width: 300px; box-shadow: 0 12px 24px rgba(0,0,0,0.35); }
.quest-toast.narrow { max-width: 320px; min-width: 260px; }
.quest-toast.wide { max-width: 420px; min-width: 300px; }
.toast-icon-circle { width: 40px; height: 40px; min-width: 40px; min-height: 40px; border: 3px solid #5bc681; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: #0b1220; flex: 0 0 40px; flex-shrink: 0; }
.toast-quests-logo { width: 22px; height: 22px; object-fit: contain; }
.toast-content { display: flex; flex-direction: column; gap: 2px; flex: 1 1 auto; }
.toast-title { font-size: 16px; color: #e8f0f7; }
.toast-sub { font-size: 16px; color: #9ca3af; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.toast-sub.two-lines { white-space: normal; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; }
.toast-reward { display: flex; align-items: center; gap: 6px; font-size: 16px; color: #34d399; }
.toast-check { margin-left: auto; width: 22px; height: 22px; min-width: 22px; min-height: 22px; border-radius: 50%; background: #5bc682; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 900; flex: 0 0 22px; flex-shrink: 0; }
@media (max-width: 768px) {
  .quest-toast { max-width: 95vw; min-width: 0; }
  .toast-sub { white-space: normal; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; }
}
.quest-toast-enter-from { opacity: 0; transform: translateY(12px); }
.quest-toast-enter-active, .quest-toast-leave-active { transition: all 250ms ease; }
.quest-toast-leave-to { opacity: 0; transform: translateY(12px); }
[data-theme="light"] .quest-toast { background: #ffffff; border-color: #e5e7eb; }
[data-theme="light"] .toast-title { color: #111; }
[data-theme="light"] .toast-sub { color: #555; }
[data-theme="light"] .toast-icon-circle { background: #ffffff; border-color: #5bc681; }
[data-theme="light"] .toast-check { background: #5bc682; color: #fff; }
</style>

/* Variables globales (sans fichier thème dédié) */
:root {
  --bg: #f6f7f9;
  --text: #111111;
  --muted-text: #6b7280;
  --card-bg: #ffffff;
  --border: #e5e7eb;
  --overlay: rgba(0,0,0,0.35);
}

/* Thème sombre – variables */
[data-theme="dark"] {
  color-scheme: dark;
  --bg: #0b0d12;
  --text: #ffffff;
  --muted-text: #9ca3af;
  --card-bg: #12171f;
  --border: #27313a;
  --overlay: rgba(0,0,0,0.6);
}

/* Fond et texte globaux */
html, body {
  background: var(--bg);
  color: var(--text);
}

/* Overlay de pop-ups */
.popup-overlay {
  background: var(--overlay) !important;
}

/* Pop-ups Planify (contenu blanc -> surface sombre) */
.popup-content,
.popup-content-success,
.popup-content-ajout-tache,
.popup-delete-confirm {
  background: var(--card-bg) !important;
  color: var(--text) !important;
  border-color: var(--border) !important;
}

/* Textes des pop-ups */
.popup-content-success h3,
.popup-content-success p {
  color: var(--text) !important;
}

/* Laisser passer les couleurs inline dans les descriptions en sombre */
[data-theme="dark"] .popup-content .multiline-html,
[data-theme="dark"] .popup-content .multiline-html * {
  color: unset;
}

/* Cartes et listes de tâches */
.devoir-card-liste,
.devoir-content-liste,
.archive-card,
.card {
  background: var(--card-bg) !important;
  color: var(--text) !important;
  border-color: var(--border) !important;
}

/* Titres et textes secondaires (Dark uniquement) */
[data-theme="dark"] .devoir-titre,
[data-theme="dark"] small,
[data-theme="dark"] label:not(.tri-label) {
  color: var(--text) !important;
}

/* Spans internes des boutons */
.btn-vider-archive span,
.btn-ajouter-tache span,
.btn-plus-infos span,
.btn-ok-success span,
.btn-confirm-delete span,
.btn-cancel-delete span {
  color: inherit !important;
}

/* Inputs */
select, input, textarea {
  background: var(--card-bg) !important;
  color: var(--text) !important;
  border-color: var(--border) !important;
}

/* Toggle navbar lisible */
.theme-toggle {
  border-color: var(--border) !important;
  color: var(--text) !important;
  background: transparent !important;
}

/* Overrides de surface pour les sections à fond blanc */
[data-theme="dark"] .odoo-banner,
[data-theme="dark"] .odoo-section-white,
[data-theme="dark"] .odoo-section-faq,
[data-theme="dark"] .odoo-team-card,
[data-theme="dark"] .odoo-cta-card,
[data-theme="dark"] .odoo-faq details {
  background: var(--card-bg) !important;
  color: var(--text) !important;
  border-color: var(--border) !important;
}

/* Footer: tout le texte en blanc en thème sombre */
[data-theme="dark"] .planify-footer,
[data-theme="dark"] .planify-footer *,
[data-theme="dark"] .planify-footer a,
[data-theme="dark"] .planify-footer h5,
[data-theme="dark"] .planify-footer p,
[data-theme="dark"] .planify-footer li,
[data-theme="dark"] .planify-footer .footer-bottom,
[data-theme="dark"] .planify-footer .footer-powered,
[data-theme="dark"] .planify-footer .footer-col ul li a,
[data-theme="dark"] .footer-bar-liste,
[data-theme="dark"] .footer-content-liste,
[data-theme="dark"] .footer-links-liste,
[data-theme="dark"] .footer-links-liste a,
[data-theme="dark"] .footer-contact-liste,
[data-theme="dark"] .footer-contact-liste a,
[data-theme="dark"] .footer-legal-liste {
  color: #ffffff !important;
}

/* Hover en vert (sombre uniquement) */
[data-theme="dark"] .planify-footer a:hover,
[data-theme="dark"] .planify-footer .youtube-link:hover,
[data-theme="dark"] .footer-links-liste a:hover,
[data-theme="dark"] .footer-contact-liste a:hover {
  color: #35cd40 !important;
}

/* Sélecteurs/form inputs */
select, input, textarea {
  background: var(--card-bg) !important;
  color: var(--text) !important;
  border-color: var(--border) !important;
}

/* Navbar toggle lisible dans les deux thèmes */
.theme-toggle {
  border-color: var(--border) !important;
  color: var(--text) !important;
  background: transparent !important;
}
