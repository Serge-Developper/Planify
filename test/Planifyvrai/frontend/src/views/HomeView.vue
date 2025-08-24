<template>
  <section class="odoo-banner">
    <div class="odoo-banner-inner">
      <div class="odoo-banner-left">
        <h1 class="odoo-banner-title">Simplifiez votre 
          <span class="highlighted-word" style="position:relative;display:inline-block;">
            réussite
            <svg fill="none" class="o_text_highlight_svg o_content_no_merge position-absolute overflow-visible top-0 start-0 w-100 h-100 pe-none" style="position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:-1;">
              <path stroke-width="6" stroke="#6EFF78" stroke-linecap="round" fill="#6EFF78" transform="scale(1.33, 0.8)" d="M112.58 21.164h18.516c-.478-.176-1.722-.64-2.967-1.105.101-.401.214-.803.315-1.192 12.255 2.912 24.561 5.573 36.716 8.823 5.896 1.582 11.628 3.967 17.171 6.527 10.433 4.832 14.418 14.22 16.479 24.739.377 1.92.566 3.878.83 5.823 2.212 15.94-5.858 23.986-21.595 33.813-.993.615-2.288.79-3.181 1.494-14.229 11.308-31.412 14.32-48.608 17.107-29.01 4.694-57.431 2.209-84.91-8.372-8.145-3.138-16.164-6.853-23.706-11.22C6.176 90.986 1.16 80.053.193 67.25c-1.798-23.809 9.025-42.485 30.356-53.304C44.678 6.793 59.8 3.367 75.45 2.375 90.583 1.42 105.793.379 120.927.78c16.089.427 32.041 3.05 46.911 9.84 2.074.941 3.67 2.912 4.915 5.083-9.73-1.443-19.433-2.987-29.175-4.305-4.89-.665-9.842-1.067-14.77-1.33-23.82-1.28-47.376.514-70.391 7.003a133.771 133.771 0 0 0-22.639 8.648c-17.9 8.786-27.616 26.935-25.567 46.364.666 6.263 3.507 11.133 9.05 14.308 26.862 15.401 55.748 21.965 86.645 19.819 15.561-1.08 31.01-2.787 45.767-8.284 11.099-4.142 21.658-9.25 30.595-17.195 9.779-8.698 11.715-18.55 5.669-30.249-1.131-2.196-3.256-4.079-5.33-5.56-7.981-5.736-17.773-7.48-26.459-11.534-13.249-6.175-27.541-6.916-41.343-10.167-.817-.188-1.571-.64-2.35-.966.037-.364.088-.728.125-1.092Z" class="o_text_highlight_path_circle_2"></path>
            </svg>
          </span>.
        </h1>
        <p class="odoo-banner-desc">Planify, l'outil d'organisation scolaire pour les étudiants MMI : gérez vos devoirs, projets et planning de promo simplement et efficacement.</p>
        <button class="odoo-banner-btn" @click="goToEmploi">
          Commencer
          <img src="@/assets/chevron-right-circle-svgrepo-com.svg" alt="chevron" style="height:1.2em;width:1.2em;margin-left:0.5em;vertical-align:middle;" />
        </button>
      </div>
      <div class="odoo-banner-right" style="position: relative; display: flex; align-items: center; justify-content: center;">
        <img src="@/assets/float.svg" alt="Décor fond"
          style="position: absolute; left: 0; top: -50%; width: 150%; height: auto; z-index: 0; pointer-events: none;" />
        <img src="@/assets/iut.svg" alt="IUT Nancy"
          style="max-width: 600px; width: 100%; border-radius: 24px; position: relative; z-index: 1;" />
      </div>
    </div>
  </section>
  <div class="odoo-waves-content">
    <section class="planify-highlight-section">
      <h2 class="planify-highlight-title">Planify compte sur <span class="odoo-underline">vous</span>.</h2>
    </section>
    <img src="@/assets/03.svg" class="section-waves-bg" alt="" />
    <section class="odoo-section odoo-section-white">
      <div class="odoo-section-flex">
        <div class="odoo-section-text">
          <h2 class="odoo-section-title odoo-section-title-left">Complètement <span class="odoo-underline">gratuit</span>.</h2>
          <div class="odoo-section-text-block">
            <span class="odoo-section-line">Planify est une plateforme <span class="odoo-underline">100 % gratuite</span>, conçue spécialement pour les étudiants MMI.</span>
            <span class="odoo-section-line">Sans abonnement ni frais cachés, Planify vous permet <span class="odoo-underline">d’organiser</span> vos <span class="odoo-underline">devoirs, projets</span> et <span class="odoo-underline">plannings</span> de promo en toute <span class="odoo-underline">simplicité</span>, sans aucune contrainte financière.</span>
            <span class="odoo-section-line">Profitez d'un outil complet, <span class="odoo-underline">accessible à tous</span>, pour mieux gérer votre année scolaire et collaborer efficacement avec vos camarades.</span>
          </div>
        </div>
        <div class="odoo-section-img">
          <img src="@/assets/pcplanify.svg" alt="Aperçu Planify sur PC" class="pcplanify-img" />
        </div>
      </div>
    </section>
  </div>
  <section class="odoo-section odoo-section-team">
    <h2 class="odoo-section-title">Notre équipe</h2>
    <div class="odoo-team-cards">
      <div class="odoo-team-card">
        <img src="@/assets/img/Serge.jpg" alt="Serge TOVMASSIAN" class="odoo-team-img" />
        <h4 class="nom-serge">Serge TOVMASSIAN</h4>
        <p class="odoo-team-role">CEO & Développeur Web.</p>
        <p>Fondateur et visionnaire en chef, Serge est le moteur de l'entreprise. Il aime rester occupé en participant au développement des stratégies logicielles, marketing et d'expérience client.</p>
      </div>
      <div class="odoo-team-card">
        <img src="@/assets/img/Maxime.jpg" alt="Maxime TEBANI" class="odoo-team-img" />
        <h4 class="nom-maxime">Maxime TEBANI</h4>
        <p class="odoo-team-role">CEO & Graphiste, UI/UX Design.</p>
        <p>Maxime adore relever des défis. Fort de son expérience de plusieurs années en tant que directeur commercial, il a aidé l'entreprise à en arriver là où elle en est aujourd'hui.</p>
      </div>
    </div>
  </section>
  <section class="odoo-section odoo-section-faq">
    <h2 class="odoo-section-title">Questions récurrentes</h2>
    <div class="odoo-faq">
      <details>
        <summary>Planify est-il vraiment gratuit pour tous les étudiants ?</summary>
        <p>Oui, Planify est entièrement gratuit et accessible à tous les étudiants MMI. Il n'y a aucun abonnement ni frais cachés : notre but est de faciliter l'organisation scolaire sans contrainte financière.</p>
      </details>
      <details>
        <summary>Comment fonctionne l'organisation et la gestion des tâches sur Planify&nbsp;?</summary>
        <p>
          Sur Planify, l'organisation des devoirs, examens et tâches repose sur la collaboration avec le délégué de votre promo. Lorsqu'une nouvelle tâche (devoir, examen, projet, etc.) doit être ajoutée, il faut transmettre au délégué toutes les informations nécessaires (description précise, date, heure, matière, etc.).<br><br>
          C'est le délégué qui se charge ensuite d'ajouter la tâche sur le site Planify, afin qu'elle soit visible par toute la promo. Si vous souhaitez qu'une tâche apparaisse dans le planning, pensez donc à bien la communiquer à votre délégué, qui centralise et gère l'ensemble des événements pour votre groupe.
        </p>
      </details>
      <details>
        <summary>Puis-je accéder à Planify depuis mon téléphone ou ma tablette ?</summary>
        <p>Absolument ! Planify est conçu pour être accessible depuis n'importe quel appareil connecté, que ce soit un ordinateur, un smartphone ou une tablette, afin que vous puissiez gérer votre organisation où que vous soyez.</p>
      </details>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

function goToEmploi() {
  router.push('/devoir');
}
</script>

<style scoped>
.odoo-banner {
  background: rgb(255, 255, 255);
  padding: 100px 0 32px 0;
}
.odoo-banner-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 48px;
}
.odoo-banner-left {
  flex: 1;
  z-index: 2;
}
.odoo-banner-title {
  font-size: 4rem;
  color: #222;
  margin-bottom: 18px;
  font-family: "Cobe Heavy", "Inter", sans-serif;
}
.odoo-banner-highlight {
  color: #000000;
  font-weight: 900;
  font-style: normal;
  background: none;
  border-radius: 0;
  padding: 0;
}
.odoo-banner-desc {
  font-size: 1.3em;
  color: #000000;
  margin-bottom: 24px;
  font-family: "Cobe Heavy", "Inter", sans-serif;
  font-weight: 700;
  max-width: 93%;
}
.odoo-banner-btn {
  display: flex;
  align-items: flex-end; /* L'icône descend au maximum */
  background: #6EFF78;
  color: #000000;
  font-weight: bold;
  font-size: 1.5em;
  border: none;
  border-radius: 999px;
  padding: 12px 36px;
  box-shadow: 0 2px 8px #0001;
  transition: background 0.2s;
  font-family: "Cobe Heavy", "Inter", sans-serif;
}
.odoo-banner-btn:hover {
  background: #84ff8c;
  cursor: pointer;
}
.odoo-banner-btn img {
  height: 1em;
  width: 1em;
  margin-left: 0.5em;
  /* vertical-align: unset; */
}
.odoo-banner-right {
  flex: 1;
  display: flex;
  justify-content: center;
}
.odoo-banner-img {
  max-width: 340px;
  border-radius: 24px;
  box-shadow: 0 2px 16px #0002;
}
.odoo-section {
  padding: 56px 0 56px 0;
}
.odoo-section-green,
.odoo-section-green * {
  background: none !important;
  background-image: none !important;
}
.odoo-section-green .odoo-section-title {
  font-size: 3.8em;
}
.odoo-section-green .odoo-section-title u, .odoo-section-green .odoo-section-title span {
  font-weight: 700;
  text-decoration: underline;
  color: inherit;
}
.odoo-section-white {
  position: relative;
  z-index: 1;
  background: none;
}
.odoo-section-title {
  font-size: 4rem;
  color: #222;
  text-align: center;
  margin-bottom: 18px;
}
.odoo-section-title-left {
  text-align: left;
  margin-left: 0;
  white-space: nowrap;
  width: 100%;
  display: block;
}
.odoo-section-flex {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 48px;
  max-width: 1200px;
  margin: 0 auto;
}
.odoo-section-text {
  flex: 1;
  font-size: 1.3em;
  color: #000000;
  font-family: 'Montserrat', 'Inter', sans-serif;
  font-weight: 700;
}
.odoo-section-text, .odoo-section-text * {
  font-weight: 700 !important;
  font-family: "Cobe Heavy", "Inter", sans-serif;
}
.odoo-section-img {
  flex: 1;
  display: flex;
  justify-content: center;
}
.odoo-section-img img {
  max-width: 320px;
  border-radius: 24px;
}
.odoo-section-team {
  background: #f3f3f3;
  z-index: 1;
  margin-top: 15%;
}
.odoo-team-cards {
  display: flex;
  justify-content: center;
  gap: 48px;
  max-width: 900px;
  margin: 0 auto;
}
.odoo-team-card {
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 2px 12px #0001;
  padding: 32px 24px;
  max-width: 340px;
  text-align: center;
}
.odoo-team-img {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 12px;
}
.odoo-team-card .odoo-team-role {
  color: #00cf0e;
  font-weight: bold;
  margin-bottom: 8px;
}
.odoo-section-faq {
  background: #fff;
  margin-top: 5%;
  margin-bottom: 5%;
}
.odoo-faq {
  max-width: 700px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.odoo-faq details {
  background: #f3f3f3;
  border-radius: 12px;
  padding: 18px 24px;
  font-size: 1.1em;
  box-shadow: 0 2px 8px #0001;
}
.odoo-faq, .odoo-faq details, .odoo-faq p, .odoo-faq summary {
  color: #111;
}
.odoo-section-cta {
  background: linear-gradient(90deg, #a8ffce 0%, #5fffa1 100%);
  text-align: center;
}
.odoo-cta-card {
  max-width: 600px;
  margin: 0 auto;
  border-radius: 18px;
  box-shadow: 0 2px 12px #0001;
  padding: 40px 32px;
}
.odoo-cta-btn {
  background: #6366f1;
  color: #fff;
  font-weight: bold;
  font-size: 1.1em;
  border: none;
  border-radius: 999px;
  padding: 12px 36px;
  margin-top: 18px;
  box-shadow: 0 2px 8px #0001;
  transition: background 0.2s;
}
.odoo-cta-btn:hover {
  background: #4f46e5;
}
.planify-highlight-section {
  padding: 56px 0 32px 0;
  background: none;
  position: relative;
  z-index: 1;
}
.section-waves-bg {
  display: block;
  position: absolute;
  left: 0;
  width: 100vw;
  min-width: 100vw;
  max-width: none;
  height: auto;
  top: 30%;
  transform: translateY(-35%);
  z-index: -1;
  pointer-events: none;
}
.planify-highlight-title {
  font-size: 3.8em;
  font-family: "Cobe Heavy", "Inter", sans-serif;
  color: #222;
  text-align: center;
  margin-bottom: 18px;
}
.planify-highlight-title u {
  font-weight: 900;
  text-decoration: underline;
  color: inherit;
}
.odoo-waves-content {
  position: relative;
  z-index: 1;
  margin-top: 10%;
  width: 100%;
}
.planify-highlight-section,
.odoo-section-white {
  background: none;
}
.pcplanify-img {
  width: 100%;
  max-width: 480px;
  height: auto;
  display: block;
  margin-left: auto;
  margin-right: 0;
}
.odoo-section-text-block {
  display: flex;
  flex-direction: column;
  gap: 24px;
  font-size: 1.4rem;
  max-width: none;
  width: 100%;
  margin: 0;
  line-height: 1.5;
  font-family: "Cobe-Heavy", "Odoo Unicode Support Noto", sans-serif;
}
.odoo-section-line {
  display: block;
}
@media (max-width: 900px) {
  .odoo-banner-inner, .odoo-section-flex, .odoo-team-cards {
    flex-direction: column;
    gap: 24px;
    align-items: stretch;
  }
  .odoo-banner-img, .odoo-section-img img {
    max-width: 90vw;
  }
  .pcplanify-img {
    max-width: 90vw;
    margin: 24px auto 0 auto;
  }
  .odoo-section-text-block {
    font-size: 1.1em;
    max-width: 98vw;
    margin: 0 auto;
  }
}
.odoo-team-card, .odoo-team-card p, .odoo-team-card h4, .odoo-team-role, .odoo-cta-card, .odoo-cta-card h2, .odoo-cta-card p {
  color: #111;
  font-family: "Cobe Heavy", "Inter", sans-serif;
}

.odoo-underline {
  text-decoration: underline;
  text-underline-offset: 4px;
  font-weight: 900;
}
/* Ajouté pour le surlignage vert autour du mot "réussite" */
.highlighted-word {
  position: relative;
  display: inline-block;
  z-index: 1;
}
.highlighted-word svg {
  position: absolute !important;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: -1;
  overflow: visible;
}
.nom-serge {
  font-size: 1.4em;
}

.nom-maxime {
  font-size: 1.4em;
}
.odoo-section-faq,
.odoo-section-faq * {
  font-family: 'Cobe Heavy' !important;
}
.odoo-section-faq p {
  font-weight: 400;
  font-size: 1em;
  color: #463f3f;
  font-style: italic;
  font-family: 'Cobe Heavy';
  margin-top: 0.3em;
}
.odoo-section-faq summary {
  cursor: pointer;
}
</style>
