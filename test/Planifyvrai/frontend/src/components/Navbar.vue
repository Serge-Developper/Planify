<template>
  <header class="odoo-navbar">
    <div class="odoo-navbar-inner">
      <div class="odoo-navbar-top">
        <img src="@/assets/img/logo_Planify.png" alt="Planify logo" class="odoo-logo" @click="goHome" style="cursor:pointer;" />
        <button class="burger-btn" @click="showMobileMenu = true" v-if="isMobile && !showMobileMenu">
          <span></span><span></span><span></span>
        </button>
      </div>
      <div class="odoo-navbar-bottom" v-if="!isMobile || !showMobileMenu">
        <nav class="odoo-menu">
          <router-link class="odoo-menu-link" to="/" exact-active-class="active">Accueil</router-link>
          <router-link class="odoo-menu-link" to="/devoir" exact-active-class="active">Devoir</router-link>
          <router-link class="odoo-menu-link" to="/about" exact-active-class="active">À propos</router-link>
          <router-link class="odoo-menu-link" to="/contact" exact-active-class="active">Contact</router-link>
        </nav>
        <div class="odoo-navbar-actions">
          <input type="text" placeholder="Rechercher..." class="odoo-search" />
          <button v-if="!isLoggedIn" class="odoo-login-btn" @click="router.push('/login')">Se connecter</button>
          <button v-else class="odoo-login-btn" @click="logout">Déconnexion</button>
        </div>
      </div>
      <transition name="slide-fade">
        <div v-if="isMobile && showMobileMenu" class="mobile-menu">
          <button class="close-btn" @click="showMobileMenu = false">✕</button>
          <nav class="mobile-menu-links">
            <a class="odoo-menu-link" @click="goHome">Accueil</a>
            <a class="odoo-menu-link" @click="goToEmploi">Devoir</a>
            <router-link class="odoo-menu-link" to="/about" exact-active-class="active">À propos</router-link>
            <router-link class="odoo-menu-link" to="/contact" exact-active-class="active">Contact</router-link>
            <button v-if="!isLoggedIn" class="odoo-login-btn" @click="router.push('/login')">Se connecter</button>
            <button v-else class="odoo-login-btn" @click="logout">Déconnexion</button>
          </nav>
        </div>
      </transition>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const isLoggedIn = computed(() => !!localStorage.getItem('user'))
const showMobileMenu = ref(false)
const isMobile = ref(false)

function logout() {
  localStorage.removeItem('user')
  localStorage.removeItem('token')
  router.push('/login')
}

function goToEmploi() {
  router.push('/devoir')
}

function goHome() {
  router.push('/')
}

function handleResize() {
  isMobile.value = window.innerWidth <= 900;
  if (!isMobile.value) showMobileMenu.value = false;
}

onMounted(() => {
  handleResize();
  window.addEventListener('resize', handleResize);
});
onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
body, html {
  overflow-x: hidden;
}
.odoo-navbar {
  width: 100%;
  background: #fff;
  box-shadow: 0 2px 12px #0001;
  padding: 0;
  position: relative;
  z-index: 10;
}
.odoo-navbar::after {
  content: '';
  display: block;
  position: absolute;
  left: 0;
  right: 0;
  height: 15px;
  background: #39ff7a;
  filter: blur(8px) brightness(1.2);
  opacity: 0.9;
  z-index: -1;
}
.odoo-navbar-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 18px 32px 18px 32px;
}
.odoo-navbar-top {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
.odoo-logo {
  height: 110px;
  margin-bottom: 18px;
}
.odoo-navbar-bottom {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 32px;
}
.odoo-menu {
  display: flex;
  gap: 36px;
  justify-content: center;
  flex: 1;
}
.odoo-menu-link {
  font-family: 'Cobe-HeavyItalic', 'Odoo Unicode Support Noto', sans-serif;
  font-style: italic;
  font-weight: 700;
  font-size: 1.15em;
  color: #555;
  background: none;
  border: none;
  border-radius: 12px;
  transition: background 0.18s, color 0.18s, box-shadow 0.18s;
  box-shadow: none;
  outline: none;
  display: flex;
  align-items: center;
  justify-content: center;
}
.odoo-menu-link.active, .odoo-menu-link.router-link-exact-active {
  background: #6EFF78;
  color: #000000;
  box-shadow: 0 2px 8px #6eff7833;
  font-weight: 700;
  font-style: italic;
  border-radius: 12px;
  padding: 10px 24px;
}
.odoo-menu-link:not(.active):not(.router-link-exact-active):hover {
  color: #222;
  background: #e9ffe9;
}
.odoo-navbar-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-left: 0;
}
.odoo-search {
  border-radius: 12px;
  border: none;
  background: #fff;
  padding: 10px 24px;
  font-size: 1.1em;
  box-shadow: 0 2px 8px #0001;
  font-family: 'Cobe Heavy', Inter, sans-serif;
  font-weight: 900;
}
.odoo-login-btn {
  border: none;
  border-radius: 999px;
  background: #6366f1;
  color: #fff;
  font-weight: bold;
  font-size: 1.1em;
  padding: 10px 32px;
  box-shadow: 0 2px 8px #0001;
  transition: background 0.2s;
}
.odoo-login-btn:hover {
  background: #4f46e5;
}
@media (max-width: 900px) {
  .odoo-navbar-inner {
    flex-direction: column;
    gap: 12px;
    padding: 12px 8px 0 8px;
  }
  .odoo-navbar-bottom {
    display: none !important;
  }
  .odoo-logo {
    height: 44px;
    max-width: 90vw;
    margin-bottom: 8px;
    object-fit: contain;
  }
}
/* Menu burger */
.burger-btn {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 48px;
  height: 48px;
  background: none;
  border: none;
  cursor: pointer;
  gap: 6px;
  margin-left: auto;
  z-index: 1200;
}
.burger-btn span {
  display: block;
  width: 32px;
  height: 4px;
  background: #222;
  border-radius: 2px;
  transition: all 0.3s;
}
.mobile-menu {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(255,255,255,0.98);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding-top: 60px;
  overflow-x: hidden;
  padding-left: 16px;
  padding-right: 16px;
}
.close-btn {
  position: absolute;
  top: 24px;
  right: 32px;
  background: none;
  border: none;
  font-size: 2.5em;
  color: #222;
  cursor: pointer;
  z-index: 1100;
  padding: 0;
}
.mobile-menu-links {
  display: flex;
  flex-direction: column;
  gap: 32px;
  align-items: center;
  margin-top: 40px;
  width: 100%;
}
.mobile-menu-links .odoo-menu-link, .mobile-menu-links .odoo-login-btn {
  font-size: 1.5em;
  min-width: 200px;
  min-height: 56px;
  justify-content: center;
  width: 100%;
  max-width: 320px;
  margin: 0 auto;
}
.mobile-menu-links .odoo-search {
  width: 100%;
  max-width: 320px;
  margin: 0 auto 16px auto;
}
.mobile-menu-links .odoo-login-btn {
  width: 100%;
  max-width: 320px;
  margin: 0 auto;
}
/* Animation slide-fade */
.slide-fade-enter-active {
  transition: all 0.4s cubic-bezier(.25,.8,.25,1);
}
.slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(.25,.8,.25,1);
}
.slide-fade-enter-from {
  opacity: 0;
  transform: translateY(-40px);
}
.slide-fade-enter-to {
  opacity: 1;
  transform: translateY(0);
}
.slide-fade-leave-from {
  opacity: 1;
  transform: translateY(0);
}
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-40px);
}
@media (max-width: 900px) {
  .mobile-menu-links .odoo-menu-link, .mobile-menu-links .odoo-login-btn {
    font-size: 1.1em;
    min-width: 140px;
    min-height: 44px;
    padding: 10px 0;
  }
  .mobile-menu-links .odoo-search {
    font-size: 1em;
    padding: 8px 12px;
  }
  .mobile-menu {
    padding-top: 32px;
  }
}
</style> 