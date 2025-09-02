

<template>
  <div class="liste-devoirs-bg">
    <h2 class="liste-title">Liste des devoirs</h2>

    <div class="liste-tri">
      <div class="tri-group">
        <span class="tri-label">Trier par :</span>
        <div class="tri-btns-desktop">
          <button class="btn-tri" :class="{ active: sortBy === 'date' }" @click="setSort('date')">Date</button>
          <button class="btn-tri" :class="{ active: sortBy === 'passe' }" @click="setSort('passe')">Archives</button>
          <button class="btn-tri" :class="{ active: sortBy === 'exam' }" @click="() => setSort('exam')">Examens</button>
          <button class="btn-tri" :class="{ active: sortBy === 'devoir' }" @click="() => setSort('devoir')">Devoirs</button>
        </div>
      </div>
      <div class="tri-group">
        <span class="tri-label">Matière :</span>
        <select v-model="selectedMatiere" class="matiere-select">
          <option value="">Toutes</option>
          <option v-for="matiere in mmiMatieres" :key="matiere" :value="matiere">{{ matiere }}</option>
        </select>
      </div>
    </div>

    <div class="liste-content" :class="{ 'archives-mode': sortBy === 'passe' }">
      <div v-if="props.events.length === 0 && sortBy !== 'passe'" class="aucune-matiere">Aucune matière trouvée</div>
      <template v-else-if="sortBy !== 'passe'">
        <div class="liste-deux-colonnes">
          <div class="liste-col-gauche">
            <div class="col-gauche-title">Tâches complétées</div>
            <div v-if="doneEvents.length === 0" class="aucune-tache">Aucune tâche complétée</div>
            <div v-for="event in doneEvents" :key="eventKey(event)" class="devoir-card-liste fait">
              <div class="matiere-label-liste" :style="{ background: stringToColor(event.matiere, event.type) }">{{ event.matiere }}</div>
              <div class="devoir-content-liste">
                <div class="devoir-titre-row">
                  <div class="devoir-titre">{{ formatTitre(event.titre) }}</div>
                </div>
                <div class="devoir-infos">📅 {{ formatDate(event.date) }} à {{ event.heure }}</div>
                <div class="devoir-type"><span v-if="event.type === 'exam'">📝 Examen</span><span v-else>📚 Devoir</span></div>
                <button class="btn-plus-infos" @click="openPopup(event)">Plus d'infos</button>
              </div>
            </div>
          </div>
          <div class="liste-col-droite">
            <div v-if="toDoEvents.length === 0" class="aucune-tache">Aucune tâche à faire</div>
            <div v-for="event in toDoEvents" :key="eventKey(event)" class="devoir-card-liste">
              <div class="devoir-gradient-top" :style="{ background: stringToColor(event.matiere, event.type) }"></div>
              <div class="matiere-label-liste" :style="{ background: stringToColor(event.matiere, event.type) }">{{ event.matiere }}</div>
              <div class="devoir-content-liste">
                <div class="devoir-titre-row">
                  <div class="devoir-titre">{{ formatTitre(event.titre) }}</div>
                </div>
                <div class="devoir-infos">📅 {{ formatDate(event.date) }} à {{ event.heure }}</div>
                <div class="devoir-type"><span v-if="event.type === 'exam'">📝 Examen</span><span v-else>📚 Devoir</span></div>
                <button class="btn-plus-infos" @click="openPopup(event)">Plus d'infos</button>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <div v-if="popupEvent" class="popup-overlay" @click.self="closePopup">
      <div class="popup-content">
        <h3>{{ popupEvent.titre }}</h3>
        <p><b>Matière :</b> {{ popupEvent.matiere }}</p>
        <p><b>Date :</b> {{ formatDate(popupEvent.date) }} {{ popupEvent.heure }}</p>
        <p><b>Description :</b>
          <span class="multiline-html">{{ popupEvent.description }}</span>
        </p>
        <button class="btn-fermer-popup" @click="closePopup">Fermer</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useSubjectsStore } from '@/stores/subjects'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({ events: { type: Array, required: true } })

const sortBy = ref('date')
const selectedMatiere = ref('')
const popupEvent = ref(null)

const subjectsStore = useSubjectsStore()
const authStore = useAuthStore()

onMounted(async () => {
  try { await subjectsStore.initializeStore() } catch {}
})

const mmiMatieres = computed(() => {
  const userYear = authStore.user?.year || ''
  const userSpec = authStore.user?.specialite || ''
  const dyn = subjectsStore.getSubjects
    .filter((s) => {
      const years = Array.isArray(s?.yearsAllowed) ? s.yearsAllowed : []
      if (years.length > 0 && userYear && !years.includes(userYear)) return false
      const specs = Array.isArray(s?.specialitesAllowed) ? s.specialitesAllowed : []
      if (specs.length > 0 && userSpec && !specs.includes(userSpec)) return false
      return true
    })
    .map(s => s.name)
  const statiques = [
    'Anglais','Culture artistique','Culture numérique','Production graphique','Gestion de projet','Hébergement','Stratégies de communication','Système d\'information','Développement web','Gestion de contenus','Ergonomie et accessibilité','Projet personnel et professionnel','Intégration','Production audio et vidéo','Expression, communication et rhétorique','Ecriture multimédia et narration','Représentation et traitement de l\'information','Economie et droit du numérique'
  ]
  return [...new Set([...statiques, ...dyn])]
})

function eventKey(e) { return e && (e._id || (e.titre + e.date + e.heure)) }
function setSort(type) { sortBy.value = type }
function openPopup(e) { popupEvent.value = e; try { document.body.style.overflow = 'hidden' } catch {}
}
function closePopup() { popupEvent.value = null; try { document.body.style.overflow = '' } catch {}
}
function formatTitre(t) { return (t || '').length > 23 ? (t || '').slice(0, 23) + '...' : (t || '') }
function formatDate(dateStr) { if (!dateStr) return ''; const d = new Date(dateStr); return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) }

const doneEvents = computed(() => props.events.filter(e => e.checked && !e.archived && !e.hidden).filter(e => !selectedMatiere.value || e.matiere === selectedMatiere.value))
const toDoEvents = computed(() => props.events.filter(e => !e.archived && !e.hidden && !e.checked).filter(e => !selectedMatiere.value || e.matiere === selectedMatiere.value))

function stringToColor(str, type) {
  const matiereDynamique = subjectsStore.getSubjectByName(str)
  if (matiereDynamique) {
    const c1 = matiereDynamique.color
    const c2 = (matiereDynamique.useGradient === false) ? null : matiereDynamique.color2
    const a1 = typeof matiereDynamique.colorOpacity === 'number' ? matiereDynamique.colorOpacity : 1
    const a2 = typeof matiereDynamique.color2Opacity === 'number' ? matiereDynamique.color2Opacity : 1
    const angle = typeof matiereDynamique.gradientAngle === 'number' ? matiereDynamique.gradientAngle : 135
    if (c2) {
      const hexToRgb = (hex) => { const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || ''); return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : null }
      const rgba = (hex, alpha) => { const rgb = hexToRgb(hex); if (!rgb) return hex || '#000000'; const a = typeof alpha === 'number' ? Math.min(1, Math.max(0, alpha)) : 1; return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a})` }
      return `linear-gradient(${angle}deg, ${rgba(c1, a1)}, ${rgba(c2, a2)})`
    }
    return c1
  }
  if (type === 'exam') return 'hsl(10, 90%, 70%)'
  if (type === 'devoir') return 'hsl(200, 80%, 75%)'
  let hash = 0; for (let i = 0; i < String(str || '').length; i++) hash = String(str).charCodeAt(i) + ((hash << 5) - hash);
  const h = Math.abs(hash) % 360; return `hsl(${h}, 80%, 75%)`
}
</script>

<style>
.liste-devoirs-bg { width: 100%; margin: 0 auto; margin-top: 5%; margin-bottom: 5%; border-radius: 3rem; background: rgb(47,53,61); padding-bottom: 60px; max-width: 1300px; display:flex; flex-direction:column; align-items:center; font-family: 'Cobe Heavy', Inter, sans-serif; }
.liste-title { width: 100%; border-radius: 2rem 2rem 0 0; text-align: center; font-size: 3em; padding: 18px 0 10px; color: #fff; background: linear-gradient(90deg, rgba(110,255,121,255) 50%, rgba(110,255,226,255) 100%); text-shadow: 2px 2px 0 #b0b0b0; font-style: italic; }
.liste-tri { width: 100%; max-width: 900px; justify-content: center; display:flex; align-items:center; gap:16px; margin:24px 0; }
.tri-group { display:flex; flex-direction:row; align-items:center; }
.tri-label { white-space:nowrap; font-size:1.1em; color:#fff; text-shadow:2px 2px 0 #b0b0b0; margin-right: 12px; }
.btn-tri { cursor:pointer; border:none; border-radius:18px; background:#f0f0f0; color:#b0b0b0; font-size:1.1em; padding:10px 24px; margin:0 4px; box-shadow:0 2px 8px #0001; font-family:'Cobe Heavy', Inter, sans-serif; }
.btn-tri.active { background: linear-gradient(135deg, #6db4ff 0%, #a6e0ff 100%); color:#fff; }
.matiere-select { border-radius:12px; border:none; background:#fff; padding:10px 24px; font-size:1.1em; width:16rem; box-shadow:0 2px 8px #0001; }
.liste-content { gap:24px; display:flex; width:100%; max-width:900px; }
.liste-col-gauche { flex:none; width:600px; background:#f3f3f3; border-radius:16px; min-height:320px; margin-right:12px; box-shadow:0 2px 8px #0001; }
.liste-col-droite { flex:2; display:flex; flex-direction:column; gap:18px; }
.devoir-card-liste { position:relative; border-radius:16px; background:#fff; overflow:hidden; box-shadow:0 2px 12px #0001; padding:24px 32px; display:flex; align-items:center; gap:24px; width:600px; max-width:600px; min-width:600px; margin-right:auto; }
.devoir-gradient-top { position:absolute; top:0; left:0; width:100%; height:8px; border-top-left-radius:16px; border-top-right-radius:16px; z-index:1; pointer-events:none; }
.matiere-label-liste { font-size:1.05em; border-radius:8px; padding:8px 18px; color:#fff; margin-right:18px; min-width:180px; max-width:180px; text-align:center; text-shadow: 1px 1px 4px #0008; }
.devoir-content-liste { flex:1; display:flex; flex-direction:column; gap:4px; }
.devoir-titre-row { display:flex; align-items:center; justify-content:space-between; gap:12px; }
.devoir-titre { font-size:1.2em; color:#222; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; flex:1; min-width:0; }
.devoir-infos { font-size:1em; color:#888; }
.devoir-type { font-size:0.98em; color:#888; }
.btn-plus-infos { min-width:120px; max-width:120px; width:100%; font-size:1em; padding:8px 0; background: linear-gradient(90deg, #6db4ff 0%, #3a8dde 100%); color:#fff; border:none; border-radius:8px; cursor:pointer; box-shadow:0 2px 8px #0001; font-family:'Cobe Heavy', Inter, sans-serif; }
.aucune-matiere, .aucune-tache { text-align:center; color:#aaa; font-style:italic; margin: 12px 0; font-family:'Cobe Heavy', Inter, sans-serif; }
.col-gauche-title { text-align:center; font-size:1.1em; color:#6db4ff; margin:12px 0 8px; }
.popup-overlay { position: fixed; top:0; left:0; right:0; bottom:0; background: rgba(0,0,0,0.35); display:flex; align-items:center; justify-content:center; z-index:1000; }
.popup-content { background:#fff; border-radius:18px; padding:32px; min-width:320px; max-width:700px; max-height:80vh; box-shadow:0 2px 24px #0003; color:#111; overflow-y:auto; }
.btn-fermer-popup { background:#111; color:#fff; border:none; border-radius:24px; padding:10px 28px; margin-top:18px; font-size:1.05em; cursor:pointer; }
</style>
 
