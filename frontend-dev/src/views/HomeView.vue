<template>
  <section class="odoo-banner">
    <div class="odoo-banner-inner">
      <div class="odoo-banner-left">
        <h1 class="odoo-banner-title">Simplifiez votre 
          <span class="highlighted-word" style="position:relative;display:inline-block;">
            réussite
            <svg fill="none" class="o_text_highlight_svg o_content_no_merge position-absolute overflow-visible top-0 start-0 w-100 h-100 pe-none" style="position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:-1;">
              <path stroke-width="6" stroke="#6EFF78" stroke-linecap="round" fill="#6EFF78" d="M112.58 21.164h18.516c-.478-.176-1.722-.64-2.967-1.105.101-.401.214-.803.315-1.192 12.255 2.912 24.561 5.573 36.716 8.823 5.896 1.582 11.628 3.967 17.171 6.527 10.433 4.832 14.418 14.22 16.479 24.739.377 1.92.566 3.878.83 5.823 2.212 15.94-5.858 23.986-21.595 33.813-.993.615-2.288.79-3.181 1.494-14.229 11.308-31.412 14.32-48.608 17.107-29.01 4.694-57.431 2.209-84.91-8.372-8.145-3.138-16.164-6.853-23.706-11.22C6.176 90.986 1.16 80.053.193 67.25c-1.798-23.809 9.025-42.485 30.356-53.304C44.678 6.793 59.8 3.367 75.45 2.375 90.583 1.42 105.793.379 120.927.78c16.089.427 32.041 3.05 46.911 9.84 2.074.941 3.67 2.912 4.915 5.083-9.73-1.443-19.433-2.987-29.175-4.305-4.89-.665-9.842-1.067-14.77-1.33-23.82-1.28-47.376.514-70.391 7.003a133.771 133.771 0 0 0-22.639 8.648c-17.9 8.786-27.616 26.935-25.567 46.364.666 6.263 3.507 11.133 9.05 14.308 26.862 15.401 55.748 21.965 86.645 19.819 15.561-1.08 31.01-2.787 45.767-8.284 11.099-4.142 21.658-9.25 30.595-17.195 9.779-8.698 11.715-18.55 5.669-30.249-1.131-2.196-3.256-4.079-5.33-5.56-7.981-5.736-17.773-7.48-26.459-11.534-13.249-6.175-27.541-6.916-41.343-10.167-.817-.188-1.571-.64-2.35-.966.037-.364.088-.728.125-1.092Z" class="o_text_highlight_path_circle_2"></path>
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
        <img src="@/assets/float.svg" alt="Décor fond" class="float-bg" fetchpriority="high" />
        <img src="@/assets/iut.svg" alt="IUT Nancy"
          style="max-width: 600px; width: 100%; position: relative; z-index: 1;" />
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

  <section class="odoo-section odoo-section-notifications">
    <div class="odoo-section-flex">
      <div class="odoo-section-text">
        <h2 class="odoo-section-title odoo-section-title-left">Recevoir les <span class="odoo-underline">notifications</span> Planify</h2>
        <div class="odoo-section-text-block">
          <span class="odoo-section-line">
            Pour recevoir les notifications (devoirs, examens, roue de la fortune), Planify doit être installé comme une application sur votre téléphone.
          </span>
          <span class="odoo-section-line">
            <strong>Attention :</strong> Sur téléphone, les notifications ne fonctionnent pas correctement si le site est juste ouvert dans le navigateur. Il faut <strong>ajouter Planify à l’écran d’accueil</strong> pour qu'il fonctionne comme une vraie application.
          </span>
          
          <div class="notification-tutorial-buttons">
            <button class="odoo-cta-btn tuto-btn android" @click="showAndroidTuto = true" ref="androidBtnRef">
              📱 Tuto Android
            </button>
            <button class="odoo-cta-btn tuto-btn ios" @click="showIosTuto = true" ref="iosBtnRef" :style="{ width: iosBtnWidth ? iosBtnWidth + 'px' : undefined }">
              🍎 Tuto iOS
            </button>
          </div>

          <div class="notification-warning-box">
            <p>🔔 <strong>Important :</strong> Si aucune demande de notification n'apparaît quand vous cliquez sur "Activer" dans les paramètres, c'est que Planify n'est pas installé correctement. Refaites la manipulation "Ajouter à l'écran d'accueil".</p>
          </div>
        </div>
      </div>
      <div class="odoo-section-img notification-img-container">
        <img src="@/assets/logo_notifications.webp" alt="Notifications Planify" class="notification-img" />
      </div>
    </div>

    <!-- Modals -->
    <div v-if="showAndroidTuto" class="tuto-modal-overlay" @click.self="showAndroidTuto = false">
      <div class="tuto-modal">
        <button class="close-modal-btn" @click="showAndroidTuto = false" @mouseover="hoverCloseAndroid = true" @mouseleave="hoverCloseAndroid = false">
          <img :src="hoverCloseAndroid ? closeHoverImg : closeImg" alt="Fermer" class="close-img" />
        </button>
        <h3 class="tuto-title android" style="display: flex; justify-content: center;">Installation sur Android 📱</h3>
        <div class="tuto-modal-body">
          <ol class="tuto-steps">
            <li>Ouvrez <strong>Planify</strong> dans <strong>Chrome</strong>.</li>
            <li>Appuyez sur les <strong>trois points</strong> en haut à droite.</li>
            <li>Cliquez sur <strong>"Ajouter à l’écran d’accueil"</strong>.</li>
            <li>Validez l'ajout.</li>
            <li>Ouvrez Planify depuis la nouvelle icône sur votre écran d'accueil.</li>
          </ol>
          <p class="tuto-conclusion">✅ Une fois ouvert comme application, les notifications fonctionneront correctement.</p>
        </div>
      </div>
    </div>

    <div v-if="showIosTuto" class="tuto-modal-overlay" @click.self="showIosTuto = false">
      <div class="tuto-modal">
        <button class="close-modal-btn" @click="showIosTuto = false" @mouseover="hoverCloseIos = true" @mouseleave="hoverCloseIos = false">
          <img :src="hoverCloseIos ? closeHoverImg : closeImg" alt="Fermer" class="close-img" />
        </button>
        <h3 class="tuto-title ios" style="display: flex; justify-content: center;">Installation sur iOS 🍎</h3>
        <div class="tuto-modal-body">
          <div class="ios-warning">⚠️ <strong>Safari</strong> est obligatoire pour cette manipulation.</div>
          <ol class="tuto-steps">
            <li>Ouvrez <strong>Planify</strong> dans <strong>Safari</strong>.</li>
            <li>Appuyez sur l’icône <strong>Partager</strong> (carré avec flèche vers le haut).</li>
            <li>Faites défiler et cliquez sur <strong>"Ajouter à l’écran d’accueil"</strong>.</li>
            <li>Validez en cliquant sur "Ajouter".</li>
            <li>Ouvrez Planify depuis la nouvelle icône sur votre écran d'accueil.</li>
          </ol>
          <p class="tuto-conclusion">✅ Sur iOS, les notifications <strong>ne fonctionnent QUE</strong> si le site est installé ainsi.</p>
        </div>
      </div>
    </div>
  </section>

  <section class="odoo-section odoo-section-team">
    <h2 class="odoo-section-title">Notre équipe</h2>
    <div class="odoo-team-cards">
      <div class="odoo-team-card">
        <img src="@/assets/img/Serge.webp" alt="Serge TOVMASSIAN" class="odoo-team-img" />
        <h4 class="nom-serge">Serge TOVMASSIAN</h4>
        <p class="odoo-team-role">CEO & Développeur Web.</p>
        <p>Développeur web et chef du site, Serge s'occupe de toute la partie développement du site Planify. Il assure la maintenance technique et l'évolution de la plateforme.</p>
      </div>
      <div class="odoo-team-card">
        <img src="@/assets/img/Maxime.webp" alt="Maxime TEBANI" class="odoo-team-img" />
        <h4 class="nom-maxime">Maxime TEBANI</h4>
        <p class="odoo-team-role">CEO & Graphiste, UI/UX Design.</p>
        <p>Designer UI/UX et graphiste, Maxime est responsable de la conception et de l'expérience utilisateur du site Planify. Il crée les interfaces et assure la cohérence visuelle de la plateforme.</p>
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
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import closeImg from '@/assets/img/bouton_supprimer_decocher.png';
import closeHoverImg from '@/assets/img/bouton_supprimer_cocher.png';

const router = useRouter();
const showAndroidTuto = ref(false);
const showIosTuto = ref(false);
const hoverCloseAndroid = ref(false);
const hoverCloseIos = ref(false);

const androidBtnRef = ref<HTMLElement | null>(null);
const iosBtnRef = ref<HTMLElement | null>(null);
const iosBtnWidth = ref<number | null>(null);
function updateIosWidth() {
  const el = androidBtnRef.value;
  if (el) iosBtnWidth.value = Math.round(el.offsetWidth);
}
onMounted(() => {
  nextTick(() => {
    updateIosWidth();
    window.addEventListener('resize', updateIosWidth);
  });
});
onUnmounted(() => {
  window.removeEventListener('resize', updateIosWidth);
});

watch(showAndroidTuto, (val) => {
  if (!val) hoverCloseAndroid.value = false;
});
watch(showIosTuto, (val) => {
  if (!val) hoverCloseIos.value = false;
});

function goToEmploi() {
  router.push('/devoirs');
}
</script>

<style scoped>
.odoo-banner {
  background: rgb(255, 255, 255);
  padding: 100px 0 32px 0;
}
@media (max-width: 768px) {
  .odoo-banner {
    padding: 20px 0 32px;
  }
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
  font-size: 1.4rem;
  color: #000000;
  margin-bottom: 24px;
  font-family: "Cobe Heavy", "Inter", sans-serif;
  max-width: 93%;
}
.odoo-banner-btn {
  display: flex;
  align-items: center;
  background: #6eff78;
  color: #000;
  font-size: 1.5em;
  border: none;
  border-radius: 999px;
  padding: 12px 36px;
  box-shadow: 0 2px 8px #0001;
  transition: background .2s;
  font-family: Cobe Heavy,Inter,sans-serif;
}
.odoo-banner-btn:hover {
  background: #84ff8c;
  cursor: pointer;
}
.odoo-banner-btn img {
  height: 1em;
  width: 1em;
  margin-left: 0.5em;
}

/* Rotation pour PC - chevron pointe vers la gauche */
@media (min-width: 1025px) {
  .odoo-banner-btn img {
    transform: rotate(180deg);
  }
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
}
.odoo-section-text, .odoo-section-text * {
  font-family: "Cobe Heavy", "Inter", sans-serif;
}
.odoo-section-img {
  display: flex;
  justify-content: center;
}
.odoo-section-img img {
  max-width: 320px;
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
  border: 3px #5bc681 solid;
  margin-bottom: 12px;
}
.odoo-team-card .odoo-team-role {
  /* UNIQUE */
  color: #00cf0e;
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
  cursor: pointer;
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
  top: 41%;
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
  font-family: "Cobe Heavy", "Odoo Unicode Support Noto", sans-serif;
}
.odoo-section-line {
  display: block;
}
.odoo-team-card, .odoo-team-card p, .odoo-team-card h4, .odoo-team-role, .odoo-cta-card, .odoo-cta-card h2, .odoo-cta-card p {
  color: #111;
  font-family: "Cobe Heavy", "Inter", sans-serif;
}

.odoo-underline {
  text-decoration: underline;
  text-underline-offset: 4px;
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
.highlighted-word svg path {
  transform: scale(1.33, 0.8);
}
.nom-serge {
  font-size: 1.4em;
}

.nom-maxime {
  font-size: 1.4em;
}
.odoo-section-faq,
.odoo-section-faq * {
  font-family: 'Cobe Heavy', Inter, sans-serif !important;
}
.odoo-section-faq p {
  font-weight: 400;
  font-size: 1em;
  color: #463f3f;
  font-style: italic;
  font-family: 'Cobe Heavy', Inter, sans-serif !important;
  margin-top: 0.3em;
}
.odoo-section-faq summary {
  cursor: pointer;
}

  /* Thème sombre: titre "Questions récurrentes" en blanc */
  [data-theme="dark"] .odoo-section-faq .odoo-section-title {
    color: #ffffff !important;
  }

  /* Thème sombre: contenu FAQ en blanc */
  [data-theme="dark"] .odoo-faq,
  [data-theme="dark"] .odoo-faq details,
  [data-theme="dark"] .odoo-faq p,
  [data-theme="dark"] .odoo-faq summary {
    color: #ffffff !important;
  }
  
  /* Thème sombre: opacité 0.8 sur la vague de fond */
  [data-theme="dark"] .section-waves-bg {
    opacity: 0.8 !important;
  }
  /* --- Responsive Design --- */

  /* Rotation spécifique pour mobile pour que le chevron pointe vers la droite */
  
  /* Tablette élargi */
  @media (max-width: 1024px) {
    .odoo-banner-btn img {
      transform: rotate(180deg);
    }
  
    .odoo-banner-right {
      display: none;
    }
  
    .odoo-banner-inner {
      justify-content: center;
      text-align: center;
    }
  
    .odoo-banner-left {
      align-items: center;
      display: flex;
      flex-direction: column;
    }
  
    .odoo-banner-inner, .odoo-section-flex {
      padding: 0 24px;
      flex-direction: column;
    }
  
    .odoo-banner-title {
      font-size: 3rem;
    }
    
    .highlighted-word svg path {
      transform: scale(1.0, 0.7); /* plus petit et moins haut */
      stroke-width: 4;
    }
  
    .odoo-banner-desc {
      font-size: 1.1em;
    }
    
    .odoo-section {
      padding: 40px 24px;
    }
  
    .odoo-section-title {
      font-size: 2rem;
    }
    
    .odoo-section-title-left {
      text-align: center;
    }
  
    .planify-highlight-title {
      font-size: 2.8em;
    }
  
    .pcplanify-img {
      margin-top: 24px;
      max-width: 90vw;
    }
    
    .odoo-section-text-block {
      font-size: 1.1rem;
      text-align: center;
    }
  
    .odoo-section-team, .odoo-waves-content {
      margin-top: 15%;
    }
  
    .odoo-team-cards {
      flex-direction: column;
      gap: 32px;
    }
    .highlighted-word svg {
      transform: translateY(-0.1em); /* ajuste la valeur selon le rendu */
    }
    .odoo-banner-right img[alt="Décor fond"] {
      left: -38px !important;
    }
    .section-waves-bg {
      width: 180vw;         /* agrandit l'image */
      top: 40%;             /* descend l'image */
      left: 50%;
      transform: translateX(-50%); /* centre horizontalement */
    }
    .odoo-team-cards {
      flex-direction: column;
      gap: 32px;
      display: flex;
      align-items: center;
    }
  }
  
  /* Mobile */
  @media (max-width: 425px) {
    .odoo-banner-title {
      font-size: 2.3rem;
    }
  
    .highlighted-word svg path {
      transform: scale(0.77, 0.6); /* encore plus petit */
      stroke-width: 3;
    }
  
    .odoo-banner-desc {
      font-size: 1em;
    }
    
    .odoo-banner-btn {
      font-size: 1.2em;
      padding: 10px 24px;
    }
  
    .odoo-section-title {
      font-size: 1.6rem;
      word-wrap: break-word;
      overflow-wrap: break-word;
      max-width: 100%;
    }
  
    .planify-highlight-title {
      font-size: 2em;
    }
    
    .section-waves-bg {
      width: 589vw;
      top: -11%;
      left: 50%;
      transform: translateX(-50%);
    }
    .highlighted-word svg {
      transform: translateY(-0.1em); /* ajuste la valeur selon le rendu */
    }
    .odoo-banner-right img[alt="Décor fond"] {
      left: -38px !important;
    }
    .section-waves-bg {
      width: 593vw;
      top: 2%;
      left: 50%;
      transform: translateX(-50%);
    }
  }
  
  @media (min-width: 426px) and (max-width: 768px) {
    .section-waves-bg {
        width: 450vw;
        top: 3%;
        left: 50%;
        transform: translateX(-50%);
    }
  }
  @media (min-width: 520px) and (max-width: 768px) {
    .section-waves-bg{
        width: 300vw;
    }
  }
  
  @media (min-width: 769px) and (max-width: 1024px) {
    .section-waves-bg{
      width: 200vw;
      top: 4%;
      left: 50%;
      transform: translateX(-50%);
    }
  }
  
  @media (min-width: 1025px) and (max-width: 1440px) {
    .odoo-banner-inner {
      padding-left: 32px;
      padding-right: 32px;
      gap: 32px;
    }
    .odoo-banner-left {
      gap: 24px;
    }
    .odoo-banner-title {
      font-size: 2.2rem;
      margin-bottom: 16px;
    }
    .odoo-banner-desc {
      font-size: 1.2rem;
      margin-bottom: 18px;
    }
    .odoo-banner-btn {
      font-size: 1em;
      padding: 10px 24px;
    }
    .odoo-banner-right img {
      max-width: 90%;
      margin-left: 16px;
      margin-right: 16px;
    }
    .odoo-banner-title {
      font-size: 3.8em;
      margin-bottom: 16px;
    }
    .highlighted-word svg path {
      transform: scale(1.18, 0.8);
    }
    .odoo-banner-right img{
      max-width: 155%;
      margin-left: 16px;
      margin-right: 16px;
    }
    .float-bg {
      left: -80px;
      top: -54%;
      width: 237%;
    }
  }
  
  @media (min-width: 1025px) and (max-width: 1440px) {
      .section-waves-bg {
          display: block;
          position: absolute;
          left: -290px;
          width: 160vw;
          min-width: 100vw;
          max-width: none;
          height: auto;
          top: 37%;
          transform: translateY(-35%);
          z-index: -1;
          pointer-events: none;
      }
  }
  
  @media (min-width: 1025px) {
    .odoo-section-img img.pcplanify-img {
      height: 405px;
    }
    .pcplanify-img {
      width: 198% !important;
      height: 616px !important;
      object-fit: contain;
      margin-top: 0 !important;
    }
    .odoo-section-img {
      display: flex;
      align-items: center;
      min-height: 616px;
    }
    .odoo-section-title.odoo-section-title-left {
      font-size: 2.7rem !important;
    }
  }
  
  .odoo-section-text, .odoo-section-text * {
      font-family: "Cobe Heavy", "Inter", sans-serif;
      max-width: 780px;
  }
  
  .float-bg {
    position: absolute;
    left: 0;
    top: -50%;
    width: 150%;
    height: auto;
    z-index: 0;
    pointer-events: none;
  }
  
  @media (min-width: 1025px) and (max-width: 1440px) {
    .float-bg {
      left: -120px;   /* Par exemple, décale vers la gauche */
      top: -40%;      /* Ajuste la hauteur si besoin */
      width: 170%;    /* Ajuste la largeur si besoin */
    }
  }

  

  /* Thème sombre: mettre les titres clés en blanc */
  [data-theme="dark"] .odoo-banner-title,
  [data-theme="dark"] .planify-highlight-title,
  [data-theme="dark"] .odoo-section-title-left {
    color: #ffffff;
  }

  /* Thème sombre: titre "Notre équipe" (accueil) en blanc */
  [data-theme="dark"] .odoo-section-team .odoo-section-title {
    color: #ffffff !important;
  }

  /* Thème sombre: rôle en vert spécial dans les cartes équipe */
  [data-theme="dark"] .odoo-section-team .odoo-team-role {
    color: var(--darkreader-text-00cf0e, #48f953) !important;
  }

  /* Thème sombre: noms et descriptions de l'équipe en blanc */
  [data-theme="dark"] .odoo-team-card h4,
  [data-theme="dark"] .odoo-team-card p:not(.odoo-team-role) {
    color: #ffffff !important;
  }

  /* Styles pour la section Notifications (UNIQUE) */
  .odoo-section-notifications {
    background: #f9f9f9;
    padding: 64px 0;
    margin-top: 100px;
  }
  .notification-tutorial-buttons {
    display: flex;
    gap: 16px;
    margin-top: 24px;
    flex-wrap: wrap;
  }
  .tuto-btn {
    margin-top: 0;
    font-size: 1rem;
    padding: 10px 24px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .tuto-btn.android {
    background: #3ddc84;
    color: #fff;
    font-size: 1em;
  }
  .tuto-btn.android:hover {
    background: #32b56e;
  }
  .tuto-btn.ios {
    background: #000;
    color: #fff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .tuto-btn.ios:hover {
    background: #333;
  }
  .notification-warning-box {
    margin-top: 24px;
    background: #fff3cd;
    border: 1px solid #ffeeba;
    color: #856404;
    padding: 16px;
    border-radius: 12px;
    font-size: 0.9em;
    line-height: 1.5;
  }
  .notification-img {
    width: 100%;
    max-width: 320px;
    filter: drop-shadow(0 10px 20px rgba(0,0,0,0.1));
  }
  
  /* Modal Styles */
  .tuto-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    padding: 16px;
    overflow: hidden;
    overscroll-behavior: contain;
  }
  .tuto-modal {
    background: #fff;
    padding: 32px;
    border-radius: 24px;
    max-width: 500px;
    width: 100%;
    position: relative;
    box-shadow: 0 10px 40px rgba(0,0,0,0.2);
    font-family: 'Cobe Heavy', 'Inter', sans-serif;
    max-height: calc(100vh - 64px);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    overscroll-behavior: contain;
  }
  .tuto-modal-body {
    flex: 1 1 auto;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding: 0 4px 12px 0;
  }
  .close-modal-btn {
    position: absolute;
    top: 16px;
    right: 16px;
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
  }
  .close-img {
    width: 32px;
    height: 32px;
    display: block;
    filter: grayscale(0.5) brightness(0.95);
    transition: transform 0.25s, filter 0.25s;
  }
  .close-modal-btn:hover .close-img {
    transform: scale(1.18);
    filter: grayscale(0) brightness(1.1);
  }
  .tuto-modal h3 {
    margin-top: 0;
    font-size: 1.8rem;
    margin-bottom: 16px;
    color: #222;
  }
  .tuto-steps {
    padding-left: 24px;
    margin-bottom: 24px;
    line-height: 1.6;
    font-size: 1.1rem;
    color: #444;
  }
  .tuto-steps li {
    margin-bottom: 12px;
  }
  .tuto-conclusion {
    font-weight: bold;
    color: #3ddc84;
    text-align: center;
    margin: 0;
    font-size: 1.1rem;
  }
  .ios-warning {
    background: #f8d7da;
    color: #721c24;
    padding: 10px;
    border-radius: 8px;
    margin-bottom: 16px;
    text-align: center;
  }
  
  [data-theme="dark"] .odoo-section-notifications {
    background: #191919;
  }
  [data-theme="dark"] .tuto-modal {
    background: #222;
    color: #fff;
  }
  [data-theme="dark"] .tuto-modal h3 {
    color: #fff;
  }
  [data-theme="dark"] .tuto-steps {
    color: #ddd;
  }
  /* .close-modal-btn et .close-img gèrent eux-mêmes l'image, pas besoin de couleur de texte */
  [data-theme="dark"] .notification-warning-box {
    background: #2a2a2a;
    border-color: #444;
    color: #ffd700;
  }

  /* Responsive pour la nouvelle section */
  @media (max-width: 900px) {
    .odoo-section-notifications .odoo-section-flex {
      flex-direction: column-reverse;
      text-align: center;
    }
    .notification-tutorial-buttons {
      justify-content: center;
    }
    .odoo-section-title-left {
      text-align: center;
    }
    .odoo-section-notifications .odoo-section-text { max-width: 100%; }
    .odoo-section-notifications .odoo-section-title.odoo-section-title-left { width: 100%; }
    .notification-img {
      max-width: 180px;
      margin-bottom: 24px;
    }
  }

  /* Mobile: titres des tutos + style de scrollbar (aligné Leaderboard) */
  @media (max-width: 480px) {
    .tuto-modal { max-height: 80vh; }
    .tuto-modal .tuto-title.ios { font-size: 20px; margin-top: 20px; }
    .tuto-modal .tuto-title.android { font-size: 17px; margin-top: 30px; }
    .tuto-modal .tuto-conclusion { font-size: 0.9rem; }
    .notification-tutorial-buttons { margin-top: 0; }
    .tuto-modal-body { scrollbar-color: #cfcfcf transparent; scrollbar-width: thin; }
    .tuto-modal-body::-webkit-scrollbar { width: 10px; }
    .tuto-modal-body::-webkit-scrollbar-track { background: transparent; margin: 20px 0; border-radius: 999px; }
    .tuto-modal-body::-webkit-scrollbar-thumb { background: #cfcfcf; border-radius: 999px; }
    .tuto-modal-body::-webkit-scrollbar-button { display: none; width: 0; height: 0; }
  }

  .odoo-team-card .odoo-team-role {
    color: #00cf0e;
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
  cursor: pointer;
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
  top: 41%;
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
  font-family: "Cobe Heavy", "Odoo Unicode Support Noto", sans-serif;
}
.odoo-section-line {
  display: block;
}
.odoo-team-card, .odoo-team-card p, .odoo-team-card h4, .odoo-team-role, .odoo-cta-card, .odoo-cta-card h2, .odoo-cta-card p {
  color: #111;
  font-family: "Cobe Heavy", "Inter", sans-serif;
}

.odoo-underline {
  text-decoration: underline;
  text-underline-offset: 4px;
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
.highlighted-word svg path {
  transform: scale(1.33, 0.8);
}
.nom-serge {
  font-size: 1.4em;
}

.nom-maxime {
  font-size: 1.4em;
}
.odoo-section-faq,
.odoo-section-faq * {
  font-family: 'Cobe Heavy', Inter, sans-serif !important;
}
.odoo-section-faq p {
  font-weight: 400;
  font-size: 1em;
  color: #463f3f;
  font-style: italic;
  font-family: 'Cobe Heavy', Inter, sans-serif !important;
  margin-top: 0.3em;
}
.odoo-section-faq summary {
  cursor: pointer;
}

  /* --- Responsive Design --- */
  
  /* Rotation spécifique pour mobile pour que le chevron pointe vers la droite */
  
  /* Tablette élargi */
  @media (max-width: 1024px) {
    .odoo-banner-btn img {
      transform: rotate(180deg);
    }
  
    .odoo-banner-right {
      display: none;
    }
  
    .odoo-banner-inner {
      justify-content: center;
      text-align: center;
    }
  
    .odoo-banner-left {
      align-items: center;
      display: flex;
      flex-direction: column;
    }
  
    .odoo-banner-inner, .odoo-section-flex {
      padding: 0 24px;
      flex-direction: column;
    }
  
    .odoo-banner-title {
      font-size: 3rem;
    }
    
    .highlighted-word svg path {
      transform: scale(1.0, 0.7); /* plus petit et moins haut */
      stroke-width: 4;
    }
  
    .odoo-banner-desc {
      font-size: 1.1em;
    }
    
    .odoo-section {
      padding: 40px 24px;
    }
  
    .odoo-section-title {
      font-size: 2rem;
    }
    
    .odoo-section-title-left {
      text-align: center;
    }
  
    .planify-highlight-title {
      font-size: 2.8em;
    }
  
    .pcplanify-img {
      margin-top: 24px;
      max-width: 90vw;
    }
    
    .odoo-section-text-block {
      font-size: 1.1rem;
      text-align: center;
    }
  
    .odoo-section-team, .odoo-waves-content {
      margin-top: 15%;
    }
  
    .odoo-team-cards {
      flex-direction: column;
      gap: 32px;
    }
    .highlighted-word svg {
      transform: translateY(-0.1em); /* ajuste la valeur selon le rendu */
    }
    .odoo-banner-right img[alt="Décor fond"] {
      left: -38px !important;
    }
    .section-waves-bg {
      width: 180vw;         /* agrandit l'image */
      top: 40%;             /* descend l'image */
      left: 50%;
      transform: translateX(-50%); /* centre horizontalement */
    }
    .odoo-team-cards {
      flex-direction: column;
      gap: 32px;
      display: flex;
      align-items: center;
    }
  }
  
  /* Mobile */
  @media (max-width: 425px) {
    .odoo-banner-title {
      font-size: 2.3rem;
    }
  
    .highlighted-word svg path {
      transform: scale(0.77, 0.6); /* encore plus petit */
      stroke-width: 3;
    }
  
    .odoo-banner-desc {
      font-size: 1em;
    }
    
    .odoo-banner-btn {
      font-size: 1.2em;
      padding: 10px 24px;
    }
  
    .odoo-section-title {
      font-size: 1.6rem;
    }
  
    .planify-highlight-title {
      font-size: 2em;
    }
    
    .section-waves-bg {
      width: 589vw;
      top: -11%;
      left: 50%;
      transform: translateX(-50%);
    }
    .highlighted-word svg {
      transform: translateY(-0.1em); /* ajuste la valeur selon le rendu */
    }
    .odoo-banner-right img[alt="Décor fond"] {
      left: -38px !important;
    }
    .section-waves-bg {
      width: 593vw;
      top: 2%;
      left: 50%;
      transform: translateX(-50%);
    }
  }
  
  @media (min-width: 426px) and (max-width: 768px) {
    .section-waves-bg {
        width: 450vw;
        top: 3%;
        left: 50%;
        transform: translateX(-50%);
    }
  }
  @media (min-width: 520px) and (max-width: 768px) {
    .section-waves-bg{
        width: 300vw;
    }
  }
  
  @media (min-width: 769px) and (max-width: 1024px) {
    .section-waves-bg{
      width: 200vw;
      top: 4%;
      left: 50%;
      transform: translateX(-50%);
    }
  }
  
  @media (min-width: 1025px) and (max-width: 1440px) {
    .odoo-banner-inner {
      padding-left: 32px;
      padding-right: 32px;
      gap: 32px;
    }
    .odoo-banner-left {
      gap: 24px;
    }
    .odoo-banner-title {
      font-size: 2.2rem;
      margin-bottom: 16px;
    }
    .odoo-banner-desc {
      font-size: 1.2rem;
      margin-bottom: 18px;
    }
    .odoo-banner-btn {
      font-size: 1em;
      padding: 10px 24px;
    }
    .odoo-banner-right img {
      max-width: 90%;
      margin-left: 16px;
      margin-right: 16px;
    }
    .odoo-banner-title {
      font-size: 3.8em;
      margin-bottom: 16px;
    }
    .highlighted-word svg path {
      transform: scale(1.18, 0.8);
    }
    .odoo-banner-right img{
      max-width: 155%;
      margin-left: 16px;
      margin-right: 16px;
    }
    .float-bg {
      left: -80px;
      top: -54%;
      width: 237%;
    }
  }
  
  @media (min-width: 1025px) and (max-width: 1440px) {
      .section-waves-bg {
          display: block;
          position: absolute;
          left: -290px;
          width: 160vw;
          min-width: 100vw;
          max-width: none;
          height: auto;
          top: 37%;
          transform: translateY(-35%);
          z-index: -1;
          pointer-events: none;
      }
  }
  
  @media (min-width: 1025px) {
    .odoo-section-img img.pcplanify-img {
      height: 405px;
    }
    .pcplanify-img {
      width: 198% !important;
      height: 616px !important;
      object-fit: contain;
      margin-top: 0 !important;
    }
    .odoo-section-img {
      display: flex;
      align-items: center;
      min-height: 616px;
    }
    .odoo-section-title.odoo-section-title-left {
      font-size: 2.7rem !important;
    }
  }
  
  .odoo-section-text, .odoo-section-text * {
      font-family: "Cobe Heavy", "Inter", sans-serif;
      max-width: 700px;
  }
  
  .float-bg {
    position: absolute;
    left: 0;
    top: -50%;
    width: 150%;
    height: auto;
    z-index: 0;
    pointer-events: none;
  }
  
  @media (min-width: 1025px) and (max-width: 1440px) {
    .float-bg {
      left: -120px;   /* Par exemple, décale vers la gauche */
      top: -40%;      /* Ajuste la hauteur si besoin */
      width: 170%;    /* Ajuste la largeur si besoin */
    }
  }
  

  
  /* Thème sombre: mettre les titres clés en blanc */
  [data-theme="dark"] .odoo-banner-title,
  [data-theme="dark"] .planify-highlight-title,
  [data-theme="dark"] .odoo-section-title-left {
  color: #ffffff;
  }

  </style>
