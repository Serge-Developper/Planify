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
      </div>
    </section>

    <!-- Équipe -->
    <section class="about-team">
      <div class="about-container">
        <h2>Rencontrez notre équipe</h2>
        <p class="about-team-lead">Des professionnels dévoués au service de notre réussite</p>
        <div class="about-team-row">
          <div class="about-team-member">
            <img src="@/assets/img/Serge.jpg" alt="Serge TOVMASSIAN" class="about-team-img" />
            <div>
              <h3>Serge TOVMASSIAN</h3>
              <p class="about-team-role">CEO & Développeur Web</p>
              <p>Développeur web et chef du site, Serge s'occupe de toute la partie développement du site Planify. Il assure la maintenance technique et l'évolution de la plateforme.</p>
            </div>
          </div>
          <div class="about-team-member">
            <img src="@/assets/img/Maxime.jpg" alt="Maxime TEBANI" class="about-team-img" />
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
// @ts-ignore
import docPolitiqueConfidentialite from '@/assets/reglement/Planify_Politique_Confidentialite.docx'
// @ts-ignore
import docDeclarationAccessibilite from '@/assets/reglement/Planify_Declaration_Accessibilite_RGAA.docx'
// @ts-ignore
import docReglementComplet from '@/assets/reglement/Reglement_Complet_Planify.docx'
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
  background-image: url('@/assets/iutscaled.jpg'); /* Image de l'IUT */
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
</style>
