<template>
  <div class="admin-dashboard">
    <div class="top-bar"></div>
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
        <button class="manage-users-btn" @click="openUserManagement">Gérer les utilisateurs</button>
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
            <option>B</option><option>B'</option><option>B"</option>
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
            <b>{{ event.titre }}</b> - {{ formatDate(event.date) }} {{ event.heure }} - Groupe {{ event.groupe }} - Année {{ event.year }}
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
            <select v-model="userForm.role" @change="handleRoleChange" required>
              <option value="eleve">Étudiant</option>
              <option value="delegue">Délégué</option>
              <option value="prof">Professeur</option>
              <option value="admin">Admin</option>
            </select>
            <select v-model="userForm.groupe" :disabled="userForm.role === 'prof'" required :class="{ 'disabled-field': userForm.role === 'prof' }">
              <option>Promo</option>
              <option>A</option><option>A'</option><option>A"</option>
              <option>B</option><option>B'</option><option>B"</option>
            </select>
            <select v-model="userForm.year" :disabled="userForm.role === 'prof'" required :class="{ 'disabled-field': userForm.role === 'prof' }">
              <option value="BUT1">1ère année</option>
              <option value="BUT2">2ème année</option>
              <option value="BUT3">3ème année</option>
            </select>
            <div v-if="userForm.role === 'prof'" style="font-size: 0.9em; color: #6b7280; font-style: italic;">
              ⓘ Les professeurs travaillent avec toute la promo (toutes les années)
            </div>
            <button type="submit" :disabled="userFormLoading">Ajouter</button>
            <button type="button" @click="showUserForm = false">Annuler</button>
            <div v-if="userFormMessage" :style="{color: userFormMessage.includes('succès') ? 'green' : 'red'}">{{ userFormMessage }}</div>
          </form>
        </div>
      </div>

      <!-- Modal de gestion des utilisateurs -->
      <div v-if="showUserManagement" class="modal">
        <div class="user-management-modal">
          <h3 style="color: #000000; margin-bottom: 20px;">Gérer les utilisateurs</h3>
          
          <!-- Liste des utilisateurs -->
          <div class="users-list" v-if="!editingUser">
            <div v-for="user in users" :key="user._id" class="user-item">
              <div class="user-info">
                <strong>{{ user.username }}</strong>
                <span class="user-role">{{ user.role }}</span>
                <span v-if="user.groupe" class="user-groupe">Groupe: {{ user.groupe }}</span>
                <span v-if="user.year" class="user-year">Année: {{ user.year }}</span>
              </div>
              <div class="user-actions">
                <button @click="editUser(user)" class="edit-btn">Modifier</button>
                <button @click="deleteUser(user._id)" class="delete-btn">Supprimer</button>
              </div>
            </div>
            <button @click="showUserManagement = false" class="close-btn">Fermer</button>
          </div>

          <!-- Formulaire d'édition -->
          <div v-if="editingUser" class="edit-user-form">
            <h4>Modifier {{ editingUser.username }}</h4>
            <form @submit.prevent="updateUser">
              <input v-model="editForm.username" placeholder="Nom d'utilisateur" required />
              <input v-model="editForm.password" type="password" placeholder="Nouveau mot de passe (laisser vide pour ne pas changer)" />
              <select v-model="editForm.role" @change="handleEditRoleChange" required>
                <option value="eleve">Étudiant</option>
                <option value="delegue">Délégué</option>
                <option value="prof">Professeur</option>
                <option value="admin">Admin</option>
              </select>
              <select v-model="editForm.groupe" :disabled="editForm.role === 'prof'" :class="{ 'disabled-field': editForm.role === 'prof' }">
                <option value="">Aucun groupe</option>
                <option>Promo</option>
                <option>A</option><option>A'</option><option>A"</option>
                <option>B</option><option>B'</option><option>B"</option>
              </select>
              <select v-model="editForm.year" :disabled="editForm.role === 'prof'" :class="{ 'disabled-field': editForm.role === 'prof' }">
                <option value="">Aucune année</option>
                <option value="BUT1">1ère année</option>
                <option value="BUT2">2ème année</option>
                <option value="BUT3">3ème année</option>
              </select>
              <div v-if="editForm.role === 'prof'" style="font-size: 0.9em; color: #6b7280; font-style: italic;">
                ⓘ Les professeurs travaillent avec toute la promo (toutes les années)
              </div>
              <div class="edit-actions">
                <button type="submit" :disabled="editFormLoading">Sauvegarder</button>
                <button type="button" @click="cancelEdit">Annuler</button>
              </div>
            </form>
            <div v-if="editFormMessage" :style="{color: editFormMessage.includes('succès') ? 'green' : 'red'}">{{ editFormMessage }}</div>
          </div>
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
import { API_URL } from '@/api';
import EmploiDuTemps from '../components/EmploiDuTemps.vue';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';

const router = useRouter();
const authStore = useAuthStore();

if (!authStore.user || authStore.user.role !== 'admin') {
  router.replace('/');
}

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
const showUserManagement = ref(false);
const userForm = ref({
  username: '',
  password: '',
  role: 'eleve',
  groupe: 'A',
  year: 'BUT1'
});
const userFormMessage = ref('');
const userFormLoading = ref(false);
const users = ref([]);
const editingUser = ref(null);
const editForm = ref({
  username: '',
  password: '',
  role: 'eleve',
  groupe: '',
  year: ''
});
const editFormMessage = ref('');
const editFormLoading = ref(false);
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
    const res = await axios.get(`${API_URL}/events`);
    events.value = Array.isArray(res.data) ? res.data : (Array.isArray(res.data.events) ? res.data.events : []);
  } catch (e) {
    events.value = [];
  }
});

function selectMatiere(matiere) {
  selectedMatiere.value = matiere;
  eventForm.value.matiere = matiere;
}

// Fonction pour gérer le changement de rôle dans le formulaire d'ajout
function handleRoleChange() {
  if (userForm.value.role === 'prof') {
    userForm.value.groupe = 'Promo';
    userForm.value.year = ''; // Pas d'année pour les profs
  }
}

// Fonction pour gérer le changement de rôle dans le formulaire d'édition
function handleEditRoleChange() {
  if (editForm.value.role === 'prof') {
    editForm.value.groupe = 'Promo';
    editForm.value.year = ''; // Pas d'année pour les profs
  }
}

const filteredEvents = computed(() =>
  Array.isArray(events.value)
    ? selectedMatiere.value === 'Toutes'
      ? events.value
      : events.value.filter(e => e.matiere === selectedMatiere.value)
    : []
);

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

async function deleteEvent(event, idx) {
  try {
    await axios.post(`${API_URL}/events/${event._id}/delete`);
    // Trouver l'index réel dans events.value
    const realIndex = events.value.findIndex(e => e._id === event._id);
    if (realIndex !== -1) {
      events.value.splice(realIndex, 1);
    }
  } catch (e) {
    alert('Erreur lors de la suppression');
  }
}

function editEvent(event, idx) {
  editingIndex.value = idx;
  if (editingIndex.value !== -1) {
    console.log('Tâche sélectionnée pour édition :', event);
    eventForm.value.titre = event.titre || '';
    eventForm.value.date = event.date || '';
    eventForm.value.heure = event.heure || '';
    eventForm.value.groupe = event.groupe || '';
    eventForm.value.type = event.type || '';
    eventForm.value.matiere = event.matiere || '';
    eventForm.value.year = event.year || '';
    eventForm.value.description = event.description || '';
  }
}

async function addEvent() {
  try {
    if (!eventForm.value.groupes || eventForm.value.groupes.length === 0) {
      eventForm.value.groupes = [eventForm.value.groupe];
    }
    if (editingIndex.value !== null && editingIndex.value !== -1) {
      // Modification d'une tâche existante
      const eventToUpdate = events.value[editingIndex.value];
      const updatedEvent = { ...eventToUpdate, ...eventForm.value };
      delete updatedEvent.archived;
      const res = await axios.put(`${API_URL}/events/${eventToUpdate._id}`, updatedEvent);
      events.value[editingIndex.value] = res.data;
      editingIndex.value = null;
    } else {
      // Ajout d'une nouvelle tâche
      const res = await axios.post(`${API_URL}/events`, eventForm.value);
      events.value.push(res.data);
    }
    eventForm.value = { titre: '', date: '', heure: '', groupe: 'A', type: 'exam', matiere: selectedMatiere.value, year: 'BUT1', description: '', groupes: [] };
  } catch (err) {
    alert('Erreur lors de l\'ajout ou modification : ' + (err.response?.data?.message || err.message));
  }
}

async function fetchUsers() {
  try {
    const res = await axios.get(`${API_URL}/users/all`);
    users.value = res.data;
  } catch (err) {
    console.error('Erreur lors de la récupération des utilisateurs:', err);
  }
}

async function addUser() {
  userFormMessage.value = '';
  userFormLoading.value = true;
  try {
    await axios.post(`${API_URL}/users/register`, userForm.value);
    userFormMessage.value = 'Utilisateur ajouté avec succès !';
    userForm.value = { username: '', password: '', role: 'eleve', groupe: 'A', year: 'BUT1' };
    showUserForm.value = false;
    await fetchUsers(); // Rafraîchir la liste
  } catch (err) {
    console.error('Erreur lors de l\'ajout de l\'utilisateur:', err);
    if (err.response?.status === 502) {
      userFormMessage.value = 'Erreur de connexion au serveur. Vérifiez que le backend est démarré.';
    } else {
      userFormMessage.value = err.response?.data?.message || 'Erreur lors de l\'ajout de l\'utilisateur';
    }
  } finally {
    userFormLoading.value = false;
  }
}

function editUser(user) {
  editingUser.value = user;
  editForm.value = {
    username: user.username,
    password: '',
    role: user.role,
    groupe: user.groupe || '',
    year: user.year || ''
  };
}

function cancelEdit() {
  editingUser.value = null;
  editForm.value = {
    username: '',
    password: '',
    role: 'eleve',
    groupe: '',
    year: ''
  };
  editFormMessage.value = '';
}

async function updateUser() {
  editFormMessage.value = '';
  editFormLoading.value = true;
  try {
    const updateData = { ...editForm.value };
    if (!updateData.password) {
      delete updateData.password; // Ne pas envoyer le mot de passe s'il est vide
    }
    
    await axios.put(`${API_URL}/users/${editingUser.value._id}`, updateData);
    editFormMessage.value = 'Utilisateur mis à jour avec succès !';
    
    // Rafraîchir la liste et fermer l'édition après un délai
    setTimeout(async () => {
      await fetchUsers();
      cancelEdit();
    }, 1500);
  } catch (err) {
    editFormMessage.value = err.response?.data?.message || 'Erreur lors de la mise à jour';
  } finally {
    editFormLoading.value = false;
  }
}

async function deleteUser(userId) {
  if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
    return;
  }
  
  try {
    await axios.delete(`${API_URL}/users/${userId}`);
    await fetchUsers(); // Rafraîchir la liste
  } catch (err) {
    alert('Erreur lors de la suppression: ' + (err.response?.data?.message || err.message));
  }
}

// Charger les utilisateurs quand on ouvre la gestion
function openUserManagement() {
  showUserManagement.value = true;
  fetchUsers();
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

.disabled-field {
  background-color: #f3f4f6;
  color: #9ca3af;
  cursor: not-allowed;
}
.manage-users-btn {
  margin-top: 12px;
  background: #6366f1;
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
.user-management-modal {
  background: #fff;
  padding: 32px;
  border-radius: 18px;
  min-width: 600px;
  max-width: 90vw;
  max-height: 80vh;
  overflow-y: auto;
}
.users-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.user-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
}
.user-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.user-info strong {
  color: #000000;
}
.user-role {
  color: #6366f1;
  font-weight: bold;
  font-size: 0.9em;
}
.user-groupe, .user-year {
  color: #6b7280;
  font-size: 0.9em;
}
.user-actions {
  display: flex;
  gap: 8px;
}
.edit-btn {
  background: #f59e0b;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 0.9em;
}
.delete-btn {
  background: #ef4444;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 0.9em;
}
.close-btn {
  background: #6b7280;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  cursor: pointer;
  margin-top: 20px;
  width: 100%;
}
.edit-user-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.edit-user-form h4 {
  color: #111;
  margin-bottom: 16px;
}
.edit-user-form form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.edit-user-form input,
.edit-user-form select {
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  font-size: 1rem;
}
.edit-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}
.edit-actions button {
  flex: 1;
  padding: 10px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: bold;
}
.edit-actions button[type="submit"] {
  background: #10b981;
  color: #fff;
}
.edit-actions button[type="button"] {
  background: #6b7280;
  color: #fff;
}
.matiere-content h2 {
  color: #111;
}


@media (max-width: 1024px) {
  .admin-dashboard {
    flex-direction: column !important;
    min-height: unset;
    border-radius: 0;
    box-shadow: none;
    width: 100vw;
    max-width: 100vw;
    padding: 0;
  }
  .top-bar {
    border-radius: 0;
    flex-direction: column !important;
    align-items: stretch;
    box-shadow: none;
    padding: 8px 0;
  }
  .matieres-list {
    min-width: 0;
    width: 100vw;
    border-radius: 0;
    box-shadow: none;
    padding: 12px 0;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
  }
  .matiere-content, .matiere-content main {
    width: 100vw;
    min-width: 0;
    border-radius: 0;
    box-shadow: none;
    padding: 8px 0;
  }
  .event-form, .event-list, .modal > div {
    min-width: 0;
    width: 100vw;
    display: flex;
    padding: 0 8px;
    flex-direction: column;
  }

  .event-list li{
    display: flex;
    flex-direction: column;
  }
  .event-form button {
    background: #6366f1;
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 8px 18px;
    display: flex;
    margin: 0 auto;
    font-weight: bold;
    cursor: pointer;
    align-items: center;
    justify-content: center;
  }
}

@media (min-width: 1025px) and (max-width: 1440px) {
  .event-form {
    display: flex;
    gap: 12px;
    margin-bottom: 24px;
    flex-direction: column;
  }
  .event-form button {
    background: #6366f1;
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 8px 18px;
    display: flex;
    margin: 0 auto;
    font-weight: bold;
    /* max-width: 213px; */
    cursor: pointer;
    align-items: center;
    justify-content: center;
  }
}

</style>

