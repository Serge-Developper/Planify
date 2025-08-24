<template>
  <div class="admin-dashboard">
    <div class="top-bar">
      <button v-if="!showEmploi" @click="showEmploi = true" class="switch-btn">Aller vers l'emploi du temps</button>
      <button v-else @click="showEmploi = false" class="switch-btn">Retour</button>
    </div>
    <template v-if="!showEmploi">
      <aside class="matieres-list">
        <button
          v-for="matiere in matieres"
          :key="matiere"
          @click="selectMatiere(matiere)"
          :class="{ selected: matiere === selectedMatiere }"
        >
          {{ matiere }}
        </button>
        <button class="add-user-btn" @click="showUserForm = true">Ajouter un utilisateur</button>
      </aside>
      <main class="matiere-content">
        <h2>{{ selectedMatiere }}</h2>
        <form class="event-form" @submit.prevent="addEvent">
          <input v-model="eventForm.titre" placeholder="Titre" required />
          <input v-model="eventForm.date" type="date" required />
          <input v-model="eventForm.heure" type="time" required />
          <select v-model="eventForm.groupe" required>
            <option>Promo</option>
            <option>A</option><option>A'</option><option>A"</option>
            <option>B</option><option>B'</option><option>B""</option>
          </select>
          <select v-model="eventForm.type" required>
            <option value="exam">Examen</option>
            <option value="devoir">Devoir</option>
          </select>
          <select v-model="eventForm.year" required>
            <option value="BUT1">1ère année</option>
            <option value="BUT2">2ème année</option>
            <option value="BUT3">3ème année</option>
          </select>
          <textarea v-model="eventForm.description" placeholder="Description (optionnelle)" rows="3"></textarea>
          <button type="submit">{{ editingIndex !== null && editingIndex !== -1 ? 'Modifier' : 'Ajouter' }}</button>
        </form>
        <ul class="event-list">
          <li v-for="(event, idx) in filteredEvents" :key="event._id || event.titre + event.date + event.heure">
            <b>{{ event.titre }}</b> - {{ event.date }} {{ event.heure }} - Groupe {{ event.groupe }} - Année {{ event.year }}
            <button @click="editEvent(event, idx)">Modifier</button>
            <button @click="deleteEvent(event, idx)">Supprimer</button>
          </li>
        </ul>
      </main>
      <div v-if="showUserForm" class="modal">
        <div>
          <h3 style="color: #000000;">Ajouter un utilisateur</h3>
          <form @submit.prevent="addUser" style="display: flex; flex-direction: column; gap: 12px; min-width: 320px;">
            <input v-model="userForm.username" placeholder="Nom d'utilisateur" required />
            <input v-model="userForm.password" type="password" placeholder="Mot de passe" required />
            <select v-model="userForm.role" required>
              <option value="eleve">Étudiant</option>
              <option value="delegue">Délégué</option>
              <option value="prof">Professeur</option>
              <option value="admin">Admin</option>
            </select>
            <select v-model="userForm.groupe" required>
              <option>Promo</option>
              <option>A</option><option>A'</option><option>A"</option>
              <option>B</option><option>B'</option><option>B""</option>
            </select>
            <select v-model="userForm.year" required>
              <option value="BUT1">1ère année</option>
              <option value="BUT2">2ème année</option>
              <option value="BUT3">3ème année</option>
            </select>
            <button type="submit" :disabled="userFormLoading">Ajouter</button>
            <button type="button" @click="showUserForm = false">Annuler</button>
            <div v-if="userFormMessage" :style="{color: userFormMessage.includes('succès') ? 'green' : 'red'}">{{ userFormMessage }}</div>
          </form>
        </div>
      </div>
    </template>
    <template v-else>
      <EmploiDuTemps />
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import EmploiDuTemps from '../components/EmploiDuTemps.vue';

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

const selectedMatiere = ref(matieres[0]);
const showUserForm = ref(false);
const userForm = ref({
  username: '',
  password: '',
  role: 'eleve',
  groupe: 'A',
  year: 'BUT1'
});
const userFormMessage = ref('');
const userFormLoading = ref(false);
const events = ref([]);
const eventForm = ref({
  titre: '',
  date: '',
  heure: '',
  groupe: 'A',
  type: 'exam',
  matiere: matieres[0],
  year: 'BUT1',
  description: ''
});

const editingIndex = ref(null);
const showEmploi = ref(false);

onMounted(async () => {
  try {
    const res = await axios.get('/api/events');
    events.value = Array.isArray(res.data) ? res.data : (Array.isArray(res.data.events) ? res.data.events : []);
  } catch (e) {
    events.value = [];
  }
});

function selectMatiere(matiere) {
  selectedMatiere.value = matiere;
  eventForm.value.matiere = matiere;
}

const filteredEvents = computed(() =>
  Array.isArray(events.value)
    ? selectedMatiere.value === 'Toutes'
      ? events.value
      : events.value.filter(e => e.matiere === selectedMatiere.value)
    : []
);

async function deleteEvent(event, idx) {
  try {
    await axios.delete(`/api/events/${event._id}`);
    events.value.splice(idx, 1);
  } catch (e) {
    alert('Erreur lors de la suppression');
  }
}

function editEvent(event, idx) {
  editingIndex.value = idx;
  if (editingIndex.value !== -1) {
    eventForm.value = { ...events.value[editingIndex.value] };
  }
}

async function addEvent() {
  try {
    if (!eventForm.value.groupes || eventForm.value.groupes.length === 0) {
      eventForm.value.groupes = [eventForm.value.groupe];
    }
    const res = await axios.post('/api/events', eventForm.value);
    events.value.push(res.data);
    eventForm.value = { titre: '', date: '', heure: '', groupe: 'A', type: 'exam', matiere: selectedMatiere.value, year: 'BUT1', description: '', groupes: [] };
  } catch (err) {
    alert('Erreur lors de l\'ajout : ' + (err.response?.data?.message || err.message));
  }
}

function fetchUsers() {}

async function addUser() {
  userFormMessage.value = '';
  userFormLoading.value = true;
  try {
    await axios.post('/users/register', userForm.value);
    userFormMessage.value = 'Utilisateur ajouté avec succès !';
    userForm.value = { username: '', password: '', role: 'eleve', groupe: 'A', year: 'BUT1' };
    emitUserAdded();
  } catch (err) {
    userFormMessage.value = err.response?.data?.message || 'Erreur lors de l\'ajout de l\'utilisateur';
  } finally {
    userFormLoading.value = false;
  }
}
function emitUserAdded() {
  // placeholder pour rafraîchir la liste si besoin
}
</script>

<style scoped>
.admin-dashboard {
  display: flex;
  min-height: 80vh;
  background: #f3f4f6;
  border-radius: 18px;
  box-shadow: 0 4px 24px #0001;
}
.top-bar {
  background: #fff;
  padding: 12px;
  border-radius: 18px 18px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px #0001;
}
.switch-btn {
  background: #6366f1;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 8px 18px;
  font-weight: bold;
  cursor: pointer;
}
.matieres-list {
  min-width: 220px;
  background: #fff;
  border-radius: 18px 0 0 18px;
  padding: 24px 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: 2px 0 8px #0001;
}
.matieres-list button {
  background: #e5e7eb;
  border: none;
  border-radius: 999px;
  padding: 10px 18px;
  font-weight: bold;
  font-size: 1rem;
  margin-bottom: 4px;
  cursor: pointer;
  transition: background 0.2s;
}
.matieres-list button.selected,
.matieres-list button:hover {
  background: #a5b4fc;
  color: #fff;
}
.add-user-btn {
  margin-top: 24px;
  background: #10b981;
  color: #000000;
}
.matiere-content {
  flex: 1;
  padding: 32px;
}
.event-form {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}
.event-form input,
.event-form select {
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  font-size: 1rem;
}
.event-form button {
  background: #6366f1;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 8px 18px;
  font-weight: bold;
  cursor: pointer;
}
.event-list {
  list-style: none;
  padding: 0;
}
.event-list li {
  background: #fff;
  border-radius: 10px;
  margin-bottom: 12px;
  padding: 12px 18px;
  box-shadow: 0 2px 8px #0001;
  display: flex;
  align-items: center;
  color: rgb(0, 0, 0);
  gap: 16px;
}
.event-list button {
  background: #f59e42;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 4px 12px;
  margin-left: 8px;
  cursor: pointer;
}
.event-list button:last-child {
  background: #ef4444;
}
.modal {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
.modal > div {
  background: #fff;
  padding: 32px;
  border-radius: 18px;
  min-width: 320px;
}
.matiere-content h2 {
  color: #111;
}
</style> 