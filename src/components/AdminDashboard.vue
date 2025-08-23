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

        <section v-if="auth.user && auth.user.role === 'admin'" style="margin-top: 24px;">
          <h3>Éditeur d'items</h3>
          <AdminItemEditor />
        </section>
      </main>
      <div v-if="showUserForm" class="modal">
        <div style="position: relative;">
          <button class="modal-close-top" @click="showUserForm = false" aria-label="Fermer">×</button>
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
           <button class="modal-close-top" @click="showUserManagement = false" aria-label="Fermer">×</button>
          <h3 style="color: #000000; margin-bottom: 20px;">Gérer les utilisateurs</h3>
          
                     <!-- Liste des utilisateurs -->
           <div class="users-list" v-if="!editingUser">
             <div v-for="user in users" :key="user._id" class="user-item">
                               <div class="user-info">
                  <strong>{{ user.username }}</strong>
                  <span class="user-role">{{ user.role }}</span>
                  <span v-if="user.groupe" class="user-groupe">Groupe: {{ user.groupe }}</span>
                  <span v-if="user.year" class="user-year">Année: {{ user.year }}</span>
                  <span class="user-coins">🪙 {{ user.coins || 0 }} coins</span>
                </div>
                               <div class="user-actions">
                  <button @click="viewUserItems(user)" class="items-btn">Voir les items</button>
                  <button @click="openUserSecrets(user)" class="secrets-btn">Questions secrètes</button>
                  <button @click="editUser(user)" class="edit-btn">Modifier</button>
                  <button @click="deleteUser(user._id)" class="delete-btn">Supprimer</button>
                </div>
             </div>
           </div>
           
           <!-- Bouton fermer en bas -->
           <div class="modal-footer" v-if="!editingUser">
             <button @click="showUserManagement = false" class="close-btn">Fermer</button>
           </div>

          <!-- Formulaire d'édition -->
          <div v-if="editingUser" class="edit-user-form">
            <h4>Modifier {{ editingUser.username }}</h4>
            <form @submit.prevent="updateUser">
                             <input v-model="editForm.username" placeholder="Nom d'utilisateur" required />
               <input v-model="editForm.password" type="password" placeholder="Nouveau mot de passe (laisser vide pour ne pas changer)" />
               <input v-model="editForm.coins" type="number" placeholder="PlanifyCoins" min="0" />
              <select v-model="editForm.role" @change="handleEditRoleChange" required>
                <option value="eleve">Étudiant</option>
                <option value="delegue">Délégué</option>
                <option value="prof">Professeur</option>
                <option value="admin">Admin</option>
              </select>
                                            <select v-model="editForm.groupe" :disabled="editForm.role === 'prof'" :class="{ 'disabled-field': editForm.role === 'prof' }">
                 <option value="">Aucun groupe</option>
                 <option value="Promo">Promo</option>
                                   <option value="A">A</option>
                  <option value="A'">A'</option>
                  <option value="A&quot;">A"</option>
                  <option value="B">B</option>
                  <option value="B'">B'</option>
                  <option value="B&quot;">B"</option>
                 <!-- Option de debug pour voir la valeur actuelle -->
                 <option v-if="editForm.groupe && !['', 'Promo', 'A', 'A\'', 'A&quot;', 'B', 'B\'', 'B&quot;'].includes(editForm.groupe)" :value="editForm.groupe">{{ editForm.groupe }} (VALEUR ACTUELLE)</option>
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

       <!-- Modal pour voir les items d'un utilisateur -->
      <div v-if="showUserItems" class="modal items-overlay" @click.self="closeUserItems">
         <div class="user-items-modal">
           <h3 style="color: #000000; margin-bottom: 20px;">Items de {{ viewingUserItems?.username }}</h3>
           
                       <div v-if="viewingUserItems?.purchasedItems && viewingUserItems.purchasedItems.length > 0" class="items-list">
              <div v-for="item in viewingUserItems.purchasedItems" :key="item.itemId" class="item-card">
                <div class="item-info">
                  <h4>{{ item.itemName }}</h4>
                  <p class="item-details">
                    <span class="item-id">ID: {{ item.itemId }}</span>
                    <span class="item-date">Acheté le: {{ formatDate(item.purchaseDate) }}</span>
                    <span v-if="item.equipped" class="item-equipped">✅ Équipé</span>
                    <span v-else class="item-not-equipped">❌ Non équipé</span>
                  </p>
                </div>
                <div class="item-actions">
                  <button @click="removeItemFromUser(viewingUserItems._id, item.itemId)" class="remove-item-btn">Retirer</button>
                </div>
              </div>
            </div>
           
                       <div v-else class="no-items">
              <p>Aucun item acheté</p>
            </div>
            
          <!-- Actions globales sur l'inventaire de l'utilisateur -->
          <div class="global-actions">
            <button class="remove-all-btn" @click="removeAllItemsAndBorderColor(viewingUserItems._id)">Retirer tous les items et réinitialiser la bordure</button>
          </div>

            <!-- Section pour donner des items (cases à cocher) -->
            <div class="give-items-section">
              <h4>Donner des items</h4>
              <div class="give-item-form checkboxes">
                <div class="checkbox-grid">
                  <label v-for="it in itemsCatalog" :key="it.id" class="item-checkbox">
                    <input type="checkbox" :value="it.id" v-model="selectedItemsToGive" />
                    <span>{{ it.name }}</span>
                  </label>
                </div>
                
                <!-- Champ de message optionnel -->
                <div class="admin-message-section">
                  <label for="admin-message" class="message-label">
                    Message optionnel pour l'utilisateur :
                  </label>
                  <textarea 
                    id="admin-message"
                    v-model="adminMessage" 
                    placeholder="Ex: Merci d'avoir contribué au site ! 🎉"
                    rows="3"
                    maxlength="200"
                    class="admin-message-input"
                  ></textarea>
                  <div class="message-counter">{{ adminMessage.length }}/200</div>
                </div>
                
                <div class="checkbox-actions">
                  <button type="button" class="toggle-all-btn" @click="toggleSelectAll">
                    {{ selectedItemsToGive.length === itemsCatalog.length ? 'Tout désélectionner' : 'Tout sélectionner' }}
                  </button>
                  <button type="button" class="toggle-all-btn" @click="selectMissingOnly" title="Ne sélectionner que les items non possédés">
                    Sélectionner uniquement les manquants
                  </button>
                  <button @click="giveSelectedItemsToUser" :disabled="selectedItemsToGive.length === 0" class="give-item-btn">
                    Donner les items ({{ selectedItemsToGive.length }})
                  </button>
                </div>
              </div>
            </div>
           
           <div class="modal-footer">
             <button @click="closeUserItems" class="close-btn">Fermer</button>
           </div>
         </div>
       </div>
      
      <!-- Modal pour gérer les questions secrètes d'un utilisateur -->
      <div v-if="showUserSecrets" class="modal secrets-overlay" @click.self="closeUserSecrets">
        <div class="user-secrets-modal" @click.stop>
          <button class="modal-close-top" @click="closeUserSecrets" aria-label="Fermer">×</button>
          <h3 style="color:#000; margin-bottom: 16px;">Questions secrètes de {{ secretsUser && secretsUser.username }}</h3>
          <p style="color:#6b7280; margin-top:-6px; margin-bottom: 14px;">Définissez exactement 3 questions et réponses.</p>
          <form class="secrets-form" @submit.prevent="saveUserSecrets">
            <div class="secret-row" v-for="(q, i) in secretsForm" :key="i">
              <select
                class="secret-input"
                v-model="q.question"
                required
              >
                <option disabled value="">Sélectionner une question</option>
                <option v-for="opt in getAvailableQuestions(i)" :key="opt" :value="opt">{{ opt }}</option>
              </select>
              <input 
                class="secret-input"
                v-model="q.answer" 
                type="text" 
                :placeholder="`Réponse #${i+1}`" 
                required
              />
            </div>
            <div class="modal-footer">
              <button type="button" class="close-btn" @click="closeUserSecrets">Annuler</button>
              <button type="submit" class="save-btn" :disabled="secretsLoading">{{ secretsLoading ? 'Enregistrement…' : 'Enregistrer' }}</button>
            </div>
            <div v-if="secretsMessage" :style="{ color: secretsMessage.includes('succès') ? 'green' : 'red', marginTop: '8px' }">{{ secretsMessage }}</div>
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
import AdminItemEditor from './AdminItemEditor.vue'
import { useAuthStore } from '@/stores/auth'
const auth = useAuthStore()
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import axios from 'axios';
import { API_URL, secureApiCall } from '@/api';
import EmploiDuTemps from '../components/EmploiDuTemps.vue';
import { useRouter } from 'vue-router';

const router = useRouter();

if (!auth.user || auth.user.role !== 'admin') {
  router.replace('/');
}

// Charger/rafraîchir les items dynamiques
onMounted(() => {
  loadAdminDynamicItems()
  try { window.addEventListener('items-changed', loadAdminDynamicItems) } catch {}
})
onUnmounted(() => {
  try { window.removeEventListener('items-changed', loadAdminDynamicItems) } catch {}
})

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
const viewingUserItems = ref(null);
const showUserItems = ref(false);
// Recharger la liste dynamique lors de l'ouverture de la modale des items
watch(showUserItems, (v) => { if (v) loadAdminDynamicItems() })
const itemToGive = ref('');

// Gestion des questions secrètes
const showUserSecrets = ref(false);
const secretsUser = ref(null);
const secretsForm = ref([
  { question: '', answer: '' },
  { question: '', answer: '' },
  { question: '', answer: '' }
]);
const secretsLoading = ref(false);
const secretsMessage = ref('');
// Catalogue de questions secrètes proposées
const secretQuestionOptions = ref([
  "Quel est le nom de votre premier animal ?",
  "Quel est le prénom de votre mère ?",
  "Quelle est votre ville de naissance ?",
  "Quel est le nom de votre meilleur ami d'enfance ?",
  "Quel est le modèle de votre première voiture ?",
  "Quel est le nom de votre école primaire ?",
]);

// Empêche les doublons entre les 3 sélections
function getAvailableQuestions(index) {
  const selected = secretsForm.value.map((q, i) => (i === index ? null : q.question)).filter(Boolean);
  return secretQuestionOptions.value.filter(opt => !selected.includes(opt));
}
  const itemsCatalog = ref([
    { id: 0, name: 'Bordure classique' },
    { id: 1, name: 'Oreillettes de chat' },
    { id: 2, name: 'Clown' },
    { id: 3, name: 'Cash' },
    { id: 4, name: 'Cible' },
    { id: 6, name: 'Roi' },
    { id: 7, name: 'Matrix' },
    { id: 8, name: 'Ange' },
    { id: 9, name: 'Tomb Raider' },
    { id: 10, name: 'Étoiles' },
    { id: 11, name: 'Cadre royale' },
    { id: 12, name: 'Roses' },
    { id: 13, name: 'Gentleman' },
    { id: 14, name: 'Vinyle' },
    { id: 15, name: 'Advisory' },
    { id: 16, name: 'Espace' },
    { id: 17, name: 'Absolute Cinema' },
    { id: 18, name: 'Flash' },
    { id: 19, name: 'Miaou' },
    { id: 20, name: 'DVD' },
    { id: 21, name: 'Lunettes pixel' },
    { id: 22, name: '2000' },
    { id: 23, name: 'Discord' },
    { id: 24, name: 'Jojo' },
    { id: 25, name: 'Galaxie' },
    { id: 26, name: 'Coeur' },
    { id: 27, name: 'Prestige' },
    { id: 28, name: 'Planify' },
    { id: 27, name: 'Prestige' },
    // Variantes de couleur de bordure classique (achats couleur)
    { id: 100, name: 'Bordure Rouge (couleur)' },
    { id: 101, name: 'Bordure Bleu (couleur)' },
    { id: 102, name: 'Bordure Vert (couleur)' },
    { id: 103, name: 'Bordure Jaune (couleur)' },
    { id: 104, name: 'Bordure Violet (couleur)' },
    { id: 105, name: 'Bordure Orange (couleur)' },
    { id: 106, name: 'Bordure Rose (couleur)' },
    { id: 107, name: 'Bordure Cyan (couleur)' },
    { id: 108, name: 'Bordure Or (couleur)' },
    { id: 109, name: 'Bordure Argent (couleur)' },
    { id: 110, name: 'Bordure Arc-en-ciel (couleur)' },
    { id: 111, name: 'Bordure Feu (couleur)' },
    { id: 112, name: 'Bordure Glace (couleur)' },
    // { id: 113, name: 'Bordure Coucher de soleil (couleur)' },
    { id: 114, name: 'Bordure Océan (couleur)' },
    { id: 115, name: 'Bordure Forêt (couleur)' },
    { id: 116, name: 'Bordure Désert (couleur)' },
    { id: 117, name: 'Bordure Galaxie (couleur)' },
    { id: 118, name: 'Bordure Aurore (couleur)' },
    { id: 119, name: 'Bordure Volcan (couleur)' },
    { id: 120, name: 'Bordure Cristal (couleur)' },
    { id: 121, name: 'Bordure Minuit (couleur)' },
    { id: 122, name: 'Bordure Aube (couleur)' },
    { id: 123, name: 'Bordure Crépuscule (couleur)' },
    { id: 124, name: 'Bordure Tempête (couleur)' },
    { id: 125, name: 'Bordure Printemps (couleur)' },
    { id: 126, name: 'Bordure Été (couleur)' },
    { id: 127, name: 'Bordure Automne (couleur)' },
    { id: 128, name: 'Bordure Hiver (couleur)' },
    { id: 129, name: 'Bordure Magenta (couleur)' },
    { id: 130, name: 'Bordure Vert Lime (couleur)' },
    { id: 131, name: 'Bordure Bleu Royal (couleur)' },
    { id: 132, name: 'Bordure Blanche (couleur)' },
    { id: 133, name: 'Bordure Bronze (couleur)' },
    { id: 134, name: 'Bordure Menthe polaire' },
    { id: 135, name: 'Bordure Crépuscule doré' },
    { id: 136, name: 'Bordure Azur Mandarine' },
    { id: 137, name: 'Bordure Brume rouge' },
    { id: 138, name: 'Bordure Brume verte' },
    { id: 139, name: 'Bordure Brume bleue' },
    { id: 140, name: 'Bordure Aube' },
    { id: 141, name: 'Bordure Lagune' },
    { id: 142, name: 'Bordure Orchidée' },
    { id: 143, name: 'Bordure Néon (couleur)' },
    // Dégradés (IDs 200-231)
    { id: 200, name: 'Neige' },
    { id: 201, name: 'Gris Urbain' },
    { id: 202, name: 'Néon Tricolore' },
    { id: 203, name: 'Néon Menthe' },
    { id: 204, name: 'Nébuleuse' },
    { id: 205, name: 'Soleil' },
    { id: 206, name: 'Violet Profond' },
    { id: 207, name: 'Magenta Royal' },
    { id: 208, name: 'Aurore Boréale' },
    { id: 209, name: 'Tropical' },
    { id: 210, name: "Jardin d'été" },
    { id: 211, name: 'Crépuscule' },
    { id: 212, name: 'Rouge Pastel' },
    { id: 213, name: 'Vert Pastel' },
    { id: 214, name: 'Bleu Profond' },
    { id: 215, name: 'Jaune Pastel' },
    { id: 216, name: 'Cyan Pastel' },
    { id: 217, name: 'Rose Pastel' },
    { id: 218, name: 'Violet Pastel' },
    { id: 219, name: 'Fuchsia Pastel' },
    { id: 220, name: 'Orange Pastel' },
    { id: 221, name: 'Menthe Pastel' },
    { id: 222, name: 'Lave' },
    { id: 223, name: 'Jungle Nocturne' },
    { id: 224, name: 'Océan Nuit' },
    { id: 225, name: 'Soleil Éteint' },
    { id: 226, name: 'Glacier Nuit' },
    { id: 227, name: 'Fuchsia Nuit' },
    { id: 228, name: 'Galaxie Nuit' },
    { id: 229, name: 'Rose Nuit' },
    { id: 230, name: 'Ambre Nuit' },
    { id: 231, name: 'Émeraude Nuit' }
  ]);
  // Conserver la liste de base (statiques) pour pouvoir purger proprement les dynamiques
  const baseStaticIds = new Set(itemsCatalog.value.map(x => x.id))
  // Injecter les items dynamiques créés via l'éditeur
  async function loadAdminDynamicItems() {
    try {
      const res = await secureApiCall('/items')
      if (res && res.success && Array.isArray(res.items)) {
        const extra = res.items.map(it => ({ id: it.legacyId, name: it.name }))
        const existing = new Map(itemsCatalog.value.map(x => [x.id, x]))
        for (const e of extra) {
          if (existing.has(e.id)) {
            existing.get(e.id).name = e.name
          } else {
            itemsCatalog.value.push(e)
          }
        }
        // Purger les anciens IDs dynamiques qui ne sont plus présents (ex: legacyId modifié)
        const extraIds = new Set(extra.map(e => e.id))
        itemsCatalog.value = itemsCatalog.value.filter(x => baseStaticIds.has(x.id) || extraIds.has(x.id))
        // tri par id pour stabilité
        itemsCatalog.value = [...itemsCatalog.value].sort((a,b)=>a.id-b.id)
      }
    } catch {}
  }
  const selectedItemsToGive = ref([]);
const itemsLoading = ref(false);
const adminMessage = ref(''); // Message optionnel de l'admin lors de l'attribution d'items
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
    // Récupérer le token d'authentification
    let token = auth.token || auth.user?.token
    
    if (!token) {
      const userFromStorage = localStorage.getItem('user')
      if (userFromStorage) {
        const userData = JSON.parse(userFromStorage)
        token = userData.token
      }
    }
    
    if (!token) {
      console.warn('Aucun token d\'authentification trouvé')
      return
    }
    
    const headers = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'Authorization': `Bearer ${token}`
    }
    
         const response = await fetch(`${API_URL}/users-admin`, {
      method: 'GET',
      headers: headers,
      credentials: 'include'
    })
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erreur API:', response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
    }
    
    const data = await response.json()
    
    if (data && data.success && Array.isArray(data.users)) {
      users.value = data.users
      console.log(`✅ ${data.users.length} utilisateurs chargés pour l'admin dashboard`)
    } else {
      console.warn('Format de réponse inattendu:', data)
      users.value = []
    }
  } catch (error) {
    console.error('Erreur chargement utilisateurs:', error)
    users.value = []
  }
}

async function addUser() {
  userFormMessage.value = '';
  userFormLoading.value = true;
  try {
    // Récupérer le token d'authentification
    let token = auth.token || auth.user?.token
    
    if (!token) {
      const userFromStorage = localStorage.getItem('user')
      if (userFromStorage) {
        const userData = JSON.parse(userFromStorage)
        token = userData.token
      }
    }
    
    const headers = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'Authorization': `Bearer ${token}`
    }
    
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: headers,
      credentials: 'include',
      body: JSON.stringify(userForm.value)
    })
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
    }
    
    userFormMessage.value = 'Utilisateur ajouté avec succès !';
    userForm.value = { username: '', password: '', role: 'eleve', groupe: 'A', year: 'BUT1' };
    showUserForm.value = false;
    await fetchUsers(); // Rafraîchir la liste
  } catch (error) {
    console.error('Erreur lors de l\'ajout de l\'utilisateur:', error);
    userFormMessage.value = error.message || 'Erreur lors de l\'ajout de l\'utilisateur';
  } finally {
    userFormLoading.value = false;
  }
}

function editUser(user) {
  console.log('=== DÉBUT FONCTION EDITUSER ===');
  console.log('Utilisateur reçu:', user);
  
  // S'assurer que l'utilisateur a toutes les propriétés nécessaires
  const userData = {
    _id: user._id,
    username: user.username || '',
    role: user.role === 'etudiant' ? 'eleve' : (user.role || 'eleve'), // Convertir 'etudiant' en 'eleve'
    groupe: user.groupe || '',
    year: user.year || '',
    coins: user.coins || 0
  };
  
  console.log('Données utilisateur normalisées:', userData);
  
  // Mettre à jour editingUser
  editingUser.value = userData;
  
  // Créer un nouvel objet pour editForm pour forcer la réactivité
  const newEditForm = {
    username: userData.username,
    password: '', // Toujours vide pour la modification
    role: userData.role,
    groupe: userData.groupe,
    year: userData.year,
    coins: userData.coins || 0
  };
  
  console.log('Nouveau formulaire d\'édition:', newEditForm);
  
  // Assigner le nouveau formulaire
  editForm.value = newEditForm;
  
  // Forcer la mise à jour de Vue
  nextTick(() => {
    console.log('=== APRÈS NEXTTICK ===');
    console.log('editingUser.value:', editingUser.value);
    console.log('editForm.value:', editForm.value);
    
    // Vérifier que les valeurs sont bien assignées
    console.log('Vérification des valeurs:');
    console.log('- Username:', editForm.value.username);
    console.log('- Role:', editForm.value.role);
    console.log('- Groupe:', editForm.value.groupe);
    console.log('- Year:', editForm.value.year);
  });
}

function cancelEdit() {
  editingUser.value = null;
  editForm.value = {
    username: '',
    password: '',
    role: 'eleve',
    groupe: '',
    year: '',
    coins: 0
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
    
    // Récupérer le token d'authentification
    let token = auth.token || auth.user?.token
    
    if (!token) {
      const userFromStorage = localStorage.getItem('user')
      if (userFromStorage) {
        const userData = JSON.parse(userFromStorage)
        token = userData.token
      }
    }
    
    const headers = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'Authorization': `Bearer ${token}`
    }
    
    const response = await fetch(`${API_URL}/users-admin?userId=${editingUser.value._id}`, {
      method: 'PUT',
      headers: headers,
      credentials: 'include',
      body: JSON.stringify(updateData)
    })
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
    }
    
    editFormMessage.value = 'Utilisateur mis à jour avec succès !';
    
    // Rafraîchir la liste et fermer l'édition après un délai
    setTimeout(async () => {
      await fetchUsers();
      cancelEdit();
    }, 1500);
  } catch (error) {
    editFormMessage.value = error.message || 'Erreur lors de la mise à jour';
  } finally {
    editFormLoading.value = false;
  }
}

async function deleteUser(userId) {
  if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
    return;
  }
  
  try {
    // Récupérer le token d'authentification
    let token = auth.token || auth.user?.token
    
    if (!token) {
      const userFromStorage = localStorage.getItem('user')
      if (userFromStorage) {
        const userData = JSON.parse(userFromStorage)
        token = userData.token
      }
    }
    
    const headers = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'Authorization': `Bearer ${token}`
    }
    
    const response = await fetch(`${API_URL}/users-admin?userId=${userId}`, {
      method: 'DELETE',
      headers: headers,
      credentials: 'include'
    })
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
    }
    
    await fetchUsers(); // Rafraîchir la liste
  } catch (error) {
    alert('Erreur lors de la suppression: ' + error.message);
  }
}

// Charger les utilisateurs quand on ouvre la gestion
function openUserManagement() {
  showUserManagement.value = true;
  fetchUsers();
}

// Fonction pour voir les items d'un utilisateur
function viewUserItems(user) {
  // Fermer la pop-up secrets si ouverte
  showUserSecrets.value = false;
  viewingUserItems.value = user;
  showUserItems.value = true;
}

// Fonction pour fermer le modal des items
function closeUserItems() {
  showUserItems.value = false;
  viewingUserItems.value = null;
  itemToGive.value = '';
  selectedItemsToGive.value = [];
  adminMessage.value = ''; // Réinitialiser le message
}

// Ouvrir la modale de questions secrètes
async function openUserSecrets(user) {
  secretsMessage.value = '';
  secretsLoading.value = false;
  secretsUser.value = { _id: user._id, username: user.username };
  // Laisser la gestion utilisateurs ouverte; on superpose au-dessus
  showUserItems.value = false;
  // Ouvrir la modale
  showUserSecrets.value = true;

  try {
    // Récupération de l'utilisateur complet (avec questions secrètes)
    let token = auth.token || auth.user?.token;
    if (!token) {
      const userFromStorage = localStorage.getItem('user');
      if (userFromStorage) {
        const userData = JSON.parse(userFromStorage);
        token = userData.token;
      }
    }
    const headers = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
    const res = await fetch(`${API_URL}/users-admin?userId=${user._id}`, { method: 'GET', headers, credentials: token ? 'include' : 'same-origin' });
    if (!res.ok) throw new Error('Erreur de récupération utilisateur');
    const fullUser = await res.json();
    // Mettre à jour le nom si on ne l'avait pas
    if (!secretsUser.value?.username && fullUser?.username) {
      secretsUser.value = { _id: fullUser._id, username: fullUser.username };
    }
    const sq = Array.isArray(fullUser.secretQuestions) ? fullUser.secretQuestions : [];
    if (sq.length >= 3) {
      // Pré-remplir questions et réponses existantes
      secretsForm.value = sq.slice(0, 3).map(q => ({ question: q.question || '', answer: q.answer || '' }));
    } else {
      // Préremplir avec 3 lignes si manquantes
      const defaults = [
        { question: 'Quel est le nom de votre premier animal ?', answer: '' },
        { question: 'Quel est le prénom de votre mère ?', answer: '' },
        { question: 'Quelle est votre ville de naissance ?', answer: '' }
      ];
      // Remplacer disponibles puis compléter, en gardant les réponses existantes si présentes
      for (let i = 0; i < 3; i++) {
        secretsForm.value[i] = sq[i]
          ? { question: sq[i].question || '', answer: sq[i].answer || '' }
          : defaults[i];
      }
    }
  } catch (e) {
    secretsMessage.value = 'Erreur lors du chargement des questions';
  }
}

function closeUserSecrets() {
  showUserSecrets.value = false;
  secretsUser.value = null;
  secretsForm.value = [
    { question: '', answer: '' },
    { question: '', answer: '' },
    { question: '', answer: '' }
  ];
}

// Sauvegarder les questions secrètes
async function saveUserSecrets() {
  if (!secretsUser.value) return;
  secretsLoading.value = true;
  secretsMessage.value = '';
  try {
    // Validation simple: 3 entrées non vides
    const cleaned = secretsForm.value.map(q => ({
      question: String(q.question || '').trim(),
      answer: String(q.answer || '').trim()
    }));
    if (cleaned.some(q => !q.question || !q.answer)) {
      secretsLoading.value = false;
      secretsMessage.value = 'Veuillez remplir les 3 questions et réponses.';
      return;
    }

    let token = auth.token || auth.user?.token;
    if (!token) {
      const userFromStorage = localStorage.getItem('user');
      if (userFromStorage) {
        const userData = JSON.parse(userFromStorage);
        token = userData.token;
      }
    }
    const headers = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'Authorization': `Bearer ${token}`
    };
    // Utiliser la route de mise à jour utilisateur avec payload libre
    const res = await fetch(`${API_URL}/users-admin?userId=${secretsUser.value._id}`, {
      method: 'PUT',
      headers,
      credentials: 'include',
      body: JSON.stringify({ secretQuestions: cleaned })
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(txt || 'Erreur lors de la sauvegarde');
    }

    secretsMessage.value = 'Questions secrètes mises à jour avec succès !';
    await fetchUsers();
    setTimeout(() => {
      closeUserSecrets();
    }, 800);
  } catch (e) {
    secretsMessage.value = 'Erreur: ' + (e.message || e);
  } finally {
    secretsLoading.value = false;
  }
}

// Fonction pour donner un item à un utilisateur
async function giveItemToUser() {
  if (!itemToGive.value || !viewingUserItems.value) return;
  
  itemsLoading.value = true;
  try {
    // Récupérer le token d'authentification
    let token = auth.token || auth.user?.token
    
    if (!token) {
      const userFromStorage = localStorage.getItem('user')
      if (userFromStorage) {
        const userData = JSON.parse(userFromStorage)
        token = userData.token
      }
    }
    
    const headers = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'Authorization': `Bearer ${token}`
    }
    
    // Récupérer le nom de l'item depuis le catalogue (inclut dynamiques)
    const nameById = Object.fromEntries(itemsCatalog.value.map(i => [i.id, i.name]))
    
    const response = await fetch(`${API_URL}/users-admin`, {
      method: 'POST',
      headers: headers,
      credentials: 'include',
      body: JSON.stringify({
        action: 'give-item',
        userId: viewingUserItems.value._id,
        itemId: parseInt(itemToGive.value),
        itemName: nameById[itemToGive.value] || String(itemToGive.value),
        adminMessage: (adminMessage.value || '').trim() || null
      })
    })
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
    }
    
    // Rafraîchir les données de l'utilisateur
    await fetchUsers();
    // Mettre à jour l'utilisateur affiché
    const updatedUser = users.value.find(u => u._id === viewingUserItems.value._id);
    if (updatedUser) {
      viewingUserItems.value = updatedUser;
    }
    
    itemToGive.value = '';
    alert('Item donné avec succès !');
    adminMessage.value = ''
  } catch (error) {
    console.error('Erreur lors du don d\'item:', error);
    alert('Erreur lors du don d\'item: ' + error.message);
  } finally {
    itemsLoading.value = false;
  }
}

// Retirer tous les items + réinitialiser la couleur de bordure
async function removeAllItemsAndBorderColor(userId) {
  if (!confirm('Confirmer la suppression de tous les items et la réinitialisation de la couleur de bordure ?')) return;
  itemsLoading.value = true;
  try {
    // Récupérer le token d'authentification
    let token = auth.token || auth.user?.token
    if (!token) {
      const userFromStorage = localStorage.getItem('user')
      if (userFromStorage) {
        const userData = JSON.parse(userFromStorage)
        token = userData.token
      }
    }
    const headers = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'Authorization': `Bearer ${token}`
    }
    const response = await fetch(`${API_URL}/users-admin`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({
        action: 'clear-all-items',
        userId: userId
      })
    })
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
    }
    await fetchUsers();
    const updatedUser = users.value.find(u => u._id === userId);
    if (updatedUser) {
      viewingUserItems.value = updatedUser;
    }
    alert('Tous les items ont été retirés et la couleur de bordure réinitialisée.');
  } catch (error) {
    alert('Erreur: ' + (error.message || error));
  } finally {
    itemsLoading.value = false;
  }
}

// Sélection/désélection de toutes les cases
function toggleSelectAll() {
  if (selectedItemsToGive.value.length === itemsCatalog.value.length) {
    selectedItemsToGive.value = []
  } else {
    selectedItemsToGive.value = itemsCatalog.value.map(i => i.id)
  }
}

// Sélectionner uniquement les items que l'utilisateur ne possède pas encore
function selectMissingOnly() {
  if (!viewingUserItems.value) return
  const ownedIds = new Set((viewingUserItems.value.purchasedItems || []).map(pi => pi.itemId))
  selectedItemsToGive.value = itemsCatalog.value
    .map(i => i.id)
    .filter(id => !ownedIds.has(id))
}

// Donner plusieurs items (séquentiel)
async function giveSelectedItemsToUser() {
  if (!viewingUserItems.value || selectedItemsToGive.value.length === 0) return
  itemsLoading.value = true
  try {
    let token = auth.token || auth.user?.token
    if (!token) {
      const userFromStorage = localStorage.getItem('user')
      if (userFromStorage) {
        const userData = JSON.parse(userFromStorage)
        token = userData.token
      }
    }
    const headers = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'Authorization': `Bearer ${token}`
    }

    const nameById = Object.fromEntries(itemsCatalog.value.map(i => [i.id, i.name]))
    const ownedIds = new Set((viewingUserItems.value.purchasedItems || []).map(pi => pi.itemId))
    // Ne donner que les items manquants (y compris variantes de bordure)
    const idsToGive = selectedItemsToGive.value.filter(id => !ownedIds.has(id))

    if (idsToGive.length === 0) {
      alert("Aucun nouvel item à donner: l'utilisateur possède déjà tous les items sélectionnés.")
      itemsLoading.value = false
      return
    }

    let givenCount = 0
    let alreadyOwnedCount = 0
    let failedCount = 0
    for (const id of idsToGive) {
      try {
        const response = await fetch(`${API_URL}/users-admin`, {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({ 
            action: 'give-item',
            userId: viewingUserItems.value._id,
            itemId: id, 
            itemName: nameById[id],
            adminMessage: adminMessage.value.trim() || null
          })
        })
        if (!response.ok) {
          // Lire la réponse pour distinguer "déjà possédé" des vraies erreurs
          let msg = ''
          try { msg = await response.text() } catch {}
          if (response.status === 400 && /déjà|deja/i.test(msg)) {
            alreadyOwnedCount++
            continue
          }
          failedCount++
          continue
        }
        givenCount++
      } catch (e) {
        failedCount++
      }
    }

    // Rafraîchir l'utilisateur
    await fetchUsers()
    const updatedUser = users.value.find(u => u._id === viewingUserItems.value._id)
    if (updatedUser) viewingUserItems.value = updatedUser

    // Feedback synthétique
    const parts = []
    if (givenCount) parts.push(`${givenCount} ajouté(s)`) 
    if (alreadyOwnedCount) parts.push(`${alreadyOwnedCount} déjà possédé(s)`) 
    if (failedCount) parts.push(`${failedCount} échec(s)`) 
    alert(parts.length ? `Traitement terminé: ${parts.join(', ')}` : 'Rien à traiter')
    
    // Réinitialiser le message après attribution
    adminMessage.value = ''
  } catch (err) {
    console.error('Erreur don multiple:', err)
    alert('Erreur lors du don d\'items: ' + (err.message || err))
  } finally {
    itemsLoading.value = false
  }
}

// Fonction pour retirer un item d'un utilisateur
async function removeItemFromUser(userId, itemId) {
  if (!confirm('Êtes-vous sûr de vouloir retirer cet item ?')) {
    return;
  }
  
  itemsLoading.value = true;
  try {
    // Récupérer le token d'authentification
    let token = auth.token || auth.user?.token
    
    if (!token) {
      const userFromStorage = localStorage.getItem('user')
      if (userFromStorage) {
        const userData = JSON.parse(userFromStorage)
        token = userData.token
      }
    }
    
    const headers = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'Authorization': `Bearer ${token}`
    }
    
    const response = await fetch(`${API_URL}/users-admin`, {
      method: 'POST',
      headers: headers,
      credentials: 'include',
      body: JSON.stringify({ 
        action: 'remove-item',
        userId: userId,
        itemId: itemId 
      })
    })
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
    }
    
    // Rafraîchir les données de l'utilisateur
    await fetchUsers();
    // Mettre à jour l'utilisateur affiché
    const updatedUser = users.value.find(u => u._id === viewingUserItems.value._id);
    if (updatedUser) {
      viewingUserItems.value = updatedUser;
    }
    
    alert('Item retiré avec succès !');
  } catch (error) {
    console.error('Erreur lors du retrait d\'item:', error);
    alert('Erreur lors du retrait d\'item: ' + error.message);
  } finally {
    itemsLoading.value = false;
  }
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
.secrets-overlay { background: rgba(0,0,0,0.5); z-index: 4000 !important; }
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
  position: relative;
}

.user-items-modal {
  background: #fff;
  padding: 32px;
  border-radius: 18px;
  min-width: 500px;
  max-width: 90vw;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
}

/* Modal Questions secrètes */
.user-secrets-modal {
  background: #fff;
  padding: 32px;
  border-radius: 18px;
  min-width: 600px;
  max-width: 90vw;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
  z-index: 4001;
}
.secrets-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.secret-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.secret-input {
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  font-size: 1rem;
}
.save-btn {
  background: #10b981;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  cursor: pointer;
  font-weight: bold;
}
.secrets-btn {
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 0.9em;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.item-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-info h4 {
  color: #111;
  margin: 0 0 8px 0;
  font-size: 1.1em;
}

.item-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.9em;
  color: #6b7280;
}

.item-id {
  font-weight: bold;
  color: #6366f1;
}

.item-date {
  font-style: italic;
}

.item-equipped {
  color: #10b981;
  font-weight: bold;
}

.item-not-equipped {
  color: #6b7280;
}

.no-items {
  text-align: center;
  padding: 40px;
  color: #6b7280;
  font-style: italic;
}

.give-items-section {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

.give-items-section h4 {
  color: #111;
  margin-bottom: 16px;
}

.give-item-form {
  display: flex;
  gap: 12px;
  align-items: center;
}

.give-item-form.checkboxes {
  flex-direction: column;
  align-items: stretch;
}
.checkbox-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 10px 14px;
  color: black !important;
}
.item-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}
.checkbox-actions {
  display: flex;
  gap: 12px;
  margin-top: 12px;
}
.toggle-all-btn {
  background: #6b7280;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  cursor: pointer;
  font-weight: bold;
}

.item-select {
  flex: 1;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  font-size: 1rem;
}

.give-item-btn {
  background: #10b981;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  cursor: pointer;
  font-weight: bold;
}

.give-item-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.item-actions {
  display: flex;
  gap: 8px;
}

.remove-item-btn {
  background: #ef4444;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 0.9em;
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
.user-groupe, .user-year, .user-coins {
  color: #6b7280;
  font-size: 0.9em;
}

.user-coins {
  color: #f59e0b !important;
  font-weight: bold;
}

.items-btn {
  background: #8b5cf6;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  cursor: pointer;
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
.close-btn { position: static !important; right: auto !important; top: auto !important; background: transparent !important; color: black !important; border: none !important; border-radius: 0 !important; padding: 0 !important; font-size: inherit !important; font-weight: inherit !important; cursor: pointer !important; width: auto !important; transition: none !important; z-index: auto !important; }

/* Close en haut à droite (noir) pour la gestion des utilisateurs */
.modal-close-top {
  position: absolute;
  top: 12px;
  right: 16px;
  width: 36px;
  height: 36px;
  border-radius: 9999px;
  background: #000;
  color: #fff;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
}
.modal-close-top:hover { background: #111; }

/* Bouton Fermer (bas) en noir uniquement dans le modal gestion utilisateurs */
.user-management-modal .modal-footer .close-btn {
  background: #000 !important;
  color: #fff !important;
  border-radius: 8px !important;
  padding: 8px 12px !important;
}

.modal-footer {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
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

/* Styles pour le message admin */
.admin-message-section {
  margin: 20px 0;
  padding: 15px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.message-label {
  display: block;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
  font-size: 0.9rem;
}

.admin-message-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-family: inherit;
  font-size: 0.9rem;
  resize: vertical;
  min-height: 80px;
  transition: border-color 0.2s;
}

.admin-message-input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.message-counter {
  text-align: right;
  font-size: 0.8rem;
  color: #6b7280;
  margin-top: 4px;
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

