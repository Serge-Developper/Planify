<template>
  <footer id="bottom" class="planify-footer">
    <div class="footer-bg">
      <img :src="grid" alt="" class="footer-grid-bg" loading="eager" fetchpriority="low" />
    </div>
    <div class="container">
      <div class="footer-row">
        <div class="footer-col">
          <h5>Liens utiles</h5>
          <ul>
            <li><a href="/">Accueil</a></li>
            <li><a href="/devoirs">Devoirs</a></li>
            <li><a href="/about">À propos</a></li>
            <li><a href="/contact">Contactez-nous</a></li>
          </ul>
        </div>
        <div class="footer-col-center">
          <h5>À propos de nous</h5>
          <p>
            Planify, l’outil d’organisation scolaire pour les étudiants MMI : gérez vos devoirs, projets et planning de promo simplement et efficacement.
          </p>
        </div>
        <div class="footer-col">
          <h5>Rejoignez-nous</h5>
          <ul>
            <li><img :src="chat" alt="Chat" class="footer-icon-svg" /> <a href="/contact">Contactez-nous</a></li>
            <li style="display: flex; align-items: center;"><img :src="email" alt="Email" class="footer-icon-svg"/> <a href="mailto:planifymmi@gmail.com">planifymmi@gmail.com</a></li>
            <li style="display: flex; align-items: center;">
              <img src="@/assets/img/youtube_black_logo_icon.svg" alt="YouTube" class="footer-icon-svg" />
              <a href="https://www.youtube.com/@planifymmi" target="_blank" rel="noopener noreferrer" class="youtube-link">
                Planify
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" class="external-link-arrow">
                  <path d="M6 2L13 2L13 9M13 2L2 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <span>Copyright © Planify</span>
        <span class="footer-powered">Géré par Planify - Plateforme d'organisation scolaire</span>
      </div>
    </div>
  </footer>
</template>

<script setup>
import grid from '@/assets/grid.svg'
import chat from '@/assets/chat.svg'
import email from '@/assets/email.svg'
import { useTheme } from '@/composables/useTheme'
import { useAutoDark } from '@/composables/useAutoDark'

const { isDark, toggleDark, setThemePreference } = useTheme();
const { enabled: autoDarkEnabled, applyAutoDark, disableAutoDark, followOS } = useAutoDark();

function applyThemeAttr(v) {
  try {
    const html = document.documentElement;
    if (html && html.setAttribute) {
      html.setAttribute('data-theme', v ? 'dark' : 'light');
    }
    try { localStorage.setItem('theme', v ? 'dark' : 'light') } catch {}
  } catch {}
}

function toggleDarkModeAuto() {
  try {
    if (autoDarkEnabled.value) {
      disableAutoDark();
      setThemePreference('light');
    } else {
      applyAutoDark();
      setThemePreference('auto');
      followOS();
      const osIsDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyThemeAttr(osIsDark);
    }
  } catch {}
}
</script>

<style>
.planify-footer {
  position: relative;
  background: #f3f3f3;
  color: #222;
  font-family: 'Cobe Heavy';
  overflow: hidden;
  margin-top: 48px;
  min-height: 320px;
}
.footer-bg {
  position: absolute;
  left: 0; right: 0; bottom: 0; top: 0;
  width: 100%; height: 100%;
  z-index: 0;
  pointer-events: none;
}
.footer-grid-bg {
    width: 100%;
    height: 100%;
    object-fit: cover;
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0px;
    z-index: 0;
    pointer-events: none;
    transform: scale(1);
    /* Précharger l'image pour éviter CLS */
    content-visibility: auto;
    contain-intrinsic-size: 100% 320px;
}
.container {
  position: relative;
  z-index: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 24px 0 24px;
}
.footer-row {
  display: flex;
  flex-wrap: wrap;
  gap: 32px;
  justify-content: space-between;
}
.footer-col {
  flex: 1 1 180px;
  min-width: 140px;
  margin-bottom: 32px;
}
.footer-col-center {
  flex: 0 2 700px;
  min-width: 320px;
}
.footer-col h5 {
  font-size: 1.6em;
  margin-bottom: 16px;
  font-family: 'Cobe Heavy', 'Inter', sans-serif;
}
.footer-col-center h5 {
  font-size: 1.6em;
}
.footer-col ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
.footer-col ul li {
  margin-bottom: 8px;
}
.footer-col ul li a {
  color: #222;
  text-decoration: none;
  transition: color 0.2s;
}
.footer-col ul li a:hover {
  color: #35cd40;
}
.footer-col p {
  margin: 0;
  font-size: 1em;
  color: #222;
  font-weight: 400;
}
.footer-social {
  margin-top: 16px;
}
.footer-social a {
  display: inline-block;
  margin-right: 12px;
  color: #222;
  font-size: 1.3em;
  background: #fff;
  border-radius: 50%;
  width: 36px; height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px #0001;
  transition: background 0.2s, color 0.2s;
}
.footer-social a:hover {
  background: #6EFF78;
  color: #fff;
}
.footer-bottom {
  border-top: 1px solid #000000;
  margin-top: 24px;
  padding: 16px 0;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  font-size: 0.95em;
  color: #888;
}
.footer-powered {
  font-size: 0.95em;
  color: #888;
}
.footer-icon-svg {
  width: 1.2em;
  height: 1.2em;
  vertical-align: middle;
  margin-right: 0.4em;
  margin-bottom: 0.1em;
}
@media (max-width: 900px) {
  .footer-grid-bg {
    transform: scaleX(1) scaleY(0.5) !important;
    bottom: -150px !important;
    position: absolute !important;
  }
  .footer-col-center p {
    font-size: 1em;   /* Taille réduite pour tablette */
    max-width: 350px;
  }
}
@media (max-width: 425px) {
  .planify-footer {
    min-height: auto; /* Hauteur automatique sur mobile */
    padding-bottom: 20px; /* Espace en bas */
  }
  .footer-grid-bg {
    transform: scaleX(1) scaleY(0.3) !important;
    bottom: -250px !important;
    position: absolute !important;
  }
  .footer-col-center p {
    font-size: 1em;   /* Encore plus petit pour mobile */
    max-width: 90vw;
  }
  .container {
    padding: 20px 16px 0 16px; /* Padding réduit sur mobile */
  }
  .footer-row {
    gap: 20px; /* Espacement réduit */
  }
}

/* Styles pour le lien YouTube dans le footer */
.footer-col .youtube-link {
  color: #222;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 3px;
  transition: color 0.2s;
}

.footer-col .youtube-link:hover {
  color: #35cd40;
}

.footer-col .external-link-arrow {
  transition: transform 0.2s;
}

.footer-col .youtube-link:hover .external-link-arrow {
  transform: translate(2px, -2px);
}

@media (min-width: 792px) and (max-width: 900px) {
  .footer-grid-bg {
    transform: scaleX(1) scaleY(0.5) !important;
    bottom: -85px !important;
    position: absolute !important;
  }
}
.footer-theme-controls {
  display: flex;
  gap: 12px;
  align-items: center;
}

.theme-toggle-footer {
  background: transparent;
  border: 1px solid #35cd40;
  color: #35cd40;
  border-radius: 12px;
  padding: 6px 10px;
  cursor: pointer;
  font-family: inherit;
}

.theme-toggle-footer:hover {
  background: #6EFF78;
  color: #fff;
}

/* Hover vert en thème sombre pour les éléments cliquables du footer */
[data-theme="dark"] .planify-footer a:hover,
[data-theme="dark"] .planify-footer button:hover,
[data-theme="dark"] .planify-footer .youtube-link:hover {
  color: #35cd40 !important;
}

[data-theme="dark"] .planify-footer .footer-social a:hover {
  background: #6EFF78 !important;
  color: #fff !important;
}

/* Thème sombre: icônes SVG du footer en blanc */
[data-theme="dark"] .planify-footer .footer-icon-svg {
  filter: brightness(0) invert(1) !important;
}
[data-theme="dark"] .planify-footer .external-link-arrow {
  color: #ffffff !important;
  stroke: #ffffff !important; /* fallback si currentColor n’est pas pris */
}

/* Thème sombre: opacité 0.4 sur l’image de fond du footer */
[data-theme="dark"] .footer-grid-bg {
  opacity: 0.4 !important;
}

/* En mode sombre, garder les boutons lisibles et alignés avec votre thème */
[data-theme="dark"] .planify-footer .theme-toggle-footer {
  color: #fff;
  border-color: #6EFF78;
}
</style>