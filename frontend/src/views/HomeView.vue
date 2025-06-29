<template>
  <section class="odoo-banner">
    <div class="odoo-banner-inner">
      <div class="odoo-banner-left">
        <h1 class="odoo-banner-title">Simplifiez votre <span class="odoo-banner-highlight">réussite</span>.</h1>
        <p class="odoo-banner-desc">Planify, l'outil d'organisation scolaire pour les étudiants MMI : gérez vos devoirs, projets et planning de promo simplement et efficacement.</p>
        <button class="odoo-banner-btn">Commencer</button>
      </div>
      <div class="odoo-banner-right">
        <!-- Illustration retirée, bloc vide ou couleur -->
      </div>
    </div>
  </section>
  <section class="odoo-section odoo-section-green">
    <h2 class="odoo-section-title">Planify compte sur <u>vous</u>.</h2>
  </section>
  <section class="odoo-section odoo-section-white">
    <div class="odoo-section-flex">
      <div class="odoo-section-text">
        <h2 class="odoo-section-title">Complètement gratuit.</h2>
        <p>Planify est une plateforme <b>100 % gratuite</b>, conçue spécialement pour les étudiants MMI. Sans abonnement ni frais cachés, Planify vous permet <b>d'organiser</b> vos <b>devoirs</b>, <b>projets</b> et <b>plannings</b> de promo en toute <b>simplicité</b>, sans aucune contrainte financière. Profitez d'un outil complet, <b>accessible à tous</b>, pour mieux gérer votre année scolaire et collaborer efficacement avec vos camarades.</p>
      </div>
      <div class="odoo-section-img">
        <!-- Illustration retirée, bloc vide ou couleur -->
      </div>
    </div>
  </section>
  <section class="odoo-section odoo-section-team">
    <h2 class="odoo-section-title">Notre équipe</h2>
    <div class="odoo-team-cards">
      <div class="odoo-team-card">
        <img src="@/assets/img/2PlanifyByMaxsussFichier 16@3x.png" alt="Serge TOVMASSIN" class="odoo-team-img" />
        <h4>Serge TOVMASSIN</h4>
        <p class="odoo-team-role">Chief Executive Officer</p>
        <p>Fondateur et visionnaire en chef, Serge est le moteur de l'entreprise. Il aime rester occupé en participant au développement des stratégies logicielles, marketing et d'expérience client.</p>
      </div>
      <div class="odoo-team-card">
        <img src="@/assets/img/2PlanifyByMaxsussFichier 17@3x.png" alt="Maxime TEBANI" class="odoo-team-img" />
        <h4>Maxime TEBANI</h4>
        <p class="odoo-team-role">Directeur commercial</p>
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
        <summary>Comment créer et partager un planning avec ma promo ?</summary>
        <p>Créer un planning sur Planify est simple et rapide. Une fois connecté, vous pouvez ajouter vos devoirs, projets, et événements, puis inviter vos camarades à rejoindre votre promo pour collaborer et rester tous synchronisés.</p>
      </details>
      <details>
        <summary>Puis-je accéder à Planify depuis mon téléphone ou ma tablette ?</summary>
        <p>Absolument ! Planify est conçu pour être accessible depuis n'importe quel appareil connecté, que ce soit un ordinateur, un smartphone ou une tablette, afin que vous puissiez gérer votre organisation où que vous soyez.</p>
      </details>
    </div>
  </section>
  <section class="odoo-section odoo-section-cta">
    <div class="odoo-cta-card">
      <h2>Plus de 50 000 entreprises utilisent Planify pour développer leurs activités.</h2>
      <p>Rejoignez-nous et passez à la vitesse supérieure.</p>
      <button class="odoo-cta-btn">Contactez-nous</button>
    </div>
  </section>
</template>

<script setup lang="ts">
// Pas de logique JS spécifique pour l'accueil
</script>

<style scoped>
.odoo-banner {
  background: rgb(255, 255, 255);
  padding: 48px 0 32px 0;
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
}
.odoo-banner-title {
  font-size: 3em;
  font-weight: bold;
  color: #222;
  margin-bottom: 18px;
}
.odoo-banner-highlight {
  color: #5fffa1;
  background: #fff;
  border-radius: 12px;
  padding: 0 12px;
}
.odoo-banner-desc {
  font-size: 1.3em;
  color: #444;
  margin-bottom: 24px;
}
.odoo-banner-btn {
  background: #6366f1;
  color: #fff;
  font-weight: bold;
  font-size: 1.1em;
  border: none;
  border-radius: 999px;
  padding: 12px 36px;
  box-shadow: 0 2px 8px #0001;
  transition: background 0.2s;
}
.odoo-banner-btn:hover {
  background: #4f46e5;
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
  padding: 56px 0 32px 0;
}
.odoo-section-green {
  background: linear-gradient(90deg, #a8ffce 0%, #5fffa1 100%);
}
.odoo-section-white {
  background: #fff;
}
.odoo-section-title {
  font-size: 2.2em;
  font-weight: bold;
  color: #222;
  text-align: center;
  margin-bottom: 18px;
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
  font-size: 1.2em;
  color: #444;
}
.odoo-section-img {
  flex: 1;
  display: flex;
  justify-content: center;
}
.odoo-section-img img {
  max-width: 320px;
  border-radius: 24px;
  box-shadow: 0 2px 16px #0002;
}
.odoo-section-team {
  background: #f3f3f3;
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
.odoo-team-role {
  color: #6366f1;
  font-weight: bold;
  margin-bottom: 8px;
}
.odoo-section-faq {
  background: #fff;
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
  background: #fff;
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
@media (max-width: 900px) {
  .odoo-banner-inner, .odoo-section-flex, .odoo-team-cards {
    flex-direction: column;
    gap: 24px;
    align-items: stretch;
  }
  .odoo-banner-img, .odoo-section-img img {
    max-width: 90vw;
  }
}
.odoo-team-card, .odoo-team-card p, .odoo-team-card h4, .odoo-team-role, .odoo-cta-card, .odoo-cta-card h2, .odoo-cta-card p {
  color: #111;
}
</style>
