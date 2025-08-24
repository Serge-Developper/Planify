<template>
  <footer id="bottom" class="planify-footer">
    <div class="footer-bg">
      <img src="@/assets/grid.svg" alt="" class="footer-grid-bg" />
    </div>
    <div class="container">
      <div class="footer-row">
        <div class="footer-col">
          <h5>Liens utiles</h5>
          <ul>
            <li><a href="/">Accueil</a></li>
            <li><a href="/devoir">Devoir</a></li>
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
            <li><img src="@/assets/chat.svg" alt="Chat" class="footer-icon-svg" /> <a href="/contact">Contactez-nous</a></li>
            <li><img src="@/assets/email.svg" alt="Email" class="footer-icon-svg" /> <a href="mailto:planifymmi@gmail.com">planifymmi@gmail.com</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <span>Copyright © Planify</span>
        <span class="footer-powered">Généré par Planify - Plateforme d'organisation scolaire</span>
      </div>
    </div>
  </footer>
</template>

<style scoped>
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
  /* Pour faire descendre l'image, modifie la valeur de 'bottom' ci-dessous : */
  bottom: 40px; /* ← Ajuste cette valeur pour descendre ou remonter l'image */
  z-index: 0;
  pointer-events: none;
  /* Pour agrandir l'image, modifie la valeur de scale ci-dessous : */
  transform: scale(1); /* ← Mets 1.2, 1.5, 2, etc. selon le zoom souhaité */
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
  flex: 2 1 380px;
  min-width: 320px;
}
.footer-col h5 {
  font-size: 1.6em;
  margin-bottom: 16px;
  font-weight: bold;
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
  color: #6EFF78;
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
  .footer-row {
    flex-direction: column;
    gap: 0;
  }
  .footer-col {
    margin-bottom: 24px;
  }
}
</style> 