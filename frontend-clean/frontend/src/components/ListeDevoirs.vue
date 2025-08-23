<template>
  <div class="liste-devoirs-bg">
    <h2 class="liste-title">Liste des devoirs</h2>
    <button v-if="user && (user.role === 'delegue' || user.role === 'prof')" class="btn-ajouter-tache" @click="showAddTaskPopup = true">
      <span style="font-size:1.3em;margin-right:6px;">＋</span> Ajouter une tâche
    </button>
    <div v-if="showAddTaskPopup" class="popup-overlay" @click.self="showAddTaskPopup = false">
      <div class="popup-content-ajout-tache">
        <button class="close-btn-ajout" @click="() => { hoverCloseAdd = false; showAddTaskPopup = false }" @mouseover="hoverCloseAdd = true" @mouseleave="hoverCloseAdd = false">
          <img :src="hoverCloseAdd ? closeHoverImg : closeImg" alt="Fermer" class="close-img" />
        </button>
        <h3>Ajouter une tâche</h3>
        <form @submit.prevent="submitAddTask">
          <input v-model="newTask.titre" placeholder="Titre" required />
          <select v-model="newTask.type" required>
            <option value="devoir">Devoir</option>
            <option value="exam">Examen</option>
          </select>
          <select v-model="newTask.matiere" required>
            <option value="" disabled>Matière</option>
            <option v-for="matiere in mmiMatieres" :key="matiere" :value="matiere">{{ matiere }}</option>
          </select>
          <div class="input-floating">
            <input v-model="newTask.date" type="date" required id="date-input" placeholder=" " class="mobile-date-input" @input="updateDatePlaceholder" />
            <label for="date-input">Date</label>
          </div>
          <div class="input-floating">
            <input v-model="newTask.heure" type="time" required id="heure-input" placeholder=" " class="mobile-time-input" @input="updateTimePlaceholder" />
            <label for="heure-input">Heure</label>
          </div>
          <!-- Sélecteur d'année pour les professeurs -->
          <div v-if="user && user.role === 'prof'" class="input-floating">
            <select v-model="newTask.year" required id="year-input">
              <option value="" disabled>Sélectionner l'année</option>
              <option value="BUT1">BUT1</option>
              <option value="BUT2">BUT2</option>
              <option value="BUT3">BUT3</option>
            </select>
            <label for="year-input">Année</label>
            <small style="color: #666; font-size: 0.9em; margin-top: 4px; display: block;">Sélectionnez l'année pour laquelle ce devoir/examen est destiné</small>
          </div>
          <textarea v-model="newTask.description" placeholder="Description" rows="2"></textarea>
          <!-- Groupes ciblés (à améliorer selon l'année du délégué) -->
          <label style="margin-top:8px;color:#111;">Groupes concernés :</label>
          <div class="groupes-checkboxes">
            <label v-for="groupe in groupesDisponibles" :key="groupe">
              <input type="checkbox" v-model="newTask.groupes" :value="groupe" /> {{ groupe }}
            </label>
          </div>
          <button type="submit" class="btn-valider-ajout" :disabled="loadingAdd">
            {{ loadingAdd ? 'Ajout...' : 'Valider' }}
          </button>
        </form>
      </div>
    </div>
    <div class="liste-tri">
      <div class="tri-group">
        <span class="tri-label">Trier par :</span>
        <div class="tri-btns-desktop">
          <button class="btn-tri" :class="{ active: sortBy === 'date' }" @click="setSort('date')">Date</button>
          <button class="btn-tri" :class="{ active: sortBy === 'passe' }" @click="setSort('passe')">Archives</button>
          <button class="btn-tri" :class="{ active: sortBy === 'exam' }" @click="() => { setSort('exam'); handleNotifClick('exam'); }">
            Examens
            <img v-if="hasNewTask('exam')" :src="notifIcon" alt="Nouveau" class="notif-icon" />
          </button>
          <button class="btn-tri" :class="{ active: sortBy === 'devoir' }" @click="() => { setSort('devoir'); handleNotifClick('devoir'); }">
            Devoirs
            <img v-if="hasNewTask('devoir')" :src="notifIcon" alt="Nouveau" class="notif-icon" />
          </button>
          <button v-if="user && user.role !== 'prof'" class="btn-tri" :class="{ active: sortBy === 'enretard' }" @click="() => { setSort('enretard'); handleNotifClick('retard'); }">
            Retard
            <img v-if="hasNewTask('retard')" :src="notifIcon" alt="Nouveau" class="notif-icon" />
          </button>
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
      <template v-else-if="sortBy !== 'passe' && sortBy !== 'enretard'">
        <div class="liste-deux-colonnes">
          <div class="liste-col-gauche">
            <div class="col-gauche-title">Tâches complétées</div>
            <button v-if="doneEvents.length > 0" class="btn-archiver-tout" @click="archiverTout">Tout archiver</button>
            <div v-if="doneEvents.length === 0" class="aucune-tache">Aucune tâche complétée</div>
            <div v-for="event in doneEvents" :key="event.titre + event.date + event.heure" class="devoir-card-liste fait">
              <img v-if="isNewTask(event)" :src="notifIcon" alt="Nouveau" class="notif-icon" />
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
                      @mouseover="hoveredCheck = eventKey(event)"
                      @mouseleave="hoveredCheck = null"
                    />
                    <img
                      v-if="canDelete(event)"
                      :src="supprimerIcon"
                      alt="Supprimer"
                      class="btn-supprimer-liste"
                      @click="confirmDelete(event)"
                    />
                    <!-- Bouton supprimer mobile à la place du bouton checklist dupliqué -->
                    <img
                      v-if="canDelete(event)"
                      :src="supprimerIcon"
                      alt="Supprimer (mobile)"
                      class="btn-supprimer-liste btn-supprimer-liste-mobile"
                      @click="confirmDelete(event)"
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
                <small style="color:#6366f1;">
                  ⏰ {{ timeLeft(event.date, event.heure) }}
                </small>
                <button class="btn-plus-infos" @click="openPopup(event)">Plus d'infos</button>
                <img v-if="getGroupeImage(event)" :src="getGroupeImage(event)" alt="Groupe" class="groupe-img" :class="{ promo: getGroupeImage(event) === groupePromo }" />
              </div>
            </div>
          </div>
          <div class="liste-col-droite">
            <div v-if="toDoEvents.length === 0" class="aucune-tache">Aucune tâche à faire</div>
            <div v-for="event in toDoEvents" :key="event.titre + event.date + event.heure" :class="['devoir-card-liste', isLate(event) ? 'en-retard' : '']">
              <img v-if="isNewTask(event)" :src="notifIcon" alt="Nouveau" class="notif-icon" />
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
                      @mouseover="hoveredCheck = eventKey(event)"
                      @mouseleave="hoveredCheck = null"
                    />
                    <img
                      v-if="canDelete(event)"
                      :src="supprimerIcon"
                      alt="Supprimer"
                      class="btn-supprimer-liste"
                      @click="confirmDelete(event)"
                    />
                    <!-- Bouton supprimer mobile à la place du bouton checklist dupliqué -->
                    <img
                      v-if="canDelete(event)"
                      :src="supprimerIcon"
                      alt="Supprimer (mobile)"
                      class="btn-supprimer-liste btn-supprimer-liste-mobile"
                      @click="confirmDelete(event)"
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
                <small v-if="isLate(event)" style="color:#ef4444;">⚠️ En retard</small>
                <small v-else style="color:#6366f1;">⏰ {{ timeLeft(event.date, event.heure) }}</small>
                <button class="btn-plus-infos" @click="openPopup(event)">Plus d'infos</button>
                <img v-if="getGroupeImage(event)" :src="getGroupeImage(event)" alt="Groupe" class="groupe-img" :class="{ promo: getGroupeImage(event) === groupePromo }" />
              </div>
            </div>
          </div>
        </div>
      </template>
      <template v-else-if="sortBy === 'enretard'">
        <div class="liste-deux-colonnes">
          <div class="liste-col-gauche">
            <div class="col-gauche-title">Tâches complétées</div>
            <button v-if="doneEvents.length > 0" class="btn-archiver-tout" @click="archiverTout">Tout archiver</button>
            <div v-if="doneEvents.length === 0" class="aucune-tache">Aucune tâche complétée</div>
            <div v-for="event in doneEvents" :key="event.titre + event.date + event.heure" class="devoir-card-liste fait">
              <img v-if="isNewTask(event)" :src="notifIcon" alt="Nouveau" class="notif-icon" />
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
                      @mouseover="hoveredCheck = eventKey(event)"
                      @mouseleave="hoveredCheck = null"
                    />
                    <img
                      v-if="canDelete(event)"
                      :src="supprimerIcon"
                      alt="Supprimer"
                      class="btn-supprimer-liste"
                      @click="confirmDelete(event)"
                    />
                    <!-- Bouton supprimer mobile à la place du bouton checklist dupliqué -->
                    <img
                      v-if="canDelete(event)"
                      :src="supprimerIcon"
                      alt="Supprimer (mobile)"
                      class="btn-supprimer-liste btn-supprimer-liste-mobile"
                      @click="confirmDelete(event)"
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
                <small style="color:#6366f1;">Archivé</small>
                <button class="btn-plus-infos" @click="openPopup(event)">Plus d'infos</button>
                <img v-if="getGroupeImage(event)" :src="getGroupeImage(event)" alt="Groupe" class="groupe-img" :class="{ promo: getGroupeImage(event) === groupePromo }" />
              </div>
            </div>
          </div>
          <div class="liste-col-droite">
            <div v-if="lateEvents.length === 0" class="aucune-tache">Aucune tâche en retard</div>
            <div v-for="event in lateEvents" :key="event.titre + event.date + event.heure" class="devoir-card-liste en-retard">
              <img v-if="isNewTask(event)" :src="notifIcon" alt="Nouveau" class="notif-icon" />
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
                      @mouseover="hoveredCheck = eventKey(event)"
                      @mouseleave="hoveredCheck = null"
                    />
                    <img
                      v-if="canDelete(event)"
                      :src="supprimerIcon"
                      alt="Supprimer"
                      class="btn-supprimer-liste"
                      @click="confirmDelete(event)"
                    />
                    <!-- Bouton supprimer mobile à la place du bouton checklist dupliqué -->
                    <img
                      v-if="canDelete(event)"
                      :src="supprimerIcon"
                      alt="Supprimer (mobile)"
                      class="btn-supprimer-liste btn-supprimer-liste-mobile"
                      @click="confirmDelete(event)"
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
                <small style="color:#ef4444;">⚠️ En retard</small>
                <button class="btn-plus-infos" @click="openPopup(event)">Plus d'infos</button>
                <img v-if="getGroupeImage(event)" :src="getGroupeImage(event)" alt="Groupe" class="groupe-img" :class="{ promo: getGroupeImage(event) === groupePromo }" />
              </div>
            </div>
          </div>
        </div>
      </template>
      <div v-else-if="sortBy === 'passe'" class="liste-col-archives">
        <div class="archive-btns-row" v-if="archives.length > 0" style="flex-direction: column; align-items: center;">
          <!-- Si AUCUNE matière sélectionnée (Toutes) -->
          <template v-if="!selectedMatiere">
            <div style="display: flex; justify-content: center; margin-bottom: 10px; margin-top: 20px;">
              <button class="btn-vider-archive" @click="viderArchive">Vider tout</button>
            </div>
            <div style="display: flex; gap: 10px; justify-content: center; margin-bottom: 10px;">
              <button class="btn-vider-archive orange" @click="viderArchiveType('devoir')">Vider les devoirs</button>
              <button class="btn-vider-archive blue" @click="viderArchiveType('exam')">Vider les examens</button>
            </div>
          </template>
          <!-- Si une matière précise est sélectionnée -->
          <template v-else>
            <div style="display: flex; justify-content: center; margin-bottom: 10px; margin-top: 20px;">
              <button class="btn-vider-archive violet" @click="viderArchiveMatiere(selectedMatiere)" :disabled="!selectedMatiere">Vider la matière</button>
            </div>
            <div style="display: flex; gap: 10px; justify-content: center; margin-bottom: 10px; align-items: center; flex-direction: column;">
              <button class="btn-vider-archive orange" @click="viderArchiveTypeMatiere('devoir', selectedMatiere)" :disabled="!selectedMatiere">Vider devoirs de la matière</button>
              <button class="btn-vider-archive blue" @click="viderArchiveTypeMatiere('exam', selectedMatiere)" :disabled="!selectedMatiere">Vider examens de la matière</button>
            </div>
          </template>
        </div>
        <div v-if="archives.length === 0" class="aucune-tache">Aucune tâche archivée</div>
        <div v-for="event in archivesFiltered" :key="event.titre + event.date + event.heure" class="devoir-card-liste archive">
          <img v-if="isNewTask(event)" :src="notifIcon" alt="Nouveau" class="notif-icon" />
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
            <small style="color:#6366f1;">Archivé</small>
            <button class="btn-plus-infos" @click="openPopup(event)">Plus d'infos</button>
            <img v-if="getGroupeImage(event)" :src="getGroupeImage(event)" alt="Groupe" class="groupe-img" :class="{ promo: getGroupeImage(event) === groupePromo }" />
          </div>
        </div>
      </div>
    </div>
    <div v-if="popupEvent" class="popup-overlay" @click.self="closePopup">
      <div class="popup-content">
        <h3>{{ popupEvent.titre }}</h3>
        <p><b>Matière :</b> {{ popupEvent.matiere }}</p>
        <p><b>Date :</b> {{ formatDate(popupEvent.date) }} {{ popupEvent.heure }}</p>
        <p><b>Description :</b>
          <span class="multiline-html" v-html="linkify(popupEvent.description)"></span>
        </p>
        <button class="btn-fermer-popup" @click="closePopup">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align:middle;margin-right:8px;"><path d="M4 4L14 14M14 4L4 14" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>
          Fermer
        </button>
      </div>
    </div>
    <div v-if="showSuccessPopup" class="popup-overlay" @click.self="showSuccessPopup = false">
      <div class="popup-content-success">
        <h3>Tâche ajoutée avec succès !</h3>
        <button class="btn-ok-success" @click="showSuccessPopup = false">OK</button>
      </div>
    </div>
    <div v-if="showErrorPopup" class="popup-overlay" @click.self="showErrorPopup = false">
      <div class="popup-content-success">
        <h3 style="color:#ef4444;">Erreur</h3>
        <div style="margin-bottom:18px; color:#111;">{{ errorMsg }}</div>
        <button class="btn-ok-success" @click="showErrorPopup = false">OK</button>
      </div>
    </div>
    <!-- Popup de confirmation de suppression -->
    <div v-if="showDeletePopup" class="popup-overlay" @click="cancelDelete">
      <div class="popup-content popup-delete-confirm" @click.stop>
        <h3>Confirmation de suppression</h3>
        <p>Êtes-vous sûr de vouloir supprimer cette tâche ?</p>
        <div style="display: flex; gap: 12px; justify-content: center; margin-top: 24px;">
          <button @click="cancelDelete" class="btn-cancel-delete">Non</button>
          <button @click="deleteTaskConfirmed" class="btn-confirm-delete">Oui</button>
        </div>
      </div>
    </div>
  </div>


</template>

<script setup>
import { computed, ref } from 'vue';
import boutonValiderCocher from '@/assets/img/bouton_valider_cocher.png';
import boutonValiderDecocher from '@/assets/img/bouton_valider_decocher.png';
import { onMounted, watch, nextTick } from 'vue';
import groupeA from '@/assets/img/groupe_A.png';
import groupeB from '@/assets/img/groupe_B.png';
import groupePromo from '@/assets/img/groupe_Promo.png';
import groupeAprime from '@/assets/img/groupe_A\'.png';
import groupeAprimeprime from '@/assets/img/groupe_Aprime.png';
import groupeBprime from '@/assets/img/groupe_B\'.png';
import groupeBprimeprime from '@/assets/img/groupe_Bprime.png';
import axios from 'axios';
import { defineEmits } from 'vue';
import closeImg from '@/assets/img/bouton_supprimer_decocher.png';
import closeHoverImg from '@/assets/img/bouton_supprimer_cocher.png';
import notifIcon from '@/assets/notif.png';
import supprimerIcon from '@/assets/supprimer.svg';
import { API_URL } from '@/api';

const props = defineProps({
  events: { type: Array, required: true }
});
const sortBy = ref('date');
const selectedMatiere = ref('');
const hoveredCheck = ref(null);
const hoverCloseAdd = ref(false);
const user = ref(null);
if (localStorage.getItem('user')) {
  user.value = JSON.parse(localStorage.getItem('user'));
}
const isAdmin = computed(() => user.value && user.value.role === 'admin');
const matiereArchive = ref('');

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

// Génère une clé unique stable pour un event
const eventKey = (e) => (e && (e._id || (e.titre + e.date + e.heure)));

function getCheckImage(event) {
  if (hoveredCheck.value === eventKey(event)) {
    return boutonValiderCocher;
  }
  return event.checked ? boutonValiderCocher : boutonValiderDecocher;
}

import cocherSound from '@/assets/son/cocher.mp3'
import annulerSound from '@/assets/son/annuler.mp3'
import archiverSound from '@/assets/son/archiver.mp3'
import supprimerArchiveSound from '@/assets/son/supprimerarchive.mp3'

const playSound = (src) => {
  try { const a = new Audio(src); a.volume = 0.7; a.play().catch(() => {}) } catch {}
}

async function toggleCheck(event) {
  if (!user.value) return alert('Non connecté');
  try {
    if (!event.checked) {
      await axios.post(`${API_URL}/events-check`, { eventId: event._id, action: 'check' }, { headers: { Authorization: `Bearer ${user.value.token}` } });
      playSound(cocherSound)
    } else {
      await axios.post(`${API_URL}/events-check`, { eventId: event._id, action: 'uncheck' }, { headers: { Authorization: `Bearer ${user.value.token}` } });
      playSound(annulerSound)
    }
    await nextTick();
    hoveredCheck.value = null;
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

const lateEvents = computed(() =>
  props.events.filter(e =>
    !e.archived &&
    !e.checked &&
    isLate(e) &&
    (!selectedMatiere.value || e.matiere === selectedMatiere.value)
  )
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
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
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
  markTaskAsSeen(event);
  try { document.body.style.overflow = 'hidden' } catch (e) {}
}
function closePopup() {
  popupEvent.value = null;
  try { document.body.style.overflow = '' } catch (e) {}
}

function getGroupeImage(event) {
  const groupes = event.groupes || [event.groupe];
  const userGroupe = user.value?.groupe;
  
  // Si Promo est coché, on affiche Promo
  if (groupes.includes('Promo')) return groupePromo;
  
  // Si l'utilisateur a un groupe spécifique et que ce groupe est dans la liste
  if (userGroupe && groupes.includes(userGroupe)) {
    // Retourner l'image correspondant au groupe de l'utilisateur
    switch (userGroupe) {
      case 'A': return groupeA;
      case "A'": return groupeAprime;
      case 'A"': return groupeAprimeprime;
      case 'B': return groupeB;
      case "B'": return groupeBprime;
      case 'B"': return groupeBprimeprime;
      case 'Promo': return groupePromo;
      default: break;
    }
  }
  
  // Si A et B sont cochés (et rien d'autre), on affiche Promo
  if (groupes.includes('A') && groupes.includes('B') && groupes.length === 2) return groupePromo;
  
  // Fallback : afficher l'image du premier groupe de la liste
  if (groupes.length > 0) {
    const firstGroupe = groupes[0];
    switch (firstGroupe) {
      case 'A': return groupeA;
      case "A'": return groupeAprime;
      case 'A"': return groupeAprimeprime;
      case 'B': return groupeB;
      case "B'": return groupeBprime;
      case 'B"': return groupeBprimeprime;
      case 'Promo': return groupePromo;
      default: return null;
    }
  }
  
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
      await axios.post(`${API_URL}/events-check`, { eventId: event._id, action: 'archive' }, { headers: { Authorization: `Bearer ${user.value.token}` } });
    }
    emit('refresh-events');
    playSound(archiverSound)
  } catch (error) {
    alert("Erreur lors de l'archivage des tâches.");
    console.error(error);
  }
}

const userId = user.value && (user.value._id || user.value.id);
const archivesFiltered = computed(() =>
  props.events.filter(e =>
    e.archivedBy && e.archivedBy.some(id => id === userId || (id._id && id._id === userId))
    && (!selectedMatiere.value || e.matiere === selectedMatiere.value)
  )
);

async function viderArchive() {
  if (!user.value) return alert('Non connecté');
  if (!confirm('Voulez-vous vraiment désarchiver toutes les tâches archivées ?')) return;
  try {
    for (const event of archivesFiltered.value.slice()) {
      // 1) Retirer des archives
      await axios.post(`${API_URL}/events-check`, { eventId: event._id, action: 'unarchive' }, { headers: { Authorization: `Bearer ${user.value.token}` } });
      // 2) Retirer l'état "complété" pour ne pas réapparaître dans la liste "Tâches complétées"
      try {
        await axios.post(`${API_URL}/events-check`, { eventId: event._id, action: 'uncheck' }, { headers: { Authorization: `Bearer ${user.value.token}` } });
      } catch (e) { /* tolérant si déjà décoché */ }
      // 3) Tenter la suppression définitive (réussit si autorisé côté backend)
      try {
        await axios.delete(`${API_URL}/events`, { data: { eventId: event._id }, headers: { Authorization: `Bearer ${user.value.token}` } });
      } catch (e) { /* si non autorisé, on ignore et laisse la tâche désarchivée et décochée */ }
    }
    emit('refresh-events');
    playSound(supprimerArchiveSound)
  } catch (error) {
    alert("Erreur lors du désarchivage des tâches.");
    console.error(error);
  }
}

async function viderArchiveType(type) {
  if (!user.value) return alert('Non connecté');
  if (!confirm(`Voulez-vous vraiment désarchiver tous les ${type === 'devoir' ? 'devoirs' : 'examens'} archivés ?`)) return;
  try {
    for (const event of archivesFiltered.value.filter(e => e.type === type).slice()) {
      await axios.post(`${API_URL}/events-check`, { eventId: event._id, action: 'unarchive' }, { headers: { Authorization: `Bearer ${user.value.token}` } });
      try { await axios.post(`${API_URL}/events-check`, { eventId: event._id, action: 'uncheck' }, { headers: { Authorization: `Bearer ${user.value.token}` } }); } catch {}
      try { await axios.delete(`${API_URL}/events`, { data: { eventId: event._id }, headers: { Authorization: `Bearer ${user.value.token}` } }); } catch {}
    }
    emit('refresh-events');
    playSound(supprimerArchiveSound)
  } catch (error) {
    alert('Erreur lors du désarchivage.');
  }
}

async function viderArchiveMatiere(matiere) {
  if (!user.value) return alert('Non connecté');
  if (!matiere) return;
  if (!confirm(`Voulez-vous vraiment désarchiver toutes les tâches archivées de la matière "${matiere}" ?`)) return;
  try {
    for (const event of archivesFiltered.value.filter(e => e.matiere === matiere).slice()) {
      await axios.post(`${API_URL}/events-check`, { eventId: event._id, action: 'unarchive' }, { headers: { Authorization: `Bearer ${user.value.token}` } });
      try { await axios.post(`${API_URL}/events-check`, { eventId: event._id, action: 'uncheck' }, { headers: { Authorization: `Bearer ${user.value.token}` } }); } catch {}
      try { await axios.delete(`${API_URL}/events`, { data: { eventId: event._id }, headers: { Authorization: `Bearer ${user.value.token}` } }); } catch {}
    }
    emit('refresh-events');
    playSound(supprimerArchiveSound)
  } catch (error) {
    alert('Erreur lors du désarchivage.');
  }
}

async function viderArchiveTypeMatiere(type, matiere) {
  if (!user.value) return alert('Non connecté');
  if (!matiere) return;
  if (!confirm(`Voulez-vous vraiment désarchiver tous les ${type === 'devoir' ? 'devoirs' : 'examens'} archivés de la matière "${matiere}" ?`)) return;
  try {
    for (const event of archivesFiltered.value.filter(e => e.type === type && e.matiere === matiere).slice()) {
      await axios.post(`${API_URL}/events-check`, { eventId: event._id, action: 'unarchive' }, { headers: { Authorization: `Bearer ${user.value.token}` } });
      try { await axios.post(`${API_URL}/events-check`, { eventId: event._id, action: 'uncheck' }, { headers: { Authorization: `Bearer ${user.value.token}` } }); } catch {}
      try { await axios.delete(`${API_URL}/events`, { data: { eventId: event._id }, headers: { Authorization: `Bearer ${user.value.token}` } }); } catch {}
    }
    emit('refresh-events');
    playSound(supprimerArchiveSound)
  } catch (error) {
    alert('Erreur lors du désarchivage.');
  }
}

function linkify(text) {
  if (!text) return '';
  return text.replace(
    /(https?:\/\/[^\s]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
  );
}



const showAddTaskPopup = ref(false);
const showSuccessPopup = ref(false);
const showErrorPopup = ref(false);
const errorMsg = ref('');

const loadingAdd = ref(false);
const dateInput = ref(null);
const timeInput = ref(null);
const newTask = ref({
  titre: '',
  type: 'devoir',
  matiere: '',
  date: '',
  heure: '',
  description: '',
  groupes: [],
  year: ''
});
const groupesDisponibles = computed(() => {
  // Groupes avec sous-groupes : A, A', A", B, B', B", Promo
  return ["A", "A'", "A\"", "B", "B'", "B\"", "Promo"];
});

// Fonctions pour gérer les placeholders sur mobile et tablette
function updateDatePlaceholder() {
  if (window.innerWidth >= 320 && window.innerWidth <= 1024) { // 320px à 1024px
    const input = document.getElementById('date-input');
    if (input) {
      if (newTask.value.date) {
        input.style.setProperty('--placeholder', 'none');
      } else {
        input.style.setProperty('--placeholder', 'block');
      }
    }
  }
}

function updateTimePlaceholder() {
  if (window.innerWidth >= 320 && window.innerWidth <= 1024) { // 320px à 1024px
    const input = document.getElementById('heure-input');
    if (input) {
      if (newTask.value.heure) {
        input.style.setProperty('--placeholder', 'none');
      } else {
        input.style.setProperty('--placeholder', 'block');
      }
    }
  }
}
async function submitAddTask() {
  loadingAdd.value = true;
  errorMsg.value = '';
  // Validation : au moins un groupe doit être sélectionné
  if (newTask.value.groupes.length === 0) {
    errorMsg.value = 'Veuillez sélectionner au moins un groupe.';
    showErrorPopup.value = true;
    loadingAdd.value = false;
    return;
  }
  
  // Validation : les professeurs doivent sélectionner une année
  if (user.value && user.value.role === 'prof' && !newTask.value.year) {
    errorMsg.value = 'Veuillez sélectionner une année.';
    showErrorPopup.value = true;
    loadingAdd.value = false;
    return;
  }
  try {
    // Préparer la tâche à envoyer
    const userData = user.value;
    const eventToSend = {
      titre: newTask.value.titre,
      type: newTask.value.type,
      matiere: newTask.value.matiere,
      date: newTask.value.date,
      heure: newTask.value.heure,
      description: newTask.value.description,
      groupes: newTask.value.groupes,
      groupe: newTask.value.groupes[0], // toujours une valeur valide
      year: userData.role === 'prof' ? newTask.value.year : (userData.year || 'BUT1') // Utiliser l'année sélectionnée pour les profs
    };
    const token = userData.token;
    await axios.post(`${API_URL}/events`, eventToSend, {
      headers: { Authorization: `Bearer ${token}` }
    });
    showAddTaskPopup.value = false;
    showSuccessPopup.value = true;
    emit('refresh-events');
    // Reset du formulaire
    newTask.value = { titre: '', type: 'devoir', matiere: '', date: '', heure: '', description: '', groupes: [], year: '' };
  } catch (e) {
    errorMsg.value = e?.response?.data?.message || 'Erreur lors de l\'ajout de la tâche.';
    showErrorPopup.value = true;
  } finally {
    loadingAdd.value = false;
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

function isNewTask(event) {
  if (!event || !event._id) return false;
  if (event.type !== 'devoir' && event.type !== 'exam') return false;
  const seen = localStorage.getItem('seenTask_' + event._id);
  return !seen;
}

// Marquer comme vu dès affichage
watch(
  () => props.events,
  (events) => {
    if (!Array.isArray(events)) return;
    events.forEach(event => {
      if (isNewTask(event)) {
        localStorage.setItem('seenTask_' + event._id, '1');
      }
    });
  },
  { immediate: true, deep: true }
);

// Watcher pour initialiser les placeholders quand le popup s'ouvre
watch(
  () => showAddTaskPopup.value,
  (isOpen) => {
    if (isOpen && window.innerWidth >= 320 && window.innerWidth <= 1024) {
      // Initialiser les placeholders après que le DOM soit mis à jour
      nextTick(() => {
        updateDatePlaceholder();
        updateTimePlaceholder();
      });
    }
  }
);

function markTaskAsSeen(event) {
  if (event && event._id) {
    localStorage.setItem('seenTask_' + event._id, '1');
  }
}

// --- Gestion notification locale ---
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
function getLastSeen(type) {
  return localStorage.getItem('lastSeen' + capitalize(type));
}
function setLastSeen(type, date) {
  localStorage.setItem('lastSeen' + capitalize(type), date);
}
function getLatestDate(events) {
  if (!events.length) return null;
  return events.reduce((max, e) => (e.date > max ? e.date : max), events[0].date);
}
function hasNewTask(type) {
  let filtered;
  if (type === 'retard') {
    filtered = lateEvents.value;
  } else {
    filtered = props.events.filter(e => e.type === type && !e.archived);
  }
  if (!filtered.length) return false;
  const latest = getLatestDate(filtered);
  const lastSeen = getLastSeen(type);
  return !lastSeen || latest > lastSeen;
}
function handleNotifClick(type) {
  let filtered;
  if (type === 'retard') {
    filtered = lateEvents.value;
  } else {
    filtered = props.events.filter(e => e.type === type && !e.archived);
  }
  if (!filtered.length) return;
  const latest = getLatestDate(filtered);
  setLastSeen(type, latest);
}

function canDelete(event) {
  return user.value && (user.value.role === 'delegue' || user.value.role === 'prof') && event.createdBy === user.value._id;
}

const showDeletePopup = ref(false);
const taskToDelete = ref(null);

function confirmDelete(event) {
  taskToDelete.value = event;
  showDeletePopup.value = true;
  try { document.body.style.overflow = 'hidden' } catch (e) {}
}

async function deleteTaskConfirmed() {
  if (!taskToDelete.value) return;
  
  try {
    const token = user.value.token;
    await axios.delete(`${API_URL}/events`, { data: { eventId: taskToDelete.value._id },
      headers: { Authorization: `Bearer ${token}` }
    });
    emit('refresh-events');
    showDeletePopup.value = false;
    taskToDelete.value = null;
  } catch (e) {
    console.error('Erreur suppression:', e);
    alert('Erreur lors de la suppression de la tâche.');
  }
}

function cancelDelete() {
  showDeletePopup.value = false;
  taskToDelete.value = null;
  try { document.body.style.overflow = '' } catch (e) {}
}
</script>

<style>
.liste-devoirs-bg {
  width: 100%;
  margin: 0 auto;
  margin-top: 5%;
  margin-bottom: 5%;
  border-radius: 3rem 3rem 3rem 3rem;
  background: rgb(47, 53, 61);
  padding-bottom: 80px;
  max-width: 1300px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: 'Cobe Heavy', Inter, sans-serif;
}
.liste-header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5em;
}
.liste-title {
  width: 100%;
  border-radius: 2rem 2rem 0rem 0rem;
  text-align: center;
  font-size: 4.5em;
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
  text-shadow: 2px 2px 0 #b0b0b0;
  text-align: left;
  margin-left: 0;
  margin-bottom: 0;
  margin-right: 16px;
  font-family: 'Cobe Heavy', Inter, sans-serif;
}
.btn-tri {
  cursor: pointer;
  border: none;
  border-radius: 18px;
  background: #f0f0f0;
  color: #b0b0b0;
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
.liste-content {
  gap: 24px;
  display: flex;
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
  font-family: 'Cobe Heavy', Inter, sans-serif;
}
.devoir-type {
  font-size: 0.98em;
  color: #888;
  font-family: 'Cobe Heavy', Inter, sans-serif;
}
.devoir-groupe {
  font-size: 0.98em;
  color: #888;
  font-family: 'Cobe Heavy', Inter, sans-serif;
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
  color: #6db4ff;
  margin: 12px 0 8px 0;
  font-family: 'Cobe Heavy', Inter, sans-serif;
}
.aucune-tache {
  text-align: center;
  color: #aaa;
  font-style: italic;
  margin-bottom: 12px;
  font-family: 'Cobe Heavy', Inter, sans-serif;
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
  margin: 32px 0;
  width: 100%;
  font-family: 'Cobe Heavy', Inter, sans-serif;
}
.btn-plus-infos {
  min-width: 120px;
  max-width: 120px;
  width: 100%;
  font-size: 1em;
  padding: 8px 0;
  background: linear-gradient(90deg, #6db4ff 0%, #3a8dde 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 0 2px 8px #0001;
  text-shadow: 1px 1px 2px #0003;
  position: relative;
  overflow: hidden;
  background-size: 200% 200%;
  background-position: 0% 50%;
  transition: transform 0.2s ease, box-shadow 0.3s ease, background-position 0.4s ease, background 0.2s ease;
  font-family: 'Cobe Heavy', Inter, sans-serif;
}
.btn-plus-infos:hover {
  background: linear-gradient(90deg, #3a8dde 0%, #6db4ff 100%);
  transform: translateY(-2px);
  background-position: 100% 50%;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12), 0 0 18px rgba(61, 133, 224, 0.25);
}
.btn-plus-infos:active {
  transform: translateY(-1px);
}
.btn-plus-infos:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(61, 133, 224, 0.35), 0 8px 20px rgba(0, 0, 0, 0.12);
}
.btn-plus-infos::before {
  content: '';
  position: absolute;
  top: 0;
  left: -150%;
  width: 50%;
  height: 100%;
  background: linear-gradient(115deg, transparent, rgba(255, 255, 255, 0.25), transparent);
  transform: skewX(-20deg);
}
.btn-plus-infos:hover::before {
  animation: shine 0.8s ease;
}
.popup-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  overscroll-behavior: contain;
  touch-action: none;
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
  font-family: 'Cobe Heavy', Inter, sans-serif;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}
.popup-content .multiline-html {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  word-break: break-word;
  display: block;
}
.popup-content h3, .popup-content p, .popup-content b, .popup-content button {
  /* color: #111 !important; */
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
  flex-direction: row-reverse;
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
  background: linear-gradient(135deg, #ffffff, #FFBABA);
}
.btn-archiver-tout {
  background: linear-gradient(1deg, #6eff7f, #31f7c5);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 8px 18px;
  margin: 12px auto 18px auto;
  display: block;
  cursor: pointer;
  box-shadow: 0 2px 8px #0001;
  font-size: 1.1em;
  position: relative;
  overflow: hidden;
  background-size: 200% 200%;
  background-position: 0% 50%;
  transition: transform 0.2s ease, box-shadow 0.3s ease, background-position 0.4s ease;
  font-family: 'Cobe Heavy', Inter, sans-serif;
}
.btn-archiver-tout:hover {
  background: linear-gradient(180deg, #6eff7f, #31f7c5);
  transform: translateY(-2px);
  background-position: 100% 50%;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12), 0 0 18px rgba(46, 204, 113, 0.25);
}
.btn-archiver-tout:active {
  transform: translateY(-1px);
}
.btn-archiver-tout:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(46, 204, 113, 0.35), 0 8px 20px rgba(0, 0, 0, 0.12);
}
.btn-archiver-tout::before {
  content: '';
  position: absolute;
  top: 0;
  left: -150%;
  width: 50%;
  height: 100%;
  background: linear-gradient(115deg, transparent, rgba(255, 255, 255, 0.25), transparent);
  transform: skewX(-20deg);
}
.btn-archiver-tout:hover::before {
  animation: shine 0.8s ease;
}
@keyframes shine {
  0% { left: -150%; }
  100% { left: 200%; }
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
  background: #f3f3f3;
  border-radius: 16px;
  min-height: 320px;
  width: 600px;
  margin: 0 auto;
  box-shadow: 0 2px 8px #0001;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.tri-btns-desktop {
  display: flex;
  gap: 4px;
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
.btn-vider-archive {
  cursor: pointer;
  border: none;
  border-radius: 18px;
  background: #ef4444;
  color: #fff;
  font-size: 1.2em;
  padding: 12px 32px;
  margin: 0 4px;
  box-shadow: 0 2px 8px #0001;
  font-family: 'Cobe Heavy', Inter, sans-serif;
  transition: background 0.2s, color 0.2s;
}
.btn-vider-archive.orange {
  background: #f59e42;
  color: #fff;
}
.btn-vider-archive.orange:hover {
  background: #d97706;
}
.btn-vider-archive.blue {
  background: #3b82f6;
  color: #fff;
}
.btn-vider-archive.blue:hover {
  background: #1d4ed8;
}
.btn-vider-archive.violet {
  background: #a78bfa;
  color: #fff;
}
.btn-vider-archive.violet:hover {
  background: #7c3aed;
}
.btn-vider-archive:hover {
  background: #b91c1c;
  color: #fff;
  box-shadow: 0 0 0 3px #39ff7a, 0 2px 8px #0001;
  border: 2px solid #39ff7a;
}
.archive-btns-row {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  justify-content: center;
  margin-bottom: 16px;
}
.liste-deux-colonnes {
  display: flex;
  flex-direction: row;
  width: 100%;
  gap: 24px;
  justify-content: center;
  align-items: flex-start;
}
.btn-admin-dashboard {
  background: #111;
  color: #fff;
  font-family: 'Cobe Heavy', Inter, sans-serif;
  font-weight: bold;
  border: none;
  border-radius: 18px;
  padding: 10px 24px;
  font-size: 1.1em;
  box-shadow: 0 2px 8px #0002;
  cursor: pointer;
  transition: background 0.2s, color 0.2s, box-shadow 0.2s;
}
.btn-admin-dashboard:hover {
  background: #222;
  color: #fff;
  box-shadow: 0 4px 16px #0003;
}
.btn-ajouter-tache {
  background: linear-gradient(90deg, #39ff7a 0%, #6EFF78 100%);
  color: #111;
  font-family: 'Cobe Heavy', Inter, sans-serif;
  border: none;
  border-radius: 24px;
  padding: 12px 32px;
  font-size: 1.2em;
  margin: 40px 0 18px 0;
  box-shadow: 0 2px 12px #6eff7833;
  cursor: pointer;
  transition: background 0.18s, color 0.18s, box-shadow 0.18s;
  display: flex;
  align-items: center;
}
.btn-ajouter-tache:hover {
  background: linear-gradient(90deg, #6EFF78 0%, #39ff7a 100%);
  color: #000;
  box-shadow: 0 4px 16px #39ff7a55;
}
.popup-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.22);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
  font-family: 'Cobe Heavy', Inter, sans-serif !important;
}
.popup-content-ajout-tache {
  background: #fff;
  border-radius: 22px;
  box-shadow: 0 4px 32px #0002;
  padding: 44px 36px 32px 36px;
  min-width: 340px;
  max-width: 95vw;
  position: relative;
  text-align: center;
  font-family: 'Cobe Heavy', Inter, sans-serif;
  border: 3.5px solid #39ff7a;
  animation: popupIn 0.25s cubic-bezier(.25,.8,.25,1);
}
@keyframes popupIn {
  from { opacity: 0; transform: translateY(-30px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.popup-content-ajout-tache h3 {
  margin-bottom: 22px;
  color: #111;
  font-size: 2em;
  font-family: 'Cobe Heavy', Inter, sans-serif;
  text-align: center;
}
.popup-content-ajout-tache form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: stretch;
}
.popup-content-ajout-tache input[type="date"],
.popup-content-ajout-tache input[type="time"] {
  height: 44px;
  min-height: 44px;
  padding: 10px 14px;
  font-size: 1.1em;
  font-family: 'Cobe Heavy', Inter, sans-serif;
  border: 3.5px solid #39ff7a;
  border-radius: 10px;
  background: #fff;
  width: 100%;
  box-sizing: border-box;
  margin-bottom: 0;
  transition: border 0.18s;
  appearance: none;
}

.popup-content-ajout-tache input[type="date"]:focus,
.popup-content-ajout-tache input[type="time"]:focus {
  border: 1.5px solid #39ff7a;
  outline: none;
}
.popup-content-ajout-tache input,
.popup-content-ajout-tache select,
.popup-content-ajout-tache textarea {
  border: 3.5px solid #39ff7a;
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 1.1em;
  font-family: 'Cobe Heavy', Inter, sans-serif;
  background: #fff;
  margin-bottom: 0;
  transition: border 0.18s;
  color: #000;
}
.popup-content-ajout-tache input:focus,
.popup-content-ajout-tache select:focus,
.popup-content-ajout-tache textarea:focus {
  border: 1.5px solid #39ff7a;
  outline: none;
}
.close-btn-ajout { position: absolute; top: 18px; right: 22px; background: transparent; border: none; width: 40px; height: 40px; padding: 0; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 10; }
.close-img { width: 32px; height: 32px; display:block; filter: grayscale(0.5) brightness(0.95); transition: transform 0.25s, filter 0.25s; }
.close-btn-ajout:hover .close-img { transform: scale(1.18); filter: grayscale(0) brightness(1.1); }
.btn-valider-ajout {
  background: linear-gradient(90deg, #39ff7a 0%, #6EFF78 100%);
  color: #111;
  border: none;
  border-radius: 14px;
  padding: 12px 0;
  font-size: 1.2em;
  margin-top: 18px;
  cursor: pointer;
  font-family: 'Cobe Heavy', Inter, sans-serif;
  box-shadow: 0 2px 8px #6eff7833;
  transition: background 0.2s, color 0.2s, box-shadow 0.2s;
}
.btn-valider-ajout:hover {
  background: linear-gradient(90deg, #6EFF78 0%, #39ff7a 100%);
  color: #000;
  box-shadow: 0 4px 16px #39ff7a55;
}
.groupes-checkboxes {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  margin-bottom: 8px;
}
.groupes-checkboxes label {
  font-weight: normal;
  font-size: 1em;
  color: #222;
  background: #f3f3f3;
  border-radius: 8px;
  padding: 4px 12px;
  cursor: pointer;
  transition: background 0.18s;
}
.groupes-checkboxes input[type="checkbox"] {
  margin-right: 4px;
}
@media (max-width: 1024px) {
  .liste-devoirs-bg {
    max-width: 98vw;
    /* padding-left: 8px; */
    /* padding-right: 8px; */
  }
  .devoir-card-liste, .liste-col-gauche {
    width: 98vw;
    max-width: 98vw;
    min-width: 0;
  }
  .liste-title {
    font-size: 2.3em;
  }
  .liste-content {
    flex-direction: column;
    gap: 12px;
    max-width: 98vw;
  }
  .liste-col-gauche, .liste-col-droite {
    min-width: 0;
    width: 85vw;
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
    width: 85vw;
    max-width: 85vw;
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
  .liste-deux-colonnes {
        flex-direction: column;
        gap: 12px;
        display: flex;
        align-items: center;
  }
.tri-select-mobile-wrapper {
    width: 100%;
    display: flex;
    justify-content: center;
  }
  .tri-select-mobile {
    font-size: 0.98em;
    padding: 6px 8px;
    border-radius: 8px;
    width: 85vw !important;
    max-width: 85vw !important;
    min-width: 0;
    margin: 0 auto 1.2em auto;
    box-shadow: 0 2px 8px #0001;
    font-family: 'Cobe Heavy', Inter, sans-serif;
    background: #fff;
    color: #222;
    border: none;
    display: block;
  }
  .matiere-select {
    font-size: 0.98em;
    padding: 6px 8px;
    border-radius: 8px;
    width: 85vw;
    max-width: 85vw;
    min-width: 0;
    margin: 0 auto 1.2em auto;
    box-shadow: 0 2px 8px #0001;
    font-family: 'Cobe Heavy', Inter, sans-serif;
    background: #fff;
    color: #222;
    border: none;
    display: block;
  }
  .tri-group {
    display: flex;
    flex-direction: column;
    align-items: stretch;
  }
  .liste-col-archives {
    width: 85vw;
    max-width: 85vw;
    margin-left: auto;
    margin-right: auto;
  }
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
  .groupe-img {
    position: absolute;
    left: 5px;
    bottom: -40px;
    width: 38px;
    height: auto;
    margin: 0;
  }
  .groupe-img.promo {
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
  .liste-col-gauche
  .liste-col-droite {
    max-width: 90vw;
    margin-left: auto;
    margin-right: auto;
  }
  .liste-title {
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
  .matiere-select {
    font-size: 0.98em;
    padding: 6px 8px;
    border-radius: 8px;
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
  /* Colonne centrée pour les boutons 'Vider les devoirs' et 'Vider les examens' */
  .archive-btns-row > div:nth-child(2) {
    flex-direction: column !important;
    align-items: center !important;
    gap: 10px !important;
    display: flex !important;
  }
  /* Font-size 1em pour les boutons 'Vider examens de la matière' et 'Vider devoirs de la matière' */
  .archive-btns-row > div:last-child .btn-vider-archive.blue,
  .archive-btns-row > div:last-child .btn-vider-archive.orange {
    font-size: 1.2em !important;
  }
  @media (max-width: 1024px) and (min-width: 320px) {
    .btn-check-liste-mobile {
      margin-right: 40px;
      display: inline-block !important;
    }
  }
}
@media (min-width: 1025px) and (max-width: 1440px) {
  .liste-devoirs-bg {
    width: 95%;
    margin: 0 auto;
    margin-top: 5%;
    margin-bottom: 5%;
    border-radius: 3rem 3rem 3rem 3rem;
    background: rgb(47, 53, 61);
    padding-bottom: 80px;
    max-width: 1300px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .liste-title {
    width: 100%;
    border-radius: 2rem 2rem 0rem 0rem;
    text-align: center;
    font-size: 4.5em;
    padding: 20px 0px 10px 0px;
    color: #fff;
    background: linear-gradient(90deg, rgba(110,255,121,255) 50%, rgba(110,255,226,255) 100%);
    text-shadow: 2px 2px 0 #b0b0b0;
    font-style: italic;
    font-family: 'Cobe Heavy', Inter, sans-serif;
  }
  .liste-tri {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 24px;
    margin-top: 24px;
    /* padding: 0 2rem; */
    box-sizing: border-box;
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
    font-size: 1.3em;
    color: #fff;
    text-shadow: 2px 2px 0 #b0b0b0;
    text-align: left;
    margin-left: 0;
    margin-bottom: 0;
    margin-right: 8px;
  }
  .btn-tri {
    cursor: pointer;
    border: none;
    background: #f0f0f0;
    color: #b0b0b0;
    margin: 0 4px;
    box-shadow: 0 2px 8px #0001;
    font-family: 'Cobe Heavy', Inter, sans-serif;
    transition: background 0.2s, color 0.2s;
    font-size: 1.2em;
    padding: calc(5px + 7 * (100vw - 1025px) / 415) calc(12px + 20 * (100vw - 1025px) / 415);
    border-radius: calc(12px + 6 * (100vw - 1025px) / 415);
  }
  .btn-tri.active {
    background: linear-gradient(135deg, #6db4ff 0%, #a6e0ff 100%);
    color: #fff;
    text-shadow: 1px 2px 6px #0002;
  }
  .liste-content {
    gap: 24px;
    display: flex;
    box-sizing: border-box;
    width: 100%;
    padding: 0 2rem;
    max-width: 100% !important;
  }
  .liste-col-gauche {
    flex: 1 1 30%;
    background: #f3f3f3;
  }
  .liste-col-droite {
    flex: 1 1 45%;
  }
  .liste-col-gauche, .liste-col-droite {
    width: auto;
    box-sizing: border-box;
    margin: 0;
    /* border-radius: 16px; */
    /* box-shadow: 0 2px 8px #0001; */
    /* padding: 1.5rem; */
  }
  .devoir-card-liste {
    width: 100%;
    max-width: 650px;
    min-width: 0;
    box-sizing: border-box;
    margin-left: auto;
    margin-right: auto;
    border-radius: 16px;
    padding: 24px 32px;
    font-size: 1em;
  }
  .liste-col-gauche .devoir-card-liste {
    padding: 16px 24px;
  }
  .liste-col-gauche .devoir-card-liste:not(:last-of-type) {
    margin-bottom: 18px;
  }
  .matiere-select, .tri-select-mobile {
    width: calc(160px + 96 * (100vw - 1025px) / 415);
    max-width: 16rem;
    font-size: calc(1em + 0.1 * (100vw - 1025px) / 415);
    margin-bottom: calc(1em + 0.2 * (100vw - 1025px) / 415);
    padding: calc(8px + 2 * (100vw - 1025px) / 415) calc(10px + 14 * (100vw - 1025px) / 415);
  }
}

@media (min-width: 320px) and (max-width: 1024px) {
  .liste-title {
    font-size: calc(2.2em + (64 - 2.8) * ((100vw - 320px) / 704)) !important;
  }
  .btn-supprimer-liste {
    width: 28px !important;
    height: 28px !important;
    min-width: 28px;
    min-height: 28px;
    max-width: 28px;
    max-height: 28px;
  }
}

.liste-content {
  width: 100%;
  max-width: 900px;
  display: flex;
  margin-top: 24px;
  gap: 24px;
}

@media (max-width: 768px) {
  .popup-content {
    min-width: 0;
    max-width: 95vw;
    width: 95vw;
    padding: 18px 8px;
    min-height: 120px;
    max-height: 80vh;
    font-size: 1em;
    border-radius: 12px;
  }
  .popup-content h3 {
    font-size: 1.1em;
  }
}
.btn-fermer-popup {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #111;
  color: #fff !important;
  border: none;
  border-radius: 24px;
  padding: 10px 28px;
  margin-top: 24px;
  font-size: 1.1em;
  box-shadow: 0 2px 8px #0002;
  cursor: pointer;
  transition: background 0.2s, color 0.2s, box-shadow 0.2s;
  font-family: 'Cobe Heavy', Inter, sans-serif;
}
.btn-fermer-popup, .btn-fermer-popup * {
  color: #fff !important;
  fill: #fff !important;
}
.btn-fermer-popup:hover {
  background: #222;
  color: #fff !important;
  box-shadow: 0 4px 16px #0003;
}

.popup-content-success {
  background: #fff;
  border-radius: 22px;
  box-shadow: 0 4px 32px #0002;
  padding: 44px 36px 32px 36px;
  min-width: 320px;
  max-width: 95vw;
  position: relative;
  text-align: center;
  font-family: 'Cobe Heavy', Inter, sans-serif;
  border: 3.5px solid #39ff7a;
  animation: popupIn 0.25s cubic-bezier(.25,.8,.25,1);
}
.popup-content-success h3 {
  margin-bottom: 22px;
  color: #111;
  font-size: 1.5em;
  font-family: 'Cobe Heavy', Inter, sans-serif;
  text-align: center;
}
.btn-ok-success {
  background: linear-gradient(90deg, #39ff7a 0%, #6EFF78 100%);
  color: #111;
  border: none;
  border-radius: 14px;
  padding: 12px 0;
  font-size: 1.1em;
  margin-top: 18px;
  cursor: pointer;
  font-family: 'Cobe Heavy', Inter, sans-serif;
  box-shadow: 0 2px 8px #6eff7833;
  width: 120px;
  transition: background 0.2s, color 0.2s, box-shadow 0.2s;
  display: block;
  margin-left: auto;
  margin-right: auto;
}
.btn-ok-success:hover {
  background: linear-gradient(90deg, #6EFF78 0%, #39ff7a 100%);
  color: #000;
  box-shadow: 0 4px 16px #39ff7a55;
}

@media (min-width: 320px) and (max-width: 1024px) {
  .popup-content-ajout-tache {
    min-width: 0;
    max-width: 95vw;
    width: 95vw;
    padding: 18px 8px;
    min-height: 120px;
    height: auto;
    max-height: none;
    overflow-y: auto;
    font-size: 1em;
    border-radius: 16px;
    box-sizing: border-box;
  }
  .close-btn-ajout {
    top: 10px;
    right: 12px;
    font-size: 1.5em;
  }
  .popup-content-ajout-tache h3 {
    font-size: 1.5em;
  }
}

.notif-icon {
  position: absolute;
  top: 10px;
  right: 16px;
  width: 32px;
  height: 32px;
  z-index: 10;
  background: none;
  pointer-events: none;
}
.devoir-card-liste {
  position: relative;
}

/* Pour l'icône dans les boutons de tri */
.tri-btns-desktop .btn-tri {
  position: relative;
  overflow: visible;
}

.tri-btns-desktop .notif-icon {
  position: absolute !important;
  top: 6px;
  right: 12px;
  width: 18px;
  height: 18px;
  margin: 0;
  vertical-align: middle;
  z-index: 2;
  pointer-events: none;
}

/* Pour l'icône dans les cartes de devoirs uniquement */
.devoir-card-liste .notif-icon {
  position: absolute;
  top: 10px;
  right: 16px;
  width: 32px;
  height: 32px;
  z-index: 10;
  background: none;
  pointer-events: none;
}
/* Style par défaut pour éviter les conflits */
.notif-icon {
  width: 18px;
  height: 18px;
  margin-left: 6px;
  vertical-align: middle;
}

.btn-supprimer-liste {
  width: 32px;
  height: 32px;
  cursor: pointer;
  margin-left: 8px;
  transition: transform 0.25s, filter 0.25s;
  filter: grayscale(0.5) brightness(0.95);
}
.btn-supprimer-liste:hover {
  transform: scale(1.18);
  filter: grayscale(0) brightness(1.1) drop-shadow(0 0 6px #ff4d4d88);
}

.btn-cancel-delete {
  background: linear-gradient(90deg, #eaffea 0%, #d6ffd6 100%);
  color: #222;
  border: none;
  border-radius: 18px;
  padding: 12px 32px;
  font-weight: bold;
  font-size: 1.1em;
  cursor: pointer;
  box-shadow: 0 2px 8px #baffba55;
  transition: background 0.18s, color 0.18s, box-shadow 0.18s, transform 0.12s;
  font-family: 'Cobe Heavy', Inter, sans-serif;
  outline: none;
  min-width: 140px;
}

.btn-cancel-delete:hover, .btn-cancel-delete:focus {
  background: linear-gradient(90deg, #d6ffd6 0%, #baffba 100%);
  color: #111;
  box-shadow: 0 4px 16px #baffba88;
  transform: scale(1.08);
}

.btn-confirm-delete {
  background: linear-gradient(90deg, #ff4d4d 0%, #ff6b6b 100%);
  color: #fff;
  border: none;
  border-radius: 18px;
  padding: 12px 32px;
  font-weight: bold;
  font-size: 1.1em;
  cursor: pointer;
  box-shadow: 0 2px 8px #ff4d4d55;
  transition: background 0.18s, color 0.18s, box-shadow 0.18s, transform 0.12s;
  font-family: 'Cobe Heavy', Inter, sans-serif;
  outline: none;
  min-width: 140px;
}

.btn-confirm-delete:hover, .btn-confirm-delete:focus {
  background: linear-gradient(90deg, #ff6b6b 0%, #ff4d4d 100%);
  color: #fff;
  box-shadow: 0 4px 16px #ff4d4d88;
  transform: scale(1.08);
}

.popup-delete-confirm {
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
  font-family: 'Cobe Heavy', Inter, sans-serif;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  animation: popupIn 0.25s cubic-bezier(.25,.8,.25,1);
}

.popup-delete-confirm h3 {
  margin-top: 0;
  font-size: 2.1em;
}

.popup-delete-confirm p {
  margin-bottom: 18px;
}

.popup-delete-confirm button {
  background: linear-gradient(90deg, #39ff7a 0%, #6EFF78 100%);
  color: #fff;
  border: none;
  border-radius: 14px;
  padding: 12px 0;
  font-size: 1.2em;
  font-weight: bold;
  margin-top: 18px;
  cursor: pointer;
  font-family: 'Cobe Heavy', Inter, sans-serif;
  box-shadow: 0 2px 8px #6eff7833;
  transition: background 0.2s, color 0.2s, box-shadow 0.2s;
}

.popup-delete-confirm button:hover {
  background: linear-gradient(90deg, #6EFF78 0%, #39ff7a 100%);
  color: #000;
  box-shadow: 0 4px 16px #39ff7a55;
}

@media (min-width: 320px) and (max-width: 475px) {
  .popup-delete-confirm h3 {
    margin-top: 0;
    font-size: 1.4em;
  }
  .popup-delete-confirm {
    background: #fff;
    border-radius: 18px;
    padding: 40px 36px;
    min-width: 300px;
    max-width: 6px;
    min-height: 220px;
    max-height: 80vh;
    box-shadow: 0 2px 24px #0003;
    text-align: left;
    color: #111;
    overflow-y: auto;
    font-family: 'Cobe Heavy', Inter, sans-serif;
    animation: popupIn-c4fab725 0.25s cubic-bezier(.25,.8,.25,1);
  }
}

.btn-check-liste-mobile {
  display: none;
}
@media (max-width: 1440px) and (min-width: 320px) {
  .btn-check-liste-mobile {
    display: inline-block !important;
  }
}
@media (min-width: 1441px), (max-width: 319px) {
  .btn-check-liste-mobile {
    display: none !important;
  }
}
.btn-supprimer-liste-mobile {
  position: absolute;
  right: 48px;
  bottom: -40px;
  width: 28px;
  height: 28px;
  display: inline-block !important;
  margin: 0;
}
@media (min-width: 1025px), (max-width: 319px) {
  .btn-supprimer-liste-mobile {
    display: none !important;
  }
}
@media (max-width: 1024px) and (min-width: 320px) {
  /* On cible le bouton supprimer qui N'A PAS la classe .btn-supprimer-liste-mobile */
  .btn-supprimer-liste:not(.btn-supprimer-liste-mobile) {
    display: none !important;
  }
  /* On affiche bien le bouton du bas */
  .btn-supprimer-liste-mobile {
    display: inline-block !important;
  }
}
@media (min-width: 1025px) {
  .btn-supprimer-liste {
    display: inline-block !important;
  }
}

/* Ajout du style pour labels flottants date/heure */
.input-floating {
  position: relative;
  width: 100%;
  margin-bottom: 0;
}
.input-floating input[type="date"],
.input-floating input[type="time"],
.input-floating select {
  width: 100%;
  padding: 18px 14px 10px 14px;
  font-size: 1.1em;
  font-family: 'Cobe Heavy', Inter, sans-serif;
  border: 3.5px solid #39ff7a;
  border-radius: 10px;
  background: #fff;
  box-sizing: border-box;
  margin-bottom: 0;
  transition: border 0.18s;
  min-height: 44px;
  appearance: none;
}
.input-floating label {
  position: absolute;
  left: 14px;
  top: 12px;
  color: #000;
  font-size: 1em;
  font-family: 'Cobe Heavy', Inter, sans-serif;
  pointer-events: none;
  background: transparent;
  transition: 0.18s cubic-bezier(.4,0,.2,1);
  z-index: 2;
}
.input-floating input:focus + label,
.input-floating input:not(:placeholder-shown):not([value=""]) + label,
.input-floating select:focus + label,
.input-floating select:not([value=""]) + label {
  top: -10px;
  left: 10px;
  font-size: 0.85em;
  color: #000;
  background: #fff;
  padding: 0 4px;
}

/* Correction spécifique pour les selects - le label doit toujours être en haut */
.input-floating select + label {
  top: -10px;
  left: 10px;
  font-size: 0.85em;
  color: #000;
  background: #fff;
  padding: 0 4px;
}

/* Style pour les options des selects */
.popup-content-ajout-tache select option {
  color: #000;
  font-family: 'Cobe Heavy', Inter, sans-serif;
}

/* Responsive design pour mobile et tablette */
@media (min-width: 320px) and (max-width: 1024px) {
  .popup-content-ajout-tache {
    width: 90% !important;
    max-width: 600px !important;
    margin: 20px auto !important;
    padding: 25px 20px 20px 20px !important;
    max-height: 85vh !important;
    overflow-y: auto !important;
    top: 50% !important;
    transform: translateY(-50%) !important;
  }
  
  .popup-content-ajout-tache h3 {
    font-size: 1.4em !important;
    margin-bottom: 15px !important;
    margin-top: 0 !important;
    padding-top: 0 !important;
  }
  
  .popup-content-ajout-tache input,
  .popup-content-ajout-tache select,
  .popup-content-ajout-tache textarea {
    font-size: 1em !important;
    padding: 12px 10px 8px 10px !important;
  }
  
  .input-floating input[type="date"],
  .input-floating input[type="time"],
  .input-floating select {
    padding: 12px 10px 8px 10px !important;
    font-size: 1em !important;
    min-height: 40px !important;
    background-image: none !important;
  }
  

  
  .input-floating label {
    font-size: 0.9em !important;
    left: 10px !important;
    top: 10px !important;
  }
  
  .input-floating input:focus + label,
  .input-floating input:not(:placeholder-shown):not([value=""]) + label,
  .input-floating select:focus + label,
  .input-floating select:not([value=""]) + label,
  .input-floating select + label {
    top: -8px !important;
    left: 8px !important;
    font-size: 0.8em !important;
  }
  
  .groupes-checkboxes {
    /* flex-direction: column !important; */
    gap: 8px !important;
  }
  
  .groupes-checkboxes label {
    font-size: 0.9em !important;
  }
  
  .btn-valider-ajout {
    font-size: 1.1em !important;
    padding: 12px 20px !important;
    margin-top: 15px !important;
    margin-bottom: 10px !important;
  }
  
  .close-btn-ajout {
    top: 10px !important;
    right: 10px !important;
    width: 35px !important;
    height: 35px !important;
    font-size: 1.4em !important;
  }
  

}



/* Styles spécifiques pour très petits écrans */
@media (min-width: 280px) and (max-width: 280px) {
  .popup-content-ajout-tache {
    width: 98% !important;
    max-width: 98% !important;
    margin: 5px !important;
    padding: 15px 10px !important;
  }
  
  .popup-content-ajout-tache h3 {
    font-size: 1.2em !important;
    margin-bottom: 12px !important;
  }
  
  .popup-content-ajout-tache input,
  .popup-content-ajout-tache select,
  .popup-content-ajout-tache textarea {
    font-size: 0.9em !important;
    padding: 10px 8px 6px 8px !important;
  }
  
  .input-floating input[type="date"],
  .input-floating input[type="time"],
  .input-floating select {
    padding: 10px 8px 6px 8px !important;
    font-size: 0.9em !important;
    min-height: 36px !important;
  }
  
  .input-floating label {
    font-size: 0.8em !important;
    left: 8px !important;
    top: 8px !important;
  }
  
  .input-floating input:focus + label,
  .input-floating input:not(:placeholder-shown):not([value=""]) + label,
  .input-floating select:focus + label,
  .input-floating select:not([value=""]) + label,
  .input-floating select + label {
    top: -6px !important;
    left: 6px !important;
    font-size: 0.7em !important;
  }
  
  .btn-valider-ajout {
    font-size: 1em !important;
    padding: 10px 16px !important;
    margin-top: 12px !important;
  }
  
  .close-btn-ajout {
    top: 8px !important;
    right: 8px !important;
    width: 28px !important;
    height: 28px !important;
    font-size: 1.1em !important;
  }
}
</style>