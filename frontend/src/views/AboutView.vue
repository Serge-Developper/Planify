<template>
  <main class="about-main">
    <!-- Section Parallax Titre + Présentation Planify -->
    <section class="about-hero">
      <div class="about-hero-bg"></div>
      <div class="about-hero-content">
        <div class="about-container">
          <h1 class="about-title">À propos de nous</h1>
        </div>
      </div>
    </section>

    <!-- Présentation -->
    <section class="about-intro">
      <div class="about-container">
        <p><strong>Planify</strong> est une plateforme web conçue spécialement pour simplifier la vie des étudiants en <strong>Métiers du Multimédia et de l'Internet (MMI)</strong>. Face à la charge croissante de devoirs, projets et plannings à gérer chaque semestre, nous avons imaginé un outil intuitif, collaboratif et totalement <strong>gratuit</strong>.</p>
        <p>Notre objectif est clair : <strong>vous aider à mieux vous organiser, sans stress ni frais</strong>. Grâce à une interface simple et moderne, vous pouvez planifier vos tâches, suivre l’évolution de vos projets, et même coordonner les événements de votre promotion en quelques clics.</p>
        <p><strong>Planify, c’est :</strong></p>
        <ul>
          <li>Une solution créée <strong>par des étudiants MMI, pour des étudiants MMI</strong></li>
          <li>Une interface claire, ergonomique, et optimisée pour tous les supports (ordinateur, tablette, smartphone)</li>
          <li>Une volonté d’encourager <strong>la réussite, l’autonomie et la collaboration</strong></li>
        </ul>
        <p>En rejoignant Planify, vous accédez à un espace pensé pour vous accompagner tout au long de votre année scolaire. Pas de publicité, pas d’abonnement : juste l’essentiel pour <strong>avancer ensemble, plus sereinement</strong>.</p>

        <div class="downloads-section">
          <h3 class="downloads-title">Documents légaux et conformité</h3>
          <div class="downloads-list">
            <a class="download-link" :href="docReglementComplet" download>
              📄 Règlement Complet Planify (DOCX)
            </a>
            <a class="download-link" :href="docPolitiqueConfidentialite" download>
              📄 Politique de Confidentialité (DOCX)
            </a>
            <a class="download-link" :href="docDeclarationAccessibilite" download>
              📄 Déclaration d’Accessibilité RGAA (DOCX)
            </a>
          </div>
        </div>
        
    <!-- AJOUT: Patch Notes -->
    <section class="patch-notes">
      <div class="about-container">
        <h2 class="patch-notes-title">Mises à jour</h2>
        <div class="patch-notes-list">
          <button
            v-for="n in notes"
            :key="n._id || n.id"
            class="patch-note-card"
            @click="openNote(n)"
            :title="n.title"
          >
            <span class="pn-title">{{ n.title }}</span>
            <span class="pn-version" v-if="n.version">{{ n.version }}</span>
            <span class="pn-date">{{ formatDate(n.createdAt) }}</span>
          </button>
          <div v-if="notes.length === 0" class="pn-empty">Aucune mise à jour pour le moment.</div>
        </div>

        <!-- Modal (unifiée + close-btn + bouton OK) -->
        <div v-if="showModal" class="pn-modal-overlay" @click.self="closeModal">
          <div class="pn-modal">
            <button
              class="close-btn"
              @click="closeModal"
              @mouseover="hoverClose = true"
              @mouseleave="hoverClose = false"
            >
              <img :src="hoverClose ? closeHoverImg : closeImg" alt="Fermer" class="close-img" />
            </button>
            <h3 class="pn-modal-title">{{ modalTitle }}</h3>
            <div class="pn-modal-content" v-html="modalHtml"></div>
            <div class="pn-actions">
              <button class="ok-btn" @click="closeModal">OK</button>
            </div>
          </div>
        </div>
      </div>
    </section>
      </div>
    </section>

    <!-- Équipe -->
    <section class="about-team">
      <div class="about-container">
        <h2>Rencontrez notre équipe</h2>
        <p class="about-team-lead">Des professionnels dévoués au service de notre réussite</p>
        <div class="about-team-row">
          <div class="about-team-member">
            <img src="@/assets/img/Serge.webp" alt="Serge TOVMASSIAN" class="about-team-img" />
            <div>
              <h3>Serge TOVMASSIAN</h3>
              <p class="about-team-role">CEO & Développeur Web</p>
              <p>Développeur web et chef du site, Serge s'occupe de toute la partie développement du site Planify. Il assure la maintenance technique et l'évolution de la plateforme.</p>
            </div>
          </div>
          <div class="about-team-member">
            <img src="@/assets/img/Maxime.webp" alt="Maxime TEBANI" class="about-team-img" />
            <div>
              <h3>Maxime TEBANI</h3>
              <p class="about-team-role">CEO & Graphiste, UI/UX Design</p>
              <p>Designer UI/UX et graphiste, Maxime est responsable de la conception et de l'expérience utilisateur du site Planify. Il crée les interfaces et assure la cohérence visuelle de la plateforme.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { secureApiCall } from '@/api'
// @ts-ignore
import docPolitiqueConfidentialite from '@/assets/reglement/Planify_Politique_Confidentialite.docx'
// @ts-ignore
import docDeclarationAccessibilite from '@/assets/reglement/Planify_Declaration_Accessibilite_RGAA.docx'
// @ts-ignore
import docReglementComplet from '@/assets/reglement/Reglement_Complet_Planify.docx'

// AJOUT: images pour close-btn (même style que les autres popups)
import closeImg from '@/assets/img/bouton_supprimer_decocher.png'
import closeHoverImg from '@/assets/img/bouton_supprimer_cocher.png'

// État Patch Notes
const notes = ref<any[]>([])
const showModal = ref(false)
const modalHtml = ref('')
const modalTitle = ref('')
const hoverClose = ref(false) // AJOUT: hover pour la croix

// Chargement
onMounted(async () => {
  try {
    const res: any = await secureApiCall('/patch-notes')
    if (res && res.success && Array.isArray(res.notes)) {
      notes.value = res.notes
    }
  } catch {}
})

function formatDate(d: any) {
  try {
    const dt = new Date(d)
    return dt.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch { return '' }
}

async function openNote(meta: any) {
  try {
    const id = meta._id || meta.id
    const res: any = await secureApiCall(`/patch-notes/${encodeURIComponent(id)}`)
    if (res && res.success && res.note) {
      modalTitle.value = res.note.title || meta.title || 'Mise à jour'
      modalHtml.value = res.note.html || ''
      showModal.value = true
      try { localStorage.setItem('patchNotesSeenAt', String(Date.now())) } catch {}
      try { window.dispatchEvent(new Event('patchNotesSeen')) } catch {}
      // Astuce: notifier Navbar (elle re-checkera via storage event)
      try { window.dispatchEvent(new StorageEvent('storage', { key: 'patchNotesSeenAt' })) } catch {}
    }
  } catch {}
}

function closeModal() {
  showModal.value = false
  modalHtml.value = ''
  modalTitle.value = ''
}
</script>

<style scoped>
.about-main {
  background: #fff;
  color: #222;
  font-family: 'Cobe Heavy', 'Inter', sans-serif;
}
.about-hero {
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: center; /* Modifié pour centrer le contenu */
  overflow: hidden;
}
.about-hero-bg {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background-image: url('@/assets/iutscaled.webp'); /* Image de l'IUT */
  background-size: cover;
  background-position: center;
  filter: brightness(0.7);
  z-index: 0;
}

.about-container {
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 0 24px;
  box-sizing: border-box;
}
.about-hero-content {
  position: relative;
  z-index: 1;
  padding-top: 48px;
  padding-bottom: 32px;
  text-align: left;
  
  /* Conformité avec .about-container */
  width: 100%;
  max-width: 1200px;
  padding-right: 24px;
  box-sizing: border-box;
}
.about-hero-content h1 {
  color: #fff;
  font-size: 3.2em;
  font-family: 'Cobe Heavy', 'Inter', sans-serif;
  text-shadow: 2px 2px 8px #0008;
  text-align: left;
  margin: 0;
}
.about-intro {
  padding: 48px 0 32px 0;
  background: #fff;
}
.downloads-section {
  margin-top: 28px;
}
.downloads-title {
  font-size: 1.4em;
  margin-bottom: 12px;
  font-family: 'Cobe Heavy', 'Inter', sans-serif;
}
.downloads-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.download-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #00c97b;
  text-decoration: none;
  font-size: 1.05em;
  padding: 10px 14px;
  border: 2px solid #00c97b;
  border-radius: 10px;
  width: fit-content;
  background: #fff;
  box-shadow: 0 2px 8px #0000001a;
  transition: transform .15s ease, box-shadow .15s ease, background .15s ease;
}
.download-link:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px #00000026;
  background: #f7fffb;
}
.about-intro p, .about-intro ul {
  font-size: 1.35em;
  margin-bottom: 18px;
  line-height: 1.7;
}
.about-intro ul {
  padding-left: 2em;
}
.about-intro li {
  margin-bottom: 8px;
}
.about-team {
  background: #f8f8f8;
  padding: 56px 0 56px 0;
  margin-top: 5%;
  margin-bottom: 10%;
}
.about-team h2 {
  text-align: center;
  font-size: 2.4em;
  margin-bottom: 8px;
  font-family: 'Cobe Heavy', 'Inter', sans-serif;
}
.about-team-lead {
  text-align: center;
  color: #666;
  font-size: 1.1em;
  margin-bottom: 32px;
}
.about-team-row {
  display: flex;
  flex-wrap: wrap;
  gap: 48px;
  justify-content: center;
}
.about-team-member {
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 2px 12px #0001;
  padding: 32px 24px;
  display: flex;
  align-items: center;
  gap: 32px;
  max-width: 492px;
  flex: 1 1 320px;
}
.about-team-img {
  width: 110px;
  height: 110px;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 2px 8px #0002;
  border: 3px #5bc681 solid;
}
.about-team-member h3 {
  margin: 0 0 6px 0;
  font-size: 1.3em;
  font-family: 'Cobe Heavy', 'Inter', sans-serif;
}
.about-team-role {
  color: #00cf0e;
  margin-bottom: 8px;
}

/* Suppression des règles dupliquées ou conflictuelles */
.about-title {
  text-align: left;
  font-size: 3.2em;
  font-family: 'Cobe Heavy', 'Inter', sans-serif;
  color: #fff;
  text-shadow: 2px 2px 8px #0008;
  margin: 0; /* Assurer qu'il n'y a pas de marge qui décale */
}
@media (max-width: 900px) {
  .about-team-row {
    flex-direction: column;
    gap: 24px;
    align-items: center;
  }
  .about-hero-content {
    padding: 32px 16px 24px 16px;
  }
  .about-team-member {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 0;
  }
  .about-team-img {
    margin-bottom: 16px;
  }
}
@media (min-width: 320px) and (max-width: 768px) {
  .about-title,
  .about-hero-content h1 {
    font-size: 1.9em;
  }
}
/* AJOUT: centrage mobile des patch notes */
@media (max-width: 768px) {
  .patch-note-card {
    width: 92vw;           /* largeur confortable sur mobile */
    max-width: 420px;      /* évite d’être trop large sur grands mobiles */
    justify-self: center;  /* force le centrage de l’élément */
  }
}
.patch-notes { background: #fff; padding: 40px 0; }
.patch-notes-title { font-size: 2.0em; font-family: 'Cobe Heavy', Inter, sans-serif; margin-bottom: 16px; }
.patch-notes-list { display: grid; justify-content: center; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px; } /* AJUSTE: min 240px pour éviter l’overflow */
.patch-note-card {
  display: grid; grid-template-columns: 1fr auto; grid-template-rows: auto auto; gap: 4px;
  background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px;
  text-align: left; cursor: pointer; color: #111;
  box-sizing: border-box; /* AJOUT: inclus padding dans la largeur */
}
.patch-note-card:hover { background: #f3f4f6; border-color: #d1d5db; }
/* AJOUT: police Cobe Heavy explicitement */
.pn-title,
.pn-version,
.pn-date,
.pn-modal-title { font-family: 'Cobe Heavy', Inter, sans-serif; }
.pn-version { color: #059669; }
.pn-date { color: #6b7280; grid-column: 1 / -1; font-size: .9em; }
.pn-empty { color: #6b7280; }

.pn-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.35); display:flex; align-items:center; justify-content:center; z-index: 4000; }
/* AJUSTE: padding top pour dégager la croix */
.pn-modal { background: #fff; border-radius: 16px; width: min(860px, 94vw); max-height: 88vh; overflow:auto; padding: 32px 20px 20px 20px; box-shadow: 0 2px 24px #0003; position: relative; }

/* AJOUT: close-btn comme dans Shop/Ephemeral/Profile */
.close-btn { position: absolute; top: 10px; right: 12px; background: transparent; border: none; width: 40px; height: 40px; padding: 0; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 10; transition: transform 0.25s, filter 0.25s; }
.close-img { width: 28px; height: 28px; display: block; filter: grayscale(0.5) brightness(0.95); transition: transform 0.25s, filter 0.25s; }
.close-btn:hover .close-img { transform: scale(1.18); filter: grayscale(0) brightness(1.1); }

/* AJOUT: bouton OK comme la pop-up éphémère */
.pn-actions { margin-top: 16px; text-align: right; }
.ok-btn { background: #16a34a; color: #fff; border: none; border-radius: 10px; padding: 10px 18px; cursor: pointer; font-family: 'Cobe Heavy', Inter, sans-serif !important; }
.ok-btn:hover { background: #15803d; }
.pn-close { position: absolute; top: 10px; right: 12px; background: #f3f4f6; border: none; border-radius: 10px; width: 36px; height: 36px; font-size: 20px; cursor: pointer; }
.pn-close:hover { background: #e5e7eb; }
.pn-modal-title { margin: 0 0 12px 0; font-size: 1.4em; }
.pn-modal-content { color: #111; line-height: 1.6; }


/* Thème sombre: forcer le blanc sur les textes demandés */
[data-theme="dark"] .about-main {
  color: #ffffff;
  background: var(--bg);
}
[data-theme="dark"] .about-intro p,
[data-theme="dark"] .about-intro ul,
[data-theme="dark"] .about-intro li,
[data-theme="dark"] .downloads-title,
[data-theme="dark"] .patch-notes-title,
[data-theme="dark"] .about-team h2 {
  color: #ffffff !important;
}
[data-theme="dark"] .about-team-lead,
[data-theme="dark"] .about-team-member h3,
[data-theme="dark"] .about-team-member p:not(.about-team-role) {
  color: #ffffff !important;
}
[data-theme="dark"] .about-team-role {
  color: var(--darkreader-text-00cf0e, #48f953) !important;
}

[data-theme="light"] .about-main { color: #111; background: #fff; }
[data-theme="light"] .about-hero-content h1,
[data-theme="light"] .about-title { color: #ffffff !important; text-shadow: none !important; }
[data-theme="light"] .about-intro p,
[data-theme="light"] .about-intro ul,
[data-theme="light"] .about-intro li,
[data-theme="light"] .downloads-title,
[data-theme="light"] .patch-notes-title,
[data-theme="light"] .about-team h2,
[data-theme="light"] .pn-modal-content { color: #111 !important; }
</style>
