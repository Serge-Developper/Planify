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
            <option :value="1">1ère année</option>
            <option :value="2">2ème année</option>
            <option :value="3">3ème année</option>
          </select>
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
      <UserForm v-if="showUserForm" @close="showUserForm = false" @user-added="fetchUsers" />
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
const events = ref([]);
const eventForm = ref({
  titre: '',
  date: '',
  heure: '',
  groupe: 'A',
  type: 'exam',
  matiere: matieres[0],
  year: 1
});

const editingIndex = ref(null);
const showEmploi = ref(false);

onMounted(async () => {
  try {
    const res = await axios.get('/api/events');
    events.value = res.data;
  } catch (e) {
    events.value = [];
  }
});

function selectMatiere(matiere) {
  selectedMatiere.value = matiere;
  eventForm.value.matiere = matiere;
}

const filteredEvents = computed(() =>
  events.value.filter(e => e.matiere === selectedMatiere.value)
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
    const res = await axios.post('/api/events', eventForm.value);
    events.value.push(res.data);
    eventForm.value = { titre: '', date: '', heure: '', groupe: 'A', type: 'exam', matiere: selectedMatiere.value, year: 1 };
  } catch (err) {
    alert('Erreur lors de l\'ajout : ' + (err.response?.data?.message || err.message));
  }
}

function fetchUsers() {}

const UserForm = {
  template: `<div class='modal'><h3>Formulaire utilisateur (à implémenter)</h3><button @click="$emit('close')">Fermer</button></div>`
};
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
  color: #fff;
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