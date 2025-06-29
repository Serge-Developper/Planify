<template>
  <div class="liste-devoirs-bg">
    <h2 class="liste-title">Liste des devoirs</h2>
    <div class="liste-tri">
      <div class="tri-group">
        <span class="tri-label">Trier par :</span>
        <div class="tri-btns-desktop">
          <button class="btn-tri" :class="{ active: sortBy === 'date' }" @click="setSort('date')">Date</button>
          <button class="btn-tri" :class="{ active: sortBy === 'passe' }" @click="setSort('passe')">Archives</button>
          <button class="btn-tri" :class="{ active: sortBy === 'exam' }" @click="setSort('exam')">Examens</button>
          <button class="btn-tri" :class="{ active: sortBy === 'devoir' }" @click="setSort('devoir')">Devoirs</button>
          <button class="btn-tri" :class="{ active: sortBy === 'enretard' }" @click="setSort('enretard')">Retard</button>
        </div>
        <div class="tri-select-mobile-wrapper">
          <select class="tri-select-mobile" v-model="sortBy">
            <option value="date">Date</option>
            <option value="passe">Archives</option>
            <option value="exam">Examens</option>
            <option value="devoir">Devoirs</option>
            <option value="enretard">Retard</option>
          </select>
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
      <div v-else-if="sortBy !== 'passe'" class="liste-col-gauche">
        <div class="col-gauche-title">Tâches complétées</div>
        <button v-if="doneEvents.length > 0" class="btn-archiver-tout" @click="archiverTout">Tout archiver</button>
        <div v-if="doneEvents.length === 0" class="aucune-tache">Aucune tâche complétée</div>
        <div v-for="event in doneEvents" :key="event.titre + event.date + event.heure" class="devoir-card-liste fait">
          <div class="matiere-label-liste" :style="{ background: stringToColor(event.matiere, event.type) }">{{ event.matiere }}</div>
          <div class="devoir-content-liste">
            <div class="devoir-titre-row">
              <div class="devoir-titre">{{ event.titre.length > 23 ? event.titre.slice(0, 23) + '...' : event.titre }}</div>
              <div class="devoir-actions">
                <img
                  :src="getCheckImage(event)"
                  alt="Valider"
                  class="btn-check-liste"
                  :class="{ checked: event.checked }"
                  @click="toggleCheck(event)"
                  @mouseover="hoveredCheck = event.titre + event.date + event.heure"
                  @mouseleave="hoveredCheck = null"
                />
              </div>
            </div>
            <div class="devoir-infos">
              📅 {{ formatDate(event.date) }} à {{ event.heure }}
            </div>
            <div class="devoir-type">
              <span v-if="event.type === 'exam'">📝 Examen</span>
              <span v-else>📚 Devoir</span>
            </div>
            <small style="color:#6366f1; font-weight:bold;">
              ⏰ {{ timeLeft(event.date, event.heure) }}
            </small>
            <button class="btn-plus-infos" @click="openPopup(event)">Plus d'infos</button>
            <img v-if="getGroupeImage(event)" :src="getGroupeImage(event)" alt="Groupe" class="groupe-img" :class="{ promo: displayGroup(event) === 'Promo' }" />
          </div>
        </div>
      </div>
      <div v-if="sortBy === 'enretard'" class="liste-col-droite">
        <div v-if="toDoEvents.length === 0" class="aucune-tache">Aucune tâche en retard</div>
        <div v-for="event in toDoEvents" :key="event.titre + event.date + event.heure" class="devoir-card-liste en-retard">
          <div class="devoir-gradient-top" :style="{ background: stringToColor(event.matiere, event.type) }"></div>
          <div class="matiere-label-liste" :style="{ background: stringToColor(event.matiere, event.type) }">{{ event.matiere }}</div>
          <div class="devoir-content-liste">
            <div class="devoir-titre-row">
              <div class="devoir-titre">{{ event.titre.length > 23 ? event.titre.slice(0, 23) + '...' : event.titre }}</div>
              <div class="devoir-actions">
                <img
                  :src="getCheckImage(event)"
                  alt="Valider"
                  class="btn-check-liste"
                  :class="{ checked: event.checked }"
                  @click="toggleCheck(event)"
                  @mouseover="hoveredCheck = event.titre + event.date + event.heure"
                  @mouseleave="hoveredCheck = null"
                />
              </div>
            </div>
            <div class="devoir-infos">
              📅 {{ formatDate(event.date) }} à {{ event.heure }}
            </div>
            <div class="devoir-type">
              <span v-if="event.type === 'exam'">📝 Examen</span>
              <span v-else>📚 Devoir</span>
            </div>
            <small style="color:#ef4444; font-weight:bold;">⚠️ En retard</small>
            <button class="btn-plus-infos" @click="openPopup(event)">Plus d'infos</button>
            <img v-if="getGroupeImage(event)" :src="getGroupeImage(event)" alt="Groupe" class="groupe-img" :class="{ promo: displayGroup(event) === 'Promo' }" />
          </div>
        </div>
      </div>
      <div v-else-if="sortBy === 'passe'" class="liste-col-archives">
        <div v-if="archives.length === 0" class="aucune-tache">Aucune tâche archivée</div>
        <div v-for="event in archives" :key="event.titre + event.date + event.heure" class="devoir-card-liste archive">
          <div class="matiere-label-liste" :style="{ background: stringToColor(event.matiere, event.type) }">{{ event.matiere }}</div>
          <div class="devoir-content-liste">
            <div class="devoir-titre-row">
              <div class="devoir-titre">{{ event.titre.length > 23 ? event.titre.slice(0, 23) + '...' : event.titre }}</div>
            </div>
            <div class="devoir-infos">
              📅 {{ formatDate(event.date) }} à {{ event.heure }}
            </div>
            <div class="devoir-type">
              <span v-if="event.type === 'exam'">📝 Examen</span>
              <span v-else>📚 Devoir</span>
            </div>
            <small style="color:#6366f1; font-weight:bold;">Archivé</small>
            <button class="btn-plus-infos" @click="openPopup(event)">Plus d'infos</button>
            <img v-if="getGroupeImage(event)" :src="getGroupeImage(event)" alt="Groupe" class="groupe-img" :class="{ promo: displayGroup(event) === 'Promo' }" />
          </div>
        </div>
      </div>
      <div v-else class="liste-col-droite">
        <div v-if="toDoEvents.length === 0" class="aucune-tache">Aucune tâche à faire</div>
        <div v-for="event in toDoEvents" :key="event.titre + event.date + event.heure" class="devoir-card-liste">
          <div class="devoir-gradient-top" :style="{ background: stringToColor(event.matiere, event.type) }"></div>
          <div class="matiere-label-liste" :style="{ background: stringToColor(event.matiere, event.type) }">{{ event.matiere }}</div>
          <div class="devoir-content-liste">
            <div class="devoir-titre-row">
              <div class="devoir-titre">{{ event.titre.length > 23 ? event.titre.slice(0, 23) + '...' : event.titre }}</div>
              <div class="devoir-actions">
                <img
                  :src="getCheckImage(event)"
                  alt="Valider"
                  class="btn-check-liste"
                  :class="{ checked: event.checked }"
                  @click="toggleCheck(event)"
                  @mouseover="hoveredCheck = event.titre + event.date + event.heure"
                  @mouseleave="hoveredCheck = null"
                />
              </div>
            </div>
            <div class="devoir-infos">
              📅 {{ formatDate(event.date) }} à {{ event.heure }}
            </div>
            <div class="devoir-type">
              <span v-if="event.type === 'exam'">📝 Examen</span>
              <span v-else>📚 Devoir</span>
            </div>
            <small style="color:#6366f1; font-weight:bold;">⏰ {{ timeLeft(event.date, event.heure) }}</small>
            <button class="btn-plus-infos" @click="openPopup(event)">Plus d'infos</button>
            <img v-if="getGroupeImage(event)" :src="getGroupeImage(event)" alt="Groupe" class="groupe-img" :class="{ promo: displayGroup(event) === 'Promo' }" />
          </div>
        </div>
      </div>
    </div>
    <div class="versions-planify">
      <h3 class="versions-title">Versions de Planify</h3>
      <div class="versions-btns">
        <img src="@/assets/img/2PlanifyByMaxsussFichier 20@3x.png" alt="Planify Mod" class="version-btn" />
      </div>
    </div>
    <div v-if="popupEvent" class="popup-overlay" @click.self="closePopup">
      <div class="popup-content">
        <h3>{{ popupEvent.titre }}</h3>
        <p><b>Matière :</b> {{ popupEvent.matiere }}</p>
        <p><b>Date :</b> {{ popupEvent.date }} {{ popupEvent.heure }}</p>
        <p><b>Description :</b> {{ popupEvent.description || 'Aucune description.' }}</p>
        <button @click="closePopup">Fermer</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import boutonValiderCocher from '@/assets/img/bouton_valider_cocher.png';
import boutonValiderDecocher from '@/assets/img/bouton_valider_decocher.png';
import { onMounted, watch } from 'vue';
import groupeA from '@/assets/img/groupe_A.png';
import groupeB from '@/assets/img/groupe_B.png';
import groupePromo from '@/assets/img/groupe_Promo.png';
import axios from 'axios';
import { defineEmits } from 'vue';

const props = defineProps({
  events: { type: Array, required: true }
});
const sortBy = ref('date');
const selectedMatiere = ref('');
const hoveredCheck = ref(null);
const user = ref(null);

// Récupérer l'utilisateur connecté
if (localStorage.getItem('user')) {
  user.value = JSON.parse(localStorage.getItem('user'));
}

// Liste officielle MMI
const mmiMatieres = [
  "Anglais",
  "Culture artistique",
  "Culture numérique",
  "Production graphique",
  "Gestion de projet",
  "Hébergement",
  "Stratégies de communication",
  "Système d'information",
  "Développement web",
  "Gestion de contenus",
  "Ergonomie et accessibilité",
  "Projet personnel et professionnel",
  "Intégration",
  "Production audio et vidéo",
  "Expression, communication et rhétorique",
  "Ecriture multimédia et narration",
  "Représentation et traitement de l'information",
  "Economie et droit du numérique"
];

function getCheckImage(event) {
  if (hoveredCheck.value === event.titre + event.date + event.heure) {
    return boutonValiderCocher;
  }
  return event.checked ? boutonValiderCocher : boutonValiderDecocher;
}

async function toggleCheck(event) {
  if (!user.value) return alert('Non connecté');
  
  try {
    if (!event.checked) {
      await axios.post(`/api/events/${event._id}/check`);
      event.checked = true;
    } else {
      await axios.post(`/api/events/${event._id}/uncheck`);
      event.checked = false;
    }
    emit('refresh-events');
  } catch (error) {
    alert("Erreur lors de la mise à jour de la tâche.");
    console.error(error);
  }
}

const sortedEvents = computed(() => {
  let arr = [...props.events];
  if (sortBy.value === 'date') {
    arr.sort((a, b) => {
      const dateA = new Date(a.date + 'T' + (a.heure ? a.heure.replace('h', ':') : '00:00'));
      const dateB = new Date(b.date + 'T' + (b.heure ? b.heure.replace('h', ':') : '00:00'));
      return dateA - dateB;
    });
  }
  return arr;
});

const doneEvents = computed(() =>
  props.events.filter(e => e.checked && !e.archived)
    .filter(e => !selectedMatiere.value || e.matiere === selectedMatiere.value)
);
const toDoEvents = computed(() => {
  let filtered = props.events.filter(e => {
    if (e.archived) return false;

    const t = timeLeft(e.date, e.heure);
    let typeFilter = true;
    if (sortBy.value === 'exam') typeFilter = e.type === 'exam' && t !== 'Terminé';
    else if (sortBy.value === 'devoir') typeFilter = e.type === 'devoir' && t !== 'Terminé';
    else if (sortBy.value === 'passe') return false; // Géré par la computed 'archives'
    else if (sortBy.value === 'enretard') typeFilter = isLate(e);
    else typeFilter = t !== 'Terminé' && !isLate(e);
    return !e.checked && (!selectedMatiere.value || e.matiere === selectedMatiere.value) && typeFilter;
  });

  if (sortBy.value === 'passe') {
    filtered = filtered.sort((a, b) => {
      const dateA = new Date(a.date + 'T' + (a.heure ? a.heure : '00:00'));
      const dateB = new Date(b.date + 'T' + (b.heure ? b.heure : '00:00'));
      return dateB - dateA;
    });
  } else {
    filtered = filtered.sort((a, b) => {
      const dateA = new Date(a.date + 'T' + (a.heure ? a.heure : '00:00'));
      const dateB = new Date(b.date + 'T' + (b.heure ? b.heure : '00:00'));
      return dateA - dateB;
    });
  }
  return filtered;
});

const archives = computed(() => 
  props.events.filter(e => e.archived && (!selectedMatiere.value || e.matiere === selectedMatiere.value))
);

function setSort(type) {
  sortBy.value = type;
}

function stringToColor(str, type) {
  if (str === "Gestion de projet") {
    return "linear-gradient(90deg, rgba(83,198,77,0.88) 0%, rgba(126,252,173,0.89) 100%)";
  }
  if (str === "Ecriture multimédia et narration") {
    return "linear-gradient(90deg, rgba(230,59,111,0.99) 0%, rgba(230,59,111,0.99) 100%)";
  }
  if (str === "Hébergement") {
    return "linear-gradient(90deg, rgba(255,181,82,0.87) 0%, rgba(255,181,128,0.88) 100%)";
  }
  if (str === "Représentation et traitement de l'information") {
    return "linear-gradient(90deg, rgba(105,60,226,0.99) 0%, rgba(105,60,226,0.99) 100%)";
  }
  if (str === "Expression, communication et rhétorique") {
    return "linear-gradient(90deg, rgba(175,55,236,0.96) 0%, rgba(253,150,253,1) 100%)";
  }
  if (str === "Production audio et vidéo") {
    return "linear-gradient(90deg, rgba(142,130,242,1) 0%, rgba(194,150,255,1) 100%)";
  }
  if (str === "Economie et droit du numérique") {
    return "linear-gradient(90deg, rgba(255,153,125,0.97) 0%, rgba(255,212,65,0.97) 100%)";
  }
  if (str === "Culture artistique") {
    return "linear-gradient(90deg, rgba(255,134,232,0.95) 0%, rgba(255,189,244,0.95) 100%)";
  }
  if (str === "Projet personnel et professionnel") {
    return "linear-gradient(90deg, rgba(229,64,229,0.92) 0%, rgba(254,140,254,0.96) 100%)";
  }
  if (str === "Anglais") {
    return "linear-gradient(90deg, rgba(255,123,176,0.78) 0%, rgba(255,135,204,1) 100%)";
  }
  if (str === "Ergonomie et accessibilité") {
    return "linear-gradient(90deg, rgba(62,134,233,0.91) 0%, rgba(137,206,254,0.88) 100%)";
  }
  if (type === 'exam') return 'hsl(10, 90%, 70%)';
  if (type === 'devoir') return 'hsl(200, 80%, 75%)';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 80%, 75%)`;
}
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}
function displayGroup(event) {
  const groupes = event.groupes || [event.groupe];
  if (groupes.includes('Promo')) return 'Promo';
  if (groupes.includes('A')) return 'A';
  if (groupes.includes('B')) return 'B';
  return groupes.filter(g => g !== 'Promo').join(', ');
}
function timeLeft(date, heure) {
  if (!date || !heure) return '';
  const [h, m] = heure.split(':');
  const target = new Date(date);
  target.setHours(Number(h), Number(m || 0), 0, 0);
  const now = new Date();
  const diff = target - now;
  if (diff <= 0) return 'Terminé';
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((diff / (1000 * 60)) % 60);
  if (days > 0) return `${days}j ${hours}h ${mins}min`;
  if (hours > 0) return `${hours}h ${mins}min`;
  return `${mins}min`;
}

const popupEvent = ref(null);

function openPopup(event) {
  popupEvent.value = event;
}
function closePopup() {
  popupEvent.value = null;
}

function getGroupeImage(event) {
  const groupes = event.groupes || [event.groupe];
  if (groupes.includes('Promo')) return groupePromo;
  if (groupes.includes('A')) return groupeA;
  if (groupes.includes('B')) return groupeB;
  return null;
}

function isLate(event) {
  const [h, m] = (event.heure || '').split(':');
  const target = new Date(event.date);
  target.setHours(Number(h), Number(m || 0), 0, 0);
  const now = new Date();
  return now > target;
}

const emit = defineEmits(['refresh-events']);

async function archiverTout() {
  if (!user.value) return alert('Non connecté');
  
  const eventsToArchive = doneEvents.value.filter(e => !e.archived);

  try {
    for (const event of eventsToArchive) {
      await axios.post(`/api/events/${event._id}/archive`);
    }
    // Demander un rafraîchissement des données au parent
    emit('refresh-events');
  } catch (error) {
    alert("Erreur lors de l'archivage des tâches.");
    console.error(error);
  }
}

// Si tu veux utiliser ce composant de façon autonome (hors EmploiDuTemps), décommente ce qui suit :
// onMounted(async () => {
//   if (!props.events || props.events.length === 0) {
//     try {
//       const token = localStorage.getItem('token');
//       const res = await axios.get('https://3e44-91-169-88-35.ngrok-free.app/api/events', {
//         headers: { Authorization: token }
//       });
//       // events.value = res.data; // à utiliser si events est ref local
//     } catch (e) {
//       // events.value = [];
//     }
//   }
// });
</script>

<style scoped>
.liste-devoirs-bg {
  width: 100%;
  margin: 0 auto;
  border-radius: 3rem 3rem 3rem 3rem;
  background: rgb(47, 53, 61);
  padding-bottom: 80px;
  margin: 0;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.liste-header {
  width: 100vw;
  max-width: none;
  margin: 0;
  border-radius: 0;
  box-shadow: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(90deg, #a8ffce 0%, #faffd1 100%);
  padding: 24px 32px 0 32px;
}
.logo-liste {
  height: 56px;
  margin-right: 32px;
}
.search-bar-liste {
  border-radius: 12px;
  border: none;
  background: #fff;
  padding: 10px 24px;
  font-size: 1.1em;
  margin-right: 24px;
  box-shadow: 0 2px 8px #0001;
}
.header-btns {
  display: flex;
  gap: 16px;
}
.btn-nav, .btn-nav2 {
  border: none;
  border-radius: 999px;
  padding: 10px 32px;
  font-weight: bold;
  font-size: 1.1em;
  background: #e0ffe6;
  color: #1a1a1a;
  margin: 0 4px;
  box-shadow: 0 2px 8px #0001;
  transition: background 0.2s;
}
.btn-nav.active, .btn-nav2.active {
  background: #5fffa1;
  color: #fff;
}
.liste-title {
  width: 100%;
  border-radius: 2rem 2rem 0rem 0rem;
  text-align: center;
  font-size: 4.5em;
  font-weight: bold;
  padding: 20px 0px 10px 0px;
  color: #fff;
  background: linear-gradient(90deg, rgba(110,255,121,255) 50%, rgba(110,255,226,255) 100%);
  text-shadow: 2px 2px 0 #b0b0b0;
  font-style: italic;
  font-family: 'Cobe Heavy', Inter, sans-serif;
}
.liste-tri {
  width: 100%;
  max-width: 900px;
  justify-content: center;
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  margin-top: 24px;
}
.tri-group {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-bottom: 0.7em;
}
.tri-label {
  display: block;
  white-space: nowrap;
  font-size: 1.2em;
  color: #fff;
  font-weight: bold;
  text-shadow: 2px 2px 0 #b0b0b0;
  text-align: left;
  margin-left: 0;
  margin-bottom: 0;
  margin-right: 16px;
}
.btn-tri {
  cursor: pointer;
  border: none;
  border-radius: 18px;
  background: #f0f0f0;
  color: #b0b0b0;
  font-weight: bold;
  font-size: 1.2em;
  padding: 12px 32px;
  margin: 0 4px;
  box-shadow: 0 2px 8px #0001;
  font-family: 'Cobe Heavy', Inter, sans-serif;
  transition: background 0.2s, color 0.2s;
}
.btn-tri.active {
  background: linear-gradient(135deg, #6db4ff 0%, #a6e0ff 100%);
  color: #fff;
  text-shadow: 1px 2px 6px #0002;
}
.liste-content[data-v-c4fab725] {
    /* width: 100%;* /
    /* max-width: 900px; */
    /* margin: 0 auto; */
    gap: 24px;
    display: flex
;
    box-sizing: border-box;
}
.liste-col-gauche {
  flex: none;
  width: 600px;
  background: #f3f3f3;
  border-radius: 16px;
  min-height: 320px;
  margin-right: 12px;
  box-shadow: 0 2px 8px #0001;
}
.liste-col-droite {
  flex: 2;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.devoir-card-liste {
  position: relative;
  border-radius: 16px;
  background: #fff;
  overflow: hidden;
  box-shadow: 0 2px 12px #0001;
  padding: 24px 32px;
  display: flex;
  align-items: center;
  gap: 24px;
  position: relative;
  width: 600px;
  max-width: 600px;
  min-width: 600px;
  margin-left: 0px;
  margin-right: auto;
  /* Ajout pour border-top arrondi */
  overflow: hidden;
  box-sizing: border-box;
}
.devoir-card-liste .devoir-gradient-top {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 8px;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  z-index: 1;
  pointer-events: none;
}
.matiere-label-liste {
  font-weight: bold;
  font-size: 1.1em;
  border-radius: 8px;
  padding: 8px 18px;
  color: #ffffff;
  margin-right: 18px;
  background: #e0ffe6;
  min-width: 180px;
  max-width: 180px;
  word-break: break-word;
  white-space: normal;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  text-shadow: 1px 1px 4px #0008, 0 1px 0 #fff2;
}
.devoir-content-liste {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.devoir-titre-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: 600px;
  gap: 12px;
}
.devoir-titre {
  font-size: 1.2em;
  font-weight: bold;
  color: #222;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
}
.devoir-infos {
  font-size: 1em;
  color: #888;
}
.devoir-type {
  font-size: 0.98em;
  color: #888;
}
.devoir-groupe {
  font-size: 0.98em;
  color: #888;
}
.btn-check-liste {
  width: 32px;
  height: 32px;
  cursor: pointer;
  transition: transform 0.25s, filter 0.25s;
  filter: grayscale(0.5) brightness(0.95);
}
.btn-check-liste.checked {
  filter: grayscale(0) brightness(1.1) drop-shadow(0 0 6px #6dfc8a88);
  transform: scale(1.08) rotate(-8deg);
}
.btn-check-liste:hover {
  transform: scale(1.18);
  filter: grayscale(0) brightness(1.1);
}
.versions-planify {
  margin: 48px auto 0 auto;
  text-align: center;
}
.versions-title {
  font-size: 2em;
  color: #fff;
  font-weight: bold;
  margin-bottom: 18px;
  text-shadow: 2px 2px 0 #b0b0b0;
}
.versions-btns {
  display: flex;
  justify-content: center;
  gap: 32px;
  margin-bottom: 32px;
}
.version-btn {
  height: 80px;
  border-radius: 24px;
  box-shadow: 0 2px 12px #0001;
}
.liste-col-gauche .devoir-card-liste.fait {
  border-width: 2px;
  border-style: dashed;
  border-color: #6db4ff;
  box-sizing: border-box;
  opacity: 0.7;
  filter: grayscale(0.5);
  cursor: pointer;
}
.liste-col-gauche .devoir-card-liste.fait:hover {
  border-width: 2px;
  border-style: solid;
  border-color: #6db4ff;
  box-sizing: border-box;
  opacity: 1;
  filter: none;
}
.col-gauche-title {
  text-align: center;
  font-size: 1.2em;
  font-weight: bold;
  color: #6db4ff;
  margin: 12px 0 8px 0;
}
.aucune-tache {
  text-align: center;
  color: #aaa;
  font-style: italic;
  margin-bottom: 12px;
}
.matiere-select {
  border-radius: 12px;
  border: none;
  background: #fff;
  padding: 10px 24px;
  font-size: 1.1em;
  width: 16rem;
  margin-left: 8px;
  font-family: 'Cobe Heavy', Inter, sans-serif;
  box-shadow: 0 2px 8px #0001;
  margin-bottom: 1.2em;
}
.aucune-matiere {
  text-align: center;
  color: #ef4444;
  font-size: 1.2em;
  font-weight: bold;
  margin: 32px 0;
  width: 100%;
}
.btn-plus-infos {
  min-width: 120px;
  max-width: 120px;
  width: 100%;
  font-size: 1em;
  padding: 6px 0;
  background: linear-gradient(90deg, #6db4ff 0%, #3a8dde 100%);
  color: #fff;
  font-weight: bold;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 0 2px 8px #0001;
  text-shadow: 1px 1px 2px #0003;
  transition: background 0.2s;
}
.btn-plus-infos:hover {
  background: linear-gradient(90deg, #3a8dde 0%, #6db4ff 100%);
}
.popup-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.popup-content {
  background: #fff;
  border-radius: 18px;
  padding: 40px 36px;
  min-width: 420px;
  max-width: 700px;
  min-height: 220px;
  max-height: 80vh;
  box-shadow: 0 2px 24px #0003;
  text-align: left;
  color: #111;
  overflow-y: auto;
}
.popup-content h3, .popup-content p, .popup-content b, .popup-content button {
  color: #111 !important;
  word-break: break-word;
}
.popup-content h3 {
  margin-top: 0;
}
.popup-content buttodn {
  margin-top: 18px;
  background: #6db4ff;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 8px 18px;
  font-weight: bold;
  cursor: pointer;
}
.devoir-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  margin-top: 4px;
}
.groupe-img {
  width: 48px;
  height: auto;
  margin-top: 18px;
  display: block;
  margin-left: auto;
}
.groupe-img.promo {
  width: 90px;
}
.devoir-card-liste.en-retard {
  background: #ffdcdc !important;
}
.btn-archiver-tout {
  background: linear-gradient(90deg, #6366f1 0%, #5fffa1 100%);
  color: #fff;
  font-weight: bold;
  border: none;
  border-radius: 8px;
  padding: 8px 18px;
  margin: 12px auto 18px auto;
  display: block;
  cursor: pointer;
  box-shadow: 0 2px 8px #0001;
  font-size: 1.1em;
  transition: background 0.2s;
}
.btn-archiver-tout:hover {
  background: linear-gradient(90deg, #5fffa1 0%, #6366f1 100%);
}
.devoir-card-liste.archive {
  opacity: 0.8;
  filter: grayscale(0.7);
  border: 2px solid #6366f1;
}
.liste-content.archives-mode {
  justify-content: center;
  display: flex;
}
.liste-col-archives {
  flex: none;
  width: 600px;
  background: #f3f3f3;
  border-radius: 16px;
  min-height: 320px;
  margin: 0 auto;
  box-shadow: 0 2px 8px #0001;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.tri-btns-desktop {
  display: flex;
  gap: 8px;
}
.tri-select-mobile-wrapper {
  width: 16rem;
  margin: 0 auto 0.5em auto;
  display: none;
}
.tri-select-mobile {
  border-radius: 12px;
  border: none;
  background: #fff;
  padding: 10px 24px;
  font-size: 1.1em;
  width: 16rem;
  margin-left: 8px;
  font-family: 'Cobe Heavy', Inter, sans-serif;
  box-shadow: 0 2px 8px #0001;
  margin-bottom: 0.5em;
  display: none;
}
@media (max-width: 1200px) {
  .liste-devoirs-bg[data-v-c4fab725] {
    max-width: 98vw;
    /* padding-left: 8px; */
    /* padding-right: 8px; */
  }
  .devoir-card-liste, .liste-col-gauche {
    width: 98vw;
    max-width: 98vw;
    min-width: 0;
  }
}
@media (max-width: 900px) {
  .liste-content {
    flex-direction: column;
    gap: 12px;
    max-width: 98vw;
  }
  .liste-col-gauche, .liste-col-droite {
    min-width: 0;
    width: 100%;
    margin-right: 0;
    border-radius: 10px;
    box-shadow: 0 1px 4px #0001;
    padding: 2px 0 2px 0;
  }
  .devoir-card-liste {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
    padding: 10px 0px;
    min-height: 48px;
    border-radius: 8px;
    margin-bottom: 6px;
    width: 100%;
    max-width: 100vw;
  }
  .matiere-label-liste {
    min-width: 0;
    max-width: 100%;
    font-size: 1em;
    padding: 6px 10px;
    border-radius: 8px;
    margin-right: 0;
    margin-bottom: 4px;
    text-align: left;
  }
  .groupe-img {
    width: 60px;
    margin-top: 10px;
  }
  .btn-plus-infos {
    min-width: 80px;
    max-width: 120px;
    font-size: 0.95em;
    padding: 6px 0;
  }
}
@media (max-width: 600px) {
  .devoir-card-liste {
    position: relative;
    width: 100%;
    min-width: 0;
    max-width: 100vw;
    padding: 10px 4px 48px 4px;
    border-radius: 12px;
    margin-bottom: 10px;
    align-items: center;
    gap: 8px;
    display: flex;
    flex-direction: column;
  }
  .devoir-content-liste {
    align-items: center;
    gap: 4px;
    width: 100%;
    position: relative;
    display: flex;
    flex-direction: column;
    text-align: center;
  }
  .devoir-titre-row {
    justify-content: center;
    width: 100%;
    gap: 8px;
    display: flex;
    align-items: center;
  }
  .devoir-titre, .devoir-infos, .devoir-type, .btn-plus-infos, small {
    text-align: center;
    width: 100%;
  }
  .groupe-img[data-v-c4fab725][data-v-c4fab725] {
    position: absolute;
    left: 5px;
    bottom: -40px;
    width: 38px;
    height: auto;
    margin: 0;
  }
  .groupe-img.promo[data-v-c4fab725][data-v-c4fab725] {
    width: 70px;
  }
  .btn-check-liste {
    position: absolute;
    right: 5px;
    bottom: -40px;
    width: 28px;
    height: 28px;
    margin: 0;
  }
  .liste-col-gauche[data-v-c4fab725][data-v-c4fab725][data-v-c4fab725],
  .liste-col-droite[data-v-c4fab725][data-v-c4fab725][data-v-c4fab725] {
    width: 75vw;
    max-width: 90vw;
    margin-left: auto;
    margin-right: auto;
  }
  .liste-title[data-v-c4fab725] {
    font-size: 1.8em;
    padding: 8px 0 6px 0;
    border-radius: 1.2rem 1.2rem 0 0;
  }
  .liste-tri {
    max-width: 100vw;
    gap: 4px;
    margin-top: 8px;
    margin-bottom: 8px;
    flex-wrap: wrap;
  }
  .tri-group {
    flex-direction: column;
    align-items: flex-start;
  }
  .tri-label {
    font-size: 0.98em;
    margin-right: 0;
    text-align: left;
    margin-left: 0;
    display: block;
    margin-bottom: 0.2em;
  }
  .btn-tri {
    font-size: 0.98em;
    padding: 6px 10px;
    border-radius: 10px;
  }
  .matiere-select[data-v-c4fab725] {
    font-size: 0.98em;
    padding: 6px 8px;
    border-radius: 8px;
    width: 15rem;
    margin: 0 auto 1.2em auto;
    min-width: 83px;
  }
  .devoir-titre {
    font-size: 1em;
  }
  .groupe-img {
    width: 40px;
    margin-top: 6px;
  }
  .btn-plus-infos {
    min-width: 60px;
    max-width: 90px;
    font-size: 0.92em;
    padding: 5px 0;
  }
  .tri-btns-desktop {
    display: none;
  }
  .tri-select-mobile-wrapper {
    display: block;
  }
  .tri-select-mobile {
    font-size: 0.98em;
    padding: 6px 8px;
    border-radius: 8px;
    width: 15rem;
    margin: 0 auto;
    min-width: 83px;
    box-shadow: 0 2px 8px #0001;
    font-family: 'Cobe Heavy', Inter, sans-serif;
    background: #fff;
    color: #222;
    border: none;
    margin-bottom: 0.5em;
    display: block;
  }
  .devoir-gradient-top + .matiere-label-liste {
    margin-top: 12px;
  }
}
</style>