<template>
  <div v-if="show" class="shop-overlay" @click.self="emitClose">
    <div class="shop-modal">
      <div class="shop-header">
        <div class="header-left">
          <h1 class="shop-title">{{ activeTab === 'leaderboard' ? 'Leaderboard' : (activeTab === 'main' ? 'Collection' : 'Boutique Planify') }}</h1>
          <div v-if="activeTab === 'weekly'" class="header-info-row">
            <div class="weekly-timer">
              <div class="timer-info">
                <span class="timer-label">Prochaine boutique dans :</span>
                <span class="timer-value">{{ timeUntilReset }}</span>
              </div>
            </div>
            <div class="coins-wallet">
              <img src="@/assets/img/planicoins.webp" alt="Coin" class="coin-icon" />
              <span class="coins-value">{{ formatCoins(userCoins) }}</span>
            </div>
          </div>
        </div>
        <div class="header-right">
          <div class="shop-tabs">
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'main' }" 
          @click="activeTab = 'main'"
        >
          Collection
        </button>
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'weekly' }" 
          @click="switchToWeeklyTab"
        >
          Boutique
          <span v-if="showWeeklyResetNotification" class="weekly-reset-notification">3</span>
        </button>
        <!-- Onglet Leaderboard: visible si non prof OU prof avec leaderboard activé -->
        <button 
          v-if="showLeaderboardTab"
          class="tab-btn" 
          :class="{ active: activeTab === 'leaderboard' }" 
          @click="activeTab = 'leaderboard'"
        >
          Leaderboard
        </button>
      </div>
      <button v-if="!showPurchasePreview" class="close-btn header-close" @click="emitClose" @mouseover="hoverCloseShop = true" @mouseleave="hoverCloseShop = false">
        <img :src="hoverCloseShop ? closeHoverImg : closeImg" alt="Fermer" class="close-img" />
      </button>
      <button v-else class="close-btn header-close" @click="closePurchasePreview" @mouseover="hoverBackShop = true" @mouseleave="hoverBackShop = false">
        <img :src="hoverBackShop ? retourHoverImg : retourImg" alt="Retour" class="close-img" />
      </button>
      </div>
      </div>

      <div v-if="false" class="leaderboard-item">
        <!-- hidden template placeholder -->
      </div>

        <!-- Bouton activer/désactiver le leaderboard (profs uniquement) -->
        <button
          v-if="isProf"
          class="tab-btn"
          :disabled="shopLeaderboardBusy"
          @click="toggleLeaderboardFromShop"
          :title="(authStore.user?.leaderboardEnabled ? 'Désactiver' : 'Activer') + ' le leaderboard'"
          style="display: flex; justify-content: center; margin: 0 auto 20px !important;"
        >
          {{ shopLeaderboardBusy ? 'Mise à jour...' : (authStore.user?.leaderboardEnabled ? 'Désactiver le leaderboard' : 'Activer le leaderboard') }}
        </button>
      
      


      <!-- Collection -->
      <div v-if="activeTab === 'main' && !showSuggestionEditor" class="collection-search">
        <div class="search-input-wrap" style="position: relative; display: inline-block;">
          <input
            type="text"
            v-model="searchQuery"
            ref="searchInputRef"
            placeholder="Rechercher un item..."
            class="collection-search-input"
            aria-label="Rechercher un item par nom"
            style="padding-right: 80px;"
          />
          <button
            v-if="searchQuery && searchQuery.trim().length > 0"
            type="button"
            class="search-clear-btn"
            @click="clearSearch"
            aria-label="Effacer la recherche"
            style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); width: 30px; height: 30px; border: none; background: transparent; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; color: #666;"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
              <path d="M6 6 L18 18 M6 18 L18 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        <button type="button" class="info-icon-btn" @click="showFavoritesOnly = !showFavoritesOnly" :title="showFavoritesOnly ? 'Afficher tous les items' : 'Afficher uniquement les favoris'">
          <img :src="showFavoritesOnly ? bookmarksRemplie : bookmarksVide" alt="Filtre favoris" style="width: 18px; height: 18px; object-fit: contain;" />
        </button>
        <button type="button" class="tab-btn" :class="{ active: showSuggestionEditor }" @click="openSuggestEditor" title="Suggérer un item" style="margin-left: 8px;">Suggérer un item</button>
        <button type="button" class="tab-btn" :class="{ active: showMyItemsPanel }" @click="toggleMyItemsPanel" title="Mes items" style="margin-left: 8px;">Mes Items</button>
      </div>
      <div v-if="showSuggestionEditor" class="weekly-shop-container single-col fenetre-collection" ref="weeklyContainerRef">
        <div class="weekly-preview" :style="{ height: forceWeeklyHeight ? (forceWeeklyHeight + 'px') : undefined, width: '1235.45px' }">
          <div class="suggest-toolbar" style="display:flex;flex-direction:column;gap:10px;margin-bottom:10px;">
            <div class="suggest-row" style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:center;">
              <input type="file" accept="image/*" @change="onSuggestFile" />
              <input type="text" v-model="suggestUrl" placeholder="Importer via URL" class="url-input" />
              <button class="tab-btn" @click="onSuggestUrl">Importer</button>
              <label class="price-label">Prix: <input type="number" v-model.number="suggestPrice" min="150" max="500" step="1" class="price-input" /></label>
              <button class="tab-btn" @click="saveSuggestion">Sauvegarder</button>
              <button class="tab-btn" @click="closeSuggestEditor">Fermer</button>
            </div>
            <div class="suggest-row" style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:center;">

              <div class="variants-ui" style="display:flex;flex-wrap:wrap;align-items:center;gap:6px;">
                <span>Styles:</span>
                <button class="tab-btn" v-for="(v, vi) in suggestVariants" :key="'sv-'+vi" :class="{ active: vi === activeVariantIndex }" @click="selectVariant(vi)">{{ v.name || ('Style ' + (vi + 1)) }}</button>
                <div class="rename-group" v-if="suggestVariants && suggestVariants.length" style="display:flex;align-items:center;gap:6px;">
                  <label>Nom: <input type="text" v-model="suggestVariants[activeVariantIndex].name" placeholder="Nom du style" class="variant-name-input" /></label>
                </div>
                <div class="variant-actions" style="display:flex;flex-wrap:wrap;gap:6px;">
                  <button class="tab-btn" @click="addVariant">+ Ajouter</button>
                  <button class="tab-btn" @click="duplicateVariant">Dupliquer</button>
                  <button class="tab-btn" @click="removeVariant" :disabled="suggestVariants.length <= 1">Supprimer</button>
                </div>
              </div>
            </div>
          </div>
          <div class="admin-preview-toolbar preview-slider-controls">
            <button class="slider-arrow left-arrow" v-if="!isMobile && previewWindowIndex > 0" type="button" @click="prevSuggestPreview">◀</button>
            <button class="slider-arrow right-arrow" v-if="!isMobile && previewWindowIndex < getSuggestMaxStart()" type="button" @click="nextSuggestPreview">▶</button>
          </div>
          <div class="preview-slider-viewport" :style="sliderViewportStyle">
            <div class="preview-slider-track" :class="slideDirectionClass" :style="sliderTrackStyle">
            <div class="preview-card preview-daily-shop" :key="'slide-dailyShop'">
              <div class="preview-title">Aperçu Boutique Quotidienne</div>
              <div class="item-img-wrapper large" :class="{ 'mobile-mode': suggestDevice === 'mobile' }">
                <div class="item-img-container">
                  <img v-if="suggestAssetSrc" :src="suggestAssetSrc" :class="['item-img','draggable', draggingKey==='dailyShop' ? 'drag-active' : '']" :style="getSuggestStyle('dailyShop')" @click="startDrag('dailyShop', $event)" @touchstart.prevent.stop="startDragTouch('dailyShop', $event)" />
                </div>
              </div>
              <div class="item-actions" style="display:flex;gap:8px;justify-content:center;margin-top:12px;">
                <label>Taille: <input type="range" min="10" max="120" v-model.number="suggestStyles.dailyShop.width" /></label>
                <label>Top: <input type="number" v-model.number="suggestStyles.dailyShop.top" /></label>
                <label>Left: <input type="number" v-model.number="suggestStyles.dailyShop.left" /></label>
                <button class="close-btn-small center-btn" @click="centerSuggest('dailyShop')" @mouseover="hoverCenterDaily = true" @mouseleave="hoverCenterDaily = false"><img :src="hoverCenterDaily ? centerHoverImg : centerImg" alt="Centrer" class="close-img" /></button>
              </div>
            </div>
            <div class="preview-card preview-collection" :key="'slide-collection'">
              <div class="preview-title">Aperçu Collection</div>
              <div class="item-img-wrapper large" :class="{ 'mobile-mode': suggestDevice === 'mobile' }">
                <div class="item-img-container">
                  <img v-if="suggestAssetSrc" :src="suggestAssetSrc" :class="['item-img','draggable', draggingKey==='collectionPreview' ? 'drag-active' : '']" :style="getSuggestStyle('collectionPreview')" @click="startDrag('collectionPreview', $event)" @touchstart.prevent.stop="startDragTouch('collectionPreview', $event)" />
                </div>
              </div>
              <div class="preview-actions" style="display:flex;gap:8px;justify-content:center;">
                <button class="tab-btn" :class="{ active: suggestDevice==='desktop' }" @click="suggestDevice='desktop'">Desktop</button>
                <button class="tab-btn" :class="{ active: suggestDevice==='mobile' }" @click="suggestDevice='mobile'">Mobile</button>
              </div>
              <div class="item-actions" style="display:flex;gap:8px;justify-content:center;margin-top:12px;">
                <label>Taille: <input type="range" min="10" max="120" v-model.number="suggestStyles.collectionPreview.width" /></label>
                <label>Top: <input type="number" v-model.number="suggestStyles.collectionPreview.top" /></label>
                <label>Left: <input type="number" v-model.number="suggestStyles.collectionPreview.left" /></label>
                <button class="close-btn-small center-btn" @click="centerSuggest('collectionPreview')" @mouseover="hoverCenterCollectionPreview = true" @mouseleave="hoverCenterCollectionPreview = false"><img :src="hoverCenterCollectionPreview ? centerHoverImg : centerImg" alt="Centrer" class="close-img" /></button>
              </div>
            </div>
            <div class="preview-card preview-item" :key="'slide-cosmetic'">
              <div class="preview-title">Aperçu Cosmétique</div>
              <div class="item-img-wrapper large">
                <div class="item-img-container">
                  <img v-if="suggestAssetSrc" :src="suggestAssetSrc" :class="['item-img','draggable', draggingKey==='collection' ? 'drag-active' : '']" :style="getSuggestStyle('collection')" @click="startDrag('collection', $event)" @touchstart.prevent.stop="startDragTouch('collection', $event)" />
                </div>
              </div>
              <div class="item-actions" style="display:flex;gap:8px;justify-content:center;margin-top:12px;">
                <label>Taille: <input type="range" min="10" max="120" v-model.number="suggestStyles.collection.width" /></label>
                <label>Top: <input type="number" v-model.number="suggestStyles.collection.top" /></label>
                <label>Left: <input type="number" v-model.number="suggestStyles.collection.left" /></label>
                <button class="close-btn-small center-btn" @click="centerSuggest('collection')" @mouseover="hoverCenterCollection = true" @mouseleave="hoverCenterCollection = false"><img :src="hoverCenterCollection ? centerHoverImg : centerImg" alt="Centrer" class="close-img" /></button>
              </div>
            </div>
            <div class="preview-card preview-leaderboard" :key="'slide-leaderboard'">
              <div class="preview-title">Aperçu Leaderboard</div>
              <div class="preview-list">
                <div class="leaderboard-item" v-for="(u, ui) in suggestLeaderboardUsers" :key="'sl-u-'+ui">
                  
                  <div class="user-avatar-container">
                    <div class="user-avatar" :class="{ 'no-border': removeLeaderboardBorder }">
                      <div class="avatar-img" style="position:relative;">
                        <img v-if="suggestAssetSrc && u.isYou && suggestPlacement.leaderboard === 'inside'" :src="suggestAssetSrc" :class="['draggable', draggingKey==='leaderboard' ? 'drag-active' : '']" :style="getSuggestStyle('leaderboard')" @click="startDrag('leaderboard', $event)" @touchstart.prevent.stop="startDragTouch('leaderboard', $event)" />
                      </div>
                    </div>
                    <img v-if="suggestAssetSrc && u.isYou && suggestPlacement.leaderboard === 'above'" :src="suggestAssetSrc" :class="['draggable','overlay-above-leader', draggingKey==='leaderboard' ? 'drag-active' : '']" :style="getSuggestStyle('leaderboard')" @click="startDrag('leaderboard', $event)" @touchstart.prevent.stop="startDragTouch('leaderboard', $event)" />
                  </div>
                  <div class="user-details"><div class="username">{{ u.name }}</div></div>
                </div>
              </div>
              <div class="item-actions" style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:12px;">
                <label>Taille: <input type="range" min="10" max="120" v-model.number="suggestStyles.leaderboard.width" /></label>
                <label>Top: <input type="number" v-model.number="suggestStyles.leaderboard.top" /></label>
                <label>Left: <input type="number" v-model.number="suggestStyles.leaderboard.left" /></label>
                <div class="actions-row">
                  <button class="close-btn-small placement-btn" :class="{ active: suggestPlacement.leaderboard === 'above' }" @click="togglePlacement('leaderboard')" @mouseover="hoverPlacementLeaderboard = true" @mouseleave="hoverPlacementLeaderboard = false" :aria-label="suggestPlacement.leaderboard === 'inside' ? 'À l’intérieur' : 'Par-dessus'" :title="suggestPlacement.leaderboard === 'inside' ? 'À l’intérieur' : 'Par-dessus'">
                    <img :src="getPlacementImg('leaderboard', hoverPlacementLeaderboard)" alt="Placement" class="close-img" />
                  </button>
                  <button class="close-btn-small border-toggle-btn" :class="{ active: removeLeaderboardBorder }" @click="toggleBorder('leaderboard')" @mouseover="hoverToggleLeaderboard = true" @mouseleave="hoverToggleLeaderboard = false">
                    <img :src="(hoverToggleLeaderboard || removeLeaderboardBorder) ? borderHoverIcon : borderIcon" alt="Bordure" class="close-img" />
                  </button>
                  <button class="close-btn-small center-btn" @click="centerSuggest('leaderboard')" @mouseover="hoverCenterLeaderboard = true" @mouseleave="hoverCenterLeaderboard = false"><img :src="hoverCenterLeaderboard ? centerHoverImg : centerImg" alt="Centrer" class="close-img" /></button>
                </div>
              </div>
            </div>
            <div class="preview-card preview-avatar" :key="'slide-avatar'">
              <div class="preview-title">Aperçu Large/Avatar</div>
              <div class="profile-avatar-stage" :style="`height: ${suggestAvatarStageHeight}px !important`">
                <div class="profile-avatar-scaler" :style="`border:none; height: ${suggestAvatarStageHeight}px !important`">
                  <div class="profile-avatar" :class="{ 'no-border': removeAvatarBorder }" style="position:relative;">
                    <div class="avatar-img" style="position:relative; width:150px; height:150px; border-radius:24px; border:none; overflow:hidden;">
                      <img v-if="suggestAssetSrc && suggestPlacement.avatar === 'inside'" :src="suggestAssetSrc" :class="['draggable', draggingKey==='avatar' ? 'drag-active' : '']" :style="getSuggestStyle('avatar')" @click="startDrag('avatar', $event)" @touchstart.prevent.stop="startDragTouch('avatar', $event)" />
                    </div>
                  </div>
                  <img v-if="suggestAssetSrc && suggestPlacement.avatar === 'above'" :src="suggestAssetSrc" :class="['draggable','overlay-above', draggingKey==='avatar' ? 'drag-active' : '']" :style="getSuggestStyle('avatar')" @click="startDrag('avatar', $event)" @touchstart.prevent.stop="startDragTouch('avatar', $event)" />
                </div>
              </div>
              <div class="item-actions" style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:12px;">
                <label>Taille: <input type="range" min="10" max="300" step="1" v-model.number="suggestStyles.avatar.width" /></label>
                <label>Hauteur: <input type="range" min="250" max="400" step="1" v-model.number="suggestAvatarStageHeight" /></label>
                <label>Top: <input type="number" v-model.number="suggestStyles.avatar.top" /></label>
                <label>Left: <input type="number" v-model.number="suggestStyles.avatar.left" /></label>
                <div class="actions-row">
                  <button class="close-btn-small placement-btn" :class="{ active: suggestPlacement.avatar === 'above' }" @click="togglePlacement('avatar')" @mouseover="hoverPlacementAvatar = true" @mouseleave="hoverPlacementAvatar = false" :aria-label="suggestPlacement.avatar === 'inside' ? 'À l’intérieur' : 'Par-dessus'" :title="suggestPlacement.avatar === 'inside' ? 'À l’intérieur' : 'Par-dessus'">
                    <img :src="getPlacementImg('avatar', hoverPlacementAvatar)" alt="Placement" class="close-img" />
                  </button>
                  <button class="close-btn-small border-toggle-btn" :class="{ active: removeAvatarBorder }" @click="toggleBorder('avatar')" @mouseover="hoverToggleAvatar = true" @mouseleave="hoverToggleAvatar = false">
                    <img :src="(hoverToggleAvatar || removeAvatarBorder) ? borderHoverIcon : borderIcon" alt="Bordure" class="close-img" />
                  </button>
                  <button class="close-btn-small center-btn" @click="centerSuggest('avatar')" @mouseover="hoverCenterAvatar = true" @mouseleave="hoverCenterAvatar = false"><img :src="hoverCenterAvatar ? centerHoverImg : centerImg" alt="Centrer" class="close-img" /></button>
                </div>
              </div>
            </div>

            <div class="preview-card preview-navbar" :key="'slide-navbar'">
              <div class="preview-title">Aperçu Navbar</div>
              <div class="item-img-wrapper large">
                <div class="navbar-stage" style="position:relative;width:51px;height:51px;display:flex;align-items:center;justify-content:center;">
                  <div class="item-img-container account-btn" style="position:relative;width:51px;height:51px;margin-left:0;border:3px #000 solid !important;border-radius:12px !important;box-shadow:0 4px 16px #0002, 0 1.5px 6px #0001 !important;overflow:hidden;">
                    <img v-if="suggestAssetSrc && suggestPlacement.navbar === 'inside'" :src="suggestAssetSrc" :class="['item-img','draggable', draggingKey==='navbar' ? 'drag-active' : '']" :style="getSuggestStyle('navbar')" @click="startDrag('navbar', $event)" @touchstart.prevent.stop="startDragTouch('navbar', $event)" />
                  </div>
                  <img v-if="suggestAssetSrc && suggestPlacement.navbar === 'above'" :src="suggestAssetSrc" :class="['item-img','draggable', draggingKey==='navbar' ? 'drag-active' : '']" :style="getSuggestStyle('navbar')" @click="startDrag('navbar', $event)" @touchstart.prevent.stop="startDragTouch('navbar', $event)" />
                </div>
              </div>
              <div class="item-actions" style="display:flex;gap:8px;justify-content:center;margin-top:12px;">
                <label>Taille: <input type="range" min="10" max="120" v-model.number="suggestStyles.navbar.width" /></label>
                <label>Top: <input type="number" v-model.number="suggestStyles.navbar.top" /></label>
                <label>Left: <input type="number" v-model.number="suggestStyles.navbar.left" /></label>
                <div class="actions-row">
                  <button class="close-btn-small placement-btn" :class="{ active: suggestPlacement.navbar === 'above' }" @click="togglePlacement('navbar')" @mouseover="hoverPlacementNavbar = true" @mouseleave="hoverPlacementNavbar = false" :aria-label="suggestPlacement.navbar === 'inside' ? 'À l’intérieur' : 'Par-dessus'" :title="suggestPlacement.navbar === 'inside' ? 'À l’intérieur' : 'Par-dessus'">
                    <img :src="getPlacementImg('navbar', hoverPlacementNavbar)" alt="Placement" class="close-img" />
                  </button>
                  <button class="close-btn-small center-btn" @click="centerSuggest('navbar')" @mouseover="hoverCenterNavbar = true" @mouseleave="hoverCenterNavbar = false"><img :src="hoverCenterNavbar ? centerHoverImg : centerImg" alt="Centrer" class="close-img" /></button>
                </div>
              </div>
            </div>

            <div v-if="suggestPreviewSlides.includes('popup-style')" class="preview-card preview-popup-style" :key="'slide-popup-style'">
              <div class="preview-title">Aperçu Pop-up Style</div>

              <div class="item-img-wrapper large" :style="getPopupWrapperStyle()">
                <div class="item-img-container">
                  <img v-if="suggestVariants && suggestVariants[activeVariantIndex] && suggestVariants[activeVariantIndex].assetSrc" :src="suggestVariants[activeVariantIndex].assetSrc" :class="['item-img','draggable', draggingKey==='popupStyle' ? 'drag-active' : '']" :style="getSuggestStyle('popupStyle')" @click="startDrag('popupStyle', $event)" @touchstart.prevent.stop="startDragTouch('popupStyle', $event)" />
                </div>
              </div>
              <div class="item-actions" style="display:flex;gap:8px;justify-content:center;margin-top:12px;">
                <label>Taille: <input type="range" min="10" max="300" step="0.5" v-model.number="suggestStyles.popupStyle.width" /></label>
                <label>Top: <input type="number" v-model.number="suggestStyles.popupStyle.top" /></label>
                <label>Left: <input type="number" v-model.number="suggestStyles.popupStyle.left" /></label>
                <button class="close-btn-small center-btn" @click="centerSuggest('popupStyle')" @mouseover="hoverCenterPopup = true" @mouseleave="hoverCenterPopup = false"><img :src="hoverCenterPopup ? centerHoverImg : centerImg" alt="Centrer" class="close-img" /></button>
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>
      <div v-if="activeTab === 'main' && !showSuggestionEditor" class="shop-grid">
        <div 
          v-for="(item, index) in (showMyItemsPanel ? myCreatedItems : filteredCollectionItems)" 
          :key="item.id" 
          class="shop-item collection-item" 
          :class="{ 
            'not-owned': !coinsStore.hasItem(item.id), 
            'owned': coinsStore.hasItem(item.id) && !coinsStore.isItemEquipped(item.id),
            'equipped': coinsStore.isItemEquipped(item.id)
          }"
        >
          <!-- Checkmark pour les items débloqués -->
          <div v-if="coinsStore.hasItem(item.id)" class="checkmark-icon">✓</div>
          <!-- Cadenas pour les items verrouillés -->
          <div v-if="!coinsStore.hasItem(item.id)" class="lock-icon">🔒</div>
          <!-- Palette pour Discord: switch d'apparence (affichée même si non possédé) -->
          <button 
            v-if="item.name === 'Discord'"
            class="palette-icon"
            type="button"
            @click.stop="openDiscordStylePicker(item)"
            title="Changer le style Discord"
          >
            <img :src="styleIcon" alt="Palette" style="width: 18px; height: 18px; object-fit: contain;" />
          </button>
          
          <!-- Palette pour Jojo: activer/désactiver le texte (affichée même si non possédé) -->
          <button 
            v-if="item.name === 'Jojo'"
            class="palette-icon"
            type="button"
            @click.stop="openJojoStylePicker(item)"
            title="Changer le style Jojo"
          >
            <img :src="styleIcon" alt="Palette" style="width: 18px; height: 18px; object-fit: contain;" />
          </button>
          
          <!-- Palette pour les items dynamiques avec variantes (affichée même si non possédé) -->
          <button 
            v-if="item.isDynamic && Array.isArray(item.variants) && item.variants.length > 0"
            class="palette-icon"
            type="button"
            @click.stop="openDynamicStylePicker(item)"
            title="Changer le style"
          >
            <img :src="styleIcon" alt="Palette" style="width: 18px; height: 18px; object-fit: contain;" />
          </button>

          <!-- Favori: même composant visuel que palette-icon; sous la palette si l'item a des styles, sinon à sa place -->
          <button 
            class="palette-icon"
            type="button"
            :style="{ top: (item.name === 'Discord' || item.name === 'Jojo' || (item.isDynamic && Array.isArray(item.variants) && item.variants.length > 0)) ? '40px' : '8px', left: '10px' }"
            @click.stop="toggleFavoriteByItem(item)"
            @mouseover="hoverFavIndex = index"
            @mouseleave="hoverFavIndex = null"
            :title="isFavoriteById(getStableItemId(item)) ? 'Retirer des favoris' : 'Ajouter aux favoris'"
          >
            <img :src="getFavoriteIconSrc(getStableItemId(item), hoverFavIndex === index)" alt="Favori" style="width: 18px; height: 18px; object-fit: contain;" />
          </button>
          
                      <div class="item-img-wrapper" :style="item.name === 'Roi' || item.name === 'Matrix' || item.name === 'Oreilles de chat' || item.name === 'Ange' || item.name === 'Tomb Raider' || item.name === 'Clown' || item.name === 'Cash' || item.name === 'Cible' || item.name === 'Étoiles' || item.name === 'Cadre royale' || item.name === 'Roses' || item.name === 'Gentleman' || item.name === 'Vinyle' || item.name === 'Advisory' || item.name === 'Espace' || item.name === 'Absolute Cinema' || item.name === 'Flash' || item.name === 'Miaou' || item.name === 'DVD' || item.name === 'Lunettes pixel' || item.name === '2000' ? 'background: #fff;' : ''">
              <div v-if="item.name !== 'Cash'" class="item-img-container" :key="item.name === 'Jojo' ? 'jj-'+jojoAnimKey : 'imgc-'+index" :class="{ 'black-bg': item.name === 'Étoiles' || item.name === 'Espace' || item.name === 'DVD', 'jojo-bg-anim': (item.displayType === 'jojo' || item.name === 'Jojo') }">
                <!-- Aperçu couleur pour Bordure classique (aucune image) -->
                <div v-if="item.id === 0" class="classic-border-preview" :style="classicBorderStyle" data-darkreader-ignore></div>

                <!-- Items dynamiques avec variantes: utiliser la variante sélectionnée (priorité) -->
                <template v-else-if="item.isDynamic && Array.isArray(item.variants) && item.variants.length > 0">
                  <div class="dynamic-variant-item-shop" :key="'dyn-variant-container-'+item.id+'-'+variantUpdateKey">
                    <div v-if="getDynVariantBgStyle(item).background !== 'none'" class="dyn-bg" :style="getDynVariantBgStyle(item)"></div>
                    <img v-for="(a, ai) in getDynVariantAssets(item)" :key="'dyn-variant-'+item.id+'-'+ai+'-'+variantUpdateKey" :src="resolveAssetSrc(a.src)" :style="getDynVariantAssetStyle(a)" />
                  </div>
                </template>
                <!-- Items dynamiques: fond + rendu des assets avec positions enregistrées (fallback) -->
                <template v-else-if="item.isDynamic && Array.isArray(item.assets) && item.assets.length">
                  <div class="dyn-bg" :style="getDynBgStyle(item)"></div>
                  <img v-for="(a, ai) in item.assets" :key="'dyn-'+item.id+'-'+ai" :src="resolveAssetSrc(a.src)" :style="getDynAssetStyle(a)" />
                </template>

                <img v-else-if="item.id !== 0 && item.name !== 'Matrix' && item.name !== 'Clown' && item.name !== 'Cash' && item.name !== 'Roi' && item.name !== 'Cible' && item.name !== 'Étoiles' && item.name !== 'Cadre royale' && item.name !== 'Roses' && item.name !== 'Gentleman' && item.name !== 'Vinyle' && item.name !== 'Advisory' && item.name !== 'Espace' && item.name !== 'Absolute Cinema' && item.name !== 'Flash' && item.name !== 'Miaou' && item.name !== 'DVD' && item.name !== 'Lunettes pixel' && item.name !== '2000' && item.name !== 'Ange' && item.name !== 'Discord' && item.name !== 'Jojo' && item.name !== 'Galaxie' && item.name !== 'Coeur' && item.name !== 'Prestige' && item.name !== 'Planify'" :src="item.img" :alt="item.name" class="item-img" loading="lazy" />
              
                <!-- Animation Matrix -->
                <div v-if="item.name === 'Matrix'" class="matrix-rain-inside-shop">
                  <div class="matrix-column" v-for="(col, ci) in getMatrixColumns(item)" :key="'mc-'+ci" :style="{ left: (ci * 5) + '%', animationDelay: (col.delay) + 's' }">
                    <span v-for="(ch, ri) in col.chars" :key="'mch-'+ri" class="matrix-char">{{ ch }}</span>
                  </div>
                </div>
                 <!-- Discord: afficher la bonne image selon l'ID d'item équipé -->
                 <img 
                   v-if="getUserEquippedItemData(authStore.user) && getUserEquippedItemData(authStore.user).displayType === 'discord'"
                   :src="getUserEquippedItemData(authStore.user).id === 23 ? discordon : (getUserEquippedItemData(authStore.user).id === 233 ? discordnepasderange : discordderange)"
                   alt="Discord"
                   class="equipped-discord"
                 />
                <!-- Galaxie: mêmes positions que Discord mais classe dédiée -->
                <img 
                  v-if="getUserEquippedItemData(authStore.user) && getUserEquippedItemData(authStore.user).name === 'Galaxie'"
                  :src="galaxie"
                  alt="Galaxie"
                  class="equipped-galaxie"
                />
                <!-- Coeur: mêmes positions que Galaxie -->
                <img 
                  v-if="getUserEquippedItemData(authStore.user) && (getUserEquippedItemData(authStore.user).name === 'Coeur' || getUserEquippedItemData(authStore.user).displayType === 'coeur')"
                  :src="coeur"
                  alt="Coeur"
                  class="equipped-coeur"
                />
              
              <!-- Item Clown -->
                <div v-if="item.name === 'Clown'" class="clown-item-shop">
                  <img :src="clowncheveux" :alt="item.name" class="clown-hair-shop" loading="lazy" />
                  <img :src="clownnose" alt="Nez de clown" class="clown-nose-shop" loading="lazy" />
                </div>
              
              <!-- Item Cash -->


              <!-- Item Roi -->
                <div v-if="item.name === 'Roi'" class="roi-item-shop">
                  <img :src="roi" :alt="item.name" class="roi-img-shop" loading="lazy" />
                </div>
              
              <!-- Item Ange -->
                <div v-if="item.name === 'Ange'" class="angel-item-shop">
                  <img :src="angelwings" :alt="item.name" class="angel-img-shop" loading="lazy" />
                </div>
              
              <!-- Item Discord -->
                <div v-if="item.name === 'Discord'" class="discord-item-shop">
                  <img :src="discordDisplayImg" :alt="item.name" class="discord-img-shop" loading="lazy" />
                </div>
                <!-- Aperçu Jojo: toujours l'image PNG de base -->
                <div v-if="item.name === 'Jojo'" class="jojo-item-shop">
                  <img :key="'c-jojo-'+jojoAnimKey" :src="jojo" :alt="item.name" class="jojo-img-shop jojo-swipe jojo-sepia-anim" :style="getJojoImgStyle()" />
                  <img v-if="coinsStore.jojoVariantIndex === 1" :key="'c-jojotext-'+jojoAnimKey" :src="jojotext" alt="Jojo texte" class="jojo-text-preview jojotext-fade" :style="getCollectionJojoTextStyle()" />
                </div>
              
              
              
              <!-- Item Cible -->
                <div v-if="item.name === 'Cible'" class="target-animation-shop">
                  <img :src="target" :alt="item.name" class="target-img-shop" />
                </div>
              
              <!-- Item Étoiles -->
                <div v-if="item.name === 'Étoiles'" class="stars-item-shop">
                  <img :src="star" :alt="item.name" class="stars-img-shop" />
                </div>
              
              <!-- Item Cadre royale -->
                <div v-if="item.name === 'Cadre royale'" class="royal-frame-item-shop">
                  <img :src="cadre" :alt="item.name" class="royal-frame-img-shop" />
                </div>
              
              <!-- Item Roses -->
                <div v-if="item.name === 'Roses'" class="rainbow-item-shop">
                  <img :src="love" :alt="item.name" class="rainbow-img-shop" />
                </div>
              
              <!-- Item Gentleman -->
                <div v-if="item.name === 'Gentleman'" class="gentleman-item-shop">
                  <img :src="moustache" :alt="item.name" class="moustache-img-shop" />
                  <img :src="gentleman" :alt="item.name" class="gentleman-img-shop" />
                </div>
              
              <!-- Item Vinyle -->
                <div v-if="item.name === 'Vinyle'" class="vinyle-item-shop">
                  <img :src="vinyle" :alt="item.name" class="vinyle-img-shop" />
                </div>
                <!-- Item Galaxie (Collection): mêmes tailles/positions que Discord mais classes dédiées -->
                <div v-if="item.name === 'Galaxie'" class="galaxie-item-shop">
                  <img :src="galaxie" :alt="item.name" class="galaxie-img-shop" />
                </div>
                <!-- Item Coeur (Collection) -->
                <div v-if="item.name === 'Coeur'" class="coeur-item-shop">
                  <img :src="coeur" :alt="item.name" class="coeur-img-shop" />
                </div>
                <!-- Item Prestige (Collection) -->
                <div v-if="item.name === 'Prestige'" class="alpha-item-shop">
                  <img :src="alphaImg" :alt="item.name" class="alpha-img-shop" />
                </div>
                <!-- Item Planify (Collection) -->
                <div v-if="item.name === 'Planify'" class="admin-planify-item-shop">
                  <img :src="adminPlanify" :alt="item.name" class="admin-planify-img-shop" />
                </div>
              
              <!-- Item Advisory -->
                <div v-if="item.name === 'Advisory'" class="advisory-item-shop">
                  <img :src="advisory" :alt="item.name" class="advisory-img-shop" />
                </div>
              
              <!-- Item Espace -->
                <div v-if="item.name === 'Espace'" class="espace-item-shop">
                  <img :src="spacestars" :alt="item.name" class="spacestars-img-shop" />
                  <img :src="asteroide" :alt="item.name" class="asteroide-img-shop" />
                </div>
              
              <!-- Item Absolute Cinema -->
                <div v-if="item.name === 'Absolute Cinema'" class="absolute-cinema-item-shop">
                  <img :src="bras" :alt="item.name" class="absolute-cinema-img-shop" />
                  <img :src="bras" :alt="item.name" class="absolute-cinema-img-shop-right" />
                </div>
              
              <!-- Item Flash -->
                <div v-if="item.name === 'Flash'" class="flash-item-shop">
                  <img :src="flash" :alt="item.name" class="flash-img-shop" />
                  <img :src="camera" :alt="item.name" class="camera-img-shop" />
                </div>
              
              <!-- Item Miaou -->
                <div v-if="item.name === 'Miaou'" class="miaou-item-shop">
                  <img :src="chat" :alt="item.name" class="chat-img-shop" />
                  <img :src="pate" :alt="item.name" class="pate-img-shop" />
                </div>
              
              <!-- Item DVD -->
                <div v-if="item.name === 'DVD'" class="dvd-item-shop">
                  <img :src="dvd" :alt="item.name" class="dvd-img-shop" />
                </div>
              
              <!-- Item Lunettes pixel -->
                <div v-if="item.name === 'Lunettes pixel'" class="lunettes-pixel-item-shop">
                  <img :src="mlglunette" :alt="item.name" class="lunettes-pixel-img-shop" />
                </div>
              
              <!-- Item 2000 -->
                <div v-if="item.name === '2000'" class="nokia-item-shop">
                  <img :src="nokia" :alt="item.name" class="nokia-img-shop" />
                  <img :src="clippy" :alt="item.name" class="clippy-img-shop" />
                  <img :src="daftpunk" :alt="item.name" class="daftpunk-img-shop" />
                </div>
            </div>
            <div v-if="item.name === 'Cash'" class="item-img-container">
              <img :src="cash" :alt="item.name" class="cash-img-shop" loading="lazy" />
            </div>
          </div>
          <div class="item-name">{{ getCollectionDisplayName(item) }}</div>
          <div class="item-price" :class="{ 'creator-has-name': hasCreatorName(item) }">
            <template v-if="hasInfo(item) || (item.isDynamic && item.price === 0) || item.name === 'Galaxie' || item.name === 'Planify' || item.name === 'Prestige' || item.name === 'Coeur'">
              <button type="button" class="info-icon-btn" @click.stop="openInfoItem(item)">
                <img :src="infoIcon" alt="Infos" style="width: 18px; height: 18px; object-fit: contain;" />
              </button>
            </template>
            <template v-else>
              <img src="@/assets/img/planicoins.webp" alt="Coin" class="coin-icon" />
              {{ getItemPrice(item) }}
            </template>
          </div>
          <div class="item-actions" v-if="item.id !== 0">
            <div
              v-if="hasCreatorName(item)"
              class="creator-badge"
              :class="{ clickable: (hasCreatorId(item) || hasCreatorName(item)), static: !(hasCreatorId(item) || hasCreatorName(item)) }"
              @click.stop="onCreatorClick(item)"
              :title="(hasCreatorId(item) || hasCreatorName(item)) ? 'Voir le profil du créateur' : ''"
            >
              <span class="creator-label">Créé par</span>
              <span class="creator-names-line">
                <template v-for="(name, i) in getCreatorNames(item)" :key="'cr-coll-'+i">
                  <span class="creator-name" @click.stop="onCreatorNameClick(name)">{{ name }}</span><span v-if="i < getCreatorNames(item).length - 1">, </span>
                </template>
              </span>
            </div>
            <button v-if="coinsStore.hasItem(item.id) || (isAdminOnly && isAdminOnly.value)" class="equip-btn" :class="{ 'equipped': coinsStore.isItemEquipped(item.id) }" @click="equipItem(item)">
              {{ coinsStore.isItemEquipped(item.id) ? 'Déséquiper' : 'Équiper' }}
            </button>
            <button
              v-if="showMyItemsPanel && canEditItem(item)"
              class="tab-btn"
              type="button"
              @click.stop="editUserItem(item)"
              title="Modifier cet item"
            >
              Modifier
            </button>
            <button
              v-if="showMyItemsPanel && canEditItem(item)"
              class="tab-btn"
              type="button"
              @click.stop="exportUserItemJson(item)"
              title="Télécharger JSON"
            >
              Télécharger JSON
            </button>
            <button
              v-if="showMyItemsPanel && canEditItem(item) && (isLocalUserItem(item) || isUserItemCreator(item) || isAdminOnly)"
              class="tab-btn"
              type="button"
              @click.stop="deleteUserItem(item)"
              title="Supprimer cet item"
            >
              Supprimer
            </button>
          </div>
          
          <!-- Rendu spécial pour Bordure classique -->
          <template v-else>
            <div class="classic-border-actions">
              <button class="equip-btn color-change-btn" @click="openColorPicker">
                Changer de couleur
              </button>
            </div>
          </template>
        </div>
      </div>

      <!-- Boutique quotidienne -->
      <div v-if="activeTab === 'weekly'" class="weekly-shop-container" :class="{ 'single-col': showPurchasePreview }" ref="weeklyContainerRef">
        <div v-if="showPurchasePreview" class="weekly-preview" :style="{ height: forceWeeklyHeight ? (forceWeeklyHeight + 'px') : undefined, width: '1235.45px' }">
          <div class="preview-grid">
            <div class="preview-card preview-item">
              <div class="preview-title">Aperçu (Cosmétique)</div>
              <div class="item-img-wrapper large">
                <button v-if="purchasePreviewItem && ((purchasePreviewItem.displayType === 'discord') || purchasePreviewItem.name === 'Discord' || purchasePreviewItem.name === 'Jojo' || purchasePreviewItem.displayType === 'jojo' || (purchasePreviewItem.isDynamic && Array.isArray(purchasePreviewItem.variants) && purchasePreviewItem.variants.length > 1))" class="style-nav-btn left-btn" :class="{ 'style-btn-anim': btnAnimFlags[((purchasePreviewItem.legacyId != null ? purchasePreviewItem.legacyId : purchasePreviewItem.id) + '-l')] }" type="button" @click.stop="prevItemStyle(purchasePreviewItem)" aria-label="Style précédent"><svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
                <button v-if="purchasePreviewItem && ((purchasePreviewItem.displayType === 'discord') || purchasePreviewItem.name === 'Discord' || purchasePreviewItem.name === 'Jojo' || purchasePreviewItem.displayType === 'jojo' || (purchasePreviewItem.isDynamic && Array.isArray(purchasePreviewItem.variants) && purchasePreviewItem.variants.length > 1))" class="style-nav-btn right-btn" :class="{ 'style-btn-anim': btnAnimFlags[((purchasePreviewItem.legacyId != null ? purchasePreviewItem.legacyId : purchasePreviewItem.id) + '-r')] }" type="button" @click.stop="nextItemStyle(purchasePreviewItem)" aria-label="Style suivant"><svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
                <div v-if="purchasePreviewItem && purchasePreviewItem.name !== 'Cash'" class="item-img-container" :class="{ 'jojo-bg-anim': (purchasePreviewItem.displayType === 'jojo' || purchasePreviewItem.name === 'Jojo'), 'style-change-anim': styleAnimFlags[purchasePreviewItem.id], 'border-color-fill': (purchasePreviewItem && (purchasePreviewItem.type === 'border-color' || purchasePreviewItem.type === 'border-gradient')) }">
                  <template v-if="purchasePreviewItem && purchasePreviewItem.isDynamic">
                    <div class="dyn-bg" :style="getCosmeticPreviewBgStyle(purchasePreviewItem)"></div>
                    <img v-for="(a, ai) in getDynVariantAssets(purchasePreviewItem)" :key="'ppv-'+ai+'-'+variantUpdateKey" :src="resolveAssetSrc(a.src)" :style="getDynVariantPreviewStyle(a)" />
                  </template>
                  <img v-if="purchasePreviewItem && purchasePreviewItem.name === 'Clown'" :src="clowncheveux" alt="Cheveux de clown" class="clown-hair-shop" />
                  <img v-if="purchasePreviewItem && purchasePreviewItem.name === 'Clown'" :src="clownnose" alt="Nez de clown" class="clown-nose-shop" />
                  <div v-if="purchasePreviewItem && purchasePreviewItem.name === 'Vinyle'" class="vinyle-item-shop">
                    <img :src="vinyle" :alt="purchasePreviewItem.name" class="vinyle-img-shop" />
                  </div>
                  <div v-else-if="purchasePreviewItem && (purchasePreviewItem.name === 'Matrix' || purchasePreviewItem.displayType === 'matrix')" class="matrix-rain-inside-shop">
                    <div class="matrix-column" v-for="(col, ci) in getMatrixColumns(purchasePreviewItem)" :key="'pp-mx-'+ci" :style="{ left: (ci * 5) + '%', animationDelay: (col.delay) + 's' }">
                      <span v-for="(ch, ri) in col.chars" :key="'pp-mx-ch-'+ri" class="matrix-char">{{ ch }}</span>
                    </div>
                  </div>
                  <div v-else-if="purchasePreviewItem && purchasePreviewItem.name === 'Étoiles'" class="stars-item-shop">
                    <img :src="star" :alt="purchasePreviewItem.name" class="stars-img-shop" />
                  </div>
                  <div v-else-if="purchasePreviewItem && (purchasePreviewItem.name === 'Espace' || purchasePreviewItem.displayType === 'espace')" class="espace-item-shop">
                    <img :src="spacestars" :alt="purchasePreviewItem.name" class="spacestars-img-shop" />
                    <img :src="asteroide" :alt="purchasePreviewItem.name" class="asteroide-img-shop" />
                  </div>
                  <div v-else-if="purchasePreviewItem && (purchasePreviewItem.name === 'Absolute Cinema' || purchasePreviewItem.displayType === 'absolute-cinema')" class="absolute-cinema-item-shop">
                    <img :src="bras" :alt="purchasePreviewItem.name" class="absolute-cinema-img-shop"
                         @mousedown="startDragAbsLeft" @mousemove="dragAbsLeft" @mouseup="endDragAbsLeft" @mouseleave="endDragAbsLeft"
                         :style="{ transform: 'translate(' + absCinemaLeftPos.x + 'px, ' + absCinemaLeftPos.y + 'px)' }" />
                    <img :src="bras" :alt="purchasePreviewItem.name" class="absolute-cinema-img-shop-right"
                         @mousedown="startDragAbsRight" @mousemove="dragAbsRight" @mouseup="endDragAbsRight" @mouseleave="endDragAbsRight"
                         :style="{ transform: 'translate(' + absCinemaRightPos.x + 'px, ' + absCinemaRightPos.y + 'px)' }" />
                  </div>
                  <div v-else-if="purchasePreviewItem && (purchasePreviewItem.name === 'Miaou' || purchasePreviewItem.displayType === 'miaou')" class="miaou-item-shop">
                    <img :src="chat" :alt="purchasePreviewItem.name" class="chat-img-shop" />
                    <img :src="pate" :alt="purchasePreviewItem.name" class="pate-img-shop" />
                  </div>
                  <div v-else-if="purchasePreviewItem && (purchasePreviewItem.name === 'DVD' || purchasePreviewItem.displayType === 'dvd')" class="dvd-item-shop">
                    <img :src="dvd" :alt="purchasePreviewItem.name" class="dvd-img-shop" />
                  </div>
                  <div v-else-if="purchasePreviewItem && (purchasePreviewItem.name === 'Flash' || purchasePreviewItem.displayType === 'flash')" class="flash-item-shop">
                    <img :src="flash" :alt="purchasePreviewItem.name" class="flash-img-shop"
                         draggable="false" @dragstart.prevent
                         @mousedown="startDragFlashCosmetic" @mousemove="dragFlashCosmetic" @mouseup="endDragFlashCosmetic" @mouseleave="endDragFlashCosmetic"
                         :style="{ transform: 'translate(-50%, -50%) translate(' + flashCosmeticPos.x + 'px, ' + flashCosmeticPos.y + 'px)' }" />
                    <img :src="camera" :alt="purchasePreviewItem.name" class="camera-img-shop"
                         draggable="false" @dragstart.prevent
                         @mousedown="startDragCameraCosmetic" @mousemove="dragCameraCosmetic" @mouseup="endDragCameraCosmetic" @mouseleave="endDragCameraCosmetic"
                         :style="{ transform: 'translate(-50%, -50%) translate(' + cameraCosmeticPos.x + 'px, ' + cameraCosmeticPos.y + 'px)' }" />
                  </div>
                  <div v-else-if="purchasePreviewItem && purchasePreviewItem.name === 'Roses'" class="rainbow-item-shop"
                       @mousedown="startDragRainbow" @mousemove="dragRainbow" @mouseup="endDragRainbow" @mouseleave="endDragRainbow"
                       :style="{ transform: `translate(${rainbowPosition.x}px, ${rainbowPosition.y}px) scale(${rainbowScale})` }">
                    <img :src="love" :alt="purchasePreviewItem.name" class="rainbow-img-shop" />
                  </div>
                  <div v-else-if="purchasePreviewItem && purchasePreviewItem.name === 'Gentleman'" class="gentleman-item-shop">
                    <img :src="moustache" :alt="purchasePreviewItem.name" class="moustache-img-shop" />
                    <img :src="gentleman" :alt="purchasePreviewItem.name" class="gentleman-img-shop" />
                  </div>
                  <div v-else-if="purchasePreviewItem && purchasePreviewItem.name === 'Cadre royale'" class="royal-frame-item-shop"
                       @mousedown="startDragRoyal" @mousemove="dragRoyal" @mouseup="endDragRoyal" @mouseleave="endDragRoyal"
                       :style="{ transform: `translate(${royalFramePosition.x}px, ${royalFramePosition.y}px)` }">
                    <img :src="cadre" :alt="purchasePreviewItem.name" class="royal-frame-img-shop" />
                  </div>
                  <div v-else-if="purchasePreviewItem && (purchasePreviewItem.name === '2000' || purchasePreviewItem.displayType === 'nokia')" class="nokia-item-shop">
                    <img :src="nokia" :alt="purchasePreviewItem.name" class="nokia-img-shop" />
                    <img :src="clippy" :alt="purchasePreviewItem.name" class="clippy-img-shop" />
                    <img :src="daftpunk" :alt="purchasePreviewItem.name" class="daftpunk-img-shop" />
                  </div>
                  <div v-else-if="purchasePreviewItem && (purchasePreviewItem.name === 'Jojo' || purchasePreviewItem.displayType === 'jojo')" class="jojo-item-shop" :key="'pp-jojo-container-'+jojoAnimKey">
                    <img :key="'pp-jojo-'+jojoAnimKey" :src="jojo" :alt="purchasePreviewItem.name" class="jojo-img-shop jojo-swipe jojo-sepia-anim" :style="getWeeklyJojoImgStyle()" />
                    <img v-if="coinsStore.jojoVariantIndex === 1" :key="'pp-jojotext-'+jojoAnimKey" :src="jojotext" alt="Jojo texte" class="jojo-text-preview jojotext-fade" :style="getWeeklyJojoTextStyle()" />
                  </div>
                  <div v-else-if="purchasePreviewItem && (purchasePreviewItem.type === 'border-color' || purchasePreviewItem.type === 'border-gradient')" class="classic-border-preview" :style="getWeeklyClassicFillStyle(purchasePreviewItem)" data-darkreader-ignore></div>
                  <img v-else-if="purchasePreviewItem && purchasePreviewItem.img" :src="(purchasePreviewItem.displayType === 'discord' || purchasePreviewItem.name === 'Discord' || purchasePreviewItem.id == 23) ? discordDisplayImg : purchasePreviewItem.img" :alt="purchasePreviewItem.name" class="item-img" :class="{ 'discord-item-preview': (purchasePreviewItem.displayType === 'discord' || purchasePreviewItem.name === 'Discord' || purchasePreviewItem.id == 23) }" :style="(purchasePreviewItem.displayType === 'discord' || purchasePreviewItem.name === 'Discord' || purchasePreviewItem.id == 23) ? { width: '60%', height: '75%', objectFit: 'contain' } : null" />
                </div>
                <img v-if="purchasePreviewItem && purchasePreviewItem.name === 'Cash'" :src="cash" :alt="purchasePreviewItem.name" class="cash-img-shop" />
              </div>

              <div class="item-name">{{ purchasePreviewItem?.name }}</div>
              <div class="item-price"><img src="@/assets/img/planicoins.webp" alt="Coin" class="coin-icon" /> {{ getItemPrice(purchasePreviewItem) }}</div>
              <div class="item-actions"><button class="buy-btn" :disabled="!isAdminOnly && (userCoins < getItemPrice(purchasePreviewItem))" @click="buyItem(purchasePreviewItem)">Acheter</button></div>
            </div>
            <div class="preview-card preview-leaderboard">
              <div class="preview-title">Aperçu (Leaderboard)</div>
              <div class="preview-list">
                <div class="leaderboard-item" v-for="n in [1,2]" :key="'pp-p-'+n">
                  <div class="user-info"><div class="user-avatar-container"><div class="user-avatar"><img class="avatar-img" :src="FALLBACK_AVATAR_DATA_URL" alt="Avatar par défaut" /></div></div><div class="user-details"><div class="username">Personne #{{ n }}</div></div></div>
                </div>
                <div class="leaderboard-item">
                  <div class="user-info">
                    <img v-for="(a, ai) in getLeaderboardPreviewAssetsForTargetPlacement(purchasePreviewItem, 'user-avatar-container', 'above')" :key="'pp-lead-cont-above-'+ai" :src="resolveAssetSrc(a.src)" :style="getDynLeaderboardContainerOverlayStyle(a)" class="dynamic-container-overlay" />
                    <img v-if="purchasePreviewItem && (purchasePreviewItem.displayType === 'gentleman' || purchasePreviewItem.name === 'Gentleman')" :src="gentleman" :alt="purchasePreviewItem?.name" class="equipped-gentleman-overlay" />
                    <img v-if="purchasePreviewItem && (purchasePreviewItem.displayType === 'roi' || purchasePreviewItem.name === 'Roi')" :src="roi" :alt="purchasePreviewItem?.name" class="equipped-roi-overlay" />
                    <img v-if="purchasePreviewItem && purchasePreviewItem.displayType === 'vinyle'" :src="vinyle" :alt="purchasePreviewItem?.name" class="equipped-vinyle-overlay" />
                    <img v-if="purchasePreviewItem && (purchasePreviewItem.displayType === 'flash' || purchasePreviewItem.name === 'Flash')" :src="flash" :alt="purchasePreviewItem?.name" class="equipped-flash-overlay"
                         draggable="false" @dragstart.prevent
                         @mousedown="startDragFlashAvatar" @mousemove="dragFlashAvatar" @mouseup="endDragFlashAvatar" @mouseleave="endDragFlashAvatar"
                         :style="{ transform: 'translate(' + flashAvatarPos.x + 'px, ' + flashAvatarPos.y + 'px)' }" />
                    <img v-if="purchasePreviewItem && (purchasePreviewItem.displayType === 'flash' || purchasePreviewItem.name === 'Flash')" :src="camera" :alt="purchasePreviewItem?.name" class="equipped-camera-overlay"
                         draggable="false" @dragstart.prevent
                         @mousedown="startDragCameraAvatar" @mousemove="dragCameraAvatar" @mouseup="endDragCameraAvatar" @mouseleave="endDragCameraAvatar"
                         :style="{ transform: 'translate(' + cameraAvatarPos.x + 'px, ' + cameraAvatarPos.y + 'px)' }" />
                    <img v-if="purchasePreviewItem && purchasePreviewItem.displayType === 'angel'" :src="angelwings" :alt="purchasePreviewItem?.name" class="equipped-angel-wings" />

                    <img v-if="purchasePreviewItem && (purchasePreviewItem.displayType === 'discord' || purchasePreviewItem.name === 'Discord')" :src="discordDisplayImg" :alt="purchasePreviewItem?.name" class="equipped-discord-overlay" />
                    <img v-if="purchasePreviewItem && (purchasePreviewItem.displayType === 'miaou' || purchasePreviewItem.name === 'Miaou')" :src="chat" :alt="purchasePreviewItem?.name" class="equipped-chat-overlay" />

                    <img v-if="purchasePreviewItem && (purchasePreviewItem.name === 'Galaxie')" :src="galaxie" :alt="purchasePreviewItem?.name" class="equipped-galaxie-overlay" />
                    <img v-if="purchasePreviewItem && (purchasePreviewItem.name === 'Coeur' || purchasePreviewItem.displayType === 'coeur')" :src="coeur" :alt="purchasePreviewItem?.name" class="equipped-coeur-overlay" />
                    <img v-if="purchasePreviewItem && (purchasePreviewItem.name === 'Prestige' || purchasePreviewItem.displayType === 'alpha')" :src="alphaImg" :alt="purchasePreviewItem?.name" class="equipped-alpha-overlay" />

                    <img v-if="purchasePreviewItem && (purchasePreviewItem.name === 'Planify' || purchasePreviewItem.displayType === 'admin-planify')" :src="adminPlanify" :alt="purchasePreviewItem?.name" class="equipped-admin-planify-overlay" />
                    <img v-if="purchasePreviewItem && (purchasePreviewItem.displayType === 'tomb-raider' || purchasePreviewItem.name === 'Tomb Raider')" :src="laracroft" :alt="purchasePreviewItem?.name" class="equipped-tomb-raider" />

                    <div class="user-avatar-container">
                      <img v-for="(a, ai) in getLeaderboardPreviewAssetsForTargetPlacement(purchasePreviewItem, 'user-avatar-container', 'below')" :key="'pp-lead-cont-below-'+ai" :src="resolveAssetSrc(a.src)" :style="getDynLeaderboardAssetStyle(a)" />
                      <img v-for="(a, ai) in getLeaderboardPreviewAssetsForTargetPlacement(purchasePreviewItem, 'user-avatar-container', 'inside')" :key="'pp-lead-cont-inside-'+ai" :src="resolveAssetSrc(a.src)" :style="getDynLeaderboardAssetStyle(a)" />

                      <img v-if="purchasePreviewItem && (purchasePreviewItem.displayType === 'miaou' || purchasePreviewItem.name === 'Miaou')" :src="pate" :alt="purchasePreviewItem?.name" class="equipped-pate-inside" />
                      <img v-if="purchasePreviewItem && (purchasePreviewItem.displayType === 'cat-ears' || purchasePreviewItem.name === 'Oreilles de chat' || purchasePreviewItem.name === 'Oreillettes de chat')" :src="oreilleschat" :alt="purchasePreviewItem?.name" class="equipped-cat-ears" />
                      <img v-if="purchasePreviewItem && (purchasePreviewItem.displayType === 'clown' || purchasePreviewItem.name === 'Clown')" :src="clowncheveux" :alt="purchasePreviewItem?.name" class="equipped-clown-overlay" />
                      <img v-if="purchasePreviewItem && (purchasePreviewItem.displayType === 'angel' || purchasePreviewItem.name === 'Ange')" :src="angelwings" :alt="purchasePreviewItem?.name" class="equipped-angel-wings" />
                    <img v-if="purchasePreviewItem && (purchasePreviewItem.displayType === 'absolute-cinema' || purchasePreviewItem.name === 'Absolute Cinema')" :src="bras" :alt="purchasePreviewItem?.name" class="equipped-absolute-cinema-overlay"
                         @mousedown="startDragAbsLeftAvatar" @mousemove="dragAbsLeftAvatar" @mouseup="endDragAbsLeftAvatar" @mouseleave="endDragAbsLeftAvatar"
                         :style="{ transform: 'translate(' + absCinemaLeftAvatarPos.x + 'px, ' + absCinemaLeftAvatarPos.y + 'px)' }" />
                    <img v-if="purchasePreviewItem && (purchasePreviewItem.displayType === 'absolute-cinema' || purchasePreviewItem.name === 'Absolute Cinema')" :src="bras" :alt="purchasePreviewItem?.name" class="equipped-absolute-cinema-overlay-right"
                         @mousedown="startDragAbsRightAvatar" @mousemove="dragAbsRightAvatar" @mouseup="endDragAbsRightAvatar" @mouseleave="endDragAbsRightAvatar"
                         :style="{ transform: 'translate(' + absCinemaRightAvatarPos.x + 'px, ' + absCinemaRightAvatarPos.y + 'px)' }" />
                    <img v-if="purchasePreviewItem && (purchasePreviewItem.displayType === 'espace' || purchasePreviewItem.name === 'Espace')" :src="asteroide" :alt="purchasePreviewItem?.name" class="equipped-asteroide-overlay" />
                      <img v-if="purchasePreviewItem && (purchasePreviewItem.displayType === 'vinyle' || purchasePreviewItem.name === 'Vinyle')" :src="vinyle" :alt="purchasePreviewItem?.name" class="equipped-vinyle-overlay" />
                      <img v-if="purchasePreviewItem && (purchasePreviewItem.displayType === 'etoiles' || purchasePreviewItem.name === 'Étoiles')" :src="star" :alt="purchasePreviewItem?.name" class="equipped-stars-overlay" />
                      <img v-if="purchasePreviewItem && (purchasePreviewItem.displayType === 'rainbow' || purchasePreviewItem.name === 'Roses')" :src="love" :alt="purchasePreviewItem?.name" class="equipped-rainbow" />
                      <img v-if="purchasePreviewItem && (purchasePreviewItem.displayType === 'royal-frame' || purchasePreviewItem.name === 'Cadre royale')" :src="cadre" :alt="purchasePreviewItem?.name" class="equipped-royal-frame-overlay" />

                      <img v-if="purchasePreviewItem && (purchasePreviewItem.displayType === 'nokia' || purchasePreviewItem.name === '2000')" :src="nokia" :alt="purchasePreviewItem?.name" class="equipped-nokia-inside" />
                      <img v-if="purchasePreviewItem && (purchasePreviewItem.displayType === 'nokia' || purchasePreviewItem.name === '2000')" :src="clippy" :alt="purchasePreviewItem?.name" class="equipped-clippy-inside" />
                      <img v-if="purchasePreviewItem && (purchasePreviewItem.displayType === 'nokia' || purchasePreviewItem.name === '2000')" :src="daftpunk" :alt="purchasePreviewItem?.name" class="equipped-daftpunk-overlay" />


                      <div class="user-avatar" :style="getPreviewBorderStyle(purchasePreviewItem)" :class="{ 'no-border': shouldRemoveLeaderboardBorder(purchasePreviewItem, authStore.user) }">
                        <img v-for="(a, ai) in getLeaderboardPreviewAssetsForTargetPlacement(purchasePreviewItem, 'user-avatar', 'below')" :key="'pp-lead-ava-below-'+ai" :src="resolveAssetSrc(a.src)" :style="getDynLeaderboardAssetStyle(a)" />
                        <img class="avatar-img" :src="getUserAvatar(authStore.user)" :alt="authStore.user?.username || 'Vous'" />
                        <img v-if="purchasePreviewItem && (purchasePreviewItem.displayType === 'clown' || purchasePreviewItem.name === 'Clown')" :src="clownnose" alt="Nez de clown" class="equipped-clown-nose" />
                        <img v-if="purchasePreviewItem && (purchasePreviewItem.displayType === 'cash' || purchasePreviewItem.name === 'Cash' || Number(purchasePreviewItem.id) === 3)" :src="cash" :alt="purchasePreviewItem?.name" class="equipped-cash-inside" />
  
                        <img v-if="purchasePreviewItem && (purchasePreviewItem.displayType === 'target' || purchasePreviewItem.name === 'Cible' || purchasePreviewItem.name === 'Target')" :src="target" :alt="purchasePreviewItem?.name" class="equipped-target-inside" />
                        <img v-if="purchasePreviewItem && (purchasePreviewItem.displayType === 'advisory' || purchasePreviewItem.name === 'Advisory')" :src="advisory" :alt="purchasePreviewItem?.name" class="equipped-advisory-inside" />
                        <img v-if="purchasePreviewItem && (purchasePreviewItem.displayType === 'dvd' || purchasePreviewItem.name === 'DVD')" :src="dvd" :alt="purchasePreviewItem?.name" class="equipped-dvd-inside" />
                        <img v-if="purchasePreviewItem && (purchasePreviewItem.displayType === 'lunettes-pixel' || purchasePreviewItem.name === 'Lunettes pixel')" :src="mlglunette" :alt="purchasePreviewItem?.name" class="equipped-lunettes-pixel-inside" />
                        <img v-if="purchasePreviewItem && (purchasePreviewItem.displayType === 'espace' || purchasePreviewItem.name === 'Espace')" :src="spacestars" :alt="purchasePreviewItem?.name" class="equipped-spacestars-inside" />
                        <img v-if="purchasePreviewItem && (purchasePreviewItem.displayType === 'espace' || purchasePreviewItem.name === 'Espace')" :src="asteroide" :alt="purchasePreviewItem?.name" class="equipped-asteroide-overlay" />
                        <img v-if="purchasePreviewItem && (purchasePreviewItem.displayType === 'gentleman' || purchasePreviewItem.name === 'Gentleman')" :src="moustache" :alt="purchasePreviewItem?.name" class="equipped-moustache-inside" />


                        <img v-if="purchasePreviewItem && (purchasePreviewItem.displayType === 'jojo' || purchasePreviewItem.name === 'Jojo')" :src="jojo" :alt="purchasePreviewItem?.name" class="equipped-jojo-inside jojo-swipe jojo-sepia-anim" :key="'pp-lead-jojo-'+jojoAnimKey" />
                        <img v-if="purchasePreviewItem && (purchasePreviewItem.displayType === 'jojo' || purchasePreviewItem.name === 'Jojo') && coinsStore.jojoVariantIndex === 1" :src="jojotext" :alt="purchasePreviewItem?.name" class="equipped-jojotext-inside jojotext-fade" :key="'pp-lead-jojotext-'+jojoAnimKey" />
                        <div v-if="purchasePreviewItem && (purchasePreviewItem.name === 'Matrix' || purchasePreviewItem.displayType === 'matrix')" class="matrix-rain-inside">
                          <div class="matrix-column" v-for="(col, ci) in getMatrixColumns(purchasePreviewItem)" :key="'pp-lead-mx-'+ci" :style="{ left: (ci * 5) + '%', animationDelay: (col.delay) + 's' }">
                            <span v-for="(ch, ri) in col.chars" :key="'pp-lead-mx-ch-'+ri" class="matrix-char">{{ ch }}</span>
                          </div>
                        </div>
                        <img v-for="(a, ai) in getLeaderboardPreviewAssetsForTargetPlacement(purchasePreviewItem, 'user-avatar', 'inside')" :key="'pp-lead-ava-inside-'+ai" :src="resolveAssetSrc(a.src)" :style="getDynLeaderboardAssetStyle(a)" :class="getDynLeaderboardAssetClass(a)" />
                        <img v-for="(a, ai) in getLeaderboardPreviewAssetsForTargetPlacement(purchasePreviewItem, 'user-avatar', 'above')" :key="'pp-lead-ava-above-'+ai" :src="resolveAssetSrc(a.src)" :style="getDynLeaderboardAssetStyle(a)" :class="getDynLeaderboardAssetClass(a)" />
                      </div>
                    </div>
                    <div class="user-details"><div class="username">Vous</div></div>
                  </div>
                </div>
                <div class="leaderboard-item" v-for="n in [3]" :key="'pp-p-'+n">
                  <div class="user-info"><div class="user-avatar-container"><div class="user-avatar"><img class="avatar-img" :src="FALLBACK_AVATAR_DATA_URL" alt="Avatar par défaut" /></div></div><div class="user-details"><div class="username">Personne #{{ n }}</div></div></div>
                </div>
              </div>
            </div>
            <div class="preview-card preview-avatar" :class="{ 'roi-preview': purchasePreviewItem && (purchasePreviewItem.name === 'Roi' || purchasePreviewItem.displayType === 'roi'), 'gentleman-preview': purchasePreviewItem && (purchasePreviewItem.name === 'Gentleman' || purchasePreviewItem.displayType === 'gentleman'), 'vinyle-preview': purchasePreviewItem && (purchasePreviewItem.name === 'Vinyle' || purchasePreviewItem.displayType === 'vinyle'), 'nokia-preview': purchasePreviewItem && (purchasePreviewItem.name === '2000' || purchasePreviewItem.displayType === 'nokia') }">
              <div class="preview-title">Aperçu (Large / Avatar)</div>
              <div class="profile-avatar-wrap">
                <div class="profile-avatar-stage" :style="`width: ${isMobile ? 250 : 351}px !important; height: ${getLargeAvatarHeight(purchasePreviewItem)}px !important; margin: 0 auto`">
                  <div class="profile-avatar-scaler" :style="`width: ${isMobile ? 250 : 351}px !important; height: ${getLargeAvatarHeight(purchasePreviewItem)}px !important`">
                    <img v-for="(a, ai) in getProfilePopupAssetsForTargetPlacement(purchasePreviewItem, 'profile-avatar-scaler', 'below')" :key="'pp-scaler-below-'+ai" :src="resolveAssetSrc(a.src)" :style="getDynProfilePopupAssetStyle(a)" />
                    <img v-for="(a, ai) in getProfilePopupAssetsForTargetPlacement(purchasePreviewItem, 'profile-avatar-scaler', 'inside')" :key="'pp-scaler-inside-'+ai" :src="resolveAssetSrc(a.src)" :style="getDynProfilePopupAssetStyle(a)" />
                    <img v-if="purchasePreviewItem && (purchasePreviewItem.displayType === 'miaou' || purchasePreviewItem.name === 'Miaou')" :src="pate" :alt="purchasePreviewItem?.name" class="equipped-pate-inside" />
                    <img v-if="purchasePreviewItem && (purchasePreviewItem.displayType === 'nokia' || purchasePreviewItem.name === '2000')" :src="daftpunk" :alt="purchasePreviewItem?.name" class="equipped-daftpunk-overlay" />
                    <img v-if="purchasePreviewItem && (purchasePreviewItem.displayType === 'nokia' || purchasePreviewItem.name === '2000')" :src="nokia" :alt="purchasePreviewItem?.name" class="equipped-nokia-inside" />
                    <img v-if="purchasePreviewItem && (purchasePreviewItem.displayType === 'nokia' || purchasePreviewItem.name === '2000')" :src="clippy" :alt="purchasePreviewItem?.name" class="equipped-clippy-inside" />
                      
                    <div class="profile-avatar" :style="getPreviewBorderStyle(purchasePreviewItem)" :class="{ 'no-border': shouldRemoveProfilePopupBorder(purchasePreviewItem) }">
                      <img v-for="(a, ai) in getProfilePopupAssetsForTargetPlacement(purchasePreviewItem, 'profile-avatar', 'below')" :key="'pp-below-'+ai" :src="resolveAssetSrc(a.src)" :style="getDynProfilePopupAssetStyle(a)" />

                      <img class="avatar-img" :src="getUserAvatar(authStore.user)" :alt="authStore.user?.username || 'avatar'" />
                      <div v-if="purchasePreviewItem && (purchasePreviewItem.name === 'Matrix' || purchasePreviewItem.displayType === 'matrix')" class="matrix-rain-inside">
                        <div class="matrix-column" v-for="(col, ci) in getMatrixColumns(purchasePreviewItem)" :key="'pp-ava-mx-'+ci" :style="{ left: (ci * 5) + '%', animationDelay: (col.delay) + 's' }">
                          <span v-for="(ch, ri) in col.chars" :key="'pp-ava-mx-ch-'+ri" class="matrix-char">{{ ch }}</span>
                        </div>
                      </div>
                      <img v-if="purchasePreviewItem && (purchasePreviewItem.displayType === 'clown' || purchasePreviewItem.name === 'Clown')" :src="clownnose" alt="Nez de clown" class="equipped-clown-nose" />
                      <img v-if="purchasePreviewItem && (purchasePreviewItem.displayType === 'espace' || purchasePreviewItem.name === 'Espace')" :src="spacestars" :alt="purchasePreviewItem?.name" class="equipped-spacestars-inside" />
                      <img v-if="purchasePreviewItem && (purchasePreviewItem.displayType === 'gentleman' || purchasePreviewItem.name === 'Gentleman')" :src="moustache" :alt="purchasePreviewItem?.name" class="equipped-moustache-inside" />
                      <img v-if="purchasePreviewItem && (purchasePreviewItem.displayType === 'lunettes-pixel' || purchasePreviewItem.name === 'Lunettes pixel')" :src="mlglunette" :alt="purchasePreviewItem?.name" class="equipped-lunettes-pixel-inside" />
                      <img v-if="purchasePreviewItem && (purchasePreviewItem.displayType === 'dvd' || purchasePreviewItem.name === 'DVD')" :src="dvd" :alt="purchasePreviewItem?.name" class="equipped-dvd-inside" />
                      <img v-if="purchasePreviewItem && (purchasePreviewItem.displayType === 'advisory' || purchasePreviewItem.name === 'Advisory')" :src="advisory" :alt="purchasePreviewItem?.name" class="equipped-advisory-inside" />
                      <img v-if="purchasePreviewItem && (purchasePreviewItem.displayType === 'cash' || purchasePreviewItem.name === 'Cash' || Number(purchasePreviewItem.id) === 3)" :src="cash" :alt="purchasePreviewItem?.name" class="equipped-cash-inside" />
                      <img v-if="purchasePreviewItem && (purchasePreviewItem.displayType === 'jojo' || purchasePreviewItem.name === 'Jojo')" :src="jojo" :alt="purchasePreviewItem?.name" class="equipped-jojo-inside jojo-swipe jojo-sepia-anim" :key="'pp-ava-jojo-'+jojoAnimKey" />
                      <img v-if="purchasePreviewItem && (purchasePreviewItem.displayType === 'jojo' || purchasePreviewItem.name === 'Jojo') && coinsStore.jojoVariantIndex === 1" :src="jojotext" :alt="purchasePreviewItem?.name" class="equipped-jojotext-inside jojotext-fade" :key="'pp-ava-jojotext-'+jojoAnimKey" />
                      <img v-if="purchasePreviewItem && (purchasePreviewItem.displayType === 'target' || purchasePreviewItem.name === 'Cible' || purchasePreviewItem.name === 'Target')" :src="target" :alt="purchasePreviewItem?.name" class="equipped-target-inside" />
                      <img v-for="(a, ai) in getProfilePopupAssetsForTargetPlacement(purchasePreviewItem, 'profile-avatar', 'inside')" :key="'pp-inside-'+ai" :src="resolveAssetSrc(a.src)" :style="getDynProfilePopupAssetStyle(a)" />
                    </div>

                    <!-- Above overlays targeting the avatar should render outside the avatar to avoid clipping -->
                    <img v-for="(a, ai) in getProfilePopupAssetsForTargetPlacement(purchasePreviewItem, 'profile-avatar', 'above')" :key="'pp-above-'+ai" :src="resolveAssetSrc(a.src)" :style="getDynProfilePopupAssetStyle(a)" />
                    <img v-if="purchasePreviewItem && (purchasePreviewItem.displayType === 'clown' || purchasePreviewItem.name === 'Clown')" :src="clowncheveux" :alt="purchasePreviewItem?.name" class="equipped-clown-overlay" />
                    <img v-if="purchasePreviewItem && (purchasePreviewItem.name === 'Galaxie' || purchasePreviewItem.displayType === 'galaxie')" :src="galaxie" :alt="purchasePreviewItem?.name" class="equipped-galaxie-overlay" />
                    <img v-if="purchasePreviewItem && (purchasePreviewItem.name === 'Coeur' || purchasePreviewItem.displayType === 'coeur')" :src="coeur" :alt="purchasePreviewItem?.name" class="equipped-coeur-overlay" />
                    <img v-if="purchasePreviewItem && (purchasePreviewItem.displayType === 'miaou' || purchasePreviewItem.name === 'Miaou')" :src="chat" :alt="purchasePreviewItem?.name" class="equipped-chat-overlay" />
                    <img v-if="purchasePreviewItem && (purchasePreviewItem.displayType === 'flash' || purchasePreviewItem.name === 'Flash')" :src="flash" :alt="purchasePreviewItem?.name" class="equipped-flash-overlay" />
                    <img v-if="purchasePreviewItem && (purchasePreviewItem.displayType === 'flash' || purchasePreviewItem.name === 'Flash')" :src="camera" :alt="purchasePreviewItem?.name" class="equipped-camera-overlay" />
                    <img v-if="purchasePreviewItem && (purchasePreviewItem.name === 'Prestige' || purchasePreviewItem.displayType === 'alpha')" :src="alphaImg" :alt="purchasePreviewItem?.name" class="equipped-alpha-overlay" />
                    <img v-if="purchasePreviewItem && (purchasePreviewItem.name === 'Planify' || purchasePreviewItem.displayType === 'admin-planify')" :src="adminPlanify" :alt="purchasePreviewItem?.name" class="equipped-admin-planify-overlay" />
                    <img v-if="purchasePreviewItem && (purchasePreviewItem.displayType === 'cat-ears' || purchasePreviewItem.name === 'Oreilles de chat' || purchasePreviewItem.name === 'Oreillettes de chat')" :src="oreilleschat" :alt="purchasePreviewItem?.name" class="equipped-cat-ears" />
                    <img v-if="purchasePreviewItem && (purchasePreviewItem.displayType === 'roi' || purchasePreviewItem.name === 'Roi')" :src="roi" :alt="purchasePreviewItem?.name" class="equipped-roi-overlay" />
                    <img v-if="purchasePreviewItem && (purchasePreviewItem.displayType === 'angel' || purchasePreviewItem.name === 'Ange')" :src="angelwings" :alt="purchasePreviewItem?.name" class="equipped-angel-wings" />
                    <img v-if="purchasePreviewItem && (purchasePreviewItem.displayType === 'tomb-raider' || purchasePreviewItem.name === 'Tomb Raider')" :src="laracroft" :alt="purchasePreviewItem?.name" class="equipped-tomb-raider" />
                    <img v-if="purchasePreviewItem && (purchasePreviewItem.displayType === 'discord' || purchasePreviewItem.name === 'Discord')" :src="discordDisplayImg" :alt="purchasePreviewItem?.name" class="equipped-discord-overlay" />
                    <img v-if="purchasePreviewItem && (purchasePreviewItem.displayType === 'absolute-cinema' || purchasePreviewItem.name === 'Absolute Cinema')" :src="bras" :alt="purchasePreviewItem?.name" class="equipped-absolute-cinema-overlay" />
                    <img v-if="purchasePreviewItem && (purchasePreviewItem.displayType === 'absolute-cinema' || purchasePreviewItem.name === 'Absolute Cinema')" :src="bras" :alt="purchasePreviewItem?.name" class="equipped-absolute-cinema-overlay-right" />
                    <img v-if="purchasePreviewItem && (purchasePreviewItem.displayType === 'espace' || purchasePreviewItem.name === 'Espace')" :src="asteroide" :alt="purchasePreviewItem?.name" class="equipped-asteroide-overlay" />
                    <img v-if="purchasePreviewItem && (purchasePreviewItem.displayType === 'vinyle' || purchasePreviewItem.name === 'Vinyle')" :src="vinyle" :alt="purchasePreviewItem?.name" class="equipped-vinyle-overlay" />
                    <img v-if="purchasePreviewItem && (purchasePreviewItem.displayType === 'gentleman' || purchasePreviewItem.name === 'Gentleman')" :src="gentleman" :alt="purchasePreviewItem?.name" class="equipped-gentleman-overlay" />
                    <img v-if="purchasePreviewItem && (purchasePreviewItem.displayType === 'royal-frame' || purchasePreviewItem.name === 'Cadre royale')" :src="cadre" :alt="purchasePreviewItem?.name" class="equipped-royal-frame" />
                    <img v-if="purchasePreviewItem && (purchasePreviewItem.displayType === 'rainbow' || purchasePreviewItem.name === 'Roses')" :src="love" :alt="purchasePreviewItem?.name" class="equipped-rainbow" />
                    <img v-if="purchasePreviewItem && (purchasePreviewItem.displayType === 'etoiles' || purchasePreviewItem.name === 'Étoiles')" :src="star" :alt="purchasePreviewItem?.name" class="equipped-stars" />

                    <!-- Above overlays targeting the scaler/container -->
                    <img v-for="(a, ai) in getProfilePopupAssetsForTargetPlacement(purchasePreviewItem, 'profile-avatar-scaler', 'above')" :key="'pp-scaler-above-'+ai" :src="resolveAssetSrc(a.src)" :style="getDynProfilePopupAssetStyle(a)" />
                  </div>
                </div>
              </div>
              <div class="preview-desc">
                <div class="preview-desc-line">{{ getPreviewDescription(purchasePreviewItem) }}</div>
                <div v-if="hasCreatorName(purchasePreviewItem)" class="creator-badge clickable" @click.stop="onCreatorClick(purchasePreviewItem)" :title="'Voir le profil du créateur'">
                  <span class="creator-label">Créé par</span>
                  <span class="creator-names-line">
                    <template v-for="(name, i) in getCreatorNames(purchasePreviewItem)" :key="'pp-cr-'+i">
                      <span class="creator-name" @click.stop="onCreatorNameClick(name)">{{ name }}</span><span v-if="i < getCreatorNames(purchasePreviewItem).length - 1">, </span>
                    </template>
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
              <!-- Items Spéciaux -->
      <div v-if="!showPurchasePreview" class="weekly-section">
          <div class="shop-grid small-grid">
            <div v-for="(item, idx) in adminLeftItemsForDisplay" :key="'left-'+idx" class="shop-item weekly-item small-card" :class="{ 'equipped': coinsStore.isItemEquipped(item.id) }">


              <!-- Checkmark pour les items débloqués -->
              <div v-if="coinsStore.hasItem(item.id)" class="checkmark-icon">✓</div>
              <!-- Cadenas pour les items verrouillés -->
              <div v-if="!coinsStore.hasItem(item.id)" class="lock-icon">🔒</div>
            <div class="item-img-wrapper" :style="item.name === 'Roi' || item.name === 'Matrix' || item.name === 'Oreilles de chat' || item.name === 'Ange' || item.name === 'Tomb Raider' || item.name === 'Clown' || item.name === 'Cash' || item.name === 'Cible' || item.name === 'Étoiles' || item.name === 'Cadre royale' || item.name === 'Roses' || item.name === 'Gentleman' || item.name === 'Vinyle' || item.name === 'Advisory' || item.name === 'Espace' || item.name === 'Absolute Cinema' || item.name === 'Flash' || item.name === 'Miaou' || item.name === 'DVD' || item.name === 'Lunettes pixel' || item.name === '2000' ? 'background: #fff;' : ''">
              <button v-if="item.name === 'Discord' || item.id == 23 || item.displayType === 'discord' || item.name === 'Jojo' || (item.isDynamic && Array.isArray(item.variants) && item.variants.length > 1)" class="style-nav-btn left-btn" :class="{ 'style-btn-anim': btnAnimFlags[((item.legacyId != null ? item.legacyId : item.id) + '-l')] }" type="button" @click.stop="prevItemStyle(item)" aria-label="Style précédent"><svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
              <button v-if="item.name === 'Discord' || item.id == 23 || item.displayType === 'discord' || item.name === 'Jojo' || (item.isDynamic && Array.isArray(item.variants) && item.variants.length > 1)" class="style-nav-btn right-btn" :class="{ 'style-btn-anim': btnAnimFlags[((item.legacyId != null ? item.legacyId : item.id) + '-r')] }" type="button" @click.stop="nextItemStyle(item)" aria-label="Style suivant"><svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
              <div v-if="item.name !== 'Cash'" class="item-img-container" :key="item.name === 'Jojo' ? 'jjw-'+jojoAnimKey : 'imgcw-'+index" :class="{ 'black-bg': item.name === 'Étoiles' || item.name === 'Espace' || item.name === 'DVD', 'jojo-bg-anim': (item.displayType === 'jojo' || item.name === 'Jojo'), 'style-change-anim': styleAnimFlags[item.id] || styleAnimFlags[item.legacyId] }">
                <!-- Dyn background + assets (comme Collection) -->
                <template v-if="item.isDynamic">
                  <div class="dyn-bg" :key="'dynw-bg-'+item.id+'-'+variantUpdateKey" :style="getDynVariantBgStyle(item)"></div>
                  <img
                    v-for="(a, ai) in getDynVariantAssets(item)"
                    :key="'dynw-variant-'+item.id+'-'+ai+'-'+variantUpdateKey"
                    :src="resolveAssetSrc(a.src)"
                    :style="getDynVariantAssetStyle(a)"
                  />
                </template>
                <img v-if="!item.isDynamic && item.name !== 'Matrix' && item.name !== 'Clown' && item.name !== 'Cash' && item.name !== 'Roi' && item.name !== 'Cible' && item.name !== 'Étoiles' && item.name !== 'Cadre royale' && item.name !== 'Roses' && item.name !== 'Gentleman' && item.name !== 'Vinyle' && item.name !== 'Advisory' && item.name !== 'Espace' && item.name !== 'Absolute Cinema' && item.name !== 'Flash' && item.name !== 'Miaou' && item.name !== 'DVD' && item.name !== 'Lunettes pixel' && item.name !== '2000' && item.name !== 'Tomb Raider' && item.name !== 'Ange' && item.name !== 'Discord' && item.id != 23 && item.name !== 'Jojo' && item.name !== 'Galaxie' && item.name !== 'Coeur'" :src="item.img" :alt="item.name" class="item-img" />
                
                <!-- Animations spéciales pour les items hebdomadaires -->
                <div v-if="item.name === 'Matrix'" class="matrix-rain-inside-shop">
                  <div class="matrix-column" v-for="(col, ci) in getMatrixColumns(item)" :key="'mw-'+ci" :style="{ left: (ci * 5) + '%', animationDelay: (col.delay) + 's' }">
                    <span v-for="(ch, ri) in col.chars" :key="'mwh-'+ri" class="matrix-char">{{ ch }}</span>
                  </div>
                </div>
                <div v-if="item.name === 'Clown'" class="clown-item-shop">
                  <img :src="clowncheveux" :alt="item.name" class="clown-hair-shop" loading="lazy" />
                  <img :src="clownnose" alt="Nez de clown" class="clown-nose-shop" loading="lazy" />
                </div>

                <div v-if="item.name === 'Roi'" class="roi-item-shop">
                  <img :src="roi" :alt="item.name" class="roi-img-shop" loading="lazy" />
                </div>
                <!-- Item Ange -->
                <div v-if="item.name === 'Ange'" class="angel-item-shop">
                  <img :src="angelwings" :alt="item.name" class="angel-img-shop" loading="lazy" />
                </div>
                <!-- Item Discord -->
                <div v-if="item.name === 'Discord' || item.id == 23 || item.displayType === 'discord'" class="discord-item-shop" :key="'w-discord-'+(coinsStore.discordVariantIndex || 0)">
                  <img :src="discordDisplayImg" :alt="item.name" class="discord-img-shop" loading="lazy" />
                </div>
                <!-- Item Jojo -->
                <div v-if="item.name === 'Jojo'" class="jojo-item-shop" :key="'w-jojo-container-'+jojoAnimKey">
                  <img :key="'w-jojo-'+jojoAnimKey" :src="jojo" :alt="item.name" class="jojo-img-shop jojo-swipe jojo-sepia-anim" :style="getWeeklyJojoImgStyle()" />
                  <img v-if="coinsStore.jojoVariantIndex === 1" :key="'w-jojotext-'+jojoAnimKey" :src="jojotext" alt="Jojo texte" class="jojo-text-preview jojotext-fade" :style="getWeeklyJojoTextStyle()" />
                </div>
                <div v-if="item.name === 'Tomb Raider'" class="tombraider-item-shop">
                  <img :src="laracroft" :alt="item.name" class="item-img" />
                </div>
                <div v-if="item.name === 'Cible'" class="target-animation-shop">
                  <img :src="target" :alt="item.name" class="target-img-shop" />
                </div>
                <div v-if="item.name === 'Étoiles'" class="stars-item-shop">
                  <img :src="star" :alt="item.name" class="stars-img-shop" />
                </div>
                <div v-if="item.name === 'Cadre royale'" class="royal-frame-item-shop">
                  <img :src="cadre" :alt="item.name" class="royal-frame-img-shop" />
                </div>
                <div v-if="item.name === 'Roses'" class="rainbow-item-shop">
                  <img :src="love" :alt="item.name" class="rainbow-img-shop" />
                </div>
                <div v-if="item.name === 'Gentleman'" class="gentleman-item-shop">
                  <img :src="moustache" :alt="item.name" class="moustache-img-shop" />
                  <img :src="gentleman" :alt="item.name" class="gentleman-img-shop" />
                </div>
                <div v-if="item.name === 'Vinyle'" class="vinyle-item-shop">
                  <img :src="vinyle" :alt="item.name" class="vinyle-img-shop" />
                </div>
                <div v-if="item.name === 'Advisory'" class="advisory-item-shop">
                  <img :src="advisory" :alt="item.name" class="advisory-img-shop" />
                </div>
                <div v-if="item.name === 'Galaxie'" class="galaxie-item-shop">
                  <img :src="galaxie" :alt="item.name" class="galaxie-img-shop" />
                </div>
                <div v-if="item.name === 'Coeur'" class="coeur-item-shop">
                  <img :src="coeur" :alt="item.name" class="coeur-img-shop" />
                </div>
                <div v-if="item.name === 'Prestige'" class="alpha-item-shop">
                  <img :src="alphaImg" :alt="item.name" class="alpha-img-shop" />
                </div>
                <div v-if="item.name === 'Planify'" class="admin-planify-item-shop">
                  <img :src="adminPlanify" :alt="item.name" class="admin-planify-img-shop" />
                </div>
                <div v-if="item.name === 'Espace'" class="espace-item-shop">
                  <img :src="spacestars" :alt="item.name" class="spacestars-img-shop" />
                  <img :src="asteroide" :alt="item.name" class="asteroide-img-shop" />
                </div>
                <div v-if="item.name === 'Absolute Cinema'" class="absolute-cinema-item-shop">
                  <img :src="bras" :alt="item.name" class="absolute-cinema-img-shop" />
                  <img :src="bras" :alt="item.name" class="absolute-cinema-img-shop-right" />
                </div>
                <div v-if="item.name === 'Flash'" class="flash-item-shop">
                  <img :src="flash" :alt="item.name" class="flash-img-shop" />
                  <img :src="camera" :alt="item.name" class="camera-img-shop" />
                </div>
                <div v-if="item.name === 'Miaou'" class="miaou-item-shop">
                  <img :src="chat" :alt="item.name" class="chat-img-shop" />
                  <img :src="pate" :alt="item.name" class="pate-img-shop" />
                </div>
                <div v-if="item.name === 'DVD'" class="dvd-item-shop">
                  <img :src="dvd" :alt="item.name" class="dvd-img-shop" />
                </div>
                <div v-if="item.name === 'Lunettes pixel'" class="lunettes-pixel-item-shop">
                  <img :src="mlglunette" :alt="item.name" class="lunettes-pixel-img-shop" />
                </div>
                <div v-if="item.name === '2000'" class="nokia-item-shop">
                  <img :src="nokia" :alt="item.name" class="nokia-img-shop" />
                  <img :src="clippy" :alt="item.name" class="clippy-img-shop" />
                  <img :src="daftpunk" :alt="item.name" class="daftpunk-img-shop" />
                </div>
              </div>
              <div v-if="item.name === 'Cash'" class="item-img-container">
                <img :src="cash" :alt="item.name" class="cash-img-shop" loading="lazy" />
              </div>
            </div>


            <div class="item-actions">
              <div v-if="isAdminUser" class="admin-replace" style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                <label class="admin-replace-label" style="font-weight:800;">Remplacer</label>
                <select class="admin-replace-select" @change="onAdminReplace(idx, $event.target.value)" style="padding:6px 8px;border-radius:8px;border:2px solid #000;">
                  <option value="">— Sélectionner —</option>
                  <option v-for="opt in adminAllOptions" :key="'opt-'+opt.id" :value="opt.id">{{ opt.name }}</option>
                </select>
                <button type="button" class="admin-reset-btn" @click.stop="onAdminReset(idx)" style="background:#5bc682;color:#fff;border:3px solid #000;border-radius:12px;padding:6px 10px;font-weight:800;">Reset</button>
              </div>
              <button v-if="!coinsStore.hasItem(item.id)" class="buy-btn price-hover" :disabled="!isAdminOnly && (userCoins < getItemPrice(item))" @click="openPurchasePreview(item)"><span class="btn-label">{{ item.name }}</span><span class="btn-price"><img src="@/assets/img/planicoins.webp" alt="Coin" class="coin-icon coin-small" /> {{ getItemPrice(item) }}</span></button>
              <button v-else class="owned-btn" disabled>Possédé</button>
              <button v-if="item.infoOnly || item.infoDescription || hasInfo(item)" class="info-btn" type="button" @click.stop="openInfoItem(item)">Plus d'infos</button>
            </div>
          </div>
        </div>
      </div>

        <!-- Variantes de Bordures Classiques -->
        <div v-if="!showPurchasePreview" class="weekly-section">
          <div class="shop-grid small-grid">
            <div v-for="(item, idx) in rightWeeklyColors" :key="'right-col-'+idx" class="shop-item weekly-item small-card" :class="{ 'equipped': coinsStore.selectedBorderColor === coinsStore.getBorderColorIdFromItem(item) }">
              <!-- Icônes comme dans la Collection -->
              <div v-if="coinsStore.hasItem(item.id)" class="checkmark-icon">✓</div>
              <div v-if="!coinsStore.hasItem(item.id)" class="lock-icon">🔒</div>

              <div class="item-img-wrapper">
                <span class="weekly-color-chip">{{ getWeeklyColorChipName(item) }}</span>
                <div class="item-img-container">
                  <!-- aperçu Bordure classique dans les items hebdo -->
                  <div class="classic-border-preview" :style="getWeeklyClassicFillStyle(item)" data-darkreader-ignore></div>
                </div>
              </div>

              <div class="item-actions">
                <button v-if="!coinsStore.hasItem(item.id)" class="buy-btn price-hover" :disabled="!isAdminOnly && (userCoins < getItemPrice(item))" @click="openPurchasePreview(item)"><span class="btn-label">{{ item.name }}</span><span class="btn-price"><img src="@/assets/img/planicoins.webp" alt="Coin" class="coin-icon coin-small" /> {{ getItemPrice(item) }}</span></button>
                <button v-else class="owned-btn" disabled>Possédé</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- Leaderboard -->
      <div v-if="activeTab === 'leaderboard' && showLeaderboardTab" class="leaderboard-container">
        <!-- Filtres de tri (Mobile uniquement) -->
        <div class="leaderboard-filters mobile-only-filters">
          <button 
            class="filter-btn" 
            :class="{ active: leaderboardFilter === 'coins' }" 
            @click="leaderboardFilter = 'coins'"
          >
            <img src="@/assets/img/planicoins.webp" alt="Coin" class="coin-icon" />
          </button>
          <button 
            class="filter-btn" 
            :class="{ active: leaderboardFilter === 'tasks' }" 
            @click="leaderboardFilter = 'tasks'"
          >
            <img src="@/assets/img/bouton_valider_cocher.png" alt="Tâches" class="coin-icon" />
          </button>
          <button 
            class="filter-btn" 
            :class="{ active: leaderboardFilter === 'factions' }" 
            @click="leaderboardFilter = 'factions'"
          >
            ⚔️
          </button>
        </div>

        <!-- Section Droite: Factions (Affichée à droite via CSS grid order) -->
        <div v-if="!isMobile || leaderboardFilter === 'factions'" class="factions-section" style="order: 2;">
          <!-- Timer mensuel -->
          <div class="month-timer">
            <span class="countdown-text">🕒 Temps restant : {{ factionCountdownText }}</span>
            <small class="timer-range">Période : {{ factionPeriodLabel }}</small>
          </div>

          <div class="factions-grid">
            <!-- Colonne Bagnat -->
            <div class="faction-col" :class="{ selected: userFaction === 'Bagnat', unselected: !!userFaction && userFaction !== 'Bagnat' }" ref="bagnatColumnRef">
              <div class="faction-total-card" :class="{ winner: (factionTotalCoins.bagnat || 0) >= (factionTotalCoins.fermier || 0), selected: userFaction === 'Bagnat', unselected: !!userFaction && userFaction !== 'Bagnat' }">
                <h3>Team Bagnat</h3>
                <div class="total-score-display">
                  {{ formatCoins(factionTotalCoins.bagnat) }} <img src="@/assets/logo_bagnat.webp" alt="Bagnat" class="coin-icon" style="width:45px !important; height:32px !important;" />
                </div>
              </div>
              <button 
                v-if="userFaction !== 'Bagnat'" 
                @click="joinFaction('Bagnat')" 
                :disabled="joiningFaction"
                class="join-faction-btn"
              >
                {{ joiningFaction ? 'Rejoindre...' : 'Rejoindre Bagnat' }}
              </button>
              <div v-else class="faction-member-badge">
                ✅ Vous êtes membre de cette faction
              </div>
              <div v-if="shouldShowPinnedMe('Bagnat')" class="leaderboard-item">
                <div class="leaderboard-position">
                  <!-- Médailles pour top 3 -->
                  <span v-if="(currentUserFactionEntry.rank || 1) <= 3" class="medal">
                    {{
                      (currentUserFactionEntry.rank || 1) === 1
                        ? '🥇'
                        : (currentUserFactionEntry.rank || 1) === 2
                          ? '🥈'
                          : '🥉'
                    }}
                  </span>
                  <!-- Position numérique pour les autres -->
                  <span v-else class="position">{{ currentUserFactionEntry.rank || 1 }}</span>
                </div>
                <div class="user-info">
                  <div class="user-avatar-container" data-darkreader-ignore @click="openLeaderboardProfile(currentUserFactionEntry)">
                    <!-- Absolute Cinema: bras droit dans le user-avatar-container (Faction Bagnat - utilisateur courant) -->
                    <img 
                      v-if="getUserEquippedItemData(currentUserFactionEntry) && getUserEquippedItemData(currentUserFactionEntry).displayType === 'absolute-cinema'" 
                      :src="bras" 
                      :alt="getUserEquippedItemData(currentUserFactionEntry).name"
                      class="equipped-absolute-cinema-overlay-right"
                    />
                    
                    <!-- Overlays principaux comme sur le leaderboard -->
                    <template v-if="getUserEquippedItemData(currentUserFactionEntry) && getUserEquippedItemData(currentUserFactionEntry).isDynamic">
                      <img
                        v-for="(a, ai) in (Array.isArray(getUserEquippedItemData(currentUserFactionEntry).variants) && getUserEquippedItemData(currentUserFactionEntry).variants.length > 0
                          ? getDynVariantAssetsForLeaderboard(currentUserFactionEntry, getUserEquippedItemData(currentUserFactionEntry))
                          : getUserEquippedItemData(currentUserFactionEntry).assets)"
                        v-if="isAssetTargetingContainer(getUserEquippedItemData(currentUserFactionEntry), a, currentUserFactionEntry)"
                        :key="'dyn-container-user-' + ai + '-' + dynamicVariantsState"
                        :src="resolveAssetSrc(a.src)"
                        :style="getDynLeaderboardAssetStyle(a)"
                        :class="getDynLeaderboardAssetClass(a)"
                      />
                    </template>
                    <img 
                      v-if="getUserEquippedItemData(currentUserFactionEntry) && getUserEquippedItemData(currentUserFactionEntry).displayType === 'discord'"
                      :src="[discordon, discordnepasderange, discordderange][coinsStore.discordVariantIndex || 0]"
                      alt="Discord"
                      class="equipped-discord"
                    />
                    <img 
                      v-if="getUserEquippedItemData(currentUserFactionEntry) && getUserEquippedItemData(currentUserFactionEntry).name === 'Galaxie'"
                      :src="galaxie"
                      alt="Galaxie"
                      class="equipped-galaxie"
                    />
                    <img 
                      v-if="getUserEquippedItemData(currentUserFactionEntry) && (getUserEquippedItemData(currentUserFactionEntry).name === 'Coeur' || getUserEquippedItemData(currentUserFactionEntry).displayType === 'coeur')"
                      :src="coeur"
                      alt="Coeur"
                      class="equipped-coeur"
                    />
                    <img 
                      v-if="getUserEquippedItemData(currentUserFactionEntry) && (getUserEquippedItemData(currentUserFactionEntry).name === 'Prestige' || getUserEquippedItemData(currentUserFactionEntry).displayType === 'alpha')"
                      :src="alphaImg"
                      :alt="'Prestige'"
                      class="equipped-alpha"
                    />
                    <img 
                      v-if="getUserEquippedItemData(currentUserFactionEntry) && (getUserEquippedItemData(currentUserFactionEntry).name === 'Planify' || getUserEquippedItemData(currentUserFactionEntry).displayType === 'admin-planify')"
                      :src="adminPlanify"
                      :alt="'Planify'"
                      class="equipped-admin-planify"
                    />
                    <img 
                      v-if="getUserEquippedItemData(currentUserFactionEntry) && getUserEquippedItemData(currentUserFactionEntry).displayType === 'roi'"
                      :src="roi"
                      :alt="getUserEquippedItemData(currentUserFactionEntry).name"
                      class="equipped-roi-overlay"
                    />
                    <img 
                      v-if="getUserEquippedItemData(currentUserFactionEntry) && getUserEquippedItemData(currentUserFactionEntry).displayType === 'tomb-raider'"
                      :src="laracroft"
                      :alt="getUserEquippedItemData(currentUserFactionEntry).name"
                      class="equipped-tomb-raider"
                    />
                    <img 
                      v-if="getUserEquippedItemData(currentUserFactionEntry) && getUserEquippedItemData(currentUserFactionEntry).displayType === 'generic' && getUserEquippedItemData(currentUserFactionEntry).name !== 'Jojo' && getUserEquippedItemData(currentUserFactionEntry).name !== 'Galaxie' && getUserEquippedItemData(currentUserFactionEntry).name !== 'Coeur' && getUserEquippedItemData(currentUserFactionEntry).name !== 'Miaou' && !getUserEquippedItemData(currentUserFactionEntry).isDynamic" 
                      :src="getUserEquippedItemData(currentUserFactionEntry).img" 
                      :alt="getUserEquippedItemData(currentUserFactionEntry).name"
                      :class="getEquippedItemClass(getUserEquippedItemData(currentUserFactionEntry).name)"
                    />
                    <img 
                      v-if="getUserEquippedItemData(currentUserFactionEntry) && shouldRenderStaticOverlay(getUserEquippedItemData(currentUserFactionEntry)) && getUserEquippedItemData(currentUserFactionEntry).displayType !== 'matrix' && getUserEquippedItemData(currentUserFactionEntry).displayType !== 'absolute-cinema' && getUserEquippedItemData(currentUserFactionEntry).name !== 'Miaou'"
                      :src="getUserEquippedItemData(currentUserFactionEntry).img" 
                      :alt="getUserEquippedItemData(currentUserFactionEntry).name"
                      :class="getEquippedItemClass(getUserEquippedItemData(currentUserFactionEntry).name)"
                    />
                    <img 
                      v-if="getUserEquippedItemData(currentUserFactionEntry) && getUserEquippedItemData(currentUserFactionEntry).displayType === 'gentleman'" 
                      :src="gentleman" 
                      :alt="getUserEquippedItemData(currentUserFactionEntry).name"
                      class="equipped-gentleman-overlay"
                    />
                    <!-- Absolute Cinema: bras gauche overlay (Faction Fermier - utilisateur courant) -->
                    <img 
                      v-if="getUserEquippedItemData(currentUserFactionEntry) && getUserEquippedItemData(currentUserFactionEntry).displayType === 'absolute-cinema'" 
                      :src="bras" 
                      :alt="getUserEquippedItemData(currentUserFactionEntry).name"
                      class="equipped-absolute-cinema-overlay"
                    />
                    <div class="user-avatar" :style="getAvatarBorderStyle(currentUserFactionEntry)" :class="{ 'jojo-sepia': getUserEquippedItemData(currentUserFactionEntry) && getUserEquippedItemData(currentUserFactionEntry).displayType === 'jojo', 'no-border': getUserEquippedItemData(currentUserFactionEntry) && ((getUserEquippedItemData(currentUserFactionEntry).displayType === 'discord' || getUserEquippedItemData(currentUserFactionEntry).name === 'Galaxie' || getUserEquippedItemData(currentUserFactionEntry).name === 'Coeur' || getUserEquippedItemData(currentUserFactionEntry).name === 'Prestige' || getUserEquippedItemData(currentUserFactionEntry).name === 'Planify') || shouldRemoveLeaderboardBorder(getUserEquippedItemData(currentUserFactionEntry))) }">
                      <img 
                        :src="getUserAvatar(currentUserFactionEntry)" 
                        class="avatar-img"
                        @error="handleAvatarError"
                        @load="handleAvatarLoad"
                      />
                      <!-- Animation Matrix à l'intérieur de l'avatar (Bagnat - utilisateur courant) -->
                      <div v-if="getUserEquippedItemData(currentUserFactionEntry) && getUserEquippedItemData(currentUserFactionEntry).displayType === 'matrix'" class="matrix-rain-inside">
                        <div class="matrix-column" v-for="i in 20" :key="'f-bagnat-mx-'+i" :style="{ left: (i * 5) + '%', animationDelay: (Math.random() * 2) + 's' }">
                          <span v-for="j in 5" :key="'f-bagnat-mx-ch-'+j" class="matrix-char">{{ getRandomMatrixChar() }}</span>
                        </div>
                      </div>
                      <!-- Items à l'intérieur de l'avatar (Factions Bagnat) -->
                      <img 
                        v-if="getUserEquippedItemData(currentUserFactionEntry) && getUserEquippedItemData(currentUserFactionEntry).displayType === 'cash'" 
                        :src="getUserEquippedItemData(currentUserFactionEntry).img" 
                        :alt="getUserEquippedItemData(currentUserFactionEntry).name"
                        class="equipped-cash-inside"
                      />
                      <img 
                        v-if="getUserEquippedItemData(currentUserFactionEntry) && getUserEquippedItemData(currentUserFactionEntry).displayType === 'target'" 
                        :src="getUserEquippedItemData(currentUserFactionEntry).img" 
                        :alt="getUserEquippedItemData(currentUserFactionEntry).name"
                        class="equipped-target-inside"
                      />
                      <!-- Nez de clown à l'intérieur de l'avatar (Factions Bagnat) -->
                      <img 
                        v-if="getUserEquippedItemData(currentUserFactionEntry) && getUserEquippedItemData(currentUserFactionEntry).displayType === 'clown'" 
                        :src="clownnose" 
                        alt="Nez de clown" 
                        class="equipped-clown-nose" 
                      />
                      <!-- Gentleman: moustache à l’intérieur (Factions Bagnat) -->
                      <img 
                        v-if="getUserEquippedItemData(currentUserFactionEntry) && getUserEquippedItemData(currentUserFactionEntry).displayType === 'gentleman'" 
                        :src="moustache" 
                        :alt="getUserEquippedItemData(currentUserFactionEntry).name"
                        class="equipped-moustache-inside"
                      />
                      <!-- Advisory: à l'intérieur -->
                      <img 
                        v-if="getUserEquippedItemData(currentUserFactionEntry) && getUserEquippedItemData(currentUserFactionEntry).displayType === 'advisory'" 
                        :src="advisory" 
                        :alt="getUserEquippedItemData(currentUserFactionEntry).name"
                        class="equipped-advisory-inside"
                      />

                      <!-- Espace: étoiles à l'intérieur -->
                      <img 
                        v-if="getUserEquippedItemData(currentUserFactionEntry) && getUserEquippedItemData(currentUserFactionEntry).displayType === 'espace'" 
                        :src="spacestars" 
                        :alt="getUserEquippedItemData(currentUserFactionEntry).name"
                        class="equipped-spacestars-inside"
                      />
                      <!-- Espace: astéroïde à l'intérieur -->
                      <img 
                        v-if="getUserEquippedItemData(currentUserFactionEntry) && getUserEquippedItemData(currentUserFactionEntry).displayType === 'espace'" 
                        :src="asteroide" 
                        :alt="getUserEquippedItemData(currentUserFactionEntry).name"
                        class="equipped-asteroide-overlay"
                      />
                      <!-- DVD: à l'intérieur -->
                      <img 
                        v-if="getUserEquippedItemData(currentUserFactionEntry) && getUserEquippedItemData(currentUserFactionEntry).displayType === 'dvd'" 
                        :src="dvd" 
                        :alt="getUserEquippedItemData(currentUserFactionEntry).name"
                        class="equipped-dvd-inside"
                      />
                      <!-- Lunettes pixel: à l'intérieur -->
                      <img 
                        v-if="getUserEquippedItemData(currentUserFactionEntry) && getUserEquippedItemData(currentUserFactionEntry).displayType === 'lunettes-pixel'" 
                        :src="mlglunette" 
                        :alt="getUserEquippedItemData(currentUserFactionEntry).name"
                        class="equipped-lunettes-pixel-inside"
                      />
                      <!-- Flash: caméra à l'intérieur -->
                      <img 
                        v-if="getUserEquippedItemData(currentUserFactionEntry) && getUserEquippedItemData(currentUserFactionEntry).displayType === 'flash'" 
                        :src="camera" 
                        :alt="getUserEquippedItemData(currentUserFactionEntry).name"
                        class="equipped-camera-overlay"
                      />
                      <!-- Item 2000 (Nokia): téléphone à l'intérieur (Faction Bagnat) -->
                      <img 
                        v-if="getUserEquippedItemData(currentUserFactionEntry) && getUserEquippedItemData(currentUserFactionEntry).displayType === 'nokia'" 
                        :src="nokia" 
                        :alt="getUserEquippedItemData(currentUserFactionEntry).name"
                        class="equipped-nokia-inside"
                      />
                      <!-- Item 2000 (Nokia): Clippy à l'intérieur (Faction Bagnat) -->
                      <img 
                        v-if="getUserEquippedItemData(currentUserFactionEntry) && getUserEquippedItemData(currentUserFactionEntry).displayType === 'nokia'" 
                        :src="clippy" 
                        :alt="getUserEquippedItemData(currentUserFactionEntry).name"
                        class="equipped-clippy-inside"
                      />
                      <!-- Item Jojo: à l'intérieur (Faction Fermier) -->
                      <img 
                        v-if="getUserEquippedItemData(currentUserFactionEntry) && getUserEquippedItemData(currentUserFactionEntry).displayType === 'jojo'" 
                        :src="jojo" 
                        :alt="getUserEquippedItemData(currentUserFactionEntry).name"
                        class="equipped-jojo-inside"
                        :key="'faction-jojo-'+getJojoVariantIndexForUser(currentUserFactionEntry)"
                      />
                      <!-- Item Jojo: texte à l'intérieur (Faction Fermier) -->
                      <img 
                        v-if="getUserEquippedItemData(currentUserFactionEntry) && getUserEquippedItemData(currentUserFactionEntry).displayType === 'jojo' && getJojoVariantIndexForUser(currentUserFactionEntry) === 1" 
                        :src="jojotext" 
                        :alt="getUserEquippedItemData(currentUserFactionEntry).name"
                        class="equipped-jojotext-inside"
                        :key="'faction-jojotext-'+getJojoVariantIndexForUser(currentUserFactionEntry)"
                      />

                    </div>
                    <!-- Item Miaou (chat uniquement) par-dessus l'avatar (positionné dans le conteneur) -->
                    <img 
                      v-if="getUserEquippedItemData(currentUserFactionEntry) && getUserEquippedItemData(currentUserFactionEntry).displayType === 'miaou'" 
                      :src="chat" 
                      :alt="getUserEquippedItemData(currentUserFactionEntry).name"
                      class="equipped-chat-overlay"
                    />
                    
                    <!-- Item Miaou (pate uniquement) par-dessus l'avatar (positionné dans le conteneur) -->
                    <img 
                      v-if="getUserEquippedItemData(currentUserFactionEntry) && getUserEquippedItemData(currentUserFactionEntry).displayType === 'miaou'" 
                      :src="pate" 
                      :alt="getUserEquippedItemData(currentUserFactionEntry).name"
                      class="equipped-pate-overlay"
                    />
                    
                    <!-- Item 2000 (Nokia): Daft Punk par-dessus l'avatar (positionné en dehors du conteneur) -->
                    <img 
                      v-if="getUserEquippedItemData(currentUserFactionEntry) && getUserEquippedItemData(currentUserFactionEntry).displayType === 'nokia'" 
                      :src="daftpunk" 
                      :alt="getUserEquippedItemData(currentUserFactionEntry).name"
                      class="equipped-daftpunk-overlay"
                    />
                  </div>
                  <!-- Surcouches hors conteneur (Factions Bagnat) -->
                  <div class="user-details">
                    <div class="username">{{ getUserFullName(currentUserFactionEntry) }}</div>
                  </div>
                </div>
                <div class="user-score">
                  <span class="score-value">
                    {{ formatCoins(currentUserFactionEntry.factionCoins || 0) }} <img src="@/assets/img/planicoins.webp" alt="Coin" class="coin-icon-small" />
                  </span>
                </div>
                
                <!-- Surcouches hors conteneur (Faction Fermier - utilisateur courant) -->
                <!-- Absolute Cinema: bras gauche seulement (bras droit maintenant dans user-avatar-container) -->
              </div>
              <div class="leaderboard-list faction-leaderboard-list">
                <div v-if="factionLoading" class="leaderboard-empty">
                  <p>Chargement des factions...</p>
                </div>
                <div v-else-if="factionUsers.bagnat.length === 0" class="leaderboard-empty">
                  <p>Aucun membre dans cette faction</p>
                </div>
                <div v-else v-for="(user, index) in factionUsers.bagnat" :key="'bagnat-' + user.username" class="leaderboard-item">
                  <!-- Position -->
                  <div class="leaderboard-position">
                    <span v-if="index < 3" class="medal">{{ index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉' }}</span>
                    <span v-else class="position">{{ index + 1 }}</span>
                  </div>
                  
                  <!-- Avatar et infos utilisateur -->
                  <div class="user-info">
                    <div class="user-avatar-container" data-darkreader-ignore @click="openLeaderboardProfile(user)">
                      <!-- Absolute Cinema: bras droit dans le user-avatar-container (Faction Bagnat - liste) -->
                      <img 
                        v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).displayType === 'absolute-cinema'" 
                        :src="bras" 
                        :alt="getUserEquippedItemData(user).name"
                        class="equipped-absolute-cinema-overlay-right"
                      />
                      
                      <!-- Overlays dynamiques ciblant le conteneur (Faction Bagnat) -->
                      <template v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).isDynamic">
                        <img
                          v-for="(a, ai) in (Array.isArray(getUserEquippedItemData(user).variants) && getUserEquippedItemData(user).variants.length > 0
                            ? getDynVariantAssetsForLeaderboard(user, getUserEquippedItemData(user))
                            : getUserEquippedItemData(user).assets)"
                          v-if="isAssetTargetingContainer(getUserEquippedItemData(user), a)"
                          :key="'dyn-container-faction-bagnat-' + ai + '-' + dynamicVariantsState"
                          :src="resolveAssetSrc(a.src)"
                          :style="getDynLeaderboardAssetStyle(a)"
                          :class="getDynLeaderboardAssetClass(a)"
                        />
                      </template>
                      
                      <!-- Overlays principaux comme sur le leaderboard -->
                      <img 
                        v-if="getUserEquippedItemData(user) && (getUserEquippedItemData(user).name === 'Planify' || getUserEquippedItemData(user).displayType === 'admin-planify')"
                        :src="adminPlanify"
                        :alt="'Planify'"
                        class="equipped-admin-planify"
                      />
                      <!-- Galaxie: overlay conteneur (Bagnat) -->
                      <img 
                        v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).name === 'Galaxie'"
                        :src="galaxie"
                        alt="Galaxie"
                        class="equipped-galaxie"
                      />
                      <img 
                        v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).displayType === 'roi'"
                        :src="roi"
                        :alt="getUserEquippedItemData(user).name"
                        class="equipped-roi-overlay"
                      />
                      <img 
                        v-if="getUserEquippedItemData(user) && shouldRenderStaticOverlay(getUserEquippedItemData(user)) && getUserEquippedItemData(user).displayType !== 'matrix' && getUserEquippedItemData(user).displayType !== 'absolute-cinema' && getUserEquippedItemData(user).name !== 'Miaou'"
                        :src="getUserEquippedItemData(user).img" 
                        :alt="getUserEquippedItemData(user).name"
                        :class="getEquippedItemClass(getUserEquippedItemData(user).name)"
                      />
                      <!-- Ajout: overlays dédiés Miaou (chat + patte) -->
                      <img
                        v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).displayType === 'miaou'"
                        :src="chat"
                        :alt="getUserEquippedItemData(user).name"
                        class="equipped-chat-overlay"
                      />
                      <img
                        v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).displayType === 'miaou'"
                        :src="pate"
                        :alt="getUserEquippedItemData(user).name"
                        class="equipped-pate-overlay"
                      />
                      <img 
                        v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).displayType === 'gentleman'" 
                        :src="gentleman" 
                        :alt="getUserEquippedItemData(user).name"
                        class="equipped-gentleman-overlay"
                      />
                      <div class="user-avatar" :style="getAvatarBorderStyle(user)" :class="{ 'jojo-sepia': getUserEquippedItemData(user) && getUserEquippedItemData(user).displayType === 'jojo', 'no-border': getUserEquippedItemData(user) && (((getUserEquippedItemData(user).displayType === 'discord' || getUserEquippedItemData(user).displayType === 'matrix') && !showBorderForDynEquippedItem(getUserEquippedItemData(user))) || getUserEquippedItemData(user).displayType === 'espace' || getUserEquippedItemData(user).name === 'Galaxie' || shouldRemoveLeaderboardBorder(getUserEquippedItemData(user))) }">
                        <img 
                          :src="getUserAvatar(user)" 
                          class="avatar-img"
                          :style="[
                            (getUserEquippedItemData(user) && getUserEquippedItemData(user).displayType === 'jojo')
                              ? { filter: 'sepia(0)', animation: 'jojo-sepia-cycle 4.7s steps(1,end) infinite' }
                              : { filter: 'sepia(0)' },
                            getAvatarImageStyle(user)
                          ]"
                          @error="handleAvatarError"
                          @load="handleAvatarLoad"
                        />
                        <!-- Items dynamiques placés derrière l'avatar (Bagnat - liste) -->
                        <template v-if="getUserEquippedItemData(user)">
                          <template v-if="getUserEquippedItemData(user).isDynamic && Array.isArray(getUserEquippedItemData(user).variants) && getUserEquippedItemData(user).variants.length > 0">
                            <img
                              v-for="(a, ai) in getDynVariantAssetsForLeaderboard(user, getUserEquippedItemData(user))"
                              v-if="a && a.meta && a.meta.leaderboardPlacement === 'below' && isAssetTargetingAvatar(getUserEquippedItemData(user), a)"
                              :key="'dyn-lb-below-faction-bagnat-'+ai+'-'+dynamicVariantsState"
                              :src="resolveAssetSrc(a.src)"
                              :style="getDynLeaderboardAssetStyle(a)"
                            />
                          </template>
                          <template v-else-if="getUserEquippedItemData(user).isDynamic">
                            <img
                              v-for="(a, ai) in getUserEquippedItemData(user).assets"
                              v-if="a && a.meta && a.meta.leaderboardPlacement === 'below' && isAssetTargetingAvatar(getUserEquippedItemData(user), a)"
                              :key="'dyn-below-faction-bagnat-'+ai"
                              :src="resolveAssetSrc(a.src)"
                              :style="getDynLeaderboardAssetStyle(a)"
                            />
                          </template>
                        </template>

                        <!-- Animation Matrix à l'intérieur de l'avatar (Bagnat - liste) -->
                        <div v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).displayType === 'matrix'" class="matrix-rain-inside">
                          <div class="matrix-column"
                               v-for="(col, ci) in getMatrixColumns(user)"
                               :key="'f-bagnat-list-mx-'+ci"
                               :style="{ left: (ci * 5) + '%', animationDelay: (col.delay) + 's' }">
                            <span v-for="(ch, ri) in col.chars"
                                  :key="'f-bagnat-list-mx-ch-'+ci+'-'+ri"
                                  class="matrix-char">{{ ch }}</span>
                          </div>
                        </div>

                        <!-- Nez de clown à l'intérieur de l'avatar (Bagnat - liste) -->
                        <img 
                          v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).displayType === 'clown'" 
                          :src="clownnose" 
                          alt="Nez de clown" 
                          class="equipped-clown-nose" 
                        />

                        <!-- Items à l'intérieur de l'avatar (Factions Bagnat) -->
                      <img 
                        v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).displayType === 'cash'" 
                        :src="getUserEquippedItemData(user).img" 
                        :alt="getUserEquippedItemData(user).name"
                        class="equipped-cash-inside"
                      />
                      <img 
                        v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).displayType === 'target'" 
                        :src="getUserEquippedItemData(user).img" 
                        :alt="getUserEquippedItemData(user).name"
                        class="equipped-target-inside"
                      />
                      <!-- Gentleman: moustache à l’intérieur -->
                      <img 
                        v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).displayType === 'gentleman'" 
                        :src="moustache" 
                        :alt="getUserEquippedItemData(user).name"
                        class="equipped-moustache-inside"
                      />
                      <!-- Advisory: à l’intérieur (Factions Bagnat) -->
                      <img 
                        v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).displayType === 'advisory'" 
                        :src="advisory" 
                        :alt="getUserEquippedItemData(user).name"
                        class="equipped-advisory-inside"
                      />
                      <!-- Item 2000 (Nokia): téléphone à l'intérieur (Faction Bagnat) -->
                      <img 
                        v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).displayType === 'nokia'" 
                        :src="nokia" 
                        :alt="getUserEquippedItemData(user).name"
                        class="equipped-nokia-inside"
                      />
                      <!-- Item 2000 (Nokia): Clippy à l'intérieur (Faction Bagnat) -->
                      <img 
                        v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).displayType === 'nokia'" 
                        :src="clippy" 
                        :alt="getUserEquippedItemData(user).name"
                        class="equipped-clippy-inside"
                      />
                      <!-- Item Jojo: à l'intérieur (Faction Fermier) -->
                      <img 
                        v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).displayType === 'jojo'" 
                        :src="jojo" 
                        :alt="getUserEquippedItemData(user).name"
                        class="equipped-jojo-inside"
                        :key="'faction-jojo-'+getJojoVariantIndexForUser(user)"
                      />
                      <!-- Item Jojo: texte à l'intérieur (Faction Fermier) -->
                      <img 
                        v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).displayType === 'jojo' && getJojoVariantIndexForUser(user) === 1" 
                        :src="jojotext" 
                        :alt="getUserEquippedItemData(user).name"
                        class="equipped-jojotext-inside"
                        :key="'faction-jojotext-'+getJojoVariantIndexForUser(user)"
                      />

                    </div>
                    <img 
                      v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).displayType === 'flash'" 
                      :src="flash" 
                      :alt="getUserEquippedItemData(user).name"
                      class="equipped-flash-overlay"
                    />
                    <img 
                      v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).displayType === 'flash'" 
                      :src="camera" 
                      :alt="getUserEquippedItemData(user).name"
                      class="equipped-camera-overlay"
                    />
                    <img 
                      v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).displayType === 'tomb-raider'" 
                      :src="laracroft" 
                      :alt="getUserEquippedItemData(user).name"
                      class="equipped-tomb-raider"
                    />
                    <!-- Absolute Cinema: bras gauche (AJOUT pour Bagnat - liste) -->
                    <img 
                      v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).displayType === 'absolute-cinema'" 
                      :src="bras" 
                      :alt="getUserEquippedItemData(user).name"
                      class="equipped-absolute-cinema-overlay"
                    />
                    <!-- Clown: cheveux overlay (Factions Bagnat) -->
                    <img 
                      v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).displayType === 'clown'" 
                      :src="clowncheveux" 
                      :alt="getUserEquippedItemData(user).name"
                      class="equipped-clown-overlay"
                    />
                    
                    <!-- Item 2000 (Nokia): Daft Punk par-dessus l'avatar (positionné en dehors du conteneur) -->
                    <img 
                      v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).displayType === 'nokia'" 
                      :src="daftpunk" 
                      :alt="getUserEquippedItemData(user).name"
                      class="equipped-daftpunk-overlay"
                    />

                  </div>
                    
                    <div class="user-details">
                      <div class="username">{{ user.username }}</div>
                    </div>
                  </div>
                  
                  <!-- Score -->
                  <div class="user-score">
                    <span class="score-value">
                      {{ formatCoins(user.factionCoins || 0) }} <img src="@/assets/img/planicoins.webp" alt="Coin" class="coin-icon-small" />
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Colonne Fermier -->
            <div class="faction-col" :class="{ selected: userFaction === 'Fermier', unselected: !!userFaction && userFaction !== 'Fermier' }" ref="fermierColumnRef">
              <div class="faction-total-card" :class="{ winner: (factionTotalCoins.fermier || 0) > (factionTotalCoins.bagnat || 0), selected: userFaction === 'Fermier', unselected: !!userFaction && userFaction !== 'Fermier' }">
                <h3>Team Fermier</h3>
                <div class="total-score-display">
                  {{ formatCoins(factionTotalCoins.fermier) }} <img src="@/assets/logo_fermier.webp" alt="Fermier" class="coin-icon" style="width:45px !important; height:32px !important;" />
                </div>
              </div>
              <button 
                v-if="userFaction !== 'Fermier'" 
                @click="joinFaction('Fermier')" 
                :disabled="joiningFaction"
                class="join-faction-btn"
              >
                {{ joiningFaction ? 'Rejoindre...' : 'Rejoindre Fermier' }}
              </button>
              <div v-else class="faction-member-badge">
                ✅ Vous êtes membre de cette faction
              </div>
              
              <div v-if="shouldShowPinnedMe('Fermier')" class="leaderboard-item">
                <div class="leaderboard-position">
                  <!-- Médailles pour top 3 -->
                  <span v-if="(currentUserFactionEntry.rank || 1) <= 3" class="medal">
                    {{
                      (currentUserFactionEntry.rank || 1) === 1
                        ? '🥇'
                        : (currentUserFactionEntry.rank || 1) === 2
                          ? '🥈'
                          : '🥉'
                    }}
                  </span>
                  <!-- Position numérique pour les autres -->
                  <span v-else class="position">{{ currentUserFactionEntry.rank || 1 }}</span>
                </div>
                <div class="user-info">
                  <div class="user-avatar-container" data-darkreader-ignore @click="openLeaderboardProfile(currentUserFactionEntry)">
                    <!-- Absolute Cinema: bras droit dans le user-avatar-container (Faction Fermier - utilisateur courant) -->
                    <img 
                      v-if="getUserEquippedItemData(currentUserFactionEntry) && getUserEquippedItemData(currentUserFactionEntry).displayType === 'absolute-cinema'" 
                      :src="bras" 
                      :alt="getUserEquippedItemData(currentUserFactionEntry).name"
                      class="equipped-absolute-cinema-overlay-right"
                    />
                    
                    <!-- Overlays principaux comme sur le leaderboard -->
                    <template v-if="getUserEquippedItemData(currentUserFactionEntry) && getUserEquippedItemData(currentUserFactionEntry).isDynamic">
                      <img
                        v-for="(a, ai) in (Array.isArray(getUserEquippedItemData(currentUserFactionEntry).variants) && getUserEquippedItemData(currentUserFactionEntry).variants.length > 0
                          ? getDynVariantAssetsForLeaderboard(currentUserFactionEntry, getUserEquippedItemData(currentUserFactionEntry))
                          : getUserEquippedItemData(currentUserFactionEntry).assets)"
                        v-if="isAssetTargetingContainer(getUserEquippedItemData(currentUserFactionEntry), a, currentUserFactionEntry)"
                        :key="'dyn-container-user-' + ai + '-' + dynamicVariantsState"
                        :src="resolveAssetSrc(a.src)"
                        :style="getDynLeaderboardAssetStyle(a)"
                        :class="getDynLeaderboardAssetClass(a)"
                      />
                    </template>
                    <img 
                      v-if="getUserEquippedItemData(currentUserFactionEntry) && getUserEquippedItemData(currentUserFactionEntry).displayType === 'discord'"
                      :src="[discordon, discordnepasderange, discordderange][coinsStore.discordVariantIndex || 0]"
                      alt="Discord"
                      class="equipped-discord"
                    />
                    <img 
                      v-if="getUserEquippedItemData(currentUserFactionEntry) && getUserEquippedItemData(currentUserFactionEntry).name === 'Galaxie'"
                      :src="galaxie"
                      alt="Galaxie"
                      class="equipped-galaxie"
                    />
                    <img 
                      v-if="getUserEquippedItemData(currentUserFactionEntry) && (getUserEquippedItemData(currentUserFactionEntry).name === 'Coeur' || getUserEquippedItemData(currentUserFactionEntry).displayType === 'coeur')"
                      :src="coeur"
                      alt="Coeur"
                      class="equipped-coeur"
                    />
                    <img 
                      v-if="getUserEquippedItemData(currentUserFactionEntry) && (getUserEquippedItemData(currentUserFactionEntry).name === 'Prestige' || getUserEquippedItemData(currentUserFactionEntry).displayType === 'alpha')"
                      :src="alphaImg"
                      :alt="'Prestige'"
                      class="equipped-alpha"
                    />
                    <img 
                      v-if="getUserEquippedItemData(currentUserFactionEntry) && (getUserEquippedItemData(currentUserFactionEntry).name === 'Planify' || getUserEquippedItemData(currentUserFactionEntry).displayType === 'admin-planify')"
                      :src="adminPlanify"
                      :alt="'Planify'"
                      class="equipped-admin-planify"
                    />
                    <img 
                      v-if="getUserEquippedItemData(currentUserFactionEntry) && getUserEquippedItemData(currentUserFactionEntry).displayType === 'generic' && getUserEquippedItemData(currentUserFactionEntry).name !== 'Jojo' && getUserEquippedItemData(currentUserFactionEntry).name !== 'Galaxie' && getUserEquippedItemData(currentUserFactionEntry).name !== 'Coeur' && getUserEquippedItemData(currentUserFactionEntry).name !== 'Miaou' && !getUserEquippedItemData(currentUserFactionEntry).isDynamic" 
                      :src="getUserEquippedItemData(currentUserFactionEntry).img" 
                      :alt="getUserEquippedItemData(currentUserFactionEntry).name"
                      :class="getEquippedItemClass(getUserEquippedItemData(currentUserFactionEntry).name)"
                    />
                    <img 
                      v-if="getUserEquippedItemData(currentUserFactionEntry) && shouldRenderStaticOverlay(getUserEquippedItemData(currentUserFactionEntry)) && getUserEquippedItemData(currentUserFactionEntry).displayType !== 'matrix' && getUserEquippedItemData(currentUserFactionEntry).displayType !== 'absolute-cinema' && getUserEquippedItemData(currentUserFactionEntry).name !== 'Miaou'" 
                      :src="getUserEquippedItemData(currentUserFactionEntry).img" 
                      :alt="getUserEquippedItemData(currentUserFactionEntry).name"
                      :class="getEquippedItemClass(getUserEquippedItemData(currentUserFactionEntry).name)"
                    />
                    <!-- AJOUT overlays manquants pour l'utilisateur courant (Faction Fermier) -->
                    <img 
                      v-if="getUserEquippedItemData(currentUserFactionEntry) && getUserEquippedItemData(currentUserFactionEntry).displayType === 'roi'"
                      :src="roi"
                      :alt="getUserEquippedItemData(currentUserFactionEntry).name"
                      class="equipped-roi-overlay"
                    />
                    <img 
                      v-if="getUserEquippedItemData(currentUserFactionEntry) && getUserEquippedItemData(currentUserFactionEntry).displayType === 'tomb-raider'"
                      :src="laracroft"
                      :alt="getUserEquippedItemData(currentUserFactionEntry).name"
                      class="equipped-tomb-raider"
                    />
                    <img 
                      v-if="getUserEquippedItemData(currentUserFactionEntry) && getUserEquippedItemData(currentUserFactionEntry).displayType === 'gentleman'" 
                      :src="gentleman" 
                      :alt="getUserEquippedItemData(currentUserFactionEntry).name"
                      class="equipped-gentleman-overlay"
                    />
                    <div class="user-avatar" :style="getAvatarBorderStyle(currentUserFactionEntry)" :class="{ 'jojo-sepia': getUserEquippedItemData(currentUserFactionEntry) && getUserEquippedItemData(currentUserFactionEntry).displayType === 'jojo', 'no-border': getUserEquippedItemData(currentUserFactionEntry) && ((getUserEquippedItemData(currentUserFactionEntry).displayType === 'discord' || getUserEquippedItemData(currentUserFactionEntry).name === 'Galaxie' || getUserEquippedItemData(currentUserFactionEntry).name === 'Coeur' || getUserEquippedItemData(currentUserFactionEntry).name === 'Prestige' || getUserEquippedItemData(currentUserFactionEntry).name === 'Planify') || shouldRemoveLeaderboardBorder(getUserEquippedItemData(currentUserFactionEntry))) }">
                      <img 
                        :src="getUserAvatar(currentUserFactionEntry)" 
                        class="avatar-img"
                        @error="handleAvatarError"
                        @load="handleAvatarLoad"
                      />
                      <div v-if="getUserEquippedItemData(currentUserFactionEntry) && getUserEquippedItemData(currentUserFactionEntry).displayType === 'matrix'" class="matrix-rain-inside">
                        <div class="matrix-column" v-for="i in 20" :key="'f-fermier-mx-'+i" :style="{ left: (i * 5) + '%', animationDelay: (Math.random() * 2) + 's' }">
                          <span v-for="j in 5" :key="'f-fermier-mx-ch-'+j" class="matrix-char">{{ getRandomMatrixChar() }}</span>
                        </div>
                      </div>
                      <img 
                        v-if="getUserEquippedItemData(currentUserFactionEntry) && getUserEquippedItemData(currentUserFactionEntry).displayType === 'gentleman'" 
                        :src="moustache" 
                        :alt="getUserEquippedItemData(currentUserFactionEntry).name"
                        class="equipped-moustache-inside"
                      />
                      <img 
                        v-if="getUserEquippedItemData(currentUserFactionEntry) && getUserEquippedItemData(currentUserFactionEntry).displayType === 'clown'" 
                        :src="clownnose" 
                        alt="Nez de clown" 
                        class="equipped-clown-nose" 
                      />
                      <img 
                        v-if="getUserEquippedItemData(currentUserFactionEntry) && getUserEquippedItemData(currentUserFactionEntry).displayType === 'cash'" 
                        :src="getUserEquippedItemData(currentUserFactionEntry).img" 
                        :alt="getUserEquippedItemData(currentUserFactionEntry).name"
                        class="equipped-cash-inside"
                      />
                      <img 
                        v-if="getUserEquippedItemData(currentUserFactionEntry) && getUserEquippedItemData(currentUserFactionEntry).displayType === 'target'" 
                        :src="getUserEquippedItemData(currentUserFactionEntry).img" 
                        :alt="getUserEquippedItemData(currentUserFactionEntry).name"
                        class="equipped-target-inside"
                      />
                      <!-- Advisory: à l'intérieur (Faction Fermier) -->
                      <img 
                        v-if="getUserEquippedItemData(currentUserFactionEntry) && getUserEquippedItemData(currentUserFactionEntry).displayType === 'advisory'" 
                        :src="advisory" 
                        :alt="getUserEquippedItemData(currentUserFactionEntry).name"
                        class="equipped-advisory-inside"
                      />
                      <!-- Espace: étoiles à l'intérieur (Faction Fermier) -->
                      <img 
                        v-if="getUserEquippedItemData(currentUserFactionEntry) && getUserEquippedItemData(currentUserFactionEntry).displayType === 'espace'" 
                        :src="spacestars" 
                        :alt="getUserEquippedItemData(currentUserFactionEntry).name"
                        class="equipped-spacestars-inside"
                      />
                      <!-- Espace: astéroïde à l'intérieur (Faction Fermier) -->
                      <img 
                        v-if="getUserEquippedItemData(currentUserFactionEntry) && getUserEquippedItemData(currentUserFactionEntry).displayType === 'espace'" 
                        :src="asteroide" 
                        :alt="getUserEquippedItemData(currentUserFactionEntry).name"
                        class="equipped-asteroide-overlay"
                      />
                      <!-- DVD: à l'intérieur (Faction Fermier) -->
                      <img 
                        v-if="getUserEquippedItemData(currentUserFactionEntry) && getUserEquippedItemData(currentUserFactionEntry).displayType === 'dvd'" 
                        :src="dvd" 
                        :alt="getUserEquippedItemData(currentUserFactionEntry).name"
                        class="equipped-dvd-inside"
                      />
                      <!-- Lunettes pixel: à l'intérieur (Faction Fermier) -->
                      <img 
                        v-if="getUserEquippedItemData(currentUserFactionEntry) && getUserEquippedItemData(currentUserFactionEntry).displayType === 'lunettes-pixel'" 
                        :src="mlglunette" 
                        :alt="getUserEquippedItemData(currentUserFactionEntry).name"
                        class="equipped-lunettes-pixel-inside"
                      />
                      <!-- Flash Camera: à l'intérieur (Faction Fermier) -->
                      <img 
                        v-if="getUserEquippedItemData(currentUserFactionEntry) && getUserEquippedItemData(currentUserFactionEntry).displayType === 'flash'" 
                        :src="camera" 
                        :alt="getUserEquippedItemData(currentUserFactionEntry).name"
                        class="equipped-camera-overlay"
                      />
                      <!-- Item 2000 (Nokia): téléphone à l'intérieur (Faction Fermier) -->
                      <img 
                        v-if="getUserEquippedItemData(currentUserFactionEntry) && getUserEquippedItemData(currentUserFactionEntry).displayType === 'nokia'" 
                        :src="nokia" 
                        :alt="getUserEquippedItemData(currentUserFactionEntry).name"
                        class="equipped-nokia-inside"
                      />
                      <!-- Item 2000 (Nokia): Clippy à l'intérieur (Faction Fermier) -->
                      <img 
                        v-if="getUserEquippedItemData(currentUserFactionEntry) && getUserEquippedItemData(currentUserFactionEntry).displayType === 'nokia'" 
                        :src="clippy" 
                        :alt="getUserEquippedItemData(currentUserFactionEntry).name"
                        class="equipped-clippy-inside"
                      />
                      <!-- Item Jojo: à l'intérieur (Faction Bagnat) -->
                      <img 
                        v-if="getUserEquippedItemData(currentUserFactionEntry) && getUserEquippedItemData(currentUserFactionEntry).displayType === 'jojo'" 
                        :src="jojo" 
                        :alt="getUserEquippedItemData(currentUserFactionEntry).name"
                        class="equipped-jojo-inside"
                        :key="'faction-jojo-'+getJojoVariantIndexForUser(currentUserFactionEntry)"
                      />
                      <!-- Item Jojo: texte à l'intérieur (Faction Bagnat) -->
                      <img 
                        v-if="getUserEquippedItemData(currentUserFactionEntry) && getUserEquippedItemData(currentUserFactionEntry).displayType === 'jojo' && getJojoVariantIndexForUser(currentUserFactionEntry) === 1" 
                        :src="jojotext" 
                        :alt="getUserEquippedItemData(currentUserFactionEntry).name"
                        class="equipped-jojotext-inside"
                        :key="'faction-jojotext-'+getJojoVariantIndexForUser(currentUserFactionEntry)"
                      />

                    </div>
                    <!-- Item Miaou (chat uniquement) par-dessus l'avatar (positionné dans le conteneur) -->
                    <img 
                      v-if="getUserEquippedItemData(currentUserFactionEntry) && getUserEquippedItemData(currentUserFactionEntry).displayType === 'miaou'" 
                      :src="chat" 
                      :alt="getUserEquippedItemData(currentUserFactionEntry).name"
                      class="equipped-chat-overlay"
                    />
                    
                    <!-- Item Miaou (pate uniquement) par-dessus l'avatar (positionné dans le conteneur) -->
                    <img 
                      v-if="getUserEquippedItemData(currentUserFactionEntry) && getUserEquippedItemData(currentUserFactionEntry).displayType === 'miaou'" 
                      :src="pate" 
                      :alt="getUserEquippedItemData(currentUserFactionEntry).name"
                      class="equipped-pate-overlay"
                    />
                    
                    <!-- Item 2000 (Nokia): Daft Punk par-dessus l'avatar (positionné en dehors du conteneur) -->
                    <img 
                      v-if="getUserEquippedItemData(currentUserFactionEntry) && getUserEquippedItemData(currentUserFactionEntry).displayType === 'nokia'" 
                      :src="daftpunk" 
                      :alt="getUserEquippedItemData(currentUserFactionEntry).name"
                      class="equipped-daftpunk-overlay"
                    />
                  </div>
                  <!-- Surcouches hors conteneur (Factions Fermier) -->
                  <div class="user-details">
                    <div class="username">{{ getUserFullName(currentUserFactionEntry) }}</div>
                  </div>
                </div>
                <div class="user-score">
                  <span class="score-value">
                    {{ formatCoins(currentUserFactionEntry.factionCoins || 0) }} <img src="@/assets/img/planicoins.webp" alt="Coin" class="coin-icon-small" />
                  </span>
                </div>
              </div>
              <div class="leaderboard-list faction-leaderboard-list">
                <div v-if="factionLoading" class="leaderboard-empty">
                  <p>Chargement des factions...</p>
                </div>
                <div v-else-if="factionUsers.fermier.length === 0" class="leaderboard-empty">
                  <p>Aucun membre dans cette faction</p>
                </div>
                <div v-else v-for="(user, index) in factionUsers.fermier" :key="'fermier-' + user.username" class="leaderboard-item">
                  <!-- Position -->
                  <div class="leaderboard-position">
                    <span v-if="index < 3" class="medal">{{ index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉' }}</span>
                    <span v-else class="position">{{ index + 1 }}</span>
                  </div>
                  
                  <!-- Avatar et infos utilisateur -->
                  <div class="user-info">
                    <div class="user-avatar-container" data-darkreader-ignore @click="openLeaderboardProfile(user)">
                      <!-- Absolute Cinema: bras droit dans le user-avatar-container (Faction Fermier - liste) -->
                      <img 
                        v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).displayType === 'absolute-cinema'" 
                        :src="bras" 
                        :alt="getUserEquippedItemData(user).name"
                        class="equipped-absolute-cinema-overlay-right"
                      />
                      
                      <!-- Overlays dynamiques ciblant le conteneur -->
                      <template v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).isDynamic">
                        <img
                          v-for="(a, ai) in (Array.isArray(getUserEquippedItemData(user).variants) && getUserEquippedItemData(user).variants.length > 0
                            ? getDynVariantAssetsForLeaderboard(user, getUserEquippedItemData(user))
                            : getUserEquippedItemData(user).assets)"
                          v-if="isAssetTargetingContainer(getUserEquippedItemData(user), a)"
                          :key="'dyn-container-faction-fermier-' + ai + '-' + dynamicVariantsState"
                          :src="resolveAssetSrc(a.src)"
                          :style="getDynLeaderboardAssetStyle(a)"
                          :class="getDynLeaderboardAssetClass(a)"
                        />
                      </template>

                      <!-- Overlays principaux comme sur le leaderboard -->
                      <img 
                        v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).displayType === 'discord'"
                        :src="[discordon, discordnepasderange, discordderange][coinsStore.discordVariantIndex || 0]"
                        alt="Discord"
                        class="equipped-discord"
                      />
                      <img 
                        v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).name === 'Galaxie'"
                        :src="galaxie"
                        alt="Galaxie"
                        class="equipped-galaxie"
                      />
                      <img 
                        v-if="getUserEquippedItemData(user) && (getUserEquippedItemData(user).name === 'Coeur' || getUserEquippedItemData(user).displayType === 'coeur')"
                        :src="coeur"
                        alt="Coeur"
                        class="equipped-coeur"
                      />
                      <img 
                        v-if="getUserEquippedItemData(user) && (getUserEquippedItemData(user).name === 'Prestige' || getUserEquippedItemData(user).displayType === 'alpha')"
                        :src="alphaImg"
                        :alt="'Prestige'"
                        class="equipped-alpha"
                      />
                      <img 
                        v-if="getUserEquippedItemData(user) && (getUserEquippedItemData(user).name === 'Planify' || getUserEquippedItemData(user).displayType === 'admin-planify')"
                        :src="adminPlanify"
                        :alt="'Planify'"
                        class="equipped-admin-planify"
                      />
                      <!-- AJOUT: Overlays manquants pour Faction Fermier -->
                      <img 
                        v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).displayType === 'roi'"
                        :src="roi"
                        :alt="getUserEquippedItemData(user).name"
                        class="equipped-roi-overlay"
                      />
                      <img 
                        v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).displayType === 'gentleman'"
                        :src="gentleman"
                        :alt="getUserEquippedItemData(user).name"
                        class="equipped-gentleman-overlay"
                      />
                      <img 
                        v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).displayType === 'tomb-raider'"
                        :src="laracroft"
                        :alt="getUserEquippedItemData(user).name"
                        class="equipped-tomb-raider"
                      />
                      <img 
                        v-if="getUserEquippedItemData(user) && shouldRenderStaticOverlay(getUserEquippedItemData(user)) && getUserEquippedItemData(user).displayType !== 'matrix' && getUserEquippedItemData(user).displayType !== 'absolute-cinema' && getUserEquippedItemData(user).name !== 'Miaou'" 
                        :src="getUserEquippedItemData(user).img" 
                        :alt="getUserEquippedItemData(user).name"
                        :class="getEquippedItemClass(getUserEquippedItemData(user).name)"
                      />
                      <!-- Ajout: overlays dédiés Miaou (chat + patte) -->
                      <img
                        v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).displayType === 'miaou'"
                        :src="chat"
                        :alt="getUserEquippedItemData(user).name"
                        class="equipped-chat-overlay"
                      />
                      <img
                        v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).displayType === 'miaou'"
                        :src="pate"
                        :alt="getUserEquippedItemData(user).name"
                        class="equipped-pate-overlay"
                      />

                      <!-- Absolute Cinema: bras gauche (AJOUT) -->
                      <img 
                        v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).displayType === 'absolute-cinema'" 
                        :src="bras" 
                        :alt="getUserEquippedItemData(user).name"
                        class="equipped-absolute-cinema-overlay"
                      />

                      <div class="user-avatar" :style="getAvatarBorderStyle(user)" :class="{ 'jojo-sepia': getUserEquippedItemData(user) && getUserEquippedItemData(user).displayType === 'jojo', 'no-border': getUserEquippedItemData(user) && (((getUserEquippedItemData(user).displayType === 'discord' || getUserEquippedItemData(user).displayType === 'matrix') && !showBorderForDynEquippedItem(getUserEquippedItemData(user))) || getUserEquippedItemData(user).name === 'Galaxie' || shouldRemoveLeaderboardBorder(getUserEquippedItemData(user))) }" @click="openLeaderboardProfile(user)">
                        <img 
                          :src="getUserAvatar(user)" 
                          class="avatar-img"
                          :style="getAvatarImageStyle(user)"
                          @error="handleAvatarError"
                          @load="handleAvatarLoad"
                        />

                        <!-- Items dynamiques placés derrière l'avatar (sous bordure) -->
                        <template v-if="getUserEquippedItemData(user)">
                          <template v-if="getUserEquippedItemData(user).isDynamic && Array.isArray(getUserEquippedItemData(user).variants) && getUserEquippedItemData(user).variants.length > 0">
                            <img v-for="(a, ai) in getDynVariantAssetsForLeaderboard(user, getUserEquippedItemData(user))"
                                 v-if="a && a.meta && a.meta.leaderboardPlacement === 'below' && isAssetTargetingAvatar(getUserEquippedItemData(user), a)"
                                 :key="'dyn-lb-below-faction-fermier-'+ai+'-'+dynamicVariantsState"
                                 :src="resolveAssetSrc(a.src)"
                                 :style="getDynLeaderboardAssetStyle(a)" />
                          </template>
                          <template v-else-if="getUserEquippedItemData(user).isDynamic">
                            <img v-for="(a, ai) in getUserEquippedItemData(user).assets"
                                 v-if="a && a.meta && a.meta.leaderboardPlacement === 'below' && isAssetTargetingAvatar(getUserEquippedItemData(user), a)"
                                 :key="'dyn-below-faction-fermier-'+ai"
                                 :src="resolveAssetSrc(a.src)"
                                 :style="getDynLeaderboardAssetStyle(a)" />
                          </template>

                          <!-- Item Gentleman (moustache à l'intérieur) -->
                          <img 
                            v-if="getUserEquippedItemData(user).displayType === 'gentleman'" 
                            :src="moustache" 
                            :alt="getUserEquippedItemData(user).name"
                            class="equipped-moustache-inside"
                          />
                          <!-- Item DVD -->
                          <img 
                        v-if="getUserEquippedItemData(user).displayType === 'dvd' || getUserEquippedItemData(user).name === 'DVD'" 
                        :src="getUserEquippedItemData(user).img" 
                        :alt="getUserEquippedItemData(user).name"
                        class="equipped-dvd-inside"
                      />
                          <!-- Item Cash -->
                          <img 
                            v-if="getUserEquippedItemData(user).displayType === 'cash'" 
                            :src="getUserEquippedItemData(user).img" 
                            :alt="getUserEquippedItemData(user).name"
                            class="equipped-cash-inside"
                          />
                          <!-- Item Target -->
                          <img 
                            v-if="getUserEquippedItemData(user).displayType === 'target'" 
                            :src="getUserEquippedItemData(user).img" 
                            :alt="getUserEquippedItemData(user).name"
                            class="equipped-target-inside"
                          />
                          <!-- AJOUT: Nez de clown centré sur l'avatar (Faction Fermier) -->
                          <img 
                            v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).displayType === 'clown'" 
                            :src="clownnose" 
                            alt="Nez de clown" 
                            class="equipped-clown-nose" 
                          />
                          <!-- Advisory: à l'intérieur (Faction Fermier) -->
                          <img 
                            v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).displayType === 'advisory'" 
                            :src="advisory" 
                            :alt="getUserEquippedItemData(user).name"
                            class="equipped-advisory-inside"
                          />
                          <!-- Espace: étoiles à l'intérieur (Faction Fermier) -->
                          <img 
                            v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).displayType === 'espace'" 
                            :src="spacestars" 
                            :alt="getUserEquippedItemData(user).name"
                            class="equipped-spacestars-inside"
                          />
                          <!-- Espace: astéroïde à l'intérieur (Faction Fermier) -->
                          <img 
                            v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).displayType === 'espace'" 
                            :src="asteroide" 
                            :alt="getUserEquippedItemData(user).name"
                            class="equipped-asteroide-overlay"
                          />
                          <!-- DVD: à l'intérieur (Faction Fermier) -->
                          <img 
                            v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).displayType === 'dvd'" 
                            :src="dvd" 
                            :alt="getUserEquippedItemData(user).name"
                            class="equipped-dvd-inside"
                          />
                          <!-- Lunettes pixel: à l'intérieur (Faction Fermier) -->
                          <img 
                            v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).displayType === 'lunettes-pixel'" 
                            :src="mlglunette" 
                            :alt="getUserEquippedItemData(user).name"
                            class="equipped-lunettes-pixel-inside"
                          />
                          <!-- Flash Camera: à l'intérieur (Faction Fermier) -->
                          <img 
                            v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).displayType === 'flash'" 
                            :src="camera" 
                            :alt="getUserEquippedItemData(user).name"
                            class="equipped-camera-overlay"
                          />
                          <!-- Item 2000 (Nokia): téléphone à l'intérieur (Faction Fermier) -->
                          <img 
                            v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).displayType === 'nokia'" 
                            :src="nokia" 
                            :alt="getUserEquippedItemData(user).name"
                            class="equipped-nokia-inside"
                          />
                          <!-- Item 2000 (Nokia): Clippy à l'intérieur (Faction Fermier) -->
                          <img 
                            v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).displayType === 'nokia'" 
                            :src="clippy" 
                            :alt="getUserEquippedItemData(user).name"
                            class="equipped-clippy-inside"
                          />
                          <!-- Item Jojo: à l'intérieur (Faction Bagnat) -->
                          <img 
                            v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).displayType === 'jojo'" 
                            :src="jojo" 
                            :alt="getUserEquippedItemData(user).name"
                            class="equipped-jojo-inside"
                            :key="'faction-jojo-'+getJojoVariantIndexForUser(user)"
                          />
                          <!-- Item Jojo: texte à l'intérieur (Faction Bagnat) -->
                          <img 
                            v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).displayType === 'jojo' && getJojoVariantIndexForUser(user) === 1" 
                            :src="jojotext" 
                            :alt="getUserEquippedItemData(user).name"
                            class="equipped-jojotext-inside"
                            :key="'faction-jojotext-'+getJojoVariantIndexForUser(user)"
                          />

                        </template>
                        <!-- Animation Matrix à l'intérieur de l'avatar (Fermier - liste) -->
                        <div v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).displayType === 'matrix'" class="matrix-rain-inside">
                          <div class="matrix-column"
                               v-for="(col, ci) in getMatrixColumns(user)"
                               :key="'f-fermier-list-mx-'+ci"
                               :style="{ left: (ci * 5) + '%', animationDelay: (col.delay) + 's' }">
                            <span v-for="(ch, ri) in col.chars"
                                  :key="'f-fermier-list-mx-ch-'+ci+'-'+ri"
                                  class="matrix-char">{{ ch }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    

                    
                    <!-- Item 2000 (Nokia): Daft Punk par-dessus l'avatar (positionné en dehors du conteneur) -->
                    <img 
                      v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).displayType === 'nokia'" 
                      :src="daftpunk" 
                      :alt="getUserEquippedItemData(user).name"
                      class="equipped-daftpunk-overlay"
                    />
                    
                    <div class="user-details">
                      <div class="username">{{ getUserFullName(user) }}</div>
                    </div>
                  </div>
                  
                  <!-- Score -->
                  <div class="user-score">
                    <span class="score-value">
                      {{ formatCoins(user.factionCoins || 0) }} <img src="@/assets/img/planicoins.webp" alt="Coin" class="coin-icon-small" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Section Gauche: Personnel -->
        <div v-if="!isMobile || leaderboardFilter !== 'factions'" class="personal-section" style="order: 1;">
          <div class="toggle-header">
            <button class="toggle-btn" :class="{ active: leaderboardFilter === 'coins' }" @click="leaderboardFilter = 'coins'">
              <img src="@/assets/img/planicoins.webp" alt="Coin" class="coin-icon" />
            </button>
            <button class="toggle-btn" :class="{ active: leaderboardFilter === 'tasks' }" @click="leaderboardFilter = 'tasks'">
              <img src="@/assets/img/bouton_valider_cocher.png" alt="Tâches" class="coin-icon" />
            </button>
          </div>

          <!-- Liste des utilisateurs -->
          <div class="leaderboard-list" v-if="leaderboardFilter !== 'factions'">
          <div v-if="sortedLeaderboardUsers.length === 0" class="leaderboard-empty">
            <p>Chargement du leaderboard...</p>
          </div>
          <div v-else v-for="(user, index) in sortedLeaderboardUsers" :key="user.username" class="leaderboard-item">
            <!-- Position -->
            <div class="leaderboard-position">
              <span v-if="index < 3" class="medal">{{ index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉' }}</span>
              <span v-else class="position">{{ index + 1 }}</span>
            </div>
            
                        <!-- Avatar et infos utilisateur -->
            <div class="user-info">

              <div class="user-avatar-container" data-darkreader-ignore @click="openLeaderboardProfile(user)">
                <!-- Items dynamiques ciblant le conteneur (user-avatar-container) - tous placements -->
                <template v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).isDynamic">
                  <img
                    v-for="(a, ai) in (Array.isArray(getUserEquippedItemData(user).variants) && getUserEquippedItemData(user).variants.length > 0
                      ? getDynVariantAssetsForLeaderboard(user, getUserEquippedItemData(user))
                      : getUserEquippedItemData(user).assets)"
                    v-if="isAssetTargetingContainer(getUserEquippedItemData(user), a)"
                    :key="'dyn-container-' + ai + '-' + dynamicVariantsState"
                    :src="resolveAssetSrc(a.src)"
                    :style="getDynLeaderboardAssetStyle(a)"
                    :class="getDynLeaderboardAssetClass(a)"
                  />
                </template>

                <!-- Absolute Cinema: bras droit dans le user-avatar-container -->
                <img 
                  v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).displayType === 'absolute-cinema'" 
                  :src="bras" 
                  :alt="getUserEquippedItemData(user).name"
                  class="equipped-absolute-cinema-overlay-right"
                />

                <!-- Discord overlay en premier dans le container -->
                 <img 
                  v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).displayType === 'discord'"
                  :src="[discordon, discordnepasderange, discordderange][coinsStore.discordVariantIndex || 0]"
                  alt="Discord"
                  class="equipped-discord"
                />
                <img 
                  v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).name === 'Galaxie'"
                  :src="galaxie"
                  :alt="'Galaxie'"
                  class="equipped-galaxie"
                />
                <img 
                  v-if="getUserEquippedItemData(user) && (getUserEquippedItemData(user).name === 'Coeur' || getUserEquippedItemData(user).displayType === 'coeur')"
                  :src="coeur"
                  :alt="'Coeur'"
                  class="equipped-coeur"
                />
                <img 
                  v-if="getUserEquippedItemData(user) && (getUserEquippedItemData(user).name === 'Prestige' || getUserEquippedItemData(user).displayType === 'alpha')"
                  :src="alphaImg"
                  :alt="'Prestige'"
                  class="equipped-alpha"
                />
                <img 
                  v-if="getUserEquippedItemData(user) && (getUserEquippedItemData(user).name === 'Planify' || getUserEquippedItemData(user).displayType === 'admin-planify')"
                  :src="adminPlanify"
                  :alt="'Planify'"
                  class="equipped-admin-planify"
                />
                <!-- Alpha overlay rendu au niveau du container uniquement ci-dessus -->
                <template v-if="getUserEquippedItemData(user)">
                    <!-- Item générique -->
                    <img 
                      v-if="getUserEquippedItemData(user).displayType === 'generic' && getUserEquippedItemData(user).name !== 'Jojo' && getUserEquippedItemData(user).name !== 'Galaxie' && getUserEquippedItemData(user).name !== 'Coeur' && getUserEquippedItemData(user).name !== 'Miaou' && !getUserEquippedItemData(user).isDynamic" 
                      :src="getUserEquippedItemData(user).img" 
                      :alt="getUserEquippedItemData(user).name"
                      :class="getEquippedItemClass(getUserEquippedItemData(user).name)"
                    />
                </template>
                <div class="user-avatar"
  :style="getAvatarBorderStyle(user)"
  :class="{
    'jojo-sepia': getUserEquippedItemData(user) && getUserEquippedItemData(user).displayType === 'jojo',
    'no-border': getUserEquippedItemData(user) && (
      ((getUserEquippedItemData(user).displayType === 'discord' || getUserEquippedItemData(user).displayType === 'matrix') && !showBorderForDynEquippedItem(getUserEquippedItemData(user), user))
      || getUserEquippedItemData(user).displayType === 'espace'
      || getUserEquippedItemData(user).name === 'Galaxie'
      || shouldRemoveLeaderboardBorder(getUserEquippedItemData(user), user)
    )
  }"
  @click="openLeaderboardProfile(user)">

                  <img 
                    :src="getUserAvatar(user)" 
                    class="avatar-img"
                    :style="getAvatarImageStyle(user)"
                    @error="handleAvatarError"
                    @load="handleAvatarLoad"
                  />
                  
                  <!-- Items équipés selon leur type -->
                  <template v-if="getUserEquippedItemData(user)">
                    <!-- Items dynamiques placés derrière l'avatar (sous bordure) -->
                    <template v-if="getUserEquippedItemData(user).isDynamic && Array.isArray(getUserEquippedItemData(user).variants) && getUserEquippedItemData(user).variants.length > 0">
                      <img v-for="(a, ai) in getDynVariantAssetsForLeaderboard(user, getUserEquippedItemData(user))"
                           v-if="a && a.meta && a.meta.leaderboardPlacement === 'below' && isAssetTargetingAvatar(getUserEquippedItemData(user), a)"
                           :key="'dyn-lb-below-'+ai+'-'+dynamicVariantsState"
                           :src="resolveAssetSrc(a.src)"
                           :style="getDynLeaderboardAssetStyle(a)" />
                    </template>
                    <template v-else-if="getUserEquippedItemData(user).isDynamic">
                      <img v-for="(a, ai) in getUserEquippedItemData(user).assets"
                           v-if="a && a.meta && a.meta.leaderboardPlacement === 'below' && isAssetTargetingAvatar(getUserEquippedItemData(user), a)"
                           :key="'dyn-below-'+ai"
                           :src="resolveAssetSrc(a.src)"
                           :style="getDynLeaderboardAssetStyle(a)" />
                    </template>
                    <!-- Item Gentleman (moustache à l'intérieur) -->
                    <img 
                      v-if="getUserEquippedItemData(user).displayType === 'gentleman'" 
                      :src="moustache" 
                      :alt="getUserEquippedItemData(user).name"
                      class="equipped-moustache-inside"
                    />
                    

                    
                    <!-- Item DVD -->
                    <img 
                      v-if="getUserEquippedItemData(user).displayType === 'dvd'" 
                      :src="getUserEquippedItemData(user).img" 
                      :alt="getUserEquippedItemData(user).name"
                      class="equipped-dvd-inside"
                    />
                    
                    <!-- Item Lunettes pixel -->
                    <img 
                      v-if="getUserEquippedItemData(user).displayType === 'lunettes-pixel'" 
                      :src="getUserEquippedItemData(user).img" 
                      :alt="getUserEquippedItemData(user).name"
                      class="equipped-lunettes-pixel-inside"
                    />
                    
                    <!-- Item 2000 (Nokia) -->
                    <img 
                      v-if="getUserEquippedItemData(user).displayType === 'nokia'" 
                      :src="nokia" 
                      :alt="getUserEquippedItemData(user).name"
                      class="equipped-nokia-inside"
                    />
                    <!-- Item Jojo INSIDE avatar (comme Advisory) -->
            <img 
              v-if="getUserEquippedItemData(user).name === 'Jojo' || getUserEquippedItemData(user).displayType === 'jojo'" 
                      :src="jojo" 
                      alt="Jojo"
                      class="equipped-jojo-inside"
                      :key="'lb-jojo-'+getJojoVariantIndexForUser(user)"
                    />
                    <img 
              v-if="(getUserEquippedItemData(user).name === 'Jojo' || getUserEquippedItemData(user).displayType === 'jojo') && getJojoVariantIndexForUser(user) === 1" 
                      :src="jojotext" 
                      alt="Jojo text"
                      class="equipped-jojotext-inside"
                      :key="'lb-jojotext-'+getJojoVariantIndexForUser(user)"
                    />
                    <!-- Item Discord rendu au niveau du container -->
                    <img 
                      v-if="getUserEquippedItemData(user).displayType === 'nokia'" 
                      :src="clippy" 
                      :alt="getUserEquippedItemData(user).name"
                      class="equipped-clippy-inside"
                    />
                    
                    <!-- Items à l'intérieur de l'avatar -->
                    <img 
                      v-if="getUserEquippedItemData(user).displayType === 'cash'" 
                      :src="getUserEquippedItemData(user).img" 
                      :alt="getUserEquippedItemData(user).name"
                      class="equipped-cash-inside"
                    />
                    <img 
                      v-if="getUserEquippedItemData(user).displayType === 'target'" 
                      :src="getUserEquippedItemData(user).img" 
                      :alt="getUserEquippedItemData(user).name"
                      class="equipped-target-inside"
                    />
                    <img 
                      v-if="getUserEquippedItemData(user).displayType === 'advisory'" 
                      :src="advisory" 
                      :alt="getUserEquippedItemData(user).name"
                      class="equipped-advisory-inside"
                    />
                    <img 
                      v-if="getUserEquippedItemData(user).displayType === 'espace'" 
                      :src="spacestars" 
                      :alt="getUserEquippedItemData(user).name"
                      class="equipped-spacestars-inside"
                    />
                    <img 
                      v-if="getUserEquippedItemData(user).displayType === 'espace'" 
                      :src="asteroide" 
                      :alt="getUserEquippedItemData(user).name"
                      class="equipped-asteroide-overlay"
                    />
                    
                <img 
                 v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).displayType === 'discord'"
                 :src="discordVariants[coinsStore.discordVariantIndex]"
                 alt="Discord"
                 class="equipped-discord"
               />
               <img 
                 v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).name === 'Galaxie'"
                 :src="galaxie"
                 alt="Galaxie"
                 class="equipped-galaxie"
               />
               <img 
                 v-if="getUserEquippedItemData(user) && (getUserEquippedItemData(user).name === 'Coeur' || getUserEquippedItemData(user).displayType === 'coeur')"
                 :src="coeur"
                 alt="Coeur"
                 class="equipped-coeur"
               />
               <!-- Alpha overlay rendu au niveau du container uniquement ci-dessus -->
                    <!-- Item Discord -->
                    <!-- Item Matrix -->
                    <div v-if="getUserEquippedItemData(user).displayType === 'matrix'" class="matrix-rain-inside">
                      <div class="matrix-column" v-for="i in 20" :key="i" :style="{ left: (i * 5) + '%', animationDelay: (Math.random() * 2) + 's' }">
                        <span v-for="j in 5" :key="j" class="matrix-char">{{ getRandomMatrixChar() }}</span>
                </div>
                <!-- Discord overlay positionné au niveau du conteneur parent (user-avatar-container) -->
                
              </div>
              
              <!-- Items positionnés par-dessus l'avatar (comme dans la navbar) -->
              

              
              
              
              
              
              
              
              <!-- Item Flash (flash + camera par-dessus) -->
              <img 
                      v-else-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).displayType === 'flash'" 
                :src="flash" 
                :alt="getUserEquippedItemData(user).name"
                class="equipped-flash-overlay"
              />
              <img 
                v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).displayType === 'flash'" 
                :src="camera" 
                :alt="getUserEquippedItemData(user).name"
                class="equipped-camera-overlay"
              />

              
              
              
              
              

              
              <!-- Nez de clown centré sur l'avatar -->
              <img 
                v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).displayType === 'clown'" 
                :src="clownnose" 
                alt="Nez de clown"
                class="equipped-clown-nose"
              />
                    <!-- Items dynamiques ciblant l'avatar (user-avatar) - tous placements -->
                    <template v-if="getUserEquippedItemData(user).isDynamic && Array.isArray(getUserEquippedItemData(user).variants) && getUserEquippedItemData(user).variants.length > 0">
                      <img v-for="(a, ai) in getDynVariantAssetsForLeaderboard(user, getUserEquippedItemData(user))"
                           v-if="isAssetTargetingAvatar(getUserEquippedItemData(user), a)"
                           :key="'dyn-avatar-'+ai+'-'+dynamicVariantsState"
                           :src="resolveAssetSrc(a.src)"
                           :style="getDynLeaderboardAssetStyle(a)" />
                    </template>
                    <template v-else-if="getUserEquippedItemData(user).isDynamic">
                      <img v-for="(a, ai) in getUserEquippedItemData(user).assets"
                           v-if="isAssetTargetingAvatar(getUserEquippedItemData(user), a)"
                           :key="'dyn-avatar-'+ai"
                           :src="resolveAssetSrc(a.src)"
                           :style="getDynLeaderboardAssetStyle(a)" />
                    </template>
                  </template>
                </div>


                
                <!-- Item Clown par-dessus l'avatar (positionné en dehors du conteneur) -->
                <img 
                  v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).displayType === 'clown'" 
                  :src="clowncheveux" 
                  :alt="getUserEquippedItemData(user).name"
                  class="equipped-clown-overlay"
                />
                
                <!-- Item Roi par-dessus l'avatar (positionné en dehors du conteneur) -->
                <img 
                  v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).displayType === 'roi'" 
                  :src="roi" 
                  :alt="getUserEquippedItemData(user).name"
                  class="equipped-roi-overlay"
                />
                
                <!-- Item Tomb Raider par-dessus l'avatar (positionné en dehors du conteneur) -->
                <img 
                  v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).displayType === 'tomb-raider'" 
                  :src="laracroft" 
                  :alt="getUserEquippedItemData(user).name"
                  class="equipped-tomb-raider"
                />
                
                <!-- Item Étoiles par-dessus l'avatar (positionné en dehors du conteneur) -->
                <img 
                  v-if="getUserEquippedItemData(user) && (getUserEquippedItemData(user).displayType === 'etoiles' || getUserEquippedItemData(user).name === 'Étoiles')" 
                  :src="star" 
                  :alt="getUserEquippedItemData(user).name"
                  class="equipped-stars-overlay"
                />
                
                <!-- Item Cadre royale par-dessus l'avatar (positionné en dehors du conteneur) -->
                <img 
                  v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).displayType === 'royal-frame'" 
                  :src="getUserEquippedItemData(user).img" 
                  :alt="getUserEquippedItemData(user).name"
                  class="equipped-royal-frame"
                />
                
                <!-- Item Roses par-dessus l'avatar (positionné en dehors du conteneur) -->
                <img 
                  v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).displayType === 'rainbow'" 
                  :src="getUserEquippedItemData(user).img" 
                  :alt="getUserEquippedItemData(user).name"
                  class="equipped-rainbow"
                />
                
                <!-- Item Ange par-dessus l'avatar (positionné en dehors du conteneur) -->
                <img 
                  v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).displayType === 'angel'" 
                  :src="getUserEquippedItemData(user).img" 
                  :alt="getUserEquippedItemData(user).name"
                  class="equipped-angel-wings"
                />

                <!-- Item Oreilles de chat par-dessus l'avatar (positionné en dehors du conteneur) -->
                <img 
                  v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).displayType === 'cat-ears'" 
                  :src="getUserEquippedItemData(user).img" 
                  :alt="getUserEquippedItemData(user).name"
                  class="equipped-cat-ears"
                />
                
                <!-- Item Gentleman par-dessus l'avatar (positionné en dehors du conteneur) -->
                <img 
                  v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).displayType === 'gentleman'" 
                  :src="gentleman" 
                  :alt="getUserEquippedItemData(user).name"
                  class="equipped-gentleman-overlay"
                />
                
                <!-- Item Vinyle par-dessus l'avatar (positionné en dehors du conteneur) -->
                <img 
                  v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).displayType === 'vinyle'" 
                  :src="getUserEquippedItemData(user).img" 
                  :alt="getUserEquippedItemData(user).name"
                  class="equipped-vinyle-overlay"
                />
                
                <!-- Item Absolute Cinema par-dessus l'avatar (positionné en dehors du conteneur) -->
                <img 
                  v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).displayType === 'absolute-cinema'" 
                  :src="bras" 
                  :alt="getUserEquippedItemData(user).name"
                  class="equipped-absolute-cinema-overlay"
                />
                

                
                <!-- Item Miaou (chat uniquement) par-dessus l'avatar (positionné en dehors du conteneur) -->
                <img 
                  v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).displayType === 'miaou'" 
                  :src="chat" 
                  :alt="getUserEquippedItemData(user).name"
                  class="equipped-chat-overlay"
                />
                
                <!-- Item Miaou (pate uniquement) par-dessus l'avatar (positionné en dehors du conteneur) -->
                <img 
                  v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).displayType === 'miaou'" 
                  :src="pate" 
                  :alt="getUserEquippedItemData(user).name"
                  class="equipped-pate-overlay"
                />
                
                <!-- Item Daft Punk par-dessus l'avatar (positionné en dehors du conteneur) -->
                <img 
                  v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).displayType === 'nokia'" 
                  :src="daftpunk" 
                  :alt="getUserEquippedItemData(user).name"
                  class="equipped-daftpunk-overlay"
                />
              </div>
              
              <div class="user-details">
                <div class="username">{{ user.username }}</div>
              </div>
            </div>
            
            <!-- Score -->
            <div class="user-score">
              <span v-if="leaderboardFilter === 'coins'" class="score-value">
                {{ formatCoins(user.coins) }} <img src="@/assets/img/planicoins.webp" alt="Coin" class="coin-icon-small" />
              </span>
              <span v-else-if="leaderboardFilter === 'tasks'" class="score-value">
                {{ user.completedTasks || 0 }} <img src="@/assets/img/bouton_valider_cocher.png" alt="Tâches" class="coin-icon-small" />
              </span>
            </div>
          </div>
        </div>
      </div>

      <transition name="fade">
        <div v-if="showConfirm" class="confirm-message">
          🎉 Bravo ! Tu as acheté {{ boughtItemName }} !
        </div>
      </transition>

      <!-- Popup profil depuis le leaderboard -->
      <transition name="fade">
        <div v-if="showUserProfile" class="profile-popup-overlay" data-darkreader-ignore @click.self="closeLeaderboardProfile">
          <div class="profile-popup" data-darkreader-ignore>
            <button class="close-btn" @click="closeLeaderboardProfile" @mouseover="hoverCloseProfile = true" @mouseleave="hoverCloseProfile = false">
              <img :src="hoverCloseProfile ? closeHoverImg : closeImg" alt="Fermer" class="close-img" />
            </button>


            <div class="profile-card-grid">
              <div class="profile-left">
              <!-- Aperçu avatar + items/bordure (aligné avec la Navbar) -->
              <div class="profile-avatar-wrap">
              <div
                class="profile-avatar-stage"
                data-darkreader-ignore
                :class="{
                  'no-border':
                    (getUserEquippedItemData(selectedUser) &&
                      (getUserEquippedItemData(selectedUser).displayType === 'discord' || getUserEquippedItemData(selectedUser).name === 'Galaxie' || getUserEquippedItemData(selectedUser).name === 'Coeur' || getUserEquippedItemData(selectedUser).name === 'Prestige' || getUserEquippedItemData(selectedUser).name === 'Planify' || getUserEquippedItemData(selectedUser).name === 'Alpha')) ||
                    (getUserEquippedItemData(selectedUser) && shouldRemoveProfilePopupBorder(getUserEquippedItemData(selectedUser)))
                }"
              >
                                <!-- Bras gauche Absolute Cinema -->
                <img 
                  v-if="getUserEquippedItemData(selectedUser) && getUserEquippedItemData(selectedUser).displayType === 'absolute-cinema'"
                  :src="bras"
                  :alt="getUserEquippedItemData(selectedUser).name"
                  class="equipped-absolute-cinema-overlay"
                />
                <!-- Bras droit Absolute Cinema -->
                <img 
                    v-if="getUserEquippedItemData(selectedUser) && getUserEquippedItemData(selectedUser).displayType === 'absolute-cinema'"
                    :src="bras"
                    :alt="getUserEquippedItemData(selectedUser).name"
                    class="equipped-absolute-cinema-overlay-right"
                  />
                <div class="profile-avatar-scaler" data-darkreader-ignore>
                  <div
                    class="profile-avatar"
                    data-darkreader-ignore
                    :style="getAvatarBorderStyle(selectedUser)"
                    :class="{
                      'jojo-sepia': getUserEquippedItemData(selectedUser) && getUserEquippedItemData(selectedUser).displayType === 'jojo',
                      'no-border':
                        (getUserEquippedItemData(selectedUser) &&
                          (getUserEquippedItemData(selectedUser).displayType === 'discord' || getUserEquippedItemData(selectedUser).name === 'Galaxie' || getUserEquippedItemData(selectedUser).name === 'Coeur' || getUserEquippedItemData(selectedUser).name === 'Prestige' || getUserEquippedItemData(selectedUser).name === 'Planify' || getUserEquippedItemData(selectedUser).name === 'Alpha')) ||
                        (getUserEquippedItemData(selectedUser) && shouldRemoveProfilePopupBorder(getUserEquippedItemData(selectedUser)))
                    }"
                  >
                    <!-- Dyn: BELOW (intérieur du carré) -->
                     
                    <img
                      v-for="(a, ai) in getProfilePopupAssetsForTargetPlacement(getUserEquippedItemData(selectedUser), 'profile-avatar', 'below')"
                      :key="'profile-below-'+ai+'-'+dynamicVariantsState"
                      :src="resolveAssetSrc(a.src)"
                      :style="getDynProfilePopupAssetStyle(a)"
                    />

                    <!-- Avatar -->
                    <img
                      class="avatar-img"
                      :src="getUserAvatar(selectedUser)"
                      :alt="selectedUser?.username || selectedUser?.name || 'avatar'"
                      :style="[
                        (getUserEquippedItemData(selectedUser) && getUserEquippedItemData(selectedUser).displayType === 'jojo')
                          ? { filter: 'sepia(0)', animation: 'jojo-sepia-cycle 4.7s steps(1,end) infinite' }
                          : { filter: 'sepia(0)' },
                        getAvatarImageStyle(selectedUser)
                      ]"
                      @error="handleAvatarError"
                      @load="handleAvatarLoad"
                    />

                    <!-- Dyn: INSIDE (intérieur du carré) -->
                    <img
                      v-for="(a, ai) in getProfilePopupAssetsForTargetPlacement(getUserEquippedItemData(selectedUser), 'profile-avatar', 'inside')"
                      :key="'profile-inside-'+ai+'-'+dynamicVariantsState"
                      :src="resolveAssetSrc(a.src)"
                      :style="getDynProfilePopupAssetStyle(a)"
                    />
                    <!-- Ajout: Animation Matrix à l’intérieur de l’avatar -->
                    <div
                      v-if="getUserEquippedItemData(selectedUser) && getUserEquippedItemData(selectedUser).displayType === 'matrix'"
                      class="matrix-rain-inside"
                    >
                      <div
                        class="matrix-column"
                        v-for="i in 15"
                        :key="i"
                        :style="{ left: (i * 6.67) + '%', animationDelay: (Math.random() * 2) + 's' }"
                      >
                        <span v-for="j in 6" :key="j" class="matrix-char">{{ getRandomMatrixChar() }}</span>
                      </div>
                    </div>
                    <!-- INSIDE statiques (ajouts) -->
                    <img 
                      v-if="getUserEquippedItemData(selectedUser) && getUserEquippedItemData(selectedUser).displayType === 'cash'" 
                      :src="cash" 
                      :alt="getUserEquippedItemData(selectedUser).name"
                      class="equipped-cash-inside"
                    />
                    <img 
                      v-if="getUserEquippedItemData(selectedUser) && getUserEquippedItemData(selectedUser).displayType === 'target'" 
                      :src="target" 
                      :alt="getUserEquippedItemData(selectedUser).name"
                      class="equipped-target-inside"
                    />
                    <img 
                      v-if="getUserEquippedItemData(selectedUser) && getUserEquippedItemData(selectedUser).displayType === 'advisory'" 
                      :src="advisory" 
                      :alt="getUserEquippedItemData(selectedUser).name"
                      class="equipped-advisory-inside"
                    />
                    <img 
                      v-if="getUserEquippedItemData(selectedUser) && getUserEquippedItemData(selectedUser).displayType === 'jojo'" 
                      :src="jojo" 
                      :alt="getUserEquippedItemData(selectedUser).name"
                      class="equipped-jojo-inside"
                      :key="'jojo-'+getJojoVariantIndexForUser(selectedUser)"
                    />
                    <img 
                      v-if="getUserEquippedItemData(selectedUser) && getUserEquippedItemData(selectedUser).displayType === 'jojo' && getJojoVariantIndexForUser(selectedUser) === 1" 
                      :src="jojotext" 
                      :alt="getUserEquippedItemData(selectedUser).name"
                      class="equipped-jojotext-inside"
                      :key="'jojotext-'+getJojoVariantIndexForUser(selectedUser)"
                    />
                    <img 
                      v-if="getUserEquippedItemData(selectedUser) && getUserEquippedItemData(selectedUser).displayType === 'espace'" 
                      :src="spacestars" 
                      :alt="getUserEquippedItemData(selectedUser).name"
                      class="equipped-spacestars-inside"
                    />
                    <img 
                      v-if="getUserEquippedItemData(selectedUser) && getUserEquippedItemData(selectedUser).displayType === 'dvd'" 
                      :src="dvd" 
                      :alt="getUserEquippedItemData(selectedUser).name"
                      class="equipped-dvd-inside"
                    />
                    <img 
                      v-if="getUserEquippedItemData(selectedUser) && getUserEquippedItemData(selectedUser).displayType === 'nokia'" 
                      :src="nokia" 
                      :alt="getUserEquippedItemData(selectedUser).name"
                      class="equipped-nokia-inside"
                    />
                    <img 
                      v-if="getUserEquippedItemData(selectedUser) && getUserEquippedItemData(selectedUser).displayType === 'nokia'" 
                      :src="clippy" 
                      :alt="getUserEquippedItemData(selectedUser).name"
                      class="equipped-clippy-inside"
                    />
                    <img 
                      v-if="getUserEquippedItemData(selectedUser) && getUserEquippedItemData(selectedUser).displayType === 'gentleman'" 
                      :src="moustache" 
                      :alt="getUserEquippedItemData(selectedUser).name"
                      class="equipped-moustache-inside"
                    />
                  </div>

                  <!-- Dyn: extérieur (profile-avatar-scaler) BELOW + INSIDE -->
                  <img
                    v-for="(a, ai) in getProfilePopupAssetsForTargetPlacement(getUserEquippedItemData(selectedUser), 'profile-avatar-scaler', 'below')"
                    :key="'pp-scaler-below-'+ai+'-'+dynamicVariantsState"
                    :src="resolveAssetSrc(a.src)"
                    :style="getDynProfilePopupAssetStyle(a)"
                  />
                  <img
                    v-for="(a, ai) in getProfilePopupAssetsForTargetPlacement(getUserEquippedItemData(selectedUser), 'profile-avatar-scaler', 'inside')"
                    :key="'pp-scaler-inside-'+ai+'-'+dynamicVariantsState"
                    :src="resolveAssetSrc(a.src)"
                    :style="getDynProfilePopupAssetStyle(a)"
                  />

                  <!-- Items statiques ABOVE (au-dessus du carré) -->
                  <img
                    v-if="getUserEquippedItemData(selectedUser) && getUserEquippedItemData(selectedUser).displayType === 'discord'"
                    :src="[discordon, discordnepasderange, discordderange][coinsStore.discordVariantIndex || 0]"
                    alt="Discord"
                    class="equipped-discord"
                  />
                  <img v-if="getUserEquippedItemData(selectedUser) && getUserEquippedItemData(selectedUser).name === 'Galaxie'"
                       :src="galaxie" alt="Galaxie" class="equipped-galaxie" />
                  <img v-if="getUserEquippedItemData(selectedUser) && (getUserEquippedItemData(selectedUser).name === 'Coeur' || getUserEquippedItemData(selectedUser).displayType === 'coeur')"
                       :src="coeur" alt="Coeur" class="equipped-coeur" />
                  <img v-if="getUserEquippedItemData(selectedUser) && (getUserEquippedItemData(selectedUser).name === 'Prestige' || getUserEquippedItemData(selectedUser).displayType === 'alpha')"
                       :src="alphaImg" alt="Prestige" class="equipped-alpha" />
                  <img v-if="getUserEquippedItemData(selectedUser) && (getUserEquippedItemData(selectedUser).name === 'Planify' || getUserEquippedItemData(selectedUser).displayType === 'admin-planify')"
                       :src="adminPlanify" alt="Planify" class="equipped-admin-planify" />
                  <!-- Ajout: Overlays statiques Tomb Raider + Ange -->
                  <img 
                    v-if="getUserEquippedItemData(selectedUser) && getUserEquippedItemData(selectedUser).displayType === 'tomb-raider'"
                    :src="laracroft"
                    :alt="getUserEquippedItemData(selectedUser).name"
                    class="equipped-tomb-raider"
                  />
                  <img 
                    v-if="getUserEquippedItemData(selectedUser) && getUserEquippedItemData(selectedUser).displayType === 'angel'"
                    :src="getUserEquippedItemData(selectedUser).img || angelwings"
                    :alt="getUserEquippedItemData(selectedUser).name"
                    class="equipped-angel-wings"
                  />
                  <!-- Ajout: Étoiles, Roi, Cadre royale, Roses -->
                  <img 
                    v-if="getUserEquippedItemData(selectedUser) && (getUserEquippedItemData(selectedUser).displayType === 'etoiles' || getUserEquippedItemData(selectedUser).name === 'Étoiles')"
                    :src="star" 
                    :alt="getUserEquippedItemData(selectedUser).name"
                    class="equipped-stars"
                  />
                  <img 
                    v-if="getUserEquippedItemData(selectedUser) && getUserEquippedItemData(selectedUser).displayType === 'roi'"
                    :src="roi" 
                    :alt="getUserEquippedItemData(selectedUser).name"
                    class="equipped-roi-overlay"
                  />
                  <img 
                    v-if="getUserEquippedItemData(selectedUser) && getUserEquippedItemData(selectedUser).displayType === 'royal-frame'"
                    :src="getUserEquippedItemData(selectedUser).img" 
                    :alt="getUserEquippedItemData(selectedUser).name"
                    class="equipped-royal-frame"
                  />
                  <img 
                    v-if="getUserEquippedItemData(selectedUser) && getUserEquippedItemData(selectedUser).displayType === 'rainbow'"
                    :src="getUserEquippedItemData(selectedUser).img" 
                    :alt="getUserEquippedItemData(selectedUser).name"
                    class="equipped-rainbow"
                  />
                  <!-- Ajout: Oreilles de chat -->
                  <img 
                    v-if="getUserEquippedItemData(selectedUser) && getUserEquippedItemData(selectedUser).displayType === 'cat-ears'"
                    :src="getUserEquippedItemData(selectedUser).img || oreilleschat"
                    :alt="getUserEquippedItemData(selectedUser).name"
                    class="equipped-cat-ears"
                  />

                  <!-- Ajout: Clown (nez + cheveux) -->
                  <img 
                    v-if="getUserEquippedItemData(selectedUser) && getUserEquippedItemData(selectedUser).displayType === 'clown'"
                    :src="clownnose"
                    alt="Nez de clown"
                    class="equipped-clown-nose"
                  />
                  <img 
                    v-if="getUserEquippedItemData(selectedUser) && getUserEquippedItemData(selectedUser).displayType === 'clown'"
                    :src="clowncheveux"
                    :alt="getUserEquippedItemData(selectedUser).name"
                    class="equipped-clown-overlay"
                  />

                  <!-- AJOUT: Overlays manquants pour la pop-up via leaderboard -->
                  <img 
                    v-if="getUserEquippedItemData(selectedUser) && getUserEquippedItemData(selectedUser).displayType === 'vinyle'"
                    :src="vinyle"
                    :alt="getUserEquippedItemData(selectedUser).name"
                    class="equipped-vinyle-overlay"
                  />
                  <img 
                    v-if="getUserEquippedItemData(selectedUser) && getUserEquippedItemData(selectedUser).displayType === 'miaou'"
                    :src="chat"
                    :alt="getUserEquippedItemData(selectedUser).name"
                    class="equipped-chat-overlay"
                  />
                  <!-- AJOUT: Pate manquante (leaderboard – pop-up profil) -->
                  <img 
                    v-if="getUserEquippedItemData(selectedUser) && getUserEquippedItemData(selectedUser).displayType === 'miaou'"
                    :src="pate"
                    :alt="getUserEquippedItemData(selectedUser).name"
                    class="equipped-pate-overlay"
                  />
                  <!-- AJOUT: chapeau Gentleman (overlay au-dessus du carré) -->
                  <img 
                    v-if="getUserEquippedItemData(selectedUser) && getUserEquippedItemData(selectedUser).displayType === 'gentleman'"
                    :src="gentleman"
                    :alt="getUserEquippedItemData(selectedUser).name"
                    class="equipped-gentleman-overlay"
                  />
                  <img 
                    v-if="getUserEquippedItemData(selectedUser) && getUserEquippedItemData(selectedUser).displayType === 'lunettes-pixel'"
                    :src="mlglunette"
                    :alt="getUserEquippedItemData(selectedUser).name"
                    class="equipped-lunettes-pixel-inside"
                  />
                  <img 
                    v-if="getUserEquippedItemData(selectedUser) && getUserEquippedItemData(selectedUser).displayType === 'flash'"
                    :src="flash"
                    :alt="getUserEquippedItemData(selectedUser).name"
                    class="equipped-flash-overlay"
                  />
                  <img 
                    v-if="getUserEquippedItemData(selectedUser) && getUserEquippedItemData(selectedUser).displayType === 'flash'"
                    :src="camera"
                    :alt="getUserEquippedItemData(selectedUser).name"
                    class="equipped-camera-overlay"
                  />
                  <img 
                    v-if="getUserEquippedItemData(selectedUser) && getUserEquippedItemData(selectedUser).displayType === 'nokia'"
                    :src="daftpunk"
                    :alt="getUserEquippedItemData(selectedUser).name"
                    class="equipped-daftpunk-overlay"
                  />
                  <img 
                    v-if="getUserEquippedItemData(selectedUser) && getUserEquippedItemData(selectedUser).displayType === 'espace'"
                    :src="asteroide"
                    :alt="getUserEquippedItemData(selectedUser).name"
                    class="equipped-asteroide-overlay"
                  />

                  <!-- Profile popup - generic overlay -->
                  <img 
                    v-if="getUserEquippedItemData(selectedUser) 
                           && shouldRenderStaticOverlay(getUserEquippedItemData(selectedUser))
                           && getUserEquippedItemData(selectedUser).displayType !== 'matrix'
                           && getUserEquippedItemData(selectedUser).displayType !== 'absolute-cinema'
                           && getUserEquippedItemData(selectedUser).name !== 'Miaou'
                           && getUserEquippedItemData(selectedUser).displayType !== 'vinyle'
                           && getUserEquippedItemData(selectedUser).name !== 'Vinyle'
                           && getUserEquippedItemData(selectedUser).name !== 'Advisory'
                           && getUserEquippedItemData(selectedUser).name !== 'Flash'
                           && getUserEquippedItemData(selectedUser).name !== 'Clown'" 
                    :src="getUserEquippedItemData(selectedUser).img" 
                    :alt="getUserEquippedItemData(selectedUser).name"
                    :class="getEquippedItemClass(getUserEquippedItemData(selectedUser).name)"
                  />

                  <!-- Dyn: ABOVE (au-dessus du carré avatar) -->
                  <img
                    v-for="(a, ai) in getProfilePopupAssetsForTargetPlacement(getUserEquippedItemData(selectedUser), 'profile-avatar', 'above')"
                    :key="'profile-above-'+ai+'-'+dynamicVariantsState"
                    :src="resolveAssetSrc(a.src)"
                    :style="getDynProfilePopupAssetStyle(a)"
                  />
                  <!-- Extérieur “above” (scaler) -->
                  <img
                    v-for="(a, ai) in getProfilePopupAssetsForTargetPlacement(getUserEquippedItemData(selectedUser), 'profile-avatar-scaler', 'above')"
                    :key="'pp-scaler-above-'+ai+'-'+dynamicVariantsState"
                    :src="resolveAssetSrc(a.src)"
                    :style="getDynProfilePopupAssetStyle(a)"
                  />
                </div>
              </div>

            </div>
            <!-- /Aperçu avatar -->

            <div class="profile-left-stack">
              <div class="profile-pill profile-username">{{ getUserFullName(selectedUser) }}</div>
              <div class="profile-left-row">
                <div class="profile-role-with-group">
                  <div class="profile-pill profile-role">{{ selectedUser?.role ? afficherRole(selectedUser.role) : '—' }}</div>
                  <div class="profile-group-outlet"><img v-if="selectedGroupLogoSrc" :src="selectedGroupLogoSrc" alt="Groupe" class="group-logo" /><span v-else class="group-text">{{ selectedUser?.groupe || '—' }}</span></div>
                </div>
              </div>
              <div class="profile-pill profile-coins">{{ formatCoins((selectedUser?.leaderboardCoins ?? selectedUser?.coins ?? 0)) }} <img src="@/assets/img/planicoins.webp" alt="Coin" class="coin-icon" /></div>
            </div>
            </div>
            <div class="profile-divider" aria-hidden="true"></div>
            <div class="profile-right">

            <!-- Musique de profil (si disponible) -->
            <div v-if="showUserProfile && selectedUser" class="leaderboard-profile-music">
              <div v-if="selectedUser.musicSrc" class="profile-pill profile-music-row">
                <div class="profile-music-left">
                  <div class="profile-left-controls">
                    <button type="button" class="btn btn-icon play-btn" @click="togglePopupPlay" :title="isPopupPlaying ? 'Pause' : 'Lire'">
                      <img :src="isPopupPlaying ? pauseBtnImg : playBtnImg" :key="isPopupPlaying ? 'pause' : 'play'" class="play-btn-img" />
                    </button>
                    <div class="volume-controls" @mouseenter="isVolumeHovered = true" @mouseleave="isVolumeHovered = false">
                      <button type="button" class="btn btn-icon volume-btn" @click="togglePopupMute" :title="isPopupMuted ? 'Son coupé' : 'Son actif'">
                        <img :src="popupCurrentVolumeIcon" :key="popupCurrentVolumeIcon" :class="['volume-btn-img', { 'is-mute': isPopupMuted || popupMusicVolume === 0 }]" alt="Volume" />
                      </button>
                      <div class="volume-slider-container" :class="{ visible: isVolumeHovered }">
                        <div class="volume-seek-bar-vertical" @mousedown="startPopupVolumeDrag" @touchstart="startPopupVolumeDrag">
                          <div class="seek-track-vertical"></div>
                          <div class="seek-fill-vertical" :style="{ height: popupMusicVolume + '%' }"></div>
                          <div class="seek-thumb-vertical" :style="{ bottom: popupMusicVolume + '%' }"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="profile-music-player">
                  <div class="profile-music-title">{{ selectedUser.musicTitle || 'Aucune musique' }}</div>
                  <div class="profile-progress-container">
                    <div class="profile-seek-bar" @mousedown="startPopupSeekDrag" @touchstart="startPopupSeekDrag">
                      <div class="seek-track"></div>
                      <div class="seek-fill" :style="{ width: popupProgressPercent + '%' }"></div>
                      <div class="seek-thumb" :style="{ left: popupProgressPercent + '%' }"></div>
                    </div>
                    <div class="profile-time">{{ formatTime(popupProgress) }}</div>
                  </div>
                  <audio
                    ref="popupAudioEl"
                    :src="resolveAssetSrc(selectedUser.musicSrc)"
                    preload="metadata"
                    playsinline
                    @loadedmetadata="onPopupLoadedMetadata"
                    @timeupdate="onPopupTimeUpdate"
                    @play="onPopupAudioPlay"
                  ></audio>
                </div>
              </div>
            </div>
<!-- Note publique -->
      <div class="public-note-section">
        <h3 class="public-note-title">Note publique</h3>
        <!-- condition robuste: cast + trim -->
        <div v-if="String(selectedUser?.publicNote ?? '').trim().length > 0" class="public-note-box">
          {{ String(selectedUser.publicNote) }}
        </div>
        <div v-else class="public-note-empty">Aucune note</div>
      </div>
                      <!-- Slider de volume pour la pop-up du leaderboard (déplacé sous le titre) -->
               
      <!-- /Note publique -->
            </div>
          </div>
          </div>
        </div>
      </transition>
    </div>

      <!-- Popup d'infos pour items non achetables (Planify / Prestige / Cœur / Galaxie) -->
      <teleport to="body">
        <transition name="fade">
          <div v-if="isInfoOpen" class="color-picker-overlay" @click.self="closeInfoItem">
            <div class="color-picker-modal">
              <div class="color-picker-header" style="justify-content:center;">
                <span>Comment obtenir cet item ?</span>
                <button class="close-btn-small" @click="closeInfoItem" @mouseover="hoverCloseStyle = true" @mouseleave="hoverCloseStyle = false" style="position:absolute; right:10px; top:10px;">
                  <img :src="hoverCloseStyle ? closeHoverImg : closeImg" alt="Fermer" class="close-img" />
                </button>
              </div>
              <div style="padding: 14px; color:#111; text-align:center; line-height:1.6; font-size:14px;">
                {{ infoText }}
              </div>
            </div>
          </div>
        </transition>
      </teleport>

      <!-- Popup d'aperçu Pop-up Style -->
      <teleport to="body">
        <transition name="fade">
          <div v-if="isPopupStylePreviewOpen" class="color-picker-overlay" @click.self="closePopupStylePreview">
            <div class="color-picker-modal" data-darkreader-ignore>
              <div class="color-picker-header">
                <span>Aperçu Pop-up Style</span>
                <button class="close-btn-small" @click="closePopupStylePreview" @mouseover="hoverCloseStyle = true" @mouseleave="hoverCloseStyle = false">
                  <img :src="hoverCloseStyle ? closeHoverImg : closeImg" alt="Fermer" class="close-img" />
                </button>
              </div>
              <div class="item-img-wrapper large">
                <div class="item-img-container">
                  <img v-if="suggestVariants && suggestVariants[activeVariantIndex] && suggestVariants[activeVariantIndex].assetSrc" :src="suggestVariants[activeVariantIndex].assetSrc" :style="getSuggestStyle('popupStyle')" class="item-img" />
                </div>
              </div>
            </div>
          </div>
        </transition>
      </teleport>

      <!-- Popup de sélection de style pour Discord -->
      <teleport to="body">
        <transition name="fade">
          <div v-if="isDiscordPickerOpen" class="color-picker-overlay" @click.self="closeDiscordStylePicker">
            <div class="color-picker-modal" data-darkreader-ignore>
              <div class="color-picker-header">
                <span>Choisir un style Discord</span>
                <button class="close-btn-small" @click="closeDiscordStylePicker" @mouseover="hoverCloseStyle = true" @mouseleave="hoverCloseStyle = false">
                  <img :src="hoverCloseStyle ? closeHoverImg : closeImg" alt="Fermer" class="close-img" />
                </button>
              </div>
              <div class="color-grid">
                <div v-for="(v, idx) in (discordPickerItem?.variants || [])" :key="idx" class="color-swatch" data-darkreader-ignore @click="applyDiscordVariant(idx)" style="display:flex;align-items:center;justify-content:center;background:#fff;">
                  <img :src="v" alt="variante" style="width:50px;height:50px;object-fit:contain;" />
                </div>
              </div>
            </div>
          </div>
        </transition>
      </teleport>

      <!-- Popup de sélection de style pour Jojo -->
      <teleport to="body">
        <transition name="fade">
          <div v-if="isJojoPickerOpen" class="color-picker-overlay" @click.self="closeJojoStylePicker">
            <div class="color-picker-modal" data-darkreader-ignore>
              <div class="color-picker-header">
                <span>Choisir un style Jojo</span>
                <button class="close-btn-small" @click="closeJojoStylePicker" @mouseover="hoverCloseStyle = true" @mouseleave="hoverCloseStyle = false">
                  <img :src="hoverCloseStyle ? closeHoverImg : closeImg" alt="Fermer" class="close-img" />
                </button>
              </div>
              <div class="color-grid">
                <div class="color-swatch" data-darkreader-ignore @click="applyJojoVariant(0)" style="display:flex;align-items:center;justify-content:center;background:#fff;">
                  <span class="jojo-default-label" data-darkreader-ignore style="color:#000 !important;">Par défaut</span>
                </div>
                <div class="color-swatch" data-darkreader-ignore @click="applyJojoVariant(1)" style="display:flex;align-items:center;justify-content:center;background:#fff;">
                  <img :src="jojotext" alt="Avec texte" style="width:50px;height:50px;object-fit:contain;" />
                </div>
              </div>
            </div>
          </div>
        </transition>
      </teleport>

      <!-- Popup de sélection de style pour les items dynamiques -->
      <teleport to="body">
        <transition name="fade">
          <div v-if="isDynamicPickerOpen" class="color-picker-overlay" @click.self="closeDynamicStylePicker">
            <div class="color-picker-modal" data-darkreader-ignore>
              <div class="color-picker-header">
                <span>Choisir un style pour {{ dynamicPickerItem?.name || 'Item' }}</span>
                <button class="close-btn-small" @click="closeDynamicStylePicker" @mouseover="hoverCloseStyle = true" @mouseleave="hoverCloseStyle = false">
                  <img :src="hoverCloseStyle ? closeHoverImg : closeImg" alt="Fermer" class="close-img" />
                </button>
              </div>
              <div class="color-grid">
                <div v-for="(variant, idx) in (dynamicPickerItem?.variants || [])" :key="idx" class="color-swatch" data-darkreader-ignore @click="applyDynamicVariant(idx)" style="display:flex;align-items:center;justify-content:center;background:#fff;">
                  <div style="width:120.5px;height:64px;position:relative;display:flex;align-items:center;justify-content:center;">
                    <!-- Si c'est un style texte uniquement -->
                    <div v-if="variant.textOnly" style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;">
                      <span style="font-size:12px; color: #000;">{{ variant.textContent || 'Texte' }}</span>
                    </div>
                    <!-- Sinon, aperçu normal avec fond et assets -->
                    <template v-else>
                      <div v-if="variant.backgrounds && (variant.backgrounds['popup-style'] || variant.backgrounds.collection)" :style="{ position: 'absolute', inset: 0, background: variant.backgrounds['popup-style'] || variant.backgrounds.collection, zIndex: 0, pointerEvents: 'none' }"></div>
                      <img v-for="(asset, ai) in (variant.assets || [])" :key="ai" :src="resolveAssetSrc(asset.src)" :style="getPopupStylePreviewStyle(asset)" />
                    </template>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </transition>
      </teleport>

      <!-- Popup de sélection de couleur pour la Bordure classique -->
      <teleport to="body">
        <transition name="fade">
          <div v-if="isColorPickerOpen" class="color-picker-overlay" @click.self="closeColorPicker">
            <div class="color-picker-modal" data-darkreader-ignore>
              <div class="color-picker-header">
                <span class="color-picker-title">Choisir une couleur</span>
                <button class="close-btn-small" @click="() => { hoverCloseColor = false; closeColorPicker() }" @mouseover="hoverCloseColor = true" @mouseleave="hoverCloseColor = false">
                  <img :src="hoverCloseColor ? closeHoverImg : closeImg" alt="Fermer" class="close-img" />
                </button>
              </div>

              <!-- Barre de progression + textes -->
              <div class="color-progress-wrapper">
                <div
                  class="color-progress-track"
                  role="progressbar"
                  :aria-valuenow="borderColorsPercent"
                  aria-valuemin="0"
                  aria-valuemax="100"
                  aria-label="Couleurs de bordure débloquées"
                >
                  <div class="color-progress-fill" :style="{ width: borderColorsPercent + '%' }"></div>
                </div>
                <div class="color-progress-text">
                  <div class="color-progress-percent">{{ borderColorsPercent }}% collectés</div>
                  <div class="color-progress-count">{{ unlockedColorsCount }} / {{ totalColorsCount }}</div>
                </div>

              </div>

              <div class="color-grid">
                <div
                  v-for="c in coinsStore.borderColors"
                  :key="c.id"
                  class="color-swatch"
                  data-darkreader-ignore
                  :class="{ locked: !c.unlocked }"
                  :style="getColorSwatchStyle(c)"
                  @click="selectBorderColor(c)"
                >
                  <span class="color-name">{{ c.name }}</span>
                  <span v-if="c.id === coinsStore.selectedBorderColor" class="checkmark">✓</span>
                  <span v-if="!c.unlocked" class="lockmark">🔒</span>
                </div>
              </div>
            </div>
          </div>
        </transition>
      </teleport>

    <!-- Modale de confirmation de changement de faction -->
    <div v-if="factionConfirmVisible" class="popup-overlay" @click="cancelConfirmFaction">
      <div class="popup-content popup-delete-confirm faction-delete-confirm" @click.stop>
        <h3>Confirmation de changement de faction</h3>
        <p>
          Êtes-vous sûr de vouloir rejoindre {{ pendingFaction }} ?
          Cette action coûte 250 Planify Coins.
        </p>
        <div class="faction-delete-actions">
          <button @click="cancelConfirmFaction" class="btn-cancel-delete">Non</button>
          <button @click="confirmJoinFaction" :disabled="joiningFaction" class="btn-confirm-delete">Oui</button>
        </div>
      </div>
    </div>
  </div>
</div>
</template>

<script setup>
 import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCoinsStore } from '@/stores/coins'
import { useAuthStore } from '@/stores/auth'
import { secureApiCall, API_URL } from '@/api'
// Icône remplacée par planicoins.png
import catEars from '@/assets/accounttt.svg' // Utilisé comme placeholder
import { FALLBACK_AVATAR_DATA_URL } from '@/constants/fallbackAvatar.js' // Data URL par défaut pour les avatars
import oreilleschat from '@/assets/img/oreilleschat.gif'
import blushuwu from '@/assets/img/blushuwu.gif'
import matrix from '@/assets/img/matrix.gif'
import angelwings from '@/assets/img/angelwings.gif'
import laracroft from '@/assets/img/laracroft.gif'
import clowncheveux from '@/assets/img/clowncheveux.gif'
import clownnose from '@/assets/img/clownnose.gif'
import cash from '@/assets/img/cash.gif'
import target from '@/assets/img/target.gif'
import roi from '@/assets/img/roi.gif'
import star from '@/assets/img/star.gif'
import cadre from '@/assets/img/cadre.gif'
import love from '@/assets/img/love.gif'
import moustache from '@/assets/img/moustache.gif'
import gentleman from '@/assets/img/gentleman.gif'
import vinyle from '@/assets/img/vinyle.gif'
import vinylePopup from '@/assets/Vinyle.gif'
import advisory from '@/assets/img/advisory.gif'
import spacestars from '@/assets/img/spacestars.gif'
import asteroide from '@/assets/img/asteroide.gif'
import bras from '@/assets/img/bras.webp'
import flash from '@/assets/img/flash.gif'
import camera from '@/assets/img/camera.gif'
import chat from '@/assets/img/chat.gif'
import pate from '@/assets/img/pate.gif'
import dvd from '@/assets/img/dvd.png'
import mlglunette from '@/assets/img/mlglunette.gif'
import nokia from '@/assets/img/nokia.gif'
import clippy from '@/assets/img/clippy.gif'
import galaxie from '@/assets/img/Galaxie.webp'
import coeur from '@/assets/img/Coeur.webp'
import alphaImg from '@/assets/img/Alpha.webp'
import adminPlanify from '@/assets/img/Admin-Planify.webp'
 import daftpunk from '@/assets/img/daftpunk.gif'
 import closeImg from '@/assets/img/bouton_supprimer_decocher.png'
 import closeHoverImg from '@/assets/img/bouton_supprimer_cocher.png'
 import retourImg from '@/assets/img/retour.png'
 import retourHoverImg from '@/assets/img/retour_hover.png'
 import insideIcon from '@/assets/intérieur.webp'
 import aboveIcon from '@/assets/par_dessus.webp'
 import centerImg from '@/assets/bouton_centrer.webp'
import centerHoverImg from '@/assets/bouton_centrer_hover.webp'
import borderIcon from '@/assets/bordure.webp'
import borderHoverIcon from '@/assets/bordure_hover.webp'
import discordon from '@/assets/img/discordon.webp'
import discordnepasderange from '@/assets/img/discordnepasderange.webp'
import discordderange from '@/assets/img/discordderange.webp'
import styleIcon from '@/assets/img/style.webp'
import playBtnImg from '@/assets/img/play-btn.png'
import pauseBtnImg from '@/assets/img/pause-btn.png'
import volumeOneBarImg from '@/assets/img/volume-unebarre.png'
import volumeTwoBarsImg from '@/assets/img/volume-deuxbarres.png'
import volumeFullImg from '@/assets/img/volume-deuxbarrescoupé.png'
import muteIconImg from '@/assets/img/mute-son.png'
import groupeA from '@/assets/img/groupe_A.webp'
import groupeAprime from '@/assets/img/groupe_Aprime.webp'
import groupeB from '@/assets/img/groupe_B.webp'
import groupeBprime from '@/assets/img/groupe_Bprime.webp'
import groupePromo from '@/assets/img/groupe_Promo.webp'
import jojo from '@/assets/img/tobecontinued.webp'
import jojotext from '@/assets/img/jojotext.gif'
import infoIcon from '@/assets/img/infos_items.webp'
import apercuIcon from '@/assets/aperçu-icon.webp'
import bookmarksVide from '@/assets/bookmarks_vide.webp'
import bookmarksRemplie from '@/assets/bookmarks_remplie.webp'


  // Format compact pour les grands nombres (10K, 10,1K, 1,2M, 1,1B)
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
// Sons
import selectionSound from '@/assets/son/selection.mp3'
import achatSound from '@/assets/son/achat.mp3'
import annulerSound from '@/assets/son/annuler.mp3'

const props = defineProps({
  show: Boolean
})
const emit = defineEmits(['close', 'equip-item'])

const coinsStore = useCoinsStore()
const authStore = useAuthStore()
const router = useRouter()
const userCoins = computed(() => coinsStore.balance)
const hoverCloseShop = ref(false)
const hoverBackShop = ref(false)
watch(() => props.show, (v) => { if (v === true) { hoverCloseShop.value = false; hoverBackShop.value = false; showMyItemsPanel.value = false; try { window.dispatchEvent(new Event('shop-visited')) } catch {} } })

const emitClose = () => emit('close')

// Prof uniquement: activer/désactiver le leaderboard depuis la boutique
const isProf = computed(() => !!authStore.user && authStore.user.role === 'prof')
const showLeaderboardTab = computed(() => !isProf.value || !!(authStore.user && authStore.user.leaderboardEnabled))
const shopLeaderboardBusy = ref(false)

async function toggleLeaderboardFromShop() {
  if (shopLeaderboardBusy.value) return
  if (!authStore.user) return
  try {
    shopLeaderboardBusy.value = true
    const current = !!authStore.user.leaderboardEnabled
    const desired = !current
    const res = await secureApiCall('/users/me/leaderboard', {
      method: 'PUT',
      body: JSON.stringify({ enabled: desired })
    })
    if (res && res.success && res.user) {
      const updatedUser = { ...(authStore.user || {}), ...res.user, token: (authStore.user && authStore.user.token) }
      try { authStore.login(updatedUser) } catch { authStore.user = updatedUser }
    } else if (typeof res?.leaderboardEnabled !== 'undefined') {
      const updatedUser = { ...(authStore.user || {}), leaderboardEnabled: !!res.leaderboardEnabled, token: (authStore.user && authStore.user.token) }
      try { authStore.login(updatedUser) } catch { authStore.user = updatedUser }
    } else {
      // Fallback local si la réponse n'inclut pas les champs attendus
      try { if (authStore.user) authStore.user.leaderboardEnabled = desired } catch {}
    }
    try { window.dispatchEvent(new CustomEvent('leaderboard-preferences-updated')) } catch {}
    // Basculer l’onglet en fonction du nouvel état
    if (desired) {
      try { activeTab.value = 'leaderboard' } catch { activeTab = 'leaderboard' }
    } else {
      try { if (activeTab.value === 'leaderboard') activeTab.value = 'main' } catch { if (activeTab === 'leaderboard') activeTab = 'main' }
    }
  } catch (e) {
    console.error('Toggle leaderboard (boutique) échoué:', e)
    try { alert('Impossible de mettre à jour le paramètre du leaderboard.') } catch {}
  } finally {
    shopLeaderboardBusy.value = false
  }
}

const playSound = (src) => {
  try {
    const audio = new Audio(src)
    audio.volume = 0.7
    audio.play().catch(() => {})
  } catch {}
}

// URL de base pour les avatars (comme dans la Navbar)
const baseUrl = API_URL.endsWith('/api') 
  ? API_URL.slice(0, -4) // Supprime '/api' de la fin pour avoir l'URL du serveur
  : API_URL.replace('/api', '')

function toAbsoluteUrl(pathOrUrl) {
  try {
    if (!pathOrUrl) return null
    const s = String(pathOrUrl)
    if (/^https?:\/\//i.test(s)) return s
    if (s.startsWith('/uploads/')) return `${baseUrl}${s}`
    return `${baseUrl}${s.startsWith('/') ? s : '/' + s}`
  } catch { return null }
}

// Fonction pour obtenir l'ID de l'utilisateur
const getUserId = () => {
  if (!authStore.user) return 'anonymous'
  return authStore.user.id || authStore.user._id || 'anonymous'
}

// Helper: vérifier si un utilisateur correspond à l'utilisateur courant (ID ou username)
const isCurrentUser = (u) => {
  try {
    const uid = String((u && (u._id || u.id)) || '')
    const meId = String(getUserId())
    if (uid && meId && uid !== 'anonymous' && meId !== 'anonymous') {
      return uid === meId
    }
    const uname = String((u && (u.username || u.name)) || '')
    const meName = String((authStore.user && (authStore.user.username || authStore.user.name)) || '')
    return !!uname && !!meName && uname === meName
  } catch {
    return false
  }
}

// Fonction pour obtenir la clé de notification spécifique à l'utilisateur
const getNotificationKey = () => {
  return `weeklyResetNotification_${getUserId()}`
}

// Items dynamiques (créés via AdminItemEditor)
const dynamicItems = ref([])
const userServerLocalItems = ref([])
const localItemsUpdateKey = ref(0)
const showPurchasePreview = ref(false)
watch(showPurchasePreview, (v) => { try { hoverBackShop.value = false; hoverCloseShop.value = false } catch {} })
const purchasePreviewItem = ref(null)
const royalFramePosition = ref({ x: 0, y: 0 })
const isDraggingRoyal = ref(false)
const royalStart = ref({ x: 0, y: 0 })
function startDragRoyal(e) { try { isDraggingRoyal.value = true; royalStart.value = { x: e.clientX - royalFramePosition.value.x, y: e.clientY - royalFramePosition.value.y } } catch {} }
function dragRoyal(e) { try { if (!isDraggingRoyal.value) return; royalFramePosition.value = { x: e.clientX - royalStart.value.x, y: e.clientY - royalStart.value.y } } catch {} }
function endDragRoyal() { try { isDraggingRoyal.value = false } catch {} }

// Roses (Cosmétique): déplacement + réduction de taille
const rainbowPosition = ref({ x: 0, y: 0 })
const rainbowScale = ref(1)
const isDraggingRainbow = ref(false)
const rainbowStart = ref({ x: 0, y: 0 })
function startDragRainbow(e) { try { isDraggingRainbow.value = true; rainbowStart.value = { x: e.clientX - rainbowPosition.value.x, y: e.clientY - rainbowPosition.value.y } } catch {} }
function dragRainbow(e) { try { if (!isDraggingRainbow.value) return; rainbowPosition.value = { x: e.clientX - rainbowStart.value.x, y: e.clientY - rainbowStart.value.y } } catch {} }
function endDragRainbow() { try { isDraggingRainbow.value = false } catch {} }

// Absolute Cinema (Cosmétique): déplacement indépendant des deux bras (taille identique, positions distinctes)
const absCinemaLeftPos = ref({ x: 0, y: 0 })
const absCinemaRightPos = ref({ x: 0, y: 0 })
const isDraggingAbsLeft = ref(false)
const isDraggingAbsRight = ref(false)
const absLeftStart = ref({ x: 0, y: 0 })
const absRightStart = ref({ x: 0, y: 0 })
function startDragAbsLeft(e) { try { isDraggingAbsLeft.value = true; absLeftStart.value = { x: e.clientX - absCinemaLeftPos.value.x, y: e.clientY - absCinemaLeftPos.value.y } } catch {} }
function dragAbsLeft(e) { try { if (!isDraggingAbsLeft.value) return; absCinemaLeftPos.value = { x: e.clientX - absLeftStart.value.x, y: e.clientY - absLeftStart.value.y } } catch {} }
function endDragAbsLeft() { try { isDraggingAbsLeft.value = false } catch {} }
function startDragAbsRight(e) { try { isDraggingAbsRight.value = true; absRightStart.value = { x: e.clientX - absCinemaRightPos.value.x, y: e.clientY - absCinemaRightPos.value.y } } catch {} }
function dragAbsRight(e) { try { if (!isDraggingAbsRight.value) return; absCinemaRightPos.value = { x: e.clientX - absRightStart.value.x, y: e.clientY - absRightStart.value.y } } catch {} }
function endDragAbsRight() { try { isDraggingAbsRight.value = false } catch {} }

const absCinemaLeftAvatarPos = ref({ x: 0, y: 0 })
const absCinemaRightAvatarPos = ref({ x: 0, y: 0 })
const isDraggingAbsLeftAvatar = ref(false)
const isDraggingAbsRightAvatar = ref(false)
const absLeftAvatarStart = ref({ x: 0, y: 0 })
const absRightAvatarStart = ref({ x: 0, y: 0 })
function startDragAbsLeftAvatar(e) { try { isDraggingAbsLeftAvatar.value = true; absLeftAvatarStart.value = { x: e.clientX - absCinemaLeftAvatarPos.value.x, y: e.clientY - absCinemaLeftAvatarPos.value.y } } catch {} }
function dragAbsLeftAvatar(e) { try { if (!isDraggingAbsLeftAvatar.value) return; absCinemaLeftAvatarPos.value = { x: e.clientX - absLeftAvatarStart.value.x, y: e.clientY - absLeftAvatarStart.value.y } } catch {} }
function endDragAbsLeftAvatar() { try { isDraggingAbsLeftAvatar.value = false } catch {} }
function startDragAbsRightAvatar(e) { try { isDraggingAbsRightAvatar.value = true; absRightAvatarStart.value = { x: e.clientX - absCinemaRightAvatarPos.value.x, y: e.clientY - absCinemaRightAvatarPos.value.y } } catch {} }
function dragAbsRightAvatar(e) { try { if (!isDraggingAbsRightAvatar.value) return; absCinemaRightAvatarPos.value = { x: e.clientX - absRightAvatarStart.value.x, y: e.clientY - absRightAvatarStart.value.y } } catch {} }
function endDragAbsRightAvatar() { try { isDraggingAbsRightAvatar.value = false } catch {} }

const flashCosmeticPos = ref({ x: 0, y: 0 })
const cameraCosmeticPos = ref({ x: 0, y: 0 })
const isDraggingFlashCosmetic = ref(false)
const isDraggingCameraCosmetic = ref(false)
const flashCosmeticStart = ref({ x: 0, y: 0 })
const cameraCosmeticStart = ref({ x: 0, y: 0 })
function startDragFlashCosmetic(e) { try { isDraggingFlashCosmetic.value = true; flashCosmeticStart.value = { x: e.clientX - flashCosmeticPos.value.x, y: e.clientY - flashCosmeticPos.value.y } } catch {} }
function dragFlashCosmetic(e) { try { if (!isDraggingFlashCosmetic.value) return; flashCosmeticPos.value = { x: e.clientX - flashCosmeticStart.value.x, y: e.clientY - flashCosmeticStart.value.y } } catch {} }
function endDragFlashCosmetic() { try { isDraggingFlashCosmetic.value = false } catch {} }
function startDragCameraCosmetic(e) { try { isDraggingCameraCosmetic.value = true; cameraCosmeticStart.value = { x: e.clientX - cameraCosmeticPos.value.x, y: e.clientY - cameraCosmeticPos.value.y } } catch {} }
function dragCameraCosmetic(e) { try { if (!isDraggingCameraCosmetic.value) return; cameraCosmeticPos.value = { x: e.clientX - cameraCosmeticStart.value.x, y: e.clientY - cameraCosmeticStart.value.y } } catch {} }
function endDragCameraCosmetic() { try { isDraggingCameraCosmetic.value = false } catch {} }

const flashAvatarPos = ref({ x: 0, y: 0 })
const cameraAvatarPos = ref({ x: 0, y: 0 })
const isDraggingFlashAvatar = ref(false)
const isDraggingCameraAvatar = ref(false)
const flashAvatarStart = ref({ x: 0, y: 0 })
const cameraAvatarStart = ref({ x: 0, y: 0 })
function startDragFlashAvatar(e) { try { isDraggingFlashAvatar.value = true; flashAvatarStart.value = { x: e.clientX - flashAvatarPos.value.x, y: e.clientY - flashAvatarPos.value.y } } catch {} }
function dragFlashAvatar(e) { try { if (!isDraggingFlashAvatar.value) return; flashAvatarPos.value = { x: e.clientX - flashAvatarStart.value.x, y: e.clientY - flashAvatarStart.value.y } } catch {} }
function endDragFlashAvatar() { try { isDraggingFlashAvatar.value = false } catch {} }
function startDragCameraAvatar(e) { try { isDraggingCameraAvatar.value = true; cameraAvatarStart.value = { x: e.clientX - cameraAvatarPos.value.x, y: e.clientY - cameraAvatarPos.value.y } } catch {} }
function dragCameraAvatar(e) { try { if (!isDraggingCameraAvatar.value) return; cameraAvatarPos.value = { x: e.clientX - cameraAvatarStart.value.x, y: e.clientY - cameraAvatarStart.value.y } } catch {} }
function endDragCameraAvatar() { try { isDraggingCameraAvatar.value = false } catch {} }



// Admin-only toolbar: cycle preview items without changing real weekly item
const isAdminUser = computed(() => !!authStore.user && ((authStore.user.role === 'admin') || (authStore.user.role === 'prof')))
const isAdminOnly = computed(() => !!authStore.user && (authStore.user.role === 'admin'))
const adminPreviewIndex = ref(0)
const adminPreviewItemForGrid = ref(null)
const adminGridPreviewSlot = ref(0)
const adminGridReplacements = ref(new Map())
const adminAllOptions = computed(() => {
  // Inclure aussi les items locaux (mes suggestions) pour les tester immédiatement
  // On accède directement au localStorage pour éviter les problèmes de hoisting avec collectionItems
  let local = []
  try {
    const u = authStore.user
    const uid = String((u && (u.id || u._id)) || 'anon')
    const key = 'my-items-local-' + uid
    const raw = JSON.parse(localStorage.getItem(key) || '[]')
    local = Array.isArray(raw) ? raw.map((p, idx) => ({
      id: (typeof p.legacyId !== 'undefined') ? p.legacyId : (typeof p.id !== 'undefined' ? p.id : (100000 + idx)),
      name: p.name || 'Suggestion',
      price: Number(p.price) || 0,
      isDynamic: true,
      isLocal: true,
      assets: Array.isArray(p.assets) ? p.assets : [],
      backgrounds: p.backgrounds || {},
      variants: Array.isArray(p.variants) ? p.variants : [],
      meta: p.meta || {}
    })) : []
  } catch {}

  const dyn = Array.isArray(dynamicItems.value) ? dynamicItems.value : []
  const stat = shopItems.filter(it => it && it.id !== 0)
  const weekly = Array.isArray(normalWeeklyItems.value)
    ? normalWeeklyItems.value.map(it => ({
        id: (it && (it.legacyId !== undefined ? it.legacyId : it.id)),
        name: it?.name || '',
        price: Number(it?.price) || 0,
        isDynamic: !!it?.isDynamic,
        assets: Array.isArray(it?.assets) ? it.assets : [],
        backgrounds: it?.backgrounds || {},
        variants: Array.isArray(it?.variants) ? it.variants : [],
        meta: (it && typeof it.meta === 'object') ? it.meta : {}
      }))
    : []
  
  // Combiner statique, dynamique (serveur) et local
  const combined = [...stat, ...dyn, ...userServerLocalItems.value, ...local, ...weekly]
  const seen = new Set()
  return combined.filter(it => {
    const normId = (it && (it.legacyId !== undefined ? it.legacyId : it.id))
    if (!Number.isFinite(normId)) return false
    const key = Number(normId)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
})
function onAdminReplace(index, id) {
  try {
    const optId = Number(id)
    const item = adminAllOptions.value.find(it => Number(it.id) === optId)
    if (item) adminGridReplacements.value.set(index, item)
  } catch {}
}
function onAdminReset(index) { try { adminGridReplacements.value.delete(index) } catch {} }
watch(purchasePreviewItem, (item) => {
  try {
    const list = normalWeeklyItems.value || []
    const idx = list.findIndex((it) => (it?.id === item?.id) || (it?.name === item?.name))
    if (idx >= 0) adminPreviewIndex.value = idx
    adminPreviewItemForGrid.value = item || null
  } catch {}
})
function openAdminPreviewOfIndex(i) {
  try {
    const list = normalWeeklyItems.value || []
    if (!list.length) return
    const idx = ((i % list.length) + list.length) % list.length
    purchasePreviewItem.value = list[idx]
    adminPreviewItemForGrid.value = list[idx]
    showPurchasePreview.value = true
    adminPreviewIndex.value = idx
    playSound(selectionSound)
  } catch {}
}
function adminPreviewNext() { openAdminPreviewOfIndex(adminPreviewIndex.value + 1) }
function adminPreviewPrev() { openAdminPreviewOfIndex(adminPreviewIndex.value - 1) }
function adminPreviewRandom() { try { const list = normalWeeklyItems.value || []; if (list.length) openAdminPreviewOfIndex(Math.floor(Math.random() * list.length)) } catch {} }
const weeklyContainerRef = ref(null)
const forceWeeklyHeight = ref(0)
function syncWeeklyHeight(){ try{ const el = weeklyContainerRef.value; if (!el) return; const rect = el.getBoundingClientRect(); forceWeeklyHeight.value = Math.round(rect.height) }catch{} }
function openPurchasePreview(item){ try{ syncWeeklyHeight(); purchasePreviewItem.value = item; showPurchasePreview.value = true; hoverBackShop.value = false; hoverCloseShop.value = false }catch{} }
function closePurchasePreview(){ hoverBackShop.value = false; hoverCloseShop.value = false; try{ showPurchasePreview.value = false }catch{ showPurchasePreview = false }; purchasePreviewItem.value = null; if (showSuggestionEditor && (showSuggestionEditor.value === true)) { showSuggestionEditor.value = false; suggestAssetSrc.value = ''; suggestUrl.value = ''; removeAvatarBorder.value = false; removeLeaderboardBorder.value = false; previewWindowIndex.value = 0; suggestDevice.value = 'desktop'; const DEF = { top:0, left:0, width:50, height:50, rotate:0, objectFit:'contain', zIndex:1, margin:0, padding:0, background:'', boxShadow:'', borderWidth:0, borderStyle:'none', borderColor:'', borderRadius:0 }; suggestStyles.value = { dailyShop: { ...DEF }, collectionPreviewDesktop: { ...DEF }, collectionPreviewMobile: { ...DEF }, collectionPreview: { ...DEF }, collection: { ...DEF }, leaderboard: { ...DEF }, avatar: { ...DEF }, popupStyle: { ...DEF } }; resetSuggestUsers() } }
function measurePreviewSlider(){ try{ const root = weeklyContainerRef.value; if (!root) return; const card = root.querySelector('.preview-slider-track .preview-card'); if (card) { const r = card.getBoundingClientRect(); previewCardWidth.value = Math.round(r.width) } const track = root.querySelector('.preview-slider-track'); if (track) { const cs = window.getComputedStyle(track); const gapVal = parseFloat(cs.gap) || 6; previewCardGap.value = Math.round(gapVal) } }catch{} }
onMounted(() => { try{ syncWeeklyHeight(); measurePreviewSlider(); window.addEventListener('resize', syncWeeklyHeight); window.addEventListener('resize', measurePreviewSlider); refreshSuggestPreviewBorderColor() }catch{} })
onUnmounted(() => { try{ window.removeEventListener('resize', syncWeeklyHeight); window.removeEventListener('resize', measurePreviewSlider) }catch{} })
// Indexs pour retrouver infoOnly/infoDescription même si l'item n'est pas affiché (doublon avec catalogue statique)
const dynamicInfoById = ref(new Map())
const dynamicInfoByName = ref(new Map())
// Clé réactive pour forcer la mise à jour de l'affichage des variantes
const variantUpdateKey = ref(0)

// Computed property réactive qui dépend du store pour forcer les mises à jour
const dynamicVariantsState = computed(() => {
  // Cette computed property se met à jour quand le store change
  return coinsStore.dynamicItemVariants.size
})

// Map des computed properties pour chaque item dynamique
const dynamicItemDisplays = new Map()

// Aperçu Navbar: fermer la boutique et envoyer un événement global pour que la Navbar affiche un rendu temporaire
function handlePreviewNavbar(item) {
  try {
    window.dispatchEvent(new CustomEvent('navbar-preview-item', { detail: { item } }))
  } catch {}
  emit('close')
  // Rediriger vers l'accueil pour afficher l'aperçu en toute sécurité
  try {
    try { window.__previewNavigationTs = Date.now() } catch {}
    const current = router && router.currentRoute && router.currentRoute.value && router.currentRoute.value.path
    if (current !== '/') router.push('/')
  } catch {}
}

// Position dynamique pour l'icône d'aperçu: si l'item a des variantes/styles, placer sous la palette (colonne); sinon même position
function getApercuIconPos(item) {
  try {
    const hasDynamicVariants = item && Array.isArray(item.variants) && item.variants.length > 0
    const hasOwnPalette = item && (item.name === 'Jojo' || item.name === 'Discord')
    const hasVariantsOrPalette = hasDynamicVariants || hasOwnPalette
    // Si l’item a une palette (Jojo/Discord) ou des variants dynamiques, on place l’aperçu sous la palette
    return hasVariantsOrPalette ? 'top: 40px; left: 10px;' : 'top: 8px; left: 10px;'
  } catch { 
    return 'top: 8px; left: 10px;' 
  }
}

// Fonction pour obtenir ou créer la computed property pour un item
const getDynamicItemDisplay = (item) => {
  const normalizedKey = (typeof item?.legacyId !== 'undefined') ? Number(item.legacyId) : Number(item?.id)
  if (!dynamicItemDisplays.has(normalizedKey)) {
    const display = computed(() => {
      try {
        const itemId = (typeof item?.legacyId !== 'undefined') ? item.legacyId : item?.id
        const variantIndex = coinsStore.getDynamicItemVariant(itemId)
        const variant = item?.variants && item.variants[variantIndex]
        if (!variant || !Array.isArray(variant.assets)) {
          return { assets: [], background: null }
        }
        return {
          assets: variant.assets || [],
          background: variant.backgrounds && variant.backgrounds.collection ? variant.backgrounds.collection : null
        }
      } catch {
        return { assets: [], background: null }
      }
    })
    dynamicItemDisplays.set(normalizedKey, display)
  }
  return dynamicItemDisplays.get(normalizedKey)
}

function getApiOrigin() {
  const api = API_URL || ''
  try {
    if (api.startsWith('http')) return new URL(api).origin
  } catch {}
  return window.location.origin
}

async function loadDynamicItems() {
  try {
    const endpoint = (isAdminOnly.value) ? '/items/admin/all' : '/items'
    const res = await secureApiCall(endpoint)
    if (res && res.success && Array.isArray(res.items)) {
      const normalized = res.items.map((it) => ({
        id: it.legacyId,
        name: it.name,
        price: Number(it.price) || 0,
        isDynamic: true,
        infoOnly: !!it.infoOnly,
        infoDescription: it.infoDescription || null,
        assets: Array.isArray(it.assets) ? it.assets : [],
        backgrounds: it.backgrounds || {},
        variants: Array.isArray(it.variants) ? it.variants.map(v => ({
          ...v,
          showText: !!v.showText,
          textOnly: !!v.textOnly,
          textContent: v.textContent || ''
        })) : [],
        // Conserver au passage des metas au niveau item si présents
        meta: (it && typeof it.meta === 'object') ? it.meta : {},
        variantIndex: 0 // Index par défaut
      }))
      // MAJ des index d'infos pour accès rapide par id/nom
      const byId = new Map()
      const byName = new Map()
      for (const n of normalized) {
        if (typeof n.id !== 'undefined') byId.set(Number(n.id), n)
        if (n && typeof n.name === 'string') byName.set(n.name.trim(), n)
      }
      dynamicInfoById.value = byId
      dynamicInfoByName.value = byName
      // éviter les doublons d'id avec le catalogue statique
      const staticIds = new Set(shopItems.map(s => s.id))
      dynamicItems.value = normalized.filter(n => !staticIds.has(n.id))
      
      // Nettoyer la map des computed properties pour les nouveaux items
      dynamicItemDisplays.clear()
    } else {
      dynamicItems.value = []
      dynamicInfoById.value = new Map()
      dynamicInfoByName.value = new Map()
      dynamicItemDisplays.clear()
    }
  } catch (e) {
    dynamicItems.value = []
    dynamicInfoById.value = new Map()
    dynamicInfoByName.value = new Map()
    dynamicItemDisplays.clear()
  }
}

// Collection de tous les items (achetés et non achetés)
const collectionItems = computed(() => {
  // Déclencheur pour réactivité locale
  localItemsUpdateKey.value
  
  // 1. Items serveur
  const serverItems = [...shopItems, ...dynamicItems.value]
  
  // 2. Items locaux (Suggestions)
  let local = []
  try {
    const u = authStore.user
    const uid = String((u && (u.id || u._id)) || 'anon')
    const key = 'my-items-local-' + uid
    local = JSON.parse(localStorage.getItem(key) || '[]')
  } catch { local = [] }

  const normalizedLocal = Array.isArray(local) ? local.map((p, idx) => ({
    id: (typeof p.legacyId !== 'undefined') ? p.legacyId : (typeof p.id !== 'undefined' ? p.id : (100000 + idx)),
    legacyId: (typeof p.legacyId !== 'undefined') ? p.legacyId : (typeof p.id !== 'undefined' ? p.id : (100000 + idx)),
    name: p.name || 'Suggestion',
    price: Number(p.price) || 150,
    isDynamic: true,
    isLocal: true,
    assets: Array.isArray(p.assets) ? p.assets : [],
    variants: Array.isArray(p.variants) ? p.variants : [],
    backgrounds: p.backgrounds || {},
    meta: p.meta || {},
    variantIndex: 0
  })) : []

  // Éviter les doublons (si un item local est devenu un item serveur)
  const serverIds = new Set(serverItems.map(it => it.legacyId || it.id))

  // Clés des items déjà présents côté serveur "Mes Items" (id, localItemId, nom)
  const userKeys = new Set(
    (Array.isArray(userServerLocalItems.value) ? userServerLocalItems.value : []).map(u => {
      const id = (typeof u.legacyId !== 'undefined') ? u.legacyId : u.id
      const lid = u && u.meta && u.meta.localItemId ? String(u.meta.localItemId) : ''
      const name = String(u.name || '').trim().toLowerCase()
      return [String(id), lid ? `local:${lid}` : '', name ? `name:${name}` : '']
    }).flat().filter(Boolean)
  )

  const uniqueUserServerLocal = Array.isArray(userServerLocalItems.value)
    ? userServerLocalItems.value.filter(u => !serverIds.has(u.id))
    : []

  // Retirer aussi les doublons entre localStorage et "Mes Items" serveur
  const uniqueLocal = normalizedLocal.filter(l => {
    const id = String(l.id)
    const lid = l && l.meta && l.meta.localItemId ? `local:${String(l.meta.localItemId)}` : ''
    const name = String(l.name || '').trim().toLowerCase()
    if (serverIds.has(l.id)) return false
    if (userKeys.has(id)) return false
    if (lid && userKeys.has(lid)) return false
    if (name && userKeys.has(`name:${name}`)) return false
    return true
  })

  return [...serverItems, ...uniqueUserServerLocal, ...uniqueLocal]
})

// Recherche (insensible à la casse) pour la Collection
const searchQuery = ref('')
const searchInputRef = ref(null)
const showFavoritesOnly = ref(false)
const hoverFavIndex = ref(null)

// Suggestion d'item (collection)
const showSuggestionEditor = ref(false)
const currentEditingLocalId = ref(null)
// Slider d’aperçus pour la fenêtre de suggestion
const previewWindowIndex = ref(0)
const previewWindowSize = 3
const suggestDevice = ref('desktop')
const slideDirection = ref(null)
const slideDirectionClass = computed(() => slideDirection.value === 'left' ? 'slide-left' : slideDirection.value === 'right' ? 'slide-right' : '')
const previewCardWidth = ref(390)
const previewCardGap = ref(6)
const sliderViewportStyle = computed(() => (
  isMobile.value
    ? { width: '100%', overflow: 'visible', margin: '0 auto' }
    : { width: ((previewCardWidth.value * previewWindowSize) + (previewCardGap.value * (previewWindowSize - 1))) + 'px', overflow: 'hidden', margin: '0 auto' }
))
const sliderTrackStyle = computed(() => (
  isMobile.value
    ? { transform: 'none', transition: 'none' }
    : { transform: `translateX(-${previewWindowIndex.value * (previewCardWidth.value + previewCardGap.value)}px)`, transition: 'transform 0.45s ease-in-out' }
))
const suggestPreviewSlides = computed(() => {
  const base = ['dailyShop', 'collection', 'cosmetic', 'leaderboard', 'avatar', 'navbar']
  const hasVariants = Array.isArray(suggestVariants.value) && suggestVariants.value.length > 1
  return hasVariants ? [...base, 'popup-style'] : base
})
function getSuggestMaxStart() { return Math.max(0, suggestPreviewSlides.value.length - previewWindowSize) }
function prevSuggestPreview() { slideDirection.value = 'left'; previewWindowIndex.value = Math.max(0, previewWindowIndex.value - 1) }
function nextSuggestPreview() { slideDirection.value = 'right'; previewWindowIndex.value = Math.min(getSuggestMaxStart(), previewWindowIndex.value + 1) }
function isSlideVisible(key) {
  const idx = suggestPreviewSlides.value.indexOf(key)
  if (idx < 0) return false
  return idx >= previewWindowIndex.value && idx < (previewWindowIndex.value + previewWindowSize)
}
const suggestAssetSrc = ref('')
const suggestUrl = ref('')
const suggestPrice = ref(150)
const removeAvatarBorder = ref(false)
const removeLeaderboardBorder = ref(false)
const suggestStyles = ref({
  dailyShop: { top: 0, left: 0, width: 50, height: 50, rotate: 0, objectFit: 'contain', zIndex: 1, margin: 0, padding: 0, background: '', boxShadow: '', borderWidth: 0, borderStyle: 'none', borderColor: '', borderRadius: 0 },
  collectionPreviewDesktop: { top: 0, left: 0, width: 50, height: 50, rotate: 0, objectFit: 'contain', zIndex: 1, margin: 0, padding: 0, background: '', boxShadow: '', borderWidth: 0, borderStyle: 'none', borderColor: '', borderRadius: 0 },
  collectionPreviewMobile:  { top: 0, left: 0, width: 50, height: 50, rotate: 0, objectFit: 'contain', zIndex: 1, margin: 0, padding: 0, background: '', boxShadow: '', borderWidth: 0, borderStyle: 'none', borderColor: '', borderRadius: 0 },
  collectionPreview:        { top: 0, left: 0, width: 50, height: 50, rotate: 0, objectFit: 'contain', zIndex: 1, margin: 0, padding: 0, background: '', boxShadow: '', borderWidth: 0, borderStyle: 'none', borderColor: '', borderRadius: 0 },
  collection: { top: 0, left: 0, width: 50, height: 50, rotate: 0, objectFit: 'contain', zIndex: 1, margin: 0, padding: 0, background: '', boxShadow: '', borderWidth: 0, borderStyle: 'none', borderColor: '', borderRadius: 0 },
  leaderboard: { top: 0, left: 0, width: 50, height: 50, rotate: 0, objectFit: 'contain', zIndex: 1, margin: 0, padding: 0, background: '', boxShadow: '', borderWidth: 0, borderStyle: 'none', borderColor: '', borderRadius: 0 },
  avatar: { top: 0, left: 0, width: 50, height: 50, rotate: 0, objectFit: 'contain', zIndex: 1, margin: 0, padding: 0, background: '', boxShadow: '', borderWidth: 0, borderStyle: 'none', borderColor: '', borderRadius: 0 },
  navbar: { top: 0, left: 0, width: 50, height: 50, rotate: 0, objectFit: 'contain', zIndex: 1, margin: 0, padding: 0, background: '', boxShadow: '', borderWidth: 0, borderStyle: 'none', borderColor: '', borderRadius: 0 },
  popupStyle: { top: 0, left: 0, width: 50, height: 50, rotate: 0, objectFit: 'contain', zIndex: 1, margin: 0, padding: 0, background: '', boxShadow: '', borderWidth: 0, borderStyle: 'none', borderColor: '', borderRadius: 0 }
})
const suggestAvatarStageHeight = ref(250)
const DEFAULT_SUGGEST_STYLE = { top: 0, left: 0, width: 50, height: 50, rotate: 0, objectFit: 'contain', zIndex: 1, margin: 0, padding: 0, background: '', boxShadow: '', borderWidth: 0, borderStyle: 'none', borderColor: '', borderRadius: 0 }
const makeVariant = (name) => ({ name, assetSrc: '', styles: { dailyShop: { ...DEFAULT_SUGGEST_STYLE }, collectionPreviewDesktop: { ...DEFAULT_SUGGEST_STYLE }, collectionPreviewMobile: { ...DEFAULT_SUGGEST_STYLE }, collectionPreview: { ...DEFAULT_SUGGEST_STYLE }, collection: { ...DEFAULT_SUGGEST_STYLE }, leaderboard: { ...DEFAULT_SUGGEST_STYLE }, avatar: { ...DEFAULT_SUGGEST_STYLE }, navbar: { ...DEFAULT_SUGGEST_STYLE }, popupStyle: { ...DEFAULT_SUGGEST_STYLE } }, flags: { removeLeaderboardBorder: false, removeProfilePopupBorder: false, leaderboardPlacement: 'inside', profilePopupPlacement: 'inside', navbarPlacement: 'inside', largeAvatarHeight: 250 } })
const suggestVariants = ref([ makeVariant('Style 1') ])
const activeVariantIndex = ref(0)
function loadActiveVariantIntoBuffer() { try { const v = suggestVariants.value[activeVariantIndex.value]; if (!v) return; suggestStyles.value.dailyShop = { ...(v.styles.dailyShop || v.styles.dailyStyle || DEFAULT_SUGGEST_STYLE) }; suggestStyles.value.collectionPreviewDesktop = { ...(v.styles.collectionPreviewDesktop || v.styles.collectionPreview || v.styles.collection || DEFAULT_SUGGEST_STYLE) }; suggestStyles.value.collectionPreviewMobile = { ...(v.styles.collectionPreviewMobile || v.styles.collectionPreview || v.styles.collection || DEFAULT_SUGGEST_STYLE) }; suggestStyles.value.collectionPreview = (suggestDevice.value === 'mobile') ? suggestStyles.value.collectionPreviewMobile : suggestStyles.value.collectionPreviewDesktop; suggestStyles.value.collection = { ...v.styles.collection }; suggestStyles.value.leaderboard = { ...v.styles.leaderboard }; suggestStyles.value.avatar = { ...v.styles.avatar }; suggestStyles.value.navbar = { ...(v.styles.navbar || DEFAULT_SUGGEST_STYLE) }; suggestStyles.value.popupStyle = { ...(v.styles.popupStyle || DEFAULT_SUGGEST_STYLE) }; removeLeaderboardBorder.value = !!v.flags.removeLeaderboardBorder; removeAvatarBorder.value = !!v.flags.removeProfilePopupBorder; suggestPlacement.value = { leaderboard: String(v.flags.leaderboardPlacement || 'inside'), avatar: String(v.flags.profilePopupPlacement || 'inside'), navbar: String(v.flags.navbarPlacement || 'inside') }; suggestAvatarStageHeight.value = Number(v.flags.largeAvatarHeight || 250); suggestAssetSrc.value = v.assetSrc || '' } catch {} }
function persistBufferIntoActiveVariant() { try { const v = suggestVariants.value[activeVariantIndex.value]; if (!v) return; v.styles.dailyShop = { ...suggestStyles.value.dailyShop }; v.styles.collectionPreviewDesktop = { ...suggestStyles.value.collectionPreviewDesktop }; v.styles.collectionPreviewMobile = { ...suggestStyles.value.collectionPreviewMobile }; v.styles.collectionPreview = { ...suggestStyles.value.collectionPreview }; v.styles.collection = { ...suggestStyles.value.collection }; v.styles.leaderboard = { ...suggestStyles.value.leaderboard }; v.styles.avatar = { ...suggestStyles.value.avatar }; v.styles.navbar = { ...suggestStyles.value.navbar }; v.styles.popupStyle = { ...suggestStyles.value.popupStyle }; v.flags.removeLeaderboardBorder = !!removeLeaderboardBorder.value; v.flags.removeProfilePopupBorder = !!removeAvatarBorder.value; v.flags.leaderboardPlacement = String(suggestPlacement.value.leaderboard || 'inside'); v.flags.profilePopupPlacement = String(suggestPlacement.value.avatar || 'inside'); v.flags.navbarPlacement = String(suggestPlacement.value.navbar || 'inside'); v.flags.largeAvatarHeight = Number(suggestAvatarStageHeight.value || 250); v.assetSrc = suggestAssetSrc.value || '' } catch {} }
function selectVariant(i) { persistBufferIntoActiveVariant(); activeVariantIndex.value = i; loadActiveVariantIntoBuffer() }
function addVariant() { persistBufferIntoActiveVariant(); suggestVariants.value.push(makeVariant('Style ' + (suggestVariants.value.length + 1))); activeVariantIndex.value = suggestVariants.value.length - 1; loadActiveVariantIntoBuffer() }
function duplicateVariant() { persistBufferIntoActiveVariant(); const v = suggestVariants.value[activeVariantIndex.value]; const copy = JSON.parse(JSON.stringify(v)); copy.name = 'Style ' + (suggestVariants.value.length + 1); suggestVariants.value.push(copy); activeVariantIndex.value = suggestVariants.value.length - 1; loadActiveVariantIntoBuffer() }
function removeVariant() { if (suggestVariants.value.length <= 1) return; persistBufferIntoActiveVariant(); suggestVariants.value.splice(activeVariantIndex.value, 1); activeVariantIndex.value = Math.max(0, activeVariantIndex.value - 1); loadActiveVariantIntoBuffer() }
watch(removeAvatarBorder, (val) => { try { const v = suggestVariants.value[activeVariantIndex.value]; if (v && v.flags) v.flags.removeProfilePopupBorder = !!val } catch {} })
watch(removeLeaderboardBorder, (val) => { try { const v = suggestVariants.value[activeVariantIndex.value]; if (v && v.flags) v.flags.removeLeaderboardBorder = !!val } catch {} })
watch(suggestPrice, (val) => { try { const n = Number(val)||0; if (n < 150) suggestPrice.value = 150; else if (n > 500) suggestPrice.value = 500 } catch {} }, { immediate: true })
watch(() => suggestStyles.value.dailyShop, (val) => { try { const v = suggestVariants.value[activeVariantIndex.value]; if (v && v.styles) v.styles.dailyShop = { ...val } } catch {} }, { deep: true })
watch(() => suggestStyles.value.collectionPreview.width, (w) => { try { const s = suggestStyles.value.collectionPreview; s.height = Number(w) } catch {} })
watch(() => suggestStyles.value.collection.width, (w) => { try { const s = suggestStyles.value.collection; s.height = Number(w) } catch {} })
watch(() => suggestStyles.value.leaderboard.width, (w) => { try { const s = suggestStyles.value.leaderboard; s.height = Number(w) } catch {} })
watch(() => suggestStyles.value.popupStyle.width, (w) => { try { const s = suggestStyles.value.popupStyle; s.height = Number(w) } catch {} })
watch(() => suggestStyles.value.dailyShop.width, (w) => { try { const s = suggestStyles.value.dailyShop; s.height = Number(w) } catch {} })
watch(() => suggestStyles.value.avatar.width, (w) => { try { const s = suggestStyles.value.avatar; s.height = Number(w) } catch {} })
watch(() => suggestStyles.value.navbar.width, (w) => { try { const s = suggestStyles.value.navbar; s.height = Number(w) } catch {} })
const suggestPlacement = ref({ leaderboard: 'inside', avatar: 'inside', navbar: 'inside' })
loadActiveVariantIntoBuffer()
watch(suggestDevice, (dev, prev) => { try { const s = suggestStyles.value; if (dev === 'mobile') { if (!s.collectionPreviewMobile || ((Number(s.collectionPreviewMobile.top||0)===0) && (Number(s.collectionPreviewMobile.left||0)===0) && (Number(s.collectionPreviewMobile.width||50)===50) && (Number(s.collectionPreviewMobile.height||50)===50))) { s.collectionPreviewMobile = { ...s.collectionPreviewDesktop } } s.collectionPreview = s.collectionPreviewMobile } else { if (!s.collectionPreviewDesktop || ((Number(s.collectionPreviewDesktop.top||0)===0) && (Number(s.collectionPreviewDesktop.left||0)===0) && (Number(s.collectionPreviewDesktop.width||50)===50) && (Number(s.collectionPreviewDesktop.height||50)===50))) { s.collectionPreviewDesktop = { ...s.collectionPreviewMobile } } s.collectionPreview = s.collectionPreviewDesktop } } catch {} })
const hoverPlacementLeaderboard = ref(false)
const hoverPlacementAvatar = ref(false)
const hoverPlacementNavbar = ref(false)
const hoverToggleLeaderboard = ref(false)
const hoverToggleAvatar = ref(false)
function toggleBorder(target) {
  try {
    if (target === 'leaderboard') {
      removeLeaderboardBorder.value = !removeLeaderboardBorder.value
      const v = suggestVariants.value[activeVariantIndex.value]
      if (v && v.flags) v.flags.removeLeaderboardBorder = !!removeLeaderboardBorder.value
    } else {
      removeAvatarBorder.value = !removeAvatarBorder.value
      const v = suggestVariants.value[activeVariantIndex.value]
      if (v && v.flags) v.flags.removeProfilePopupBorder = !!removeAvatarBorder.value
    }
  } catch {}
}
const hoverCenterDaily = ref(false)
const hoverCenterCollectionPreview = ref(false)
const hoverCenterCollection = ref(false)
const hoverCenterLeaderboard = ref(false)
const hoverCenterAvatar = ref(false)
const hoverCenterPopup = ref(false)
const hoverCenterNavbar = ref(false)
function togglePlacement(target){ try { const p = suggestPlacement.value; p[target] = (p[target] === 'above') ? 'inside' : 'above'; const v = suggestVariants.value[activeVariantIndex.value]; if (v && v.flags) { if (target === 'leaderboard') v.flags.leaderboardPlacement = String(p[target]); else v.flags.profilePopupPlacement = String(p[target]); } } catch {} }
function getPlacementImg(target, hover){ try { const isAbove = (suggestPlacement.value && suggestPlacement.value[target] === 'above'); if (isAbove) return aboveIcon; return hover ? aboveIcon : insideIcon } catch { return insideIcon } }
function openSuggestEditor() { currentEditingLocalId.value = null; showSuggestionEditor.value = true; try { syncWeeklyHeight() } catch {} ; try { showPurchasePreview.value = true } catch { showPurchasePreview = true } ; try { suggestAssetSrc.value = ''; suggestUrl.value = ''; previewWindowIndex.value = 0; suggestDevice.value = 'desktop'; if (Array.isArray(suggestVariants.value)) { suggestVariants.value.forEach(v => { if (v) v.assetSrc = '' }) } resetSuggestUsers() } catch {} }
function closeSuggestEditor() { showSuggestionEditor.value = false }
function isUserItemCreator(item) {
  try {
    const u = authStore.user
    if (!u) return false
    const meta = item && item.meta
    if (isAdminOnly && isAdminOnly.value) return true
    const uid = Number((u && (u.id || u._id)) || NaN)
    const uname = normalizeUsernameForMatch((u && (u.username || u.name)) || '')
    if (Number.isFinite(uid) && (String(item && item.createdBy || '') === String(uid) || Number(item && item.createdBy) === uid)) return true
    if (meta) {
      if (Array.isArray(meta.creatorIds) && Number.isFinite(uid)) {
        if (meta.creatorIds.map((x) => Number(x)).includes(uid)) return true
      }
      if (Array.isArray(meta.creatorUsernames) && uname) {
        const match = meta.creatorUsernames.some(n => normalizeUsernameForMatch(n) === uname)
        if (match) return true
      }
    }
    try {
      const key = 'my-items-local-' + String((u && (u.id || u._id)) || 'anon')
      const raw = localStorage.getItem(key)
      const arr = raw ? JSON.parse(raw) : []
      const name = String(item && item.name || '').trim()
      const localId = item && item.meta && item.meta.localItemId
      const hasLocal = Array.isArray(arr) && arr.some(p => {
        const pname = String(p && p.name || '').trim()
        const plocalId = p && p.meta && p.meta.localItemId
        if (localId && plocalId) return String(plocalId) === String(localId)
        return pname === name && !!name
      })
      if (hasLocal) return true
    } catch {}
    try { /* ownership does not imply creator */ } catch {}
  } catch {}
  return false
}
function canEditItem(item) {
  try {
    if (!item || !item.isDynamic) return false
    return !!(isAdminOnly && isAdminOnly.value) || isUserItemCreator(item)
  } catch { return false }
}
function editUserItem(item) {
  try {
    if (!isUserItemCreator(item)) return
    openSuggestEditor()
    try { if (item && item.meta && item.meta.localItemId) currentEditingLocalId.value = item.meta.localItemId } catch {}
    try { suggestPrice.value = getItemPrice(item) } catch {}
    const variants = []
    if (Array.isArray(item.variants) && item.variants.length > 0) {
      for (const v of item.variants) {
        const a = Array.isArray(v.assets) ? v.assets[0] : null
        const col = (a && a.collectionStyle) || (a && a.style) || {}
        const colMobile = (a && a.collectionStyleMobile) || (a && a.collectionStyle) || (a && a.style) || {}
        const lead = (a && a.leaderboardStyle) || (a && a.style) || {}
        const nav = (a && a.navbarStyle) || (a && a.style) || {}
        const large = (a && a.largeAvatarStyle) || (a && a.profilePopupStyle) || (a && a.style) || {}
        const cosmetic = (a && a.cosmeticPreviewStyle) || (a && a.style) || {}
        const daily = (a && a.dailyStyle) || (a && a.style) || {}
        const flags = {
          removeLeaderboardBorder: !!(v && (v.removeLeaderboardBorder || v.removeNavbarBorder) || (item.meta && item.meta.removeLeaderboardBorder)),
          removeProfilePopupBorder: !!(v && (v.removeProfilePopupBorder || v.removeNavbarBorder) || (item.meta && (item.meta.removeProfilePopupBorder || item.meta.removeNavbarBorder))),
          leaderboardPlacement: String(((a && a.meta && a.meta.leaderboardPlacement) || (item.meta && item.meta.leaderboardPlacement) || 'inside')),
          profilePopupPlacement: String(((a && a.meta && (a.meta.profilePopupPlacement ?? a.meta.navbarPlacement)) || (item.meta && (item.meta.profilePopupPlacement ?? item.meta.navbarPlacement)) || 'inside')),
          navbarPlacement: String(((a && a.meta && a.meta.navbarPlacement) || (item.meta && item.meta.navbarPlacement) || 'inside')),
          largeAvatarHeight: Number(((a && a.meta && a.meta.largeAvatarHeight) || (item.meta && item.meta.largeAvatarHeight) || 250))
        }
        variants.push({ name: (v && v.name) || 'Style', assetSrc: (a && a.src) || '', styles: { dailyShop: { ...daily }, collectionPreviewDesktop: { ...col }, collectionPreviewMobile: { ...colMobile }, collection: { ...cosmetic }, leaderboard: { ...lead }, navbar: { ...nav }, avatar: { ...large } }, flags })
      }
    } else {
      const a = Array.isArray(item.assets) ? item.assets[0] : null
      const col = (a && a.collectionStyle) || (a && a.style) || {}
      const colMobile = (a && a.collectionStyleMobile) || (a && a.collectionStyle) || (a && a.style) || {}
      const lead = (a && a.leaderboardStyle) || (a && a.style) || {}
      const nav = (a && a.navbarStyle) || (a && a.style) || {}
      const large = (a && a.largeAvatarStyle) || (a && a.profilePopupStyle) || (a && a.style) || {}
      const cosmetic = (a && a.cosmeticPreviewStyle) || (a && a.style) || {}
      const pop = (a && a.popupStyleStyle) || (a && a.style) || {}
      const daily = (a && a.dailyStyle) || (a && a.style) || {}
      const flags = {
        removeLeaderboardBorder: !!(item.meta && item.meta.removeLeaderboardBorder),
        removeProfilePopupBorder: !!(item.meta && (item.meta.removeProfilePopupBorder || item.meta.removeNavbarBorder)),
        leaderboardPlacement: String(((a && a.meta && a.meta.leaderboardPlacement) || (item.meta && item.meta.leaderboardPlacement) || 'inside')),
        profilePopupPlacement: String(((a && a.meta && (a.meta.profilePopupPlacement ?? a.meta.navbarPlacement)) || (item.meta && (item.meta.profilePopupPlacement ?? item.meta.navbarPlacement)) || 'inside')),
        navbarPlacement: String(((a && a.meta && a.meta.navbarPlacement) || (item.meta && item.meta.navbarPlacement) || 'inside')),
        largeAvatarHeight: Number(((a && a.meta && a.meta.largeAvatarHeight) || (item.meta && item.meta.largeAvatarHeight) || 250))
      }
      variants.push({ name: 'Style 1', assetSrc: (a && a.src) || '', styles: { dailyShop: { ...daily }, collectionPreviewDesktop: { ...col }, collectionPreviewMobile: { ...colMobile }, collection: { ...cosmetic }, leaderboard: { ...lead }, navbar: { ...nav }, avatar: { ...large }, popupStyle: { ...pop } }, flags })
    }
    suggestVariants.value = variants.length ? variants : [ makeVariant('Style 1') ]
    activeVariantIndex.value = 0
    loadActiveVariantIntoBuffer()
    const a0 = (Array.isArray(item.variants) && item.variants[0] && Array.isArray(item.variants[0].assets)) ? item.variants[0].assets[0] : (Array.isArray(item.assets) ? item.assets[0] : null)
    try { suggestAssetSrc.value = resolveAssetSrc((a0 && a0.src) || '') } catch { suggestAssetSrc.value = (a0 && a0.src) || '' }
    try {
      const v = suggestVariants.value[activeVariantIndex.value]
      const lp = String(v && v.flags && v.flags.leaderboardPlacement || 'inside')
      const ap = String(v && v.flags && v.flags.profilePopupPlacement || 'inside')
      suggestPlacement.value = { leaderboard: lp, avatar: ap }
    } catch {}
    try {
      removeLeaderboardBorder.value = !!((item.meta && item.meta.removeLeaderboardBorder) || (Array.isArray(item.variants) && !!item.variants[activeVariantIndex.value]?.removeLeaderboardBorder))
      removeAvatarBorder.value = !!((item.meta && (item.meta.removeProfilePopupBorder || item.meta.removeNavbarBorder)) || (Array.isArray(item.variants) && (!!item.variants[activeVariantIndex.value]?.removeProfilePopupBorder || !!item.variants[activeVariantIndex.value]?.removeNavbarBorder)))
    } catch {}
  } catch {}
}
function exportUserItemJson(item) { try { const payload = { legacyId: (typeof item.legacyId !== 'undefined') ? item.legacyId : item.id, name: item.name || 'Suggestion', price: Number(item.price)||150, type: item.type || 'generic', assets: Array.isArray(item.assets) ? item.assets : [], backgrounds: item.backgrounds || {}, meta: item.meta || {}, variants: Array.isArray(item.variants) ? item.variants : [] }; const json = JSON.stringify(payload); const blob = new Blob([json], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = (payload.name || 'item') + '.json'; document.body.appendChild(a); a.click(); document.body.removeChild(a) } catch {} }
function isLocalUserItem(item) { try { const u = authStore.user; const uid = String((u && (u.id || u._id)) || 'anon'); const key = 'my-items-local-' + uid; let local = []; try { local = JSON.parse(localStorage.getItem(key) || '[]') } catch { local = [] } const lid = (typeof item.legacyId !== 'undefined') ? item.legacyId : item.id; const name = String(item.name || '').trim(); return (Array.isArray(local) ? local.some(p => { const pid = (typeof p.legacyId !== 'undefined') ? p.legacyId : p.id; const pname = String(p.name || '').trim(); const plocalId = p && p.meta && p.meta.localItemId; const ilocalId = item && item.meta && item.meta.localItemId; if (plocalId && ilocalId) return String(plocalId) === String(ilocalId); if (Number.isFinite(Number(lid))) return Number(pid) === Number(lid); return pname === name; }) : false) } catch { return false } }
async function deleteUserItem(item) { try { const legacyId = Number((typeof item.legacyId !== 'undefined') ? item.legacyId : item.id); let targetId = null; if (isAdminOnly && isAdminOnly.value) { try { const r = await secureApiCall(`/items/legacy/${legacyId}`); if (r && r.success && r.item && r.item._id) targetId = r.item._id } catch {} if (targetId) { const del = await secureApiCall(`/items/${targetId}`, { method: 'DELETE' }); if (del && del.success) { try { window.dispatchEvent(new CustomEvent('items-changed')) } catch {} } } } else if (isUserItemCreator(item)) { const serverItemId = item && item.meta && item.meta.serverItemId; if (serverItemId) targetId = serverItemId; if (!targetId) { try { const params = []; if (Number.isFinite(legacyId)) params.push(`legacyId=${legacyId}`); const locId = item && item.meta && item.meta.localItemId; if (locId) params.push(`localItemId=${encodeURIComponent(locId)}`); const res = await secureApiCall(`/items/suggest/resolve${params.length ? ('?' + params.join('&')) : ''}`); if (res && res.success && res.item && res.item._id) targetId = res.item._id } catch {} } if (!targetId) { try { const list = await secureApiCall(`/items?_=${Date.now()}`); const arr = (list && list.items) ? list.items : (Array.isArray(list) ? list : []); const u = authStore.user; const uid = String((u && (u.id || u._id)) || ''); const locId = item && item.meta && item.meta.localItemId; const name = String(item.name || '').trim(); const cand = Array.isArray(arr) ? arr.find(it => { const createdBy = String(it.createdBy || ''); const lid = Number((typeof it.legacyId === 'number' && !Number.isNaN(it.legacyId)) ? it.legacyId : NaN); const serverName = String(it.name || '').trim(); const plocal = it && it.meta && it.meta.localItemId; if (createdBy !== uid) return false; if (Number.isFinite(legacyId) && Number.isFinite(lid) && lid === legacyId) return true; if (locId && plocal && String(plocal) === String(locId)) return true; return serverName === name && !!name; }) : null; if (cand && cand._id) targetId = cand._id } catch {} } if (targetId) { const del2 = await secureApiCall(`/items/suggest/${targetId}`, { method: 'DELETE' }); if (del2 && del2.success) { try { window.dispatchEvent(new CustomEvent('items-changed')) } catch {} } } }
  const u = authStore.user; const uid = String((u && (u.id || u._id)) || 'anon'); const key = 'my-items-local-' + uid; let local = []; try { local = JSON.parse(localStorage.getItem(key) || '[]') } catch { local = [] } const name = String(item.name || '').trim(); const localId = item && item.meta && item.meta.localItemId; const filtered = (Array.isArray(local) ? local.filter(p => { const pid = (typeof p.legacyId !== 'undefined') ? p.legacyId : p.id; const pname = String(p.name || '').trim(); const plocalId = p && p.meta && p.meta.localItemId; const pserverId = p && p.meta && p.meta.serverItemId; const sameServer = !!(pserverId && ((item && item.meta && item.meta.serverItemId) ? String(pserverId) === String(item.meta.serverItemId) : (targetId ? String(pserverId) === String(targetId) : false))); if (sameServer) return false; if (localId && plocalId) return String(plocalId) !== String(localId); if (Number.isFinite(legacyId)) return Number(pid) !== legacyId; return pname !== name; }) : []); try { localStorage.setItem(key, JSON.stringify(filtered)) } catch {}
  const normId = Number((typeof item.legacyId !== 'undefined') ? item.legacyId : item.id); dynamicItems.value = (Array.isArray(dynamicItems.value) ? dynamicItems.value.filter(n => { const nid = Number((typeof n.legacyId !== 'undefined') ? n.legacyId : n.id); const nname = String(n.name || '').trim(); return (Number.isFinite(normId) ? nid !== normId : nname !== name) }) : []); try { if (Number.isFinite(normId)) dynamicInfoById.value.delete(Number(normId)) } catch {} try { if (name) dynamicInfoByName.value.delete(String(name)) } catch {} try { loadWeeklyItems() } catch {} localItemsUpdateKey.value++; try { await secureApiCall('/users/my-items', { method: 'DELETE', body: JSON.stringify({ legacyId: Number.isFinite(legacyId) ? legacyId : undefined, localItemId: localId || undefined, id: (typeof item.id === 'number' ? item.id : undefined), name }) }) } catch {} try { userServerLocalItems.value = (Array.isArray(userServerLocalItems.value) ? userServerLocalItems.value.filter(u => { const uid = (typeof u.legacyId !== 'undefined') ? u.legacyId : u.id; const ulocalId = u && u.meta && u.meta.localItemId; const uname = String(u.name || '').trim(); if (localId && ulocalId) return String(ulocalId) !== String(localId); if (Number.isFinite(legacyId)) return Number(uid) !== legacyId; return uname !== name; }) : []) } catch {} try { await loadUserServerLocalItems() } catch {} try { window.dispatchEvent(new CustomEvent('my-items-changed')) } catch {} alert('Item supprimé de vos items.') } catch {} }
function onSuggestFile(e) { try { const f = e.target.files && e.target.files[0]; if (!f) return; const reader = new FileReader(); reader.onload = () => { const data = reader.result; suggestAssetSrc.value = data; const v = suggestVariants.value[activeVariantIndex.value]; if (v) v.assetSrc = data }; reader.readAsDataURL(f) } catch {} }
function onSuggestUrl() { try { const u = String(suggestUrl.value || '').trim(); if (!u) return; const raw = u.split('?')[0]; const url = raw + (raw.startsWith('/uploads/') ? `?v=${Date.now()}` : ''); suggestAssetSrc.value = url; const v = suggestVariants.value[activeVariantIndex.value]; if (v) v.assetSrc = url } catch {} }
function centerSuggest(key) { try { const s = suggestStyles.value[key]; if (!s) return; const root = weeklyContainerRef.value; let el = null; if (key === 'leaderboard') { const sel = (suggestPlacement.value.leaderboard === 'above') ? '.preview-card.preview-leaderboard .leaderboard-item .user-avatar-container' : '.preview-card.preview-leaderboard .avatar-img'; el = root && root.querySelector(sel) } else if (key === 'avatar') { const sel = (suggestPlacement.value.avatar === 'above') ? '.preview-card.preview-avatar .profile-avatar-scaler' : '.preview-card.preview-avatar .avatar-img'; el = root && root.querySelector(sel) } else if (key === 'navbar') { const sel = (suggestPlacement.value.navbar === 'above') ? '.preview-card.preview-navbar .navbar-stage' : '.preview-card.preview-navbar .item-img-container'; el = root && root.querySelector(sel) } else if (key === 'dailyShop') { el = root && root.querySelector('.preview-card.preview-daily-shop .item-img-container') } else if (key === 'collectionPreview') { el = root && root.querySelector('.preview-card.preview-collection .item-img-container') } else if (key === 'popupStyle') { el = root && root.querySelector('.preview-card.preview-popup-style .item-img-container') } else { el = root && root.querySelector('.preview-card.preview-item .item-img-container') } const rect = el ? el.getBoundingClientRect() : null; const boxW = rect ? rect.width : (key === 'leaderboard' ? 57 : key === 'avatar' ? 150 : key === 'navbar' ? 51 : key === 'collectionPreview' ? (suggestDevice.value === 'mobile' ? 80 : 90) : key === 'popupStyle' ? 120.5 : key === 'dailyShop' ? 90 : 100); const boxH = rect ? rect.height : (key === 'leaderboard' ? 57 : key === 'avatar' ? 150 : key === 'navbar' ? 51 : key === 'collectionPreview' ? (suggestDevice.value === 'mobile' ? 80 : 90) : key === 'popupStyle' ? 64 : key === 'dailyShop' ? 90 : 100); const w = Number(s.width) || 50; const h = Number(s.height || s.width) || 50; s.left = Math.round((boxW - w) / 2); s.top = Math.round((boxH - h) / 2) } catch {} }
function getSuggestStyle(key) { try { const s = suggestStyles.value[key] || {}; const style = { position: 'absolute' }; if (typeof s.top === 'number') style.top = s.top + 'px'; if (typeof s.left === 'number') style.left = s.left + 'px'; if (typeof s.width === 'number') style.width = s.width + 'px'; if (typeof s.height === 'number') style.height = s.height + 'px'; if (typeof s.rotate === 'number') style.transform = `rotate(${s.rotate}deg)`; if (typeof s.zIndex === 'number') style.zIndex = s.zIndex; try { const p = suggestPlacement.value || {}; if (key === 'avatar' && p.avatar === 'above') { style.zIndex = Math.max(Number(style.zIndex || 0), 100) } if (key === 'leaderboard' && p.leaderboard === 'above') { style.zIndex = Math.max(Number(style.zIndex || 0), 100) } if (key === 'navbar' && p.navbar === 'above') { style.zIndex = Math.max(Number(style.zIndex || 0), 100) } } catch {} if (typeof s.objectFit === 'string') style.objectFit = s.objectFit; if (typeof s.margin === 'number') style.margin = s.margin + 'px'; if (typeof s.padding === 'number') style.padding = s.padding + 'px'; if (s.background) style.background = s.background; if (s.boxShadow) style.boxShadow = s.boxShadow; if (typeof s.borderWidth === 'number') style.borderWidth = s.borderWidth + 'px'; if (typeof s.borderStyle === 'string') style.borderStyle = s.borderStyle; if (s.borderColor) style.borderColor = s.borderColor; if (typeof s.borderRadius === 'number') style.borderRadius = s.borderRadius + 'px'; return style } catch { return { position: 'absolute' } } }
const suggestPreviewBorderColor = ref(null)
function refreshSuggestPreviewBorderColor() { try { const root = weeklyContainerRef.value; const sels = ['.preview-card.preview-collection .item-img-wrapper.large', '.preview-card.preview-daily-shop .item-img-wrapper.large', '.preview-card.preview-avatar .profile-avatar-stage']; let color = ''; for (const s of sels) { const el = root && root.querySelector(s); if (!el) continue; const cs = window.getComputedStyle(el); const c = cs.getPropertyValue('border-color') || cs.borderColor || ''; if (c && c !== 'transparent') { color = c; break } } suggestPreviewBorderColor.value = color || '#00FF80' } catch { suggestPreviewBorderColor.value = '#00FF80' } }
function getPopupWrapperStyle() { try { const c = suggestPreviewBorderColor.value || '#00FF80'; return { borderColor: c } } catch { return {} } }
const draggingKey = ref(null)
const dragStart = ref({ x: 0, y: 0 })
const initialPos = ref({ top: 0, left: 0 })
let rafId = null
function startDrag(key, e) { try { if (draggingKey.value === key) { endDrag(); return } draggingKey.value = key; dragStart.value = { x: e.clientX, y: e.clientY }; const s = suggestStyles.value[key] || {}; initialPos.value = { top: Number(s.top)||0, left: Number(s.left)||0 }; window.addEventListener('mousemove', onDrag, { passive: true }); setTimeout(() => { window.addEventListener('click', handleDropClick, { once: true }) }, 0) } catch {} }
function handleDropClick() { try { endDrag() } catch {} }
function onDrag(e) { try { if (!draggingKey.value) return; const key = draggingKey.value; const s = suggestStyles.value[key] || {}; const dx = e.clientX - dragStart.value.x; const dy = e.clientY - dragStart.value.y; if (rafId) cancelAnimationFrame(rafId); rafId = requestAnimationFrame(() => { s.left = initialPos.value.left + dx; s.top = initialPos.value.top + dy }) } catch {} }
function endDrag() { try { draggingKey.value = null; window.removeEventListener('mousemove', onDrag) } catch {} }
function startDragTouch(key, e) { try { const t = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]); if (!t) return; e.preventDefault(); if (draggingKey.value === key) { endDragTouch(); return } draggingKey.value = key; dragStart.value = { x: t.clientX, y: t.clientY }; const s = suggestStyles.value[key] || {}; initialPos.value = { top: Number(s.top)||0, left: Number(s.left)||0 }; window.addEventListener('touchmove', onDragTouch, { passive: false }); window.addEventListener('touchend', endDragTouch, { once: true }) } catch {} }
function onDragTouch(e) { try { if (!draggingKey.value) return; const t = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]); if (!t) return; e.preventDefault(); const key = draggingKey.value; const s = suggestStyles.value[key] || {}; const dx = t.clientX - dragStart.value.x; const dy = t.clientY - dragStart.value.y; if (rafId) cancelAnimationFrame(rafId); rafId = requestAnimationFrame(() => { s.left = initialPos.value.left + dx; s.top = initialPos.value.top + dy }) } catch {} }
function endDragTouch() { try { draggingKey.value = null; window.removeEventListener('touchmove', onDragTouch) } catch {} }
function saveSuggestion() {
  try {
    persistBufferIntoActiveVariant()
    const uidAtStart = String((authStore.user && (authStore.user.id || authStore.user._id)) || 'anon')
    const leaderboardPlacement = String(suggestPlacement.value.leaderboard || 'inside')
    const avatarPlacement = String(suggestPlacement.value.avatar || 'inside')
    const baseMeta = {
      leaderboardPlacement,
      leaderboardTarget: leaderboardPlacement === 'inside' ? 'user-avatar' : 'user-avatar-container',
      profilePopupPlacement: avatarPlacement,
      profilePopupTarget: avatarPlacement === 'inside' ? 'profile-avatar' : 'profile-avatar-scaler',
      navbarPlacement: String(suggestPlacement.value.navbar || 'inside'),
      navbarTarget: 'avatar-image-container',
      largeAvatarHeight: Number(suggestAvatarStageHeight.value || 250)
    }
    const baseAsset = {
      src: suggestAssetSrc.value || '',
      style: { top: 0, left: 0, width: 100 },
      collectionStyle: { ...(suggestStyles.value.collectionPreviewDesktop || suggestStyles.value.collectionPreview || suggestStyles.value.collection) },
      collectionStyleMobile: { ...(suggestStyles.value.collectionPreviewMobile || suggestStyles.value.collectionPreview || suggestStyles.value.collection) },
      leaderboardStyle: { ...suggestStyles.value.leaderboard },
      navbarStyle: { ...suggestStyles.value.navbar },
      navbarStyleMobile: { ...suggestStyles.value.navbar },
      largeAvatarStyle: { ...suggestStyles.value.avatar },
      largeAvatarStyleMobile: { ...suggestStyles.value.avatar },
      profilePopupStyle: { ...suggestStyles.value.avatar },
      popupStyleStyle: { ...DEFAULT_SUGGEST_STYLE },
      cosmeticPreviewStyle: { ...suggestStyles.value.collection },
      cosmeticPreviewStyleMobile: { ...suggestStyles.value.collection },
      dailyStyle: { ...suggestStyles.value.dailyShop },
      meta: { ...baseMeta }
    }
    const payload = {
      legacyId: null,
      name: 'Suggestion',
      price: Math.min(500, Math.max(150, Number(suggestPrice.value) || 0)),
      type: 'generic',
      assets: [baseAsset],
      backgrounds: { collection: null, leaderboard: null, avatar: null, navbar: null, 'popup-style': null, 'profile-popup': null },
      meta: { largeAvatarHeight: Number(suggestAvatarStageHeight.value || 250) },
      variants: suggestVariants.value.map(v => ({
        name: v.name || 'Style',
        assets: [{
          src: v.assetSrc || '',
          style: { top: 0, left: 0, width: 100 },
          collectionStyle: { ...(v.styles.collectionPreviewDesktop || v.styles.collectionPreview || v.styles.collection) },
          collectionStyleMobile: { ...(v.styles.collectionPreviewMobile || v.styles.collectionPreview || v.styles.collection) },
          leaderboardStyle: { ...v.styles.leaderboard },
          navbarStyle: { ...v.styles.navbar },
          navbarStyleMobile: { ...v.styles.navbar },
          largeAvatarStyle: { ...v.styles.avatar },
          largeAvatarStyleMobile: { ...v.styles.avatar },
          profilePopupStyle: { ...v.styles.avatar },
          popupStyleStyle: { ...v.styles.popupStyle },
          cosmeticPreviewStyle: { ...v.styles.collection },
          cosmeticPreviewStyleMobile: { ...v.styles.collection },
          dailyStyle: { ...v.styles.dailyShop },
          meta: {
            leaderboardPlacement: String(v.flags.leaderboardPlacement || 'inside'),
            leaderboardTarget: (String(v.flags.leaderboardPlacement || 'inside') === 'inside') ? 'user-avatar' : 'user-avatar-container',
            profilePopupPlacement: String(v.flags.profilePopupPlacement || 'inside'),
            profilePopupTarget: (String(v.flags.profilePopupPlacement || 'inside') === 'inside') ? 'profile-avatar' : 'profile-avatar-scaler',
            navbarPlacement: String(v.flags.navbarPlacement || 'inside'),
            navbarTarget: 'avatar-image-container',
            largeAvatarHeight: Number(v.flags.largeAvatarHeight || suggestAvatarStageHeight.value || 250)
          }
        }],
        backgrounds: { collection: null, leaderboard: null, avatar: null, 'popup-style': null, 'profile-popup': null },
        removeLeaderboardBorder: !!v.flags.removeLeaderboardBorder,
        removeProfilePopupBorder: !!v.flags.removeProfilePopupBorder
      }))
    }
    try {
      const u = authStore.user
      const creatorIds = []
      const numId = Number((u && (u.id || u._id)) || NaN)
      if (Number.isFinite(numId)) creatorIds.push(numId)
      const creatorNames = []
      const uname = (u && (u.username || u.name)) || ''
      if (uname) creatorNames.push(uname)
      payload.meta.creatorIds = Array.isArray(payload.meta.creatorIds) ? payload.meta.creatorIds : []
      payload.meta.creatorUsernames = Array.isArray(payload.meta.creatorUsernames) ? payload.meta.creatorUsernames : []
      payload.meta.creatorIds = [...new Set([...payload.meta.creatorIds, ...creatorIds])]
      payload.meta.creatorUsernames = [...new Set([...payload.meta.creatorUsernames, ...creatorNames])]
    } catch {}
    const preLocalId = currentEditingLocalId.value ? String(currentEditingLocalId.value) : ('local-' + Date.now() + '-' + Math.floor(Math.random()*1000))
    if (!payload.meta || typeof payload.meta !== 'object') payload.meta = {}
    if (!payload.meta.localItemId) payload.meta.localItemId = preLocalId

    ;(async () => {
      if (isAdminOnly && isAdminOnly.value) {
        try {
          const res = await secureApiCall('/items', { method: 'POST', body: JSON.stringify(payload) })
          if (res && res.success) {
            alert('Item créé')
            try { window.dispatchEvent(new CustomEvent('items-changed')) } catch {}
            try { await loadDynamicItems() } catch {}
            return
          }
        } catch {}
      } else {
        // Pour les non-admins, envoyer une suggestion au serveur
        try {
          const res = await secureApiCall('/items/suggest', { method: 'POST', body: JSON.stringify(payload) })
          if (res && res.success) {
            try {
              if (res.item) {
                if (!payload.meta || typeof payload.meta !== 'object') payload.meta = {}
                payload.meta.serverItemId = res.item._id
                if (typeof res.item.legacyId === 'number' && !Number.isNaN(res.item.legacyId)) {
                  payload.legacyId = Number(res.item.legacyId)
                  payload.id = Number(res.item.legacyId)
                }
              }
            } catch {}
            try { await loadDynamicItems() } catch {}
            alert('Item enregistré et visible dans la Collection')
          } else {
            console.error('Erreur suggestion:', res)
          }
        } catch (e) {
          console.error('Erreur envoi suggestion:', e)
        }
      }

      try {
        const u = authStore.user
        const uid = String((u && (u.id || u._id)) || 'anon')
        const key = 'my-items-local-' + uid
        let arr = []
        try { arr = JSON.parse(localStorage.getItem(key) || '[]') } catch { arr = [] }
        
        // Note: localItemId est déjà dans payload.meta grâce au bloc avant l'async

        // Déterminer/attribuer un identifiant local stable
        const existing = Array.isArray(arr) ? arr.find(p => {
          const plocalId = p && p.meta && p.meta.localItemId
          const pname = String(p && p.name || '').trim()
          const name = String(payload.name || '').trim()
          // Match par ID local prioritaire
          if (plocalId && payload.meta && payload.meta.localItemId) {
             return String(plocalId) === String(payload.meta.localItemId)
          }
          // IMPORTANT: Ne pas matcher par nom si le nom est générique "Suggestion" pour permettre plusieurs suggestions distinctes
          if (name === 'Suggestion') return false
          return pname === name
        }) : null
        
        const localId = existing && existing.meta && existing.meta.localItemId ? existing.meta.localItemId : (payload.meta && payload.meta.localItemId ? payload.meta.localItemId : ('local-' + Date.now() + '-' + Math.floor(Math.random()*1000)))
        if (!payload.meta || typeof payload.meta !== 'object') payload.meta = {}
        payload.meta.localItemId = localId
        
        // Upsert dans le tableau local
        const idx = Array.isArray(arr) ? arr.findIndex(p => {
          const plocalId = p && p.meta && p.meta.localItemId
          // On ne remplace par nom que si ce n'est pas "Suggestion"
          return plocalId ? String(plocalId) === String(localId) : (String(payload.name || '') !== 'Suggestion' && String(p.name || '').trim() === String(payload.name || '').trim())
        }) : -1
        
        if (idx >= 0) { arr.splice(idx, 1, payload) } else { arr.push(payload) }
        try { localStorage.setItem(key, JSON.stringify(arr)) } catch {}
        
        // Forcer la mise à jour de la collection pour inclure l'item local
        localItemsUpdateKey.value++
        try { await secureApiCall('/users/my-items', { method: 'PUT', body: JSON.stringify({ item: payload }) }) } catch {}
        try { window.dispatchEvent(new CustomEvent('my-items-changed')) } catch {}
        try { await secureApiCall('/users/suggest-editor-state', { method: 'PUT', body: JSON.stringify({ variants: suggestVariants.value, activeIndex: activeVariantIndex.value }) }) } catch {}
        try {
          const u2 = authStore.user
          const uid2 = String((u2 && (u2.id || u2._id)) || 'anon')
          const k2 = 'suggest-editor-state-' + uid2
          localStorage.setItem(k2, JSON.stringify({ variants: suggestVariants.value, activeIndex: activeVariantIndex.value }))
        } catch {}

        if (!isAdminOnly || !isAdminOnly.value) {
            
        }
      } catch {}
    })()
  } catch {}
}
async function restoreSuggestEditorState() { try { const res = await secureApiCall('/users/suggest-editor-state'); const st = (res && res.state) ? res.state : res; if (st && typeof st === 'object' && Array.isArray(st.variants) && st.variants.length) { suggestVariants.value = st.variants; activeVariantIndex.value = Number(st.activeIndex || 0); loadActiveVariantIntoBuffer(); return } } catch {} try { const u = authStore.user; const uid = String((u && (u.id || u._id)) || 'anon'); const key = 'suggest-editor-state-' + uid; const raw = localStorage.getItem(key); if (!raw) return; const st = JSON.parse(raw); if (st && typeof st === 'object' && Array.isArray(st.variants) && st.variants.length) { suggestVariants.value = st.variants; activeVariantIndex.value = Number(st.activeIndex || 0); loadActiveVariantIntoBuffer() } } catch {} }
const defaultSuggestUsers = () => ([{ id: 'you', name: 'Vous', isYou: true }])
const suggestLeaderboardUsers = ref(defaultSuggestUsers())

function resetSuggestUsers() { try { suggestLeaderboardUsers.value = defaultSuggestUsers() } catch {} }
function clearSearch() {
  try { searchQuery.value = '' } catch {}
  try { if (searchInputRef.value) searchInputRef.value.focus() } catch {}
}
const showMyItemsPanel = ref(false)
function toggleMyItemsPanel() { try { showMyItemsPanel.value = !showMyItemsPanel.value; if (showMyItemsPanel.value) { showSuggestionEditor.value = false; try { loadUserServerLocalItems() } catch {} } } catch {} }
const myCreatedItems = computed(() => {
  try {
    const arr = collectionItems.value || []
    return arr.filter(it => isUserItemCreator(it) || it.isLocal)
  } catch { return [] }
})

function getStableItemId(it) {
  try {
    const id = (it && (it.legacyId !== undefined ? it.legacyId : it.id))
    return Number(id)
  } catch { return NaN }
}
function isFavoriteById(id) {
  try { return typeof coinsStore.isFavorite === 'function' ? coinsStore.isFavorite(Number(id)) : (Array.isArray(coinsStore.favorites) ? coinsStore.favorites.includes(Number(id)) : false) } catch { return false }
}
function toggleFavoriteByItem(item) {
  const id = getStableItemId(item)
  if (!Number.isFinite(id)) return
  try { coinsStore.toggleFavorite && coinsStore.toggleFavorite(Number(id)) } catch {}
}
function getFavoriteIconSrc(id, hovered) {
  return (hovered || isFavoriteById(id)) ? bookmarksRemplie : bookmarksVide
}

const filteredCollectionItems = computed(() => {
  const all = collectionItems.value.slice()
  const q = searchQuery.value.trim().toLowerCase()
  let filtered = q ? all.filter(it => String(it?.name || '').toLowerCase().includes(q)) : all
  if (showFavoritesOnly.value) {
    filtered = filtered.filter(it => isFavoriteById(getStableItemId(it)))
  }

  const isBorderItem = (it) => Number(it?.id) === 0 || String(it?.name || '').toLowerCase() === 'bordure classique'
  const borderIndex = filtered.findIndex(isBorderItem)
  const equippedIndex = filtered.findIndex(it => coinsStore.isItemEquipped(it.id))

  if (equippedIndex !== -1) {
    const equipped = filtered[equippedIndex]
    if (!isBorderItem(equipped)) {
      filtered.splice(equippedIndex, 1)
      const insertIndex = borderIndex !== -1 ? (borderIndex + 1) : 0
      filtered.splice(insertIndex, 0, equipped)
    }
  }
  return filtered
})

// Computed properties réactives pour les variantes dynamiques
const getDynVariantAssetsReactive = (item) => {
  return computed(() => {
    try {
      const itemId = (typeof item.legacyId !== 'undefined') ? item.legacyId : item.id
      const variantIndex = coinsStore.getDynamicItemVariant(itemId)
      const variant = item.variants && item.variants[variantIndex]
      if (!variant || !Array.isArray(variant.assets)) return []
      return variant.assets
    } catch (e) {
      return []
    }
  })
}

const getDynVariantBgStyleReactive = (item) => {
  return computed(() => {
    try {
      const itemId = (typeof item.legacyId !== 'undefined') ? item.legacyId : item.id
      const variantIndex = coinsStore.getDynamicItemVariant(itemId)
      const variant = item.variants && item.variants[variantIndex]
      if (!variant || !variant.backgrounds) return { display: 'none' }
      const bg = variant.backgrounds.collection || null
      if (!bg) return { display: 'none' }
      return { position: 'absolute', inset: '0', background: bg, zIndex: 0, pointerEvents: 'none' }
    } catch (e) {
      return { display: 'none' }
    }
  })
}

function resolveAssetSrc(path) {
  try {
    if (typeof path !== 'string' || !path) return ''
    // URL absolue déjà valide
    if (/^https?:\/\//i.test(path)) return path
    // Normaliser le chemin uploads (ajouter le slash manquant)
    let p = path.startsWith('/uploads/') ? path : (path.startsWith('uploads/') ? '/' + path : path)
    // Si ce n'est pas un chemin d'uploads, on retourne tel quel (ex: data:, base64, autre chemin interne)
    if (!p.startsWith('/uploads/')) return p
    // Base depuis API_URL corrigée (schéma + host, sans /api final)
    let base = (API_URL || '').replace(/\/?api\/?$/i, '')
    if (!/^https?:\/\//i.test(base)) {
      // Corriger un schéma tronqué éventuel (ex: "https//...")
      base = base.replace(/^([a-z]+)(?=\/\/)/i, '$1:')
    }
    // Fallback: origin du site si base invalide
    if (!/^https?:\/\//i.test(base)) {
      try { base = window.location.origin } catch { base = '' }
    }
    // Retourner une URL absolue propre sans double slash
    return (base.replace(/\/$/, '')) + p
  } catch {}
  return path || ''
}

const isMobile = ref(false)
function updateIsMobile() {
  try {
    if (window && typeof window.matchMedia === 'function') {
      isMobile.value = window.matchMedia('(max-width: 1024px)').matches
    } else {
      isMobile.value = window.innerWidth <= 1024
    }
  } catch {
    isMobile.value = false
  }
}
onMounted(() => {
  updateIsMobile()
  try { window.addEventListener('resize', updateIsMobile) } catch {}
  // recharger les items dynamiques quand l'éditeur sauvegarde
  try { window.addEventListener('items-changed', loadDynamicItems) } catch {}
  try { window.addEventListener('my-items-changed', loadUserServerLocalItems) } catch {}
  // Charger les variantes dynamiques depuis le store
  try { coinsStore.loadDynamicItemVariants() } catch {}
  try { if (authStore.isLoggedIn) loadUserServerLocalItems() } catch {}
  // Charger les favoris depuis le backend (fallback local si indisponible)
  try { if (authStore.isLoggedIn) coinsStore.loadFavorites && coinsStore.loadFavorites() } catch {}
  // Écouter les changements de variantes pour forcer le re-render des items hebdomadaires
  try { 
    window.addEventListener('dynamic-variant-changed', (event) => { 
      // Forcer le re-render de la boutique hebdo
      variantUpdateKey.value++
    }) 
  } catch {}
  // Écouter les updates de note publique des utilisateurs (profil/leaderboard)
  try { window.addEventListener('user-public-note-changed', handleUserPublicNoteChanged) } catch {}
})
// Charger toutes les données de la boutique à l'ouverture de la popup
watch(() => props.show, (v) => {
  if (v && authStore.isLoggedIn) {
    loadWeeklyItems();
    loadLeaderboardUsers();
    loadUserFaction();
    loadFactionUsers();
    updateWeeklyTimer();
    loadDynamicItems();
    loadUserServerLocalItems();
    updateFactionTimer();
    triggerMonthlyFactionBalanceIfNeeded();
    if (!factionTimerId) {
      factionTimerId = window.setInterval(updateFactionTimer, 1000)
    }
  }
})
onUnmounted(() => {
  try { window.removeEventListener('resize', updateIsMobile) } catch {}
  try { window.removeEventListener('items-changed', loadDynamicItems) } catch {}
  try { window.removeEventListener('dynamic-variant-changed', () => {}) } catch {}
  try { window.removeEventListener('user-public-note-changed', handleUserPublicNoteChanged) } catch {}
})

async function loadUserServerLocalItems(){ try{ const res=await secureApiCall('/users/my-items'); const arr=(res&&res.items)?res.items:(Array.isArray(res)?res:[]); userServerLocalItems.value=Array.isArray(arr)?arr.map((p,idx)=>({ id:(typeof p.legacyId!=='undefined')?p.legacyId:((typeof p.id!=='undefined')?p.id:(100000+idx)), name:p.name||'Suggestion', price:Number(p.price)||0, isDynamic:true, isLocal:true, assets:Array.isArray(p.assets)?p.assets:[], backgrounds:p.backgrounds||{}, variants:Array.isArray(p.variants)?p.variants:[], meta:p.meta||{} })):[]; try{ const u=authStore.user; const uid=String((u&&(u.id||u._id))||'anon'); const key='my-items-local-'+uid; const raw=localStorage.getItem(key); const localArr=raw?JSON.parse(raw):[]; const serverIds=new Set(arr.map(p=>String((p&&p.meta&&p.meta.serverItemId)||'')).filter(Boolean)); const cleaned=Array.isArray(localArr)?localArr.filter(p=>{ const sid=p&&p.meta&&p.meta.serverItemId?String(p.meta.serverItemId):''; if (sid) return serverIds.has(sid); return true; }):[]; localStorage.setItem(key, JSON.stringify(cleaned)); try { const rAnon = localStorage.getItem('my-items-local-anon'); const anonArr = rAnon ? JSON.parse(rAnon) : []; if (Array.isArray(anonArr) && anonArr.length) { const merged = Array.isArray(cleaned) ? [...cleaned, ...anonArr] : anonArr; localStorage.setItem(key, JSON.stringify(merged)); localStorage.removeItem('my-items-local-anon'); } } catch {} }catch{} }catch{ userServerLocalItems.value=[] } }
function getDynAssetStyle(asset) {
  const mobile = !!isMobile.value
  const isWeekly = (activeTab && activeTab.value === 'weekly')
  const s = isWeekly
    ? ((asset && asset.dailyStyle) || asset?.style || {})
    : (mobile
      ? ((asset && asset.collectionStyleMobile) || asset?.collectionStyle || asset?.style || {})
      : ((asset && asset.collectionStyle) || asset?.style || {})
    )
  const style = { position: 'absolute', objectFit: s.objectFit || 'contain', zIndex: typeof s.zIndex === 'number' ? s.zIndex : 1 }
  if (typeof s.top === 'number') style.top = s.top + 'px'
  if (typeof s.left === 'number') style.left = s.left + 'px'
  if (typeof s.width === 'number') style.width = s.width + 'px'
  if (typeof s.height === 'number') style.height = s.height + 'px'
  if (typeof s.rotate === 'number') style.transform = `rotate(${s.rotate}deg)`
  return style
}

// Semaine: calque exactement le rendu Collection (desktop/mobile)
function getDynWeeklyAssetStyle(asset) {
  return getDynAssetStyle(asset)
}

function getDynLeaderboardAssetStyle(asset) {
  if (!asset || typeof asset !== 'object') {
    return { position: 'absolute', objectFit: 'contain', zIndex: 1 }
  }
  const s = (asset && asset.leaderboardStyle) || asset?.style || {}
  const placement = asset && asset.meta && asset.meta.leaderboardPlacement
  const baseZ = typeof s.zIndex === 'number' ? s.zIndex : (placement === 'above' ? 100 : 15)
  const style = { position: 'absolute', objectFit: s.objectFit || 'contain', zIndex: baseZ }
  if (placement === 'above') style.zIndex = Math.max(Number(style.zIndex || 0), 100)
  if (typeof s.top === 'number') style.top = s.top + 'px'
  if (typeof s.left === 'number') style.left = s.left + 'px'
  if (typeof s.width === 'number') style.width = s.width + 'px'
  if (typeof s.height === 'number') style.height = s.height + 'px'
  if (typeof s.rotate === 'number') style.transform = `rotate(${s.rotate}deg)`
  return style
}

// Classe CSS pour mimer l'effet "Discord/Galaxie" depuis un item dynamique ciblant le conteneur
function getDynLeaderboardAssetClass(asset) {
  try {
    const base = String(asset && asset.meta && asset.meta.dynamicClass || '').trim()
    if (base) return base
  } catch {}
  // Par défaut, ne pas appliquer de classe afin de respecter les styles définis via l'éditeur
  return ''
}

// AJOUT: Helpers Profil Pop-up (onglet leaderboard)
function getEffectiveProfilePopupTarget(item, asset) {
  try {
    // Priorité: cible explicite (asset > item)
    const explicit = asset && asset.meta && asset.meta.profilePopupTarget
    if (explicit) return String(explicit)
    const itemLevel = item && item.meta && item.meta.profilePopupTarget
    if (itemLevel) return String(itemLevel)

    // Heuristique legacy: si largeAvatarStyle non-défaut et aucune cible explicite → scaler
    const mobile = !!isMobile.value
    const s = mobile ? (asset?.largeAvatarStyleMobile || asset?.largeAvatarStyle) : (asset?.largeAvatarStyle)
    const t = typeof s?.top === 'number' ? s.top : 0
    const l = typeof s?.left === 'number' ? s.left : 0
    const w = typeof s?.width === 'number' ? s.width : 100
    const r = typeof s?.rotate === 'number' ? s.rotate : 0
    const nonDefault = !(t === 0 && l === 0 && w === 100 && r === 0)
    if (nonDefault) return 'profile-avatar-scaler'

    // Fallbacks compat
    const nb = (asset && asset.meta && asset.meta.navbarTarget) || (item && item.meta && item.meta.navbarTarget)
    if (nb === 'avatar-image-container') return 'profile-avatar'
    if (nb === 'user-account-wrapper' || nb === 'account-btn') return 'profile-avatar-scaler'
    const legacy = asset && asset.meta && asset.meta.container
    if (legacy === 'user-avatar-container') return 'profile-avatar-scaler'
  } catch {}
  return 'profile-avatar'
}

function getProfilePopupAssetsUnified(item) {
  if (item && Array.isArray(item.variants) && item.variants.length > 0) {
    return getDynVariantAssets(item)
  }
  return Array.isArray(item && item.assets) ? item.assets : []
}

function getProfilePopupAssetsForTargetPlacement(item, target, placement) {
  try {
    const arr = getProfilePopupAssetsUnified(item)
    return (Array.isArray(arr) ? arr : []).filter((a) => {
      const t = getEffectiveProfilePopupTarget(item, a)
      if (t !== target) return false
      const itemPlacement = item && item.meta && item.meta.profilePopupPlacement
      const p = (a && a.meta && (a.meta.profilePopupPlacement ?? a.meta.navbarPlacement)) ?? itemPlacement ?? 'below'
      return p === placement
    })
  } catch { return [] }
}

function getDynProfilePopupAssetStyle(asset) {
  const isDefault = (s) => {
    if (!s || typeof s !== 'object') return true
    const t = typeof s.top === 'number' ? s.top : 0
    const l = typeof s.left === 'number' ? s.left : 0
    const w = typeof s.width === 'number' ? s.width : 100
    const r = typeof s.rotate === 'number' ? s.rotate : 0
    return t === 0 && l === 0 && w === 100 && r === 0
  }
  
  // Priorité à largeAvatarStyle si défini (non-défaut), sinon profilePopupStyle
  const mobile = !!isMobile.value
  const largeStyle = mobile ? (asset?.largeAvatarStyleMobile || asset?.largeAvatarStyle) : asset?.largeAvatarStyle
  const largeIsSet = largeStyle && !isDefault(largeStyle)
  const useLarge = largeIsSet
  
  const s = (asset && (useLarge ? largeStyle : asset.profilePopupStyle)) || asset?.leaderboardStyle || asset?.navbarStyle || asset?.style || {}
  
  const style = { position: 'absolute', objectFit: s.objectFit || 'contain', zIndex: typeof s.zIndex === 'number' ? s.zIndex : undefined, pointerEvents: 'none' }

  // Positions initiales
  let top = typeof s.top === 'number' ? s.top : undefined
  let left = typeof s.left === 'number' ? s.left : undefined

  if (useLarge && asset && asset.meta && asset.meta.profilePopupTarget === 'profile-avatar') { }

  if (typeof top === 'number') style.top = top + 'px'
  if (typeof left === 'number') style.left = left + 'px'
  if (typeof s.width === 'number') style.width = s.width + 'px'
  if (typeof s.height === 'number') style.height = s.height + 'px'
  if (typeof s.rotate === 'number') style.transform = `rotate(${s.rotate}deg)`
  {
    const placement = asset && asset.meta && (asset.meta.profilePopupPlacement ?? asset.meta.navbarPlacement)
    style.zIndex = Math.max(Number(style.zIndex || 0), placement === 'above' ? 18 : 1)
  }
  return style
}

function getLargeAvatarHeight(item) {
  try {
    const name = String(item?.name || '').toLowerCase()
    const displayType = String(item?.displayType || '').toLowerCase()
    if (name === 'roi' || displayType === 'roi') return 400
    if (name === 'gentleman' || displayType === 'gentleman') return 400
    if (name === 'ange' || displayType === 'angel') return 400
    if (name === 'tomb raider' || displayType === 'tomb-raider') return 400
    if (name === 'vinyle' || displayType === 'vinyle') return 400
    if (name === '2000' || displayType === 'nokia') return 400

    const arr = getProfilePopupAssetsUnified(item)
    if (Array.isArray(arr)) {
      for (const a of arr) {
        const h = a && a.meta && a.meta.largeAvatarHeight
        const n = Number(h)
        if (Number.isFinite(n)) return Math.max(250, Math.min(400, n))
      }
    }
    const ih = item && item.meta && item.meta.largeAvatarHeight
    const ni = Number(ih)
    if (Number.isFinite(ni)) return Math.max(250, Math.min(400, ni))
  } catch {}
  return 250
}

// Helpers: assets pour l'aperçu Leaderboard (filtrés par cible et placement)
function getLeaderboardPreviewAssetsUnified(item) {
  try {
    if (!item) return []
    if (Array.isArray(item.variants) && item.variants.length > 0) {
      return getDynVariantAssetsForLeaderboard(authStore.user, item)
    }
    return Array.isArray(item.assets) ? item.assets : []
  } catch { return [] }
}
function getLeaderboardPreviewAssetsForTargetPlacement(item, target, placement) {
  try {
    const arr = getLeaderboardPreviewAssetsUnified(item)
    const owner = authStore.user
    return (Array.isArray(arr) ? arr : []).filter((a) => {
      const t = getEffectiveLeaderboardTarget(item, a, owner)
      if (t !== target) return false
      const p = (a && a.meta && a.meta.leaderboardPlacement) || 'below'
      return p === placement
    })
  } catch { return [] }
}

// Détermine si la bordure doit être retirée dans la pop-up Profil (aligné avec Navbar.vue)
function shouldRemoveProfilePopupBorder(item) {
  try {
    if (!item) return false
    const itemId = (item.legacyId !== undefined) ? item.legacyId : item.id
    const vi = (typeof coinsStore.getDynamicItemVariant === 'function') ? coinsStore.getDynamicItemVariant(itemId) : 0
    const variant = Array.isArray(item.variants) ? item.variants[vi] : null
    if (variant && (variant.removeProfilePopupBorder === true)) return true
    if (item.meta && (item.meta.removeProfilePopupBorder === true)) return true
    if (item.name === 'Discord' || item.displayType === 'discord') return true
  } catch {}
  return false
}

// Retire la bordure dans le leaderboard si la variante ou l'item le demandent
function shouldRemoveLeaderboardBorder(item, owner) {
  try {
    if (!item) return false
    const itemId = (item.legacyId !== undefined) ? item.legacyId : item.id

    // Résoudre l'index de variante d'abord depuis l'owner, puis fallback store
    let vi
    try {
      const userVariants = owner && owner.dynamicItemVariants
      if (userVariants) {
        if (typeof userVariants.get === 'function') {
          const got = userVariants.get(String(itemId))
          if (Number.isFinite(got)) vi = got
        } else {
          const got = userVariants[String(itemId)]
          if (Number.isFinite(got)) vi = got
        }
      }
    } catch {}
    if (!Number.isFinite(vi) && typeof coinsStore.getDynamicItemVariant === 'function') {
      const fromStore = coinsStore.getDynamicItemVariant(itemId)
      vi = Number.isFinite(fromStore) ? fromStore : 0
    } else if (!Number.isFinite(vi)) {
      vi = 0
    }

    const variant = Array.isArray(item.variants) ? item.variants[vi] : null
    if (variant && (variant.removeLeaderboardBorder === true)) return true
    if (item.meta && (item.meta.removeLeaderboardBorder === true)) return true
    if (item.name === 'Discord' || item.displayType === 'discord') return true
  } catch {}
  return false
}

function showBorderForDynEquippedItem(item, owner) {
  try {
    if (!item) return false
    const itemId = (item.legacyId !== undefined) ? item.legacyId : item.id

    let vi
    try {
      const userVariants = owner && owner.dynamicItemVariants
      if (userVariants) {
        if (typeof userVariants.get === 'function') {
          const got = userVariants.get(String(itemId))
          if (Number.isFinite(got)) vi = got
        } else {
          const got = userVariants[String(itemId)]
          if (Number.isFinite(got)) vi = got
        }
      }
    } catch {}
    if (!Number.isFinite(vi) && typeof coinsStore.getDynamicItemVariant === 'function') {
      const fromStore = coinsStore.getDynamicItemVariant(itemId)
      vi = Number.isFinite(fromStore) ? fromStore : 0
    } else if (!Number.isFinite(vi)) {
      vi = 0
    }

    const variant = Array.isArray(item.variants) ? item.variants[vi] : null
    // Retirer la bordure si demandé par la variante ou l'item
    if (variant && (variant.removeLeaderboardBorder === true)) return false
    if (item.meta && (item.meta.removeLeaderboardBorder === true)) return false
    return true
  } catch {}
  return true
}

// Style spécial pour les items dynamiques qui ciblent user-avatar-container avec placement "above"
// Ces items sont placés en dehors du conteneur pour éviter les contraintes d'overflow
function getDynLeaderboardContainerOverlayStyle(asset) {
  if (!asset || typeof asset !== 'object') {
    return { position: 'absolute', objectFit: 'contain', zIndex: 100, pointerEvents: 'none' }
  }
  const s = (asset && asset.leaderboardStyle) || asset?.style || {}
  // Position absolue par rapport à user-info, avec un z-index très élevé
  const style = { 
    position: 'absolute', 
    objectFit: s.objectFit || 'contain', 
    zIndex: 100, // Très élevé pour être vraiment au-dessus
    pointerEvents: 'none' // Pour ne pas bloquer les clics
  }
  // Les positions sont relatives à user-info maintenant
  if (typeof s.top === 'number') style.top = s.top + 'px'
  if (typeof s.left === 'number') style.left = (s.left + 0) + 'px' // Ajuster si nécessaire
  if (typeof s.width === 'number') style.width = s.width + 'px'
  if (typeof s.height === 'number') style.height = s.height + 'px'
  if (typeof s.rotate === 'number') style.transform = `rotate(${s.rotate}deg)`
  return style
}

// Déterminer la cible effective (avatar vs container) pour un asset dynamique
function getEffectiveLeaderboardTarget(item, asset, owner) {
  try {
    // Dyn: si meta.leaderboardTarget est défini, on l'applique. Sinon, fallback conteneur
    if (item && item.isDynamic) {
      // 1) Priorité MAX: valeur posée au niveau ITEM (override global)
      try {
        const itemLevel = item && item.meta && (item.meta.leaderboardTarget || (item.meta.container === 'user-avatar-container' ? 'user-avatar-container' : null))
        if (itemLevel) return String(itemLevel)
      } catch {}
      // 1bis) Détection globale: vérifier la variante de l'OWNER (pas selectedUser)
      try {
        const assetsList = (Array.isArray(item.variants) && item.variants.length > 0)
          ? getDynVariantAssetsForLeaderboard(owner || item, item)
          : (Array.isArray(item.assets) ? item.assets : [])
        if (Array.isArray(assetsList)) {
          for (const a of assetsList) {
            const t = a && a.meta && a.meta.leaderboardTarget
            if (t === 'user-avatar') return 'user-avatar'
          }
        }
      } catch {}
      // 2) Ensuite: valeur explicite fixée au niveau ASSET
      const explicit = asset && asset.meta && asset.meta.leaderboardTarget
      if (explicit) return String(explicit)
      // 3) Compat: ancien champ meta.container
      const legacy = asset && asset.meta && asset.meta.container === 'user-avatar-container'
      if (legacy) return 'user-avatar-container'
      // 4) Par défaut: conteneur
      return 'user-avatar-container'
    }
    const assetTarget = asset && asset.meta && (asset.meta.leaderboardTarget || (asset.meta.container === 'user-avatar-container' ? 'user-avatar-container' : null))
    if (assetTarget) return String(assetTarget)
    const itemTarget = item && item.meta && (item.meta.leaderboardTarget || (item.meta.container === 'user-avatar-container' ? 'user-avatar-container' : null))
    if (itemTarget) return String(itemTarget)
  } catch {}
  return 'user-avatar'
}
function isAssetTargetingAvatar(item, asset, owner) {
  return getEffectiveLeaderboardTarget(item, asset, owner) !== 'user-avatar-container'
}
function isAssetTargetingContainer(item, asset, owner) {
  return getEffectiveLeaderboardTarget(item, asset, owner) === 'user-avatar-container'
}

// Utilitaire: obtenir les assets de l'item équipé (variante si présente, sinon base)
function getEquippedAssetsForLeaderboard(user) {
  const it = getUserEquippedItemData(user)
  if (!it) return []
  if (Array.isArray(it.variants) && it.variants.length > 0) {
    // Utiliser la variante du propriétaire de la ligne
    return getDynVariantAssetsForLeaderboard(user, it)
  }
  return Array.isArray(it.assets) ? it.assets : []
}

function getDynBgStyle(item) {
  try {
    // Même background que l'onglet Collection
    const bg = (item && item.backgrounds && item.backgrounds.collection) ? item.backgrounds.collection : null
    if (!bg) return { display: 'none' }
    return { position: 'absolute', inset: '0', background: bg, zIndex: 0, pointerEvents: 'none' }
  } catch {
    return { display: 'none' }
  }
}

// Fonctions pour les items dynamiques avec variantes
function getDynVariantBgStyle(item) {
  try {
    const itemId = (typeof item.legacyId !== 'undefined') ? item.legacyId : item.id
    const variantIndex = coinsStore.getDynamicItemVariant(itemId)
    const variant = item.variants && item.variants[variantIndex]
    if (!variant || !variant.backgrounds) return { display: 'none' }
    const bg = variant.backgrounds.collection || null
    if (!bg) return { display: 'none' }
    return { position: 'absolute', inset: '0', background: bg, zIndex: 0, pointerEvents: 'none' }
  } catch {
    return { display: 'none' }
  }
}

function getCosmeticPreviewBgStyle(item) {
  try {
    const itemId = (typeof item.legacyId !== 'undefined') ? item.legacyId : item.id
    const hasVariants = Array.isArray(item.variants) && item.variants.length > 0
    if (hasVariants) {
      const vi = coinsStore.getDynamicItemVariant(itemId)
      const variant = item.variants && item.variants[vi]
      const bg = (variant && variant.backgrounds && (variant.backgrounds['popup-style'] || variant.backgrounds.collection)) || null
      if (!bg) return { display: 'none' }
      return { position: 'absolute', inset: '0', background: bg, zIndex: 0, pointerEvents: 'none' }
    }
    const bg = (item && item.backgrounds && (item.backgrounds['popup-style'] || item.backgrounds.collection)) || null
    if (!bg) return { display: 'none' }
    return { position: 'absolute', inset: '0', background: bg, zIndex: 0, pointerEvents: 'none' }
  } catch {
    return { display: 'none' }
  }
}


function getCollectionDisplayName(item) {
  try {
    const isDiscord =
      item && (
        item.displayType === 'discord' ||
        item.name === 'Discord' ||
        item.id == 23 || item.legacyId == 23 ||
        item.id == 233 || item.legacyId == 233
      )
    if (isDiscord) {
      const raw = String(item?.name || '')
      const noParen = raw.replace(/\s*\([^)]*\)\s*$/i, '')
      return noParen || 'Discord'
    }
    const nm = getCurrentVariantName(item)
    if (nm) return nm
    const raw = String(item?.name || '')
    const noParen = raw.replace(/\s*\([^)]*\)\s*$/i, '')
    return noParen || 'Item'
  } catch { return (item && item.name) ? item.name : 'Item' }
}

function getDynVariantAssets(item) {
  try {
    const itemId = (typeof item.legacyId !== 'undefined') ? item.legacyId : item.id
    const variantIndex = coinsStore.getDynamicItemVariant(itemId)
    const variant = item.variants && item.variants[variantIndex]
    if (variant && Array.isArray(variant.assets)) return variant.assets
    if (Array.isArray(item.assets)) return item.assets
    return []
  } catch {
    return []
  }
}

function getCurrentVariantName(item) {
  try {
    if (!item || !Array.isArray(item.variants) || item.variants.length === 0) return ''
    const itemId = (typeof item.legacyId !== 'undefined') ? item.legacyId : item.id
    let idx = 0
    if (item && (item.displayType === 'discord' || item.name === 'Discord' || item.id == 23 || item.legacyId == 23 || item.id == 233 || item.legacyId == 233)) {
      idx = Number(coinsStore.discordVariantIndex || 0)
    } else {
      const fromStore = coinsStore.getDynamicItemVariant(itemId)
      idx = Number.isFinite(fromStore) ? fromStore : 0
    }
    const v = item.variants && item.variants[idx]
    const nm = v && v.name ? String(v.name) : ('Style ' + (idx + 1))
    return nm
  } catch { return '' }
}

// Fonction pour obtenir les assets de la variante sélectionnée pour le leaderboard
function getDynVariantAssetsForLeaderboard(userOrItem, maybeItem) {
  try {
    // Déterminer l'item et l'utilisateur propriétaire (pour variantes par utilisateur)
    let item, owner = null
    if (maybeItem && typeof maybeItem === 'object') {
      owner = userOrItem || null
      item = maybeItem
    } else {
      item = userOrItem
      owner = (selectedUser && selectedUser.value) ? selectedUser.value : null
    }

    if (!item || !item.variants || !Array.isArray(item.variants)) return []

    // Utiliser legacyId si disponible, sinon id (comme dans la navbar)
    const itemId = item.legacyId !== undefined ? item.legacyId : item.id

    // Résoudre l'index de variante: d'abord celle de l'utilisateur affiché, sinon fallback store
    let variantIndex
    try {
      const userVariants = owner && owner.dynamicItemVariants
      if (userVariants) {
        if (typeof userVariants.get === 'function') {
          const got = userVariants.get(String(itemId))
          if (Number.isFinite(got)) variantIndex = got
        } else {
          const got = userVariants[String(itemId)]
          if (Number.isFinite(got)) variantIndex = got
        }
      }
    } catch {}

    if (!Number.isFinite(variantIndex)) {
      const fromStore = coinsStore.getDynamicItemVariant(itemId)
      variantIndex = Number.isFinite(fromStore) ? fromStore : 0
    }

    const variant = item.variants[variantIndex]
    if (!variant) return []

    // Si c'est un style texte uniquement, retourner les assets de la base avec les styles de la variante
    if (variant.textOnly) {
      const baseAssets = Array.isArray(item.assets) ? item.assets : []
      // Appliquer les styles de la variante aux assets de la base
      return baseAssets.map(asset => ({
        ...asset,
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
        // Fusionner meta: préférer la meta de la variante si présente, sinon reprendre celle de la base
        meta: (variant.assets && variant.assets[0] && variant.assets[0].meta)
          ? { ...(asset.meta || {}), ...(variant.assets[0].meta || {}) }
          : (asset.meta || {})
      }))
    }

    if (!Array.isArray(variant.assets)) return []
    // Pour les variantes normales, fusionner également la meta depuis la base si manquante
    const baseAssets = Array.isArray(item.assets) ? item.assets : []
    const bySrc = new Map(baseAssets.map(b => [String(b.src || ''), b]))
    return variant.assets.map((a, idx) => {
      const baseBySrc = bySrc.get(String(a && a.src || ''))
      const baseByIndex = baseAssets[idx]
      // Fallback sur index si src ne matche pas (pour les skins qui changent l'image)
      const b = baseBySrc || baseByIndex
      
      const baseMeta = (b && b.meta) ? b.meta : {}
      const mergedMeta = (a && a.meta) ? { ...baseMeta, ...a.meta } : baseMeta
      
      const merged = { ...a, meta: mergedMeta }
      if (b) {
        const isDef = (s) => {
          if (!s || typeof s !== 'object') return true
          const t = typeof s.top === 'number' ? s.top : 0
          const l = typeof s.left === 'number' ? s.left : 0
          const w = typeof s.width === 'number' ? s.width : 100
          const r = typeof s.rotate === 'number' ? s.rotate : 0
          return t === 0 && l === 0 && w === 100 && r === 0
        }
        const styleKeys = ['largeAvatarStyle', 'largeAvatarStyleMobile', 'profilePopupStyle', 'leaderboardStyle', 'navbarStyle', 'style', 'collectionStyle', 'collectionStyleMobile', 'leaderboardStyleMobile', 'avatarStyle', 'avatarStyleMobile', 'navbarStyleMobile', 'popupStyleStyle', 'cosmeticPreviewStyle', 'cosmeticPreviewStyleMobile', 'dailyStyle']
        styleKeys.forEach(key => {
          const hasMerged = merged[key] !== undefined
          const mergedDefault = hasMerged ? isDef(merged[key]) : true
          const baseVal = b[key]
          const baseDefault = isDef(baseVal)
          if (!hasMerged || mergedDefault) {
            if (baseVal !== undefined && !baseDefault) {
              merged[key] = baseVal
            }
          }
        })
      }
      return merged
    })
  } catch (e) {
    console.error('❌ Erreur dans getDynVariantAssetsForLeaderboard:', e)
    return []
  }
}

// Fonction pour l'aperçu des variantes dans la popup (même logique que l'Admin Editor)
function getDynVariantPreviewStyle(asset) {
  if (!asset || typeof asset !== 'object') {
    return { position: 'absolute', objectFit: 'contain', zIndex: 1 }
  }
  const mobile = !!isMobile.value
  // Utiliser les styles de cosmeticPreviewStyle s'ils existent, sinon fallback sur popupStyleStyle ou collection
  const cosmeticStyle = mobile ? (asset.cosmeticPreviewStyleMobile || asset.cosmeticPreviewStyle) : asset.cosmeticPreviewStyle
  const s = cosmeticStyle || (asset && asset.popupStyleStyle) || (asset && asset.collectionStyle) || asset?.style || {}
  const style = { 
    position: 'absolute', 
    objectFit: s.objectFit || 'contain', 
    zIndex: typeof s.zIndex === 'number' ? s.zIndex : 1,
    pointerEvents: 'none'
  }
  if (typeof s.top === 'number') style.top = s.top + 'px'
  if (typeof s.left === 'number') style.left = s.left + 'px'
  if (typeof s.width === 'number') style.width = s.width + 'px'
  if (typeof s.height === 'number') style.height = s.height + 'px'
  if (typeof s.rotate === 'number') style.transform = `rotate(${s.rotate}deg)`
  return style
}

function getPopupStylePreviewStyle(asset) {
  if (!asset || typeof asset !== 'object') {
    return { position: 'absolute', objectFit: 'contain', zIndex: 1 }
  }
  const s = (asset && asset.popupStyleStyle) || asset?.style || {}
  const style = { position: 'absolute', objectFit: s.objectFit || 'contain', zIndex: typeof s.zIndex === 'number' ? s.zIndex : 1, pointerEvents: 'none' }
  if (typeof s.top === 'number') style.top = s.top + 'px'
  if (typeof s.left === 'number') style.left = s.left + 'px'
  if (typeof s.width === 'number') style.width = s.width + 'px'
  if (typeof s.height === 'number') style.height = s.height + 'px'
  if (typeof s.rotate === 'number') style.transform = `rotate(${s.rotate}deg)`
  return style
}

// Fonction pour l'affichage des assets des variantes dans la Collection (même logique que l'Admin Editor)
function getDynVariantAssetStyle(asset) {
  if (!asset || typeof asset !== 'object') {
    return { position: 'absolute', objectFit: 'contain', zIndex: 1 }
  }
  const mobile = !!isMobile.value
  const isWeekly = (activeTab && activeTab.value === 'weekly')
  const s = isWeekly
    ? ((asset && asset.dailyStyle) || asset?.style || {})
    : (mobile
      ? ((asset && asset.collectionStyleMobile) || asset?.collectionStyle || asset?.style || {})
      : ((asset && asset.collectionStyle) || asset?.style || {})
    )
  const style = { 
    position: 'absolute', 
    objectFit: s.objectFit || 'contain', 
    zIndex: typeof s.zIndex === 'number' ? s.zIndex : 1,
    pointerEvents: isWeekly ? 'none' : 'auto',
    cursor: isWeekly ? undefined : 'move'
  }
  if (typeof s.top === 'number') style.top = s.top + 'px'
  if (typeof s.left === 'number') style.left = s.left + 'px'
  if (typeof s.width === 'number') style.width = s.width + 'px'
  if (typeof s.height === 'number') style.height = s.height + 'px'
  if (typeof s.rotate === 'number') style.transform = `rotate(${s.rotate}deg)`
  return style
}

// Nombre d'items possédés
const ownedItemsCount = computed(() => {
  return shopItems.filter(item => coinsStore.hasItem(item.id)).length
})

// Variables pour la boutique hebdomadaire
const activeTab = ref('main')
const weeklyItems = ref([])
const timeUntilReset = ref('')
const showWeeklyResetNotification = ref(false)
let weeklyTimer = null
let weeklyAutoCycleTimer = null
const nextResetAt = ref(0)

// Popup infos items spéciaux (non vendus)
const isInfoOpen = ref(false)
const infoText = ref('')
async function openInfoItem(item) {
  const map = {
    'Planify': 'Réservé aux administrateurs.',
    'Prestige': 'Distinction réservée aux 10 premiers utilisateurs.',
    'Coeur': "Obtenable en contribuant au site (soutien, aide ou contribution notable).",
    'Galaxie': 'Obtenable via la roue de la fortune.'
  }
  // Chercher d'abord dans l'index (plus fiable que la liste affichée)
  const dyn = dynamicInfoById.value.get(Number(item?.id)) || dynamicInfoByName.value.get(String(item?.name || '').trim())
  let raw = (item && item.infoDescription) || (dyn && dyn.infoDescription) || ''
  let desc = (typeof raw === 'string') ? raw.trim() : ''
  if (!desc) {
    try {
      const res = await secureApiCall(`/items?_=${Date.now()}`)
      if (res && res.success && Array.isArray(res.items)) {
        let fresh = res.items.find(it => Number(it.legacyId) === Number(item?.id))
        if (!fresh) fresh = res.items.find(it => (
          it && typeof it.name === 'string' && typeof item?.name === 'string' &&
          it.name.trim() === item.name.trim()
        ))
        if (!fresh) fresh = res.items.find(it => (
          it && typeof it.name === 'string' && typeof item?.name === 'string' &&
          it.name.trim().toLowerCase() === item.name.trim().toLowerCase()
        ))
        if (fresh && typeof fresh.infoDescription === 'string') desc = fresh.infoDescription.trim()
        // si trouvé, mettre aussi à jour les index pour prochaines ouvertures
        if (fresh) {
          const normalized = {
            id: fresh.legacyId,
            name: fresh.name,
            price: Number(fresh.price) || 0,
            isDynamic: true,
            infoOnly: !!fresh.infoOnly,
            infoDescription: fresh.infoDescription || null,
            assets: Array.isArray(fresh.assets) ? fresh.assets : [],
            backgrounds: fresh.backgrounds || {}
          }
          dynamicInfoById.value.set(Number(normalized.id), normalized)
          if (typeof normalized.name === 'string') dynamicInfoByName.value.set(normalized.name.trim(), normalized)
        }
      }
    } catch {}
  }
  infoText.value = (desc && desc.length > 0) ? desc : (map[item?.name] || 'Informations indisponibles.')
  isInfoOpen.value = true
  lockBodyScroll()
}

function hasInfo(item) {
  const dyn = dynamicInfoById.value.get(Number(item?.id)) || dynamicInfoByName.value.get(String(item?.name || '').trim())
  const localDesc = typeof item?.infoDescription === 'string' ? item.infoDescription.trim() : ''
  const dynDesc = typeof dyn?.infoDescription === 'string' ? dyn.infoDescription.trim() : ''
  // Prix courant (avec override hebdo)
  const price = Number(getItemPrice(item))
  const isSoldItem = !Number.isNaN(price) && price > 0
  // Afficher l'icône uniquement si:
  // - infoOnly est actif (peu importe le prix), ou
  // - une description existe ET l'item n'est pas vendu (prix <= 0)
  if (item?.infoOnly || dyn?.infoOnly) return true
  if (!isSoldItem && (localDesc || dynDesc)) return true
  return false
}

function getPreviewDescription(item) {
  try {
    const dyn = dynamicInfoById.value.get(Number(item?.id)) || dynamicInfoByName.value.get(String(item?.name || '').trim())
    const base = String((item?.infoDescription || dyn?.infoDescription || 'Description de l’item.')).trim()
    return base
  } catch {
    return String(item?.infoDescription || 'Description de l’item.')
  }
}
function hasCreator(item) {
  try {
    const meta = item && item.meta
    const hasIds = Array.isArray(meta?.creatorIds) && meta.creatorIds.length > 0
    const hasNames = Array.isArray(meta?.creatorUsernames) && meta.creatorUsernames.length > 0
    return !!(meta && (hasIds || hasNames))
  } catch {
    return false
  }
}
function hasCreatorName(item) {
  try {
    const meta = item && item.meta
    return !!(meta && Array.isArray(meta.creatorUsernames) && meta.creatorUsernames.length > 0 && meta.creatorUsernames[0])
  } catch {
    return false
  }
}
function hasCreatorId(item) {
  try {
    const meta = item && item.meta
    return !!(meta && Array.isArray(meta.creatorIds) && meta.creatorIds.length > 0 && meta.creatorIds[0])
  } catch {
    return false
  }
}
function firstCreatorName(item) {
  try {
    const meta = item && item.meta
    if (meta && Array.isArray(meta.creatorUsernames) && meta.creatorUsernames.length > 0) {
      return meta.creatorUsernames[0]
    }
  } catch {}
  return 'Auteur'
}
function getCreatorNames(item) {
  try {
    const arr = item?.meta?.creatorUsernames
    return Array.isArray(arr) ? arr.filter(Boolean) : []
  } catch { return [] }
}
async function onCreatorNameClick(name) {
  try {
    const target = normalizeUsernameForMatch(name)
    if (!target) return
    const users = await getAllUsersCached()
    const found = users.find(u =>
      normalizeUsernameForMatch(u.username) === target ||
      normalizeUsernameForMatch(u.name) === target
    )
    if (found) await openLeaderboardProfile(found)
    else await openLeaderboardProfile({ username: name, publicNote: '' })
  } catch {}
}
const usersCache = ref(null)

function normalizeUsernameForMatch(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '')
}

async function getAllUsersCached() {
  if (Array.isArray(usersCache.value)) return usersCache.value
  try {
    const res = await secureApiCall('/users/leaderboard')
    const arr = (res && res.users) ? res.users : (Array.isArray(res) ? res : [])
    usersCache.value = Array.isArray(arr) ? arr : []
  } catch {
    usersCache.value = []
  }
  return usersCache.value
}

async function onCreatorClick(item) {
  try {
    if (hasCreatorId(item)) {
      await openCreatorProfile(item.meta.creatorIds[0])
      return
    }
    if (hasCreatorName(item)) {
      const targetName = normalizeUsernameForMatch(firstCreatorName(item))
      if (!targetName) return

      const users = await getAllUsersCached()
      const found = users.find(u => normalizeUsernameForMatch(u.username) === targetName || normalizeUsernameForMatch(u.name) === targetName)
      if (found) {
        await openLeaderboardProfile(found)
      } else {
        // Fallback si introuvable: ouvrir avec le nom affiché
        openLeaderboardProfile({ username: firstCreatorName(item), publicNote: '' })
      }
    }
  } catch {}
}
function closeInfoItem() {
  isInfoOpen.value = false
  unlockBodyScroll()
}

// Computed properties pour séparer les items hebdomadaires
const normalWeeklyItems = computed(() => {
  return weeklyItems.value.filter(item => !item.type || (item.type !== 'border-color' && item.type !== 'border-gradient'))
})

const borderWeeklyItems = computed(() => {
  return weeklyItems.value.filter(item => item.type === 'border-color' || item.type === 'border-gradient')
})

const ensureFour = (list) => {
  const base = Array.isArray(list) ? list.slice(0, 4) : []
  if (base.length < 4 && list && list.length) {
    const last = list[list.length - 1]
    while (base.length < 4) base.push(last)
  }
  return base
}
const leftSmallWeeklyItems = computed(() => ensureFour(normalWeeklyItems.value))
const adminLeftItemsForDisplay = computed(() => {
  const base = ensureFour(normalWeeklyItems.value)
  const clone = base.slice()
  if (isAdminUser.value) {
    try {
      adminGridReplacements.value.forEach((val, key) => {
        if (val && typeof key === 'number' && key >= 0 && key < clone.length) clone[key] = val
      })
    } catch {}
    const preview = adminPreviewItemForGrid.value
    if (preview) {
      const slot = Math.min(Math.max(adminGridPreviewSlot.value || 0, 0), clone.length - 1)
      clone[slot] = preview
    }
  }
  return clone
})
const rightWeeklyColors = computed(() => ensureFour(borderWeeklyItems.value))

// Map des prix hebdomadaires par id pour synchroniser les prix dans la Collection
const weeklyPriceMap = computed(() => {
  const map = new Map()
  weeklyItems.value.forEach((it) => {
    if (it && typeof it.id !== 'undefined' && typeof it.price !== 'undefined') {
      map.set(it.id, it.price)
    }
  })
  return map
})

// Popup de sélection de couleur
const isColorPickerOpen = ref(false)
const hoverCloseColor = ref(false)
const lockBodyScroll = () => { try { document.body.style.overflow = 'hidden' } catch {} }
const unlockBodyScroll = () => { try { document.body.style.overflow = '' } catch {} }
const openColorPicker = () => {
  isColorPickerOpen.value = true
  lockBodyScroll()
}
const closeColorPicker = () => {
  isColorPickerOpen.value = false
  unlockBodyScroll()
}
watch(isColorPickerOpen, (v) => { if (v === true) hoverCloseColor.value = false })
const selectBorderColor = (color) => {
  if (!color || !color.unlocked) return
  coinsStore.selectBorderColor(color.id)
  isColorPickerOpen.value = false
}
const getColorSwatchStyle = (c) => {
  const style = { }
  if (c && c.gradient) style.background = c.gradient
  else if (c && c.color) style.background = c.color
  else style.background = '#000'
  return style
}

// Compteurs et pourcentage (X / Y + % collectés)
const totalColorsCount = computed(() => coinsStore.borderColors.length)
const unlockedColorsCount = computed(() => coinsStore.borderColors.filter(c => c.unlocked).length)
const borderColorsPercent = computed(() => {
  const total = totalColorsCount.value || 0
  const unlocked = unlockedColorsCount.value || 0
  return total > 0 ? Math.round((unlocked / total) * 100) : 0
})

// Obtenir le prix courant d'un item (priorité au prix hebdomadaire s'il existe)
const getItemPrice = (item) => {
  if (!item) return 0
  const override = weeklyPriceMap.value.get(item.id)
  return typeof override !== 'undefined' ? override : (item && typeof item.price !== 'undefined' ? item.price : 0)
}

// Style pour le cercle d'aperçu dans les variantes hebdomadaires
const getWeeklyBorderStyle = (item) => {
  // item.borderStyle peut être de la forme '3px solid #HEX'
  if (item && typeof item.borderStyle === 'string') {
    // Extraire la couleur
    const match = item.borderStyle.match(/solid\s+([^;]+)/)
    const color = match ? match[1].trim() : '#000'
    return {
      border: `3px solid ${color}`,
      borderRadius: '50%'
    }
  }
  return { border: '3px solid #000', borderRadius: '50%' }
}

// Équiper une variante de bordure via la boutique hebdomadaire avec son
const handleEquipWeeklyBorder = (item) => {
  const colorId = coinsStore.getBorderColorIdFromItem(item)
  if (!colorId) return
  const wasSelected = coinsStore.selectedBorderColor === colorId
  coinsStore.selectBorderColor(colorId)
  if (!wasSelected) {
    playSound(selectionSound)
  }
}

  // Remplissage interne (le disque) pour refléter exactement la couleur/dégradé défini côté site
  const getWeeklyClassicFillStyle = (item) => {
    try {
      const colorId = coinsStore.getBorderColorIdFromItem(item)
      const color = coinsStore.borderColors.find(c => c.id === colorId)
      if (color) {
        const style = { width: '100%', height: '100%' }
        if (color.gradient) style.background = color.gradient
        else if (color.color) style.background = color.color
        else style.background = '#000'
        return style
      }
    } catch (e) {}
    // Fallback: extraire depuis borderStyle si présent
    if (item && typeof item.borderStyle === 'string') {
      const match = item.borderStyle.match(/solid\s+([^;]+)/)
      const color = match ? match[1].trim() : '#000'
      return { background: color, width: '100%', height: '100%' }
    }
    return { background: '#000', width: '100%', height: '100%' }
  }

// Nom d'affichage des variantes hebdomadaires aligné avec le store (sans suffixe "(couleur)")
const getWeeklyColorName = (item) => {
  try {
    if (item && item.type === 'border-color') {
      const colorId = coinsStore.getBorderColorIdFromItem(item)
      const color = coinsStore.borderColors.find(c => c.id === colorId)
      if (color && color.name) {
        return `Bordure ${color.name}`
      }
    }
  } catch (e) {}
  const name = item && item.name ? item.name : ''
  return String(name).replace(/\s*\(couleur\)\s*$/i, '')
}

// Libellé court pour la puce en haut à gauche du carré couleur
const getWeeklyColorChipName = (item) => {
  try {
    if (item && item.type === 'border-color') {
      const colorId = coinsStore.getBorderColorIdFromItem(item)
      const color = coinsStore.borderColors.find(c => c.id === colorId)
      if (color && color.name) return color.name
    }
  } catch (e) {}
  return getWeeklyColorName(item).replace(/^Bordure\s+/i, '').trim()
}

// Variables pour le leaderboard
const leaderboardFilter = ref('coins')
const LEADERBOARD_CACHE_KEY = 'planify_leaderboard_cache_v1'
const leaderboardUsers = ref([])
const showUserProfile = ref(false)
const selectedUser = ref(null)
function readLeaderboardCache() { try { const raw = localStorage.getItem(LEADERBOARD_CACHE_KEY); const obj = raw ? JSON.parse(raw) : null; const arr = Array.isArray(obj?.users) ? obj.users : (Array.isArray(obj) ? obj : []); const ts = Number(obj?.ts || 0) || 0; return { users: arr, ts }; } catch { return { users: [], ts: 0 } } }
function writeLeaderboardCache(list) { try { localStorage.setItem(LEADERBOARD_CACHE_KEY, JSON.stringify({ ts: Date.now(), users: Array.isArray(list) ? list : [] })) } catch {} }
const hoverCloseProfile = ref(false)
// moved: popupMusicVolume is initialized earlier to avoid TDZ

const selectedGroupLogoSrc = computed(() => {
  try {
    const g = String((selectedUser.value && selectedUser.value.groupe) || '').trim()
    switch (g) {
      case 'A': return groupeA
      case "A'": return groupeAprime
      case 'A"': return groupeAprime
      case 'B': return groupeB
      case "B'": return groupeBprime
      case 'B"': return groupeBprime
      case 'Promo': return groupePromo
      default: return null
    }
  } catch { return null }
})

const isVolumeHovered = ref(false)
const isPopupMuted = ref(false)

const popupMusicVolume = ref(Math.max(0, Math.min(100, Number(localStorage.getItem('musicVolume') ?? 60))))

const previousPopupVolume = ref(popupMusicVolume.value > 0 ? popupMusicVolume.value : 60)
const popupCurrentVolumeIcon = computed(() => {
  const v = Math.round(Math.max(0, Math.min(100, Number(popupMusicVolume.value) || 0)))
  if (isPopupMuted.value || v === 0) return muteIconImg
  if (v >= 100) return volumeFullImg
  if (v >= 50) return volumeTwoBarsImg
  return volumeOneBarImg
})
const popupProgress = ref(0)
const popupDuration = ref(0)
const isDraggingPopup = ref(false)
const popupProgressPercent = computed(() => {
  try {
    const d = Math.max(0, Number(popupDuration.value || 0))
    const c = Math.max(0, Number(popupProgress.value || 0))
    return d ? Math.max(0, Math.min(100, (c / d) * 100)) : 0
  } catch { return 0 }
})
function formatTime(s) {
  try {
    const sec = Math.max(0, Math.floor(Number(s) || 0))
    const m = Math.floor(sec / 60).toString().padStart(2,'0')
    const r = (sec % 60).toString().padStart(2,'0')
    return `${m}:${r}`
  } catch { return '00:00' }
}
function startPopupSeekDrag(e) {
  if (e.cancelable && (e.type === 'mousedown' || e.type === 'touchstart')) e.preventDefault()
  const container = e.currentTarget
  if (!container) return
  isDraggingPopup.value = true
  const el = popupAudioEl?.value
  let wasPlaying = false
  if (el && !el.paused) { wasPlaying = true; el.pause() }
  const updateProgress = (clientX) => {
    const rect = container.getBoundingClientRect()
    const offsetX = clientX - rect.left
    const width = rect.width
    if (width <= 0) return
    const pct = Math.max(0, Math.min(1, offsetX / width))
    const dur = Number(popupDuration.value) || 0
    popupProgress.value = pct * dur
    if (el && Number.isFinite(el.duration)) {
      try { el.currentTime = Math.max(0, Math.min(popupProgress.value, el.duration)) } catch {}
    }
  }
  const clientX = e.touches ? e.touches[0].clientX : e.clientX
  updateProgress(clientX)
  const onMove = (moveEvent) => {
    if (!moveEvent.touches && moveEvent.buttons === 0) { onUp(); return }
    const moveX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX
    updateProgress(moveX)
  }
  const onUp = () => {
    isDraggingPopup.value = false
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
    document.removeEventListener('touchmove', onMove)
    document.removeEventListener('touchend', onUp)
    if (wasPlaying && el) el.play().catch(() => {})
  }
  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
  document.addEventListener('touchmove', onMove, { passive: false })
  document.addEventListener('touchend', onUp)
}
function startPopupVolumeDrag(e) {
  if (e.cancelable && (e.type === 'mousedown' || e.type === 'touchstart')) e.preventDefault()
  const container = e.currentTarget
  if (!container) return
  const update = (clientY) => {
    const rect = container.getBoundingClientRect()
    const bottomY = rect.top + rect.height
    const offsetY = bottomY - clientY
    const height = rect.height
    if (height <= 0) return
    let pct = Math.max(0, Math.min(1, offsetY / height)) * 100
    popupMusicVolume.value = Math.round(pct)
  }
  const clientY = e.touches ? e.touches[0].clientY : e.clientY
  update(clientY)
  const onMove = (moveEvent) => {
    if (!moveEvent.touches && moveEvent.buttons === 0) { onUp(); return }
    const y = moveEvent.touches ? moveEvent.touches[0].clientY : moveEvent.clientY
    update(y)
  }
  const onUp = () => {
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
    document.removeEventListener('touchmove', onMove)
    document.removeEventListener('touchend', onUp)
  }
  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
  document.addEventListener('touchmove', onMove, { passive: false })
  document.addEventListener('touchend', onUp)
}
function togglePopupMute() {
  try {
    const el = popupAudioEl?.value
    const next = !isPopupMuted.value
    isPopupMuted.value = next
    if (next) {
      if (popupMusicVolume.value > 0) { previousPopupVolume.value = popupMusicVolume.value }
      popupMusicVolume.value = 0
      if (el) el.muted = true
    } else {
      popupMusicVolume.value = previousPopupVolume.value > 0 ? previousPopupVolume.value : 60
      if (el) el.muted = false
    }
  } catch {}
}

// Variables pour les factions
const factionUsers = ref({ bagnat: [], fermier: [] })
const factionLoading = ref(false)
const userFaction = ref(null)
const showFullBagnat = ref(true)
const showFullFermier = ref(true)
const joiningFaction = ref(false)
const currentUserFactionEntry = ref(null)
const popupAudioEl = ref(null)
const factionTotalCoins = ref({ bagnat: 0, fermier: 0 })
const isPopupPlaying = ref(false)
const popupWebAudioAvailable = ref(false) // Désactivation WebAudio pour fiabilité iOS


// Sélecteur mobile de faction + références de colonnes
const selectedFactionMobile = ref('Bagnat')
const bagnatColumnRef = ref(null)
const fermierColumnRef = ref(null)

// Caler le sélecteur mobile sur la faction de l'utilisateur si connue
try {
  const f = authStore.user?.faction
  if (f === 'Fermier' || f === 'Bagnat') {
    selectedFactionMobile.value = f
  }
} catch {}

function onMobileFactionChange() {
  try {
    const el = selectedFactionMobile.value === 'Bagnat' ? bagnatColumnRef.value : fermierColumnRef.value
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  } catch {}
}
// Init volume
{
  const el = popupAudioEl?.value
  const vol = Math.max(0, Math.min(1, (Number(popupMusicVolume.value) || 0) / 100))
  try { if (el) setPopupElVolume(el, vol) } catch {}
}
function togglePopupPlay() {
  const el = popupAudioEl.value
  if (!el || !selectedUser?.value) return
  const start = typeof selectedUser.value.musicStartSeconds === 'number' ? selectedUser.value.musicStartSeconds : 0
  const dur = typeof selectedUser.value.musicDurationSeconds === 'number' ? selectedUser.value.musicDurationSeconds : null
  const end = dur ? start + dur : Infinity

  // Appliquer le volume actuel via helper (gère WebAudio iOS ou fallback)
  try { setPopupElVolume(el, Math.max(0, Math.min(1, (Number(popupMusicVolume.value) || 0) / 100))) } catch {}

  if (!isPopupPlaying.value) {
    try { el.currentTime = start } catch {}
    el.play()
    isPopupPlaying.value = true
  } else {
    el.pause()
    isPopupPlaying.value = false
  }
  el._clipStart = start
  el._clipEnd = end
}
function onPopupTimeUpdate(e) {
  try {
    if (isDraggingPopup.value) return
    const el = e && e.target ? e.target : popupAudioEl.value
    if (!el) return
    const start = (typeof el._clipStart === 'number' && isFinite(el._clipStart)) ? el._clipStart : 0
    const end = el._clipEnd
    popupProgress.value = Number(el.currentTime || 0)
    popupDuration.value = Number(el.duration || 0)
    if (typeof end === 'number' && isFinite(end) && el.currentTime >= end - 0.05) {
      try { el.pause() } catch {}
      isPopupPlaying.value = false
      return
    }
  } catch {}
}
function onPopupLoadedMetadata(e) {
  try {
    const el = e && e.target ? e.target : popupAudioEl.value
    if (!el) return
    popupDuration.value = Number(el.duration || 0)
    const vol = Math.max(0, Math.min(1, (Number(popupMusicVolume.value) || 0) / 100))
    try { el.muted = false } catch {}
    setPopupElVolume(el, vol)
  } catch {}
}
// WebAudio helpers identiques (iOS volume)
const popupAudioGraph = {
  ctx: null,
  nodes: new Map(),
}
function popupIsIOS() {
  try {
    const ua = navigator.userAgent || ''
    const iOS = /iPad|iPhone|iPod/.test(ua)
    const iPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
    return iOS || iPadOS
  } catch { return false }
}
async function ensurePopupAudioContext() {
  try {
    if (popupAudioGraph.ctx) return popupAudioGraph.ctx
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return null
    const ctx = new Ctx()
    try { await ctx.resume() } catch {}
    popupAudioGraph.ctx = ctx
    return ctx
  } catch { return null }
}
async function ensurePopupAudioGraphFor(el) {
  // Revert: ne pas utiliser WebAudio pour la pop-up leaderboard (iOS)
  try {
    popupWebAudioAvailable.value = false
    if (el) { try { el.muted = false } catch {} }
    return null
  } catch {
    return null
  }
}
function setPopupElVolume(el, vol) {
  try {
    if (!el) return
    // Forcer le mode natif: démuter et régler el.volume (Android/desktop).
    // iOS ignore el.volume, mais la lecture fonctionne au volume système.
    try { el.muted = false } catch {}
    try { el.volume = Number.isFinite(vol) ? vol : 0 } catch {}
  } catch {}
}
async function onPopupAudioPlay() {
  try {
    const el = popupAudioEl?.value
    const vol = Math.max(0, Math.min(1, (Number(popupMusicVolume.value) || 0) / 100))
    // Revert: pas de WebAudio, juste démuter + volume natif
    setPopupElVolume(el, vol)
    isPopupPlaying.value = true
  } catch {}
}
watch(popupMusicVolume, (v) => {
  const el = popupAudioEl?.value
  const vol = Math.max(0, Math.min(1, (Number(v) || 0) / 100))
  try { if (el) setPopupElVolume(el, vol) } catch {}
  try {
    localStorage.setItem('musicVolume', String(Math.round(Math.max(0, Math.min(100, Number(v) || 0)))))
  } catch {}
})

async function openLeaderboardProfile(user) {
  try {
    // Pré-normaliser l’utilisateur initial (leaderboard)
    const initial = user ? { 
      ...user, 
      publicNote: typeof user.publicNote === 'string' ? user.publicNote : '' 
    } : null

    selectedUser.value = initial
    showUserProfile.value = true
    try { window.dispatchEvent(new CustomEvent('leaderboard-profile-viewed', { detail: { username: (selectedUser.value && (selectedUser.value.username || selectedUser.value.name)) || '' } })) } catch {}
    lockBodyScroll()

    const userId = user?._id || user?.id
    if (userId) {
      const res = await secureApiCall(`/users/${userId}`)
      const payload = (res && res.user) ? res.user : res

      if (payload && typeof payload === 'object') {
        // MERGE au lieu d’écraser pour ne pas perdre publicNote
        const merged = { ...initial, ...payload }
        merged.publicNote = typeof merged.publicNote === 'string' ? merged.publicNote : ''
        selectedUser.value = merged
      }
    }
  } catch {}
}
async function openCreatorProfile(userId) {
  try {
    if (!userId) {
      alert('ID créateur manquant.')
      return
    }

    // 1) Ouvre la pop-up tout de suite avec un “squelette”
    await openLeaderboardProfile({ _id: userId, id: userId, publicNote: '' })

    // 2) Puis charge les détails en sécurisé
    const res = await secureApiCall(`/users/${userId}`)
    const data = (res && res.user) ? res.user : res
    if (data && (data._id || data.id)) {
      await openLeaderboardProfile(data) // met à jour la fiche
    }
  } catch {}
}
function closeLeaderboardProfile() {
  try {
    if (popupAudioEl.value) {
      popupAudioEl.value.pause()
      popupAudioEl.value.currentTime = 0
    }
    isPopupPlaying.value = false
  } catch {}
  showUserProfile.value = false
  selectedUser.value = null
  unlockBodyScroll()
}

function handleUserPublicNoteChanged(e) {
  try {
    const detail = e && e.detail ? e.detail : {}
    const userId = detail.userId
    const note = String(detail.publicNote || '')
    if (!userId) return

    if (showUserProfile.value && selectedUser.value && (selectedUser.value._id === userId || selectedUser.value.id === userId)) {
      selectedUser.value = { ...selectedUser.value, publicNote: note }
    }

    if (Array.isArray(leaderboardUsers.value) && leaderboardUsers.value.length) {
      leaderboardUsers.value = leaderboardUsers.value.map(u => {
        const uid = u && (u._id || u.id)
        return (uid === userId) ? { ...u, publicNote: note } : u
      })
    }
  } catch {}
}

// Helpers d'affichage (labels role/année)
function afficherRole(role) {
  if (!role) return '—'
  const key = String(role).toLowerCase()
  const map = { admin: 'Admin', prof: 'Professeur', professeur: 'Professeur', delegue: 'Délégué', délégué: 'Délégué', eleve: 'Étudiant' }
  return map[key] || '—'
}

function afficherAnnee(year) {
  if (!year) return '—'
  const map = { BUT1: '1ère année', BUT2: '2ème année', BUT3: '3ème année' }
  return map[year] || String(year)
}

function afficherSpecialite(spec) {
  const key = String(spec || '').toLowerCase()
  const map = { devweb: 'Développement Web', creation: 'Création numérique', strategie: 'Stratégie de communication' }
  return map[key] || '—'
}

function getUserFullName(user) {
  const first = (user && (user.firstName || user.prenom)) || ''
  const last = (user && (user.lastName || user.nom)) || ''
  const full = [first, last].filter(Boolean).join(' ').trim()
  return full || user?.displayName || user?.name || user?.username || '—'
}

// Items de la boutique
const shopItems = [
  {
    id: 0,
    name: 'Bordure classique',
    price: 0,
    img: '',
    type: 'classic-border'
  },
  {
    id: 1,
    name: 'Oreilles de chat',
    price: 150,
    img: oreilleschat,
  },
  {
    id: 2,
    name: 'Clown',
    price: 120,
    img: clowncheveux,
  },
  {
    id: 3,
    name: 'Cash',
    price: 50,
    img: cash,
  },
  {
    id: 4,
    name: 'Cible',
    price: 70,
    img: target,
  },
  {
    id: 6,
    name: 'Roi',
    price: 170,
    img: roi,
  },
  {
    id: 7,
    name: 'Matrix',
    price: 500,
    img: matrix,
  },
  {
    id: 8,
    name: 'Ange',
    price: 600,
    img: angelwings,
  },
  {
    id: 9,
    name: 'Tomb Raider',
    price: 400,
    img: laracroft,
  },
  {
    id: 10,
    name: 'Étoiles',
    price: 100,
    img: star,
  },
  {
    id: 11,
    name: 'Cadre royale',
    price: 230,
    img: cadre,
  },
  {
    id: 12,
    name: 'Roses',
     price: 180,
    img: love,
  },
  {
    id: 13,
    name: 'Gentleman',
     price: 150,
     img: gentleman,
  },
  {
    id: 14,
    name: 'Vinyle',
    price: 90,
    img: vinyle,
  },
  {
    id: 15,
    name: 'Advisory',
     price: 200,
    img: advisory,
  },
  {
    id: 16,
    name: 'Espace',
    price: 300,
    img: spacestars,
  },
  {
    id: 17,
    name: 'Absolute Cinema',
     price: 350,
    img: bras,
  },
  {
    id: 18,
    name: 'Flash',
    price: 120,
    img: flash,
  },
  {
    id: 19,
    name: 'Miaou',
     price: 200,
    img: chat,
  },
  {
    id: 20,
    name: 'DVD',
     price: 110,
    img: dvd,
  },
  {
    id: 21,
    name: 'Lunettes pixel',
     price: 130,
    img: mlglunette,
  },
  {
    id: 22,
    name: '2000',
     price: 250,
    img: nokia,
   }
  ,
  {
    id: 23,
    name: 'Discord',
    price: 150,
    img: discordon,
    variants: [discordon, discordnepasderange, discordderange],
    variantIndex: 0,
  }
  ,
  {
    id: 24,
    name: 'Jojo',
    price: 200,
    img: jojo,
  }
  ,
  {
    id: 25,
    name: 'Galaxie',
    img: galaxie,
  }
  ,
  {
    id: 26,
    name: 'Coeur',
    img: coeur,
  }
  ,
  {
    id: 27,
    name: 'Prestige',
    img: alphaImg,
  }
  ,
  {
    id: 28,
    name: 'Planify',
    img: adminPlanify,
  }
 ]

// Image réactive pour Discord dans la Collection
const discordVariants = [discordon, discordnepasderange, discordderange]
const discordDisplayImg = computed(() => {
  const idx = coinsStore.discordVariantIndex || 0
  return discordVariants[idx] || discordon
})



// Cycler entre les variantes Discord dans la Collection
function cycleDiscordStyle(item) {
  if (item.name !== 'Discord' || !item.variants || !item.variants.length) return
  item.variantIndex = (item.variantIndex + 1) % item.variants.length
  item.img = item.variants[item.variantIndex]
}

// Gestion popup style Discord (réutilise le pattern du color picker)
const isPopupStylePreviewOpen = ref(false)
const isDiscordPickerOpen = ref(false)
const discordPickerItem = ref(null)
  const hoverCloseStyle = ref(false)
function openPopupStylePreview() { isPopupStylePreviewOpen.value = true; lockBodyScroll() }
function closePopupStylePreview() { isPopupStylePreviewOpen.value = false; unlockBodyScroll() }
function openDiscordStylePicker(item) {
  discordPickerItem.value = item
  isDiscordPickerOpen.value = true
  lockBodyScroll()
}
function closeDiscordStylePicker() {
  isDiscordPickerOpen.value = false
  discordPickerItem.value = null
  unlockBodyScroll()
}

// Appliquer une variante Discord (et synchroniser l'affichage Navbar via l'ID 23)
function applyDiscordVariant(idx) {
  if (!discordPickerItem.value) return
  const item = discordPickerItem.value
  if (!item.variants || !item.variants[idx]) return
  item.variantIndex = idx
  // Synchroniser avec le store (Navbar + Collection via computed)
  try { coinsStore.setDiscordVariantIndex(idx) } catch (e) {}
  // Fermer la popup
  closeDiscordStylePicker()
}

// Helpers style Jojo (Collection)
function getJojoImgStyle() {
  const p = coinsStore.jojoImgPos || { top: 50, left: 88, width: 90 }
  return {
    position: 'absolute',
    top: p.top + 'px',
    left: p.left + 'px',
    width: p.width + '%',
    height: 'auto',
    objectFit: 'contain'
  }
}
function getWeeklyJojoImgStyle() {
  const p = coinsStore.jojoImgPos || { top: 80, left: 230, width: 80 }
  return {
    position: 'absolute',
    top: '80px',
    left: '230px',
    width: p.width + '%',
    height: 'auto',
    objectFit: 'contain'
  }
}
function getJojoTextStyle() {
  const p = coinsStore.jojoTextPos || { top: -5, left: 80, width: 90 }
  return {
    position: 'absolute',
    top: p.top + 'px',
    left: p.left + 'px',
    width: p.width + '%',
    height: 'auto',
    objectFit: 'contain'
  }
}
function getWeeklyJojoTextStyle() {
  const p = coinsStore.jojoTextPos || { top: -5, left: 80, width: 90 }
  return {
    position: 'absolute',
    top: p.top + 'px',
    left: '50px',
    width: p.width + '%',
    height: 'auto',
    objectFit: 'contain'
  }
}
function getCollectionJojoTextStyle() {
  return {
    position: 'absolute',
    top: '6px',
    left: '18px',
    width: '55%',
    height: 'auto',
    objectFit: 'contain'
  }
}

// Gestion popup style Jojo (on/off du texte)
const isJojoPickerOpen = ref(false)
  const jojoAnimKey = ref(0)
function openJojoStylePicker(_item) {
  isJojoPickerOpen.value = true
  lockBodyScroll()
}
function closeJojoStylePicker() {
  isJojoPickerOpen.value = false
  unlockBodyScroll()
}
function applyJojoVariant(idx) {
  try { coinsStore.setJojoVariantIndex(idx) } catch (e) {}
  jojoAnimKey.value = jojoAnimKey.value + 1
  closeJojoStylePicker()
}
const styleAnimFlags = ref({})
function triggerStyleAnimForItem(item) {
  try {
    const id = (item && (item.legacyId !== undefined ? item.legacyId : item.id))
    if (!Number.isFinite(id)) return
    styleAnimFlags.value[id] = true
    setTimeout(() => { styleAnimFlags.value[id] = false }, 220)
  } catch {}
}
const btnAnimFlags = ref({})
function triggerBtnAnim(item, dir) {
  try {
    const id = (item && (item.legacyId !== undefined ? item.legacyId : item.id))
    if (!Number.isFinite(id)) return
    const key = id + '-' + dir
    btnAnimFlags.value[key] = true
    setTimeout(() => { btnAnimFlags.value[key] = false }, 220)
  } catch {}
}
function prevItemStyle(item, persist = true) {
  triggerStyleAnimForItem(item)
  if (persist) pauseWeeklyAutoCycleForItem(item)
  triggerBtnAnim(item, 'l')
  if (!item) return
  const isDiscord = (item && (item.displayType === 'discord' || item.name === 'Discord' || item.id == 23 || item.legacyId == 23 || item.id == 233 || item.legacyId == 233))
  // Ajout de !showSuggestionEditor.value pour ne pas persister en mode suggestion
  const shouldPersist = !!persist && !!(authStore.user && authStore.user.token) && !showSuggestionEditor.value
  if (isDiscord) {
    const n = (Number(coinsStore.discordVariantIndex || 0) + discordVariants.length - 1) % discordVariants.length
    try { if (shouldPersist) { coinsStore.setDiscordVariantIndex(n) } else { coinsStore.discordVariantIndex = n } } catch {}
    return
  }
  if (item.name === 'Jojo') {
    const n = Number(coinsStore.jojoVariantIndex || 0) === 0 ? 1 : 0
    try { if (shouldPersist) { coinsStore.setJojoVariantIndex(n) } else { coinsStore.jojoVariantIndex = n } } catch {}
    jojoAnimKey.value = jojoAnimKey.value + 1
    return
  }
  if (item.isDynamic && Array.isArray(item.variants) && item.variants.length > 0) {
    const id = (item.legacyId !== undefined) ? item.legacyId : item.id
    const cur = Number(coinsStore.getDynamicItemVariant(id) || 0)
    const n = (cur + item.variants.length - 1) % item.variants.length
    try {
      if (shouldPersist) {
        coinsStore.setDynamicItemVariant(id, n)
      } else {
        coinsStore.dynamicItemVariants.set(id, n)
        try { localStorage.setItem('dynamicItemVariants', JSON.stringify(Object.fromEntries(coinsStore.dynamicItemVariants))) } catch {}
      }
    } catch {}
    variantUpdateKey.value++
    window.dispatchEvent(new CustomEvent('dynamic-variant-changed', { detail: { itemId: id, variantIndex: n } }))
  }
}
function nextItemStyle(item, persist = true, animateBtn = true) {
  triggerStyleAnimForItem(item)
  if (persist) pauseWeeklyAutoCycleForItem(item)
  if (animateBtn) triggerBtnAnim(item, 'r')
  if (!item) return
  const isDiscord = (item && (item.displayType === 'discord' || item.name === 'Discord' || item.id == 23 || item.legacyId == 23 || item.id == 233 || item.legacyId == 233))
  // Ajout de !showSuggestionEditor.value pour ne pas persister en mode suggestion
  const shouldPersist = !!persist && !!(authStore.user && authStore.user.token) && !showSuggestionEditor.value
  if (isDiscord) {
    const n = (Number(coinsStore.discordVariantIndex || 0) + 1) % discordVariants.length
    try { if (shouldPersist) { coinsStore.setDiscordVariantIndex(n) } else { coinsStore.discordVariantIndex = n } } catch {}
    return
  }
  if (item.name === 'Jojo') {
    const n = Number(coinsStore.jojoVariantIndex || 0) === 0 ? 1 : 0
    try { if (shouldPersist) { coinsStore.setJojoVariantIndex(n) } else { coinsStore.jojoVariantIndex = n } } catch {}
    jojoAnimKey.value = jojoAnimKey.value + 1
    return
  }
  if (item.isDynamic && Array.isArray(item.variants) && item.variants.length > 0) {
    const id = (item.legacyId !== undefined) ? item.legacyId : item.id
    const cur = Number(coinsStore.getDynamicItemVariant(id) || 0)
    const n = (cur + 1) % item.variants.length
    try {
      if (shouldPersist) {
        coinsStore.setDynamicItemVariant(id, n)
      } else {
        coinsStore.dynamicItemVariants.set(id, n)
        try { localStorage.setItem('dynamicItemVariants', JSON.stringify(Object.fromEntries(coinsStore.dynamicItemVariants))) } catch {}
      }
    } catch {}
    variantUpdateKey.value++
    window.dispatchEvent(new CustomEvent('dynamic-variant-changed', { detail: { itemId: id, variantIndex: n } }))
  }
}

// Gestion popup style pour les items dynamiques
const isDynamicPickerOpen = ref(false)
const dynamicPickerItem = ref(null)
function openDynamicStylePicker(item) {
  dynamicPickerItem.value = item
  isDynamicPickerOpen.value = true
  lockBodyScroll()
}
function closeDynamicStylePicker() {
  isDynamicPickerOpen.value = false
  dynamicPickerItem.value = null
  unlockBodyScroll()
}

// Appliquer une variante pour les items dynamiques
function applyDynamicVariant(idx) {
  if (!dynamicPickerItem.value) return
  const item = dynamicPickerItem.value

  // Vérifier que la variante existe
  if (!item.variants || !item.variants[idx]) return

  console.log('🎨 Application de la variante', idx, 'pour item', (item.legacyId ?? item.id))

  // Mode suggestion: mise à jour locale uniquement, pas d'appel API
  if (showSuggestionEditor.value) {
    try {
      const normalizedId = (item && (item.legacyId ?? item.id))
      // On met à jour directement le Map local du store sans appeler le setter qui déclenche l'API
      coinsStore.dynamicItemVariants.set(normalizedId, idx)
      variantUpdateKey.value++
      window.dispatchEvent(new CustomEvent('dynamic-variant-changed', {
        detail: { itemId: normalizedId, variantIndex: idx }
      }))
      console.log('✅ Variante appliquée localement (mode suggestion)')
    } catch (e) {
      console.warn('❌ Erreur application variante locale:', e)
    }
    closeDynamicStylePicker()
    return
  }

  // Sauvegarder la variante sélectionnée dans le store
  try {
    const normalizedId = (item && (item.legacyId ?? item.id))
    coinsStore.setDynamicItemVariant(normalizedId, idx)
    console.log('✅ Variante sauvegardée dans le store')
    // Forcer la mise à jour en incrémentant la clé
    variantUpdateKey.value++
    console.log('🔄 Clé de mise à jour incrémentée:', variantUpdateKey.value)
    // Déclencher l'événement pour notifier la navbar
    window.dispatchEvent(new CustomEvent('dynamic-variant-changed', {
      detail: { itemId: normalizedId, variantIndex: idx }
    }))
    console.log('📡 Événement dynamic-variant-changed déclenché')
  } catch (e) {
    console.warn('❌ Impossible de sauvegarder la variante:', e)
  }

  // Fermer la popup
  closeDynamicStylePicker()
}

 // Fonctions pour les items équipés
const getUserEquippedItemData = (user) => {
  if (!user) return null

  // ID équipé: supporte equippedItemId ou itemId, avec fallback store pour l'utilisateur courant
  let equippedItemId = Number((user.equippedItemId != null ? user.equippedItemId : (user.itemId != null ? user.itemId : 0)))
  if (!equippedItemId || equippedItemId === 0) {
    try {
      if (isCurrentUser(user)) {
        const storeEq = Number(coinsStore.equippedItemId)
        if (Number.isFinite(storeEq) && storeEq > 0) equippedItemId = storeEq
      }
    } catch {}
    if (!equippedItemId || equippedItemId === 0) {
      const uid = user?.id || user?._id
      const currUid = authStore.user?._id || authStore.user?.id
      if (uid && currUid && String(uid) === String(currUid)) {
        const storeEq = Number(coinsStore.equippedItemId)
        if (Number.isFinite(storeEq) && storeEq > 0) equippedItemId = storeEq
      }
    }
  }
  if (!equippedItemId || equippedItemId === 0) {
    console.log('🔍 Utilisateur sans item équipé:', user?.username, 'equippedItemId:', user?.equippedItemId)
    return null
  }

  // Chercher d'abord dans le catalogue statique
  let item = shopItems.find(it => Number(it.id) === Number(equippedItemId))

  // Si pas trouvé, tenter dans les items dynamiques chargés (index + liste courante)
  if (!item) {
    try {
      const dyn = dynamicInfoById.value.get(Number(equippedItemId))
      if (dyn) {
        item = {
          id: dyn.id,
          name: dyn.name,
          img: dyn.assets && dyn.assets[0] ? resolveAssetSrc(dyn.assets[0].src) : '',
          isDynamic: true,
          assets: dyn.assets || [],
          backgrounds: dyn.backgrounds || {},
          variants: dyn.variants || [],
          meta: dyn.meta || {},
          legacyId: dyn.id
        }
      }
    } catch {}
  }
  if (!item && Array.isArray(dynamicItems.value)) {
    const di = dynamicItems.value.find(d => Number(d.id) === Number(equippedItemId))
    if (di) {
      item = {
        id: di.id,
        name: di.name,
        img: di.assets && di.assets[0] ? resolveAssetSrc(di.assets[0].src) : '',
        isDynamic: true,
        assets: di.assets || [],
        backgrounds: di.backgrounds || {},
        variants: di.variants || [],
        meta: di.meta || {},
        legacyId: di.id
      }
    }
  }
  if (!item) {
    console.log('⚠️ Item non trouvé pour equippedItemId:', user.equippedItemId, 'utilisateur:', user?.username)
    return null
  }

  // Normalisation de nom (alias -> nom canonique attendu par les classes CSS)
  const nameAliases = {
    'Oreillettes de chat': 'Oreilles de chat',
    'Lunettes-pixel': 'Lunettes pixel',
    'Cadre doré': 'Cadre royale'
  }
  const canonicalName = nameAliases[item.name] ? nameAliases[item.name] : item.name
  item = { ...item, name: canonicalName }

  // Fallback d’affectation du displayType par ID pour éviter la dépendance aux libellés
  const idToDisplayType = {
    23: 'discord',
    26: 'coeur',
    27: 'alpha',
    28: 'admin-planify',
    13: 'gentleman',
    20: 'dvd',
    21: 'lunettes-pixel',
    22: 'nokia',
    3: 'cash',
    4: 'target',
    15: 'advisory'
  }
  let displayType = idToDisplayType[Number(equippedItemId)]

  // Fallback basé sur le nom (logique existante)
  if (!displayType) {
    if (item.name === 'Gentleman') displayType = 'gentleman'
    else if (item.name === 'Oreilles de chat') displayType = 'cat-ears'
    else if (item.name === 'Cash') displayType = 'cash'
    else if (item.name === 'Target') displayType = 'target'
    else if (item.name === 'Advisory') displayType = 'advisory'
    else if (item.name === 'Espace') displayType = 'espace'
    else if (item.name === 'Matrix') displayType = 'matrix'
    else if (item.name === 'DVD') displayType = 'dvd'
    else if (item.name === 'Lunettes pixel') displayType = 'lunettes-pixel'
    else if (item.name === '2000') displayType = 'nokia'
    else if (item.name === 'Miaou') displayType = 'miaou'
    else if (item.name === 'Roi') displayType = 'roi'
    else if (item.name === 'Clown') displayType = 'clown'
    else if (item.name === 'Vinyle') displayType = 'vinyle'
    else if (item.name === 'Flash') displayType = 'flash'
    else if (item.name === 'Ange') displayType = 'angel'
    else if (item.name === 'Tomb Raider') displayType = 'tomb-raider'
    else if (item.name === 'Absolute Cinema') displayType = 'absolute-cinema'
    else if (item.name === 'Cadre royale') displayType = 'royal-frame'
    else if (item.name === 'Roses') displayType = 'rainbow'
    else if (item.name === 'Jojo') displayType = 'jojo'
    else if (item.name === 'Discord' || Number(item.id) === 23) displayType = 'discord'
    else if (item.name === 'Galaxie') displayType = 'generic'
    else if (item.name === 'Coeur') displayType = 'coeur'
    else if (item.name === 'Prestige') displayType = 'alpha'
    else if (item.name === 'Planify') displayType = 'admin-planify'
    else displayType = 'generic'
  }

  return { ...item, displayType }
}

function getEquippedItemClass(itemName) {
  // Tolérer les alias pour éviter les non-affichages
  const aliases = {
    'Oreilles de chat': 'Oreillettes de chat',
    'Lunettes-pixel': 'Lunettes pixel',
    'Cadre doré': 'Cadre royale'
  }
  const name = aliases[itemName] || itemName

  switch (name) {
    case 'Oreillettes de chat':
      return 'equipped-cat-ears'
    case 'Matrix':
      return 'equipped-matrix-glasses'
    case 'Clown':
      return 'equipped-clown'
    case 'Cash':
      return 'equipped-cash'
    case 'Cible':
      return 'equipped-target'
    case 'Roi':
      return 'equipped-roi-overlay'
    case 'Ange':
      return 'equipped-angel-wings'
    case 'Étoiles':
      return 'equipped-stars'
    case 'Cadre royale':
      return 'equipped-royal-frame'
    case 'Roses':
      return 'equipped-rainbow'
    case 'Vinyle':
      return 'equipped-vinyle'
    case 'Espace':
      return 'equipped-espace'
    case 'Absolute Cinema':
      return 'equipped-absolute-cinema'
    case 'Flash':
      return 'equipped-flash'
    case 'Miaou':
      return 'equipped-miaou'
    case 'DVD':
      return 'equipped-dvd'
    case 'Lunettes pixel':
      return 'equipped-lunettes-pixel'
    case '2000': // alias de Nokia (affichage dédié via displayType)
      return 'equipped-nokia'
    case 'Jojo':
      return 'equipped-jojo'
    case 'Advisory':
      return 'equipped-advisory'
    default:
      return ''
  }
}

function getAvatarImageStyle(user) {
  try {
    const crop = (user && user.avatarCrop) || {}
    const x = Math.max(0, Math.min(100, Number(crop.xPercent ?? crop.x ?? 50)))
    const y = Math.max(0, Math.min(100, Number(crop.yPercent ?? crop.y ?? 50)))
    const scale = Math.max(1, Math.min(3, Number(crop.scale ?? 1)))
    return {
      objectFit: 'cover',
      objectPosition: `${x}% ${y}%`,
      transform: `scale(${scale})`,
      transformOrigin: `${x}% ${y}%`,
    }
  } catch { return { objectFit: 'cover' } }
}

const getUserAvatar = (user) => {
  try {
    const avatar = (user && typeof user.avatar === 'string') ? user.avatar.trim() : ''
    if (avatar) {
      if (avatar.startsWith('/uploads/')) {
        const baseUrl = API_URL.replace(/\/api$/, '')
        const v = (typeof user.avatarVersion === 'number' && user.avatarVersion >= 0)
          ? user.avatarVersion
          : (user && user.avatarUpdatedAt ? (Date.parse(user.avatarUpdatedAt) || 0) : 0)
        const qs = (v !== null && v !== undefined) ? `?v=${encodeURIComponent(v)}` : ''
        return `${baseUrl}${avatar}${qs}`
      }
      return avatar
    }
    return FALLBACK_AVATAR_DATA_URL
  } catch (e) {
    console.error('getUserAvatar error:', e)
    return FALLBACK_AVATAR_DATA_URL
  }
}

 const handleAvatarError = (event) => {
   event.target.src = FALLBACK_AVATAR_DATA_URL
 }

 const handleAvatarLoad = () => {
   // Avatar chargé avec succès
 }

 const getRandomMatrixChar = () => {
   const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン'
   return chars[Math.floor(Math.random() * chars.length)]
 }

  // Génère une structure stable pour l'animation Matrix afin d'éviter les saccades (pas de Math.random dans le template)
  function getMatrixColumns(seedObj) {
    const seed = String(seedObj?.id || seedObj?.username || seedObj?.name || 'matrix')
    const seededRandom = (s) => {
      let h = 0
      for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
      return () => {
        h = (h * 1664525 + 1013904223) >>> 0
        return (h & 0xfffffff) / 0xfffffff
      }
    }
    const rand = seededRandom(seed)
    const columns = []
    for (let c = 0; c < 20; c++) {
      const delay = (rand() * 2).toFixed(3)
      const chars = []
      for (let r = 0; r < 5; r++) {
        const charsSet = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン'
        const idx = Math.floor(rand() * charsSet.length)
        chars.push(charsSet[idx])
      }
      columns.push({ delay, chars })
    }
    return columns
  }

 // Style d'aperçu pour la bordure classique (couleur sélectionnée)
const classicBorderStyle = computed(() => {
  const selected = coinsStore.borderColors.find(c => c.id === coinsStore.selectedBorderColor)
  if (!selected) {
    return { background: '#000', width: '100%', height: '100%' }
  }
  const style = { width: '100%', height: '100%' }
  if (selected.gradient) {
    style.background = selected.gradient
  } else if (selected.color) {
    style.background = selected.color
  } else {
    style.background = '#000'
  }
  return style
})

// Style de bordure pour l'avatar du leaderboard (appliqué aux utilisateurs listés)
const getAvatarBorderStyle = (user) => {
  try {
    const equipped = getUserEquippedItemData(user)
    // Pas de bordure pour certains overlays ou si la variante/item demande de la retirer
    if (equipped && (equipped.displayType === 'discord' || equipped.name === 'Galaxie' || shouldRemoveLeaderboardBorder(equipped, user))) {
      return { border: 'none', background: 'transparent' }
    }

    // Extraire l'id de base si encodé avec variantes (ex: "red|dv=1|jv=0")
    const raw = user && user.selectedBorderColor ? String(user.selectedBorderColor) : ''
    const baseId = raw.split('|')[0] || ''
    const selected = coinsStore.borderColors.find(c => c.id === baseId)

    // Fallback neutre si l’utilisateur n’a pas de bordure sélectionnée
    if (!selected) {
      return { border: '3px solid #e0e0e0' }
    }

    if (selected.gradient) {
      return {
        border: '3px solid transparent',
        background: `linear-gradient(white, white) padding-box, ${selected.gradient} border-box`
      }
    }
    if (selected.color) {
      return { border: `3px solid ${selected.color}` }
    }
    return { border: '3px solid #e0e0e0' }
  } catch {
    return { border: '3px solid #e0e0e0' }
  }
}

// Style de bordure pour l'aperçu des bordures en prévisualisation d'achat (couleur sélectionnée)
const getPreviewBorderStyle = (item) => {
  try {
    if (!item) return { border: '3px solid #e0e0e0' }
    const baseId = coinsStore.getBorderColorIdFromItem(item)
    const selected = coinsStore.borderColors.find(c => c.id === baseId)
    if (selected && selected.gradient) {
      return { border: '3px solid transparent', background: `linear-gradient(white, white) padding-box, ${selected.gradient} border-box` }
    }
    if (selected && selected.color) {
      return { border: `3px solid ${selected.color}` }
    }
    const cb = coinsStore.currentBorder
    if (cb) {
      if (cb.gradient) return { border: '3px solid transparent', background: `linear-gradient(white, white) padding-box, ${cb.gradient} border-box` }
      if (cb.color) return { border: `3px solid ${cb.color}` }
    }
    return { border: '3px solid #e0e0e0' }
  } catch { return { border: '3px solid #e0e0e0' } }
}

// Style de bordure pour l'aperçu Large/Avatar (priorise la couleur choisie dans la boutique)
const getLargeAvatarBorderStyle = (user) => {
  try {
    const current = coinsStore.currentBorder
    if (coinsStore.equippedItemId === 0 && current) {
      if (current.gradient) {
        return {
          border: '3px solid transparent',
          background: `linear-gradient(white, white) padding-box, ${current.gradient} border-box`
        }
      }
      if (current.color) {
        return { border: `3px solid ${current.color}` }
      }
    }
    const raw = String(user && user.selectedBorderColor ? user.selectedBorderColor : coinsStore.selectedBorderColor || '')
    const baseId = raw.split('|')[0] || ''
    const selected = coinsStore.borderColors.find(c => c.id === baseId)
    if (selected && selected.gradient) {
      return { border: '3px solid transparent', background: `linear-gradient(white, white) padding-box, ${selected.gradient} border-box` }
    }
    if (selected && selected.color) {
      return { border: `3px solid ${selected.color}` }
    }
    return { border: '3px solid #e0e0e0' }
  } catch { return { border: '3px solid #e0e0e0' } }
}

// Variante Jojo pour un utilisateur (0: sans texte, 1: avec texte)
const getJojoVariantIndexForUser = (user) => {
  try {
    const raw = String(user && user.selectedBorderColor ? user.selectedBorderColor : '')
    const part = raw.split('|').find(p => p.startsWith('jv='))
    const val = part ? Number(part.split('=')[1]) : 0
    return val === 1 ? 1 : 0
  } catch { return 0 }
}

 // Fonctions pour la boutique hebdomadaire
 const switchToWeeklyTab = async () => {
  try { activeTab.value = 'weekly' } catch { activeTab = 'weekly' }
  try { showPurchasePreview.value = false } catch { showPurchasePreview = false }
  try { purchasePreviewItem.value = null } catch {}
  try { showSuggestionEditor.value = false } catch {}
  if (authStore.isLoggedIn) {
    if (dynamicInfoById.value.size === 0) {
      await loadDynamicItems()
    }
    await loadWeeklyItems()
    startWeeklyAutoCycle()
  }
}

// Import JSON depuis la boutique (admin): créer l'item puis l'ajouter à la boutique quotidienne

 const loadWeeklyItems = async () => {
   try {
     console.log('🔄 Chargement des items hebdomadaires...')
     const response = await secureApiCall('/coins/weekly-items')
     console.log('📦 Réponse API:', response)
     
     if (response.success) {
       // Normaliser les images avec les assets locaux et forcer le prix Matrix
       const assetById = {
          1: oreilleschat,
          2: clowncheveux,
          3: cash,
          4: target,
          6: roi,
          7: matrix,
          8: angelwings,
          9: laracroft,
          10: star,
          11: cadre,
          12: love,
          13: moustache,
          14: vinyle,
          15: advisory,
          16: spacestars,
          17: bras,
          18: flash,
          19: chat,
          20: dvd,
          21: mlglunette,
          22: nokia
        }
        const assetByName = {
          'Oreilles de chat': oreilleschat,
          'Clown': clowncheveux,
          'Cash': cash,
          'Cible': target,
          'Roi': roi,
          'Matrix': matrix,
          'Ange': angelwings,
          'Tomb Raider': laracroft,
          'Étoiles': star,
          'Cadre royale': cadre,
          'Roses': love,
          'Gentleman': moustache,
          'Vinyle': vinyle,
          'Advisory': advisory,
          'Espace': spacestars,
          'Absolute Cinema': bras,
          'Flash': flash,
          'Miaou': chat,
          'DVD': dvd,
          'Lunettes pixel': mlglunette,
          '2000': nokia
        }
        const patched = (response.weeklyItems || []).map((it) => {
          const fixedImg = assetById[it?.id] || assetByName[it?.name] || it?.img
          // Détecter Discord et attacher les variantes pour le sélecteur
          const isDiscord = (it && it.id == 23) || it?.name === 'Discord'
          // Ne pas surcharger le prix: garder les prix renvoyés par l'API
          if (isDiscord) {
            return { ...it, img: fixedImg, displayType: 'discord', variants: [discordon, discordnepasderange, discordderange], variantIndex: coinsStore.discordVariantIndex || 0 }
          }
          
          // Pour les items dynamiques, récupérer les variantes depuis les items chargés
          const dynamicItem = dynamicInfoById.value.get(it?.id) || dynamicInfoByName.value.get(it?.name)
          if (dynamicItem && dynamicItem.variants && Array.isArray(dynamicItem.variants) && dynamicItem.variants.length > 0) {
            return { 
              ...it, 
              img: fixedImg, 
              isDynamic: true,
              // IMPORTANT: fournir legacyId pour que la lecture/écriture des variantes tombe sur la même clé
              legacyId: (typeof dynamicItem.legacyId !== 'undefined') ? dynamicItem.legacyId : dynamicItem.id,
              variants: dynamicItem.variants,
              assets: dynamicItem.assets,
              backgrounds: dynamicItem.backgrounds
            }
          }
          
          return { ...it, img: fixedImg }
        })
        weeklyItems.value = [...patched].sort((a, b) => { const aid = Number((a.legacyId ?? a.id)); const bid = Number((b.legacyId ?? b.id)); if (Number.isFinite(aid) && Number.isFinite(bid)) return aid - bid; return String(a.name || '').localeCompare(String(b.name || '')); }).sort((a, b) => Number((a.legacyId ?? a.id)) - Number((b.legacyId ?? b.id)))
        timeUntilReset.value = response.timeUntilReset || ''
        try { nextResetAt.value = Date.parse(response.nextReset) || 0 } catch { nextResetAt.value = 0 }
        updateWeeklyTimer()
        startWeeklyAutoCycle()
        console.log('✅ Items hebdomadaires chargés:', weeklyItems.value.length, 'items')
     } else {
        console.error('❌ Erreur API:', response.message)
     }
   } catch (error) {
      console.error('Erreur lors du chargement des items hebdomadaires:', error)
   }
 }

 const updateWeeklyTimer = () => {
   if (weeklyTimer) {
     clearInterval(weeklyTimer)
   }
   
   weeklyTimer = setInterval(() => {
  const targetMs = Number(nextResetAt.value) || 0
  if (!targetMs) return
  const timeLeft = targetMs - Date.now()
  const hours = Math.floor(timeLeft / (1000 * 60 * 60))
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000)
  timeUntilReset.value = `${Math.max(0,hours).toString().padStart(2,'0')}:${Math.max(0,minutes).toString().padStart(2,'0')}:${Math.max(0,seconds).toString().padStart(2,'0')}`
  if (timeLeft <= 0) {
    clearInterval(weeklyTimer)
    weeklyTimer = null
    loadWeeklyItems()
  }
   }, 1000)
}

const WEEKLY_CYCLE_MS = 2500
const weeklyAutoPauseUntilByItem = new Map()
function pauseWeeklyAutoCycleForItem(item, ms = 6000) {
  try {
    const id = (item && (item.legacyId !== undefined ? item.legacyId : item.id))
    if (!Number.isFinite(id)) return
    weeklyAutoPauseUntilByItem.set(Number(id), Date.now() + ms)
  } catch {}
}
function cycleWeeklyItems() {
  try {
    if (showPurchasePreview.value) return
    const base = Array.isArray(weeklyItems.value) ? weeklyItems.value : []
    const visible = (isAdminUser.value && Array.isArray(adminLeftItemsForDisplay.value)) ? adminLeftItemsForDisplay.value : base
    if (!visible.length) return
    for (const item of visible) {
      if (!item) continue
      const normId = (item && (item.legacyId !== undefined ? item.legacyId : item.id))
      const until = weeklyAutoPauseUntilByItem.get(Number(normId))
      if (until && Date.now() < until) continue
      const isDiscord = (item && (item.displayType === 'discord' || item.name === 'Discord' || item.id == 23 || item.legacyId == 23 || item.id == 233 || item.legacyId == 233))
      const isJojo = item.name === 'Jojo'
      const isDynamicMulti = item.isDynamic && Array.isArray(item.variants) && item.variants.length > 1
      if (isDiscord || isJojo || isDynamicMulti) {
        nextItemStyle(item, false, false)
      }
    }
  } catch (e) {
    console.error('Erreur cycleWeeklyItems:', e)
  }
}
function startWeeklyAutoCycle() {
  try {
    if (weeklyAutoCycleTimer) return
    weeklyAutoCycleTimer = window.setInterval(cycleWeeklyItems, WEEKLY_CYCLE_MS)
  } catch {}
}
function stopWeeklyAutoCycle() {
  try {
    if (weeklyAutoCycleTimer) { window.clearInterval(weeklyAutoCycleTimer); weeklyAutoCycleTimer = null }
  } catch {}
}

// Fonctions pour le leaderboard
const sortedLeaderboardUsers = computed(() => {
   if (!leaderboardUsers.value || !leaderboardUsers.value.length) return []
   
   return [...leaderboardUsers.value].sort((a, b) => {
     if (leaderboardFilter.value === 'coins') {
       const av = Number(a?.leaderboardCoins ?? a?.coins ?? 0)
       const bv = Number(b?.leaderboardCoins ?? b?.coins ?? 0)
       return bv - av
     } else {
       return (b.completedTasks || 0) - (a.completedTasks || 0)
     }
   })
 })

 const loadLeaderboardUsers = async () => {
  try {
    const cached = readLeaderboardCache()
    if (Array.isArray(cached.users) && cached.users.length) {
      leaderboardUsers.value = cached.users
    }
    const ttl = 5 * 60 * 1000
    const need = coinsStore.leaderboardNeedsRefresh || !cached.users.length || ((Date.now() - cached.ts) > ttl)
    if (!need) return
    const response = await secureApiCall('/users/leaderboard')
    const arr = Array.isArray(response?.users) ? response.users : (Array.isArray(response) ? response : [])
    if (arr.length) {
      leaderboardUsers.value = arr
      writeLeaderboardCache(arr)
      coinsStore.leaderboardNeedsRefresh = false
    } else {
      leaderboardUsers.value = []
    }
  } catch (error) {
    leaderboardUsers.value = []
  }
}

// Fonction pour charger les données des factions
const loadFactionUsers = async () => {
  try {
    factionLoading.value = true
    const resp = await secureApiCall('/factions/leaderboard', { cache: 'no-store' })

    // Afficher en en-tête le total des PlanifyCoins collectés (totalCoins)
    const fB = (resp?.factions || []).find(f => f.name === 'Bagnat')
    const fF = (resp?.factions || []).find(f => f.name === 'Fermier')
    factionTotalCoins.value = {
      bagnat: Number(fB?.totalCoins ?? 0),
      fermier: Number(fF?.totalCoins ?? 0)
    }

    // Utiliser les clés réelles du backend
    const bagnatList = Array.isArray(resp?.bagnatTopUsers) ? resp.bagnatTopUsers : []
    const fermierList = Array.isArray(resp?.fermierTopUsers) ? resp.fermierTopUsers : []

    // Dédup + helpers de normalisation
    const normalizeId = (u) => u && (u.id || u._id || u.userId || null)
    const normalizeName = (u) => u && (u.username || u.name || u.pseudo || null)
    const currId = authStore.user?.id || authStore.user?._id || null
    const currName = authStore.user?.username || null
    const dedupeByIdOrName = (arr) => {
      const seen = new Set()
      const out = []
      for (const u of (Array.isArray(arr) ? arr : [])) {
        const key = normalizeId(u) || normalizeName(u)
        if (key && seen.has(key)) continue
        if (key) seen.add(key)
        out.push(u)
      }
      return out
    }

    // Tri par coins desc (leaderboardCoins puis coins)
    const coinValue = (u) => {
      const v = Number(u?.leaderboardCoins ?? u?.coins ?? 0)
      return Number.isFinite(v) ? v : 0
    }
    const sortFn = (a, b) => {
      const av = coinValue(a)
      const bv = coinValue(b)
      if (bv !== av) return bv - av
      const an = normalizeName(a) || ''
      const bn = normalizeName(b) || ''
      return an.localeCompare(bn)
    }

    // Listes triées initiales
    const sortedBagnat = [...dedupeByIdOrName(bagnatList)].sort(sortFn)
    const sortedFermier = [...dedupeByIdOrName(fermierList)].sort(sortFn)

    // Détection "moi" robuste (ID prioritaire, sinon name en minuscule)
    const stableKey = (u) => {
      const id = normalizeId(u)
      const nm = (normalizeName(u) || '').trim().toLowerCase()
      return id ? `id:${id}` : `nm:${nm}`
    }
    const meKey = stableKey({ id: currId, username: currName })

    // Retirer "moi" des deux listes, quelle que soit la casse/id
    let cleanedBagnat = sortedBagnat.filter(u => stableKey(u) !== meKey)
    let cleanedFermier = sortedFermier.filter(u => stableKey(u) !== meKey)

    // Faction utilisateur et entrée courante (clés backend)
    userFaction.value = userFaction.value || authStore.user?.faction || null
    currentUserFactionEntry.value = userFaction.value === 'Bagnat'
      ? (resp?.currentUserBagnat || null)
      : userFaction.value === 'Fermier'
        ? (resp?.currentUserFermier || null)
        : null

    // Synchroniser la faction avec le backend si disponible
    try {
      const serverFaction = resp?.currentUserBagnat ? 'Bagnat' : (resp?.currentUserFermier ? 'Fermier' : null)
      if (serverFaction && userFaction.value !== serverFaction) userFaction.value = serverFaction
    } catch {}

    // Synchroniser la faction avec le backend si disponible
    try {
      const serverFaction = resp?.currentUserBagnat ? 'Bagnat' : (resp?.currentUserFermier ? 'Fermier' : null)
      if (serverFaction && userFaction.value !== serverFaction) userFaction.value = serverFaction
    } catch {}

    // Fallback: retrouver l’entrée dans la liste brute si manquante
    if (!currentUserFactionEntry.value) {
      const sourceList = userFaction.value === 'Bagnat' ? bagnatList : (userFaction.value === 'Fermier' ? fermierList : [])
      currentUserFactionEntry.value = (sourceList.find(u =>
        (normalizeId(u) === currId) || ((normalizeName(u) || '').trim().toLowerCase() === (currName || '').trim().toLowerCase())
      ) || null)
    }

    // Fallback équipé depuis le store
    if (currentUserFactionEntry.value && (!currentUserFactionEntry.value.equippedItemId || currentUserFactionEntry.value.equippedItemId === 0)) {
      const storeEq = Number(coinsStore.equippedItemId)
      if (Number.isFinite(storeEq) && storeEq > 0) currentUserFactionEntry.value.equippedItemId = storeEq
    }

    // Réinjection "moi" uniquement dans ma faction courante
    if (currentUserFactionEntry.value) {
      const me = currentUserFactionEntry.value
      const injectKey = stableKey(me)
      cleanedBagnat = cleanedBagnat.filter(u => stableKey(u) !== injectKey)
      cleanedFermier = cleanedFermier.filter(u => stableKey(u) !== injectKey)

      if (userFaction.value === 'Bagnat') {
        cleanedBagnat.push(me)
      } else if (userFaction.value === 'Fermier') {
        cleanedFermier.push(me)
      }
    }

    // Re-tri final et assignation
    const priceByFaction = resp?.priceByFaction || { bagnat: 1, fermier: 1 }
    const mappedBagnat = [...cleanedBagnat].map(u => ({
      ...u,
      coinsForLeaderboard: (u.displayCoins != null) ? u.displayCoins : Math.round(Number(u.factionCoins || 0) * priceByFaction.bagnat)
    }))
    const mappedFermier = [...cleanedFermier].map(u => ({
      ...u,
      coinsForLeaderboard: (u.displayCoins != null) ? u.displayCoins : Math.round(Number(u.factionCoins || 0) * priceByFaction.fermier)
    }))
    factionUsers.value = {
      bagnat: mappedBagnat.sort((a, b) => (Number(b.coinsForLeaderboard || 0) - Number(a.coinsForLeaderboard || 0))),
      fermier: mappedFermier.sort((a, b) => (Number(b.coinsForLeaderboard || 0) - Number(a.coinsForLeaderboard || 0)))
    }

    // Recalcul rang pour l’affichage de l’en-tête si réactivé plus tard
    if (currentUserFactionEntry.value) {
      const baseList = userFaction.value === 'Bagnat' ? factionUsers.value.bagnat : factionUsers.value.fermier
      const me = currentUserFactionEntry.value
      const idx = baseList.findIndex(u => stableKey(u) === stableKey(me))
      currentUserFactionEntry.value.rank = (idx >= 0 ? idx + 1 : baseList.length)
    }
  } catch (error) {
    console.error('Erreur lors du chargement des factions:', error)
    factionUsers.value = { bagnat: [], fermier: [] }
    currentUserFactionEntry.value = null
  } finally {
    factionLoading.value = false
  }
}

// Fonction pour récupérer la faction de l'utilisateur
const loadUserFaction = async () => {
  if (!authStore?.isLoggedIn || !authStore?.user) return
  try {
    const response = await secureApiCall(`/users/${getUserId()}`)
    if (response?.success && response.user) {
      userFaction.value = response.user.faction || null
    } else if (response && (response._id || response.id)) {
      userFaction.value = response.faction
      try { if (authStore?.user) authStore.user.faction = response.faction } catch {}
    }
  } catch (error) {
    console.error('Erreur lors du chargement de la faction utilisateur:', error)
  }
}

// Afficher l'encart "moi" uniquement si je ne suis pas déjà dans le top 10 de ma faction
const shouldShowPinnedMe = (faction) => {
  return false
}

// Timer mensuel des factions (client-side)
const factionCountdownText = ref('')
const factionPeriodLabel = ref('')
let factionTimerId = null

function updateFactionTimer() {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  const nextMonthStart = new Date(y, m + 1, 1, 0, 0, 0, 0)
  const remainMs = Math.max(0, nextMonthStart.getTime() - now.getTime())
  const days = Math.floor(remainMs / 86400000)
  const hours = Math.floor((remainMs % 86400000) / 3600000)
  const minutes = Math.floor((remainMs % 3600000) / 60000)
  const seconds = Math.floor((remainMs % 60000) / 1000)
  factionCountdownText.value = remainMs > 0
    ? `${days}j ${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`
    : 'Bataille terminée — attribution des récompenses'
  const startOfMonth = new Date(y, m, 1)
  const endOfMonthDate = new Date(y, m + 1, 0)
  factionPeriodLabel.value = `${startOfMonth.toLocaleDateString('fr-FR')} → ${endOfMonthDate.toLocaleDateString('fr-FR')}`
}

function isFirstDayOfMonth() {
  try { return new Date().getDate() === 1 } catch { return false }
}

async function triggerMonthlyFactionBalanceIfNeeded() {
  if (!authStore.isLoggedIn) return
  try {
    const d = new Date()
    const key = `monthlyBalance_${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
    if (!isFirstDayOfMonth()) return
    if (localStorage.getItem(key) === 'done') return
    const resp = await secureApiCall('/factions/monthly-balance', { method: 'POST' })
    if (resp && resp.success) {
      localStorage.setItem(key, 'done')
      await loadUserFaction()
      await loadFactionUsers()
    }
  } catch {}
}

// Fonction pour rejoindre une faction
const factionConfirmVisible = ref(false)
const pendingFaction = ref(null)
const CHANGE_COST = 250

const cancelConfirmFaction = () => {
  factionConfirmVisible.value = false
  pendingFaction.value = null
}

const confirmJoinFaction = async () => {
  if (!pendingFaction.value) {
    factionConfirmVisible.value = false
    return
  }
  try {
    joiningFaction.value = true
    const response = await secureApiCall('/factions/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ faction: pendingFaction.value })
    })

    if (response?.success) {
      userFaction.value = response.faction

      try {
        const uid = authStore.user?._id || authStore.user?.id
        currentUserFactionEntry.value = {
          _id: uid,
          id: uid,
          username: authStore.user?.username || authStore.user?.name || '',
          coins: response.coins ?? currentUserFactionEntry.value?.coins ?? 0,
          leaderboardCoins: response.leaderboardCoins ?? currentUserFactionEntry.value?.leaderboardCoins ?? 0,
          rank: null,
          faction: response.faction
        }
      } catch {}

      try { window.dispatchEvent(new CustomEvent('achievement-unlocked', { detail: { id: 'faction-join' } })) } catch {}
      try { await coinsStore.loadBalance() } catch {}
      await loadFactionUsers()
    } else {
      const msg = response?.message || 'Échec de l’adhésion à la faction'
      try { alert(msg) } catch {}
      console.error('Erreur join:', response)
    }
  } catch (e) {
    console.error('Erreur join faction:', e)
    try { alert('Erreur lors de la demande d’adhésion') } catch {}
  } finally {
    joiningFaction.value = false
    factionConfirmVisible.value = false
    pendingFaction.value = null
  }
}

async function doJoinFaction(factionName, viaConfirm = false) {
  try {
    // Fermer la modale si elle était ouverte
    try { factionConfirmVisible.value = false } catch {}
    joiningFaction.value = true

    const response = await secureApiCall('/factions/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ faction: factionName })
    })

    if (response?.success) {
      userFaction.value = response.faction

      try {
        const uid = authStore.user?._id || authStore.user?.id
        currentUserFactionEntry.value = {
          _id: uid,
          id: uid,
          username: authStore.user?.username || authStore.user?.name || '',
          coins: response.coins ?? currentUserFactionEntry.value?.coins ?? 0,
          leaderboardCoins: response.leaderboardCoins ?? currentUserFactionEntry.value?.leaderboardCoins ?? 0,
          rank: null,
          faction: response.faction
        }
      } catch {}

      try { window.dispatchEvent(new CustomEvent('achievement-unlocked', { detail: { id: 'faction-join' } })) } catch {}
      // Rafraîchir le solde du wallet après déduction
      try { await coinsStore.loadBalance() } catch {}

      // Recharger complètement la liste pour éviter les doublons et recalculer le rang
      await loadFactionUsers()
    } else {
      const msg = response?.message || 'Échec de l’adhésion à la faction'
      try { alert(msg) } catch {}
      console.error('Erreur lors du join:', response)
    }
  } catch (error) {
    console.error('Erreur lors du join de faction:', error)
    try { alert('Erreur lors de la demande d’adhésion') } catch {}
  } finally {
    joiningFaction.value = false
  }
}

const joinFaction = async (factionName) => {
  try {
    const isChanging = !!userFaction.value && userFaction.value !== factionName
    if (isChanging) {
      pendingFaction.value = factionName
      factionConfirmVisible.value = true
      return
    }

    // Première adhésion: pas de coût → join direct
    joiningFaction.value = true
    const response = await secureApiCall('/factions/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ faction: factionName })
    })

    if (response?.success) {
      userFaction.value = response.faction

      try {
        const uid = authStore.user?._id || authStore.user?.id
        currentUserFactionEntry.value = {
          _id: uid,
          id: uid,
          username: authStore.user?.username || authStore.user?.name || '',
          coins: response.coins ?? currentUserFactionEntry.value?.coins ?? 0,
          leaderboardCoins: response.leaderboardCoins ?? currentUserFactionEntry.value?.leaderboardCoins ?? 0,
          rank: null,
          faction: response.faction
        }
      } catch {}

      try { window.dispatchEvent(new CustomEvent('achievement-unlocked', { detail: { id: 'faction-join' } })) } catch {}
      await loadFactionUsers()
    } else {
      console.error('Erreur lors du join:', response?.message)
      try { alert('Échec de l’adhésion à la faction') } catch {}
    }
  } catch (error) {
    console.error('Erreur lors du join de faction:', error)
    try { alert('Erreur lors de la demande d’adhésion') } catch {}
  } finally {
    joiningFaction.value = false
  }
}

 // Sync faction equip state for current user across faction lists
 function syncFactionEquipForCurrentUser(newEquippedId) {
  try {
    const meId = authStore.user?._id || authStore.user?.id
    const meName = authStore.user?.username || authStore.user?.name || ''
    if (!meId && !meName) return

    const updateList = (list) => {
      if (!Array.isArray(list)) return
      const idx = list.findIndex(u =>
        String(u._id || u.id) === String(meId) ||
        String(u.username || u.name) === String(meName)
      )
      if (idx >= 0) {
        list[idx] = { ...list[idx], equippedItemId: newEquippedId ?? null }
      }
    }

    if (factionUsers?.value) {
      updateList(factionUsers.value.bagnat)
      updateList(factionUsers.value.fermier)
    }
    if (currentUserFactionEntry?.value) {
      currentUserFactionEntry.value = {
        ...currentUserFactionEntry.value,
        equippedItemId: newEquippedId ?? null
      }
    }
  } catch (e) {
    console.warn('syncFactionEquipForCurrentUser failed:', e)
  }
 }

 // Fonctions pour les achats
 const buyItem = async (item) => {
   try {
     const result = await coinsStore.purchaseItem(item)
     if (!result || !result.success) {
       console.error('Erreur lors de l\'achat:', result?.message)
      } else { 
        playSound(achatSound)
        // Recharger le leaderboard pour afficher le score historique (non décrémenté)
        await loadLeaderboardUsers()
      }
   } catch (error) {
     console.error('Erreur lors de l\'achat:', error)
   }
 }

 const equipItem = async (item) => {
   try {
     if (coinsStore.isItemEquipped(item.id)) {
       // Déséquiper l'item
       const response = await secureApiCall('/coins/unequip', {
         method: 'POST',
         body: JSON.stringify({ itemId: item.id })
       })
       
       if (response.success) {
         coinsStore.unequipItem()
         emit('equip-item', null)
          playSound(annulerSound)

          // Mise à jour factions (LIVE)
          syncFactionEquipForCurrentUser(null)
          if (leaderboardFilter.value === 'factions') {
            await loadFactionUsers()
          }
       }
     } else {
       // Équiper l'item
       const response = await secureApiCall('/coins/equip', {
         method: 'POST',
         body: JSON.stringify({ itemId: item.id })
       })
       
       if (response.success) {
         coinsStore.equipItem(item.id)
         emit('equip-item', item)
          playSound(selectionSound)

          // Mise à jour factions (LIVE)
          syncFactionEquipForCurrentUser(item.id)
          if (leaderboardFilter.value === 'factions') {
            await loadFactionUsers()
          }
       }
     }
   } catch (error) {
     console.error('Erreur lors de l\'équipement:', error)
   }
 }



function shouldRenderStaticOverlay(item) {
  if (!item || item.isDynamic) return false
  const special = ['discord', 'coeur', 'alpha', 'admin-planify', 'roi', 'tomb-raider', 'cash', 'target', 'gentleman', 'espace', 'lunettes-pixel', 'nokia', 'jojo']
  return !special.includes(item.displayType) && item.name !== 'Galaxie'
}

 // Lifecycle hooks
onMounted(() => {
  // Chargements différés: effectuer les appels réseau seulement quand la popup s'ouvre
})

onUnmounted(() => {
  if (weeklyTimer) {
    clearInterval(weeklyTimer)
  }
  if (weeklyAutoCycleTimer) {
    window.clearInterval(weeklyAutoCycleTimer)
    weeklyAutoCycleTimer = null
  }
  if (factionTimerId) {
    window.clearInterval(factionTimerId)
    factionTimerId = null
  }
  // Sécurité: réactiver le scroll de la page si la popup était ouverte
  unlockBodyScroll()
})

 // Watchers
 watch(activeTab, (newTab) => {
   if (!authStore.isLoggedIn) return
   if (newTab === 'leaderboard' && showLeaderboardTab.value) {
     stopWeeklyAutoCycle()
     loadLeaderboardUsers()
   } else if (newTab === 'weekly') {
     loadWeeklyItems()
    startWeeklyAutoCycle()
   } else {
     stopWeeklyAutoCycle()
   }
 })

 // Charger les factions quand on sélectionne l'onglet factions
 watch(leaderboardFilter, (newFilter) => {
  if (!authStore.isLoggedIn) return
  if (newFilter === 'factions') {
    loadFactionUsers()
    updateFactionTimer()
  }
})

 // Rafraîchir les factions quand l'item équipé change (local store)
 watch(() => coinsStore.equippedItemId, async (newId, oldId) => {
   try {
     // Synchroniser immédiatement l’entrée locale
     syncFactionEquipForCurrentUser(newId ?? null)
     // Si l’onglet Factions est affiché, recharger depuis le backend pour capturer aussi les autres utilisateurs
     if (leaderboardFilter.value === 'factions') {
       await loadFactionUsers()
     }
   } catch (e) {
     console.warn('Erreur lors du rafraîchissement des factions après changement d’item:', e)
   }
 })

 // Rafraîchir le leaderboard après un gain (roue de la fortune)
 watch(() => coinsStore.leaderboardNeedsRefresh, async (needs) => {
   try {
     if (needs) {
       await loadLeaderboardUsers()
       coinsStore.leaderboardNeedsRefresh = false
       // Aussi rafraîchir les factions si on est sur cet onglet
       if (leaderboardFilter.value === 'factions') {
         await loadFactionUsers()
       }
     }
   } catch (e) {
     console.error('Erreur lors de lactualisation du leaderboard:', e)
   }
 })
</script>

 <style scoped>
.shop-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  overscroll-behavior: auto;
  touch-action: auto;
}

.shop-modal {
  background: #1a1a1a;
  border-radius: 24px;
  padding: 0px 40px 40px 40px;
  max-width: 1800px;
  max-height: 92vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.5);
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: auto;
  touch-action: auto;
  scrollbar-gutter: stable;
  color: #fff;
}

[data-theme="light"] .shop-modal {
  background: #ffffff !important;
  color: #111111 !important;
  border: 1px solid #E9E9EA !important;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.15) !important;
}

/* Scrollbar interne – décale visuellement et évite le débord sur coins arrondis */
.shop-modal::-webkit-scrollbar,
.leaderboard-list::-webkit-scrollbar,
.faction-leaderboard-list::-webkit-scrollbar { width: 10px; }

.shop-modal::-webkit-scrollbar-track,
.leaderboard-list::-webkit-scrollbar-track,
.faction-leaderboard-list::-webkit-scrollbar-track { background: transparent; margin: 12px 0; }

.shop-modal::-webkit-scrollbar-thumb,
.leaderboard-list::-webkit-scrollbar-thumb,
.faction-leaderboard-list::-webkit-scrollbar-thumb { background: #cfcfcf; border-radius: 8px; }

/* Barre de recherche Collection */
.collection-search { display: flex; align-items: center; gap: 12px; margin: 0 0 16px 0; }
.collection-search-input { width: 100%; max-width: 420px; padding: 10px 12px; border: 1px solid #E9E9EA; border-radius: 12px; background: #fff; color: #111; }
[data-theme="dark"] .collection-search-input { background: #222; color: #fff; border-color: #333; }
@media (max-width: 480px) {
  .collection-search { flex-direction: column; align-items: center; gap: 8px; }
  .collection-search-input { margin: 0 auto; max-width: 250px; }
  .collection-search .info-icon-btn { align-self: center; }
  .collection-search .tab-btn { width: 250px; max-width: 250px; display: block; margin: 4px 0 0; }
}

/* Éditeur de suggestion d'item */
.suggest-editor { background: #f9fafb; border: 2px solid #5bc682; border-radius: 12px; padding: 12px; margin-bottom: 16px; color: #111; }
[data-theme="dark"] .suggest-editor { background: #111; color: #fff; border-color: #333; }
.suggest-controls { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 10px; }
.suggest-previews { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.preview-block { background: #fff; border: 1px solid #E9E9EA; border-radius: 10px; padding: 10px; }
[data-theme="dark"] .preview-block { background: #222; border-color: #333; }
.preview-title { font-weight: 600; font-size: 14px; margin-bottom: 8px; }
.preview-box { position: relative; width: 100px; height: 100px; margin: 0 auto; border-radius: 12px; overflow: hidden; background: #fff; border: 3px solid #5bc682; }
.collection-preview { width: 100px; height: 100px; border-radius: 50%; }
.leaderboard-preview { width: 57px; height: 57px; border-radius: 50%; }
.avatar-preview { width: 150px; height: 150px; border-radius: 24px; }
.avatar-preview.noBorder { border: none !important; }
.suggest-img { max-width: 100%; max-height: 100%; position: absolute; object-fit: contain; }
.preview-actions { display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 8px; }
.price-input { width: 100px; padding: 6px; border: 1px solid #E9E9EA; border-radius: 8px; }
.url-input { width: 220px; padding: 6px; border: 1px solid #E9E9EA; border-radius: 8px; }
.fenetre-collection .draggable { transition: top 0.3s ease, left 0.3s ease; }

.jojo-default-label { font-size: 12px; color: #111; }
[data-theme="dark"] .jojo-default-label { color: #000 !important; }

.close-btn {
  position: absolute;
  top: 12px;
  right: 16px;
  background: transparent;
  border: none;
  width: 40px;
  height: 40px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  transition: transform 0.25s, filter 0.25s;
}
.close-img {
  width: 32px;
  height: 32px;
  display: block;
  filter: grayscale(0.5) brightness(0.95);
  transition: transform 0.25s, filter 0.25s;
}
.close-btn:hover .close-img {
  transform: scale(1.18);
  filter: grayscale(0) brightness(1.1);
}
.header-close { position: static; right: auto; top: auto; width: 60px; height: 60px; padding: 0; }
.header-close .close-img { width: 48px; height: 48px; }

.shop-title {
  text-align: left;
  margin: 0 0 12px 0;
  color: #00c97b;
  font-size: 3.4rem;
}
.shop-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}
.header-left { display: flex; flex-direction: column; gap: 6px; }
.header-info-row { display: flex; align-items: flex-start; gap: 12px; }
@media (max-width: 480px) {
  .header-info-row { display: flex; flex-direction: column; align-items: center; }
}
.coins-wallet { background: #ffd84a; border: 2px solid #5bc682; border-radius: 12px; padding: 20px 14px; display: inline-flex; align-items: center; gap: 8px; color: #111; box-shadow: 0 4px 10px rgba(0,0,0,0.12); }
.coins-wallet .coin-icon { width: 22px; height: 22px; }
.coins-wallet .coins-value { font-size: 20px; line-height: 1; }
.header-right { display: flex;    align-items: center; gap: 8px; margin-left: auto; justify-content: flex-end; }
.item-img-wrapper { position: relative; }
.item-img-wrapper .apercu-icon { position: absolute; top: 8px; left: 10px; z-index: 2; }
.item-img-wrapper .palette-icon { position: absolute; top: 8px; right: 10px; z-index: 2; }
.item-img-wrapper .style-nav-btn { position: absolute; top: 50%; transform: translateY(-50%); width: 26px; height: 26px; border: 2px solid #5bc682; border-radius: 50%; background: transparent; color: #5bc682; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 3; }
.item-img-wrapper .style-nav-btn.left-btn { left: 8px; }
.item-img-wrapper .style-nav-btn.right-btn { right: 8px; }
.item-img-wrapper .style-nav-btn svg { width: 14px; height: 14px; }
[data-theme="dark"] .item-img-wrapper .style-nav-btn:hover { background: #fff; }
[data-theme="light"] .item-img-wrapper .style-nav-btn:hover { background: #000; }
.item-img-wrapper .style-nav-btn.style-btn-anim { animation: styleBtnSwap 220ms ease-in-out; }
@keyframes styleSwap { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.04); opacity: 0.92; } 100% { transform: scale(1); opacity: 1; } }
@keyframes styleBtnSwap { 0% { transform: translateY(-50%) scale(1); opacity: 1; } 50% { transform: translateY(-50%) scale(1.04); opacity: 0.92; } 100% { transform: translateY(-50%) scale(1); opacity: 1; } }
.item-img-container.style-change-anim { animation: styleSwap 220ms ease-in-out; }
.preview-card.preview-item .discord-item-preview { width: 60% !important; height: 75% !important; object-fit: contain !important; }
/* Ange (PC) – Cosmétique: image générique ciblée par alt */
.preview-card.preview-item img.item-img[alt="Ange"] { position: absolute !important; top: -5% !important; width: 65% !important; left: 19%; }
.weekly-color-chip { position: absolute; top: 8px; left: 8px; background: #111; color: #fff; border-radius: 6px; padding: 4px 8px; font-size: 12px; font-weight: 700; z-index: 2; }

.coins-balance {
  position: absolute;
  top: 0px;
  right: 8px;
  z-index: 11;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 12px;
  background: #fff;
  border: 2px solid #dddddd;
  color: #111;
  font-weight: bold;
  font-size: 16px;
}

.coin-icon {
  width: 20px;
  height: 20px;
}

/* Leaderboard: garantir le curseur pointer sur toute la zone cliquable */
.leaderboard-container .user-avatar-container,
.leaderboard-container .user-avatar,
.leaderboard-container .user-avatar .avatar-img {
  cursor: pointer;
  position: relative !important;
}

/* Leaderboard: empêcher les overlays (au-dessus) de bloquer le hover/clic/curseur */
.leaderboard-container .user-avatar-container img[class^="equipped-"],
.leaderboard-container .user-avatar img[class^="equipped-"],
.leaderboard-container .user-avatar-container img[class$="-overlay"],
.leaderboard-container .user-avatar img[class$="-overlay"] {
  pointer-events: none !important;
}

.shop-tabs {
  display: flex;
  gap: 4px;
  margin: 0;
  padding: 0;
  align-items: center;
  justify-content: flex-start;
}
  
  .tab-btn {
  padding: 12px 20px;
  border: none;
  background: #f8f9fa;
  border-radius: 10px;
  font-size: 15px;
  cursor: pointer;
  color: #666;
  border: 2px #5150503d solid;
  transition: all 0.3s;
  position: relative;
}

.tab-btn:hover {
  background: #e9ecef;
  color: #333;
}

.tab-btn.active {
  background: #5bc682;
  color: white;
    border: none !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 201, 123, 0.3);
}

  /* Retire aussi la bordure pendant le clic/focus pour améliorer la sensation */
  .tab-btn:active,
  .tab-btn:focus {
    border: none !important;
    outline: none !important;
  }

  

.weekly-reset-notification {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #ff4757;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}

.weekly-timer {
  background: #fff;
  color: #111;
  border: 2px solid #5bc682;
  padding: 15px;
  border-radius: 12px;
  text-align: center;
  margin-bottom: 20px;
}
@media (max-width: 480px) {
  .weekly-timer { margin-bottom: 0px !important; }
}

.timer-info {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
}


  
  .timer-value {
    font-size: 20px;
    font-variant-numeric: tabular-nums;
  }

  .weekly-shop-container {
    display: grid;
    grid-template-columns: 0fr 0.3fr;
    gap: 18px;
    align-items: stretch;
  }
  .weekly-shop-container.single-col { grid-template-columns: 1fr; justify-items: center; }

  .weekly-section {
  display: flex;
  flex-direction: column;
    gap: 20px;
  }

  .section-title {
    font-size: 24px;
    color: #333;
    text-align: center;
    margin: 0;
    padding: 10px 0;
    border-bottom: 2px solid #5bc682;
  }


  .border-preview {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  position: relative;
  background: #fff;
}

  .weekly-border-circle {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: #eee;
  }

    .border-avatar-placeholder {
    width: 60px;
    height: 60px;
    background: #6c757d;
    border-radius: 50%;
    position: relative;
    box-shadow: inset 0 0 0 3px #fff;
  }

  /* Style spécifique pour la boutique hebdomadaire */
  .weekly-shop-container .shop-grid {
    display: grid !important;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }
  .weekly-shop-container .shop-item {
    background: #f3f5f7;
    border: 3px solid #e7e9ec;
    border-radius: 16px;
    padding: 16px;
    box-shadow: 0 8px 18px rgba(0,0,0,0.08);
    position: relative;
  }
  .weekly-shop-container .item-actions {
    align-items: initial !important;
  }
  .weekly-shop-container .weekly-section:first-child .shop-item .item-img-wrapper {
    background: #fff;
    border: 5px solid #5bc682;
    border-radius: 30px;
    width: 235px !important;
    height: 140px !important;
    margin: 0 25px 12px !important;
    position: relative;
  }
  .weekly-shop-container .weekly-section:first-child .shop-item.weekly-item.small-card {
    width: 323px !important;
    max-width: 323px !important;
    justify-self: center;
  }
  .weekly-shop-container .weekly-section:nth-of-type(2) .shop-item .item-img-wrapper {
    background: #fff;
    border: 5px solid #5bc682;
    border-radius: 30px;
    width: 235px !important;
    height: 140px !important;
    margin: 0 auto 12px !important;
    position: relative;
  }
  .weekly-shop-container .weekly-section:nth-of-type(2) .shop-item.weekly-item.small-card {
    width: 323px !important;
    max-width: 323px !important;
    justify-self: center;
  }
  .weekly-shop-container .shop-item .item-name {
    background: #fff;
    border: 2px solid #5bc682;
    border-radius: 14px;
    padding: 12px 16px;
    margin-bottom: 4px;
    font-weight: 800;
    font-size: 18px;
    color: #111;
  }
  .weekly-shop-container .shop-item .item-price {
    background: #fff;
    border: 2px solid #5bc682;
    border-radius: 14px;
    padding: 12px 16px;
    margin-bottom: 2px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    color: #111;
    font-weight: 800;
    font-size: 16px;
  }
  .weekly-shop-container .item-actions .buy-btn,
  .weekly-shop-container .item-actions .owned-btn,
  .weekly-shop-container .item-actions .info-btn {
    border-radius: 14px;
    padding: 14px 22px;
    font-size: 16px;
    font-weight: 800;
  }
  .weekly-shop-container .item-actions .buy-btn { background: #5bc682; color: #fff; }
  .weekly-shop-container .item-actions .owned-btn { background: #d9d9d9; color: #fff; cursor: default; }
  .weekly-shop-container .item-actions .info-btn { background: #5bc682; color: #fff; }
  .weekly-shop-container .admin-preview-toolbar { display: flex; gap: 8px; justify-content: flex-end; margin: 8px 0; }
  .weekly-shop-container .admin-preview-toolbar button { background: #5bc682; color: #fff; border: 3px solid #000; border-radius: 12px; padding: 6px 10px; font-weight: 800; cursor: pointer; }
  .weekly-shop-container .admin-preview-toolbar button:hover { filter: brightness(0.95); }
.weekly-shop-container .preview-slider-controls { position: relative; display: flex; gap: 8px; justify-content: center; margin: 8px 0; z-index: 1000; }
.weekly-shop-container .preview-slider-controls .left-arrow { position: absolute; left: 0; top: -10px; z-index: 1001; }
.weekly-shop-container .preview-slider-controls .right-arrow { position: absolute; right: 0; top: -10px; z-index: 1001; }
@media (max-width: 1024px) {
  .weekly-shop-container .preview-slider-controls { display: none !important; }
}
.suggest-slider-enter-active, .suggest-slider-leave-active { transition: transform 0.38s ease-in-out, opacity 0.2s ease-out; will-change: transform; }
.suggest-slider-enter-from, .suggest-slider-leave-to { opacity: 0; }
.suggest-slider-move { transition: none !important; }
.slide-left .suggest-slider-enter-from { transform: translateX(-40px); }
.slide-left .suggest-slider-leave-to { transform: translateX(40px); }
.slide-right .suggest-slider-enter-from { transform: translateX(40px); }
.slide-right .suggest-slider-leave-to { transform: translateX(-40px); }
  .weekly-section:first-child .shop-grid.small-grid { grid-template-columns: repeat(2, 1fr) !important; height: 100%; align-items: stretch; grid-auto-rows: 1fr; gap: 12px !important; width: 658px !important; margin-left: auto; margin-right: auto; }
  @media (max-width: 768px) {
    .weekly-section:first-child .shop-grid {
      display: flex !important;
      grid-template-columns: repeat(1, 1fr) !important;
    }
    .weekly-shop-container .weekly-section:first-child .shop-item.weekly-item.small-card {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      max-width: 250px !important;
    }
    .weekly-shop-container .weekly-section:first-child .shop-item .item-img-wrapper {
      width: 190px !important;
    }
    .weekly-shop-container .weekly-section:first-child .item-actions .buy-btn,
    .weekly-shop-container .weekly-section:first-child .item-actions .buy-btn.price-hover {
      display: block;
      width: 190px !important;
      max-width: 190px !important;
      margin: 0 auto;
    }
    .weekly-shop-container .weekly-section:nth-of-type(2) .shop-item.weekly-item.small-card {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      max-width: 250px !important;
    }
    .weekly-shop-container .weekly-section:nth-of-type(2) .shop-item .item-img-wrapper {
      width: 190px !important;
    }
    .weekly-shop-container .weekly-section:nth-of-type(2) .item-actions .buy-btn,
    .weekly-shop-container .weekly-section:nth-of-type(2) .item-actions .buy-btn.price-hover {
      display: block;
      width: 190px !important;
      max-width: 190px !important;
      margin: 0 auto;
    }
    .weekly-shop-container .item-actions .buy-btn { border-radius: 12px !important; }
    .weekly-shop-container .moustache-img-shop { top: 65px !important; left: 50px !important; }
    .weekly-shop-container .gentleman-img-shop { top: 20px !important; left: 37px !important; }
  }
  .weekly-section:first-child .shop-grid .tall-card { height: 100%; display: flex; flex-direction: column; }
  .weekly-section:first-child .shop-grid .tall-card .item-actions { margin-top: auto; }
  .small-grid { display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 12px !important; }
  .weekly-preview { margin-top: 8px; grid-column: 1 / -1; width: 1235.45px; margin-left: auto; margin-right: auto; }
  .preview-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; align-items: stretch; justify-items: center; height: 100%; }
  .preview-card { width: 100%; max-width: 390px; }
  .preview-slider-viewport { overflow: hidden; }
.preview-slider-track { display: flex; gap: 6px; align-items: stretch; justify-content: flex-start; will-change: transform; }
.preview-slider-track .preview-card { flex: 0 0 390px; max-width: 390px; }
@media (max-width: 1024px) {
  .preview-slider-viewport { overflow: visible !important; width: 100% !important; }
  .preview-slider-track { flex-direction: column; align-items: center; justify-content: flex-start; }
  .preview-slider-track .preview-card { flex: 0 0 auto; width: 100%; max-width: 302px; margin: 0 auto; }
}
  .preview-card.preview-collection .item-img-wrapper.large { position: relative; width: 90px; height: 90px; background: transparent; overflow: hidden; border: 3px solid rgb(61, 220, 132); border-radius: 50%; margin: 0 auto; }
  .preview-card.preview-collection .item-img-wrapper.large.mobile-mode { width: 80px; height: 80px; }
  .preview-card.preview-collection .item-img-container { position: relative; width: 100%; height: 100%; background: transparent; overflow: visible; border: none; }
  .preview-card.preview-leaderboard { max-width: 390px; }
  .preview-card.preview-avatar { max-width: 390px; }
  .preview-card.preview-popup-style .item-img-wrapper.large { position: relative; width: 120.5px; height: 64px; margin: 0 auto; border-radius: 12px; }
  .preview-card.preview-avatar:not(.roi-preview) .profile-avatar-stage { border: none; border-radius: 30px; width: 351px !important; height: 250px !important; box-sizing: border-box; }
  .preview-card.preview-avatar:not(.roi-preview) .profile-avatar-scaler { width: 351px !important; height: 250px !important; display:flex; align-items:center; justify-content:center; border: 5px solid #5bc682; border-radius: 30px; box-sizing: border-box; margin: 0 auto; position: relative; }
  .preview-card.preview-avatar .profile-avatar { width: 150px !important; height: 150px !important; border-width: 5px !important; }
  .preview-card.preview-avatar.roi-preview .profile-avatar-stage { height: 400px !important; }
  .preview-card.preview-avatar.roi-preview .profile-avatar-scaler { width: 345px !important; height: 400px !important; border: 5px solid #5bc682 !important; border-radius: 30px !important; }
  .preview-card.preview-avatar.roi-preview .equipped-roi-overlay { top: 30px !important; left: 85px !important; width: 55% !important; height: 27% !important; z-index: 15; }
  .preview-card.preview-avatar.gentleman-preview .profile-avatar-stage { height: 400px !important; }
  .preview-card.preview-avatar.gentleman-preview .profile-avatar-scaler { width: 345px !important; height: 400px !important; }
  .preview-card.preview-avatar.vinyle-preview .profile-avatar-stage { height: 400px !important; }
  .preview-card.preview-avatar.vinyle-preview .profile-avatar-scaler { width: 345px !important; height: 400px !important; }
  .preview-card.preview-avatar.vinyle-preview .equipped-vinyle-overlay { left: 50% !important; top: 52% !important; width: 115% !important; height: 115% !important; transform: translate(-50%, -72%) scale(1.08) !important; }
  .preview-card.preview-avatar.nokia-preview .profile-avatar-stage { height: 400px !important; }
  .preview-card.preview-avatar.nokia-preview .profile-avatar-scaler { width: 345px !important; height: 400px !important; }
  .preview-card.preview-avatar .matrix-char { font-size: 16px; line-height: 16px; }
  .preview-card.preview-avatar .profile-avatar-scaler .equipped-angel-wings { top: -70px !important; left: 0px !important; width: 100% !important; height: 84% !important; }
  .preview-card.preview-avatar .profile-avatar-scaler .equipped-tomb-raider { position: absolute !important; top: 0px !important; left: 50px !important; width: 71% !important; height: 45% !important; z-index: 2 !important; }
.preview-card.preview-avatar .profile-avatar-scaler:has(.equipped-angel-wings) { height: 400px !important; }
.preview-card.preview-avatar .profile-avatar-wrap:has(.equipped-tomb-raider) { height: 400px !important; }
.preview-card.preview-avatar .profile-avatar-stage:has(.equipped-tomb-raider) { height: 400px !important; }
.preview-card.preview-avatar .profile-avatar-scaler:has(.equipped-tomb-raider) { height: 400px !important; }
  .preview-card.preview-leaderboard .equipped-roi-overlay { width: 22% !important; }

.preview-card.preview-avatar .profile-avatar-scaler .equipped-cat-ears { position: absolute !important; left: 49% !important; top: 52% !important; width: 55% !important; height: 75% !important; object-fit: contain !important; transform: translate(-50%, -72%) scale(1.25) !important; transform-origin: center bottom !important; pointer-events: none !important; z-index: 16 !important; }
.preview-card.preview-avatar .profile-avatar-scaler .equipped-clown-overlay { position: absolute !important; left: 50% !important; top: 72% !important; width: 60% !important; height: 72% !important; object-fit: contain !important; transform: translate(-50%, -85%) scale(1.18) !important; transform-origin: center bottom !important; pointer-events: none !important; z-index: 16 !important; }
.preview-card.preview-avatar .profile-avatar-scaler .equipped-vinyle-overlay { position: absolute !important; left: 50% !important; top: 36% !important; width: 30% !important; height: 48% !important; object-fit: contain !important; transform: translate(-50%, -72%) scale(1.05) !important; transform-origin: center bottom !important; pointer-events: none !important; z-index: 16 !important; }
  .preview-card.preview-avatar .profile-avatar-scaler .equipped-stars { position: absolute !important; left: 50% !important; top: 64% !important; width: 50% !important; height: 63% !important; object-fit: contain !important; transform: translate(-50%, -72%) scale(1.02) !important; transform-origin: center bottom !important; pointer-events: none !important; z-index: 16 !important; }
  .preview-card.preview-avatar .profile-avatar-scaler .equipped-rainbow { position: absolute !important; left: 50% !important; top: 75% !important; width: 45% !important; height: 51% !important; object-fit: contain !important; transform: translate(-50%, -85%) scale(1.3) !important; transform-origin: center bottom !important; pointer-events: none !important; z-index: 16 !important; }
  .preview-card.preview-avatar .profile-avatar-scaler .equipped-royal-frame { position: absolute !important; left: 50% !important; top: 82% !important; width: 77% !important; height: 89% !important; object-fit: contain !important; transform: translate(-50%, -85%) scale(1.02) !important; transform-origin: center bottom !important; pointer-events: none !important; z-index: 16 !important; }
  .preview-card.preview-avatar .profile-avatar-scaler .equipped-gentleman-overlay { position: absolute !important; left: 50% !important; top: 35% !important; width: 53% !important; height: 26% !important; object-fit: contain !important; transform: translate(-50%, -72%) scale(1.02) !important; transform-origin: center bottom !important; pointer-events: none !important; z-index: 16 !important; }
.preview-card.preview-avatar .profile-avatar-scaler .equipped-asteroide-overlay { position: absolute !important; left: 38% !important; top: 75% !important; width: 25% !important; height: 30% !important; object-fit: contain !important; transform: translate(-50%, -72%) scale(1.0) !important; transform-origin: center bottom !important; pointer-events: none !important; z-index: 16 !important; }
.preview-card.preview-avatar .profile-avatar-scaler .equipped-absolute-cinema-overlay { position: absolute !important; left: 4.5% !important; top: 5% !important; width: 34% !important; height: 70% !important; object-fit: contain !important; z-index: 16 !important; }
.preview-card.preview-avatar .profile-avatar-scaler .equipped-absolute-cinema-overlay-right { position: absolute !important; left: 61.5% !important; top: 5% !important; width: 34% !important; height: 70% !important; object-fit: contain !important; z-index: 16 !important; }
.preview-card.preview-avatar .profile-avatar-scaler .equipped-pate-overlay { position: absolute !important; left: 20% !important; top: 78% !important; width: 35% !important; height: 35% !important; object-fit: contain !important; pointer-events: none !important; z-index: 16 !important; }
.preview-card.preview-avatar .profile-avatar-scaler .equipped-flash-overlay { left: 26% !important; z-index: 15; }
.preview-card.preview-avatar .profile-avatar .equipped-clown-nose { position: absolute !important; left: 50% !important; top: 52% !important; width: 60% !important; height: auto !important; object-fit: contain !important; transform: translate(-50%, -40%) !important; pointer-events: none !important; z-index: 16 !important; }
.preview-card.preview-avatar .profile-avatar .equipped-moustache-inside { position: absolute !important; left: 50% !important; top: 63% !important; width: 70% !important; transform: translate(-50%, -50%) !important; object-fit: contain !important; z-index: 16 !important; }
.preview-card.preview-avatar .profile-avatar .equipped-spacestars-inside { position: absolute !important; left: 50% !important; top: 50% !important; width: 100% !important; height: 100% !important; transform: translate(-50%, -50%) !important; object-fit: contain !important; z-index: 14 !important; }
.preview-card.preview-avatar .profile-avatar .equipped-lunettes-pixel-inside { position: absolute !important; left: 50% !important; top: 50% !important; width: 100% !important; transform: translate(-50%, -50%) !important; object-fit: contain !important; z-index: 16 !important; }
.preview-card.preview-avatar .profile-avatar .equipped-matrix-glasses { position: absolute !important; left: 50% !important; top: 45% !important; width: 85% !important; transform: translate(-50%, -50%) !important; object-fit: contain !important; z-index: 16 !important; }
.preview-card.preview-avatar .profile-avatar .equipped-dvd-inside { position: absolute !important; left: 50%; top: 55%; width: 80% !important; transform: translate(-50%, -50%) !important; object-fit: contain !important; z-index: 16 !important; animation: dvdBounceShopLarge 4s linear infinite !important; will-change: top, left; backface-visibility: hidden; }
.preview-card.preview-avatar .profile-avatar .equipped-advisory-inside { position: absolute !important; left: 80% !important; top: 88% !important; width: 65% !important; transform: translate(-50%, -50%) !important; object-fit: contain !important; z-index: 16 !important; }
.preview-card.preview-avatar .profile-avatar .equipped-target-inside { position: absolute !important; left: 50% !important; top: 50% !important; width: 100% !important; transform: translate(-50%, -50%) !important; object-fit: contain !important; z-index: 16 !important; }
.preview-card.preview-avatar .profile-avatar-scaler .equipped-nokia-inside { position: absolute !important; left: 34% !important; top: 60% !important; width: 26% !important; height: 23% !important; object-fit: contain !important; z-index: 16 !important; }
.preview-card.preview-avatar .profile-avatar-scaler .equipped-daftpunk-overlay { position: absolute !important; left: 29% !important; top: 12% !important; width: 40% !important; height: 22% !important; object-fit: contain !important; z-index: 16 !important; }
.preview-card.preview-avatar .profile-avatar-scaler .equipped-clippy-inside { position: absolute !important; left: 53% !important; top: 54% !important; width: 19% !important; height: 14% !important; object-fit: contain !important; z-index: 16 !important; }
.preview-card.preview-avatar .profile-avatar-scaler .equipped-discord-overlay { position: absolute !important; left: 19% !important; top: 16% !important; width: 55% !important; height: 74% !important; object-fit: contain !important; z-index: 16 !important; }
.preview-card.preview-avatar .equipped-jojo-inside { position: absolute !important; bottom: -2px !important; left: 150px !important; width: 95% !important; height: 40% !important; object-fit: contain !important; pointer-events: none !important; z-index: 6 !important; animation: jojo-swipe 4.7s ease-in-out infinite !important; will-change: transform !important; }
.preview-card.preview-avatar .equipped-jojotext-inside { position: absolute !important; width: 84% !important; left: 7% !important; height: 74% !important; top: -4% !important; }
  .preview-card.preview-item .item-img-wrapper {
    background: #fff;
    border: 5px solid #5bc682;
    border-radius: 30px !important;
    width: 350px;
    height: 145px;
    margin: 0 auto 12px;
    position: relative;
  }
  .preview-card.preview-daily-shop .item-img-wrapper {
    background: #fff;
    border: 5px solid #5bc682;
    border-radius: 30px;
    width: 235px;
    height: 140px;
    margin: 0 auto 12px;
    position: relative;
  }
.preview-card.preview-item .item-img-container.jojo-bg-anim { border-radius: 24px !important; }
.preview-card.preview-item .jojo-img-shop { left: 290px !important; width: 55% !important; top: 65% !important; }
.preview-card.preview-item .jojo-text-preview { left: 115px !important; width: 29% !important; }
  .preview-card.preview-item .stars-item-shop { height: 85% !important; width: 100% !important; top: 5px !important; left: 0 !important; display: flex !important; align-items: center !important; justify-content: center !important; }
  .preview-card.preview-item .stars-img-shop { max-width: 85% !important; max-height: 85% !important; display: block !important; margin: 0 auto !important; }
  .preview-card.preview-item .vinyle-item-shop { width: 100% !important; height: 85% !important; top: 2%; display: flex !important; align-items: center !important; justify-content: center !important; }
  .preview-card.preview-item .vinyle-img-shop { max-width: 100% !important; max-height: 100% !important; object-fit: contain !important; display: block !important; margin: 0 auto !important; }
  .preview-card.preview-item .clown-hair-shop { max-width: 73% !important; max-height: 100% !important; object-fit: contain !important; display: block !important; margin: 0 auto !important; pointer-events: none !important; }
  .preview-card.preview-item .clown-nose-shop { position: absolute !important; inset: 0 !important; top: 27px !important; max-width: 100% !important; max-height: 50% !important; margin: auto !important; object-fit: contain !important; display: block !important; pointer-events: none !important; z-index: 2 !important; }
  .preview-card.preview-item .discord-item-shop { position: relative !important; width: 100% !important; height: 100% !important; top: 0 !important; left: 0 !important; }
  .preview-card.preview-item .discord-img-shop { position: absolute !important; left: 50% !important; top: 50% !important; width: 31% !important; height: 83% !important; object-fit: contain !important; transform: translate(-50%, -50%) !important; }
  .preview-card.preview-item .gentleman-item-shop { position: relative !important; width: 100% !important; height: 100% !important; top: 0 !important; left: 0 !important; }
  .preview-card.preview-item .gentleman-img-shop { position: absolute !important; left: 50% !important; top: 15% !important; width: 30% !important; max-width: 55% !important; transform: translateX(-50%) !important; }
  .preview-card.preview-item .moustache-img-shop { position: absolute !important; left: 50% !important; top: 47% !important; width: 23% !important; max-width: 42% !important; transform: translateX(-50%) !important; }
  .preview-card.preview-item .nokia-img-shop { position: absolute !important; left: 40% !important; top: 76% !important; transform: translate(-50%, -50%) !important; width: 17% !important; height: auto !important; object-fit: contain !important; z-index: 1 !important; }
  .preview-card.preview-item .clippy-img-shop { position: absolute !important; left: 57% !important; top: 77% !important; transform: translate(-50%, -50%) !important; width: 13% !important; height: auto !important; object-fit: contain !important; z-index: 2 !important; }
  .preview-card.preview-item .daftpunk-img-shop { position: absolute !important; left: 50% !important; top: 25% !important; transform: translate(-50%, -50%) !important; width: 30% !important; height: auto !important; object-fit: contain !important; z-index: 3 !important; }
  .preview-card.preview-item .chat-img-shop { max-width: 50% !important; top: 50% !important; }
  .preview-card.preview-item .pate-img-shop { left: 30% !important; top: 60% !important; }
  .weekly-preview .item-name,
  .weekly-preview .item-price { background: #fff; border: 5px solid #5bc682; border-radius: 14px; padding: 14px 18px; text-align: center; margin: 10px auto; width: 100%; max-width: 340px; }
  .weekly-preview .item-name { font-size: 22px; }
  .weekly-preview .item-price { display: flex; align-items: center; justify-content: center; gap: 10px; font-size: 20px; }
  .weekly-preview .item-price .coin-icon { width: 24px; height: 24px; }
  .preview-card.preview-item .buy-btn { display: block; width: 100%; margin: 5px 0 0; max-width: none; padding: 14px 26px; font-size: 22px;  color: #fff; background: linear-gradient(135deg, #a8ffce 0%, #5fffa1 100%); border: none; border-radius: 18px; box-shadow: 0 6px 16px rgba(0, 201, 123, 0.25); }
  .weekly-preview .leaderboard-item { height: 56px; min-height: 0; padding: 4px; margin-bottom: 3px; }
  .weekly-preview .leaderboard-item .user-avatar { width: 50px; height: 50px; }
  .weekly-preview .leaderboard-item .avatar-img { width: 100% !important; height: 100% !important; object-fit: cover !important; }
  .preview-card.preview-leaderboard .preview-list { display: grid; grid-template-rows: repeat(4, 1fr); gap: 6px; width: 100%; height: 100%; padding: 0; margin: 0; align-items: center; justify-items: center; }
.fenetre-collection .preview-card.preview-leaderboard .user-avatar-container { overflow: visible !important; position: relative !important; }
  .fenetre-collection .preview-card.preview-leaderboard .preview-list { grid-template-rows: 1fr; height: 28% !important; }
  .fenetre-collection .preview-card.preview-leaderboard .preview-list .leaderboard-item { width: 325px !important; height: 120px !important; gap: 30px; }
  .preview-card.preview-leaderboard .user-avatar { border: 3px solid #000; border-radius: 12px !important; background: #fff; box-sizing: border-box !important; position: relative !important; }
  .fenetre-collection .preview-card.preview-avatar .profile-avatar { position: relative; overflow: hidden !important; border-width: 5px !important; border-style: solid !important; border-color: #000 !important; }
  .fenetre-collection .preview-card.preview-avatar .profile-avatar-scaler { position: relative !important; }
  .fenetre-collection .overlay-above, .fenetre-collection .overlay-above-leader { position: absolute; z-index: 100; pointer-events: auto; }
  .fenetre-collection .draggable { will-change: top, left; touch-action: none; }
  .fenetre-collection .draggable.drag-active { outline: 2px dashed #5bc682; cursor: grabbing; z-index: 25; transition: none; }
  .fenetre-collection .item-actions { align-items: center !important; }
  .fenetre-collection .placement-btn { background: #f8f9fa !important; border: 2px #5150503d solid !important; border-radius: 10px !important; width: 64px !important; height: 64px !important; padding: 8px !important; display: inline-flex; align-items: center; justify-content: center; }
  .fenetre-collection .placement-btn:hover { background: #e9ecef !important; }
  .fenetre-collection .placement-btn.active .close-img { transform: scale(1.18); filter: grayscale(0) brightness(1.1); }
  .fenetre-collection .placement-btn .close-img { width: 34px !important; height: 34px !important; }
  .fenetre-collection .center-btn { background: #f8f9fa !important; border: 2px #5150503d solid !important; border-radius: 10px !important; width: 64px !important; height: 64px !important; padding: 8px !important; display: inline-flex; align-items: center; justify-content: center; }
  .fenetre-collection .center-btn:hover { background: #e9ecef !important; }
  .fenetre-collection .center-btn .close-img { width: 34px !important; height: 34px !important; }
  .fenetre-collection .border-toggle-btn { background: #f8f9fa !important; border: 2px #5150503d solid !important; border-radius: 10px !important; width: 64px !important; height: 64px !important; padding: 8px !important; display: inline-flex; align-items: center; justify-content: center; }
  .fenetre-collection .border-toggle-btn:hover { background: #e9ecef !important; }
  .fenetre-collection .border-toggle-btn .close-img { width: 34px !important; height: 34px !important; }
  .fenetre-collection .border-toggle-btn.active .close-img { transform: scale(1.18); filter: grayscale(0) brightness(1.1); }
  .fenetre-collection .actions-row { display:flex; flex-direction: row; align-items:center; justify-content:center; gap: 10px; width: 100%; }
  .fenetre-collection .preview-card.preview-avatar .avatar-img { border: none !important; overflow: visible !important; }
  .fenetre-collection .preview-card.preview-avatar .profile-avatar-stage { border: 5px solid #5bc682 !important; border-radius: 30px !important; }
  .fenetre-collection .preview-card.preview-avatar .profile-avatar-stage.no-border { border: none !important; }
  .fenetre-collection .preview-card.preview-avatar .profile-avatar.no-border { border: none !important; background: transparent !important; }
  .preview-card.preview-leaderboard .equipped-jojo-inside { position: absolute !important; bottom: -2px !important; left: 58px !important; width: 120% !important; height: 40% !important; object-fit: contain !important; pointer-events: none !important; z-index: 6 !important; }
  .preview-card.preview-leaderboard .equipped-jojotext-inside { position: absolute !important; top: -9px !important; right: 4px !important; width: 95% !important; height: 100% !important; object-fit: contain !important; pointer-events: none !important; z-index: 7 !important; }
  .preview-card.preview-leaderboard .user-avatar-container { width: 44px; height: 44px; position: relative !important; }
  .weekly-shop-container .preview-card.preview-leaderboard .item-img-wrapper { border-radius: 30px !important; }
  .preview-card.preview-leaderboard .preview-list .leaderboard-item { width: 351px; height: 100%; display: flex; align-items: center; gap: 8px; padding: 6px 35px; margin: 0 auto; box-sizing: border-box; background: #fff; border: 3px solid #000; border-radius: 25px; }
  .preview-card { background: #f3f3f3; border-radius: 12px; padding: 12px; display: flex; flex-direction: column; }
  .preview-card.preview-leaderboard { padding-left: 0; padding-right: 0; }
  .preview-card.preview-item .item-img-container.border-color-fill { border-radius: 12px !important; border: none !important; box-shadow: none !important; }
  .preview-card.preview-item .classic-border-preview { width: 100% !important; height: 100% !important; border-radius: 24px !important; }
  .preview-title { background:#fff; border:3px solid #5bc682; border-radius:12px; display:block; width:351px; margin:0 auto 10px; padding:8px 12px; font-weight:800; text-align:center; }
  .preview-card.preview-leaderboard .preview-list .user-info { display: flex; align-items: center; }
  .preview-card.preview-leaderboard .preview-list .user-details { flex: 1; display: flex; align-items: center; }
  .preview-card.preview-leaderboard .preview-list .user-details .username { margin-left: 0; }
  .preview-list .leaderboard-item { display:flex; align-items:center; gap:10px; background:#fff; border-radius:10px; padding:8px; margin-bottom:8px; }
  .preview-desc { background:#fff; border-radius:10px; padding:10px; color:#666; text-align:center; margin-top:8px; white-space: pre-line; }
  .item-img-wrapper.large { width: 350px; height: 145px; margin: 0 auto 12px; }
  @media (max-width: 1024px) {
    .fenetre-collection .preview-card.preview-daily-shop .item-img-wrapper.large {
      width: 250px !important;
      height: 250px !important;
    }
  }
  .preview-actions { display:flex; justify-content:flex-end; margin-top:10px; }
  .preview-card.preview-leaderboard,
  .preview-card.preview-avatar { height: 100%; min-height: initial; }
  .tall-card .item-img-wrapper { width: 190px !important; height: 190px !important; }
  .small-card .item-img-wrapper { width: 235px !important; height: 140px !important; }
  .weekly-shop-container .clown-item-shop { position: relative; width: 100%; height: 100%; }
  .weekly-shop-container .clown-hair-shop { position: absolute !important; inset: 0 !important; max-width: 73% !important; max-height: 85% !important; margin: auto !important; object-fit: contain !important; z-index: 1 !important; pointer-events: none !important; }
  .weekly-shop-container .clown-nose-shop { position: absolute !important; inset: 0 !important; top: 27px !important; max-width: 100% !important; max-height: 40% !important; margin: auto !important; object-fit: contain !important; z-index: 2 !important; pointer-events: none !important; }
  /* Remove inner round rings; fill color squares fully */
  .weekly-shop-container .item-img-container,
  .weekly-shop-container .classic-border-preview {
    border-radius: 22px !important;
    box-shadow: none !important;
    border: none !important;
    top: 0%;
  }
  /* Override suggestion editor: keep border in Pop-up Style preview */
  .weekly-shop-container.fenetre-collection .preview-card.preview-popup-style .item-img-container {
    border: 3px solid #000 !important;
  }
  .weekly-shop-container .border-preview,
  .weekly-shop-container .weekly-border-circle,
  .weekly-shop-container .border-avatar-placeholder {
    border-radius: 12px !important;
    box-shadow: none !important;
  }

  /* Style spécifique pour le leaderboard */
  .leaderboard-container .shop-item {
    max-width: 120px !important;
    min-width: 100px !important;
    width: 120px !important;
  }

  .leaderboard-container .item-img-wrapper {
    width: 60px !important;
    height: 60px !important;
    margin: 0 auto 8px !important;
  }

  .leaderboard-container .item-img-container {
    width: 60px !important;
    height: 60px !important;
  }

  .leaderboard-container .item-name {
    font-size: 12px !important;
    margin-bottom: 6px !important;
  }

  .leaderboard-container .item-price {
    font-size: 11px !important;
    margin-bottom: 8px !important;
  }

  .leaderboard-container .buy-btn,
  .leaderboard-container .equip-btn {
    padding: 6px 12px !important;
    font-size: 11px !important;
  }

  .leaderboard-container .coin-icon {
    width: 24px !important;
    height: 24px !important;
  }

  /* Bordure par défaut autour des avatars dans le leaderboard (overridable inline) */
  .leaderboard-container .user-avatar {
    border: 3px solid black;
    border-radius: 12px !important;
    box-sizing: border-box !important;
    position: relative !important; /* Ajouté pour que les items soient positionnés relativement */
    z-index: 2 !important; /* Pour que l'avatar soit au-dessus de l'item Ange */
    background: white; /* nécessaire pour technique de double background des gradients */
    cursor: pointer;
  }

  /* S'assurer que l'image de l'avatar respecte la bordure */
  .leaderboard-container .user-avatar .avatar-img {
    width: 100% !important;
    height: 100% !important;
    object-fit: cover !important;
  }

/* Filtre sépia synchronisé avec Jojo dans le leaderboard */
.leaderboard-container .user-avatar.jojo-sepia .avatar-img { animation: jojo-sepia-cycle 4.7s steps(1, end) infinite !important; }

@keyframes jojo-sepia-cycle {
  0%, 8.99% { filter: sepia(0); }
  9%, 99% { filter: sepia(1); }
  99.01%, 100% { filter: sepia(0); }
}

  /* Tailles personnalisées pour chaque item dans le leaderboard */
  
  /* Clown - Plus petit */
  .leaderboard-container .equipped-clown,
  .leaderboard-container .equipped-clown-overlay {
    pointer-events: none !important;
  position: absolute;
    top: -35.7%;
    left: -8%;
    width: 140%;
    height: 130%;
  transform: translate(-10%);
  pointer-events: none;
    z-index: 15;
  }

  /* Gentleman - Moyen */
  .leaderboard-container .equipped-gentleman,
  .leaderboard-container .equipped-gentleman-overlay {
    pointer-events: none !important;
    position: absolute !important;
    top: -71% !important;
    left: 0%;
    width: 131% !important;
    height: 120% !important;
    object-fit: contain !important;
    pointer-events: none !important;
    z-index: 15 !important;
  }

  /* Roi - Grand */
  .leaderboard-container .equipped-roi,
  .leaderboard-container .equipped-roi-overlay {
    pointer-events: none !important;
    position: absolute !important;
    top: -70% !important;
    left: 8% !important;
    width: 92% !important;
    height: 92% !important;
    object-fit: contain !important;
    z-index: 15 !important;
  }

  /* Appliquer aussi dans le leaderboard de faction */
  .faction-leaderboard-list .equipped-roi,
  .faction-leaderboard-list .equipped-roi-overlay {
    pointer-events: none !important;
    position: absolute !important;
    top: -70% !important;
    left: 8% !important;
    width: 92% !important;
    height: 92% !important;
    object-fit: contain !important;
    z-index: 15 !important;
  }

  /* Cible - Moyen */
  .leaderboard-container .equipped-target,
  .leaderboard-container .equipped-target-overlay {
    pointer-events: none !important;
    width: 107% !important;
    height: 101% !important;
  position: absolute;
    top: 0px;
    left: -1px;
    z-index: 3 !important;
  }

  /* Étoiles - Petit */
  .leaderboard-container .equipped-stars,
  .leaderboard-container .equipped-stars-overlay {
    pointer-events: none !important;
    position: absolute !important;
    top: -3% !important;
    left: -14% !important;
    width: 130% !important;
    height: 106% !important;
    object-fit: contain !important;
    pointer-events: none !important;
    z-index: 15 !important;
  }

  /* Cadre royal - Très grand */
  .leaderboard-container .equipped-royal-frame,
  .leaderboard-container .equipped-royal-frame-overlay {
    pointer-events: none !important;
    position: absolute !important;
    top: -28%;
    left: -11%;
    width: 140% !important;
    height: 138% !important;
    object-fit: contain !important;
    pointer-events: none !important;
    z-index: 15 !important;
  }

  .leaderboard-container .equipped-galaxie{
    position: absolute !important;
    top: -19px !important;
    left: -18px !important;
    width: 170% !important;
    height: 176% !important;
    z-index: 4 !important;
  }
  .leaderboard-container .equipped-coeur{
    position: absolute !important;
    top: -6px !important;
    left: -6px !important;
    width: 122% !important;
    height: 125% !important;
    object-fit: contain !important;
    pointer-events: none !important;
    z-index: 15 !important;
  }
  .leaderboard-container .equipped-alpha{
    position: absolute !important;
    top: -2px !important;
    left: -2px !important;
    width: 108% !important;
    height: 107% !important;
    z-index: 4 !important;
    object-fit: contain !important;
    pointer-events: none !important;
  }
  .leaderboard-container .equipped-admin-planify{
    position: absolute !important;
    top: -2px !important;
    left: -2px !important;
    width: 107% !important;
    height: 108% !important;
    z-index: 4 !important;
    object-fit: contain !important;
    pointer-events: none !important;
  }

  .leaderboard-container .equipped-cat-ears {
    position: absolute !important;
    top: -33px !important;
    left: -14px !important;
    width: 153% !important;
    height: 153% !important;
    z-index: 3 !important;
    pointer-events: none !important;
  }

  /* Discord - Leaderboard */
  .leaderboard-container .equipped-discord {
    position: absolute !important;
    top: 0px !important;
    left: -6px !important;
    width: 113% !important;
    height: 112% !important;
    object-fit: contain !important;
    pointer-events: none !important;
    z-index: 15 !important;
  }

  /* Jojo - Leaderboard: tailles à l'intérieur de l'avatar */
  .leaderboard-container .equipped-jojo-inside {
    position: absolute !important;
    bottom: -2px !important;
    left: 58px !important;
    width: 120% !important;
    height: 40% !important;
    object-fit: contain !important;
    pointer-events: none !important;
    z-index: 6 !important;
  }
  .leaderboard-container .equipped-jojotext-inside {
    position: absolute !important;
    top: -9px !important;
    right: 4px !important;
    width: 95% !important;
    height: 100% !important;
    object-fit: contain !important;
    pointer-events: none !important;
    z-index: 7 !important;
  }

  /* Roses - Moyen */
  .leaderboard-container .equipped-rainbow,
  .leaderboard-container .equipped-rainbow-overlay {
    pointer-events: none !important;
    position: absolute !important;
    top: -25%;
    left: -3%;
    width: 120% !important;
    height: 140% !important;
    object-fit: contain !important;
    pointer-events: none !important;
    z-index: 15 !important;
  }

  /* Vinyle - Petit */
  .leaderboard-container .equipped-vinyle,
  .leaderboard-container .equipped-vinyle-overlay {
    pointer-events: none !important;
    position: absolute !important;
    top: -70%;
    left: 0%;
    width: 126% !important;
    height: 97% !important;
    object-fit: contain !important;
    pointer-events: none !important;
    z-index: 15 !important;
  }

  /* Advisory - Moyen */
  .leaderboard-container .equipped-advisory,
  .leaderboard-container .equipped-advisory-overlay {
    pointer-events: none !important;
    width: 38px !important;
    height: 38px !important;
    max-width: 38px !important;
    max-height: 38px !important;
  }

  /* Espace - Grand */
  .leaderboard-container .equipped-espace,
  .leaderboard-container .equipped-espace-overlay {
    pointer-events: none !important;
    width: 55px !important;
    height: 55px !important;
    max-width: 55px !important;
    max-height: 55px !important;
  }

  /* Absolute Cinema - Très grand */
  .leaderboard-container .equipped-absolute-cinema,
  .leaderboard-container .equipped-absolute-cinema-overlay {
    pointer-events: none !important;
    position: absolute !important;
    top: -10% !important;
    left: -64% !important;
    width: 100% !important;
    height: 100% !important;
    object-fit: contain !important;
    pointer-events: none !important;
    z-index: 15 !important;
  }

  /* Flash - Moyen */
  .leaderboard-container .equipped-flash,
  .leaderboard-container .equipped-flash-overlay {
    pointer-events: none !important;
    position: absolute !important;
    top: 9%;
    left: 20% !important;
    width: 64% !important;
    height: 72% !important;
    object-fit: contain !important;
    pointer-events: none !important;
    z-index: 3 !important;
  }



  /* Miaou - Pate (par-dessus) */
  .leaderboard-container .equipped-pate-overlay {
    pointer-events: none !important;
    position: absolute !important;
    top: 55%;
    left: 10%;
    width: 35% !important;
    height: 35% !important;
    object-fit: contain !important;
    pointer-events: none !important;
    z-index: 15 !important;
  }

  /* DVD - Moyen */
  .leaderboard-container .equipped-dvd,
  .leaderboard-container .equipped-dvd-overlay {
    pointer-events: none !important;
    width: 36px !important;
    height: 36px !important;
    max-width: 36px !important;
    max-height: 36px !important;
  }

  /* Lunettes pixel - Petit */
  .leaderboard-container .equipped-lunettes-pixel,
  .leaderboard-container .equipped-lunettes-pixel-overlay {
    pointer-events: none !important;
    width: 30px !important;
    height: 30px !important;
    max-width: 30px !important;
    max-height: 30px !important;
  }

    /* 2000 - Moyen */
  .leaderboard-container .equipped-2000,
  .leaderboard-container .equipped-2000-overlay {
    pointer-events: none !important;
    width: 44px !important;
    height: 44px !important;
    max-width: 44px !important;
    max-height: 44px !important;
  }

  /* Tomb Raider - Par-dessus l'avatar */
  .leaderboard-container .equipped-tomb-raider {
    position: absolute !important;
    top: -57% !important;
    left: 8% !important;
    width: 85% !important;
    height: 85% !important;
    object-fit: contain !important;
    pointer-events: none !important;
    z-index: 0 !important;
  }

  /* Appliquer aussi dans le leaderboard de faction */
  .faction-leaderboard-list .equipped-tomb-raider {
    position: absolute !important;
    top: -57% !important;
    left: 8% !important;
    width: 85% !important;
    height: 85% !important;
    object-fit: contain !important;
    pointer-events: none !important;
    z-index: 0 !important;
  }



  /* Style spécifique pour l'item Daft Punk dans le leaderboard */
  .leaderboard-container .equipped-daftpunk,
  .leaderboard-container .equipped-daftpunk-overlay {
    pointer-events: none !important;
    position: absolute !important;
    top: -70% !important;
    left: 6% !important;
    width: 83%;
    height: 100%;
    object-fit: contain !important;
    pointer-events: none !important;
    z-index: 15 !important;
  }

  /* Override factions: appliquer uniquement à l’overlay Daft Punk dans la liste des factions */
  .faction-leaderboard-list .equipped-daftpunk-overlay {
    top: -47% !important;
    left: -25% !important;
    width: 83%;
    height: 55%;
  }

  /* Style spécifique pour l'item Nokia dans le leaderboard */
  .leaderboard-container .equipped-nokia-inside {
    position: absolute !important;
    top: 72% !important;
    left: 15% !important;
    width: 75% !important;
    height: 100% !important;
    object-fit: contain !important;
    transform: translate(-50%, -50%) !important;
    pointer-events: none !important;
    z-index: 1 !important;
  }

  /* Style spécifique pour l'item Clippy dans le leaderboard */
  .leaderboard-container .equipped-clippy-inside {
    position: absolute !important;
    top: 12px !important;
    left: 22px !important;
    width: 53% !important;
    height: 100% !important;
    object-fit: contain !important;
    pointer-events: none !important;
    z-index: 2 !important;
  }

  /* Style spécifique pour l'item Pate dans le leaderboard */
  .leaderboard-container .equipped-pate-inside {
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    width: 100% !important;
    height: 100% !important;
    object-fit: contain !important;
    pointer-events: none !important;
    z-index: 3 !important;
  }

  /* Style spécifique pour l'item DVD dans le leaderboard */
  .leaderboard-container .equipped-dvd-inside,
  .preview-leaderboard .equipped-dvd-inside,
  .preview-avatar .equipped-dvd-inside {
    position: absolute !important;
    top: 30%;
    left: 30%;
    width: 60% !important;
    height: 60% !important;
    object-fit: contain !important;
    transform: translate(-50%, -50%) !important;
    pointer-events: none !important;
    z-index: 3 !important;
    animation: dvdBounceShop 4s linear infinite !important;
  }

  /* Style spécifique pour l'item Lunettes Pixel dans le leaderboard */
  .leaderboard-container .equipped-lunettes-pixel-inside {
    position: absolute !important;
    top: 50%;
    left: 50%;
    width: 109% !important;
    height: 110% !important;
    object-fit: contain !important;
    pointer-events: none !important;
    z-index: 3 !important;
  }

  /* Style spécifique pour l'item Cash dans le leaderboard */
  .leaderboard-container .equipped-cash-inside {
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    width: 100% !important;
    height: 100% !important;
    object-fit: contain !important;
    pointer-events: none !important;
    z-index: 3 !important;
  }

  /* Style spécifique pour l'item Target dans le leaderboard */
  .leaderboard-container .equipped-target-inside {
  position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    width: 100% !important;
    height: 100% !important;
  object-fit: contain !important;
  pointer-events: none !important;
    z-index: 3 !important;
  }

  /* Style spécifique pour l'item Advisory dans le leaderboard */
  .leaderboard-container .equipped-advisory-inside {
    position: absolute !important;
    top: 31%;
    left: 18%;
    width: 100% !important;
    height: 100% !important;
    object-fit: contain !important;
    pointer-events: none !important;
    z-index: 3 !important;
  }

  /* Style spécifique pour l'item Spacestars dans le leaderboard */
  .leaderboard-container .equipped-spacestars-inside {
    position: absolute !important;
    top: -15%;
    left: 0%;
    height: 100% !important;
    object-fit: contain !important;
    pointer-events: none !important;
    z-index: 3 !important;
}

  /* Style spécifique pour l'item Moustache dans le leaderboard */
  .leaderboard-container .equipped-moustache-inside {
  position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    width: 100% !important;
    height: 100% !important;
  object-fit: contain !important;
  pointer-events: none !important;
    z-index: 3 !important;
}

  /* Style spécifique pour l'item Asteroide dans le leaderboard */
  .leaderboard-container .equipped-asteroide-overlay {
    pointer-events: none !important;
  position: absolute !important;
    top: 30%;
    left: 6%;
    width: 60% !important;
    height: 100% !important;
    object-fit: contain !important;
    pointer-events: none !important;
    z-index: 3 !important;
  }

  /* Style spécifique pour l'item Camera dans le leaderboard */
  .leaderboard-container .equipped-camera-overlay {
    pointer-events: none !important;
  position: absolute !important;
    top: 55%;
    left: 0%;
    width: 10% !important;
    height: 70% !important;
    object-fit: contain !important;
    pointer-events: none !important;
    z-index: 3 !important;
  }

  /* Style spécifique pour l'item Chat dans le leaderboard */
  .leaderboard-container .equipped-chat-overlay {
    pointer-events: none !important;
    position: absolute !important;
    top: -34%;
    left: 22%;
    width: 119% !important;
    height: 100% !important;
    object-fit: contain !important;
    pointer-events: none !important;
    z-index: 3 !important;
  }

  /* Style spécifique pour l'item Absolute Cinema Right dans le leaderboard */
  .leaderboard-container .equipped-absolute-cinema-overlay-right {
    pointer-events: none !important;
    position: absolute !important;
    top: -10%;
    left: 64%;
    width: 100% !important;
    height: 100% !important;
    object-fit: contain !important;
    pointer-events: none !important;
    z-index: 15 !important;
  }

   .absolute-cinema-img-shop-right {
    max-width: 100% !important;
    max-height: 70% !important;
    object-fit: contain !important;
    position: absolute !important;
    top: 15px !important;
    left: 50px !important;
    transform: scaleX(-1) !important;
  }

    /* Style spécifique pour l'item Angel Wings dans le leaderboard */
  .leaderboard-container .equipped-angel-wings {
    position: absolute !important;
    top: -50px !important;
    left: -30px !important;
    width: 220% !important;
    height: 148% !important;
    object-fit: contain !important;
    pointer-events: none !important;
    z-index: 1 !important;
  }

  /* Appliquer aussi dans le leaderboard de faction */
  .faction-leaderboard-list .equipped-angel-wings {
    position: absolute !important;
    top: -50px !important;
    left: -30px !important;
    width: 220% !important;
    height: 148% !important;
    object-fit: contain !important;
    pointer-events: none !important;
    z-index: 1 !important;
  }

  /* Style spécifique pour l'item Clown Nose dans le leaderboard */
  .leaderboard-container .equipped-clown-nose {
  position: absolute !important;
    top: 54% !important;
    left: 48% !important;
    transform: translate(-50%, -50%) !important;
    width: 87% !important;
    height: 70% !important;
  object-fit: contain !important;
  pointer-events: none !important;
    z-index: 16 !important;
  }

.shop-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(200px, 1fr));
  gap: 25px;
}

/* Tailles PC pour les items */


/* Media query pour les écrans de 320px à 768px - Collection centrée en colonne */
@media (min-width: 320px) and (max-width: 1024px) {

  .leaderboard-empty {
    text-align: center;
  }

  /* Réduction du padding du modal sur mobile pour gagner de la largeur */
  .shop-modal {
    padding: 20px 10px !important;
    width: 95% !important;
    max-width: 100% !important;
  }

  .join-faction-btn {
    width: 85% !important;
    max-width: 85% !important;
    margin: 0 auto;
  }

  /* Responsive pour le shop hebdomadaire */
  .weekly-section { align-items: center !important; }
  .weekly-shop-container {
    display: flex !important;
    flex-direction: column !important;
    gap: 30px !important;
  }

  .weekly-shop-container .shop-grid {
    display: grid !important;
    grid-template-columns: repeat(1, 1fr) !important;
    gap: 20px !important;
    width: 100% !important;
    max-width: 100% !important;
    padding: 0 !important;
    justify-items: center;
  }
  
  .weekly-shop-container .shop-item {
    width: auto !important;
    max-width: none !important;
    margin: 0 !important;
    box-sizing: border-box;
  }
  .weekly-shop-container .shop-item.small-card {
    width: 323px !important;
    max-width: 323px !important;
    margin: 0 !important;
  }
  .weekly-shop-container .shop-grid .shop-item.weekly-item.small-card,
  .weekly-shop-container .shop-grid .shop-item.weekly-item.border-item.small-card {
    width: 323px !important;
    max-width: 323px !important;
    justify-self: center;
  }
  .small-card .item-img-wrapper { width: 190px !important; height: 200px !important; }

  .faction-leaderboard-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
    width: 100%;
    max-width: 100%;
    min-height: 150px;
    max-height: none;      /* enlever la limite de hauteur en mobile */
    overflow-y: visible;   /* pas de barre de scroll verticale */
  }


  .timer-value { 
    font-size: 16px !important;
    display: inline-block;
    min-width: 10ch;
    text-align: center;
    font-variant-numeric: tabular-nums;
  }

  .timer-label {
    font-size: 16px !important;
  }

  .username {
    font-size: 13px !important;
  }

  .user-score {
    color: #00c97b;
    font-size: 13px !important;
    display: flex;
  }



  .leaderboard-position {
    margin: 0 -5px 0 -5px;
}

  .shop-grid {
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 20px !important;
    padding: 0 15px !important;
  }
  
  .shop-item {
    width: 100% !important;
    max-width: 180px !important;
    margin: 0 auto !important;
    text-align: center !important;
  }
  
  .item-img-wrapper {
    width: 80px !important;
    height: 80px !important;
    margin: 0 auto 15px !important;
  }
  
  .item-img-container {
    width: 100% !important;
    height: 100% !important;
  }
  
  .item-name {
    font-size: 14px !important;
    margin-bottom: 10px !important;
  }
  
  .item-price {
    font-size: 13px !important;
    margin-bottom: 10px !important;
  }
  
  .buy-btn,
  .equip-btn {
    padding: 8px 16px !important;
    font-size: 12px !important;
    width: 100% !important;
    max-width: 120px !important;
    margin: 0 auto !important;
  }
  
  .coin-icon {
    width: 16px !important;
    height: 16px !important;
  }
  
  .shop-tabs {
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 15px !important;
    width: 190px;
    margin-bottom: 15px !important;
    margin-left: 0 !important;
    border-bottom: none !important;
    padding-bottom: 0 !important;
  }
  
  .tab-btn {
    width: 100% !important;
    max-width: 250px !important;
    padding: 12px 16px !important;
    font-size: 14px !important;
    margin: 0 auto !important;
  }
  
  .shop-title {
    text-align: center !important;
    color: #00c97b !important;
    font-size: 1.7rem !important;
    margin-top: 25px;
  }
  
  .timer-info {
    display: flex !important;
    justify-content: center !important;
    align-items: center !important;
    gap: 10px !important;
    flex-direction: column !important;
  }
  
  .clown-hair-shop {
    max-width: 100% !important;
    max-height: 90% !important;
    object-fit: contain !important;
    position: absolute !important;
    top: 5px !important;
    left: 10px !important;
  }
  
  .clown-nose-shop {
    max-width: 100% !important;
    max-height: 45% !important;
    object-fit: contain !important;
    position: absolute !important;
    top: 30px !important;
    left: 25px !important;
  }
  
  .absolute-cinema-img-shop-right {
    max-width: 100% !important;
    max-height: 70% !important;
    object-fit: contain !important;
    position: absolute !important;
    top: 15px !important;
    left: 45px !important;
    transform: scaleX(-1) !important;
  }
  
  .nokia-img-shop {
    max-width: 100% !important;
    max-height: 50% !important;
    object-fit: contain !important;
    position: absolute !important;
    top: 70% !important;
    left: 30% !important;
    width: 40% !important;
  }
  
  .clippy-img-shop {
    max-width: 100% !important;
    max-height: 35% !important;
    object-fit: contain !important;
    position: absolute !important;
    top: 72% !important;
    left: 66% !important;
    width: 29% !important;
  }
  
  .daftpunk-img-shop {
    max-width: 60% !important;
    max-height: 80% !important;
    object-fit: contain !important;
    position: absolute !important;
    top: 23% !important;
    left: 50% !important;
  }
  
  .spacestars-img-shop {
    max-width: 90% !important;
    max-height: 100% !important;
    object-fit: contain !important;
    position: absolute !important;
    top: 4% !important;
    left: 5px !important;
  }

  /* Overrides Collection uniquement */
  .shop-grid .collection-item .angel-img-shop { top: 24px !important; left: 12px !important; max-width: 80% !important; }
  .shop-grid .collection-item .gentleman-img-shop { left: 10px !important; top: 18px !important; }
  .shop-grid .collection-item .moustache-img-shop { left: 11px !important; top: 38px !important; }
  .shop-grid .collection-item .pate-img-shop { top: 40px !important; left: 20% !important; }
  .shop-grid .collection-item .chat-img-shop { top: 42%; left: 63%; }
  /* moved: gentleman-img-shop override placed after base definitions */
  /* moved: moustache-img-shop override placed after base definitions */
  .shop-grid .collection-item .discord-img-shop { left: 13px !important; top: 17% !important; }
  .shop-grid .collection-item .daftpunk-img-shop { width: 60% !important; transform: none !important; position: absolute !important; height: auto !important; object-fit: contain !important; left: 20% !important; top: 10% !important; }
  .shop-grid .collection-item .clippy-img-shop { left: 50% !important; top: 60% !important; width: 29% !important; transform: none !important; position: absolute !important; height: auto !important; object-fit: contain !important; }
  .shop-grid .collection-item .nokia-img-shop { left: 13% !important;  top: 50% !important; width: 40% !important; transform: none !important; position: absolute !important; height: auto !important; object-fit: contain !important; }
  .shop-grid .collection-item .jojo-img-shop.jojo-swipe.jojo-sepia-anim {  top: 43px !important; left: 76px !important; }
  
  /* Correction du leaderboard container pour mobile */
  .leaderboard-container {
    width: 100% !important;
    max-width: 250px !important;
    margin: 0 auto !important;
    padding: 0 15px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    flex-direction: column !important;
    background: none !important;
  }
  
  .leaderboard-filters {
    display: flex !important;
    gap: 10px !important;
    margin-bottom: 20px !important;
    justify-content: center !important;
    flex-direction: column !important;
    align-items: center !important;
  }
  
  .leaderboard-item {
    width: 100%;
    max-width: 100%;
    min-height: 160px;
    display: flex;
    align-items: center;
    background: #fff;
    height: 150px;
    padding: 15px;
    border-radius: 12px;
    box-shadow: 0 2px 8px #0000001a;
    transition: transform .2s;
    overflow: hidden; /* clip des overlays */
    box-sizing: border-box;
  }

 .leaderboard-list {
  width: 160%;
  max-width: 150%;
  margin: 0px -23px 0px -23px;
  overflow-x: hidden !important;
}


.jojo-text-preview {
    position: absolute !important;
    top: 0px !important;
    left: 13px !important;
    width: 62% !important;
    height: auto !important;
    object-fit: contain !important;
  }

  .jojo-img-shop {
    position: absolute !important;
    top: 50px !important;
    left: 88px !important;
    width: 90% !important;
    height: auto !important;
    object-fit: contain;
  }
  .weekly-item .jojo-img-shop {
    left: 50% !important;
    transform: translateX(-50%) !important;
    width: 80% !important;
    top: 65% !important;
  }
  /* Boutique quotidienne (weekly) — overrides ciblés */
  .weekly-item .angel-img-shop { top: 10px !important; left: 25px !important; }
  .weekly-item .discord-img-shop { top: 15px !important; left: 39px !important; }
  .weekly-item .gentleman-img-shop { top: 25px !important; left: 60px !important; max-width: 40% !important; }
  .weekly-item .moustache-img-shop { top: 65px !important; left: 70px !important; }
  .weekly-item .advisory-img-shop { top: 0px !important; }
  .weekly-item .asteroide-img-shop { left: 20px !important; }
  .weekly-item .chat-img-shop { top: 50% !important; left: 63% !important; }
  .weekly-item .pate-img-shop { top: 80px !important; left: 24% !important; }

  .discord-img-shop {
    position: absolute !important;
    top: -3px !important;
    left: 12px !important;
    width: 64% !important;
    height: 73% !important;
    object-fit: contain;
  }

   .admin-planify-img-shop {
    position: absolute !important;
    top: 13px !important;
    left: 13px !important;
    width: 65% !important;
    height: 65% !important;
    object-fit: contain !important;
   }

  /* Aperçu items/couleurs mobile */
  .weekly-preview {
    width: 100% !important;
    height: auto !important;
    margin-top: 20px !important;
  }
  .preview-grid {
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    gap: 20px !important;
    height: auto !important;
    width: 100% !important;
  }
  .preview-card {
    width: 100% !important;
    max-width: 450px !important;
    margin: 0 auto !important;
  }
  @media (max-width: 1024px) {
  .fenetre-collection .preview-card.preview-avatar .profile-avatar-stage {
    width: 250px !important;
    margin: 0 auto !important;
  }
}
  .preview-card.preview-avatar .profile-avatar-scaler {
    width: 100% !important;
    justify-content: center !important;
  }
  .preview-title {
    width: 250px !important;
    margin: 0 auto 15px !important;
  }
  .preview-card.preview-leaderboard .preview-list {
    width: 100% !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    gap: 10px !important;
  }
  .preview-card.preview-leaderboard .preview-list .leaderboard-item {
    width: 250px !important;
    height: 130px !important;
  }
  /* Ordre spécifique mobile : #1 (1), Vous (3), #2 (2) */
  .preview-card.preview-leaderboard .preview-list .leaderboard-item:nth-child(1) { order: 1 !important; }
  .preview-card.preview-leaderboard .preview-list .leaderboard-item:nth-child(3) { order: 2 !important; }
  .preview-card.preview-leaderboard .preview-list .leaderboard-item:nth-child(2) { order: 3 !important; }
  /* Masquer Personne #3 (4ème élément) */
  .preview-card.preview-leaderboard .preview-list .leaderboard-item:nth-child(4) { display: none !important; }

  /* Nettoyage des règles redondantes */
  /* @media (min-width: 340px) block removed/merged */


/* Media query pour les écrans PC à partir de 1025px */
@media (min-width: 1025px) {
  .shop-grid {
        /* display: flex !important; */
        flex-direction: column !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 20px !important;
        padding: 0 15px !important;
    }

    .shop-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 25px;
}
}

}

.shop-item {
  background: #fff;
  border: 3px solid #e0e0e0;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}

.shop-item:hover {
  border-color: #00c97b;
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0, 201, 123, 0.2);
}

.shop-item.not-owned {
  opacity: 0.7;
  filter: grayscale(30%);
  border-color: #ccc;
}

.shop-item.owned {
  border-color: #5bc682;
}

  .timer-label {
    font-size: 20px;
    color: #00c97b;
  }

  .leaderboard-empty {
    padding: 40px;
    color: #666;
    font-size: 16px;
  }

.shop-item.owned:hover {
  border-color: #4a9e6a;
}

.shop-item.equipped {
  border-color: #fd1515d4;
  border-width: 3px;
}
/* Appliquer aussi la bordure rouge sur les items hebdo équipés */
.weekly-item.equipped {
  border-color: #fd1515d4 !important;
  border-width: 3px !important;
}
  /* Applique la bordure rouge quand une variante hebdo est "équipée" (sélectionnée) */
  .weekly-item.border-item .equip-btn.equipped {
    background: #fd1515d4;
    color: #fff;
    border: 2px solid #fd1515d4;
  }
  .weekly-item.border-item.equipped,
  .weekly-item.border-item .equip-btn.equipped ~ .item-img-wrapper .item-img-container {
    border-color: #fd1515d4;
  }

.checkmark-icon {
  position: absolute;
    top: 5px;
    right: 10px;
    width: 24px;
    height: 24px;
    background: #5bc682;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
    color: #fff;
    font-size: 14px;
    font-weight: 700;
    z-index: 10;
}

.lock-icon {
  position: absolute;
    top: 10px;
    right: 10px;
    width: 20px;
    height: 20px;
    background: #0009;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 11px;
    z-index: 10;
}

/* Icône palette (Discord) */
.palette-icon {
  position: absolute;
  top: 8px;
  left: 10px;
  background: #ffffffcc;
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 16px;
  z-index: 12;
}
.palette-icon:hover {
  background: #fff;
}

/* Icône Aperçu: même colonne que palette, sous la palette */
.apercu-icon {
  position: absolute;
  top: 40px; /* sous la palette */
  left: 10px;
  background: #ffffffcc;
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 16px;
  z-index: 12;
}

.info-icon-btn {
  background: #fffc;
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.item-img-wrapper {
  width: 90px;
  height: 90px;
  margin: 0 auto 18px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
}

.item-img-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  border: 3px #5bc681 solid;
  border-radius: 50%;
  overflow: hidden;
  align-items: center;
  justify-content: center;
}
/* Fond pour items dynamiques */
.dyn-bg { position: absolute; inset: 0; z-index: 0; }

/* Jojo - Collection: tailles/positions éditables via store */
.jojo-item-shop { position: relative; width: 100%; height: 100%; }
.jojo-img-shop { pointer-events: none; z-index: 2; }
.jojo-text-preview { pointer-events: none; z-index: 3; }
/* Supprimé: fond blanc forcé sur Jojo en Collection (empêchait de voir le cycle) */
/* Fond animé: blanc -> sépia synchronisé avec l'arrivée (9%) */
.jojo-bg-anim { animation: jojo-bg-cycle 4.7s steps(1, end) infinite; will-change: background-color; }
@keyframes jojo-bg-cycle {
  0%, 8.8% { background-color: #ffffff; }
  8.8%, 99% { background-color: #f1e5c6; }
  100% { background-color: #ffffff; }
}
/* Filtre sépia + timings pour l'aperçu Collection de Jojo */
/* Filtre sépia synchronisé avec le moment d'arrivée de la flèche (même timing que Navbar) */
.jojo-sepia-anim { animation: jojo-sepia-cycle 4.7s steps(1, end) infinite; will-change: filter; }
@keyframes jojo-sepia-cycle {
  0%, 8.8% { filter: sepia(0); }
  8.8%, 99% { filter: sepia(1); }
  100% { filter: sepia(0); }
}
/* Animation d'arrivée de droite à gauche (comme Navbar) */
.jojo-swipe { animation: jojo-swipe 4.7s linear infinite; will-change: transform; }
@keyframes jojo-swipe {
  0% { transform: translateX(0); }
  6% { transform: translateX(-60%); }
  8.8% { transform: translateX(-110%); }
  62% { transform: translateX(-110%); }
  99% { transform: translateX(-110%); }
  100% { transform: translateX(0); }
}

/* Jojotext apparait uniquement quand la flèche est arrivée (9%) */
.jojotext-fade { animation: jojotext-fade 4.7s steps(1, end) infinite; will-change: opacity; }
@keyframes jojotext-fade {
  0%, 8.8% { opacity: 0; }
  8.8% { opacity: 1; }
  62% { opacity: 1; }
  99% { opacity: 0; }
  100% { opacity: 0; }
}

.black-bg {
  background: #70dd92;
}

.item-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.item-name {
  margin-bottom: 12px;
  color: #333;
  font-size: 16px;
}

.item-price {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-bottom: 18px;
  color: #00c97b;
  font-size: 15px;
}
.item-price.no-top-margin {
  margin-bottom: 0 !important;
}
.item-price.creator-has-name {
  margin-bottom: 0 !important;
}

.item-actions {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 8px;
}

.buy-btn, .equip-btn, .owned-btn, .info-btn {
  padding: 12px 20px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 15px;
}

.buy-btn {
  background: #5bc682;
  color: white;
}

.buy-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 201, 123, 0.3);
}

.buy-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  opacity: 0.6;
}

.weekly-shop-container .item-actions .buy-btn.price-hover {
  background: none;
  background-image: linear-gradient(100deg, #2fbf71 0%, #2fbf71 50%, #ffffff 100%);
  background-size: 200% 100%;
  transition: background-position 0.5s ease, color 0.3s ease, box-shadow 0.3s ease;
  position: relative;
  overflow: hidden;
}
.weekly-shop-container .item-actions .buy-btn.price-hover:hover:not(:disabled) {
  background-position: 100% 0;
  box-shadow: 0 6px 16px rgba(47,191,113,0.35);
}
.weekly-shop-container .item-actions .buy-btn.price-hover .btn-label { opacity: 1; transition: opacity 0.25s ease; }
.weekly-shop-container .item-actions .buy-btn.price-hover:hover:not(:disabled) .btn-label { opacity: 0; }
.weekly-shop-container .item-actions .buy-btn.price-hover .btn-price {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  gap: 6px;
  opacity: 0;
  color: #0e7a46;
  transition: opacity 0.25s ease;
}
.weekly-shop-container .item-actions .buy-btn.price-hover:hover:not(:disabled) .btn-price { opacity: 1; }
.coin-icon.coin-small { width: 16px; height: 16px; }

.equip-btn {
  background: #5bc682;
  color: white;
}

.equip-btn:hover {
  background: #5a6268;
  transform: translateY(-2px);
}

.equip-btn.equipped {
  background: #fd1515d4;
}
.owned-btn {
  background: #5bc682;
  color: white;
  cursor: default;
}
.info-btn {
  background: #f8f9fa;
  color: #333;
  border: 2px #5150503d solid;
}

.leaderboard-container {
  display: grid;
  grid-template-columns: 38% 60%;
  gap: 2%;
  align-items: start;
  margin-top: 20px;
}

/* Section Gauche: Personnel */
.personal-section {
  display: flex;
  border-radius: 12px;
  flex-direction: column;
  gap: 20px;
  height: 100%;
}

.toggle-header {
  display: flex;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 4px;
  gap: 4px;
}

.toggle-btn {
  flex: 1;
  padding: 10px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.5);
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.toggle-btn.active {
  background: linear-gradient(90deg, #00FFB2, #00D89E);
  color: #fff;
  box-shadow: 0 2px 8px rgba(0, 216, 158, 0.3);
}

.toggle-btn:hover:not(.active) {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

[data-theme="light"] .toggle-btn {
  background: #F4F5F7 !important;
  color: #111111 !important;
  border: 1px solid #E9E9EA !important;
}
[data-theme="light"] .toggle-btn:hover:not(.active) {
  background: #e9ecef !important;
  color: #111111 !important;
}

/* Liste Leaderboard */
.leaderboard-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 600px;
  overflow-y: auto;
  padding-right: 5px;
}

.personal-section .leaderboard-list {
  max-height: 875px;
}
.personal-section .leaderboard-item {
  min-height: 120px !important;
  height: 120px !important;
  width: 325px !important;
  max-width: 325px !important;
  margin: 0 auto;
}

.leaderboard-item {
  display: flex;
  align-items: center;
  gap: 15px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 12px 16px;
  border-radius: 16px;
  transition: transform 0.2s, background 0.2s;
}

.leaderboard-item:hover {
  transform: translateX(4px);
  background: rgba(255, 255, 255, 0.06);
}

.leaderboard-position {
  min-width: 40px;
  text-align: center;
  font-weight: bold;
  font-size: 18px;
}

.medal {
  font-size: 24px;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

.user-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 30px;
  position: relative; /* Nécessaire pour les items dynamiques overlay */
}

.username {
  color: #fff;
  font-size: 16px;
  font-weight: 500;
}

.user-score {
  font-size: 18px;
  font-weight: bold;
  color: #FFD700;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* Section Droite: Factions */
.factions-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.factions-header-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  font-size: 24px;
  font-weight: 800;
  text-transform: uppercase;
}

.team-name-badge {
  padding: 10px 24px;
  border: 2px solid rgba(0, 216, 158, 0.4);
  border-radius: 12px;
  background: rgba(0, 216, 158, 0.05);
  color: #fff;
}

.vs-badge {
  color: #00D89E;
  font-size: 20px;
  background: rgba(0, 216, 158, 0.1);
  padding: 5px 10px;
  border-radius: 8px;
}

.month-timer {
  background: rgba(0, 216, 158, 0.05);
  border: 2px solid rgba(0, 216, 158, 0.3);
  border-radius: 16px;
  padding: 15px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.countdown-text {
  font-size: 22px;
  font-weight: bold;
  color: #00FFB2;
}

.timer-range {
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
}

.factions-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.faction-col {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.faction-total-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px 20px 0 0;
  padding: 20px;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.faction-total-card.winner {
  background: #00D89E;
  color: #fff;
  border: none;
}
.faction-total-card.selected {
  background: #00D89E;
  color: #fff;
  border: none;
}
.faction-total-card.unselected {
  background: #121313 !important;
  color: #fff;
  border: none;
}

.total-score-display {
  font-size: 32px;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.winner .total-score-display, .selected .total-score-display, .unselected .total-score-display { color: #fff; }

/* Responsive */
@media (max-width: 1024px) {
  .leaderboard-container {
    grid-template-columns: 1fr;
  }
  .personal-section { margin-bottom: 30px; }
}

@media (max-width: 768px) {
  .factions-grid { grid-template-columns: 1fr; }
  .factions-header-title { flex-direction: column; gap: 10px; }
}

.user-avatar-container {
  position: relative;
  width: 50px;
  height: 50px;
}

/* Items dynamiques placés par-dessus le conteneur */
.dynamic-container-overlay {
  position: absolute !important;
  z-index: 100 !important;
  pointer-events: none !important;
}

.user-avatar {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
}
.user-avatar.no-border { border: none !important; background: transparent !important; }

/* Preview Leaderboard placement for Miaou (same as classic leaderboard) */
.preview-card.preview-leaderboard .equipped-pate-inside { position: absolute !important; top: 53% !important; left: -1% !important; width: 60% !important; height: 54% !important; object-fit: contain !important; pointer-events: none !important; z-index: 3 !important; }
.preview-card.preview-leaderboard .equipped-chat-overlay { position: absolute !important; top: -34% !important; left: 1% !important; width: 25% !important; height: 100% !important; object-fit: contain !important; pointer-events: none !important; z-index: 3 !important; }
.preview-card.preview-leaderboard .equipped-camera-overlay { position: absolute !important; top: 55% !important; left: 0% !important; width: 10% !important; height: 70% !important; object-fit: contain !important; z-index: 3 !important; }
.preview-card.preview-leaderboard .equipped-flash-overlay { position: absolute !important; top: 3% !important; left: -16% !important; width: 50% !important; height: 100% !important; z-index: 3 !important; }
.preview-card.preview-leaderboard .user-avatar-container .equipped-cat-ears { position: absolute !important; left: 56% !important; top: 115% !important; width: 120% !important; height: 120% !important; object-fit: contain !important; transform: translate(-50%, -60%) scale(1.50) !important; transform-origin: center bottom !important; pointer-events: none !important; z-index: 3 !important; }
.preview-card.preview-leaderboard .equipped-cat-ears { position: absolute !important; inset: 0 !important; top: -48px !important; width: 100% !important; height: 100% !important; margin: auto !important; object-fit: contain !important; transform: scale(1.15) !important; transform-origin: center top !important; pointer-events: none !important; z-index: 3 !important; }
  .preview-card.preview-leaderboard .equipped-stars-overlay { position: absolute !important; inset: 0 !important; top: -5px !important; left: 3px !important; width: 100% !important; height: 100% !important; margin: auto !important; object-fit: contain !important; transform: scale(1.22) !important; transform-origin: center top !important; pointer-events: none !important; z-index: 3 !important; }
  .preview-card.preview-leaderboard .user-avatar-container .equipped-royal-frame-overlay { position: absolute !important; left: 60% !important; top: 89% !important; width: 162% !important; height: 160% !important; object-fit: contain !important; transform: translate(-50%, -62%) scale(1.08) !important; transform-origin: center bottom !important; pointer-events: none !important; z-index: 3 !important; }
.preview-card.preview-leaderboard .user-avatar-container .equipped-vinyle-overlay { position: absolute !important; left: 61% !important; top: -2% !important; width: 120% !important; height: 120% !important; object-fit: contain !important; transform: translate(-50%, -62%) scale(1.05) !important; transform-origin: center bottom !important; pointer-events: none !important; z-index: 3 !important; }
.preview-card.preview-leaderboard .user-avatar-container .equipped-dvd-inside, .preview-card.preview-leaderboard .user-avatar .equipped-dvd-inside { position: absolute !important; top: 30%; left: 30%; width: 60% !important; height: 60% !important; object-fit: contain !important; transform: translate(-50%, -50%) !important; pointer-events: none !important; z-index: 3 !important; animation: dvdBounceShop 4s linear infinite !important; will-change: top, left; backface-visibility: hidden; }
.preview-card.preview-leaderboard .user-avatar-container .equipped-nokia-inside { position: absolute !important; left: 14% !important; top: 99% !important; width: 75% !important; height: 140% !important; object-fit: contain !important; transform: translate(-50%, -62%) !important; pointer-events: none !important; z-index: 2 !important; }
.preview-card.preview-leaderboard .user-avatar-container .equipped-clippy-inside { position: absolute !important; left: 85% !important; top: 85% !important; width: 60% !important; height: auto !important; object-fit: contain !important; transform: translate(-50%, -62%) !important; pointer-events: none !important; z-index: 3 !important; }
.preview-card.preview-leaderboard .user-avatar-container .equipped-daftpunk-overlay { position: absolute !important; left: 56% !important; top: -25% !important; width: 100% !important; height: auto !important; object-fit: contain !important; transform: translate(-50%, -50%) !important; pointer-events: none !important; z-index: 4 !important; }
.preview-card.preview-leaderboard .user-avatar-container .equipped-discord-overlay { position: absolute !important; top: -1px !important; left: -20px !important; width: 26% !important; height: 120% !important; object-fit: contain !important; pointer-events: none !important; z-index: 4 !important; }
.preview-card.preview-leaderboard .equipped-discord-overlay { position: absolute !important; top: -1px !important; left: -20px !important; width: 26% !important; height: 120% !important; object-fit: contain !important; pointer-events: none !important; z-index: 4 !important; }
.preview-card.preview-leaderboard .equipped-tomb-raider { position: absolute !important; top: -36px !important; left: -135px !important; width: 116% !important; height: 116% !important; object-fit: contain !important; pointer-events: none !important; z-index: 2 !important; }
/* Clown (preview leaderboard): hair above avatar, nose centered inside */
.preview-card.preview-leaderboard .user-avatar-container .equipped-clown-overlay { position: absolute !important; left: 56% !important; top: 44px !important; width: 63% !important; height: 70% !important; object-fit: contain !important; transform: translate(-50%, -60%) scale(2.6) !important; transform-origin: center bottom !important; pointer-events: none !important; z-index: 3 !important; }
.preview-card.preview-leaderboard .user-avatar .equipped-clown-nose { position: absolute !important; left: 50% !important; top: 52% !important; width: 60% !important; height: auto !important; object-fit: contain !important; transform: translate(-50%, -50%) !important; pointer-events: none !important; z-index: 3 !important; }
.preview-card.preview-leaderboard .equipped-absolute-cinema-overlay { position: absolute !important; top: -10% !important; left: -64% !important; width: 100% !important; height: 100% !important; object-fit: contain !important; pointer-events: none !important; z-index: 15 !important; }
.preview-card.preview-leaderboard .equipped-absolute-cinema-overlay-right { position: absolute !important; top: -10% !important; left: 77% !important; width: 100% !important; height: 100% !important; object-fit: contain !important; pointer-events: none !important; z-index: 15 !important; transform: scaleX(-1) !important; transform-origin: center !important; }

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-details {
  flex: 1;
}

.username {
  color: #333;
  font-size: 18px;
}

/* Thème sombre: pseudos en blanc dans le leaderboard */
[data-theme="dark"] .leaderboard-item .username {
  color: #ffffff !important;
}
[data-theme="dark"] .leaderboard-item {
  background: #1E1E1F !important;
  border: 1px solid #2A2A2B !important;
  box-shadow: none !important;
}
[data-theme="dark"] .leaderboard-item .leaderboard-position {
  color: #e6e6e6 !important;
}

[data-theme="light"] .leaderboard-item {
  background: #ffffff !important;
  border: 1px solid #E9E9EA !important;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08) !important;
}
[data-theme="light"] .leaderboard-item .username {
  color: #111111 !important;
}
[data-theme="dark"] .leaderboard-item {
  background: #1E1E1F !important;
  border: 1px solid #2A2A2B !important;
  box-shadow: none !important;
}
[data-theme="dark"] .leaderboard-item .leaderboard-position {
  color: #e6e6e6 !important;
}

/* Thème sombre: noms des items en sombre (cartes blanches) */
[data-theme="dark"] .shop-item .item-name,
[data-theme="dark"] .leaderboard-container .item-name {
  color: #333 !important;
}

/* Thème sombre: noms des items/couleurs en blanc dans la boutique quotidienne */
[data-theme="dark"] .weekly-shop-container .shop-item .item-name {
  color: #ffffff !important;
}

/* Thème sombre: items débloqués (possédés/équipés) en blanc dans la Collection */
[data-theme="dark"] .shop-grid .collection-item.owned .item-name,
[data-theme="dark"] .shop-grid .collection-item.equipped .item-name {
  color: #ffffff !important;
}

/* Thème sombre: titres des sections en blanc dans la boutique quotidienne */
[data-theme="dark"] .section-title {
  color: #ffffff !important;
}

.user-score {
  color: #00c97b;
  font-size: 18px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.score-value {
  display: flex;
  align-items: center;
  justify-content: center;
}

.coin-icon-small {
  width: 16px;
  height: 16px;
}

.confirm-message {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: linear-gradient(135deg, #00c97b, #00a8ff);
  color: white;
  padding: 20px 30px;
  border-radius: 15px;
  font-weight: bold;
  font-size: 18px;
  z-index: 2000;
  box-shadow: 0 10px 30px rgba(0, 201, 123, 0.4);
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* Styles pour les items spéciaux dans l'onglet collection */
.matrix-rain-inside-shop {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.clown-item-shop {
  width: 100%;
  height: 100%;
  position: relative;
}

.clown-hair-shop {
  max-width: 100%;
    max-height: 90%;
    object-fit: contain;
    position: absolute;
    left: 11px;
}

.clown-nose-shop {
  max-width: 100%;
    max-height: 45%;
    object-fit: contain;
    position: absolute;
    top: 30px;
    left: 28px;
}

.cash-animation-shop {
  width: 100%;
    height: 100%;
  position: relative;
    top: 0px;
    left: 25%;
}

.cash-img-shop {
  max-width: 100%;
  max-height: 100%;
    object-fit: contain;
}

.roi-item-shop {
  width: 80%;
    height: 90%;
    position: relative;
    top: -2%;
    left: 0px;
}

.roi-img-shop {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.target-animation-shop {
    width: 100%;
    height: 95%;
    position: relative;
    top: 0px;
    left: 0px;
}

.target-img-shop {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.stars-item-shop {
  width: 100%;
    height: 65%;
    position: relative;
    top: -3px;
    left: 1px;
}

.stars-img-shop {
  max-width: 109%;
  max-height: 115%;
  object-fit: contain;
}

.royal-frame-item-shop {
  width: 80%;
  height: 80%;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  top: 0px;
}

.royal-frame-img-shop {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.rainbow-item-shop {
  width: 68%;
    height: 78%;
  display: flex;
  justify-content: center;
  position: relative;
    top: 0px;
    left: 0px;
}

.rainbow-img-shop {
    max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.gentleman-item-shop {
    width: 100%;
  height: 100%;
  position: relative;
  top: -2px;
  left: 5px;
}

/* Obsolète: positions par défaut de Gentleman/Moustache
.moustache-img-shop {
  max-width: 47%;
  max-height: 55%;
  object-fit: contain;
  position: absolute;
  top: 44px;
  left: 19px;
}

.gentleman-img-shop {
  max-width: 55%; 
  max-height: 44%;
    object-fit: contain;
  position: absolute;
      top: 20px;
    left: 15px;
}
*/

/* Overrides Collection uniquement – placed here to win cascade over base rules */
.shop-grid .collection-item .gentleman-img-shop { top: 18px; left: 13px; max-width: 60% !important; max-height: 48% !important; position: absolute; }
.shop-grid .collection-item .moustache-img-shop { top: 39px; left: 14px; max-width: 55% !important; max-height: 55% !important; position: absolute; }
.shop-grid .collection-item .absolute-cinema-item-shop { gap: 17px !important; }

.vinyle-item-shop {
  width: 100%;
    height: 80%;
    position: relative;
    bottom: 0%;
    left: 0%;
}

.vinyle-img-shop {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

/* Aperçu Cosmétique uniquement */
.preview-card.preview-item .spacestars-img-shop { position: absolute !important; top: -3% !important; left: 7% !important; max-width: 81% !important; }
.preview-card.preview-item .asteroide-img-shop { position: absolute !important; top: 75px !important; left: 75px !important; }

.advisory-item-shop {
  width: 100%;
  height: 100%;
    position: relative;
    top: 15px;
    left: 0px;
}

.advisory-img-shop {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.espace-item-shop {
  width: 100%;
  height: 100%;
  position: relative;
  top: 2px;
  left: -2px;
}

.spacestars-img-shop {
  max-width: 91%;
  max-height: 165%;
  object-fit: contain;
  position: absolute;
  top: 16%;
  left: 5%;
}

.asteroide-img-shop {
  max-width: 100%;
  max-height: 50%;
  object-fit: contain;
  position: absolute;
  top: 41px;
  left: 9px;
}

.absolute-cinema-item-shop {
  width: 100%;
  height: 108%;
  position: relative;
  top: 1%;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 45px;
}

.absolute-cinema-img-shop, .absolute-cinema-img-shop-right {
  max-width: 42% !important;
  max-height: 70% !important;
  object-fit: contain !important;
  position: static !important;
}



  /* Ange - Collection: positionnement et taille dédiés */
  .angel-item-shop {
    width: 100%;
    height: 100%;
    position: relative;
    top: -6px; /* ajuste verticalement */
    left: -4px; /* ajuste horizontalement */
  }
  .angel-img-shop {
    max-width: 80%;
    max-height: 100%;
    object-fit: contain;
    position: absolute;
    top: 24px;
    left: 13px;
    transform: scale(1.05);
  }

  /* Discord - Collection: positionnement et taille */
  .discord-item-shop {
    width: 100%;
    height: 100%;
    position: relative;
  }
  .discord-img-shop {
    position: absolute;
    top: 12px;
    left: 15px;
    width: 65%;
    height: 77%;
    object-fit: contain;
  }
  /* Galaxie = clone des propriétés Discord */
  .galaxie-item-shop {
    width: 100%;
    height: 100%;
    position: relative;
  }
  .galaxie-img-shop {
    position: absolute;
    top: -5px;
    left: 5px;
    width: 90%;
    height: 112%;
    object-fit: contain;
  }
  /* Coeur = clone des propriétés Galaxie */
  .coeur-item-shop {
    width: 100%;
    height: 100%;
    position: relative;
  }
  .coeur-img-shop {
    position: absolute;
    left: 7px;
    top: 7px;
    width: 80%;
    height: 80%;
    object-fit: contain;
  }
  /* Alpha = clone des propriétés Galaxie */
  .alpha-item-shop {
    width: 100%;
    height: 100%;
    position: relative;
  }
  .alpha-img-shop {
    position: absolute;
    top: 15px;
    left: 15px;
    width: 65%;
    height: 65%;
    object-fit: contain;
  }
  /* Admin Planify = clone des propriétés Galaxie */
  .admin-planify-item-shop {
    width: 100%;
    height: 100%;
    position: relative;
  }
  .admin-planify-img-shop {
    position: absolute;
    top: 13px;
    left: 15px;
    width: 65%;
    height: 65%;
    object-fit: contain;
  }

.flash-item-shop {
  width: 100%;
  height: 100%;
  position: relative;
}

.flash-img-shop {
  max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  position: absolute;
    top: 50%;
    left: 56%;
    transform: translate(-50%, -50%);
    z-index: 2;
}

.camera-img-shop {
  max-width: 100%;
    max-height: 60%;
    object-fit: contain;
      position: absolute;
    top: 70%;
    left: 35%;
    transform: translate(-50%, -50%);
    z-index: 1;
}

.miaou-item-shop {
  width: 100%;
  height: 100%;
  position: relative;
}

.chat-img-shop {
  max-width: 60%;
    max-height: 100%;
    object-fit: contain;
    position: absolute;
    top: 35%;
    left: 63%;
    transform: translate(-50%, -50%);
    z-index: 2;
}

.pate-img-shop {
  max-width: 100%;
    max-height: 30%;
  object-fit: contain;
    position: absolute;
    top: 50px;
    left: 20%;
}

.dvd-item-shop {
  width: 100%;
  height: 100%;
  position: relative;
  top: 1px;
  left: -3px;
}

.dvd-img-shop {
  position: absolute;
  top: 30%;
  left: 30%;
  width: 60%;
  height: 60%;
  object-fit: contain;
  transform: translate(-50%, -50%);
  animation: dvdBounceShop 4s linear infinite;
}

@keyframes dvdBounceShop {
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

@keyframes dvdBounceShopLarge {
  0% {
    top: 40%;
    left: 40%;
  }
  50% {
    top: 60%;
    left: 60%;
  }
  100% {
    top: 40%;
    left: 40%;
  }
}

.lunettes-pixel-item-shop {
  width: 100%;
  height: 100%;
  position: relative;
  top: 0px;
  left: 0px;
}

.lunettes-pixel-img-shop {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.nokia-item-shop {
  width: 100%;
  height: 100%;
  position: relative;
}

.nokia-img-shop {
  position: absolute;
  left: 37%;
  top: 70%;
  transform: translate(-50%, -50%);
  width: 25%;
  height: auto;
  object-fit: contain;
  z-index: 1;
}

.clippy-img-shop {
  position: absolute;
  left: 60%;
  top: 70%;
  transform: translate(-50%, -50%);
  width: 18%;
  height: auto;
  object-fit: contain;
  z-index: 2;
}

.daftpunk-img-shop {
  position: absolute;
  left: 50%;
  top: 25%;
  transform: translate(-50%, -50%);
  width: 40%;
  height: auto;
  object-fit: contain;
  z-index: 3;
}

/* Overrides Collection uniquement pour 2000 */
.shop-grid .collection-item .nokia-img-shop { left: 13% !important;  top: 50% !important; width: 40% !important; transform: none !important; position: absolute !important; height: auto !important; object-fit: contain !important; }
.shop-grid .collection-item .clippy-img-shop { left: 50% !important; top: 60% !important; width: 29% !important; transform: none !important; position: absolute !important; height: auto !important; object-fit: contain !important; }
.shop-grid .collection-item .daftpunk-img-shop { width: 60% !important; transform: none !important; position: absolute !important; height: auto !important; object-fit: contain !important; left: 20% !important; top: 10% !important; }

/* Styles pour les items équipés dans le leaderboard */
.equipped-cat-ears {
  position: absolute !important;
    top: -33px !important;
    left: -10px !important;
    width: 153% !important;
    height: 153% !important;
    z-index: 3 !important;
}

.equipped-clown {
  position: absolute;
  top: -8px;
  left: -8px;
  width: 116%;
  height: 116%;
  z-index: 2;
}

.equipped-cash {
  position: absolute;
  top: -8px;
  left: -8px;
  width: 116%;
  height: 116%;
  z-index: 2;
}

.equipped-target {
  position: absolute;
  top: -8px;
  left: -8px;
  width: 116%;
  height: 116%;
  z-index: 2 !important;
}

.equipped-king {
  position: absolute;
  top: -8px;
  left: -8px;
  width: 116%;
  height: 116%;
  z-index: 2;
}

.equipped-matrix {
  position: absolute;
  top: -8px;
  left: -8px;
  width: 116%;
  height: 116%;
  z-index: 2;
}

.equipped-angel {
  position: absolute;
  top: -8px;
  left: -8px;
  width: 116%;
  height: 116%;
  z-index: 2;
}

.equipped-tomb-raider {
  position: absolute;
  top: -8px;
  left: -8px;
  width: 116%;
  height: 116%;
  z-index: 2;
}

.equipped-stars {
  position: absolute;
  top: -8px;
  left: -8px;
  width: 116%;
  height: 116%;
  z-index: 2;
}

.equipped-royal-frame {
  position: absolute;
  top: -8px;
  left: -8px;
  width: 116%;
  height: 116%;
  z-index: 2;
}

.equipped-roses {
  position: absolute;
  top: -7px;
  left: -1px;
  width: 130%;
  height: 120%;
  transform: translate(-10%);
  pointer-events: none;
  z-index: 2;
}

.equipped-gentleman {
    position: absolute;
  top: -30px;
  left: 0px;
  width: 120%;
    height: 75%;
  transform: translate(-10%);
  pointer-events: none;
  z-index: 2;
}

.equipped-vinyl {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
}

.equipped-advisory {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
}

.equipped-space {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
}

.equipped-cinema {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
}

.equipped-flash {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
}

.equipped-meow {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
}

.equipped-dvd {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
}

.equipped-pixel-glasses {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
}

.equipped-2000 {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
}

/* Styles spécifiques pour les items dans le leaderboard */
.equipped-moustache-inside {
  position: absolute;
  top: 10px;
  left: 7px;
  width: 80%;
  height: 75%;
  object-fit: cover;
  pointer-events: none;
  z-index: 1;
}

.equipped-pate-inside {
  position: absolute;
  top: 56%;
  left: 30%;
  width: 18%;
  height: 20%;
  z-index: 3 !important;
}

.equipped-dvd-inside {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.equipped-lunettes-pixel-inside {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.equipped-nokia-inside {
  position: absolute;
  top: 0;
  left: 0;
    width: 100%;
  height: 100%;
  z-index: 1;
}

.equipped-clippy-inside {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.equipped-cash-inside {
  position: absolute;
  top: 0;
  left: 0;
    width: 100%;
  height: 100%;
    object-fit: cover;
    pointer-events: none;
  z-index: 1;
}

.equipped-target-inside {
  position: absolute;
  top: -5px;
  left: -6px;
  width: 128%;
  height: 129%;
  object-fit: cover;
  pointer-events: none;
  z-index: 1;
}

.equipped-advisory-inside {
  position: absolute;
  top: 48%;
  left: 20%;
  width: 100%;
  height: 60%;
  z-index: 1;
}

.equipped-spacestars-inside {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.equipped-asteroide-overlay {
  position: absolute;
  top: 30%;
  left: 6%;
  width: 60%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
  z-index: 3;
}

.equipped-angel-wings {
  position: absolute;
  top: -43px;
  left: -23px;
  width: 220%;
  height: 148%;
  object-fit: contain;
  pointer-events: none;
  z-index: 15;
}

/* Préviews: place Ange derrière la bordure et l'avatar */
.preview-card.preview-avatar .profile-avatar { position: relative !important; z-index: 2 !important; }
.preview-card.preview-avatar .profile-avatar-scaler .equipped-angel-wings { z-index: 0 !important; }
.preview-card.preview-leaderboard .user-avatar-container .equipped-angel-wings { z-index: 0 !important; }
.preview-card.preview-avatar .profile-avatar-wrap:has(.equipped-angel-wings) { height: 400px !important; }
.preview-card.preview-avatar .profile-avatar-stage:has(.equipped-angel-wings) { height: 400px !important; }

.equipped-clown-overlay {
    position: absolute;
  top: -23px;
  left: -1px;
  width: 130%;
  height: 130%;
    transform: translate(-10%);
    pointer-events: none;
  z-index: 3;
}

.equipped-roi-overlay, .equipped-roi-overlay-mobile {
  position: absolute;
  top: -36px;
  left: -2px !important;
  width: 30% !important;
  height: 100%;
  transform: translate(-10%);
  pointer-events: none;
  z-index: 3;
}

.equipped-gentleman-overlay {
  position: absolute;
  top: -20px;
  left: 0px;
  width: 20%;
  height: 75%;
    transform: translate(-10%);
  pointer-events: none;
  z-index: 3;
}

.equipped-vinyle-overlay {
    position: absolute;
  top: 0;
  left: 0;
  width: 100%;
    height: 100%;
  z-index: 3;
  }

.equipped-flash-overlay {
  position: absolute;
  top: 22%;
  left: 28%;
  width: 47%;
  height: 60%;
  z-index: 3;
}

.equipped-camera-overlay {
  position: absolute;
  top: 60%;
  left: 30%;
  width: 20%;
  height: 25%;
  z-index: 3 !important;
  }

.equipped-chat-overlay {
  position: absolute;
  top: 2%;
  left: 33%;
  width: 60%;
  height: 50%;
  z-index: 3 !important;
  }

.equipped-daftpunk-overlay {
    position: absolute;
  top: 0;
  left: 0;
  width: 100%;
    height: 100%;
    z-index: 3;
}

.equipped-absolute-cinema-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  z-index: 3;
}

.equipped-absolute-cinema-overlay-right {
      position: absolute;
  top: 0;
  left: 0;
    width: 100%;
    height: 100%;
  z-index: 3;
}

/* Tomb Raider - Boutique hebdomadaire: même gabarit que collection */
.weekly-shop-container .tombraider-item-shop {
  width: 100% !important;
  height: 100% !important;
  position: relative !important;
}
.weekly-shop-container .tombraider-item-shop .item-img {
  position: absolute !important;
  top: 0px !important;
  left: 0px !important;
  width: 116% !important;
  height: 116% !important;
  object-fit: contain !important;
}

  .equipped-royal-frame {
  position: absolute;
  top: -17px;
  left: -7px;
    width: 159%;
    height: 158%;
  object-fit: contain;
  pointer-events: none;
  z-index: 3;
  transform: translate(-10%);
  }

  .equipped-rainbow {
  position: absolute;
  top: -2px;
    left: 0px;
    width: 141%;
    height: 122%;
    transform: translate(-10%);
    pointer-events: none;
  z-index: 3;
}

.equipped-clown-nose {
  position: absolute;
  top: 50%;
  left: 51.4%;
  transform: translate(-50%, -50%);
    width: 50%;
    height: 50%;
    object-fit: contain;
    pointer-events: none;
  z-index: 3;
  }

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
  line-height: 10px;
  font-family: 'Courier New', monospace;
  font-weight: bold;
  text-shadow: 0 0 5px #00ff00;
  opacity: 0.9;
  margin: 1px 0;
}

@keyframes matrixFall {
  0% { top: -100%; opacity: 1; }
  100% { top: 100%; opacity: 0; }
}

  .classic-border-actions {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-top: 8px;
    flex-direction: column;
  }

  .classic-border-colors {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  /* Bouton Changer de couleur */
  .color-change-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: 13px;
  }

  /* Overlay popup */
  .color-picker-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 50000;
    overscroll-behavior: auto;
    touch-action: auto;
  }

  .color-picker-modal {
    background: #fff;
    border-radius: 12px;
    width: min(550px, 92vw);
    max-height: 90vh;
    overflow: auto; /* conserve les bords arrondis et scrolle en interne */
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: auto;
    touch-action: auto;
    box-shadow: 0 20px 40px rgba(0,0,0,0.2);
    display: flex;
    flex-direction: column; /* permet à la grille de prendre l'espace restant et scroller */
  }

  .color-picker-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    background: #f8f9fa;
    border-bottom: 1px solid #e5e7eb;
    font-weight: 600;
    color: black;
    position: relative; /* pour positionner la croix en absolu dans l'en-tête */
  }
  .color-picker-title {
    font-size: 23px;
  }

  .close-btn-small {
    background: transparent !important;
    border: none !important;
    width: 40px;
    height: 40px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: transform 0.25s ease, filter 0.25s ease;
  }

  .close-btn-small .close-img {
    width: 28px;
    height: 28px;
    display: block;
    transition: transform 0.25s ease, filter 0.25s ease;
    filter: grayscale(0.5) brightness(0.95);
  }

  .close-btn-small:hover .close-img { transform: scale(1.18); filter: grayscale(0) brightness(1.1); }

  .color-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
    padding: 16px;
    overflow-y: auto; /* défilement vertical */
    max-height: 65vh; /* laisse de la place pour l'en-tête */
    overscroll-behavior: auto;
  }

  @media (max-width: 480px) {
    .color-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      max-height: 60vh;
    }
    .preview-card.preview-avatar:not(.roi-preview) .profile-avatar-scaler { width: 250px !important; }
    .profile-avatar-stage { width: 250px !important; }
    .profile-avatar-stage { width: 250px !important; }
    .profile-popup .profile-avatar-stage { width: 250px !important; }
    .preview-card.preview-avatar .profile-avatar-scaler .equipped-cat-ears {
      position: absolute !important;
      left: 49% !important;
      top: 53% !important;
      width: 84% !important;
      height: 80% !important;
    }
    .preview-card.preview-avatar .profile-avatar-scaler .equipped-royal-frame {
      left: 50% !important;
      top: 79% !important;
      width: 100% !important;
      height: 86% !important;
    }
    .preview-card.preview-leaderboard .equipped-roi-overlay,
    .preview-card.preview-leaderboard .equipped-roi-overlay-mobile {
      top: -36px !important;
      left: 1px !important;
      width: 30% !important;
    }
    .preview-card.preview-avatar.roi-preview .profile-avatar-scaler { width: 250px !important; }
    .preview-card.preview-avatar.roi-preview .equipped-roi-overlay { top: 3px !important; left: 48px !important; width: 70% !important; height: 35% !important; }
    .preview-card.preview-avatar .profile-avatar-scaler .equipped-rainbow { left: 50% !important; top: 80% !important; width: 66% !important; height: 61% !important; }
    .preview-card.preview-leaderboard .equipped-gentleman-overlay { width: 33% !important; }
    .preview-card.preview-avatar .profile-avatar-scaler .equipped-vinyle-overlay { width: 50% !important; height: 48% !important; }
    .preview-card.preview-avatar.vinyle-preview .profile-avatar-scaler { width: 250px !important; }
    .preview-card.preview-avatar .profile-avatar-scaler .equipped-absolute-cinema-overlay { left: -5.5% !important; top: 20% !important; width: 34% !important; height: 45% !important; }
    .preview-card.preview-avatar .profile-avatar-scaler .equipped-absolute-cinema-overlay-right { left: 70.5% !important; top: 20% !important; width: 34% !important; height: 45% !important; }
    .preview-card.preview-avatar .profile-avatar-scaler .equipped-flash-overlay { top: 22% !important; left: 28% !important; width: 45% !important; height: 60% !important; }
    .preview-card.preview-avatar .profile-avatar-scaler .equipped-camera-overlay { top: 51% !important; left: 20% !important; width: 35% !important; height: 40% !important; }
    .preview-card.preview-leaderboard .equipped-flash-overlay { top: 3% !important; left: -9% !important; width: 50% !important; height: 100% !important; }
    .preview-card.preview-leaderboard .equipped-camera-overlay { top: 47% !important; left: -1% !important; width: 17% !important; height: 90% !important; object-fit: contain !important; }
    .preview-card.preview-item .daftpunk-img-shop { width: 45% !important; }
    .preview-card.preview-item .nokia-img-shop { width: 30% !important; left: 35% !important; top: 60% !important; }
    .preview-card.preview-item .clippy-img-shop { width: 25% !important; left: 61% !important; top: 60% !important; }
    .preview-card.preview-item .angel-img-shop { width: 85% !important; }
    .preview-card.preview-item .equipped-angel-wings { width: 85% !important; }
    .preview-card.preview-avatar.nokia-preview .profile-avatar-scaler { width: 250px !important; }
    .preview-card.preview-avatar .profile-avatar-scaler .equipped-discord-overlay { left: 7% !important; top: 16% !important; width: 75% !important; height: 75% !important; }
    .preview-card.preview-item .jojo-img-shop { left: 230px !important; width: 75% !important; }
    .preview-card.preview-item .miaou-item-shop .chat-img-shop { top: 40% !important; left: 63% !important; max-width: 65% !important; }
    .preview-card.preview-item .miaou-item-shop .pate-img-shop { top: 130px !important; left: 30% !important;  max-height: 20% !important; }
    .preview-card.preview-leaderboard .equipped-chat-overlay { top: -35% !important; left: 5% !important; width: 35% !important; }
    .preview-card.preview-avatar .profile-avatar-scaler .equipped-chat-overlay { top: 1% !important; left: 42% !important; width: 60% !important; }
    .preview-card.preview-avatar .profile-avatar-scaler .equipped-pate-inside { top: 56% !important; left: 23% !important; width: 25% !important; height: 20% !important; }
    .preview-card.preview-avatar .profile-avatar-scaler .equipped-daftpunk-overlay { left: 22% !important; top: 11% !important; width: 55% !important; }
    .preview-card.preview-avatar .profile-avatar-scaler .equipped-nokia-inside { left: 28% !important; top: 60% !important; width: 40% !important; height: 23% !important; }
    .preview-card.preview-avatar .profile-avatar-scaler .equipped-clippy-inside { left: 54% !important; top: 48% !important; width: 27% !important; height: 25% !important; }
    .preview-card.preview-leaderboard .equipped-tomb-raider { left: -78px !important; }
    .preview-card.preview-avatar .profile-avatar-scaler .equipped-tomb-raider { left: 34px !important; }
    .preview-card.preview-item img.item-img[alt="Ange"] { position: absolute !important; top: 15% !important; width: 85% !important; left: 8% }
    .preview-card.preview-item .item-img-wrapper.large { width: 250px !important; height: 250px !important; }
    .preview-card.preview-item .jojo-text-preview { left: 45px !important; width: 60% !important; }
    .weekly-section .shop-item.weekly-item.small-card .discord-item-shop .discord-img-shop { top: 15px !important; left: 30px !important; }
    .preview-card.preview-avatar .profile-avatar-scaler .equipped-angel-wings { top: -66px !important; left: -1px !important; }
    .weekly-section .shop-item.weekly-item.small-card .gentleman-item-shop .gentleman-img-shop { top: 20px !important; left: 42px !important; max-width: 50% !important; }
    .weekly-section .shop-item.weekly-item.small-card .gentleman-item-shop .moustache-img-shop { top: 65px !important; left: 50px !important; }
    .preview-card.preview-item .moustache-img-shop { width: 46% !important; max-width: 46% !important; left: 50% !important; top: 47% !important; }
    .preview-card.preview-item .gentleman-img-shop { left: 50% !important; top: 15% !important; width: 60% !important; max-width: 60% !important; }
    .preview-card.preview-avatar .profile-avatar-scaler .equipped-gentleman-overlay { width: 70% !important; top: 32% !important; }
    .weekly-section .shop-item.weekly-item.small-card .advisory-item-shop .advisory-img-shop { top: -5% !important; left: 0% !important; }
    .preview-card.preview-item .spacestars-img-shop { top: 9% !important; left: -20% !important; max-width: 129% !important; }
    .preview-card.preview-item .asteroide-img-shop { top: 128px !important; left: 15px !important; }
    .weekly-section .shop-item.weekly-item.small-card .miaou-item-shop .chat-img-shop { top: 43% !important; }
    .preview-card.preview-item .daftpunk-img-shop { left: 50% !important; top: 25% !important; }
  }

  .color-swatch {
    position: relative;
    border-radius: 10px;
    height: 64px;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    border: 2px solid #e5e7eb;
    display: flex;
    align-items: flex-end;
    justify-content: flex-start;
    overflow: hidden;
  }

  .color-swatch:hover {
    transform: translateY(-1px);
    transition: transform 0.15s ease;
  }

  .color-name {
    background: rgba(255,255,255,0.85);
    padding: 2px 6px;
    margin: 6px;
    border-radius: 6px;
    font-size: 10px;
    color: #111827;
  }

  .checkmark {
    position: absolute;
    top: 6px;
    right: 8px;
    background: #10b981;
    color: white;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    border: 2px solid #fff;
    box-shadow: 0 2px 6px rgba(0,0,0,0.15);
  }

  .color-swatch.locked {
    cursor: not-allowed;
  }

  .lockmark {
    position: absolute;
    top: 5px;
    right: 8px;
    background: #111827;
    color: #fff;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    display: flex;
    font-size: 11px;
    border: 2px solid #fff;
    box-shadow: 0 2px 6px #00000026;
    align-items: center;
    justify-content: center;
  }

  .equip-btn {
    width: 100%;
    padding: 10px;
    background-color: #5bc682;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.3s;
  }

  .equip-btn:hover {
    background-color: #4a9e6a;
  }

  .equip-btn.equipped {
    background-color: #fd1515d4;
  }

.leaderboard-profile-avatar {
  display: flex;
  justify-content: center;
  margin: 10px 0 16px;
}
.leaderboard-profile-avatar .user-avatar-container {
  position: relative;
  width: 110px;
  height: 110px;
}
/* Forcer la forme carrée dans la pop-up du leaderboard */
.leaderboard-profile-avatar .user-avatar {
  border-radius: 12px !important;
}
.leaderboard-profile-avatar .user-avatar .avatar-img {
  border-radius: 12px !important;
}

.public-note-section {
  margin-top: 12px;
}
.public-note-title {
  margin: 0 0 6px 0;
  font-size: 16px;
  text-align: left;
  color: #111;
}
.public-note-box {
  white-space: pre-wrap;
  word-break: break-word;
  overflow-wrap: anywhere;
  background: #fff;
  color: #111;
  border-radius: 10px;
  padding: 10px 12px;
  border: 1px solid #eee;
  box-shadow: 0 1px 0 rgba(0,0,0,0.03) inset;
  font-size: 14px;
  line-height: 1.4;
  max-width: 100%;
  box-sizing: border-box;
}

/* Empêche le dépassement et casse les longues chaînes dans la note publique */
.public-note-box * {
  white-space: pre-wrap;
  word-break: break-word;
  overflow-wrap: anywhere;
  max-width: 100%;
  box-sizing: border-box;
}

/* Limite la hauteur dans la pop-up de profil pour éviter un allongement excessif */
.profile-popup .public-note-box {
  max-height: 140px;
  overflow-y: auto;
}
.public-note-empty {
  color: #666;
  background: #fafafa;
  border: 1px dashed #ddd;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 14px;
}

/* Profile popup avatar (aligné avec Navbar) */
.profile-avatar-wrap { display: flex; justify-content: center; margin: 10px 0 16px; }
.profile-avatar-stage { position: relative; width: 110px; height: 110px; }
.profile-avatar-scaler { position: relative; width: 110px; height: 110px; display: flex; align-items: center; justify-content: center; }

/* Weekly overrides — high specificity to win cascade */
.weekly-section .shop-item.weekly-item.small-card .discord-item-shop .discord-img-shop { position: absolute !important; object-fit: contain !important; top: 15px; left: 39px; }
.weekly-section .shop-item.weekly-item.small-card .angel-item-shop .angel-img-shop { position: absolute !important; max-width: 80% !important; max-height: 100% !important; object-fit: contain !important; transform: scale(1.05) !important; top: 10px !important; left: 25px !important; }
.weekly-section .shop-item.weekly-item.small-card .gentleman-item-shop .gentleman-img-shop { position: absolute !important; max-width: 40%; object-fit: contain !important; top: 25px; left: 60px; }
.weekly-section .shop-item.weekly-item.small-card .gentleman-item-shop .moustache-img-shop { position: absolute !important; max-width: 47% !important; max-height: 55% !important; object-fit: contain !important; top: 65px !important; left: 70px; }
.weekly-section .shop-item.weekly-item.small-card .advisory-item-shop .advisory-img-shop { position: absolute !important; max-width: 100% !important; max-height: 100% !important; object-fit: contain !important; top: -11% !important; left: 8%;}
.weekly-section .shop-item.weekly-item.small-card .espace-item-shop .asteroide-img-shop { position: absolute !important; left: 20px !important; top: 70px;}
.weekly-section .shop-item.weekly-item.small-card .miaou-item-shop .chat-img-shop { position: absolute !important; width: 60% !important; object-fit: contain !important; transform: translate(-50%, -50%) !important; z-index: 2 !important; top: 50% !important; left: 63% !important; }
.weekly-section .shop-item.weekly-item.small-card .miaou-item-shop .pate-img-shop { position: absolute !important; max-width: 100% !important; max-height: 35% !important; object-fit: contain !important; top: 80px !important; left: 24% !important; }
.profile-avatar { position: relative; width: 110px; height: 110px; border-radius: 24px !important; overflow: hidden; border: 5px solid #000; background: #fff; }
.profile-avatar.no-border { border: none !important; background: transparent !important; }
.profile-avatar .avatar-img { width: 100% !important; height: 100% !important; object-fit: cover !important; }
.equipped-item-name { text-align: center; font-size: 14px; color: #333; margin-top: 6px; }

/* Overlays statiques au-dessus du carré avatar dans la pop-up */
.profile-avatar-stage .equipped-discord,
.profile-avatar-stage .equipped-galaxie,
.profile-avatar-stage .equipped-coeur,
.profile-avatar-stage .equipped-alpha,
.profile-avatar-stage .equipped-admin-planify,
.profile-avatar-stage .equipped-discord-overlay,
.profile-avatar-stage .equipped-galaxie-overlay,
.profile-avatar-stage .equipped-coeur-overlay,
.profile-avatar-stage .equipped-alpha-overlay,
.profile-avatar-stage .equipped-admin-planify-overlay { 
  position: absolute !important; 
  top: -2px !important; 
  left: -2px !important; 
  width: 108% !important; 
  height: 108% !important; 
  object-fit: contain !important; 
  pointer-events: none !important; 
  z-index: 6 !important; 
}

/* --- Overrides pop-up Profil (même rendu que Navbar.vue) --- */

/* Taille avatar (popup) */
.profile-popup {
  --profile-avatar-size: 100px;
}

/* Pop-up Profil (onglet leaderboard): avatar forcé à 100x100 */
.profile-popup .profile-avatar-stage,
.profile-popup .profile-avatar-scaler,
.profile-popup .profile-avatar {
  width: var(--profile-avatar-size) !important;
  height: var(--profile-avatar-size) !important;
}

.profile-popup .profile-avatar-stage {
  position: relative;
  box-sizing: border-box;
  border-radius: 24px;
  border: none !important;
}

.profile-popup .profile-avatar-scaler {
  position: static !important;
  transform: none !important;
  transform-origin: initial !important;
}

/* Bordure visuelle 5px (couleur/gradient via getAvatarBorderStyle) et contraintes d'affichage */
.profile-popup .profile-avatar {
  overflow: hidden !important;
  border-radius: 30px !important;
  box-sizing: border-box !important;
  border-width: 5px !important;
  border-style: solid;
  line-height: 0;
  box-shadow: none !important;
}
.profile-popup .profile-avatar.no-border {
  border: none !important;
  background: transparent !important;
}
.profile-popup .profile-avatar .avatar-img {
  width: 100% !important;
  height: 100% !important;
  display: block !important;
  object-fit: cover !important;
  object-position: center !important;
}

/* Scalers pour items dynamiques basés sur 57px */
.profile-popup .profile-content-scaler,
.profile-popup .profile-above-scaler {
  position: absolute;
  top: 0;
  left: 0;
  width: 57px;
  height: 57px;
  transform: scale(calc(var(--profile-avatar-size) / 57));
  transform-origin: top left;
}
.profile-popup .profile-above-scaler { pointer-events: none; }

/* Positions des items statiques (mêmes valeurs que Navbar.vue) */
.profile-popup .equipped-galaxie-overlay { top: -31px !important; left: -33px !important; }
.profile-popup .equipped-coeur-overlay   { top: -12px !important; left: -23px !important; }
/* (d’autres classes existent dans Navbar.vue; ajoute-les ici si tu les utilises) */

.leaderboard-profile-music .profile-music-block {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
}
.vinyle-gif {
  width: 64px;
  height: 64px;
  object-fit: contain;
}
/* Titre musique défilant en noir (leaderboard) */
.marquee {
  position: relative;
  overflow: hidden;
  max-width: 220px;
  white-space: nowrap;
  border-radius: 6px;
  padding: 2px 6px;
  background: rgba(0,0,0,0.2);
  color: #000 !important;
}
.marquee > span {
  display: inline-block;
  padding-left: 100%;
  animation: marquee-left 8s linear infinite;
  color: inherit;
}
@keyframes marquee-left {
  0%   { transform: translateX(0); }
  100% { transform: translateX(-100%); }
}

/* Titre plus lisible dans la pop-up */
.popup-big-title {
  font-size: 18px;
  font-weight: 700;
  color: #000 !important; /* noir, meilleure lisibilité */
}
/* Bouton icône (play/pause) */
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
/* Bouton lecture */
.btn.btn-play {
  background: #0d6efd;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 6px 12px;
  cursor: pointer;
}
.popup-audio-controls {
  margin-top: 8px;
}

/* Make the song title marquee full width in profile music block */
.profile-music-block .marquee {
  width: 100%;
}

/* Assure que les sections de contenu passent devant les overlays de l’avatar */
.profile-popup .profile-info,
.profile-popup .public-note-section {
  position: relative;
  z-index: 20;
}
.profile-popup .leaderboard-profile-music {
  position: relative;
  z-index: 30;
}

/* Dans la pop-up, les overlays d’items ne bloquent pas et restent derrière */
.profile-avatar-stage img[class^="equipped-"],
.profile-avatar-stage .equipped-vinyle-overlay {
  pointer-events: none !important;
  z-index: 1;
}

/* Un peu d’air sous le bloc musique pour éviter tout chevauchement visuel */
.leaderboard-profile-music .profile-music-block {
  margin-bottom: 10px;
}
/* Barre de volume (pop-up profil via leaderboard) – mêmes tailles et comportement que la pop-up profil */
.profile-popup .volume-controls { position: relative; display: flex; flex-direction: column; align-items: center; }
.profile-popup .volume-slider-container { position: absolute; top: 100%; left: 50%; transform: translateX(-50%); width: 32px; height: 0; background: #fff; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); overflow: hidden; transition: height 0.2s ease, padding 0.2s ease; z-index: 50; display: flex; justify-content: center; padding: 0; }
.profile-popup .volume-slider-container.visible { height: 120px; padding: 10px 0; }
.profile-popup .volume-seek-bar-vertical { width: 20px; height: 100%; position: relative; cursor: pointer; display: flex; justify-content: center; touch-action: none; }
.profile-popup .seek-track-vertical { width: 4px; height: 100%; background: #9ca3af; border-radius: 2px; position: absolute; }
.profile-popup .seek-fill-vertical { width: 4px; background: #3ddc84; border-radius: 2px; position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); pointer-events: none; }
.profile-popup .seek-thumb-vertical { width: 16px; height: 16px; background: #ff0000; border-radius: 50%; position: absolute; left: 50%; transform: translate(-50%, 50%); pointer-events: none; box-shadow: 0 1px 3px rgba(0,0,0,0.3); transition: transform 0.1s; }
.profile-popup .volume-seek-bar-vertical:hover .seek-thumb-vertical { transform: translate(-50%, 50%) scale(1.2); }
/* Assure que le slider de volume vertical passe au-dessus de la Note publique */
.profile-popup .volume-seek-bar-vertical {
  position: relative;
  z-index: 31 !important;
}
/* Le container du slider reste hors flux pour ne pas agrandir la pill */
.profile-popup .volume-slider-container { z-index: 50 !important; }

/* Assure que l’avatar (et donc sa bordure) est au-dessus des overlays dans la popup leaderboard */
.profile-popup .profile-avatar {
  position: relative !important;
  z-index: 2 !important;
  border-radius: 24px !important;
}

/* Ange – uniquement dans la pop-up profil du leaderboard */
.profile-popup .equipped-angel-wings {
  position: absolute !important;
  top: -76px !important;
  left: -48px !important;
  width: 197% !important;
  height: 148% !important;
  z-index: 0 !important;             /* Derrière la bordure de l’avatar */
  pointer-events: none !important;
}

/* Tomb Raider – uniquement dans la pop-up profil du leaderboard */
.profile-popup .equipped-tomb-raider {
  position: absolute !important;
  top: -47px !important;
  left: 0px !important;
  width: 102% !important;
  height: 71% !important;
  z-index: 0 !important;              /* Derrière la bordure de l’avatar */
  pointer-events: none !important;
}


.profile-popup .equipped-cat-ears {
  position: absolute !important;
  top: -101px !important;
  left: -47px !important;
  width: 158% !important;
  height: 155% !important;
  z-index: 2 !important;           /* Passe au-dessus de la bordure/avatar */
  pointer-events: none !important; /* Ne capte pas les clics */
}

/* AJOUT: alignements des overlays manquants avec la Navbar */
.profile-popup .equipped-vinyle-overlay {
  position: absolute !important;
  top: -45px !important;
  left: 19px !important;
  width: 82% !important;
  height: 65% !important;
  z-index: 2 !important;
  pointer-events: none !important;
}
.profile-popup .equipped-chat-overlay {
  position: absolute !important;
  top: -35px !important;
  left: 35px !important;
  z-index: 2 !important;
  pointer-events: none !important;
}
/* AJOUT: Clown (profil popup) */
.profile-popup .equipped-clown-overlay {
  position: absolute !important;
  top: -42px !important;
  left: 79px !important;
  width: 65% !important;
  height: 110% !important;
  z-index: 2 !important;
  pointer-events: none !important;
}
.profile-popup .equipped-clown-nose {
  position: absolute !important;
  width: 65% !important;
  height: 65% !important;
  z-index: 2 !important;
  pointer-events: none !important;
}
/* Valeurs par défaut sûres pour Lunettes pixel en pop-up profil */
.profile-popup .equipped-lunettes-pixel-inside {
  position: absolute !important;
  top: -4px !important;
  left: 0 !important;
  width: 100% !important;
  height: 100% !important;
  z-index: 2 !important;
  pointer-events: none !important;
}


/* Profil (leaderboard) — s’assurer que les overlays passent au-dessus, sans capter les clics */
.profile-popup .equipped-stars,
.profile-popup .equipped-roi-overlay,
.profile-popup .equipped-royal-frame,
.profile-popup .equipped-rainbow,
.profile-popup .equipped-gentleman-overlay,
.profile-popup .equipped-flash-overlay,
.profile-popup .equipped-camera-overlay,
.profile-popup .equipped-absolute-cinema-overlay,
.profile-popup .equipped-absolute-cinema-overlay-right,
.profile-popup .equipped-daftpunk-overlay,
.profile-popup .equipped-asteroide-overlay,
.profile-popup .equipped-cash-inside,
.profile-popup .equipped-target-inside,
.profile-popup .equipped-advisory-inside,
.profile-popup .equipped-jojo-inside,
.profile-popup .equipped-jojotext-inside,
.profile-popup .equipped-spacestars-inside,
.profile-popup .equipped-dvd-inside,
.profile-popup .equipped-nokia-inside,
.profile-popup .equipped-clippy-inside,
.profile-popup .equipped-moustache-inside {
  position: absolute;
  z-index: 2 !important;
  pointer-events: none !important;
}

/* Ajustements spécifiques de la Navbar reproduits ici pour la pop-up profil */
.profile-popup .equipped-target-inside { top: -15px; left: -10px; }
.profile-popup .equipped-royal-frame { top: -33px; left: -10px; width: 151%; height: 158%; }
.profile-popup .equipped-gentleman-overlay { top: -30px; left: 5px; width: 110%; height: 55%; }
.profile-popup .equipped-advisory-inside { top: 50px; left: 56px; }
.profile-popup .equipped-absolute-cinema-overlay { top: -10px; left: -30px; width: 30%; height: 100%; }
                  .profile-popup .equipped-absolute-cinema-overlay-right { left: 224px; top: -10%; width: 30%; height: 100%; }
.profile-popup .equipped-nokia-inside { top: 80%; left: 15%; width: 60% !important; }
.profile-popup .equipped-jojo-inside { bottom: -2px; left: 109px; width: 111%; height: 38%; }
.profile-popup .equipped-jojotext-inside { top: -12px; right: 6px; width: 90%; height: 85%; }

/* Ajustements demandés pour la pop-up de profil via leaderboard */
.profile-popup .equipped-advisory-inside { width: 75% !important; height: 63%; }
.profile-popup .equipped-asteroide-overlay { top: 53px; left: 7px; width: 50%; height: 50%; }
.profile-popup .equipped-flash-overlay { left: 7px; width: 85%; height: 100%; }
.profile-popup .equipped-chat-overlay { width: 101%; }
.profile-popup .equipped-dvd-inside { width: 65%; }

/* Lunettes pixel */
.profile-popup .equipped-lunettes-pixel-inside {
  top: 58px !important;
  left: 51px !important;
  width: 95% !important;
}

/* Nokia: Daft Punk + Clippy */
.profile-popup .equipped-daftpunk-overlay { top: -68px; left: 15px; width: 70%; }
.profile-popup .equipped-clippy-inside { top: 27px; left: 51px; width: 43%; }

/* Discord (leaderboard – pop-up profil) */
.profile-popup .equipped-discord-overlay { top: -6px !important; left: -15px !important; width: 120% !important; height: 121% !important; }
.profile-popup .equipped-discord { top: -6px !important; left: -15px !important; width: 120% !important; height: 121% !important; }

/* Galaxie (pop-up profil leaderboard) */
.profile-popup .equipped-galaxie,
.profile-popup .equipped-galaxie-overlay {
  top: -37px !important;
  left: -35px !important;
  width: 171% !important;
  height: 175% !important;
}

/* Coeur (pop-up profil leaderboard) */
.profile-popup .equipped-coeur,
.profile-popup .equipped-coeur-overlay {
  top: -18px !important;
  left: -23px !important;
  width: 144% !important;
  height: 134% !important;
}

/* Alpha (pop-up profil leaderboard) */
.profile-popup .equipped-alpha,
.profile-popup .equipped-alpha-overlay {
  top: -5px !important;
  left: -17px !important;
  width: 133% !important;
  height: 106% !important;
}

/* Leaderboard (hors pop-up) – Coeur */
.leaderboard-container .equipped-coeur,
.leaderboard-container .equipped-coeur-overlay {
  top: -6px !important;
  left: -7px !important;
  width: 129% !important;
  height: 125% !important;
}

/* Pate (leaderboard – pop-up profil) */
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

/* Styles pour les factions */
.factions-leaderboard {
  width: 100%;
  padding: 20px 0;
}
/* Timer mensuel des factions */
.month-timer {
  background: #f5f7ff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}
.month-timer .timer-range {
  color: #6b7280;
  display: block;
  margin-top: 4px;
}
/* Couleurs du texte de compte à rebours selon le thème */
[data-theme="dark"] .month-timer .countdown-text {
  color: #ffffff;
}
[data-theme="light"] .month-timer .countdown-text {
  color: #000000;
}

/* Mobile/tablette: 320px → 1024px */
@media (min-width: 320px) and (max-width: 1024px) {
  .month-timer {
    width: 100%;
    margin-bottom: 0;
  }  


  .month-timer .countdown-text,
  .month-timer .timer-range {
    text-align: center;
  }
}

.factions-columns {
    display: flex;
    gap: 20px;
    width: 100%;
    align-items: flex-start;
    justify-content: center;
}

.faction-col {
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 15px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
}

.faction-title {
  text-align: center;
  color: #000;
  margin: 0 0 15px 0;
  font-size: 1.2rem;
  padding: 10px;
  background: #e9ecef;
  border-radius: 8px;
}

/* <style> – factions */
.faction-total-coins {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 600;
  color: #000000;
  margin: 6px 0 12px;
}
.faction-total-coins .coin-icon {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

/* Liste factions: même layout que le général (colonnes), même gap */
.faction-leaderboard-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
  width: 300px;
  max-height: none;        /* pas de limite de hauteur */
  overflow-y: visible;     /* pas de barre de scroll verticale */
}

/* Harmonisation stricte des dimensions des cartes faction
   (même rendu que Bagnat et que le général) */
.leaderboard-list.faction-leaderboard-list {
  width: 315px;
  max-width: 315px;
  overflow-x: hidden;
  overflow-y: auto !important;
  max-height: 600px !important;
  padding-right: 12px !important;
  scrollbar-gutter: stable both-edges;
}
.leaderboard-list.faction-leaderboard-list .leaderboard-item {
  width: 325px !important;
  height: 120px !important;
  min-height: 120px !important;
}
@media (min-width: 1025px) {
  .leaderboard-list.faction-leaderboard-list {
    width: 360px !important;
    max-width: 360px !important;
    overflow-x: hidden;
    padding-right: 0 !important;
    scrollbar-gutter: stable both-edges;
  }
  .leaderboard-list.faction-leaderboard-list .leaderboard-item {
    width: 100%;
    height: 120px;
    min-height: 120px;
  }
}



/* Espacement entre le bloc utilisateur et la liste de la faction */
.faction-col .leaderboard-item + .faction-leaderboard-list {
  margin-top: 15px;
}

/* Cartes identiques au général */
.faction-leaderboard-list .leaderboard-item {
  display: flex;
  align-items: center;
  gap: 15px;
  background: #fff;
  height: 120px !important;
  min-height: 120px !important;
  padding: 15px;
  border-radius: 12px;
  box-shadow: 0 2px 8px #0000001a;
  transition: transform .2s;
}

/* Contraintes de texte pour éviter tout débordement */
.faction-leaderboard-list .user-details {
  flex: 1;
  min-width: 0; /* permet l’ellipsis de fonctionner dans un flex item */
}
.faction-leaderboard-list .username {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.join-faction-btn {
  width: 100%;
  padding: 10px 15px;
  margin-bottom: 15px;
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.join-faction-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #45a049, #3d8b40);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.join-faction-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.faction-member-badge {
  width: 100%;
  padding: 10px 15px;
  margin-bottom: 15px;
  background: linear-gradient(135deg, #2196F3, #1976D2);
  color: white;
  border-radius: 8px;
  font-size: 0.8rem;
  text-align: center;
}

.faction-leaderboard-list .leaderboard-item {
  padding: 15px;
  background: #fff;
  border-radius: 12px;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 0;
}

@media (max-width: 1024px) {
  .factions-columns {
    flex-direction: column;
        gap: 15px;
        display: flex;
        align-items: center;
        justify-content: center;
  }
  
  .faction-col {
   padding: 12px;
        width: 100% !important;
        max-width: 100% !important;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
  }


  .faction-member-badge {
    width: 95%;
  }

  .faction-leaderboard-list {
    width: 100%;
  }
  
  .faction-title {
    font-size: 1.1rem;
    padding: 8px;
    background: #e9ecef;
    width: 80%;
  }
}
/* Admin Planify (leaderboard – pop-up profil) */
.profile-popup .equipped-admin-planify {
  position: absolute !important;
  top: -12px !important;
  left: -2px !important;
  width: 107% !important;
  height: 121% !important;
  z-index: 2 !important;
}

/* Créateur: badge sous les actions */
.creator-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  color: #d4af37; /* gold */
  font-size: 13px;
}
.creator-badge.clickable {
  cursor: pointer;
  animation: shine 6s ease-in-out infinite; /* plus lent et doux */
}
.creator-badge.static {
  cursor: default;
  animation: none;
}
/* Hover: léger boost seulement au survol */
.creator-badge.clickable:hover { filter: brightness(1.03); }

@keyframes shine {
  0% { text-shadow: 0 0 2px rgba(255, 215, 0, .12); }
  50% { text-shadow: 0 0 6px rgba(255, 215, 0, .28); }
  100% { text-shadow: 0 0 2px rgba(255, 215, 0, .12); }
}

/* Réduction espace quand un nom de créateur est affiché */
.item-price.creator-has-name { margin-bottom: 0 !important; }

/* Libellé "Créé par" */
/* Nom du créateur: glow discret en continu, shimmer uniquement au hover */
.creator-name {
  color: #ffd84a;
  text-shadow: 0 0 2px rgba(255, 216, 74, 0.35), 0 0 4px rgba(255, 216, 74, 0.25);
  animation: none;
  background: linear-gradient(90deg, #ffe17a, #fff3c2, #ffe17a);
  -webkit-background-clip: text;
  background-clip: text;
  cursor: pointer;
}
.creator-badge.clickable:hover .creator-name {
  animation: shimmer 3s linear infinite; /* shimmer visible seulement au survol */
}

/* Empêcher le retour à la ligne des noms lorsqu'affichés sous le label */
.creator-names-line {
  white-space: nowrap;
}

@keyframes shimmer {
  0% { text-shadow: 0 0 2px rgba(255, 216, 74, 0.35); }
  50% { text-shadow: 0 0 6px rgba(255, 216, 74, 0.55); }
  100% { text-shadow: 0 0 2px rgba(255, 216, 74, 0.35); }
}


/* Responsive: en colonne sur téléphone */
@media (max-width: 1024px) {
  .creator-badge {
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }
  .creator-badge .creator-label {
    display: block;
    line-height: 1.1;
  }
  /* Tous les noms sont dans un SEUL wrapper (une ligne unique) */
  .creator-badge .creator-names-line {
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }
  /* Chaque nom reste inline pour se suivre sur la même ligne */
  .creator-badge .creator-name {
    display: inline;
    line-height: 1.1;
  }
}

/* Appliquer aussi dans le leaderboard de faction (nez de clown) */
.faction-leaderboard-list .equipped-clown-nose {
  position: absolute !important;
  top: 54% !important;
  left: 48% !important;
  transform: translate(-50%, -50%) !important;
  width: 87% !important;
  height: 70% !important;
  object-fit: contain !important;
  pointer-events: none !important;
  z-index: 16 !important;
}
/* Factions: Oreilles de chat */
.faction-leaderboard-list .equipped-cat-ears {
  position: absolute;
  top: -67px;
  left: -20px;
  width: 153%;
  height: 155%;
  z-index: 15;
  pointer-events: none;
}

/* Factions: Roi (overlay inclus) */
.faction-leaderboard-list .equipped-roi,
.faction-leaderboard-list .equipped-roi-overlay {
  pointer-events: none !important;
    position: absolute !important;
    top: -70% !important;
    left: 8% !important;
    width: 92% !important;
    height: 92% !important;
    object-fit: contain !important;
    z-index: 15 !important;
}

/* Factions: Étoiles */
.faction-leaderboard-list .equipped-stars,
.faction-leaderboard-list .equipped-stars-overlay {
  pointer-events: none !important;
  position: absolute !important;
  top: -3% !important;
  left: -14% !important;
  width: 130% !important;
  height: 106% !important;
  object-fit: contain !important;
  z-index: 15 !important;
}

/* Cadre royal – Très grand (Factions) */
.faction-leaderboard-list .equipped-royal-frame,
.faction-leaderboard-list .equipped-royal-frame-overlay {
  pointer-events: none !important;
  position: absolute !important;
  top: -28%;
  left: -11%;
  width: 152% !important;
  height: 149% !important;
  object-fit: contain !important;
  pointer-events: none !important;
  z-index: 15 !important;
}
/* Factions – inside (Cash + Target) */
.faction-leaderboard-list .equipped-cash-inside,
.faction-leaderboard-list .equipped-target-inside {
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  width: 100% !important;
  height: 100% !important;
  object-fit: contain !important;
  pointer-events: none !important;
  z-index: 3 !important;
}

/* Factions: placement du nez/cheveux du clown (liste Bagnat) */
.faction-leaderboard-list .user-avatar {
  position: relative;
}
.faction-leaderboard-list .user-avatar .equipped-clown-nose {
  position: absolute;
  width: 22%;
  height: auto;
  top: 48%;
  left: 52%;
  transform: translate(-50%, -50%);
  z-index: 2;
  pointer-events: none;
}
.faction-leaderboard-list .user-avatar-container {
  position: relative;
}
.faction-leaderboard-list .equipped-clown-overlay {
  position: absolute;
  width: 100%;
  top: -8%;
  left: 0;
  z-index: 3;
  pointer-events: none;
}

/* Faction leaderboard — moustache Bagnat */
.faction-leaderboard-list .user-avatar .avatar-img {
  position: relative;
  z-index: 1;
}
.faction-leaderboard-list .equipped-moustache-inside {
  position: absolute;
  top: 10px;
  left: 7px;
  width: 80%;
  height: 75%;
  object-fit: cover;
  pointer-events: none;
  z-index: 3;
}

/* Faction leaderboard — Filtre sépia pour Jojo */
.faction-leaderboard-list .user-avatar.jojo-sepia .avatar-img,
.faction-leaderboard-list .leaderboard-item .user-avatar.jojo-sepia .avatar-img {
  animation: jojo-sepia-cycle 4.7s steps(1, end) infinite !important;
}
/* Forcer l’affichage de la moustache dans les cartes de faction */
.leaderboard-item .equipped-moustache-inside {
  position: absolute;
  top: 10px;
  left: 7px;
  width: 80%;
  height: 75%;
  object-fit: cover;
  pointer-events: none;
  z-index: 3;
}
/* Harmonisation des cartes utilisateur courant vs cartes de liste */
.faction-col > .leaderboard-item {
  display: flex;
  align-items: center;
  gap: 15px;
  background: #fff;
  height: 120px !important;
  min-height: 120px !important;
  padding: 15px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform .2s;
}

/* Override Matrix pour la popup de profil */
.profile-popup .matrix-rain-inside {
  top: 0%;
  left: 0%;
  width: 100%;
  height: 100%;
}

/* Modale de confirmation de changement de faction */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
.confirm-modal {
  background: #ffffff;
  border-radius: 14px;
  width: 560px;
  max-width: 92vw;
  box-shadow: 0 24px 48px rgba(0,0,0,0.2);
  padding: 24px 28px;
  text-align: center;
}
.confirm-modal .modal-title {
  font-weight: 700;
  font-size: 20px;
  margin-bottom: 8px;
}
.confirm-modal .modal-desc {
  color: #4b5563;
  font-size: 14px;
  margin-bottom: 18px;
}
.confirm-modal .modal-actions {
  display: flex;
  justify-content: center;
  gap: 14px;
}
.btn {
  padding: 10px 22px;
  border-radius: 999px;
  font-weight: 600;
  border: none;
  cursor: pointer;
}
.btn-secondary {
  background: #eef2f7;
  color: #111827;
}
.btn-primary {
  background: linear-gradient(180deg, #66ff8b 0%, #1adb4b 100%);
  color: #063b10;
}
.btn[disabled] {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Popup de confirmation de faction — styles copiés de ListeDevoirs.vue */
.popup-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  overscroll-behavior: auto;
  touch-action: auto;
}
.popup-content {
  background: #fff;
  border-radius: 18px;
  padding: 40px 36px;
  min-width: 420px;
  max-width: 700px;
  min-height: 220px;
  max-height: 80vh;
  box-shadow: 0 2px 24px #0003;
}

.btn-cancel-delete {
  background: linear-gradient(90deg, #eaffea 0%, #d6ffd6 100%);
  color: #222;
  border: none;
  border-radius: 18px;
  padding: 12px 32px;
  font-weight: bold;
  font-size: 1.1em;
  cursor: pointer;
  box-shadow: 0 2px 8px #baffba55;
  transition: background 0.18s, color 0.18s, box-shadow 0.18s, transform 0.12s;
  font-family: 'Cobe Heavy', Inter, sans-serif;
  outline: none;
  min-width: 140px;
}
.btn-cancel-delete:hover, .btn-cancel-delete:focus {
  background: linear-gradient(90deg, #d6ffd6 0%, #baffba 100%);
  color: #111;
  box-shadow: 0 4px 16px #baffba88;
  transform: scale(1.08);
}

.btn-confirm-delete {
  background: linear-gradient(90deg, #ff4d4d 0%, #ff6b6b 100%);
  color: #fff;
  border: none;
  border-radius: 18px;
  padding: 12px 32px;
  font-size: 1.1em;
  cursor: pointer;
  box-shadow: 0 2px 8px #ff4d4d55;
  transition: background 0.18s, color 0.18s, box-shadow 0.18s, transform 0.12s;
  font-family: 'Cobe Heavy', Inter, sans-serif;
  outline: none;
  min-width: 140px;
}
.btn-confirm-delete:hover, .btn-confirm-delete:focus {
  background: linear-gradient(90deg, #ff6b6b 0%, #ff4d4d 100%);
  color: #fff;
  box-shadow: 0 4px 16px #ff4d4d88;
  transform: scale(1.08);
}

.popup-delete-confirm {
  background: #fff;
  border-radius: 18px;
  padding: 40px 36px;
  min-width: 420px;
  max-width: 700px;
  min-height: 220px;
  max-height: 80vh;
  box-shadow: 0 2px 24px #0003;
  text-align: left;
  color: #111;
  overflow-y: auto;
  font-family: 'Cobe Heavy', Inter, sans-serif;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: auto;
  animation: popupIn 0.25s cubic-bezier(.25,.8,.25,1);
}
.popup-delete-confirm h3 {
  margin-top: 0;
  font-size: 2.1em;
  font-family: 'Cobe Heavy', Inter, sans-serif;
}
.popup-delete-confirm p {
  margin-bottom: 18px;
}
.popup-delete-confirm button {
  background: linear-gradient(90deg, #39ff7a 0%, #6EFF78 100%);
  color: #fff;
  border: none;
  border-radius: 14px;
  padding: 12px 0;
  font-size: 1.2em;
  font-weight: bold;
  margin-top: 18px;
  cursor: pointer;
  font-family: 'Cobe Heavy', Inter, sans-serif;
  box-shadow: 0 2px 8px #6eff7833;
  transition: background 0.2s, color 0.2s, box-shadow 0.2s;
}
.popup-delete-confirm button:hover {
  background: linear-gradient(90deg, #6EFF78 0%, #39ff7a 100%);
  color: #000;
  box-shadow: 0 4px 16px #39ff7a55;
}

/* Centrage spécifique à la modale de confirmation de faction */
.faction-delete-confirm {
  text-align: center;
}
.faction-delete-actions {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 18px;
}
.faction-delete-actions .btn-cancel-delete,
.faction-delete-actions .btn-confirm-delete {
  min-width: 140px;
}

@media (min-width: 320px) and (max-width: 475px) {
  .popup-delete-confirm h3 {
    margin-top: 0;
    font-size: 1.4em;
  }
  .popup-delete-confirm {
    background: #fff;
    border-radius: 18px;
    padding: 40px 36px;
    min-width: 300px;
    max-width: 6px;
    min-height: 220px;
    max-height: 80vh;
    box-shadow: 0 2px 24px #0003;
  }
}
  /* Barre de progression des couleurs débloquées dans la popup couleur */
  .color-progress-wrapper { padding: 8px 16px 0; }
  .color-progress-track {
    width: 100%;
    height: 8px;
    background: #e5e7eb;
    border-radius: 999px;
    overflow: hidden;
  }
  .color-progress-fill {
    height: 100%;
    width: 0%;
    background: linear-gradient(90deg, #16a34a, #22c55e);
    border-radius: 999px;
    transition: width 0.3s ease;
  }
  .color-progress-text {
    text-align: center;
    padding: 6px 0 8px;
  }
  .color-progress-percent {
    font-size: 15px; /* agrandi */
    color: #111827;
    font-weight: 600;
  }
  .color-progress-count {
    font-size: 15px; /* X / Y sous le % */
    color: #374151;
    margin-top: 2px;
  }

/* Sélecteur mobile/tablette (320px → 1024px) */
.mobile-faction-select {
  display: none; /* caché par défaut */
  padding: 8px 16px 0px;
  justify-content: center;
  align-items: center;
  gap: 10px;
}
.mobile-faction-label {
  font-size: 14px;
  color: #374151;
}
.mobile-faction-select-input {
  width: 160px;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #f8f9fa;
  color: #111827;
  font-weight: 600;
}
/* Affichage 320px → 1024px : caler le sélecteur sur la même largeur que le timer */
@media (min-width: 320px) and (max-width: 1024px) {
  .mobile-faction-select {
    display: flex;
    flex-direction: column;
    position: relative;
    left: 50%;
    transform: translateX(-50%);
    width: calc(100% + 72px);
    box-sizing: border-box;
    text-align: center;
    padding: 8px 0px 16px 0px;
    gap: 6px;
  }
  .mobile-faction-label {
    display: block;
    width: 100%;
    font-size: 14px;
    color: #374151;
  }
  .mobile-faction-select-input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    background: #f8f9fa;
    color: #111827;
    font-weight: 600;
    text-align: center;
  }
}
/* Thème sombre: label en blanc */
[data-theme="dark"] .mobile-faction-label {
  color: #fff;
}
.shop-grid,
.weekly-shop-container,
.leaderboard-container {
  touch-action: auto;
}

@media (max-width: 1024px) {
  .shop-overlay { touch-action: auto; }
  .color-picker-overlay { touch-action: auto; }
}

/* Leaderboard: layout desktop en grille */
.leaderboard-container {
  display: grid !important;
  grid-template-columns: 30% 69% !important;
  gap: 2% !important;
  align-items: start !important;
}
.personal-section { display: flex; flex-direction: column; gap: 20px; order: 1 !important; height: 100%; width: 350px; }
.factions-section { display: flex; flex-direction: column; gap: 20px; order: 2 !important; }
.factions-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

/* Fallback mobile (≤1024px): colonne */
@media (max-width: 1024px) {
  .leaderboard-container {
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 0px !important;
    width: 100% !important;
    max-width: 100% !important;
    padding: 0 !important;
  }
  .leaderboard-container > div {
    width: 100% !important;
    max-width: 100% !important;
    display: flex !important;
    align-items: center !important;
  }

  /* Mobile Filters */
  .mobile-only-filters {
    display: flex !important;
    flex-direction: row !important;
    align-items: center !important;
    gap: 0 !important; /* Joined buttons */
    margin-bottom: 20px !important;
    width: 100% !important;
    justify-content: center !important;
  }
  
  /* Hide Desktop Toggle on Mobile */
  .toggle-header { display: none !important; }

  /* Filter Buttons Styles (Mobile) */
  .filter-btn {
    padding: 10px 0; /* Centered content, fixed width via flex */
    border: none;
    background: #e9ecef;
    border: 1px solid #d1d5db; /* Lighter border for joined look */
    cursor: pointer;
    color: #666;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 93px !important; /* Fixed equal width ~280px total / 3 */
    height: 45px !important;
    box-shadow: none !important; /* Remove individual shadows */
    border-radius: 0; /* Reset radius for middle buttons */
  }

  /* First button: rounded left */
  .filter-btn:first-child {
    border-top-left-radius: 8px;
    border-bottom-left-radius: 8px;
    border-right: none; /* Merge borders */
  }

  /* Last button: rounded right */
  .filter-btn:last-child {
    border-top-right-radius: 8px;
    border-bottom-right-radius: 8px;
    border-left: none; /* Merge borders */
  }

  .filter-btn:hover {
    background: #dee2e6;
    color: #333;
    z-index: 1; /* Bring to front on hover */
  }

  .filter-btn.active {
    background: #5bc682;
    color: white;
    border-color: #5bc682 !important; /* Match active bg */
    transform: none !important; /* No movement to keep alignment */
    box-shadow: none !important;
    z-index: 2; /* Keep active on top */
  }

  .leaderboard-toggle-bar { margin-bottom: 12px !important; }
  .factions-section { order: 1 !important; width: 100% !important; align-items: center !important; }
  .personal-section { order: 2 !important; width: 100% !important; align-items: center !important; }
  .leaderboard-container { overflow-x: hidden !important; }

  .factions-grid {
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    width: 111% !important;
    grid-template-columns: none !important;
    gap: 20px !important;
  }

  .faction-col {
    padding: 5px !important;
    width: 100% !important;
    max-width: 100% !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: center !important;
  }

  /* Centering cards and lists */
  .faction-total-card,
  .faction-total-card.selected {
    width: 270px !important;
    max-width: 270px !important;
    margin: 0 auto !important;
  }

  .leaderboard-list {
    width: 280px !important;
    max-width: 280px !important;
    margin: 0 auto !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
  }
  .faction-leaderboard-list {
    width: 300px !important;
    max-width: 300px !important;
    margin: 0 auto !important;
    display: flex !important;
    padding: 0px 0px 0px 0px;
    flex-direction: column !important;
    align-items: center !important;
  }

  .leaderboard-list .leaderboard-item,
  .faction-leaderboard-list .leaderboard-item {
    width: 270px !important;
    max-width: 270px !important;
    height: 150px !important;
    min-height: 150px !important;
    margin: 0 auto 10px auto !important;
    box-sizing: border-box !important;
    overflow: hidden !important;
  }

  /* Mobile header layout and close button */
  .shop-header { display: grid !important; grid-template-columns: 1fr; grid-template-areas: 'title' 'tabs' 'info'; align-items: center !important; justify-items: center !important; gap: 0px; }
  .header-left, .header-right { display: contents !important; }
  .shop-title { grid-area: title; }
  .shop-tabs { grid-area: tabs; }
  .header-info-row { grid-area: info; }
  .header-close { position: absolute !important; top: 12px !important; right: 16px !important; width: 40px !important; height: 40px !important; padding: 0 !important; }
  .header-close .close-img { width: 32px !important; height: 32px !important; }

  /* Countdown text size on mobile */
  .countdown-text { font-size: 15px !important; }

  .join-faction-btn {
    width: 85% !important;
  }
}

/* Hide mobile filters on Desktop */
@media (min-width: 1025px) {
  .mobile-only-filters { display: none !important; }
}
.profile-left, .profile-right { justify-content: center; }
.profile-popup { --profile-avatar-size: 150px; padding: 90px 32px 50px; }
.profile-popup .profile-avatar-stage { width: 340px !important; height: 200px !important; box-sizing: border-box; border-radius: 12px; border: none !important; display: flex !important; align-items: center; justify-content: center; }
.profile-popup .profile-avatar-scaler { position: static !important; width: auto !important; height: auto !important; transform: none !important; transform-origin: initial !important; }
.profile-popup .profile-avatar { width: 150px !important; height: 150px !important; border-width: 5px !important; border-style: solid; box-sizing: border-box; overflow: hidden !important; border-radius: 12px !important; position: relative !important; z-index: 2 !important; line-height: 0; }
.profile-popup .profile-avatar .avatar-img { width: 100% !important; height: 100% !important; display: block !important; object-fit: cover !important; object-position: center !important; }
@media (max-width: 768px) { .profile-card-grid { grid-template-columns: 1fr; } .profile-divider { display: none; } }
.profile-popup .equipped-roi-overlay { top: -51% !important; left: 15% !important; width: 86% !important; height: 75% !important; }
.profile-popup .equipped-cat-ears { top: -76px !important; left: -59px !important; width: 133% !important; height: 117% !important; }
.profile-popup .equipped-clown-nose { position: absolute !important; width: 41% !important; height: 42% !important; z-index: 2 !important; pointer-events: none !important; }
.profile-popup .equipped-angel-wings { position: absolute !important; top: -90px !important; left: -162px !important; width: 197% !important; height: 90% !important; z-index: 0 !important; pointer-events: none !important; }
.profile-popup .equipped-tomb-raider { position: absolute !important; top: -70px !important; left: 0 !important; width: 102% !important; height: 71% !important; z-index: 0 !important; pointer-events: none !important; }
.profile-popup .equipped-royal-frame, .profile-popup .equipped-royal-frame-overlay { position: absolute !important; top: -5% !important; left: -3% !important; width: 132% !important; height: 110% !important; object-fit: contain !important; pointer-events: none !important; z-index: 15 !important; }
.profile-popup .equipped-rainbow, .profile-popup .equipped-rainbow-overlay { position: absolute !important; top: 8% !important; left: 12% !important; width: 94% !important; height: 83% !important; object-fit: contain !important; pointer-events: none !important; z-index: 15 !important; }
.profile-popup .equipped-gentleman-overlay { top: -115px !important; left: 95px !important; width: 55% !important; height: 55% !important; }
.profile-popup .equipped-vinyle-overlay { position: absolute !important; top: -61px !important; left: 54px !important; width: 85% !important; height: 65% !important; z-index: 2 !important; pointer-events: none !important; }
.profile-popup .equipped-asteroide-overlay { top: 50px !important; left: 100px !important; width: 20% !important; height: 50% !important; }
.profile-popup .equipped-gentleman-overlay { top: -50px !important; left: 95px !important; width: 55% !important; height: 55% !important; }
.profile-popup .equipped-asteroide-overlay { top: 100px !important; left: 100px !important; width: 20% !important; height: 50% !important; }
.leaderboard-container .equipped-absolute-cinema, .leaderboard-container .equipped-absolute-cinema-overlay { position: absolute !important; top: -10% !important; left: -31% !important; width: 100% !important; height: 100% !important; object-fit: contain !important; pointer-events: none !important; z-index: 15 !important; }
.profile-popup .equipped-absolute-cinema-overlay-right { left: 224px !important; top: -10% !important; width: 30% !important; height: 100% !important; }
.leaderboard-container .equipped-camera-overlay { position: absolute !important; top: 40% !important; left: 30% !important; width: 18% !important; height: 70% !important; object-fit: contain !important; pointer-events: none !important; z-index: 3 !important; }
.profile-popup .equipped-pate-overlay { position: absolute !important; top: 60% !important; left: 21% !important; width: 33% !important; height: 25% !important; object-fit: contain !important; pointer-events: none !important; z-index: 15 !important; }
.leaderboard-container .equipped-chat-overlay { position: absolute !important; top: -13% !important; left: 17% !important; width: 108% !important; height: 70% !important; object-fit: contain !important; pointer-events: none !important; z-index: 3 !important; }
.profile-popup .equipped-lunettes-pixel-inside { top: 50% !important; left: 50% !important; height: 75% !important; width: 71% !important; }
.leaderboard-container .equipped-clippy-inside { position: absolute !important; top: 50px !important; left: 83px !important; width: 43% !important; height: 78% !important; object-fit: contain !important; pointer-events: none !important; z-index: 2 !important; }
.leaderboard-container .equipped-daftpunk, .leaderboard-container .equipped-daftpunk-overlay { position: absolute !important; top: -51% !important; left: 27% !important; width: 44% !important; height: 90% !important; object-fit: contain !important; pointer-events: none !important; z-index: 15 !important; }
.profile-popup .equipped-discord-overlay, .profile-popup .equipped-discord { top: 16px !important; left: 4px !important; width: 92% !important; height: 94% !important; }
.leaderboard-container .equipped-jojo-inside { position: absolute !important; bottom: -2px !important; left: 145px !important; width: 90% !important; height: 40% !important; object-fit: contain !important; pointer-events: none !important; z-index: 6 !important; }
.leaderboard-container .equipped-jojotext-inside { position: absolute !important; top: -18px !important; right: 30px !important; width: 65% !important; height: 100% !important; object-fit: contain !important; pointer-events: none !important; z-index: 7 !important; }

/* Fix alignement item-actions boutique quotidienne */
.weekly-shop-container .item-actions {
  align-items: initial;
}
</style>