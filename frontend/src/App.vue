<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import Navbar from './components/Navbar.vue'
const route = useRoute();

function getBgClass() {
  if (route.path === '/') return 'bg-accueil';
  if (route.path.startsWith('/emploi') || route.path.startsWith('/liste')) return 'bg-gris';
  return 'bg-accueil'; // fallback
}
</script>

<template>
  <div :class="['app-bg', getBgClass()]">
    <Navbar />
    <RouterView />
    <footer class="footer-bar-liste">
      <div class="footer-content-liste">
        <div class="footer-links-liste">
          <a href="#">Accueil</a> ·
          <a href="#">À propos de nous</a> ·
          <a href="#">Contactez-nous</a>
        </div>
        <div class="footer-contact-liste">
          <span>PLANIFYMMI@GMAIL.COM</span>
        </div>
        <div class="footer-legal-liste">
          VILLERS-LES-NANCY (54578) · MEURTHE-ET-MOSELLE (54) · LORRAINE · GRAND EST · FRANCE<br />
          COPYRIGHT © PLANIFY (2025 PLANIFY ALL RIGHTS)
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.app-bg {
  min-height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
}
.bg-accueil {
  background: linear-gradient(90deg, #a8ffce 0%, #faffd1 100%);
}
.bg-gris {
  background: #23272a;
}
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
.footer-bar-liste {
  background: linear-gradient(90deg, rgba(110, 255, 121, 255) 50%, rgba(110, 255, 226, 255) 100%);
  padding: 32px 0 16px 0;
  text-align: center;
  color: #fff;
  font-weight: bold;
  font-size: 1.1em;
  box-shadow: 0 -2px 12px #0001;
  margin-top: auto;
}
.footer-content-liste {
  max-width: 900px;
  margin: 0 auto;
}
.footer-links-liste {
  margin-bottom: 8px;
  color: #222;
  font-size: 1.1em;
}
.footer-links-liste a {
  color: #222;
  text-decoration: none;
  margin: 0 6px;
  font-weight: bold;
}
.footer-contact-liste {
  font-size: 1.2em;
  margin-bottom: 12px;
}
.footer-legal-liste {
  font-size: 1em;
  color: #e0ffe6;
  margin-bottom: 8px;
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
