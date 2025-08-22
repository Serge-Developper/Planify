<template>
  <header class="odoo-navbar">
    <div class="odoo-navbar-inner">
      <div class="odoo-navbar-top">
        <img src="@/assets/img/logo_Planify.png" alt="Planify logo" class="odoo-logo" @click="goHome" style="cursor:pointer;" />
        <button class="burger-btn" @click="showMobileMenu = true" v-if="isMobile && !showMobileMenu">
          <span></span><span></span><span></span>
        </button>
      </div>
      <div :class="['odoo-navbar-bottom', isLoggedIn ? 'navbar-logged' : 'navbar-guest']" v-if="!isMobile || !showMobileMenu">
        <nav class="odoo-menu">
          <router-link class="odoo-menu-link" to="/" exact-active-class="active">Accueil</router-link>
          <router-link class="odoo-menu-link" to="/devoirs" exact-active-class="active">Devoirs</router-link>
          <router-link class="odoo-menu-link" to="/about" exact-active-class="active">À propos</router-link>
          <router-link class="odoo-menu-link" to="/contact" exact-active-class="active">Contact</router-link>
          <button v-if="isAdmin" class="odoo-menu-link odoo-admin-btn" @click="goAdmin">Admin Dashboard</button>
        </nav>
        <div class="odoo-navbar-actions">
          <button v-if="!isLoggedIn" class="odoo-login-btn" @click="openLogin">Se connecter</button>
          <div v-else class="user-account-wrapper" style="position:relative;">
            <button class="account-btn" @click="handleDropdown">
              <img :src="accountIcon" alt="Compte" style="width:48px;height:48px;" />
            </button>
            <div v-if="showUserDropdown" class="user-dropdown">
              <button class="dropdown-item" @click="handleProfile">Profil</button>
              <button class="dropdown-item" @click="logout">Déconnexion</button>
            </div>
          </div>
        </div>
      </div>
      <transition name="slide-fade">
        <div v-if="isMobile && showMobileMenu" class="mobile-menu">
          <button class="close-btn" @click="showMobileMenu = false">✕</button>
          <nav class="mobile-menu-links">
            <a class="odoo-menu-link" @click="handleAccueilMobile">Accueil</a>
            <a class="odoo-menu-link" @click="handleDevoirMobile">Devoirs</a>
            <a class="odoo-menu-link" @click="handleAboutMobile">À propos</a>
            <a class="odoo-menu-link" @click="handleContactMobile">Contact</a>
            <button v-if="isAdmin" class="odoo-menu-link odoo-admin-btn" @click="handleAdminMobile">Admin Dashboard</button>
            <button v-if="!isLoggedIn" class="odoo-login-btn" @click="openLogin">Se connecter</button>
            <div v-else class="user-account-wrapper" style="position:relative;">
              <button class="account-btn" @click="handleDropdown">
                <img :src="accountIcon" alt="Compte" style="width:48px;height:48px;" />
              </button>
              <div v-if="showUserDropdown" class="user-dropdown">
                <button class="dropdown-item" @click="handleProfile">Profil</button>
                <button class="dropdown-item" @click="logout">Déconnexion</button>
              </div>
            </div>
          </nav>
        </div>
      </transition>
    </div>
    <LoginPopup v-if="showLoginPopup" @close="showLoginPopup = false" @login-success="handleLoginSuccess" />
    <div v-if="showProfilePopup" class="profile-popup-overlay" @click.self="closeProfilePopup">
      <div class="profile-popup">
        <button class="close-btn" @click="closeProfilePopup">✕</button>
        <h2>Profil</h2>
        <div class="profile-info">
          <div><strong>Nom d'utilisateur :</strong> {{ user?.username || user?.name || 'Utilisateur' }}</div>
          <div><strong>Rôle :</strong> {{ user?.role ? afficherRole(user.role) : 'Non défini' }}</div>
          <div><strong>Année :</strong> {{ user?.year ? afficherAnnee(user.year) : 'Non définie' }}</div>
          <div><strong>Groupe :</strong> {{ user?.groupe || 'Non défini' }}</div>
        </div>
        <button class="logout-btn" @click="logout">Déconnexion</button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import LoginPopup from './LoginPopup.vue'
import accountIcon from '@/assets/accounttt.svg'
import eyeOpen from '@/assets/eyeopen.svg'
import eyeClosed from '@/assets/eyeclosed.svg'

const auth = useAuthStore();
const router = useRouter()
const showMobileMenu = ref(false)
const isMobile = ref(false)
const showLoginPopup = ref(false)
const showUserDropdown = ref(false)
const showProfilePopup = ref(false)
const showPassword = ref(false)

const user = computed(() => auth.user)
const isLoggedIn = computed(() => auth.isLoggedIn)
const isAdmin = computed(() => auth.isAdmin)

const passwordValue = ref('');

function openLogin() {
  showLoginPopup.value = true
}
function handleLoginSuccess(payload) {
  auth.login(payload.user);
  showLoginPopup.value = false;
  passwordValue.value = payload.password;
  window.location.reload(); // Ajout pour refresh global après connexion
}
function logout() {
  auth.logout();
  showUserDropdown.value = false
  showProfilePopup.value = false
  router.push('/')
}
function handleProfile() {
  showProfilePopup.value = true
  showUserDropdown.value = false
}
function closeProfilePopup() {
  showProfilePopup.value = false
  showPassword.value = false
}
function togglePassword() {
  showPassword.value = !showPassword.value
}
function handleDropdown() {
  showUserDropdown.value = !showUserDropdown.value
}

function goToEmploi() {
  router.push('/devoir')
}

function goHome() {
  router.push('/')
}

function goAdmin() {
  router.push('/admin')
}

function handleResize() {
  isMobile.value = window.innerWidth <= 1024;
  if (!isMobile.value) showMobileMenu.value = false;
}

function handleDevoirMobile() {
  showMobileMenu.value = false;
  setTimeout(() => {
    router.push('/devoirs');
  }, 250); // Laisse le temps à la transition de menu de se refermer
}

function handleAccueilMobile() {
  showMobileMenu.value = false;
  setTimeout(() => {
    router.push('/');
  }, 250);
}
function handleAboutMobile() {
  showMobileMenu.value = false;
  setTimeout(() => {
    router.push('/about');
  }, 250);
}
function handleContactMobile() {
  showMobileMenu.value = false;
  setTimeout(() => {
    router.push('/contact');
  }, 250);
}
function handleAdminMobile() {
  showMobileMenu.value = false;
  setTimeout(() => {
    router.push('/admin');
  }, 250);
}

function afficherRole(role) {
  if (role === 'eleve' || role === 'etudiant') return 'Étudiant';
  if (role === 'delegue') return 'Délégué';
  if (role === 'prof') return 'Professeur';
  if (role === 'admin') return 'Administrateur';
  return role;
}
function afficherAnnee(year) {
  if (year === 'BUT1') return '1ère année';
  if (year === 'BUT2') return '2ème année';
  if (year === 'BUT3') return '3ème année';
  return year;
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
.odoo-navbar, .odoo-navbar * {
  font-family: 'Cobe Heavy', 'Inter', sans-serif !important;
}
.odoo-navbar {
  width: 100%;
  background: #fff;
  box-shadow: #00ff12 0px 8px 16px 0px !important;
  padding: 0;
  position: relative;
  z-index: 10;
}
.odoo-navbar::after {
  content: none !important;
}
.odoo-navbar-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
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
  position: relative;
}
.navbar-guest {
  max-width: 900px;
}
.navbar-logged {
  max-width: 650px;
}
.odoo-menu {
  display: flex;
  gap: 8px;
  justify-content: center;
  /* flex: 1; supprimé pour ne pas étirer le menu */
  margin: 0 auto;
}
.odoo-menu-link {
  font-family: 'Cobe-HeavyItalic', 'Odoo Unicode Support Noto', sans-serif;
  font-style: italic;
  font-size: 1.15em;
  color: #555;
  background: none;
  border: none;
  border-radius: 12px;
  transition: background 0.18s, color 0.18s, box-shadow 0.18s, padding 0.18s;
  box-shadow: none;
  outline: none;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 24px;
}
.odoo-menu-link.active, .odoo-menu-link.router-link-exact-active {
  background: #6EFF78;
  color: #000000;
  box-shadow: 0 2px 8px #6eff7833;
  font-style: italic;
  border-radius: 12px;
}
.odoo-menu-link:not(.active):not(.router-link-exact-active):hover {
  color: #222;
  background: #e9ffe9;
  border-radius: 12px;
  transition: background 0.18s, color 0.18s, box-shadow 0.18s, padding 0.18s;
}
.odoo-navbar-actions {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 16px;
}
.odoo-login-btn {
  border: none;
  border-radius: 999px;
  background: #6366f1;
  color: #fff;
  font-size: 1.1em;
  padding: 10px 32px;
  box-shadow: 0 2px 8px #0001;
  transition: background 0.2s;
  cursor: pointer;
}
.odoo-login-btn:hover {
  background: #4f46e5;
}
.odoo-admin-btn {
  background: #111;
  color: #fff;
  font-family: 'Cobe Heavy', Inter, sans-serif;
  font-weight: bold;
  border: none;
  border-radius: 18px;
  padding: 10px 24px;
  font-size: 1.1em;
  box-shadow: 0 2px 8px #0002;
  cursor: pointer;
  transition: background 0.2s, color 0.2s, box-shadow 0.2s;
  margin-left: 12px;
}
.odoo-admin-btn:hover {
  background: #222;
  color: #fff;
  box-shadow: 0 4px 16px #0003;
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
@media (max-width: 1024px) {
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
.user-account-wrapper {
  display: inline-block;
}
.account-btn {
  background: none;
  border: 3px #000000 solid;
  cursor: pointer;
  padding: 0;
  margin-left: 2px;
  border-radius: 12px;
  transition: background 0.18s, border-color 0.18s, box-shadow 0.18s;
  width: 57px;
  height: 57px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px #0002, 0 1.5px 6px #0001;
}
.account-btn img {
  margin-top: 10px;
  width: 48px !important;
  height: 43px !important;
} 
.account-btn:hover {
  background: none;
  border-color: none;
}
.user-dropdown {
  position: absolute;
  right: 0;
  top: 44px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px #0002;
  min-width: 140px;
  z-index: 1001;
  display: flex;
  flex-direction: column;
  padding: 8px 0;
}
.dropdown-item {
  background: none;
  border: none;
  text-align: left;
  padding: 10px 18px;
  font-size: 1em;
  color: #222;
  cursor: pointer;
  transition: background 0.18s;
}
.dropdown-item:hover {
  background: #f3f3f3;
}
.profile-popup-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.18);
  z-index: 4000;
  display: flex;
  align-items: center;
  justify-content: center;
}
.profile-popup {
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 2px 24px #0003;
  padding: 36px 32px 28px 32px;
  min-width: 320px;
  max-width: 90vw;
  position: relative;
  text-align: center;
  font-family: 'Cobe Heavy', Inter, sans-serif;
}
.profile-popup h2 {
  margin-bottom: 18px;
  color: #111;
  font-size: 2em;
}
.profile-info {
  margin-bottom: 18px;
  text-align: left;
  color: black;
}
.profile-password-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}
.profile-password {
  font-family: 'Cobe Heavy', monospace;
  font-size: 1.1em;
  letter-spacing: 2px;
}
.eye-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0 4px;
}
.logout-btn {
  background: #ef4444;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 0;
  cursor: pointer;
  font-size: 1.1rem;
  width: 100%;
  margin-top: 8px;
  transition: background 0.2s;
}
.logout-btn:hover {
  background: #c81e1e;
}
</style> 