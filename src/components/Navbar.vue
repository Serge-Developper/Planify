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
            <!-- Compteur de coins à droite du bouton account -->
            <div class="coins-counter" :class="{ 'with-timer': !coinsStore.canSpinToday }">
              <span class="coins-display">{{ formattedBalance }} <img src="@/assets/son/../img/planicoins.png" alt="Coin" class="coin-icon" /></span>
              <span class="coins-separator" aria-hidden="true"></span>
              <button class="fortune-wheel-btn" @click="openFortuneWheel" :class="{ 'disabled': !coinsStore.canSpinToday }" :disabled="!coinsStore.canSpinToday" title="Tourner la roue de la fortune">
                <img src="@/assets/img/icons8-roulette-wheel-55.png" alt="Roue de la fortune" class="fortune-wheel-icon" />
              </button>
              <span v-if="!coinsStore.canSpinToday" class="spin-timer">{{ timeUntilNextSpin }}</span>
              <img src="@/assets/img/icons8-boutique-55.png" alt="Boutique" class="shop-icon" @click="showShopPopup = true" />
            </div>
            
            <button class="account-btn" :class="{ 
              'stars-equipped': equippedItem && equippedItem.name === 'Étoiles', 
              'rainbow-equipped': equippedItem && equippedItem.name === 'Roses',
              'classic-border-equipped': equippedItem && equippedItem.name === 'Bordure Classique',
              'discord-equipped': equippedItem && equippedItem.displayType === 'discord',
              'galaxie-equipped': equippedItem && equippedItem.name === 'Galaxie',
              'alpha-equipped': equippedItem && (equippedItem.name === 'Alpha' || equippedItem.displayType === 'alpha')
            }" :style="getAccountBorderStyle()" @click="handleDropdown">
              <div class="avatar-image-container" :class="{ 'jojo-sepia': equippedItem && equippedItem.displayType === 'jojo' }" :key="'aic-'+coinsStore.jojoVariantIndex">
                <!-- Items dynamiques: "below" à l'intérieur (sous l'avatar) -->
                <template v-if="equippedDynItem && Array.isArray(equippedDynItem.assets)">
                  <img
                    v-for="(a, ai) in equippedDynItem.assets"
                    v-if="a && a.src && ((a.meta && (a.meta.navbarPlacement === 'below' || a.meta.avatarPlacement === 'below')) || (!a.meta && a.navbarPlacement === 'below'))"
                    :key="'dyn-nb-below-'+ai"
                    :src="resolveDynSrc(a.src)"
                    :style="getDynNavbarAssetStyle(a)"
                  />
                </template>
                <img class="avatar-img"
                  :src="userAvatar" 
                  alt="Compte" 
                  :style="equippedItem && equippedItem.name === '8-Bit' 
                    ? 'width: 100%; height: 100%; object-fit: cover; image-rendering: pixelated; image-rendering: -moz-crisp-edges; image-rendering: crisp-edges; filter: contrast(1.2) brightness(1.1) saturate(1.1);' 
                    : 'width: 100%; height: 100%; object-fit: cover;'
                  "
                  @error="handleImageError"
                  @load="handleImageLoad"
                />
                <!-- Items dynamiques: "inside" à l'intérieur (au-dessus de l'avatar) -->
                <template v-if="equippedDynItem && Array.isArray(equippedDynItem.assets)">
                  <img
                    v-for="(a, ai) in equippedDynItem.assets"
                    v-if="a && a.src && ((a.meta && (a.meta.navbarPlacement === 'inside' || a.meta.avatarPlacement === 'inside')) || (!a.meta && (!a.navbarPlacement || a.navbarPlacement === 'inside')))"
                    :key="'dyn-nb-inside-'+ai"
                    :src="resolveDynSrc(a.src)"
                    :style="getDynNavbarAssetStyle(a)"
                  />
                </template>
                <!-- Animation Matrix à l'intérieur de l'avatar -->
                <div v-if="equippedItem && equippedItem.displayType === 'matrix'" class="matrix-rain-inside">
                  <div class="matrix-column" v-for="i in 15" :key="i" :style="{ left: (i * 6.67) + '%', animationDelay: (Math.random() * 2) + 's' }">
                    <span v-for="j in 6" :key="j" class="matrix-char">{{ getRandomMatrixChar() }}</span>
                  </div>
                </div>
                <!-- Item Cash à l'intérieur de l'avatar -->
                <img 
                  v-if="equippedItem && equippedItem.displayType === 'cash'" 
                  :src="cash" 
                  :alt="equippedItem.name"
                  class="equipped-cash-inside"
                />
                <!-- Item Cible à l'intérieur de l'avatar -->
                <img 
                  v-if="equippedItem && equippedItem.displayType === 'target'" 
                  :src="target" 
                  :alt="equippedItem.name"
                  class="equipped-target-inside"
                />
                <!-- Item Advisory à l'intérieur de l'avatar -->
                <img 
                  v-if="equippedItem && equippedItem.displayType === 'advisory'" 
                  :src="advisory" 
                  :alt="equippedItem.name"
                  class="equipped-advisory-inside"
                />
            <!-- Item Jojo à l'intérieur de l'avatar -->
            <img 
              v-if="equippedItem && equippedItem.displayType === 'jojo'" 
              :src="jojo" 
              :alt="equippedItem.name"
              class="equipped-jojo-inside"
              :key="'jojo-'+coinsStore.jojoVariantIndex"
            />
            <img 
              v-if="equippedItem && equippedItem.displayType === 'jojo' && coinsStore.jojoVariantIndex === 1" 
              :src="jojotext" 
              :alt="equippedItem.name"
              class="equipped-jojotext-inside"
              :key="'jojotext-'+coinsStore.jojoVariantIndex"
            />
                <!-- Item Espace (spacestars à l'intérieur + asteroide par-dessus) -->
                <img 
                  v-if="equippedItem && equippedItem.displayType === 'espace'" 
                  :src="spacestars" 
                  :alt="equippedItem.name"
                  class="equipped-spacestars-inside"
                />
                <img 
                  v-if="equippedItem && equippedItem.displayType === 'espace'" 
                  :src="asteroide" 
                  :alt="equippedItem.name"
                  class="equipped-asteroide-overlay"
                />



              </div>
            </button>
            <!-- Items dynamiques: "above" au-dessus du bouton account -->
            <template v-if="equippedDynItem && Array.isArray(equippedDynItem.assets)">
              <img
                v-for="(a, ai) in equippedDynItem.assets"
                v-if="a && a.src && (!a.meta || a.meta.navbarPlacement === 'above' || a.meta?.avatarPlacement === 'above' || a.navbarPlacement === 'above')"
                :key="'dyn-nb-above-'+ai"
                :src="resolveDynSrc(a.src)"
                :style="getDynNavbarOverlayStyle(a)"
              />
            </template>
            <!-- Fallback pour les items dynamiques sans placement spécifique -->
            <template v-if="equippedDynItem && equippedDynItem.img && (!equippedDynItem.assets || !Array.isArray(equippedDynItem.assets) || equippedDynItem.assets.length === 0)">
              <img
                :src="resolveDynSrc(equippedDynItem.img)"
                :alt="equippedDynItem.name"
                class="equipped-dynamic-item-overlay"
                style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: contain; z-index: 15;"
              />
            </template>
            <!-- Fallback simple pour tous les items dynamiques -->
            <template v-if="equippedDynItem && equippedDynItem.img">
              <img
                :src="resolveDynSrc(equippedDynItem.img)"
                :alt="equippedDynItem.name"
                class="equipped-dynamic-item-overlay"
                style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: contain; z-index: 15;"
              />
            </template>
            <!-- Item équipé générique (rendu seulement si une image est définie et pas d'item dynamique) -->
            <img 
              v-if="equippedItem && equippedItem.displayType === 'generic' && equippedItem.img && !equippedDynItem && equippedItem.name !== 'Galaxie' && equippedItem.name !== 'Coeur' && equippedItem.name !== 'Étoiles'" 
              :src="equippedItem.img" 
              :alt="equippedItem.name"
              class="equipped-galaxie-overlay"
              :class="getEquippedItemClass(equippedItem.name)"
            />
            <!-- Item Ange par-dessus le bouton account -->
            <img 
              v-if="equippedItem && equippedItem.displayType === 'angel'" 
              :src="equippedItem.img" 
              :alt="equippedItem.name"
              class="equipped-angel-wings"
            />
            <!-- Item Étoiles par-dessus le bouton account -->
            <img 
              v-if="equippedItem && (equippedItem.displayType === 'etoiles' || equippedItem.name === 'Étoiles')" 
              :src="star" 
              :alt="equippedItem.name"
              class="equipped-stars"
            />
            <!-- Item Alpha par-dessus le bouton account -->
            <img 
              v-if="equippedItem && (equippedItem.displayType === 'alpha' || equippedItem.name === 'Alpha')" 
              :src="alphaImg" 
              :alt="equippedItem.name"
              class="equipped-alpha-overlay"
            />
            <!-- Item Admin Planify par-dessus le bouton account -->
            <img 
              v-if="equippedItem && (equippedItem.displayType === 'admin-planify' || equippedItem.name === 'Admin Planify')" 
              :src="adminPlanify" 
              :alt="equippedItem.name"
              class="equipped-admin-planify-overlay"
            />
            <!-- Item Tomb Raider derrière le bouton account -->
            <img 
              v-if="equippedItem && equippedItem.displayType === 'tomb-raider'" 
              :src="laracroft" 
              :alt="equippedItem.name"
              class="equipped-tomb-raider"
            />
            <!-- Item Clown par-dessus le bouton account -->
            <img 
              v-if="equippedItem && equippedItem.displayType === 'clown'" 
              :src="clowncheveux" 
              :alt="equippedItem.name"
              class="equipped-clown-overlay"
            />
            <!-- Item Roi par-dessus le bouton account -->
            <img 
              v-if="equippedItem && equippedItem.displayType === 'roi'" 
              :src="roi" 
              :alt="equippedItem.name"
              class="equipped-roi-overlay"
            />
            <!-- Item Gentleman (moustache à l'intérieur + chapeau par-dessus) -->
            <img 
              v-if="equippedItem && equippedItem.displayType === 'gentleman'" 
              :src="moustache" 
              :alt="equippedItem.name"
              class="equipped-moustache-inside"
            />
            <img 
              v-if="equippedItem && equippedItem.displayType === 'gentleman'" 
              :src="gentleman" 
              :alt="equippedItem.name"
              class="equipped-gentleman-overlay"
            />
            <!-- Item Vinyle par-dessus le bouton account -->
            <img 
              v-if="equippedItem && equippedItem.displayType === 'vinyle'" 
              :src="vinyle" 
              :alt="equippedItem.name"
              class="equipped-vinyle-overlay"
            />
            <!-- Item Flash (flash + camera par-dessus) -->
            <img 
              v-if="equippedItem && equippedItem.displayType === 'flash'" 
              :src="flash" 
              :alt="equippedItem.name"
              class="equipped-flash-overlay"
            />
            <img 
              v-if="equippedItem && equippedItem.displayType === 'flash'" 
              :src="camera" 
              :alt="equippedItem.name"
              class="equipped-camera-overlay"
            />
            <!-- Item Miaou (pate à l'intérieur + chat par-dessus) -->
            <img 
              v-if="equippedItem && equippedItem.displayType === 'miaou'" 
              :src="pate" 
              :alt="equippedItem.name"
              class="equipped-pate-inside"
            />
            <img 
              v-if="equippedItem && equippedItem.displayType === 'miaou'" 
              :src="chat" 
              :alt="equippedItem.name"
              class="equipped-chat-overlay"
            />
            <!-- Item DVD à l'intérieur de l'avatar -->
            <img 
              v-if="equippedItem && equippedItem.displayType === 'dvd'" 
              :src="dvd" 
              :alt="equippedItem.name"
              class="equipped-dvd-inside"
            />
            <!-- Item Lunettes pixel à l'intérieur de l'avatar -->
            <img 
              v-if="equippedItem && equippedItem.displayType === 'lunettes-pixel'" 
              :src="mlglunette" 
              :alt="equippedItem.name"
              class="equipped-lunettes-pixel-inside"
            />
            <!-- Item 2000 à l'intérieur de l'avatar -->
            <img 
              v-if="equippedItem && equippedItem.displayType === 'nokia'" 
              :src="nokia" 
              :alt="equippedItem.name"
              class="equipped-nokia-inside"
            />
            <!-- Item Discord/Galaxie par-dessus le bouton account -->
            <img 
              v-if="equippedItem && equippedItem.displayType === 'discord'" 
              :src="[discordon, discordnepasderange, discordderange][coinsStore.discordVariantIndex]" 
              :alt="equippedItem.name"
              class="equipped-discord-overlay"
            />
            <img 
              v-if="equippedItem && equippedItem.name === 'Galaxie'" 
              :src="galaxie" 
              :alt="equippedItem.name"
              class="equipped-galaxie-overlay"
            />
            <img 
              v-if="equippedItem && (equippedItem.name === 'Coeur' || equippedItem.displayType === 'coeur')" 
              :src="coeur" 
              :alt="equippedItem.name"
              class="equipped-coeur-overlay"
            />
            <img 
              v-if="equippedItem && equippedItem.displayType === 'nokia'" 
              :src="clippy" 
              :alt="equippedItem.name"
              class="equipped-clippy-inside"
            />
            <img 
              v-if="equippedItem && equippedItem.displayType === 'nokia'" 
              :src="daftpunk" 
              :alt="equippedItem.name"
              class="equipped-daftpunk-overlay"
            />
            <!-- Item Absolute Cinema par-dessus le bouton account -->
            <img 
              v-if="equippedItem && equippedItem.displayType === 'absolute-cinema'" 
              :src="bras" 
              :alt="equippedItem.name"
              class="equipped-absolute-cinema-overlay"
            />
            <img 
              v-if="equippedItem && equippedItem.displayType === 'absolute-cinema'" 
              :src="bras" 
              :alt="equippedItem.name"
              class="equipped-absolute-cinema-overlay-right"
            />
            <!-- Item Oreillettes de chat par-dessus le bouton account -->
            <img 
              v-if="equippedItem && equippedItem.displayType === 'cat-ears'" 
              :src="equippedItem.img" 
              :alt="equippedItem.name"
              class="equipped-cat-ears"
            />
            <!-- Item Cadre royale par-dessus le bouton account -->
            <img 
              v-if="equippedItem && equippedItem.displayType === 'royal-frame'" 
              :src="equippedItem.img" 
              :alt="equippedItem.name"
              class="equipped-royal-frame"
            />
            <!-- Item Roses par-dessus le bouton account -->
            <img 
              v-if="equippedItem && equippedItem.displayType === 'rainbow'" 
              :src="equippedItem.img" 
              :alt="equippedItem.name"
              class="equipped-rainbow"
            />


            <!-- Nez de clown centré sur l'avatar -->
            <img 
              v-if="equippedItem && equippedItem.displayType === 'clown'" 
              :src="clownnose" 
              alt="Nez de clown"
              class="equipped-clown-nose"
            />

            <input 
              ref="fileInput" 
              type="file" 
              accept="image/*" 
              style="display:none;" 
              @change="handleAvatarUpload" 
            />
            

            <div v-if="showUserDropdown" class="user-dropdown" @click.stop>
              <button class="dropdown-item" @click="handleProfile">Profil</button>
              <button class="dropdown-item" @click="changeAvatar">Changer l'avatar</button>
              <button class="dropdown-item" @click="logout">Déconnexion</button>
            </div>
          </div>
        </div>
      </div>
      <transition name="slide-fade">
        <div v-if="isMobile && showMobileMenu" class="mobile-menu">
          <button class="close-btn" @click="showMobileMenu = false" @mouseover="hoverCloseMobile = true" @mouseleave="hoverCloseMobile = false">
            <img :src="hoverCloseMobile ? closeHoverImg : closeImg" alt="Fermer" class="close-img" />
          </button>
          <nav class="mobile-menu-links">
            <a class="odoo-menu-link" @click="handleAccueilMobile">Accueil</a>
            <a class="odoo-menu-link" @click="handleDevoirMobile">Devoirs</a>
            <a class="odoo-menu-link" @click="handleAboutMobile">À propos</a>
            <a class="odoo-menu-link" @click="handleContactMobile">Contact</a>
            <button v-if="isAdmin" class="odoo-menu-link odoo-admin-btn" @click="handleAdminMobile">Admin Dashboard</button>
            <button v-if="!isLoggedIn" class="odoo-login-btn" @click="openLogin">Se connecter</button>
            <div v-else class="user-account-wrapper" style="position:relative;">
              <!-- Compteur de coins dans le menu mobile -->
              <div class="coins-counter" :class="{ 'with-timer': !coinsStore.canSpinToday }">
                <span class="coins-display">{{ formattedBalance }} <img src="@/assets/img/planicoins.png" alt="Coin" class="coin-icon" /></span>
                <span class="coins-separator" aria-hidden="true"></span>
                <button class="fortune-wheel-btn" @click="openFortuneWheel" :disabled="!coinsStore.canSpinToday" title="Tourner la roue de la fortune">
                 <img src="@/assets/img/icons8-roulette-wheel-55.png" alt="Roue de la fortune" class="fortune-wheel-icon" />
                </button>
                <span v-if="!coinsStore.canSpinToday" class="spin-timer">{{ timeUntilNextSpin }}</span>
                <img src="@/assets/img/icons8-boutique-55.png" alt="Boutique" class="shop-icon" @click="showShopPopup = true" />
              </div>
              <button class="account-btn" :class="{ 'stars-equipped': equippedItem && equippedItem.name === 'Étoiles', 'rainbow-equipped': equippedItem && equippedItem.name === 'Roses', 'discord-equipped': equippedItem && equippedItem.displayType === 'discord', 'galaxie-equipped': equippedItem && equippedItem.name === 'Galaxie', 'alpha-equipped': equippedItem && (equippedItem.name === 'Alpha' || equippedItem.displayType === 'alpha') }" :style="getAccountBorderStyle()" @click="handleDropdown">
                <div class="avatar-image-container-mobile" :class="{ 'jojo-sepia': equippedItem && equippedItem.displayType === 'jojo' }" :key="'aicm-'+coinsStore.jojoVariantIndex">
                  <!-- Dyn (mobile): below -->
                  <template v-if="equippedDynItem && Array.isArray(equippedDynItem.assets)">
                    <img
                      v-for="(a, ai) in equippedDynItem.assets"
                      v-if="a && ((a.meta && (a.meta.navbarPlacement === 'below' || a.meta.avatarPlacement === 'below')) || (!a.meta && a.navbarPlacement === 'below'))"
                      :key="'dyn-m-below-'+ai"
                      :src="resolveDynSrc(a.src)"
                      :style="getDynNavbarAssetStyle(a)"
                    />
                  </template>
                  <img class="avatar-img"
                    :src="userAvatar" 
                    alt="Compte" 
                    :style="equippedItem && equippedItem.name === '8-Bit' 
                      ? 'width: 51px; height: 51px; object-fit: cover; image-rendering: pixelated; image-rendering: -moz-crisp-edges; image-rendering: crisp-edges; filter: contrast(1.2) brightness(1.1) saturate(1.1);' 
                      : 'width: 51px; height: 51px; object-fit: cover;'
                    "
                    @error="handleImageError"
                    @load="handleImageLoad"
                  />
                  <!-- Dyn (mobile): inside -->
                  <template v-if="equippedDynItem && Array.isArray(equippedDynItem.assets)">
                    <img
                      v-for="(a, ai) in equippedDynItem.assets"
                      v-if="a && ((a.meta && (a.meta.navbarPlacement === 'inside' || a.meta.avatarPlacement === 'inside')) || (!a.meta && (!a.navbarPlacement || a.navbarPlacement === 'inside')))"
                      :key="'dyn-m-inside-'+ai"
                      :src="resolveDynSrc(a.src)"
                      :style="getDynNavbarAssetStyle(a)"
                    />
                  </template>
                  <!-- Item Discord/Galaxie (mobile) par-dessus le bouton account -->
                  <img 
                    v-if="equippedItem && equippedItem.displayType === 'discord'" 
                    :src="[discordon, discordnepasderange, discordderange][coinsStore.discordVariantIndex]" 
                    :alt="equippedItem.name"
                    class="equipped-discord-overlay-mobile"
                  />
                  <img 
                    v-if="equippedItem && equippedItem.name === 'Galaxie'" 
                    :src="galaxie" 
                    :alt="equippedItem.name"
                    class="equipped-galaxie-overlay-mobile"
                  />
                  
                  <!-- Animation Matrix à l'intérieur de l'avatar (mobile) -->
                  <div v-if="equippedItem && equippedItem.displayType === 'matrix'" class="matrix-rain-inside-mobile">
                    <div class="matrix-column" v-for="i in 12" :key="i" :style="{ left: (i * 8.33) + '%', animationDelay: (Math.random() * 2) + 's' }">
                      <span v-for="j in 6" :key="j" class="matrix-char">{{ getRandomMatrixChar() }}</span>
                    </div>
                  </div>
                  <!-- Item Cash à l'intérieur de l'avatar (mobile) -->
                  <img 
                    v-if="equippedItem && equippedItem.displayType === 'cash'" 
                    :src="cash" 
                    :alt="equippedItem.name"
                    class="equipped-cash-inside-mobile"
                  />
                  <!-- Item Cible à l'intérieur de l'avatar (mobile) -->
                  <img 
                    v-if="equippedItem && equippedItem.displayType === 'target'" 
                    :src="target" 
                    :alt="equippedItem.name"
                    class="equipped-target-inside-mobile"
                  />
                  <!-- Item Advisory à l'intérieur de l'avatar (mobile) -->
                  <img 
                    v-if="equippedItem && equippedItem.displayType === 'advisory'" 
                    :src="advisory" 
                    :alt="equippedItem.name"
                    class="equipped-advisory-inside-mobile"
                  />
            <!-- Item Jojo à l'intérieur de l'avatar (mobile) -->
            <img 
              v-if="equippedItem && equippedItem.displayType === 'jojo'" 
              :src="jojo" 
              :alt="equippedItem.name"
              class="equipped-jojo-inside-mobile"
              :key="'jojo-m-'+coinsStore.jojoVariantIndex"
            />
            <img 
              v-if="equippedItem && equippedItem.displayType === 'jojo' && coinsStore.jojoVariantIndex === 1" 
              :src="jojotext" 
              :alt="equippedItem.name"
              class="equipped-jojotext-inside-mobile"
              :key="'jojotext-m-'+coinsStore.jojoVariantIndex"
            />
                  <!-- Item Espace (spacestars à l'intérieur + asteroide par-dessus) (mobile) -->
                  <img 
                    v-if="equippedItem && equippedItem.displayType === 'espace'" 
                    :src="spacestars" 
                    :alt="equippedItem.name"
                    class="equipped-spacestars-inside-mobile"
                  />
                  <img 
                    v-if="equippedItem && equippedItem.displayType === 'espace'" 
                    :src="asteroide" 
                    :alt="equippedItem.name"
                    class="equipped-asteroide-overlay-mobile"
                  />



              </div>
            </button>
            <!-- Dyn (mobile): above -->
            <template v-if="equippedDynItem && Array.isArray(equippedDynItem.assets)">
              <img
                v-for="(a, ai) in equippedDynItem.assets"
                v-if="a && (!a.meta || a.meta.navbarPlacement === 'above' || a.meta?.avatarPlacement === 'above' || a.navbarPlacement === 'above')"
                :key="'dyn-m-above-'+ai"
                :src="resolveDynSrc(a.src)"
                :style="getDynNavbarOverlayStyle(a)"
              />
            </template>
            <!-- Fallback pour les items dynamiques sans placement spécifique (mobile) -->
            <template v-if="equippedDynItem && equippedDynItem.img && (!equippedDynItem.assets || !Array.isArray(equippedDynItem.assets) || equippedDynItem.assets.length === 0)">
              <img
                :src="resolveDynSrc(equippedDynItem.img)"
                :alt="equippedDynItem.name"
                class="equipped-dynamic-item-overlay-mobile"
                style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: contain; z-index: 15;"
              />
            </template>
            <!-- Fallback simple pour tous les items dynamiques (mobile) -->
            <template v-if="equippedDynItem && equippedDynItem.img">
              <img
                :src="resolveDynSrc(equippedDynItem.img)"
                :alt="equippedDynItem.name"
                class="equipped-dynamic-item-overlay-mobile"
                style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: contain; z-index: 15;"
              />
            </template>
            <img 
              v-if="equippedItem && (equippedItem.name === 'Coeur' || equippedItem.displayType === 'coeur')" 
              :src="coeur" 
              :alt="equippedItem.name"
              class="equipped-coeur-overlay-mobile"
            />
              <!-- Item équipé générique (mobile) – ne pas doubler si item dynamique -->
              <img 
                v-if="equippedItem && equippedItem.displayType === 'generic' && !equippedDynItem && equippedItem.name !== 'Galaxie' && equippedItem.name !== 'Coeur' && equippedItem.name !== 'Étoiles'" 
                :src="equippedItem.img" 
                :alt="equippedItem.name"
                class="equipped-item-overlay-mobile"
                :class="getEquippedItemClass(equippedItem.name)"
              />
              <!-- Item Ange par-dessus le bouton account (mobile) -->
              <img 
                v-if="equippedItem && equippedItem.displayType === 'angel'" 
                :src="equippedItem.img" 
                :alt="equippedItem.name"
                class="equipped-angel-wings-mobile"
              />
              <!-- Item Étoiles par-dessus le bouton account (mobile) -->
              <img 
                v-if="equippedItem && (equippedItem.displayType === 'etoiles' || equippedItem.name === 'Étoiles')" 
                :src="star" 
                :alt="equippedItem.name"
                class="equipped-stars"
              />
              <!-- Item Alpha par-dessus le bouton account (mobile) -->
              <img 
                v-if="equippedItem && (equippedItem.displayType === 'alpha' || equippedItem.name === 'Alpha')" 
                :src="alphaImg" 
                :alt="equippedItem.name"
                class="equipped-alpha-overlay-mobile"
              />
              <!-- Item Admin Planify par-dessus le bouton account (mobile) -->
              <img 
                v-if="equippedItem && (equippedItem.displayType === 'admin-planify' || equippedItem.name === 'Admin Planify')" 
                :src="adminPlanify" 
                :alt="equippedItem.name"
                class="equipped-admin-planify-overlay-mobile"
              />
              <!-- Item Tomb Raider derrière le bouton account (mobile) -->
              <img 
                v-if="equippedItem && equippedItem.displayType === 'tomb-raider'" 
                :src="laracroft" 
                :alt="equippedItem.name"
                class="equipped-tomb-raider-mobile"
              />
              <!-- Item Clown par-dessus le bouton account (mobile) -->
              <img 
                v-if="equippedItem && equippedItem.displayType === 'clown'" 
                :src="clowncheveux" 
                :alt="equippedItem.name"
                class="equipped-clown-overlay-mobile"
              />
              <!-- Item Roi par-dessus le bouton account (mobile) -->
              <img 
                v-if="equippedItem && equippedItem.displayType === 'roi'" 
                :src="roi" 
                :alt="equippedItem.name"
                class="equipped-roi-overlay-mobile"
              />
              <!-- Item Gentleman (moustache à l'intérieur + chapeau par-dessus) (mobile) -->
              <img 
                v-if="equippedItem && equippedItem.displayType === 'gentleman'" 
                :src="moustache" 
                :alt="equippedItem.name"
                class="equipped-moustache-inside-mobile"
              />
              <img 
                v-if="equippedItem && equippedItem.displayType === 'gentleman'" 
                :src="gentleman" 
                :alt="equippedItem.name"
                class="equipped-gentleman-overlay-mobile"
              />
              <!-- Item Vinyle par-dessus le bouton account (mobile) -->
              <img 
                v-if="equippedItem && equippedItem.displayType === 'vinyle'" 
                :src="vinyle" 
                :alt="equippedItem.name"
                class="equipped-vinyle-overlay-mobile"
              />
              <!-- Item Flash (flash + camera par-dessus) (mobile) -->
              <img 
                v-if="equippedItem && equippedItem.displayType === 'flash'" 
                :src="flash" 
                :alt="equippedItem.name"
                class="equipped-flash-overlay-mobile"
              />
              <img 
                v-if="equippedItem && equippedItem.displayType === 'flash'" 
                :src="camera" 
                :alt="equippedItem.name"
                class="equipped-camera-overlay-mobile"
              />
              <!-- Item Miaou (pate à l'intérieur + chat par-dessus) (mobile) -->
              <img 
                v-if="equippedItem && equippedItem.displayType === 'miaou'" 
                :src="pate" 
                :alt="equippedItem.name"
                class="equipped-pate-inside-mobile"
              />
              <img 
                v-if="equippedItem && equippedItem.displayType === 'miaou'" 
                :src="chat" 
                :alt="equippedItem.name"
                class="equipped-chat-overlay-mobile"
              />
              <!-- Item DVD à l'intérieur de l'avatar (mobile) -->
              <img 
                v-if="equippedItem && equippedItem.displayType === 'dvd'" 
                :src="dvd" 
                :alt="equippedItem.name"
                class="equipped-dvd-inside-mobile"
              />
            <!-- Item Lunettes pixel à l'intérieur de l'avatar (mobile) -->
            <img 
              v-if="equippedItem && equippedItem.displayType === 'lunettes-pixel'" 
              :src="mlglunette" 
              :alt="equippedItem.name"
              class="equipped-lunettes-pixel-inside-mobile"
            />
            <!-- Item 2000 à l'intérieur de l'avatar (mobile) -->
            <img 
              v-if="equippedItem && equippedItem.displayType === 'nokia'" 
              :src="nokia" 
              :alt="equippedItem.name"
              class="equipped-nokia-inside-mobile"
            />
            <img 
              v-if="equippedItem && equippedItem.displayType === 'nokia'" 
              :src="clippy" 
              :alt="equippedItem.name"
              class="equipped-clippy-inside-mobile"
            />
            <!-- Item Oreillettes de chat par-dessus le bouton account (mobile) -->
            <img 
              v-if="equippedItem && equippedItem.displayType === 'cat-ears'" 
              :src="equippedItem.img" 
              :alt="equippedItem.name"
              class="equipped-cat-ears-mobile"
            />
            <!-- Item Cadre royale par-dessus le bouton account (mobile) -->
            <img 
              v-if="equippedItem && equippedItem.displayType === 'royal-frame'" 
              :src="equippedItem.img" 
              :alt="equippedItem.name"
              class="equipped-royal-frame-mobile"
            />
            <!-- Item Roses par-dessus le bouton account (mobile) -->
            <img 
              v-if="equippedItem && equippedItem.displayType === 'rainbow'" 
              :src="equippedItem.img" 
              :alt="equippedItem.name"
              class="equipped-rainbow-mobile"
            />
            <img 
              v-if="equippedItem && equippedItem.displayType === 'nokia'" 
              :src="daftpunk" 
              :alt="equippedItem.name"
              class="equipped-daftpunk-overlay-mobile"
            />
            <!-- Item Absolute Cinema par-dessus le bouton account (mobile) -->
            <img 
              v-if="equippedItem && equippedItem.displayType === 'absolute-cinema'" 
              :src="bras" 
              :alt="equippedItem.name"
              class="equipped-absolute-cinema-overlay-mobile"
            />
            <img 
              v-if="equippedItem && equippedItem.displayType === 'absolute-cinema'" 
              :src="bras" 
              :alt="equippedItem.name"
              class="equipped-absolute-cinema-overlay-right-mobile"
            />
            <!-- Nez de clown centré sur l'avatar (mobile) -->
            <img 
              v-if="equippedItem && equippedItem.displayType === 'clown'" 
              :src="clownnose" 
              alt="Nez de clown"
              class="equipped-clown-nose-mobile"
            />

              <input 
                ref="fileInputMobile" 
                type="file" 
                accept="image/*" 
                style="display:none;" 
                @change="handleAvatarUpload" 
              />
              

              <div v-if="showUserDropdown" class="user-dropdown" @click.stop>
                <button class="dropdown-item" @click="handleProfile">Profil</button>
                <button class="dropdown-item" @click="changeAvatar">Changer l'avatar</button>
                <button class="dropdown-item" @click="logout">Déconnexion</button>
              </div>
            </div>
          </nav>
        </div>
      </transition>
    </div>
    <LoginPopup v-if="showLoginPopup" @close="showLoginPopup = false" @login-success="handleLoginSuccess" />
    
    <!-- Modal Roue de la Fortune -->
    <div v-if="showFortuneWheel" class="fortune-wheel-overlay" @click.self="closeFortuneWheel">
      <div class="fortune-wheel-modal">
        <button class="close-btn" @click="closeFortuneWheel" @mouseover="hoverCloseWheel = true" @mouseleave="hoverCloseWheel = false" aria-label="Fermer">
          <img :src="hoverCloseWheel ? closeHoverImg : closeImg" alt="Fermer" class="close-img" />
        </button>
        <!-- Close volontairement retiré pour que tu puisses l'intégrer à ta convenance -->
        <h2>🎰 Roue de la Fortune</h2>
        <p class="fortune-wheel-subtitle">
          Tournez la roue pour gagner des PlanifyCoins !
          <span v-if="isWeekend" class="weekend-bonus">🎉 WEEKEND BONUS x2 !</span>
        </p>
        
        <div class="fortune-wheel-container">
          <!-- Debug: Afficher les segments -->
          <div style="display: none;">
            <p>Debug segments: {{ JSON.stringify(wheelSegments.value) }}</p>
            <p>Debug isWeekend: {{ isWeekend.value }}</p>
          </div>
          <CustomFortuneWheel
            :segments="wheelSegments"
            :forced-result-index="forcedResultIndex"
            :disabled="spinning || !coinsStore.canSpinToday"
            :key="wheelKey"
            :isWeekend="isWeekend"
            @spin-request="handleSpinRequest"
            @result="handleWheelResult"
          />
          <!-- Contrôles de test (admin seulement) -->
          <div v-if="isAdmin" class="wheel-test-controls">
            <button class="test-btn" @click="spinTestOnce">Spin test (infini)</button>
            <button class="test-btn" @click="toggleTestWheelMode">
              {{ testWheelMode === 'x2' ? 'Basique' : 'Roue x2' }}
            </button>
          </div>
        </div>
        
                <div class="coins-info">
          <p>
            Vos PlanifyCoins actuels :
            <span class="coins-value">{{ formattedWheelBalance }}</span>
            <img src="@/assets/img/planicoins.png" alt="Coin" class="coin-icon" />
          </p>
          <p class="spin-info">
            <span v-if="coinsStore.canSpinToday" class="spin-available">Tous les weekends la roue est x2 !</span>
          </p>
        </div>
        <div v-if="spinMessage" class="spin-message">{{ spinMessage }}</div>
      </div>
    </div>
    
    <div v-if="showProfilePopup" class="profile-popup-overlay" @click.self="closeProfilePopup">
      <div class="profile-popup">
        <button class="close-btn" @click="closeProfilePopup" @mouseover="hoverCloseProfile = true" @mouseleave="hoverCloseProfile = false">
          <img :src="hoverCloseProfile ? closeHoverImg : closeImg" alt="Fermer" class="close-img" />
        </button>
        <h2>Profil</h2>
        <div class="profile-info">
          <div><strong>Nom d'utilisateur :</strong> {{ user?.username || user?.name || 'Utilisateur' }}</div>
          <div><strong>Rôle :</strong> {{ user?.role ? afficherRole(user.role) : 'Non défini' }}</div>
          <div><strong>Année :</strong> {{ user?.year ? afficherAnnee(user.year) : 'Non définie' }}</div>
          <div><strong>Groupe :</strong> {{ user?.groupe || 'Non défini' }}</div>
          <div class="coins-profile-row">
            <strong>PlanifyCoins :</strong>
            <span class="coins-value">{{ formattedBalance }}</span>
            <img src="@/assets/img/planicoins.png" alt="Coin" class="coin-icon" />
          </div>
        </div>
        <button class="logout-btn" @click="logout">Déconnexion</button>
      </div>
    </div>

    <!-- Modal Boutique -->
    <ShopPopup :show="showShopPopup" @close="showShopPopup = false" @equip-item="handleEquipItem" />

  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCoinsStore } from '@/stores/coins'
import LoginPopup from './LoginPopup.vue'
import accountIcon from '@/assets/accounttt.svg'
import eyeOpen from '@/assets/eyeopen.svg'
import eyeClosed from '@/assets/eyeclosed.svg'
import axios from 'axios'
import { API_URL, secureApiCall } from '@/api'
import CustomFortuneWheel from './CustomFortuneWheel.vue'
import ShopPopup from './ShopPopup.vue'
// Remplacement de l'icône PlanifyCoins
// Icône boutique remplacée
import laracroft from '@/assets/img/laracroft.gif'
import clowncheveux from '@/assets/img/clowncheveux.gif'
import clownnose from '@/assets/img/clownnose.gif'
import cash from '@/assets/img/cash.gif'
import target from '@/assets/img/target.gif'
// import star from '@/assets/img/star.gif' // doublon supprimé plus bas
import cadre from '@/assets/img/cadre.gif'
import love from '@/assets/img/love.gif'
import roi from '@/assets/img/roi.gif'
import moustache from '@/assets/img/moustache.gif'
import gentleman from '@/assets/img/gentleman.gif'
import vinyle from '@/assets/img/vinyle.gif'
import advisory from '@/assets/img/advisory.gif'
import spacestars from '@/assets/img/spacestars.gif'
import asteroide from '@/assets/img/asteroide.gif'
import bras from '@/assets/img/bras.png'
import flash from '@/assets/img/flash.gif'
import camera from '@/assets/img/camera.gif'
import chat from '@/assets/img/chat.gif'
import pate from '@/assets/img/pate.gif'
import dvd from '@/assets/img/dvd.png'
import mlglunette from '@/assets/img/mlglunette.gif'
import nokia from '@/assets/img/nokia.gif'
import clippy from '@/assets/img/clippy.gif'
import daftpunk from '@/assets/img/daftpunk.gif'
import closeImg from '@/assets/img/bouton_supprimer_decocher.png'
import closeHoverImg from '@/assets/img/bouton_supprimer_cocher.png'
import discordon from '@/assets/img/discordon.png'
import discordnepasderange from '@/assets/img/discordnepasderange.png'
import discordderange from '@/assets/img/discordderange.png'
import jojo from '@/assets/img/tobecontinued.png'
import jojotext from '@/assets/img/jojotext.gif'
import galaxie from '@/assets/img/Galaxie.png'
import star from '@/assets/img/star.gif'
import coeur from '@/assets/img/Coeur.png'
import alphaImg from '@/assets/img/Alpha.png'
import adminPlanify from '@/assets/img/Admin Planify.png'

const auth = useAuthStore();
const coinsStore = useCoinsStore();
// Format compact pour les grands nombres de coins (10K, 10,1K, 1,2M, etc.)
function formatCoins(value) {
  if (value == null) return '0';
  const n = Number(value);
  if (Number.isNaN(n)) return '0';
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  // Milliards
  if (abs >= 1_000_000_000) {
    const billions = Math.floor(abs / 1_000_000_000);
    const hundredMillions = Math.floor((abs % 1_000_000_000) / 100_000_000);
    return sign + (hundredMillions ? `${billions},${hundredMillions}B` : `${billions}B`);
  }
  // Millions
  if (abs >= 1_000_000) {
    const millions = Math.floor(abs / 1_000_000);
    const hundredThousands = Math.floor((abs % 1_000_000) / 100_000);
    return sign + (hundredThousands ? `${millions},${hundredThousands}M` : `${millions}M`);
  }
  // Milliers (à partir de 10 000)
  if (abs >= 10_000) {
    const thousands = Math.floor(abs / 1_000);
    const hundreds = Math.floor((abs % 1_000) / 100);
    return sign + (hundreds ? `${thousands},${hundreds}K` : `${thousands}K`);
  }
  return String(n);
}

const formattedBalance = computed(() => formatCoins(coinsStore.balance))
// Affichage sous la roue: utilise le même solde pour rester en temps réel
const formattedWheelBalance = computed(() => formatCoins(coinsStore.balance))
const router = useRouter()
const showMobileMenu = ref(false)
const isMobile = ref(false)
const showLoginPopup = ref(false)
const showUserDropdown = ref(false)
const showProfilePopup = ref(false)
const showPassword = ref(false)
const userAvatar = ref(accountIcon)
const fileInput = ref(null)
const fileInputMobile = ref(null)
const lastSpinResult = ref(null)
const justUploadedAvatar = ref(false) // Pour éviter que le watcher écrase l'avatar uploadé

// URL de base pour les avatars
const baseUrl = API_URL.endsWith('/api') 
  ? API_URL.slice(0, -4) // Supprime '/api' de la fin pour avoir l'URL du serveur
  : API_URL.replace('/api', '')

// Variables pour le système de coins
const showFortuneWheel = ref(false)
const timeUntilNextSpin = ref('')
const hoverCloseMobile = ref(false)
const hoverCloseWheel = ref(false)
const hoverCloseProfile = ref(false)

// 2. Ajouter une variable showShopPopup
const showShopPopup = ref(false)

// Fermer le dropdown utilisateur au clic hors zone
function handleGlobalClick(event) {
  try {
    const dropdownEl = document.querySelector('.user-dropdown')
    if (!dropdownEl) { showUserDropdown.value = false; return }
    if (!dropdownEl.contains(event.target)) {
      showUserDropdown.value = false
    }
  } catch {}
}
onMounted(() => document.addEventListener('click', handleGlobalClick, true))
onUnmounted(() => document.removeEventListener('click', handleGlobalClick, true))

// Variables pour les items équipés
const equippedItem = computed(() => coinsStore.equippedItem)
const equippedDynItem = computed(() => {
  const it = coinsStore.equippedItem
  if (it && it.isDynamic) return it
  const id = coinsStore.equippedItemId || it?.id
  if (!id) return null
  const dynItem = dynamicInfoById.value.get(Number(id))
  if (!dynItem) return null
  
  // Si l'item a des variantes, récupérer la variante sélectionnée
  if (dynItem.variants && Array.isArray(dynItem.variants)) {
    const variantIndex = coinsStore.getDynamicItemVariant(Number(id))
    const selectedVariant = dynItem.variants[variantIndex] || dynItem.variants[0]
    
    // Retourner l'item avec les assets de la variante sélectionnée
    return {
      ...dynItem,
      assets: selectedVariant.assets || [],
      backgrounds: selectedVariant.backgrounds || {}
    }
  }
  
  return dynItem
})

function resolveDynSrc(src) {
  try {
    if (typeof src === 'string' && src.startsWith('/uploads/')) {
      const orig = API_URL || ''
      const base = orig.endsWith('/api') ? orig.slice(0, -4) : orig.replace('/api','')
      // Aligner avec Collection/Leaderboard: router via les fonctions API
      if (src.startsWith('/uploads/items/')) {
        const filename = src.split('/').pop()
        return base + '/api/items/uploads/' + filename
      }
      if (src.startsWith('/uploads/avatars/')) {
        const filename = src.split('/').pop()
        return base + '/api/uploads/avatars/' + filename
      }
      return base + src
    }
  } catch {}
  return src
}

function getDynNavbarAssetStyle(asset) {
  const isMob = !!isMobile && !!isMobile.value
  const s = asset
    ? (isMob
        ? (asset.navbarStyleMobile || asset.avatarStyleMobile || asset.style || {})
        : (asset.navbarStyle || asset.avatarStyle || asset.style || {}))
    : {}
  const style = { position: 'absolute', objectFit: s.objectFit || 'contain', zIndex: typeof s.zIndex === 'number' ? s.zIndex : 1 }
  if (typeof s.top === 'number') style.top = s.top + 'px'
  if (typeof s.left === 'number') style.left = s.left + 'px'
  if (typeof s.width === 'number') style.width = s.width + 'px'
  if (typeof s.height === 'number') style.height = s.height + 'px'
  if (typeof s.rotate === 'number') style.transform = `rotate(${s.rotate}deg)`
  return style
}
function getDynNavbarOverlayStyle(asset) {
  const style = getDynNavbarAssetStyle(asset)
  // Respecte le z-index défini dans l'éditeur; défaut = 15 si non spécifié
  if (typeof style.zIndex !== 'number') style.zIndex = 15
  return style
}

// Chargement des items dynamiques pour la Navbar
const dynamicInfoById = ref(new Map())
async function loadDynamicItems() {
  try {
    const res = await secureApiCall('/items')
    if (res && res.success && Array.isArray(res.items)) {
      const map = new Map()
      for (const it of res.items) {
        if (typeof it.legacyId !== 'undefined') {
          map.set(Number(it.legacyId), it)
        }
      }
      dynamicInfoById.value = map
    } else {
      dynamicInfoById.value = new Map()
    }
  } catch {
    dynamicInfoById.value = new Map()
  }
}

onMounted(() => {
  loadDynamicItems()
  try { 
    window.addEventListener('items-changed', loadDynamicItems)
    // Écouter les changements de variantes
    window.addEventListener('dynamic-variant-changed', (event) => {
      console.log('📡 Navbar: Événement dynamic-variant-changed reçu:', event.detail)
      // Forcer la mise à jour du computed equippedDynItem
    })
  } catch {}
})
onUnmounted(() => { 
  try { 
    window.removeEventListener('items-changed', loadDynamicItems)
    window.removeEventListener('dynamic-variant-changed', () => {})
  } catch {} 
})

console.log('🔧 API_URL:', API_URL)
console.log('🔧 baseUrl:', baseUrl)

const user = computed(() => {
  const currentUser = auth.user;
  console.log('👤 Utilisateur actuel complet:', currentUser);
  console.log('🔍 Détails utilisateur:', {
    id: currentUser?.id,
    _id: currentUser?._id,
    username: currentUser?.username,
    role: currentUser?.role,
    year: currentUser?.year,
    groupe: currentUser?.groupe,
    avatar: currentUser?.avatar,
    hasToken: !!currentUser?.token
  });
  return currentUser;
})
const isLoggedIn = computed(() => auth.isLoggedIn)
const isAdmin = computed(() => auth.isAdmin)

const passwordValue = ref('');

// Fonction pour charger l'avatar de l'utilisateur
async function loadUserAvatar() {
  if (!user.value || !user.value.id) {
    userAvatar.value = accountIcon;
    return;
  }

  try {
    if (user.value.avatar && typeof user.value.avatar === 'string') {
      // Si c'est une data URL, l'utiliser directement
      if (user.value.avatar.startsWith('data:')) {
        userAvatar.value = user.value.avatar;
      } else if (user.value.avatar.startsWith('/')) {
        // Si c'est un chemin, construire l'URL complète
        userAvatar.value = `${baseUrl}${user.value.avatar}`;
      } else {
        userAvatar.value = accountIcon;
      }
    } else {
      userAvatar.value = accountIcon;
    }
  } catch (error) {
    console.error('Erreur lors du chargement de l\'avatar:', error);
    userAvatar.value = accountIcon;
  }
}

// Fonctions pour le système de coins
async function openFortuneWheel() {
  // Charger l'état du spin depuis la base de données
  await coinsStore.loadSpinStatus()
  if (coinsStore.canSpinToday) {
    showFortuneWheel.value = true;
    // Réinitialiser l'état
    spinning.value = false
    forcedResultIndex.value = null
    spinMessage.value = ''
    wheelKey.value++
  }
}

function closeFortuneWheel() {
  showFortuneWheel.value = false;
  try { document.body.style.overflow = '' } catch (e) {}
}

// Détection weekend (déplacée plus haut)

// Segments de la roue - valeurs basiques ou x2 le weekend
// Segments x2 du weekend (sans item visuel ni Galaxie)
const weekendSegments = [
  { label: '20 coins', color: '#FFD700' },
  { label: '40 coins', color: '#FF6347' },
  { label: '60 coins', color: '#FFB347' },
  { label: '100 coins', color: '#4682B4' },
  { label: '140 coins', color: '#8A2BE2' },
  { label: '200 coins', color: '#32CD32' },
  { label: 'Perdu', color: '#ccc' }
]
// Segments basiques (sans Galaxie)
const baseSegments = [
  { label: '10 coins', color: '#FFD700' },
  { label: '20 coins', color: '#FF6347' },
  { label: '30 coins', color: '#FFB347' },
  { label: '50 coins', color: '#4682B4' },
  { label: '70 coins', color: '#8A2BE2' },
  { label: '100 coins', color: '#32CD32' },
  { label: 'Perdu', color: '#ccc' }
]

const wheelSegments = computed(() => {
  const hasGalaxy = typeof coinsStore.hasItem === 'function' ? coinsStore.hasItem(25) : false
  if (isWeekend.value === true || testWheelMode.value === 'x2') {
    const week = [...weekendSegments]
    if (!hasGalaxy) {
      week.splice(week.length - 1, 0, { label: '', color: '#3f0b6d', type: 'galaxy', gradientStops: ['#0d0b2d','#3f0b6d','#0b4a6d'] })
    }
    return week
  }
  const basic = [...baseSegments]
  if (!hasGalaxy) {
    basic.splice(basic.length - 1, 0, { label: '', color: '#3f0b6d', type: 'galaxy', gradientStops: ['#0d0b2d','#3f0b6d','#0b4a6d'] })
  }
  return basic
})
const spinMessage = ref('')
const spinning = ref(false)
const wheelKey = ref(0) // pour forcer le reset du composant
const forcedResultIndex = ref(null)
// Mode test
const testWheelMode = ref('basic') // 'basic' | 'x2'

// Fonction pour détecter si c'est le weekend
const isWeekend = computed(() => {
  const today = new Date()
  const dayOfWeek = today.getDay()
  return dayOfWeek === 0 || dayOfWeek === 6 // 0 = dimanche, 6 = samedi
})

function getAccountBorderStyle() {
  // Utiliser la couleur sélectionnée du store (persistée backend)
  const selected = coinsStore.borderColors.find(c => c.id === coinsStore.selectedBorderColor)
  // Si l'item Discord / Galaxie / Coeur / Alpha / Admin Planify est équipé, aucune bordure
  if ((equippedItem && (equippedItem.displayType === 'discord' || equippedItem.name === 'Galaxie' || equippedItem.name === 'Coeur' || equippedItem.name === 'Alpha' || equippedItem.name === 'Admin Planify')) || coinsStore.equippedItemId === 25 || coinsStore.equippedItemId === 26 || coinsStore.equippedItemId === 27 || coinsStore.equippedItemId === 28) {
    return { border: '3px solid transparent', background: 'transparent' }
  }
  if (!selected) return {}
  if (selected.gradient) {
    return {
      border: '3px solid transparent',
      background: `linear-gradient(white, white) padding-box, ${selected.gradient} border-box`
    }
  }
  if (selected.color) {
    return { border: `3px solid ${selected.color}` }
  }
  return {}
}

// Fonction pour gérer l'équipement d'un item
async function handleEquipItem(item) {
  // L'équipement a déjà été fait dans ShopPopup, on ne fait que confirmer
  if (!item) {
    console.log('🎭 Item déséquipé')
    return
  }
  console.log('🎭 Item équipé confirmé:', item.name)
}

// Fonction pour obtenir la classe CSS selon le type d'item
function getEquippedItemClass(itemName) {
  switch (itemName) {
    case 'Oreillettes de chat':
      return 'equipped-cat-ears'
    case 'Matrix':
      return 'equipped-matrix-glasses'
    case 'UwU':
      return 'equipped-uwu'
    case 'Étoiles':
      return 'equipped-stars'
    case 'Cadre royale':
      return 'equipped-royal-frame'
    case 'Roses':
      return 'equipped-rainbow'
    case 'Roi':
      return 'equipped-roi-overlay'
    case 'Gentleman':
      return 'equipped-gentleman-combined'
    case 'Vinyle':
      return 'equipped-vinyle-overlay'
    case 'Advisory':
      return 'equipped-advisory-inside'
    case 'Espace':
      return 'equipped-espace-combined'
    case 'Absolute Cinema':
      return 'equipped-absolute-cinema-overlay'
    case 'Flash':
      return 'equipped-flash-combined'
    case 'Miaou':
      return 'equipped-miaou-combined'
    case 'DVD':
      return 'equipped-dvd-inside'
    case 'Lunettes pixel':
      return 'equipped-lunettes-pixel-inside'
    case '2000':
      return 'equipped-nokia-inside'
    case 'Discord':
      return 'equipped-discord-overlay'
    case 'Galaxie':
      return 'equipped-galaxie-overlay'
    case 'Coeur':
      return 'equipped-coeur-overlay'
    case 'Jojo':
      return 'equipped-jojo-inside'
    default:
      return 'equipped-default'
  }
}

// Fonction pour générer des caractères Matrix aléatoires
function getRandomMatrixChar() {
  const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン'
  return chars[Math.floor(Math.random() * chars.length)]
}

// Nouvelle fonction pour lancer le spin sécurisé
async function handleSpinRequest() {
  spinning.value = true
  spinMessage.value = ''
  
  try {
    const result = await coinsStore.spinWheelWithoutUpdate()
    
    if (result.success) {
      // Chercher l'index du segment correspondant à la récompense
      let index = -1
      if (wheelSegments.value && Array.isArray(wheelSegments.value)) {
        const coinsWon = result.coinsWon ?? 0
        const name = (result.rewardName || '').toLowerCase()
        console.log('🔍 Segments disponibles:', wheelSegments.value)

        // 1) Priorité au libellé retourné par le backend (gère parfaitement "Perdu")
        if (name) {
          index = wheelSegments.value.findIndex(seg => seg.label.toLowerCase() === name)
        }
        // 2) Si non trouvé et gain > 0, essayer par la valeur numérique
        if (index === -1 && coinsWon > 0) {
          index = wheelSegments.value.findIndex(seg => {
            const segCoins = parseInt(seg.label.match(/\d+/)?.[0] || '0')
            return segCoins === coinsWon
          })
        }
        // 2bis) Si récompense item Galaxie, viser explicitement la case Galaxie
        if (index === -1 && (result.rewardItemId === 25 || name === 'galaxie')) {
          index = wheelSegments.value.findIndex(seg => seg.type === 'galaxy' || /galaxie/i.test(seg.label))
        }
        // 3) Si toujours pas trouvé et c'est un "Perdu", viser explicitement la case Perdu
        if (index === -1 && (coinsWon === 0 || /perdu/i.test(name))) {
          index = wheelSegments.value.findIndex(seg => /perdu/i.test(seg.label))
        }
        // 4) Fallback ultime: premier segment
        if (index === -1 || index === undefined) index = 0
      } else {
        console.log('⚠️ wheelSegments non disponible ou invalide:', wheelSegments.value)
        index = 0
      }
      
      console.log('🎯 Index final sélectionné:', index, 'pour la récompense:', result.rewardName)
      if (wheelSegments.value && wheelSegments.value[index]) {
        console.log('🎯 Segment correspondant:', wheelSegments.value[index])
      } else {
        console.log('⚠️ Segment non trouvé à l\'index:', index)
      }
      
      // Stocker le résultat pour l'utiliser dans handleWheelResult
      lastSpinResult.value = result
      
      // Forcer l'animation à s'arrêter sur le bon segment
      forcedResultIndex.value = index
    } else {
      // Si l'utilisateur a déjà tourné la roue, afficher le temps restant
      if (result.message && result.message.includes('déjà tourné')) {
        spinMessage.value = `⏰ Prochain spin : ${timeUntilNextSpin.value}`
      } else {
        spinMessage.value = result.message || 'Erreur lors du tirage de la roue.'
      }
      spinning.value = false
    }
    
  } catch (e) {
    console.error('❌ Erreur lors du spin:', e)
    spinMessage.value = 'Erreur lors du tirage de la roue.'
    spinning.value = false
  }
}

// Nouvelle version de handleWheelResult
async function handleWheelResult(segment) {
  console.log('🎉 Résultat de la roue (animation):', segment)
  
  // Mettre à jour le solde maintenant que l'animation est terminée
  if (lastSpinResult.value && lastSpinResult.value.success) {
    // Mise à jour optimiste immédiate
    if (typeof lastSpinResult.value.newCoins === 'number') {
      coinsStore.balance = lastSpinResult.value.newCoins
    } else if (typeof lastSpinResult.value.coinsWon === 'number') {
      coinsStore.balance = (coinsStore.balance || 0) + lastSpinResult.value.coinsWon
    }
    // Synchronisation avec le backend
    await coinsStore.loadBalance()
    lastSpinResult.value = null
  }
  
  // Gérer le cas Perdu et les récompenses positives
  if (segment.label === 'Perdu') {
    spinMessage.value = `😔 Dommage, vous n'avez rien gagné cette fois-ci !`
  } else if (segment.type === 'galaxy' || (lastSpinResult.value && lastSpinResult.value.rewardItemId === 25)) {
    // Récompense item Galaxie
    spinMessage.value = `Félicitations ! Vous avez obtenu l'item Galaxie !`
    // Recharger l'inventaire immédiatement pour afficher l'item débloqué dans la Collection
    try {
      await coinsStore.loadInventory()
    } catch (e) {}
  } else {
    // Afficher exactement la valeur indiquée par le segment affiché
    const won = parseInt(segment.label.match(/\d+/)?.[0] || '0')
    if (isWeekend.value) {
      spinMessage.value = `🎉 WEEKEND BONUS x2 ! Félicitations ! Vous avez gagné ${won} coins !`
    } else {
      spinMessage.value = `🎉 Félicitations ! Vous avez gagné ${won} coins !`
    }
  }
  
  // Mettre à jour le timer après le spin
  checkSpinAvailability()
  
  // Réinitialiser l'état après un délai pour laisser le temps à l'utilisateur de voir le résultat
  setTimeout(() => {
    // Ne remettre spinning à false que si l'utilisateur peut encore tourner la roue
    if (coinsStore.canSpinToday) {
      spinning.value = false
    }
    forcedResultIndex.value = null
  }, 2000)
}

function checkSpinAvailability() {
  // Vérifier si l'utilisateur peut tourner la roue aujourd'hui
  const lastSpin = coinsStore.lastSpinDate;
  if (lastSpin) {
    const lastSpinTime = new Date(lastSpin);
    const now = new Date();
    const timeDiff = now - lastSpinTime;
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    
    if (hoursDiff < 24) {
      coinsStore.canSpinToday = false;
      const remainingHours = Math.floor(24 - hoursDiff);
      const remainingMinutes = Math.floor((24 - hoursDiff - remainingHours) * 60);
      timeUntilNextSpin.value = `${remainingHours}h ${remainingMinutes}m`;
    } else {
      coinsStore.canSpinToday = true;
      timeUntilNextSpin.value = '';
    }
  } else {
    coinsStore.canSpinToday = true;
    timeUntilNextSpin.value = '';
  }
}

function updateSpinTimer() {
  if (!coinsStore.canSpinToday) {
    checkSpinAvailability();
  }
}

// Contrôles de test (admin)
function toggleTestWheelMode() {
  testWheelMode.value = testWheelMode.value === 'basic' ? 'x2' : 'basic'
  wheelKey.value++
}

async function spinTestOnce() {
  // Ignorer la contrainte de 24h pour les tests
  spinning.value = false
  coinsStore.canSpinToday = true
  await handleSpinRequest()
}

async function loadUserCoins() {
  if (!user.value) return;
  await coinsStore.loadBalance();
}

// Fonction pour changer l'avatar
function changeAvatar() {
  // Utiliser l'input approprié selon le contexte (desktop ou mobile)
  if (isMobile.value) {
    fileInputMobile.value.click();
  } else {
    fileInput.value.click();
  }
  showUserDropdown.value = false;
}

// Fonction pour gérer l'upload d'avatar
async function handleAvatarUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  console.log('📁 Fichier sélectionné:', file.name, 'Taille:', file.size, 'Type:', file.type);

  // Vérifier la taille du fichier (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    alert('Le fichier est trop volumineux. Taille maximale : 5MB');
    return;
  }

  // Vérifier le type de fichier
  if (!file.type.startsWith('image/')) {
    alert('Veuillez sélectionner une image');
    return;
  }

  try {
    const formData = new FormData();
    formData.append('avatar', file);

    console.log('🚀 Upload avatar en cours...');
    console.log('🔑 Token utilisé:', user.value.token ? user.value.token.substring(0, 20) + '...' : 'AUCUN TOKEN');
    console.log('👤 Utilisateur:', user.value);
    
    const response = await axios.post(`${API_URL}/upload-avatar`, formData, {
      headers: {
        'Authorization': `Bearer ${user.value.token}`,
        'Content-Type': 'multipart/form-data'
      }
    });

    console.log('📤 Réponse upload:', response.data);

    if (response.data && response.data.avatar) {
      // L'avatar est maintenant une data URL directement
      userAvatar.value = response.data.avatar;
      console.log('🖼️ Avatar uploadé avec succès');
      
      // Mettre à jour les données utilisateur dans le store et localStorage
      if (user.value) {
        const updatedUser = { 
          ...user.value, 
          avatar: response.data.avatar
        };
        auth.login(updatedUser);
        
        alert('Avatar mis à jour avec succès !');
      }
    } else {
      console.error('❌ Aucun avatar dans la réponse:', response.data);
      alert('Erreur : aucun avatar reçu du serveur');
    }
  } catch (error) {
    console.error('❌ Erreur upload avatar:', error);
    alert('Erreur lors de l\'upload de l\'avatar');
  }

  // Réinitialiser les inputs
  event.target.value = '';
  if (fileInput.value) fileInput.value.value = '';
  if (fileInputMobile.value) fileInputMobile.value.value = '';
}

function openLogin() {
  showLoginPopup.value = true
}
function handleLoginSuccess(payload) {
  auth.login(payload.user);
  showLoginPopup.value = false;
  passwordValue.value = payload.password;
  
  // Charger l'avatar après connexion
  if (payload.user.avatar && typeof payload.user.avatar === 'string') {
    console.log('✅ Avatar trouvé lors de la connexion:', payload.user.avatar);
    
    // Vérifier si c'est une data URL ou un chemin relatif
    if (payload.user.avatar.startsWith('data:')) {
      // C'est une data URL (nouveau format)
      userAvatar.value = payload.user.avatar;
      console.log('🖼️ Avatar data URL chargé');
    } else if (payload.user.avatar.startsWith('/uploads/')) {
      // C'est un chemin relatif vers les uploads (ancien format)
      const avatarUrl = `${baseUrl}${payload.user.avatar}`;
      console.log('🖼️ URL avatar construite:', avatarUrl);
      userAvatar.value = avatarUrl;
    } else {
      // C'est peut-être un nom de fichier simple, essayer de construire l'URL
      const avatarUrl = `${baseUrl}/uploads/avatars/${payload.user.avatar}`;
      console.log('🖼️ URL avatar construite:', avatarUrl);
      userAvatar.value = avatarUrl;
    }
  } else {
    console.log('❌ Pas d\'avatar lors de la connexion, chargement depuis la DB...');
    loadUserAvatar();
  }
  
  // Charger les coins après connexion
  loadUserCoins();
  checkSpinAvailability();
  
  // window.location.reload(); // Commenté car cela peut causer des problèmes avec l'avatar
}
function logout() {
  auth.logout();
  coinsStore.reset();
  showUserDropdown.value = false
  showProfilePopup.value = false
  userAvatar.value = accountIcon; // Remettre l'icône par défaut
  
  router.push('/')
}
async function handleProfile() {
  // Récupérer les données utilisateur complètes depuis la base de données
  if (user.value && (user.value.id || user.value._id)) {
    try {
      console.log('🔄 Récupération des données utilisateur complètes...');
      const response = await secureApiCall('/users/profile');
      
      if (response.success && response.user) {
        console.log('✅ Données utilisateur récupérées:', response.user);
        // Mettre à jour l'utilisateur dans le store avec les données complètes
        auth.login(response.user);
      } else {
        console.log('❌ Erreur lors de la récupération des données utilisateur');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la récupération du profil:', error);
    }
  }
  
  showProfilePopup.value = true
  showUserDropdown.value = false
}
function closeProfilePopup() {
  showProfilePopup.value = false
  showPassword.value = false
}

// Réinitialiser les états de hover à l'ouverture des popups
watch(showFortuneWheel, (v) => {
  if (v === true) {
    hoverCloseWheel.value = false
    try { document.body.style.overflow = 'hidden' } catch (e) {}
  }
})
watch(showProfilePopup, (v) => { if (v === true) hoverCloseProfile.value = false })
watch(showShopPopup, (v) => {
  if (v === true) {
    hoverCloseMobile.value = false
    try { document.body.style.overflow = 'hidden' } catch (e) {}
  } else {
    try { document.body.style.overflow = '' } catch (e) {}
  }
})
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

function goShop() {
  router.push('/boutique')
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
  const roleMap = {
    'admin': 'Administrateur',
    'prof': 'Professeur',
    'delegue': 'Délégué',
    'eleve': 'Élève',
    'etudiant': 'Étudiant'
  };
  return roleMap[role] || role;
}
function afficherAnnee(year) {
  const yearMap = {
    'BUT1': '1ère année BUT',
    'BUT2': '2ème année BUT',
    'BUT3': '3ème année BUT'
  };
  return yearMap[year] || year;
}

// Fonction pour gérer les erreurs de chargement d'image
function handleImageError(event) {
  console.error('❌ Erreur de chargement de l\'image:', event.target.src);
  console.error('Type de src actuel:', typeof event.target.src);
  console.error('Longueur de la src:', event.target.src.length);
  console.error('Début de la src:', event.target.src.substring(0, 100));
  
  // Ne pas revenir automatiquement à l'icône par défaut si c'est une data URL
  if (event.target.src && event.target.src.startsWith('data:')) {
    console.error('C\'est une data URL qui a échoué, vérifier le format');
    // Ne pas changer userAvatar ici pour permettre le débogage
  } else {
    console.log('🔄 Retour à l\'icône par défaut car ce n\'est pas une data URL');
    userAvatar.value = accountIcon;
  }
}

// Fonction pour gérer le chargement réussi d'image
function handleImageLoad(event) {
  console.log('✅ Image chargée avec succès:', event.target.src.substring(0, 100));
  console.log('✅ Dimensions de l\'image:', event.target.naturalWidth, 'x', event.target.naturalHeight);
}

// Fonction de test pour débugger l'affichage de l'avatar
function testAvatarDisplay() {
  // Créer une petite image de test en data URL (un carré rouge 10x10)
  const testDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mP8/5+hnoEIwDiqkL4KAcT9GO0U4BxoAAAAAElFTkSuQmCC';
  console.log('🧪 Test avec une data URL simple');
  userAvatar.value = testDataUrl;
  
  setTimeout(() => {
    console.log('🧪 userAvatar actuel:', userAvatar.value.substring(0, 100));
  }, 100);
}

// Fonction pour obtenir le style de bordure selon l'item équipé
function getBorderStyle() {
  // Se baser sur l'id pour éviter tout problème de casse/nom
  // Si Discord ou Galaxie est équipé, ne pas appliquer de bordure
  if ((equippedItem && (equippedItem.displayType === 'discord' || equippedItem.name === 'Galaxie')) || coinsStore.equippedItemId === 25) {
    return { border: '3px solid transparent', background: 'transparent' }
  }
  if (coinsStore.equippedItemId === 0) {
    const currentBorder = coinsStore.currentBorder;
    if (currentBorder) {
      if (currentBorder.gradient) {
        return {
          border: '3px solid transparent',
          background: `linear-gradient(white, white) padding-box, ${currentBorder.gradient} border-box`
        };
      }
      if (currentBorder.color) {
        return { border: `3px solid ${currentBorder.color}` };
      }
    }
  }
  return {};
}

onMounted(async () => {
  handleResize();
  window.addEventListener('resize', handleResize);
  
  // Charger l'avatar depuis le store auth au montage
  if (user.value && user.value.avatar && typeof user.value.avatar === 'string') {
    // Si c'est une data URL, l'utiliser directement
    if (user.value.avatar.startsWith('data:')) {
      userAvatar.value = user.value.avatar;
      console.log('🖼️ Avatar data URL chargé au montage');
    } else if (user.value.avatar.startsWith('/')) {
      // Si c'est un chemin, construire l'URL complète
      const avatarUrl = `${baseUrl}${user.value.avatar}`;
      userAvatar.value = avatarUrl;
      console.log('🖼️ Avatar URL chargé au montage:', avatarUrl);
    }
  }
    

  
  if (user.value) {
    await coinsStore.initialize();
    checkSpinAvailability();
  }
  
  setInterval(updateSpinTimer, 60000);
  
  // Exposer l'avatar pour le débogage [[memory:4174769]]
  if (typeof window !== 'undefined') {
    window.userAvatar = userAvatar;
  }
});



// Watcher pour surveiller les changements de l'utilisateur
watch(user, async (newUser) => {
  if (newUser && newUser.avatar && typeof newUser.avatar === 'string') {
    // Si c'est une data URL, l'utiliser directement
    if (newUser.avatar.startsWith('data:')) {
      userAvatar.value = newUser.avatar;
    } else if (newUser.avatar.startsWith('/')) {
      // Si c'est un chemin, construire l'URL complète
      userAvatar.value = `${baseUrl}${newUser.avatar}`;
    }
    
    await coinsStore.initialize();
    checkSpinAvailability();
  } else {
    userAvatar.value = accountIcon;
    if (!newUser) {
      coinsStore.reset();
    }
  }
}, { immediate: true });
onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});

// ... existing code ...
async function loadAvatarFromFilename(filename) {
  if (!filename) return null;
  
  try {
    console.log('📥 Chargement de l\'avatar depuis le filename:', filename);
    const avatarUrl = `${API_URL.replace('/api', '')}/api/uploads/avatars/${filename}`;
    
    // Essayer de charger l'image pour vérifier qu'elle existe
    const testImg = new Image();
    return new Promise((resolve) => {
      testImg.onload = () => {
        console.log('✅ Avatar chargé avec succès depuis:', avatarUrl);
        resolve(avatarUrl);
      };
      testImg.onerror = () => {
        console.error('❌ Impossible de charger l\'avatar depuis:', avatarUrl);
        resolve(null);
      };
      testImg.src = avatarUrl;
    });
  } catch (error) {
    console.error('❌ Erreur lors du chargement de l\'avatar:', error);
    return null;
  }
}
</script>

<style>
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
  max-width: 630px;
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
  right: -15px;
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
.fortune-wheel-btn {
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 12px;
  background: #f0f0f0;
  transition: background 0.2s, box-shadow 0.2s;
  font-family: 'Cobe Heavy', Inter, sans-serif;
  font-size: 1em;
  color: #333;
  white-space: nowrap;
}
.fortune-wheel-btn:hover {
  background: #e0e0e0;
  box-shadow: 0 4px 16px #0002;
}
.fortune-wheel-btn:disabled {
  cursor: not-allowed;
  background: #e0e0e0;
  box-shadow: none;
}

.fortune-wheel-btn.disabled {
  cursor: not-allowed !important;
  background: #e0e0e0 !important;
  box-shadow: none !important;
  opacity: 0.6 !important;
}
.fortune-wheel-icon {
  width: 28px;
  height: 28px;
  object-fit: contain;
  border-radius: 50%;
  background: transparent;
  display: inline-block;
  overflow: hidden;
  transition: transform 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
}
.fortune-wheel-icon:hover {
  transform: scale(1.1);
  background: #e0e0e0;
  border-radius: 50%;
  box-shadow: 0 0 0 4px #e0e0e0, 0 4px 16px #0002;
  
}
.coins-display {
  font-size: 1.1em;
  color: #007bff;
  display: flex;
}

.coin-icon {
  width: 20px;
  height: 20px;
  object-fit: contain;
  vertical-align: middle;
  margin-bottom: 2px;
}
.spin-timer {
  font-size: 0.9em;
  color: #666;
  margin-left: 8px;
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

/* 1025–1200px: réglages spécifiques demandés */
@media (min-width: 1025px) and (max-width: 1200px) {

  .coin-icon {
    width: 20px !important;
    height: 20px !important;
  }

  .odoo-menu-link {
    font-family: Cobe-HeavyItalic, "Odoo Unicode Support Noto", sans-serif;
    font-style: italic;
    font-size: 0.80em !important;
    color: #555;
    background: none;
    border: none;
    border-radius: 12px;
    transition: background .18s, color .18s, box-shadow .18s, padding .18s;
    box-shadow: none;
    outline: none;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 10px 24px;
  }

  .odoo-navbar-actions { right: 30px !important; }

  .coins-counter.with-timer { right: -225px !important; }

  .coins-display {
    color: #333;
    font-size: 11px !important;
    gap: 5px;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .fortune-wheel-icon {
    width: 20px !important;
    height: 20px !important;
    object-fit: contain;
    border-radius: 50%;
    background: transparent;
    display: inline-block;
    overflow: hidden;
    transition: transform .2s ease, background .2s ease, box-shadow .2s ease;
  }

  .spin-timer {
    font-size: 11px !important;
    color: #666;
    white-space: nowrap;
  }

  .coins-counter .shop-icon {
    width: 20px;
    height: 20px;
    margin-right: 0px;
    margin-left: 0px;
  }

  .shop-icon {
  width: 28px;
  height: 28px;
  object-fit: contain;
  cursor: pointer;
  border-radius: 50%;
  background: transparent;
  display: inline-block;
  overflow: hidden;
  transition: transform .2s ease, background .2s ease, box-shadow .2s ease;
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
  align-items: flex-end;
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
/* Compteur de coins */
.coins-counter {
    display: flex;
    align-items: center;
    gap: 6px;
    background: #ffffffe6;
    padding: 10px 8px;
    border-radius: 16px;
    box-shadow: 0 2px 8px #0000001a;
    position: absolute;
    right: -210px;
    top: 55% !important;
    transform: translateY(-50%) !important;
    flex-direction: row !important;
}

.coins-separator {
  width: 1px;
  height: 24px;
  background: #e5e7eb;
  border-radius: 1px;
  margin: 0 6px;
}

.coins-counter.with-timer {
    right: -280px;
}

/* Version mobile avec timer */
@media (min-width: 320px) and (max-width: 1024px) {
  .coins-counter.with-timer {
    right: -90px !important;
    top: 175% !important;
  }


  .coins-counter {
    right: -55px !important;
    top: 175% !important;
  }

  /* En mobile: retirer l'arrondi pour l'avatar quand Discord est équipé */
  .account-btn.discord-equipped {
    border-radius: 0 !important;
    overflow: visible !important;
  }
}

.coins-display {
  color: #333;
  font-size: 13px;
  gap: 5px;
  display: flex;
    justify-content: center;
    align-items: center;

}

.fortune-wheel-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  border-radius: 0;
  transition: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Neutralise tout fond/ombre du bouton au survol pour éviter un flash carré */
.fortune-wheel-btn:hover {
  background: transparent !important;
  box-shadow: none !important;
  transform: none !important;
}

.fortune-wheel-btn:disabled {
  /* opacity: .5; */
  cursor: not-allowed;
}
.fortune-wheel-btn:disabled {
  /* opacity: .7; */
  cursor: not-allowed;
  background: transparent !important;
  box-shadow: none !important;
}
/* Applique l'état grisé en restant parfaitement rond sur l'icône elle-même */
.fortune-wheel-btn:disabled .fortune-wheel-icon {
  background: #e0e0e0;
  border-radius: 50%;
  box-shadow: 0 0 0 4px #e0e0e0, 0 2px 8px #0002;
  opacity: 0.6;
}



.fortune-wheel-icon {
  width: 28px;
  height: 28px;
  object-fit: contain;
  border-radius: 50%;
  background: transparent;
  display: inline-block;
  overflow: hidden;
  transition: transform 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
}
.fortune-wheel-icon:hover {
  transform: scale(1.1);
  background: rgba(224,224,224,0.95);
  border-radius: 50%;
  box-shadow: 0 0 0 4px #e0e0e0, 0 4px 16px #0002;
}

.spin-timer {
  font-size: 13px;
  color: #666;
  white-space: nowrap;
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
  position: relative;
  overflow: hidden;
}
.account-btn.discord-equipped, .account-btn.galaxie-equipped { border: 3px solid transparent !important; box-shadow: none !important; }
.account-btn:hover {
  background: none;
}

.account-btn.stars-equipped {
  border: 0px #000000 solid;
}

.account-btn.rainbow-equipped {
  border: 3px pink solid;
}

/* Désactiver toute bordure quand Discord est équipé */
.account-btn.discord-equipped, .account-btn.galaxie-equipped {
  border: 3px solid transparent !important;
  box-shadow: none !important;
  background: none !important;
}

/* La bordure classique sera gérée dynamiquement par getBorderStyle() */
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

/* Styles pour la roue de la fortune */
.fortune-wheel-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.8);
  z-index: 5000;
  display: flex;
  align-items: center;
  justify-content: center;
  overscroll-behavior: contain;
  touch-action: none;
}

.fortune-wheel-modal {
  background: #fff;
  border-radius: 24px;
  box-shadow: 0 8px 32px #0004;
  padding: 60px 32px 32px;
  min-width: 400px;
  max-width: 90vw;
  position: relative;
  text-align: center;
  font-family: Cobe Heavy,Inter,sans-serif;
  max-height: 90vh;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

.fortune-wheel-modal h2 {
  margin-bottom: 8px;
  color: #111;
  font-size: 1.9em;
}

.fortune-wheel-subtitle {
  margin-bottom: 32px;
  color: #666;
  font-size: 1.1em;
  justify-content: center;
    align-items: center;
    flex-direction: column;
    gap: 10px;
    display: flex;
}

.fortune-wheel-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  margin-bottom: 24px;
}

.fortune-wheel-large {
  width: 200px;
  height: 200px;
  object-fit: contain;
  transition: transform 0.3s ease;
}

.fortune-wheel-large:hover {
  transform: scale(1.05);
}

.spin-btn {
  background: linear-gradient(135deg, #007bff, #0056b3);
  color: #fff;
  border: none;
  border-radius: 16px;
  padding: 16px 32px;
  font-size: 1.2em;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px #007bff40;
}

.spin-btn:hover {
  background: linear-gradient(135deg, #0056b3, #004085);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px #007bff60;
}

.spin-btn:active {
  transform: translateY(0);
}

.coins-info {
  border-top: 2px solid #f0f0f0;
  padding-top: 24px;
  margin-top: 24px;
}

.coins-info p {
  margin: 8px 0;
  font-size: 1.1em;
  color: black;
  display: flex;
  justify-content: center;
  align-items: center;
}
.coins-info .coins-value {
  margin-left: 5px;
  margin-right: 2px;
}

.coins-info strong {
  color: #007bff;
  font-size: 1.2em;
  align-items: center;
  display: flex;
}

.spin-info {
  color: #666;
  font-size: 0.9em;
  font-style: italic;
}

/* Ajout du style pour l'alignement et l'espacement */
.coins-profile-row {
  display: flex;
  align-items: center;
  margin-top: 2px;
  margin-bottom: 2px;
}
.coins-profile-row .coins-value {
  margin-left: 3px;
  margin-right: 2px;
}
.coin-icon {
  width: 25px;
  height: 25px;
  object-fit: contain;
  vertical-align: middle;
  margin-bottom: 0;
}
  .spin-message {
    color: #007bff;
    margin: 12px 0 0 0;
    font-size: 1.1em;
    padding: 12px;
    background: #f8f9fa;
    border-radius: 8px;
    border: 2px solid #007bff;
    animation: fadeIn 0.3s ease-in;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: 6px;
  }

/* Styles pour les items équipés par-dessus le bouton account */
.equipped-item-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
  z-index: 15;
}

.equipped-item-overlay-mobile {
  position: absolute;
  top: -2px !important;
  left: 1px !important;
  width: 61px !important;
  height: 61px !important;
  object-fit: contain;
  pointer-events: none;
  z-index: 15;
}

.equipped-cat-ears {
  position: absolute;
    top: -40px;
    left: -10px;
    width: 150%;
    height: 160%;
    object-fit: contain;
    pointer-events: none;
    z-index: 15;
    transform: translate(-5%);
}

.equipped-matrix-glasses {
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.equipped-uwu {
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.equipped-stars {
    top: -2px !important;
    left: 0px !important;
    width: 108% !important;
    height: 107% !important;
    position: absolute !important;
    z-index: 15 !important;
}

/* Alpha overlay (desktop + mobile) */
.equipped-alpha-overlay {
  position: absolute !important;
    top: -2px !important;
    left: 2px !important;
    width: 97% !important;
    height: 108% !important;
    object-fit: contain !important;
    pointer-events: none !important;
    z-index: 15 !important;
}
.equipped-alpha-overlay-mobile {
  position: absolute;
    top: 0px;
    left: 2px;
    width: 98%;
    height: 100%;
    object-fit: contain;
    pointer-events: none;
    z-index: 15;
}

/* Admin Planify overlay (desktop + mobile) */
.equipped-admin-planify-overlay {
  position: absolute !important;
    top: -2px !important;
    left: 2px !important;
    width: 97% !important;
    height: 108% !important;
    object-fit: contain !important;
    pointer-events: none !important;
    z-index: 15 !important;
}
.equipped-admin-planify-overlay-mobile {
  position: absolute;
    top: 0px;
    left: 2px;
    width: 98%;
    height: 100%;
    object-fit: contain;
    pointer-events: none;
    z-index: 15;
}

.equipped-royal-frame {
    position: absolute;
    top: -17px;
    left: -7px;
    width: 159%;
    height: 158%;
    object-fit: contain;
    pointer-events: none;
    z-index: 15;
    transform: translate(-10%);
}

.equipped-discord-overlay {
  position: absolute;
    top: 0px;
    left: -5px;
    width: 109%;
    height: 109%;
    object-fit: contain;
    pointer-events: none;
    z-index: 15;
}

.equipped-discord-overlay-mobile {
  position: absolute;
    top: -3px;
    left: -10px;
    width: 127%;
    height: 125%;
    object-fit: contain;
    pointer-events: none;
    z-index: 15;
}

/* Galaxie = mêmes propriétés que Discord (desktop et mobile) */
.equipped-galaxie-overlay {
  position: absolute !important;
    top: -18px !important;
    left: -18px !important;
    width: 165% !important;
    height: 165% !important;
    object-fit: contain !important;
    pointer-events: none !important;
    z-index: 15 !important;
}
.equipped-galaxie-overlay-mobile {
  position: absolute;
    top: -3px;
    left: -10px;
    width: 127%;
    height: 125%;
    object-fit: contain;
    pointer-events: none;
    z-index: 15;
}

/* Coeur = mêmes propriétés que Galaxie (desktop et mobile) */
.equipped-coeur-overlay {
  position: absolute !important;
    top: -7px !important;
    left: -12px !important;
    width: 145% !important;
    height: 125% !important;
    object-fit: contain !important;
    pointer-events: none !important;
    z-index: 15 !important;
}
.equipped-coeur-overlay-mobile {
  position: absolute;
    top: -7px;
    left: -6px;
    width: 123%;
    height: 125%;
    object-fit: contain;
    pointer-events: none;
    z-index: 15;
}

.equipped-rainbow {
    position: absolute;
    top: -7px;
    left: -1px;
    width: 130%;
    height: 120%;
    transform: translate(-10%);
    pointer-events: none;
    z-index: 15;
}

/* Versions mobiles des items manquants */
.equipped-cat-ears-mobile {
  position: absolute;
  top: -40px;
  left: -10px;
  width: 150%;
  height: 160%;
  object-fit: contain;
  pointer-events: none;
  z-index: 15;
  transform: translate(-5%);
}

.equipped-royal-frame-mobile {
    position: absolute;
    top: -17px;
    left: -7px;
    width: 159%;
    height: 158%;
    object-fit: contain;
    pointer-events: none;
    z-index: 15;
    transform: translate(-10%);
}

.equipped-rainbow-mobile {
    position: absolute;
    top: -7px;
    left: -1px;
    width: 130%;
    height: 120%;
    transform: translate(-10%);
    pointer-events: none;
    z-index: 15;
}

.equipped-default {
  top: -4px;
  left: 0;
  width: 104%;
  height: 115%;
}

/* Styles pour les ailes d'ange par-dessus le bouton account */
.equipped-angel-wings {
  position: absolute;
  top: -53px;
  left: -35px;
  width: 220%;
  height: 148%;
  object-fit: contain;
  pointer-events: none;
  z-index: -1;
}

.equipped-angel-wings-mobile {
  position: absolute;
  top: -50px;
  left: -35px;
  width: 220%;
  height: 148%;
  object-fit: contain;
  pointer-events: none;
  z-index: -1;
}

/* Item Tomb Raider pour l'avatar */
.equipped-tomb-raider {
  position: absolute;
  top: -56px;
  left: -19px;
  width: 160%;
  height: 148%;
  object-fit: contain;
  pointer-events: none;
  z-index: -1;
}

.equipped-tomb-raider-mobile {
  position: absolute;
  top: -38px;
  left: 0px;
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
  z-index: -1;
}

/* Item Clown par-dessus le bouton account */
.equipped-clown-overlay {
  position: absolute;
  top: -23px;
  left: -1px;
  width: 130%;
  height: 130%;
  transform: translate(-10%);
  pointer-events: none;
  z-index: 15;
}

.equipped-clown-overlay-mobile {
  position: absolute;
  top: -23px;
  left: -1px;
  width: 130%;
  height: 130%;
  transform: translate(-10%);
  pointer-events: none;
  z-index: 15;
}

/* Nez de clown centré sur l'avatar */
.equipped-clown-nose {
  position: absolute;
  top: 50%;
  left: 51.4%;
  transform: translate(-50%, -50%);
  width: 50%;
  height: 50%;
  object-fit: contain;
  pointer-events: none;
  z-index: 20;
}

.equipped-clown-nose-mobile {
  position: absolute;
  top: 50%;
  left: 51.4%;
  transform: translate(-50%, -50%);
  width: 50%;
  height: 50%;
  object-fit: contain;
  pointer-events: none;
  z-index: 20;
}

/* Item Cash à l'intérieur de l'avatar */
.equipped-cash-inside {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
  z-index: 5;
}

.equipped-cash-inside-mobile {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
  z-index: 5;
}

/* Item Roi par-dessus le bouton account */
.equipped-roi-overlay {
  position: absolute;
  top: -59px;
  left: -4px;
  width: 130%;
  height: 130%;
  transform: translate(-10%);
  pointer-events: none;
  z-index: 15;
}

.equipped-roi-overlay-mobile {
  position: absolute;
  top: -59px;
  left: -4px;
  width: 130%;
  height: 130%;
  transform: translate(-10%);
  pointer-events: none;
  z-index: 15;
}

/* Item Target à l'intérieur de l'avatar */

.equipped-target-inside {
  position: absolute;
  top: -5px;
  left: -6px;
  width: 128%;
  height: 129%;
  object-fit: cover;
  pointer-events: none;
  z-index: 5;
}

.equipped-target-inside-mobile {
  position: absolute;
  top: -5px;
  left: -6px;
  width: 128%;
  height: 129%;
  object-fit: cover;
  pointer-events: none;
  z-index: 5;
}

.equipped-moustache-inside, .equipped-moustache-inside-mobile {
  position: absolute;
  top: 10px;
  left: 7px;
  width: 80%;
  height: 75%;
  object-fit: cover;
  pointer-events: none;
  z-index: 5;
}

.equipped-gentleman-overlay {
  position: absolute;
  top: -30px;
  left: 0px;
  width: 120%;
  height: 75%;
  transform: translate(-10%);
  pointer-events: none;
  z-index: 15;
}

.equipped-gentleman-overlay-mobile {
  position: absolute;
  top: -30px;
  left: 0px;
  width: 120%;
  height: 75%;
  transform: translate(-10%);
  pointer-events: none;
  z-index: 15;
}

.equipped-vinyle-overlay {
  position: absolute;
  top: -42px;
  left: 5px;
  width: 108%;
  height: 100%;
  transform: translate(-10%);
  pointer-events: none;
  z-index: 15;
}

.equipped-vinyle-overlay-mobile {
  position: absolute;
  top: -42px;
  left: 5px;
  width: 108%;
  height: 100%;
  transform: translate(-10%);
  pointer-events: none;
  z-index: 15;
}

.equipped-absolute-cinema-overlay {
  position: absolute;
  top: -10px;
  left: -15px;
  width: 30%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
  z-index: 15;
}

.equipped-absolute-cinema-overlay-right {
  position: absolute;
  top: -10px;
  left: 59px;
  width: 30%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
  z-index: 15;
  transform: scaleX(-1);
}

.equipped-absolute-cinema-overlay-mobile {
  position: absolute;
  top: -10px;
  left: -15px;
  width: 30%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
  z-index: 15;
}

.equipped-absolute-cinema-overlay-right-mobile {
  position: absolute;
  top: -10px;
  left: 59px;
  width: 30%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
  z-index: 15;
  transform: scaleX(-1);
}

.equipped-camera-overlay {
  position: absolute;
  top: 25px;
  left: 1px;
  width: 60%;
  height: 70%;
  transform: translate(-10%);
  pointer-events: none;
  z-index: 2;
}

.equipped-camera-overlay-mobile {
  position: absolute;
  top: 25px;
  left: 1px;
  width: 60%;
  height: 70%;
  transform: translate(-10%);
  pointer-events: none;
  z-index: 2;
}

.equipped-flash-overlay {
  position: absolute;
  top: -10px;
  left: 15px;
  width: 75%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
  z-index: 1;
}

.equipped-flash-overlay-mobile {
  position: absolute;
  top: -10px;
  left: 15px;
  width: 75%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
  z-index: 1;
}

.equipped-pate-inside {
  position: absolute;
    top: 31px;
    left: 4px;
    width: 40%;
    height: 40%;
    object-fit: cover;
    pointer-events: none;
    z-index: 1;
}

.equipped-chat-overlay {
  position: absolute;
  top: -20px;
  left: 20px;
  width: 100%;
  height: 100%;
  transform: translate(-10%);
  pointer-events: none;
  z-index: 2;
}

.equipped-pate-inside-mobile {
  position: absolute;
  top: 33px;
  left: 3px;
  width: 40%;
  height: 40%;
  object-fit: cover;
  pointer-events: none;
  z-index: 1;
}

.equipped-chat-overlay-mobile {
  position: absolute;
  top: -20px;
  left: 20px;
  width: 100%;
  height: 100%;
  transform: translate(-10%);
  pointer-events: none;
  z-index: 2;
}

.equipped-dvd-inside {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 60%;
  height: 60%;
  object-fit: contain;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 1;
  animation: dvdBounceNavbar 4s linear infinite;
}

.equipped-dvd-inside-mobile {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 60%;
  height: 60%;
  object-fit: contain;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 1;
  animation: dvdBounceNavbar 4s linear infinite;
}

@keyframes dvdBounceNavbar {
  0% {
    top: 30%;
    left: 30%;
  }
  50% {
    top: 70%;
    left: 70%;
  }
  100% {
    top: 30%;
    left: 30%;
  }
}

.equipped-lunettes-pixel-inside {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  object-fit: contain;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 1;
}

.equipped-lunettes-pixel-inside-mobile {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  object-fit: contain;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 1;
}

.equipped-nokia-inside {
  position: absolute;
  top: 72%;
  left: 20%;
  width: 62%;
  height: 100%;
  object-fit: contain;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 1;
}

.equipped-nokia-inside-mobile {
  position: absolute;
  top: 72%;
  left: 20%;
  width: 62%;
  height: 100%;
  object-fit: contain;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 1;
}

.equipped-clippy-inside {
  position: absolute;
  top: 14px;
  left: 30px;
  width: 50%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
  z-index: 2;
}

.equipped-clippy-inside-mobile {
  position: absolute;
    top: 12px;
    left: 28px;
    width: 50%;
    height: 100%;
    object-fit: contain;
    pointer-events: none;
    z-index: 2;
}

.equipped-daftpunk-overlay {
  position: absolute;
  top: -40px;
  left: 3px;
  width: 85%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
  z-index: 25;
}

.equipped-daftpunk-overlay-mobile {
  position: absolute;
  top: -40px;
  left: 3px;
  width: 85%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
  z-index: 25;
}

.equipped-advisory-inside, .equipped-advisory-inside-mobile {
  position: absolute;
  top: 25px;
  left: 20px;
  width: 61%;
  height: 63%;
  object-fit: cover;
  pointer-events: none;
  z-index: 5;
}

/* Jojo - à l'intérieur de l'avatar */
.equipped-jojo-inside, .equipped-jojo-inside-mobile {
  position: absolute;
  bottom: -2px;
  left: 67px;
  width: 121%;
  height: 40%;
  object-fit: contain;
  pointer-events: none;
  z-index: 6;
  /* Boucle standard 4,7s (PNG reste à gauche puis repart) */
  animation: jojo-swipe 4.7s ease-in-out infinite;
  will-change: transform;
}

@keyframes jojo-swipe {
  0% { transform: translateX(0); }
  6% { transform: translateX(-60%); }
  9% { transform: translateX(-110%); }
  62% { transform: translateX(-110%); }
  99% { transform: translateX(-110%); }
  100% { transform: translateX(0); }
}

/* Jojotext - à l'intérieur de l'avatar (superposé) */
.equipped-jojotext-inside, .equipped-jojotext-inside-mobile {
  position: absolute;
    top: -9px;
    right: 4px;
    width: 95%;
    height: 100%;
    object-fit: contain;
    pointer-events: none;
    z-index: 7;
    opacity: 0;
    /* Apparition/disparition sans transition (steps) et durée étendue */
    animation: jojotext-fade 4.7s steps(1, end) infinite;
    will-change: opacity, transform;
}

@keyframes jojotext-fade {
  0%, 8.99% { opacity: 0; }
  /* Phase visible synchronisée avec l'arrivée à gauche (≈9%) */
  9% { opacity: 1; }
  99% { opacity: 1; }
  99.01%, 100% { opacity: 0; }
}

.equipped-spacestars-inside {
  position: absolute;
  top: -10px;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
  z-index: 5;
}

.equipped-spacestars-inside-mobile {
  position: absolute;
    top: -9px;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    pointer-events: none;
    z-index: 5;
}

.equipped-asteroide-overlay {
  position: absolute;
  top: 30px;
  left: 3px;
  width: 55%;
  height: 50%;
  transform: translate(-10%);
  pointer-events: none;
  z-index: 15;
}

.equipped-asteroide-overlay-mobile {
  position: absolute;
    top: 29px;
    left: 1px;
    width: 55%;
    height: 50%;
    transform: translate(-10%);
    pointer-events: none;
    z-index: 15;
}



/* Conteneurs pour l'avatar avec animation Matrix */
.avatar-image-container {
  position: relative;
  width: 100%;
  height: 100%;
}
.avatar-image-container .avatar-img { filter: sepia(0); }
.avatar-image-container.jojo-sepia .avatar-img { animation: jojo-sepia-cycle 4.7s steps(1, end) infinite; }

.avatar-image-container-mobile {
  position: relative;
  width: 51px;
  height: 51px;
}
.avatar-image-container-mobile.jojo-sepia .avatar-img { animation: jojo-sepia-cycle 4.7s steps(1, end) infinite; }

@keyframes jojo-sepia-cycle {
  0%, 8.99% { filter: sepia(0); }
  9%, 99% { filter: sepia(1); }
  99.01%, 100% { filter: sepia(0); }
}

/* Animation Matrix à l'intérieur de l'avatar */
.matrix-rain-inside {
  position: absolute;
  top: -18%;
  left: -8%;
  width: 123%;
  height: 125%;
  pointer-events: none;
  z-index: 5;
  overflow: hidden;
}

.matrix-rain-inside-mobile {
  position: absolute;
  top: -18%;
  left: -8%;
  width: 123%;
  height: 125%;
  pointer-events: none;
  z-index: 5;
  overflow: hidden;
}

.matrix-column {
  position: absolute;
  top: -100%;
  display: flex;
  flex-direction: column;
  animation: matrixFall 3s linear infinite;
}

.matrix-char {
  color: #00ff00;
  font-size: 10px;
  font-family: 'Courier New', monospace;
  font-weight: bold;
  text-shadow: 0 0 5px #00ff00;
  opacity: 0.9;
  margin: 1px 0;
}

@keyframes matrixFall {
  0% {
    top: -100%;
    opacity: 1;
  }
  100% {
    top: 100%;
    opacity: 0;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.equipped-item-overlay[data-v-e1e45e80] {
    position: absolute;
    top: -2px;
    left: -5px;
    width: 120%;
    height: 107%;
    object-fit: contain;
    pointer-events: none;
    z-index: 15;
}

/* 5. Ajouter le style .shop-icon (taille, curseur, marge) */
.shop-icon {
  width: 28px;
  height: 28px;
  object-fit: contain;
  cursor: pointer;
  margin-left: 10px; /* Espacement par rapport à la roue */
    margin-right: 5px;
  border-radius: 50%; /* garde la forme ronde en permanence pour éviter le flash carré */
  background: transparent; /* évite une transition de couleur visible à la sortie */
  display: inline-block;
  overflow: hidden; /* coupe toute zone non arrondie en sortie de hover */
  transition: transform 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
}

.shop-icon:hover {
  transform: scale(1.1);
  background: #e0e0e0;
  border-radius: 50%;
  /* Cercle plus gros via un spread supplémentaire */
  box-shadow: 0 0 0 4px #e0e0e0, 0 4px 16px #0002;
}



/* Styles pour mobile (320px à 1024px) */
/* Close BTN (roulette) – neutraliser fond et bordure */
.fortune-wheel-modal .close-btn { background: none !important; border: none !important; padding: 0px; position: absolute;
    top: 12px;
    right: 16px;
    width: 40px;
    height: 40px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 10;
    transition: transform .25s, filter .25s; }
.fortune-wheel-modal .close-img { width: 32px; height: 32px; display: block; filter: grayscale(0.5) brightness(0.95); transition: transform 0.25s, filter 0.25s; }
.fortune-wheel-modal .close-btn:hover .close-img { transform: scale(1.18); filter: grayscale(0) brightness(1.1); }
@media (min-width: 320px) and (max-width: 1024px) {
  .fortune-wheel-modal {
    padding: 30px 15px 15px;
    min-width: 85vw;
    max-width: 85vw;
    margin: 30px auto;
    max-height: 100vh;
    overflow-y: auto;
  }

  /* Reprend exactement le style du close de la boutique */
  /* Close de la roue retiré dans le DOM -> aucun style nécessaire */
  /* Styles du close supprimés pour laisser une intégration propre côté HTML/CSS */

  .fortune-wheel-modal h2 {
    font-size: 1.6em;
    margin-bottom: 10px;
    margin-top: 30px;
  }

  .fortune-wheel-modal p {
    font-size: 0.9em;
    margin-bottom: 15px;
  }

  .daily-limit-message {
    font-size: 0.85em;
    padding: 10px;
    margin: 10px 0;
  }
}

/* Style pour l'indicateur de weekend bonus */
.weekend-bonus {
  display: inline-block;
  background: linear-gradient(45deg, #ff6b6b, #ffd93d, #6bcf7f, #4ecdc4);
  background-size: 400% 400%;
  animation: weekendGradient 2s ease-in-out infinite;
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  margin-left: 10px;
  font-size: 0.9em;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

@keyframes weekendGradient {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

  .spin-message {
    font-size: 0.9em;
    padding: 8px;
    margin: 8px 0;
  }



.mobile-menu .close-btn { width: 40px !important; height: 40px !important; background: transparent !important; border: none !important; padding: 0 !important; }
.mobile-menu .close-img { width: 32px; height: 32px; display:block; filter: grayscale(0.5) brightness(0.95); transition: transform 0.25s, filter 0.25s; }
.mobile-menu .close-btn:hover .close-img { transform: scale(1.18); filter: grayscale(0) brightness(1.1); }

.profile-popup .close-btn { position: absolute !important; top: 12px !important; right: 16px !important; background: transparent !important; border: none !important; width: 40px !important; height: 40px !important; padding: 0 !important; cursor: pointer !important; }
.profile-popup .close-img { width: 32px; height: 32px; display:block; filter: grayscale(0.5) brightness(0.95); transition: transform 0.25s, filter 0.25s; }
.profile-popup .close-btn:hover .close-img { transform: scale(1.18); filter: grayscale(0) brightness(1.1); }

/* Styles pour les items dynamiques fallback */
.equipped-dynamic-item-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  z-index: 15;
  pointer-events: none;
}

.equipped-dynamic-item-overlay-mobile {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  z-index: 15;
  pointer-events: none;
}
</style>