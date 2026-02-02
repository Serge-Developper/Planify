<template>
  <div class="admin-dashboard">
    <div class="top-bar"></div>
    <template v-if="!showEmploi">
      <aside class="matieres-list">
        <button
          v-for="matiere in allMatieres"
          :key="matiere"
          @click="selectMatiere(matiere)"
          :class="{ selected: matiere === selectedMatiere }"
        >
          {{ matiere }}
        </button>
        <button class="add-user-btn" @click="showUserForm = true">Ajouter un utilisateur</button>
        <button class="manage-users-btn" @click="openUserManagement">Gérer les utilisateurs</button>
        <button class="manage-users-btn" @click="showSubjectsManagement = true">Gérer les matières</button>
      </aside>
      <main class="matiere-content">
        <h2>{{ selectedMatiere }}</h2>
        <form class="event-form" @submit.prevent="addEvent">
          <input v-model="eventForm.titre" placeholder="Titre de la tâche" required class="task-title-input" />
          <input v-model="eventForm.date" type="date" required />
          <input v-model="eventForm.heure" type="time" required />
          <select v-model="eventForm.groupe" required>
            <option>Promo</option>
            <option>A</option><option>A'</option><option>A"</option>
            <option>B</option><option>B'</option><option>B"</option>
          </select>
          <!-- Nouveau: multi-sélection des groupes -->
          <div class="give-item-form checkboxes" style="margin-top: -4px;">
            <label style="font-weight:600;color:#111;margin-bottom:6px;">Groupes (multi‑sélection comme les délégués)</label>
            <div class="checkbox-grid">
              <label v-for="g in groupOptions" :key="g" class="item-checkbox">
                <input type="checkbox" :value="g" v-model="eventForm.groupes" />
                <span>{{ g }}</span>
              </label>
            </div>
            <div style="color:#6b7280;font-size:0.85em;margin-top:6px;">
              Astuce: si aucun groupe n'est coché, le champ "Groupe" ci‑dessus sera utilisé par défaut.
            </div>
          </div>
          <select v-model="eventForm.type" required>
            <option value="exam">Examen</option>
            <option value="devoir">Devoir</option>
          </select>
          <!-- Spécialité/Année ciblées -->
          <select v-model="eventForm.specialite">
            <option value="">Aucune spécialité</option>
            <option value="devweb">Développement web</option>
            <option value="creation">Création numérique</option>
            <option value="strategie">Stratégie de communication</option>
          </select>
          
          <select v-model="eventForm.year" required>
            <option value="">Toutes années</option>
            <option value="BUT1">1ère année</option>
            <option value="BUT2">2ème année</option>
            <option value="BUT3">3ème année</option>
          </select>
          <div
            class="event-description-editor"
            ref="eventEditorRef"
            contenteditable="true"
            :data-placeholder="'Description (optionnelle)'"
            @input="syncEditorToModel"
            @click="onEventEditableClick"
          ></div>
          <div class="mini-toolbar" style="margin-top:8px;">
            <div class="toolbar-group">
              <button type="button" class="btn-mini rich-btn" @click="toggleEventEmoji">Emoji</button>
              <button type="button" class="btn-mini rich-btn" @click="insertEventImageUrl">Image URL</button>
              <input ref="eventFileRef" type="file" accept="image/png,image/jpeg,image/svg+xml" @change="onEventImageFileSelected" style="display:none;" />
              <button type="button" class="btn-mini rich-btn" @click="openEventFileChooser">Importer</button>
            </div>
          </div>
          <div v-if="selectedEventImage" class="image-resize-panel">
            <span style="margin-right:6px; color:#374151;">Largeur image:</span>
            <input type="range" min="80" max="900" step="10" v-model.number="eventImageWidthPx" @input="applyEventImageWidth" />
            <input type="number" min="50" max="1200" step="10" v-model.number="eventImageWidthPx" @change="applyEventImageWidth" class="ephemeral-input" style="width:90px; margin-left:8px;" />
            <span style="margin-left:6px; color:#6b7280;">px</span>
            <button type="button" class="toggle-all-btn" style="margin-left:8px;" @click="fitEventImageToEditor">Ajuster à la largeur</button>
          </div>
          <div v-if="showEventEmoji" class="emoji-panel">
            <button v-for="e in emojiList" :key="'ev_'+e" class="emoji-btn" type="button" @click="insertEventEmoji(e)">{{ e }}</button>
          </div>
          <div
            v-if="showEventSelectionToolbar"
            :style="eventSelectionToolbarStyle"
            class="selection-toolbar"
            ref="eventSelectionToolbarRef"
          >
            <div class="toolbar-group">
              <button type="button" class="btn-mini rich-btn" @click="execCmd('bold')"><b>Gras</b></button>
              <button type="button" class="btn-mini rich-btn" @click="execCmd('italic')"><i>Italique</i></button>
              <button type="button" class="btn-mini rich-btn" @click="execCmd('underline')"><u>Souligner</u></button>
              <input type="color" class="color-swatch" v-model="eventFontColor" @input="applyEventFontColor" />
              <span class="color-swatch-display" :style="{ backgroundColor: eventFontColor }"></span>
              <select v-model="eventFontSize" @change="applyEventFontSize" class="matiere-select" style="width:90px;">
                <option value="14">14</option>
                <option value="16">16</option>
                <option value="18">18</option>
                <option value="20">20</option>
                <option value="22">22</option>
                <option value="24">24</option>
                <option value="28">28</option>
                <option value="32">32</option>
              </select>
              <select v-model="eventFontFamily" @change="applyEventFontFamily" class="matiere-select">
                <option value="Cobe Heavy">Cobe Heavy</option>
                <option value="Inter">Inter</option>
                <option value="Georgia">Georgia</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Arial Black">Arial Black</option>
                <option value="Courier New">Courier New</option>
                <option value="Trebuchet MS">Trebuchet MS</option>
                <option value="Impact">Impact</option>
                <option value="Roboto">Roboto</option>
                <option value="Montserrat">Montserrat</option>
                <option value="Poppins">Poppins</option>
              </select>
            </div>
          </div>
          <button type="submit">{{ editingEventId ? 'Modifier' : 'Ajouter' }}</button>
        </form>
        <ul class="event-list">
          <li v-for="(event, idx) in filteredEvents" :key="event._id || event.titre + event.date + event.heure">
            <b>{{ event.titre }}</b> - {{ formatDate(event.date) }} {{ event.heure }}
            <span v-if="event.groupes && event.groupes.length"> - Groupes {{ event.groupes.join(', ') }}</span>
            <span v-else> - Groupe {{ event.groupe }}</span>
            - Année {{ event.year }}
            <button @click="editEvent(event, idx)">Modifier</button>
            <button @click="deleteEvent(event, idx)">Supprimer</button>
          </li>
        </ul>

        <section v-if="auth.user && auth.user.role === 'admin'" style="margin-top: 24px;">
          <h3 style="color: black;">Propositions en attente</h3>
          <div v-if="adminProposalsLoading" class="muted">Chargement…</div>
          <div v-else>
            <div v-if="adminProposals.length === 0" class="muted">Aucune proposition</div>
            <ul class="event-list">
              <li v-for="p in adminProposals" :key="p._id">
                <b>{{ p.titre }}</b> - {{ formatDate(p.date) }} {{ typeof p.heure === 'string' ? p.heure.replace('h', ':') : p.heure }}
                <span v-if="p.groupes && p.groupes.length"> - Groupes {{ p.groupes.join(', ') }}</span>
                <span v-else> - Groupe {{ p.groupe }}</span>
                - Année {{ p.year }}
                <button @click="editProposalAdmin(p)">Modifier</button>
                <button @click="deleteProposalAdmin(p)">Supprimer</button>
              </li>
            </ul>
          </div>
        </section>

        <section v-if="auth.user && auth.user.role === 'admin'" style="margin-top: 24px;">
          <h3 style="color: black;">Éditeur d'items</h3>
          <AdminItemEditor />
        </section>

        <!-- Éditeur de pop-up éphémère -->
        <section v-if="auth.user && auth.user.role === 'admin'" style="margin-top: 24px;">
          <h3 style="color: black;">Éditeur de pop-up (éphémère)</h3>
          <div class="ephemeral-editor">
            <div style="margin-bottom:8px; font-size:0.95rem; color:#374151;">Astuce: la liste d'utilisateurs se charge automatiquement quand on ouvre le Dashboard.</div>
            <div class="row">
              <label>Cible :</label>
              <select v-model="popupTarget" class="ephemeral-select">
                <option value="all">Tous les utilisateurs</option>
                <option value="user">Un utilisateur spécifique</option>
              </select>
              <select v-if="popupTarget === 'user'" v-model="popupUserId" class="ephemeral-select">
                <option value="" disabled>Sélectionner un utilisateur…</option>
                <option v-for="u in users" :key="u._id" :value="u._id">{{ u.username }} ({{ u.role }})</option>
              </select>
            </div>
            <div class="toolbar">
              <button type="button" @mousedown.prevent="() => focusEditorAndPreserveSelection()" @click="applyBold"><b>Gras</b></button>
              <button type="button" @mousedown.prevent="() => focusEditorAndPreserveSelection()" @click="execCmd('italic')"><i>Italique</i></button>
              <button type="button" @mousedown.prevent="() => focusEditorAndPreserveSelection()" @click="execCmd('underline')"><u>Souligné</u></button>
              <label style="margin-left:6px;">Taille:</label>
              <select v-model="fontSizePx" @change="applySelectedFontSize" class="ephemeral-select">
                <option value="14">14</option>
                <option value="16">16</option>
                <option value="18">18</option>
                <option value="20">20</option>
                <option value="24">24</option>
                <option value="28">28</option>
                <option value="32">32</option>
              </select>
              <input type="color" v-model="currentColor" @input="applyColor" title="Couleur du texte" />
              <button type="button" @click="showEmojiPicker = !showEmojiPicker">😀 Emojis rapides</button>
              <button type="button" @click="openFullEmojiPicker">Tous les emojis…</button>
              <button type="button" @click="insertImagePrompt">Image (URL)</button>
              <button type="button" @click="openFileChooser">Importer image</button>
              <input ref="fileInputRef" type="file" accept="image/png,image/jpeg,image/svg+xml" @change="onImageFileSelected" style="display:none;" />
            </div>
            <div v-if="selectedImage" class="image-resize-panel">
              <span style="margin-right:6px; color:#374151;">Largeur image:</span>
              <input type="range" min="80" max="592" step="10" v-model.number="imageWidthPx" @input="applyImageWidth" />
              <input type="number" min="50" max="592" step="10" v-model.number="imageWidthPx" @change="applyImageWidth" class="ephemeral-input" style="width:90px; margin-left:8px;" />
              <span style="margin-left:6px; color:#6b7280;">px</span>
              <button type="button" class="toggle-all-btn" style="margin-left:8px;" @click="fitImageToEditor">Remplir la largeur</button>
            </div>
            <div v-if="showEmojiPicker" class="emoji-panel">
              <button v-for="e in emojiList" :key="e" class="emoji-btn" type="button" @click="insertEmoji(e)">{{ e }}</button>
            </div>
            <div v-if="showFullEmojiPicker" class="emoji-picker-full">
              <input type="text" v-model="emojiSearch" placeholder="Rechercher un emoji..." class="ephemeral-input" />
              <div class="emoji-grid">
                <button v-for="e in allEmojisFiltered" :key="e" class="emoji-btn" type="button" @click="insertEmoji(e)">{{ e }}</button>
              </div>
            </div>
            <div ref="editorRef" class="editable" contenteditable="true" :placeholder="'Tapez votre message ici...'" @click="onEditableClick"></div>

            <!-- Menu flottant près de la sélection -->
            <div
              ref="selectionToolbarRef"
              v-show="showSelectionToolbar"
              class="selection-toolbar"
              :style="{ position: 'fixed', top: selectionToolbarPos.top + 'px', left: selectionToolbarPos.left + 'px', transform: selectionToolbarTransform }"
            >
              <div class="toolbar-group">
                <button type="button" class="btn-mini" @click="applyBold"><b>Gras</b></button>
                <button type="button" class="btn-mini" @click="execCmd('italic')"><i>Italique</i></button>
                <button type="button" class="btn-mini" @click="execCmd('underline')"><u>Souligné</u></button>
                <span class="toolbar-divider"></span>
                <input type="color" v-model="selectionColor" class="color-swatch" title="Couleur" @input="applySelectionColor" />
                <select v-model="selectionFontSize" @change="applySelectionFontSize" class="matiere-select" style="width:90px;">
                  <option value="14">14</option>
                  <option value="16">16</option>
                  <option value="18">18</option>
                  <option value="20">20</option>
                  <option value="24">24</option>
                  <option value="28">28</option>
                  <option value="32">32</option>
                </select>
                <select v-model="selectionFontFamily" @change="applySelectionFontFamily" class="matiere-select">
                  <option v-for="f in availableFonts" :key="f.value" :value="f.value">{{ f.label }}</option>
                </select>
              </div>
            </div>

            <!-- Popover lien d’image -->
            <div v-if="showImageLinkPopover" :style="popoverStyle" class="image-link-popover">
              <input v-model="imageLink" type="text" placeholder="Lien (https://...)" class="ephemeral-input" style="width:260px;" />
              <div style="display:flex; gap:8px; margin-top:8px;">
                <button type="button" class="btn-mini" @click="setImageLink">Appliquer le lien</button>
                <button type="button" class="btn-mini" @click="removeImageLink">Supprimer le lien</button>
                <button type="button" class="btn-mini" @click="closeImagePopover">Fermer</button>
              </div>
            </div>

            <div class="actions">
              <button class="send-btn" @click="sendPopup" :disabled="sending">{{ sending ? 'Envoi...' : 'Envoyer la pop-up' }}</button>
            </div>
            <div v-if="popupError" class="popup-error">{{ popupError }}</div>
            <div v-if="popupOk" class="popup-ok">✅ Pop-up envoyée</div>
          </div>
        </section>

        <!-- Patch Notes (minimal) -->
        <section v-if="auth.user && auth.user.role === 'admin'" style="margin-top: 24px;">
          <h3 style="color: black;">Patch Notes</h3>
          <div class="ephemeral-editor">
            <div class="row">
              <label style="color:#000;">Titre :</label>
              <input v-model="pnTitle" class="ephemeral-input" placeholder="Version 4 de Planify" />
              <label style="color:#000;">Version :</label>
              <input v-model="pnVersion" class="ephemeral-input" placeholder="v4.0" style="width:120px;" />
              <label style="color:#000;">Mettre en surbrillance “À propos” :</label>
              <select v-model="pnNotify" class="ephemeral-select">
                <option :value="true">Oui</option>
                <option :value="false">Non</option>
              </select>
            </div>

            <!-- AJOUT: barre d’outils basique -->
            <div class="toolbar">
              <button type="button" @mousedown.prevent="() => pnFocusEditorAndPreserveSelection()" @click="pnApplyBold"><b>Gras</b></button>
              <button type="button" @mousedown.prevent="() => pnFocusEditorAndPreserveSelection()" @click="pnExecCmd('italic')"><i>Italique</i></button>
              <button type="button" @mousedown.prevent="() => pnFocusEditorAndPreserveSelection()" @click="pnExecCmd('underline')"><u>Souligné</u></button>
              <label style="margin-left:6px;">Taille:</label>
              <select v-model="pnFontSizePx" @change="pnApplySelectedFontSize" class="ephemeral-select">
                <option value="14">14</option>
                <option value="16">16</option>
                <option value="18">18</option>
                <option value="20">20</option>
                <option value="24">24</option>
                <option value="28">28</option>
                <option value="32">32</option>
              </select>
              <input type="color" v-model="pnCurrentColor" @input="pnApplyColor" title="Couleur du texte" />
              <button type="button" @click="pnShowEmojiPicker = !pnShowEmojiPicker">😀 Emojis rapides</button>
              <button type="button" @click="pnOpenFullEmojiPicker">Tous les emojis…</button>
              <button type="button" @click="pnInsertImagePrompt">Image (URL)</button>
              <button type="button" @click="pnOpenFileChooser">Importer image</button>
              <input ref="pnFileInputRef" type="file" accept="image/png,image/jpeg,image/svg+xml" @change="pnOnImageFileSelected" style="display:none;" />
            </div>

            <div v-if="pnSelectedImage" class="image-resize-panel">
              <span style="margin-right:6px; color:#374151;">Largeur image:</span>
              <input type="range" min="80" max="592" step="10" v-model.number="pnImageWidthPx" @input="pnApplyImageWidth" />
              <input type="number" min="50" max="592" step="10" v-model.number="pnImageWidthPx" @change="pnApplyImageWidth" class="ephemeral-input" style="width:90px; margin-left:8px;" />
              <span style="margin-left:6px; color:#6b7280;">px</span>
              <button type="button" class="toggle-all-btn" style="margin-left:8px;" @click="pnFitImageToEditor">Remplir la largeur</button>
            </div>

            <div v-if="pnShowEmojiPicker" class="emoji-panel">
              <button v-for="e in emojiList" :key="e" class="emoji-btn" type="button" @click="pnInsertEmoji(e)">{{ e }}</button>
            </div>
            <div v-if="pnShowFullEmojiPicker" class="emoji-picker-full">
              <input type="text" v-model="pnEmojiSearch" placeholder="Rechercher un emoji..." class="ephemeral-input" />
              <div class="emoji-grid">
                <button v-for="e in pnAllEmojisFiltered" :key="e" class="emoji-btn" type="button" @click="pnInsertEmoji(e)">{{ e }}</button>
              </div>
            </div>

            <div v-if="pnShowImageLinkPopover" :style="pnPopoverStyle" class="image-link-popover">
              <input v-model="pnImageLink" type="text" placeholder="Lien (https://...)" class="ephemeral-input" style="width:260px;" />
              <div style="display:flex; gap:8px; margin-top:8px;">
                <button type="button" class="btn-mini" @click="pnSetImageLink">Appliquer le lien</button>
                <button type="button" class="btn-mini" @click="pnRemoveImageLink">Supprimer le lien</button>
                <button type="button" class="btn-mini" @click="pnCloseImagePopover">Fermer</button>
              </div>
            </div>
            <div class="editable" ref="pnEditorRef" contenteditable="true" :placeholder="'Contenu du patch note (texte + images via <img src=\'...\'>)'" @click="pnOnEditableClick"></div>

            <div
              ref="pnSelectionToolbarRef"
              v-show="pnShowSelectionToolbar"
              class="selection-toolbar"
              :style="{ position: 'fixed', top: pnSelectionToolbarPos.top + 'px', left: pnSelectionToolbarPos.left + 'px', transform: pnSelectionToolbarTransform }"
            >
              <div class="toolbar-group">
                <button type="button" class="btn-mini" @click="pnApplyBold"><b>Gras</b></button>
                <button type="button" class="btn-mini" @click="pnExecCmd('italic')"><i>Italique</i></button>
                <button type="button" class="btn-mini" @click="pnExecCmd('underline')"><u>Souligné</u></button>
                <span class="toolbar-divider"></span>
                <input type="color" v-model="pnSelectionColor" class="color-swatch" title="Couleur" @input="pnApplySelectionColor" />
                <select v-model="pnSelectionFontSize" @change="pnApplySelectionFontSize" class="matiere-select" style="width:90px;">
                  <option value="14">14</option>
                  <option value="16">16</option>
                  <option value="18">18</option>
                  <option value="20">20</option>
                  <option value="24">24</option>
                  <option value="28">28</option>
                  <option value="32">32</option>
                </select>
                <select v-model="pnSelectionFontFamily" @change="pnApplySelectionFontFamily" class="matiere-select">
                  <option v-for="f in availableFonts" :key="f.value" :value="f.value">{{ f.label }}</option>
                </select>
              </div>
            </div>

            <div class="actions">
              <button
                class="send-btn"
                @click="sendPatchNote"
                :disabled="pnSending"
              >
                {{ pnSending ? (pnEditingId ? 'Mise à jour…' : 'Publication…') : (pnEditingId ? 'Mettre à jour le patch note' : 'Publier le patch note') }}
              </button>
              <button
                v-if="pnEditingId"
                type="button"
                class="btn-mini"
                style="margin-left:8px;"
                @click="cancelEditPatchNote"
              >
                Annuler la modification
              </button>
            </div>
            <div v-if="pnError" class="popup-error">{{ pnError }}</div>
            <div v-if="pnOk" class="popup-ok">✅ {{ pnEditingId ? 'Mise à jour enregistrée' : 'Patch note publié' }}</div>

            <!-- Ajout: listing des patch notes existants -->
            <div style="margin-top:16px; border-top:1px solid #e5e7eb; padding-top:12px;">
              <h4 style="margin:0 0 8px; color:#000;">Patch notes existants</h4>
              <div v-if="pnListLoading" style="color:#6b7280;">Chargement…</div>
              <div v-else>
                <div v-if="!pnList.length" style="color:#6b7280;">Aucun patch note publié pour l’instant.</div>
                <ul class="pn-admin-list" style="list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:8px;">
                  <li
                    v-for="n in pnList"
                    :key="n._id || n.id"
                    style="display:flex; align-items:center; justify-content:space-between; padding:8px; background:#f9fafb; border:1px solid #e5e7eb; border-radius:8px;"
                  >
                    <div style="display:flex; gap:8px; align-items:center; color:#111;">
                      <span style="font-weight:600;">{{ n.title }}</span>
                      <span style="color:#6b7280;">{{ n.version }}</span>
                      <span style="color:#9ca3af;">{{ pnFormatDate(n.createdAt) }}</span>
                    </div>
                    <div style="display:flex; gap:8px;">
                      <button type="button" class="btn-mini" @click="beginEditPatchNote(n)">Modifier</button>
                      <button
                        type="button"
                        class="btn-mini"
                        style="color:#b91c1c;"
                        @click="deletePatchNote(n)"
                        :disabled="pnDeleteBusyId === (n._id || n.id)"
                      >
                        {{ pnDeleteBusyId === (n._id || n.id) ? 'Suppression…' : 'Supprimer' }}
                      </button>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <!-- Système de codes (admin) -->
        <section v-if="auth.user && auth.user.role === 'admin'" style="margin-top: 24px;">
          <h3 style="color: black;">Codes de récompense</h3>

          <!-- Choix du type de récompense -->
          <div class="row" style="display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin-bottom:10px;">
            <label style="color: #000;">Type :</label>
            <select v-model="rcType" class="ephemeral-select">
              <option value="item">Item</option>
              <option value="border-color">Couleur de bordure</option>
            </select>

            <label style="color: #000;">Longueur :</label>
            <input type="number" v-model.number="rcLength" min="6" max="24" class="ephemeral-input" style="width:90px;" />

            <label style="color: #000;">Max utilisations :</label>
            <input type="number" v-model.number="rcMaxUses" min="1" max="9999" class="ephemeral-input" style="width:110px;" />

            <label style="color: #000;">Expire le :</label>
            <input type="datetime-local" v-model="rcExpiresAt" class="ephemeral-input" />
          </div>

          <!-- Sélection d'item -->
          <div v-if="rcType === 'item'" class="give-item-form checkboxes" style="margin-top:8px;">
            <div style="margin-bottom:8px;">
              <input v-model="rcItemFilter" placeholder="Filtrer par id ou nom d'item..." class="ephemeral-input" />
            </div>

            <div style="max-height: 260px; overflow-y: auto; padding-right:6px; border:1px solid #e5e7eb; border-radius:8px; background:#ffffff;">
              <div class="checkbox-grid" style="padding:8px;">
                <label v-for="it in filteredItemsForCodes" :key="it.id" class="item-checkbox">
                  <input
                    type="checkbox"
                    :value="it.id"
                    :checked="rcSelectedItemIds.includes(it.id)"
                    @change="onToggleSelectItem(it, $event)"
                  />
                  <span>{{ it.name }} ({{ it.id }})</span>
                </label>
              </div>
            </div>
            <div style="margin-top:6px; color:#111827;">Sélection: {{ rcSelectedItemIds.length }} item(s)</div>
          </div>

          <!-- Sélection de couleur de bordure -->
          <div v-else class="give-item-form checkboxes" style="margin-top:8px;">
            <div style="margin-bottom:8px;">
              <input v-model="rcColorFilter" placeholder="Filtrer par id ou nom de couleur..." class="ephemeral-input" />
            </div>

            <div v-if="borderColorsLoading" style="color:#6b7280;">Chargement des couleurs...</div>
            <div v-else-if="!filteredBorderColors.length" style="color:#6b7280;">Aucune couleur disponible</div>

            <div v-else style="max-height: 260px; overflow-y: auto; padding-right:6px; border:1px solid #e5e7eb; border-radius:8px; background:#ffffff;">
              <div class="checkbox-grid" style="padding:8px;">
                <label v-for="c in filteredBorderColors" :key="c.id" class="item-checkbox">
                  <input
                    type="checkbox"
                    :value="c.id"
                    :checked="rcSelectedColorIds.includes(c.id)"
                    @change="onToggleSelectColor(c, $event)"
                  />
                  <span>{{ c.name }} (#{{ c.id }})</span>
                </label>
              </div>
            </div>
            <div style="margin-top:6px; color:#111827;">Sélection: {{ rcSelectedColorIds.length }} couleur(s)</div>
          </div>

          <!-- Actions de génération -->
          <div class="actions" style="margin-top:12px; display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
            <button type="button" class="send-btn" @click="generateRedeemCode">Générer un code</button>

            <div v-if="lastGeneratedCode" style="display:flex; gap:8px; align-items:center;">
              <span style="color: #000;">Dernier code généré :</span>
              <code style="background:#f3f4f6; padding:4px 6px; border-radius:4px; color:#111827;">{{ lastGeneratedCode }}</code>
              <button type="button" class="toggle-all-btn" @click="copyRedeemCode">Copier</button>
            </div>
          </div>

          <!-- Liste des codes existants -->
          <div style="margin-top:16px;">
            <h4 style="color:black; margin-bottom:6px;">Codes existants</h4>
            <div v-if="redeemCodesLoading">Chargement…</div>
            <div v-else>
              <div v-if="!redeemCodesList || redeemCodesList.length === 0" style="color:#6b7280;">Aucun code</div>
              <ul v-else class="event-list">
                <li v-for="rc in redeemCodesList" :key="rc._id" style="display:flex; gap:12px; align-items:center; flex-wrap:wrap;">
                  <b>{{ rc.code }}</b>
                  <span>— {{ describeReward(rc) }}</span>
                  <span>— {{ rc.usedCount || 0 }}/{{ rc.maxUses || 1 }} utilisé(s)</span>
                  <span>— Expire: {{ formatRedeemDate(rc.expiresAt) }}</span>
                  <button class="delete-btn" @click="deleteRedeemCode(rc._id)" :disabled="deletingCodeId === rc._id">
                    {{ deletingCodeId === rc._id ? 'Suppression…' : 'Supprimer' }}
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <!-- Historique des boutiques (items + couleurs) -->
        <section v-if="auth.user && auth.user.role === 'admin'" style="margin-top: 24px;">
          <h3 style="color: black;">Historique des boutiques quotidiennes</h3>
          <button class="btn secondary" @click="openShopHistory" :disabled="loadingShopHistory">
            {{ loadingShopHistory ? 'Chargement...' : 'Voir l’historique' }}
          </button>
        </section>
        <section v-if="auth.user && auth.user.role === 'admin'" style="margin-top: 16px;">
          <h3 style="color: black;">Gestion de la boutique quotidienne</h3>
          <div class="admin-card">
            <div class="row" style="display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin-top:10px;">
              <button class="btn secondary" @click="refreshDailyShop" :disabled="dailyShopLoading">Actualiser boutique</button>
              <button class="btn secondary" @click="rerollDailyShop" :disabled="rerollLoading">Reset total</button>
            </div>
            <div class="row" style="display:flex; gap:12px; flex-wrap:wrap; align-items:center;">
              <span>Items: {{ dailyShopItemsIds.map(id => itemNameByIdMap[id] || ('#'+id)).join(', ') }}</span>
              <span>Couleurs: {{ dailyShopColorIds.map(id => colorNameByIdMap[id] || ('#'+id)).join(', ') }}</span>
            </div>
            <div class="row" style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
              <select v-for="(v,i) in adminSetItemsInputs" :key="'top-set-item-'+i" v-model="adminSetItemsInputs[i]" class="ephemeral-select" style="width:220px;">
                <option value="">(Choisir item)</option>
                <option v-for="opt in selectableItemsOptions" :key="'opt-item-'+i+'-'+opt.id" :value="opt.id">{{ opt.name }}</option>
              </select>
              <select v-for="(v,i) in adminSetColorsInputs" :key="'top-set-color-'+i" v-model="adminSetColorsInputs[i]" class="ephemeral-select" style="width:220px;">
                <option value="">(Choisir couleur)</option>
                <option v-for="col in selectableColorOptions" :key="'opt-color-'+i+'-'+col.id" :value="col.id">{{ col.name }}</option>
              </select>
              <button class="btn-mini" @click="adminSetDailyShop" :disabled="dailyShopLoading">Appliquer sélection</button>
            </div>
            <div class="row" style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
              <select v-model="replaceItemOldId" class="ephemeral-select" style="width:180px;">
                <option v-for="id in dailyShopItemsIds" :key="'top-old-item-'+id" :value="id">{{ itemNameByIdMap[id] || ('#'+id) }}</option>
              </select>
              <select v-model="replaceItemNewId" class="ephemeral-select" style="width:220px;">
                <option value="">(Choisir item)</option>
                <option v-for="opt in selectableItemsOptions" :key="'new-item-'+opt.id" :value="opt.id">{{ opt.name }}</option>
              </select>
              <button class="btn-mini" @click="adminReplaceDailyItem" :disabled="dailyShopLoading">Remplacer item</button>
            </div>
            <div class="row" style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
              <select v-model="replaceColorOldId" class="ephemeral-select" style="width:180px;">
                <option v-for="id in dailyShopColorIds" :key="'top-old-color-'+id" :value="id">{{ colorNameByIdMap[id] || ('#'+id) }}</option>
              </select>
              <select v-model="replaceColorNewId" class="ephemeral-select" style="width:220px;">
                <option value="">(Choisir couleur)</option>
                <option v-for="col in selectableColorOptions" :key="'new-color-'+col.id" :value="col.id">{{ col.name }}</option>
              </select>
              <button class="btn-mini" @click="adminReplaceDailyColor" :disabled="dailyShopLoading">Remplacer couleur</button>
            </div>
            <div class="row" style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
              <button class="btn secondary" @click="resetItemsOnly" :disabled="dailyShopLoading || rerollLoading">Changer trio items</button>
              <button class="btn secondary" @click="resetColorsOnly" :disabled="dailyShopLoading || rerollLoading">Changer trio couleurs</button>
            </div>
          </div>
        </section>

        <!-- Factions — Planify Coins collectés -->
        <section v-if="auth.user && auth.user.role === 'admin'" style="margin-top: 24px;">
          <h3 style="color: black;">Factions — Planify Coins collectés</h3>
          <div class="admin-card">
            <!-- Édition des totaux par faction -->
            <div class="row" style="display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin-top:10px;">
              <label style="min-width:120px;">Total Bagnat</label>
              <input type="number" v-model.number="factionTotals.Bagnat" min="0" step="1" />
              <button class="btn-mini" @click="saveFactionTotal('Bagnat')" :disabled="factionsBusy">Sauvegarder</button>
            </div>
            <div class="row" style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
              <label style="min-width:120px;">Total Fermier</label>
              <input type="number" v-model.number="factionTotals.Fermier" min="0" step="1" />
              <button class="btn-mini" @click="saveFactionTotal('Fermier')" :disabled="factionsBusy">Sauvegarder</button>
            </div>

            <!-- Notification résultat des factions -->
            <div class="row" style="margin-top:16px; display:flex; gap:12px; align-items:center; flex-wrap:wrap;">
              <h4 style="margin:0; color:#000;">Notifier le résultat des factions</h4>
              <button class="btn-mini" @click="notifyFactionResult" :disabled="notifyFactionLoading">
                {{ notifyFactionLoading ? 'Envoi…' : 'Envoyer les notifications' }}
              </button>
            </div>
            <div class="row" style="display:flex; gap:12px; align-items:flex-start; flex-wrap:wrap;">
              <div style="flex:1; min-width:280px;">
                <label class="field-label" for="winner-msg">Message (faction gagnante)</label>
                <input id="winner-msg" v-model="winnerMessage" placeholder="Votre faction a gagné 🎉" />
              </div>
              <div style="flex:1; min-width:280px;">
                <label class="field-label" for="loser-msg">Message (faction perdante)</label>
                <input id="loser-msg" v-model="loserMessage" placeholder="Votre faction fera mieux la prochaine fois 💪" />
              </div>
            </div>

            <!-- Reset des coins de faction -->
            <div class="row" style="margin-top:16px; display:flex; gap:12px; align-items:center; flex-wrap:wrap;">
              <h4 style="margin:0; color:#000;">Reset des coins de faction</h4>
              <button class="delete-btn" @click="resetFactionCoins" :disabled="resetFactionCoinsLoading">
                {{ resetFactionCoinsLoading ? 'Reset…' : 'Réinitialiser (factions + membres)' }}
              </button>
              <span style="color:#6b7280;">
                Met à zéro les totaux des factions et les coins de faction des membres Bagnat / Fermier.
              </span>
            </div>

            <!-- Bloc d’attribution par faction -->
            <div class="row" style="margin-top:16px; display:flex; gap:12px; align-items:center; flex-wrap:wrap;">
              <h4 style="margin:0; color:#000;">Attribution de coins de faction</h4>
            </div>
            <div class="row" style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
              <label>Faction</label>
              <select v-model="selectedFactionForAward">
                <option value="Bagnat">Bagnat</option>
                <option value="Fermier">Fermier</option>
              </select>
              <button class="btn-mini" @click="toggleSelectAllFaction" :disabled="filteredFactionUsers.length === 0">
                {{ selectedFactionUserIds.length === filteredFactionUsers.length && filteredFactionUsers.length > 0 ? 'Tout désélectionner' : 'Tout sélectionner' }}
              </button>
            </div>
            <div class="row" style="display:flex; gap:12px; align-items:flex-start; flex-wrap:wrap;">
              <div style="flex:1; min-width:280px;">
                <div v-if="filteredFactionUsers.length === 0" style="color:#6b7280;">Aucun membre dans cette faction.</div>
                <div v-else class="checkbox-grid">
                  <label v-for="u in filteredFactionUsers" :key="u._id" class="item-checkbox">
                    <input type="checkbox" :value="u._id" v-model="selectedFactionUserIds" />
                    <span>{{ u.username }}</span>
                  </label>
                </div>
              </div>
              <div style="flex:1; min-width:280px;">
                <label class="field-label" for="faction-give-amount">Montant à ajouter</label>
                <input id="faction-give-amount" type="number" v-model.number="factionGiveAmount" min="-100000" step="1" placeholder="Ex: 10" />
                <div style="margin-top:8px; display:flex; align-items:center; gap:8px;">
                  <input id="faction-send-popup" type="checkbox" v-model="factionSendPopup" />
                  <label for="faction-send-popup" style="color:#000;">Envoyer une pop-up aux bénéficiaires</label>
                </div>
                <input
                  v-model="factionPopupMessage"
                  class="ephemeral-input"
                  placeholder="Message facultatif (ex: bravo l'équipe !)"
                  style="margin-top:8px; width:100%;"
                />
                <button
                  class="give-item-btn"
                  style="margin-top:12px;"
                  @click="giveFactionCoinsToSelected"
                  :disabled="factionGiveLoading || selectedFactionUserIds.length === 0 || !Number.isFinite(factionGiveAmount) || factionGiveAmount === 0"
                >
                  {{ factionGiveLoading ? 'Traitement…' : ('Donner ' + factionGiveAmount + ' à ' + selectedFactionUserIds.length + ' membre(s)') }}
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- Gestion des matières déplacée en modal -->
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
            <!-- Spécialité MMI -->
            <select v-model="userForm.specialite" :disabled="userForm.role === 'prof'" :class="{ 'disabled-field': userForm.role === 'prof' }">
              <option value="">Aucune spécialité</option>
              <option value="devweb">Développement web</option>
              <option value="creation">Création numérique</option>
              <option value="strategie">Stratégie de communication</option>
            </select>
            <select v-model="userForm.department" required>
              <option value="MMI">MMI</option>
              <option value="TC">TC</option>
              <option value="INFO">INFO</option>
              <option value="INFOCOM">INFOCOM</option>
              <option value="GEA">GEA</option>
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
          
          <!-- Actions multi (ouvre la pop-up unifiée) -->
          <div v-if="!editingUser" style="display:flex;gap:10px;align-items:center;margin:8px 0 14px;">
            <button type="button" class="give-item-btn" @click="openBulkGive">
              Donner (sélection multi)
            </button>
          </div>

          <!-- Barre d'actions pour la sélection multiple -->
          <div v-if="!editingUser" class="bulk-actions" style="display:flex;gap:10px;align-items:center;margin:8px 0 14px;">
            <button type="button" class="toggle-all-btn" @click="toggleSelectAllUsers">
              {{ selectedUserIds.length === users.length && users.length > 0 ? 'Tout désélectionner' : 'Tout sélectionner' }}
            </button>
            <button type="button" class="give-item-btn" @click="openBulkGive" :disabled="selectedUserIds.length === 0">
              Donner aux sélectionnés ({{ selectedUserIds.length }})
            </button>
            <button type="button" class="remove-item-btn" @click="openBulkRemove" :disabled="selectedUserIds.length === 0">
              Retirer aux sélectionnés ({{ selectedUserIds.length }})
            </button>
            <button type="button" class="export-btn" @click="exportUsersPdf">
              Exporter PDF des utilisateurs
            </button>
          </div>

          <!-- Liste des utilisateurs -->
          <div class="users-list" v-if="!editingUser">
            <div v-for="user in users" :key="user._id" class="user-item">
              <!-- Checkbox de sélection -->
              <input
                type="checkbox"
                class="user-select"
                :value="user._id"
                v-model="selectedUserIds"
                style="margin-right:10px;align-self:flex-start;"
              />
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
              <label class="field-label" for="edit-username">Nom d'utilisateur</label>
              <input id="edit-username" v-model="editForm.username" placeholder="Nom d'utilisateur" required />
              
              <label class="field-label" for="edit-password">Nouveau mot de passe</label>
              <input id="edit-password" v-model="editForm.password" type="password" placeholder="Nouveau mot de passe (laisser vide pour ne pas changer)" />
              
              <label class="field-label" for="edit-coins">Planify Coins</label>
              <input id="edit-coins" v-model.number="editForm.coins" type="number" placeholder="PlanifyCoins" min="0" />
              <label class="field-label">Pop-up lors du changement de coins</label>
              <div class="row" style="display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin-bottom:10px;">
                <input id="send-coins-popup" type="checkbox" v-model="sendCoinsPopup" />
                <label for="send-coins-popup" style="color:#000;">Envoyer une pop-up à l'utilisateur</label>
                <input
                  v-model="coinsPopupMessage"
                  class="ephemeral-input"
                  placeholder="Message facultatif (ex: raison du don)"
                  style="flex:1; min-width:240px;"
                />
              </div>
              
              <label class="field-label" for="edit-leaderboard-coins">Leaderboard Coins</label>
              <input id="edit-leaderboard-coins" v-model.number="editForm.leaderboardCoins" type="number" placeholder="Leaderboard Coins" min="0" />
              
              <label class="field-label" for="edit-faction-coins">Coins de faction</label>
              <input id="edit-faction-coins" v-model.number="editForm.factionCoins" type="number" placeholder="Faction Coins" min="0" />
              
              <label class="field-label" for="edit-role">Rôle</label>
              <select id="edit-role" v-model="editForm.role" @change="handleEditRoleChange" required>
                <option value="eleve">Étudiant</option>
                <option value="delegue">Délégué</option>
                <option value="prof">Professeur</option>
                <option value="admin">Admin</option>
              </select>
              
              <label class="field-label" for="edit-groupe">Groupe</label>
              <select id="edit-groupe" v-model="editForm.groupe" :disabled="editForm.role === 'prof'" :class="{ 'disabled-field': editForm.role === 'prof' }">
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
              
              <label class="field-label" for="edit-year">Année</label>
              <select id="edit-year" v-model="editForm.year" :disabled="editForm.role === 'prof'" :class="{ 'disabled-field': editForm.role === 'prof' }">
                <option value="">Aucune année</option>
                <option value="BUT1">1ère année</option>
                <option value="BUT2">2ème année</option>
                <option value="BUT3">3ème année</option>
              </select>
              
              <label class="field-label" for="edit-specialite">Spécialité</label>
              <select id="edit-specialite" v-model="editForm.specialite" :disabled="editForm.role === 'prof'" :class="{ 'disabled-field': editForm.role === 'prof' }">
                <option value="">Aucune spécialité</option>
                <option value="devweb">Développement web</option>
                <option value="creation">Création numérique</option>
                <option value="strategie">Stratégie de communication</option>
              </select>

              <label class="field-label" for="edit-department">Études</label>
              <select id="edit-department" v-model="editForm.department" required>
                <option value="">Aucune</option>
                <option value="MMI">MMI</option>
                <option value="TC">TC</option>
                <option value="INFO">INFO</option>
                <option value="INFOCOM">INFOCOM</option>
                <option value="GEA">GEA</option>
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
      <!-- Modal pour don en masse -->
<div v-if="showBulkGive" class="modal items-overlay" @click.self="closeBulkGive">
  <div class="user-items-modal" @click.stop>
    <h3 style="color:#000; margin-bottom: 16px;">
      Donner aux utilisateurs sélectionnés ({{ selectedUserIds.length }})
    </h3>

    <!-- Items classiques -->
    <div class="give-items-section">
      <h4>Donner des items</h4>
      <div class="give-item-form checkboxes">
        <div class="checkbox-grid">
          <label v-for="(it, idx) in itemsCatalog.filter(Boolean)" :key="(it && it.id) ?? idx" class="item-checkbox">
            <input type="checkbox" :value="it?.id" v-model="selectedItemsToGive" />
            <span>{{ it?.name || ('Item ' + ((it && it.id) ?? idx)) }}</span>
          </label>
        </div>

        <!-- Message admin -->
        <div class="admin-message-section">
          <label for="admin-message-bulk" class="message-label">
            Message optionnel pour l'utilisateur :
          </label>
          <textarea
            id="admin-message-bulk"
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
        </div>
      </div>
    </div>

    <!-- Couleurs de bordure dynamiques -->
    <div class="give-items-section" v-if="borderColors && borderColors.length">
      <h4>Couleurs de bordure dynamiques</h4>
      <div class="give-item-form checkboxes">
        <div class="checkbox-grid">
          <label v-for="c in borderColors" :key="c.id" class="item-checkbox">
            <input type="checkbox" :value="c.id" v-model="selectedBorderToGiveList" />
            <span>
              <span :style="{display:'inline-block',width:'14px',height:'14px',borderRadius:'4px',background: c.gradient || c.color || '#000', marginRight: '6px'}"></span>
              {{ c.name }} ({{ c.id }})
            </span>
          </label>
        </div>
      </div>
    </div>

    <!-- Items dynamiques -->
    <div class="give-items-section" v-if="dynamicItemsCatalog && dynamicItemsCatalog.length">
      <h4>Items dynamiques</h4>
      <div class="give-item-form checkboxes">
        <div class="checkbox-grid">
          <label v-for="it in dynamicItemsCatalog" :key="it.id" class="item-checkbox">
            <input type="checkbox" :value="it.id" v-model="selectedDynamicItemsToGive" />
            <span>{{ it.name }} ({{ it.id }})</span>
          </label>
        </div>
      </div>
    </div>

    <div class="modal-footer" style="display:flex;gap:10px;flex-wrap:wrap;">
      <button @click="closeBulkGive" class="close-btn">Fermer</button>
      <button
        @click="giveSelectedItemsToMany"
        class="give-item-btn"
        :disabled="bulkLoading || (selectedItemsToGive.length === 0 && selectedBorderToGiveList.length === 0 && selectedDynamicItemsToGive.length === 0)"
      >
        {{ bulkLoading ? 'Traitement…' : ('Donner à ' + selectedUserIds.length + ' utilisateur(s) (' + (selectedItemsToGive.length + selectedBorderToGiveList.length + selectedDynamicItemsToGive.length) + ')') }}
      </button>
    </div>
  </div>
</div>
<!-- Nouvelle modale: retrait en masse -->
<div v-if="showBulkRemove" class="modal items-overlay" @click.self="closeBulkRemove">
  <div class="user-items-modal" @click.stop>
    <h3 style="color:#000; margin-bottom: 16px;">
      Retirer aux utilisateurs sélectionnés ({{ selectedUserIds.length }})
    </h3>

    <!-- Items classiques à retirer -->
    <div class="give-items-section">
      <h4>Retirer des items</h4>
      <div class="give-item-form checkboxes">
        <div class="checkbox-grid">
          <label v-for="(it, idx) in itemsCatalog.filter(Boolean)" :key="(it && it.id) ?? idx" class="item-checkbox">
            <input type="checkbox" :value="it?.id" v-model="selectedItemsToRemove" />
            <span>{{ it?.name || ('Item ' + ((it && it.id) ?? idx)) }}</span>
          </label>
        </div>
        <div class="checkbox-actions">
          <button type="button" class="toggle-all-btn" @click="toggleSelectAllRemove">
            {{ selectedItemsToRemove.length === itemsCatalog.length ? 'Tout désélectionner' : 'Tout sélectionner' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Items dynamiques -->
    <div class="give-items-section" v-if="dynamicItemsCatalog && dynamicItemsCatalog.length">
      <h4>Items dynamiques</h4>
      <div class="give-item-form checkboxes">
        <div class="checkbox-grid">
          <label v-for="it in dynamicItemsCatalog" :key="it.id" class="item-checkbox">
            <input type="checkbox" :value="it.id" v-model="selectedDynamicItemsToRemove" />
            <span>{{ it.name }} ({{ it.id }})</span>
          </label>
        </div>
      </div>
    </div>

    <div class="modal-footer" style="display:flex;gap:10px;flex-wrap:wrap;">
      <button @click="closeBulkRemove" class="close-btn">Fermer</button>
      <button
        @click="removeSelectedItemsFromMany"
        class="remove-item-btn"
        :disabled="bulkLoading || (selectedItemsToRemove.length === 0 && selectedDynamicItemsToRemove.length === 0)"
      >
        {{ bulkLoading ? 'Traitement…' : ('Retirer chez ' + selectedUserIds.length + ' utilisateur(s) (' + (selectedItemsToRemove.length + selectedDynamicItemsToRemove.length) + ')') }}
      </button>
    </div>
  </div>
</div>
<div v-if="showUserItems" class="modal items-overlay" @click.self="closeUserItems">
         <div class="user-items-modal">
           <h3 style="color: #000000; margin-bottom: 20px;">Items de {{ viewingUserItems?.username }}</h3>
           
                       <div v-if="viewingUserItems?.purchasedItems && viewingUserItems.purchasedItems.length > 0" class="items-list">
              <div v-for="item in viewingUserItems.purchasedItems" :key="item.itemId" class="item-card">
                <div class="item-info">
                  <h4>{{ getItemDisplayName(item) }}</h4>
                  <p class="item-details">
                    <span class="item-id">ID: {{ getItemDisplayId(item) }}</span>
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
            <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:10px;">
              <input
                v-model="avatarUrlInput"
                placeholder="URL avatar (/uploads/avatars/.. ou https://..)"
                class="admin-message-input"
                style="max-width:360px;"
              />
              <button class="give-item-btn" @click="setUserAvatar" :disabled="!avatarUrlInput || itemsLoading">Définir avatar</button>
              <button class="toggle-all-btn" @click="rerollDailyShop" :disabled="rerollLoading">Re‑roll boutique du jour</button>
              <button class="give-item-btn" @click="refreshDailyShop" :disabled="dailyShopLoading">Actualiser boutique</button>
            </div>
            <div class="daily-shop-admin" style="display:flex;flex-direction:column;gap:8px;margin-top:10px;">
              <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;">
                <span>Items actuels: {{ dailyShopItemsIds.map(id => itemNameByIdMap[id] || ('#'+id)).join(', ') }}</span>
                <span>Couleurs actuelles: {{ dailyShopColorIds.map(id => colorNameByIdMap[id] || ('#'+id)).join(', ') }}</span>
              </div>
              <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
                <input v-for="(v,i) in adminSetItemsInputs" :key="'set-item-'+i" v-model="adminSetItemsInputs[i]" type="number" placeholder="ID item" class="admin-message-input" style="width:100px;" />
                <input v-for="(v,i) in adminSetColorsInputs" :key="'set-color-'+i" v-model="adminSetColorsInputs[i]" type="number" placeholder="ID couleur" class="admin-message-input" style="width:110px;" />
                <button class="give-item-btn" @click="adminSetDailyShop" :disabled="dailyShopLoading">Appliquer sélection</button>
              </div>
              <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
                <select v-model="replaceItemOldId" class="ephemeral-select" style="width:180px;">
                  <option v-for="id in dailyShopItemsIds" :key="'old-item-'+id" :value="id">{{ itemNameByIdMap[id] || ('#'+id) }}</option>
                </select>
                <input v-model="replaceItemNewId" type="number" placeholder="Nouvel ID item" class="admin-message-input" style="width:140px;" />
                <button class="give-item-btn" @click="adminReplaceDailyItem" :disabled="dailyShopLoading">Remplacer item</button>
              </div>
              <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
                <select v-model="replaceColorOldId" class="ephemeral-select" style="width:180px;">
                  <option v-for="id in dailyShopColorIds" :key="'old-color-'+id" :value="id">{{ colorNameByIdMap[id] || ('#'+id) }}</option>
                </select>
                <input v-model="replaceColorNewId" type="number" placeholder="Nouvel ID couleur" class="admin-message-input" style="width:160px;" />
                <button class="give-item-btn" @click="adminReplaceDailyColor" :disabled="dailyShopLoading">Remplacer couleur</button>
              </div>
              <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
                <button class="toggle-all-btn" @click="resetItemsOnly" :disabled="dailyShopLoading || rerollLoading">Reset items seulement</button>
                <button class="toggle-all-btn" @click="resetColorsOnly" :disabled="dailyShopLoading || rerollLoading">Reset couleurs seulement</button>
              </div>
            </div>
          </div>

            <!-- Section pour donner des items (cases à cocher) -->
            <div class="give-items-section">
              <h4>Donner des items</h4>
              <div class="give-item-form checkboxes">
                <div class="checkbox-grid">
                  <label v-for="(it, idx) in itemsCatalog.filter(Boolean)" :key="(it && it.id) ?? idx" class="item-checkbox">
                    <input type="checkbox" :value="it?.id" v-model="selectedItemsToGive" />
                    <span>{{ it?.name || ('Item ' + ((it && it.id) ?? idx)) }}</span>
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
                  <button @click="giveSelectedItemsToUser" :disabled="selectedItemsToGive.length === 0 && selectedBorderToGiveList.length === 0 && selectedDynamicItemsToGive.length === 0" class="give-item-btn">
                    Donner ({{ selectedItemsToGive.length + selectedBorderToGiveList.length + selectedDynamicItemsToGive.length }})
                  </button>
                </div>
              </div>
            </div>

            <!-- Couleurs de bordure dynamiques -->
            <div class="give-items-section" v-if="borderColors && borderColors.length">
              <h4>Couleurs de bordure dynamiques</h4>
              <div class="give-item-form checkboxes">
                <div class="checkbox-grid">
                  <label v-for="c in borderColors" :key="c.id" class="item-checkbox">
                    <input type="checkbox" :value="c.id" v-model="selectedBorderToGiveList" />
                    <span>
                      <span :style="{display:'inline-block',width:'14px',height:'14px',borderRadius:'4px',background: c.gradient || c.color || '#000', marginRight: '6px'}"></span>
                      {{ c.name }} ({{ c.id }})
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <!-- Items dynamiques -->
            <div class="give-items-section" v-if="dynamicItemsCatalog && dynamicItemsCatalog.length">
              <h4>Items dynamiques</h4>
              <div class="give-item-form checkboxes">
                <div class="checkbox-grid">
                  <label v-for="it in dynamicItemsCatalog" :key="it.id" class="item-checkbox">
                    <input type="checkbox" :value="it.id" v-model="selectedDynamicItemsToGive" />
                    <span>{{ it.name }} ({{ it.id }})</span>
                  </label>
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

      <!-- Modal de gestion des matières -->
      <div v-if="showSubjectsManagement" class="modal">
        <div class="user-management-modal" style="max-width: 1000px;">
          <button class="modal-close-top" @click="showSubjectsManagement = false" aria-label="Fermer">×</button>
          <h3 style="color: #000000; margin-bottom: 20px;">Gérer les matières</h3>
          <SubjectManager />
          <div class="modal-footer">
            <button @click="showSubjectsManagement = false" class="close-btn">Fermer</button>
          </div>
        </div>
      </div>

      <!-- Pop-up Don global (utilisateurs + items/couleurs) -->
      <div v-if="showUnifiedBulkGive" class="modal items-overlay" @click.self="closeUnifiedBulkGive">
        <div class="user-items-modal" @click.stop>
          <h3 style="color:#000; margin-bottom: 16px;">Don global</h3>

          <div style="display:flex; gap:16px; flex-wrap:wrap;">
            <!-- Colonne utilisateurs -->
            <div style="flex:1 1 340px; min-width:320px;">
              <h4>Utilisateurs</h4>
              <div style="display:flex;gap:8px;margin-bottom:8px;">
                <button type="button" class="toggle-all-btn" @click="toggleSelectAllUsers">
                  {{ selectedUserIds.length === users.length && users.length > 0 ? 'Tout désélectionner' : 'Tout sélectionner' }}
                </button>
                <div style="color:#6b7280;align-self:center;">
                  Sélectionnés: {{ selectedUserIds.length }} / {{ users.length }}
                </div>
              </div>
              <div class="users-list" style="max-height:300px; overflow:auto; border:1px solid #e5e7eb; border-radius:8px; padding:8px;">
                <label v-for="u in users" :key="u._id" class="user-item" style="display:flex;gap:8px;align-items:center;padding:6px 4px;">
                  <input type="checkbox" :value="u._id" v-model="selectedUserIds" />
                  <div style="display:flex; flex-direction:column;">
                    <strong>{{ u.username }}</strong>
                    <small style="color:#6b7280;">{{ u.role }} • {{ u.year || '—' }} • {{ u.groupe || '—' }}</small>
                  </div>
                  <span style="margin-left:auto;">🪙 {{ u.coins || 0 }}</span>
                </label>
              </div>
            </div>

            <!-- Colonne items/couleurs -->
            <div style="flex:2 1 540px; min-width:420px;">
              <!-- Items classiques -->
              <div class="give-items-section">
                <h4>Items</h4>
                <div class="give-item-form checkboxes">
                  <div class="checkbox-grid">
                    <label v-for="(it, idx) in itemsCatalog.filter(Boolean)" :key="(it && it.id) ?? idx" class="item-checkbox">
                      <input type="checkbox" :value="it?.id" v-model="selectedItemsToGive" />
                      <span>{{ it?.name || ('Item ' + ((it && it.id) ?? idx)) }}</span>
                    </label>
                  </div>
                  <div class="checkbox-actions" style="margin-top:8px;">
                    <button type="button" class="toggle-all-btn" @click="toggleSelectAll">
                      {{ selectedItemsToGive.length === itemsCatalog.length ? 'Tout désélectionner' : 'Tout sélectionner' }}
                    </button>
                  </div>
                </div>
              </div>

              <!-- Couleurs de bordure -->
              <div class="give-items-section" v-if="borderColors && borderColors.length">
                <h4>Couleurs de bordure</h4>
                <div class="give-item-form checkboxes">
                  <div class="checkbox-grid">
                    <label v-for="c in borderColors" :key="c.id" class="item-checkbox">
                      <input type="checkbox" :value="c.id" v-model="selectedBorderToGiveList" />
                      <span>
                        <span :style="{display:'inline-block',width:'14px',height:'14px',borderRadius:'4px',background: c.gradient || c.color || '#000', marginRight: '6px'}"></span>
                        {{ c.name }} ({{ c.id }})
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <!-- Items dynamiques -->
              <div class="give-items-section" v-if="dynamicItemsCatalog && dynamicItemsCatalog.length">
                <h4>Items dynamiques</h4>
                <div class="give-item-form checkboxes">
                  <div class="checkbox-grid">
                    <label v-for="it in dynamicItemsCatalog" :key="it.id" class="item-checkbox">
                      <input type="checkbox" :value="it.id" v-model="selectedDynamicItemsToGive" />
                      <span>{{ it.name }} ({{ it.id }})</span>
                    </label>
                  </div>
                </div>
              </div>

              <!-- Donner des Planify Coins (nouveau) -->
              <div class="give-coins-section" style="margin-top:16px;">
                <h4>Donner des Planify Coins</h4>
                <input
                  id="bulk-coins-amount"
                  type="number"
                  v-model.number="bulkCoinsAmount"
                  min="-100000"
                  step="1"
                  placeholder="Ex: 50"
                />
                <div style="margin-top:8px; display:flex; gap:8px; align-items:center;">
                  <input id="bulk-coins-send-popup" type="checkbox" v-model="bulkCoinsSendPopup" />
                  <label for="bulk-coins-send-popup" style="color:#000;">Envoyer une pop-up aux bénéficiaires</label>
                </div>
                <input
                  v-model="bulkCoinsPopupMessage"
                  class="ephemeral-input"
                  placeholder="Message facultatif (ex: bravo pour la contribution !)"
                  style="margin-top:8px; width:100%;"
                />
                <button
                  class="give-item-btn"
                  style="margin-top:12px;"
                  @click="giveCoinsToSelectedUsers"
                  :disabled="bulkLoading || selectedUserIds.length === 0 || !Number.isFinite(bulkCoinsAmount) || bulkCoinsAmount === 0"
                >
                  {{ bulkLoading ? 'Traitement…' : ('Donner ' + bulkCoinsAmount + ' coins à ' + selectedUserIds.length + ' utilisateur(s)') }}
                </button>
              </div>

              <!-- Message admin -->
              <div class="admin-message-section" style="margin-top:8px;">
                <label for="admin-message-unified" class="message-label">Message optionnel pour l'utilisateur :</label>
                <textarea
                  id="admin-message-unified"
                  v-model="adminMessage"
                  placeholder="Ex: Merci d'avoir contribué au site ! 🎉"
                  rows="3"
                  maxlength="200"
                  class="admin-message-input"
                ></textarea>
                <div class="message-counter">{{ adminMessage.length }}/200</div>
              </div>
            </div>
          </div>

          <div class="modal-footer" style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px;">
            <button @click="closeUnifiedBulkGive" class="close-btn">Fermer</button>
            <button
              @click="giveSelectedItemsToMany"
              class="give-item-btn"
              :disabled="unifiedBulkLoading || selectedUserIds.length === 0 || (selectedItemsToGive.length === 0 && selectedBorderToGiveList.length === 0 && selectedDynamicItemsToGive.length === 0)"
            >
              {{ unifiedBulkLoading ? 'Traitement…' : ('Donner à ' + selectedUserIds.length + ' utilisateur(s) (' + (selectedItemsToGive.length + selectedBorderToGiveList.length + selectedDynamicItemsToGive.length) + ')') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Pop-up Historique de boutique quotidienne -->
      <div v-if="showShopHistoryModal" class="modal items-overlay" @click.self="closeShopHistory">
        <div class="user-items-modal" @click.stop>
          <h3 style="color:#000; margin-bottom: 12px;">Historique des boutiques quotidiennes</h3>
          <div v-if="shopHistory.length === 0 && !loadingShopHistory" class="muted" style="margin-top:8px;">
            Aucun historique disponible.
          </div>
          <table v-if="shopHistory.length" class="history-table" style="margin-top:12px; width:100%; border-collapse: collapse;">
            <thead>
              <tr>
                <th style="text-align:left; padding:8px; border-bottom:1px solid #e5e7eb;">Date</th>
                <th style="text-align:left; padding:8px; border-bottom:1px solid #e5e7eb;">Seed</th>
                <th style="text-align:left; padding:8px; border-bottom:1px solid #e5e7eb;">Items</th>
                <th style="text-align:left; padding:8px; border-bottom:1px solid #e5e7eb;">Couleurs</th>
                <th style="text-align:left; padding:8px; border-bottom:1px solid #e5e7eb;">Poids Items</th>
                <th style="text-align:left; padding:8px; border-bottom:1px solid #e5e7eb;">Poids Couleurs</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="h in shopHistory" :key="(h.seed || h.daySeed || '') + '_' + (h.createdAt || h.date || h.timestamp || '')">
                <td style="padding:8px; color:#000;">{{ formatHistoryDate(h) }}</td>
                <td style="padding:8px; color:#000;">{{ h.seed || h.daySeed }}</td>
                <td style="padding:8px; color:#000;">{{ formatHistoryItems(h) }}</td>
                <td style="padding:8px; color:#000;">{{ formatHistoryColors(h) }}</td>
                <td style="padding:8px; color:#000; font-size:0.9em;">{{ formatHistoryItemWeights(h) }}</td>
                <td style="padding:8px; color:#000; font-size:0.9em;">{{ formatHistoryColorWeights(h) }}</td>
              </tr>
            </tbody>
          </table>
          <div class="modal-footer" style="display:flex;gap:10px;flex-wrap:wrap;">
            <button @click="closeShopHistory" class="close-btn">Fermer</button>
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
import AdminItemEditor from './AdminItemEditor.vue'
import SubjectManager from './SubjectManager.vue'
import { useAuthStore } from '@/stores/auth'
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import axios from 'axios';
import { API_URL, secureApiCall, getAuthHeaders } from '@/api';
import EmploiDuTemps from '../components/EmploiDuTemps.vue';
import { useRouter } from 'vue-router';
import { useCoinsStore } from '@/stores/coins'

const auth = useAuthStore()
const coinsStore = useCoinsStore()
const router = useRouter();

if (!auth.user || auth.user.role !== 'admin') {
  router.replace('/');
}

const showSubjectsManagement = ref(false)

// Options de groupe (réutilisées par la sélection simple et les cases à cocher)
const groupOptions = ['Promo', 'A', "A'", 'A"', 'B', "B'", 'B"']

// ------------------------
// Système de codes (admin)
// ------------------------
 
 const rcType = ref('item')
 const rcSelectedItemIds = ref([])
 const rcSelectedColorIds = ref([])
 const rcItemFilter = ref('')
 const rcColorFilter = ref('')
 const rcLength = ref(8)
 const rcMaxUses = ref(1)
 const rcExpiresAt = ref('')
 const lastGeneratedCode = ref('')
 
 const redeemCodesList = ref([])
 const redeemCodesLoading = ref(false)
 const deletingCodeId = ref(null)
 
 // Helper: détermine si une entrée du catalogue "items" ressemble à une couleur de bordure
 function isColorLikeItem(x) {
   if (!x) return false
   const id = Number(x.id)
   const name = String(x.name || '').toLowerCase()
   if (id === 0) return true // bordure classique
   if (id >= 100) return true // variantes de couleurs et dégradés
   if (name.startsWith('bordure')) return true
   return false
 }

 // Items statiques uniquement (exclut les “couleurs”)
 const filteredStaticItemsForCodes = computed(() => {
   const q = rcItemFilter.value.trim().toLowerCase()
   const list = (itemsCatalog.value || []).filter(x => !isColorLikeItem(x))
   const mapped = list.map(x => ({ id: Number(x.id), name: x.name || `Item ${x.id}` }))
   if (!q) return mapped
   return mapped.filter(x => String(x.id).includes(q) || String(x.name || '').toLowerCase().includes(q))
 })

 // Items dynamiques (séparés du catalogue statique)
 const filteredDynamicItemsForCodes = computed(() => {
   const q = rcItemFilter.value.trim().toLowerCase()
   const list = dynamicItemsCatalog.value || []
   const mapped = list.map(x => ({ id: Number(x.id), name: x.name || `Item ${x.id}` }))
   if (!q) return mapped
   return mapped.filter(x => String(x.id).includes(q) || String(x.name || '').toLowerCase().includes(q))
 })

 // Liste fusionnée utilisée par l'UI (statiques + dynamiques, sans “couleurs”)
 const filteredItemsForCodes = computed(() => {
   const staticList = filteredStaticItemsForCodes.value || []
   const dynamicList = filteredDynamicItemsForCodes.value || []
   // fusionner en évitant les doublons par id
   const byId = new Map()
   for (const it of [...staticList, ...dynamicList]) {
     if (!byId.has(it.id)) byId.set(it.id, it)
   }
   return Array.from(byId.values()).sort((a, b) => a.id - b.id)
 })
 
 const filteredBorderColors = computed(() => {
   const q = rcColorFilter.value.trim().toLowerCase()
   const list = borderColors.value || []
   if (!q) return list.map(c => ({ id: String(c.id), name: c.name || `Couleur ${c.id}` }))
   return list
     .filter(c => String(c.id).toLowerCase().includes(q) || String(c.name || '').toLowerCase().includes(q))
     .map(c => ({ id: String(c.id), name: c.name || `Couleur ${c.id}` }))
 })
 
 // Quand on change de type de récompense, réinitialiser la sélection correspondante
watch(rcType, async (t) => {
  if (t === 'item') {
    rcSelectedColorIds.value = []
  } else if (t === 'border-color') {
    rcSelectedItemIds.value = []
    await loadBorderColorsIfNeeded()
  }
})
 
 function onToggleSelectItem(it, e) {
   const target = e && e.target
   const id = Number(it && it.id)
   if (!target) return
   if (target.checked) {
     if (!rcSelectedItemIds.value.includes(id)) rcSelectedItemIds.value.push(id)
   } else {
     rcSelectedItemIds.value = rcSelectedItemIds.value.filter(x => x !== id)
   }
 }
 function onToggleSelectColor(c, e) {
   const target = e && e.target
   const id = String(c && c.id)
   if (!target) return
   if (target.checked) {
     if (!rcSelectedColorIds.value.includes(id)) rcSelectedColorIds.value.push(id)
   } else {
     rcSelectedColorIds.value = rcSelectedColorIds.value.filter(x => String(x) !== id)
   }
 }
 
 // Trouver un item par id (statique + dynamique) pour récupérer le nom
 function findItemNameById(id) {
   const it = (itemsCatalog.value || []).find(x => Number(x.id) === Number(id)) || (dynamicItemsCatalog.value || []).find(x => Number(x.id) === Number(id))
   return it && it.name ? String(it.name) : `Item ${id}`
 }
 
 async function generateRedeemCode() {
   try {
     let token = auth.token || auth.user?.token
     if (!token) {
       const userFromStorage = localStorage.getItem('user')
       if (userFromStorage) token = JSON.parse(userFromStorage).token
     }
     const headers = { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest', 'Authorization': `Bearer ${token}` }
 
     const body = {
       rewardType: rcType.value,
       length: rcLength.value,
       maxUses: rcMaxUses.value,
     }
     if (rcExpiresAt.value) body.expiresAt = rcExpiresAt.value
 
     if (rcType.value === 'item') {
       const ids = (rcSelectedItemIds.value || []).slice()
       if (!ids.length) { alert('Choisissez au moins un item'); return }
       if (ids.length === 1) {
         const id = Number(ids[0])
         body.itemId = id
         body.itemName = findItemNameById(id)
       } else {
         body.items = ids.map(id => ({ itemId: Number(id), itemName: findItemNameById(Number(id)) }))
       }
     } else {
       const ids = (rcSelectedColorIds.value || []).slice()
       if (!ids.length) { alert('Choisissez au moins une couleur'); return }
       if (ids.length === 1) {
         body.colorId = String(ids[0])
       } else {
         body.colors = ids.map(id => String(id))
       }
     }
 
     const resp = await fetch(`${API_URL}/redeem-codes/generate`, {
       method: 'POST', headers, credentials: 'include', body: JSON.stringify(body)
     })
     const data = await resp.json().catch(() => ({}))
     if (!resp.ok || !data?.success) throw new Error(data?.message || 'Erreur API')
 
     lastGeneratedCode.value = data.code
     await fetchRedeemCodesList()
   } catch (e) {
     alert('Erreur génération: ' + (e?.message || e))
   }
 }
 
 async function fetchRedeemCodesList() {
   redeemCodesLoading.value = true
   try {
     let token = auth.token || auth.user?.token
     if (!token) {
       const userFromStorage = localStorage.getItem('user')
       if (userFromStorage) token = JSON.parse(userFromStorage).token
     }
     const headers = { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest', 'Authorization': `Bearer ${token}` }
     const resp = await fetch(`${API_URL}/redeem-codes/`, { headers, credentials: 'include' })
     const data = await resp.json().catch(() => ({}))
     if (!resp.ok || !data?.success) throw new Error(data?.message || 'Erreur API')
     redeemCodesList.value = (data && data.codes) ? data.codes : []
   } catch {
     redeemCodesList.value = []
   } finally { redeemCodesLoading.value = false }
 }
 
 async function deleteRedeemCode(id) {
   if (!id) return
   deletingCodeId.value = id
   try {
     let token = auth.token || auth.user?.token
     if (!token) {
       const userFromStorage = localStorage.getItem('user')
       if (userFromStorage) token = JSON.parse(userFromStorage).token
     }
     const headers = { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest', 'Authorization': `Bearer ${token}` }
     const resp = await fetch(`${API_URL}/redeem-codes/${id}`, { method: 'DELETE', headers, credentials: 'include' })
     const data = await resp.json().catch(() => ({}))
     if (!resp.ok || !data?.success) throw new Error(data?.message || 'Erreur API')
     redeemCodesList.value = redeemCodesList.value.filter(rc => rc._id !== id)
   } catch (e) {
     alert('Suppression impossible: ' + (e?.message || e))
   } finally { deletingCodeId.value = null }
 }
 
 function describeReward(rc) {
   if (!rc) return ''
   if (rc.rewardType === 'item') {
     const items = Array.isArray(rc?.payload?.items) ? rc.payload.items : null
     if (items && items.length) {
       return items.map(x => {
         const id = Number(x.itemId)
         const name = String(x.itemName || `Item ${id}`)
         return `Item ${id} — ${name}`
       }).join(', ')
     }
     const id = Number(rc?.payload?.itemId)
     const name = String(rc?.payload?.itemName || `Item ${id}`)
     return `Item ${id} — ${name}`
   }
   if (rc.rewardType === 'border-color') {
     const colors = Array.isArray(rc?.payload?.colors) ? rc.payload.colors : null
     if (colors && colors.length) {
       return colors.map(cid => {
         const color = (borderColors.value || []).find(c => String(c.id) === String(cid))
         return color ? `Couleur ${color.name} (#${color.id})` : `Couleur #${cid}`
       }).join(', ')
     }
     const colorId = String(rc?.payload?.colorId || '')
     const color = (borderColors.value || []).find(c => String(c.id) === colorId)
     return color ? `Couleur ${color.name} (#${color.id})` : `Couleur #${colorId}`
   }
   return ''
 }
 function formatRedeemDate(dt) {
   if (!dt) return '—'
   const d = new Date(dt)
   return isNaN(d.getTime()) ? '—' : d.toLocaleString()
 }
 async function copyRedeemCode() {
   if (!lastGeneratedCode.value) return
   try { await navigator.clipboard.writeText(lastGeneratedCode.value); alert('Code copié !') }
   catch { alert('Impossible de copier automatiquement') }
 }
 
 onMounted(async () => {
  if (auth.user && auth.user.role === 'admin') {
    await fetchRedeemCodesList()
  }
})

// Factions — Coins (Leaderboard)
const factionsBusy = ref(false)
// Remplacer les prix par des totaux
const factionTotals = ref({ Bagnat: 0, Fermier: 0 })

// Charger les totaux depuis /factions/leaderboard
async function loadFactionTotals(force = false) {
  try {
    const ts = force ? `?ts=${Date.now()}` : ''
    const res = await secureApiCall(`/factions/leaderboard${ts}`, { method: 'GET', cache: 'no-store' })
    const fB = (res?.factions || []).find((f) => f?.name === 'Bagnat')
    const fF = (res?.factions || []).find((f) => f?.name === 'Fermier')
    factionTotals.value = {
      Bagnat: Number(fB?.totalCoins ?? 0),
      Fermier: Number(fF?.totalCoins ?? 0)
    }
  } catch (e) { /* ignore */ }
}

// Sauvegarder un total via /factions/total-coins
async function saveFactionTotal(name) {
  try {
    factionsBusy.value = true
    const totalCoins = name === 'Bagnat'
      ? Number(factionTotals.value.Bagnat)
      : Number(factionTotals.value.Fermier)
    const res = await secureApiCall('/factions/total-coins', {
      method: 'POST',
      body: JSON.stringify({ name, totalCoins }),
      cache: 'no-store'
    })
    if (res && res.success && res.faction && typeof res.faction.totalCoins !== 'undefined') {
      const t = Number(res.faction.totalCoins)
      if (name === 'Bagnat') factionTotals.value.Bagnat = t
      else factionTotals.value.Fermier = t
    }
    await loadFactionTotals(true)
    alert('Total mis à jour')
  } catch (e) {
    alert(e?.message || 'Erreur')
  } finally {
    factionsBusy.value = false
  }
}

// Charger au montage
onMounted(() => { try { loadFactionTotals() } catch {} })

// Rafraîchir au retour de focus/visibilité
function refreshFactionTotalsOnFocus() {
  try { loadFactionTotals(true) } catch {}
}
onMounted(() => {
  try { window.addEventListener('focus', refreshFactionTotalsOnFocus) } catch {}
  try {
    document.addEventListener('visibilitychange', () => {
      try { if (document.visibilityState === 'visible') loadFactionTotals(true) } catch {}
    })
  } catch {}
})
onUnmounted(() => {
  try { window.removeEventListener('focus', refreshFactionTotalsOnFocus) } catch {}
})

// Notifications du résultat des factions
const winnerMessage = ref('Votre faction a gagné 🎉')
const loserMessage = ref('Votre faction fera mieux la prochaine fois 💪')
const notifyFactionLoading = ref(false)

async function sendFactionPopupToMembers(factionName, html) {
  const members = Array.isArray(users.value)
    ? users.value.filter(u => String(u.faction || '') === factionName)
    : []
  for (const u of members) {
    const userId = u && u._id
    if (!userId) continue
    try {
      await secureApiCall('/popups/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: 'user', userId, html })
      })
    } catch (e) {
      console.warn('Pop-up faction', factionName, 'utilisateur', userId, 'échouée:', e)
    }
  }
}

async function notifyFactionResult() {
  notifyFactionLoading.value = true
  try {
    await loadFactionTotals(true)
    const totalB = Number(factionTotals.value.Bagnat || 0)
    const totalF = Number(factionTotals.value.Fermier || 0)

    if (totalB === totalF) {
      const tieHtml = `<div style="font-size:1.1rem;line-height:1.6;">⚖️ Égalité ! Les deux factions sont ex aequo.</div>`
      await sendFactionPopupToMembers('Bagnat', tieHtml)
      await sendFactionPopupToMembers('Fermier', tieHtml)
      alert('Notifications envoyées (égalité)')
    } else {
      const winning = totalB > totalF ? 'Bagnat' : 'Fermier'
      const losing = winning === 'Bagnat' ? 'Fermier' : 'Bagnat'
      const winHtml = `<div style="font-size:1.1rem;line-height:1.6;">${winnerMessage.value || 'Votre faction a gagné 🎉'}</div>`
      const loseHtml = `<div style="font-size:1.1rem;line-height:1.6;">${loserMessage.value || 'Votre faction fera mieux la prochaine fois 💪'}</div>`
      await sendFactionPopupToMembers(winning, winHtml)
      await sendFactionPopupToMembers(losing, loseHtml)
      alert('Notifications envoyées: gagnants et perdants')
    }
  } catch (e) {
    alert('Erreur envoi notifications: ' + (e?.message || e))
  } finally {
    notifyFactionLoading.value = false
  }
}
 
const resetFactionCoinsLoading = ref(false)

async function resetFactionCoins() {
  if (!confirm('Voulez-vous vraiment remettre à zéro les Planify Coins des factions et des membres ?')) return;
  resetFactionCoinsLoading.value = true
  try {
    // Charger/rafraîchir la liste des utilisateurs si nécessaire
    if (!Array.isArray(users.value) || users.value.length === 0) {
      try { await fetchUsers() } catch {}
    }
    const members = Array.isArray(users.value)
      ? users.value.filter(u => ['Bagnat', 'Fermier'].includes(String(u.faction || '')))
      : []

    // Token et headers
    let token = auth.token || auth.user?.token
    if (!token) {
      const raw = localStorage.getItem('user') || sessionStorage.getItem('user')
      if (raw) { try { token = JSON.parse(raw).token } catch {} }
    }
    const headers = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'Authorization': `Bearer ${token}`
    }

    // 1) Remettre à zéro les coins de faction pour chaque membre (update-faction-coins)
    let updated = 0, failed = 0
    for (const u of members) {
      const userId = u && u._id
      if (!userId) continue
      try {
        const resp = await fetch(`${API_URL}/users-admin`, {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({ action: 'update-faction-coins', userId, factionCoins: 0 })
        })
        if (!resp.ok) { try { await resp.text() } catch {}; failed++; continue }
        updated++
      } catch (e) { failed++ }
    }

    // 2) Mettre à zéro explicitement les totaux des factions (évite tout écart résiduel)
    try {
      await secureApiCall('/factions/total-coins', {
        method: 'POST',
        body: JSON.stringify({ name: 'Bagnat', totalCoins: 0 }),
        cache: 'no-store'
      })
    } catch {}
    try {
      await secureApiCall('/factions/total-coins', {
        method: 'POST',
        body: JSON.stringify({ name: 'Fermier', totalCoins: 0 }),
        cache: 'no-store'
      })
    } catch {}

    await loadFactionTotals(true)
    await fetchUsers()
    alert(`Reset terminé. Utilisateurs mis à jour: ${updated}, erreurs: ${failed}`)
  } catch (e) {
    alert(e?.message || 'Erreur lors du reset des coins de faction')
  } finally {
    resetFactionCoinsLoading.value = false
  }
}

// Charger/rafraîchir les items dynamiques
onMounted(() => {
  loadAdminDynamicItems()
  try { window.addEventListener('items-changed', loadAdminDynamicItems) } catch {}
})
// Charger la liste des utilisateurs pour l'éditeur de pop-up
onMounted(() => { try { fetchUsers() } catch {} })
// Charger la liste des couleurs de bordure disponibles
async function loadBorderColorsIfNeeded(force = false) {
  if (!force && Array.isArray(borderColors.value) && borderColors.value.length) return
  borderColorsLoading.value = true
  try {
    // s'assurer que la palette statique est présente
    if (!Array.isArray(coinsStore.borderColors) || !coinsStore.borderColors.length) {
      try { coinsStore.initializeBorderColors && coinsStore.initializeBorderColors() } catch {}
    }

    const res = await secureApiCall('/border-colors')
    const apiColors = (res && res.success && Array.isArray(res.colors)) ? res.colors : []

    const staticList = Array.isArray(coinsStore.borderColors) ? coinsStore.borderColors : []
    const byId = new Map()

    // garder l'ordre de la palette statique, puis surcharger avec les dynamiques
    for (const c of staticList) {
      if (!c || !c.id) continue
      byId.set(String(c.id), {
        id: String(c.id),
        name: c.name || `Couleur ${c.id}`,
        color: c.color || '#000000',
        gradient: c.gradient,
        unlocked: !!c.unlocked
      })
    }
    for (const c of apiColors) {
      if (!c || !c.id) continue
      const id = String(c.id)
      const existing = byId.get(id) || {}
      byId.set(id, {
        ...existing,
        id,
        name: c.name || existing.name || `Couleur ${id}`,
        color: c.color || existing.color || '#000000',
        gradient: (typeof c.gradient !== 'undefined') ? c.gradient : existing.gradient,
        unlocked: existing.unlocked ?? false
      })
    }

    borderColors.value = Array.from(byId.values())
  } catch {
    if (Array.isArray(coinsStore.borderColors) && coinsStore.borderColors.length) {
      borderColors.value = coinsStore.borderColors
    } else {
      borderColors.value = []
    }
  } finally {
    borderColorsLoading.value = false
  }
}
onMounted(async () => {
  await loadBorderColorsIfNeeded(true)
})
onUnmounted(() => {
  try { window.removeEventListener('items-changed', loadAdminDynamicItems) } catch {}
})

import { useSubjectsStore } from '@/stores/subjects'
const subjectsStore = useSubjectsStore()
const matieres = [
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

const selectedMatiere = ref(matieres[0]);
const allMatieres = ref([...matieres])

function updateAllMatieres() {
  try {
    const dynamicNames = (subjectsStore.subjects || []).map((s) => s && s.name).filter(Boolean)
    const merged = Array.from(new Set([ ...matieres, ...dynamicNames ]))
    allMatieres.value = merged
  } catch {
    allMatieres.value = [...matieres]
  }
}

// Injecter/rafraîchir les matières dynamiques dans la liste latérale
onMounted(async () => {
  try { await subjectsStore.initializeStore() } catch {}
  updateAllMatieres()
})

watch(() => subjectsStore.subjects, () => {
  updateAllMatieres()
}, { deep: true })
const showUserForm = ref(false);
const showUserManagement = ref(false);
const userForm = ref({
  username: '',
  password: '',
  role: 'eleve',
  groupe: 'A',
  year: 'BUT1',
  specialite: '',
  department: 'MMI'
});
const userFormMessage = ref('');
const userFormLoading = ref(false);
const users = ref([]);

// Nouveau: États pour attribution de coins de faction
const selectedFactionForAward = ref('Bagnat')
const selectedFactionUserIds = ref([])
const factionGiveAmount = ref(0)
const factionSendPopup = ref(true)
const factionPopupMessage = ref('')
const factionGiveLoading = ref(false)

const filteredFactionUsers = computed(() =>
  Array.isArray(users.value)
    ? users.value.filter(u => String(u.faction || '') === selectedFactionForAward.value)
    : []
)

function toggleSelectAllFaction() {
  const list = filteredFactionUsers.value
  if (selectedFactionUserIds.value.length === list.length && list.length > 0) {
    selectedFactionUserIds.value = []
  } else {
    selectedFactionUserIds.value = list.map(u => u._id).filter(Boolean)
  }
}

async function giveFactionCoinsToSelected() {
  if (!selectedFactionUserIds.value.length) return
  const delta = Number(factionGiveAmount.value || 0)
  if (!Number.isFinite(delta) || delta === 0) return
  factionGiveLoading.value = true
  try {
    // Rafraîchir les totaux de faction avant pop-ups
    try { await loadFactionTotals(true) } catch {}

    let token = auth.token || auth.user?.token
    if (!token) {
      const raw = localStorage.getItem('user') || sessionStorage.getItem('user')
      if (raw) { try { token = JSON.parse(raw).token } catch {} }
    }
    const headers = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'Authorization': `Bearer ${token}`
    }

    let updated = 0, failed = 0
    for (const userId of selectedFactionUserIds.value) {
      const u = users.value.find(x => x && x._id === userId)
      const prev = Number(u?.coins || 0)
      const next = prev + delta
      try {
        // Wallet uniquement, ne touche pas leaderboardCoins
        const resp = await fetch(`${API_URL}/users-admin`, {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({ action: 'update-wallet-coins-only', userId, coins: next })
        })
        if (!resp.ok) { try { await resp.text() } catch {}; failed++; continue }
        updated++

        if (factionSendPopup.value) {
          const html = composeFactionCoinsPopupHTMLForUser(u, delta, factionPopupMessage.value)
          try {
            await secureApiCall('/popups/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ target: 'user', userId, html })
            })
          } catch (e) { console.warn('Pop-up coins (faction) échouée:', e) }
        }
      } catch (e) { failed++ }
    }

    await fetchUsers()
    try { await loadFactionTotals(true) } catch {}
    selectedFactionUserIds.value = []
    factionGiveAmount.value = 0
    alert(updated
      ? `Planify Coins (wallet) attribués à ${updated} membre(s)` + (failed ? `, ${failed} échec(s)` : '')
      : 'Aucun membre mis à jour')
  } catch (err) {
    alert('Erreur attribution: ' + (err?.message || err))
  } finally {
    factionGiveLoading.value = false
  }
}
const editingUser = ref(null);
// Sélection multiple d'utilisateurs (gestion)
const selectedUserIds = ref([]);
const showBulkGive = ref(false);
const bulkLoading = ref(false);
const showBulkRemove = ref(false);
const selectedItemsToRemove = ref([]);
const selectedDynamicItemsToRemove = ref([]);
// Unified global give modal
const showUnifiedBulkGive = ref(false);
const unifiedBulkLoading = computed(() => bulkLoading.value);
function openUnifiedBulkGive() {
  try { loadAdminDynamicItems() } catch {}
  showUnifiedBulkGive.value = true;
}
function closeUnifiedBulkGive() { showUnifiedBulkGive.value = false; }
function toggleSelectAllUsers() {
  const list = Array.isArray(users.value) ? users.value : [];
  if (selectedUserIds.value.length === list.length && list.length > 0) {
    selectedUserIds.value = [];
  } else {
    selectedUserIds.value = list.map(u => u._id).filter(Boolean);
  }
}
function openBulkGive() {
  if (selectedUserIds.value.length === 0) return;
  try { loadAdminDynamicItems() } catch {}
  showBulkGive.value = true;
}
function closeBulkGive() {
  showBulkGive.value = false;
}
function openBulkRemove() {
  if (selectedUserIds.value.length === 0) return;
  try { loadAdminDynamicItems() } catch {}
  showBulkRemove.value = true;
}
function closeBulkRemove() {
  showBulkRemove.value = false;
  selectedItemsToRemove.value = [];
  selectedDynamicItemsToRemove.value = [];
}
function toggleSelectAllRemove() {
  const list = Array.isArray(itemsCatalog.value) ? itemsCatalog.value : [];
  if (selectedItemsToRemove.value.length === list.length && list.length > 0) {
    selectedItemsToRemove.value = [];
  } else {
    selectedItemsToRemove.value = list.map(i => Number(i.id)).filter(id => !Number.isNaN(id));
  }
}
async function removeSelectedItemsFromMany() {
  if (selectedUserIds.value.length === 0) return;
  if (selectedItemsToRemove.value.length === 0 && selectedDynamicItemsToRemove.value.length === 0) {
    alert("Sélectionnez au moins un item à retirer.");
    return;
  }
  bulkLoading.value = true;
  try {
    let token = auth.token || auth.user?.token
    if (!token) {
      const userFromStorage = localStorage.getItem('user')
      if (userFromStorage) token = JSON.parse(userFromStorage).token
    }
    const headers = { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest', 'Authorization': `Bearer ${token}` }

    let removedCount = 0
    let missingCount = 0
    let failedCount = 0

    // Items classiques
    for (const userId of selectedUserIds.value) {
      for (const idRaw of selectedItemsToRemove.value) {
        const itemId = Number(idRaw)
        try {
          const resp = await fetch(`${API_URL}/users/${userId}/remove-item`, {
            method: 'POST', headers, credentials: 'include',
            body: JSON.stringify({ itemId })
          })
          if (!resp.ok) {
            let msg = ''
            try { msg = await resp.text() } catch {}
            if (resp.status === 404 && /Item non trouvé/i.test(msg)) { missingCount++; continue }
            failedCount++; continue
          }
          removedCount++
        } catch { failedCount++ }
      }
    }

    // Items dynamiques
    for (const userId of selectedUserIds.value) {
      for (const legacyId of selectedDynamicItemsToRemove.value) {
        try {
          const resp = await fetch(`${API_URL}/users/${userId}/remove-item`, {
            method: 'POST', headers, credentials: 'include',
            body: JSON.stringify({ itemId: Number(legacyId) })
          })
          if (!resp.ok) {
            let msg = ''
            try { msg = await resp.text() } catch {}
            if (resp.status === 404 && /Item non trouvé/i.test(msg)) { missingCount++; continue }
            failedCount++; continue
          }
          removedCount++
        } catch { failedCount++ }
      }
    }

    await fetchUsers()

    const parts = []
    if (removedCount) parts.push(`${removedCount} retiré(s)`)
    if (missingCount) parts.push(`${missingCount} non possédé(s)`)
    if (failedCount) parts.push(`${failedCount} échec(s)`)
    alert(parts.length ? `Traitement terminé: ${parts.join(', ')}` : 'Aucun retrait effectué')

    showBulkRemove.value = false
  } catch (err) {
    console.error('Erreur retrait en masse:', err)
    alert('Erreur lors du retrait en masse: ' + (err && err.message ? err.message : err))
  } finally {
    bulkLoading.value = false
  }
}
const sanitize = (s) => String(s || '').replace(/[<>&]/g, '');
async function exportUsersPdf() {
  const resp = await fetch(`${API_URL}/users-admin/export`, {
    method: 'GET',
    headers: getAuthHeaders(),
    credentials: 'include'
  })
  if (!resp.ok) {
    throw new Error(`Export échoué: ${resp.status}`)
  }
  const blob = await resp.blob()
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'planify_users_export.txt'
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
}
async function giveSelectedItemsToMany() {
  if (selectedUserIds.value.length === 0) return;
  if (selectedItemsToGive.value.length === 0 && selectedBorderToGiveList.value.length === 0 && selectedDynamicItemsToGive.value.length === 0) {
    alert("Sélectionnez au moins un item / une couleur / un item dynamique.");
    return;
  }
  bulkLoading.value = true;
  try {
    let token = auth.token || auth.user?.token
    if (!token) {
      const userFromStorage = localStorage.getItem('user')
      if (userFromStorage) token = JSON.parse(userFromStorage).token
    }
    const headers = { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest', 'Authorization': `Bearer ${token}` }

    const nameById = Object.fromEntries(
      itemsCatalog.value.map(i => [Number(i.id), i?.name || `Item ${i?.id}`])
    )

    let givenCount = 0
    let alreadyOwnedCount = 0
    let failedCount = 0
    let dynGiven = 0
    let colorsGiven = 0

    // Items classiques
    for (const userId of selectedUserIds.value) {
      for (const idRaw of selectedItemsToGive.value) {
        const id = Number(idRaw)
        try {
          const resp = await fetch(`${API_URL}/users/${userId}/give-item`, {
            method: 'POST', headers, credentials: 'include',
            body: JSON.stringify({
              itemId: id,
              itemName: nameById[id],
              adminMessage: (adminMessage.value || '').trim() || null
            })
          })
          if (!resp.ok) {
            let msg = ''
            try { msg = await resp.text() } catch {}
            if (resp.status === 400 && /déjà|deja/i.test(msg)) { alreadyOwnedCount++; continue }
            failedCount++; continue
          }
          givenCount++
        } catch { failedCount++ }
      }
    }

    // Items dynamiques
    for (const userId of selectedUserIds.value) {
      for (const legacyId of selectedDynamicItemsToGive.value) {
        try {
          const dynName = (dynamicItemsCatalog.value.find(x => x.id === legacyId)?.name) || `Item ${legacyId}`
          const resp = await fetch(`${API_URL}/users/${userId}/give-item`, {
            method: 'POST', headers, credentials: 'include',
            body: JSON.stringify({ itemId: legacyId, itemName: dynName, adminMessage: (adminMessage.value || '').trim() || null })
          })
          if (!resp.ok) { try { await resp.text() } catch {} ; continue }
          dynGiven++
        } catch {}
      }
    }

    // Couleurs de bordure
    for (const userId of selectedUserIds.value) {
      for (const cid of selectedBorderToGiveList.value) {
        try {
          const resp = await fetch(`${API_URL}/users-admin`, {
            method: 'POST', headers, credentials: 'include',
            body: JSON.stringify({
              action: 'set-border-color',
              userId,
              colorId: cid,
              adminMessage: (adminMessage.value || '').trim() || null
            })
          })
          if (!resp.ok) { try { await resp.text() } catch {} ; continue }
          colorsGiven++
        } catch {}
      }
    }

    // Refresh global
    await fetchUsers()

    const parts = []
    if (givenCount) parts.push(`${givenCount} item(s)`)
    if (alreadyOwnedCount) parts.push(`${alreadyOwnedCount} déjà possédé(s)`)
    if (failedCount) parts.push(`${failedCount} échec(s)`)
    if (dynGiven) parts.push(`${dynGiven} item(s) dynamiques`)
    if (colorsGiven) parts.push(`${colorsGiven} couleur(s) de bordure`)
    alert(parts.length ? `Traitement terminé: ${parts.join(', ')}` : 'Rien à traiter')

    showBulkGive.value = false
  } catch (err) {
    console.error('Erreur don en masse:', err)
    alert('Erreur lors du don en masse: ' + (err && err.message ? err.message : err))
  } finally {
    bulkLoading.value = false
  }
}
const bulkCoinsAmount = ref(0)
const bulkCoinsSendPopup = ref(true)
const bulkCoinsPopupMessage = ref('')

// Déterminer la faction gagnante (null si égalité)
function getWinningFactionName() {
  const totalB = Number(factionTotals.value.Bagnat || 0)
  const totalF = Number(factionTotals.value.Fermier || 0)
  if (totalB === totalF) return null
  return totalB > totalF ? 'Bagnat' : 'Fermier'
}

// Composer le HTML de pop-up en fonction de la faction du user et du delta
function composeFactionCoinsPopupHTMLForUser(u, delta, extraMessage) {
  const winning = getWinningFactionName()
  const userFaction = String(u?.faction || '').trim()
  let isWinner = null
  if (winning) {
    if (userFaction === winning) isWinner = true
    else if (userFaction) isWinner = false
    else isWinner = null
  }

  const amount = Math.abs(Number(delta) || 0)
  const deltaText = delta > 0
    ? `Vous avez reçu +${amount} Planify Coins`
    : `Vos Planify Coins ont été ajustés (-${amount})`

  let header = ''
  if (isWinner === true) {
    header = winnerMessage.value || 'Votre faction a gagné 🎉'
  } else if (isWinner === false) {
    header = loserMessage.value || 'Votre faction fera mieux la prochaine fois 💪'
  } else {
    header = '⚖️ Égalité ! Les deux factions sont ex aequo.'
  }

  const extra = (extraMessage || '').trim()
  const extraHtml = extra ? `<br/><span style='color:#374151'>${extra}</span>` : ''
  return `<div style="font-size:1.1rem;line-height:1.6;">${header}<br/>${deltaText}${extraHtml}</div>`
}

async function giveCoinsToSelectedUsers() {
  if (!selectedUserIds.value.length) return
  const delta = Number(bulkCoinsAmount.value || 0)
  if (!Number.isFinite(delta) || delta === 0) return
  bulkLoading.value = true
  try {
    // Rafraîchir les totaux de faction pour déterminer gagnant/perdant
    try { await loadFactionTotals(true) } catch {}

    // Token + headers
    let token = auth.token || auth.user?.token
    if (!token) {
      const raw = localStorage.getItem('user') || sessionStorage.getItem('user')
      if (raw) { try { token = JSON.parse(raw).token } catch {} }
    }
    const headers = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'Authorization': `Bearer ${token}`
    }

    let updated = 0, failed = 0
    for (const userId of selectedUserIds.value) {
      const u = users.value.find(x => x && x._id === userId)
      const prev = Number(u?.coins || 0)
      const next = prev + delta
      try {
        const resp = await fetch(`${API_URL}/users-admin`, {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({ action: 'update-wallet-coins-only', userId, coins: next })
        })
        if (!resp.ok) { try { await resp.text() } catch {}; failed++; continue }
        updated++

        if (bulkCoinsSendPopup.value) {
          const html = composeFactionCoinsPopupHTMLForUser(u, delta, bulkCoinsPopupMessage.value)
          try {
            await secureApiCall('/popups/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ target: 'user', userId, html })
            })
          } catch (e) { console.warn('Pop-up coins (global) échouée:', e) }
        }
      } catch (e) { failed++ }
    }

    await fetchUsers()
    bulkCoinsAmount.value = 0
    alert(updated
      ? `Planify Coins attribués à ${updated} utilisateur(s)` + (failed ? `, ${failed} échec(s)` : '')
      : 'Aucun utilisateur mis à jour')
  } catch (err) {
    alert('Erreur don coins: ' + (err?.message || err))
  } finally {
    bulkLoading.value = false
  }
}

const editForm = ref({
  username: '',
  password: '',
  role: 'eleve',
  groupe: '',
  year: '',
  specialite: '',
  department: '',
  coins: 0,
  leaderboardCoins: 0,
  factionCoins: 0
});
const editFormMessage = ref('');
const editFormLoading = ref(false);
// Option d’envoi de pop-up lors du don de coins
const sendCoinsPopup = ref(false);
const coinsPopupMessage = ref('');
const viewingUserItems = ref(null);
const showUserItems = ref(false);
// Recharger la liste dynamique lors de l'ouverture de la modale des items
watch(showUserItems, (v) => { if (v) loadAdminDynamicItems() })
const itemToGive = ref('');

// ===================== Éditeur de pop-up éphémère =====================
const popupTarget = ref('all'); // 'all' | 'user'
const popupUserId = ref('');
const editorRef = ref(null);
const selectionToolbarRef = ref(null);
const showSelectionToolbar = ref(false);
const selectionColor = ref('#111111');
const selectionFontSize = ref('16');
const selectionFontFamily = ref('Cobe Heavy');
const selectionToolbarPos = ref({ top: 0, left: 0 });
const selectionToolbarTransform = ref('none');
const viewportWidth = ref(window.innerWidth);

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

const showImageLinkPopover = ref(false);
const imageLink = ref('');
const popoverPos = ref({ top: 0, left: 0 });
const popoverStyle = computed(() => ({
  position: 'fixed',
  top: popoverPos.value.top + 'px',
  left: popoverPos.value.left + 'px',
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
  padding: '8px',
  zIndex: 10000,
  display: 'flex',
  alignItems: 'center',
  gap: '6px'
}));

function onEditableClick(e) {
  const t = e.target;
  if (t && t.tagName === 'IMG') openImageLinkPopover(t);
  else showImageLinkPopover.value = false;
}

function updateToolbarPosition(rect) {
  try {
    const padding = 8;
    const top = Math.max(0, rect.top - padding);
    let left = Math.max(8, rect.left);
    selectionToolbarPos.value = { top, left };
    selectionToolbarTransform.value = 'none';
  } catch {}
}
function handleSelectionChange() {
  try {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) { showSelectionToolbar.value = false; return; }
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const el = editorRef.value;
    if (!el || !el.contains(range.commonAncestorContainer)) { showSelectionToolbar.value = false; return; }
    showSelectionToolbar.value = true;
    updateToolbarPosition(rect);
  } catch { showSelectionToolbar.value = false; }
}
function recomputeOnResize() { viewportWidth.value = window.innerWidth; }

function applySelectionColor() { try { document.execCommand('foreColor', false, selectionColor.value); } catch {} }
function applySelectionFontSize() { try { fontSizePx.value = selectionFontSize.value; applySelectedFontSize(); } catch {} }
function applySelectionFontFamily() {
  try {
    document.execCommand('fontName', false, selectionFontFamily.value);
    const el = editorRef.value;
    if (!el) return;
    const fonts = el.querySelectorAll('font[face]');
    fonts.forEach(n => { n.style.fontFamily = selectionFontFamily.value; n.removeAttribute('face'); });
  } catch {}
}
function openImageLinkPopover(imgEl) {
  selectedImage.value = imgEl;
  const rect = imgEl.getBoundingClientRect();
  popoverPos.value = { top: rect.bottom + 6, left: rect.left };
  const linkEl = imgEl.closest('a');
  imageLink.value = linkEl ? (linkEl.getAttribute('href') || '') : '';
  showImageLinkPopover.value = true;
}
function setImageLink() {
  const img = selectedImage.value; const link = String(imageLink.value || '').trim(); if (!img) return;
  const parent = img.parentElement;
  if (parent && parent.tagName === 'A') { parent.href = link || parent.href; parent.target = '_blank'; parent.setAttribute('rel','noopener noreferrer'); }
  else if (link) {
    const a = document.createElement('a'); a.href = link; a.target = '_blank'; a.rel = 'noopener noreferrer'; img.replaceWith(a); a.appendChild(img);
  }
  closeImagePopover();
}
function removeImageLink() {
  const img = selectedImage.value; if (!img) return;
  const parent = img.parentElement; if (parent && parent.tagName === 'A') parent.replaceWith(img);
  closeImagePopover();
}
function closeImagePopover() { showImageLinkPopover.value = false; imageLink.value = ''; }

onMounted(() => {
  document.addEventListener('selectionchange', handleSelectionChange);
  window.addEventListener('resize', recomputeOnResize);
});
onUnmounted(() => {
  document.removeEventListener('selectionchange', handleSelectionChange);
  window.removeEventListener('resize', recomputeOnResize);
});
const currentColor = ref('#111111');
const fontSizePx = ref('16');
const sending = ref(false);
const popupError = ref('');
const popupOk = ref(false);
const showEmojiPicker = ref(false);
const showFullEmojiPicker = ref(false);
const emojiList = [
  '😀','😁','😂','🤣','😊','😍','😘','😎','🤩','🥳','🤗','🤝','👍','👏','🙏','💪','🔥','✨','🎉','💖','💡','✅','❌','⚠️','⭐','🌟','🚀','🎯','🧠','📣','📅','🕒'
];
const fileInputRef = ref(null);
const emojiSearch = ref('');
let lastSelection = null;
function saveSelection() {
  try {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      lastSelection = sel.getRangeAt(0);
    }
  } catch {}
}
function restoreSelection() {
  try {
    if (!lastSelection) return;
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(lastSelection);
  } catch {}
}
function focusEditorAndPreserveSelection() {
  try {
    const editor = editorRef.value;
    if (!editor) return;
    saveSelection();
    editor.focus();
    restoreSelection();
  } catch {}
}
const selectedImage = ref(null);
const imageWidthPx = ref(320);
// Grand set d'emojis (extrait compact)
const allEmojis = ['😀','😃','😄','😁','😆','🥹','😂','🤣','☺️','😊','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨','😐','😑','😶','🫥','😶‍🌫️','😏','😒','🙄','😬','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🤧','🥵','🥶','🥴','😵','🤯','🤠','🥳','🥸','😭','😱','😡','🤬','👍','👎','👏','🙏','💪','🔥','✨','🎉','💖','💡','✅','❌','⚠️','⭐','🌟','🚀','🎯','🧠','📣','📅','🕒'];
const allEmojisFiltered = computed(() => {
  const q = emojiSearch.value.trim().toLowerCase();
  if (!q) return allEmojis;
  // Pas de noms mappés: on filtre sur codes de base (pas idéal mais léger)
  return allEmojis.filter(e => e.toLowerCase().includes(q));
});

function execCmd(cmd) {
  try { document.execCommand(cmd, false); } catch {}
}
function applyBold() {
  try {
    focusEditorAndPreserveSelection();
    document.execCommand('bold', false);
    const el = editorRef.value;
    if (!el) return;
    // Normaliser <b>/<strong> pour assurer un gras visible
    const boldEls = el.querySelectorAll('b, strong');
    boldEls.forEach(n => { n.style.fontWeight = '700'; });
  } catch {}
}
function applyColor() {
  try { document.execCommand('foreColor', false, currentColor.value); } catch {}
}
function applySelectedFontSize() {
  try {
    const size = `${fontSizePx.value}px`;
    document.execCommand('fontSize', false, '7');
    // Remplace la taille par défaut de fontSize=7 par la taille px demandée
    const editor = editorRef.value;
    if (!editor) return;
    const fonts = editor.querySelectorAll('font[size="7"]');
    fonts.forEach((el) => { el.removeAttribute('size'); el.style.fontSize = size; });
  } catch {}
}
function insertEmoji(emoji) {
  try {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    sel.getRangeAt(0).deleteContents();
    sel.getRangeAt(0).insertNode(document.createTextNode(emoji));
  } catch {}
}
function insertImagePrompt() {
  const url = window.prompt('URL de l\'image (https://...)');
  if (!url) return;
  try {
    document.execCommand('insertImage', false, url);
    // sélectionner la dernière image insérée
    selectLastImage();
    applyImageWidth();
  } catch {}
}
function openFileChooser() { try { fileInputRef.value && fileInputRef.value.click(); } catch {} }
function onImageFileSelected(e) {
  try {
    const file = e?.target?.files?.[0];
    if (!file) return;
    const maxBytes = 300 * 1024; // 300ko max
    if (file.size > maxBytes) {
      alert('Image trop lourde (max 300ko). Compressez-la et réessayez.');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      try {
        document.execCommand('insertImage', false, String(dataUrl));
        selectLastImage();
        applyImageWidth();
      } catch {}
    };
    reader.readAsDataURL(file);
  } catch {}
}
function openFullEmojiPicker() { showFullEmojiPicker.value = !showFullEmojiPicker.value }
function selectLastImage() {
  try {
    const editor = editorRef.value;
    if (!editor) return;
    const imgs = editor.querySelectorAll('img');
    if (imgs && imgs.length) {
      selectedImage.value = imgs[imgs.length - 1];
    }
  } catch {}
}
function applyImageWidth() {
  try {
    if (!selectedImage.value) return;
    selectedImage.value.style.width = imageWidthPx.value + 'px';
    selectedImage.value.style.maxWidth = '100%';
    selectedImage.value.style.height = 'auto';
    selectedImage.value.style.display = 'block';
  } catch {}
}
function fitImageToEditor() {
  try {
    const editor = editorRef.value;
    if (!editor || !selectedImage.value) return;
    // Déduire la largeur interne de l'éditeur
    const editorWidth = editor.clientWidth - 20; // padding approx
    imageWidthPx.value = Math.max(80, Math.min(592, editorWidth));
    applyImageWidth();
  } catch {}
}
function getEditorHtml() {
  const el = editorRef.value;
  if (!el) return '';
  return String(el.innerHTML || '').trim();
}
async function sendPopup() {
  popupError.value = '';
  popupOk.value = false;
  const html = getEditorHtml();
  if (!html) { popupError.value = 'Contenu vide'; return; }
  if (popupTarget.value === 'user' && !popupUserId.value) { popupError.value = 'ID utilisateur requis'; return; }
  sending.value = true;
  try {
    await secureApiCall('/popups/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target: popupTarget.value, userId: popupUserId.value, html })
    });
    popupOk.value = true;
    try { if (editorRef.value) editorRef.value.innerHTML = ''; } catch {}
    popupUserId.value = '';
  } catch (e) {
    popupError.value = 'Erreur lors de l\'envoi';
  } finally {
    sending.value = false;
    setTimeout(() => { popupOk.value = false; }, 2500);
  }
}

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
      // Use admin/all to get suggested and inactive items too
      const res = await secureApiCall('/items/admin/all')
      if (res && res.success && Array.isArray(res.items)) {
        const raw = Array.isArray(res.items) ? res.items : []
        const extra = raw
          .filter(it => it && (typeof it.legacyId === 'number' || typeof it.id === 'number'))
          .map(it => ({ 
            id: (typeof it.legacyId === 'number' ? it.legacyId : it.id), 
            name: it.name || `Item ${(it && (it.legacyId ?? it.id)) || ''}`,
            isSuggested: !!it.isSuggested,
            active: it.active
          }))

        // 1) Ne pas injecter les dynamiques dans le catalogue statique
        //    Purger au cas où un ancien appel les aurait ajoutés
        itemsCatalog.value = itemsCatalog.value.filter(Boolean).filter(x => baseStaticIds.has(x.id))
        // Tri stable
        itemsCatalog.value = [...itemsCatalog.value].sort((a,b)=>a.id-b.id)

        // 2) Conserver un catalogue séparé pour l'UI "Items dynamiques"
        dynamicItemsCatalog.value = extra
      }
    } catch {}
  }
  const selectedItemsToGive = ref([]);
const itemsLoading = ref(false);
const adminMessage = ref(''); // Message optionnel de l'admin lors de l'attribution d'items
// Donner des couleurs de bordure
const openBorderGive = ref(false);
const borderColors = ref([]);
const borderColorsLoading = ref(false);
const selectedBorderToGive = ref('');
const selectedBorderToGiveList = ref([]);
// Avatar / Reroll
const avatarUrlInput = ref('');
const rerollLoading = ref(false);
const dailyShopItemsIds = ref([]);
const dailyShopColorIds = ref([]);
const dailyShopLoading = ref(false);
const adminSetItemsInputs = ref(['','','','']);
const adminSetColorsInputs = ref(['','','','']);
const replaceItemOldId = ref(null);
const replaceItemNewId = ref('');
const replaceColorOldId = ref(null);
const replaceColorNewId = ref('');
const selectableItemsOptions = computed(() => {
  const base = Array.isArray(itemsCatalog.value) ? itemsCatalog.value : [];
  const dyn = Array.isArray(dynamicItemsCatalog.value) ? dynamicItemsCatalog.value : [];
  const allowedBaseIds = new Set([1,2,3,4,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24]);
  const merged = [...base.filter(it => allowedBaseIds.has(Number(it.id))), ...dyn]
    .filter(Boolean)
    .map(it => ({ 
      id: Number(it.id), 
      name: (it.isSuggested ? '[Suggéré] ' : '') + (it.name || `Item ${it.id}`) 
    }))
    .sort((a,b)=>a.id-b.id);
  return merged;
});
const selectableColorOptions = computed(() => {
  const list = Array.isArray(borderColors.value) ? borderColors.value : (Array.isArray(coinsStore.borderColors) ? coinsStore.borderColors : []);
  return list.map(c => ({ id: Number(c.id), name: c.name || `Couleur ${c.id}` }));
});
onMounted(() => { try { refreshDailyShop(); } catch {} });
async function refreshDailyShop() {
  dailyShopLoading.value = true;
  try {
    const res = await secureApiCall('/coins/weekly-items', { method: 'GET', cache: 'no-store' });
    const list = Array.isArray(res?.weeklyItems) ? res.weeklyItems : [];
    const items = list.filter(x => !x?.type);
    const colors = list.filter(x => !!x?.type);
    dailyShopItemsIds.value = items.map(x => Number(x.id));
    dailyShopColorIds.value = colors.map(x => Number(x.id));
    const pad = (arr) => { const out = arr.slice(0,4); while (out.length < 4) out.push(''); return out; };
    adminSetItemsInputs.value = pad(dailyShopItemsIds.value);
    adminSetColorsInputs.value = pad(dailyShopColorIds.value);
    replaceItemOldId.value = dailyShopItemsIds.value[0] || null;
    replaceColorOldId.value = dailyShopColorIds.value[0] || null;
  } catch (e) { alert((e && e.message) ? e.message : 'Erreur actualisation boutique'); }
  finally { dailyShopLoading.value = false; }
}
function parseIdsInput(arr) {
  return arr
    .filter(v => v !== '' && v !== null && typeof v !== 'undefined')
    .map(v => Number(v))
    .filter(n => Number.isFinite(n) && n > 0);
}
async function adminSetDailyShop() {
  dailyShopLoading.value = true;
  try {
    const desiredItems = adminSetItemsInputs.value.slice(0, 4);
    const desiredColors = adminSetColorsInputs.value.slice(0, 4);
    let itemIds = parseIdsInput(desiredItems);
    let colorIds = parseIdsInput(desiredColors);
    const ensureThree = (current, fallback) => {
      const out = Array.from(new Set(current));
      for (let i = 0; out.length < 3 && i < fallback.length; i++) {
        const id = Number(fallback[i]);
        if (Number.isFinite(id) && id > 0 && !out.includes(id)) out.push(id);
      }
      return out.slice(0, 3);
    };
    itemIds = ensureThree(itemIds, dailyShopItemsIds.value);
    colorIds = ensureThree(colorIds, dailyShopColorIds.value);
    await secureApiCall('/coins/weekly-items/admin-set', { method: 'POST', body: JSON.stringify({ itemIds, colorIds }) });
    await refreshDailyShop();
    alert('Sélection appliquée');
  } catch (e) { alert((e && e.message) ? e.message : 'Erreur admin-set'); }
  finally { dailyShopLoading.value = false; }
}
async function adminReplaceDailyItem() {
  if (!replaceItemOldId.value || !replaceItemNewId.value) return;
  dailyShopLoading.value = true;
  try {
    await secureApiCall('/coins/weekly-items/admin-replace', { method: 'POST', body: JSON.stringify({ scope: 'items', oldId: Number(replaceItemOldId.value), newId: Number(replaceItemNewId.value) }) });
    await refreshDailyShop();
    alert('Item remplacé');
  } catch (e) { alert((e && e.message) ? e.message : 'Erreur remplacement item'); }
  finally { dailyShopLoading.value = false; }
}
async function adminReplaceDailyColor() {
  if (!replaceColorOldId.value || !replaceColorNewId.value) return;
  dailyShopLoading.value = true;
  try {
    await secureApiCall('/coins/weekly-items/admin-replace', { method: 'POST', body: JSON.stringify({ scope: 'colors', oldId: Number(replaceColorOldId.value), newId: Number(replaceColorNewId.value) }) });
    await refreshDailyShop();
    alert('Couleur remplacée');
  } catch (e) { alert((e && e.message) ? e.message : 'Erreur remplacement couleur'); }
  finally { dailyShopLoading.value = false; }
}
async function resetItemsOnly() {
  dailyShopLoading.value = true;
  try {
    const oldColors = dailyShopColorIds.value.slice();
    await rerollDailyShop();
    await refreshDailyShop();
    await secureApiCall('/coins/weekly-items/admin-set', { method: 'POST', body: JSON.stringify({ itemIds: dailyShopItemsIds.value, colorIds: oldColors }) });
    await refreshDailyShop();
    alert('Items reset');
  } catch (e) { alert((e && e.message) ? e.message : 'Erreur reset items'); }
  finally { dailyShopLoading.value = false; }
}
async function resetColorsOnly() {
  dailyShopLoading.value = true;
  try {
    const oldItems = dailyShopItemsIds.value.slice();
    await rerollDailyShop();
    await refreshDailyShop();
    await secureApiCall('/coins/weekly-items/admin-set', { method: 'POST', body: JSON.stringify({ itemIds: oldItems, colorIds: dailyShopColorIds.value }) });
    await refreshDailyShop();
    alert('Couleurs reset');
  } catch (e) { alert((e && e.message) ? e.message : 'Erreur reset couleurs'); }
  finally { dailyShopLoading.value = false; }
}
// Items dynamiques (catégorie séparée)
const dynamicItemsCatalog = ref([]);
const selectedDynamicItemsToGive = ref([]);

// Reprend l'algo utilisé lors du redeem: ColorId -> pseudo itemId négatif
function pseudoItemIdFromColorId(colorId) {
  const s = String(colorId || '')
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0
  }
  return -(100000 + (h % 100000))
}

// Map rapide: pseudoItemId -> objet couleur
const colorByPseudoId = computed(() => {
  const src = (Array.isArray(borderColors.value) && borderColors.value.length)
    ? borderColors.value
    : (Array.isArray(coinsStore.borderColors) ? coinsStore.borderColors : [])
  const m = new Map()
  for (const c of src) {
    if (!c || !c.id) continue
    const pid = pseudoItemIdFromColorId(String(c.id))
    m.set(pid, c)
  }
  return m
})

function getItemDisplayName(item) {
  const pid = Number(item && item.itemId)
  const color = colorByPseudoId.value.get(pid)
  if (color) {
    const label = color.name || `Couleur ${color.id}`
    return label
  }
  return String((item && item.itemName) || `Item ${item && item.itemId}`)
}

function getItemDisplayId(item) {
  const pid = Number(item && item.itemId)
  const color = colorByPseudoId.value.get(pid)
  if (color) {
    return `#${String(color.id)}`
  }
  return item && item.itemId
}

const events = ref([]);
const adminProposals = ref([]);
const adminProposalsLoading = ref(false);
const adminProposalsError = ref('');
const editingProposalId = ref(null);
const eventForm = ref({
  titre: '',
  date: '',
  heure: '',
  groupe: 'A',
  groupes: [],
  type: 'exam',
  matiere: matieres[0],
  year: 'BUT1',
  description: '',
  specialite: ''
});

const eventEditorRef = ref(null);
function syncEditorToModel() {
  try {
    const el = eventEditorRef.value
    if (!el) return
    eventForm.value.description = (el.innerHTML || '').trim()
  } catch {}
}

// Mini‑toolbar pour la description de l'évènement
const showEventEmoji = ref(false)
const eventFileRef = ref(null)
function toggleEventEmoji() { showEventEmoji.value = !showEventEmoji.value }
function focusEventEditor() { try { const el = eventEditorRef.value; if (el) el.focus() } catch {} }
function insertEventEmoji(emoji) { try { focusEventEditor(); document.execCommand('insertText', false, emoji) } catch {} }
function insertEventImageUrl() {
  const url = window.prompt('URL image (https://...)')
  if (!url) return
  try {
    focusEventEditor(); document.execCommand('insertImage', false, url)
    selectEventLastImage(); applyEventImageWidth()
  } catch {}
}
function openEventFileChooser() { try { if (eventFileRef.value) eventFileRef.value.click() } catch {} }
function onEventImageFileSelected(e) {
  try {
    const file = e?.target?.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try { focusEventEditor(); document.execCommand('insertImage', false, String(reader.result)); selectEventLastImage(); applyEventImageWidth() } catch {}
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  } catch {}
}

// Sélection et redimensionnement d'image dans l'éditeur d'évènement
const selectedEventImage = ref(null)
const eventImageWidthPx = ref(300)

function onEventEditableClick(e) {
  const t = e.target
  if (t && t.tagName === 'IMG') selectedEventImage.value = t
}

function selectEventLastImage() {
  const el = eventEditorRef.value
  if (!el) return
  const imgs = el.querySelectorAll('img')
  if (imgs && imgs.length) selectedEventImage.value = imgs[imgs.length - 1]
}

function applyEventImageWidth() {
  if (!selectedEventImage.value) return
  selectedEventImage.value.style.width = eventImageWidthPx.value + 'px'
  selectedEventImage.value.style.maxWidth = '100%'
  selectedEventImage.value.style.height = 'auto'
  selectedEventImage.value.style.display = 'block'
}

function fitEventImageToEditor() {
  const el = eventEditorRef.value
  if (!el || !selectedEventImage.value) return
  const w = el.clientWidth - 20
  eventImageWidthPx.value = Math.max(80, Math.min(900, w))
  applyEventImageWidth()
}

// Menu flottant pour la sélection dans l'éditeur d'évènement
const showEventSelectionToolbar = ref(false)
const eventSelectionToolbarPos = ref({ top: 0, left: 0 })
const eventSelectionToolbarTransform = ref('none')
const eventSelectionToolbarStyle = computed(() => ({
  position: 'fixed',
  top: eventSelectionToolbarPos.value.top + 'px',
  left: eventSelectionToolbarPos.value.left + 'px',
  transform: eventSelectionToolbarTransform.value
}))
const eventFontColor = ref('#111111')
const eventFontSize = ref('16')
const eventFontFamily = ref('Inter')
const eventSelectionToolbarRef = ref(null)

function updateEventToolbarPosition(rect) {
  try {
    const padding = 12
    const top = Math.max(0, rect.top - padding)
    const left = Math.max(8, rect.left)
    eventSelectionToolbarPos.value = { top, left }
    eventSelectionToolbarTransform.value = 'none'
  } catch {}
}
function onEventSelectionChange() {
  try {
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) { showEventSelectionToolbar.value = false; return }
    const range = sel.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    const el = eventEditorRef.value
    if (!el || !el.contains(range.commonAncestorContainer)) { showEventSelectionToolbar.value = false; return }
    showEventSelectionToolbar.value = true
    updateEventToolbarPosition(rect)
  } catch { showEventSelectionToolbar.value = false }
}
function applyEventFontColor() { try { document.execCommand('foreColor', false, eventFontColor.value) } catch {} }
function applyEventFontSize() {
  try {
    const px = eventFontSize.value
    document.execCommand('fontSize', false, 7)
    const el = eventEditorRef.value
    if (!el) return
    const fonts = el.querySelectorAll('font[size="7"]')
    fonts.forEach(n => { n.removeAttribute('size'); n.style.fontSize = px + 'px' })
  } catch {}
}
function applyEventFontFamily() {
  try {
    document.execCommand('fontName', false, eventFontFamily.value)
    const el = eventEditorRef.value
    if (!el) return
    const fonts = el.querySelectorAll('font[face]')
    fonts.forEach(n => { n.style.fontFamily = eventFontFamily.value; n.removeAttribute('face') })
  } catch {}
}

onMounted(() => {
  document.addEventListener('selectionchange', onEventSelectionChange)
})
onUnmounted(() => {
  document.removeEventListener('selectionchange', onEventSelectionChange)
})


const editingEventId = ref(null);
const editingIndex = ref(null);
const showEmploi = ref(false);

onMounted(async () => {
  try {
    const evRes = await axios.get(`${API_URL}/events`, { headers: getAuthHeaders() });
    events.value = Array.isArray(evRes.data) ? evRes.data : (Array.isArray(evRes.data.events) ? evRes.data.events : []);
  } catch (e) {
    events.value = [];
  }
  try { if (auth.user && auth.user.role === 'admin') await fetchAdminProposals(); } catch {}
});

async function fetchAdminProposals() {
  try {
    adminProposalsLoading.value = true; adminProposalsError.value = '';
    const res = await axios.get(`${API_URL}/events/proposals`, { headers: getAuthHeaders() });
    const list = Array.isArray(res.data?.proposals) ? res.data.proposals : (Array.isArray(res.data) ? res.data : []);
    adminProposals.value = list;
  } catch (e) { adminProposals.value = []; adminProposalsError.value = 'Erreur'; }
  finally { adminProposalsLoading.value = false; }
}

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
    // Récupération robuste du token (comme dans fetchUsers)
    let token = auth.token || auth.user?.token
    if (!token) {
      const userFromLocal = localStorage.getItem('user')
      const userFromSession = sessionStorage.getItem('user')
      const raw = userFromLocal || userFromSession
      if (raw) {
        const userData = JSON.parse(raw)
        token = userData.token
      }
    }
    const headers = token ? { Authorization: `Bearer ${token}` } : {}

    // 1) Tentative: hard delete officiel
    try {
      await axios.delete(`${API_URL}/events/${event._id}/hard`, { headers })
    } catch (err) {
      // 2) Fallback pour anciennes routes: events-groups hard-delete
      const status = err?.response?.status
      if (status === 404 || status === 405) {
        await axios.post(`${API_URL}/events-groups/${event._id}/hard-delete`, {}, { headers })
      } else {
        throw err
      }
    }

    // Mise à jour locale: on enlève bien celui avec le même _id
    const realIndex = events.value.findIndex(e => e && e._id === event._id)
    if (realIndex !== -1) {
      events.value.splice(realIndex, 1)
    }
  } catch (e) {
    console.error('Erreur suppression hard:', e)
    alert('Erreur lors de la suppression définitive de la tâche.')
  }
}

function editEvent(event, idx) {
  // On ne dépend plus d'un index filtré: on garde l'ID
  editingEventId.value = event && event._id ? event._id : null

  // (facultatif) on conserve aussi l'index local si tu en as besoin ailleurs
  editingIndex.value = idx;

  if (event) {
    console.log('Tâche sélectionnée pour édition :', event);
    eventForm.value.titre = event.titre || '';
    eventForm.value.date = event.date || '';
    eventForm.value.heure = event.heure || '';
    eventForm.value.groupe = event.groupe || '';
    // Nouveau: pré-remplir la multi-sélection
    eventForm.value.groupes = Array.isArray(event.groupes) && event.groupes.length
      ? [...event.groupes]
      : (event.groupe ? [event.groupe] : []);
    eventForm.value.type = event.type || '';
    eventForm.value.matiere = event.matiere || '';
    eventForm.value.year = event.year || '';
    eventForm.value.description = event.description || '';
    eventForm.value.specialite = event.specialite || '';
    // si tu as un éditeur visuel, le synchroniser ici
    try {
      nextTick(() => {
        if (eventEditorRef && eventEditorRef.value) {
          eventEditorRef.value.innerHTML = String(eventForm.value.description || '')
        }
      })
    } catch {}
  }
}

function editProposalAdmin(p) {
  editingProposalId.value = p && p._id ? p._id : null;
  const ev = p || {};
  selectedMatiere.value = ev.matiere || selectedMatiere.value;
  eventForm.value.titre = ev.titre || '';
  eventForm.value.date = ev.date || '';
  eventForm.value.heure = typeof ev.heure === 'string' ? ev.heure.replace('h', ':') : (ev.heure || '');
  eventForm.value.groupe = ev.groupe || '';
  eventForm.value.groupes = Array.isArray(ev.groupes) && ev.groupes.length ? [...ev.groupes] : (ev.groupe ? [ev.groupe] : []);
  eventForm.value.type = ev.type || 'devoir';
  eventForm.value.matiere = ev.matiere || '';
  eventForm.value.year = ev.year || '';
  eventForm.value.description = ev.description || '';
  eventForm.value.specialite = ev.specialite || '';
  nextTick(() => { try { if (eventEditorRef && eventEditorRef.value) eventEditorRef.value.innerHTML = String(eventForm.value.description || '') } catch {} });
}

async function deleteProposalAdmin(p) {
  try {
    if (!p || !p._id) return;
    await axios.delete(`${API_URL}/events/proposals/${p._id}`, { headers: getAuthHeaders() });
    await fetchAdminProposals();
  } catch (e) { alert('Erreur suppression proposition'); }
}

async function addEvent() {
  try {
    // Synchroniser la description depuis l'éditeur
    syncEditorToModel();

    if (!eventForm.value.groupes || eventForm.value.groupes.length === 0) {
      eventForm.value.groupes = [eventForm.value.groupe];
    }

    if (editingProposalId.value) {
      syncEditorToModel();
      const payload = { ...eventForm.value };
      delete payload.archived;
      const res = await axios.post(`${API_URL}/events/proposals/${editingProposalId.value}/update-self`, payload, { headers: getAuthHeaders() });
      const updated = res.data?.proposal || null;
      if (updated) {
        const idx = adminProposals.value.findIndex(x => x && x._id === editingProposalId.value);
        if (idx !== -1) adminProposals.value[idx] = updated;
      }
      editingProposalId.value = null;
      await fetchAdminProposals();
    } else if (editingEventId.value) {
      // Modification d'une tâche existante par ID (robuste)
      const idxInAll = events.value.findIndex(e => e && e._id === editingEventId.value)
      const base = idxInAll !== -1 ? events.value[idxInAll] : {}
      const updatedEvent = { ...base, ...eventForm.value }
      delete updatedEvent.archived

      const res = await axios.put(`${API_URL}/events/${editingEventId.value}`, updatedEvent, { headers: getAuthHeaders() })
      if (idxInAll !== -1) {
        events.value[idxInAll] = res.data
      } else {
        // sécurité: si pas trouvé localement, on remonte/insère
        events.value.push(res.data)
      }
      editingEventId.value = null
      editingIndex.value = null
    } else {
      // Ajout d'une nouvelle tâche
      const res = await axios.post(`${API_URL}/events`, eventForm.value, { headers: getAuthHeaders() })
      events.value.push(res.data)
    }

    // Reset du formulaire (+ éditeur visuel si présent)
    eventForm.value = { titre: '', date: '', heure: '', groupe: 'A', type: 'exam', matiere: selectedMatiere.value, year: 'BUT1', description: '', specialite: '', groupes: [] };
    nextTick(() => {
      try { if (eventEditorRef?.value) eventEditorRef.value.innerHTML = '' } catch {}
    })
  } catch (err) {
    alert('Erreur lors de l\'ajout ou modification : ' + (err.response?.data?.message || err.message));
  }
}

async function fetchUsers() {
  try {
    // Récupérer le token d'authentification
    let token = auth.token || auth.user?.token
    
    if (!token) {
      const userFromLocal = localStorage.getItem('user')
      const userFromSession = sessionStorage.getItem('user')
      const raw = userFromLocal || userFromSession
      if (raw) {
        const userData = JSON.parse(raw)
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
    
         const response = await fetch(`${API_URL}/users/admin`, {
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
    // Normaliser l'identifiant côté UI (réduire espaces multiples, trim)
    userForm.value.username = String(userForm.value.username || '').replace(/\s+/g, ' ').trim();
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
    
    const response = await fetch(`${API_URL}/users/register`, {
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
    userForm.value = { username: '', password: '', role: 'eleve', groupe: 'A', year: 'BUT1', specialite: '', department: 'MMI' };
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
    specialite: user.specialite || '',
    department: user.department || '',
    coins: user.coins || 0,
    leaderboardCoins: user.leaderboardCoins || 0,
    factionCoins: user.factionCoins || 0
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
    specialite: userData.specialite || '',
    department: userData.department || '',
    coins: userData.coins || 0,
    leaderboardCoins: userData.leaderboardCoins || 0,
    factionCoins: userData.factionCoins || 0
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
    specialite: '',
    department: '',
    coins: 0,
    leaderboardCoins: 0,
    factionCoins: 0
  };
  editFormMessage.value = '';
}

async function updateUser() {
  editFormMessage.value = '';
  editFormLoading.value = true;
  try {
    const updateData = { ...editForm.value };

    // Calculer le delta de coins avant mise à jour
    const previousCoins = (editingUser.value?.coins ?? 0);
    const targetCoins = Number(editForm.value.coins);
    const coinsChanged = typeof updateData.coins === 'number' && targetCoins !== previousCoins;
    const deltaCoins = coinsChanged ? (targetCoins - previousCoins) : 0;

    // Ne pas envoyer le mot de passe s'il est vide
    if (!updateData.password) {
      delete updateData.password;
    }

    // Déterminer les changements pour les différents types de coins
    const leaderboardChanged = typeof editForm.value.leaderboardCoins === 'number' && editForm.value.leaderboardCoins !== (editingUser.value?.leaderboardCoins ?? 0);
    const factionChanged = typeof editForm.value.factionCoins === 'number' && editForm.value.factionCoins !== (editingUser.value?.factionCoins ?? 0);

    // Retirer les champs coin spécifiques du PUT /users/:id (gérés via /users-admin)
    delete updateData.leaderboardCoins;
    delete updateData.factionCoins;
    delete updateData.coins;

    // Token
    let token = auth.token || auth.user?.token
    if (!token) {
      const userFromStorage = localStorage.getItem('user')
      if (userFromStorage) token = JSON.parse(userFromStorage).token
    }
    const headers = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'Authorization': `Bearer ${token}`
    }

    // Mise à jour des champs généraux
    const baseResp = await fetch(`${API_URL}/users/${editingUser.value._id}`, {
      method: 'PUT',
      headers,
      credentials: 'include',
      body: JSON.stringify(updateData)
    })
    if (!baseResp.ok) {
      const errorText = await baseResp.text();
      throw new Error(`HTTP error! status: ${baseResp.status} - ${errorText}`)
    }

    // Coins Planify (optionnel)
    if (coinsChanged) {
      const respCoins = await fetch(`${API_URL}/users-admin`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          action: 'update-wallet-coins-only',
          userId: editingUser.value._id,
          coins: targetCoins
        })
      })
      if (!respCoins.ok) {
        const t = await respCoins.text();
        throw new Error(`Erreur update-wallet-coins-only: ${t}`)
      }

      // Envoi de la pop-up (si choisi) avec message faction gagnante/perdante
      if (sendCoinsPopup.value) {
        try { await loadFactionTotals(true) } catch {}
        const html = composeFactionCoinsPopupHTMLForUser(
          editingUser.value,
          deltaCoins,
          coinsPopupMessage.value
        )
        try {
          await secureApiCall('/popups/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ target: 'user', userId: editingUser.value._id, html })
          });
        } catch (e) {
          console.warn('Envoi de pop-up coins échoué:', e);
        }
      }
    }

    // Leaderboard coins (optionnel)
    if (leaderboardChanged) {
      const respLb = await fetch(`${API_URL}/users-admin`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          action: 'update-leaderboard-coins',
          userId: editingUser.value._id,
          leaderboardCoins: Number(editForm.value.leaderboardCoins)
        })
      })
      if (!respLb.ok) {
        const t = await respLb.text();
        throw new Error(`Erreur update-leaderboard-coins: ${t}`)
      }
    }

    // Faction coins (optionnel)
    if (factionChanged) {
      const respFaction = await fetch(`${API_URL}/users-admin`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          action: 'update-faction-coins',
          userId: editingUser.value._id,
          factionCoins: Number(editForm.value.factionCoins)
        })
      })
      if (!respFaction.ok) {
        const t = await respFaction.text();
        throw new Error(`Erreur update-faction-coins: ${t}`)
      }
    }

    // Rafraîchir et message
    await fetchUsers();
    editFormMessage.value = 'Utilisateur mis à jour avec succès';
    setTimeout(() => { cancelEdit(); }, 800);
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
    
    const response = await fetch(`${API_URL}/users/${userId}`, {
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
    const res = await fetch(`${API_URL}/users/${user._id}`, { method: 'GET', headers, credentials: token ? 'include' : 'same-origin' });
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
    const res = await fetch(`${API_URL}/users/${secretsUser.value._id}`, {
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
    
    const response = await fetch(`${API_URL}/users/${viewingUserItems.value._id}/give-item`, {
      method: 'POST',
      headers: headers,
      credentials: 'include',
      body: JSON.stringify({
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
    const response = await fetch(`${API_URL}/users/${userId}/items`, {
      method: 'DELETE',
      headers,
      credentials: 'include'
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

// Définir l'avatar d'un utilisateur via URL
async function setUserAvatar() {
  if (!viewingUserItems.value || !avatarUrlInput.value) return
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
    const headers = { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest', 'Authorization': `Bearer ${token}` }
    const resp = await fetch(`${API_URL}/users-admin`, {
      method: 'POST', headers, credentials: 'include',
      body: JSON.stringify({ action: 'set-avatar-url', userId: viewingUserItems.value._id, avatar: avatarUrlInput.value.trim() })
    })
    const data = await resp.json().catch(()=>({}))
    if (!resp.ok || !data?.success) throw new Error(data?.error || 'Erreur API')
    await fetchUsers()
    const updatedUser = users.value.find(u => u._id === viewingUserItems.value._id)
    if (updatedUser) viewingUserItems.value = updatedUser
    alert('Avatar mis à jour !')
  } catch (e) {
    alert('Erreur avatar: ' + (e?.message || e))
  } finally { itemsLoading.value = false }
}

// Re-roll boutique quotidienne (admin)
async function rerollDailyShop() {
  rerollLoading.value = true
  try {
    let token = auth.token || auth.user?.token
    if (!token) {
      const userFromStorage = localStorage.getItem('user')
      if (userFromStorage) token = JSON.parse(userFromStorage).token
    }
    const headers = { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest', 'Authorization': `Bearer ${token}` }
    const resp = await fetch(`${API_URL}/coins/weekly-items/reroll`, { method: 'POST', headers, credentials: 'include' })
    const data = await resp.json().catch(()=>({}))
    if (!resp.ok || !data?.success) throw new Error(data?.message || 'Erreur API')
    alert('Boutique rerollée. Rouvre la boutique pour voir la nouvelle sélection.')
  } catch (e) {
    alert('Erreur re‑roll: ' + (e?.message || e))
  } finally { rerollLoading.value = false }
}

// Historique des boutiques (items + couleurs)
const shopHistory = ref([])
const loadingShopHistory = ref(false)

// Maps pour noms par ID (items + dynamiques + couleurs)
const itemNameByIdMap = computed(() => {
  const pairs = []
  for (const i of (itemsCatalog.value || []).filter(Boolean)) pairs.push([Number(i.id), i.name])
  for (const d of (dynamicItemsCatalog.value || []).filter(Boolean)) pairs.push([Number(d.id), d.name])
  return Object.fromEntries(pairs)
})
const colorNameByIdMap = computed(() => {
  const list = borderColors.value || []
  return Object.fromEntries(list.map(c => [Number(c.id), c.name]))
})

// Pop-up Historique
const showShopHistoryModal = ref(false)
function openShopHistory() {
  showShopHistoryModal.value = true
  fetchShopHistory()
}
function closeShopHistory() { showShopHistoryModal.value = false }

async function fetchShopHistory() {
  if (loadingShopHistory.value) return
  loadingShopHistory.value = true
  try {
    const res = await secureApiCall('/coins/weekly-items/history', { method: 'GET', cache: 'no-store' })
    const list = (res && Array.isArray(res.history)) ? res.history : (Array.isArray(res.entries) ? res.entries : [])
    shopHistory.value = list
  } catch (e) {
    alert((e && e.message) ? e.message : 'Erreur chargement historique')
  } finally {
    loadingShopHistory.value = false
  }
}

// Helpers d'affichage pour l'historique boutique
function formatHistoryDate(h) {
  const v = (h && (h.createdAt || h.date || h.timestamp || h.day || h.dayTimestamp || h.daySeed))
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) return v
  try {
    const d = new Date(v)
    return isNaN(d.getTime()) ? String(v || '') : d.toLocaleString('fr-FR')
  } catch { return String(v || '') }
}
function formatHistoryItems(h) {
  try {
    const items = (h && (h.items || h.weeklyItems || h.dailyItems)) || []
    if (Array.isArray(items) && items.length) {
      return items.map(i => {
        const id = (i && (i.id ?? i.itemId))
        const name = i && i.name ? i.name : (typeof id !== 'undefined' ? (itemNameByIdMap.value[Number(id)] || ('#' + id)) : '')
        return name
      }).join(', ')
    }
    // Fallback: id arrays
    const ids = Array.isArray(h?.itemIds) ? h.itemIds.map(Number) : []
    return ids.map(id => itemNameByIdMap.value[id] || ('#' + id)).join(', ')
  } catch { return '' }
}
function formatHistoryColors(h) {
  try {
    const colors = (h && (h.colors || h.weeklyColors || h.dailyColors)) || []
    if (Array.isArray(colors) && colors.length) {
      return colors.map(c => {
        const id = (c && (c.id ?? c.colorId))
        const name = c && c.name ? c.name : (typeof id !== 'undefined' ? (colorNameByIdMap.value[Number(id)] || ('#' + id)) : '')
        return name
      }).join(', ')
    }
    const ids = Array.isArray(h?.colorIds) ? h.colorIds.map(Number) : []
    return ids.map(id => colorNameByIdMap.value[id] || ('#' + id)).join(', ')
  } catch { return '' }
}
function formatMetricsList(list, nameMap) {
  try {
    const arr = Array.isArray(list) ? list : []
    if (!arr.length) return ''
    return arr.map(m => {
      const name = nameMap[Number(m.id)] || ('#' + m.id)
      const warn = (Number(m.currentWeight) >= 100) ? ' ⚠ 100' : ''
      const reaches = m.reaches100OnSeed ? (` → 100 le ${m.reaches100OnSeed}`) : ''
      return `${name}: act.${Number(m.currentWeight)} (base7:${Number(m.baseAfter7)}, +${Number(m.slopePerDay)}/j)${reaches}${warn}`
    }).join(' | ')
  } catch { return '' }
}
function formatHistoryItemWeights(h) {
  return formatMetricsList((h && h.itemWeights) || [], itemNameByIdMap.value)
}
function formatHistoryColorWeights(h) {
  return formatMetricsList((h && h.colorWeights) || [], colorNameByIdMap.value)
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
  if (!viewingUserItems.value || (selectedItemsToGive.value.length === 0 && selectedBorderToGiveList.value.length === 0 && selectedDynamicItemsToGive.value.length === 0)) return
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

    // Map robuste nom par ID (ID numérisés, fallback nom)
    const nameById = Object.fromEntries(
      itemsCatalog.value.map(i => [Number(i.id), i?.name || `Item ${i?.id}`])
    )
    // Normaliser les IDs possédés en nombres
    const ownedIds = new Set((viewingUserItems.value.purchasedItems || []).map(pi => Number(pi.itemId)))
    // Ne donner que les items manquants (y compris variantes de bordure), IDs numérisés
    const idsToGive = selectedItemsToGive.value
      .map(n => Number(n))
      .filter(id => !ownedIds.has(id))

    if (idsToGive.length === 0 && selectedBorderToGiveList.value.length === 0 && selectedDynamicItemsToGive.value.length === 0) {
      alert("Aucun nouvel don à effectuer: aucun item ni couleur sélectionné(e).")
      itemsLoading.value = false
      return
    }

    let givenCount = 0
    let alreadyOwnedCount = 0
    let failedCount = 0
    // Donner les items "classiques" (statiques)
    for (const id of idsToGive) {
      try {
        const response = await fetch(`${API_URL}/users/${viewingUserItems.value._id}/give-item`, {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({ 
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

    // Donner les items dynamiques cochés (par legacyId)
    let dynGiven = 0
    for (const legacyId of selectedDynamicItemsToGive.value) {
      try {
        const dynName = (dynamicItemsCatalog.value.find(x => x.id === legacyId)?.name) || `Item ${legacyId}`
        const resp = await fetch(`${API_URL}/users/${viewingUserItems.value._id}/give-item`, {
          method: 'POST', headers, credentials: 'include',
          body: JSON.stringify({ itemId: legacyId, itemName: dynName, adminMessage: adminMessage.value.trim() || null })
        })
        if (!resp.ok) { await resp.text(); continue }
        dynGiven++
      } catch {}
    }

    // Rafraîchir l'utilisateur (après dyn)
    await fetchUsers()
    const updatedUserDyn = users.value.find(u => u._id === viewingUserItems.value._id)
    if (updatedUserDyn) viewingUserItems.value = updatedUserDyn

    // Donner les couleurs de bordure cochées
    let colorsGiven = 0
    for (const cid of selectedBorderToGiveList.value) {
      try {
        let token = auth.token || auth.user?.token
        if (!token) {
          const userFromStorage = localStorage.getItem('user')
          if (userFromStorage) token = JSON.parse(userFromStorage).token
        }
        const headers = { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest', 'Authorization': `Bearer ${token}` }
        const resp = await fetch(`${API_URL}/users-admin`, { method: 'POST', headers, credentials: 'include', body: JSON.stringify({ action: 'set-border-color', userId: viewingUserItems.value._id, colorId: cid, adminMessage: (adminMessage.value || '').trim() || null }) })
        if (!resp.ok) { await resp.text(); continue }
        colorsGiven++
      } catch {}
    }

    // Rafraîchir l'utilisateur
    await fetchUsers()
    const updatedUser2 = users.value.find(u => u._id === viewingUserItems.value._id)
    if (updatedUser2) viewingUserItems.value = updatedUser2

    // Feedback synthétique
    const parts = []
    if (givenCount) parts.push(`${givenCount} item(s)`) 
    if (alreadyOwnedCount) parts.push(`${alreadyOwnedCount} déjà possédé(s)`) 
    if (failedCount) parts.push(`${failedCount} échec(s)`) 
    if (dynGiven) parts.push(`${dynGiven} item(s) dynamiques`)
    if (colorsGiven) parts.push(`${colorsGiven} couleur(s) de bordure`)
    alert(parts.length ? `Traitement terminé: ${parts.join(', ')}` : 'Rien à traiter')
    
    // Réinitialiser
    adminMessage.value = ''
    selectedBorderToGiveList.value = []
    selectedDynamicItemsToGive.value = []
  } catch (err) {
    console.error('Erreur don multiple:', err)
    alert('Erreur lors du don d\'items: ' + (err.message || err))
  } finally {
    itemsLoading.value = false
  }
}

// Donner une couleur de bordure sélectionnée via popup
async function giveBorderColorToUser() {
  if (!viewingUserItems.value || !selectedBorderToGive.value) return
  itemsLoading.value = true
  try {
    let token = auth.token || auth.user?.token
    if (!token) {
      const userFromStorage = localStorage.getItem('user')
      if (userFromStorage) token = JSON.parse(userFromStorage).token
    }
    const headers = { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest', 'Authorization': `Bearer ${token}` }
    const response = await fetch(`${API_URL}/users-admin`, {
      method: 'POST', headers, credentials: 'include',
      body: JSON.stringify({ action: 'set-border-color', userId: viewingUserItems.value._id, colorId: selectedBorderToGive.value })
    })
    if (!response.ok) {
      const txt = await response.text();
      throw new Error(txt || 'Erreur API')
    }
    // Rafraîchir liste des utilisateurs pour refléter la bordure
    await fetchUsers()
    const updatedUser = users.value.find(u => u._id === viewingUserItems.value._id)
    if (updatedUser) viewingUserItems.value = updatedUser
    openBorderGive.value = false
    alert('Couleur de bordure donnée avec succès')
  } catch (e) {
    alert('Erreur: ' + (e.message || e))
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
    
    const response = await fetch(`${API_URL}/users/${userId}/remove-item`, {
      method: 'POST',
      headers: headers,
      credentials: 'include',
      body: JSON.stringify({ itemId: itemId })
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

// === Patch Notes: états minimaux ===
const pnTitle = ref('')
const pnVersion = ref('')
const pnNotify = ref(true)
const pnEditorRef = ref(null)
const pnSending = ref(false)
const pnError = ref('')
const pnOk = ref(false)

// Ajout: états pour liste/édition/suppression
const pnList = ref([])
const pnListLoading = ref(false)
const pnEditingId = ref(null)
const pnDeleteBusyId = ref(null)

// Couleur et taille pour l'éditeur Patch Notes
const pnCurrentColor = ref('#111111')
const pnFontSizePx = ref('16')

// Toolbar de sélection (Patch Notes)
const pnSelectionToolbarRef = ref(null)
const pnShowSelectionToolbar = ref(false)
const pnSelectionColor = ref('#111111')
const pnSelectionFontSize = ref('16')
const pnSelectionFontFamily = ref('Cobe Heavy')
const pnSelectionToolbarPos = ref({ top: 0, left: 0 })
const pnSelectionToolbarTransform = ref('none')

// Emojis et images (Patch Notes)
const pnShowEmojiPicker = ref(false)
const pnShowFullEmojiPicker = ref(false)
const pnEmojiSearch = ref('')
const pnFileInputRef = ref(null)
const pnSelectedImage = ref(null)
const pnImageWidthPx = ref(320)

// Popover de lien d'image (Patch Notes)
const pnShowImageLinkPopover = ref(false)
const pnImageLink = ref('')
const pnPopoverPos = ref({ top: 0, left: 0 })
const pnPopoverStyle = computed(() => ({
  position: 'fixed',
  top: pnPopoverPos.value.top + 'px',
  left: pnPopoverPos.value.left + 'px',
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
  padding: '8px',
  zIndex: 10000,
  display: 'flex',
  alignItems: 'center',
  gap: '6px'
}))

// Filtre d'emojis pour Patch Notes (réutilise allEmojis global)
const pnAllEmojisFiltered = computed(() => {
  const q = String(pnEmojiSearch.value || '').trim().toLowerCase()
  return !q ? allEmojis : allEmojis.filter(e => e.toLowerCase().includes(q))
})

// Gestion sélection et toolbar pour l'éditeur Patch Notes
function pnUpdateToolbarPosition(rect) {
  try {
    const padding = 8
    const top = Math.max(0, rect.top - padding)
    let left = Math.max(8, rect.left)
    pnSelectionToolbarPos.value = { top, left }
    pnSelectionToolbarTransform.value = 'none'
  } catch {}
}
function pnHandleSelectionChange() {
  try {
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) { pnShowSelectionToolbar.value = false; return }
    const range = sel.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    const el = pnEditorRef.value
    if (!el || !el.contains(range.commonAncestorContainer)) { pnShowSelectionToolbar.value = false; return }
    pnShowSelectionToolbar.value = true
    pnUpdateToolbarPosition(rect)
  } catch { pnShowSelectionToolbar.value = false }
}

// Focus + restauration de sélection pour Patch Notes
let pnLastSelection = null
function pnSaveSelection() {
  try { const sel = window.getSelection(); if (sel && sel.rangeCount > 0) pnLastSelection = sel.getRangeAt(0) } catch {}
}
function pnRestoreSelection() {
  try { if (!pnLastSelection) return; const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(pnLastSelection) } catch {}
}
function pnFocusEditorAndPreserveSelection() {
  try { pnSaveSelection(); const editor = pnEditorRef.value; if (!editor) return; editor.focus(); pnRestoreSelection() } catch {}
}

// Commandes de formatage Patch Notes
function pnExecCmd(cmd) { try { document.execCommand(cmd, false) } catch {} }
function pnApplyBold() {
  try {
    pnFocusEditorAndPreserveSelection()
    document.execCommand('bold', false)
    const el = pnEditorRef.value
    if (!el) return
    const boldEls = el.querySelectorAll('b, strong')
    boldEls.forEach(n => { n.style.fontWeight = '700' })
  } catch {}
}
function pnApplyColor() { try { document.execCommand('foreColor', false, pnCurrentColor.value) } catch {} }
function pnApplySelectedFontSize() {
  try {
    const size = `${pnFontSizePx.value}px`
    document.execCommand('fontSize', false, '7')
    const editor = pnEditorRef.value
    if (!editor) return
    const fonts = editor.querySelectorAll('font[size="7"]')
    fonts.forEach((el) => { el.removeAttribute('size'); el.style.fontSize = size })
  } catch {}
}
function pnApplySelectionColor() { try { document.execCommand('foreColor', false, pnSelectionColor.value) } catch {} }
function pnApplySelectionFontSize() {
  try {
    pnFontSizePx.value = pnSelectionFontSize.value
    pnApplySelectedFontSize()
  } catch {}
}
function pnApplySelectionFontFamily() {
  try {
    document.execCommand('fontName', false, pnSelectionFontFamily.value)
    const el = pnEditorRef.value
    if (!el) return
    const fonts = el.querySelectorAll('font[face]')
    fonts.forEach(n => { n.style.fontFamily = pnSelectionFontFamily.value; n.removeAttribute('face') })
  } catch {}
}

// Gestion des images (Patch Notes)
function pnOnEditableClick(e) {
  const t = e.target
  if (t && t.tagName === 'IMG') pnOpenImageLinkPopover(t)
  else pnShowImageLinkPopover.value = false
}
function pnOpenImageLinkPopover(imgEl) {
  pnSelectedImage.value = imgEl
  const rect = imgEl.getBoundingClientRect()
  pnPopoverPos.value = { top: rect.bottom + 6, left: rect.left }
  const linkEl = imgEl.closest('a')
  pnImageLink.value = linkEl ? (linkEl.getAttribute('href') || '') : ''
  pnShowImageLinkPopover.value = true
}
function pnSetImageLink() {
  const img = pnSelectedImage.value; const link = String(pnImageLink.value || '').trim(); if (!img) return
  const parent = img.parentElement
  if (parent && parent.tagName === 'A') { parent.href = link || parent.href; parent.target = '_blank'; parent.setAttribute('rel','noopener noreferrer') }
  else if (link) { const a = document.createElement('a'); a.href = link; a.target = '_blank'; a.rel = 'noopener noreferrer'; img.replaceWith(a); a.appendChild(img) }
  pnCloseImagePopover()
}
function pnRemoveImageLink() {
  const img = pnSelectedImage.value; if (!img) return
  const parent = img.parentElement; if (parent && parent.tagName === 'A') parent.replaceWith(img)
  pnCloseImagePopover()
}
function pnCloseImagePopover() { pnShowImageLinkPopover.value = false; pnImageLink.value = '' }

function pnInsertImagePrompt() {
  const url = window.prompt('URL de l\'image (https://...)')
  if (!url) return
  try { document.execCommand('insertImage', false, url); pnSelectLastImage(); pnApplyImageWidth() } catch {}
}
function pnOpenFileChooser() { try { pnFileInputRef.value && pnFileInputRef.value.click() } catch {} }
function pnOnImageFileSelected(e) {
  try {
    const file = e?.target?.files?.[0]
    if (!file) return
    const maxBytes = 300 * 1024
    if (file.size > maxBytes) { alert('Image trop lourde (max 300ko). Compressez-la et réessayez.'); e.target.value = ''; return }
    const reader = new FileReader()
    reader.onload = () => { try { document.execCommand('insertImage', false, String(reader.result)); pnSelectLastImage(); pnApplyImageWidth() } catch {} }
    reader.readAsDataURL(file)
    e.target.value = ''
  } catch {}
}
function pnSelectLastImage() {
  try {
    const editor = pnEditorRef.value
    if (!editor) return
    const imgs = editor.querySelectorAll('img')
    if (imgs && imgs.length) pnSelectedImage.value = imgs[imgs.length - 1]
  } catch {}
}
function pnApplyImageWidth() {
  try {
    if (!pnSelectedImage.value) return
    pnSelectedImage.value.style.width = pnImageWidthPx.value + 'px'
    pnSelectedImage.value.style.maxWidth = '100%'
    pnSelectedImage.value.style.height = 'auto'
    pnSelectedImage.value.style.display = 'block'
  } catch {}
}
function pnFitImageToEditor() {
  try {
    const editor = pnEditorRef.value
    if (!editor || !pnSelectedImage.value) return
    const editorWidth = editor.clientWidth - 20
    pnImageWidthPx.value = Math.max(80, Math.min(592, editorWidth))
    pnApplyImageWidth()
  } catch {}
}

function getPnHtml() {
  const el = pnEditorRef.value
  return String(el?.innerHTML || '').trim()
}

// Ajout: formatage date pour le listing
function pnFormatDate(d) {
  try { return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) }
  catch { return '' }
}

// Ajout: chargement de la liste des patch notes publiés
async function loadPatchNotesList(force = false) {
  pnListLoading.value = true
  try {
    const ts = Date.now()
    const res = await secureApiCall(`/patch-notes?ts=${ts}`, { method: 'GET', cache: 'no-store' })
    if (res && res.success && Array.isArray(res.notes)) {
      pnList.value = res.notes
    }
  } catch {
    // Optionnel: pnError.value = 'Impossible de charger les patch notes'
  } finally {
    pnListLoading.value = false
  }
}

// Ajout: commencer la modification d'une note (remplir l'éditeur)
async function beginEditPatchNote(meta) {
  pnError.value = ''
  try {
    const id = meta._id || meta.id
    const ts = Date.now()
    const res = await secureApiCall(`/patch-notes/${encodeURIComponent(id)}?ts=${ts}`, { method: 'GET', cache: 'no-store' })
    if (res && res.success && res.note) {
      pnEditingId.value = id
      pnTitle.value = res.note.title || ''
      pnVersion.value = res.note.version || ''
      pnNotify.value = !!res.note.notify
      try { if (pnEditorRef.value) pnEditorRef.value.innerHTML = res.note.html || '' } catch {}
    } else {
      pnError.value = 'Note introuvable'
    }
  } catch {
    pnError.value = 'Impossible de charger la note'
  }
}

// Ajout: annuler la modification (vider l'éditeur/states)
function cancelEditPatchNote() {
  pnEditingId.value = null
  pnTitle.value = ''
  pnVersion.value = ''
  pnNotify.value = true
  try { if (pnEditorRef.value) pnEditorRef.value.innerHTML = '' } catch {}
}

// Ajout: suppression d'une note
async function deletePatchNote(metaOrId) {
  pnError.value = ''
  const id = (typeof metaOrId === 'string') ? metaOrId : (metaOrId._id || metaOrId.id)
  if (!id) return
  if (!window.confirm('Supprimer définitivement ce patch note ?')) return
  pnDeleteBusyId.value = id
  try {
    const res = await secureApiCall(`/patch-notes/${encodeURIComponent(id)}`, { method: 'DELETE' })
    if (res && res.success) {
      pnList.value = pnList.value.filter(n => (n._id || n.id) !== id)
      if (pnEditingId.value === id) cancelEditPatchNote()
      pnOk.value = true
      setTimeout(() => { pnOk.value = false }, 2000)
    } else {
      pnError.value = 'Suppression échouée'
    }
  } catch {
    pnError.value = 'Erreur serveur lors de la suppression'
  } finally {
    pnDeleteBusyId.value = null
  }
}

// Remplace la publication: bascule en PUT si pnEditingId est défini
async function sendPatchNote() {
  pnError.value = ''
  pnOk.value = false
  const html = getPnHtml()
  if (!pnTitle.value || !html) { pnError.value = 'Titre et contenu requis'; return }
  pnSending.value = true
  try {
    const payload = {
      title: pnTitle.value,
      version: pnVersion.value,
      html,
      notify: !!pnNotify.value,
      published: true
    }

    let res
    if (pnEditingId.value) {
      // Mise à jour
      res = await secureApiCall(`/patch-notes/${encodeURIComponent(pnEditingId.value)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
    } else {
      // Création
      res = await secureApiCall('/patch-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
    }

    if (res && res.success) {
      pnOk.value = true
      await loadPatchNotesList(true)
      cancelEditPatchNote()
      setTimeout(() => { pnOk.value = false }, 2500)
    } else {
      pnError.value = 'Erreur lors de la publication'
    }
  } catch (e) {
    pnError.value = 'Erreur serveur'
  } finally {
    pnSending.value = false
  }
}

// Écouteurs pour Patch Notes
onMounted(() => {
  try { document.addEventListener('selectionchange', pnHandleSelectionChange) } catch {}
  try { loadPatchNotesList() } catch {}
})
onUnmounted(() => {
  try { document.removeEventListener('selectionchange', pnHandleSelectionChange) } catch {}
})

</script>

<style scoped>
.task-title-input {
  font-family: 'Cobe Heavy', Inter, Arial, sans-serif;
  font-weight: 800;
}

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
.ephemeral-editor { background: #fff; border-radius: 16px; padding: 16px; box-shadow: 0 2px 12px #0001; }
.ephemeral-editor .row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-bottom: 10px; }
.ephemeral-select, .ephemeral-input { padding: 8px 10px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 0.95rem; }
.toolbar { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-bottom: 10px; }
.toolbar button { background: #e5e7eb; border: none; border-radius: 8px; padding: 6px 10px; cursor: pointer; color: #111; font-family: 'Cobe Heavy', Inter, Arial, sans-serif; }
.toolbar button:hover { background: #d1d5db; }
.editable { min-height: 120px; border: 1px dashed #9ca3af; border-radius: 12px; padding: 10px; color: #111; }
.editable:empty:before { content: attr(placeholder); color: #9ca3af; }
.actions { margin-top: 10px; }
.send-btn { background: #16a34a; color: #fff; border: none; border-radius: 10px; padding: 10px 18px; cursor: pointer; }
.send-btn:hover { background: #15803d; }
.popup-error { color: #dc2626; margin-top: 8px; }
.popup-ok { color: #16a34a; margin-top: 8px; }
.emoji-panel { display: flex; flex-wrap: wrap; gap: 6px; margin: 6px 0 10px 0; }
.emoji-btn { background: #f3f4f6; border: none; border-radius: 8px; padding: 6px 8px; cursor: pointer; }
.emoji-btn:hover { background: #e5e7eb; }
.emoji-picker-full { margin-top: 8px; background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 8px; }
.emoji-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(36px, 1fr)); gap: 6px; margin-top: 8px; }
.image-resize-panel { display:flex; align-items:center; gap:8px; padding:8px; background:#f9fafb; border:1px solid #e5e7eb; border-radius:12px; margin-bottom:10px; }
.event-form {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  align-items: flex-start;
  flex-wrap: wrap;
}
.event-form input,
.event-form select {
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  font-size: 1rem;
}

.event-description-editor {
  flex: 1 1 100%;
  min-height: 140px;
  max-height: 380px;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #fff;
  color: #111;
  overflow-y: auto;
}
.event-description-editor:empty:before {
  content: attr(data-placeholder);
  color: #9ca3af;
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

.btn-mini.rich-btn {
  color: black;
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

.export-btn {
  background: #111827;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  cursor: pointer;
  font-weight: bold;
}
.export-btn:hover { background: #000; }

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

.selection-toolbar { background:#fff; border:1px solid #e5e7eb; border-radius:12px; box-shadow:0 6px 18px rgba(0,0,0,0.08); padding:8px; display:flex; gap:8px; align-items:center; z-index:10000; }
.selection-toolbar .toolbar-group { display:flex; gap:8px; align-items:center; }
.btn-mini { background:#f3f4f6; color:#111; border:1px solid #e5e7eb; border-radius:6px; padding:4px 8px; font-size:0.85rem; cursor:pointer; }
.btn-mini:hover { background:#e5e7eb; }
.toolbar-divider { width:1px; height:18px; background:#e5e7eb; display:inline-block; margin:0 4px; }
.color-swatch { width:28px; height:28px; padding:0; border:none; background:transparent; }
.image-link-popover { z-index:3000; }
/* Enhanced toolbar styles scoped to selection toolbar */
.selection-toolbar .toolbar-divider { width:1px; height:24px; background:#e5e7eb; }
.selection-toolbar .matiere-select { padding:6px 10px; border:1px solid #d1d5db; border-radius:8px; }
.selection-toolbar .btn-mini { background:#f3f4f6; border:none; border-radius:8px; padding:6px 8px; cursor:pointer; }
.selection-toolbar .btn-mini:hover { background:#e5e7eb; }
.selection-toolbar input[type="color"].color-swatch { width:26px; height:26px; padding:0; border:1px solid #d1d5db; border-radius:6px; background:transparent; cursor:pointer; }

.rich-btn {
  font-family: "Cobe Heavy", Inter, Arial, sans-serif;
  background: linear-gradient(180deg, #f9fafb, #e5e7eb);
  color: #111;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  padding: 6px 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
.rich-btn:hover { background: linear-gradient(180deg, #eef2f7, #dfe3e8); }
.color-swatch-display { display:inline-block; width:16px; height:16px; border-radius:50%; border:1px solid #d1d5db; margin-left:4px; }

/* Pointeur sur tous les boutons du tableau de bord */
button,
.btn-mini,
.emoji-btn,
.toolbar button,
.selection-toolbar button,
.image-resize-panel button {
  cursor: pointer;
}


.field-label {
  display: block;
  font-weight: 600;
  color: #111;
  margin: 6px 0 4px;
  font-size: 13px;
}

/* Admin card for factions */
.admin-card { background:#fff; border-radius:16px; padding:16px; box-shadow:0 2px 12px #0001; margin-top:8px; }
.admin-card .row input[type="number"] { padding:8px 10px; border:1px solid #d1d5db; border-radius:8px; width:120px; }
.admin-card .hint { color:#6b7280; font-size:0.9rem; margin-top:8px; }
.muted { color:#6b7280; font-size:0.9rem; margin-top:8px; }

.history-table,
.history-table th,
.history-table td {
  color: #000 !important;
}

</style>