<template>
  <div class="factions-page">
    <h2>Leaderboards des Factions</h2>

    <div class="faction-join">
      <p>Choisis ta faction :</p>
      <button @click="join('Bagnat')" :disabled="busy">Rejoindre Bagnat</button>
      <button @click="join('Fermier')" :disabled="busy">Rejoindre Fermier</button>
      <span v-if="myFaction">Ta faction: {{ myFaction }}</span>
    </div>

    <!-- Compte à rebours mensuel -->
    <div class="month-timer">
      <span>🕒 Temps restant&nbsp;: {{ countdownText }}</span>
      <small class="timer-range">Période&nbsp;: {{ periodLabel }}</small>
    </div>

    <div class="totals">
      <div class="total-card">
        <h3>Bagnat</h3>
        <p>Total coins: {{ totals.bagna }}</p>
        <p>Membres: {{ members.bagna }}</p>
      </div>
      <div class="total-card">
        <h3>Fermier</h3>
        <p>Total coins: {{ totals.fermier }}</p>
        <p>Membres: {{ members.fermier }}</p>
      </div>
    </div>

    <div class="leaderboards">
      <div class="board">
        <h3>Bagnat</h3>
        <table>
          <thead><tr><th>#</th><th>Utilisateur</th><th>Coins</th></tr></thead>
          <tbody>
            <tr v-for="(u,i) in bagna" :key="u._id">
              <td>{{ i+1 }}</td>
              <td>{{ u.username }}</td>
              <td>{{ u.coins }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="board">
        <h3>Fermier</h3>
        <table>
          <thead><tr><th>#</th><th>Utilisateur</th><th>Coins</th></tr></thead>
          <tbody>
            <tr v-for="(u,i) in fermier" :key="u._id">
              <td>{{ i+1 }}</td>
              <td>{{ u.username }}</td>
              <td>{{ u.coins }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { secureApiCall } from '../api'

const busy = ref(false)
const myFaction = ref('')
const bagna = ref<any[]>([])
const fermier = ref<any[]>([])
const totals = ref({ bagna: 0, fermier: 0 })
const members = ref({ bagna: 0, fermier: 0 })

// Compte à rebours (mois courant → fin du mois)
const countdownText = ref('')
const periodLabel = ref('')
let timerId: number | null = null

function updateTimer() {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()

  // Fin de mois = début du mois suivant – 1 ms
  const nextMonthStart = new Date(y, m + 1, 1, 0, 0, 0, 0)
  const diffMs = nextMonthStart.getTime() - now.getTime()
  const remainMs = Math.max(0, diffMs)

  const days = Math.floor(remainMs / 86400000)
  const hours = Math.floor((remainMs % 86400000) / 3600000)
  const minutes = Math.floor((remainMs % 3600000) / 60000)
  const seconds = Math.floor((remainMs % 60000) / 1000)

  countdownText.value = remainMs > 0
    ? `${days} j ${hours} h ${minutes} min ${seconds} s`
    : 'Bataille terminée — attribution des récompenses'

  const startOfMonth = new Date(y, m, 1)
  const endOfMonthDate = new Date(y, m + 1, 0) // dernier jour du mois
  periodLabel.value = `${startOfMonth.toLocaleDateString('fr-FR')} → ${endOfMonthDate.toLocaleDateString('fr-FR')}`
}

async function load() {
  const res = await secureApiCall('/factions/leaderboard')
  bagna.value = res?.bagnaTopUsers || []
  fermier.value = res?.fermierTopUsers || []
  totals.value = { bagna: Number(res?.factions?.find((f:any)=>f.name==='Bagnat')?.totalCoins||0), fermier: Number(res?.factions?.find((f:any)=>f.name==='Fermier')?.totalCoins||0) }
  members.value = { bagna: Number(res?.factions?.find((f:any)=>f.name==='Bagnat')?.membersCount||0), fermier: Number(res?.factions?.find((f:any)=>f.name==='Fermier')?.membersCount||0) }
}

async function join(name: 'Bagnat'|'Fermier') {
  try {
    busy.value = true
    await secureApiCall('/factions/join', { method: 'POST', body: JSON.stringify({ faction: name }) })
    myFaction.value = name
    try { window.dispatchEvent(new CustomEvent('achievement-unlocked', { detail: { id: 'faction-join', title: 'Nouveau membre', description: 'Rejoindre une faction' } })) } catch {}
    await load()
  } catch (e:any) {
    alert(e?.message || 'Erreur')
  } finally {
    busy.value = false
  }
}

onMounted(() => {
  load()
  updateTimer()
  timerId = window.setInterval(updateTimer, 1000)
})
onUnmounted(() => { if (timerId) window.clearInterval(timerId) })
</script>

<style scoped>
.factions-page { padding: 16px; }
.leaderboards { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.board { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; }
.board table { width: 100%; border-collapse: collapse; }
.board th, .board td { text-align: left; padding: 6px; border-bottom: 1px solid #f1f5f9; }
.totals { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 12px 0; }
.total-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px; }
.faction-join { display: flex; gap: 8px; align-items: center; margin-bottom: 10px; }

/* Styles du compte à rebours */
.month-timer {
  background: #f5f7ff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 12px;
}
.month-timer .timer-range {
  color: #6b7280;
  display: block;
  margin-top: 4px;
}
</style>