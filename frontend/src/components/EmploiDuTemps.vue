<template>
  <div class="bg-gradient">
    <div class="main-container">
      <div class="switch-view-bar" style="display: flex; justify-content: center; gap: 12px; margin-bottom: 18px;">
        <button :class="{ active: mode === 'grille' }" @click="mode = 'grille'" style="padding: 8px 24px; border-radius: 999px; border: none; font-weight: bold; background: #6366f1; color: #fff; opacity: 0.9;">Vue Emploi du temps</button>
        <button :class="{ active: mode === 'liste' }" @click="mode = 'liste'" style="padding: 8px 24px; border-radius: 999px; border: none; font-weight: bold; background: #10b981; color: #fff; opacity: 0.9;">Vue Liste</button>
      </div>
      <div v-if="mode === 'grille'">
        <h2 class="title">Emploi du temps</h2>
        <div v-if="events.length === 0" class="aucune-matiere">Aucune matière trouvée</div>
        <div v-else class="week-nav">
          <img src="@/assets/img/arrow_left.png" alt="Précédent" class="week-arrow-img" @click="prevWeek" />
          <span class="week-label">Semaine du {{ getDateForDay(0) }} au {{ getDateForDay(4) }}</span>
          <img src="@/assets/img/arrow_right.png" alt="Suivant" class="week-arrow-img" @click="nextWeek" />
        </div>
        <div v-if="events.length !== 0" class="grid-emploi">
          <div class="header">Heures</div>
          <div v-for="(day, idx) in days" :key="day" class="header">
            {{ day }}<br>
            <span class="date-header">{{ getDateForDay(idx) }}</span>
          </div>
          <template v-for="hour in hours" :key="hour">
            <div class="hour">{{ hour }}</div>
            <div v-for="day in days" :key="day + hour" class="cell">
              <template v-if="getEvents(day, hour).filter(eventIsVisible).length > 0">
                <div v-for="event in getEvents(day, hour).filter(eventIsVisible)" :key="event.titre + event.date + event.heure" class="event-block" :style="{ background: stringToColor(event.matiere, event.type) }">
                  <b>{{ event.matiere }}</b><br>
                  <span>{{ event.titre }}</span><br>
                  <small><span class="groupe-label">{{ displayGroup(event) }}</span> - {{ event.type === 'exam' ? 'Examen' : 'Devoir' }}</small><br>
                  <small>Année {{ event.year }}</small>
                  <span class="event-hour">{{ event.heure }}</span>
                </div>
              </template>
              <template v-else-if="user && (user.role === 'delegue' || user.role === 'prof')">
                <button class="add-btn" @click="openAddForm(day, hour)">+</button>
                <div v-if="showAddForm[`${day}-${hour}`]" class="add-form-modal">
                  <form @submit.prevent="submitAddForm(day, hour)">
                    <input v-model="addForm.titre" placeholder="Titre" required />
                    <select v-model="addForm.type"><option value="exam">Examen</option><option value="devoir">Devoir</option></select>
                    <select v-model="addForm.matiere"> <option v-for="m in matieres" :key="m">{{ m }}</option> </select>
                    <div class="groupes-checkboxes">
                      <label v-if="allowedGroupesForUser().includes('Promo')">
                        <input type="checkbox" value="Promo" v-model="addForm.groupes" @change="handleGroupCheck(groupes[0])" /> Promo
                      </label>
                      <label v-if="allowedGroupesForUser().includes('A')">
                        <input type="checkbox" value="A" v-model="addForm.groupes" @change="handleGroupCheck(groupes[1])" :disabled="isParentDisabled('A')" /> A
                      </label>
                      <label v-for="child in groupes[1].children" :key="child" v-if="allowedGroupesForUser().includes(child)">
                        <input type="checkbox" :value="child" v-model="addForm.groupes" :disabled="isChildDisabled(groupes[1])" /> {{ child }}
                      </label>
                      <label v-if="allowedGroupesForUser().includes('B')">
                        <input type="checkbox" value="B" v-model="addForm.groupes" @change="handleGroupCheck(groupes[2])" :disabled="isParentDisabled('B')" /> B
                      </label>
                      <label v-for="child in groupes[2].children" :key="child" v-if="allowedGroupesForUser().includes(child)">
                        <input type="checkbox" :value="child" v-model="addForm.groupes" :disabled="isChildDisabled(groupes[2])" /> {{ child }}
                      </label>
                    </div>
                    <button type="submit">Ajouter</button>
                    <button type="button" @click="closeAddForm">Annuler</button>
                  </form>
                </div>
              </template>
            </div>
          </template>
        </div>
      </div>
      <ListeDevoirs v-else :events="filteredEvents" @refresh-events="reloadEvents" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import EventForm from './EventForm.vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
import AdminDashboard from '../components/AdminDashboard.vue'
import EmploiGrille from './EmploiGrille.vue'
import ListeDevoirs from './ListeDevoirs.vue'

const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
const hours = [
  '08h00', '09h00', '10h00', '11h00', '12h00', '13h00', '14h00', '15h00', '16h00',
  '17h00', '18h00', '19h00', '20h00', '21h00', '22h00', '23h00'
];

const events = ref([]);
const showForm = ref(false);
const user = ref(null);
const router = useRouter();
const username = ref('');
const password = ref('');
const error = ref('');
const mode = ref('grille');

const matieres = [
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

const groupes = [
  { label: 'Promo', children: ['A', "A'", 'A"', 'B', "B'", 'B""'] },
  { label: 'A', children: ["A'", 'A"'] },
  { label: 'B', children: ["B'", 'B""'] }
];
const uniqueGroupes = ['Promo', 'A', "A'", 'A"', 'B', "B'", 'B""'];

const eventForm = ref({
  titre: '',
  date: '',
  heure: '',
  groupe: 'A',
  type: 'exam',
  matiere: matieres[0],
  year: 1
});

const weekOffset = ref(0);

const showAddForm = ref({});
const addForm = ref({
  titre: '',
  type: 'exam',
  matiere: matieres[0],
  groupes: [],
  year: 1
});

function getMondayOfWeek(offset) {
  const d = new Date();
  const day = d.getDay(), diff = d.getDate() - day + (day === 0 ? -6 : 1) + offset * 7;
  return new Date(d.setDate(diff));
}
let monday = ref(getMondayOfWeek(weekOffset.value));

function getDateForDay(idx) {
  const date = new Date(monday.value);
  date.setDate(monday.value.getDate() + idx);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function getDayName(dateStr) {
  const date = new Date(dateStr);
  // getDay() : 0=dimanche, 1=lundi, ... 5=vendredi
  const jsDay = date.getDay();
  // Si dimanche (0), on retourne rien
  if (jsDay === 0) return null;
  return days[jsDay - 1];
}

function normalizeHour(h) {
  // Accepte '14:00' ou '14h00' et retourne '14h00'
  if (!h) return '';
  return h.replace(':', 'h').padEnd(5, '0');
}

function getEvents(day, hour) {
  // Affiche les events dont l'heure commence par l'heure de la case (ex: 09h00 → 09:00, 09:15, 09:30, 09:45)
  return events.value.filter(e => {
    const eventDate = new Date(e.date);
    const mondayDate = new Date(monday.value);
    mondayDate.setHours(0,0,0,0);
    const sundayDate = new Date(monday.value);
    sundayDate.setDate(monday.value.getDate() + 6);
    sundayDate.setHours(23,59,59,999);
    if (eventDate < mondayDate || eventDate > sundayDate) return false;
    const eventDay = getDayName(e.date);
    // On prend l'heure de la case (ex: 09h00 → 09)
    const caseHour = hour.slice(0,2);
    // On prend l'heure de l'événement (ex: 09:30 → 09)
    const eventHour = (e.heure || '').replace('h', ':').slice(0,2);
    return eventDay === day && caseHour === eventHour;
  });
}

onMounted(async () => {
  if (localStorage.getItem('user')) {
    user.value = JSON.parse(localStorage.getItem('user'));
  }
  await reloadEvents();
});

function canAdd() {
  return user.value && ['admin', 'moderateur', 'prof'].includes(user.value.role);
}

async function login() {
  try {
    const res = await axios.post('/api/users/login', {
      username: username.value,
      password: password.value
    });
    localStorage.setItem('user', JSON.stringify(res.data));
    router.push('/');
  } catch (err) {
    error.value = err.response?.data?.message || 'Erreur de connexion';
  }
}

async function addEvent() {
  try {
    const res = await axios.post('/api/events', eventForm.value);
    events.value.push(res.data);
    eventForm.value = { titre: '', date: '', heure: '', groupe: 'A', type: 'exam', matiere: selectedMatiere.value, year: 1 };
  } catch (err) {
    alert('Erreur lors de l\'ajout : ' + (err.response?.data?.message || err.message));
  }
}

async function deleteEvent(event, idx) {
  try {
    await axios.delete(`/api/events/${event._id}`);
    events.value.splice(idx, 1);
  } catch (e) {
    alert('Erreur lors de la suppression');
  }
}

const matiereGradients = {
  'Anglais': 'linear-gradient(90deg,#6fffa7 0%,#6fffe9 100%)',
  'Culture artistique': 'linear-gradient(90deg,#ffb347 0%,#ffcc33 100%)',
  'Culture numérique': 'linear-gradient(90deg,#6a82fb 0%,#fc5c7d 100%)',
  'Production graphique': 'linear-gradient(90deg,#f7971e 0%,#ffd200 100%)',
  'Gestion de projet': 'linear-gradient(90deg,#43cea2 0%,#185a9d 100%)',
  'Hébergement': 'linear-gradient(90deg,#ff512f 0%,#dd2476 100%)',
  'Stratégies de communication': 'linear-gradient(90deg,#1d4350 0%,#a43931 100%)',
  "Système d'information": 'linear-gradient(90deg,#00c6ff 0%,#0072ff 100%)',
  'Développement web': 'linear-gradient(90deg,#f7971e 0%,#ffd200 100%)',
  'Gestion de contenus': 'linear-gradient(90deg,#f7971e 0%,#ffd200 100%)',
  'Ergonomie et accessibilité': 'linear-gradient(90deg,#f7971e 0%,#ffd200 100%)',
  'Projet personnel et professionnel': 'linear-gradient(90deg,#f7971e 0%,#ffd200 100%)',
  'Intégration': 'linear-gradient(90deg,#f7971e 0%,#ffd200 100%)',
  'Production audio et vidéo': 'linear-gradient(90deg,#f7971e 0%,#ffd200 100%)',
  'Expression, communication et rhétorique': 'linear-gradient(90deg,#f7971e 0%,#ffd200 100%)',
  'Ecriture multimédia et narration': 'linear-gradient(90deg,#f7971e 0%,#ffd200 100%)',
  'Représentation et traitement de l\'information': 'linear-gradient(90deg,#f7971e 0%,#ffd200 100%)',
  'Economie et droit du numérique': 'linear-gradient(90deg,#f7971e 0%,#ffd200 100%)',
};

function stringToColor(str, type) {
  if (matiereGradients[str]) {
    return matiereGradients[str];
  }
  if (type === 'exam') {
    return 'linear-gradient(90deg,#ff512f 0%,#dd2476 100%)';
  } else if (type === 'devoir') {
    return 'linear-gradient(90deg,#6a82fb 0%,#fc5c7d 100%)';
  }
  return 'linear-gradient(90deg,#6fffa7 0%,#6fffe9 100%)';
}

function prevWeek() {
  weekOffset.value--;
  monday.value = getMondayOfWeek(weekOffset.value);
}
function nextWeek() {
  weekOffset.value++;
  monday.value = getMondayOfWeek(weekOffset.value);
}

function openAddForm(day, hour) {
  showAddForm.value = { [`${day}-${hour}`]: true };
  addForm.value = {
    titre: '',
    type: 'exam',
    matiere: matieres[0],
    groupes: [],
    year: 1
  };
}
function closeAddForm() {
  showAddForm.value = {};
}
function submitAddForm(day, hour) {
  const idx = days.indexOf(day);
  const date = new Date(monday.value);
  date.setDate(monday.value.getDate() + idx);
  const dateStr = date.toISOString().slice(0, 10);
  // Pour délégué/prof, l'année est celle de l'utilisateur
  if (user.value && (user.value.role === 'delegue' || user.value.role === 'prof')) {
    addForm.value.year = user.value.year;
  }
  events.value.push({
    titre: addForm.value.titre,
    date: dateStr,
    heure: hour,
    type: addForm.value.type,
    matiere: addForm.value.matiere,
    groupes: [...addForm.value.groupes],
    year: addForm.value.year
  });
  localStorage.setItem('admin-events', JSON.stringify(events.value));
  closeAddForm();
}

function handleGroupCheck(parent) {
  if (parent.label === 'Promo') {
    if (addForm.value.groupes.includes('Promo')) {
      // Coche tout et désactive tout le reste
      addForm.value.groupes = [...uniqueGroupes];
    } else {
      // Décoche tout
      addForm.value.groupes = [];
    }
    return;
  }
  // Si parent A/B coché, coche ses enfants et les désactive
  if (addForm.value.groupes.includes(parent.label)) {
    parent.children.forEach(child => {
      if (!addForm.value.groupes.includes(child)) addForm.value.groupes.push(child);
    });
  } else {
    parent.children.forEach(child => {
      const idx = addForm.value.groupes.indexOf(child);
      if (idx !== -1) addForm.value.groupes.splice(idx, 1);
    });
  }
}
function isChildDisabled(parent) {
  // Désactive si Promo ou parent est coché
  return addForm.value.groupes.includes('Promo') || addForm.value.groupes.includes(parent.label);
}
function isParentDisabled(label) {
  // Désactive A/B si Promo est coché
  return addForm.value.groupes.includes('Promo');
}

function displayGroup(event) {
  const groupes = event.groupes || [event.groupe];
  if (groupes.includes('Promo')) return 'Promo';
  if (groupes.includes('A')) return 'A';
  if (groupes.includes('B')) return 'B';
  return groupes.filter(g => g !== 'Promo').join(', ');
}

function eventIsVisible(event) {
  if (!user.value) return true;
  if (user.value.role === 'eleve' || user.value.role === 'delegue') {
    const groupes = event.groupes || [event.groupe];
    // Promo = tout le monde de la même année
    if (groupes.includes('Promo')) return event.year == user.value.year;
    // Si A ou B, ou sous-groupe, on vérifie que l'utilisateur est concerné
    if (groupes.includes(user.value.groupe) ||
        (user.value.groupe === 'A' && groupes.includes('A')) ||
        (user.value.groupe === 'B' && groupes.includes('B'))
    ) {
      return event.year == user.value.year;
    }
    return false;
  }
  return true;
}

const filteredEvents = computed(() => events.value.filter(eventIsVisible));

function allowedGroupesForUser() {
  if (!user.value) return uniqueGroupes;
  if (user.value.role === 'delegue') {
    if (user.value.groupe === 'A') {
      return ['Promo', 'A', "A'", 'A""'];
    } else if (user.value.groupe === 'B') {
      return ['Promo', 'B', "B'", 'B"""'];
    }
  }
  return uniqueGroupes;
}

async function reloadEvents() {
  const currentUser = JSON.parse(localStorage.getItem('user'));
  if (currentUser) {
    user.value = currentUser;
  }

  try {
    const res = await axios.get('/api/events');
    if (Array.isArray(res.data)) {
      if (currentUser) {
        events.value = res.data.map(event => ({
          ...event,
          checked: event.checkedBy && event.checkedBy.includes(currentUser._id),
          archived: event.archivedBy && event.archivedBy.includes(currentUser._id)
        }));
      } else {
        events.value = res.data.map(event => ({ ...event, checked: false, archived: false }));
      }
    } else {
      events.value = [];
    }
  } catch (e) {
    events.value = [];
    alert('Erreur lors du chargement des événements');
  }
}
</script>

<style scoped>

.main-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 32px;
}
.header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}
.logo {
  font-size: 3rem;
  font-weight: 900;
  font-style: italic;
  color: #fff;
  text-shadow: 2px 4px 8px #0002;
}
.search-bar {
  border-radius: 999px;
  padding: 8px 24px;
  background: #fff8;
  border: none;
  font-size: 1rem;
  color: #333;
}
.header-icons button {
  background: #fff;
  border-radius: 50%;
  border: none;
  margin-left: 8px;
  padding: 8px;
  box-shadow: 0 2px 8px #0001;
  cursor: pointer;
}
.menu-bar {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-bottom: 32px;
}
.menu-bar button {
  padding: 12px 36px;
  border-radius: 999px;
  font-weight: bold;
  font-size: 1.1rem;
  border: none;
  background: linear-gradient(90deg, #6fffa7 0%, #6fffe9 100%);
  color: #fff;
  box-shadow: 0 2px 8px #0001;
  cursor: pointer;
  transition: filter 0.2s;
}
.menu-bar button:hover {
  filter: brightness(0.95);
}
.title {
  font-size: 2.5rem;
  font-weight: 900;
  font-style: italic;
  color: #fff;
  text-align: center;
  margin-bottom: 32px;
  text-shadow: 2px 4px 8px #0002;
}
.week-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 18px;
  margin-bottom: 18px;
}
.week-arrow-img {
  width: 80px;
  height: 50px;
  border-radius: 12px;
  background: #6366f1;
  cursor: pointer;
  box-shadow: 0 2px 8px #0001;
  margin: 0 12px;
  transition: filter 0.2s;
}
.week-arrow-img:hover {
  filter: brightness(0.95);
}
.week-label {
  color: #fff;
  font-size: 1.1rem;
  font-weight: bold;
}
.grid-emploi {
  display: grid;
  grid-template-columns: 100px repeat(5, 1fr);
  gap: 12px;
}
.grid-emploi .header {
  font-weight: bold;
  font-size: 1.1rem;
  color: #fff;
  text-align: center;
  padding: 8px 0;
}
.grid-emploi .hour {
  font-weight: bold;
  color: #fff;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
}
.grid-emploi .cell {
  background: rgb(47, 53, 61);
  border-radius: 12px;
  min-height: 60px;
  margin: 2px;
  box-shadow: 0 2px 8px #0001;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.95;
  transition: box-shadow 0.2s;
  position: relative;
}
.grid-emploi .cell:hover {
  box-shadow: 0 4px 16px #0002;
}
.grid-emploi .cell .event-block {
  background: #fff !important;
  border-radius: 12px;
  box-shadow: 0 1px 4px #0002;
  border: 1px solid #ddd;
  color: #222;
  padding-top: 18px;
  margin: 2px 0;
  min-width: 80px;
  word-break: break-word;
  position: relative;
  overflow: hidden;
}
.grid-emploi .cell .event-block::before {
  content: '';
  display: block;
  position: absolute;
  top: 0; left: 0; right: 0; height: 8px;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  background: var(--matiere-gradient, linear-gradient(90deg,#6fffa7 0%,#6fffe9 100%));
}
.date-header {
  font-size: 0.95em;
  color: #e0e0e0;
  font-weight: normal;
}
.add-btn { background: #10b981; color: #fff; border: none; border-radius: 50%; width: 32px; height: 32px; font-size: 1.3rem; cursor: pointer; }
.add-form-modal { position: absolute; background: #fff; border-radius: 12px; box-shadow: 0 2px 12px #0003; padding: 12px; z-index: 10; }
.add-form-modal input, .add-form-modal select { margin: 4px 0; padding: 4px 8px; border-radius: 6px; border: 1px solid #ccc; }
.add-form-modal button { margin: 4px 4px 0 0; }
.groupes-checkboxes { display: flex; flex-wrap: wrap; gap: 8px; margin: 6px 0; }
.groupes-checkboxes label { color: #111; font-size: 0.98em; }
.groupe-label { color: #111; font-weight: bold; }
.aucune-matiere {
  text-align: center;
  color: #ef4444;
  font-size: 1.2em;
  font-weight: bold;
  margin: 32px 0;
  width: 100%;
}
</style> 