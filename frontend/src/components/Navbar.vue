<template>
  <header class="odoo-navbar">
    <div class="odoo-top-right-actions" v-if="!isMobile">
      <button class="theme-toggle" @click="toggleDarkManual()" aria-label="Basculer thème">
        {{ isDark ? '🌙' : '☀️' }}
      </button>
    </div>
    <div class="odoo-navbar-inner">
      <div class="odoo-navbar-top">
        <img src="@/assets/img/logo_Planify.webp" alt="Planify logo" class="odoo-logo" @click="goHome" style="cursor:pointer;" />
        <button class="burger-btn" @click="showMobileMenu = true" v-if="isMobile && !showMobileMenu">
          <span data-darkreader-ignore :style="isDark ? 'background: #ffffff !important' : 'background: #222 !important'"></span>
          <span data-darkreader-ignore :style="isDark ? 'background: #ffffff !important' : 'background: #222 !important'"></span>
          <span data-darkreader-ignore :style="isDark ? 'background: #ffffff !important' : 'background: #222 !important'"></span>
        </button>
      </div>
      <div :class="['odoo-navbar-bottom', isLoggedIn ? 'navbar-logged' : 'navbar-guest']" v-if="!isMobile || !showMobileMenu">
        <nav class="odoo-menu">
          <router-link class="odoo-menu-link" to="/" exact-active-class="active">Accueil</router-link>
          <router-link class="odoo-menu-link" to="/devoirs" exact-active-class="active">Devoirs</router-link>
          <router-link class="odoo-menu-link" to="/about" exact-active-class="active">
            À propos
            <span v-if="hasNewPatchNotes" class="new-dot" aria-label="Nouveau"></span>
          </router-link>
          <router-link class="odoo-menu-link" to="/contact" exact-active-class="active">Contact</router-link>
          <button v-if="isAdmin" class="odoo-menu-link odoo-admin-btn" @click="goAdmin">Admin Dashboard</button>
        </nav>
        <div class="odoo-navbar-actions">
          <button v-if="!isLoggedIn" class="odoo-login-btn" @click="openLogin">Se connecter</button>
          <div v-else class="user-account-wrapper" style="position:relative;">
            <!-- Compteur de coins à droite du bouton account -->
            <div class="coins-counter" :class="{ 'with-timer': !coinsStore.canSpinToday }">
                <span class="coins-display">{{ formattedBalance }} <img src="@/assets/son/../img/planicoins.webp" alt="Coin" class="coin-icon" /></span>
                <span class="coins-separator" aria-hidden="true"></span>
                <button class="fortune-wheel-btn" @click="openFortuneWheel" :disabled="!coinsStore.canSpinToday" title="Roue de la fortune">
                  <span class="fortune-wheel-icon-wrap" :class="{ 'fortune-available': coinsStore.canSpinToday }">
                    <img src="@/assets/img/fortune_wheel.webp" alt="Roue de la fortune" class="fortune-wheel-icon" loading="lazy" />
                  </span>
                </button>
                <span v-if="!coinsStore.canSpinToday" class="spin-timer">{{ timeUntilNextSpin }}</span>
                <img src="@/assets/img/icons8-boutique-55.webp" alt="Boutique" class="shop-icon" @click="showShopPopup = true" loading="lazy" />
              </div>
            
            <button class="account-btn" :class="{ 
              'stars-equipped': equippedItem && equippedItem.name === 'Étoiles', 
              'rainbow-equipped': equippedItem && equippedItem.name === 'Roses',
              'classic-border-equipped': equippedItem && equippedItem.name === 'Bordure Classique',
              'discord-equipped': equippedItem && equippedItem.displayType === 'discord',
              'galaxie-equipped': equippedItem && equippedItem.name === 'Galaxie',
              'alpha-equipped': equippedItem && (equippedItem.name === 'Alpha' || equippedItem.displayType === 'alpha'),
              'no-border': !previewBorderColorId && (
                shouldRemoveNavbarBorder() || (
                  (equippedItem && (equippedItem.displayType === 'discord' || equippedItem.name === 'Galaxie' || equippedItem.name === 'Coeur' || equippedItem.name === 'Alpha' || equippedItem.name === 'Admin Planify'))
                  || coinsStore.equippedItemId === 25 || coinsStore.equippedItemId === 26 || coinsStore.equippedItemId === 27 || coinsStore.equippedItemId === 28
                )
              )
            }" data-darkreader-ignore :style="getAccountBorderStyle()" @click="handleDropdown">
              <div class="avatar-image-container" :class="{ 'jojo-sepia': equippedItem && equippedItem.displayType === 'jojo' }" :key="'aic-'+coinsStore.jojoVariantIndex" data-darkreader-ignore>
                <!-- Items dynamiques: "below" à l'intérieur (sous l'avatar) -->
                <template v-if="equippedDynItem && Array.isArray(equippedDynItem.variants) && equippedDynItem.variants.length > 0">
                  <img
                    v-for="(a, ai) in getVariantAssetsForTargetPlacement(equippedDynItem, 'avatar-image-container', 'below')"
                    :key="'dyn-nb-below-'+ai+'-'+dynamicVariantsState"
                    :src="resolveDynSrc(a.src)"
                    :style="getDynNavbarAssetStyle(a)"
                  />
                </template>
                <template v-else-if="equippedDynItem && Array.isArray(equippedDynItem.assets)">
                  <img
                    v-for="(a, ai) in getBaseAssetsForTargetPlacement(equippedDynItem, 'avatar-image-container', 'below')"
                    :key="'dyn-nb-below-'+ai"
                    :src="resolveDynSrc(a.src)"
                    :style="getDynNavbarAssetStyle(a)"
                  />
                </template>
                <img class="avatar-img"
                  :src="userAvatarWithVersion" 
                  alt="Compte" 
                  :style="[
                    (equippedItem && equippedItem.name === '8-Bit' 
                      ? 'width: 100%; height: 100%; object-fit: cover; image-rendering: pixelated; image-rendering: -moz-crisp-edges; image-rendering: crisp-edges; filter: contrast(1.2) brightness(1.1) saturate(1.1);' 
                      : 'width: 100%; height: 100%; object-fit: cover;'
                    ),
                    getSelfAvatarImageStyle()
                  ]"
                  @error="onNavbarAvatarError"
                  @load="handleImageLoad"
                />
                <!-- Items dynamiques: "inside" à l'intérieur (au-dessus de l'avatar) -->
                <template v-if="equippedDynItem && Array.isArray(equippedDynItem.variants) && equippedDynItem.variants.length > 0">
                  <img
                    v-for="(a, ai) in getVariantAssetsForTargetPlacement(equippedDynItem, 'avatar-image-container', 'inside')"
                    :key="'dyn-nb-inside-'+ai+'-'+dynamicVariantsState"
                    :src="resolveDynSrc(a.src)"
                    :style="getDynNavbarAssetStyle(a)"
                  />
                </template>
                <template v-else-if="equippedDynItem && Array.isArray(equippedDynItem.assets)">
                  <img
                    v-for="(a, ai) in getBaseAssetsForTargetPlacement(equippedDynItem, 'avatar-image-container', 'inside')"
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
            <!-- Items dynamiques ciblés sur account-btn (en-dehors de avatar-image-container) -->
            <template v-if="equippedDynItem">
              <img
                v-for="(a, ai) in getNavbarAssetsForTargetPlacement(equippedDynItem, 'user-account-wrapper', 'below')"
                :key="'dyn-nb-acc-below-'+ai+'-'+navbarVariantUpdateKey"
                :src="resolveDynSrc(a.src)"
                :style="getDynNavbarAssetStyle(a)"
              />
              <img
                v-for="(a, ai) in getNavbarAssetsForTargetPlacement(equippedDynItem, 'user-account-wrapper', 'inside')"
                :key="'dyn-nb-acc-inside-'+ai+'-'+navbarVariantUpdateKey"
                :src="resolveDynSrc(a.src)"
                :style="getDynNavbarAssetStyle(a)"
              />
            </template>
            <!-- Items dynamiques: "above" au-dessus du bouton account -->
            <template v-if="equippedDynItem && Array.isArray(equippedDynItem.variants) && equippedDynItem.variants.length > 0">
              <img
                v-for="(a, ai) in getDynVariantAssetsForNavbar(equippedDynItem)"
                v-if="a && a.meta && a.meta.navbarPlacement === 'above' && isNavbarAssetTargetingAccountBtn(equippedDynItem, a)"
                :key="'dyn-nb-above-'+ai+'-'+dynamicVariantsState"
                :src="resolveDynSrc(a.src)"
                :style="getDynNavbarOverlayStyle(a)"
              />
            </template>
            <template v-else-if="equippedDynItem && Array.isArray(equippedDynItem.assets)">
              <img
                v-for="(a, ai) in equippedDynItem.assets"
                v-if="a && a.meta && a.meta.navbarPlacement === 'above' && isNavbarAssetTargetingAccountBtn(equippedDynItem, a)"
                :key="'dyn-nb-above-'+ai"
                :src="resolveDynSrc(a.src)"
                :style="getDynNavbarOverlayStyle(a)"
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
              :src="equippedItem.img || angelwings" 
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
              <button class="dropdown-item" @click="openRedeemPopup">Entrer un code</button>
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
            <a class="odoo-menu-link" @click="handleAboutMobile">
          À propos
          <span v-if="hasNewPatchNotes" class="new-dot" aria-label="Nouveau"></span>
        </a>
            <a class="odoo-menu-link" @click="handleContactMobile">Contact</a>
            <button v-if="isAdmin" class="odoo-menu-link odoo-admin-btn" @click="handleAdminMobile">Admin Dashboard</button>
            <button v-if="!isLoggedIn" class="odoo-login-btn" @click="openLogin">Se connecter</button>
            <div v-else class="user-account-wrapper" style="position:relative;">
              <!-- Compteur de coins dans le menu mobile -->
              <div class="coins-counter" :class="{ 'with-timer': !coinsStore.canSpinToday }">
                <span class="coins-display">{{ formattedBalance }} <img src="@/assets/img/planicoins.webp" alt="Coin" class="coin-icon" /></span>
                <span class="coins-separator" aria-hidden="true"></span>
                <button class="fortune-wheel-btn" @click="openFortuneWheel" :disabled="!coinsStore.canSpinToday" title="Roue de la fortune">
                    <span class="fortune-wheel-icon-wrap" :class="{ 'fortune-available': coinsStore.canSpinToday }">
                      <img src="@/assets/img/fortune_wheel.webp" alt="Roue de la fortune" class="fortune-wheel-icon" loading="lazy" />
                    </span>
                  </button>
                <span v-if="!coinsStore.canSpinToday" class="spin-timer">{{ timeUntilNextSpin }}</span>
                <img src="@/assets/img/icons8-boutique-55.webp" alt="Boutique" class="shop-icon" @click="showShopPopup = true" loading="lazy" />
              </div>
              <!-- account-btn (mobile) -->
              <button class="account-btn" :class="{ 
              'stars-equipped': equippedItem && equippedItem.name === 'Étoiles', 
              'rainbow-equipped': equippedItem && equippedItem.name === 'Roses', 
              'discord-equipped': equippedItem && equippedItem.displayType === 'discord', 
              'galaxie-equipped': equippedItem && equippedItem.name === 'Galaxie', 
              'alpha-equipped': equippedItem && (equippedItem.name === 'Alpha' || equippedItem.displayType === 'alpha'),
              'no-border': !previewBorderColorId && (
                shouldRemoveNavbarBorder() || (
                  (equippedItem && (equippedItem.displayType === 'discord' || equippedItem.name === 'Galaxie' || equippedItem.name === 'Coeur' || equippedItem.name === 'Alpha' || equippedItem.name === 'Admin Planify'))
                  || coinsStore.equippedItemId === 25 || coinsStore.equippedItemId === 26 || coinsStore.equippedItemId === 27 || coinsStore.equippedItemId === 28
                )
              )
            }" :style="getAccountBorderStyle()" @click="handleDropdown">
                <div class="avatar-image-container-mobile" :class="{ 'jojo-sepia': equippedItem && equippedItem.displayType === 'jojo' }" :key="'aicm-'+coinsStore.jojoVariantIndex" data-darkreader-ignore>
                  <!-- Dyn (mobile): below -->
                  <template v-if="equippedDynItem && Array.isArray(equippedDynItem.variants) && equippedDynItem.variants.length > 0">
                    <img
                      v-for="(a, ai) in getDynVariantAssetsForNavbar(equippedDynItem)"
                      v-if="a && a.meta && a.meta.navbarPlacement === 'below'"
                      :key="'dyn-m-below-'+ai+'-'+dynamicVariantsState"
                      :src="resolveDynSrc(a.src)"
                      :style="getDynNavbarAssetStyle(a)"
                    />
                  </template>
                  <template v-else-if="equippedDynItem && Array.isArray(equippedDynItem.assets)">
                    <img
                      v-for="(a, ai) in equippedDynItem.assets"
                      v-if="a && a.meta && a.meta.navbarPlacement === 'below'"
                      :key="'dyn-m-below-'+ai"
                      :src="resolveDynSrc(a.src)"
                      :style="getDynNavbarAssetStyle(a)"
                    />
                  </template>
                  <img class="avatar-img"
                    :src="userAvatarWithVersion" 
                    alt="Compte" 
                    :style="[
                      (equippedItem && equippedItem.name === '8-Bit' 
                        ? 'width: 51px; height: 51px; object-fit: cover; image-rendering: pixelated; image-rendering: -moz-crisp-edges; image-rendering: crisp-edges; filter: contrast(1.2) brightness(1.1) saturate(1.1);' 
                        : 'width: 51px; height: 51px; object-fit: cover;'
                      ),
                      getSelfAvatarImageStyle()
                    ]"
                    @error="onNavbarAvatarError"
                    @load="handleImageLoad"
                  />
                  <!-- Dyn (mobile): inside -->
                  <template v-if="equippedDynItem && Array.isArray(equippedDynItem.variants) && equippedDynItem.variants.length > 0">
                    <img
                      v-for="(a, ai) in getDynVariantAssetsForNavbar(equippedDynItem)"
                      v-if="a && a.meta && a.meta.navbarPlacement === 'inside'"
                      :key="'dyn-m-inside-'+ai+'-'+dynamicVariantsState"
                      :src="resolveDynSrc(a.src)"
                      :style="getDynNavbarAssetStyle(a)"
                    />
                  </template>
                  <template v-else-if="equippedDynItem && Array.isArray(equippedDynItem.assets)">
                    <img
                      v-for="(a, ai) in equippedDynItem.assets"
                      v-if="a && a.meta && a.meta.navbarPlacement === 'inside'"
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
            <template v-if="equippedDynItem && Array.isArray(equippedDynItem.variants) && equippedDynItem.variants.length > 0">
              <img
                v-for="(a, ai) in getDynVariantAssetsForNavbar(equippedDynItem)"
                v-if="!a || !a.meta || a.meta.navbarPlacement === 'above'"
                :key="'dyn-m-above-'+ai+'-'+dynamicVariantsState"
                :src="resolveDynSrc(a.src)"
                :style="getDynNavbarOverlayStyle(a)"
              />
            </template>
            <template v-else-if="equippedDynItem && Array.isArray(equippedDynItem.assets)">
              <img
                v-for="(a, ai) in equippedDynItem.assets"
                v-if="!a || !a.meta || a.meta.navbarPlacement === 'above'"
                :key="'dyn-m-above-'+ai"
                :src="resolveDynSrc(a.src)"
                :style="getDynNavbarOverlayStyle(a)"
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
                :src="equippedItem.img || angelwings" 
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
                <button class="dropdown-item" @click="openRedeemPopup">Entrer un code</button>
                <button class="dropdown-item" @click="logout">Déconnexion</button>
              </div>
            </div>
            <!-- Toggle de thème en bas du menu burger (mobile) -->
            <button class="theme-toggle" @click="toggleDarkManual()" aria-label="Basculer thème">
              {{ isDark ? '🌙' : '☀️' }}
            </button>
          </nav>
        </div>
      </transition>
    </div>
    <LoginPopup v-if="showLoginPopup" @close="showLoginPopup = false" @login-success="handleLoginSuccess" />
    <EphemeralPopup />
    <ForgotPasswordPopup v-if="showForgotPasswordProfile" @close="showForgotPasswordProfile = false" />
    
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
          <span v-if="isWeekend" class="weekend-bonus">🎉 WEEKEND BONUS x1.5 !</span>
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
            :show-protection-indicators="showProtectionIndicators"
            :loss-streak="coinsStore.lossStreak"
            :protection-ready="coinsStore.protectionReady"
            @spin-request="handleSpinRequest"
            @result="handleWheelResult"
          />
          <!-- Contrôles de test visibles pour tous -->
          <div v-if="isAdmin" class="wheel-test-controls">
            <button class="test-btn" @click="spinTestOnce">Spin test (infini)</button>
            <button class="test-btn" @click="toggleTestWheelMode">
              {{ testWheelMode === 'x2' ? 'Basique' : 'Roue x2' }}
            </button>
            <button class="test-btn" @click="forceLossOnce">Forcer Perdu</button>
          </div>
        </div>
        
                <div class="coins-info">
          <p>
            Vos PlanifyCoins actuels :
            <span class="coins-value">{{ formattedWheelBalance }}</span>
            <img src="@/assets/img/planicoins.webp" alt="Coin" class="coin-icon" />
          </p>
          <p class="spin-info">
            <span v-if="coinsStore.canSpinToday" class="spin-available">Tous les weekends la roue est x1.5 !</span>
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
        <!-- Aperçu avatar + item/bordure (nouveau) -->
        <div class="profile-avatar-wrap">
          <!-- NOUVEAU: wrapper externe pour permettre aux overlays de dépasser -->
          <div
            class="profile-avatar-stage"
            :class="{
              'no-border': (equippedItem && (equippedItem.displayType === 'discord' || equippedItem.name === 'Galaxie' || equippedItem.name === 'Coeur' || equippedItem.name === 'Prestige' || equippedItem.name === 'Planify' || equippedItem.name === 'Alpha'))
                          || (equippedDynItem && shouldRemoveProfilePopupBorder(equippedDynItem))
            }"
          >
            <div class="profile-avatar-scaler" data-darkreader-ignore>
              <div
                class="profile-avatar"
                data-darkreader-ignore
                :style="getAccountBorderStyle()"
                :class="{
                  'jojo-sepia': equippedItem && equippedItem.displayType === 'jojo',
                  'no-border': (equippedItem && (equippedItem.displayType === 'discord' || equippedItem.name === 'Galaxie' || equippedItem.name === 'Coeur' || equippedItem.name === 'Prestige' || equippedItem.name === 'Planify' || equippedItem.name === 'Alpha'))
                               || (equippedDynItem && shouldRemoveProfilePopupBorder(equippedDynItem))
                }"
              >
                <!-- Dyn: below (à l’intérieur du carré) -->
                <template v-if="equippedDynItem && Array.isArray(equippedDynItem.variants) && equippedDynItem.variants.length > 0">
                  <!-- AVANT: getDynVariantAssetsForNavbar + v-if navbarPlacement === 'below' -->
                  <!-- APRES: getProfilePopupAssetsForTargetPlacement(equippedDynItem, 'profile-avatar', 'below') -->
                  <img
                    v-for="(a, ai) in getProfilePopupAssetsForTargetPlacement(equippedDynItem, 'profile-avatar', 'below')"
                    :key="'profile-dyn-below-'+ai+'-'+dynamicVariantsState"
                    :src="resolveDynSrc(a.src)"
                    :style="getDynProfilePopupAssetStyle(a)"
                  />
                </template>
                <template v-else-if="equippedDynItem && Array.isArray(equippedDynItem.assets)">
                  <img
                    v-for="(a, ai) in getProfilePopupAssetsForTargetPlacement(equippedDynItem, 'profile-avatar', 'below')"
                    :key="'profile-base-below-'+ai"
                    :src="resolveDynSrc(a.src)"
                    :style="getDynProfilePopupAssetStyle(a)"
                  />
                </template>

                <!-- Avatar -->
                <img
                  class="avatar-img"
                  :src="userAvatarWithVersion"
                  alt="Compte"
                  :style="[
                    (equippedItem && equippedItem.name === '8-Bit'
                      ? 'width: 100%; height: 100%; object-fit: cover; image-rendering: pixelated; image-rendering: -moz-crisp-edges; image-rendering: crisp-edges; filter: contrast(1.2) brightness(1.1) saturate(1.1);'
                      : 'width: 100%; height: 100%; object-fit: cover;'
                    ),
                    getSelfAvatarImageStyle()
                  ]"
                  @error="onNavbarAvatarError"
                  @load="handleImageLoad"
                />

                <!-- Dyn: inside (à l’intérieur du carré) -->
                <template v-if="equippedDynItem && Array.isArray(equippedDynItem.variants) && equippedDynItem.variants.length > 0">
                  <img
                    v-for="(a, ai) in getProfilePopupAssetsForTargetPlacement(equippedDynItem, 'profile-avatar', 'inside')"
                    :key="'profile-dyn-inside-'+ai+'-'+dynamicVariantsState"
                    :src="resolveDynSrc(a.src)"
                    :style="getDynProfilePopupAssetStyle(a)"
                  />
                </template>
                <template v-else-if="equippedDynItem && Array.isArray(equippedDynItem.assets)">
                  <img
                    v-for="(a, ai) in getProfilePopupAssetsForTargetPlacement(equippedDynItem, 'profile-avatar', 'inside')"
                    :key="'profile-base-inside-'+ai"
                    :src="resolveDynSrc(a.src)"
                    :style="getDynProfilePopupAssetStyle(a)"
                  />
                </template>

                <!-- Items statiques INSIDE (comme dans la navbar) -->
                <!-- Matrix rain -->
                <div v-if="equippedItem && equippedItem.displayType === 'matrix'" class="matrix-rain-inside">
                  <div class="matrix-column" v-for="i in 15" :key="i" :style="{ left: (i * 6.67) + '%', animationDelay: (Math.random() * 2) + 's' }">
                    <span v-for="j in 6" :key="j" class="matrix-char">{{ getRandomMatrixChar() }}</span>
                  </div>
                </div>
                <!-- Cash / Target / Advisory -->
                <img v-if="equippedItem && equippedItem.displayType === 'cash'" :src="cash" :alt="equippedItem.name" class="equipped-cash-inside" />
                <img v-if="equippedItem && equippedItem.displayType === 'target'" :src="target" :alt="equippedItem.name" class="equipped-target-inside" />
                <img v-if="equippedItem && equippedItem.displayType === 'advisory'" :src="advisory" :alt="equippedItem.name" class="equipped-advisory-inside" />
                <!-- Jojo -->
                <img v-if="equippedItem && equippedItem.displayType === 'jojo'" :src="jojo" :alt="equippedItem.name" class="equipped-jojo-inside" :key="'jojo-'+coinsStore.jojoVariantIndex" />
                <img v-if="equippedItem && equippedItem.displayType === 'jojo' && coinsStore.jojoVariantIndex === 1" :src="jojotext" :alt="equippedItem.name" class="equipped-jojotext-inside" :key="'jojotext-'+coinsStore.jojoVariantIndex" />
                <!-- Espace -->
                <img v-if="equippedItem && equippedItem.displayType === 'espace'" :src="spacestars" :alt="equippedItem.name" class="equipped-spacestars-inside" />
                <!-- DVD / Lunettes pixel -->
                <img v-if="equippedItem && equippedItem.displayType === 'dvd'" :src="dvd" :alt="equippedItem.name" class="equipped-dvd-inside" />
                <img v-if="equippedItem && equippedItem.displayType === 'lunettes-pixel'" :src="mlglunette" :alt="equippedItem.name" class="equipped-lunettes-pixel-inside" />
                <!-- Nokia + Clippy -->
                <img v-if="equippedItem && equippedItem.displayType === 'nokia'" :src="nokia" :alt="equippedItem.name" class="equipped-nokia-inside" />
                <img v-if="equippedItem && equippedItem.displayType === 'nokia'" :src="clippy" :alt="equippedItem.name" class="equipped-clippy-inside" />
                <!-- Gentleman moustache -->
                <img v-if="equippedItem && equippedItem.displayType === 'gentleman'" :src="moustache" :alt="equippedItem.name" class="equipped-moustache-inside" />
                <!-- Clown nose -->
                <img v-if="equippedItem && equippedItem.displayType === 'clown'" :src="clownnose" alt="Nez de clown" class="equipped-clown-nose" />
              </div>

              <!-- Dyn: extérieur (profile-avatar-scaler) -->
              <template v-if="equippedDynItem">
                <img
                  v-for="(a, ai) in getProfilePopupAssetsForTargetPlacement(equippedDynItem, 'profile-avatar-scaler', 'below')"
                  :key="'pp-scaler-below-'+ai+'-'+navbarVariantUpdateKey"
                  :src="resolveDynSrc(a.src)"
                  :style="getDynProfilePopupAssetStyle(a)"
                />
                <img
                  v-for="(a, ai) in getProfilePopupAssetsForTargetPlacement(equippedDynItem, 'profile-avatar-scaler', 'inside')"
                  :key="'pp-scaler-inside-'+ai+'-'+navbarVariantUpdateKey"
                  :src="resolveDynSrc(a.src)"
                  :style="getDynProfilePopupAssetStyle(a)"
                />
              </template>

              <!-- Items statiques ABOVE (au-dessus du carré) -->
              <img v-if="equippedItem && equippedItem.displayType === 'discord'" :src="[discordon, discordnepasderange, discordderange][coinsStore.discordVariantIndex]" :alt="equippedItem.name" class="equipped-discord-overlay" />
              <img v-if="equippedItem && equippedItem.name === 'Galaxie'" :src="galaxie" :alt="equippedItem.name" class="equipped-galaxie-overlay" />
              <img v-if="equippedItem && (equippedItem.name === 'Coeur' || equippedItem.displayType === 'coeur')" :src="coeur" :alt="equippedItem.name" class="equipped-coeur-overlay" />
              <img v-if="equippedItem && equippedItem.displayType === 'cat-ears'" :src="equippedItem.img" :alt="equippedItem.name" class="equipped-cat-ears" />
              <img v-if="equippedItem && equippedItem.displayType === 'royal-frame'" :src="equippedItem.img" :alt="equippedItem.name" class="equipped-royal-frame" />
              <img v-if="equippedItem && equippedItem.displayType === 'rainbow'" :src="equippedItem.img" :alt="equippedItem.name" class="equipped-rainbow" />
              <img v-if="equippedItem && equippedItem.displayType === 'absolute-cinema'" :src="bras" :alt="equippedItem.name" class="equipped-absolute-cinema-overlay" />
              <img v-if="equippedItem && equippedItem.displayType === 'absolute-cinema'" :src="bras" :alt="equippedItem.name" class="equipped-absolute-cinema-overlay-right" />

              <!-- AJOUTS manquants alignés avec la navbar -->
              <img v-if="equippedItem && (equippedItem.displayType === 'etoiles' || equippedItem.name === 'Étoiles')" :src="star" :alt="equippedItem.name" class="equipped-stars" />
              <img v-if="equippedItem && (equippedItem.displayType === 'alpha' || equippedItem.name === 'Alpha')" :src="alphaImg" :alt="equippedItem.name" class="equipped-alpha-overlay" />
              <img v-if="equippedItem && (equippedItem.displayType === 'admin-planify' || equippedItem.name === 'Admin Planify')" :src="adminPlanify" :alt="equippedItem.name" class="equipped-admin-planify-overlay" />
              <img v-if="equippedItem && equippedItem.displayType === 'tomb-raider'" :src="laracroft" :alt="equippedItem.name" class="equipped-tomb-raider" />
              <img v-if="equippedItem && equippedItem.displayType === 'clown'" :src="clowncheveux" :alt="equippedItem.name" class="equipped-clown-overlay" />
              <img v-if="equippedItem && equippedItem.displayType === 'roi'" :src="roi" :alt="equippedItem.name" class="equipped-roi-overlay" />
              <img v-if="equippedItem && equippedItem.displayType === 'gentleman'" :src="gentleman" :alt="equippedItem.name" class="equipped-gentleman-overlay" />
              <img v-if="equippedItem && equippedItem.displayType === 'vinyle'" :src="vinyle" :alt="equippedItem.name" class="equipped-vinyle-overlay" />
              <img v-if="equippedItem && equippedItem.displayType === 'flash'" :src="flash" :alt="equippedItem.name" class="equipped-flash-overlay" />
              <img v-if="equippedItem && equippedItem.displayType === 'flash'" :src="camera" :alt="equippedItem.name" class="equipped-camera-overlay" />
              <img v-if="equippedItem && equippedItem.displayType === 'miaou'" :src="chat" :alt="equippedItem.name" class="equipped-chat-overlay" />
              <img v-if="equippedItem && equippedItem.displayType === 'miaou'" :src="pate" :alt="equippedItem.name" class="equipped-pate-overlay" />
              <img v-if="equippedItem && equippedItem.displayType === 'nokia'" :src="daftpunk" :alt="equippedItem.name" class="equipped-daftpunk-overlay" />
              <img v-if="equippedItem && equippedItem.displayType === 'espace'" :src="asteroide" :alt="equippedItem.name" class="equipped-asteroide-overlay" />
              <img v-if="equippedItem && equippedItem.displayType === 'angel'" :src="equippedItem.img || angelwings" :alt="equippedItem.name" class="equipped-angel-wings" />

              <!-- Fallback générique -->
              <img
                v-if="equippedItem && equippedItem.displayType === 'generic' && equippedItem.img && !equippedDynItem && equippedItem.name !== 'Galaxie' && equippedItem.name !== 'Coeur' && equippedItem.name !== 'Étoiles'"
                :src="equippedItem.img"
                :alt="equippedItem.name"
                class="equipped-galaxie-overlay"
                :class="getEquippedItemClass(equippedItem.name)"
              />

              <!-- Dyn: above (au-dessus du carré avatar) -->
              <template v-if="equippedDynItem && Array.isArray(equippedDynItem.variants) && equippedDynItem.variants.length > 0">
                <img
                  v-for="(a, ai) in getProfilePopupAssetsForTargetPlacement(equippedDynItem, 'profile-avatar', 'above')"
                  :key="'profile-dyn-above-'+ai+'-'+dynamicVariantsState"
                  :src="resolveDynSrc(a.src)"
                  :style="getDynProfilePopupAssetStyle(a)"
                />
              </template>
              <template v-else-if="equippedDynItem && Array.isArray(equippedDynItem.assets)">
                <img
                  v-for="(a, ai) in getProfilePopupAssetsForTargetPlacement(equippedDynItem, 'profile-avatar', 'above')"
                  :key="'profile-base-above-'+ai"
                  :src="resolveDynSrc(a.src)"
                  :style="getDynProfilePopupAssetStyle(a)"
                />
              </template>

              <!-- Extérieur “above” -->
              <template v-if="equippedDynItem">
                <img
                  v-for="(a, ai) in getProfilePopupAssetsForTargetPlacement(equippedDynItem, 'profile-avatar-scaler', 'above')"
                  :key="'pp-scaler-above-'+ai+'-'+navbarVariantUpdateKey"
                  :src="resolveDynSrc(a.src)"
                  :style="getDynProfilePopupAssetStyle(a)"
                />
              </template>
            </div>
          </div>
          <div class="equipped-item-name" v-if="equippedItem && equippedItem.name">Item équipé: {{ equippedItem.name }}</div>
        </div>
        <!-- Fin ajout -->
        <div class="profile-info">
          <div><strong>Nom d'utilisateur :</strong> {{ user?.username || user?.name || 'Utilisateur' }}</div>
          <div><strong>Rôle :</strong> {{ user?.role ? afficherRole(user.role) : 'Non défini' }}</div>
          <div><strong>Année :</strong> {{ user?.year ? afficherAnnee(user.year) : 'Non définie' }}</div>
          <div><strong>Groupe :</strong> {{ user?.groupe || 'Non défini' }}</div>
          <div v-if="user?.specialite"><strong>Spécialité :</strong> {{ afficherSpecialite(user.specialite) }}</div>
          <div class="coins-profile-row">
            <strong>PlanifyCoins :</strong>
            <span class="coins-value">{{ formattedBalance }}</span>
            <img src="@/assets/img/planicoins.webp" alt="Coin" class="coin-icon" />
          </div>
        </div>

        <!-- Lien Mot de passe oublié (comme dans le Login) -->
        <div class="forgot-password-link" style="margin-top: 10px; text-align: center;">
          <a href="#" @click.prevent="openForgotFromProfile()">Mot de passe oublié&nbsp;?</a>
        </div>

        <!-- Note publique: visible par tous -->
        <div class="public-note-block" style="margin-top: 10px; width: 100%;">
          <textarea
            id="public-note"
            v-model="publicNoteDraft"
            rows="3"
            maxlength="60"
            placeholder="Écris une note (max 60 caractères)"
            style="width:100%; height: 42px; font-size: 11px; padding:10px; border:1px solid #ddd; border-radius:8px; resize: vertical; color:#000000;"
            @focus="suspendPublicNoteSync"
            @blur="resumePublicNoteSync"
          ></textarea>
          <div style="display:flex; align-items:center; gap:10px;">
            <button
              class="logout-btn"
              style="background-color: #10b981 !important; border-color: #10b981 !important;"
              @click="savePublicNote"
              :disabled="savingPublicNote"
            >
              {{ savingPublicNote ? 'Enregistrement...' : 'Enregistrer la note' }}
            </button>
            <span v-if="savePublicNoteMessage" style="color:#000000;">{{ savePublicNoteMessage }}</span>
          </div>
        </div>

        <div class="profile-music-uploader" v-if="user">
          <h4 style="margin: 0px 0 6px; color: #111;">Musique du profil</h4>
          <div class="music-upload-row">
    <!-- Champ titre supprimé: le backend prend le nom du fichier -->
    <input
      class="file-input-large"
      type="file"
      accept=".mp3,audio/mpeg"
      @change="onMusicFileChange"
    />
    <button
      class="logout-btn"
      style="background-color: #10b981 !important; border-color: #10b981 !important; width: auto; padding: 10px 16px;"
      @click="handleMusicUpload"
      :disabled="musicUploading"
    >
      {{ musicUploading ? 'Upload...' : 'Uploader le MP3' }}
    </button>
  </div>

          <!-- Ajout: contrôle de volume pour la musique de profil -->
          <div v-if="user && user.musicSrc" class="profile-volume" style="display:flex; justify-content: center; align-items:center; gap:8px; margin-top:8px;">
            <span style="font-size:12px; color:#000;">Volume</span>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              v-model.number="musicVolume"
              aria-label="Volume musique de profil"
              style="width:140px;"
            />
            <span style="width:36px; text-align:right; font-size:12px; color:#000;">{{ Math.round(musicVolume) }}%</span>
          </div>

          <div v-if="localAudioUrl" class="trim-toggle">
            <label>
              <input type="checkbox" v-model="trimEnabled" />
              Découper un extrait (durée libre)
            </label>
          </div>

          <div v-if="localAudioUrl && trimEnabled" class="trim-controls">
            <div class="trim-time">
              Début: {{ formatTime(trimStart) }} — Fin: {{ formatTime(trimEnd) }} ({{ formatTime(Math.max(0, trimEnd - trimStart)) }})
            </div>


            <div class="double-range">
              <input
                type="range"
                min="0"
                :max="Math.floor(audioDuration || 0)"
                v-model.number="trimStart"
                @input="onTrimChange('start')"
              />
              <input
                type="range"
                min="0"
                :max="Math.floor(audioDuration || 0)"
                v-model.number="trimEnd"
                @input="onTrimChange('end')"
              />
            </div>

            <div class="trim-actions">
              <button type="button" class="btn btn-icon" @click="togglePlay" :title="isPlaying ? 'Pause' : 'Lire'">
                <svg v-if="!isPlaying" viewBox="0 0 24 24" class="icon">
                  <polygon points="8,5 19,12 8,19" fill="currentColor" />
                </svg>
                <svg v-else viewBox="0 0 24 24" class="icon">
                  <rect x="6" y="5" width="5" height="14" fill="currentColor" />
                  <rect x="13" y="5" width="5" height="14" fill="currentColor" />
                </svg>
              </button>

            </div>

            <audio
              ref="trimAudioEl"
              :src="localAudioUrl"
              preload="metadata"
              playsinline
              @loadedmetadata="onLoadedMetadata"
              @timeupdate="onTimeUpdate"
              @play="onTrimAudioPlay"
            ></audio>
          </div>

          <div v-if="user?.musicSrc" class="music-preview">
            <img v-if="user && user.musicSrc" :src="vinyleMusic" alt="vinyle" class="vinyle-gif" />
            <div class="preview-controls">
              <button v-if="user && user.musicSrc" type="button" class="btn btn-icon" @click="toggleProfilePlay" :title="isProfilePlaying ? 'Pause' : 'Lire'">
                <svg v-if="!isProfilePlaying" viewBox="0 0 24 24" class="icon">
                  <polygon points="8,5 19,12 8,19" fill="currentColor" />
                </svg>
                <svg v-else viewBox="0 0 24 24" class="icon">
                  <rect x="6" y="5" width="5" height="14" fill="currentColor" />
                  <rect x="13" y="5" width="5" height="14" fill="currentColor" />
                </svg>
              </button>
              <div v-if="user && user.musicSrc" class="marquee" :title="user?.musicTitle || ''">
                <span>{{ user?.musicTitle || 'Sans titre' }}</span>
              </div>
            </div>
            <audio
              v-if="user && user.musicSrc"
              ref="profileAudioEl"
              :src="getResolvedUpload(user?.musicSrc || '')"
              preload="metadata"
              playsinline
              @timeupdate="onProfileTimeUpdate"
              @ended="() => { isProfilePlaying = false }"
              @play="onProfileAudioPlay"
            ></audio>
          </div>
        </div>

        <button class="logout-btn" @click="logout">Déconnexion</button>
      </div>
    </div>

    <!-- Popup Entrer un code -->
    <div v-if="showRedeemPopup" class="profile-popup-overlay" @click.self="closeRedeemPopup">
      <div class="profile-popup">
        <button class="close-btn" @click="closeRedeemPopup" @mouseover="hoverCloseProfile = true" @mouseleave="hoverCloseProfile = false">
          <img :src="hoverCloseProfile ? closeHoverImg : closeImg" alt="Fermer" class="close-img" />
        </button>
        <h2>Entrer un code</h2>
        <input v-model="redeemCode" type="text" placeholder="EX: ABCD1234" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:8px;" />
        <button
          class="logout-btn"
          style="margin-top:12px; background-color: #6366f1 !important; border-color: #6366f1 !important; color: #ffffff;"
          @click="submitRedeemCode"
        >
          Valider
        </button>
        <div v-if="redeemMessage" style="margin-top:8px; color:#000000;">{{ redeemMessage }}</div>
      </div>
    </div>

    <!-- Modal Boutique -->

    <!-- Modale de recadrage avatar -->
    <div v-if="showAvatarCropper" class="cropper-overlay" @click.self="cancelAvatarCrop">
      <div class="cropper-modal" @click.stop>
        <h4 style="margin:0 0 10px; color: black;">Recadrer l'avatar</h4>
        <div
          class="cropper-box"
          ref="cropBoxRef"
          :style="{ width: cropBoxSize + 'px', height: cropBoxSize + 'px' }"
          @mousedown="startAvatarDrag"
          @mousemove="onAvatarDrag"
          @mouseup="endAvatarDrag"
          @mouseleave="endAvatarDrag"
          @touchstart.passive="startAvatarDragTouch"
          @touchmove.passive="onAvatarDragTouch"
          @touchend="endAvatarDrag"
          @wheel.prevent="onAvatarWheelZoom"
        >
          <img
            ref="cropImgRef"
            :src="cropImageSrc"
            alt="avatar to crop"
            class="cropper-image"
            @load="onCropImageLoad"
            :style="{ transform: `translate(${cropOffsetX}px, ${cropOffsetY}px) scale(${cropScale})` }"
            draggable="false"
          />
          <div class="cropper-mask"></div>
        </div>
        <div class="cropper-controls">
          <label style="font-size:12px;color:#333;">Zoom</label>
          <input type="range" :min="minCropScale" :max="4" step="0.01" v-model.number="cropScale" @input="clampAvatarOffsets" />
          <div class="cropper-actions">
            <button class="btn" @click="cancelAvatarCrop">Annuler</button>
            <button class="btn primary" @click="confirmAvatarCrop">Utiliser</button>
          </div>
        </div>
      </div>
    </div>

    <ShopPopup :show="showShopPopup" @close="showShopPopup = false" @equip-item="handleEquipItem" />

  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCoinsStore } from '@/stores/coins'
import LoginPopup from './LoginPopup.vue'
import EphemeralPopup from './EphemeralPopup.vue'
import accountIcon from '@/assets/accounttt.svg'
import eyeOpen from '@/assets/eyeopen.svg'
import eyeClosed from '@/assets/eyeclosed.svg'
import axios from 'axios'
import { API_URL, secureApiCall } from '@/api'
import CustomFortuneWheel from './CustomFortuneWheel.vue'
import ShopPopup from './ShopPopup.vue'
import ForgotPasswordPopup from './ForgotPasswordPopup.vue'
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
import bras from '@/assets/img/bras.webp'
import flash from '@/assets/img/flash.gif'
import camera from '@/assets/img/camera.gif'
import chat from '@/assets/img/chat.gif'
import catEars from '@/assets/img/oreilleschat.gif'
import pate from '@/assets/img/pate.gif'
import dvd from '@/assets/img/dvd.png'
import mlglunette from '@/assets/img/mlglunette.gif'
import nokia from '@/assets/img/nokia.gif'
import clippy from '@/assets/img/clippy.gif'
import daftpunk from '@/assets/img/daftpunk.gif'
import closeImg from '@/assets/img/bouton_supprimer_decocher.png'
import closeHoverImg from '@/assets/img/bouton_supprimer_cocher.png'
import discordon from '@/assets/img/discordon.webp'
import discordnepasderange from '@/assets/img/discordnepasderange.webp'
import discordderange from '@/assets/img/discordderange.webp'
import jojo from '@/assets/img/tobecontinued.webp'
import jojotext from '@/assets/img/jojotext.gif'
import galaxie from '@/assets/img/Galaxie.webp'
import star from '@/assets/img/star.gif'
import coeur from '@/assets/img/Coeur.webp'
import alphaImg from '@/assets/img/Alpha.webp'
import adminPlanify from '@/assets/img/Admin-Planify.webp'
import angelwings from '@/assets/img/angelwings.gif'
import vinyleMusic from '@/assets/Vinyle.gif'
import { useTheme } from '@/composables/useTheme'
import { useAutoDark } from '@/composables/useAutoDark'

const { isDark, toggleDark, setThemePreference } = useTheme();
const { enabled: autoDarkEnabled, applyAutoDark, disableAutoDark, followOS } = useAutoDark()

function toggleDarkManual() {
  try {
    const nextPref = isDark.value ? 'light' : 'dark';
    setThemePreference(nextPref);
    if (nextPref === 'dark') {
      applyAutoDark();
    } else {
      disableAutoDark();
    }
  } catch {}
}

const auth = useAuthStore();
const coinsStore = useCoinsStore();
// Synchronise le thème avec la préférence utilisateur (si disponible)
watch(() => auth.user && auth.user.theme, (t) => {
  try {
    if (!t) return;
    setThemePreference(t);
    if (t === 'auto') {
      applyAutoDark();
      followOS();
    } else if (t === 'dark') {
      applyAutoDark();
    } else {
      disableAutoDark();
    }
  } catch {}
}, { immediate: true });
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
const showRedeemPopup = ref(false)
const showForgotPasswordProfile = ref(false)
const redeemCode = ref('')
const redeemMessage = ref('')
// Public note in profile
const publicNoteDraft = ref('')
const savingPublicNote = ref(false)
const savePublicNoteMessage = ref('')

const publicNoteSyncTimer = ref(null)
const lastSyncedPublicNote = ref('')

// Déclarer musicTitle AVANT les watchers qui l'utilisent
const musicTitle = ref('')

// Déclarer 'user' avant toute utilisation (watch immediate)
const user = computed(() => {
  const currentUser = auth.user;
  console.log('👤 Utilisateur actuel:', {
    id: currentUser?.id,
    _id: currentUser?._id,
    username: currentUser?.username,
    avatar: currentUser?.avatar,
    hasToken: !!currentUser?.token
  });
  return currentUser;
})

watch(
  () => [user.value && (user.value._id || user.value.id), showProfilePopup],
  () => {
    try {
      publicNoteDraft.value = (user.value && user.value.publicNote) ? String(user.value.publicNote) : ''
      savePublicNoteMessage.value = ''
    } catch {}
  },
  { immediate: true }
)

// Initialiser le titre de la musique depuis le profil
watch(user, (u) => {
  try {
    musicTitle.value = (u && u.musicTitle) ? String(u.musicTitle) : ''
  } catch { musicTitle.value = '' }
}, { immediate: true })
const showPassword = ref(false)
const userAvatar = ref(accountIcon)
// Ajout: URL avatar avec paramètre de version pour bust cache
function addVersionParam(url, v) {
  try {
    if (!url) return url
    const sep = url.includes('?') ? '&' : '?'
    if (typeof v === 'number' && isFinite(v)) return `${url}${sep}v=${v}`
    return `${url}${sep}t=${Date.now()}`
  } catch { return url }
}

const userAvatarWithVersion = computed(() => {
  try {
    const base = typeof userAvatar.value === 'string' ? userAvatar.value : ''
    const ver = (user.value && typeof user.value.avatarVersion === 'number') ? user.value.avatarVersion : null
    return addVersionParam(base, ver)
  } catch { return userAvatar.value }
})

// Ajout: style de recadrage non destructif (compatible GIF)
function getSelfAvatarImageStyle() {
  try {
    const crop = (user.value && user.value.avatarCrop) ? user.value.avatarCrop : {}
    const x = Math.max(0, Math.min(100, Number(crop.xPercent ?? 50)))
    const y = Math.max(0, Math.min(100, Number(crop.yPercent ?? 50)))
    const scale = Math.max(1, Math.min(4, Number(crop.scale ?? 1)))
    return {
      objectFit: 'cover',
      objectPosition: `${x}% ${y}%`,
      transform: `scale(${scale})`,
      transformOrigin: `${x}% ${y}%`,
    }
  } catch { return {} }
}
const fileInput = ref(null)
const fileInputMobile = ref(null)
// Avatar cropper state
const showAvatarCropper = ref(false)
const cropImageSrc = ref('')
const cropScale = ref(1)
const minCropScale = ref(1)
const cropOffsetX = ref(0)
const cropOffsetY = ref(0)
const cropImgRef = ref(null)
const cropBoxRef = ref(null)
const isDraggingAvatar = ref(false)
const dragStartX = ref(0)
const dragStartY = ref(0)
const startOffsetX = ref(0)
const startOffsetY = ref(0)
const cropImgNaturalW = ref(0)
const cropImgNaturalH = ref(0)
const lastSelectedAvatarFile = ref(null)
const localAvatarUrl = ref(null)
// Responsive crop box size (dynamic)
const cropBoxSize = ref(300)
const CROP_BASE_SIZE = 300

// NOUVEAU: taille réelle de la box (mesurée dans le DOM)
function getActualCropBoxSize() {
  try {
    const el = cropBoxRef.value
    if (el && el.getBoundingClientRect) {
      const r = el.getBoundingClientRect()
      if (r && r.width && r.height) return Math.round(Math.min(r.width, r.height))
    }
  } catch {}
  return Number(cropBoxSize.value || CROP_BASE_SIZE)
}

// NOUVEAU: recalcule le zoom minimal et centre l’image
function recalcMinScaleAndCenter({ resetScale = false } = {}) {
  try {
    const box = getActualCropBoxSize()
    const w = Number(cropImgNaturalW.value || 0)
    const h = Number(cropImgNaturalH.value || 0)
    if (!w || !h || !box) return
    const minS = Math.max(box / w, box / h)
    minCropScale.value = minS
    if (resetScale || cropScale.value < minS) {
      cropScale.value = minS
    }
    const scaledW = w * cropScale.value
    const scaledH = h * cropScale.value
    cropOffsetX.value = (box - scaledW) / 2
    cropOffsetY.value = (box - scaledH) / 2
  } catch {}
}

function recomputeCropBoxSize() {
  try {
    const W = (typeof window !== 'undefined' && window.innerWidth) ? window.innerWidth : 320
    const H = (typeof window !== 'undefined' && window.innerHeight) ? window.innerHeight : 568
    // Margins/paddings and UI chrome inside the modal
    const horizontalMargin = 24 * 2 // modal horizontal paddings
    const verticalChrome = 180 // title + slider + buttons (approx)
    // Max dialog width with safe padding
    const maxDialogWidth = Math.min(420, W - horizontalMargin)
    const widthBased = Math.max(0, maxDialogWidth - 16) // inner margin
    // Height-based available room
    const heightBased = Math.max(
      180,
      Math.min(H - verticalChrome - 24 * 2, 520)
    )
    const size = Math.max(180, Math.min(Math.floor(widthBased), Math.floor(heightBased)))
    cropBoxSize.value = size
    // Recalcule aussi l’échelle minimale avec la nouvelle taille
    setTimeout(() => { recalcMinScaleAndCenter({ resetScale: false }) }, 0)
  } catch {}
}
onMounted(() => { try { recomputeCropBoxSize() } catch {} try { window.addEventListener('resize', recomputeCropBoxSize) } catch {} try { window.addEventListener('orientationchange', recomputeCropBoxSize) } catch {} })
onUnmounted(() => { try { window.removeEventListener('resize', recomputeCropBoxSize) } catch {} try { window.removeEventListener('orientationchange', recomputeCropBoxSize) } catch {} })
watch(showAvatarCropper, (v) => {
  if (v) {
    try { recomputeCropBoxSize() } catch {}
    setTimeout(() => {
      try { recomputeCropBoxSize() } catch {}
      try { recalcMinScaleAndCenter({ resetScale: true }) } catch {}
    }, 0)
  }
})
const lastSpinResult = ref(null)

// URL de base pour les avatars
const baseUrl = (() => {
  try {
    const orig = API_URL || ''
    return orig.endsWith('/api') ? orig.slice(0, -4) : orig.replace('/api', '')
  } catch { return '' }
})()

function toAbsoluteUrl(pathOrUrl) {
  try {
    if (!pathOrUrl) return null
    const s = String(pathOrUrl)
    if (/^https?:\/\//i.test(s)) return s
    if (s.startsWith('/uploads/')) return `${baseUrl}${s}`
    return `${baseUrl}${s.startsWith('/') ? s : '/' + s}`
  } catch { return null }
}

// NOUVEAU: toujours préférer l’endpoint API public par userId
function getAvatarUrlForUser(u) {
  try {
    if (u && (u._id || u.id)) {
      const id = u._id || u.id
      return `${API_URL}/users/avatar/${encodeURIComponent(id)}`
    }
    // fallback: si pas d'id dispo, on tente de normaliser la valeur brute
    return toAbsoluteUrl(u && u.avatar)
  } catch { return null }
}

function getAvatarUrlById(id) {
  try {
    const v = (user.value && typeof user.value.avatarVersion === 'number')
      ? user.value.avatarVersion
      : 0
    return `${API_URL}/users/avatar/${encodeURIComponent(id)}?v=${v}`
  } catch {
    return `${API_URL}/users/avatar/${encodeURIComponent(id)}`
  }
}

function onNavbarAvatarError(e) {
  try { e.target.src = accountIcon } catch {}
}

// Variables pour le système de coins
const showFortuneWheel = ref(false)
const timeUntilNextSpin = ref('')
const hoverCloseMobile = ref(false)
const hoverCloseWheel = ref(false)
const hoverCloseProfile = ref(false)

// Patch notes indicator next to "À propos"
const hasNewPatchNotes = ref(false)

function parseDate(d) {
  try { return new Date(d).getTime() } catch { return 0 }
}
function getLastSeen() {
  try { return Number(localStorage.getItem('patchNotesSeenAt') || 0) } catch { return 0 }
}
async function checkPatchNotesHighlight() {
  try {
    const res = await secureApiCall('/patch-notes/latest-meta', { method: 'GET' })
    if (res && res.success && res.latest) {
      const latestAt = parseDate(res.latest.createdAt)
      const lastSeen = getLastSeen()
      const shouldNotify = !!res.latest.notify && latestAt > lastSeen
      hasNewPatchNotes.value = shouldNotify
    } else {
      hasNewPatchNotes.value = false
    }
  } catch { hasNewPatchNotes.value = false }
}

onMounted(() => {
  checkPatchNotesHighlight()
  // Maj via storage event (quand About marque vu)
  try {
    window.addEventListener('storage', (e) => {
      if (e && e.key === 'patchNotesSeenAt') checkPatchNotesHighlight()
    })
  } catch {}

  // Support explicite via événement custom pour marquer les notes comme vues
  try {
    window.addEventListener('patchNotesSeen', () => { checkPatchNotesHighlight() })
  } catch {}
})

// Verrou UI de protection (reste vrai pendant la session ouverte)
const uiProtectionHold = ref(false)
const protectionActiveUI = computed(() => coinsStore.protectionReady)
const showProtectionIndicators = ref(true)

// Synchroniser le verrou à l’ouverture/fermeture de la pop-up
watch(showFortuneWheel, async (val) => {
  // ... existing code ...
  if (val) {
    try { await coinsStore.loadSpinStatus() } catch {}
    uiProtectionHold.value = !!coinsStore.protectionReady
  } else {
    uiProtectionHold.value = false
  }
})

// 2. Ajouter une variable showShopPopup
const showShopPopup = ref(false)
const previewItem = ref(null)
const previewBorderColorId = ref(null)

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
const equippedItem = computed(() => {
  // Si on preview une couleur de bordure, masquer visuellement tout item
  if (previewBorderColorId.value) return null
  // Si l'aperçu est un item dynamique, masquer l'item statique équipé
  if (previewItem.value && previewItem.value.isDynamic) return null
  // Si l'aperçu est un item statique, l'utiliser comme item
  if (previewItem.value && !previewItem.value.isDynamic) return previewItem.value
  return coinsStore.equippedItem
})
const equippedDynItem = computed(() => {
  // Si on preview une couleur de bordure, masquer visuellement tout item dynamique
  if (previewBorderColorId.value) return null
  // Si l'aperçu est un item statique, masquer l'item dynamique équipé
  if (previewItem.value && !previewItem.value.isDynamic) return null
  // Si l'aperçu est un item dynamique, l'utiliser
  if (previewItem.value && previewItem.value.isDynamic) return previewItem.value
  const it = coinsStore.equippedItem
  const id = coinsStore.equippedItemId || it?.id
  const legacyId = it?.legacyId
  // Rechercher d'abord par legacyId, puis par id, dans la map fraîche
  if (legacyId != null) {
    const freshLegacy = dynamicInfoById.value.get(Number(legacyId))
    if (freshLegacy && freshLegacy.isDynamic) return freshLegacy
  }
  if (id != null) {
    const freshById = dynamicInfoById.value.get(Number(id))
    if (freshById && freshById.isDynamic) return freshById
  }
  if (it && it.isDynamic) return it
  if (legacyId != null) return dynamicInfoById.value.get(Number(legacyId)) || null
  if (id != null) return dynamicInfoById.value.get(Number(id)) || null
  return null
})

// Clé réactive pour forcer la mise à jour de la navbar quand les variantes changent
const navbarVariantUpdateKey = ref(0)

// Computed property réactive qui dépend du store pour forcer les mises à jour
const dynamicVariantsState = computed(() => {
  // Cette computed property se met à jour quand le store change
  return coinsStore.dynamicItemVariants.size
})

// Fonction pour obtenir les assets de la variante sélectionnée pour un item dynamique
const getDynVariantAssetsForNavbar = (item) => {
  try {
    if (!item || !item.variants || !Array.isArray(item.variants)) {
      return []
    }
    
    // Utiliser legacyId si disponible, sinon id
    const itemId = item.legacyId !== undefined ? item.legacyId : item.id
    const variantIndex = coinsStore.getDynamicItemVariant(itemId)
    
    const variant = item.variants[variantIndex]
    if (!variant) {
      return []
    }
    
    // Si c'est un style texte uniquement, retourner les assets de la base avec les styles de la variante
    if (variant.textOnly) {
      const baseAssets = Array.isArray(item.assets) ? item.assets : []
      // Appliquer les styles de la variante aux assets de la base
      return baseAssets.map(asset => ({
        ...asset,
        // Utiliser les styles de la variante s'ils existent, sinon garder les styles de l'asset
        style: variant.assets && variant.assets[0] && variant.assets[0].style ? variant.assets[0].style : asset.style,
        collectionStyle: variant.assets && variant.assets[0] && variant.assets[0].collectionStyle ? variant.assets[0].collectionStyle : asset.collectionStyle,
        collectionStyleMobile: variant.assets && variant.assets[0] && variant.assets[0].collectionStyleMobile ? variant.assets[0].collectionStyleMobile : asset.collectionStyleMobile,
        leaderboardStyle: variant.assets && variant.assets[0] && variant.assets[0].leaderboardStyle ? variant.assets[0].leaderboardStyle : asset.leaderboardStyle,
        leaderboardStyleMobile: variant.assets && variant.assets[0] && variant.assets[0].leaderboardStyleMobile ? variant.assets[0].leaderboardStyleMobile : asset.leaderboardStyleMobile,
        avatarStyle: variant.assets && variant.assets[0] && variant.assets[0].avatarStyle ? variant.assets[0].avatarStyle : asset.avatarStyle,
        avatarStyleMobile: variant.assets && variant.assets[0] && variant.assets[0].avatarStyleMobile ? variant.assets[0].avatarStyleMobile : asset.avatarStyleMobile,
        navbarStyle: variant.assets && variant.assets[0] && variant.assets[0].navbarStyle ? variant.assets[0].navbarStyle : asset.navbarStyle,
        navbarStyleMobile: variant.assets && variant.assets[0] && variant.assets[0].navbarStyleMobile ? variant.assets[0].navbarStyleMobile : asset.navbarStyleMobile,
        popupStyleStyle: variant.assets && variant.assets[0] && variant.assets[0].popupStyleStyle ? variant.assets[0].popupStyleStyle : asset.popupStyleStyle,
        profilePopupStyle: variant.assets && variant.assets[0] && variant.assets[0].profilePopupStyle ? variant.assets[0].profilePopupStyle : asset.profilePopupStyle,
        // Fallback meta: si la variante n'a pas de meta, prendre celle de la base
        meta: (variant.assets && variant.assets[0] && variant.assets[0].meta)
          ? { ...(asset.meta || {}), ...(variant.assets[0].meta || {}) }
          : (asset.meta || {})
      }))
    }
    
    if (!Array.isArray(variant.assets)) {
      return []
    }
    // Fusionner meta depuis la base si manquante
    const baseAssets = Array.isArray(item.assets) ? item.assets : []
    const bySrc = new Map(baseAssets.map(b => [String(b.src || ''), b]))
    return variant.assets.map(a => {
      const base = bySrc.get(String(a && a.src || ''))
      const mergedMeta = (a && a.meta) ? a.meta : (base && base.meta ? base.meta : {})
      return { ...a, meta: mergedMeta }
    })
  } catch (e) {
    console.error('❌ Erreur dans getDynVariantAssetsForNavbar:', e)
    return []
  }
}

// Déduplication d'assets (même src) pour éviter les doublons d'affichage
function uniqueNavbarAssetsBySrc(assets) {
  try {
    const seen = new Set()
    const out = []
    for (const a of Array.isArray(assets) ? assets : []) {
      const key = String(a && a.src ? a.src : '')
      if (seen.has(key)) continue
      seen.add(key)
      out.push(a)
    }
    return out
  } catch { return Array.isArray(assets) ? assets : [] }
}

function getUniqueVariantAssetsForNavbar(item) {
  return uniqueNavbarAssetsBySrc(getDynVariantAssetsForNavbar(item))
}

function getUniqueBaseAssetsForNavbar(item) {
  return uniqueNavbarAssetsBySrc(item && Array.isArray(item.assets) ? item.assets : [])
}

function filterNavbarAssets(item, assets, target, placement) {
  const list = uniqueNavbarAssetsBySrc(assets)
  return list.filter((a) => {
    try {
      const t = getEffectiveNavbarTarget(item, a)
      if (t !== target) return false
      const p = a && a.meta && a.meta.navbarPlacement
      if (!p) return placement === 'below'
      return p === placement
    } catch { return false }
  })
}

function getVariantAssetsForTargetPlacement(item, target, placement) {
  return filterNavbarAssets(item, getDynVariantAssetsForNavbar(item), target, placement)
}

function getBaseAssetsForTargetPlacement(item, target, placement) {
  const base = item && Array.isArray(item.assets) ? item.assets : []
  return filterNavbarAssets(item, base, target, placement)
}

function getNavbarAssetsUnified(item) {
  if (item && Array.isArray(item.variants) && item.variants.length > 0) {
    return getDynVariantAssetsForNavbar(item)
  }
  return Array.isArray(item?.assets) ? item.assets : []
}

function getNavbarAssetsForTargetPlacement(item, target, placement) {
  return filterNavbarAssets(item, getNavbarAssetsUnified(item), target, placement)
}

function getEffectiveNavbarTarget(item, asset) {
  try {
    // 1) Priorité: valeur définie au niveau ITEM
    const itemLevel = item && item.meta && item.meta.navbarTarget
    if (itemLevel) return String(itemLevel === 'account-btn' ? 'avatar-image-container' : itemLevel)
    // 1bis) Détection globale comme dans le leaderboard: si l'un des assets (variante courante ou base)
    // cible explicitement l'extérieur, basculer tout l'item sur 'user-account-wrapper'
    try {
      const assetsList = (Array.isArray(item?.variants) && item.variants.length > 0)
        ? getDynVariantAssetsForNavbar(item)
        : (Array.isArray(item?.assets) ? item.assets : [])
      if (Array.isArray(assetsList)) {
        for (const a of assetsList) {
          const t = a && a.meta && a.meta.navbarTarget
          if (t === 'user-account-wrapper') return 'user-account-wrapper'
        }
      }
    } catch {}
    const explicit = asset && asset.meta && asset.meta.navbarTarget
    if (explicit) return String(explicit === 'account-btn' ? 'avatar-image-container' : explicit)
  } catch {}
  // Défaut: intérieur = avatar-image-container
  return 'avatar-image-container'
}

// AJOUT: Profil Pop-up - cibles/placements
function getEffectiveProfilePopupTarget(item, asset) {
  try {
    const explicit = asset && asset.meta && asset.meta.profilePopupTarget
    if (explicit) return String(explicit)
    const itemLevel = item && item.meta && item.meta.profilePopupTarget
    if (itemLevel) return String(itemLevel)
    // Rétro-compat: déduire depuis navbarTarget/container
    const nb = (asset && asset.meta && asset.meta.navbarTarget) || (item && item.meta && item.meta.navbarTarget)
    if (nb === 'avatar-image-container') return 'profile-avatar'
    if (nb === 'user-account-wrapper' || nb === 'account-btn') return 'profile-avatar-scaler'
    const legacy = asset && asset.meta && asset.meta.container
    if (legacy === 'user-avatar-container') return 'profile-avatar-scaler'
    // Fallback cible leaderboard -> profil
    const lb = (asset && asset.meta && asset.meta.leaderboardTarget) || (item && item.meta && item.meta.leaderboardTarget)
    if (lb === 'leaderboard-avatar') return 'profile-avatar'
    if (lb === 'leaderboard-avatar-scaler' || lb === 'leaderboard-card') return 'profile-avatar-scaler'
  } catch {}
  return 'profile-avatar'
}

function getProfilePopupAssetsUnified(item) {
  // Réutilise l’unification (assets de variante sinon base)
  return getNavbarAssetsUnified(item)
}

function getProfilePopupAssetsForTargetPlacement(item, target, placement) {
  try {
    const arr = getProfilePopupAssetsUnified(item)
    return (Array.isArray(arr) ? arr : []).filter((a) => {
      const t = getEffectiveProfilePopupTarget(item, a)
      if (t !== target) return false
      const p = (a && a.meta && (a.meta.profilePopupPlacement ?? a.meta.leaderboardPlacement ?? a.meta.navbarPlacement)) || 'below'
      return p === placement
    })
  } catch { return [] }
}

function isNavbarAssetTargetingAvatar(item, asset) {
  // intérieur = avatar-image-container
  return getEffectiveNavbarTarget(item, asset) === 'avatar-image-container'
}

function isNavbarAssetTargetingAccountBtn(item, asset) {
  // extérieur = user-account-wrapper
  return getEffectiveNavbarTarget(item, asset) === 'user-account-wrapper'
}

function resolveDynSrc(src) {
  try {
    if (typeof src === 'string' && src.startsWith('/uploads/')) {
      const orig = API_URL || ''
      const base = orig.endsWith('/api') ? orig.slice(0, -4) : orig.replace('/api','')
      return base + src
    }
  } catch {}
  return src
}

function getResolvedUpload(src) {
  try {
    if (typeof src === 'string' && src.startsWith('/uploads/')) {
      const orig = API_URL || ''
      const base = orig.endsWith('/api') ? orig.slice(0, -4) : orig.replace('/api','')
      return base + src
    }
  } catch {}
  return src
}

function normalizePreviewItem(raw) {
  if (!raw) return null
  try {
    // Items dynamiques: passer tel quel
    if (raw.isDynamic) return raw

    // Items statiques: construire un objet minimal compatible avec le rendu Navbar
    const name = String(raw.name || '').trim()
    const byName = name.toLowerCase()

    // Dictionnaire displayType pour les principaux items statiques
    const mapDisplayType = {
      'discord': 'discord',
      'jojo': 'jojo',
      'matrix': 'matrix',
      'cash': 'cash',
      'cible': 'target',
      'advisory': 'advisory',
      'espace': 'espace',
      'dvd': 'dvd',
      'lunettes pixel': 'lunettes-pixel',
      '2000': 'nokia',
      'miaou': 'miaou',
      'oreillettes de chat': 'cat-ears',
      'oreilles de chat': 'cat-ears',
      'flash': 'flash',
      'roi': 'roi',
      'clown': 'clown',
      'vinyle': 'vinyle',
      'gentleman': 'gentleman',
      'ange': 'angel',
      'tomb raider': 'tomb-raider',
      'cadre royale': 'royal-frame',
      'absolute cinema': 'absolute-cinema',
      'roses': 'rainbow',
      'coeur': 'coeur',
      'prestige': 'alpha',
      'planify': 'admin-planify'
    }

    let displayType = mapDisplayType[byName] || 'generic'

    // Fallbacks de robustesse pour variantes d'écriture
    if (displayType === 'generic') {
      if (byName.includes('absolute') && byName.includes('cinema')) {
        displayType = 'absolute-cinema'
      } else if (byName.includes('cadre') && (byName.includes('royal') || byName.includes('royale'))) {
        displayType = 'royal-frame'
      }
    }

    // Fallback ciblés: fournir l'image pour certains overlays statiques
    if (displayType === 'rainbow') {
      return { name, displayType, isDynamic: false, img: love }
    }
    if (displayType === 'cat-ears') {
      return { name, displayType, isDynamic: false, img: catEars }
    }
    // FIX: fournir l’asset pour Cadre royale afin d’éviter un <img src=undefined />
    if (displayType === 'royal-frame') {
      return { name, displayType, isDynamic: false, img: cadre }
    }

    // Optionnel: si l’item avait déjà une image (mappée côté shop), la conserver
    const img = (raw && typeof raw.img === 'string') ? raw.img : undefined
    return { name, displayType, isDynamic: false, img }
  } catch { return null }
}

function getDynNavbarAssetStyle(asset) {
  const s = (asset && asset.navbarStyle) || asset?.style || {}
  const style = { position: 'absolute', objectFit: s.objectFit || 'contain', zIndex: typeof s.zIndex === 'number' ? s.zIndex : 1, pointerEvents: 'none' }
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

// Style spécifique pour la popup Profil (peut évoluer indépendamment de la navbar)
function getDynProfilePopupAssetStyle(asset) {
  // Priorité au style spécifique Profil Pop-up, fallbacks conservateurs
  const s = (asset && (asset.profilePopupStyle || asset.popupStyleStyle || asset.navbarStyle || asset.style)) || {}
  const style = { position: 'absolute', objectFit: s.objectFit || 'contain', zIndex: typeof s.zIndex === 'number' ? s.zIndex : undefined, pointerEvents: 'none' }
  if (typeof s.top === 'number') style.top = s.top + 'px'
  if (typeof s.left === 'number') style.left = s.left + 'px'
  if (typeof s.width === 'number') style.width = s.width + 'px'
  if (typeof s.height === 'number') style.height = s.height + 'px'
  if (typeof s.rotate === 'number') style.transform = `rotate(${s.rotate}deg)`
  // Assurer un z-index élevé par défaut pour les overlays "above" (sinon 1)
  if (typeof style.zIndex !== 'number') {
    const placement = asset && asset.meta && asset.meta.navbarPlacement
    style.zIndex = (placement === 'above') ? 15 : 1
  }
  return style
}

// Détermine si l'item/variante en cours doit retirer la bordure de l'account-btn
function shouldRemoveNavbarBorder() {
  try {
    // 1) Prévisualisation d'un item dynamique
    let item = (previewItem.value && previewItem.value.isDynamic)
      ? previewItem.value
      : equippedDynItem.value
    // 1bis) Fallback via id actuellement équipé -> map fraiche
    if (!item) {
      const id = coinsStore.equippedItemId || coinsStore.equippedItem?.id || coinsStore.equippedItem?.legacyId
      if (id != null) item = dynamicInfoById.value.get(Number(id)) || null
    }
    if (!item) return false
    // Priorité: variante courante
    const itemId = item.legacyId !== undefined ? item.legacyId : item.id
    const vi = coinsStore.getDynamicItemVariant(itemId)
    const variant = Array.isArray(item.variants) ? item.variants[vi] : null
    if (variant && variant.removeNavbarBorder === true) return true
    // Ensuite: meta au niveau item
    if (item.meta && item.meta.removeNavbarBorder === true) return true
  } catch {}
  return false
}

// Détermine si la bordure doit être retirée dans la pop-up Profil
function shouldRemoveProfilePopupBorder(item) {
  try {
    if (!item) return false
    const itemId = (item.legacyId !== undefined) ? item.legacyId : item.id
    const vi = coinsStore.getDynamicItemVariant(itemId)
    const variant = Array.isArray(item.variants) ? item.variants[vi] : null
    if (variant && (variant.removeProfilePopupBorder === true || variant.removeNavbarBorder === true)) return true
    if (item.meta && (item.meta.removeProfilePopupBorder === true || item.meta.removeNavbarBorder === true)) return true
  } catch {}
  return false
}

// Chargement des items dynamiques pour la Navbar
const dynamicInfoById = ref(new Map())
async function loadDynamicItems() {
  try {
    const res = await secureApiCall('/items')
    if (res && res.success && Array.isArray(res.items)) {
      const map = new Map()
      for (const it of res.items) {
        if (typeof it.legacyId !== 'undefined') map.set(Number(it.legacyId), it)
        if (typeof it.id !== 'undefined') map.set(Number(it.id), it)
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
  try { window.addEventListener('items-changed', loadDynamicItems) } catch {}
  try {
    window.addEventListener('navbar-preview-item', (e) => {
      const it = e && e.detail && e.detail.item
      try {
        if (it && (it.type === 'border-color' || it.type === 'border-gradient')) {
          try { previewBorderColorId.value = coinsStore.getBorderColorIdFromItem(it) } catch { previewBorderColorId.value = null }
          previewItem.value = null
        } else {
          previewItem.value = normalizePreviewItem(it)
          previewBorderColorId.value = null
        }
      } catch { previewItem.value = null; previewBorderColorId.value = null }
      setTimeout(() => { previewItem.value = null; previewBorderColorId.value = null }, 90000)
    })
  } catch {}

  // Nettoyer l'aperçu au changement de route (SPA) ou navigation du navigateur
  try {
    router.afterEach((to) => {
      try {
        const skipOnce = (typeof window !== 'undefined') && window.__previewNavigationTs && (Date.now() - window.__previewNavigationTs < 2000)
        if (to && to.path === '/' && skipOnce) {
          try { window.__previewNavigationTs = 0 } catch {}
          return
        }
      } catch {}
      previewItem.value = null
      previewBorderColorId.value = null
    })
  } catch {}
  try { window.addEventListener('popstate', () => { previewItem.value = null; previewBorderColorId.value = null }) } catch {}
  try { window.addEventListener('hashchange', () => { previewItem.value = null; previewBorderColorId.value = null }) } catch {}
  // Écouter les changements de variantes pour forcer la mise à jour de la navbar
  try { 
    window.addEventListener('dynamic-variant-changed', (event) => { 
      console.log('📡 Navbar: Événement dynamic-variant-changed reçu:', event.detail)
      navbarVariantUpdateKey.value++
      console.log('🔄 Navbar: Clé de mise à jour incrémentée:', navbarVariantUpdateKey.value)
    }) 
  } catch {}
})
onUnmounted(() => { 
  try { window.removeEventListener('items-changed', loadDynamicItems) } catch {}
  try { window.removeEventListener('dynamic-variant-changed', () => { navbarVariantUpdateKey.value++ }) } catch {}
})

console.log('🔧 API_URL:', API_URL)
console.log('🔧 baseUrl:', baseUrl)

// 'user' est déjà défini plus haut
const isLoggedIn = computed(() => auth.isLoggedIn)
const isAdmin = computed(() => auth.isAdmin)

const passwordValue = ref('');

// Fonction pour charger l'avatar de l'utilisateur
async function loadUserAvatar() {
  try {
    userAvatar.value = accountIcon;
    const src = getAvatarUrlForUser(user.value)
    if (src) userAvatar.value = src;
  } catch (error) {
    console.error('Erreur lors du chargement de l\'avatar:', error);
    userAvatar.value = accountIcon;
  }
}

// Fonctions pour le système de coins
function openFortuneWheel() {
  // Garde: ne pas ouvrir si le spin n'est pas disponible
  if (!coinsStore.canSpinToday) {
    checkSpinAvailability()
    return
  }
  // Charger l'état (non bloquant) et ouvrir
  coinsStore.loadSpinStatus().catch(() => {})
  showFortuneWheel.value = true
  // Réinitialiser l’état d’animation
  spinning.value = false
  forcedResultIndex.value = null
  spinMessage.value = ''
  wheelKey.value++
}

function closeFortuneWheel() {
  showFortuneWheel.value = false;
  try { document.body.style.overflow = '' } catch (e) {}
  uiProtectionHold.value = false
  wheelKey.value++
}

// Détection weekend (déplacée plus haut)

// Segments de la roue - valeurs basiques ou x2 le weekend
// Segments x1.5 du weekend (sans item visuel ni Galaxie) – nouveaux montants
const weekendSegments = [
  { label: '30 coins', color: '#FFD700' },
  { label: '60 coins', color: '#FF6347' },
  { label: '120 coins', color: '#FFB347' },
  { label: '180 coins', color: '#4682B4' },
  { label: '240 coins', color: '#8A2BE2' },
  { label: '270 coins', color: '#32CD32' },
  { label: 'Perdu', color: '#ccc' }
]
// Segments basiques (sans Galaxie) – nouveaux montants
const baseSegments = [
  { label: '20 coins', color: '#FFD700' },
  { label: '40 coins', color: '#FF6347' },
  { label: '80 coins', color: '#FFB347' },
  { label: '120 coins', color: '#4682B4' },
  { label: '160 coins', color: '#8A2BE2' },
  { label: '180 coins', color: '#32CD32' },
  { label: 'Perdu', color: '#ccc' }
]

const wheelSegments = computed(() => {
  const hasGalaxy = typeof coinsStore.hasItem === 'function' ? coinsStore.hasItem(25) : false
  const removeLoseIfProtected = (list) => coinsStore.protectionReady ? list.filter(seg => !/Perdu/i.test(seg.label)) : list
  if (isWeekend.value === true || testWheelMode.value === 'x2') {
    let week = [...weekendSegments]
    if (!hasGalaxy) {
      week.splice(week.length - 1, 0, { label: '', color: '#3f0b6d', type: 'galaxy', gradientStops: ['#0d0b6d','#3f0b6d','#0b4a6d'] })
    }
    return removeLoseIfProtected(week)
  }
  let basic = [...baseSegments]
  if (!hasGalaxy) {
    basic.splice(basic.length - 1, 0, { label: '', color: '#3f0b6d', type: 'galaxy', gradientStops: ['#0d0b6d','#3f0b6d','#0b4a6d'] })
  }
  return removeLoseIfProtected(basic)
})
const spinMessage = ref('')
const spinning = ref(false)
const wheelKey = ref(0) // pour forcer le reset du composant
const forcedResultIndex = ref(null)
// Mode test
const testWheelMode = ref('basic') // 'basic' | 'x2'

// Fonction pour détecter si c'est le weekend
const isWeekend = computed(() => {
  // Utiliser Europe/Paris pour rester aligné avec le backend
  const parisNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Paris' }))
  const dayOfWeek = parisNow.getDay()
  return dayOfWeek === 0 || dayOfWeek === 6 // 0 = dimanche, 6 = samedi
})

function getAccountBorderStyle() {
  // Priorité: couleur d’aperçu — ignorer les retraits de bordure pendant l’aperçu
  if (previewBorderColorId.value) {
    const c = coinsStore.borderColors.find(b => b.id === previewBorderColorId.value)
    if (c) {
      if (c.gradient) {
        return { border: '3px solid transparent', background: `linear-gradient(white, white) padding-box, ${c.gradient} border-box` }
      }
      if (c.color) {
        return { border: `3px solid ${c.color}` }
      }
    }
    // Si la couleur d’aperçu n’existe plus (race condition), continuer le flux normal
  }
  // Retrait explicite via l'éditeur (item/variante) – seulement si pas d’aperçu couleur
  if (shouldRemoveNavbarBorder()) {
    return {}
  }
  // Utiliser la couleur sélectionnée du store (persistée backend)
  const selected = coinsStore.borderColors.find(c => c.id === coinsStore.selectedBorderColor)
  // Si un item “no-border” est équipé, ne pas forcer de style inline
  if ((equippedItem && (equippedItem.displayType === 'discord' || equippedItem.name === 'Galaxie' || equippedItem.name === 'Coeur' || equippedItem.name === 'Alpha' || equippedItem.name === 'Admin Planify'))
      || coinsStore.equippedItemId === 25 || coinsStore.equippedItemId === 26 || coinsStore.equippedItemId === 27 || coinsStore.equippedItemId === 28) {
    return {}
  }
  if (!selected) return {}
  if (selected.gradient) {
    return { border: '3px solid transparent', background: `linear-gradient(white, white) padding-box, ${selected.gradient} border-box` }
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
  // Prevent concurrent spins
  if (spinning.value) return
  spinning.value = true
  spinMessage.value = ''
  showProtectionIndicators.value = false
  
  try {
    const result = await coinsStore.spinWheelRaw()
    
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

    // Déclencher un refresh du leaderboard si un gain positif a été obtenu
    try {
      const won = (typeof lastSpinResult.value.coinsWon === 'number') ? lastSpinResult.value.coinsWon : 0
      if (won > 0) {
        coinsStore.leaderboardNeedsRefresh = true
      }
    } catch {}

    // Synchronisation avec le backend
    await coinsStore.loadBalance()
    lastSpinResult.value = null
  }
  
  // Gérer le cas Perdu et les récompenses positives
  if (segment.label === 'Perdu') {
    // Met à jour la série de pertes et l'état de protection
    coinsStore.lossStreak = Math.min(2, (coinsStore.lossStreak || 0) + 1)
    // Activation immédiate du 3ᵉ bouclier doré dès 2 défaites
    coinsStore.protectionReady = coinsStore.lossStreak >= 2
    spinMessage.value = `😔 Dommage, vous n'avez rien gagné cette fois-ci !`
  } else if (segment.type === 'galaxy' || (lastSpinResult.value && lastSpinResult.value.rewardItemId === 25)) {
    // Récompense item Galaxie
    coinsStore.lossStreak = 0
    coinsStore.protectionReady = false
    // uiProtectionHold reste true jusqu’à fermeture de la pop-up
    spinMessage.value = `Félicitations ! Vous avez obtenu l'item Galaxie !`
    // Recharger l'inventaire immédiatement pour afficher l'item débloqué dans la Collection
    try {
      await coinsStore.loadInventory()
    } catch (e) {}
  } else {
    // Victoire ou récompense item
    const used = !!(lastSpinResult.value && lastSpinResult.value.protectionUsed)
    if (used) {
      // Protection consommée: reset des boucliers
      coinsStore.lossStreak = 0
      coinsStore.protectionReady = false
    } else {
      // Ne pas reset sur une victoire normale si la protection n’est pas utilisée
      coinsStore.lossStreak = coinsStore.lossStreak || 0
      coinsStore.protectionReady = coinsStore.lossStreak >= 2
    }
    // uiProtectionHold reste true jusqu’à fermeture de la pop-up
    // Afficher exactement la valeur indiquée par le segment affiché
    const won = (lastSpinResult.value && typeof lastSpinResult.value.coinsWon === 'number')
      ? lastSpinResult.value.coinsWon
      : parseInt(segment.label.match(/\d+/)?.[0] || '0')
    spinMessage.value = isWeekend.value
      ? `🎉 WEEKEND BONUS x1.5 ! Félicitations ! Vous avez gagné ${won} coins !`
      : `🎉 Félicitations ! Vous avez gagné ${won} coins !`
  }
  
  // Toujours recharger le statut et mettre à jour le timer après le spin
  await coinsStore.loadSpinStatus()
  checkSpinAvailability()
  setTimeout(() => { showProtectionIndicators.value = true }, 600)

  // Réinitialiser l'état après un délai court pour laisser voir le résultat
  setTimeout(() => {
    // Toujours remettre spinning à false pour terminer l'état de spin
    spinning.value = false
    forcedResultIndex.value = null
  }, 800)
}

// Méthode: checkSpinAvailability()
function checkSpinAvailability() {
  // ... existing code ...
  // Calculer la disponibilité et le timer à minuit Europe/Paris
  const fmtYMDParis = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' })
  const parisNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Paris' }))
  const todayParis = fmtYMDParis.format(parisNow)
  const last = coinsStore.lastSpinDate ? new Date(coinsStore.lastSpinDate) : null
  const lastSpinParisYMD = last ? fmtYMDParis.format(last) : null
  const canSpin = !lastSpinParisYMD || lastSpinParisYMD !== todayParis
  coinsStore.canSpinToday = canSpin

  if (!canSpin) {
    const nextMidnightParis = new Date(parisNow)
    nextMidnightParis.setHours(24, 0, 0, 0)
    const ms = nextMidnightParis.getTime() - parisNow.getTime()
    const h = Math.floor(ms / 3_600_000)
    const m = Math.floor((ms % 3_600_000) / 60_000)
    // Format demandé: XXh YYm
    timeUntilNextSpin.value = `${h}h ${m}m`
  } else {
    timeUntilNextSpin.value = ''
  }
  // ... existing code ...
}

// Méthode: updateSpinTimer()
function updateSpinTimer() {
  // ... existing code ...
  // Recalculer chaque seconde le temps restant jusqu’à minuit Europe/Paris
  const fmtYMDParis = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' })
  const parisNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Paris' }))
  const todayParis = fmtYMDParis.format(parisNow)
  const last = coinsStore.lastSpinDate ? new Date(coinsStore.lastSpinDate) : null
  const lastSpinParisYMD = last ? fmtYMDParis.format(last) : null
  const canSpin = !lastSpinParisYMD || lastSpinParisYMD !== todayParis
  coinsStore.canSpinToday = canSpin

  if (!canSpin) {
    const nextMidnightParis = new Date(parisNow)
    nextMidnightParis.setHours(24, 0, 0, 0)
    const ms = nextMidnightParis.getTime() - parisNow.getTime()
    const h = Math.floor(ms / 3_600_000)
    const m = Math.floor((ms % 3_600_000) / 60_000)
    // Format demandé: XXh YYm
    timeUntilNextSpin.value = `${h}h ${m}m`
  } else {
    timeUntilNextSpin.value = ''
  }
  // ... existing code ...
}

// Contrôles de test (admin)
function toggleTestWheelMode() {
  if (!isAdmin.value) return
  testWheelMode.value = testWheelMode.value === 'basic' ? 'x2' : 'basic'
  wheelKey.value++
}

async function spinTestOnce() {
  if (!isAdmin.value) return
  // Ignorer la contrainte de 24h pour les tests
  spinning.value = false
  coinsStore.canSpinToday = true
  await handleSpinRequest()
}

async function forceLossOnce() {
  if (!isAdmin.value) return
  // Trouver la case "Perdu" et lancer l’animation dessus
  let idx = -1
  if (wheelSegments.value && Array.isArray(wheelSegments.value)) {
    idx = wheelSegments.value.findIndex(seg => /perdu/i.test(seg.label))
    if (idx < 0) idx = wheelSegments.value.length - 1
  } else {
    idx = 0
  }
  // Préparer un résultat local de perte pour la phase post‑animation
  lastSpinResult.value = { success: true, coinsWon: 0, rewardName: 'Perdu' }

  // Mise à jour backend pour persister la série de pertes de test
  try {
    const resp = await secureApiCall('/coins/test-force-loss', { method: 'POST' })
    if (resp && resp.success) {
      coinsStore.lossStreak = Number(resp.lossStreak || 0)
      coinsStore.protectionReady = !!resp.protectionReady
      // Garder la protection active côté UI tant que la pop-up est ouverte
      uiProtectionHold.value = coinsStore.protectionReady
    }
  } catch (e) {}

  // Lancer le spin forcé visuellement
  forcedResultIndex.value = idx
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
function onCropImageLoad(e) {
  try {
    const img = e && e.target ? e.target : cropImgRef.value
    if (!img) return
    cropImgNaturalW.value = Number(img.naturalWidth || img.width || 0)
    cropImgNaturalH.value = Number(img.naturalHeight || img.height || 0)
    if (!cropImgNaturalW.value || !cropImgNaturalH.value) return
    // Utilise la taille réelle de la box pour un zoom identique sur tous devices
    recalcMinScaleAndCenter({ resetScale: true })
  } catch {}
}
function clampAvatarOffsets() {
  try {
    if (cropScale.value < minCropScale.value) cropScale.value = minCropScale.value
    const scaledW = cropImgNaturalW.value * cropScale.value
    const scaledH = cropImgNaturalH.value * cropScale.value
    const boxSize = getActualCropBoxSize()
    if (scaledW <= boxSize) {
      cropOffsetX.value = (boxSize - scaledW) / 2
    } else {
      cropOffsetX.value = Math.min(0, Math.max(boxSize - scaledW, cropOffsetX.value))
    }
    if (scaledH <= boxSize) {
      cropOffsetY.value = (boxSize - scaledH) / 2
    } else {
      cropOffsetY.value = Math.min(0, Math.max(boxSize - scaledH, cropOffsetY.value))
    }
  } catch {}
}
function startAvatarDrag(e) {
  try {
    isDraggingAvatar.value = true
    dragStartX.value = e.clientX
    dragStartY.value = e.clientY
    startOffsetX.value = cropOffsetX.value
    startOffsetY.value = cropOffsetY.value
  } catch {}
}
function onAvatarDrag(e) {
  try {
    if (!isDraggingAvatar.value) return
    const dx = e.clientX - dragStartX.value
    const dy = e.clientY - dragStartY.value
    cropOffsetX.value = startOffsetX.value + dx
    cropOffsetY.value = startOffsetY.value + dy
    clampAvatarOffsets()
  } catch {}
}
function endAvatarDrag() { isDraggingAvatar.value = false }
function startAvatarDragTouch(e) {
  try {
    const t = e.touches && e.touches[0]
    if (!t) return
    isDraggingAvatar.value = true
    dragStartX.value = t.clientX
    dragStartY.value = t.clientY
    startOffsetX.value = cropOffsetX.value
    startOffsetY.value = cropOffsetY.value
  } catch {}
}
function onAvatarDragTouch(e) {
  try {
    const t = e.touches && e.touches[0]
    if (!t || !isDraggingAvatar.value) return
    const dx = t.clientX - dragStartX.value
    const dy = t.clientY - dragStartY.value
    cropOffsetX.value = startOffsetX.value + dx
    cropOffsetY.value = startOffsetY.value + dy
    clampAvatarOffsets()
  } catch {}
}
function onAvatarWheelZoom(e) {
  try {
    const delta = -e.deltaY
    const next = Math.max(minCropScale.value, Math.min(4, cropScale.value + delta * 0.0015))
    cropScale.value = next
    clampAvatarOffsets()
  } catch {}
}
function cancelAvatarCrop() {
  try {
    showAvatarCropper.value = false
    cropImageSrc.value = ''
    if (localAvatarUrl.value) {
      try { URL.revokeObjectURL(localAvatarUrl.value) } catch {}
      localAvatarUrl.value = null
    }
    lastSelectedAvatarFile.value = null
    if (fileInput.value) fileInput.value.value = ''
    if (fileInputMobile.value) fileInputMobile.value.value = ''
  } catch {}
}
async function confirmAvatarCrop() {
  try {
    const img = cropImgRef.value
    const box = cropBoxRef.value ? cropBoxRef.value.getBoundingClientRect() : null
    if (!img || !box) { cancelAvatarCrop(); return }
    const size = 512
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#fff'
    ctx.fillRect(0,0,size,size)
    const scaleToCanvas = size / box.width
    ctx.save()
    ctx.scale(scaleToCanvas, scaleToCanvas)
    ctx.translate(cropOffsetX.value, cropOffsetY.value)
    ctx.drawImage(img, 0, 0, cropImgNaturalW.value * cropScale.value, cropImgNaturalH.value * cropScale.value)
    ctx.restore()
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.92))
    if (!blob) throw new Error('Echec de génération de l\'image recadrée')
    const formData = new FormData()
    const filenameBase = (lastSelectedAvatarFile.value && lastSelectedAvatarFile.value.name) ? lastSelectedAvatarFile.value.name.replace(/\.[^.]+$/, '') : 'avatar'
    formData.append('avatar', new File([blob], `${filenameBase}-cropped.jpg`, { type: 'image/jpeg' }))
    const response = await axios.post(`${API_URL}/users/upload-avatar`, formData, {
      headers: { 'Authorization': `Bearer ${user.value.token}` }
    })
    if (response.data && response.data.avatar) {
      const v = (typeof response.data.avatarVersion === 'number' && isFinite(response.data.avatarVersion)) ? response.data.avatarVersion : Date.now()
      if (user.value) {
        const updatedUser = { ...user.value, avatar: response.data.avatar, avatarVersion: v }
        auth.login(updatedUser)
        const apiSrc = getAvatarUrlForUser(updatedUser)
        userAvatar.value = apiSrc || accountIcon
      } else {
        const tempUser = { id: null, _id: null, avatar: response.data.avatar, avatarVersion: v }
        const apiSrc = getAvatarUrlForUser(tempUser)
        userAvatar.value = apiSrc || accountIcon
      }
      alert('Avatar mis à jour avec succès !')
    }
  } catch (error) {
    console.error('❌ Erreur upload (recadrage):', error)
    alert('Erreur lors de la mise à jour de l\'avatar')
  } finally {
    cancelAvatarCrop()
  }
}
async function handleAvatarUpload(event) {
  const file = event && event.target && event.target.files ? event.target.files[0] : null
  if (!file) return
  console.log('📁 Fichier sélectionné:', file.name, 'Taille:', file.size, 'Type:', file.type)
  if (file.size > 30 * 1024 * 1024) {
    alert('Le fichier est trop volumineux. Taille maximale : 30MB')
    if (event && event.target) event.target.value = ''
    return
  }
  if (!file.type.startsWith('image/')) {
    alert('Veuillez sélectionner une image')
    if (event && event.target) event.target.value = ''
    return
  }
  try {
    // GIF: upload direct pour préserver l'animation (pas de recadrage)
    const isGif = file.type === 'image/gif' || /\.gif$/i.test(file.name)
    if (isGif) {
      const formData = new FormData()
      formData.append('avatar', file)
      const response = await axios.post(`${API_URL}/users/upload-avatar`, formData, {
        headers: { 'Authorization': `Bearer ${user.value.token}` }
      })
      if (response.data && response.data.avatar) {
        const v = (typeof response.data.avatarVersion === 'number' && isFinite(response.data.avatarVersion)) ? response.data.avatarVersion : Date.now()
        if (user.value) {
          const updatedUser = { ...user.value, avatar: response.data.avatar, avatarVersion: v }
          auth.login(updatedUser)
          const apiSrc = getAvatarUrlForUser(updatedUser)
          userAvatar.value = apiSrc || accountIcon
        } else {
          const tempUser = { id: null, _id: null, avatar: response.data.avatar, avatarVersion: v }
          const apiSrc = getAvatarUrlForUser(tempUser)
          userAvatar.value = apiSrc || accountIcon
        }
        alert('Avatar GIF mis à jour avec succès !')
      }
      // Nettoyage des inputs pour permettre une nouvelle sélection du même fichier
      if (event && event.target) event.target.value = ''
      if (fileInput.value) fileInput.value.value = ''
      if (fileInputMobile.value) fileInputMobile.value.value = ''
      return
    }

    // Chemin standard: ouvrir l’éditeur de recadrage pour PNG/JPEG/WebP
    if (localAvatarUrl.value) { try { URL.revokeObjectURL(localAvatarUrl.value) } catch {} }
    lastSelectedAvatarFile.value = file
    localAvatarUrl.value = URL.createObjectURL(file)
    cropImageSrc.value = localAvatarUrl.value
    showAvatarCropper.value = true
  } catch (e) {
    console.error('❌ Impossible d\'ouvrir l\'éditeur de recadrage:', e)
    alert('Impossible d\'ouvrir l\'éditeur de recadrage')
  }
}

function openLogin() {
  showLoginPopup.value = true
}
function handleLoginSuccess(payload) {
  auth.login(payload.user, payload.rememberMe !== false);
  showLoginPopup.value = false;
  passwordValue.value = payload.password;
  
  // Charger l'avatar après connexion via endpoint public par userId
  const src = getAvatarUrlForUser(payload.user)
  if (src) {
    console.log('🖼️ URL avatar (API):', src);
    userAvatar.value = src;
  } else {
    console.log('❌ Impossible de déterminer l\'URL avatar, chargement depuis la DB...');
    loadUserAvatar();
  }
  
  // Charger les coins après connexion
  loadUserCoins();
  checkSpinAvailability();
  
  window.location.reload(); // Ajout pour refresh global après connexion
}
function logout() {
  auth.logout();
  coinsStore.reset();
  showUserDropdown.value = false
  showProfilePopup.value = false
  userAvatar.value = accountIcon; // Remettre l'icône par défaut
  
  // Remettre l'icône par défaut
  userAvatar.value = accountIcon;
  
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
function openForgotFromProfile() {
  // Ferme la pop-up Profil pour éviter la superposition
  showProfilePopup.value = false
  // Ouvre la pop-up « Mot de passe oublié » juste après
  nextTick(() => { showForgotPasswordProfile.value = true })
}
function openRedeemPopup() {
  showRedeemPopup.value = true
  redeemMessage.value = ''
}
function closeRedeemPopup() {
  showRedeemPopup.value = false
  redeemCode.value = ''
  redeemMessage.value = ''
}

// Sauvegarder la note publique du profil
async function savePublicNote() {
  if (!user.value || !user.value.token) {
    savePublicNoteMessage.value = 'Non connecté.'
    return
  }
  savingPublicNote.value = true
  savePublicNoteMessage.value = ''
  try {
    const trimmedNote = String(publicNoteDraft.value || '').slice(0, 60)
    const result = await secureApiCall('/users/me/public-note', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicNote: trimmedNote }),
    })

    // Fusionner la réponse avec l'utilisateur courant en conservant le token
    const current = user.value || {}
    const updatedUser = {
      ...current,
      ...(typeof result === 'object' && result ? result : {}),
      token: current.token, // préserver le token
      publicNote: (result && result.publicNote) != null ? String(result.publicNote).slice(0, 60) : trimmedNote,
    }
    auth.login(updatedUser)

    // Assure la valeur locale <= 60 même si le serveur renvoie tel quel
    publicNoteDraft.value = updatedUser.publicNote

    // Mettre à jour la valeur synchronisée pour permettre les mises à jour distantes
    lastSyncedPublicNote.value = updatedUser.publicNote

    // Nouveau: notifier les autres composants que la note publique a changé
    try {
      window.dispatchEvent(new CustomEvent('user-public-note-changed', {
        detail: {
          userId: updatedUser._id || updatedUser.id,
          publicNote: updatedUser.publicNote
        }
      }))
    } catch {}

    savePublicNoteMessage.value = 'Note enregistrée.'
  } catch (e) {
    console.error(e)
    const msg = e && e.message ? String(e.message) : ''
    savePublicNoteMessage.value = msg.includes('Session expirée')
      ? 'Session expirée. Veuillez vous reconnecter.'
      : 'Erreur lors de l\'enregistrement.'
  } finally {
    savingPublicNote.value = false
  }
}

// Synchronisation périodique de la note publique (profil)
async function fetchLatestUserPublicNote() {
  try {
    // Sécurité: ne rien faire si non connecté ou sans ID
    const u = user.value
    if (!u || !u.token) return
    const id = u._id || u.id
    if (!id) return

    // Remplacer '/users/me' par l'ID explicite de l'utilisateur
    const fresh = await secureApiCall(`/users/${encodeURIComponent(String(id))}`, { method: 'GET' })
    const freshNote = (fresh && fresh.publicNote != null) ? String(fresh.publicNote) : ''
    // On ne remplace le brouillon QUE s'il n'a pas changé depuis la dernière sync
    if (publicNoteDraft.value === lastSyncedPublicNote.value) {
      publicNoteDraft.value = freshNote
      lastSyncedPublicNote.value = freshNote
    }
  } catch (e) {
    // silencieux
  }
}

function startPublicNoteSync() {
  if (publicNoteSyncTimer.value) return
  // Ne pas démarrer si non connecté ou sans ID
  if (!user.value || !user.value.token || !(user.value._id || user.value.id)) return
  fetchLatestUserPublicNote()
  publicNoteSyncTimer.value = window.setInterval(fetchLatestUserPublicNote, 5000)
  try { window.addEventListener('focus', fetchLatestUserPublicNote) } catch {}
}

function stopPublicNoteSync() {
  if (publicNoteSyncTimer.value) {
    clearInterval(publicNoteSyncTimer.value)
    publicNoteSyncTimer.value = null
  }
  try { window.removeEventListener('focus', fetchLatestUserPublicNote) } catch {}
}

function suspendPublicNoteSync() {
  // Suspend la synchronisation pendant que l'utilisateur édite sa note
  try { stopPublicNoteSync() } catch {}
}

function resumePublicNoteSync() {
  // Reprend la synchronisation sans toucher au brouillon en cours
  try { startPublicNoteSync() } catch {}
}

// Musique de profil: état et fonctions
const selectedMusicFile = ref(null)
const musicUploading = ref(false)

// Découpe/preview locale
const localAudioUrl = ref(null)
const trimEnabled = ref(false)
const trimStart = ref(0)
const trimEnd = ref(0)
const audioDuration = ref(0)
const trimAudioEl = ref(null)
const isPlaying = ref(false)

// Aperçu de la musique actuelle du profil
const profileAudioEl = ref(null)
const isProfilePlaying = ref(false)

// Contrôle de volume commun (trim + musique de profil)
const musicVolume = ref(Math.max(0, Math.min(100, Number(localStorage.getItem('musicVolume') ?? 60))))

watch(musicVolume, (v) => {
  const vol = Math.max(0, Math.min(1, (Number(v) || 0) / 100))
  try { const t = trimAudioEl?.value; if (t) setElVolume(t, vol) } catch {}
  try { const p = profileAudioEl?.value; if (p) setElVolume(p, vol) } catch {}
  try { localStorage.setItem('musicVolume', String(Math.round(Math.max(0, Math.min(100, Number(v) || 0))))) } catch {}
})

// Initialiser le volume des players existants
{
  const vol = Math.max(0, Math.min(1, (Number(musicVolume.value) || 0) / 100))
  try { const t = trimAudioEl?.value; if (t) setElVolume(t, vol) } catch {}
  try { const p = profileAudioEl?.value; if (p) setElVolume(p, vol) } catch {}
}

watch([() => trimAudioEl.value, () => profileAudioEl.value], () => {
  const vol = Math.max(0, Math.min(1, (Number(musicVolume.value) || 0) / 100))
  try { const t = trimAudioEl?.value; if (t) t.volume = vol } catch {}
  try { const p = profileAudioEl?.value; if (p) p.volume = vol } catch {}
})

onMounted(() => {
  const vol = Math.max(0, Math.min(1, (Number(musicVolume.value) || 0) / 100))
  try { const t = trimAudioEl?.value; if (t) t.volume = vol } catch {}
  try { const p = profileAudioEl?.value; if (p) p.volume = vol } catch {}
})

function revokeLocalUrl() {
  try {
    if (localAudioUrl.value) {
      URL.revokeObjectURL(localAudioUrl.value)
    }
  } catch {}
  localAudioUrl.value = null
}

function onMusicFileChange(e) {
  try {
    const input = e && e.target ? e.target : null
    const files = input && input.files ? input.files : null
    if (!files || !files.length) {
      selectedMusicFile.value = null
      revokeLocalUrl()
      return
    }
    const f = files[0]
    if (!f) {
      selectedMusicFile.value = null
      revokeLocalUrl()
      return
    }
    const isMp3 = (/\.mp3$/i.test(f.name) || /^audio\/(mpeg|mp3)$/i.test(f.type))
    if (!isMp3) {
      alert('Veuillez sélectionner un fichier MP3.')
      selectedMusicFile.value = null
      revokeLocalUrl()
      return
    }
    if (f.size > 10 * 1024 * 1024) {
      alert('Le fichier dépasse 10 Mo.')
      selectedMusicFile.value = null
      revokeLocalUrl()
      return
    }
    selectedMusicFile.value = f
    revokeLocalUrl()
    localAudioUrl.value = URL.createObjectURL(f)

    // Définir automatiquement le titre sur le nom du fichier (sans extension)
    try {
      const baseName = f.name.replace(/\.[^\/.]+$/, '')
      musicTitle.value = baseName
    } catch {}

    // Réinitialiser les valeurs de découpe
    trimEnabled.value = false
    trimStart.value = 0
    trimEnd.value = 0
    audioDuration.value = 0
  } catch {
    selectedMusicFile.value = null
    revokeLocalUrl()
  }
}

function onLoadedMetadata() {
  try {
    const el = trimAudioEl.value
    if (!el) return
    audioDuration.value = Number(el.duration || 0)
    trimStart.value = 0
    trimEnd.value = Math.floor(audioDuration.value || 0)
    // Appliquer le volume quand les métadonnées sont prêtes (aperçu)
    try { el.volume = Math.max(0, Math.min(1, (Number(musicVolume.value) || 0) / 100)) } catch {}
  } catch {}
}

function onTrimChange(which) {
  try {
    const dur = Math.max(0, Math.floor(audioDuration.value || 0))
    trimStart.value = Math.max(0, Math.min(trimStart.value, dur))
    trimEnd.value = Math.max(0, Math.min(trimEnd.value, dur))
    if (which === 'start' && trimStart.value >= trimEnd.value) {
      trimEnd.value = Math.min(dur, trimStart.value + 1)
    }
    if (which === 'end' && trimEnd.value <= trimStart.value) {
      trimStart.value = Math.max(0, trimEnd.value - 1)
    }
  } catch {}
}

function onTimeUpdate() {
  try {
    const el = trimAudioEl.value
    if (!el) return
    const end = Math.max(trimStart.value, Math.min(trimEnd.value, audioDuration.value || 0))
    if (el.currentTime >= end) {
      el.pause()
      isPlaying.value = false
    }
  } catch {}
}

// WebAudio helpers pour volume mobile (iOS)
const audioGraph = {
  ctx: null,
  nodes: new Map(), // Map<HTMLAudioElement, { source, gain }>
}
const webAudioAvailable = ref(false) // Désactivation WebAudio pour fiabilité iOS

function isIOS() {
  try {
    const ua = navigator.userAgent || ''
    const iOS = /iPad|iPhone|iPod/.test(ua)
    const iPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
    return iOS || iPadOS
  } catch { return false }
}

async function ensureAudioContext() {
  try {
    if (audioGraph.ctx) return audioGraph.ctx
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return null
    const ctx = new Ctx()
    try { await ctx.resume() } catch {}
    audioGraph.ctx = ctx
    return ctx
  } catch { return null }
}

async function ensureAudioGraphFor(el) {
  // Revert: ne pas utiliser WebAudio (iOS) et garantir le dé-mute
  try {
    if (el) {
      try { el.muted = false } catch {}
    }
    webAudioAvailable.value = false
    return null
  } catch {
    return null
  }
}

// Alias de compatibilité avec gestion CORS: tente de construire le graphe WebAudio, sinon fallback natif
async function ensureAudioContextGraphFor(el) {
  try {
    if (!el) return null
    // Seulement utile pour iOS; ailleurs on garde le volume natif
    if (!isIOS()) return null
    if (audioGraph.nodes.has(el)) return audioGraph.nodes.get(el)
    const ctx = await ensureAudioContext()
    if (!ctx) return null
    try {
      const source = ctx.createMediaElementSource(el)
      const gain = ctx.createGain()
      source.connect(gain).connect(ctx.destination)
      // Éviter le son en double (sortie native + WebAudio)
      try { el.muted = true } catch {}
      const rec = { source, gain }
      audioGraph.nodes.set(el, rec)
      webAudioAvailable.value = true
      return rec
    } catch (err) {
      // CORS manquant sur le MP3 => WebAudio interdit. Fallback natif (non muté).
      console.warn('WebAudio désactivé (CORS manquant), fallback natif', err)
      webAudioAvailable.value = false
      try { el.muted = false } catch {}
      try { el.volume = Math.max(0, Math.min(1, (Number(musicVolume.value) || 0) / 100)) } catch {}
      return null
    }
  } catch {
    return null
  }
}

function setElVolume(el, vol) {
  try {
    if (!el) return
    // Forcer le mode natif: démuter et régler el.volume; iOS ignore el.volume mais la lecture fonctionne
    try { el.muted = false } catch {}
    try { el.volume = Number.isFinite(vol) ? vol : 0 } catch {}
  } catch {}
}

// Geste utilisateur: brancher WebAudio quand la lecture démarre
async function onTrimAudioPlay() {
  try {
    const el = trimAudioEl?.value
    const vol = Math.max(0, Math.min(1, (Number(musicVolume.value) || 0) / 100))
    // Essaie d’activer WebAudio sur iOS (fallback silencieux si non dispo)
    try { await ensureAudioGraphFor?.(el) } catch {}
    setElVolume(el, vol)
    isPlaying.value = true
  } catch {}
}

async function onProfileAudioPlay() {
  try {
    const el = profileAudioEl?.value
    const vol = Math.max(0, Math.min(1, (Number(musicVolume.value) || 0) / 100))
    try { await ensureAudioGraphFor?.(el) } catch {}
    setElVolume(el, vol)
    isProfilePlaying.value = true
  } catch {}
}

function togglePlay() {
  try {
    const el = trimAudioEl.value
    if (!el) return
    if (!isPlaying.value) {
      el.currentTime = Math.max(0, trimStart.value)
      // Appliquer le volume au moment de la lecture (piloté WebAudio si dispo)
      try { setElVolume(el, Math.max(0, Math.min(1, (Number(musicVolume.value) || 0) / 100))) } catch {}
      el.play().then(() => { isPlaying.value = true }).catch(() => { isPlaying.value = false })
    } else {
      el.pause()
      isPlaying.value = false
    }
  } catch {}
}

function toggleProfilePlay() {
  try {
    const el = profileAudioEl.value
    if (!el) return
    const start = (user.value && typeof user.value.musicStartSeconds === 'number') ? user.value.musicStartSeconds : 0
    const duration = (user.value && typeof user.value.musicDurationSeconds === 'number') ? user.value.musicDurationSeconds : null
    const end = (duration != null) ? start + duration : Infinity
    el._clipStart = start
    el._clipEnd = end
    if (!isProfilePlaying.value) {
      try { el.currentTime = start } catch {}
      // Appliquer le volume au moment de la lecture (piloté WebAudio si dispo)
      try { setElVolume(el, Math.max(0, Math.min(1, (Number(musicVolume.value) || 0) / 100))) } catch {}
      el.play().then(() => { isProfilePlaying.value = true }).catch(() => { isProfilePlaying.value = false })
    } else {
      el.pause()
      isProfilePlaying.value = false
    }
  } catch {}
}

function onProfileTimeUpdate() {
  try {
    const el = profileAudioEl.value
    if (!el) return
    const start = (typeof el._clipStart === 'number' && isFinite(el._clipStart)) ? el._clipStart : 0
    const end = el._clipEnd

    // Boucle sur le clip défini (start..end), ou sur tout le morceau si pas de durée
    if (typeof end === 'number' && isFinite(end) && el.currentTime >= end - 0.05) {
      if (!el.paused && isProfilePlaying.value) {
        try { el.currentTime = Math.max(0, start) } catch {}
        el.play().catch(() => {})
      }
      return
    }
    // Si la piste se termine (pas d’extrait défini): relancer depuis le début
    if (el.ended) {
      if (isProfilePlaying.value) {
        try { el.currentTime = Math.max(0, start) } catch {}
        el.play().catch(() => {})
      }
    }
  } catch {}
}

function formatTime(s) {
  try {
    const sec = Math.max(0, Math.floor(Number(s) || 0))
    const m = Math.floor(sec / 60).toString().padStart(2,'0')
    const r = (sec % 60).toString().padStart(2,'0')
    return `${m}:${r}`
  } catch { return '00:00' }
}

onUnmounted(() => {
  revokeLocalUrl()
})

async function handleMusicUpload() {
  try {
    if (!user.value || !user.value.token) {
      alert('Vous devez être connecté.')
      return
    }
    if (!selectedMusicFile.value) {
      alert('Veuillez sélectionner un fichier MP3.')
      return
    }
    musicUploading.value = true
    const form = new FormData()
    form.append('music', selectedMusicFile.value)
    // Envoyer le titre (fallback = nom du fichier sans extension)
    const fallbackTitle = selectedMusicFile.value
      ? selectedMusicFile.value.name.replace(/\.[^/.]+$/,'')
      : ''
    const currentTitle = (user.value && user.value.musicTitle) ? String(user.value.musicTitle) : ''
    const draft = (musicTitle.value || '').trim()
    // Si pas de nouveau titre saisi (ou identique à l'actuel), on prend le nom du fichier
    const titleToSend = (draft && draft !== currentTitle) ? draft : fallbackTitle
    form.append('title', titleToSend)
    if (trimEnabled.value && localAudioUrl.value) {
  const dur = Math.max(0, Number(audioDuration.value || 0))
  const start = Math.max(0, Math.min(Number(trimStart.value || 0), dur))
  const end = Math.max(start + 1, Math.min(Number(trimEnd.value || 0), dur))
  const duration = Math.max(1, Math.floor(end - start))
  form.append('startSeconds', String(Math.floor(start)))
  form.append('durationSeconds', String(duration))
}

    const resp = await axios.post(`${API_URL}/users/upload-music`, form, {
      headers: {
        'Authorization': `Bearer ${user.value.token}`,
      },
    })

    const payload = resp && resp.data ? resp.data : {}
    const musicSrc = payload.musicSrc
    const savedTitle = payload.musicTitle
    const savedStart = typeof payload.musicStartSeconds === 'number' ? payload.musicStartSeconds : null
    const savedDuration = typeof payload.musicDurationSeconds === 'number' ? payload.musicDurationSeconds : null

    const current = user.value || {}
    const updatedUser = {
      ...current,
      musicSrc: musicSrc || current.musicSrc || '',
      musicTitle: (typeof savedTitle === 'string' ? savedTitle : (musicTitle.value || '')),
      musicStartSeconds: savedStart,
      musicDurationSeconds: savedDuration,
    }
    auth.login(updatedUser)
    alert('Musique de profil mise à jour !')

    // Reset local preview
    isPlaying.value = false
    trimEnabled.value = false
    revokeLocalUrl()
  } catch (e) {
    console.error('handleMusicUpload error:', e)
    const msg = e && e.response && e.response.data && e.response.data.error ? e.response.data.error : 'Erreur lors de l’upload du MP3'
    alert(msg)
  } finally {
    musicUploading.value = false
  }
}

async function submitRedeemCode() {
  try {
    const code = (redeemCode.value || '').trim()
    if (!code) {
      redeemMessage.value = 'Veuillez entrer un code.'
      return
    }
    const res = await secureApiCall('/redeem-codes/redeem', { method: 'POST', body: JSON.stringify({ code }) })
    redeemMessage.value = (res && res.message) ? res.message : 'Code validé'

    // Recharger l’inventaire
    try { await coinsStore.loadInventory() } catch {}

    // Construire la liste d’items pour la pop-up cadeau
    const items = []
    if (res && res.rewardType === 'item') {
      // Gère 1 ou plusieurs items
      const rawItems = Array.isArray(res.payload?.items)
        ? res.payload.items
        : (res?.payload ? [{ itemId: res.payload.itemId, itemName: res.payload.itemName }] : [])

      // Base: { id, name }
      let list = rawItems
        .filter((entry) => entry && typeof entry.itemId !== 'undefined')
        .map((entry) => {
          const id = Number(entry.itemId)
          const name = String(entry.itemName || `Item ${id}`)
          return { id, name }
        })

      // Enrichir via /items pour les dynamiques (images/animations)
      try {
        const dyn = await secureApiCall('/items')
        if (dyn && dyn.success && Array.isArray(dyn.items)) {
          const byId = new Map()
          for (const it of dyn.items) {
            if (typeof it.legacyId !== 'undefined') byId.set(Number(it.legacyId), it)
            if (typeof it.id === 'number') byId.set(Number(it.id), it) // fallback si pas de legacyId
          }
          list = list.map((lite) => {
            const d = byId.get(Number(lite.id))
            if (d) {
              return {
                id: Number(typeof d.legacyId !== 'undefined' ? d.legacyId : d.id),
                name: d.name,
                isDynamic: true,
                assets: Array.isArray(d.assets) ? d.assets : [],
                backgrounds: d.backgrounds || {},
                variants: Array.isArray(d.variants) ? d.variants : []
              }
            }
            return lite
          })
        }
      } catch (e) {}

      items.push(...list)
    } else if (res && res.rewardType === 'border-color') {
      // Gère 1 ou plusieurs couleurs
      const rawColors = Array.isArray(res.payload?.colors)
        ? res.payload.colors
        : (res?.payload?.colorId ? [res.payload.colorId] : [])

      // 1) Assurer que le store contient aussi les dynamiques
      try { if (coinsStore.fetchDynamicBorderColors) await coinsStore.fetchDynamicBorderColors() } catch (e) {}

      // 2) Base: palette du store (statique + ce que fetchDynamicBorderColors a ajouté)
      let colorsCatalog = Array.isArray(coinsStore.borderColors) ? [...coinsStore.borderColors] : []

      // 3) Sécurité: merge avec l’API /border-colors (si dispo) pour couvrir tous les cas
      try {
        const bc = await secureApiCall('/border-colors')
        if (bc && bc.success && Array.isArray(bc.colors)) {
          const byId = new Map((colorsCatalog || []).map(c => [String(c.id), c]))
          for (const c of bc.colors) {
            if (!c || !c.id) continue
            const id = String(c.id)
            const existing = byId.get(id) || {}
            byId.set(id, { ...existing, ...c, id }) // fusionne nom/couleur/gradient
          }
          colorsCatalog = Array.from(byId.values())
        }
      } catch (e) {}

      for (const cid of rawColors) {
        const colorId = String(cid || '').trim()
        if (!colorId) continue
        const color = colorsCatalog.find((c) => String(c.id) === colorId)
        const name = (color && color.name) ? color.name : `Couleur ${colorId}`
        let numericId = (color && typeof color.legacyId === 'number') ? Number(color.legacyId) : null
        if (!Number.isFinite(numericId)) {
          let h = 0; for (let i = 0; i < colorId.length; i++) { h = (h * 31 + colorId.charCodeAt(i)) >>> 0 }
          numericId = -(100000 + (h % 100000))
        }
        items.push({ id: numericId, name, colorId })
      }
    }

    // Ouvrir la pop-up cadeau globale (sans message)
    if (items.length) {
      window.dispatchEvent(new CustomEvent('open-item-received', { detail: { items } }))
      closeRedeemPopup()
    }
  } catch (e) {
    redeemMessage.value = (e && e.message) ? e.message : 'Code invalide'
  }
}

// Réinitialiser les états de hover à l'ouverture des popups
watch(showFortuneWheel, (v) => {
  if (v === true) {
    hoverCloseWheel.value = false
    try { document.body.style.overflow = 'hidden' } catch (e) {}
  }
})
watch(showProfilePopup, async (v) => {
  if (v === true) {
    hoverCloseProfile.value = false
    // 1) Initialisation depuis l'utilisateur courant (si disponible)
    publicNoteDraft.value = (user.value && user.value.publicNote) ? String(user.value.publicNote) : ''
    savePublicNoteMessage.value = ''

    // Démarrer la synchronisation périodique de la note publique
    startPublicNoteSync()

    // 2) Sécurité mobile: si publicNote est absent dans l'objet utilisateur (ancien stockage),
    // on recharge le profil depuis l'API et on met à jour le store (token préservé).
    try {
      if (
        user.value &&
        (typeof user.value.publicNote === 'undefined' || user.value.publicNote === null)
      ) {
        const id = user.value._id || user.value.id
        if (id) {
          const fresh = await secureApiCall(`/users/${id}`)
          if (fresh && (fresh._id || fresh.id)) {
            const current = auth.user || {}
            // Conserver le token, fusionner les données
            const updatedUser = { ...current, ...fresh, token: current.token }
            auth.login(updatedUser) // met à jour le store + stockage persistant
            // Ré-initialiser le brouillon depuis la donnée rafraîchie
            publicNoteDraft.value = updatedUser.publicNote ? String(updatedUser.publicNote) : ''
          }
        }
      }
    } catch (e) {
      // En cas d'erreur réseau, on laisse le comportement actuel (brouillon inchangé)
      console.warn('Refresh user/publicNote échoué:', e)
    }

    try { document.body.style.overflow = 'hidden' } catch (e) {}
  } else {
    // Stopper la synchronisation quand la popup se ferme
    stopPublicNoteSync()
    try { document.body.style.overflow = '' } catch (e) {}
  }
})
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

function afficherSpecialite(spec) {
  if (!spec) return '';
  const s = String(spec).toLowerCase();
  if (['dev', 'devweb', 'developpement', 'développement', 'developpement web', 'développement web'].includes(s)) return 'Développement web';
  if (['creation', 'création', 'creation numerique', 'création numérique'].includes(s)) return 'Création numérique';
  if (['strategie', 'stratégie', 'strategie de communication', 'stratégie de communication'].includes(s)) return 'Stratégie de communication';
  return spec;
}

// Prof: activer/désactiver l'affichage dans le leaderboard
const leaderboardToggleBusy = ref(false)
async function toggleLeaderboardForMe() {
  if (!user.value) return
  try {
    leaderboardToggleBusy.value = true
    const current = !!user.value.leaderboardEnabled
    const res = await secureApiCall('/users/me/leaderboard', {
      method: 'PUT',
      body: JSON.stringify({ enabled: !current })
    })
    if (res && res.success && res.user) {
      const updatedUser = { ...(auth.user || {}), ...res.user, token: (auth.user && auth.user.token) }
      auth.login(updatedUser)
    } else if (typeof res?.leaderboardEnabled !== 'undefined') {
      const updatedUser = { ...(auth.user || {}), leaderboardEnabled: !!res.leaderboardEnabled, token: (auth.user && auth.user.token) }
      auth.login(updatedUser)
    }
    try { window.dispatchEvent(new CustomEvent('leaderboard-preferences-updated')) } catch {}
  } catch (e) {
    console.error('Toggle leaderboard échoué:', e)
    alert('Impossible de mettre à jour le paramètre du leaderboard.')
  } finally {
    leaderboardToggleBusy.value = false
  }
}

// Fonction pour gérer les erreurs de chargement d'image
function handleImageError(event) {
  console.log('❌ Erreur de chargement de l\'image:', event.target.src);
  console.log('🔄 Retour à l\'icône par défaut');
  userAvatar.value = accountIcon;
}

// Fonction pour gérer le chargement réussi d'image
function handleImageLoad(event) {
  console.log('✅ Image chargée avec succès:', event.target.src);
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
  
  if (user.value && user.value.id) {
    loadUserAvatar();
  }
  
  if (user.value) {
    await coinsStore.initialize();
    checkSpinAvailability();
  }
  
  setInterval(updateSpinTimer, 60000);
});

// Watcher pour surveiller les changements de l'utilisateur
watch(user, async (newUser) => {
  if (newUser) {
    const src = getAvatarUrlForUser(newUser)
    if (src) {
      userAvatar.value = src;
    } else if (newUser.id || newUser._id) {
      loadUserAvatar();
    } else {
      userAvatar.value = accountIcon;
    }

    // MODIF: ne pas écraser la saisie locale en cours
    const serverNote = newUser.publicNote ? String(newUser.publicNote) : ''
    if (!showProfilePopup.value || publicNoteDraft.value === lastSyncedPublicNote.value) {
      publicNoteDraft.value = serverNote
      lastSyncedPublicNote.value = serverNote
    }
    
    await coinsStore.initialize();
    checkSpinAvailability();
  } else {
    userAvatar.value = accountIcon;
    coinsStore.reset();
  }
}, { immediate: true });
onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  // Ensure public note sync stops if popup was open when component unmounts
  stopPublicNoteSync();
});
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
.fortune-wheel-icon-wrap {
  position: relative;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden; /* masque l’animation à l’intérieur du cercle */
  z-index: 0; /* base pour empiler la lueur en dessous de l'image */
  transition: transform 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
}
.fortune-wheel-icon-wrap::after {
  /* Cercle gris (bague) – présent en permanence pour permettre une vraie transition */
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: transparent;
  box-shadow: 0 0 0 0 rgba(224,224,224,0); /* invisible au repos */
  opacity: 0;
  transform: scale(1); /* état repos */
  transition: background 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease, transform 0.2s ease; /* même cadence que .shop-icon */
  pointer-events: none;
  z-index: 0;
}
.fortune-wheel-icon-wrap.fortune-available {
  /* halo ondulant externe (comme des ondes dans l'eau) */
  animation: fortuneRipple 1.8s ease-out infinite;
}
/* Au survol: on coupe l'animation jaune (halo + lueur interne) pour laisser l'over gris du bouton */
.fortune-wheel-btn:hover .fortune-wheel-icon-wrap.fortune-available { animation: none !important; box-shadow: none !important; }
.fortune-wheel-btn:hover .fortune-wheel-icon-wrap.fortune-available::before { animation: none !important; opacity: 0 !important; }
/* Reproduire EXACTEMENT le hover du .shop-icon sur l'icône de la roue */
.fortune-wheel-btn:hover .fortune-wheel-icon-wrap {
  overflow: visible !important; /* éviter que la bague soit rognée */
  transform: none !important;   /* ne pas scaler le wrapper pour éviter le sur-grossissement */
  background: transparent !important;
  box-shadow: none !important;
}
.fortune-wheel-btn:hover .fortune-wheel-icon-wrap::after {
  background: #e0e0e0; /* même fond gris que shop */
  box-shadow: 0 0 0 4px #e0e0e0, 0 4px 16px #0002; /* même bague que shop */
  opacity: 1;
  transform: scale(1.10); /* léger boost pour égaliser visuellement avec shop */
}
.fortune-wheel-btn:hover .fortune-wheel-icon {
  transform: scale(1.1) !important; /* même scale que .shop-icon */
  background: transparent !important;
  box-shadow: none !important;
}
.fortune-wheel-icon {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  transition: transform 0.2s ease;
  position: relative;
  z-index: 1; /* s'affiche au-dessus de la lueur interne */
}
.fortune-wheel-icon-wrap:hover .fortune-wheel-icon { transform: scale(1.08); }

/* Animation respirante interne */
.fortune-wheel-icon-wrap.fortune-available::before {
  content: '';
  position: absolute;
  inset: 0; /* couvre l’intérieur complet */
  border-radius: 50%;
  /* Vert (au lieu de jaune) */
  background: radial-gradient(circle, rgba(34, 197, 94, 0.35) 0%, rgba(34, 197, 94, 0.15) 55%, rgba(34, 197, 94, 0.0) 70%);
  animation: fortuneInnerPulse 1.6s ease-in-out infinite;
  pointer-events: none;
  z-index: 0; /* derrière l'image */
}
@keyframes fortuneInnerPulse {
  0% { opacity: 0.9; transform: scale(0.96); }
  50% { opacity: 1; transform: scale(1.05); }
  100% { opacity: 0.9; transform: scale(0.96); }
}

@keyframes fortuneRipple {
  0% {
    /* Vert (au lieu de jaune) */
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.35), 0 0 0 0 rgba(34, 197, 94, 0.18);
  }
  60% {
    box-shadow: 0 0 0 8px rgba(34, 197, 94, 0.0), 0 0 0 16px rgba(34, 197, 94, 0.0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.0), 0 0 0 0 rgba(34, 197, 94, 0.0);
  }
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

/* Thème sombre: barres du burger en blanc */

/* Thème clair: barres du burger en noir (verrouillé) */
[data-theme="light"] .burger-btn span {
  background: #222 !important;
}
/* Renfort mobile: très spécifique pour éviter toute inversion sur petits écrans */
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
  .mobile-menu-links .theme-toggle {
    padding: 10px 10px !important;
    margin-top: 46px !important;
  }

  /* Sombre: conserver exactement les mêmes espacements */
  [data-theme="dark"] .mobile-menu-links .theme-toggle {
    padding: 10px 10px !important;
    margin-top: 46px !important;
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

.account-btn.no-border {
  border: none !important;
  background: transparent !important;
  box-shadow: none !important;
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
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
  padding: 16px;
  padding-bottom: calc(16px + env(safe-area-inset-bottom));
  z-index: 9999;
  overflow: hidden;
}
.profile-popup {
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 2px 24px #0003;
  padding: 20px 32px 28px 32px; /* avant: 36px 32px 28px 32px -> remonte tout le contenu, donc le titre aussi */
  width: min(350px, 100%);
  max-width: calc(100vw - 32px);
  position: relative;
  text-align: center;
  font-family: 'Cobe Heavy', Inter, sans-serif;
  --profile-avatar-size: 100px;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* pour conserver le rayon sur le contenu */
  max-height: calc(100dvh - 32px - env(safe-area-inset-top) - env(safe-area-inset-bottom));
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}
.profile-popup h2 {
  margin-top: 0;
  margin-bottom: 14px;
  color: #111;
  font-size: 2em;
}
.profile-info {
  text-align: left;
  color: black;
  margin-top: 20px;
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

/* Styles de la fortune wheel dans la navbar */
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
  top: -21px !important;
  left: -17px !important;
  width: 94px !important;
  height: 100px !important;
  object-fit: contain;
  pointer-events: none;
  z-index: 15;
}

.equipped-cat-ears {
  position: absolute;
  top: -67px;
  left: -20px;
  width: 153%;
  height: 155%;
  object-fit: contain;
  pointer-events: none;
  z-index: 15;
  transform: none;
}
/* Spécifique Navbar (desktop) — prend le dessus sur les règles globales */
.odoo-navbar-bottom.navbar-logged .equipped-cat-ears,
.navbar-logged .odoo-navbar-bottom .equipped-cat-ears {
  top: -37px !important;
  left: -15px !important;
  width: 153% !important;
  height: 155% !important;
  z-index: 15 !important;
  transform: none !important;
}
/* Spécifique Navbar (mobile) — idem */
.odoo-navbar-bottom.navbar-logged .equipped-cat-ears-mobile {
  top: -67px !important;
  left: -20px !important;
  width: 153% !important;
  height: 155% !important;
  z-index: 15 !important;
  transform: none !important;
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
    z-index: 2 !important;
    pointer-events: none !important;
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
    z-index: 1 !important;
}
.equipped-alpha-overlay-mobile {
  position: absolute;
    top: 0px;
    left: 2px;
    width: 98%;
    height: 100%;
    object-fit: contain;
    pointer-events: none;
    z-index: 1;
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
    z-index: 1 !important;
}
.equipped-admin-planify-overlay-mobile {
  position: absolute;
    top: 0px;
    left: 2px;
    width: 98%;
    height: 100%;
    object-fit: contain;
    pointer-events: none;
    z-index: 1;
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
  top: -38px;
  left: -15px;
  width: 153%;
  height: 155%;
  object-fit: contain;
  pointer-events: none;
  z-index: 15;
  transform: none;
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
  left: 2px;
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
  z-index: 2;
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
 top: 53%;
    left: 52%;
    width: 94%;
    height: 90%;
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

/* ---- AJUSTEMENTS: avatar + item équipé dans la popup profil ---- */
.profile-avatar-wrap {
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 8px 0 16px 0;
}
/* Nouveau: scène qui sert de repère aux overlays (pas de overflow hidden) */
.profile-avatar-stage {
  position: relative;
  width: var(--profile-avatar-size, 57px);
  height: var(--profile-avatar-size, 57px);
  display: inline-block;
}
/* NOUVEAU: garde 57x57 et upscale tout le contenu (avatar + overlays) */
.profile-avatar-scaler {
  position: absolute;
  top: 0;
  left: 0;
  width: 57px;
  height: 57px;
  transform: scale(calc(var(--profile-avatar-size, 57px) / 57));
  transform-origin: top left;
}
.profile-avatar {
  position: relative;
  width: 57px;
  height: 57px;
  border-radius: 12px;
  overflow: hidden;       /* découpe uniquement l’image et les assets inside/below */
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px #0002, 0 1.5px 6px #0001;
}
.profile-avatar .avatar-img {
  width: 100%;
  height: 100px;
  object-fit: cover;
}
.equipped-item-name {
  font-size: 14px;
  color: #111;
  text-align: center;
}
/* Override UNIQUEMENT pour la popup Profil (après les règles de base pour gagner la cascade) */
.profile-popup .profile-avatar-stage {
  position: relative;
  width: var(--profile-avatar-size);
  height: var(--profile-avatar-size);
  box-sizing: border-box;
  border-radius: 12px;
  border: none !important; /* pas de bordure ici */
  /* pas d'overflow hidden pour laisser dépasser les overlays si besoin */
}
.profile-popup .profile-avatar-scaler {
  position: static !important;
  width: auto !important;
  height: auto !important;
  transform: none !important;
  transform-origin: initial !important;
}
.profile-popup .profile-avatar {
  width: 100%;
  height: 100%;
  line-height: 0;
  box-sizing: border-box;
}
.profile-popup .profile-avatar .avatar-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
/* Bordure 5px VISUELLE (non-scalée) sur la stage, sauf exceptions */
.profile-popup .profile-avatar-stage:not(.no-border) {
  border: none;
}

/* NOUVEAU: scalers pour adapter tous les items à la nouvelle taille */
.profile-popup .profile-content-scaler {
  position: absolute;
  top: 0;
  left: 0;
  width: 57px;   /* baseline */
  height: 57px;  /* baseline */
  transform: scale(calc(var(--profile-avatar-size) / 57));
  transform-origin: top left;
}

.profile-popup .profile-above-scaler {
  position: absolute;
  top: 0;
  left: 0;
  width: 57px;   /* baseline */
  height: 57px;  /* baseline */
  transform: scale(calc(var(--profile-avatar-size) / 57));
  transform-origin: top left;
  pointer-events: none;
}

/* -------------------------------------------------------------- */

/* Popup: 100x100 et bordure 5px (au lieu de 57x57 et 3px) */
.profile-popup { 
  --profile-avatar-size: 100px; 
}

.profile-popup .profile-avatar-stage {
  width: var(--profile-avatar-size) !important;
  height: var(--profile-avatar-size) !important;
  box-sizing: border-box;
  border-radius: 12px;
  border: none !important;
}

.profile-popup .profile-avatar-stage:not(.no-border) {
  border: none !important;
}

.profile-popup .profile-avatar {
  width: 100% !important;
  height: 100% !important;
  /* Avant: border: 5px solid #111 !important; => forçait le noir
     Maintenant: on laisse la couleur/gradient venir de getAccountBorderStyle()
     et on impose seulement l’épaisseur à 5px */
  border-width: 5px !important;
  border-style: solid;
  box-sizing: border-box;
  line-height: 0;
  box-shadow: none !important; /* évite l’illusion d’un “vide” en bas */
  overflow: hidden !important;
  border-radius: 12px !important;
  position: relative !important;
  z-index: 2 !important;
}
.profile-popup .profile-avatar.no-border {
  border: none !important;
  background: transparent !important; /* retire aussi un éventuel gradient inline */
}

.profile-popup .profile-avatar .avatar-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center !important;
}

/* Si un scaler existe encore dans le DOM, on le neutralise complètement dans la popup */
.profile-popup .profile-avatar-scaler {
  position: static !important;
  width: auto !important;
  height: auto !important;
  transform: none !important;
  transform-origin: initial !important;
}

/* Overrides spécifiques à la pop-up de profil pour les items statiques */
.profile-popup .equipped-cat-ears { top: -67px; left: -28px; width: 153%; height: 155%; }
.profile-popup .equipped-clown-overlay { top: -33px; left: -1px; width: 130%; height: 130%; }
.profile-popup .equipped-clown-nose { width: 65%; height: 65%; }
.profile-popup .equipped-target-inside { top: -15px; left: -10px; }
.profile-popup .equipped-roi-overlay { top: -60px; left: 15px; width: 80%; height: 80%; }
.profile-popup .equipped-royal-frame { top: -33px; left: -10px; width: 151%; height: 158%; }
.profile-popup .equipped-gentleman-overlay { top: -30px; left: 5px; width: 110%; height: 55%; }
.profile-popup .equipped-moustache-inside { top: 20px; left: 8px; width: 80%; height: 75%; }
.profile-popup .equipped-vinyle-overlay { top: -45px; left: 19px; width: 82%; height: 65%; }
.profile-popup .equipped-advisory-inside { top: 43px; left: 36px; }
.profile-popup .equipped-asteroide-overlay { top: 49px; left: 6px; }
.profile-popup .equipped-absolute-cinema-overlay { top: -10px; left: -30px; width: 30%; height: 100%; }
.profile-popup .equipped-absolute-cinema-overlay-right { left: 100px; }
.profile-popup .equipped-camera-overlay { top: 45px; left: 1px; width: 60%; height: 70%; }
.profile-popup .equipped-chat-overlay { top: -35px; left: 35px; }
/* AJOUT: Pate (Navbar – pop-up profil) */
.profile-popup .equipped-pate-overlay {
  pointer-events: none !important;
  position: absolute !important;
  top: 55%;
  left: 10%;
  width: 35% !important;
  height: 35% !important;
  object-fit: contain !important;
  z-index: 15 !important;
}
.profile-popup .equipped-nokia-inside { top: 80%; left: 15%; width: 60% !important; }
.profile-popup .equipped-clippy-inside { top: 26px; left: 46px; }
.profile-popup .equipped-daftpunk-overlay { top: -74px; left: 1px; width: 95%; height: 100%; }
.profile-popup .equipped-jojo-inside { bottom: -2px; left: 109px; width: 111%; height: 38%; }
.profile-popup .equipped-jojotext-inside { top: -12px; right: 6px; width: 90%; height: 85%; }
.profile-popup .equipped-galaxie-overlay { top: -31px !important; left: -33px !important; }
.profile-popup .equipped-coeur-overlay { top: -12px !important; left: -23px !important; }

.profile-popup .equipped-angel-wings {
  position: absolute !important;
  top: -85px !important;
  left: -73px !important;
  width: 246% !important;
  height: 148% !important;
  z-index: 0 !important;
  pointer-events: none !important;
}
.profile-popup .equipped-tomb-raider {
  position: absolute !important;
  top: -47px !important;
  left: 0px !important;
  width: 102% !important;
  height: 71% !important;
  z-index: 0 !important;            /* derrière la bordure de l’avatar */
  pointer-events: none !important;  /* ne bloque pas les clics */
}


/* ---- Musique du profil ---- */
.profile-music-uploader {
  margin-top: 12px;
  border-top: 1px solid #f0f0f0;
}
.music-upload-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}
.music-title-input {
  min-width: 200px;
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
}
.music-preview {
  margin-top: 10px;
  display: flex;
  gap: 12px;
  align-items: center;
  width: 100%;
}
.music-preview .preview-controls {
  flex: 1 1 auto;
  min-width: 0;
}
  .vinyle-gif {
  width: 48px;
  height: 48px;
  object-fit: contain;
}
/* défilement titre musique */
.marquee {
  position: relative;
  overflow: hidden;
  max-width: 280px;
  white-space: nowrap;
  border-radius: 6px;
  padding: 2px 6px;
  background: #f8f9fa;
  border: 1px solid #eee;
  color: #000 !important; /* titre en noir */
}
.marquee > span {
  display: inline-block;
  padding-left: 100%;
  animation: marquee-left 8s linear infinite;
  color: inherit; /* hérite du noir */
}
/* Input file: texte du nom de fichier (“Aucun fichier choisi”) en noir */
.profile-music-uploader input[type="file"] {
  color: #000 !important; /* affecte le libellé du fichier */
  max-width: 100%;
}
/* Bouton ‘Choisir un fichier’ (Chrome/Edge/Firefox récents) */
.profile-music-uploader input[type="file"]::file-selector-button {
  color: #000 !important;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 6px 10px;
  cursor: pointer;
}
/* Compat WebKit (Safari/anciens Chrome) */
.profile-music-uploader input[type="file"]::-webkit-file-upload-button {
  color: #000 !important;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 6px 10px;
  cursor: pointer;
}
@keyframes marquee-left {
  0%   { transform: translateX(0); }
  100% { transform: translateX(-100%); }
}

/* Enforce fixed 100x100 avatar container and image in profile popup */
.profile-popup .profile-avatar-stage,
.profile-popup .profile-avatar-scaler,
.profile-popup .profile-avatar {
  width: var(--profile-avatar-size) !important;
  height: var(--profile-avatar-size) !important;
}

.profile-popup .profile-avatar {
  overflow: hidden !important;
  border-radius: 12px !important;
  box-sizing: border-box !important;
}

.profile-popup .profile-avatar .avatar-img {
  width: 100% !important;
  height: 100% !important;
  display: block !important;
  object-fit: cover !important;
  object-position: center !important;
}

/* === Découpe audio profil (UI) === */
.trim-toggle {
  margin-top: 8px;
  color: #000;
  user-select: none;
}
.trim-toggle label { display: inline-flex; align-items: center; gap: 8px; }

.trim-controls {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: #f8f9fa;
  border: 1px solid #eee;
  border-radius: 10px;
  padding: 10px;
}
.trim-time {
  font-size: 12px;
  margin-bottom: 8px;
  color: #000;
  text-align: center;
}
.double-range {
  position: relative;
  height: 32px;
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}
.double-range input[type="range"] {
  position: absolute;
  left: 0; right: 0;
  width: 100%;
  pointer-events: none;
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
}
.double-range input[type="range"]::-webkit-slider-thumb {
  pointer-events: auto;
  -webkit-appearance: none;
  appearance: none;
  height: 16px; width: 16px; border-radius: 50%;
  background: #0d6efd; border: 2px solid #fff; box-shadow: 0 0 0 1px #0d6efd;
}
.double-range input[type="range"]::-moz-range-thumb {
  pointer-events: auto;
  height: 16px; width: 16px; border-radius: 50%;
  background: #0d6efd; border: 2px solid #fff;
}
.trim-actions { display: flex; justify-content: center; }

.preview-controls { display: flex; align-items: center; gap: 8px; }
.preview-title { font-weight: 600; font-size: 16px; color: #000; }
.btn { border: none; border-radius: 8px; padding: 8px 12px; cursor: pointer; }
.btn.btn-play {
  background: #0d6efd;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 6px 12px;
  cursor: pointer;
}
.btn.btn-play:hover { background: #0b5ed7; }

/* Additional UI improvements */
.file-input-large {
  width: 100%;
  font-size: 16px;
  color: #000 !important;
}
.file-input-large::file-selector-button {
  font-size: 14px;
}

/* Icon button styles for trim/preview controls */
.btn.btn-icon {
  background: #0d6efd;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 6px 10px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.btn.btn-icon .icon {
  width: 18px;
  height: 18px;
  display: block;
}

/* Marquee stretch adjustments */
.preview-controls .marquee {
  /* Let the title take all remaining space next to the play/pause button */
  flex: 1 1 auto;
  min-width: 0; /* allow shrinking within flex row */
  max-width: none; /* override base max-width */
}
.music-preview .marquee {
  width: 100%;
  max-width: none; /* ensure it can expand to full width */
}
/* Mobile étroit: avatar un peu plus petit, largeur 100% */
@media (max-width: 480px) {
  .profile-popup {
    max-width: 100%;
    width: min(350px, 100%);
    border-radius: 12px;
    --profile-avatar-size: 100px; /* réduit légèrement sur petit écran */
  }
}

/* === Correctifs demandés === */

/* 1) Dans la pop-up profil: Ange et Tomb Raider doivent passer derrière (z-index:0) */
.profile-popup .equipped-angel-wings,
.profile-popup .equipped-tomb-raider {
  z-index: 0 !important;
}

/* 2) Navbar: quand Étoiles est équipé, l’overlay ne doit pas bloquer le clic sur le bouton profil */
.user-dropdown .equipped-stars {
  pointer-events: none; /* laisse passer le clic vers le bouton .account-btn */
}

/* (Optionnel, si besoin sur mobile) */
.user-dropdown .equipped-stars.equipped-stars-mobile {
  pointer-events: none;
}

/* Pop-up profil (Navbar) – Discord overlay */
.profile-popup .equipped-discord-overlay { top: -5px; left: -22px; width: 135%;  height: 118%; }

/* Pop-up profil (Navbar) – Alpha overlay */
.profile-popup .equipped-alpha-overlay { top: -4px !important; z-index: 2 !important; }

/* Pop-up profil (Navbar) – Admin Planify overlay */
.profile-popup .equipped-admin-planify-overlay { z-index: 2 !important; top: -4px !important; height: 120%; }

/* Pop-up profil (Navbar) – Jojo: n’anime QUE l’avatar, pas la bordure */
.profile-popup .jojo-sepia .avatar-img { filter: sepia(0); animation: jojo-sepia-cycle 4.7s steps(1,end) infinite; }


/* === Avatar Cropper Modal === */
.cropper-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.30);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
}
.cropper-modal {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  max-width: 92vw;
  max-height: 92dvh;
  overflow: auto;
  box-shadow: 0 10px 30px rgba(0,0,0,0.25);
}
.cropper-box {
  position: relative;
  width: 300px;
  height: 300px;
  margin: 0 auto 12px;
  overflow: hidden;
  border-radius: 12px;
  background: #f2f2f2;
  cursor: grab;
  touch-action: none;
}
.cropper-box:active { cursor: grabbing; }
.cropper-image {
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: top left;
  user-select: none;
  -webkit-user-drag: none;
  pointer-events: none;
  will-change: transform;
  display: block;
}
.cropper-mask {
  position: absolute;
  inset: 0;
  box-shadow: 0 0 0 200vmax rgba(0,0,0,0.35) inset;
  border: 2px solid #00e19b;
  border-radius: 12px;
  pointer-events: none;
}
.cropper-controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.cropper-controls input[type="range"] {
  width: 100%;
}
.cropper-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.btn {
  background: #ddd;
  border: none;
  border-radius: 8px;
  padding: 8px 12px;
  cursor: pointer;
}
.btn.primary {
  background: linear-gradient(135deg, #00ffa3, #00d4ff);
  color: #111;
  font-weight: 700;
}

/* Fallback responsive si le JS ne s'exécute pas: réduire la boîte sur très petit écran */
@media (max-width: 480px) {
  .cropper-box {
    width: min(78vw, 78dvh);
    height: min(78vw, 78dvh);
  }
}

/* Animation de pulsation pour l'indicateur "nouveau" */
@keyframes dotPulse {
  0%   { transform: scale(1);    box-shadow: 0 0 0 2px rgba(16,185,129,.12); }
  50%  { transform: scale(1.18); box-shadow: 0 0 0 6px rgba(16,185,129,.18); }
  100% { transform: scale(1);    box-shadow: 0 0 0 2px rgba(16,185,129,.12); }
}
/* Indicateur “nouveau” à côté de À propos (desktop + mobile) */
.new-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  background: #10b981;
  border-radius: 999px;
  margin-left: 10px;
  box-shadow: 0 0 0 3px rgba(16,185,129,.18);
  animation: dotPulse 1.8s ease-out infinite;
  vertical-align: middle;
}

/* Top-right actions (theme toggle) */
.odoo-top-right-actions {
  position: absolute;
  top: 10px;
  right: 12px;
  z-index: 1200;
  display: flex;
  align-items: center;
  gap: 8px;
}
.theme-toggle {
  background: none;
  border: none;
  color: #111;
  font-size: 18px;
  line-height: 1;
  padding: 6px 10px;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 0 2px 8px #0001;
  transition: background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}
.theme-toggle:hover {
  background: #f0f0f0;
  transform: scale(1.05);
  box-shadow: 0 4px 16px #0002;
}
@media (max-width: 900px) {
  .odoo-top-right-actions {
    top: 8px;
    right: 8px;
  }
}

</style>