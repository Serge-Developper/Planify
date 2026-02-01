<template>
  <div class="liste-devoirs-bg">
    <h2 class="liste-title">Liste des devoirs</h2>
    <div class="btns-actions" style="display:flex; gap:10px; align-items:center; justify-content:center;">
      <button v-if="user" class="btn-ajouter-tache" @click="showAddTaskPopup = true">
        <span style="font-size:1.3em;margin-right:6px;">＋</span> {{ (user.role === 'delegue' || user.role === 'prof') ? 'Ajouter une tâche' : 'Proposer une tâche' }}
      </button>
      <button v-if="user && (user.role === 'delegue' || user.role === 'prof' || user.role === 'eleve' || user.role === 'etudiant')" class="btn-ajouter-tache btn-voir-taches" @click="openMyTasks">
        👁️ Voir les tâches
      </button>
      <button v-if="user && (user.role === 'delegue' || user.role === 'prof' || user.role === 'admin')" class="btn-ajouter-tache btn-voir-taches" @click="openProposals">
        📥 Propositions
        <span v-if="proposalsCountBadge > 0" class="deposit-badge">{{ proposalsCountBadge }}</span>
      </button>
      <button v-if="user && (user.role === 'eleve' || user.role === 'etudiant')" class="btn-ajouter-tache btn-voir-taches" @click="openProposals">
        📥 Propositions
        <span v-if="proposalsCountBadge > 0" class="deposit-badge">{{ proposalsCountBadge }}</span>
      </button>
      <!-- Vider les retards: visible en onglet Retard. A droite pour les délégués, centré pour les élèves -->
      <button
        v-if="user && user.role === 'delegue' && sortBy === 'enretard'"
        class="btn-ajouter-tache btn-vider-retards"
        @click="viderRetards"
      >
        <img :src="canIcon" alt="Vider" style="width:18px;height:18px;margin-right:8px;" /> Vider les retards
      </button>
      <button
        v-if="user && (user.role === 'eleve' || user.role === 'etudiant') && sortBy === 'enretard'"
        class="btn-ajouter-tache btn-vider-retards"
        @click="viderRetards"
      >
        <img :src="canIcon" alt="Vider" style="width:18px;height:18px;margin-right:8px;" /> Vider les retards
      </button>
    </div>
    <div v-if="showAddTaskPopup" class="popup-overlay" @click.self="showAddTaskPopup = false" @wheel="onOverlayWheelAdd">
      <div class="popup-content-ajout-tache" ref="popupContentAddRef">
        <button class="close-btn-ajout" @click="() => { hoverCloseAdd = false; showAddTaskPopup = false }" @mouseover="hoverCloseAdd = true" @mouseleave="hoverCloseAdd = false">
          <img :src="hoverCloseAdd ? closeHoverImg : closeImg" alt="Fermer" class="close-img" />
        </button>
        <h3>Ajouter une tâche</h3>
        <form @submit.prevent="submitAddTask">
          <input v-model="newTask.titre" placeholder="Titre" required class="title-input" />
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
          <div class="input-floating" v-if="showSpecSelect">
            <select v-model="newTask.specialite" id="spec-input">
              <option value="">Aucune spécialité</option>
              <option value="creation">Création numérique</option>
              <option value="dev">Développement Web</option>
              <option value="strategie">Stratégie de communication</option>
            </select>
            <label for="spec-input">Spécialité</label>
          </div>
          <div class="input-floating">
            <div ref="addEditorRef" class="rich-editable" contenteditable="true" placeholder="Description riche (gras, couleur, images…)" @click="onAddEditorClick" @input="onAddEditorInput"></div>
            <label v-show="showAddDescLabel">Description</label>
          </div>

          <!-- Mini-toolbar (Add): Emoji, Image URL, Importer fichier -->
          <div class="mini-toolbar">
            <div class="toolbar-group">
              <button type="button" class="btn-mini rich-btn" @click="toggleEmoji('add')">Emoji</button>
              <button type="button" class="btn-mini rich-btn" @click="insertImageUrl('add')">Image URL</button>
              <input ref="addFileRef" type="file" accept="image/png,image/jpeg,image/svg+xml" @change="onImageFile('add', $event)" style="display:none;" />
              <button type="button" class="btn-mini rich-btn" @click="() => addFileRef && addFileRef.click()">Importer</button>
              <!-- Ajout: pièces jointes PDF/DOCX -->
              <input ref="addDocRef" type="file"
                     accept=".pdf,application/pdf,.doc,application/msword,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.zip,application/zip,.rar,application/x-rar-compressed"
                     @change="onDocFileChange($event)" style="display:none;" multiple />
              <button type="button" class="btn-mini rich-btn" @click="() => addDocRef && addDocRef.click()">PDF/DOC/DOCX/ZIP/RAR</button>
            </div>
          </div>

          <!-- Aperçu des PDF/DOCX sélectionnés (avant envoi) -->
          <div v-if="addDocFiles.length" style="margin-top:8px;">
            <p style="margin:0 0 4px; color:#111; font-weight:600;">Fichiers sélectionnés :</p>
            <ul class="selected-docs-list">
              <li v-for="(f, idx) in addDocFiles" :key="f.name + '_' + f.size" class="selected-doc-item">
                <span class="selected-doc-name">{{ f.name }}</span>
                <span class="selected-doc-size">{{ formatBytesCommon(f.size) }}</span>
                <button type="button" class="selected-doc-remove" @click="removeAddDocFile(idx)" aria-label="Retirer">×</button>
              </li>
            </ul>
          </div>

          <teleport to="body">
            <div v-if="showImageLinkPopoverAdd" :style="popoverStyleAdd" class="image-link-popover" ref="imageLinkPopoverAddRef">
              <input v-model="imageLinkAdd" type="text" placeholder="Lien (https://...)" class="matiere-select" style="width:100%; border: 3.5px solid #22c55e !important;" />
              <div class="toolbar-group" style="margin-top:8px;">
                <button type="button" class="btn-mini" @click="setImageLink('add')">Appliquer le lien</button>
                <button type="button" class="btn-mini danger" @click="removeImageLink('add')">Supprimer le lien</button>
                <button type="button" class="btn-mini" @click="closeImagePopover('add')">Fermer</button>
              </div>
            </div>
          </teleport>
          <div v-if="showSelectionToolbarAdd" :style="selectionToolbarStyleAdd" class="selection-toolbar" ref="selectionToolbarAddRef">
            <div class="toolbar-group">
              <button type="button" class="btn-mini" @mousedown.prevent @click="applyCmd('bold')"><b>Gras</b></button>
              <button type="button" class="btn-mini" @mousedown.prevent @click="applyCmd('italic')"><i>Italique</i></button>
              <button type="button" class="btn-mini" @mousedown.prevent @click="applyCmd('underline')"><u>Souligner</u></button>
              <!-- Swatch couleur: carré rempli (mobile et desktop) -->
              <div class="color-picker">
                <input type="color" class="color-swatch" v-model="fontColorAdd" @input="applyFontColor('add')" />
                <span class="color-swatch-display" :style="{ backgroundColor: fontColorAdd }"></span>
              </div>
            </div>
            <select v-model="selectionFontSizeAdd" @change="applySelectionFontSize('add')" class="matiere-select">
              <option value="14">14</option>
              <option value="16">16</option>
              <option value="18">18</option>
              <option value="20">20</option>
              <option value="22">22</option>
              <option value="24">24</option>
              <option value="26">26</option>
              <option value="28">28</option>
              <option value="30">30</option>
              <option value="32">32</option>
              <option value="34">34</option>
              <option value="36">36</option>
              <option value="38">38</option>
              <option value="40">40</option>
              <option value="42">42</option>
              <option value="44">44</option>
              <option value="46">46</option>
              <option value="48">48</option>
              <option value="50">50</option>
              <option value="52">52</option>
              <option value="54">54</option>
            </select>
            <!-- Nouveau: choix de police dans le menu flottant (Add) -->
            <select v-model="selectionFontFamilyAdd" @change="applySelectionFontFamily('add')" class="matiere-select">
              <option v-for="f in availableFonts" :key="f.value" :value="f.value">{{ f.label }}</option>
            </select>
          </div>
          <div v-if="showEmojiAdd" class="emoji-picker">
            <button v-for="e in emojis" :key="'add_'+e" type="button" class="emoji-btn" @click="insertEmoji('add', e)">{{ e }}</button>
          </div>
          <div v-if="selectedImageAdd" class="image-resize-panel">
            <span style="margin-right:6px; color:#374151;">Largeur image:</span>
            <input type="range" min="80" max="592" step="10" v-model.number="imageWidthAdd" @input="applyImageWidthIn('add')" />
            <input type="number" min="50" max="592" step="10" v-model.number="imageWidthAdd" @change="applyImageWidthIn('add')" class="matiere-select" style="width:110px; margin-left:8px; padding:6px 8px;" />
            <button type="button" class="btn-mini" style="margin-left:8px;" @click="fitImageToEditorIn('add')">Remplir la largeur</button>
          </div>
          <!-- Groupes ciblés (à améliorer selon l'année du délégué) -->
          <label style="margin-top:8px;color:#111;">Groupes concernés :</label>
          <div class="groupes-checkboxes">
            <label
              v-for="groupe in groupesDisponibles"
              :key="groupe"
              :class="{ disabled: promoSelectedAdd && groupe !== 'Promo' }"
            >
              <input
                type="checkbox"
                v-model="newTask.groupes"
                :value="groupe"
                :disabled="promoSelectedAdd && groupe !== 'Promo'"
                @change="onChangeAddGroup(groupe, $event)"
              />
              {{ groupe }}
            </label>
          </div>
          <div v-if="user && (user.role === 'prof' || user.role === 'admin')" class="submission-toggle" style="margin-top:10px;">
            <label class="submission-label" style="display:flex; align-items:center; gap:8px; color:#111;">
              <input type="checkbox" v-model="newTask.submissionEnabled" />
              Activer la boîte de dépôt (fichiers des étudiants)
            </label>
            <small class="submission-help" style="color:#6b7280;">Les étudiants pourront déposer des fichiers; le retard sera calculé.</small>
          </div>
          <!-- Ajout: activation groupes de travail -->
          <div v-if="user && (user.role === 'prof' || user.role === 'admin')" class="submission-toggle" style="margin-top:6px;">
            <label class="submission-label" style="display:flex; align-items:center; gap:8px; color:#111;">
              <input type="checkbox" v-model="newTask.groupWorkEnabled" />
              Activer les groupes (travail en équipe)
            </label>
            <small class="submission-help" style="color:#6b7280;">Permet de créer des groupes et y affecter des étudiants.</small>
          </div>

          <!-- Nouveau: éditeur de groupes sur création de tâche -->
          <div v-if="newTask.groupWorkEnabled" style="margin-top:8px;">
            <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
              <label style="color:#111;">Nombre de groupes :</label>
              <input type="number" min="1" max="20" v-model.number="draftGroupCountAdd" class="matiere-select" style="width:120px;" />
              <button type="button" class="btn-vider-archive blue" @click="generateDraftGroups('add')">Créer</button>
            </div>

            <div v-if="Array.isArray(newTask.workGroupsDraft) && newTask.workGroupsDraft.length" style="margin-top:8px;">
              <div v-for="(g, i) in newTask.workGroupsDraft" :key="'add-draft-'+i" style="display:flex; gap:8px; margin-top:6px; flex-wrap:wrap;">
                <input v-model="g.name" placeholder="Nom du groupe" class="matiere-select" style="flex:1; min-width:180px;" />
                <input type="number" min="1" max="99" v-model.number="g.capacity" placeholder="Places" class="matiere-select" style="width:120px;" />
              </div>
              <small style="color:#6b7280;">Les groupes seront créés à la validation de la tâche.</small>
            </div>
          </div>
          <button type="submit" class="btn-valider-ajout" :disabled="loadingAdd">
            {{ loadingAdd ? 'Ajout...' : 'Valider' }}
          </button>
        </form>
      </div>
    </div>
    <div v-if="showProposalsPopup" class="popup-overlay" @click.self="showProposalsPopup = false">
      <div :class="['popup-content-ajout-tache', !showBlockedPanel ? 'popup-proposals' : '']">
        <button class="close-btn-ajout" @click="() => { hoverCloseAdd = false; showProposalsPopup = false }" @mouseover="hoverCloseAdd = true" @mouseleave="hoverCloseAdd = false">
          <img :src="hoverCloseAdd ? closeHoverImg : closeImg" alt="Fermer" class="close-img" />
        </button>
        <transition name="fade"><h3 class="popup-title">{{ proposalsHeaderTitle }}</h3></transition>
        <div :class="['popup-proposals-tabs', showBlockedPanel ? 'blocked-active' : '']" style="display:flex; justify-content: center; gap:8px; margin:8px 0 12px;">
          <button v-if="user && (user.role === 'delegue' || user.role === 'prof' || user.role === 'admin' || user.role === 'eleve' || user.role === 'etudiant')" class="btn-vider-archive btn-pill-common orange" :class="{ 'active-tab': showBlockedPanel }" @click="openBlockedTab" aria-pressed="true">Personnes bloquées</button>
          <button class="btn-vider-archive btn-pill-common blue" :class="{ 'active-tab': !showBlockedPanel }" @click="openProposalsTab" aria-pressed="false">Propositions</button>
        </div>
        <div v-if="showBlockedPanel" class="blocked-panel">
          <div class="devoir-titre-row" style="align-items:center;">
            <div class="devoir-titre" style="flex:1">Personnes bloquées</div>
          </div>
          <div v-if="blockedLoading" class="aucune-tache">Chargement...</div>
          <div v-else>
            <div v-if="blockedUsers.length === 0" class="aucune-tache">Aucune personne bloquée</div>
            <div v-for="u in blockedUsers" :key="u._id" class="blocked-user-card">
              <div class="devoir-titre-row" style="align-items:center;">
                <div class="devoir-titre" style="flex:1">{{ u.username }}</div>
                <div class="devoir-actions" style="display:flex; gap:8px; flex-wrap:wrap; flex-direction: row;">
                  <button class="btn-vider-archive btn-pill-common orange" @click="toggleBlockUser(u)">{{ (u.proposalBlocked || u.isMuted) ? 'Débloquer' : 'Bloquer' }}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-if="!showBlockedPanel && proposalsLoading" class="aucune-tache">Chargement...</div>
        <div v-else-if="!showBlockedPanel" class="liste-taches-attente">
          <div v-if="proposalsList.length === 0" class="aucune-tache">Aucune proposition</div>
          <div v-for="p in proposalsList" :key="p._id" class="devoir-card-liste">
            <div class="devoir-titre-row" style="align-items: center;">
              <div class="devoir-titre" style="flex:1">
                <div class="matiere-label-liste" :style="{ background: stringToColor(p.matiere, p.type) }">{{ p.matiere }}</div>
                <div class="devoir-card-title" :title="p.titre">{{ p.titre }}</div>
                <div class="devoir-type">
                  <span v-if="p.type === 'exam'">📝 Examen</span>
                  <span v-else>📚 Devoir</span>
                </div>
                <small v-if="displayProposalProposerName(p)" class="proposer-name">Par {{ displayProposalProposerName(p) }}</small>
              </div>
              <div class="devoir-actions" style="display:flex; gap:8px; flex-wrap:wrap;">
                <button class="btn-vider-archive btn-pill-common orange" @click="blockProposer(p)">{{ p.proposedByBlocked ? 'Débloquer' : 'Bloquer' }}</button>
                <button class="btn-vider-archive btn-pill-common blue" @click="openProposalInfo(p._id)">Voir les détails</button>
                <button v-if="user && user.role === 'admin'" class="btn-vider-archive btn-pill-common orange" @click="openEditProposal(p)">Modifier</button>
                <button v-if="user && user.role === 'admin'" class="btn-vider-archive btn-pill-common danger" @click="deleteProposal(p)">Supprimer</button>
                <button class="btn-vider-archive btn-pill-common danger" @click="rejectProposal(p)">Refuser</button>
                <button class="btn-vider-archive btn-pill-common green" @click="validateProposal(p)">Valider</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <transition name="fade">
      <div v-if="showConfirmNoSubmission" class="confirm-overlay" @click.self="cancelConfirmNoSubmission" role="dialog" aria-modal="true" aria-labelledby="confirmNoSubmissionTitle">
        <div class="popup-content-confirm">
          <h3 id="confirmNoSubmissionTitle" class="popup-title">Voulez-vous vraiment valider cette tâche ?</h3>
          <p class="confirm-msg">Vous n'avez pas déposé de fichier.</p>
          <div class="confirm-actions">
            <button class="secondary-btn" @click="cancelConfirmNoSubmission">Annuler</button>
            <button class="primary-btn" @click="confirmNoSubmission" autofocus>Confirmer</button>
          </div>
        </div>
      </div>
    </transition>
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
          <button class="btn-tri" :class="{ active: sortBy === 'depot' }" @click="setSort('depot')">
    Dépôt
    <span v-if="depositTotalCount > 0" class="deposit-badge">{{ depositTotalCount }}</span>
  </button>
        </div>
        <div class="tri-select-mobile-wrapper">
          <select class="tri-select-mobile" v-model="sortBy">
            <option value="date">Date</option>
            <option value="passe">Archives</option>
            <option value="exam">Examens</option>
            <option value="devoir">Devoirs</option>
            <option value="depot">Dépôt</option>
            <option v-if="!user || user.role !== 'prof'" value="enretard">Retard</option>
          </select>
        </div>
      </div>
      <div class="tri-group">
        <span class="tri-label">Matière :</span>
        <select v-model="selectedMatiere" class="matiere-select" style="min-width: 12rem;">
          <option value="">Toutes</option>
          <option v-for="matiere in mmiMatieres" :key="matiere" :value="matiere">{{ matiere }}</option>
        </select>
      </div>
    </div>
          <!-- Filtres prof uniquement -->
      <div class="tri-group" v-if="user && user.role === 'prof'">
        <span class="tri-label">Filtres prof :</span>
        <div class="mytasks-top-filters" style="display:flex; gap:8px; align-items:center;">
          <select v-model="profFilterYear" class="matiere-select" style="width: 12rem;">
            <option value="">Année (toutes)</option>
            <option v-for="y in profYears" :key="y" :value="y">{{ y }}</option>
          </select>
          <select v-model="profFilterSpec" class="matiere-select" style="width: 18rem;">
            <option value="">Spécialité (toutes)</option>
            <option v-for="s in profSpecs" :key="s" :value="s">{{ specLabel(s) }}</option>
          </select>
          <select v-model="profFilterGroup" class="matiere-select" style="width: 12rem;">
            <option value="">Groupe (tous)</option>
            <option v-for="g in profGroups" :key="g" :value="g">{{ g }}</option>
          </select>
        </div>
      </div>
    <div class="liste-content" :class="{ 'archives-mode': sortBy === 'passe' }">
        <div v-if="(toDoEvents.length + doneEvents.length) === 0 && sortBy !== 'passe'" class="aucune-matiere">Aucune matière trouvée</div>
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
                      v-if="event.type !== 'exam'"
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
                <small v-if="event.isProposal && displayProposerName(event)" class="proposer-name">Proposé par {{ displayProposerName(event) }}</small>
                <small style="color:#6366f1;">
                  ⏰ {{ timeLeft(event.date, event.heure) }}
                </small>
                <button class="btn-plus-infos" @click="openPopup(event)">Plus d'infos</button>
                <!-- Bouton "Déposer" supprimé -->
                <div class="group-row">
                  <img v-if="getGroupeImage(event)" :src="getGroupeImage(event)" alt="Groupe" class="groupe-img" :class="{ promo: getGroupeImage(event) === groupePromo }" />
                  <img v-if="event.submissionEnabled" :src="depotIcon" alt="Dépôt" class="depot-icon" @click="openPopup(event)" />
                </div>
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
                      v-if="event.type !== 'exam'"
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
                <small v-if="event.isProposal && displayProposerName(event)" class="proposer-name">Proposé par {{ displayProposerName(event) }}</small>
                <small v-if="isLate(event)" style="color:#ef4444;">⚠️ En retard</small>
                <small v-else style="color:#6366f1;">⏰ {{ timeLeft(event.date, event.heure) }}</small>
                <button class="btn-plus-infos" @click="openPopup(event)">Plus d'infos</button>
                <!-- Bouton "Déposer" supprimé -->
                <div class="group-row">
                  <img v-if="getGroupeImage(event)" :src="getGroupeImage(event)" alt="Groupe" class="groupe-img" :class="{ promo: getGroupeImage(event) === groupePromo }" />
                  <img v-if="event.submissionEnabled" :src="depotIcon" alt="Dépôt" class="depot-icon" @click="openPopup(event)" />
                </div>
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
                <small v-if="event.isProposal && displayProposerName(event)" class="proposer-name">Proposé par {{ displayProposerName(event) }}</small>
                <small style="color:#6366f1;">Archivé</small>
                <button class="btn-plus-infos" @click="openPopup(event)">Plus d'infos</button>
                <div class="group-row">
                  <img v-if="getGroupeImage(event)" :src="getGroupeImage(event)" alt="Groupe" class="groupe-img" :class="{ promo: getGroupeImage(event) === groupePromo }" />
                  <img v-if="event.submissionEnabled" :src="depotIcon" alt="Dépôt" class="depot-icon" @click="openPopup(event)" />
                </div>
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
                <div class="group-row" :class="{ 'has-depot': event.submissionEnabled }">
                  <img v-if="getGroupeImage(event)" :src="getGroupeImage(event)" alt="Groupe" class="groupe-img" :class="{ promo: getGroupeImage(event) === groupePromo }" />
                  <img v-if="event.submissionEnabled" :src="depotIcon" alt="Dépôt" class="depot-icon" @click="openPopup(event)" />
                </div>
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
            <div class="group-row" :class="{ 'has-depot': event.submissionEnabled }">
              <img v-if="getGroupeImage(event)" :src="getGroupeImage(event)" alt="Groupe" class="groupe-img" :class="{ promo: getGroupeImage(event) === groupePromo }" />
              <img v-if="event.submissionEnabled" :src="depotIcon" alt="Dépôt" class="depot-icon" @click="openPopup(event)" />
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-if="popupEvent" class="popup-overlay" @click.self="closePopup" @wheel="onOverlayWheelInfo">
      <div class="popup-content" ref="popupContentEditRef">
        <h2>{{ popupEvent.titre }}</h2>
        <p><b>Matière :</b> {{ popupEvent.matiere }}</p>
        <p><b>Date :</b> {{ formatDate(popupEvent.date) }} {{ popupEvent.heure }}</p>
        <p v-if="popupEvent.isProposal && displayProposerName(popupEvent)"><b>Proposé par :</b> {{ displayProposerName(popupEvent) }}</p>
        <p><b>Description :</b>
          <span class="multiline-html" v-html="popupDescriptionHtml" @click="onDisplayHtmlClick"></span>
        </p>
        <!-- Pièces jointes -->
        <div v-if="attachmentsToShow.length" class="attachments-block" style="margin-top:12px;">
          <p><b>Pièces jointes :</b></p>
          <ul class="attachments-list" style="list-style:none; padding:0; margin:6px 0 0;">
            <li v-for="att in attachmentsToShow" :key="attKey(att)" style="margin:4px 0;">
              <a
                :href="getAttachmentDownloadUrl(att)"
                :download="displayAttName(att)"
                target="_blank"
                rel="noopener"
                class="attachment-link"
                style="color:#2563eb; text-decoration:underline; display:block; max-width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;"
              >
                {{ displayAttName(att) }}
              </a>
              <span v-if="att.size" style="color:#6b7280; margin-left:6px;">({{ formatBytes(att.size) }})</span>
            </li>
          </ul>
        </div>
        <!-- Fin pièces jointes -->

        <!-- Groupes de travail (popup “Plus d’infos”) -->
        <div v-if="popupEvent.groupWorkEnabled" class="work-groups-block" style="margin-top:16px;">
          <p><b>Groupes de travail :</b></p>

          <div v-if="groupsError" style="color:#ef4444; margin-bottom:6px;">{{ groupsError }}</div>
          <div v-if="loadingWorkGroups" style="color:#111;">Chargement…</div>

          <div v-else>
            <!-- Retiré: création prof/admin ici -->

            <ul style="list-style:none; padding:0; margin:6px 0 12px 0;">
              <li v-for="g in workGroups" :key="String(g._id)" style="display:flex; flex-wrap:wrap; align-items:center; gap:10px; margin:6px 0;">
                <span style="flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                  {{ g.name }} — {{ (g.members || []).length }}/{{ g.capacity }} place(s)
                </span>

                <!-- Actions côté étudiant/délégué -->
                <template v-if="user && (user.role === 'eleve' || user.role === 'etudiant' || user.role === 'delegue')">
                  <button
                    class="btn-vider-archive blue"
                    v-if="myGroupId !== String(g._id)"
                    :disabled="(g.members || []).length >= g.capacity || !!groupActionLoading[String(g._id)]"
                    @click="joinWorkGroup(popupEvent._id, String(g._id))"
                  >
                    {{ groupActionLoading[String(g._id)] ? '...' : ((g.members || []).length >= g.capacity ? 'Complet' : 'Rejoindre') }}
                  </button>
                  <button
                    class="btn-vider-archive btn-edit-orange"
                    v-else
                    :disabled="!!groupActionLoading[String(g._id)]"
                    @click="leaveWorkGroup(popupEvent._id, String(g._id))"
                  >
                    {{ groupActionLoading[String(g._id)] ? '...' : 'Quitter' }}
                  </button>
                </template>

                <!-- Noms des membres sous le titre du groupe -->
                <div style="flex-basis:100%; margin-top:4px; color:#374151;">
                  <small v-if="(g.members || []).length">Membres: {{ displayGroupMemberNames(g) }}</small>
                  <small v-else style="color:#6b7280;">Aucun membre</small>
                </div>

                <!-- Si je suis dans ce groupe, afficher ma soumission dans ce bloc -->
                <div v-if="myGroupId === String(g._id)" style="margin-top:12px; width:100%;">
                  <div v-if="mySubmissionFiles.length">
                    <p><b>Fichiers déposés (vous) :</b></p>
                    <small v-if="mySubmissionAt" style="color:#374151; display:block; margin-bottom:6px;">
                      Dernier dépôt : {{ formatDateTime(mySubmissionAt) }}
                    </small>
                    <ul style="list-style:none; padding:0; margin:6px 0 12px 0;">
                      <li v-for="f in mySubmissionFiles" :key="f.filename" style="display:flex; align-items:center; gap:8px; margin:4px 0;">
                        <a
      :href="getSubmissionFileUrl(f)"
      @click.prevent="downloadSubmissionFile(popupEvent._id, f)"
      target="_blank"
      rel="noopener"
      style="color:#2563eb; text-decoration:underline; flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;"
    >
      {{ displaySubmissionName(f) }}
    </a>
                        <span v-if="f.size" style="color:#6b7280; font-size:0.9em;">{{ formatBytes(f.size) }}</span>
                        <span v-if="isLateOnClient(f.createdAt, popupEvent)" style="color:#ef4444; font-size:0.9em; white-space:nowrap;">
                          ⚠️ {{ computeLateHMFromSubmittedAt(f.createdAt, popupEvent) }} de retard
                        </span>
                        <button type="button" @click="deleteMySubmissionFile(popupEvent._id, f.filename)" style="background:none; border:none; color:#ef4444; font-weight:700; font-size:22px; line-height:1; cursor:pointer; padding:0;">×</button>
                      </li>
                    </ul>
                  </div>

                  <div v-if="mySubmissionMessageHtml" style="margin-top:12px;">
                    <p><b>Votre message :</b></p>
                    <div class="multiline-html" v-html="sanitizeClientHtml(mySubmissionMessageHtml)" @click="onDisplayHtmlClick"></div>
                  </div>

                  <div v-if="myGroupFeedbacks[String(g._id)] && myGroupFeedbacks[String(g._id)].length" style="margin-top:12px;">
                    <p><b>Commentaires du professeur (groupe) :</b></p>
                    <ul style="list-style:none; padding:0; margin:6px 0 12px 0;">
                      <li v-for="fb in myGroupFeedbacks[String(g._id)]" :key="fb._id || fb.createdAt" style="margin:6px 0;">
                        <div class="multiline-html" v-html="sanitizeClientHtml(fb.textHtml)" @click="onDisplayHtmlClick"></div>
                        <small style="color:#6b7280;">{{ formatDateTime(fb.createdAt) }}</small>
                      </li>
                    </ul>
                  </div>
                </div>
              </li>
            </ul>

            <div v-if="!workGroups.length" style="color:#6b7280;">Aucun groupe pour le moment.</div>
          </div>
        </div>

        <!-- Dépôt étudiant -->
        <div
          v-if="user && (user.role === 'eleve' || user.role === 'etudiant' || user.role === 'delegue') && popupEvent.submissionEnabled"
          ref="studentSubmissionContainer"
          style="margin-top:16px;"
        >
          <p><b>Déposer vos fichiers (PDF/DOC/DOCX/ZIP/RAR) :</b></p>

          <input
            ref="studentSubmitInput"
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.zip,.rar"
            @change="onStudentFilesChange"
            style="display:block; margin-bottom:8px;"
          />
          <transition name="fade">
            <div v-if="!studentSubmissionFiles.length" class="no-file-message" role="status" aria-live="polite">{{ noFileMessageText }}</div>
          </transition>

          <!-- Éditeur message de dépôt (optionnel, local et isolé) -->
          <div class="mini-toolbar">
            <div class="toolbar-group">
              <button type="button" class="btn-mini rich-btn" @click="toggleEmojiSubmit">Emoji</button>
              <button type="button" class="btn-mini rich-btn" @click="submitInsertImageUrl">Image URL</button>
              <input ref="submitFileRef" type="file" accept="image/png,image/jpeg,image/svg+xml" @change="onSubmitImageFile($event)" style="display:none;" />
              <button type="button" class="btn-mini rich-btn" @click="() => submitFileRef && submitFileRef.click()">Importer</button>
            </div>
          </div>

          <div v-if="showSelectionToolbarSubmit" :style="selectionToolbarStyleSubmit" class="selection-toolbar" ref="selectionToolbarSubmitRef">
            <div class="toolbar-group">
              <button type="button" class="btn-mini" @mousedown.prevent @click="applyCmd('bold')"><b>Gras</b></button>
              <button type="button" class="btn-mini" @mousedown.prevent @click="applyCmd('italic')"><i>Italique</i></button>
              <button type="button" class="btn-mini" @mousedown.prevent @click="applyCmd('underline')"><u>Souligner</u></button>
              <div class="color-picker">
                <input type="color" class="color-swatch" v-model="fontColorSubmit" @input="applyFontColor('submit')" />
                <span class="color-swatch-display" :style="{ backgroundColor: fontColorSubmit }"></span>
              </div>
            </div>
            <select v-model="selectionFontSizeSubmit" @change="applySelectionFontSize('submit')" class="matiere-select">
              <option value="14">14</option>
              <option value="16">16</option>
              <option value="18">18</option>
              <option value="20">20</option>
              <option value="22">22</option>
              <option value="24">24</option>
              <option value="26">26</option>
              <option value="28">28</option>
              <option value="30">30</option>
              <option value="32">32</option>
              <option value="34">34</option>
              <option value="36">36</option>
              <option value="38">38</option>
              <option value="40">40</option>
              <option value="42">42</option>
              <option value="44">44</option>
              <option value="46">46</option>
              <option value="48">48</option>
              <option value="50">50</option>
              <option value="52">52</option>
              <option value="54">54</option>
            </select>
            <select v-model="selectionFontFamilySubmit" @change="applySelectionFontFamily('submit')" class="matiere-select">
              <option v-for="f in availableFonts" :key="f.value" :value="f.value">{{ f.label }}</option>
            </select>
          </div>

          <div v-if="showEmojiSubmit" class="emoji-picker">
            <button v-for="e in emojis" :key="'submit_'+e" type="button" class="emoji-btn" @click="insertEmojiSubmit(e)">{{ e }}</button>
          </div>

          <!-- Popover lien d’image (Submit) -->
          <teleport to="body">
            <div v-if="showImageLinkPopoverSubmit" :style="popoverStyleSubmit" class="image-link-popover" ref="imageLinkPopoverSubmitRef">
              <!-- Aperçu du lien appliqué (cliquable) -->
              <div v-if="imageLinkSubmit" class="link-preview">
                Lien appliqué :
                <a :href="imageLinkSubmit" target="_blank" rel="noopener" class="link-preview-anchor">{{ imageLinkSubmit }}</a>
              </div>

              <!-- Champ d’édition du lien -->
              <input v-model="imageLinkSubmit" type="text" placeholder="Lien (https://...)" class="matiere-select" style="width:100%; border: 3.5px solid #22c55e !important;" />
              <div class="toolbar-group" style="margin-top:8px;">
                <button type="button" class="btn-mini" @click="setImageLink('submit')">Appliquer le lien</button>
                <button type="button" class="btn-mini danger" @click="removeImageLink('submit')">Supprimer le lien</button>
                <button type="button" class="btn-mini" @click="closeImagePopover('submit')">Fermer</button>
              </div>
            </div>
          </teleport>

          <!-- Panneau réglage largeur image (Submit) -->
          <div v-if="selectedImageSubmit" class="image-resize-panel">
            <span style="margin-right:6px; color:#374151;">Largeur image:</span>
            <input type="range" min="80" max="592" step="10" v-model.number="imageWidthSubmit" @input="applyImageWidthIn('submit')" />
            <input type="number" min="50" max="592" step="10" v-model.number="imageWidthSubmit" @change="applyImageWidthIn('submit')" class="matiere-select" style="width:110px; margin-left:8px; padding:6px 8px;" />
            <button type="button" class="btn-mini" style="margin-left:8px;" @click="fitImageToEditorIn('submit')">Remplir la largeur</button>
          </div>

          <div ref="submitEditorRef" class="rich-editable" contenteditable="true" placeholder="Message de dépôt (optionnel)…" @click="onSubmitEditorClick" @input="onSubmitEditorInput"></div>

          <ul v-if="studentSubmissionFiles.length" style="list-style:none; padding:0; margin:6px 0 12px 0;">
            <li v-for="(f, i) in studentSubmissionFiles" :key="i" style="display:flex; align-items:center; gap:8px; margin:4px 0;">
              <span style="flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:#111;">{{ f.name }}</span>
              <span style="color:#6b7280; font-size:0.9em;">{{ formatBytesCommon?.(f.size) || (Math.round(f.size/1024) + ' KB') }}</span>
              <button
                type="button"
                @click="removeStudentFile(i)"
                style="background:none; border:none; color:#ef4444; font-weight:700; font-size:22px; line-height:1; cursor:pointer; padding:0;"
                aria-label="Supprimer"
                title="Supprimer"
              >×</button>
            </li>
          </ul>

          <div style="display:flex; gap:8px; margin-top:8px; flex-wrap:wrap; flex-direction: column-reverse;">
            <button
              class="btn-vider-archive blue"
              :disabled="loadingStudentSubmit || !studentSubmissionFiles.length"
              @click="submitStudentFiles(popupEvent._id)"
            >
              {{ loadingStudentSubmit ? 'Envoi...' : 'Déposer' }}
            </button>
            <button
              style="font-size:17px;"
              class="btn-vider-archive btn-edit-orange"
              :disabled="loadingMessageSave"
              @click="saveMySubmissionMessage(popupEvent._id)"
            >
              {{ loadingMessageSave ? 'Enregistrement...' : 'Enregistrer mon message' }}
            </button>
          </div>

          <div v-if="studentSubmitMessage" style="margin-top:8px; color:#111;">{{ studentSubmitMessage }}</div>
          <div v-if="messageSaveStatus" style="margin-top:8px; color:#111;">{{ messageSaveStatus }}</div>

          <!-- Mes fichiers déposés — n’afficher ici que si pas en groupe -->
          <div v-if="showStudentSubmissionOutsideGroup && mySubmissionFiles.length" style="margin-top:12px;">
            <p><b>Vos fichiers déposés :</b></p>
            <small v-if="mySubmissionAt" style="color:#374151; display:block; margin-bottom:6px;">
              Dernier dépôt : {{ formatDateTime(mySubmissionAt) }}
            </small>
            <ul style="list-style:none; padding:0; margin:6px 0 12px 0;">
              <li v-for="f in mySubmissionFiles" :key="f.filename" style="display:flex; align-items:center; gap:8px; margin:4px 0;">
                <a
                  :href="getSubmissionFileUrl(f)"
                  @click.prevent="downloadSubmissionFile(popupEvent._id, f)"
                  target="_blank"
                  rel="noopener"
                  title="Télécharger"
                  style="color:#2563eb; text-decoration:underline; flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;"
                >
                  {{ displaySubmissionName(f) }}
                </a>
                <span v-if="f.size" style="color:#6b7280; font-size:0.9em;">{{ formatBytes(f.size) }}</span>

                <span
                  v-if="isLateOnClient(f.createdAt, popupEvent)"
                  style="color:#ef4444; font-size:0.9em; white-space:nowrap;"
                >
                  ⚠️ {{ computeLateHMFromSubmittedAt(f.createdAt, popupEvent) }} de retard
                </span>
                <button
                  type="button"
                  @click="deleteMySubmissionFile(popupEvent._id, f.filename)"
                  style="background:none; border:none; color:#ef4444; font-weight:700; font-size:22px; line-height:1; cursor:pointer; padding:0;"
                  aria-label="Supprimer"
                  title="Supprimer"
                >×</button>
              </li>
            </ul>
          </div>

          <div v-if="showStudentSubmissionOutsideGroup && mySubmissionMessageHtml" style="margin-top:12px;">
            <p><b>Mon message enregistré :</b></p>
            <div class="multiline-html" v-html="sanitizeClientHtml(mySubmissionMessageHtml)" @click="onDisplayHtmlClick"></div>
          </div>

          <div v-if="showStudentSubmissionOutsideGroup && myTeacherFeedbacks && myTeacherFeedbacks.length" style="margin-top:12px;">
            <p><b>Retours du professeur :</b></p>
            <ul style="list-style:none; padding:0; margin:6px 0 12px 0;">
              <li v-for="fb in myTeacherFeedbacks" :key="fb._id || fb.createdAt" style="margin:6px 0;">
                <div class="multiline-html" v-html="sanitizeClientHtml(fb.textHtml)" @click="onDisplayHtmlClick"></div>
                <small style="color:#6b7280;">{{ formatDateTime(fb.createdAt) }}</small>
              </li>
            </ul>
          </div>

          <small style="color:#6b7280; display:block; margin-top:4px;">Un nouvel envoi s'ajoutera à votre dépôt. Vous pouvez supprimer des fichiers individuellement.</small>
        </div>
        <!-- Fin dépôt étudiant -->

        <!-- Soumissions (prof/admin) — cachée si groupes activés -->
        <div v-if="user && (user.role === 'prof' || user.role === 'admin') && popupEvent.submissionEnabled && !popupEvent.groupWorkEnabled" ref="profSubmissionsContainer" style="margin-top:16px;">
          <p><b>Soumissions :</b></p>
          <div v-if="loadingSubmissions" style="color:#111;">Chargement…</div>
          <div v-else-if="!submissionsList.length" style="color:#6b7280;">Aucune soumission pour le moment.</div>
          <ul v-else style="list-style:none; padding:0; margin:6px 0 12px 0;">
            <li v-for="s in submissionsList" :key="String(s.user)" style="margin:6px 0;">
              <span style=" color:#111;">{{ s.userName || s.user }}</span>
              <span style="color:#374151;"> — {{ (s.files || []).length }} fichier(s)</span>
              <span v-if="isLateOnClient(s.submittedAt, popupEvent)" style="color:#ef4444; margin-left:6px;">
                ⚠️ {{ computeLateHMFromSubmittedAt(s.submittedAt, popupEvent) }} de retard
              </span>
              <span v-if="s.submittedAt" style="color:#6b7280; margin-left:6px;">
                Déposé le {{ formatDateTime(s.submittedAt) }}
              </span>
              <!-- Soumissions (prof/admin) → détail par fichier -->
              <ul v-if="(s.files || []).length" style="list-style:none; padding:0; margin:4px 0 8px 12px;">
                <li v-for="f in s.files" :key="f.filename" style="display:flex; align-items:center; gap:8px; margin:4px 0;">
                  <a
                    :href="getSubmissionFileUrl(f)"
                    @click.prevent="downloadSubmissionFile(popupEvent._id, f)"
                    target="_blank"
                    rel="noopener"
                    style="color:#2563eb; text-decoration:underline; flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;"
                  >
                    {{ displaySubmissionName(f) }}
                  </a>
                  <span v-if="f.size" style="color:#6b7280; font-size:0.9em;">{{ formatBytes(f.size) }}</span>
                  <span
                    v-if="isLateOnClient(f.createdAt, popupEvent)"
                    style="color:#ef4444; font-size:0.9em; white-space:nowrap;"
                  >
                    ⚠️ {{ computeLateHMFromSubmittedAt(f.createdAt, popupEvent) }} de retard
                  </span>
                </li>
              </ul>

              <!-- Message élève (HTML enregistré) -->
              <div v-if="s.messageHtml" class="student-message-block" style="margin:6px 0 8px 0;">
                <div class="student-message-header" style="display:flex; align-items:center;">
                  <b>Message élève :</b>
                  <button
                    class="btn-vider-archive orange"
                    @click="toggleComment(String(s.user))"
                    style="margin-left:8px;"
                  >
                    {{ showStudentComment[String(s.user)] ? 'Masquer' : 'Voir commentaire' }}
                  </button>
                </div>
                <div
                  v-if="showStudentComment[String(s.user)]"
                  class="multiline-html"
                  v-html="sanitizeClientHtml(s.messageHtml)"
                  style="margin-top:8px;"
                  @click="onDisplayHtmlClick"
                ></div>
              </div>

              <!-- Retours du professeur déjà envoyés -->
              <div v-if="(s.teacherFeedbacks || []).length" style="margin:6px 0;">
                <p><b>Retours prof :</b></p>
                <ul style="list-style:none; padding:0; margin:4px 0 8px 12px;">
                  <li v-for="fb in s.teacherFeedbacks" :key="fb._id || fb.createdAt" style="margin:6px 0;">
                    <div class="multiline-html" v-html="sanitizeClientHtml(fb.textHtml)" @click="onDisplayHtmlClick"></div>

                    <!-- Actions: modifier / supprimer -->
                    <div class="teacher-feedback-actions" style="display:flex; gap:8px; margin:6px 0;">
                      <button class="btn-mini edit" @click="startEditingTeacherFeedback(fb)">Modifier</button>
                      <button class="btn-mini danger" @click="openDeleteFeedbackConfirm(popupEvent._id, String(fb._id))">Supprimer</button>
                    </div>

                    <!-- Mode édition inline -->
                    <div v-if="editingFeedbackId === String(fb._id)" class="teacher-feedback-edit" style="margin-top:6px;">
                      <textarea v-model="editingFeedbackText[String(fb._id)]" class="matiere-select" rows="3" placeholder="Modifier le commentaire…"></textarea>
                      <div style="display:flex; gap:8px; margin-top:6px; align-items:center; flex-wrap:wrap;">
                        <button class="btn-mini edit" @click="applyTeacherFeedbackEdit(popupEvent._id, String(fb._id))">Enregistrer</button>
                        <button class="btn-mini" @click="cancelTeacherFeedbackEdit">Annuler</button>
                      </div>
                    </div>

                    <small style="color:#6b7280;">{{ formatDateTime(fb.createdAt) }}</small>
                  </li>
                </ul>
              </div>

              <!-- Composer un nouveau retour professeur (éditeur riche) -->
              <div class="feedback-compose" style="margin:8px 0 12px;">
                <div style="display:flex; align-items:center; gap:8px;">
                  <span style="color:#000;">Commentaires professeur :</span>
                  <button
                    class="btn-vider-archive blue"
                    @click="toggleTeacherCompose(String(s.user))"
                  >
                    {{ showTeacherCompose[String(s.user)] ? 'Masquer' : 'Faire un commentaire' }}
                  </button>
                </div>

                <template v-if="showTeacherCompose[String(s.user)]">
                  <!-- Mini-toolbar (Prof) -->
                  <div class="mini-toolbar">
                    <div class="toolbar-group">
                      <button type="button" class="btn-mini rich-btn" @click="toggleEmojiTeacher(String(s.user))">Emoji</button>
                      <button type="button" class="btn-mini rich-btn" @click="insertImageUrl('teacher')">Image URL</button>
                      <input
                        :ref="el => registerTeacherFileRef(String(s.user), el)"
                        type="file"
                        accept="image/png,image/jpeg,image/svg+xml"
                        @change="onImageFile('teacher', $event)"
                        style="display:none;"
                      />
                      <button type="button" class="btn-mini rich-btn" @click="openTeacherFilePicker(String(s.user))">Importer</button>
                    </div>
                  </div>

                  <!-- Éditeur riche du commentaire professeur -->
                  <div
                    :ref="el => registerTeacherEditorRef(String(s.user), el)"
                    class="rich-editable teacher-feedback-editor"
                    contenteditable="true"
                    placeholder="Votre commentaire pour l'élève…"
                    @click="onTeacherEditorClick(String(s.user), $event)"
                    @input="onTeacherEditorInput(String(s.user))"
                  ></div>

                  <div v-if="showEmojiTeacher[String(s.user)]" class="emoji-picker">
                    <button
                      v-for="e in emojis"
                      :key="'teacher_'+String(s.user)+'_'+e"
                      type="button"
                      class="emoji-btn"
                      @click="insertEmoji('teacher', e)"
                    >{{ e }}</button>
                  </div>

                  <div style="display:flex; gap:8px; margin-top:6px; align-items:center; flex-wrap:wrap;">
                    <button
                      class="btn-vider-archive blue"
                      :disabled="sendingTeacherFeedback[String(s.user)]"
                      @click="sendTeacherFeedback(popupEvent._id, String(s.user))"
                    >
                      {{ sendingTeacherFeedback[String(s.user)] ? 'Envoi...' : 'Envoyer à l\'élève' }}
                    </button>
                    <small v-if="teacherFeedbackStatus[String(s.user)]" style="color:#111;">{{ teacherFeedbackStatus[String(s.user)] }}</small>
                  </div>
                </template>
              </div>
            </li>
          </ul>
          <button class="btn-vider-archive blue" @click="downloadAllSubmissionsZip(popupEvent._id)">
            Télécharger (ZIP)
          </button>
        </div>

        <!-- Soumissions par groupe (prof/admin) -->
        <div v-if="user && (user.role === 'prof' || user.role === 'admin') && popupEvent.groupWorkEnabled && popupEvent.submissionEnabled" style="margin-top:16px;">
          <p><b>Soumissions par groupe :</b></p>
          <small style="color:#6b7280;">Le commentaire de l'étudiant apparaît sous ses fichiers, dans “Dépôts des membres”.</small>
          <div v-if="loadingGroupAgg" style="color:#111;">Chargement…</div>
          <div v-else-if="!groupAggSubmissions.length" style="color:#6b7280;">Aucune soumission de groupe.</div>
          <ul v-else style="list-style:none; padding:0; margin:6px 0 12px 0;">
            <li v-for="row in groupAggSubmissions" :key="String(row.group._id)" style="margin:6px 0;">
              <div style="color:#111;">
                <b>{{ row.group.name }}</b>
                <span style="color:#374151;"> — Membres: {{ (row.group.members || []).map(m => m.name || m.fullName || m.username).filter(Boolean).join(', ') }}</span>
              </div>
              <div v-if="row.latest" style="margin:4px 0;">
                <span style="color:#374151;">Dernier dépôt du groupe: {{ row.latest.userName }} — {{ formatDateTime(row.latest.submittedAt) }}</span>
                <ul v-if="(row.latest.files || []).length" style="list-style:none; padding:0; margin:4px 0 8px 12px;">
                  <li v-for="f in row.latest.files" :key="f.filename" style="display:flex; align-items:center; gap:8px; margin:4px 0;">
                    <a
                      :href="getSubmissionFileUrl(f)"
                      @click.prevent="downloadSubmissionFile(popupEvent._id, f)"
                      target="_blank"
                      rel="noopener"
                      style="color:#2563eb; text-decoration:underline; flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;"
                    >
                      {{ displaySubmissionName(f) }}
                    </a>
                    <span v-if="f.size" style="color:#6b7280; font-size:0.9em;">{{ formatBytes(f.size) }}</span>
                  </li>
                </ul>
                <div v-if="hasVisibleHtml(row.latest.messageHtml)" style="margin-top:6px;">
                  <small style="color:#6b7280;">Commentaire de {{ row.latest.userName }}</small>
                  <div class="multiline-html" v-html="sanitizeClientHtml(row.latest.messageHtml)" @click="onDisplayHtmlClick" style="margin-top:4px;"></div>
                </div>
              </div>
              <div v-else style="color:#6b7280;">Aucun dépôt pour ce groupe.</div>

              <!-- Nouveau: dépôts et commentaires de tous les membres -->
              <div v-if="(row.submissions || []).length" style="margin-top:8px;">
                <p><b>Dépôts des membres :</b></p>
                <ul style="list-style:none; padding:0; margin:4px 0 8px 12px;">
                  <li v-for="ms in row.submissions" :key="String(ms.user)" style="margin:6px 0;">
                    <div style="color:#111;"><b>{{ ms.userName }}</b> <span style="color:#374151;">— {{ ms.submittedAt ? formatDateTime(ms.submittedAt) : 'Jamais' }}</span></div>

                    <ul v-if="(ms.files || []).length" style="list-style:none; padding:0; margin:4px 0 8px 12px;">
                      <li v-for="f in ms.files" :key="f.filename" style="display:flex; align-items:center; gap:8px; margin:4px 0;">
                        <a
                          :href="getSubmissionFileUrl(f)"
                          @click.prevent="downloadSubmissionFile(popupEvent._id, f)"
                          target="_blank"
                          rel="noopener"
                          style="color:#2563eb; text-decoration:underline; flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;"
                        >
                          {{ displaySubmissionName(f) }}
                        </a>
                        <span v-if="f.size" style="color:#6b7280; font-size:0.9em;">{{ formatBytes(f.size) }}</span>
                      </li>
                    </ul>

                    <div v-if="hasVisibleHtml(ms.messageHtml)" style="margin-top:6px;">
                      <small style="color:#6b7280;">Commentaire de {{ ms.userName }}</small>
                      <div class="multiline-html" v-html="sanitizeClientHtml(ms.messageHtml)" @click="onDisplayHtmlClick" style="margin-top:4px;"></div>
                    </div>
                  </li>
                </ul>
              </div>

              <div style="margin-top:8px;">
                <p><b>Commentaire au groupe :</b></p>
                <div class="teacher-group-feedback-editor">
                  <textarea v-model="groupFeedbackDraft[String(row.group._id)]" class="matiere-select" style="width:100%; min-height:80px;" placeholder="Votre retour au groupe…"></textarea>
                  <div style="display:flex; gap:8px; margin-top:6px;">
                    <button class="btn-mini edit" :disabled="!!groupFeedbackLoading[String(row.group._id)]" @click="sendGroupFeedback(popupEvent._id, String(row.group._id))">
                      {{ groupFeedbackLoading[String(row.group._id)] ? 'Envoi…' : 'Envoyer' }}
                    </button>
                  </div>
                </div>
                <div v-if="myGroupFeedbacks[String(row.group._id)] && myGroupFeedbacks[String(row.group._id)].length" style="margin-top:6px;">
                  <ul style="list-style:none; padding:0; margin:4px 0 8px 12px;">
                    <li v-for="fb in myGroupFeedbacks[String(row.group._id)]" :key="fb._id || fb.createdAt" style="margin:6px 0;">
                      <div class="multiline-html" v-html="sanitizeClientHtml(fb.textHtml)" @click="onDisplayHtmlClick"></div>
                      <small style="color:#6b7280;">{{ fb.teacherName ? fb.teacherName + ' — ' : '' }}{{ formatDateTime(fb.createdAt) }}</small>
                    </li>
                  </ul>
                </div>
              </div>
            </li>
          </ul>
        </div>
        <!-- Fin soumissions -->
        <!-- Zone bas de pop-up: bouton ZIP centré + fermer -->
        <div v-if="user && (user.role === 'prof' || user.role === 'admin') && popupEvent.groupWorkEnabled && popupEvent.submissionEnabled" style="display:flex; flex-direction:column; align-items:center; gap:6px; margin:12px 0;">
          <button class="btn-vider-archive blue zip-group-btn" @click="downloadGroupSubmissionsZip(popupEvent._id)">
            Télécharger (ZIP par groupe)
          </button>
          <small v-if="lastGroupZipDownloadName" style="color:#111;">Nom du ZIP : {{ lastGroupZipDownloadName }}</small>
        </div>
        <button class="btn-fermer-popup" @click="closePopup">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align:middle;margin-right:8px;"><path d="M4 4L14 14M14 4L4 14" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>
          Fermer
        </button>
      </div>
    </div>
    <div v-if="showSuccessPopup" class="popup-overlay" @click.self="showSuccessPopup = false">
      <div class="popup-content-success">
        <h3>{{ successMessage }}</h3>
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
    <!-- Popup retards bloqués -->
    <div v-if="showBlockedLatePopup" class="popup-overlay" @click.self="showBlockedLatePopup = false">
      <div class="popup-content-success">
        <h3 style="color:#ef4444;">Attention</h3>
        <p style="color:#111; margin:8px 0 12px 0;">
          Vous devez déposer des fichiers pour pouvoir vider la/les tâche(s) suivante(s) :
        </p>
        <ul style="text-align:left; list-style:none; padding:0; margin:8px 0;">
          <li v-for="t in blockedLateTasks" :key="t._id" style="margin:4px 0; color:#000 !important;">
            {{ t.titre || t.matiere || 'Tâche' }}
          </li>
        </ul>
        <button class="btn-ok-success" @click="showBlockedLatePopup = false">OK</button>
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

    <!-- Popup Mes tâches (gestion par groupes) -->
    <div v-if="showMyTasks" class="popup-overlay" @click.self="closeMyTasks" @wheel="onOverlayWheelMy">
      <div class="popup-content-ajout-tache popup-my-tasks" ref="popupContentMyTasksRef" style="max-width:75%;">
        <button class="close-btn-ajout" @click="closeMyTasks" @mouseover="hoverCloseAdd = true" @mouseleave="hoverCloseAdd = false">
          <img :src="hoverCloseAdd ? closeHoverImg : closeImg" alt="Fermer" class="close-img" />
        </button>
        <h3>Mes tâches créées</h3>
        <div class="mytasks-top-filters" style="display:flex; gap:10px; align-items:center; justify-content:center; margin-bottom:10px; flex-wrap:wrap;">
          <label class="tri-label">Matière :</label>
          <select v-model="myTasksSelectedMatiere" class="matiere-select" style="width:9rem;">
            <option value="">Toutes</option>
            <option v-for="matiere in myItemsMatieres" :key="'my_'+matiere" :value="matiere">{{ matiere }}</option>
          </select>
          <label class="tri-label">Année :</label>
          <select v-model="myTasksSelectedYear" class="matiere-select" style="width:8rem;">
            <option value="">Toutes</option>
            <option value="BUT1">BUT1</option>
            <option value="BUT2">BUT2</option>
            <option value="BUT3">BUT3</option>
          </select>
          <label class="tri-label">Spécialité :</label>
          <select v-model="myTasksSelectedSpec" class="matiere-select" style="width:18rem;">
            <option value="">Toutes</option>
            <option value="creation">Création numérique</option>
            <option value="devweb">Développement web</option>
            <option value="strategie">Stratégie de communication</option>
          </select>
        </div>
        <div v-if="loadingMyTasks" style="text-align:center; color:#111;">Chargement…</div>
        <div v-else>
          <div v-if="myItemsFiltered.length === 0" style="text-align:center; color:#111;">Aucune tâche.</div>
          <div class="my-tasks-list">
          <div
            v-for="ev in myItemsFiltered"
            :key="ev._id"
            :class="['devoir-card-liste', shouldMarkLateInMyTasks(ev) ? 'en-retard' : '']"
            style="width:100%; min-width:0; max-width:100%;"
          >
            <div style="flex:1;">
              <div class="devoir-titre" style="margin-bottom:6px;">{{ ev.titre }}</div>
              <small v-if="shouldLabelRetard(ev)" style="color:#ef4444;">⚠️ Retard</small>
              <div class="devoir-infos">📅 {{ formatDate(ev.date) }} {{ ev.heure }}</div>
              <div class="devoir-type"><b>{{ ev.matiere }}</b> — {{ ev.type === 'exam' ? 'Examen' : 'Devoir' }}</div>
              <button
                v-if="user && (user.role === 'prof' || user.role === 'admin') && ev.submissionEnabled"
                class="btn-plus-infos"
                style="margin-top:8px;"
                @click="openMyEventSubmissions(ev)"
              >
                Voir le dépôt
              </button>
            </div>
            <div style="flex:1;">
              <p style="margin:6px 0 8px 0; color:#111;">Groupes concernés :</p>
              <div class="groupes-checkboxes" style="flex-wrap: wrap; gap: 8px;">
                <label
                  v-for="g in myTaskGroupOptions(ev)"
                  :key="ev._id + '_' + g"
                  :class="{ disabled: (ev.groupes && ev.groupes.includes('Promo')) && g !== 'Promo' }"
                >
                  <input
                    type="checkbox"
                    :checked="(ev.groupes && ev.groupes.includes(g)) || ev.groupe === g"
                    :disabled="(ev.groupes && ev.groupes.includes('Promo')) && g !== 'Promo'"
                    @change="onToggleMyEventGroup(ev, g, $event)"
                  />
                  {{ g }}
                </label>
              </div>
              <div class="my-task-actions" style="display:flex; gap:8px; margin-top:8px; align-items: center; justify-content: center;">
                <button class="btn-vider-archive btn-pill-common blue" @click="ev.isProposal ? applyMyProposalGroups(ev) : applyMyEventGroups(ev)">Appliquer</button>
                <button v-if="ev.isProposal ? true : (user && (user.role === 'prof' || user.role === 'admin' || user.role === 'delegue'))" class="btn-vider-archive btn-pill-common orange" @click="ev.isProposal ? openEditProposal(ev) : openEditEvent(ev)">Modifier</button>
                <button class="btn-vider-archive btn-pill-common danger" @click="ev.isProposal ? confirmDelete(ev) : deleteMyEvent(ev)">Supprimer</button>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
    <!-- Popup Modifier (prof/admin ou délégué) -->
    <div v-if="showEditPopup" class="popup-overlay" @click.self="closeEditPopup" @wheel="onOverlayWheelEdit">
      <div class="popup-content-ajout-tache" ref="popupContentEditFormRef">
        <button class="close-btn-ajout" @click="closeEditPopup" @mouseover="hoverCloseAdd = true" @mouseleave="hoverCloseAdd = false">
          <img :src="hoverCloseAdd ? closeHoverImg : closeImg" alt="Fermer" class="close-img" />
        </button>
        <h3>Modifier la tâche</h3>
        <form @submit.prevent="submitEditEvent" style="display:flex; flex-direction:column; gap:10px;">
          <input v-model="editForm.titre" placeholder="Titre" required class="title-input" />
          <select v-model="editForm.type" required>
            <option value="devoir">Devoir</option>
            <option value="exam">Examen</option>
          </select>
          <select v-model="editForm.matiere" required>
            <option value="" disabled>Matière</option>
            <option v-for="matiere in mmiMatieres" :key="'edit_'+matiere" :value="matiere">{{ matiere }}</option>
          </select>
          <input v-model="editForm.date" type="date" />
          <input v-model="editForm.heure" type="time" />
          <!-- Déplacé ici: sélection de la spécialité sous l'heure -->
          <select v-if="showSpecSelect" v-model="editForm.specialite" id="edit-spec-input">
            <option value="">Aucune spécialité</option>
            <option value="creation">Création numérique</option>
            <option value="devweb">Développement Web</option>
            <option value="strategie">Stratégie de communication</option>
          </select>
          <!-- Déplacé ici: l'année avant la description pour prof/admin -->
          <div class="input-floating" v-if="user && (user.role === 'prof' || user.role === 'admin')">
            <select v-model="editForm.year" id="edit-year-input">
              <option value="" disabled>Sélectionner l'année</option>
              <option value="BUT1">BUT1</option>
              <option value="BUT2">BUT2</option>
              <option value="BUT3">BUT3</option>
            </select>
            <label for="edit-year-input">Année</label>
          </div>
          <div class="mini-toolbar">
            <div class="toolbar-group">
              <button type="button" class="btn-mini rich-btn" @click="toggleEmoji('edit')">Emoji</button>
              <button type="button" class="btn-mini rich-btn" @click="insertImageUrl('edit')">Image URL</button>
              <input ref="editFileRef" type="file" accept="image/png,image/jpeg,image/svg+xml" @change="onImageFile('edit', $event)" style="display:none;" />
              <button type="button" class="btn-mini rich-btn" @click="() => editFileRef && editFileRef.click()">Importer</button>
              <input ref="editDocRef" type="file"
                     accept=".pdf,application/pdf,.doc,application/msword,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                     @change="onDocFileChangeEdit($event)" style="display:none;" multiple />
              <button type="button" class="btn-mini rich-btn" @click="() => editDocRef && editDocRef.click()">PDF/DOCX</button>
            </div>
          </div>
          <teleport to="body">
            <div v-if="showImageLinkPopoverEdit" :style="popoverStyleEdit" class="image-link-popover" ref="imageLinkPopoverEditRef">
              <input v-model="imageLinkEdit" type="text" placeholder="Lien (https://...)" class="matiere-select" style="width:360px; border: 3.5px solid #22c55e !important;" />
              <div class="toolbar-group" style="margin-top:8px;">
                <button type="button" class="btn-mini" @click="setImageLink('edit')">Appliquer le lien</button>
                <button type="button" class="btn-mini" @click="removeImageLink('edit')">Supprimer le lien</button>
                <button type="button" class="btn-mini" @click="closeImagePopover('edit')">Fermer</button>
              </div>
            </div>
          </teleport>
          <div v-if="showSelectionToolbarEdit" :style="selectionToolbarStyleEdit" class="selection-toolbar" ref="selectionToolbarEditRef">
            <div class="toolbar-group">
              <button type="button" class="btn-mini" @mousedown.prevent @click="applyCmd('bold')"><b>Gras</b></button>
              <button type="button" class="btn-mini" @mousedown.prevent @click="applyCmd('italic')"><i>Italique</i></button>
              <button type="button" class="btn-mini" @mousedown.prevent @click="applyCmd('underline')"><u>Souligner</u></button>
              <div class="color-picker">
                <input type="color" class="color-swatch" v-model="fontColorEdit" @input="applyFontColor('edit')" />
                <span class="color-swatch-display" :style="{ backgroundColor: fontColorEdit }"></span>
              </div>
            </div>
            <select v-model="selectionFontSizeEdit" @change="applySelectionFontSize('edit')" class="matiere-select">
              <option value="14">14</option>
              <option value="16">16</option>
              <option value="18">18</option>
              <option value="20">20</option>
              <option value="22">22</option>
              <option value="24">24</option>
              <option value="26">26</option>
              <option value="28">28</option>
              <option value="30">30</option>
              <option value="32">32</option>
              <option value="34">34</option>
              <option value="36">36</option>
              <option value="38">38</option>
              <option value="40">40</option>
              <option value="42">42</option>
              <option value="44">44</option>
              <option value="46">46</option>
              <option value="48">48</option>
              <option value="50">50</option>
              <option value="52">52</option>
              <option value="54">54</option>
            </select>
            <select v-model="selectionFontFamilyEdit" @change="applySelectionFontFamily('edit')" class="matiere-select">
              <option v-for="f in availableFonts" :key="f.value" :value="f.value">{{ f.label }}</option>
            </select>
            
          </div>
          <div v-if="showEmojiEdit" class="emoji-picker">
            <button v-for="e in emojis" :key="'edit_'+e" type="button" class="emoji-btn" @click="insertEmoji('edit', e)">{{ e }}</button>
          </div>
          <div v-if="selectedImageEdit" class="image-resize-panel">
            <span style="margin-right:6px; color:#374151;">Largeur image:</span>
            <input type="range" min="80" max="592" step="10" v-model.number="imageWidthEdit" @input="applyImageWidthIn('edit')" />
            <input type="number" min="50" max="592" step="10" v-model.number="imageWidthEdit" @change="applyImageWidthIn('edit')" class="matiere-select" style="width:90px; margin-left:8px;" />
            <button type="button" class="btn-mini" style="margin-left:8px;" @click="fitImageToEditorIn('edit')">Remplir la largeur</button>
          </div>
          <div ref="editEditorRef" class="rich-editable" contenteditable="true" placeholder="Description riche (gras, couleur, images…)" @click="onEditEditorClick" @input="onEditEditorInput"></div>
          <!-- Aperçu des fichiers sélectionnés (avant envoi) -->
          <div v-if="editDocFiles.length" style="margin-top:8px;">
            <p style="margin:0 0 4px; color:#111; font-weight:600;">Fichiers sélectionnés :</p>
            <ul class="selected-docs-list">
              <li v-for="(f, idx) in editDocFiles" :key="f.name + '_' + f.size" class="selected-doc-item">
                <span class="selected-doc-name">{{ f.name }}</span>
                <span class="selected-doc-size">{{ formatBytesCommon(f.size) }}</span>
                <button type="button" class="selected-doc-remove" @click="removeEditDocFile(idx)" aria-label="Retirer" title="Retirer">×</button>
              </li>
            </ul>
          </div>

          <!-- Pièces jointes existantes avec croix discrète -->
          <div v-if="editingEvent?.attachments?.length" class="attachments-edit-block" style="margin-top:8px;">
            <p style="font-weight:600; color:#111; margin-bottom:4px;">Pièces jointes</p>
            <ul class="attachments-list" style="list-style:none; padding:0; margin:0;">
              <li v-for="att in editingEvent.attachments" :key="attKey(att)" style="display:flex; align-items:center; gap:8px; margin:4px 0;">
                <a
                  :href="getEventAttachmentDownloadUrl(att)"
                  :download="displayAttName(att)"
                  target="_blank"
                  rel="noopener"
                  class="attachment-link"
                >
                  {{ displayAttName(att) }}
                </a>
                <span v-if="att.size" style="color:#6b7280; font-size:0.9em;">{{ formatBytesCommon(att.size) }}</span>
                <button
                  type="button"
                  @click="removeAttachment(att)"
                  aria-label="Supprimer la pièce jointe"
                  title="Supprimer"
                  style="background:none; border:none; color:#ef4444; font-weight:700; font-size:22px; line-height:1; cursor:pointer; padding:0;"
                >×</button>
              </li>
            </ul>
          </div>

          <!-- Toggle dépôt étudiants (édition) -->
          <div v-if="user && (user.role === 'prof' || user.role === 'admin')" class="submission-toggle" style="margin-top:10px;">
            <label class="submission-label" style="display:flex; align-items:center; gap:8px; color:#111;">
              <input type="checkbox" v-model="editForm.submissionEnabled" />
              Boîte de dépôt activée
            </label>
            <small class="submission-help" style="color:#6b7280;">Désactiver coupe l’accès des étudiants aux dépôts.</small>
          </div>

          <!-- Toggle groupes (édition) -->
          <div v-if="user && (user.role === 'prof' || user.role === 'admin')" class="submission-toggle" style="margin-top:6px;">
            <label class="submission-label" style="display:flex; align-items:center; gap:8px; color:#111;">
              <input type="checkbox" v-model="editForm.groupWorkEnabled" />
              Groupes activés
            </label>
            <small class="submission-help" style="color:#6b7280;">Active la gestion des groupes pour cette tâche.</small>
          </div>

          <!-- Nouveau: éditeur de groupes sur modification de tâche -->
          <div v-if="editForm.groupWorkEnabled" style="margin-top:8px;">
            <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
              <label style="color:#111;">Nombre de groupes :</label>
              <input type="number" min="1" max="20" v-model.number="draftGroupCountEdit" class="matiere-select" style="width:120px;" />
              <button type="button" class="btn-vider-archive blue" @click="generateDraftGroups('edit')">Créer</button>
            </div>

            <div v-if="editGroupsDraft.length" style="margin-top:8px;">
              <div v-for="(g, i) in editGroupsDraft" :key="'edit-draft-'+i" style="display:flex; gap:8px; margin-top:6px; flex-wrap:wrap;">
                <input v-model="g.name" placeholder="Nom du groupe" class="matiere-select" style="flex:1; min-width:180px;" />
                <input type="number" min="1" max="99" v-model.number="g.capacity" placeholder="Places" class="matiere-select" style="width:120px;" />
              </div>
              <small style="color:#6b7280;">Les nouveaux groupes seront créés à l’enregistrement.</small>
            </div>

            <!-- Groupes existants (édition) -->
            <div v-if="workGroups.length" style="margin-top:12px;">
              <p style="margin:0 0 6px; color:#111; font-weight:600;">Groupes existants :</p>
              <div
                v-for="g in workGroups"
                :key="'edit-exist-'+String(g._id)"
                style="display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin-top:6px;"
              >
                <input v-model="g.name" placeholder="Nom du groupe" class="matiere-select" style="flex:1; min-width:180px;" />
                <input type="number" min="1" max="99" v-model.number="g.capacity" placeholder="Places" class="matiere-select" style="width:120px;" />
                <button type="button" class="btn-vider-archive blue" @click="saveExistingGroup(g)">Sauvegarder</button>
                <button type="button" class="btn-vider-archive" @click="removeExistingGroup(g)">Supprimer</button>
              </div>
            </div>
            <div v-else style="color:#6b7280; margin-top:6px;">Aucun groupe existant pour cette tâche.</div>
          </div>

          <button type="submit" class="btn-vider-archive blue no-hover-green">Enregistrer</button>
        </form>
      </div>
    </div>
  </div>


</template>

<script setup>
import { computed, ref, reactive } from 'vue';
import boutonValiderCocher from '@/assets/img/bouton_valider_cocher.png';
import boutonValiderDecocher from '@/assets/img/bouton_valider_decocher.png';
import { onMounted, onUnmounted, watch, nextTick } from 'vue';
import groupeA from '@/assets/img/groupe_A.webp';
import groupeB from '@/assets/img/groupe_B.webp';
import groupePromo from '@/assets/img/groupe_Promo.webp';
import groupeAprime from '@/assets/img/groupe_Aprime.webp';
import groupeAprimeprime from '@/assets/img/groupe_Aprime.webp';
import groupeBprime from '@/assets/img/groupe_Bprime.webp';
import groupeBprimeprime from '@/assets/img/groupe_Bprime.webp';
import axios from 'axios';
import { defineEmits } from 'vue';
import closeImg from '@/assets/img/bouton_supprimer_decocher.png';
import closeHoverImg from '@/assets/img/bouton_supprimer_cocher.png';
import notifIcon from '@/assets/notif.webp';
import supprimerIcon from '@/assets/supprimer.svg';
import depotIcon from '@/assets/img/dépot.webp';
import { API_URL } from '@/api';
import { useSubjectsStore } from '@/stores/subjects';
import canIcon from '@/assets/can.webp';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const props = defineProps({
  events: { type: Array, required: true }
});
const subjectsStore = useSubjectsStore();
const editEditorRef = ref(null);
const fontSizeEdit = ref('16');
const fontColorEdit = ref('#111111');
const sortBy = ref('date');
watch(sortBy, (type) => {
  try {
    if (type === 'exam') window.dispatchEvent(new Event('exams-tab-opened'))
    else if (type === 'enretard') window.dispatchEvent(new Event('retards-tab-opened'))
    else if (type === 'passe') window.dispatchEvent(new Event('tasks-archives-opened'))
  } catch {}
})
const selectedMatiere = ref('');

// Filtres prof (refs)
const profFilterYear = ref('');
const profFilterSpec = ref('');
const profFilterGroup = ref('');

// Listes d’options (dérivées des événements)
// Options fixes pour filtres prof (alignées sur l’admin)
const PROF_YEARS = ['BUT1','BUT2','BUT3'];
const PROF_SPECS = ['devweb','creation','strategie'];
const PROF_GROUPS = ['Promo', 'A', "A'", 'A"', 'B', "B'", 'B"'];

// Années: fixe + valeurs détectées
const profYears = computed(() => {
  const fromEvents = (props.events || [])
    .map(e => String(e.year || '').trim())
    .filter(Boolean);
  return Array.from(new Set([...PROF_YEARS, ...fromEvents])).sort();
});

// Spécialités: fixe + valeurs détectées
const profSpecs = computed(() => {
  const fromEvents = (props.events || [])
    .map(e => String(e.specialite || '').trim())
    .filter(Boolean);
  return Array.from(new Set([...PROF_SPECS, ...fromEvents])).sort();
});

// Helper d'affichage pour les spécialités (labels lisibles)
const SPEC_LABELS = {
  creation: 'Création numérique',
  devweb: 'Développement Web',
  strategie: 'Stratégie de communication'
};
const specLabel = (s) => SPEC_LABELS[String(s || '').toLowerCase()] || (s || '—');

// Ajout: filtrage robuste par spécialité (événement ou règles matières)
function eventMatchesSpec(e, spec) {
  const s = String(spec || '').trim().toLowerCase();
  if (!s) return true;
  const evSpec = String(e.specialite || '').trim().toLowerCase();
  if (evSpec && evSpec === s) return true;

  const matiereName = String(e.matiere || '').trim().toLowerCase();
  const dyn = (subjectsStore.getSubjects || []).find(sub => String(sub.name || '').toLowerCase() === matiereName);
  if (dyn && Array.isArray(dyn.specialitesAllowed)) {
    const allowed = dyn.specialitesAllowed.map(x => String(x).toLowerCase());
    if (allowed.includes(s)) return true;
  }
  const rule = (subjectsStore.staticRules || []).find(r => String(r.subjectName || '').toLowerCase() === matiereName);
  if (rule && Array.isArray(rule.specialitesAllowed)) {
    const allowed = rule.specialitesAllowed.map(x => String(x).toLowerCase());
    if (allowed.includes(s)) return true;
  }
  return false;
}


// Groupes: fixe + valeurs détectées
const profGroups = computed(() => {
  const fromEvents = (props.events || [])
    .flatMap(e => {
      const arr = Array.isArray(e.groupes) ? e.groupes : [];
      const single = e.groupe ? [String(e.groupe).trim()] : [];
      return [...arr, ...single];
    })
    .map(v => String(v || '').trim())
    .filter(Boolean);
  return Array.from(new Set([...PROF_GROUPS, ...fromEvents])).sort();
});

// Helper: applique les filtres prof si rôle=prof
const matchesProfFilters = (e) => {
  if (!(user.value && user.value.role === 'prof')) return true;
  const yearOk = !profFilterYear.value || String(e.year || '') === profFilterYear.value;
  const specOk = eventMatchesSpec(e, profFilterSpec.value);
  const groups = Array.isArray(e.groupes) ? e.groupes : (e.groupe ? [e.groupe] : []);
  const groupOk = !profFilterGroup.value || groups.includes(profFilterGroup.value);
  return yearOk && specOk && groupOk;
};
const hoveredCheck = ref(null);
const hoverCloseAdd = ref(false);
const user = ref(null);
try {
  const rawLocal = localStorage.getItem('user');
  const rawSession = sessionStorage.getItem('user');
  const raw = rawLocal || rawSession;
  if (raw) user.value = JSON.parse(raw);
} catch {}
const isAdmin = computed(() => user.value && user.value.role === 'admin');
const matiereArchive = ref('');

// État et helpers Groupes de travail (popup)
const loadingWorkGroups = ref(false);
const workGroups = ref([]);
const groupsError = ref(null);
const createGroupForm = ref({ name: '', capacity: 3 });
const createGroupLoading = ref(false);
// Suivi des opérations par groupe (join/leave)
const groupActionLoading = ref({});

const myUserId = computed(() => String(user.value?._id || user.value?.id || ''));
const myGroupId = computed(() => {
  const uid = myUserId.value;
  const g = (workGroups.value || []).find(g => Array.isArray(g.members) && g.members.some(m => String(m) === uid));
  return g ? String(g._id) : null;
});

// Nouveau: cache des utilisateurs pour afficher les noms des membres
const allUsersCache = ref([]);
const nameById = computed(() => {
  const m = {};
  (allUsersCache.value || []).forEach(u => { m[String(u._id || u.id)] = u.name || u.fullName || u.username || '—'; });
  return m;
});
async function ensureUsersCache() {
  try {
    if (Array.isArray(allUsersCache.value) && allUsersCache.value.length) return;
    const token = user.value?.token || localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    const res = await axios.get(`${API_URL}/users/leaderboard`, token ? { headers: { Authorization: `Bearer ${token}` } } : {});
    allUsersCache.value = Array.isArray(res.data) ? res.data : (res.data?.users || []);
  } catch {}
}

async function fetchWorkGroups(eventId) {
  loadingWorkGroups.value = true;
  groupsError.value = null;
  try {
    const token = user.value?.token || localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    const res = await axios.get(`${API_URL}/events/${eventId}/work-groups`, token ? { headers: { Authorization: `Bearer ${token}` } } : {});
    if (res?.data?.ok) {
      workGroups.value = Array.isArray(res.data.workGroups) ? res.data.workGroups : [];
    } else {
      workGroups.value = Array.isArray(res.data?.workGroups) ? res.data.workGroups : [];
    }
    // Charger les retours prof pour mon groupe (si applicable)
    try {
      const gid = myGroupId.value;
      if (gid) await loadGroupFeedback(eventId, String(gid));
    } catch {}
  } catch (e) {
    groupsError.value = e?.response?.data?.message || 'Erreur chargement des groupes';
    workGroups.value = [];
  } finally {
    loadingWorkGroups.value = false;
  }
}

async function createWorkGroup(eventId) {
  if (!createGroupForm.value.name.trim()) return;
  createGroupLoading.value = true;
  groupsError.value = null;
  try {
    const token = user.value?.token || localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    const payload = {
      name: createGroupForm.value.name.trim(),
      capacity: Math.max(1, Math.min(99, Number(createGroupForm.value.capacity || 1))),
    };
    const res = await axios.post(`${API_URL}/events/${eventId}/work-groups`, payload, { headers: { Authorization: `Bearer ${token}` } });
    if (res?.data?.ok) {
      workGroups.value = Array.isArray(res.data.workGroups) ? res.data.workGroups : [];
      createGroupForm.value = { name: '', capacity: payload.capacity };
    } else {
      await fetchWorkGroups(eventId);
    }
  } catch (e) {
    groupsError.value = e?.response?.data?.message || 'Erreur création du groupe';
  } finally {
    createGroupLoading.value = false;
  }
}

async function joinWorkGroup(eventId, gid) {
  groupActionLoading.value[gid] = true;
  groupsError.value = null;
  try {
    const token = user.value?.token || localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    const res = await axios.post(`${API_URL}/events/${eventId}/work-groups/${gid}/join`, {}, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (res?.data?.ok) {
      await fetchWorkGroups(eventId);
      ensureUsersCache();
      if (user.value && (user.value.role === 'eleve' || user.value.role === 'etudiant' || user.value.role === 'delegue')) {
        await fetchMyGroupAgg(eventId);
      }
      if (user.value && (user.value.role === 'prof' || user.value.role === 'admin')) {
        await fetchGroupAggSubmissions(eventId);
      }
    }
  } catch (e) {
    groupsError.value = e?.response?.data?.message || 'Erreur pour rejoindre le groupe';
  } finally {
    groupActionLoading.value[gid] = false;
  }
}

async function leaveWorkGroup(eventId, gid) {
  groupActionLoading.value[gid] = true;
  groupsError.value = null;
  try {
    const token = user.value?.token || localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    const res = await axios.post(`${API_URL}/events/${eventId}/work-groups/${gid}/leave`, {}, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (res?.data?.ok) {
      await fetchWorkGroups(eventId);
      ensureUsersCache();
      if (user.value && (user.value.role === 'eleve' || user.value.role === 'etudiant' || user.value.role === 'delegue')) {
        await fetchMyGroupAgg(eventId);
      }
      if (user.value && (user.value.role === 'prof' || user.value.role === 'admin')) {
        await fetchGroupAggSubmissions(eventId);
      }
    }
  } catch (e) {
    groupsError.value = e?.response?.data?.message || 'Erreur pour quitter le groupe';
  } finally {
    groupActionLoading.value[gid] = false;
  }
}

// Edition: modifier/supprimer un groupe existant (prof/admin)
async function saveExistingGroup(g) {
  if (!editingEvent.value || !g || !g._id) return;
  try {
    const token = user.value?.token || localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    const name = String(g.name || '').trim();
    const capacity = Math.max(1, Math.min(99, Number(g.capacity || 1)));
    await axios.put(`${API_URL}/events/${editingEvent.value._id}/work-groups/${String(g._id)}`, { name, capacity }, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    await fetchWorkGroups(editingEvent.value._id);
  } catch (e) {
    alert('Erreur lors de la mise à jour du groupe.');
  }
}
async function removeExistingGroup(g) {
  if (!editingEvent.value || !g || !g._id) return;
  if (!confirm('Supprimer ce groupe ?')) return;
  try {
    const token = user.value?.token || localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    await axios.delete(`${API_URL}/events/${editingEvent.value._id}/work-groups/${String(g._id)}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    await fetchWorkGroups(editingEvent.value._id);
  } catch (e) {
    alert('Erreur lors de la suppression du groupe.');
  }
}

// Agrégats de soumissions par groupe et retours professeur aux groupes
const loadingGroupAgg = ref(false);
const groupAggSubmissions = ref([]);

// Vue “mon groupe” (élève/délégué) et affichage conditionnel
const loadingMyGroupAgg = ref(false);
const myGroupAgg = ref(null);
const showStudentSubmissionOutsideGroup = computed(() => !(popupEvent.value?.groupWorkEnabled && myGroupId.value));

const groupFeedbackDraft = reactive({});
const groupFeedbackLoading = reactive({});
const myGroupFeedbacks = ref({});

function displayGroupMemberNames(g) {
  try {
    const members = Array.isArray(g?.members) ? g.members : [];
    const names = members.map(m => {
      if (typeof m === 'string') {
        const id = String(m);
        return nameById.value[id] || id.slice(0, 8);
      }
      const id = String(m?._id || m?.id || '');
      const fromCache = id ? nameById.value[id] : '';
      return fromCache || m?.name || m?.fullName || m?.username || m?.email || (id ? id.slice(0, 8) : '');
    }).filter(Boolean);
    return names.length ? names.join(', ') : `${members.length} membre(s)`;
  } catch {
    const len = Array.isArray(g?.members) ? g.members.length : 0;
    return `${len} membre(s)`;
  }
}

async function fetchGroupAggSubmissions(eventId) {
  loadingGroupAgg.value = true;
  try {
    const token = user.value?.token || localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    const { data } = await axios.get(`${API_URL}/events/${eventId}/group-submissions`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    groupAggSubmissions.value = Array.isArray(data?.groups) ? data.groups : [];
  } catch (e) {
    groupAggSubmissions.value = [];
  } finally {
    loadingGroupAgg.value = false;
  }
}

async function fetchMyGroupAgg(eventId) {
  loadingMyGroupAgg.value = true;
  try {
    const token = user.value?.token || localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    const { data } = await axios.get(`${API_URL}/events/${eventId}/group-submissions/my-group`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    myGroupAgg.value = data && data.group ? data : null;
    const gid = myGroupAgg.value?.group?._id ? String(myGroupAgg.value.group._id) : null;
    if (gid) await loadGroupFeedback(eventId, gid);
  } catch (e) {
    myGroupAgg.value = null;
  } finally {
    loadingMyGroupAgg.value = false;
  }
}

async function sendGroupFeedback(eventId, groupId) {
  if (!user.value) return alert('Non connecté');
  const textHtml = String(groupFeedbackDraft[String(groupId)] || '').trim();
  if (!textHtml) return;
  groupFeedbackLoading[String(groupId)] = true;
  try {
    const token = user.value?.token || localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    await axios.post(`${API_URL}/events/${eventId}/group-feedback`, { groupId: String(groupId), textHtml }, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    groupFeedbackDraft[String(groupId)] = '';
    await loadGroupFeedback(eventId, String(groupId));
  } catch (e) {
    console.warn('Send group feedback failed:', e?.message || e);
  } finally {
    groupFeedbackLoading[String(groupId)] = false;
  }
}

// Charger les commentaires du groupe
async function loadGroupFeedback(eventId, groupId) {
  try {
    const token = user.value?.token || localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    const { data } = await axios.get(`${API_URL}/events/${eventId}/group-feedback/${encodeURIComponent(groupId)}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    myGroupFeedbacks.value[String(groupId)] = Array.isArray(data) ? data : (data?.feedbacks || []);
  } catch (e) {
    myGroupFeedbacks.value[String(groupId)] = [];
  }
}

// Edition (prof/admin)
const showEditPopup = ref(false)
const editingEvent = ref(null)
const editForm = ref({ titre: '', type: 'devoir', matiere: '', date: '', heure: '', description: '', year: '', specialite: '', submissionEnabled: false, groupWorkEnabled: false })

function openEditEvent(ev) {
  editingEvent.value = ev
  editForm.value = {
    titre: ev.titre || '',
    type: ev.type || 'devoir',
    matiere: ev.matiere || '',
    date: ev.date || '',
    heure: ev.heure || '',
    description: ev.description || '',
    year: ev.year || '',
    specialite: ev.specialite || '',
    submissionEnabled: !!ev.submissionEnabled,
    groupWorkEnabled: !!ev.groupWorkEnabled
  }
  showEditPopup.value = true
  // Pré-remplir l'éditeur riche et charger les pièces jointes après rendu du popup
  nextTick(() => {
    try {
      if (editEditorRef && editEditorRef.value) {
        editEditorRef.value.innerHTML = String(ev.description || '')
      }
    } catch {}
    // Charger les pièces jointes si absentes
    ensureEditAttachmentsLoaded();
    // Charger les groupes existants si activés
    try {
      if (ev.groupWorkEnabled && ev._id) {
        fetchWorkGroups(ev._id);
      }
    } catch {}
  })
}
function closeEditPopup() { showEditPopup.value = false }

// Liste des matières statiques
const matieresStatiques = [
  "Anglais",
  "Culture artistique",
  "Culture numérique",
  "Production graphique",
  "Stratégies de communication",
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

// Liste des matières : statiques + dynamiques
const mmiMatieres = computed(() => {
  const isProfAdmin = user.value && (user.value.role === 'prof' || user.value.role === 'admin');
  if (isProfAdmin) {
    const allDynamic = (subjectsStore.getSubjects || []).map(s => s.name);
    const allSubjects = [...matieresStatiques, ...allDynamic];
    return [...new Set(allSubjects)].sort();
  }

  const userYear = user.value?.year || '';
  const userGroup = user.value?.groupe || '';
  const userSpec = user.value?.specialite || '';

  const dynamicSubjects = (subjectsStore.getSubjects || [])
    .filter((s) => {
      const years = Array.isArray(s?.yearsAllowed) ? s.yearsAllowed : [];
      if (years.length > 0 && userYear && !years.includes(userYear)) return false;

      const groups = Array.isArray(s?.groupsAllowed) ? s.groupsAllowed : [];
      if (groups.length > 0 && userGroup && !groups.includes(userGroup)) return false;

      const specs = Array.isArray(s?.specialitesAllowed) ? s.specialitesAllowed : [];
      if (specs.length > 0 && userSpec && !specs.includes(userSpec)) return false;

      return true;
    })
    .map(s => s.name);

  const staticsFiltered = matieresStatiques.filter((name) => {
    const rule = (subjectsStore.staticRules || []).find(
      r => String(r.subjectName || '').toLowerCase() === String(name || '').toLowerCase()
    );
    if (!rule) return true;

    const years = Array.isArray(rule.yearsAllowed) ? rule.yearsAllowed : [];
    if (years.length > 0 && userYear && !years.includes(userYear)) return false;

    const groups = Array.isArray(rule.groupsAllowed) ? rule.groupsAllowed : [];
    if (groups.length > 0 && userGroup && !groups.includes(userGroup)) return false;

    const specs = Array.isArray(rule.specialitesAllowed) ? rule.specialitesAllowed : [];
    if (specs.length > 0 && userSpec && !specs.includes(userSpec)) return false;

    return true;
  });

  const allSubjects = [...staticsFiltered, ...dynamicSubjects];
  return [...new Set(allSubjects)].sort();
});

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

// AJOUT: Set en mémoire pour bloquer les clics simultanés sur une même tâche
const checkInFlight = new Set()
const showConfirmNoSubmission = ref(false)
const confirmEventPending = ref(null)
async function confirmNoSubmission() {
  const ev = confirmEventPending.value
  showConfirmNoSubmission.value = false
  if (!ev || !ev._id) { confirmEventPending.value = null; return }
  try {
    await axios.post(`${API_URL}/events/${ev._id}/check`, {}, { headers: { Authorization: `Bearer ${user.value.token}` } })
    ev.checked = true
    await nextTick()
    hoveredCheck.value = null
    emit('refresh-events')
    playSound(cocherSound)
  } catch (e) {
    alert('Erreur lors de la validation de la tâche.')
  } finally {
    checkInFlight.delete(ev._id)
    confirmEventPending.value = null
  }
}
function cancelConfirmNoSubmission() {
  showConfirmNoSubmission.value = false
  if (confirmEventPending.value && confirmEventPending.value._id) checkInFlight.delete(confirmEventPending.value._id)
  confirmEventPending.value = null
}

async function toggleCheck(event) {
  if (!user.value) return alert('Non connecté');
  if (event?.type === 'exam') return;
  if (!event || !event._id) return;
  if (checkInFlight.has(event._id)) return;
  checkInFlight.add(event._id);
  try {
    if (event?.isProposal) {
      const token = user.value.token;
      if (!event.checked) {
        await axios.post(`${API_URL}/events/proposals/${event._id}/check`, {}, { headers: { Authorization: `Bearer ${token}` } });
        event.checked = true;
        playSound(cocherSound)
      } else {
        await axios.post(`${API_URL}/events/proposals/${event._id}/uncheck`, {}, { headers: { Authorization: `Bearer ${token}` } });
        event.checked = false;
        playSound(annulerSound)
      }
      await nextTick();
      hoveredCheck.value = null;
      return;
    }
    // Garde côté client — dépôt requis pour ELEVE/ETUDIANT/DELEGUE si submissionEnabled
    const role = user.value?.role;
    const needsSubmission = role === 'eleve' || role === 'etudiant' || role === 'delegue';
    if (!event.checked && needsSubmission && event.submissionEnabled) {
      try {
        const token = user.value?.token || localStorage.getItem('token') || sessionStorage.getItem('token') || '';
        const { data } = await axios.get(`${API_URL}/events/${event._id}/my-submission`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const hasFiles = Array.isArray(data?.files) && data.files.length > 0;
        if (!hasFiles) {
          confirmEventPending.value = event; showConfirmNoSubmission.value = true; return;
        }
      } catch {
        confirmEventPending.value = event; showConfirmNoSubmission.value = true; return;
      }
    }

    if (!event.checked) {
      await axios.post(`${API_URL}/events/${event._id}/check`, {}, { headers: { Authorization: `Bearer ${user.value.token}` } });
      playSound(cocherSound)
    } else {
      await axios.post(`${API_URL}/events/${event._id}/uncheck`, {}, { headers: { Authorization: `Bearer ${user.value.token}` } });
      playSound(annulerSound)
    }
    await nextTick();
    hoveredCheck.value = null;
    emit('refresh-events');
  } catch (error) {
    alert("Erreur lors de la mise à jour de la tâche.");
    console.error(error);
  } finally {
    checkInFlight.delete(event._id)
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

const doneEvents = computed(() => {
  const base = [
    ...props.events,
    ...(Array.isArray(myProposals.value) ? myProposals.value : []),
    ...(Array.isArray(myAcceptedProposals.value) ? myAcceptedProposals.value : [])
  ];
  let arr = base
    .filter(e => e.checked && !e.archived)
    .filter(e => e.type !== 'exam');

  if (sortBy.value === 'depot') {
    arr = arr.filter(e => e.submissionEnabled === true && !e.isProposal);
  }

  arr = arr
    .filter(e => !selectedMatiere.value || e.matiere === selectedMatiere.value)
    .filter(e => matchesProfFilters(e));

  return arr;
});
const toDoEvents = computed(() => {
  const base = [
    ...props.events,
    ...(Array.isArray(myProposals.value) ? myProposals.value : []),
    ...(Array.isArray(myAcceptedProposals.value) ? myAcceptedProposals.value : [])
  ];
  let filtered = base.filter(e => {
    if (e.archived) return false;

    const t = timeLeft(e.date, e.heure);
    let typeFilter = true;
    if (sortBy.value === 'exam') typeFilter = e.type === 'exam' && (e.isProposal ? true : t !== 'Terminé');
    else if (sortBy.value === 'devoir') typeFilter = e.type === 'devoir' && (e.isProposal ? true : t !== 'Terminé');
    else if (sortBy.value === 'passe') return false; // Géré par la computed 'archives'
    else if (sortBy.value === 'enretard') typeFilter = isLate(e) && e.type !== 'exam'; // pas d'examens dans "en retard"
    else if (sortBy.value === 'depot') typeFilter = e.submissionEnabled === true && !e.isProposal; // exclure les propositions du filtre Dépôt
    else typeFilter = e.isProposal ? true : (t !== 'Terminé' && !isLate(e));
    return !e.checked
      && (!selectedMatiere.value || e.matiere === selectedMatiere.value)
      && typeFilter
      && matchesProfFilters(e); // Filtres prof appliqués directement ici
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
  props.events
    .filter(e => e.archived && (!selectedMatiere.value || e.matiere === selectedMatiere.value))
    .filter(e => matchesProfFilters(e))
);

const lateEvents = computed(() =>
  props.events.filter(e =>
    !e.archived &&
    !e.checked &&
    isLate(e) &&
    (!selectedMatiere.value || e.matiere === selectedMatiere.value) &&
    matchesProfFilters(e)
  )
);

// Compteurs de dépôt (non archivés, non cochés)
const depositExamCount = computed(() =>
  props.events.filter(e =>
    e.submissionEnabled && !e.archived && !e.checked && e.type === 'exam' && matchesProfFilters(e)
  ).length
);
const depositDevoirCount = computed(() =>
  props.events.filter(e =>
    e.submissionEnabled && !e.archived && !e.checked && e.type === 'devoir' && matchesProfFilters(e)
  ).length
);
const depositTotalCount = computed(() =>
  props.events.filter(e =>
    e.submissionEnabled && !e.archived && !e.checked && matchesProfFilters(e)
  ).length
);

function setSort(type) {
  sortBy.value = type;
}

function stringToColor(str, type) {
  // 1) Matières dynamiques: utiliser la couleur/dégradé défini dans l'admin
  const dyn = subjectsStore.getSubjectByName(str);
  if (dyn) {
    const c1 = dyn.color;
    const c2 = (dyn.useGradient === false) ? null : dyn.color2;
    const a1 = typeof dyn.colorOpacity === 'number' ? dyn.colorOpacity : 1;
    const a2 = typeof dyn.color2Opacity === 'number' ? dyn.color2Opacity : 1;
    const angle = typeof dyn.gradientAngle === 'number' ? dyn.gradientAngle : 135;
    if (c2) {
      const hexToRgb = (hex) => {
        const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '');
        return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : null;
      };
      const rgba = (hex, alpha) => {
        const rgb = hexToRgb(hex);
        if (!rgb) return hex || '#000000';
        const a = typeof alpha === 'number' ? Math.min(1, Math.max(0, alpha)) : 1;
        return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a})`;
      };
      return `linear-gradient(${angle}deg, ${rgba(c1, a1)}, ${rgba(c2, a2)})`;
    }
    return c1;
  }

  // 2) Matières statiques: palette existante
  if (str === "Stratégies de communication") {
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

function displayProposerName(ev) {
  try {
    const myId = String(user.value?._id || user.value?.id || '')
    const createdBy = String(ev?.createdBy || '')
    if (createdBy && myId && createdBy === myId) return (user.value?.username || user.value?.name || 'Vous')
    return ev?.createdByName || ev?.proposedByName || ''
  } catch { return '' }
}


function displayProposalProposerName(p) {
  try {
    if (p?.proposedByName) return p.proposedByName
    const id = String(p?.proposedById || '')
    if (!id) return ''
    const idx = new Map((blockedUsers.value || []).map(u => [String(u._id || u.id || ''), String(u.username || '')]))
    return idx.get(id) || ''
  } catch { return '' }
}
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function formatDateTime(ts) {
  try {
    if (!ts) return '';
    const d = new Date(ts);
    const datePart = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timePart = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    return `${datePart} ${timePart}`;
  } catch {
    return '';
  }
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

// Base serveur sans /api (pour accès aux fichiers statiques)
const baseServerUrl = (API_URL || '').replace(/\/?api\/?$/i, '');

// Pièces jointes pour la popup (affichage sécurisé)
const attachmentsToShow = computed(() => {
  const atts = popupEvent.value?.attachments;
  return Array.isArray(atts) ? atts : [];
});

function attKey(att) {
  return att?.filename || att?.originalname || att?.name || JSON.stringify(att).slice(0, 50);
}

function displayAttName(att) {
  const orig = att?.originalname || att?.name;
  if (orig) return orig;
  const fn = att?.filename || '';
  try {
    const parts = String(fn).split('-');
    if (parts.length > 2) return parts.slice(2).join('-');
  } catch {}
  return fn || 'Pièce jointe';
}

// Suivi local des pièces jointes ajoutées récemment (édition)
const recentlyAdded = ref([]);
function wasRecentlyAdded(att) {
  const fn = att?.filename || att?.name || att?.path || att?.originalname || '';
  return !!(fn && recentlyAdded.value.includes(fn));
}

// Construit l’URL de téléchargement/visualisation vers /uploads/events/<filename>
function getAttachmentUrl(att) {
  const name = att?.filename || att?.name || att?.path || '';
  return name ? `${baseServerUrl}/uploads/events/${encodeURIComponent(name)}` : '';
}
function getAttachmentDownloadUrl(att) {
  const name = att?.filename || att?.name || att?.path || '';
  const id = popupEvent.value?._id;
  if (!name || !id) return '';
  if (popupEvent.value?.isProposal) {
    return getAttachmentUrl(att);
  }
  return `${API_URL}/events/${encodeURIComponent(id)}/attachments/${encodeURIComponent(name)}/download`;
}

// Formatage taille fichier
function formatBytes(bytes) {
  const b = Number(bytes || 0);
  if (!b || b < 0) return '';
  const k = 1024, sizes = ['octets', 'Ko', 'Mo', 'Go', 'To'];
  const i = Math.floor(Math.log(b) / Math.log(k));
  const val = (b / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1);
  return `${val} ${sizes[i]}`;
}

// Fallback: si l’event n’a pas d’attachments, on les récupère via l’API
async function ensureAttachmentsLoaded() {
  const ev = popupEvent.value;
  if (!ev || Array.isArray(ev.attachments)) return;
  try {
    const res = await axios.get(`${API_URL}/events/${ev._id}/attachments`);
    const arr = Array.isArray(res.data) ? res.data : (res.data?.attachments || []);
    popupEvent.value = { ...ev, attachments: arr };
  } catch (e) {
    console.warn('Attachments fetch failed:', e?.message || e);
  }
}

// Soumissions (prof/admin)
const submissionsList = ref([]);
const loadingSubmissions = ref(false);

// Commentaires prof (feedbacks)
const teacherFeedbackInputs = reactive({});
const sendingTeacherFeedback = reactive({});
const teacherFeedbackStatus = reactive({});

// Affichage/masquage des messages élèves (par élève)
const showStudentComment = reactive({});
function toggleComment(userId) {
  showStudentComment[userId] = !showStudentComment[userId];
}

// Éditeur "prof" : états par élève
const teacherEditorRefs = reactive({});
const teacherFileRefs = reactive({});
const showEmojiTeacher = reactive({});
const activeTeacherEditorId = ref('');

// Enregistrer les refs DOM (éditeur et input fichier) par élève
function registerTeacherEditorRef(studentId, el) {
  if (!studentId) return;
  teacherEditorRefs[String(studentId)] = el || null;
}
function registerTeacherFileRef(studentId, el) {
  if (!studentId) return;
  teacherFileRefs[String(studentId)] = el || null;
}
function openTeacherFilePicker(studentId) {
  const input = teacherFileRefs[String(studentId)];
  try { input && input.click && input.click(); } catch {}
}

// Focus et handlers éditeur prof
function focusTeacherEditor(id) {
  activeTeacherEditorId.value = String(id || '');
  const el = teacherEditorRefs[activeTeacherEditorId.value];
  try { el && el.focus && el.focus(); } catch {}
}
function onTeacherEditorClick(studentId, _e) {
  focusTeacherEditor(studentId);
}
function onTeacherEditorInput(studentId) {
  try {
    const el = teacherEditorRefs[String(studentId)];
    teacherFeedbackInputs[String(studentId)] = String(el?.innerHTML || '');
  } catch {}
}
function toggleEmojiTeacher(studentId) {
  const id = String(studentId);
  showEmojiTeacher[id] = !showEmojiTeacher[id];
  if (showEmojiTeacher[id]) {
    // assure l’insertion d’emoji dans le bon éditeur
    focusTeacherEditor(id);
  }
}

// Affichage du composeur de commentaire professeur par élève
const showTeacherCompose = reactive({});
function toggleTeacherCompose(studentId) {
  const id = String(studentId);
  showTeacherCompose[id] = !showTeacherCompose[id];
  if (showTeacherCompose[id]) {
    nextTick(() => { try { focusTeacherEditor(id); } catch {} });
  } else {
    try { showEmojiTeacher[id] = false; } catch {}
    // Ces refs ne sont pas utilisées côté prof, mais on les garde inoffensives
    try { showImageLinkPopoverTeacher.value = false; } catch {}
    try { showSelectionToolbarTeacher.value = false; } catch {}
    try { if (activeTeacherEditorId.value === id) activeTeacherEditorId.value = ''; } catch {}
  }
}

async function sendTeacherFeedback(eventId, studentId) {
  if (!user.value) return alert('Non connecté');
  if (!eventId || !studentId) return;
  try {
    sendingTeacherFeedback[studentId] = true;
    teacherFeedbackStatus[studentId] = '';
    const token = user.value?.token || localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    const textHtml = String(teacherFeedbackInputs[studentId] || '').trim();
    if (!textHtml) {
      teacherFeedbackStatus[studentId] = 'Veuillez saisir un commentaire.';
      sendingTeacherFeedback[studentId] = false;
      return;
    }

    await axios.post(`${API_URL}/events/${eventId}/teacher-feedback`, {
      studentIds: [studentId],
      textHtml
    }, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });

    teacherFeedbackStatus[studentId] = 'Commentaire envoyé.';
    teacherFeedbackInputs[studentId] = '';
    await fetchSubmissions(eventId);
    await loadMySubmission(eventId);
  } catch (e) {
    teacherFeedbackStatus[studentId] = e?.response?.data?.message || 'Erreur envoi.';
  } finally {
    sendingTeacherFeedback[studentId] = false;
  }
}

async function fetchSubmissions(eventId) {
  try {
    loadingSubmissions.value = true;
    const token = user.value?.token || localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    const { data } = await axios.get(`${API_URL}/events/${eventId}/submissions`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    submissionsList.value = Array.isArray(data) ? data : (data?.submissions || []);
  } catch (e) {
    submissionsList.value = [];
  } finally {
    loadingSubmissions.value = false;
  }
}

async function downloadAllSubmissionsZip(eventId) {
  try {
    const token = user.value?.token || localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    const resp = await axios.get(`${API_URL}/events/${eventId}/submissions/zip`, {
      responseType: 'blob',
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });

    const blob = new Blob([resp.data], { type: 'application/zip' });

    // Extraire le nom depuis Content-Disposition (si présent)
    const cd = resp.headers?.['content-disposition'] || '';
    let filename = '';
    if (cd) {
      const match = cd.match(/filename\*?=(?:UTF-8''|")?([^";\r\n]+)/i);
      if (match) {
        filename = decodeURIComponent(match[1].replace(/^"|"$/g, ''));
      }
    }

    // Toujours retirer l'extension du nom récupéré et forcer .zip
    const base =
      sanitizeName(filename) ||
      sanitizeName(popupEvent.value?.titre || popupEvent.value?.matiere || `soumissions_${eventId}`);
    const finalName = `${base}.zip`;

    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = finalName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(blobUrl);
  } catch (e) {
    console.warn('Download ZIP failed:', e?.message || e);
  }
}

const lastGroupZipDownloadName = ref('');

async function downloadGroupSubmissionsZip(eventId) {
  try {
    const token = user.value?.token || localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    const resp = await axios.get(`${API_URL}/events/${eventId}/group-submissions/zip`, {
      responseType: 'blob',
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });

    const blob = new Blob([resp.data], { type: 'application/zip' });

    const cd = resp.headers?.['content-disposition'] || '';
    let filename = '';
    if (cd) {
      const match = cd.match(/filename\*?=(?:UTF-8''|")?([^";\r\n]+)/i);
      if (match) filename = decodeURIComponent(match[1].replace(/^"|"$/g, ''));
    }

    const base = sanitizeName(filename) || `${sanitizeName(popupEvent.value?.titre || popupEvent.value?.matiere || `soumissions_${eventId}`)}_groupes`;
    const finalName = `${base}.zip`;

    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = finalName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(blobUrl);

    lastGroupZipDownloadName.value = finalName;
  } catch (e) {
    console.warn('Download group ZIP failed:', e?.message || e);
    if (e?.response?.status === 503) {
      await downloadGroupSubmissionsZipClient(eventId);
    }
  }
}

async function downloadGroupSubmissionsZipClient(eventId) {
  try {
    const token = user.value?.token || localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    const { data } = await axios.get(`${API_URL}/events/${eventId}/group-submissions`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    const rows = Array.isArray(data?.groups) ? data.groups : [];
    if (!rows.length) {
      alert('Aucune soumission à compresser.');
      return;
    }

    const zip = new JSZip();

    for (const row of rows) {
      const groupName = sanitizeName(row?.group?.name || 'SansGroupe');
      const gFolder = zip.folder(groupName) || zip;

      for (const s of (row?.submissions || [])) {
        const userName = sanitizeName(s?.userName || `user_${String(s?.user || '')}`);
        const uFolder = gFolder.folder(userName) || gFolder;

        for (const f of (s?.files || [])) {
          const url = getSubmissionFileUrl(f);
          try {
            const resp = await fetch(url, { credentials: 'omit' });
            if (!resp.ok) continue;
            const buf = await resp.arrayBuffer();
            const name = sanitizeName(displaySubmissionName(f));
            uFolder.file(name, buf);
          } catch (err) {
            console.warn('Fetch submission file failed:', err);
          }
        }
      }
    }

    const out = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });
    const base = `${sanitizeName(popupEvent.value?.titre || popupEvent.value?.matiere || `soumissions_${eventId}`)}_groupes`;
    const finalName = `${base}.zip`;
    saveAs(out, finalName);
    lastGroupZipDownloadName.value = finalName;
  } catch (err) {
    console.error('Client group ZIP generation failed:', err);
    alert('Échec de la génération locale du ZIP par groupes.');
  }
}

// Génération locale du ZIP (fallback)
async function downloadAllSubmissionsZipClient(eventId) {
  try {
    const token =
      user.value?.token ||
      localStorage.getItem('token') ||
      sessionStorage.getItem('token') ||
      '';
    const { data } = await axios.get(`${API_URL}/events/${eventId}/submissions`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    const list = Array.isArray(data) ? data : (data?.submissions || []);
    if (!list.length) {
      alert('Aucune soumission à compresser.');
      return;
    }

    const zip = new JSZip();

    // Séquentiel pour éviter une charge mémoire excessive
    for (const s of list) {
      const folderName = sanitizeName(s.userName || `user_${String(s.user)}`);
      const folder = zip.folder(folderName) || zip;
      for (const f of (s.files || [])) {
        const url = getSubmissionFileUrl(f);
        try {
          const resp = await fetch(url, { credentials: 'omit' });
          if (!resp.ok) continue;
          const buf = await resp.arrayBuffer();
          const name = sanitizeName(displaySubmissionName(f));
          folder.file(name, buf);
        } catch (err) {
          console.warn('Fetch submission file failed:', err);
        }
      }
    }

    const out = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });
    saveAs(out, `${sanitizeName(popupEvent.value?.titre || popupEvent.value?.matiere || 'fichiers')}.zip`);
  } catch (err) {
    console.error('Client ZIP generation failed:', err);
    alert('Échec de la génération locale du ZIP.');
  }
}

function getSubmissionFileUrl(s) {
  const name = s?.filename || s?.name || '';
  return name ? `${baseServerUrl}/uploads/submissions/${encodeURIComponent(name)}` : '';
}
async function downloadSubmissionFile(eventId, file) {
  try {
    const token = user.value?.token || localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    const url = `${API_URL}/events/${encodeURIComponent(eventId)}/submissions/${encodeURIComponent(file?.filename || file?.name || '')}/download`;
    const resp = await axios.get(url, {
      responseType: 'blob',
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });

    const dispo = resp.headers?.['content-disposition'] || '';
    const m = String(dispo).match(/filename\*?=(?:UTF-8'')?\"?([^\";]+)\"?/i);
    const suggested = m ? decodeURIComponent(m[1]) : (file?.originalname || file?.name || file?.filename || 'fichier');

    const blob = new Blob([resp.data], { type: file?.mimetype || 'application/octet-stream' });
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = suggested;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(blobUrl);
  } catch (e) {
    console.warn('Download submission file failed:', e?.message || e);
  }
}

function displaySubmissionName(s) {
  return s?.originalname || s?.name || s?.filename || 'Fichier';
}
function sanitizeName(str) {
  const base = String(str || '')
    .replace(/[/\\]+/g, '_')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/^_+|_+$/g, '');
  // Retire toute extension finale (ex: .vbb, .pdf, .docx) pour forcer .zip
  return base.replace(/\.[a-z0-9]{1,8}$/i, '');
}

function computeDelayHours(sub, ev) {
  try {
    if (!sub?.createdAt || !ev?.date || !ev?.heure) return 0;
    const [h, m] = String(ev.heure || '').split(':');
    const deadline = new Date(ev.date);
    deadline.setHours(Number(h), Number(m || 0), 0, 0);
    const submitted = new Date(sub.createdAt);
    const diffMs = submitted - deadline;
    if (diffMs <= 0) return 0;
    return Math.floor(diffMs / (1000 * 60 * 60));
  } catch {
    return 0;
  }
}

// AJOUT: formatage détaillé du retard (jours/heures/minutes)
function formatLateFromSubmitTime(submittedAt, ev) {
  try {
    if (!submittedAt || !ev?.date) return '';
    const [h, m] = String(ev.heure || '00:00').split(':');
    const deadline = new Date(ev.date);
    deadline.setHours(Number(h || 0), Number(m || 0), 0, 0);
    const submitted = new Date(submittedAt);
    const diffMs = submitted.getTime() - deadline.getTime();
    if (diffMs <= 0) return '';
    const totalMinutes = Math.floor(diffMs / 60000);
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;
    const parts = [];
    if (days > 0) parts.push(`${days}j`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}min`);
    return `${parts.join(' ')} de retard`;
  } catch {
    return '';
  }
}

// Utilitaire: formate des heures décimales en "Xh Ymin"
function formatLateHM(lateHours) {
  const totalMinutes = Math.floor(Number(lateHours || 0) * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}min`;
  if (h > 0) return `${h}h`;
  return `${m}min`;
}

// Nouveau: calcul du retard côté client à partir de submittedAt (local)
function isLateOnClient(submittedAt, ev) {
  try {
    if (!submittedAt || !ev?.date || !ev?.heure) return false;
    const [h, m] = String(ev.heure || '').split(':');
    const deadline = new Date(ev.date);
    deadline.setHours(Number(h), Number(m || 0), 0, 0);
    const submitted = new Date(submittedAt);
    return submitted.getTime() > deadline.getTime();
  } catch {
    return false;
  }
}

function computeLateHMFromSubmittedAt(submittedAt, ev) {
  try {
    if (!submittedAt || !ev?.date || !ev?.heure) return '0min';
    const [h, m] = String(ev.heure || '').split(':');
    const deadline = new Date(ev.date);
    deadline.setHours(Number(h), Number(m || 0), 0, 0);
    const submitted = new Date(submittedAt);
    const diffMs = submitted.getTime() - deadline.getTime();
    if (diffMs <= 0) return '0min';
    const totalMinutes = Math.round(diffMs / 60000);
    const hh = Math.floor(totalMinutes / 60);
    const mm = totalMinutes % 60;
    if (hh > 0 && mm > 0) return `${hh}h ${mm}min`;
    if (hh > 0) return `${hh}h`;
    return `${mm}min`;
  } catch {
    return '0min';
  }
}

// Dépôt étudiant (upload de fichiers par l'élève)
const studentAutoOpenSubmission = ref(false);
const studentSubmissionContainer = ref(null);
const studentSubmitInput = ref(null);
const studentSubmissionFiles = ref([]);
const noFileMessageText = ref("Vous n'avez pas déposé de fichier");
const loadingStudentSubmit = ref(false);
const studentSubmitMessage = ref('');
// Nouvel état: fichiers déjà déposés par l’élève
const mySubmissionFiles = ref([]);
const mySubmissionAt = ref(null);
const mySubmissionSubmittedAt = ref(null);
// Message de dépôt enregistré (élève)
const loadingMessageSave = ref(false);
const messageSaveStatus = ref('');
const mySubmissionMessageHtml = ref('');
// Retours du professeur (pour l'élève)
const myTeacherFeedbacks = ref([]);

// Éditeur local du message de dépôt
const submitEditorRef = ref(null);
const submitFileRef = ref(null);
const showEmojiSubmit = ref(false);

// Barre flottante pour le message de dépôt (submit)
const showSelectionToolbarSubmit = ref(false);
const selectionToolbarSubmitRef = ref(null);
const selectionFontSizeSubmit = ref('16');
const selectionFontFamilySubmit = ref('Inter');
const fontColorSubmit = ref('#111111');
const selectionToolbarPosSubmit = ref({ top: 0, left: 0 });
const selectionToolbarTransformSubmit = ref('none');
const selectionToolbarStyleSubmit = computed(() => {
  const isMobile = viewportWidth.value <= 1024;
  return {
    position: 'fixed',
    top: selectionToolbarPosSubmit.value.top + 'px',
    left: selectionToolbarPosSubmit.value.left + 'px',
    transform: selectionToolbarTransformSubmit.value,
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
    padding: '6px',
    zIndex: 1000000,
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: isMobile ? 'center' : 'flex-start',
    flexWrap: isMobile ? 'wrap' : 'nowrap',
    gap: '6px'
  };
});

// Auto-scroll vers la section Soumissions (prof/admin)
const teacherAutoOpenSubmissions = ref(false);
const profSubmissionsContainer = ref(null);

function onStudentFilesChange(e) {
  try {
    const files = Array.from(e?.target?.files || []);
    const filtered = files
      .slice(0, 10)
      .filter(f => /(\.pdf|\.docx?|\.zip|\.rar)$/i.test(String(f?.name || '')));
    studentSubmissionFiles.value = filtered;
  } catch {
    studentSubmissionFiles.value = [];
  }
}

function removeStudentFile(index) {
  try {
    if (index >= 0 && index < studentSubmissionFiles.value.length) {
      studentSubmissionFiles.value.splice(index, 1);
    }
  } catch {}
}

// Fonctions locales pour l'éditeur "message de dépôt"
function toggleEmojiSubmit() { showEmojiSubmit.value = !showEmojiSubmit.value; }
function submitFocusEditor() { try { submitEditorRef?.value?.focus(); } catch {} }
function submitApplyCmd(cmd) {
  try { submitFocusEditor(); document.execCommand(cmd, false); } catch {}
}
function insertEmojiSubmit(emoji) {
  try { submitFocusEditor(); document.execCommand('insertText', false, emoji); } catch {}
}
function submitInsertImageUrl() {
  const url = window.prompt('URL image'); if (!url) return;
  try {
    submitFocusEditor();
    document.execCommand('insertImage', false, url);
    selectLastImage('submit');
    imageWidthSubmit.value = 100;
    applyImageWidthIn('submit');
  } catch {}
}
function onSubmitImageFile(e) {
  const fileInput = e?.target;
  const file = fileInput?.files?.[0];
  if (!file) return;
  const max = 800 * 1024; // 800 Ko
  if (file.size > max) {
    alert('Image trop lourde (max 800ko)');
    if (fileInput) fileInput.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    try {
      submitFocusEditor();
      document.execCommand('insertImage', false, String(reader.result));
      selectLastImage('submit');
      imageWidthSubmit.value = 100;
      applyImageWidthIn('submit');
    } catch {}
    if (fileInput) fileInput.value = '';
  };
  reader.onerror = () => { if (fileInput) fileInput.value = ''; };
  reader.readAsDataURL(file);
}

// Charger la soumission de l’élève pour l’événement courant
async function loadMySubmission(eventId) {
  try {
    const token = user.value?.token || localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    const { data } = await axios.get(`${API_URL}/events/${eventId}/my-submission`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    mySubmissionFiles.value = Array.isArray(data?.files) ? data.files : [];
    mySubmissionAt.value = data?.submittedAt || null;
    mySubmissionSubmittedAt.value = data?.submittedAt || null;

    // Ajout: message élève + retours prof (si fournis par l’API)
    mySubmissionMessageHtml.value = data?.messageHtml || '';
    myTeacherFeedbacks.value = Array.isArray(data?.teacherFeedbacks) ? data.teacherFeedbacks : [];

    // Pré-remplir l’éditeur avec le message existant
    try { if (submitEditorRef?.value) submitEditorRef.value.innerHTML = mySubmissionMessageHtml.value || ''; } catch {}
  } catch (e) {
    mySubmissionFiles.value = [];
    mySubmissionAt.value = null;
    mySubmissionSubmittedAt.value = null;
    mySubmissionMessageHtml.value = '';
    myTeacherFeedbacks.value = [];
  }
}

async function submitStudentFiles(eventId) {
  if (!user.value) return alert('Non connecté');
  if (!eventId) return;
  try {
    loadingStudentSubmit.value = true;
    studentSubmitMessage.value = '';
    const fd = new FormData();
    (studentSubmissionFiles.value || []).forEach(f => fd.append('files', f));
    // Ajout: message HTML facultatif saisi par l'étudiant
    const msgHtml = submitEditorRef?.value?.innerHTML || '';
    fd.append('messageHtml', msgHtml);
    const token = user.value?.token || localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    await axios.post(`${API_URL}/events/${eventId}/submissions`, fd, {
      headers: token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } : { 'Content-Type': 'multipart/form-data' }
    });
    studentSubmitMessage.value = 'Dépôt réussi.';
    studentSubmissionFiles.value = [];
    try { if (studentSubmitInput && studentSubmitInput.value) studentSubmitInput.value.value = ''; } catch {}
    // Réinitialiser l'éditeur de message après succès
    try { if (submitEditorRef && submitEditorRef.value) submitEditorRef.value.innerHTML = ''; } catch {}
    showEmojiSubmit.value = false;
    // Rafraîchir la liste de mes fichiers déposés
    try { await loadMySubmission(eventId); } catch {}
  } catch (e) {
    console.warn('Student submit failed:', e?.message || e);
    studentSubmitMessage.value = e?.response?.data?.message || 'Erreur durant le dépôt.';
  } finally {
    loadingStudentSubmit.value = false;
  }
}

async function saveMySubmissionMessage(eventId) {
  if (!user.value) return alert('Non connecté');
  if (!eventId) return;
  try {
    loadingMessageSave.value = true;
    messageSaveStatus.value = '';
    const msgHtml = submitEditorRef?.value?.innerHTML || '';
    const token = user.value?.token || localStorage.getItem('token') || sessionStorage.getItem('token') || '';

    // Préférence: endpoint dédié (si présent)
    try {
      await axios.put(`${API_URL}/events/${eventId}/my-submission/message`, { messageHtml: msgHtml }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
    } catch (e) {
      // Fallback: basculer sur POST /submissions sans fichiers
      if (e?.response?.status === 404) {
        const fd = new FormData();
        fd.append('messageHtml', msgHtml);
        await axios.post(`${API_URL}/events/${eventId}/submissions`, fd, {
          headers: token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } : { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        throw e;
      }
    }

    messageSaveStatus.value = 'Message enregistré.';
    await loadMySubmission(eventId);
  } catch (e) {
    messageSaveStatus.value = e?.response?.data?.message || 'Erreur lors de l’enregistrement.';
  } finally {
    loadingMessageSave.value = false;
  }
}

// Suppression d’un fichier déposé par l’élève
async function deleteMySubmissionFile(eventId, filename) {
  try {
    const token = user.value?.token || localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    await axios.delete(`${API_URL}/events/${eventId}/my-submission/${encodeURIComponent(filename)}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    studentSubmitMessage.value = 'Fichier supprimé.';
    await loadMySubmission(eventId);
  } catch (e) {
    studentSubmitMessage.value = e?.response?.data?.message || 'Erreur lors de la suppression.';
  }
}

// URL des pièces jointes pour l'événement en édition
function getEventAttachmentUrl(att) {
  const name = att?.filename || att?.name || att?.path || '';
  return name ? `${baseServerUrl}/uploads/events/${encodeURIComponent(name)}` : '';
}
// Variante download (édition) : via API pour conserver le nom original
function getEventAttachmentDownloadUrl(att) {
  const name = att?.filename || att?.name || att?.path || '';
  const id = editingEvent.value?._id || popupEvent.value?._id;
  return name && id ? `${API_URL}/events/${encodeURIComponent(id)}/attachments/${encodeURIComponent(name)}/download` : '';
}

// Formatage taille fichier (réutilise formatBytes)
function formatBytesCommon(bytes) {
  return formatBytes(bytes);
}

// Charger les pièces jointes pour l'événement en édition si absentes
async function ensureEditAttachmentsLoaded() {
  const ev = editingEvent.value;
  if (!ev || Array.isArray(ev.attachments)) return;
  try {
    const res = await axios.get(`${API_URL}/events/${ev._id}/attachments`, { headers: user.value?.token ? { Authorization: `Bearer ${user.value.token}` } : {} });
    const arr = Array.isArray(res.data) ? res.data : (res.data?.attachments || []);
    editingEvent.value = { ...ev, attachments: arr };
  } catch (e) {
    console.warn('Edit attachments fetch failed:', e?.message || e);
  }
}

// Suppression d'une pièce jointe de l'événement en édition
async function removeAttachment(att) {
  const ev = editingEvent.value;
  if (!ev || !att) return;
  if (!user.value) return alert('Non connecté');
  try {
    const token = user.value.token;
    const filename = att?.filename || att?.name || att?.path;
    if (!filename) return;
    await axios.delete(`${API_URL}/events/${ev._id}/attachments/${encodeURIComponent(filename)}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const current = Array.isArray(ev.attachments) ? ev.attachments : [];
    editingEvent.value = { ...ev, attachments: current.filter(a => (a?.filename || a?.name || a?.path) !== filename) };
  } catch (e) {
    console.error('Erreur suppression pièce jointe:', e);
    alert('Erreur lors de la suppression de la pièce jointe.');
  }
}

function linkifyHtml(input) {
  if (!input) return '';
  // Si déjà des liens HTML, on laisse tel quel
  if (/<a\s[^>]*href=/i.test(input)) return input;
  const urlRegex = /((https?:\/\/)|www\.)[^\s<]+/gi;
  return String(input).replace(urlRegex, (rawUrl) => {
    const href = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
    const safeHref = href.replace(/\"/g, '&quot;');
    return `<a href="${safeHref}" target="_blank" rel="noopener noreferrer">${rawUrl}</a>`;
  });
}

function sanitizeClientHtml(input) {
  try {
    if (!input) return '';
    let html = String(input);
    html = html.replace(/<\s*(script|iframe|object|embed|link|meta)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '');
    html = html.replace(/<\s*(script|iframe|object|embed|link|meta)[^>]*\/>/gi, '');
    html = html.replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
    html = html.replace(/(href|src)\s*=\s*(["'])\s*javascript:[^\2]*\2/gi, '$1="#"');
    return html;
  } catch { return ''; }
}

function hasVisibleHtml(input) {
  const raw = String(input || '');
  const text = raw
    .replace(/<br\s*\/>?/gi, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .trim();
  if (text.length > 0) return true;
  return /<(img|video|audio|iframe|svg|canvas)\b/i.test(raw);
}

const popupDescriptionHtml = computed(() => linkifyHtml(sanitizeClientHtml(popupEvent.value?.description || '')));

// Added: ensure anchors in rendered HTML open safely on click
function onDisplayHtmlClick(e) {
  try {
    const t = e.target;
    // Assurer que les liens s'ouvrent en toute sécurité
    const a = t && typeof t.closest === 'function' ? t.closest('a') : null;
    if (a) {
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer');
    }
    // Si une image est cliquée (ou dans un lien), ouvrir la popover de lien (contexte submit)
    const img = t && typeof t.closest === 'function' ? t.closest('img') : (t && t.tagName === 'IMG' ? t : null);
    if (img) {
      openImageLinkPopover('submit', img);
    }
  } catch {}
}

// Recharge l’événement pour obtenir l’état le plus récent (ex: submissionEnabled)
async function refreshPopupEventById(id) {
  try {
    const token = user.value?.token || localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    const res = await axios.get(`${API_URL}/events`, token ? { headers: { Authorization: `Bearer ${token}` } } : {});
    const fresh = Array.isArray(res.data) ? res.data.find(e => e._id === id) : null;
    if (fresh) {
      popupEvent.value = fresh;
      return fresh;
    }
  } catch (e) {
    console.warn('refreshPopupEventById failed:', e?.message || e);
  }
  return null;
}

function openDeposit(event) {
  studentAutoOpenSubmission.value = true;
  openPopup(event);
}
function openPopup(event) {
  popupEvent.value = event;
  if (!event?.isProposal) {
    markTaskAsSeen(event);
  }
  try { if (window.innerWidth > 1024) document.body.style.overflow = 'hidden' } catch {}
  ensureAttachmentsLoaded();
  if (!event?.isProposal) {
    try { window.dispatchEvent(new CustomEvent('task-info-opened', { detail: { taskId: event._id } })) } catch {}
  }

  // Met à jour la pop-up avec l’événement frais (inclut submissionEnabled à jour)
  refreshPopupEventById(event._id).then((fresh) => {
    const evForSubmission = fresh || event;

    // Charger les groupes de travail si activés
    if (evForSubmission.groupWorkEnabled) {
      fetchWorkGroups(evForSubmission._id);
      ensureUsersCache();
      if (user.value && (user.value.role === 'prof' || user.value.role === 'admin') && evForSubmission.submissionEnabled) {
        fetchGroupAggSubmissions(evForSubmission._id);
      }
      if (user.value && (user.value.role === 'eleve' || user.value.role === 'etudiant' || user.value.role === 'delegue') && evForSubmission.submissionEnabled) {
        fetchMyGroupAgg(evForSubmission._id);
      }
    } else {
      workGroups.value = [];
    }

    if (user.value && (user.value.role === 'prof' || user.value.role === 'admin') && evForSubmission.submissionEnabled) {
      fetchSubmissions(evForSubmission._id);
    } else {
      submissionsList.value = [];
    }
    // Élève/délégué: charger mes fichiers déposés
    if (user.value && (user.value.role === 'eleve' || user.value.role === 'etudiant' || user.value.role === 'delegue') && evForSubmission.submissionEnabled) {
      loadMySubmission(evForSubmission._id).catch(() => {});
    }

    // Auto-scroll et auto-ouverture du sélecteur de fichiers si l’élève a cliqué sur "Déposer"
    // Et auto-scroll vers la section Soumissions si le professeur/admin a cliqué sur "Voir le dépôt"
    nextTick(() => {
      if (studentAutoOpenSubmission.value) {
        try { studentSubmissionContainer?.value?.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch {}
        try { studentSubmitInput?.value?.click(); } catch {}
        studentAutoOpenSubmission.value = false;
      }
      if (teacherAutoOpenSubmissions.value) {
        try { profSubmissionsContainer?.value?.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch {}
        teacherAutoOpenSubmissions.value = false;
      }
    });
  });
}
function closePopup() {
  popupEvent.value = null;
  try { if (window.innerWidth > 1024) document.body.style.overflow = '' } catch {}
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

// Indicateur “retard” dans Mes tâches (pas d'examens, non archivé)
function shouldMarkLateInMyTasks(ev) {
  return isLate(ev);
}

// Label texte “Retard” (mêmes critères)
function shouldLabelRetard(ev) {
  return user.value && user.value.role === 'delegue' && isLate(ev);
}

const emit = defineEmits(['refresh-events']);

async function archiverTout() {
  if (!user.value) return alert('Non connecté');
  const eventsToArchive = doneEvents.value.filter(e => !e.archived);
  try {
    const token = user.value.token;
    const role = user.value.role;
    const needsSubmission = role === 'eleve' || role === 'etudiant' || role === 'delegue';

    const allowed = [];
    const blocked = [];
    for (const event of eventsToArchive) {
      if (!event.isProposal && needsSubmission && event.submissionEnabled) {
        try {
          const { data } = await axios.get(`${API_URL}/events/${event._id}/my-submission`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const hasFiles = Array.isArray(data?.files) && data.files.length > 0;
          if (!hasFiles) { blocked.push(event); continue; }
        } catch { blocked.push(event); continue; }
      }
      allowed.push(event);
    }

    for (const event of allowed) {
      if (event.isProposal) {
        await axios.post(`${API_URL}/events/proposals/${event._id}/archive`, {}, { headers: { Authorization: `Bearer ${user.value.token}` } });
      } else {
        await axios.post(`${API_URL}/events/${event._id}/archive`, {}, { headers: { Authorization: `Bearer ${user.value.token}` } });
      }
      event.archived = true;
      const uid = user.value?._id || user.value?.id;
      if (uid) {
        const base = Array.isArray(event.archivedBy) ? event.archivedBy : [];
        const ids = base.map(x => (x && x._id ? x._id : x));
        if (!ids.includes(uid)) event.archivedBy = [...base, uid];
      }
    }

    emit('refresh-events');
    playSound(archiverSound)

    if (blocked.length) {
      const names = blocked.map(e => e.titre || e.matiere || 'Tâche').join(', ');
      alert(`Non archivé (dépôt requis): ${names}`);
    }
  } catch (error) {
    alert("Erreur lors de l'archivage des tâches.");
    console.error(error);
  }
}

// Vider les retards: masquage pour l'utilisateur courant (sans supprimer de la base)
async function viderRetards() {
  if (!user.value) return alert('Non connecté');
  try {
    const token = user.value.token;
    const blocked = [];
    const allowed = [];
    const role = user.value.role;
    const needsSubmission = role === 'eleve' || role === 'etudiant' || role === 'delegue';

    for (const ev of lateEvents.value.slice()) {
      if (needsSubmission && ev.submissionEnabled) {
        try {
          const { data } = await axios.get(`${API_URL}/events/${ev._id}/my-submission`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const hasFiles = Array.isArray(data?.files) && data.files.length > 0;
          if (!hasFiles) {
            blocked.push(ev);
            continue;
          }
        } catch {
          blocked.push(ev);
          continue;
        }
      }
      allowed.push(ev);
    }

    for (const ev of allowed) {
      try {
        await axios.delete(`${API_URL}/events/${ev._id}`, { headers: { Authorization: `Bearer ${token}` } });
      } catch (err) {
        // Si le backend refuse (garde boîte de dépôt), on bascule cette tâche en bloquée
        const status = err?.response?.status;
        const msg = String(err?.response?.data?.message || '');
        const isDepositGuard = status === 400 && /d[ée]p[ôo]t/i.test(msg);
        if (isDepositGuard) {
          blocked.push(ev);
        }
      }
    }

    if (blocked.length) {
      blockedLateTasks.value = blocked;
      showBlockedLatePopup.value = true;
    }

    emit('refresh-events');
  } catch (e) {
    console.error('Erreur vider retards:', e);
    alert('Erreur lors du vidage des retards.');
  }
}

const userId = user.value && (user.value._id || user.value.id);
const archivesFiltered = computed(() =>
  props.events.filter(e =>
    e.archivedBy && e.archivedBy.some(id => id === userId || (id._id && id._id === userId))
    && (!selectedMatiere.value || e.matiere === selectedMatiere.value)
    && matchesProfFilters(e)
  )
);

async function viderArchive() {
  if (!user.value) return alert('Non connecté');
  if (!confirm('Voulez-vous vraiment désarchiver toutes les tâches archivées ?')) return;
  try {
    for (const event of archivesFiltered.value.slice()) {
      // 1) Retirer des archives
      await axios.post(`${API_URL}/events/${event._id}/unarchive`, {}, { headers: { Authorization: `Bearer ${user.value.token}` } });
      // 2) Retirer l'état "complété" pour ne pas réapparaître dans la liste "Tâches complétées"
      try {
        await axios.post(`${API_URL}/events/${event._id}/uncheck`, {}, { headers: { Authorization: `Bearer ${user.value.token}` } });
      } catch (e) { /* tolérant si déjà décoché */ }
      // 3) Tenter la suppression définitive (réussit si autorisé côté backend)
      try {
        await axios.delete(`${API_URL}/events/${event._id}`, { headers: { Authorization: `Bearer ${user.value.token}` } });
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
      await axios.post(`${API_URL}/events/${event._id}/unarchive`, {}, { headers: { Authorization: `Bearer ${user.value.token}` } });
      try { await axios.post(`${API_URL}/events/${event._id}/uncheck`, {}, { headers: { Authorization: `Bearer ${user.value.token}` } }); } catch {}
      try { await axios.delete(`${API_URL}/events/${event._id}`, { headers: { Authorization: `Bearer ${user.value.token}` } }); } catch {}
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
      await axios.post(`${API_URL}/events/${event._id}/unarchive`, {}, { headers: { Authorization: `Bearer ${user.value.token}` } });
      try { await axios.post(`${API_URL}/events/${event._id}/uncheck`, {}, { headers: { Authorization: `Bearer ${user.value.token}` } }); } catch {}
      try { await axios.delete(`${API_URL}/events/${event._id}`, { headers: { Authorization: `Bearer ${user.value.token}` } }); } catch {}
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
      await axios.post(`${API_URL}/events/${event._id}/unarchive`, {}, { headers: { Authorization: `Bearer ${user.value.token}` } });
      try { await axios.post(`${API_URL}/events/${event._id}/uncheck`, {}, { headers: { Authorization: `Bearer ${user.value.token}` } }); } catch {}
      try { await axios.delete(`${API_URL}/events/${event._id}`, { headers: { Authorization: `Bearer ${user.value.token}` } }); } catch {}
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
const successMessage = ref('Tâche ajoutée avec succès !');
const showErrorPopup = ref(false);
const errorMsg = ref('');
// Popup: tâches en retard bloquées (boîte de dépôt sans fichiers)
const showBlockedLatePopup = ref(false);
const blockedLateTasks = ref([]);

const loadingAdd = ref(false);
const dateInput = ref(null);
const timeInput = ref(null);
const draftGroupCountAdd = ref(1);
const draftGroupCountEdit = ref(1);
const editGroupsDraft = ref([]);
const newTask = ref({
  titre: '',
  type: 'devoir',
  matiere: '',
  date: '',
  heure: '',
  description: '',
  groupes: [],
  year: '',
  specialite: '',
  submissionEnabled: false,
  groupWorkEnabled: false,
  workGroupsDraft: []
});
const addEditorRef = ref(null);
const showAddDescLabel = ref(true);
const addFileRef = ref(null);
const editFileRef = ref(null);
const popupContentAddRef = ref(null);
const popupContentMyTasksRef = ref(null);
let touchStartYAdd = 0;
let touchStartYMy = 0;
function routeWheelAdd(e) { const el = popupContentAddRef.value; if (!el) return; el.scrollTop += e.deltaY }
function onAddTouchStart(e) { touchStartYAdd = e.touches && e.touches[0] ? e.touches[0].clientY : 0 }
function onAddTouchMove(e) { const el = popupContentAddRef.value; if (!el) return; const y = e.touches && e.touches[0] ? e.touches[0].clientY : 0; const delta = touchStartYAdd - y; touchStartYAdd = y; el.scrollTop += delta }
function routeWheelMy(e) { const el = popupContentMyTasksRef.value; if (!el) return; el.scrollTop += e.deltaY }
function onMyTouchStart(e) { touchStartYMy = e.touches && e.touches[0] ? e.touches[0].clientY : 0 }
function onMyTouchMove(e) { const el = popupContentMyTasksRef.value; if (!el) return; const y = e.touches && e.touches[0] ? e.touches[0].clientY : 0; const delta = touchStartYMy - y; touchStartYMy = y; el.scrollTop += delta }
const popupContentEditRef = ref(null);
const popupContentEditFormRef = ref(null);
function routeWheelInfo(e) { const el = popupContentEditRef.value; if (!el) return; el.scrollTop += e.deltaY }
function routeWheelEdit(e) { const el = popupContentEditFormRef.value; if (!el) return; el.scrollTop += e.deltaY }
function onOverlayWheelAdd(e) { if (window.innerWidth > 1024) { e.preventDefault(); e.stopPropagation(); routeWheelAdd(e) } }
function onOverlayWheelMy(e) { if (window.innerWidth > 1024) { e.preventDefault(); e.stopPropagation(); routeWheelMy(e) } }
function onOverlayWheelInfo(e) { if (window.innerWidth > 1024) { e.preventDefault(); e.stopPropagation(); routeWheelInfo(e) } }
function onOverlayWheelEdit(e) { if (window.innerWidth > 1024) { e.preventDefault(); e.stopPropagation(); routeWheelEdit(e) } }
const addDocRef = ref(null);
const addDocFiles = ref([]);
const editDocRef = ref(null);
const editDocFiles = ref([]);
function onDocFileChangeEdit(e) {
  editDocFiles.value = Array.from(e?.target?.files || []).slice(0, 10);
}
function removeEditDocFile(index) {
  if (index >= 0 && index < editDocFiles.value.length) {
    editDocFiles.value.splice(index, 1);
  }
}
const fontSizeAdd = ref('16');
const fontColorAdd = ref('#111111');
const showEmojiAdd = ref(false);
const showEmojiEdit = ref(false);
const showSpecSelect = computed(() => {
  const u = user.value || {};
  if (u.role === 'prof' || u.role === 'admin') return true;
  if (u.role === 'delegue') {
    const y = String(u.year || '').toUpperCase();
    return y === 'BUT2' || y === 'BUT3' || y === '2' || y === '3';
  }
  return false;
});
const emojis = ['😀','😁','😂','🤣','😊','😍','🤩','😎','😇','🤔','👍','🔥','🎉','🎯','✅','❌','📌','📎','📝','⏰','📅','📚','💡','⚠️','⭐','✨','🚀'];
function toggleEmoji(which) {
  if (which === 'add') showEmojiAdd.value = !showEmojiAdd.value;
  else showEmojiEdit.value = !showEmojiEdit.value;
}
function insertEmoji(which, emoji) {
  try {
    // S’assurer que l’emoji s’insère dans l’éditeur prof actif
    if (which === 'teacher') {
      const id = activeTeacherEditorId.value;
      if (id) focusTeacherEditor(id);
    }
    document.execCommand('insertText', false, emoji);
  } catch {}
}
let lastSelectionAdd = null;
let lastSelectionEdit = null;
let lastSelectionSubmit = null;

function getActiveSelectionEditor() {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  let range;
  try { range = sel.getRangeAt(0); } catch { return null; }
  return whichEditorForNode(range.commonAncestorContainer);
}

function saveCurrentSelection() {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;
  let range;
  try { range = sel.getRangeAt(0).cloneRange(); } catch { return; }
  const which = whichEditorForNode(range.commonAncestorContainer);
  if (which === 'add') lastSelectionAdd = range;
  else if (which === 'edit') lastSelectionEdit = range;
  else if (which === 'submit') lastSelectionSubmit = range;
}

function focusEditor(which) {
  const el = which === 'add' ? addEditorRef.value : (which === 'edit' ? editEditorRef.value : submitEditorRef.value);
  if (el) el.focus();
}

function restoreSelection(which) {
  const sel = window.getSelection();
  if (!sel) return;
  sel.removeAllRanges();
  const rng = which === 'add' ? lastSelectionAdd : (which === 'edit' ? lastSelectionEdit : lastSelectionSubmit);
  if (rng) sel.addRange(rng);
}

function focusEditorAndPreserveSelection(which) {
  saveCurrentSelection();
  focusEditor(which);
  restoreSelection(which);
}

function applyCmd(cmd) {
  try {
    const which = getActiveSelectionEditor()
      || (showSelectionToolbarAdd.value ? 'add'
      : (showSelectionToolbarEdit.value ? 'edit'
      : (showSelectionToolbarSubmit.value ? 'submit' : null)));
    if (which) focusEditorAndPreserveSelection(which);
    document.execCommand(cmd, false);
  } catch {}
}
function applyFontSize(which) {
  try {
    const size = which === 'add' ? fontSizeAdd.value : fontSizeEdit.value;
    document.execCommand('fontSize', false, '7');
    const el = which === 'add' ? addEditorRef.value : editEditorRef.value;
    const fonts = el.querySelectorAll('font[size="7"]');
    fonts.forEach(n => { n.removeAttribute('size'); n.style.fontSize = size + 'px'; });
  } catch {}
}
function applyFontColor(which) {
  try {
    const color =
      which === 'add' ? fontColorAdd.value :
      which === 'edit' ? fontColorEdit.value :
      fontColorSubmit.value; // Ajout: submit
    document.execCommand('foreColor', false, color);
  } catch {}
}
function insertImageUrl(which) {
  const url = window.prompt('URL image'); if (!url) return;

  // Support éditeur prof
  if (which === 'teacher') {
    try {
      const id = activeTeacherEditorId.value;
      const el = (id && teacherEditorRefs[id]) ? teacherEditorRefs[id] : null;
      if (!el) return;
      try { el.focus(); } catch {}
      document.execCommand('insertImage', false, url);
      // Normaliser l’image insérée pour ne pas casser la mise en page
      try {
        const imgs = el.querySelectorAll('img');
        const img = imgs && imgs.length ? imgs[imgs.length - 1] : null;
        if (img) {
          img.style.maxWidth = '100%';
          img.style.height = 'auto';
          img.style.display = 'block';
        }
      } catch {}
      // maj du modèle du commentaire prof
      onTeacherEditorInput(id);
    } catch {}
    return;
  }

  try {
    document.execCommand('insertImage', false, url);
    selectLastImage(which);
    applyImageWidthIn(which);
    if (which === 'add') syncAddEditorToModel();
  } catch {}
}
function onImageFile(which, e) {
  const fileInput = e?.target;
  const file = fileInput?.files?.[0];
  if (!file) return;

  // Limite de taille: 800 Ko
  const max = 800 * 1024;
  if (file.size > max) {
    alert('Image trop lourde (max 800ko)');
    if (fileInput) fileInput.value = '';
    return;
  }

  // Choisir la racine selon le contexte
  const el =
    which === 'add' ? addEditorRef.value :
    which === 'edit' ? editEditorRef.value :
    which === 'teacher' ? teacherEditorRefs[activeTeacherEditorId.value] :
    submitEditorRef.value;

  if (!el) {
    if (fileInput) fileInput.value = '';
    return;
  }

  try { el.focus(); } catch {}

  const reader = new FileReader();
  reader.onload = () => {
    try {
      document.execCommand('insertImage', false, String(reader.result));

      if (which === 'teacher') {
        // Normaliser l’image et mettre à jour le modèle du commentaire prof
        try {
          const imgs = el.querySelectorAll('img');
          const img = imgs && imgs.length ? imgs[imgs.length - 1] : null;
          if (img) {
            img.style.maxWidth = '100%';
            img.style.height = 'auto';
            img.style.display = 'block';
          }
        } catch {}
        onTeacherEditorInput(activeTeacherEditorId.value);
      } else {
        selectLastImage(which);
        applyImageWidthIn(which);
        if (which === 'add') syncAddEditorToModel();
      }
    } catch {}
    if (fileInput) fileInput.value = '';
  };
  reader.onerror = () => { if (fileInput) fileInput.value = ''; };
  reader.readAsDataURL(file);
}

// Ajout: gestion des pièces jointes PDF/DOCX — stocker les fichiers sélectionnés (limite 10)
function onDocFileChange(e) {
  addDocFiles.value = Array.from(e?.target?.files || []).slice(0, 10);
}
// Permettre de retirer un fichier sélectionné avant l'envoi
function removeAddDocFile(index) {
  try {
    if (index >= 0 && index < addDocFiles.value.length) {
      addDocFiles.value.splice(index, 1);
    }
  } catch {}
}

// Générer un brouillon de groupes (création de tâche)
function generateDraftGroups(mode) {
  const count = mode === 'edit'
    ? Math.min(20, Math.max(1, Number(draftGroupCountEdit.value || 1)))
    : Math.min(20, Math.max(1, Number(draftGroupCountAdd.value || 1)));

  const arr = Array.from({ length: count }, (_, i) => ({ name: `Groupe ${i + 1}`, capacity: 3 }));
  if (mode === 'edit') {
    editGroupsDraft.value = arr;
  } else {
    if (!Array.isArray(newTask.value.workGroupsDraft)) newTask.value.workGroupsDraft = [];
    newTask.value.workGroupsDraft = arr;
  }
}

function onAddEditorInput() {
  try {
    const content = (addEditorRef.value && addEditorRef.value.textContent) ? addEditorRef.value.textContent.trim() : '';
    showAddDescLabel.value = content.length === 0;
  } catch { showAddDescLabel.value = true }
  // Synchroniser le brouillon avec le modèle pour persistance
  syncAddEditorToModel();
}
// Nouvelle fonction: synchroniser le HTML de l'éditeur avec le modèle newTask.description
function syncAddEditorToModel() {
  try { newTask.value.description = String(addEditorRef?.value?.innerHTML || ''); } catch {}
}
function onEditEditorInput() { /* placeholder visuel intégré via :empty:before */ }

const selectedImageAdd = ref(null);
const selectedImageEdit = ref(null);
const selectedImageSubmit = ref(null);
const imageWidthAdd = ref(100);
const imageWidthEdit = ref(100);
const imageWidthSubmit = ref(100);
function selectLastImage(which) {
  const root =
    which === 'add' ? addEditorRef.value :
    which === 'edit' ? editEditorRef.value :
    submitEditorRef.value;
  if (!root) return;
  const imgs = root.querySelectorAll('img');
  if (!imgs || !imgs.length) return;
  const img = imgs[imgs.length - 1];
  if (which === 'add') selectedImageAdd.value = img;
  else if (which === 'edit') selectedImageEdit.value = img;
  else selectedImageSubmit.value = img;
}
function applyImageWidthIn(which) {
  const img =
    which === 'add' ? selectedImageAdd.value :
    which === 'edit' ? selectedImageEdit.value :
    selectedImageSubmit.value;
  const w =
    which === 'add' ? imageWidthAdd.value :
    which === 'edit' ? imageWidthEdit.value :
    imageWidthSubmit.value;
  if (!img) return;
  img.style.width = w + 'px';
  img.style.maxWidth = '100%';
  img.style.height = 'auto';
  img.style.display = 'block';
  if (which === 'add') {
    syncAddEditorToModel();
  } else if (which === 'edit') {
    onEditEditorInput();
  } else {
    // Pas de modèle lié pour submit; rien à synchroniser
  }
}
function fitImageToEditorIn(which) {
  const root =
    which === 'add' ? addEditorRef.value :
    which === 'edit' ? editEditorRef.value :
    submitEditorRef.value;
  if (!root) return;
  const editorWidth = root.clientWidth - 20;
  if (which === 'add') imageWidthAdd.value = Math.max(80, Math.min(592, editorWidth));
  else if (which === 'edit') imageWidthEdit.value = Math.max(80, Math.min(592, editorWidth));
  else imageWidthSubmit.value = Math.max(80, Math.min(592, editorWidth));
  applyImageWidthIn(which);
}

// Choix des polices (font-family) — Kobi EV retirée
const availableFonts = [
  { label: 'Cobe Heavy', value: 'Cobe Heavy' },
  { label: 'Inter', value: 'Inter' },
  { label: 'Georgia', value: 'Georgia' },
  { label: 'Times New Roman', value: 'Times New Roman' },
  { label: 'Arial Black', value: 'Arial Black' },
  { label: 'Courier New', value: 'Courier New' },
  { label: 'Trebuchet MS', value: 'Trebuchet MS' },
  { label: 'Impact', value: 'Impact' },
  { label: 'Roboto', value: 'Roboto' },
  { label: 'Montserrat', value: 'Montserrat' },
  { label: 'Poppins', value: 'Poppins' }
];
const fontFamilyAdd = ref('Cobe Heavy');
const fontFamilyEdit = ref('Cobe Heavy');
function applyFontFamily(which) {
  try {
    const family = which === 'add' ? fontFamilyAdd.value : fontFamilyEdit.value;
    document.execCommand('fontName', false, family);
    const el = which === 'add' ? addEditorRef.value : editEditorRef.value;
    const fonts = el.querySelectorAll('font[face]');
    fonts.forEach(n => { n.style.fontFamily = family; n.removeAttribute('face'); });
  } catch {}
}

// Popover pour lier une image à un lien
const showImageLinkPopoverAdd = ref(false);
const showImageLinkPopoverEdit = ref(false);
const showImageLinkPopoverSubmit = ref(false);
const imageLinkAdd = ref('');
const imageLinkEdit = ref('');
const imageLinkSubmit = ref('');
const imageLinkPopoverAddRef = ref(null);
const imageLinkPopoverEditRef = ref(null);
const imageLinkPopoverSubmitRef = ref(null);
const popoverPosAdd = ref({ top: 0, left: 0 });
const popoverPosEdit = ref({ top: 0, left: 0 });
const popoverPosSubmit = ref({ top: 0, left: 0 });
const popoverStyleAdd = computed(() => ({
  position: 'fixed',
  top: popoverPosAdd.value.top + 'px',
  left: popoverPosAdd.value.left + 'px',
  transform: 'none',
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
  padding: '10px',
  zIndex: 999999,
  minWidth: '380px',
  maxWidth: '95vw',
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}));
const popoverStyleEdit = computed(() => ({
  position: 'fixed',
  top: popoverPosEdit.value.top + 'px',
  left: popoverPosEdit.value.left + 'px',
  transform: 'none',
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
  padding: '10px',
  zIndex: 999999,
  minWidth: '380px',
  maxWidth: '95vw',
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}));
const popoverStyleSubmit = computed(() => ({
  position: 'fixed',
  top: popoverPosSubmit.value.top + 'px',
  left: popoverPosSubmit.value.left + 'px',
  transform: 'none',
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
  padding: '10px',
  zIndex: 999999,
  minWidth: '380px',
  maxWidth: '95vw',
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}));

// Panneaux flottants de redimensionnement d’image (fixes)









function getImagePopoverSize(which) {
  const el =
    which === 'add' ? imageLinkPopoverAddRef.value :
    which === 'edit' ? imageLinkPopoverEditRef.value :
    imageLinkPopoverSubmitRef.value;
  if (el) {
    try {
      const r = el.getBoundingClientRect();
      return { width: Math.round(r.width), height: Math.round(r.height) };
    } catch {}
  }
  // Fallback avant montage
  return { width: 380, height: 44 };
}

function positionImagePopover(which, img) {
  const rect = img.getBoundingClientRect();
  const gap = 8;
  const belowY = rect.bottom + gap;
  const centerX = rect.left + (rect.width / 2);

  const { width: pw } = getImagePopoverSize(which);
  const viewportWidth = document.documentElement.clientWidth;

  let left = Math.round(centerX - (pw / 2));
  left = Math.max(8, Math.min(left, viewportWidth - pw - 8));

  if (which === 'add') {
    popoverPosAdd.value = { top: belowY, left };
  } else if (which === 'edit') {
    popoverPosEdit.value = { top: belowY, left };
  } else {
    popoverPosSubmit.value = { top: belowY, left };
  }
}
function openImageLinkPopover(which, img) {
  const parentLink = img.parentElement && img.parentElement.tagName === 'A'
    ? img.parentElement.getAttribute('href') || ''
    : '';

  if (which === 'add') {
    selectedImageAdd.value = img;
    imageLinkAdd.value = parentLink;
    showImageLinkPopoverAdd.value = true;
  } else if (which === 'edit') {
    selectedImageEdit.value = img;
    imageLinkEdit.value = parentLink;
    showImageLinkPopoverEdit.value = true;
  } else {
    selectedImageSubmit.value = img;
    imageLinkSubmit.value = parentLink;
    showImageLinkPopoverSubmit.value = true;
  }

  // Position initiale du popover (fixe dans le viewport)
  positionImagePopover(which, img);
  nextTick(() => {
    positionImagePopover(which, img);
  });
}
function closeImagePopover(which) {
  if (which === 'add') showImageLinkPopoverAdd.value = false;
  else if (which === 'edit') showImageLinkPopoverEdit.value = false;
  else showImageLinkPopoverSubmit.value = false;
}
function setImageLink(which) {
  const img =
    which === 'add' ? selectedImageAdd.value :
    which === 'edit' ? selectedImageEdit.value :
    selectedImageSubmit.value;
  const link =
    which === 'add' ? imageLinkAdd.value :
    which === 'edit' ? imageLinkEdit.value :
    imageLinkSubmit.value;
  if (!img || !link) return;
  const parent = img.parentElement;
  if (parent && parent.tagName === 'A') {
    parent.setAttribute('href', link);
    parent.setAttribute('target', '_blank');
    parent.setAttribute('rel', 'noopener noreferrer');
  } else {
    const a = document.createElement('a');
    a.href = link;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    img.replaceWith(a);
    a.appendChild(img);
  }
  closeImagePopover(which);
}
function removeImageLink(which) {
  const img =
    which === 'add' ? selectedImageAdd.value :
    which === 'edit' ? selectedImageEdit.value :
    selectedImageSubmit.value;
  if (!img) return;
  const parent = img.parentElement;
  if (parent && parent.tagName === 'A') {
    parent.replaceWith(img);
  }
  closeImagePopover(which);
}

function handleGlobalClickForPopovers(e) {
  const t = e.target;
  if (showImageLinkPopoverAdd.value) {
    const inAdd = imageLinkPopoverAddRef.value && imageLinkPopoverAddRef.value.contains(t);
    if (!inAdd) showImageLinkPopoverAdd.value = false;
  }
  if (showImageLinkPopoverEdit.value) {
    const inEdit = imageLinkPopoverEditRef.value && imageLinkPopoverEditRef.value.contains(t);
    if (!inEdit) showImageLinkPopoverEdit.value = false;
  }
  if (showImageLinkPopoverSubmit.value) {
    const inSubmit = imageLinkPopoverSubmitRef.value && imageLinkPopoverSubmitRef.value.contains(t);
    if (!inSubmit) showImageLinkPopoverSubmit.value = false;
  }
}

// Mini-barre flottante près de la sélection de texte
const showSelectionToolbarAdd = ref(false);
const showSelectionToolbarEdit = ref(false);
const selectionToolbarAddRef = ref(null);
const selectionToolbarEditRef = ref(null);
const selectionColorAdd = ref('#111111');
const selectionColorEdit = ref('#111111');
const selectionFontSizeAdd = ref('16');
const selectionFontSizeEdit = ref('16');
const selectionFontFamilyAdd = ref('Inter');
const selectionFontFamilyEdit = ref('Inter');
const selectionToolbarPosAdd = ref({ top: 0, left: 0 });
const selectionToolbarPosEdit = ref({ top: 0, left: 0 });
// Centrage horizontal avec décalage réduit pour rester visible sur mobile
const selectionToolbarTransformAdd = ref('none');
const selectionToolbarTransformEdit = ref('none');

// Suivi réactif de la largeur du viewport pour ajuster le left de la toolbar
const viewportWidth = ref(window.innerWidth);
const onResizeViewport = () => { viewportWidth.value = window.innerWidth; };
onMounted(() => {
  window.addEventListener('resize', onResizeViewport);
});
onUnmounted(() => {
  window.removeEventListener('resize', onResizeViewport);
});

const selectionToolbarStyleAdd = computed(() => {
  const isMobile = viewportWidth.value <= 1024;
  return {
    position: 'fixed',
    top: selectionToolbarPosAdd.value.top + 'px',
    left: selectionToolbarPosAdd.value.left + 'px',
    transform: selectionToolbarTransformAdd.value,
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
    padding: '6px',
    zIndex: 1000000,
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: isMobile ? 'center' : 'flex-start',
    flexWrap: isMobile ? 'wrap' : 'nowrap',
    gap: '6px'
  };
});
const selectionToolbarStyleEdit = computed(() => {
  const isMobile = viewportWidth.value <= 1024;
  return {
    position: 'fixed',
    top: selectionToolbarPosEdit.value.top + 'px',
    left: selectionToolbarPosEdit.value.left + 'px',
    transform: selectionToolbarTransformEdit.value,
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
    padding: '6px',
    zIndex: 1000000,
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: isMobile ? 'center' : 'flex-start',
    flexWrap: isMobile ? 'wrap' : 'nowrap',
    gap: '6px'
  };
});
function applySelectionColor(which) {
  try {
    if (which) focusEditorAndPreserveSelection(which);
    const color = which === 'add' ? selectionColorAdd.value : selectionColorEdit.value;
    document.execCommand('foreColor', false, color);
  } catch {}
}
function applySelectionFontSize(which) {
  try {
    if (which) focusEditorAndPreserveSelection(which);
    const size =
      which === 'add' ? selectionFontSizeAdd.value :
      which === 'edit' ? selectionFontSizeEdit.value :
      selectionFontSizeSubmit.value; // Ajout: submit
    document.execCommand('fontSize', false, '7');
    const el =
      which === 'add' ? addEditorRef.value :
      which === 'edit' ? editEditorRef.value :
      submitEditorRef.value; // Ajout: submit
    const fonts = el ? el.querySelectorAll('font[size="7"]') : [];
    fonts.forEach(n => { n.removeAttribute('size'); n.style.fontSize = size + 'px'; });
  } catch {}
}
function applySelectionFontFamily(which) {
  const family =
    which === 'add' ? selectionFontFamilyAdd.value :
    which === 'edit' ? selectionFontFamilyEdit.value :
    selectionFontFamilySubmit.value; // Ajout: submit
  try {
    if (which) focusEditorAndPreserveSelection(which);
    document.execCommand('fontName', false, family);
  } catch {}
  const el =
    which === 'add' ? addEditorRef.value :
    which === 'edit' ? editEditorRef.value :
    submitEditorRef.value; // Ajout: submit
  const fonts = el ? el.querySelectorAll('font[face]') : [];
  fonts.forEach(n => { n.style.fontFamily = family; n.removeAttribute('face'); });
}

function whichEditorForNode(node) {
  const rootAdd = addEditorRef.value;
  const rootEdit = editEditorRef.value;
  const rootSubmit = submitEditorRef.value;
  const el = node && node.nodeType === 1 ? node : node?.parentElement;
  if (rootAdd && el && rootAdd.contains(el)) return 'add';
  if (rootEdit && el && rootEdit.contains(el)) return 'edit';
  if (rootSubmit && el && rootSubmit.contains(el)) return 'submit';
  return null;
}

// Détecter si la sélection contient une image (ancêtre commun, bornes ou intersection)
function selectedImageInSelection(sel) {
  if (!sel || sel.rangeCount === 0) return null;
  let range;
  try { range = sel.getRangeAt(0); } catch { return null; }
  const common = range.commonAncestorContainer;
  const commonEl = common?.nodeType === 1 ? common : common?.parentElement;
  if (commonEl?.tagName === 'IMG') return commonEl;

  const startEl = range.startContainer?.nodeType === 1 ? range.startContainer : range.startContainer?.parentElement;
  if (startEl?.tagName === 'IMG') return startEl;

  const endEl = range.endContainer?.nodeType === 1 ? range.endContainer : range.endContainer?.parentElement;
  if (endEl?.tagName === 'IMG') return endEl;

  // Chercher une image intersectée par le range dans l'éditeur concerné
  const which = whichEditorForNode(common);
  const root = which === 'add' ? addEditorRef.value : (which === 'edit' ? editEditorRef.value : (which === 'submit' ? submitEditorRef.value : null));
  if (!root) return null;
  const imgs = root.querySelectorAll('img');
  for (const img of imgs) {
    try { if (range.intersectsNode(img)) return img; } catch {}
  }
  return null;
}

function getToolbarSize(which) {
  const el = which === 'add' ? selectionToolbarAddRef.value : (which === 'edit' ? selectionToolbarEditRef.value : selectionToolbarSubmitRef.value);
  if (el) {
    try {
      const r = el.getBoundingClientRect();
      return { width: Math.round(r.width), height: Math.round(r.height) };
    } catch {}
  }
  const approxWidth = Math.min(320, Math.max(220, Math.floor(window.innerWidth * 0.75)));
  const approxHeight = window.innerWidth <= 1024 ? 88 : 44;
  return { width: approxWidth, height: approxHeight };
}

function updateToolbarPosition(which, rect) {
  if (!rect) return;

  const margin = 8;
  const { width: tbWidth, height: tbHeight } = getToolbarSize(which);

  // Dimensions utiles du viewport (sans barre de scroll)
  const viewportWidth = document.documentElement.clientWidth;
  const viewportHeight = document.documentElement.clientHeight;

  // Bord gauche au début de la sélection
  const leftRaw = rect.left;
  const minLeft = 8;
  const maxLeft = viewportWidth - tbWidth - 8; // éviter la barre de scroll droite
  const leftClamped = Math.max(minLeft, Math.min(maxLeft, leftRaw));

  // Position verticale: sous la sélection, repli au-dessus si manque d'espace
  const topBelow = rect.bottom + margin;
  const topAbove = rect.top - tbHeight - margin;
  const viewportTop = 8;
  const viewportBottom = viewportHeight - tbHeight - 8;

  let topFinal = Math.min(Math.max(topBelow, viewportTop), viewportBottom);
  if (topFinal >= viewportBottom && topAbove >= viewportTop) {
    topFinal = Math.max(viewportTop, topAbove);
  }

  if (which === 'add') {
    selectionToolbarPosAdd.value = { top: topFinal, left: leftClamped };
    selectionToolbarTransformAdd.value = 'none';
  } else if (which === 'edit') {
    selectionToolbarPosEdit.value = { top: topFinal, left: leftClamped };
    selectionToolbarTransformEdit.value = 'none';
  } else if (which === 'submit') {
    selectionToolbarPosSubmit.value = { top: topFinal, left: leftClamped };
    selectionToolbarTransformSubmit.value = 'none';
  }
}

function handleSelectionChange() {
  const sel = window.getSelection();
  if (!sel) {
    showSelectionToolbarAdd.value = false;
    showSelectionToolbarEdit.value = false;
    showSelectionToolbarSubmit.value = false;
    return;
  }

  const img = selectedImageInSelection(sel);
  if (img) {
    const whichImg = whichEditorForNode(img);
    showSelectionToolbarAdd.value = false;
    showSelectionToolbarEdit.value = false;
    showSelectionToolbarSubmit.value = false;
    if (whichImg) openImageLinkPopover(whichImg, img);
    return;
  }

  if (sel.isCollapsed) {
    showSelectionToolbarAdd.value = false;
    showSelectionToolbarEdit.value = false;
    showSelectionToolbarSubmit.value = false;
    return;
  }

  let range;
  try { range = sel.getRangeAt(0); } catch { return; }
  const rect = range.getBoundingClientRect();
  const which = whichEditorForNode(range.commonAncestorContainer);

  // Memorize selection for toolbar clicks
  if (which === 'add' || which === 'edit' || which === 'submit') {
    try {
      const clone = range.cloneRange();
      if (which === 'add') lastSelectionAdd = clone;
      else if (which === 'edit') lastSelectionEdit = clone;
      else lastSelectionSubmit = clone;
    } catch {}
    // Show only the toolbar for the active editor
    showSelectionToolbarAdd.value = which === 'add';
    showSelectionToolbarEdit.value = which === 'edit';
    showSelectionToolbarSubmit.value = which === 'submit';

    updateToolbarPosition(which, rect);
    // Recalcul après rendu réel de la toolbar pour utiliser sa vraie taille
    nextTick(() => updateToolbarPosition(which, rect));
  } else {
    showSelectionToolbarAdd.value = false;
    showSelectionToolbarEdit.value = false;
    showSelectionToolbarSubmit.value = false;
  }
}

function recomputeOnResize() {
  const sel = window.getSelection && window.getSelection();
  if (!sel || sel.rangeCount === 0) return;
  let rect;
  try { rect = sel.getRangeAt(0).getBoundingClientRect(); } catch { return; }
  if (showSelectionToolbarAdd && showSelectionToolbarAdd.value) {
    nextTick(() => updateToolbarPosition('add', rect));
  }
  if (showSelectionToolbarEdit && showSelectionToolbarEdit.value) {
    nextTick(() => updateToolbarPosition('edit', rect));
  }
  // Ajout: submit
  if (showSelectionToolbarSubmit && showSelectionToolbarSubmit.value) {
    nextTick(() => updateToolbarPosition('submit', rect));
  }
}

// Recalage des popovers d'image uniquement (sur resize)
function recomputeImagePopoverOnly() {
  if (showImageLinkPopoverAdd.value && selectedImageAdd.value) {
    nextTick(() => { positionImagePopover('add', selectedImageAdd.value); });
  }
  if (showImageLinkPopoverEdit.value && selectedImageEdit.value) {
    nextTick(() => { positionImagePopover('edit', selectedImageEdit.value); });
  }
  if (showImageLinkPopoverSubmit.value && selectedImageSubmit.value) {
    nextTick(() => { positionImagePopover('submit', selectedImageSubmit.value); });
  }
}

function onAddEditorClick(e) {
  const t = e.target;
  const img = t && typeof t.closest === 'function' ? t.closest('img') : (t && t.tagName === 'IMG' ? t : null);
  if (img) {
    selectedImageAdd.value = img;
    // Initialize slider/number to current image width or natural width
    const current = parseInt(img.style.width || '0', 10) || img.naturalWidth || imageWidthAdd.value;
    imageWidthAdd.value = Math.max(80, Math.min(900, current));
    openImageLinkPopover('add', img);
  } else {
    showImageLinkPopoverAdd.value = false;
  }
}
function onEditEditorClick(e) {
  // Support clicks inside wrappers that contain an <img> (e.g., figure or link)
  const img = e.target && typeof e.target.closest === 'function' ? e.target.closest('img') : (e.target && e.target.tagName === 'IMG' ? e.target : null);
  if (img) {
    selectedImageEdit.value = img;
    // Initialize slider/number to current image width or natural width
    const current = parseInt(img.style.width || '0', 10) || img.naturalWidth || imageWidthEdit.value;
    imageWidthEdit.value = Math.max(80, Math.min(900, current));
    openImageLinkPopover('edit', img);
  } else {
    showImageLinkPopoverEdit.value = false;
  }
}
function onSubmitEditorClick(e) {
  const img = e.target && typeof e.target.closest === 'function' ? e.target.closest('img') : (e.target && e.target.tagName === 'IMG' ? e.target : null);
  if (img) {
    selectedImageSubmit.value = img;
    const current = parseInt(img.style.width || '0', 10) || img.naturalWidth || imageWidthSubmit.value;
    imageWidthSubmit.value = Math.max(80, Math.min(900, current));
    openImageLinkPopover('submit', img);
  } else {
    showImageLinkPopoverSubmit.value = false;
  }
}

function onSubmitEditorInput() {
  // placeholder visuel géré via CSS, rien à faire ici
}

onMounted(() => {
  document.addEventListener('selectionchange', handleSelectionChange);
  window.addEventListener('resize', recomputeOnResize);
  window.addEventListener('resize', recomputeImagePopoverOnly);
  window.addEventListener('scroll', recomputeOnResize, { passive: true });
  document.addEventListener('mousedown', handleGlobalClickForPopovers, true);
  // Ajout: écouteurs de scroll sur les conteneurs de popup (si déjà montés)
  try { popupContentAddRef.value?.addEventListener('scroll', recomputeOnResize, { passive: true }); } catch {}
  try { popupContentEditRef.value?.addEventListener('scroll', recomputeOnResize, { passive: true }); } catch {}
});
onUnmounted(() => {
  document.removeEventListener('selectionchange', handleSelectionChange);
  window.removeEventListener('resize', recomputeOnResize);
  window.removeEventListener('resize', recomputeImagePopoverOnly);
  window.removeEventListener('scroll', recomputeOnResize);
  document.removeEventListener('mousedown', handleGlobalClickForPopovers, true);
  // Nettoyer les listeners de scroll des conteneurs de popup
  try { popupContentAddRef.value?.removeEventListener('scroll', recomputeOnResize); } catch {}
  try { popupContentEditRef.value?.removeEventListener('scroll', recomputeOnResize); } catch {}
});

const groupesDisponibles = computed(() => {
  // Groupes avec sous-groupes : A, A', A", B, B', B", Promo
  return ["A", "A'", "A\"", "B", "B'", "B\"", "Promo"];
});

const promoSelectedAdd = computed(() => (newTask.value.groupes || []).includes('Promo'));

function onChangeAddGroup(g, ev) {
  const checked = !!ev?.target?.checked;
  if (g === 'Promo' && checked) {
    newTask.value.groupes = ['Promo'];
    return;
  }
  if (promoSelectedAdd.value && g !== 'Promo') {
    // si Promo est déjà sélectionné, empêcher d'ajouter d'autres groupes
    ev.target.checked = false;
  }
}

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

  // Validation matière requise
  if (!newTask.value.matiere) {
    errorMsg.value = 'Veuillez sélectionner une matière.';
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
    const selectedGroups = newTask.value.groupes || [];
    const primaryGroup = selectedGroups.includes('Promo') ? 'Promo' : (selectedGroups[0] || 'Promo');

    const eventToSend = {
      titre: newTask.value.titre,
      type: newTask.value.type,
      matiere: newTask.value.matiere,
      date: newTask.value.date,
      heure: newTask.value.heure,
      description: addEditorRef?.value?.innerHTML || '',
      groupes: selectedGroups,
      groupe: primaryGroup, // IMPORTANT: satisfaire le schéma backend
      submissionEnabled: !!newTask.value.submissionEnabled,
      groupWorkEnabled: !!newTask.value.groupWorkEnabled,
      year: userData.role === 'prof' ? newTask.value.year : (userData.year || 'BUT1')
    };
    const token = userData.token;
    const isPrivileged = userData.role === 'delegue' || userData.role === 'prof';
    const endpoint = isPrivileged ? `${API_URL}/events` : `${API_URL}/events/proposals`;
    const createRes = await axios.post(endpoint, eventToSend, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const createdEvent = isPrivileged ? createRes.data : (createRes.data?.proposal || createRes.data);

    if (addDocFiles.value && addDocFiles.value.length > 0 && createdEvent && createdEvent._id) {
      const fd = new FormData();
      addDocFiles.value.forEach(f => fd.append('files', f));
      const attachEndpoint = isPrivileged
        ? `${API_URL}/events/${createdEvent._id}/attachments`
        : `${API_URL}/events/proposals/${createdEvent._id}/attachments`;
      await axios.post(attachEndpoint, fd, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
    }

    if (isPrivileged && eventToSend.groupWorkEnabled && Array.isArray(newTask.value.workGroupsDraft) && newTask.value.workGroupsDraft.length && createdEvent && createdEvent._id) {
      try {
        for (const g of newTask.value.workGroupsDraft) {
          const payload = {
            name: String(g.name || '').trim() || 'Groupe',
            capacity: Math.max(1, Math.min(99, Number(g.capacity || 3)))
          };
          await axios.post(`${API_URL}/events/${createdEvent._id}/work-groups`, payload, {
            headers: { Authorization: `Bearer ${token}` }
          });
        }
      } catch {}
    }

    successMessage.value = isPrivileged ? 'Tâche ajoutée avec succès !' : 'Proposition envoyée !';

    try { if (!isPrivileged) window.dispatchEvent(new CustomEvent('homework-proposed')) } catch {}

    showAddTaskPopup.value = false;
    showSuccessPopup.value = true;
    if (isPrivileged) {
      emit('refresh-events');
    } else {
      setTimeout(() => { try { fetchMyProposals(); } catch {} }, 0);
    }
    // Reset du formulaire
    newTask.value = { titre: '', type: 'devoir', matiere: '', date: '', heure: '', description: '', groupes: [], year: '', specialite: '', submissionEnabled: false, groupWorkEnabled: false, workGroupsDraft: [] };
    draftGroupCountAdd.value = 3;
    addDocFiles.value = [];
    if (addEditorRef.value) addEditorRef.value.innerHTML = '';
  } catch (e) {
    errorMsg.value = e?.response?.data?.message || 'Erreur lors de l\'ajout de la tâche.';
    showErrorPopup.value = true;
  } finally {
    loadingAdd.value = false;
  }
}

// Initialiser le store des matières au montage + charger mes propositions (élève)
const myProposals = ref([]);
const myAcceptedProposals = ref([]);
async function fetchMyProposals() {
  try {
    const tok = user.value?.token;
    if (!tok) { myProposals.value = []; return; }
    const res = await axios.get(`${API_URL}/events/proposals/mine`, { headers: { Authorization: `Bearer ${tok}` } });
    const arr = Array.isArray(res.data?.proposals) ? res.data.proposals : (Array.isArray(res.data) ? res.data : []);
    const uid = String(user.value?._id || user.value?.id || '');
    myProposals.value = arr.map(p => ({
      _id: p._id,
      titre: p.titre || '',
      matiere: p.matiere || '',
      date: p.date || '',
      heure: typeof p.heure === 'string' ? p.heure.replace('h', ':') : (p.heure || ''),
      type: ((p.type || '').toLowerCase() === 'examen' ? 'exam' : (((p.type || '').toLowerCase() === 'devoir') ? 'devoir' : ((p.type || '').toLowerCase() || 'devoir'))),
      groupe: p.groupe || 'Promo',
      groupes: Array.isArray(p.groupes) ? p.groupes : (p.groupe ? [p.groupe] : []),
      year: p.year || '',
      specialite: p.specialite || '',
      description: p.description || '',
      submissionEnabled: !!p.submissionEnabled,
      attachments: Array.isArray(p.attachments) ? p.attachments : [],
      isProposal: true,
      createdByName: p.proposedBy?.username || (user.value?.username || user.value?.name || ''),
      checkedBy: Array.isArray(p.checkedBy) ? p.checkedBy : [],
      archivedBy: Array.isArray(p.archivedBy) ? p.archivedBy : [],
      checked: Array.isArray(p.checkedBy) ? p.checkedBy.map(String).includes(uid) : false,
      archived: Array.isArray(p.archivedBy) ? p.archivedBy.map(String).includes(uid) : false,
      createdBy: p.proposedBy?._id || p.proposedBy || null
    }));
  } catch { myProposals.value = []; }
}
async function fetchMyAcceptedProposals() {
  try {
    const tok = user.value?.token;
    if (!tok) { myAcceptedProposals.value = []; return; }
    const res = await axios.get(`${API_URL}/events/proposals/accepted`, { headers: { Authorization: `Bearer ${tok}` } });
    const arr = Array.isArray(res.data?.proposals) ? res.data.proposals : (Array.isArray(res.data) ? res.data : []);
    const uid = String(user.value?._id || user.value?.id || '');
    myAcceptedProposals.value = arr.map(p => ({
      _id: p._id,
      titre: p.titre || '',
      matiere: p.matiere || '',
      date: p.date || '',
      heure: typeof p.heure === 'string' ? p.heure.replace('h', ':') : (p.heure || ''),
      type: ((p.type || '').toLowerCase() === 'examen' ? 'exam' : (((p.type || '').toLowerCase() === 'devoir') ? 'devoir' : ((p.type || '').toLowerCase() || 'devoir'))),
      groupe: p.groupe || 'Promo',
      groupes: Array.isArray(p.groupes) ? p.groupes : (p.groupe ? [p.groupe] : []),
      year: p.year || '',
      specialite: p.specialite || '',
      description: p.description || '',
      submissionEnabled: !!p.submissionEnabled,
      attachments: Array.isArray(p.attachments) ? p.attachments : [],
      isProposal: true,
      createdByName: p.proposedBy?.username || (user.value?.username || user.value?.name || ''),
      checkedBy: Array.isArray(p.checkedBy) ? p.checkedBy : [],
      archivedBy: Array.isArray(p.archivedBy) ? p.archivedBy : [],
      checked: Array.isArray(p.checkedBy) ? p.checkedBy.map(String).includes(uid) : false,
      archived: Array.isArray(p.archivedBy) ? p.archivedBy.map(String).includes(uid) : false,
      createdBy: p.proposedBy?._id || p.proposedBy || null
    }));
  } catch { myAcceptedProposals.value = []; }
}
onMounted(async () => {
  await subjectsStore.initializeStore();
  await fetchMyProposals();
  await fetchMyAcceptedProposals();
  await refreshProposalsCountBadge();
});
watch(() => user.value && user.value.token, (tok) => { if (tok) { fetchMyProposals(); fetchMyAcceptedProposals(); refreshProposalsCountBadge(); } });

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

// Watcher: restaurer le brouillon et init placeholders quand le popup s'ouvre
watch(
  () => showAddTaskPopup.value,
  (isOpen) => {
    try { if (window.innerWidth > 1024) document.body.style.overflow = isOpen ? 'hidden' : '' } catch {}
    if (isOpen) {
      nextTick(() => {
        try { if (addEditorRef.value) addEditorRef.value.innerHTML = String(newTask.value.description || ''); } catch {}
        if (window.innerWidth >= 320 && window.innerWidth <= 1024) {
          updateDatePlaceholder();
          updateTimePlaceholder();
        }
        try { popupContentAddRef.value && popupContentAddRef.value.addEventListener('scroll', recomputeOnResize, { passive: true }); } catch {}
      });
    } else {
      try { popupContentAddRef.value && popupContentAddRef.value.removeEventListener('scroll', recomputeOnResize); } catch {}
      showImageLinkPopoverAdd.value = false;
      selectedImageAdd.value = null;
    }
  }
);

watch(
  () => showEditPopup.value,
  (isOpen) => {
    try { if (window.innerWidth > 1024) document.body.style.overflow = isOpen ? 'hidden' : '' } catch {}
    if (!isOpen) {
      try { popupContentEditRef.value && popupContentEditRef.value.removeEventListener('scroll', recomputeOnResize); } catch {}
      showImageLinkPopoverEdit.value = false;
      selectedImageEdit.value = null;
    } else {
      nextTick(() => {
        try { popupContentEditRef.value && popupContentEditRef.value.addEventListener('scroll', recomputeOnResize, { passive: true }); } catch {}
      });
    }
  }
);

// Popup d'infos (submit toolbar): écouter le scroll pour maintenir la barre flottante
watch(
  () => popupEvent.value,
  (ev) => {
    if (ev) {
      nextTick(() => {
        try { popupContentEditRef.value && popupContentEditRef.value.addEventListener('scroll', recomputeOnResize, { passive: true }); } catch {}
      });
    } else {
      try { popupContentEditRef.value && popupContentEditRef.value.removeEventListener('scroll', recomputeOnResize); } catch {}
    }
  }
);

// Optionnel: recharger les groupes quand l’option est activée dans la popup de modification
watch(
  () => editForm.value.groupWorkEnabled,
  async (enabled) => {
    try {
      // Si activé et qu'on édite un événement existant, recharger les groupes
      if (enabled && editingEvent.value && editingEvent.value._id) {
        await fetchWorkGroups(editingEvent.value._id);
      }
      // Si désactivé, vider la liste locale pour éviter l'affichage résiduel
      if (!enabled) {
        workGroups.value = [];
      }
    } catch {}
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
  if (!event) return false;
  if (event.isProposal === true) {
    return Array.isArray(myProposals.value) && myProposals.value.some(p => String(p._id) === String(event._id));
  }
  return user.value && (user.value.role === 'delegue' || user.value.role === 'prof') && event.createdBy === user.value._id;
}

const showDeletePopup = ref(false);
const taskToDelete = ref(null);
const deleteGroups = ref([]);
const deleteGroupsOptions = computed(() => {
  const groupes = (taskToDelete.value && (taskToDelete.value.groupes && taskToDelete.value.groupes.length ? taskToDelete.value.groupes : [taskToDelete.value.groupe])) || [];
  const base = groupes.filter(Boolean);
  const extras = ['B"', 'Promo'];
  return Array.from(new Set([...base, ...extras]));
});

// Mes tâches
const showMyTasks = ref(false);
const loadingMyTasks = ref(false);
const myEvents = ref([]);
const myTasksSelectedMatiere = ref('');
const myTasksSelectedYear = ref('');
const myTasksSelectedSpec = ref('');
const myTasksMatieres = computed(() => {
  const list = (Array.isArray(myEvents.value) ? myEvents.value : []).map(e => String(e.matiere || '').trim()).filter(Boolean);
  return Array.from(new Set(list)).sort();
});
const myItemsMatieres = computed(() => {
  const base = (user.value && (user.value.role === 'delegue' || user.value.role === 'prof')) ? myEvents.value : myProposals.value;
  const list = (Array.isArray(base) ? base : []).map(e => String(e.matiere || '').trim()).filter(Boolean);
  return Array.from(new Set(list)).sort();
});
const myItemsFiltered = computed(() => {
  let list = (user.value && (user.value.role === 'delegue' || user.value.role === 'prof')) ? (Array.isArray(myEvents.value) ? myEvents.value : []) : (Array.isArray(myProposals.value) ? myProposals.value : []);
  if (myTasksSelectedMatiere.value) list = list.filter(e => String(e.matiere || '') === myTasksSelectedMatiere.value);
  if (myTasksSelectedYear.value) list = list.filter(e => String(e.year || '') === myTasksSelectedYear.value);
  if (myTasksSelectedSpec.value) list = list.filter(e => eventMatchesSpec(e, myTasksSelectedSpec.value));
  return list.slice().sort((a, b) => getEventTimestamp(b) - getEventTimestamp(a));
});
const myEventsFiltered = computed(() => {
  let list = Array.isArray(myEvents.value) ? myEvents.value : [];
  if (myTasksSelectedMatiere.value) list = list.filter(e => String(e.matiere || '') === myTasksSelectedMatiere.value);
  if (myTasksSelectedYear.value) list = list.filter(e => String(e.year || '') === myTasksSelectedYear.value);
  if (myTasksSelectedSpec.value) list = list.filter(e => eventMatchesSpec(e, myTasksSelectedSpec.value));
  // Tri par défaut: plus récent → plus ancien
  return list.slice().sort((a, b) => getEventTimestamp(b) - getEventTimestamp(a));
});

// Utilitaire: timestamp (date + heure) pour le tri
function getEventTimestamp(ev) {
  try {
    const [h, m] = String(ev.heure || '').split(':');
    const d = new Date(ev.date);
    d.setHours(Number(h || 0), Number(m || 0), 0, 0);
    return d.getTime();
  } catch { return 0 }
}
function openMyTasks() {
  if (!user.value) return alert('Non connecté');
  showMyTasks.value = true;
  try { if (window.innerWidth > 1024) document.body.style.overflow = 'hidden' } catch {}
  fetchMyItems();
}
async function fetchMyItems() {
  try {
    loadingMyTasks.value = true;
    const role = user.value.role;
    if (role === 'delegue' || role === 'prof') {
      await fetchMyTasks();
    } else {
      await fetchMyProposals();
    }
  } finally {
    loadingMyTasks.value = false;
  }
}
function closeMyTasks() { showMyTasks.value = false; try { if (window.innerWidth > 1024) document.body.style.overflow = '' } catch {} }
function openMyEventSubmissions(ev) {
  // Fermer la popup Mes tâches pour éviter qu’elle reste au-dessus
  showMyTasks.value = false;
  nextTick(() => {
    teacherAutoOpenSubmissions.value = true;
    openPopup(ev);
  });
}
async function fetchMyTasks() {
  try {
    loadingMyTasks.value = true;
    const token = user.value.token;
    const res = await axios.get(`${API_URL}/events/mine`, { headers: { Authorization: `Bearer ${token}` } });
    myEvents.value = Array.isArray(res.data?.events) ? res.data.events : [];
  } catch (e) {
    console.error('Erreur chargement mes tâches:', e);
    myEvents.value = [];
  } finally {
    loadingMyTasks.value = false;
  }
}
const showProposalsPopup = ref(false);
const proposalsLoading = ref(false);
const proposalsList = ref([]);
const proposalsCountBadge = ref(0);
const showBlockedPanel = ref(false);
const proposalsAvailableCount = computed(() => (Array.isArray(proposalsList.value) ? proposalsList.value.length : 0));
const proposalsHeaderTitle = computed(() => showBlockedPanel.value ? 'Personnes bloquées' : 'Propositions en attente');
const blockedUsers = ref([]);
const blockedLoading = ref(false);
const blockedError = ref('');
const proposalsError = ref('');
const proposalLoading = ref(false);
async function refreshProposalsCountBadge() {
  try {
    const role = user.value?.role;
    const token = user.value?.token;
    if (role === 'delegue' || role === 'prof' || role === 'admin') {
      const r = await axios.get(`${API_URL}/events/proposals`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const arr = Array.isArray(r?.data?.proposals) ? r.data.proposals : (Array.isArray(r?.data) ? r.data : []);
      proposalsCountBadge.value = Math.max(0, Number(arr.length || 0));
    } else {
      const r = await axios.get(`${API_URL}/events/proposals/feed/count`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      proposalsCountBadge.value = Math.max(0, Number(r?.data?.count || 0));
    }
  } catch { proposalsCountBadge.value = 0; }
}

async function openProposalInfo(id) {
  try {
    proposalLoading.value = true;
    const token = user.value.token;
    const role = user.value.role;
    if (role === 'delegue' || role === 'prof' || role === 'admin') {
      const pInList = proposalsList.value.find(x => String(x._id) === String(id))
      if (pInList && pInList.proposedByBlocked) {
        const evLike = {
          _id: pInList._id,
          titre: pInList.titre || '',
          matiere: pInList.matiere || '',
          date: pInList.date || '',
          heure: typeof pInList.heure === 'string' ? pInList.heure.replace('h', ':') : pInList.heure,
          type: pInList.type || 'devoir',
          groupe: pInList.groupe || 'Promo',
          groupes: Array.isArray(pInList.groupes) ? pInList.groupes : [],
          year: pInList.year || '',
          specialite: pInList.specialite || '',
          description: pInList.description || '',
          submissionEnabled: !!pInList.submissionEnabled,
          attachments: Array.isArray(pInList.attachments) ? pInList.attachments : [],
          createdBy: pInList.proposedById,
          createdByName: pInList.proposedByName || '',
          isProposal: true
        };
        openPopup(evLike);
      } else {
        const res = await axios.get(`${API_URL}/events/proposals/${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${token}` } });
        const p = res.data?.proposal;
        if (!p) return alert('Proposition introuvable');
        const evLike = {
          _id: p._id,
          titre: p.titre || '',
          matiere: p.matiere || '',
          date: p.date || '',
          heure: typeof p.heure === 'string' ? p.heure.replace('h', ':') : p.heure,
          type: ((p.type || '').toLowerCase() === 'examen' ? 'exam' : (((p.type || '').toLowerCase() === 'devoir') ? 'devoir' : ((p.type || '').toLowerCase() || 'devoir'))),
          groupe: p.groupe || 'Promo',
          groupes: Array.isArray(p.groupes) ? p.groupes : (p.groupe ? [p.groupe] : []),
          year: p.year || '',
          specialite: p.specialite || '',
          description: p.description || '',
          submissionEnabled: !!p.submissionEnabled,
          attachments: Array.isArray(p.attachments) ? p.attachments : [],
          createdBy: p.proposedBy?._id || p.proposedBy,
          createdByName: p.proposedBy?.username || '',
          isProposal: true
        };
        openPopup(evLike);
      }
    } else {
      const p = proposalsList.value.find(x => String(x._id) === String(id));
      if (!p) { proposalLoading.value = false; return; }
      const evLike = {
        _id: p._id,
        titre: p.titre || '',
        matiere: p.matiere || '',
        date: p.date || '',
        heure: typeof p.heure === 'string' ? p.heure.replace('h', ':') : '',
        type: p.type || 'devoir',
        groupe: p.groupe || 'Promo',
        groupes: Array.isArray(p.groupes) ? p.groupes : [],
        year: p.year || '',
        specialite: p.specialite || '',
        description: p.description || '',
        submissionEnabled: !!p.submissionEnabled,
        attachments: Array.isArray(p.attachments) ? p.attachments : [],
        createdBy: p.proposedById,
        createdByName: p.proposedByName || '',
        isProposal: true
      };
      openPopup(evLike);
    }
  } catch (e) {
    proposalsError.value = 'Erreur';
  } finally {
    proposalLoading.value = false;
  }
}
async function openProposals() { if (!user.value) return alert('Non connecté'); showProposalsPopup.value = true; try { if (window.innerWidth > 1024) document.body.style.overflow = 'hidden' } catch {} await fetchBlockedUsers(); await fetchProposals(); }
function closeProposals() { showProposalsPopup.value = false; try { if (window.innerWidth > 1024) document.body.style.overflow = '' } catch {} }
function toggleBlockedPanel() { showBlockedPanel.value = !showBlockedPanel.value; if (showBlockedPanel.value) fetchBlockedUsers(); }
function openBlockedTab() { showBlockedPanel.value = true; fetchBlockedUsers(); }
async function openProposalsTab() { showBlockedPanel.value = false; await fetchBlockedUsers(); await fetchProposals(); }
async function fetchBlockedUsers() { try { blockedLoading.value = true; blockedError.value = ''; const role = user.value.role; const token = user.value.token; if (role === 'delegue' || role === 'prof' || role === 'admin') { const res = await axios.get(`${API_URL}/users/blocked-proposers`, { headers: { Authorization: `Bearer ${token}` } }); const arr = Array.isArray(res.data?.users) ? res.data.users : (Array.isArray(res.data) ? res.data : []); blockedUsers.value = arr.map(u => ({ _id: u._id || u.id, username: u.username || '', groupe: u.groupe || '', year: u.year || '', proposalBlocked: !!u.proposalBlocked, isMuted: false })); } else { let stored = []; try { const raw = localStorage.getItem('planify_muted_proposers'); stored = raw ? JSON.parse(raw) : []; } catch {} const arr = Array.isArray(stored) ? stored : []; blockedUsers.value = arr.map(u => ({ _id: u._id || u.id, username: u.username || '', groupe: u.groupe || '', year: u.year || '', proposalBlocked: false, isMuted: true })); } } catch (e) { blockedUsers.value = []; blockedError.value = 'Erreur'; } finally { blockedLoading.value = false; } }
async function toggleBlockUser(u) { try { if (!u?._id) return; const token = user.value.token; const role = user.value.role; if (role === 'delegue' || role === 'prof' || role === 'admin') { if (u.proposalBlocked) { await axios.post(`${API_URL}/users/${u._id}/unblock-proposals`, {}, { headers: { Authorization: `Bearer ${token}` } }); u.proposalBlocked = false; } else { await axios.post(`${API_URL}/users/${u._id}/block-proposals`, { reason: '' }, { headers: { Authorization: `Bearer ${token}` } }); u.proposalBlocked = true; } } else { if (u.isMuted) { await axios.post(`${API_URL}/users/unmute-proposer/${u._id}`, {}, { headers: { Authorization: `Bearer ${token}` } }); try { const raw = localStorage.getItem('planify_muted_proposers'); const arr = raw ? JSON.parse(raw) : []; const next = Array.isArray(arr) ? arr.filter(x => String(x._id || x.id) !== String(u._id)) : []; localStorage.setItem('planify_muted_proposers', JSON.stringify(next)); } catch {} u.isMuted = false; } else { await axios.post(`${API_URL}/users/mute-proposer/${u._id}`, {}, { headers: { Authorization: `Bearer ${token}` } }); try { const raw = localStorage.getItem('planify_muted_proposers'); const arr = raw ? JSON.parse(raw) : []; const entry = { _id: u._id, username: u.username || '' }; const next = Array.isArray(arr) ? [...arr.filter(x => String(x._id || x.id) !== String(u._id)), entry] : [entry]; localStorage.setItem('planify_muted_proposers', JSON.stringify(next)); } catch {} u.isMuted = true; } } try { await fetchBlockedUsers(); await fetchProposals(); } catch {} } catch (e) { alert('Action échouée'); } }
async function fetchProposals() {
  try {
    proposalsLoading.value = true; proposalsError.value = '';
    const token = user.value.token;
    const role = user.value.role;
    const url = (role === 'delegue' || role === 'prof' || role === 'admin') ? `${API_URL}/events/proposals` : `${API_URL}/events/proposals/feed`;
    const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
    const list = Array.isArray(res.data?.proposals) ? res.data.proposals : (Array.isArray(res.data) ? res.data : []);
    const myId = String(user.value?._id || user.value?.id || '');
    let base = list.map(p => ({
      _id: p._id,
      titre: p.titre,
      matiere: p.matiere,
      type: p.type,
      date: p.date,
      heure: typeof p.heure === 'string' ? p.heure.replace('h', ':') : (p.heure || ''),
      proposedById: p.proposedBy?._id || p.proposedBy,
      proposedByName: p.proposedBy?.username || '',
      proposedByBlocked: !!(p.proposedBy && p.proposedBy.proposalBlocked === true)
    }))
    // Élèves/étudiants: exclure mes propres propositions
    base = (role === 'delegue' || role === 'prof' || role === 'admin') ? base : base.filter(p => String(p.proposedById || '') !== myId)
    // Masquer toute proposition provenant d’un proposant bloqué (sécurité UI)
    base = base.filter(p => !p.proposedByBlocked)
    // Remplissages et filtrages liés aux personnes bloquées
    try {
      const bIdx = new Map((blockedUsers.value || []).map(u => [String(u._id || u.id || ''), String(u.username || '')]))
      // Fallback nom via “Personnes bloquées”
      base = base.map(x => (!x.proposedByName && bIdx.has(String(x.proposedById || ''))) ? { ...x, proposedByName: bIdx.get(String(x.proposedById || '')) || '' } : x)
      // Fallback blocage: marquer comme bloqué si l’ID figure dans blockedUsers
      const blockedIdSet = new Set((blockedUsers.value || []).map(u => String(u._id || u.id || '')))
      base = base.map(x => (!x.proposedByBlocked && blockedIdSet.has(String(x.proposedById || ''))) ? { ...x, proposedByBlocked: true } : x)
    } catch {}
    // Masquer les propositions des proposants bloqués (persistance UI)
    base = base.filter(p => !p.proposedByBlocked)
    // Enrichir les noms manquants via /events/proposals/:id (rôles autorisés uniquement, et non bloqués)
    async function enrichMissing() {
      const need = base.filter(x => !x.proposedByName && x.proposedById && !x.proposedByBlocked)
      if (!need.length) return
      await Promise.all(need.map(async (x) => {
        try {
          const d = await axios.get(`${API_URL}/events/proposals/${encodeURIComponent(x._id)}`, { headers: { Authorization: `Bearer ${token}` } })
          const p2 = d.data?.proposal
          const name = p2?.proposedBy?.username || ''
          if (name) x.proposedByName = name
        } catch {}
      }))
    }
    if (role === 'delegue' || role === 'prof' || role === 'admin') { await enrichMissing() }
    proposalsList.value = base; proposalsCountBadge.value = base.length
  } catch (e) { proposalsList.value = []; proposalsError.value = 'Erreur'; } finally { proposalsLoading.value = false; }
}
async function validateProposal(p) {
  try {
    if (!p || !p._id) return;
    const token = user.value.token;
    const role = user.value.role;
    if (role === 'delegue' || role === 'prof' || role === 'admin') {
      await axios.post(`${API_URL}/events/proposals/${p._id}/validate`, {}, { headers: { Authorization: `Bearer ${token}` } });
      proposalsList.value = proposalsList.value.filter(x => x._id !== p._id);
      emit('refresh-events');
    } else {
      await axios.post(`${API_URL}/events/proposals/${p._id}/accept`, {}, { headers: { Authorization: `Bearer ${token}` } });
      proposalsList.value = proposalsList.value.filter(x => x._id !== p._id);
      try { await fetchMyAcceptedProposals(); } catch {}
    }
  } catch (e) { alert('Validation échouée'); }
}
async function rejectProposal(p) { try { if (!p || !p._id) return; const reason = window.prompt('Raison du rejet ?') || ''; const token = user.value.token; await axios.post(`${API_URL}/events/proposals/${p._id}/reject`, { reason }, { headers: { Authorization: `Bearer ${token}` } }); proposalsList.value = proposalsList.value.filter(x => x._id !== p._id); } catch (e) { alert('Rejet échoué'); } }
async function deleteProposal(p) { try { if (!p || !p._id) return; const token = user.value.token; await axios.delete(`${API_URL}/events/proposals/${p._id}`, { headers: { Authorization: `Bearer ${token}` } }); proposalsList.value = proposalsList.value.filter(x => x._id !== p._id); } catch (e) { alert('Suppression échouée'); } }
async function blockProposer(p) {
  try {
    if (!p?.proposedById) return;
    const token = user.value.token;
    const role = user.value.role;
    const uid = p.proposedById;
    if (role === 'delegue' || role === 'prof' || role === 'admin') {
      if (!p.proposedByBlocked) {
        const prev = proposalsList.value;
        proposalsList.value = prev.filter(x => x.proposedById !== uid);
        await axios.post(`${API_URL}/users/${uid}/block-proposals`, { reason: '' }, { headers: { Authorization: `Bearer ${token}` } });
        await fetchBlockedUsers();
        await fetchProposals();
      } else {
        await axios.post(`${API_URL}/users/${uid}/unblock-proposals`, {}, { headers: { Authorization: `Bearer ${token}` } });
        await fetchBlockedUsers();
        await fetchProposals();
      }
    } else {
      await axios.post(`${API_URL}/users/mute-proposer/${uid}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      try { const raw = localStorage.getItem('planify_muted_proposers'); const arr = raw ? JSON.parse(raw) : []; const entry = { _id: uid, username: p.proposedByName || '' }; const next = Array.isArray(arr) ? [...arr.filter(x => String(x._id || x.id) !== String(uid)), entry] : [entry]; localStorage.setItem('planify_muted_proposers', JSON.stringify(next)); } catch {}
      const prev = proposalsList.value;
      proposalsList.value = prev.filter(x => x.proposedById !== uid);
    }
  } catch (e) { alert('Action blocage échouée'); try { await fetchProposals(); } catch {} }
}
function myTaskGroupOptions(ev) {
  // Ordre fixe pour éviter les déplacements visuels
  return ['A', "A'", 'A"', 'B', "B'", 'B"', 'Promo'];
}
function onToggleMyEventGroup(ev, g, event) {
  const checked = !!event?.target?.checked;
  const current = (ev.groupes && ev.groupes.length ? [...ev.groupes] : (ev.groupe ? [ev.groupe] : []));

  // Exclusivité Promo: s'il est coché, il remplace tous les autres
  if (g === 'Promo') {
    if (checked) {
      ev.groupes = ['Promo'];
      ev.groupe = 'Promo';
    } else {
      const without = current.filter(x => x !== 'Promo');
      ev.groupes = without;
      if (ev.groupe === 'Promo') ev.groupe = without[0] || '';
    }
    return;
  }

  // Pour un autre groupe: retirer Promo si présent, puis appliquer le toggle
  const filtered = current.filter(x => x !== 'Promo');
  const set = new Set(filtered);
  if (checked) set.add(g); else set.delete(g);
  ev.groupes = Array.from(set);
  if (!ev.groupes.includes(ev.groupe)) ev.groupe = ev.groupes[0] || '';
}
async function applyMyEventGroups(ev) {
  if (!ev || !ev._id) return;
  try {
    const token = user.value.token;
    await axios.post(`${API_URL}/events/${ev._id}/set-groups`, { groups: ev.groupes && ev.groupes.length ? ev.groupes : [] }, { headers: { Authorization: `Bearer ${token}` } });
    await fetchMyItems();
    emit('refresh-events');
  } catch (e) {
    console.error('Erreur set-groups:', e);
    alert('Erreur lors de la mise à jour des groupes.');
  }
}
async function applyMyProposalGroups(ev) {
  if (!ev || !ev._id) return;
  try {
    const token = user.value.token;
    await axios.post(`${API_URL}/events/proposals/${ev._id}/update-self`, { groupes: ev.groupes && ev.groupes.length ? ev.groupes : [] }, { headers: { Authorization: `Bearer ${token}` } });
    await fetchMyItems();
  } catch (e) {
    alert('Erreur mise à jour des groupes de la proposition');
  }
}
function openEditProposal(ev) { openEditEvent(ev); }

async function submitEditEvent() {
  if (!user.value) return alert('Non autorisé');
  try {
    const token = user.value.token;
    const payloadUpdate = { ...editForm.value };
    if (editEditorRef && editEditorRef.value && editEditorRef.value.innerHTML) {
      payloadUpdate.description = editEditorRef.value.innerHTML;
    }
    // On ne transmet jamais archLink (input retiré, on laisse la valeur backend inchangée)
    delete payloadUpdate.archLink;
    // Pour les délégués: ne pas autoriser la modification de l'année
    if (user.value.role === 'delegue') {
      delete payloadUpdate.year;
    }

    const id = editingEvent.value._id;

    if (editingEvent.value?.isProposal === true) {
      await axios.post(`${API_URL}/events/proposals/${id}/update-self`, payloadUpdate, { headers: { Authorization: `Bearer ${token}` } });
    } else if (user.value.role === 'prof' || user.value.role === 'admin') {
      await axios.put(`${API_URL}/events/${id}`, payloadUpdate, { headers: { Authorization: `Bearer ${token}` } });
    } else if (user.value.role === 'delegue') {
      await axios.post(`${API_URL}/events/${id}/update-self`, payloadUpdate, { headers: { Authorization: `Bearer ${token}` } });
    } else {
      return alert('Non autorisé');
    }

    // Upload des pièces jointes sélectionnées en édition (si présent)
    if (editDocFiles.value && editDocFiles.value.length > 0) {
      const fd = new FormData();
      editDocFiles.value.forEach(f => fd.append('files', f));
      const resp = await axios.post(`${API_URL}/events/${id}/attachments`, fd, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });

      const newAtts = Array.isArray(resp.data?.attachments) ? resp.data.attachments : [];
      if (newAtts.length) {
        const current = Array.isArray(editingEvent.value?.attachments) ? editingEvent.value.attachments : [];
        editingEvent.value = { ...editingEvent.value, attachments: [...current, ...newAtts] };
        recentlyAdded.value = newAtts.map(a => a.filename || a.name || a.path || a.originalname).filter(Boolean);
        setTimeout(() => { recentlyAdded.value = []; }, 3000);
      }

      editDocFiles.value = [];
      try { if (editDocRef && editDocRef.value) editDocRef.value.value = ''; } catch {}
    }

    // Création des groupes ajoutés dans la popup de modification
    if (editForm.value.groupWorkEnabled && Array.isArray(editGroupsDraft.value) && editGroupsDraft.value.length) {
      for (const g of editGroupsDraft.value) {
        const name = String(g?.name || '').trim();
        const capacity = Math.max(1, Math.min(99, Number(g?.capacity || 1)));
        if (!name) continue;
        try {
          await axios.post(`${API_URL}/events/${id}/work-groups`, { name, capacity }, {
            headers: { Authorization: `Bearer ${token}` }
          });
        } catch {}
      }
      editGroupsDraft.value = [];
    }

    showEditPopup.value = false;
    await fetchMyItems();
    emit('refresh-events');
  } catch (e) {
    console.error('Erreur modification événement:', e);
    alert('Erreur lors de la modification');
  }
}
async function deleteMyEvent(ev) {
  if (!ev || !ev._id) return;
  try {
    const token = user.value.token;
    await axios.post(`${API_URL}/events/${ev._id}/hard-delete`, {}, { headers: { Authorization: `Bearer ${token}` } });
    await fetchMyTasks();
    emit('refresh-events');
  } catch (e) {
    console.error('Erreur suppression (mes tâches):', e);
    alert('Erreur lors de la suppression.');
  }
}

function confirmDelete(event) {
  taskToDelete.value = event;
  showDeletePopup.value = true;
  deleteGroups.value = deleteGroupsOptions.value.slice();
}

async function deleteTaskConfirmed() {
  if (!taskToDelete.value) return;
  try {
    const token = user.value.token;
    const id = String(taskToDelete.value._id || '');
    if (!id) return;

    if (taskToDelete.value.isProposal === true) {
      await axios.delete(`${API_URL}/events/proposals/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      try { await fetchMyProposals(); } catch {}
    } else if (canDelete(taskToDelete.value)) {
      await axios.post(`${API_URL}/events/${id}/hard-delete`, {}, { headers: { Authorization: `Bearer ${token}` } });
    } else {
      await axios.delete(`${API_URL}/events/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    }

    emit('refresh-events');
    showDeletePopup.value = false;
    taskToDelete.value = null;
    deleteGroups.value = [];
  } catch (e) {
    console.error('Erreur suppression:', e);
    alert('Erreur lors de la suppression de la tâche.');
  }
}

function cancelDelete() {
  showDeletePopup.value = false;
  taskToDelete.value = null;
}
</script>

<style scoped>

/* Pointeur sur tous les boutons du composant */
button,
.btn-mini,
.emoji-btn,
.mini-toolbar button,
.image-resize-panel button,
.selection-toolbar button,
.image-link-popover button {
  cursor: pointer;
}


@font-face {
  font-family: 'Cobe Heavy';
  src: url('/fonts/Cobe-Heavy.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}

.btn-voir-taches {
  height: 59px !important;
  width: 250.96px !important;
  padding: 12px 45px !important;
  box-shadow: 0 2px 12px #ff5850;
  position: relative;
  overflow: visible;
}

/* Bouton Vider les retards: style dédié (override du style générique) */
.btn-vider-retards {
  height: 59px !important;
  width: 250.96px   !important;
  padding: 12px 37px   !important;
  background: linear-gradient(90deg, #ff5850, #ff4242) !important;
}
.btn-vider-retards:hover {
  box-shadow: 0 2px 12px #ff5850 !important;
}

/* Mobile: boutons en colonne + margin 0 */
@media (max-width: 768px) {
  .btns-actions {
    flex-direction: column !important;
    gap: 20px !important;
    margin-top: 20px;
  }
  .btn-ajouter-tache,
  .btn-ajouter-tache.btn-voir-taches,
  .btn-vider-retards {
    margin: 0 !important;
  }

  .btn-ajouter-tache {
    padding: 12px 42px !important;
  }


  .btn-voir-taches {
    padding: 12px 56px !important;
    width: 272px !important;
  }

  .btn-vider-retards {
    padding: 12px 37px !important;
    height: 59px !important;
    width: 272px !important;
    padding: 12px 48px !important;
    background: linear-gradient(90deg, #ff5850, #ff4242) !important;
  }

}

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
.image-resize-panel {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  margin: 6px 0;
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
  display: flex;
  justify-content: center;
  align-items: center;
}
[data-theme="dark"] .liste-taches-attente .devoir-card-liste {
  background: #121313 !important;
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
  color: #000 !important;
  white-space: normal;
  word-break: break-word;
  overflow-wrap: anywhere;
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
  width: 13rem;
  font-family: 'Cobe Heavy', Inter, sans-serif;
  box-shadow: 0 2px 8px #0001;
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
  overscroll-behavior: auto;
  touch-action: auto;
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
  overscroll-behavior: auto;
  position: relative;
}
.popup-content .multiline-html {
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
  display: block;
  line-height: 1.5;
}
.popup-content .multiline-html p { margin: 0 0 10px; }
.popup-content .multiline-html ul,
.popup-content .multiline-html ol { margin: 0 0 12px; padding-left: 1.2em; list-style-position: outside; }
.popup-content .multiline-html li { margin: 0 0 6px; }
.popup-content .multiline-html li p { margin: 0; }
.popup-content .multiline-html h1,
.popup-content .multiline-html h2,
.popup-content .multiline-html h3,
.popup-content .multiline-html h4,
.popup-content .multiline-html h5,
.popup-content .multiline-html h6 { margin: 14px 0 10px; font-weight: 800; }
.popup-content .multiline-html a { color: #2563eb; text-decoration: underline; }
.rich-editable { min-height: 120px; border: 1px dashed #9ca3af; border-radius: 12px; padding: 10px; color: #111; text-align: left; line-height: 1.5; width: 100%; max-width: 100%; box-sizing: border-box; }
.rich-editable ul,
.rich-editable ol { margin: 0 0 12px; padding-left: 1.2em; list-style-position: outside; }
.rich-editable li { margin: 0 0 6px; }
.rich-editable li p { margin: 0; }
.rich-editable:empty:before { content: attr(placeholder); color: #9ca3af; }
/* Empêcher la superposition: si l'éditeur est vide (placeholder visible), on cache le label */
.input-floating .rich-editable:empty + label { display: none; }
/* Quand l’éditeur a du contenu ou le focus → label flottant */
.input-floating .rich-editable:not(:empty) + label,
.input-floating .rich-editable:focus + label {
  top: -10px;
  left: 10px;
  font-size: 0.85em;
  color: #000;
  background: #fff;
  padding: 0 4px;
}

/* Carré de couleur visible et cliquable */
.mini-toolbar input[type="color"].color-swatch {
  width: 28px;
  height: 28px;
  padding: 0;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  background: transparent;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
}
.mini-toolbar input[type="color"].color-swatch::-webkit-color-swatch-wrapper { padding: 0; }
.mini-toolbar input[type="color"].color-swatch::-webkit-color-swatch { border: none; border-radius: 6px; }
.mini-toolbar input[type="color"].color-swatch::-moz-color-swatch { border: none; border-radius: 6px; }

/* Ajout: support du color picker dans la barre de sélection */
.selection-toolbar input[type="color"].color-swatch {
  appearance: none;
  -webkit-appearance: none;
  width: 26px;
  height: 26px;
  padding: 0;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
}
.selection-toolbar input[type="color"].color-swatch::-webkit-color-swatch-wrapper { padding: 0; }
.selection-toolbar input[type="color"].color-swatch::-webkit-color-swatch { border: none; border-radius: 6px; }
.selection-toolbar input[type="color"].color-swatch::-moz-color-swatch { border: none; border-radius: 6px; }

@media (max-width: 1023px) {
  .selection-toolbar input[type="color"].color-swatch {
    position: relative;
    left: 10px;
  }
}

/* Emoji picker */
.emoji-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 6px;
  margin-top: 4px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
}
.emoji-btn {
  font-size: 20px;
  line-height: 1;
  padding: 6px;
  border: none;
  background: transparent;
  cursor: pointer;
}
.mini-toolbar { display:flex; gap:6px; align-items:center; justify-content: center; flex-wrap:wrap; margin:4px 0 6px 0; }
  .toolbar-group { display:flex; align-items:center; gap:6px; }
  .toolbar-divider { width:1px; height:22px; background:#e5e7eb; margin:0 4px; display:inline-block; }
  .color-chip { width:22px; height:22px; border-radius:6px; border:1px solid #d1d5db; }
  .btn-mini {     font-family: Cobe Heavy, Inter, Arial, sans-serif;
    background: linear-gradient(180deg, #f9fafb, #e5e7eb);
    color: #111;
    border: 1px solid #d1d5db;
    border-radius: 10px;
    padding: 6px 12px;
    box-shadow: 0 2px 8px #00000014; }
  .btn-mini:hover { background: linear-gradient(180deg, #eef2f7, #dfe3e8); }
  .image-link-popover .btn-mini { font-family: Cobe Heavy, Inter, Arial, sans-serif;
    background: linear-gradient(180deg, #f9fafb, #e5e7eb);
    color: #111;
    border: 1px solid #d1d5db;
    border-radius: 10px;
    padding: 6px 12px;
    box-shadow: 0 2px 8px #00000014; }
  .image-link-popover .btn-mini:hover { background: linear-gradient(180deg, #eef2f7, #dfe3e8); }
  .rich-btn { font-family: "Cobe Heavy", Inter, Arial, sans-serif; background: linear-gradient(180deg, #f9fafb, #e5e7eb); color: #111; border: 1px solid #d1d5db; border-radius: 10px; padding: 6px 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
  .rich-btn:hover { background: linear-gradient(180deg, #eef2f7, #dfe3e8); }
 /* Barre de sélection flottante: une seule ligne */
 .selection-toolbar { display:flex; align-items:center; justify-content:center; flex-direction: row; gap:8px; flex-wrap: nowrap; max-width: 92vw; transform: none; overflow-x: auto; z-index: 1000000; }
 .selection-toolbar .toolbar-group { display:flex; align-items:center; gap:8px; }
.arch-btn { display:inline-block; margin-top:6px; background:#0ea5e9; color:#fff; padding:6px 10px; border-radius:8px; text-decoration:none; }
.arch-btn:hover { background:#0284c7; }
.popup-content h3, .popup-content p, .popup-content b, .popup-content button {
  /* color: #111 !important; */
  word-break: break-word;
}
.popup-content h3 {
  margin-top: 0;
  font-family: 'Cobe Heavy', Inter, sans-serif;
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
.proposer-name {
  display: block;
  margin-top: 4px;
  color: #6b7280;
  font-size: 0.95em;
}
.groupe-img {
  width: 48px;
  height: auto;
  display: block;
}
.groupe-img.promo {
  width: 90px;
}
.group-row {
   display: flex;
    align-items: center;
    gap: 8px;
    flex-direction: row-reverse;
    justify-content: flex-start;
}
.group-row .depot-icon {
  width: 38px;
  height: auto;
  cursor: pointer;
}
@media (max-width: 1024px) {
  .group-row {
    position: absolute;
    left: 5px;
    bottom: -40px;
    display: flex;
    align-items: center;
    flex-direction: row-reverse;
    gap: 8px;
  }
  .group-row .depot-icon {
    position: static;
    width: 33px;
    height: 24.65px;
  }
  .group-row .groupe-img {
    position: static !important;
    margin: 0;
  }
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
.btn-vider-archive.btn-edit-orange:hover {
  background: linear-gradient(90deg, #ea580c, #c2410c) !important;
}
.btn-vider-archive.violet {
  background: #a78bfa;
  color: #fff;
}
.btn-vider-archive.violet:hover {
  background: #7c3aed;
}

/* Classe commune: structure et animations identiques à “Valider” */
.btn-pill-common {
  border: none;
  border-radius: 14px;
  font-family: 'Cobe Heavy', Inter, sans-serif;
  transition: background 0.3s ease, background-position 0.35s cubic-bezier(.25,.8,.25,1), color 0.2s ease, box-shadow 0.2s ease;
  background-size: 200% 200%;
  background-position: 0% 50%;
}

/* Variantes: base en dégradé, hover progressif comme “Valider” */
.btn-vider-archive.blue.btn-pill-common {
  background: linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%);
  color: #fff;
  box-shadow: 0 2px 8px #60a5fa33;
}
.btn-vider-archive.blue.btn-pill-common:hover {
  background: linear-gradient(90deg, #60a5fa 0%, #1d4ed8 100%);
  background-position: 100% 50%;
  color: #fff;
  box-shadow: 0 4px 16px #1d4ed855;
  border: none;
}

.btn-vider-archive.orange.btn-pill-common {
  background: linear-gradient(90deg, #f59e42 0%, #d97706 100%);
  color: #fff;
  box-shadow: 0 2px 8px #fb923c33;
}
.btn-vider-archive.orange.btn-pill-common:hover {
  background: linear-gradient(90deg, #fb923c 0%, #ea580c 100%);
  background-position: 100% 50%;
  color: #fff;
  box-shadow: 0 4px 16px #ea580c55;
  border: none;
}

.btn-vider-archive.danger.btn-pill-common {
  background: linear-gradient(90deg, #ef4444 0%, #b91c1c 100%);
  color: #fff;
  box-shadow: 0 2px 8px #ef444433;
}
.btn-vider-archive.danger.btn-pill-common:hover {
  background: linear-gradient(90deg, #f87171 0%, #b91c1c 100%);
  background-position: 100% 50%;
  color: #fff;
  box-shadow: 0 4px 16px #b91c1c55;
  border: none;
}

/* Vert “Valider” (déjà présent, harmonisé) */
.btn-vider-archive.green.btn-pill-common {
  background: linear-gradient(90deg, #39ff7a 0%, #6EFF78 100%);
  color: #111;
  box-shadow: 0 2px 8px #6eff7833;
}
.btn-vider-archive.green.btn-pill-common:hover {
  background: linear-gradient(90deg, #6EFF78 0%, #39ff7a 100%);
  background-position: 100% 50%;
  color: #000;
  box-shadow: 0 4px 16px #39ff7a55;
  border: none;
}
.btn-vider-archive.green {
  background: linear-gradient(90deg, #39ff7a 0%, #6EFF78 100%);
  color: #111;
  border: none;
  box-shadow: 0 2px 8px #6eff7833;
}
.btn-vider-archive.green:hover {
  background: linear-gradient(90deg, #6EFF78 0%, #39ff7a 100%);
  color: #000;
  border: none;
  box-shadow: 0 4px 16px #39ff7a55;
}
.fixed-width { width: 149.13px; }
.btn-edit-orange {
  background: linear-gradient(90deg, #fb923c, #f97316);
  color: #fff !important;
}
.btn-edit-orange:hover {
  background: linear-gradient(90deg, #ea580c, #c2410c);
}
/* Ne pas écraser l'anneau vert hérité de .btn-vider-archive:hover */
.btn-vider-archive.btn-edit-orange:hover {
  background: linear-gradient(90deg, #ea580c, #c2410c) !important;
}
.btn-vider-archive:hover {
  background: #b91c1c;
  color: #fff;
  box-shadow: 0 0 0 3px #39ff7a, 0 2px 8px #0001;
  border: 2px solid #39ff7a;
}
.no-hover-green.btn-vider-archive.blue:hover {
  /* retirer le hover vert pour le bouton Enregistrer */
  background: #3b82f6 !important;
  box-shadow: 0 2px 8px #0001 !important;
  border: none !important;
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
  justify-content: center;
  text-shadow: 2px 2px 0 #ffffff;
}

[data-theme="dark"] .btn-ajouter-tache {
  text-shadow: var(--darkreader-background-b0b0b0, #484d50) 2px 2px 0px;
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
  position: relative;
  text-align: center;
  font-family: 'Cobe Heavy', Inter, sans-serif;
  border: 3.5px solid #39ff7a;
  animation: popupIn 0.25s cubic-bezier(.25,.8,.25,1);
  width: 90vw;
  max-width: 690px;
  min-width: 317px;
  max-height: 80vh;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-gutter: stable both-edges;
  box-sizing: border-box;
  padding-right: 14px;
}
.confirm-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.55); display: flex; align-items: center; justify-content: center; z-index: 1500; }
.popup-content-confirm { background: #0f1620; border: 1px solid #1f2a37; color: #e8f0f7; border-radius: 14px; padding: 18px 20px; width: 520px; max-width: 90vw; box-shadow: 0 20px 40px rgba(0,0,0,0.35); animation: scaleIn 160ms ease-out; }
.confirm-msg { font-size: 16px; color: #9ca3af; margin: 8px 0 14px; }
.confirm-actions { display: flex; gap: 10px; justify-content: flex-end; }
.primary-btn { background: #5bc682; color: #fff; border: none; border-radius: 12px; padding: 10px 14px; font-weight: 800; cursor: pointer; }
.secondary-btn { background: #e9ecef; color: #111; border: none; border-radius: 12px; padding: 10px 14px; font-weight: 800; cursor: pointer; }
@keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
[data-theme="light"] .popup-content-confirm { background: #ffffff; border-color: #e5e7eb; color: #111; }
/* Style générique de la scrollbar (WebKit/Blink) */
.popup-content-ajout-tache::-webkit-scrollbar { width: 10px; }
.popup-content-ajout-tache::-webkit-scrollbar-track { background: transparent; margin: 12px 0; }
.popup-content-ajout-tache::-webkit-scrollbar-thumb { background: #cfcfcf; border-radius: 8px; }
.popup-content-ajout-tache.popup-my-tasks {
  max-height: 80vh;
  overflow-y: auto;
  scrollbar-gutter: stable;
  padding-right: 44px; /* décale la barre vers l'intérieur pour ne pas toucher le bord */
}

/* Propositions: fenêtre plus haute et plus large pour voir davantage d’éléments */
.popup-content-ajout-tache.popup-proposals {
  max-height: 95vh;
  overflow-y: auto;
  padding-right: 44px;
  max-width: 1020px;
  width: 96vw;
}
/* Propositions: les cartes et titres doivent utiliser la largeur disponible */
.popup-proposals .devoir-card-liste {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  margin-left: 0;
  margin-right: 0;
  margin-top: 30px;
  margin-bottom: 30px;
  flex-direction: column;
  align-items: flex-start;
}
.popup-proposals .devoir-titre-row {
  max-width: 100%;
}
/* Propositions: réduire le label matière */
.popup-proposals .matiere-label-liste {
  font-size: 1em;
  margin-right: 0;
}

/* Propositions: titre centré */
.popup-proposals .devoir-titre {
  display: flex;
  align-items: center;
  justify-content: center;
   flex-direction: column;
}
/* Mobile: aligner le contenu du titre en colonne et centrer */
@media (max-width: 1024px) and (min-width: 320px) {
  .popup-proposals .devoir-titre {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
}
.popup-proposals .devoir-actions {
  flex-direction: row !important;
}
/* Mes tâches créées: labels filtres en noir */
.popup-content-ajout-tache.popup-my-tasks .tri-label {
  color: #111 !important;
  text-shadow: none !important;
  margin-right: 0 !important;
  font-size: 1em !important;
}

/* Liste des tâches (popup Mes tâches) avec espacement entre cartes */
.my-tasks-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Style scrollbar (Chromium/WebKit) avec marge haut/bas pour éviter de dépasser les coins arrondis */
.popup-content-ajout-tache.popup-my-tasks::-webkit-scrollbar { width: 10px; }
.popup-content-ajout-tache.popup-my-tasks::-webkit-scrollbar-track { background: transparent; margin: 12px 0; }
.popup-content-ajout-tache.popup-my-tasks::-webkit-scrollbar-thumb { background: #cfcfcf; border-radius: 8px; }
@keyframes popupIn {
  from { opacity: 0; transform: translateY(-30px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.popup-content-ajout-tache h3 {
  margin-top: 34px;
  margin-bottom: 22px;
  color: #111;
  font-size: 2em;
  font-family: 'Cobe Heavy', Inter, sans-serif;
  text-align: center;
}
/* Panneau de personnes bloquées (container neutre, sans centrage) */
.blocked-panel {
  background: #f9fafb;
  border-radius: 16px;
  padding: 16px 20px;
  margin-bottom: 12px;
  text-align: left;
}
[data-theme="dark"] .blocked-panel {
  background: var(--card-bg) !important;
  color: var(--text) !important;
  border-color: var(--border) !important;
}
.blocked-user-card {
  background: #fff;
  border-radius: 12px;
  padding: 12px 16px;
  margin: 8px 0;
  box-shadow: 0 2px 8px #0001;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  display: block;
}
[data-theme="dark"] .blocked-user-card {
  background: #121313 !important;
  color: var(--text) !important;
  border-color: var(--border) !important;
}
.blocked-user-card {
  background: #121313 !important;
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

/* Ajout du style spécifique pour le champ de titre */
.popup-content-ajout-tache input.title-input {
  font-family: 'Cobe Heavy', Inter, sans-serif !important;
  height: 44px;
  min-height: 44px;
  padding: 10px 14px;
  font-size: 1.1em;
  border: 3.5px solid #39ff7a;
  border-radius: 10px;
  background: #fff;
  width: 100%;
  box-sizing: border-box;
  margin-bottom: 0;
  transition: border 0.18s;
}
.popup-content-ajout-tache input.title-input:focus {
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
  gap: 12px;
  justify-content: center;
  margin-bottom: 8px;
  flex-wrap: nowrap;
  flex-direction: row;
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
  display: flex;
}
.groupes-checkboxes label.disabled {
  opacity: 0.5;
  filter: grayscale(0.6);
  cursor: not-allowed;
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
    font-size: 1em;
    padding: 6px 10px;
    border-radius: 8px;
    margin-right: 0;
    margin-bottom: 4px;
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
        flex-direction: column-reverse;
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
  .mytasks-top-filters {
    flex-direction: column !important;
    gap: 8px !important;
  }
  .mytasks-top-filters .matiere-select {
    width: 12rem !important;
    max-width: 85vw !important;
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
    color: #000 !important;
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
  /* Proposals popup: mobile layout adjustments */
  .popup-proposals .popup-proposals-tabs {
    align-items: center !important;
    flex-direction: column !important;
  }
  .popup-proposals .popup-proposals-tabs .active-tab {
    box-shadow: 0 0 0 3px #39ff7a;
    transform: scale(1.02);
  }
  .popup-proposals .devoir-titre-row {
    flex-direction: column;
  }
  .blocked-panel .devoir-titre-row {
    flex-direction: column;
  }
  .popup-proposals .devoir-actions {
    justify-content: center !important;
  }
  .fade-enter-active, .fade-leave-active { transition: opacity 200ms ease; }
  .fade-enter-from, .fade-leave-to { opacity: 0; }
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
    align-items: center;
    justify-content: center;
    display: flex;
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
  transition: background 0.2s, color 0.2s, bo x-shadow 0.2s;
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

/* Badge circulaire de dépôt (compteur) */
.deposit-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 20px;           /* cercle fixe */
  height: 20px;          /* cercle fixe */
  padding: 0;            /* pas de padding pour rester circulaire */
  background: #ef4444; /* rouge */
  color: #fff;
  border-radius: 9999px;
  display: grid;         /* centrage parfait */
  place-items: center;   /* centrage parfait */
  line-height: 20px;     /* fallback centrage */
  text-align: center;
  font-size: 0.85em;
  font-weight: 600;
  box-shadow: 0 0 0 2px #fff; /* liseré blanc */
  z-index: 3;
}

/* Contour spécifique en thème sombre */
[data-theme="dark"] .deposit-badge {
  box-shadow: 0 0 0 2px #17191a;
}

.no-file-message {
  margin-top: 6px;
  background: #fff3f3;
  color: #b91c1c;
  border-left: 4px solid #ef4444;
  padding: 10px 12px;
  border-radius: 12px;
  font-family: 'Cobe Heavy', Inter, sans-serif;
}
[data-theme="dark"] .no-file-message {
  background: #1b1010;
  color: #fca5a5;
  border-color: #ef4444;
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
  font-family: 'Cobe Heavy', Inter, sans-serif;
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
        margin: 20px auto !important;
        padding: 25px 20px 20px !important;
        max-height: 85vh !important;
        overflow-y: auto !important;
  }
  
  .popup-content-ajout-tache h3 {
    font-size: 1.4em !important;
    margin-bottom: 15px !important;
    margin-top: 15px !important;
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
    max-width: 300px;
    margin: 0 auto;
    flex-wrap: wrap !important;
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

  /* Boutons Appliquer/Supprimer (Mes tâches) en colonne sur mobile */
  .my-task-actions {
    flex-direction: column !important;
    align-items: stretch;
    gap: 8px !important;
  }
  
  .close-btn-ajout {
    top: 10px !important;
    right: 10px !important;
    width: 35px !important;
    height: 35px !important;
    font-size: 1.4em !important;
  }
  

}

@media (max-width: 768px) {
  .popup-proposals-tabs.blocked-active {
    align-items: center !important;
    flex-direction: column !important;
  }
  .popup-proposals .devoir-card-liste {
    padding: 10px 4px 18px !important;
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

/* Style: largeur mini des selects en zone mytasks/prof */
.mytasks-top-filters .matiere-select {
  min-width: 13rem;
  max-width: 85vw;
}

/* Responsive mobile (jusqu’à 1024px) */
/* Responsive jusqu’à 1024px: boutons sur une ligne, sélecteurs en colonne centrée */
@media (max-width: 1024px) {
  .mini-toolbar { flex-direction: column; align-items: stretch; }
  .mini-toolbar .toolbar-group { justify-content: center; display: flex; flex-direction: row; width: 100%; flex-wrap: wrap; }
  .mini-toolbar .matiere-select { width: 100%; }

  .selection-toolbar {
    flex-direction: row;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;          /* autorise les selects à aller sur la ligne suivante */
    max-width: 92vw;
  }
  .selection-toolbar .toolbar-group {
    flex-direction: row;      /* boutons en ligne */
    align-items: center;
    width: 100%;
    gap: 8px;
    justify-content: center;
    flex-wrap: nowrap;        /* les boutons restent sur une seule ligne */
  }
  .selection-toolbar .toolbar-divider { display: none; }
  .selection-toolbar .color-swatch {
    align-self: center;
    margin: 6px 0 8px;
    position: relative;
    left: 10px;
  }
  .selection-toolbar .matiere-select {
    order: 1;
    flex: 0 0 100%;           /* occupe 100% de la ligne, empêche le passage côte à côte */
    width: 260px;             /* largeur stable (pas de variation avec la résolution) */
    max-width: 92vw;          /* sécurité sur très petits écrans */
    margin: 4px auto;         /* centré horizontalement */
    padding: 8px 8px;
    align-self: center;
  }
}

/* À partir de 1025px (desktop), on annule les overrides “mobile” */
@media (min-width: 1025px) {
  .selection-toolbar {
    left: auto;
  }
}

/* Wrapper pour forcer un carré rempli (le vrai input est transparent et au-dessus) */
.selection-toolbar .color-picker {
  position: relative;
  width: 26px;
  height: 26px;
}

.selection-toolbar .color-picker .color-swatch {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  z-index: 2;
}

/* Carré rempli qui reflète la couleur choisie */
.selection-toolbar .color-picker .color-swatch-display {
  position: absolute;
  inset: 0;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #000;
  z-index: 1;
}

/* Optionnel: garder la taille identique sur mobile */
@media (max-width: 1023px) {
  .selection-toolbar .color-picker {
    width: 26px;
    height: 26px;
  }
}

@media (min-width: 320px) and (max-width: 1024px) {
  /* Popover image en colonne et largeur confortable */
  .image-link-popover { flex-direction: column; align-items: stretch; gap: 0; }
  .image-link-popover .toolbar-group { flex-direction: column; width: 100%; margin-top: 8px; }
  .image-link-popover input { width: 100%; margin-bottom: 0 !important; }
  .image-link-popover .btn-mini { width: 100%; }

  /* Panneau de redimensionnement en colonne */
  .image-resize-panel { flex-direction: column; align-items: stretch; }
  .image-resize-panel .matiere-select { margin-left: 0 !important; margin: 0 auto !important; }
}
.attachment-link {
  color: #2563eb;
  text-decoration: underline;
  display: block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.attachments-edit-block .attachment-link {
  flex: 1;
  min-width: 0;
}

/* Conteneur de popup: empêche tout débordement horizontal */
.popup-content-ajout-tache {
  width: calc(100vw - 32px);
  max-width: 690px;
  box-sizing: border-box;
  overflow-x: hidden;
}

/* Barre d’outils (édition): permettre le retour à la ligne pour éviter de dépasser */
.popup-content-ajout-tache .mini-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

/* Casser les longues chaînes dans l’éditeur riche */
.rich-editable {
  overflow-wrap: anywhere;
  word-break: break-word;
}

/* Ellipsis global pour les liens de pièces jointes */
.attachments-list li { min-width: 0; }
.attachments-list a {
  display: block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
/* En contexte édition (flex), le lien doit pouvoir rétrécir */
.attachments-edit-block .attachments-list a {
  flex: 1;
  min-width: 0;
}

/* Aperçu PDF/DOCX (ajout/modif): ellipsis + bouton retirer */
.selected-docs-list { list-style: none; padding: 0; margin: 0; }
.selected-doc-item { display: flex; align-items: center; gap: 8px; margin: 3px 0; min-width: 0; }
.selected-doc-name {
  flex: 1 1 auto; min-width: 0;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  color: #2563eb; text-decoration: underline;
}
.selected-doc-size { color: #6b7280; font-size: 0.9em; flex: 0 0 auto; }
.selected-doc-remove {
  border: none; background: #ef4444; color: #fff;
  width: 22px; height: 22px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; font-weight: 700; line-height: 1;
}
.selected-doc-remove:hover { background: #dc2626; }

/* Bouton Enregistrer: ne doit pas dépasser */
.popup-content-ajout-tache .btn-vider-archive {
  max-width: 100%;
}
/* style: masque formatage sur mobile */
@media (max-width: 480px) {
  .mobile-hide-format { display: none !important; }
}


/* Champ de commentaire prof : centré, élargi, espacé du libellé */
.feedback-compose {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.feedback-compose .tri-label {
  display: block;
  margin-bottom: 8px; /* espace entre libellé et input */
}
.feedback-compose .matiere-select {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  margin: 10px auto 0 auto; /* centré + espace */
  display: block;
}

.teacher-feedback-edit .matiere-select {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

/* Entête + bouton Voir commentaire */
.student-message-header {
  display: flex;
  align-items: center;
  gap: 8px;
}
.btn-view-comment {
  border: none;
  border-radius: 12px;
  padding: 6px 12px;
  background: #e5e7eb;
  color: #111;
  font-size: 0.9em;
  cursor: pointer;
}
.btn-view-comment:hover {
  filter: brightness(0.97);
}
[data-theme="dark"] .btn-view-comment {
  background: #374151;
  color: #fff;
}

/* Bordure verte et padding pour les sélecteurs dans le menu flottant */
.selection-toolbar .matiere-select {
  border-radius: 10px;
  border: 3.5px solid #22c55e; /* vert 3.5px */
  background-color: #fff;
  padding: 8px 8px; /* padding augmenté pour une meilleure ergonomie */
  color: #111;
  box-shadow: 0 2px 8px #00000014;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.selection-toolbar .matiere-select:focus {
  outline: none;
  border-width: 3.5px;
  border-color: #22c55e;
  box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.35);
}

/* Popover image: bordure verte pour l'input du lien */
.image-link-popover input.matiere-select {
  border: 3.5px solid #22c55e !important;
}
/* Mobile: entre 320px et 356px uniquement */
@media (min-width: 320px) and (max-width: 356px) {
  .zip-group-btn {
    font-size: 15px !important;
  }
}
</style>