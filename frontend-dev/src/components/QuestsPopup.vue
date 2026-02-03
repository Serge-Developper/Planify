<template>
  <div v-if="show" class="quests-overlay" @click.self="handleClose">
    <div class="quests-modal">
      <div class="quests-header">
        <div class="title-center">
          <img :src="questsLogo" alt="Quêtes" class="quests-logo" />
          <h2 class="quests-title">Quêtes</h2>
        </div>
        <button class="close-btn" @click="handleClose" @mouseover="hoverCloseQuests = true" @mouseleave="hoverCloseQuests = false" aria-label="Fermer">
          <img :src="hoverCloseQuests ? closeHoverImg : closeImg" alt="Fermer" class="close-img" />
        </button>
      </div>

      <div class="quests-content">
        <section class="daily-section">
          <div class="section-title">Quêtes journalières</div>
          <div v-if="showAdmin" class="admin-daily-editor">
            <div class="admin-row">
              <label>Quête 1</label>
              <select v-model="adminSelectedIds[0]">
                <option v-for="opt in availableOptionsFor(0)" :key="opt.id" :value="opt.id">{{ opt.title }}</option>
              </select>
            </div>
            <div class="admin-row">
              <label>Quête 2</label>
              <select v-model="adminSelectedIds[1]">
                <option v-for="opt in availableOptionsFor(1)" :key="opt.id" :value="opt.id">{{ opt.title }}</option>
              </select>
            </div>
            <div class="admin-row">
              <label>Quête 3</label>
              <select v-model="adminSelectedIds[2]">
                <option v-for="opt in availableOptionsFor(2)" :key="opt.id" :value="opt.id">{{ opt.title }}</option>
              </select>
            </div>
            <div class="admin-actions">
              <button class="primary-btn" @click="applyAdminSelection">Appliquer</button>
            </div>
          </div>

          <div class="daily-list">
            <div v-for="(q, i) in dailyQuests" :key="q.id" class="quest-card" :class="{ completed: q.done, rerolled: rerollUsed && rerollTargetIdx === i, leaderboard: q.id === 'leaderboard-profile' }">
              <div class="quest-top">
                <div class="quest-name">{{ q.title }}</div>
                <div v-if="q.done" class="checkmark-icon" aria-label="Quête complétée">✓</div>
              </div>

              <div class="quest-details">
                <div class="reward">
                  <img src="@/assets/img/planicoins.webp" alt="Coins" class="coin-icon" />
                  <span>{{ q.reward }}</span>
                </div>
                <div class="duration" aria-live="polite">Temps restant: {{ nextDailyResetStr }}</div>
              </div>

              <div class="progress-track"><div class="progress-fill green" :class="{ zero: displayQuestPercs[i] <= 0 }" :style="{ width: displayQuestPercs[i] + '%' }"></div></div>
              <div class="inline-reroll">
                <button class="secondary-btn reroll-btn" @click.stop="openRerollConfirm(i)" :disabled="q.done" :class="{ used: rerollUsed && rerollTargetIdx === i }">
                  <span class="dice-icon" aria-hidden="true">🎲</span>
                  <span v-if="rerollUsed && rerollTargetIdx === i">Re-roll utilisé</span>
                  <span v-else>Re-roll</span>
                </button>
              </div>


            </div>
          </div>


          <div class="overall-progress">
            <div class="progress-label">Progression journalière: {{ dailyProgressCounts.done }}/{{ dailyProgressCounts.total }}</div>
            <div class="progress-track large"><div class="progress-fill green" :class="{ zero: displayDailyPerc <= 0 }" :style="{ width: displayDailyPerc + '%' }"></div></div>
          </div>

          <div class="bonus-block" :class="{ active: allDailyDone }">
            <div class="bonus-title">Bonus journalier
              <button class="bonus-info-btn" type="button" @click="openBonusInfo">
                <img :src="infoIcon" alt="Infos" class="bonus-info-img" />
              </button>
            </div>
            <div class="bonus-state bonus-inline" v-if="allDailyDone">
              Bonus débloqué :
              <span class="amount-text">+{{ DAILY_BONUS_AMOUNT }}</span>
              <img :src="planifyCoin" alt="Planify Coin" class="bonus-inline-coin" />
              <div class="next-reset">Rotation à minuit: {{ nextDailyResetStr }}</div>
            </div>
            <div class="bonus-state" v-else>Complétez les 3 quêtes pour débloquer le bonus</div>
          </div>
        </section>

        <section class="repeat-section">
          <div class="section-title">Quêtes répétables</div>

          <div class="repeat-list">
            <div v-for="rq in repeatableQuests" :key="rq.id" class="quest-card small">
              <div class="quest-name">{{ rq.title }}</div>
              <div class="quest-details">
                <div class="reward">
                  <img src="@/assets/img/planicoins.webp" alt="Coins" class="coin-icon" />
                  <span>{{ rq.reward }}</span>
                </div>
              </div>
              <div class="progress-track"><div class="progress-fill orange" :style="{ width: (rq.progress || 0) + '%' }"></div></div>

            </div>
          </div>
        </section>
        <section class="achievements-section">
          <div class="section-title">Succès</div>
          <div class="achievements-grid">
            <div v-for="ach in achievements" :key="ach.id" class="achievement-card" @click="openAchInfo(ach)">
              <div class="achievement-top">
                <img :src="questsLogo" alt="Succès" class="achievement-icon" />
                <div class="achievement-name">{{ ach.title }}</div>
              </div>
              <div class="achievement-progress">
                <div class="progress-track"><div class="progress-fill green" :style="{ width: (ach.progress || 0) + '%' }"></div></div>
                <div class="achievement-progress-label">{{ Math.round(ach.progress || 0) }}%</div>
              </div>
            </div>
          </div>
        </section>
        <div class="dev-actions-bottom">
          <button class="secondary-btn" @click="simulateDailyProgress">Simuler progression</button>
          <button class="secondary-btn" @click="triggerTestToast">Tester la notification</button>
          <button class="secondary-btn" @click="toggleAdmin">Admin: choisir quêtes</button>
        </div>
      </div>
    </div>
    <div v-if="showConfirm" class="confirm-overlay" @click.self="cancelReroll">
      <div class="confirm-modal">
        <div class="confirm-title">Confirmer le re-roll</div>
        <p class="confirm-msg">Êtes-vous sûr de re-roll cette quête ? Cela réduira le bonus de quêtes journalières.</p>
        <div class="confirm-actions">
          <button class="secondary-btn" @click="cancelReroll">Annuler</button>
          <button class="primary-btn" @click="confirmReroll">Confirmer</button>
        </div>
      </div>
    </div>
    <div v-if="showBonusPopup" class="confirm-overlay">
      <div class="confirm-modal bonus-modal">
        <div class="confirm-title">Bonus journalier reçu</div>
        <div class="bonus-center">
          <div class="bonus-visual">
            <div class="coin-glow"></div>
            <img :src="planifyCoin" alt="Planify Coins" class="bonus-coin-large" />
            <div class="coin-base"></div>
          </div>
          <div class="bonus-amount"><span class="amount-text">+{{ bonusAwardAmount }}</span><img src="@/assets/img/planicoins.webp" alt="Coin" class="amount-coin" /></div>
        </div>
        <div class="bonus-actions">
          <button class="ok-cta" @click="showBonusPopup=false">OK</button>
        </div>
      </div>
    </div>
    <div v-if="showAchInfo" class="confirm-overlay" @click.self="closeAchInfo">
      <div class="confirm-modal">
        <div class="confirm-title">{{ currentAch && currentAch.title }}</div>
        <p class="confirm-msg">{{ currentAch && (currentAch.description || 'Succès en cours') }}</p>
        <div class="confirm-actions">
          <button class="primary-btn" @click="closeAchInfo">Fermer</button>
        </div>
      </div>
    </div>
    <div v-if="showBonusInfo" class="confirm-overlay" @click.self="closeBonusInfo">
      <div class="confirm-modal">
        <div class="confirm-title">Bonus des quêtes journalières</div>
        <div class="confirm-msg">
          <div>Complétez les 3 quêtes journalières pour obtenir un bonus de <img src="@/assets/img/planicoins.webp" alt="Coins" class="coin-icon" /> 50</div>
          <div>Si le bonus est désactivé (re-roll ou expiration), il est réduit à <img src="@/assets/img/planicoins.webp" alt="Coins" class="coin-icon" /> 25</div>
          <div>Le re-roll est possible uniquement sur une quête active (non complétée).</div>
        </div>
        <div class="confirm-actions">
          <button class="primary-btn" @click="closeBonusInfo">Fermer</button>
        </div>
      </div>
    </div>
    <transition-group name="quest-toast" tag="div" class="quest-toast-container">
      <div v-for="t in toasts" :key="t.id" class="quest-toast">
        <div class="toast-icon-circle">
          <img :src="questsLogo" alt="Quêtes" class="toast-quests-logo" />
        </div>
        <div class="toast-content">
          <div class="toast-title">Quête terminée</div>
          <div class="toast-sub">{{ t.title }}</div>
          <div class="toast-reward">
            <img src="@/assets/img/planicoins.webp" alt="Coins" class="coin-icon" />
            <span>+{{ t.reward }} Planify Coins</span>
          </div>
        </div>
        <div class="toast-check">✓</div>
      </div>
    </transition-group>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import questsLogo from '@/assets/Quetes.svg'
import planifyCoin from '@/assets/PiècesPlanify.png'
import closeImg from '@/assets/img/bouton_supprimer_decocher.png'
import closeHoverImg from '@/assets/img/bouton_supprimer_cocher.png'
import infoIcon from '@/assets/img/infos_items.webp'
import { secureApiCall } from '@/api'
import { useAuthStore } from '@/stores/auth'
import { useCoinsStore } from '@/stores/coins'
const props = defineProps({ show: { type: Boolean, default: false } })
const emit = defineEmits(['close'])
const coinsStore = useCoinsStore()
const hoverCloseQuests = ref(false)
watch(() => props.show, (val) => { if (val) { hoverCloseQuests.value = false; (async () => { try { await loadAchievementsStatus() } catch {} })() } })
function handleClose() { hoverCloseQuests.value = false; emit('close') }
const rerollUsed = ref(false)
const showConfirm = ref(false)
const rerollCandidateIdx = ref(null)
const DAILY_BONUS_AMOUNT = computed(() => rerollUsed.value ? 25 : 50)
const showBonusInfo = ref(false)
function openBonusInfo() { showBonusInfo.value = true }
function closeBonusInfo() { showBonusInfo.value = false }

const taskInfoVisitedIds = new Set()
function handleTaskInfoOpened(e) {
  try {
    const id = e?.detail?.taskId || String(Date.now()) + Math.random()
    taskInfoVisitedIds.add(id)
    const one = dailyQuests.value.find(q => q.id === 'task-info-1')
    if (one && !one.done && taskInfoVisitedIds.size >= Number(one.actions || 1)) one.done = true
    const three = dailyQuests.value.find(q => q.id === 'task-info-3')
    if (three && !three.done && taskInfoVisitedIds.size >= Number(three.actions || 3)) three.done = true
    displayQuestPercs.value = dailyQuests.value.map(questProgress)
    displayDailyPerc.value = dailyProgressPerc.value
    updateAchievementsProgress()
  } catch {}
}
function handleArchivesOpen() { const q = dailyQuests.value.find(q => q.id === 'tasks-archives'); if (q && !q.done) q.done = true }
function handleExamsOpen() { const q = dailyQuests.value.find(q => q.id === 'tab-exams-open'); if (q && !q.done) q.done = true }
function handleRetardsOpen() { const q = dailyQuests.value.find(q => q.id === 'tab-retards-open'); if (q && !q.done) q.done = true }
function handleShopVisited() { const q = dailyQuests.value.find(q => q.id === 'visit-shop'); if (q && !q.done) q.done = true }
function handleLeaderboardProfileViewed(e) { try { const name = String(e?.detail?.username || '').trim().toLowerCase(); const target = String(leaderboardTargetName.value || '').trim().toLowerCase(); const match = !!name && !!target && name === target; const q = dailyQuests.value.find(q => q.id === 'leaderboard-profile'); if (q && !q.done && match) q.done = true } catch {} }
function handleConnect() { const q = dailyQuests.value.find(q => q.id === 'connect'); if (q && !q.done) q.done = true }

const leaderboardTargetName = ref('')
function updateLeaderboardQuestTitle(name) {
  const base = name && String(name).trim().length ? `Consulter le profil de ${name} dans le leaderboard` : 'Consulter le profil d’une personne aléatoire dans le leaderboard'
  const idx = allDailyOptions.findIndex(o => o.id === 'leaderboard-profile')
  if (idx !== -1) allDailyOptions[idx].title = base
  const q = dailyQuests.value.find(q => q.id === 'leaderboard-profile')
  if (q) q.title = base
}
async function loadLeaderboardTargetName() {
  try {
    const raw = localStorage.getItem('planify_leaderboard_cache_v1')
    const obj = raw ? JSON.parse(raw) : null
    const arr = Array.isArray(obj?.users) ? obj.users : (Array.isArray(obj) ? obj : [])
    if (arr.length) {
      const pick = arr[Math.floor(Math.random() * arr.length)]
      const name = (pick && (pick.username || pick.name)) || ''
      leaderboardTargetName.value = String(name)
      updateLeaderboardQuestTitle(name)
    }
  } catch {}
  try {
    const res = await secureApiCall('/users/leaderboard')
    const arr2 = Array.isArray(res?.users) ? res.users : (Array.isArray(res) ? res : [])
    if (arr2.length) {
      try { localStorage.setItem('planify_leaderboard_cache_v1', JSON.stringify({ ts: Date.now(), users: arr2 })) } catch {}
      const pick2 = arr2[Math.floor(Math.random() * arr2.length)]
      const name2 = (pick2 && (pick2.username || pick2.name)) || ''
      leaderboardTargetName.value = String(name2)
      updateLeaderboardQuestTitle(name2)
    }
  } catch {}
}

const hydrating = ref(false)
const dailyQuests = ref([])
async function loadDailyFromBackend() {
  try {
    const res = await secureApiCall('/quests/daily')
    const qs = Array.isArray(res?.dailyQuests) ? res.dailyQuests : (Array.isArray(res) ? res : [])
    const meta = res?.meta || {}
    rerollUsed.value = !!meta.rerollUsed
    if (meta && meta.targetLeaderboardName) updateLeaderboardQuestTitle(meta.targetLeaderboardName)
    dailyQuests.value = qs.map(q => ({ ...q }))
    displayQuestPercs.value = dailyQuests.value.map(questProgress)
    displayDailyPerc.value = dailyProgressPerc.value
    ensureWheelQuestsCompletionFromLocalCount()
  } catch {}
}
const showAdmin = ref(false)
const adminSelectedIds = ref(dailyQuests.value.map(q => q.id))
const allDailyOptions = [
  { id: 'wheel-1', title: 'Tourner la roue de la fortune 1 fois', reward: 10, actions: 1, done: false },
  { id: 'wheel-2', title: 'Tourner la roue de la fortune 2 fois', reward: 20, actions: 2, done: false },
  { id: 'devoirs', title: 'Consulter les devoirs', reward: 10, actions: 1, done: false },
  { id: 'task-info-1', title: 'Cliquer sur “Plus d’infos” sur une tâche', reward: 10, actions: 1, done: false },
  { id: 'task-info-3', title: 'Cliquer sur “Plus d’infos” sur 3 tâches différentes', reward: 20, actions: 3, done: false },
  { id: 'tasks-archives', title: 'Consulter les archives des tâches', reward: 10, actions: 1, done: false },
  { id: 'tab-exams-open', title: 'Ouvrir l’onglet “Examens”', reward: 10, actions: 1, done: false },
  { id: 'tab-retards-open', title: 'Ouvrir l’onglet “Retards”', reward: 10, actions: 1, done: false },
  { id: 'visit-shop', title: 'Visiter la boutique Planify', reward: 10, actions: 1, done: false },
  { id: 'leaderboard-profile', title: 'Consulter le profil d’une personne aléatoire dans le leaderboard', reward: 10, actions: 1, done: false },
  { id: 'connect', title: 'Se connecter à Planify', reward: 10, actions: 1, done: false }
]
function toggleAdmin() { showAdmin.value = !showAdmin.value; adminSelectedIds.value = dailyQuests.value.map(q => q.id) }
function availableOptionsFor(index) {
  const chosen = new Set(adminSelectedIds.value.filter((id,i)=>i!==index))
  return allDailyOptions.filter(opt => !chosen.has(opt.id))
}
async function applyAdminSelection() {
  const uniqueIds = []
  adminSelectedIds.value.forEach((id, i) => {
    const exists = uniqueIds.includes(id)
    const pool = availableOptionsFor(i)
    const finalId = exists && pool.length ? pool[0].id : id
    uniqueIds.push(finalId)
    const opt = allDailyOptions.find(o => o.id === finalId) || allDailyOptions[0]
    dailyQuests.value[i] = { ...opt, done: false }
  })
  displayQuestPercs.value = dailyQuests.value.map(questProgress)
  displayDailyPerc.value = dailyProgressPerc.value
  ;(async () => { try { await loadRepeatableStatus(); await loadAchievementsStatus() } catch {} })()
}

const repeatableQuests = [
  { id: 'tasks-10', title: 'Valider 10 tâches', reward: 50, actions: 3, progress: 0 },
  { id: 'tasks-25', title: 'Valider 25 tâches', reward: 120, actions: 3, progress: 0 },
  { id: 'tasks-50', title: 'Valider 50 tâches', reward: 300, actions: 3, progress: 0 },
  { id: 'wheel-10', title: 'Tourner la roue de la fortune 10 fois', reward: 100, actions: 3, progress: 0 },
  { id: 'wheel-25', title: 'Tourner la roue de la fortune 25 fois', reward: 250, actions: 3, progress: 0 },
  { id: 'wheel-50', title: 'Tourner la roue de la fortune 50 fois', reward: 500, actions: 3, progress: 0 },
  { id: 'daily-10', title: 'Compléter 10 quêtes journalières', reward: 50, actions: 3, progress: 0 },
  { id: 'daily-25', title: 'Compléter 25 quêtes journalières', reward: 150, actions: 3, progress: 0 },
  { id: 'daily-50', title: 'Compléter 50 quêtes journalières', reward: 300, actions: 3, progress: 0 }
]
async function loadRepeatableStatus() {
  try {
    const r = await secureApiCall('/quests/repeatable')
    const arr = Array.isArray(r?.repeatable) ? r.repeatable : []
    const map = new Map(arr.map(x => [x.id, Number(x.progress||0)]))
    for (const q of repeatableQuests) { q.progress = map.get(q.id) || 0 }
  } catch {}
}
const seenAch = ref(new Set())
async function loadAchievementsStatus() {
  try {
    const r = await secureApiCall('/quests/achievements')
    const list = Array.isArray(r?.achievements) ? r.achievements : []
    seenAch.value = new Set(list)
    for (const id of list) {
      const a = achievements.value.find(x => x.id === id)
      if (a) a.progress = 100
    }
  } catch {}
}

const achStats = ref({ completedTasks: 0, wheelSpinTotal: 0, wheelLossTotal: 0, dailyCompleted: 0, repeatCompleted: 0, proposalsCount: 0, wheelWeekendSpinsToday: { ymd: null, count: 0 }, wheelWeekendLossToday: { ymd: null, count: 0 }, faction: null })

async function loadAchievementsCounters() {
  try {
    const r = await secureApiCall('/quests/stats')
    achStats.value = {
      completedTasks: Math.max(0, Number(r?.completedTasks || 0)),
      wheelSpinTotal: Math.max(0, Number(r?.wheelSpinTotal || 0)),
      wheelLossTotal: Math.max(0, Number(r?.wheelLossTotal || 0)),
      dailyCompleted: Math.max(0, Number(r?.dailyCompleted || 0)),
      repeatCompleted: Math.max(0, Number(r?.repeatCompleted || 0)),
      proposalsCount: Math.max(0, Number(r?.proposalsCount || 0)),
      wheelWeekendSpinsToday: { ymd: r?.wheelWeekendSpinsToday?.ymd || null, count: Math.max(0, Number(r?.wheelWeekendSpinsToday?.count || 0)) },
      wheelWeekendLossToday: { ymd: r?.wheelWeekendLossToday?.ymd || null, count: Math.max(0, Number(r?.wheelWeekendLossToday?.count || 0)) },
      faction: r?.faction || null
    }
    updateAchievementsProgress()
  } catch {}
}

function updateAchievementsProgress() {
  try {
    const s = achStats.value || {}
    const completed = seenAch.value || new Set()
    function setProgress(id, pct) {
      const a = achievements.value.find(x => x.id === id)
      if (a && !completed.has(id)) a.progress = Math.min(100, Math.max(0, Math.round(pct)))
    }
    function pct(count, thr) { return thr > 0 ? (count / thr) * 100 : 0 }

    setProgress('tasks-validate-10', pct(Math.max(0, Number(s.completedTasks||0)), 10))
    setProgress('tasks-validate-50', pct(Math.max(0, Number(s.completedTasks||0)), 50))
    setProgress('tasks-validate-100', pct(Math.max(0, Number(s.completedTasks||0)), 100))
    setProgress('tasks-validate-250', pct(Math.max(0, Number(s.completedTasks||0)), 250))

    setProgress('wheel-spin-10', pct(Math.max(0, Number(s.wheelSpinTotal||0)), 10))
    setProgress('wheel-spin-50', pct(Math.max(0, Number(s.wheelSpinTotal||0)), 50))
    setProgress('wheel-spin-100', pct(Math.max(0, Number(s.wheelSpinTotal||0)), 100))

    const wl = Math.max(0, Number(s.wheelLossTotal||0))
    setProgress('wheel-first-loss', wl >= 1 ? 100 : 0)
    setProgress('wheel-lose-30', pct(wl, 30))

    const ty = getParisYMD()
    try {
      const wc = Number(s?.wheelWeekendSpinsToday?.count || 0)
      const wy = String(s?.wheelWeekendSpinsToday?.ymd || '')
      setProgress('wheel-weekend-spin-2', wy === ty ? pct(wc, 2) : 0)
    } catch {}
    try {
      const lc = Number(s?.wheelWeekendLossToday?.count || 0)
      const ly = String(s?.wheelWeekendLossToday?.ymd || '')
      setProgress('wheel-weekend-lose-2', ly === ty ? pct(lc, 2) : 0)
    } catch {}

    const dc = Math.max(0, Number(s.dailyCompleted||0))
    setProgress('daily-complete-5', pct(dc, 5))
    setProgress('daily-complete-15', pct(dc, 15))
    setProgress('daily-complete-30', pct(dc, 30))
    setProgress('daily-complete-50', pct(dc, 50))

    const rc = Math.max(0, Number(s.repeatCompleted||0))
    setProgress('repeat-complete-5', pct(rc, 5))
    setProgress('repeat-complete-20', pct(rc, 20))
    setProgress('repeat-complete-50', pct(rc, 50))
    setProgress('repeat-complete-100', pct(rc, 100))

    const pc = Math.max(0, Number(s.proposalsCount||0))
    setProgress('homework-propose-5', pct(pc, 5))
    setProgress('homework-propose-20', pct(pc, 20))
    setProgress('homework-propose-50', pct(pc, 50))

    const infoCnt = taskInfoVisitedIds.size || 0
    setProgress('tasks-info-multi', pct(infoCnt, 3))
    setProgress('tasks-details-10', pct(infoCnt, 10))
    setProgress('tasks-details-25', pct(infoCnt, 25))

    const fj = achievements.value.find(x => x.id === 'faction-join')
    if (fj && s.faction && !completed.has('faction-join')) fj.progress = 100
  } catch {}
}
function showAchToast(id, title, desc) {
  try { window.dispatchEvent(new CustomEvent('achievement-unlocked', { detail: { id, title, description: desc } })) } catch {}
  const t = { id: `${id}:${Date.now()}:${Math.random()}`, title, desc }
  achToasts.value.push(t)
  setTimeout(() => { achToasts.value = achToasts.value.filter(x => x.id !== t.id) }, 4500)
}

const achievements = ref([
  // Nouveaux succès
  { id: 'ach-first-quest', title: 'Premier pas', progress: 0, description: 'Compléter votre première quête' },
  { id: 'ach-wheel-once', title: 'Début de la chance', progress: 0, description: 'Tourner la roue une fois' },
  { id: 'ach-task-streak', title: 'Routine héroïque', progress: 0, description: 'Valider des tâches sur plusieurs jours' },

  // Roue de la fortune
  { id: 'wheel-first-loss', title: 'Début de la malchance', progress: 0, description: 'Perdre à la roue de la fortune pour la première fois' },
  { id: 'wheel-lose-30', title: 'Chanceux d’être malchanceux', progress: 0, description: 'Perdre 30 fois à la roue de la fortune' },
  { id: 'wheel-weekend-lose-2', title: 'Week-end maudit', progress: 0, description: 'Perdre deux fois à la roue de la fortune le week-end' },
  { id: 'wheel-spin-10', title: 'Chance montante', progress: 0, description: 'Tourner la roue de la fortune 10 fois' },
  { id: 'wheel-spin-50', title: 'Accro de la roue', progress: 0, description: 'Tourner la roue de la fortune 50 fois' },
  { id: 'wheel-spin-100', title: 'Maître de la fortune', progress: 0, description: 'Tourner la roue de la fortune 100 fois' },
  { id: 'wheel-weekend-spin-2', title: 'Un week-end souriant', progress: 0, description: 'Tourner la roue de la fortune deux fois durant le week-end' },

  // Tâches
  { id: 'tasks-validate-10', title: 'Apprenti organisé', progress: 0, description: 'Valider 10 tâches' },
  { id: 'tasks-validate-50', title: 'Productivité en marche', progress: 0, description: 'Valider 50 tâches' },
  { id: 'tasks-validate-100', title: 'Machine à accomplir', progress: 0, description: 'Valider 100 tâches' },
  { id: 'tasks-validate-250', title: 'Légende de la productivité', progress: 0, description: 'Valider 250 tâches' },

  // Interaction avec les tâches
  { id: 'tasks-info-multi', title: 'Curieux de nature', progress: 0, description: 'Cliquer sur “Plus d’infos” sur plusieurs tâches différentes' },
  { id: 'tasks-details-10', title: 'Observateur attentif', progress: 0, description: 'Consulter les détails de 10 tâches' },
  { id: 'tasks-details-25', title: 'Expert en organisation', progress: 0, description: 'Consulter les détails de 25 tâches' },

  // Quêtes journalières
  { id: 'daily-complete-5', title: 'Rituel quotidien', progress: 0, description: 'Compléter 5 quêtes journalières' },
  { id: 'daily-complete-15', title: 'Habitude solide', progress: 0, description: 'Compléter 15 quêtes journalières' },
  { id: 'daily-complete-30', title: 'Discipline absolue', progress: 0, description: 'Compléter 30 quêtes journalières' },
  { id: 'daily-complete-50', title: 'Maître des quêtes journalières', progress: 0, description: 'Compléter 50 quêtes journalières' },
  { id: 'daily-no-reroll', title: 'No re-roll', progress: 0, description: 'Compléter les 3 quêtes journalières sans utiliser de re-roll' },

  // Quêtes répétables
  { id: 'repeat-complete-5', title: 'Persévérance', progress: 0, description: 'Compléter 5 quêtes répétables' },
  { id: 'repeat-complete-20', title: 'Toujours plus loin', progress: 0, description: 'Compléter 20 quêtes répétables' },
  { id: 'repeat-complete-50', title: 'Infatigable', progress: 0, description: 'Compléter 50 quêtes répétables' },
  { id: 'repeat-complete-100', title: 'Inarrêtable', progress: 0, description: 'Compléter 100 quêtes répétables' },

  // Re-roll
  { id: 'reroll-used', title: 'Deuxième chance', progress: 0, description: 'Utiliser un re-roll' },

  // Faction
  { id: 'faction-join', title: 'Nouveau membre', progress: 0, description: 'Rejoindre une faction' },

  // Devoirs proposés
  { id: 'homework-propose-5', title: 'Petit professeur', progress: 0, description: 'Proposer 5 devoirs' },
  { id: 'homework-propose-20', title: 'Prof en herbe', progress: 0, description: 'Proposer 20 devoirs' },
  { id: 'homework-propose-50', title: 'Maître des devoirs', progress: 0, description: 'Proposer 50 devoirs' },

  // Cosmétiques / Boutique
  { id: 'cosmetics-border-all', title: 'Collectionneur de cadres', progress: 0, description: 'Avoir toutes les couleurs de bordure' },
  { id: 'cosmetics-item-3styles', title: 'Styliste ultime', progress: 0, description: 'Avoir un item avec 3 styles différents' }
])
const showAchInfo = ref(false)
const currentAch = ref(null)
function openAchInfo(ach) { currentAch.value = ach; showAchInfo.value = true }
function closeAchInfo() { showAchInfo.value = false; currentAch.value = null }
function handleAchievementUnlocked(e) { try { const id = String(e?.detail?.id || ''); if (!id) return; const a = achievements.value.find(x => x.id === id); if (a) a.progress = 100 } catch {} }

const allDailyDone = computed(() => dailyQuests.value.every(q => q.done))
const dailyProgressPerc = computed(() => {
  const total = dailyQuests.value.length || 1
  const done = dailyQuests.value.filter(q => q.done).length
  return Math.round((done / total) * 100)
})
const wheelSpinCount = ref(0)
function getParisYMD() { try { const parisNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Paris' })); const y = parisNow.getFullYear(); const m = String(parisNow.getMonth()+1).padStart(2,'0'); const d = String(parisNow.getDate()).padStart(2,'0'); return `${y}-${m}-${d}` } catch { return '' } }
function getWheelStorageKey(base) { try { const a = useAuthStore(); const uid = String(a?.user?._id || a?.user?.id || a?.user?.username || '').trim(); return uid ? `${base}:${uid}` : base } catch { return base } }
function loadWheelSpinCount() { try { const dateKey = getWheelStorageKey('wheelSpinsDate'); const countKey = getWheelStorageKey('wheelSpinsCount'); const savedDate = localStorage.getItem(dateKey) || ''; const today = getParisYMD(); if (!savedDate || savedDate !== today) { localStorage.setItem(dateKey, today); localStorage.setItem(countKey, '0'); wheelSpinCount.value = 0 } else { wheelSpinCount.value = Math.max(0, Number(localStorage.getItem(countKey) || 0)) } } catch { wheelSpinCount.value = 0 } }
function saveWheelSpinCount() { try { const dateKey = getWheelStorageKey('wheelSpinsDate'); const countKey = getWheelStorageKey('wheelSpinsCount'); localStorage.setItem(dateKey, getParisYMD()); localStorage.setItem(countKey, String(Math.max(0, Number(wheelSpinCount.value||0)))) } catch {} }
function parseRequiredSpinsFromId(id) { const m = String(id||'').match(/wheel-(\d+)/); return m ? Number(m[1]) : 0 }
function questProgress(q) {
  if (!q) return 0
  if (q.id && /^wheel-/.test(q.id)) {
    const required = parseRequiredSpinsFromId(q.id) || Number(q.actions || 0) || 0
    const cnt = Math.max(0, Number(wheelSpinCount.value || 0))
    const pct = required > 0 ? Math.min(100, Math.round((cnt / required) * 100)) : 0
    return q.done ? 100 : pct
  }
  if (q.id && /^task-info-/.test(q.id)) {
    const required = Math.max(1, Number(q.actions || 1))
    const cnt = taskInfoVisitedIds.size || 0
    const pct = Math.min(100, Math.round((cnt / required) * 100))
    return q.done ? 100 : pct
  }
  return q.done ? 100 : 0
}
const displayDailyPerc = ref(0)
const displayQuestPercs = ref([])
function handleWheelSpun() {
  wheelSpinCount.value = Math.max(0, Number(wheelSpinCount.value || 0)) + 1
  saveWheelSpinCount()
  try { localStorage.setItem('questsProgressVersion', String(Date.now())) } catch {}
  for (const q of dailyQuests.value) {
    if (q && q.id && /^wheel-/.test(q.id)) {
      const required = parseRequiredSpinsFromId(q.id) || Number(q.actions || 0) || 0
      if (required > 0 && wheelSpinCount.value >= required && !q.done) q.done = true
    }
  }
  displayQuestPercs.value = dailyQuests.value.map(questProgress)
  displayDailyPerc.value = dailyProgressPerc.value
  ;(async () => { try { await loadRepeatableStatus(); await loadAchievementsCounters() } catch {} })()
}

function handleTaskCompleted() { ;(async () => { try { await loadAchievementsCounters() } catch {} })() }

function handleHomeworkProposed() { ;(async () => { try { await loadAchievementsCounters() } catch {} })() }

function ensureWheelQuestsCompletionFromLocalCount() {
  try {
    const cnt = Math.max(0, Number(wheelSpinCount.value || 0))
    let updated = false
    for (const q of dailyQuests.value) {
      if (q && q.id && /^wheel-/.test(q.id)) {
        const required = parseRequiredSpinsFromId(q.id) || Number(q.actions || 0) || 0
        if (required > 0 && cnt >= required && !q.done) { q.done = true; updated = true }
      }
    }
    if (updated) {
      displayQuestPercs.value = dailyQuests.value.map(questProgress)
      displayDailyPerc.value = dailyProgressPerc.value
    }
  } catch {}
}

function durationLabel(actions) {
  if (actions === 1) return 'Durée: 1 jour'
  if (actions === 2) return 'Durée: 3 jours'
  return 'Durée: 4 jours'
}

const rerollTargetIdx = ref(null)
function openRerollConfirm(idx) {
  const q = dailyQuests.value[idx]
  if (q && q.done) return
  rerollCandidateIdx.value = idx
  showConfirm.value = true
}
function confirmReroll() {
  if (rerollCandidateIdx.value == null) { showConfirm.value = false; return }
  reroll(rerollCandidateIdx.value)
  showConfirm.value = false
  rerollCandidateIdx.value = null
}
function cancelReroll() { showConfirm.value = false; rerollCandidateIdx.value = null }
function reroll(idx) {
  rerollTargetIdx.value = idx
  rerollUsed.value = true
  ;(async () => {
    try {
      const res = await secureApiCall('/quests/reroll', { method: 'POST', body: JSON.stringify({ index: idx }) })
      const qs = Array.isArray(res?.dailyQuests) ? res.dailyQuests : []
      const meta = res?.meta || {}
      dailyQuests.value = qs.map(q => ({ ...q }))
      rerollUsed.value = !!meta.rerollUsed
      displayQuestPercs.value = dailyQuests.value.map(questProgress)
      displayDailyPerc.value = dailyProgressPerc.value
      ensureWheelQuestsCompletionFromLocalCount()
      try { await loadAchievementsStatus() } catch {}
    } catch {}
  })()
}

const toasts = ref([])
const achToasts = ref([])
function showQuestToast(title, reward, id) {
  try {
    window.dispatchEvent(new CustomEvent('quest-completed', { detail: { id, title, reward } }))
    localStorage.setItem('questsProgressVersion', String(Date.now()))
  } catch {}
}
const prevDone = ref([])
onMounted(async () => {
  hydrating.value = true
  await loadDailyFromBackend()
  loadWheelSpinCount()
  await loadAchievementsStatus()
  await loadAchievementsCounters()
  prevDone.value = dailyQuests.value.map(q => !!q.done)
  hydrating.value = false
  try { const auth = useAuthStore(); if (auth.isLoggedIn) handleConnect() } catch {}
  try { loadLeaderboardTargetName() } catch {}
  window.addEventListener('homework-list-opened', markDevoirsDone)
  try { window.addEventListener('wheel-spun', handleWheelSpun) } catch {}
  try {
    window.addEventListener('task-info-opened', handleTaskInfoOpened)
    window.addEventListener('tasks-archives-opened', handleArchivesOpen)
    window.addEventListener('exams-tab-opened', handleExamsOpen)
    window.addEventListener('retards-tab-opened', handleRetardsOpen)
    window.addEventListener('shop-visited', handleShopVisited)
    window.addEventListener('leaderboard-profile-viewed', handleLeaderboardProfileViewed)
    window.addEventListener('achievement-unlocked', handleAchievementUnlocked)
    window.addEventListener('connect', handleConnect)
    window.addEventListener('task-completed', handleTaskCompleted)
    window.addEventListener('homework-proposed', handleHomeworkProposed)
  } catch {}
  const version = Number(localStorage.getItem('questsProgressVersion') || 0)
  const seen = Number(localStorage.getItem('questsProgressSeen') || 0)
  const shouldAnimate = version > seen
  displayDailyPerc.value = shouldAnimate ? 0 : dailyProgressPerc.value
  displayQuestPercs.value = dailyQuests.value.map(q => shouldAnimate ? 0 : questProgress(q))
  if (shouldAnimate) {
    setTimeout(() => {
      displayDailyPerc.value = dailyProgressPerc.value
      displayQuestPercs.value = dailyQuests.value.map(questProgress)
      ensureWheelQuestsCompletionFromLocalCount()
      setTimeout(() => { try { localStorage.setItem('questsProgressSeen', String(version)) } catch {} }, 800)
    }, 50)
  } else {
    displayDailyPerc.value = dailyProgressPerc.value
    displayQuestPercs.value = dailyQuests.value.map(questProgress)
    ensureWheelQuestsCompletionFromLocalCount()
  }
})
watch(dailyQuests, async (qs) => {
  if (hydrating.value) {
    prevDone.value = qs.map(q => !!q.done)
    displayQuestPercs.value = qs.map(questProgress)
    displayDailyPerc.value = dailyProgressPerc.value
    return
  }
  for (let i = 0; i < qs.length; i++) {
    const q = qs[i]
    const now = !!q.done
    const before = !!prevDone.value[i]
    if (now && !before) {
      showQuestToast(q.title, q.reward, q.id)
      try { await secureApiCall('/quests/complete', { method: 'POST', body: JSON.stringify({ questId: q.id }) }) } catch {}
      try { await loadRepeatableStatus(); await loadAchievementsStatus() } catch {}
    }
    prevDone.value[i] = now
  }
  displayQuestPercs.value = qs.map(questProgress)
  displayDailyPerc.value = dailyProgressPerc.value
}, { deep: true })

function markDevoirsDone() {
  const target = dailyQuests.value.find(q => q.id === 'devoirs')
  if (target && !target.done) target.done = true
}
function triggerTestToast() {
  const q = dailyQuests.value[0] || { id: 'test', title: 'Quête test', reward: 25 }
  showQuestToast(q.title, q.reward, q.id)
}
const dailyProgressCounts = computed(() => ({ total: dailyQuests.value.length, done: dailyQuests.value.filter(q => q.done).length }))
function simulateDailyProgress() {
  const next = dailyQuests.value.find(q => !q.done)
  if (next) next.done = true
}
const showBonusPopup = ref(false)
const bonusAwardAmount = ref(0)
const bonusAwarding = ref(false)
const nextDailyResetStr = ref('')
let nextDailyResetTimerId = null
function updateNextDailyReset() {
  try {
    const parisNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Paris' }))
    const nextMidnight = new Date(parisNow); nextMidnight.setHours(24,0,0,0)
    const ms = Math.max(0, nextMidnight.getTime() - parisNow.getTime())
    const h = Math.floor(ms / 3600000)
    const m = Math.floor((ms % 3600000) / 60000)
    const s = Math.floor((ms % 60000) / 1000)
    nextDailyResetStr.value = `${h}h ${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`
  } catch { nextDailyResetStr.value = '' }
}
function startNextDailyResetTimer() { updateNextDailyReset(); try { clearInterval(nextDailyResetTimerId) } catch {}; nextDailyResetTimerId = setInterval(updateNextDailyReset, 1000) }
function stopNextDailyResetTimer() { try { clearInterval(nextDailyResetTimerId) } catch {}; nextDailyResetTimerId = null }
async function awardDailyBonusWithRetry() {
  if (bonusAwarding.value) return
  bonusAwarding.value = true
  try {
    const maxTries = 10
    for (let i = 0; i < maxTries; i++) {
      const d = await secureApiCall('/quests/daily')
      const cnt = Array.isArray(d?.dailyQuests) ? d.dailyQuests.filter(q => !!q.done).length : 0
      if (cnt === 3) {
        const r = await secureApiCall('/quests/bonus', { method: 'POST' })
        ;(async () => { try { await loadAchievementsStatus() } catch {} })()
        const got = typeof r?.amount === 'number' ? Number(r.amount) : 0
        const newCoins = typeof r?.coins === 'number' ? Number(r.coins) : null
        if (newCoins !== null) { coinsStore.balance = newCoins; coinsStore.leaderboardNeedsRefresh = true }
        if (got > 0) {
          bonusAwardAmount.value = got; showBonusPopup.value = true
          try { if (!rerollUsed.value) window.dispatchEvent(new CustomEvent('achievement-unlocked', { detail: { id: 'daily-no-reroll' } })) } catch {}
        }
        break
      }
      await new Promise(res => setTimeout(res, 200))
    }
  } catch {}
  bonusAwarding.value = false
}
watch([allDailyDone, hydrating], async ([v, h]) => {
  if (!h && v && dailyQuests.value.length === 3) { awardDailyBonusWithRetry() }
  startNextDailyResetTimer()
}, { immediate: true })
onUnmounted(() => {
  window.removeEventListener('homework-list-opened', markDevoirsDone)
  try {
    window.removeEventListener('wheel-spun', handleWheelSpun)
    window.removeEventListener('task-info-opened', handleTaskInfoOpened)
    window.removeEventListener('tasks-archives-opened', handleArchivesOpen)
    window.removeEventListener('exams-tab-opened', handleExamsOpen)
    window.removeEventListener('retards-tab-opened', handleRetardsOpen)
    window.removeEventListener('shop-visited', handleShopVisited)
    window.removeEventListener('leaderboard-profile-viewed', handleLeaderboardProfileViewed)
    window.removeEventListener('achievement-unlocked', handleAchievementUnlocked)
    window.removeEventListener('connect', handleConnect)
    window.removeEventListener('task-completed', handleTaskCompleted)
    window.removeEventListener('homework-proposed', handleHomeworkProposed)
  } catch {}
  try { stopNextDailyResetTimer() } catch {}
})
</script>

<style scoped>
.quests-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.quests-modal { background: #10151b; color: #e8f0f7; border-radius: 20px; width: 920px; max-width: 92vw; max-height: 92vh; overflow-y: auto; overflow-x: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.35); border: 1px solid #1f2a37; scrollbar-color: #cfcfcf transparent; scrollbar-width: thin; }
.quests-header { position: relative; display: flex; align-items: center; justify-content: flex-end; padding: 20px 24px; border-bottom: 1px solid #eee; }
.quests-title { font-size: 40px; color: var(--darkreader-text-00c97b, #4df9b6); }
[data-theme="light"] .quests-title { color: #00c97b; }
.title-center { position: absolute; left: 50%; transform: translateX(-50%); display: inline-flex; align-items: center; gap: 10px; }
.quests-logo { width: 28px; height: 28px; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.2)); }
.dev-actions-bottom { display: flex; gap: 10px; justify-content: flex-end; margin-top: 12px; }
.admin-daily-editor { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 12px 0; justify-items: center; }
.admin-row { display: flex; flex-direction: column; gap: 6px; }
.admin-row select { background: #0f1620; color: #e8f0f7; border: 1px solid #1f2a37; border-radius: 10px; padding: 8px; }
[data-theme="light"] .admin-row select { background: #ffffff; color: #111; border-color: #e5e7eb; }
.admin-actions { grid-column: 1 / -1; display: flex; justify-content: flex-end; }

.achievements-section { margin-top: 8px; }
.achievements-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.achievement-card { background: #0f1620; border: 2px solid #334155; border-radius: 14px; padding: 12px; display: flex; flex-direction: column; gap: 8px; cursor: pointer; transition: transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease; }
.achievement-card:hover { transform: translateY(-2px) scale(1.02); border-color: #2563eb; box-shadow: 0 8px 20px rgba(0,0,0,0.35), 0 0 0 2px rgba(37,99,235,0.35) inset; }
.achievement-top { display: flex; align-items: center; gap: 8px; }
.achievement-icon { width: 24px; height: 24px; }
.achievement-name { font-weight: 700; color: #fff; }
.achievement-card .progress-track { width: 100%; height: 8px; background: #1f2937; border-radius: 999px; overflow: hidden; }
.achievement-card .progress-fill { height: 100%; transition: width 500ms ease-out; }
.achievement-progress { display: flex; align-items: center; gap: 8px; }
.achievement-progress-label { min-width: 36px; text-align: right; font-size: 12px; color: #9ca3af; }
[data-theme="light"] .achievement-card { background: #ffffff; border-color: #e5e7eb; }
.title-center { position: absolute; left: 50%; transform: translateX(-50%); display: inline-flex; align-items: center; gap: 5px; }
.quests-logo { width: 30px; height: 35px; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.2)); }
.dev-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 6px; }
.close-btn { background: transparent; border: none; border-radius: 10px; width: 40px; height: 40px; cursor: pointer; padding: 0; display: flex; align-items: center; justify-content: center; }
.close-img { width: 32px; height: 32px; display: block; filter: grayscale(0.5) brightness(0.95); transition: transform 0.25s, filter 0.25s; }
.close-btn:hover .close-img { transform: scale(1.18); filter: grayscale(0) brightness(1.1); }
.quests-content { padding: 20px 24px; display: flex; flex-direction: column; gap: 24px; }
.section-title::after { content: ''; display: block; height: 4px; background: #1c9973; border-radius: 999px; margin-top: 8px; }
.progress-track { height: 8px; background: #1f2937; border-radius: 999px; overflow: hidden; }
.progress-track.large { height: 12px; }
.progress-fill { height: 100%; width: 0; transition: width 500ms ease-out; }
.progress-fill.green { background: linear-gradient(90deg, #34d399, #10b981); }
.progress-fill.zero { opacity: 0; width: 0 !important; }
.progress-fill.orange { background: linear-gradient(90deg, #34d399, #10b981); }

/* Scrollbar interne – style aligné sur Leaderboard */
.quests-modal::-webkit-scrollbar { width: 10px; }
.quests-modal::-webkit-scrollbar-track { background: transparent; margin: 12px 0; }
.quests-modal::-webkit-scrollbar-thumb { background: #cfcfcf; border-radius: 8px; }
.quests-modal::-webkit-scrollbar-button { display: none; width: 0; height: 0; }

.section-title { font-size: 26px; color: #fff; margin-bottom: 10px; }
.daily-list, .repeat-list { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.overall-progress { margin-top: 18px; }
.progress-label { margin-bottom: 8px; font-size: 18px; color: #fff; }
.quest-card { background: #0f1620; border: 2px solid #1e3a8a; border-radius: 16px; padding: 14px; display: grid; grid-template-rows: 48px 28px 12px auto; gap: 10px; }
.quest-card.small { padding: 12px; grid-template-rows: 44px 24px 12px auto; }
.quest-card.completed { border-color: #5bc682; background: #effaf3; }
.quest-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: 48px; }
.quest-name { color: #fff; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; flex: 1 1 auto; }
.quest-badge { font-size: 12px; padding: 6px 10px; border-radius: 999px; background: #e5e7eb; color: #333; font-weight: 700; }
.quest-badge.done { background: #5bc682; color: #fff; }

.quest-details { display: flex; align-items: center; justify-content: space-between; min-height: 28px; }
.quest-card.small .quest-details { min-height: 24px; }
.reward { display: flex; align-items: center; gap: 6px; color: #fff; font-size: 18px; }
.coin-icon { width: 18px; height: 18px; }
.duration { color: #666; font-size: 14px; }

.quest-actions { display: flex; gap: 8px; }
.primary-btn { background: #5bc682; color: #fff; border: none; border-radius: 12px; padding: 10px 14px; font-weight: 800; cursor: pointer; }
.secondary-btn { background: #e9ecef; color: #111; border: none; border-radius: 12px; padding: 10px 14px; font-weight: 800; cursor: pointer; }

.reroll-row { display: flex; align-items: center; gap: 10px; margin-top: 2px; }
.reroll-state { font-size: 12px; color: #0c4a6e; }
.reroll-state.used { color: #b91c1c; }

.bonus-block { margin-top: 20px; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 14px; padding: 12px; color: #0c4a6e; }
.bonus-block.active { background: #ecfdf5; border-color: #a7f3d0; color: #065f46; .bonus-title { margin-bottom: 6px; font-size: 26px; color: #fff; display: flex; align-items: center; gap: 8px; }color: #fff; }
.bonus-state { font-size: 18px; }
.bonus-info-btn { background: transparent; border: none; width: 32px; height: 32px; padding: 0; margin-left: 4px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }
.bonus-info-img { width: 32px; height: 32px; object-fit: contain; }
.bonus-inline { display: inline-flex; align-items: center; gap: 8px; color: #fff; }
.bonus-inline-coin { width: 18px; height: 18px; display: inline-block; }
.bonus-title { font-size: 26px; }
[data-theme="light"] .bonus-inline { color: #065f46; }

/* Icône validation de quête terminée */
.checkmark-icon { width: 24px; height: 24px; background: #5bc682; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 14px; font-weight: 800; flex: 0 0 24px; }

/* Animations hover quêtes journalières */
.daily-list .quest-card { transition: transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease; cursor: pointer; }
.daily-list .quest-card:hover { transform: translateY(-2px) scale(1.02); border-color: #2563eb; box-shadow: 0 8px 20px rgba(0,0,0,0.35), 0 0 0 2px rgba(37,99,235,0.35) inset; }
/* Bouton Re-roll inline (apparition au survol) */
.inline-reroll { display: flex; align-items: center; gap: 10px; margin-top: 8px; opacity: 0; transform: translateY(6px); transition: opacity 200ms ease, transform 200ms ease; pointer-events: none; }
.quest-card:hover .inline-reroll { opacity: 1; transform: translateY(0); pointer-events: auto; }
.quest-card.rerolled .inline-reroll { opacity: 1; transform: translateY(0); pointer-events: none; }
.reroll-btn.used, .reroll-btn[disabled] { background: #9ca3af; color: #fff; cursor: not-allowed; }
/* Icône dé sur Re-roll */
.dice-icon { display: inline-block; margin-right: 8px; transition: transform 300ms ease; }
.reroll-btn:hover .dice-icon, .secondary-btn:hover .dice-icon { transform: rotate(12deg) scale(1.1); }
/* Bonus désactivé (gris) */
.bonus-block.disabled { background: #1a202c; border: 1px solid #374151; color: #9ca3af; }
.bonus-block.disabled .bonus-title, .bonus-block.disabled .bonus-state { color: #9ca3af; }

/* Thème clair (light) */
[data-theme="light"] .quests-modal { background: #ffffff; color: #111; border-color: #e5e7eb; box-shadow: 0 20px 40px rgba(0,0,0,0.2); }
[data-theme="light"] .quests-header { border-bottom: 1px solid #e5e7eb; }
[data-theme="light"] .section-title { color: #111; }
[data-theme="light"] .section-title::after { background: linear-gradient(90deg, #34d399, #10b981); }
[data-theme="light"] .quest-card { background: #ffffff; border-color: #e5e7eb; }
[data-theme="light"] .quest-name { color: #111; }
[data-theme="light"] .quest-details .duration { color: #555; }
[data-theme="light"] .reward { color: #111; }
[data-theme="light"] .achievement-name { color: #111; }
[data-theme="light"] .progress-track { background: #e5e7eb; }
[data-theme="light"] .achievement-progress-label { color: #555; }
[data-theme="light"] .bonus-block { background: #f7fdfa; border-color: #d1fae5; color: #065f46; }
[data-theme="light"] .bonus-block .bonus-title, [data-theme="light"] .bonus-block .bonus-state { color: #000; }
[data-theme="light"] .bonus-block.disabled { background: #f3f4f6; border-color: #e5e7eb; color: #9ca3af; }
[data-theme="light"] .confirm-modal { background: #ffffff; border-color: #e5e7eb; color: #111; }
[data-theme="light"] .confirm-title { color: #111; }
[data-theme="light"] .confirm-msg { color: #555; }
[data-theme="light"] .progress-label { color: #111; }

/* Toast thème clair */
[data-theme="light"] .quest-toast { background: #ffffff; border-color: #e5e7eb; }
[data-theme="light"] .toast-title { color: #111; }
[data-theme="light"] .toast-sub { color: #555; }
[data-theme="light"] .toast-icon-circle { background: #ffffff; border-color: #5bc681; }
[data-theme="light"] .toast-check { background: #5bc682; color: #fff; }

/* Pop-up confirmation */
.confirm-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.55); display: flex; align-items: center; justify-content: center; z-index: 1500; }
.confirm-modal { background: #0f1620; border: 1px solid #1f2a37; color: #e8f0f7; border-radius: 14px; padding: 18px 20px; width: 520px; max-width: 90vw; box-shadow: 0 20px 40px rgba(0,0,0,0.35); animation: scaleIn 160ms ease-out; }
.confirm-title {  font-size: 26px; margin-bottom: 10px; color: #fff; }
.confirm-msg { font-size: 16px; color: #9ca3af; margin-bottom: 16px; }
.confirm-actions { display: flex; gap: 10px; justify-content: flex-end; }
@keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }

.bonus-modal { background: radial-gradient(120% 120% at 50% 20%, #141b2a 0%, #0f1620 60%, #0b1220 100%); border: 2px solid #ffd84a; }
.bonus-center { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 8px 0 6px; }
.bonus-visual { position: relative; width: 160px; height: 140px; display: flex; align-items: center; justify-content: center; }
.coin-glow { position: absolute; width: 160px; height: 160px; border-radius: 50%; background: radial-gradient(circle, rgba(255,215,0,0.28) 0%, rgba(255,215,0,0.12) 55%, rgba(255,215,0,0) 70%); filter: blur(2px); }
.bonus-coin-large { width: 120px; height: 120px; object-fit: contain; transform: rotate(-14deg); filter: drop-shadow(0 8px 18px rgba(0,0,0,0.35)); position: relative; z-index: 1; }
.coin-base { position: absolute; bottom: 4px; width: 120px; height: 18px; border-radius: 999px; background: radial-gradient(ellipse at center, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0) 100%); }
.bonus-amount { display: flex; align-items: center; justify-content: center; gap: 6px; }
.amount-text { font-size: 18px; color: #34d399; }
.amount-coin { width: 20px; height: 20px; object-fit: contain; }
.bonus-actions { display: flex; align-items: center; justify-content: center; margin-top: 6px; }
.ok-cta { background: linear-gradient(90deg, #ffcc66, #ffa94d); color: #111; border: none; border-radius: 999px; padding: 12px 38px; font-weight: 800; font-size: 18px; box-shadow: 0 8px 18px rgba(0,0,0,0.25); cursor: pointer; }
.ok-cta:hover { filter: brightness(1.05); }

.bonus-center { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 12px 0 6px; }
.bonus-coin-large { width: 84px; height: 84px; object-fit: contain; }
.bonus-amount { font-size: 28px; color: #34d399; }

/* Toast notification (bas droite) */
.quest-toast-container { position: fixed; bottom: 16px; right: 16px; display: flex; flex-direction: column; align-items: flex-end; gap: 10px; z-index: 2000; pointer-events: none; }
.quest-toast { background: #0f1620; border: 1px solid #1f2a37; border-radius: 14px; padding: 10px 12px; display: flex; align-items: center; gap: 12px; min-width: 300px; box-shadow: 0 12px 24px rgba(0,0,0,0.35); }
.quest-toast.narrow { max-width: 320px; min-width: 260px; }
.quest-toast.wide { max-width: 420px; min-width: 300px; }
.quest-toast.narrow { max-width: 320px; min-width: 260px; }
.toast-icon-circle { width: 40px; height: 40px; min-width: 40px; min-height: 40px; border: 3px solid #5bc681; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: #0b1220; flex: 0 0 40px; flex-shrink: 0; }
.toast-quests-logo { width: 22px; height: 22px; object-fit: contain; }
.toast-content { display: flex; flex-direction: column; gap: 2px; flex: 1 1 auto; }
.toast-title { font-size: 16px; color: #e8f0f7; }
.toast-sub { font-size: 16px; color: #9ca3af; white-space: normal; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; }
.toast-reward { display: flex; align-items: center; gap: 6px; font-size: 16px; color: #34d399; }
.toast-check { margin-left: auto; width: 22px; height: 22px; min-width: 22px; min-height: 22px; border-radius: 50%; background: #5bc682; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 900; flex: 0 0 22px; flex-shrink: 0; }
.quest-toast-enter-from { opacity: 0; transform: translateY(12px); }
.quest-toast-enter-active, .quest-toast-leave-active { transition: all 250ms ease; }
.quest-toast-leave-to { opacity: 0; transform: translateY(12px); }

@media (max-width: 768px) {
  .quests-modal { width: 95vw; }
  .section-title { font-size: 25px; }
  .bonus-title { font-size: 22px; display: flex; align-items: center; }
  .bonus-block.active .bonus-title { font-size: 21px; }
  .bonus-state { font-size: 14px; }
  .confirm-msg { font-size: 14px; }
  .quests-title { font-size: 28px; }
  .quests-logo { width: 25px; height: 32px; }
  .daily-list, .repeat-list { grid-template-columns: 1fr; width: 100%; justify-items: stretch; }
  .daily-list { justify-content: center; }
  .achievements-grid { grid-template-columns: repeat(1, 1fr); }
  .duration { font-size: 10px; }
  .bonus-inline { flex-wrap: wrap; }
  .bonus-inline .next-reset { flex: 1 0 100%; margin-top: 6px; }
  .daily-section .quest-card.leaderboard .quest-name { font-size: 12px; }
  .duration { font-size: 10px; }
  .admin-daily-editor { grid-template-columns: 1fr; }
  .quest-card, .quest-card.small { width: 100%; box-sizing: border-box; }
  .inline-reroll { display: none; }
  .quest-card.rerolled .inline-reroll { display: flex; opacity: 1; transform: translateY(0); }
  .daily-section .quest-name { display: flex; align-items: center;  white-space: normal; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; }
  .daily-section .quest-card { grid-template-rows: 56px 24px 12px auto; }
  .daily-section .quest-top { min-height: 56px; }
  .quest-toast { max-width: 95vw; min-width: 0; }
  .toast-sub { white-space: normal; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; }
  .progress-label { font-size: 17px; }
}
@media (min-width: 768px) and (max-width: 1024px) {
  .duration { font-size: 10px; }
}
</style>