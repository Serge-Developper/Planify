<template>
  <div v-if="show" class="shop-overlay" @click.self="emitClose">
    <div class="shop-modal" :class="{ 'collection-desktop-override': activeTab === 'main', 'weekly-desktop-override': activeTab === 'weekly', 'leaderboard-desktop-override': activeTab === 'leaderboard' }">
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
          @click="activeTab = 'leaderboard'; showSuggestionEditor = false"
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
          <div class="suggest-toolbar">
            <div class="suggest-top-row">
              <div class="suggest-upload-group">
                <label class="suggest-file-btn">
                  <input type="file" accept="image/webp,image/gif" @change="onSuggestFile" class="suggest-file-input" />
                  <span class="btn-icon">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 3v6h6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </span>
                  <span>Choisir un fichier</span>
                </label>
                <input type="text" v-model="suggestUrl" placeholder="Importer via URL" class="url-input suggest-url-input" />
                <button class="suggest-import-btn" type="button" @click="onSuggestUrl">
                  <span class="btn-icon">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 16.5a4.5 4.5 0 0 0-1-8.9A5.5 5.5 0 0 0 5 9.5a4 4 0 0 0 1 7.9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 12v7m0 0l3-3m-3 3l-3-3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </span>
                  Importer
                </button>
              </div>
              <div class="suggest-right-group">
                <div class="suggest-meta-group">
                  <div class="suggest-style-pill">
                    <span class="btn-icon">
                      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path d="M2 12h20M12 2a16 16 0 0 1 0 20M12 2a16 16 0 0 0 0 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                    </span>
                    <span>Style</span>
                  </div>
                  <label class="price-label suggest-name-pill">
                    <span>Nom:</span>
                    <input type="text" v-model="suggestName" placeholder="Nom de l'item" class="price-input suggest-name-input" />
                  </label>
                  <label class="price-label suggest-price-pill">
                    <span>Prix:</span>
                    <input type="number" v-model.number="suggestPrice" min="150" max="500" step="1" class="price-input suggest-price-input" />
                  </label>
                </div>
                <div class="suggest-actions">
                  <button class="suggest-save-btn" type="button" @click="saveSuggestion">
                    <span class="btn-icon">
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M17 21v-8H7v8M7 3v5h8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </span>
                    Sauvegarder
                  </button>
                  <button class="suggest-close-btn" type="button" @click="closeSuggestEditor">
                    <span class="btn-icon">
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6l-12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </span>
                    Fermer
                  </button>
                </div>
              </div>
            </div>
            <div class="suggest-variants-row">
              <div class="variants-ui">
                <span class="variants-label">Styles:</span>
                <div class="variant-chips-slider">
                  <button v-if="showVariantArrows" class="variant-arrow" type="button" @click="prevVariantWindow" :disabled="!canScrollVariantLeft" aria-label="Styles précédents">‹</button>
                  <div class="variant-slider-viewport" :style="variantViewportStyle">
                    <div class="variant-slider-track" ref="variantTrackRef" :style="variantTrackStyle">
                      <button class="variant-chip" v-for="(v, vi) in suggestVariants" :key="'sv-'+vi" :class="{ active: vi === activeVariantIndex }" @click="selectVariant(vi)">{{ v.name || ('Style ' + (vi + 1)) }}</button>
                    </div>
                  </div>
                  <button class="variant-add-chip" type="button" @click="addVariant" aria-label="Ajouter un style">+</button>
                  <button v-if="showVariantArrows" class="variant-arrow" type="button" @click="nextVariantWindow" :disabled="!canScrollVariantRight" aria-label="Styles suivants">›</button>
                </div>
                <div class="rename-group" v-if="suggestVariants && suggestVariants.length">
                  <label>Nom: <input type="text" v-model="suggestVariants[activeVariantIndex].name" placeholder="Nom du style" class="variant-name-input" /></label>
                </div>
                <div class="variant-actions">
                  <button class="suggest-add-btn" type="button" @click="addVariant">
                    <span class="btn-icon">
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </span>
                    Ajouter
                  </button>
                  <button class="suggest-dup-btn" type="button" @click="duplicateVariant">
                    <span class="btn-icon">
                      <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" fill="none" stroke="currentColor" stroke-width="2"/><rect x="2" y="2" width="13" height="13" rx="2" ry="2" fill="none" stroke="currentColor" stroke-width="2"/></svg>
                    </span>
                    Dupliquer
                  </button>
                  <button class="suggest-remove-btn" type="button" @click="removeVariant" :disabled="suggestVariants.length <= 1">
                    <span class="btn-icon">
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </span>
                    Supprimer
                  </button>
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
                  <img v-for="(src, si) in suggestAssetSrcs" :key="'dailyShop-'+si" :src="src" :class="['item-img','draggable', draggingKey==='dailyShop' ? 'drag-active' : '']" :style="getSuggestStyle('dailyShop', si)" @click="startDrag('dailyShop', si, $event)" @touchstart.prevent.stop="startDragTouch('dailyShop', si, $event)" />
                </div>
              </div>
              <div class="item-actions" style="display:flex;gap:8px;justify-content:center;margin-top:12px;">
                <label>Taille: <input type="range" min="10" max="120" v-model.number="suggestStyles.dailyShop.width" /></label>
                <label class="suggest-stepper">Bas/Haut: <div class="stepper-input"><button type="button" class="stepper-btn" @click="bumpNumber(suggestStyles.dailyShop, 'top', -1)">▲</button><input type="number" v-model.number="suggestStyles.dailyShop.top" /><button type="button" class="stepper-btn" @click="bumpNumber(suggestStyles.dailyShop, 'top', 1)">▼</button></div></label>
                <label class="suggest-stepper">Droite/Gauche: <div class="stepper-input"><button type="button" class="stepper-btn" @click="bumpNumber(suggestStyles.dailyShop, 'left', -1)">▲</button><input type="number" v-model.number="suggestStyles.dailyShop.left" /><button type="button" class="stepper-btn" @click="bumpNumber(suggestStyles.dailyShop, 'left', 1)">▼</button></div></label>
                <button class="close-btn-small center-btn" @click="centerSuggest('dailyShop')" @mouseover="hoverCenterDaily = true" @mouseleave="hoverCenterDaily = false"><img :src="hoverCenterDaily ? centerHoverImg : centerImg" alt="Centrer" class="close-img" /></button>
              </div>
            </div>
            <div class="preview-card preview-collection" :key="'slide-collection'">
              <div class="preview-title">Aperçu Collection</div>
              <div class="item-img-wrapper large" :class="{ 'mobile-mode': suggestDevice === 'mobile' }">
                <div class="item-img-container">
                  <img v-for="(src, si) in suggestAssetSrcs" :key="'collectionPreview-'+si" :src="src" :class="['item-img','draggable', draggingKey==='collectionPreview' ? 'drag-active' : '']" :style="getSuggestStyle('collectionPreview', si)" @click="startDrag('collectionPreview', si, $event)" @touchstart.prevent.stop="startDragTouch('collectionPreview', si, $event)" />
                </div>
              </div>
              <div class="preview-actions" style="display:flex;gap:8px;justify-content:center;">
                <button class="tab-btn" :class="{ active: suggestDevice==='desktop' }" @click="suggestDevice='desktop'">PC</button>
                <button class="tab-btn" :class="{ active: suggestDevice==='mobile' }" @click="suggestDevice='mobile'">Mobile</button>
              </div>
              <div class="item-actions" style="display:flex;gap:8px;justify-content:center;margin-top:12px;">
                <label>Taille: <input type="range" min="10" max="120" v-model.number="suggestStyles.collectionPreview.width" /></label>
                <label class="suggest-stepper">Haut/Bas: <div class="stepper-input"><button type="button" class="stepper-btn" @click="bumpNumber(suggestStyles.collectionPreview, 'top', -1)">▲</button><input type="number" v-model.number="suggestStyles.collectionPreview.top" /><button type="button" class="stepper-btn" @click="bumpNumber(suggestStyles.collectionPreview, 'top', 1)">▼</button></div></label>
                <label class="suggest-stepper">Gauche/Droite: <div class="stepper-input"><button type="button" class="stepper-btn" @click="bumpNumber(suggestStyles.collectionPreview, 'left', -1)">▲</button><input type="number" v-model.number="suggestStyles.collectionPreview.left" /><button type="button" class="stepper-btn" @click="bumpNumber(suggestStyles.collectionPreview, 'left', 1)">▼</button></div></label>
                <button class="close-btn-small center-btn" @click="centerSuggest('collectionPreview')" @mouseover="hoverCenterCollectionPreview = true" @mouseleave="hoverCenterCollectionPreview = false"><img :src="hoverCenterCollectionPreview ? centerHoverImg : centerImg" alt="Centrer" class="close-img" /></button>
              </div>
            </div>
            <div class="preview-card preview-item" :class="{ 'cosmetic-mobile-card': suggestCosmeticDevice === 'mobile' }" :key="'slide-cosmetic'">
              <div class="preview-title">Aperçu Cosmétique</div>
              <div class="item-img-wrapper large" :class="{ 'mobile-mode': suggestCosmeticDevice === 'mobile' }">
                <div class="item-img-container">
                  <img v-for="(src, si) in suggestAssetSrcs" :key="'collection-'+si" :src="src" :class="['item-img','draggable', draggingKey==='collection' ? 'drag-active' : '']" :style="getSuggestStyle('collection', si)" @click="startDrag('collection', si, $event)" @touchstart.prevent.stop="startDragTouch('collection', si, $event)" />
                </div>
              </div>
              <div class="preview-actions" style="display:flex;gap:8px;justify-content:center;">
                <button class="tab-btn" :class="{ active: suggestCosmeticDevice==='desktop' }" @click="suggestCosmeticDevice='desktop'">PC</button>
                <button class="tab-btn" :class="{ active: suggestCosmeticDevice==='mobile' }" @click="suggestCosmeticDevice='mobile'">Mobile</button>
              </div>
              <div class="item-actions" style="display:flex;gap:8px;justify-content:center;margin-top:12px;">
                <label>Taille: <input type="range" min="10" max="120" v-model.number="suggestCosmeticStyle.width" /></label>
                <label class="suggest-stepper">Haut/Bas: <div class="stepper-input"><button type="button" class="stepper-btn" @click="bumpNumber(suggestCosmeticStyle, 'top', -1)">▲</button><input type="number" v-model.number="suggestCosmeticStyle.top" /><button type="button" class="stepper-btn" @click="bumpNumber(suggestCosmeticStyle, 'top', 1)">▼</button></div></label>
                <label class="suggest-stepper">Gauche/Droite: <div class="stepper-input"><button type="button" class="stepper-btn" @click="bumpNumber(suggestCosmeticStyle, 'left', -1)">▲</button><input type="number" v-model.number="suggestCosmeticStyle.left" /><button type="button" class="stepper-btn" @click="bumpNumber(suggestCosmeticStyle, 'left', 1)">▼</button></div></label>
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
                        <img class="avatar-img" :src="(u && u.isYou) ? getUserAvatar(authStore.user) : FALLBACK_AVATAR_DATA_URL" :alt="(u && u.isYou) ? (authStore.user?.username || 'Vous') : 'Avatar'" :style="(u && u.isYou) ? getAvatarImageStyle(authStore.user) : null" />
                        <img v-for="asset in getSuggestAssetsForPlacement('leaderboard','inside', u.isYou)" :key="'leaderboard-in-'+asset.si" :src="asset.src" :class="['draggable', draggingKey==='leaderboard' ? 'drag-active' : '']" :style="getSuggestStyle('leaderboard', asset.si)" @click="startDrag('leaderboard', asset.si, $event)" @touchstart.prevent.stop="startDragTouch('leaderboard', asset.si, $event)" />
                      </div>
                    </div>
                    <img v-for="asset in getSuggestAssetsForPlacement('leaderboard','above', u.isYou)" :key="'leaderboard-above-'+asset.si" :src="asset.src" :class="['draggable','overlay-above-leader', draggingKey==='leaderboard' ? 'drag-active' : '']" :style="getSuggestStyle('leaderboard', asset.si)" @click="startDrag('leaderboard', asset.si, $event)" @touchstart.prevent.stop="startDragTouch('leaderboard', asset.si, $event)" />
                  </div>
                  <div class="user-details"><div class="username">{{ u.name }}</div></div>
                </div>
              </div>
              <div class="item-actions" style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:12px;">
                <label>Taille: <input type="range" min="10" max="120" v-model.number="suggestStyles.leaderboard.width" /></label>
                <label class="suggest-stepper">Haut/Bas: <div class="stepper-input"><button type="button" class="stepper-btn" @click="bumpNumber(suggestStyles.leaderboard, 'top', -1)">▲</button><input type="number" v-model.number="suggestStyles.leaderboard.top" /><button type="button" class="stepper-btn" @click="bumpNumber(suggestStyles.leaderboard, 'top', 1)">▼</button></div></label>
                <label class="suggest-stepper">Gauche/Droite: <div class="stepper-input"><button type="button" class="stepper-btn" @click="bumpNumber(suggestStyles.leaderboard, 'left', -1)">▲</button><input type="number" v-model.number="suggestStyles.leaderboard.left" /><button type="button" class="stepper-btn" @click="bumpNumber(suggestStyles.leaderboard, 'left', 1)">▼</button></div></label>
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
            <div class="preview-card preview-avatar" :class="{ 'avatar-mobile-card': suggestAvatarDevice === 'mobile' }" :key="'slide-avatar'">
              <div class="preview-title">Aperçu Large/Avatar</div>
              <div class="profile-avatar-wrap" :class="{ 'profile-popup': suggestAvatarDevice === 'mobile' }">
                <div class="profile-avatar-stage" :style="suggestAvatarStageInlineStyle">
                  <div class="profile-avatar-scaler" :style="suggestAvatarScalerInlineStyle">
                    <div class="profile-avatar" :class="{ 'no-border': removeAvatarBorder }" style="position:relative;">
                      <div class="avatar-img" :style="suggestAvatarImgInlineStyle">
                        <img class="avatar-img" :src="getUserAvatar(authStore.user)" :alt="authStore.user?.username || 'avatar'" :style="getAvatarImageStyle(authStore.user)" />
                        <img v-for="asset in getSuggestAssetsForPlacement('avatar','inside', true)" :key="'avatar-in-'+asset.si" :src="asset.src" :class="['draggable', draggingKey==='avatar' ? 'drag-active' : '']" :style="getSuggestStyle('avatar', asset.si)" @click="startDrag('avatar', asset.si, $event)" @touchstart.prevent.stop="startDragTouch('avatar', asset.si, $event)" />
                      </div>
                    </div>
                    <img v-for="asset in getSuggestAssetsForPlacement('avatar','above', true)" :key="'avatar-above-'+asset.si" :src="asset.src" :class="['draggable','overlay-above', draggingKey==='avatar' ? 'drag-active' : '']" :style="getSuggestStyle('avatar', asset.si)" @click="startDrag('avatar', asset.si, $event)" @touchstart.prevent.stop="startDragTouch('avatar', asset.si, $event)" />
                  </div>
                </div>
              </div>
              <div class="preview-actions" style="display:flex;gap:8px;justify-content:center;margin-top:8px;">
                <button class="tab-btn" :class="{ active: suggestAvatarDevice === 'desktop' }" @click="suggestAvatarDevice='desktop'">PC</button>
                <button class="tab-btn" :class="{ active: suggestAvatarDevice === 'mobile' }" @click="suggestAvatarDevice='mobile'">Mobile</button>
              </div>
              <div class="item-actions" style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:12px;">
                <label>Taille: <input type="range" min="10" max="300" step="1" v-model.number="suggestAvatarStyle.width" /></label>
                <label>Hauteur: <input type="range" min="250" max="400" step="1" v-model.number="suggestAvatarStageHeight" /></label>
                <label class="suggest-stepper">Haut/Bas: <div class="stepper-input"><button type="button" class="stepper-btn" @click="bumpNumber(suggestAvatarStyle, 'top', -1)">▲</button><input type="number" v-model.number="suggestAvatarStyle.top" /><button type="button" class="stepper-btn" @click="bumpNumber(suggestAvatarStyle, 'top', 1)">▼</button></div></label>
                <label class="suggest-stepper">Gauche/Droite: <div class="stepper-input"><button type="button" class="stepper-btn" @click="bumpNumber(suggestAvatarStyle, 'left', -1)">▲</button><input type="number" v-model.number="suggestAvatarStyle.left" /><button type="button" class="stepper-btn" @click="bumpNumber(suggestAvatarStyle, 'left', 1)">▼</button></div></label>
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
                <div class="navbar-stage" :style="getNavbarStageStyle()" style="position:relative;width:57px;height:57px;display:flex;align-items:center;justify-content:center;">
                  <img class="avatar-img" :src="getUserAvatar(authStore.user)" :alt="authStore.user?.username || 'avatar'" :style="getAvatarImageStyle(authStore.user)" />
                  <img v-for="asset in getSuggestAssetsForPlacement('navbar','inside', true)" :key="'navbar-in-'+asset.si" :src="asset.src" :class="['item-img','draggable', (draggingKey==='navbar' && activeSuggestAssetIndex===asset.si) ? 'drag-active' : '']" :style="getSuggestStyle('navbar', asset.si)" @click="startDrag('navbar', asset.si, $event)" @touchstart.prevent.stop="startDragTouch('navbar', asset.si, $event)" />
                </div>
                <img v-for="asset in getSuggestAssetsForPlacement('navbar','above', true)" :key="'navbar-above-'+asset.si" :src="asset.src" :class="['item-img','draggable', (draggingKey==='navbar' && activeSuggestAssetIndex===asset.si) ? 'drag-active' : '']" :style="getSuggestStyle('navbar', asset.si)" @click="startDrag('navbar', asset.si, $event)" @touchstart.prevent.stop="startDragTouch('navbar', asset.si, $event)" />
              </div>
              <div class="item-actions" style="display:flex;gap:8px;justify-content:center;margin-top:12px;">
                <label>Taille: <input type="range" min="10" max="120" v-model.number="suggestStyles.navbar.width" /></label>
                <label class="suggest-stepper">Haut/Bas: <div class="stepper-input"><button type="button" class="stepper-btn" @click="bumpNumber(suggestStyles.navbar, 'top', -1)">▲</button><input type="number" v-model.number="suggestStyles.navbar.top" /><button type="button" class="stepper-btn" @click="bumpNumber(suggestStyles.navbar, 'top', 1)">▼</button></div></label>
                <label class="suggest-stepper">Gauche/Droite: <div class="stepper-input"><button type="button" class="stepper-btn" @click="bumpNumber(suggestStyles.navbar, 'left', -1)">▲</button><input type="number" v-model.number="suggestStyles.navbar.left" /><button type="button" class="stepper-btn" @click="bumpNumber(suggestStyles.navbar, 'left', 1)">▼</button></div></label>
                <div class="actions-row">
                  <button class="close-btn-small placement-btn" :class="{ active: suggestPlacement.navbar === 'above' }" @click="togglePlacement('navbar')" @mouseover="hoverPlacementNavbar = true" @mouseleave="hoverPlacementNavbar = false" :aria-label="suggestPlacement.navbar === 'inside' ? 'À l’intérieur' : 'Par-dessus'" :title="suggestPlacement.navbar === 'inside' ? 'À l’intérieur' : 'Par-dessus'">
                    <img :src="getPlacementImg('navbar', hoverPlacementNavbar)" alt="Placement" class="close-img" />
                  </button>
                  <button class="close-btn-small border-toggle-btn" :class="{ active: removeNavbarBorder }" @click="toggleBorder('navbar')" @mouseover="hoverToggleNavbar = true" @mouseleave="hoverToggleNavbar = false">
                    <img :src="(hoverToggleNavbar || removeNavbarBorder) ? borderHoverIcon : borderIcon" alt="Bordure" class="close-img" />
                  </button>
                  <button class="close-btn-small center-btn" @click="centerSuggest('navbar')" @mouseover="hoverCenterNavbar = true" @mouseleave="hoverCenterNavbar = false"><img :src="hoverCenterNavbar ? centerHoverImg : centerImg" alt="Centrer" class="close-img" /></button>
                </div>
              </div>
            </div>

            <div v-if="suggestPreviewSlides.includes('popup-style')" class="preview-card preview-popup-style" :key="'slide-popup-style'">
              <div class="preview-title">Aperçu Pop-up Style</div>

              <div class="item-img-wrapper large" :style="getPopupWrapperStyle()">
                <div class="item-img-container">
                  <img v-for="(src, si) in suggestAssetSrcs" :key="'popupStyle-'+si" :src="src" :class="['item-img','draggable', draggingKey==='popupStyle' ? 'drag-active' : '']" :style="[getSuggestStyle('popupStyle', si), getSuggestStackStyle(si)]" @click="startDrag('popupStyle', si, $event)" @touchstart.prevent.stop="startDragTouch('popupStyle', si, $event)" />
                </div>
              </div>
              <div class="item-actions" style="display:flex;gap:8px;justify-content:center;margin-top:12px;">
                <label>Taille: <input type="range" min="10" max="300" step="0.5" v-model.number="suggestStyles.popupStyle.width" /></label>
                <label class="suggest-stepper">Haut/Bas: <div class="stepper-input"><button type="button" class="stepper-btn" @click="bumpNumber(suggestStyles.popupStyle, 'top', -1)">▲</button><input type="number" v-model.number="suggestStyles.popupStyle.top" /><button type="button" class="stepper-btn" @click="bumpNumber(suggestStyles.popupStyle, 'top', 1)">▼</button></div></label>
                <label class="suggest-stepper">Gauche/Droite: <div class="stepper-input"><button type="button" class="stepper-btn" @click="bumpNumber(suggestStyles.popupStyle, 'left', -1)">▲</button><input type="number" v-model.number="suggestStyles.popupStyle.left" /><button type="button" class="stepper-btn" @click="bumpNumber(suggestStyles.popupStyle, 'left', 1)">▼</button></div></label>
                <button class="close-btn-small center-btn" @click="centerSuggest('popupStyle')" @mouseover="hoverCenterPopup = true" @mouseleave="hoverCenterPopup = false"><img :src="hoverCenterPopup ? centerHoverImg : centerImg" alt="Centrer" class="close-img" /></button>
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>
      <div v-if="activeTab === 'main' && !showSuggestionEditor" class="shop-grid collection-grid" :class="{ 'my-items-grid': showMyItemsPanel }">
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
                 <!-- Galaxie: mêmes positions que Discord mais classe dédiée -->
                <img
                  v-if="item.name === 'Galaxie' && getUserEquippedItemData(authStore.user) && getUserEquippedItemData(authStore.user).name === 'Galaxie'"
                  :src="galaxie"
                  alt="Galaxie"
                  class="equipped-galaxie"
                />
                <img
                  v-if="item.name === 'Coeur' && getUserEquippedItemData(authStore.user) && (getUserEquippedItemData(authStore.user).name === 'Coeur' || getUserEquippedItemData(authStore.user).displayType === 'coeur')"
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
              v-if="showMyItemsPanel && canEditItem(item) && isAdminOnly"
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
        <div v-if="showPurchasePreview" class="weekly-preview" :style="{ height: forceWeeklyHeight ? (forceWeeklyHeight + 'px') : undefined, width: '1235.45px', }">
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
                  <div v-else-if="purchasePreviewItem && purchasePreviewItem.name === 'Clown'" class="clown-item-shop">
                    <img :src="clowncheveux" alt="Cheveux de clown" class="clown-hair-shop" />
                    <img :src="clownnose" alt="Nez de clown" class="clown-nose-shop" />
                  </div>
                  <div v-else-if="purchasePreviewItem && purchasePreviewItem.name === 'Vinyle'" class="vinyle-item-shop">
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
                  <option v-for="opt in adminAllOptions" :key="'opt-'+opt._optionId" :value="opt._optionId">{{ opt.name }}</option>
                </select>
                <button type="button" class="admin-reset-btn" @click.stop="onAdminReset(idx)" style="background:#5bc682;color:#fff;border:3px solid #000;border-radius:12px;padding:6px 10px;font-weight:800;">Reset</button>
              </div>
              <button v-if="!coinsStore.hasItem(item.id)" class="buy-btn price-hover" @click="openPurchasePreview(item)"><span class="btn-label">{{ item.name }}</span><span class="btn-price"><img src="@/assets/img/planicoins.webp" alt="Coin" class="coin-icon coin-small" /> {{ getItemPrice(item) }}</span></button>
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
                <button v-if="!coinsStore.hasItem(item.id)" class="buy-btn price-hover" @click="openPurchasePreview(item)"><span class="btn-label">{{ item.name }}</span><span class="btn-price"><img src="@/assets/img/planicoins.webp" alt="Coin" class="coin-icon coin-small" /> {{ getItemPrice(item) }}</span></button>
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
              <div class="faction-total-card" :class="{ winner: (factionTotalCoins.bagnat || 0) >= (factionTotalCoins.fermier || 0), selected: userFaction === 'Bagnat', unselected: !!userFaction && userFaction !== 'Bagnat', 'no-faction': !userFaction }">
                <h3>Team Bagnat</h3>
                <div class="total-score-display">
                  {{ formatCoins(factionTotalCoins.bagnat) }} <img src="@/assets/logo_bagnat.webp" alt="Bagnat" class="coin-icon" style="width:45px !important; height:32px !important;" />
                </div>
              </div>
              <transition :name="justJoinedFaction === 'Bagnat' ? 'faction-join' : 'faction-join-static'" mode="out-in">
                <button
                  v-if="userFaction !== 'Bagnat'"
                  @click="joinFaction('Bagnat')"
                  :disabled="joiningFaction"
                  class="join-faction-btn"
                  key="join-bagnat"
                >
                  {{ joiningFaction ? 'Rejoindre...' : 'Rejoindre Bagnat' }}
                </button>
                <div v-else class="faction-member-badge" :class="{ 'just-joined': justJoinedFaction === 'Bagnat' }" :key="justJoinedFaction === 'Bagnat' ? 'member-bagnat-anim' : 'member-bagnat-static'">
                  ✅ Vous êtes membre de cette faction
                </div>
              </transition>
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
                  <img v-for="(a, ai) in getLeaderboardAssetsForTargetPlacement(currentUserFactionEntry, getUserEquippedItemData(currentUserFactionEntry), 'user-avatar-container', 'above')" :key="'dyn-container-above-faction-bagnat-user-'+ai+'-'+dynamicVariantsState" :src="resolveAssetSrc(a.src)" :style="getDynLeaderboardContainerOverlayStyle(a)" class="dynamic-container-overlay" />
                  <div class="user-avatar-container" data-darkreader-ignore @click="openLeaderboardProfile(currentUserFactionEntry)">
                    <!-- Absolute Cinema: bras droit dans le user-avatar-container (Faction Bagnat - utilisateur courant) -->
                    <img
                      v-if="getUserEquippedItemData(currentUserFactionEntry) && getUserEquippedItemData(currentUserFactionEntry).displayType === 'absolute-cinema'"
                      :src="bras"
                      :alt="getUserEquippedItemData(currentUserFactionEntry).name"
                      class="equipped-absolute-cinema-overlay-right"
                    />

                    <template v-if="getUserEquippedItemData(currentUserFactionEntry) && getUserEquippedItemData(currentUserFactionEntry).isDynamic">
                      <img
                        v-for="(a, ai) in getLeaderboardAssetsForTargetPlacement(currentUserFactionEntry, getUserEquippedItemData(currentUserFactionEntry), 'user-avatar-container', 'below')"
                        :key="'dyn-container-below-faction-bagnat-user-' + ai + '-' + dynamicVariantsState"
                        :src="resolveAssetSrc(a.src)"
                        :style="getDynLeaderboardAssetStyle(a)"
                        :class="getDynLeaderboardAssetClass(a)"
                      />
                      <img
                        v-for="(a, ai) in getLeaderboardAssetsForTargetPlacement(currentUserFactionEntry, getUserEquippedItemData(currentUserFactionEntry), 'user-avatar-container', 'inside')"
                        :key="'dyn-container-inside-faction-bagnat-user-' + ai + '-' + dynamicVariantsState"
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
                      v-if="getUserEquippedItemData(currentUserFactionEntry) && getUserEquippedItemData(currentUserFactionEntry).displayType === 'discord'"
                      :src="[discordon, discordnepasderange, discordderange][coinsStore.discordVariantIndex || 0]"
                      alt="Discord"
                      class="equipped-discord"
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
                      <template v-if="getUserEquippedItemData(currentUserFactionEntry)">
                        <img v-for="(a, ai) in getLeaderboardAssetsForTargetPlacement(currentUserFactionEntry, getUserEquippedItemData(currentUserFactionEntry), 'user-avatar', 'below')" :key="'dyn-lb-below-faction-bagnat-user-'+ai+'-'+dynamicVariantsState" :src="resolveAssetSrc(a.src)" :style="getDynLeaderboardAssetStyle(a)" />
                        <img v-for="(a, ai) in getLeaderboardAssetsForTargetPlacement(currentUserFactionEntry, getUserEquippedItemData(currentUserFactionEntry), 'user-avatar', 'inside')" :key="'dyn-lb-inside-faction-bagnat-user-'+ai+'-'+dynamicVariantsState" :src="resolveAssetSrc(a.src)" :style="getDynLeaderboardAssetStyle(a)" :class="getDynLeaderboardAssetClass(a)" />
                        <img v-for="(a, ai) in getLeaderboardAssetsForTargetPlacement(currentUserFactionEntry, getUserEquippedItemData(currentUserFactionEntry), 'user-avatar', 'above')" :key="'dyn-lb-above-faction-bagnat-user-'+ai+'-'+dynamicVariantsState" :src="resolveAssetSrc(a.src)" :style="getDynLeaderboardAssetStyle(a)" :class="getDynLeaderboardAssetClass(a)" />
                      </template>
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
                    <img v-for="(a, ai) in getLeaderboardAssetsForTargetPlacement(user, getUserEquippedItemData(user), 'user-avatar-container', 'above')" :key="'dyn-container-above-faction-bagnat-'+ai+'-'+dynamicVariantsState" :src="resolveAssetSrc(a.src)" :style="getDynLeaderboardContainerOverlayStyle(a)" class="dynamic-container-overlay" />
                    <div class="user-avatar-container" data-darkreader-ignore @click="openLeaderboardProfile(user)">
                      <!-- Absolute Cinema: bras droit dans le user-avatar-container (Faction Bagnat - liste) -->
                      <img
                        v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).displayType === 'absolute-cinema'"
                        :src="bras"
                        :alt="getUserEquippedItemData(user).name"
                        class="equipped-absolute-cinema-overlay-right"
                      />

                      <template v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).isDynamic">
                        <img
                          v-for="(a, ai) in getLeaderboardAssetsForTargetPlacement(user, getUserEquippedItemData(user), 'user-avatar-container', 'below')"
                          :key="'dyn-container-below-faction-bagnat-' + ai + '-' + dynamicVariantsState"
                          :src="resolveAssetSrc(a.src)"
                          :style="getDynLeaderboardAssetStyle(a)"
                          :class="getDynLeaderboardAssetClass(a)"
                        />
                        <img
                          v-for="(a, ai) in getLeaderboardAssetsForTargetPlacement(user, getUserEquippedItemData(user), 'user-avatar-container', 'inside')"
                          :key="'dyn-container-inside-faction-bagnat-' + ai + '-' + dynamicVariantsState"
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
                      <div class="user-avatar" :style="getAvatarBorderStyle(user)" :class="{ 'jojo-sepia': getUserEquippedItemData(user) && getUserEquippedItemData(user).displayType === 'jojo', 'no-border': getUserEquippedItemData(user) && (((getUserEquippedItemData(user).displayType === 'discord' || getUserEquippedItemData(user).displayType === 'matrix') && !showBorderForDynEquippedItem(getUserEquippedItemData(user))) || getUserEquippedItemData(user).name === 'Galaxie' || shouldRemoveLeaderboardBorder(getUserEquippedItemData(user))) }">
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
                        <template v-if="getUserEquippedItemData(user)">
                          <img v-for="(a, ai) in getLeaderboardAssetsForTargetPlacement(user, getUserEquippedItemData(user), 'user-avatar', 'below')" :key="'dyn-lb-below-faction-bagnat-'+ai+'-'+dynamicVariantsState" :src="resolveAssetSrc(a.src)" :style="getDynLeaderboardAssetStyle(a)" />
                          <img v-for="(a, ai) in getLeaderboardAssetsForTargetPlacement(user, getUserEquippedItemData(user), 'user-avatar', 'inside')" :key="'dyn-lb-inside-faction-bagnat-'+ai+'-'+dynamicVariantsState" :src="resolveAssetSrc(a.src)" :style="getDynLeaderboardAssetStyle(a)" :class="getDynLeaderboardAssetClass(a)" />
                          <img v-for="(a, ai) in getLeaderboardAssetsForTargetPlacement(user, getUserEquippedItemData(user), 'user-avatar', 'above')" :key="'dyn-lb-above-faction-bagnat-'+ai+'-'+dynamicVariantsState" :src="resolveAssetSrc(a.src)" :style="getDynLeaderboardAssetStyle(a)" :class="getDynLeaderboardAssetClass(a)" />
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
                      <!-- Espace: étoiles à l'intérieur (Factions Bagnat) -->
                      <img
                        v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).displayType === 'espace'"
                        :src="spacestars"
                        :alt="getUserEquippedItemData(user).name"
                        class="equipped-spacestars-inside"
                      />
                      <!-- Espace: astéroïde à l'intérieur (Factions Bagnat) -->
                      <img
                        v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).displayType === 'espace'"
                        :src="asteroide"
                        :alt="getUserEquippedItemData(user).name"
                        class="equipped-asteroide-overlay"
                      />
                      <!-- Lunettes pixel: à l'intérieur (Factions Bagnat) -->
                      <img
                        v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).displayType === 'lunettes-pixel'"
                        :src="mlglunette"
                        :alt="getUserEquippedItemData(user).name"
                        class="equipped-lunettes-pixel-inside"
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
              <div class="faction-total-card" :class="{ winner: (factionTotalCoins.fermier || 0) > (factionTotalCoins.bagnat || 0), selected: userFaction === 'Fermier', unselected: !!userFaction && userFaction !== 'Fermier', 'no-faction': !userFaction }">
                <h3>Team Fermier</h3>
                <div class="total-score-display">
                  {{ formatCoins(factionTotalCoins.fermier) }} <img src="@/assets/logo_fermier.webp" alt="Fermier" class="coin-icon" style="width:45px !important; height:32px !important;" />
                </div>
              </div>
              <transition :name="justJoinedFaction === 'Fermier' ? 'faction-join' : 'faction-join-static'" mode="out-in">
                <button
                  v-if="userFaction !== 'Fermier'"
                  @click="joinFaction('Fermier')"
                  :disabled="joiningFaction"
                  class="join-faction-btn"
                  key="join-fermier"
                >
                  {{ joiningFaction ? 'Rejoindre...' : 'Rejoindre Fermier' }}
                </button>
                <div v-else class="faction-member-badge" :class="{ 'just-joined': justJoinedFaction === 'Fermier' }" :key="justJoinedFaction === 'Fermier' ? 'member-fermier-anim' : 'member-fermier-static'">
                  ✅ Vous êtes membre de cette faction
                </div>
              </transition>

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
                  <img v-for="(a, ai) in getLeaderboardAssetsForTargetPlacement(currentUserFactionEntry, getUserEquippedItemData(currentUserFactionEntry), 'user-avatar-container', 'above')" :key="'dyn-container-above-faction-fermier-user-'+ai+'-'+dynamicVariantsState" :src="resolveAssetSrc(a.src)" :style="getDynLeaderboardContainerOverlayStyle(a)" class="dynamic-container-overlay" />
                  <div class="user-avatar-container" data-darkreader-ignore @click="openLeaderboardProfile(currentUserFactionEntry)">
                    <!-- Absolute Cinema: bras droit dans le user-avatar-container (Faction Fermier - utilisateur courant) -->
                    <img
                      v-if="getUserEquippedItemData(currentUserFactionEntry) && getUserEquippedItemData(currentUserFactionEntry).displayType === 'absolute-cinema'"
                      :src="bras"
                      :alt="getUserEquippedItemData(currentUserFactionEntry).name"
                      class="equipped-absolute-cinema-overlay-right"
                    />

                    <template v-if="getUserEquippedItemData(currentUserFactionEntry) && getUserEquippedItemData(currentUserFactionEntry).isDynamic">
                      <img
                        v-for="(a, ai) in getLeaderboardAssetsForTargetPlacement(currentUserFactionEntry, getUserEquippedItemData(currentUserFactionEntry), 'user-avatar-container', 'below')"
                        :key="'dyn-container-below-faction-fermier-user-' + ai + '-' + dynamicVariantsState"
                        :src="resolveAssetSrc(a.src)"
                        :style="getDynLeaderboardAssetStyle(a)"
                        :class="getDynLeaderboardAssetClass(a)"
                      />
                      <img
                        v-for="(a, ai) in getLeaderboardAssetsForTargetPlacement(currentUserFactionEntry, getUserEquippedItemData(currentUserFactionEntry), 'user-avatar-container', 'inside')"
                        :key="'dyn-container-inside-faction-fermier-user-' + ai + '-' + dynamicVariantsState"
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
                      <template v-if="getUserEquippedItemData(currentUserFactionEntry)">
                        <img v-for="(a, ai) in getLeaderboardAssetsForTargetPlacement(currentUserFactionEntry, getUserEquippedItemData(currentUserFactionEntry), 'user-avatar', 'below')" :key="'dyn-lb-below-faction-fermier-user-'+ai+'-'+dynamicVariantsState" :src="resolveAssetSrc(a.src)" :style="getDynLeaderboardAssetStyle(a)" />
                        <img v-for="(a, ai) in getLeaderboardAssetsForTargetPlacement(currentUserFactionEntry, getUserEquippedItemData(currentUserFactionEntry), 'user-avatar', 'inside')" :key="'dyn-lb-inside-faction-fermier-user-'+ai+'-'+dynamicVariantsState" :src="resolveAssetSrc(a.src)" :style="getDynLeaderboardAssetStyle(a)" :class="getDynLeaderboardAssetClass(a)" />
                        <img v-for="(a, ai) in getLeaderboardAssetsForTargetPlacement(currentUserFactionEntry, getUserEquippedItemData(currentUserFactionEntry), 'user-avatar', 'above')" :key="'dyn-lb-above-faction-fermier-user-'+ai+'-'+dynamicVariantsState" :src="resolveAssetSrc(a.src)" :style="getDynLeaderboardAssetStyle(a)" :class="getDynLeaderboardAssetClass(a)" />
                      </template>
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
                    <img v-for="(a, ai) in getLeaderboardAssetsForTargetPlacement(user, getUserEquippedItemData(user), 'user-avatar-container', 'above')" :key="'dyn-container-above-faction-fermier-'+ai+'-'+dynamicVariantsState" :src="resolveAssetSrc(a.src)" :style="getDynLeaderboardContainerOverlayStyle(a)" class="dynamic-container-overlay" />
                    <div class="user-avatar-container" data-darkreader-ignore @click="openLeaderboardProfile(user)">
                      <!-- Absolute Cinema: bras droit dans le user-avatar-container (Faction Fermier - liste) -->
                      <img
                        v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).displayType === 'absolute-cinema'"
                        :src="bras"
                        :alt="getUserEquippedItemData(user).name"
                        class="equipped-absolute-cinema-overlay-right"
                      />

                      <template v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).isDynamic">
                        <img
                          v-for="(a, ai) in getLeaderboardAssetsForTargetPlacement(user, getUserEquippedItemData(user), 'user-avatar-container', 'below')"
                          :key="'dyn-container-below-faction-fermier-' + ai + '-' + dynamicVariantsState"
                          :src="resolveAssetSrc(a.src)"
                          :style="getDynLeaderboardAssetStyle(a)"
                          :class="getDynLeaderboardAssetClass(a)"
                        />
                        <img
                          v-for="(a, ai) in getLeaderboardAssetsForTargetPlacement(user, getUserEquippedItemData(user), 'user-avatar-container', 'inside')"
                          :key="'dyn-container-inside-faction-fermier-' + ai + '-' + dynamicVariantsState"
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

                        <template v-if="getUserEquippedItemData(user)">
                          <img v-for="(a, ai) in getLeaderboardAssetsForTargetPlacement(user, getUserEquippedItemData(user), 'user-avatar', 'below')" :key="'dyn-lb-below-faction-fermier-'+ai+'-'+dynamicVariantsState" :src="resolveAssetSrc(a.src)" :style="getDynLeaderboardAssetStyle(a)" />
                          <img v-for="(a, ai) in getLeaderboardAssetsForTargetPlacement(user, getUserEquippedItemData(user), 'user-avatar', 'inside')" :key="'dyn-lb-inside-faction-fermier-'+ai+'-'+dynamicVariantsState" :src="resolveAssetSrc(a.src)" :style="getDynLeaderboardAssetStyle(a)" :class="getDynLeaderboardAssetClass(a)" />
                          <img v-for="(a, ai) in getLeaderboardAssetsForTargetPlacement(user, getUserEquippedItemData(user), 'user-avatar', 'above')" :key="'dyn-lb-above-faction-fermier-'+ai+'-'+dynamicVariantsState" :src="resolveAssetSrc(a.src)" :style="getDynLeaderboardAssetStyle(a)" :class="getDynLeaderboardAssetClass(a)" />

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

              <img v-for="(a, ai) in getLeaderboardAssetsForTargetPlacement(user, getUserEquippedItemData(user), 'user-avatar-container', 'above')" :key="'dyn-container-above-'+ai+'-'+dynamicVariantsState" :src="resolveAssetSrc(a.src)" :style="getDynLeaderboardContainerOverlayStyle(a)" class="dynamic-container-overlay" />

              <div class="user-avatar-container" data-darkreader-ignore @click="openLeaderboardProfile(user)">
                <!-- Items dynamiques ciblant le conteneur (user-avatar-container) - tous placements -->
                <template v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).isDynamic">
                  <img v-for="(a, ai) in getLeaderboardAssetsForTargetPlacement(user, getUserEquippedItemData(user), 'user-avatar-container', 'below')" :key="'dyn-container-below-' + ai + '-' + dynamicVariantsState" :src="resolveAssetSrc(a.src)" :style="getDynLeaderboardAssetStyle(a)" :class="getDynLeaderboardAssetClass(a)" />
                  <img v-for="(a, ai) in getLeaderboardAssetsForTargetPlacement(user, getUserEquippedItemData(user), 'user-avatar-container', 'inside')" :key="'dyn-container-inside-' + ai + '-' + dynamicVariantsState" :src="resolveAssetSrc(a.src)" :style="getDynLeaderboardAssetStyle(a)" :class="getDynLeaderboardAssetClass(a)" />
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
                    <img v-for="(a, ai) in getLeaderboardAssetsForTargetPlacement(user, getUserEquippedItemData(user), 'user-avatar', 'below')" :key="'dyn-lb-below-'+ai+'-'+dynamicVariantsState" :src="resolveAssetSrc(a.src)" :style="getDynLeaderboardAssetStyle(a)" />
                    <img v-for="(a, ai) in getLeaderboardAssetsForTargetPlacement(user, getUserEquippedItemData(user), 'user-avatar', 'inside')" :key="'dyn-lb-inside-'+ai+'-'+dynamicVariantsState" :src="resolveAssetSrc(a.src)" :style="getDynLeaderboardAssetStyle(a)" :class="getDynLeaderboardAssetClass(a)" />
                    <img v-for="(a, ai) in getLeaderboardAssetsForTargetPlacement(user, getUserEquippedItemData(user), 'user-avatar', 'above')" :key="'dyn-lb-above-'+ai+'-'+dynamicVariantsState" :src="resolveAssetSrc(a.src)" :style="getDynLeaderboardAssetStyle(a)" :class="getDynLeaderboardAssetClass(a)" />
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
          <div class="profile-popup leaderboard-profile-popup" data-darkreader-ignore>
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
                :style="getProfilePopupStageInlineStyle(selectedUser)"
                :class="{
                  'no-border':
                    (getUserEquippedItemData(selectedUser) &&
                      (getUserEquippedItemData(selectedUser).displayType === 'discord' || getUserEquippedItemData(selectedUser).displayType === 'coeur' || getUserEquippedItemData(selectedUser).displayType === 'alpha' || getUserEquippedItemData(selectedUser).displayType === 'admin-planify' || getUserEquippedItemData(selectedUser).name === 'Galaxie' || getUserEquippedItemData(selectedUser).name === 'Coeur' || getUserEquippedItemData(selectedUser).name === 'Prestige' || getUserEquippedItemData(selectedUser).name === 'Planify' || getUserEquippedItemData(selectedUser).name === 'Admin Planify' || getUserEquippedItemData(selectedUser).name === 'Alpha')) ||
                    (getUserEquippedItemData(selectedUser) && shouldRemoveProfilePopupBorder(getUserEquippedItemData(selectedUser)))
                }"
              >
                <div class="profile-avatar-scaler" data-darkreader-ignore :style="getProfilePopupScalerInlineStyle(selectedUser)">
                  <div
                    class="profile-avatar"
                    data-darkreader-ignore
                    :style="getProfilePopupAvatarBorderStyle(selectedUser)"
                    :class="{
                      'jojo-sepia': getUserEquippedItemData(selectedUser) && getUserEquippedItemData(selectedUser).displayType === 'jojo',
                      'no-border':
                        (getUserEquippedItemData(selectedUser) &&
                          (getUserEquippedItemData(selectedUser).displayType === 'discord' || getUserEquippedItemData(selectedUser).displayType === 'coeur' || getUserEquippedItemData(selectedUser).displayType === 'alpha' || getUserEquippedItemData(selectedUser).displayType === 'admin-planify' || getUserEquippedItemData(selectedUser).name === 'Galaxie' || getUserEquippedItemData(selectedUser).name === 'Coeur' || getUserEquippedItemData(selectedUser).name === 'Prestige' || getUserEquippedItemData(selectedUser).name === 'Planify' || getUserEquippedItemData(selectedUser).name === 'Admin Planify' || getUserEquippedItemData(selectedUser).name === 'Alpha')) ||
                        (getUserEquippedItemData(selectedUser) && shouldRemoveProfilePopupBorder(getUserEquippedItemData(selectedUser)))
                    }"
                  >
                    <!-- Dyn: BELOW (intérieur du carré) -->

                    <img
                      v-for="(a, ai) in getProfilePopupAssetsForTargetPlacement(getUserEquippedItemData(selectedUser), 'profile-avatar', 'below')"
                      :key="'profile-below-'+ai+'-'+dynamicVariantsState"
                      :src="resolveDynSrc(a.src)"
                      :style="getDynProfilePopupAssetStyle(a, false)"
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
                      :src="resolveDynSrc(a.src)"
                      :style="getDynProfilePopupAssetStyle(a, false)"
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
                      v-if="getUserEquippedItemData(selectedUser) && getUserEquippedItemData(selectedUser).displayType === 'lunettes-pixel'"
                      :src="mlglunette"
                      :alt="getUserEquippedItemData(selectedUser).name"
                      class="equipped-lunettes-pixel-inside"
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
                    :src="resolveDynSrc(a.src)"
                    :style="getDynProfilePopupAssetStyle(a, true)"
                  />
                  <img
                    v-for="(a, ai) in getProfilePopupAssetsForTargetPlacement(getUserEquippedItemData(selectedUser), 'profile-avatar-scaler', 'inside')"
                    :key="'pp-scaler-inside-'+ai+'-'+dynamicVariantsState"
                    :src="resolveDynSrc(a.src)"
                    :style="getDynProfilePopupAssetStyle(a, true)"
                  />

                  <!-- Items statiques ABOVE (au-dessus du carré) -->
                  <img
                    v-if="getUserEquippedItemData(selectedUser) && getUserEquippedItemData(selectedUser).displayType === 'discord'"
                    :src="[discordon, discordnepasderange, discordderange][coinsStore.discordVariantIndex]"
                    :alt="getUserEquippedItemData(selectedUser).name"
                    class="equipped-discord-overlay"
                  />
                  <img
                    v-if="getUserEquippedItemData(selectedUser) && getUserEquippedItemData(selectedUser).name === 'Galaxie'"
                    :src="galaxie"
                    :alt="getUserEquippedItemData(selectedUser).name"
                    class="equipped-galaxie-overlay"
                  />
                  <img
                    v-if="getUserEquippedItemData(selectedUser) && (getUserEquippedItemData(selectedUser).name === 'Coeur' || getUserEquippedItemData(selectedUser).displayType === 'coeur')"
                    :src="coeur"
                    :alt="getUserEquippedItemData(selectedUser).name"
                    class="equipped-coeur-overlay"
                  />
                  <img
                    v-if="getUserEquippedItemData(selectedUser) && (getUserEquippedItemData(selectedUser).displayType === 'alpha' || getUserEquippedItemData(selectedUser).name === 'Alpha')"
                    :src="alphaImg"
                    :alt="getUserEquippedItemData(selectedUser).name"
                    class="equipped-alpha-overlay"
                  />
                  <img
                    v-if="getUserEquippedItemData(selectedUser) && (getUserEquippedItemData(selectedUser).displayType === 'admin-planify' || getUserEquippedItemData(selectedUser).name === 'Admin Planify')"
                    :src="adminPlanify"
                    :alt="getUserEquippedItemData(selectedUser).name"
                    class="equipped-admin-planify-overlay"
                  />
                  <img
                    v-if="getUserEquippedItemData(selectedUser) && getUserEquippedItemData(selectedUser).displayType === 'absolute-cinema'"
                    :src="bras"
                    :alt="getUserEquippedItemData(selectedUser).name"
                    class="equipped-absolute-cinema-overlay"
                  />
                  <img
                    v-if="getUserEquippedItemData(selectedUser) && getUserEquippedItemData(selectedUser).displayType === 'absolute-cinema'"
                    :src="bras"
                    :alt="getUserEquippedItemData(selectedUser).name"
                    class="equipped-absolute-cinema-overlay-right"
                  />
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

                  <!-- Extérieur “above” (scaler) -->
                  <img
                    v-for="(a, ai) in getProfilePopupAssetsForTargetPlacement(getUserEquippedItemData(selectedUser), 'profile-avatar-scaler', 'above')"
                    :key="'pp-scaler-above-'+ai+'-'+dynamicVariantsState"
                    :src="resolveDynSrc(a.src)"
                    :style="getDynProfilePopupAssetStyle(a, true)"
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
                  <div class="profile-outlets-row">
                    <div class="profile-dept-outlet">
                      <img v-if="selectedDepartmentLogoSrc" :src="selectedDepartmentLogoSrc" alt="Études" class="dept-logo" />
                      <span v-else class="dept-text">{{ selectedUser?.department || selectedUser?.etude || '—' }}</span>
                    </div>
                    <div class="profile-group-outlet">
                      <img v-if="selectedGroupLogoSrc" :src="selectedGroupLogoSrc" alt="Groupe" class="group-logo" />
                      <span v-else class="group-text">{{ selectedUser?.groupe || '—' }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div class="profile-pill profile-coins">{{ formatCoins((selectedUser?.leaderboardCoins ?? selectedUser?.coins ?? 0)) }} <img src="@/assets/img/planicoins.webp" alt="Coin" class="coin-icon" /></div>
            </div>
            </div>
            <div class="profile-divider" aria-hidden="true"></div>
            <div class="profile-right">

            <!-- Musique de profil (si disponible) -->
            <div v-if="showUserProfile && selectedUser" class="leaderboard-profile-music">
              <div v-if="selectedUserMusicSrc" class="profile-pill profile-music-row">
                <div class="profile-music-left">
                  <div class="profile-left-controls">
                    <button type="button" class="btn btn-icon play-btn" @click="togglePopupPlay" :title="isPopupPlaying ? 'Pause' : 'Lire'">
                      <img :src="isPopupPlaying ? pauseBtnImg : playBtnImg" :key="isPopupPlaying ? 'pause' : 'play'" class="play-btn-img" />
                    </button>
                    <div class="volume-controls" @mouseenter="isVolumeHovered = true" @mouseleave="isVolumeHovered = false">
                      <button type="button" class="btn btn-icon volume-btn" @click="togglePopupMute" :title="isPopupMuted ? 'Son coupé' : 'Son actif'">
                        <img :src="popupCurrentVolumeIcon" :key="popupCurrentVolumeIcon" :class="['volume-btn-img', { 'is-mute': isPopupMuted || popupMusicVolume === 0 }]" alt="Volume" />
                      </button>
                      <div class="volume-slider-container" :class="{ visible: isVolumeHovered, horizontal: isMobile }">
                        <div :class="isMobile ? 'volume-seek-bar-horizontal' : 'volume-seek-bar-vertical'" @mousedown="startPopupVolumeDrag" @touchstart="startPopupVolumeDrag">
                          <div class="seek-track-vertical"></div>
                          <div class="seek-fill-vertical" :style="isMobile ? { width: popupMusicVolume + '%' } : { height: popupMusicVolume + '%' }"></div>
                          <div class="seek-thumb-vertical" :style="isMobile ? { left: popupMusicVolume + '%' } : { bottom: popupMusicVolume + '%' }"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="profile-music-player">
                  <div class="profile-music-title">{{ selectedUserMusicTitle }}</div>
                  <div class="profile-progress-container">
                    <div class="profile-seek-bar" @mousedown="startPopupSeekDrag" @touchstart="startPopupSeekDrag">
                      <div class="seek-track"></div>
                      <div class="seek-fill" :style="{ width: popupProgressPercent + '%' }"></div>
                      <div class="seek-thumb" :style="{ left: popupProgressPercent + '%' }"></div>
                    </div>
                    <div class="profile-time">{{ formatTime(popupProgress) }}</div>
                  </div>
                  <iframe v-if="isPopupYouTube" id="leaderboard-youtube-player" ref="popupYouTubeIframeRef" :src="getPopupYouTubeEmbedUrl(selectedUserMusicSrc)" allow="autoplay; encrypted-media" allowfullscreen aria-hidden="true" style="position:absolute;width:1px;height:1px;border:0;clip:rect(0,0,0,0);overflow:hidden;pointer-events:none;" @load="subscribePopupYouTubePlayer"></iframe>
                  <audio
                    v-else
                    ref="popupAudioEl"
                    :src="resolveAssetSrc(selectedUserMusicSrc)"
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
                  <img v-for="(src, si) in suggestAssetSrcs" :key="'popupStyle-preview-'+si" :src="src" :style="[getSuggestStyle('popupStyle', si), getSuggestStackStyle(si)]" class="item-img" />
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
        <button class="close-btn" @click="cancelConfirmFaction" @mouseover="hoverCloseFactionConfirm = true" @mouseleave="hoverCloseFactionConfirm = false">
          <img :src="hoverCloseFactionConfirm ? closeHoverImg : closeImg" alt="Fermer" class="close-img" />
        </button>
        <div class="faction-confirm-text">
          <h3>Confirmation de changement de faction</h3>
          <p>
            Êtes-vous sûr de vouloir rejoindre {{ pendingFaction }} ?
            Cette action coûte 250 Planify Coins.
          </p>
        </div>
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
 import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
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
import mmiPill from '@/assets/MMI_pill.webp'
import tcPill from '@/assets/TC_pill.webp'
import infoPill from '@/assets/INFO_pill.webp'
import infocomPill from '@/assets/INFOCOM_pill.webp'
import geaPill from '@/assets/GEA_pill.webp'
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

  const combined = [...stat, ...dyn, ...userServerLocalItems.value, ...local, ...weekly]
  const seen = new Set()
  return combined.map((it, idx) => {
    const rawId = it && (it.legacyId ?? it.id ?? it._id ?? (it.meta && (it.meta.serverItemId || it.meta.localItemId)))
    const name = String((it && it.name) || '').trim()
    const optionId = (rawId !== undefined && rawId !== null && String(rawId).trim() !== '')
      ? String(rawId)
      : (name ? `name:${name}` : `opt:${idx}`)
    return { ...it, _optionId: optionId }
  }).filter(it => {
    const key = String(it._optionId || '')
    if (!key) return false
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
})
function onAdminReplace(index, id) {
  try {
    const optId = String(id || '')
    const item = adminAllOptions.value.find(it => String(it._optionId || '') === optId)
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
function closePurchasePreview(){ hoverBackShop.value = false; hoverCloseShop.value = false; try{ showPurchasePreview.value = false }catch{ showPurchasePreview = false }; purchasePreviewItem.value = null; if (showSuggestionEditor && (showSuggestionEditor.value === true)) { showSuggestionEditor.value = false; suggestAssetSrcs.value = []; suggestAssetStyles.value = []; suggestAssetPlacements.value = { leaderboard: [], avatar: [], navbar: [] }; suggestPlacement.value = { leaderboard: 'inside', avatar: 'inside', navbar: 'inside' }; activeSuggestAssetIndex.value = 0; suggestUrl.value = ''; removeAvatarBorder.value = false; removeLeaderboardBorder.value = false; previewWindowIndex.value = 0; suggestDevice.value = 'desktop'; suggestAvatarDevice.value = 'desktop'; suggestCosmeticDevice.value = 'desktop'; const DEF = { top:0, left:0, width:50, height:50, rotate:0, objectFit:'contain', zIndex:1, margin:0, padding:0, background:'', boxShadow:'', borderWidth:0, borderStyle:'none', borderColor:'', borderRadius:0 }; suggestStyles.value = { dailyShop: { ...DEF }, collectionPreviewDesktop: { ...DEF }, collectionPreviewMobile: { ...DEF }, collectionPreview: { ...DEF }, collection: { ...DEF }, cosmeticDesktop: { ...DEF }, cosmeticMobile: { ...DEF }, leaderboard: { ...DEF }, avatarDesktop: { ...DEF }, avatarMobile: { ...DEF }, avatar: { ...DEF }, navbar: { ...DEF }, popupStyle: { ...DEF } }; resetSuggestUsers() } }
function measurePreviewSlider(){ try{ const root = weeklyContainerRef.value; if (!root) return; const card = root.querySelector('.preview-slider-track .preview-card'); if (card) { const r = card.getBoundingClientRect(); previewCardWidth.value = Math.round(r.width) } const track = root.querySelector('.preview-slider-track'); if (track) { const cs = window.getComputedStyle(track); const gapVal = parseFloat(cs.gap) || 6; previewCardGap.value = Math.round(gapVal) } }catch{} }
onMounted(() => { try{ syncWeeklyHeight(); measurePreviewSlider(); measureVariantSlider(); window.addEventListener('resize', syncWeeklyHeight); window.addEventListener('resize', measurePreviewSlider); window.addEventListener('resize', measureVariantSlider); refreshSuggestPreviewBorderColor() }catch{} })
onUnmounted(() => { try{ window.removeEventListener('resize', syncWeeklyHeight); window.removeEventListener('resize', measurePreviewSlider); window.removeEventListener('resize', measureVariantSlider) }catch{} })
// Indexs pour retrouver infoOnly/infoDescription même si l'item n'est pas affiché (doublon avec catalogue statique)
const dynamicInfoById = ref(new Map())
const dynamicInfoByName = ref(new Map())
// Clé réactive pour forcer la mise à jour de l'affichage des variantes
const variantUpdateKey = ref(0)

// Computed property réactive qui dépend du store pour forcer les mises à jour
const dynamicVariantsState = computed(() => {
  // Dépendance explicite pour forcer la mise à jour
  const _ = variantUpdateKey.value
  return Array.from(coinsStore.dynamicItemVariants.entries()).map(([k, v]) => k + ':' + v).join('|')
})

// Map des computed properties pour chaque item dynamique
const dynamicItemDisplays = new Map()

// Aperçu Navbar: fermer la boutique et envoyer un événement global pour que la Navbar affiche un rendu temporaire
function handlePreviewNavbar(item) {
  try {
    window.dispatchEvent(new CustomEvent('navbar-preview-item', { detail: { item, removeNavbarBorder: !!removeNavbarBorder.value } }))
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
        id: (it.legacyId !== undefined && it.legacyId !== null) ? it.legacyId : (it.id ?? it._id ?? (it.meta && (it.meta.serverItemId || it.meta.localItemId))),
        name: it.name,
        price: Number(it.price) || 0,
        isDynamic: true,
        isSuggested: !!it.isSuggested,
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
        meta: (it && typeof it.meta === 'object') ? it.meta : {},
        variantIndex: 0
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
const currentEditingServerId = ref(null)
// Slider d’aperçus pour la fenêtre de suggestion
const previewWindowIndex = ref(0)
const previewWindowSize = 3
const suggestDevice = ref('desktop')
const suggestAvatarDevice = ref('desktop')
const suggestCosmeticDevice = ref('desktop')
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
const suggestAssetSrcs = ref([])
const suggestAssetStyles = ref([])
const activeSuggestAssetIndex = ref(0)
const suggestUrl = ref('')
const suggestName = ref('')
const suggestPrice = ref(150)
const removeAvatarBorder = ref(false)
const removeLeaderboardBorder = ref(false)
const removeNavbarBorder = ref(false)
const suggestStyles = ref({
  dailyShop: { top: 0, left: 0, width: 50, height: 50, rotate: 0, objectFit: 'contain', zIndex: 1, margin: 0, padding: 0, background: '', boxShadow: '', borderWidth: 0, borderStyle: 'none', borderColor: '', borderRadius: 0 },
  collectionPreviewDesktop: { top: 0, left: 0, width: 50, height: 50, rotate: 0, objectFit: 'contain', zIndex: 1, margin: 0, padding: 0, background: '', boxShadow: '', borderWidth: 0, borderStyle: 'none', borderColor: '', borderRadius: 0 },
  collectionPreviewMobile:  { top: 0, left: 0, width: 50, height: 50, rotate: 0, objectFit: 'contain', zIndex: 1, margin: 0, padding: 0, background: '', boxShadow: '', borderWidth: 0, borderStyle: 'none', borderColor: '', borderRadius: 0 },
  collectionPreview:        { top: 0, left: 0, width: 50, height: 50, rotate: 0, objectFit: 'contain', zIndex: 1, margin: 0, padding: 0, background: '', boxShadow: '', borderWidth: 0, borderStyle: 'none', borderColor: '', borderRadius: 0 },
  collection: { top: 0, left: 0, width: 50, height: 50, rotate: 0, objectFit: 'contain', zIndex: 1, margin: 0, padding: 0, background: '', boxShadow: '', borderWidth: 0, borderStyle: 'none', borderColor: '', borderRadius: 0 },
  cosmeticDesktop: { top: 0, left: 0, width: 50, height: 50, rotate: 0, objectFit: 'contain', zIndex: 1, margin: 0, padding: 0, background: '', boxShadow: '', borderWidth: 0, borderStyle: 'none', borderColor: '', borderRadius: 0 },
  cosmeticMobile: { top: 0, left: 0, width: 50, height: 50, rotate: 0, objectFit: 'contain', zIndex: 1, margin: 0, padding: 0, background: '', boxShadow: '', borderWidth: 0, borderStyle: 'none', borderColor: '', borderRadius: 0 },
  leaderboard: { top: 0, left: 0, width: 50, height: 50, rotate: 0, objectFit: 'contain', zIndex: 1, margin: 0, padding: 0, background: '', boxShadow: '', borderWidth: 0, borderStyle: 'none', borderColor: '', borderRadius: 0 },
  avatarDesktop: { top: 0, left: 0, width: 50, height: 50, rotate: 0, objectFit: 'contain', zIndex: 1, margin: 0, padding: 0, background: '', boxShadow: '', borderWidth: 0, borderStyle: 'none', borderColor: '', borderRadius: 0 },
  avatarMobile: { top: 0, left: 0, width: 50, height: 50, rotate: 0, objectFit: 'contain', zIndex: 1, margin: 0, padding: 0, background: '', boxShadow: '', borderWidth: 0, borderStyle: 'none', borderColor: '', borderRadius: 0 },
  avatar: { top: 0, left: 0, width: 50, height: 50, rotate: 0, objectFit: 'contain', zIndex: 1, margin: 0, padding: 0, background: '', boxShadow: '', borderWidth: 0, borderStyle: 'none', borderColor: '', borderRadius: 0 },
  navbar: { top: 0, left: 0, width: 50, height: 50, rotate: 0, objectFit: 'contain', zIndex: 1, margin: 0, padding: 0, background: '', boxShadow: '', borderWidth: 0, borderStyle: 'none', borderColor: '', borderRadius: 0 },
  popupStyle: { top: 0, left: 0, width: 50, height: 50, rotate: 0, objectFit: 'contain', zIndex: 1, margin: 0, padding: 0, background: '', boxShadow: '', borderWidth: 0, borderStyle: 'none', borderColor: '', borderRadius: 0 }
})
const suggestCosmeticStyle = computed(() => (suggestCosmeticDevice.value === 'mobile') ? suggestStyles.value.cosmeticMobile : suggestStyles.value.cosmeticDesktop)
const ensureAvatarStyle = () => {
  try {
    const set = suggestStyles.value || {}
    const fallback = { top: 0, left: 0, width: 50, height: 50, rotate: 0, objectFit: 'contain', zIndex: 1, margin: 0, padding: 0, background: '', boxShadow: '', borderWidth: 0, borderStyle: 'none', borderColor: '', borderRadius: 0 }
    if (suggestAvatarDevice.value === 'mobile') {
      if (!set.avatarMobile) set.avatarMobile = { ...(set.avatarDesktop || set.avatar || fallback) }
      return set.avatarMobile
    }
    if (!set.avatarDesktop) set.avatarDesktop = { ...(set.avatar || set.avatarMobile || fallback) }
    return set.avatarDesktop
  } catch {
    return { top: 0, left: 0, width: 50, height: 50, rotate: 0, objectFit: 'contain', zIndex: 1, margin: 0, padding: 0, background: '', boxShadow: '', borderWidth: 0, borderStyle: 'none', borderColor: '', borderRadius: 0 }
  }
}
const suggestAvatarStyle = computed(() => ensureAvatarStyle())
const suggestAvatarStageHeight = ref(250)
const suggestAvatarStageInlineStyle = computed(() => {
  const w = (suggestAvatarDevice.value === 'mobile') ? 100 : (isMobile.value ? 250 : 351)
  const h = (suggestAvatarDevice.value === 'mobile') ? 100 : suggestAvatarStageHeight.value
  return `width: ${w}px !important; height: ${h}px !important`
})
const suggestAvatarScalerInlineStyle = computed(() => {
  const w = (suggestAvatarDevice.value === 'mobile') ? 100 : (isMobile.value ? 250 : 351)
  const h = (suggestAvatarDevice.value === 'mobile') ? 100 : suggestAvatarStageHeight.value
  return `width: ${w}px !important; height: ${h}px !important`
})
const suggestAvatarImgInlineStyle = computed(() => {
  const size = (suggestAvatarDevice.value === 'mobile') ? 90 : 150
  return `position:relative; width:${size}px; height:${size}px; border-radius:24px; border:none; overflow:hidden;`
})
const DEFAULT_SUGGEST_STYLE = { top: 0, left: 0, width: 50, height: 50, rotate: 0, objectFit: 'contain', zIndex: 1, margin: 0, padding: 0, background: '', boxShadow: '', borderWidth: 0, borderStyle: 'none', borderColor: '', borderRadius: 0 }
const cloneSuggestStyle = (src) => ({ ...(src || DEFAULT_SUGGEST_STYLE) })
const makeSuggestStyleSet = (src) => {
  const base = src || DEFAULT_SUGGEST_STYLE
  return {
    dailyShop: cloneSuggestStyle(base?.dailyShop || base),
    collectionPreviewDesktop: cloneSuggestStyle(base?.collectionPreviewDesktop || base?.collectionPreview || base?.collection || base),
    collectionPreviewMobile: cloneSuggestStyle(base?.collectionPreviewMobile || base?.collectionPreview || base?.collection || base),
    collectionPreview: cloneSuggestStyle(base?.collectionPreview || base?.collectionPreviewDesktop || base),
    collection: cloneSuggestStyle(base?.collection || base),
    cosmeticDesktop: cloneSuggestStyle(base?.cosmeticDesktop || base?.collection || base),
    cosmeticMobile: cloneSuggestStyle(base?.cosmeticMobile || base?.cosmeticDesktop || base?.collection || base),
    leaderboard: cloneSuggestStyle(base?.leaderboard || base),
    avatarDesktop: cloneSuggestStyle(base?.avatarDesktop || base?.avatar || base),
    avatarMobile: cloneSuggestStyle(base?.avatarMobile || base?.avatarDesktop || base?.avatar || base),
    avatar: cloneSuggestStyle(base?.avatar || base),
    navbar: cloneSuggestStyle(base?.navbar || base),
    popupStyle: cloneSuggestStyle(base?.popupStyle || base)
  }
}
const normalizeSuggestStyleSet = (src, fallback) => {
  const fb = fallback || makeSuggestStyleSet(DEFAULT_SUGGEST_STYLE)
  const s = src || {}
  return {
    dailyShop: { ...(s.dailyShop || fb.dailyShop) },
    collectionPreviewDesktop: { ...(s.collectionPreviewDesktop || s.collectionPreview || s.collection || fb.collectionPreviewDesktop) },
    collectionPreviewMobile: { ...(s.collectionPreviewMobile || s.collectionPreview || s.collection || fb.collectionPreviewMobile) },
    collectionPreview: { ...(s.collectionPreview || s.collectionPreviewDesktop || fb.collectionPreview) },
    collection: { ...(s.collection || s.cosmeticDesktop || fb.collection) },
    cosmeticDesktop: { ...(s.cosmeticDesktop || s.collection || fb.cosmeticDesktop || fb.collection) },
    cosmeticMobile: { ...(s.cosmeticMobile || s.cosmeticDesktop || s.collection || fb.cosmeticMobile || fb.cosmeticDesktop || fb.collection) },
    leaderboard: { ...(s.leaderboard || fb.leaderboard) },
    avatarDesktop: { ...(s.avatarDesktop || s.avatar || fb.avatarDesktop || fb.avatar) },
    avatarMobile: { ...(s.avatarMobile || s.avatarDesktop || s.avatar || fb.avatarMobile || fb.avatarDesktop || fb.avatar) },
    avatar: { ...(s.avatar || s.avatarDesktop || fb.avatar) },
    navbar: { ...(s.navbar || fb.navbar) },
    popupStyle: { ...(s.popupStyle || fb.popupStyle) }
  }
}
function getSuggestStyleSetForIndex(i) {
  try {
    const idx = Number.isFinite(Number(i)) ? Number(i) : null
    if (idx !== null && Array.isArray(suggestAssetStyles.value) && suggestAssetStyles.value[idx]) return suggestAssetStyles.value[idx]
    return suggestStyles.value || makeSuggestStyleSet(DEFAULT_SUGGEST_STYLE)
  } catch { return suggestStyles.value || makeSuggestStyleSet(DEFAULT_SUGGEST_STYLE) }
}
function setActiveSuggestAsset(i) {
  try {
    const len = Array.isArray(suggestAssetStyles.value) ? suggestAssetStyles.value.length : 0
    const idx = len ? Math.max(0, Math.min(Number(i) || 0, len - 1)) : 0
    activeSuggestAssetIndex.value = idx
    const set = (len && suggestAssetStyles.value[idx]) ? suggestAssetStyles.value[idx] : makeSuggestStyleSet(DEFAULT_SUGGEST_STYLE)
    suggestStyles.value = set
    suggestPlacement.value = {
      leaderboard: getPlacementForIndex('leaderboard', idx),
      avatar: getPlacementForIndex('avatar', idx),
      navbar: getPlacementForIndex('navbar', idx)
    }
    ensureSuggestAssetPlacementsLength(len)
    if (suggestDevice.value === 'mobile') {
      if (!set.collectionPreviewMobile || ((Number(set.collectionPreviewMobile.top||0)===0) && (Number(set.collectionPreviewMobile.left||0)===0) && (Number(set.collectionPreviewMobile.width||50)===50) && (Number(set.collectionPreviewMobile.height||50)===50))) {
        set.collectionPreviewMobile = { ...set.collectionPreviewDesktop }
      }
      set.collectionPreview = set.collectionPreviewMobile
    } else {
      if (!set.collectionPreviewDesktop || ((Number(set.collectionPreviewDesktop.top||0)===0) && (Number(set.collectionPreviewDesktop.left||0)===0) && (Number(set.collectionPreviewDesktop.width||50)===50) && (Number(set.collectionPreviewDesktop.height||50)===50))) {
        set.collectionPreviewDesktop = { ...set.collectionPreviewMobile }
      }
      set.collectionPreview = set.collectionPreviewDesktop
    }
    if (!set.avatarDesktop) set.avatarDesktop = { ...(set.avatar || DEFAULT_SUGGEST_STYLE) }
    if (!set.avatarMobile) set.avatarMobile = { ...(set.avatarDesktop || set.avatar || DEFAULT_SUGGEST_STYLE) }
    if (!set.cosmeticDesktop) set.cosmeticDesktop = { ...(set.collection || DEFAULT_SUGGEST_STYLE) }
    if (!set.cosmeticMobile) set.cosmeticMobile = { ...(set.cosmeticDesktop || set.collection || DEFAULT_SUGGEST_STYLE) }
  } catch {}
}
const makeVariant = (name) => ({ name, assetSrcs: [], assetSrc: '', assetStyles: [], assetPlacements: { leaderboard: [], avatar: [], navbar: [] }, styles: { dailyShop: { ...DEFAULT_SUGGEST_STYLE }, collectionPreviewDesktop: { ...DEFAULT_SUGGEST_STYLE }, collectionPreviewMobile: { ...DEFAULT_SUGGEST_STYLE }, collectionPreview: { ...DEFAULT_SUGGEST_STYLE }, collection: { ...DEFAULT_SUGGEST_STYLE }, cosmeticDesktop: { ...DEFAULT_SUGGEST_STYLE }, cosmeticMobile: { ...DEFAULT_SUGGEST_STYLE }, leaderboard: { ...DEFAULT_SUGGEST_STYLE }, avatarDesktop: { ...DEFAULT_SUGGEST_STYLE }, avatarMobile: { ...DEFAULT_SUGGEST_STYLE }, avatar: { ...DEFAULT_SUGGEST_STYLE }, navbar: { ...DEFAULT_SUGGEST_STYLE }, popupStyle: { ...DEFAULT_SUGGEST_STYLE } }, flags: { removeLeaderboardBorder: false, removeProfilePopupBorder: false, removeNavbarBorder: false, leaderboardPlacement: 'inside', profilePopupPlacement: 'inside', navbarPlacement: 'inside', largeAvatarHeight: 250 } })
const suggestVariants = ref([ makeVariant('Style 1') ])
const activeVariantIndex = ref(0)
const variantWindowSize = ref(5)
const variantWindowIndex = ref(0)
const showVariantArrows = computed(() => {
  const total = Array.isArray(suggestVariants.value) ? suggestVariants.value.length : 0
  return total > variantWindowSize.value
})
const canScrollVariantLeft = computed(() => variantWindowIndex.value > 0)
const canScrollVariantRight = computed(() => {
  const total = Array.isArray(suggestVariants.value) ? suggestVariants.value.length : 0
  return (variantWindowIndex.value + variantWindowSize.value) < total
})
const variantTrackRef = ref(null)
const variantChipWidth = ref(0)
const variantChipGap = ref(8)
const resolveVariantWindowSize = () => {
  const w = window.innerWidth || 1024
  if (w <= 520) return 2
  return 5
}
const variantViewportStyle = computed(() => {
  const w = variantChipWidth.value
  const gap = variantChipGap.value
  if (!w) return { overflow: 'hidden' }
  return { width: ((w * variantWindowSize.value) + (gap * (variantWindowSize.value - 1))) + 'px', overflow: 'hidden' }
})
const variantTrackStyle = computed(() => {
  const w = variantChipWidth.value
  const gap = variantChipGap.value
  const step = w + gap
  if (!w || !step) return { transform: 'none', transition: 'none' }
  return { transform: `translateX(-${variantWindowIndex.value * step}px)`, transition: 'transform 0.45s ease-in-out' }
})
function measureVariantSlider() {
  try {
    const nextSize = resolveVariantWindowSize()
    if (variantWindowSize.value !== nextSize) variantWindowSize.value = nextSize
    const track = variantTrackRef.value
    if (!track) return
    const chip = track.querySelector('.variant-chip')
    if (chip) {
      const r = chip.getBoundingClientRect()
      variantChipWidth.value = Math.round(r.width)
    }
    const cs = window.getComputedStyle(track)
    const gapVal = parseFloat(cs.gap) || 8
    variantChipGap.value = Math.round(gapVal)
    clampVariantWindow()
  } catch {}
}
function clampVariantWindow() {
  try {
    const total = Array.isArray(suggestVariants.value) ? suggestVariants.value.length : 0
    const maxStart = Math.max(0, total - variantWindowSize.value)
    if (variantWindowIndex.value > maxStart) variantWindowIndex.value = maxStart
    if (variantWindowIndex.value < 0) variantWindowIndex.value = 0
  } catch {}
}
function ensureVariantWindowForIndex(i) {
  try {
    if (typeof i !== 'number') return
    clampVariantWindow()
    if (i < variantWindowIndex.value) variantWindowIndex.value = i
    else if (i >= (variantWindowIndex.value + variantWindowSize.value)) variantWindowIndex.value = i - variantWindowSize.value + 1
    clampVariantWindow()
  } catch {}
}
function prevVariantWindow() {
  if (!canScrollVariantLeft.value) return
  variantWindowIndex.value = Math.max(0, variantWindowIndex.value - 1)
}
function nextVariantWindow() {
  if (!canScrollVariantRight.value) return
  const total = Array.isArray(suggestVariants.value) ? suggestVariants.value.length : 0
  const maxStart = Math.max(0, total - variantWindowSize.value)
  variantWindowIndex.value = Math.min(maxStart, variantWindowIndex.value + 1)
}
function loadActiveVariantIntoBuffer() {
  try {
    const v = suggestVariants.value[activeVariantIndex.value]
    if (!v) return
    removeLeaderboardBorder.value = !!v.flags.removeLeaderboardBorder
    removeAvatarBorder.value = !!v.flags.removeProfilePopupBorder
    removeNavbarBorder.value = !!v.flags.removeNavbarBorder
    suggestPlacement.value = {
      leaderboard: String(v.flags.leaderboardPlacement || 'inside'),
      avatar: String(v.flags.profilePopupPlacement || 'inside'),
      navbar: String(v.flags.navbarPlacement || 'inside')
    }
    suggestAvatarStageHeight.value = Number(v.flags.largeAvatarHeight || 250)
    const rawSrcs = Array.isArray(v.assetSrcs) ? v.assetSrcs : (v.assetSrc ? [v.assetSrc] : [])
    let resolved = rawSrcs
    try { resolved = rawSrcs.map(s => resolveAssetSrc(s)) } catch {}
    suggestAssetSrcs.value = resolved.filter(s => !!s)
    const baseSet = normalizeSuggestStyleSet(v.styles || makeSuggestStyleSet(DEFAULT_SUGGEST_STYLE))
    const incoming = Array.isArray(v.assetStyles) ? v.assetStyles : []
    const styles = []
    for (let i = 0; i < suggestAssetSrcs.value.length; i++) {
      styles.push(normalizeSuggestStyleSet(incoming[i], baseSet))
    }
    suggestAssetStyles.value = styles
    const placements = v.assetPlacements || {}
    suggestAssetPlacements.value = {
      leaderboard: Array.isArray(placements.leaderboard) ? placements.leaderboard.map(normalizeSuggestPlacementValue) : [],
      avatar: Array.isArray(placements.avatar) ? placements.avatar.map(normalizeSuggestPlacementValue) : [],
      navbar: Array.isArray(placements.navbar) ? placements.navbar.map(normalizeSuggestPlacementValue) : []
    }
    ensureSuggestAssetPlacementsLength(suggestAssetSrcs.value.length)
    setActiveSuggestAsset(activeSuggestAssetIndex.value)
  } catch {}
}
function persistBufferIntoActiveVariant() {
  try {
    const v = suggestVariants.value[activeVariantIndex.value]
    if (!v) return
    v.styles.dailyShop = { ...suggestStyles.value.dailyShop }
    v.styles.collectionPreviewDesktop = { ...suggestStyles.value.collectionPreviewDesktop }
    v.styles.collectionPreviewMobile = { ...suggestStyles.value.collectionPreviewMobile }
    v.styles.collectionPreview = { ...suggestStyles.value.collectionPreview }
    const cosmeticDesktop = { ...(suggestStyles.value.cosmeticDesktop || suggestStyles.value.collection || DEFAULT_SUGGEST_STYLE) }
    const cosmeticMobile = { ...(suggestStyles.value.cosmeticMobile || suggestStyles.value.cosmeticDesktop || suggestStyles.value.collection || DEFAULT_SUGGEST_STYLE) }
    v.styles.collection = { ...cosmeticDesktop }
    v.styles.cosmeticDesktop = { ...cosmeticDesktop }
    v.styles.cosmeticMobile = { ...cosmeticMobile }
    v.styles.leaderboard = { ...suggestStyles.value.leaderboard }
    v.styles.avatarDesktop = { ...(suggestStyles.value.avatarDesktop || DEFAULT_SUGGEST_STYLE) }
    v.styles.avatarMobile = { ...(suggestStyles.value.avatarMobile || DEFAULT_SUGGEST_STYLE) }
    v.styles.avatar = { ...(suggestStyles.value.avatarDesktop || DEFAULT_SUGGEST_STYLE) }
    v.styles.navbar = { ...suggestStyles.value.navbar }
    v.styles.popupStyle = { ...suggestStyles.value.popupStyle }
    v.flags.removeLeaderboardBorder = !!removeLeaderboardBorder.value
    v.flags.removeProfilePopupBorder = !!removeAvatarBorder.value
    v.flags.removeNavbarBorder = !!removeNavbarBorder.value
    v.flags.leaderboardPlacement = String(getPlacementForIndex('leaderboard', 0) || 'inside')
    v.flags.profilePopupPlacement = String(getPlacementForIndex('avatar', 0) || 'inside')
    v.flags.navbarPlacement = String(getPlacementForIndex('navbar', 0) || 'inside')
    v.flags.largeAvatarHeight = Number(suggestAvatarStageHeight.value || 250)
    v.assetSrcs = Array.isArray(suggestAssetSrcs.value) ? [...suggestAssetSrcs.value] : []
    v.assetSrc = v.assetSrcs[0] || ''
    v.assetStyles = Array.isArray(suggestAssetStyles.value) ? suggestAssetStyles.value.map(s => normalizeSuggestStyleSet(s, suggestStyles.value)) : []
    v.assetPlacements = {
      leaderboard: Array.isArray(suggestAssetPlacements.value?.leaderboard) ? [...suggestAssetPlacements.value.leaderboard] : [],
      avatar: Array.isArray(suggestAssetPlacements.value?.avatar) ? [...suggestAssetPlacements.value.avatar] : [],
      navbar: Array.isArray(suggestAssetPlacements.value?.navbar) ? [...suggestAssetPlacements.value.navbar] : []
    }
  } catch {}
}
function selectVariant(i) { persistBufferIntoActiveVariant(); activeVariantIndex.value = i; loadActiveVariantIntoBuffer(); ensureVariantWindowForIndex(i) }
function addVariant() { persistBufferIntoActiveVariant(); suggestVariants.value.push(makeVariant('Style ' + (suggestVariants.value.length + 1))); activeVariantIndex.value = suggestVariants.value.length - 1; loadActiveVariantIntoBuffer(); ensureVariantWindowForIndex(activeVariantIndex.value) }
function duplicateVariant() { persistBufferIntoActiveVariant(); const v = suggestVariants.value[activeVariantIndex.value]; const copy = JSON.parse(JSON.stringify(v)); copy.name = 'Style ' + (suggestVariants.value.length + 1); suggestVariants.value.push(copy); activeVariantIndex.value = suggestVariants.value.length - 1; loadActiveVariantIntoBuffer(); ensureVariantWindowForIndex(activeVariantIndex.value) }
function removeVariant() { if (suggestVariants.value.length <= 1) return; persistBufferIntoActiveVariant(); suggestVariants.value.splice(activeVariantIndex.value, 1); activeVariantIndex.value = Math.max(0, activeVariantIndex.value - 1); loadActiveVariantIntoBuffer(); ensureVariantWindowForIndex(activeVariantIndex.value) }
watch(removeAvatarBorder, (val) => { try { const v = suggestVariants.value[activeVariantIndex.value]; if (v && v.flags) v.flags.removeProfilePopupBorder = !!val } catch {} })
watch(removeLeaderboardBorder, (val) => { try { const v = suggestVariants.value[activeVariantIndex.value]; if (v && v.flags) v.flags.removeLeaderboardBorder = !!val } catch {} })
watch(removeNavbarBorder, (val) => { try { const v = suggestVariants.value[activeVariantIndex.value]; if (v && v.flags) v.flags.removeNavbarBorder = !!val } catch {} })
watch(() => suggestVariants.value.length, () => { clampVariantWindow(); ensureVariantWindowForIndex(activeVariantIndex.value); measureVariantSlider() })
watch(activeVariantIndex, (i) => { ensureVariantWindowForIndex(i) })
watch(showSuggestionEditor, (val) => { if (val) measureVariantSlider() })
watch(suggestPrice, (val) => { try { const n = Number(val)||0; if (n < 150) suggestPrice.value = 150; else if (n > 500) suggestPrice.value = 500 } catch {} }, { immediate: true })
watch(() => suggestStyles.value.dailyShop, (val) => { try { const v = suggestVariants.value[activeVariantIndex.value]; if (v && v.styles) v.styles.dailyShop = { ...val } } catch {} }, { deep: true })
watch(() => suggestStyles.value.collectionPreview.width, (w) => { try { const s = suggestStyles.value.collectionPreview; s.height = Number(w) } catch {} })
watch(() => suggestStyles.value.cosmeticDesktop.width, (w) => { try { const s = suggestStyles.value.cosmeticDesktop; s.height = Number(w) } catch {} })
watch(() => suggestStyles.value.cosmeticMobile.width, (w) => { try { const s = suggestStyles.value.cosmeticMobile; s.height = Number(w) } catch {} })
watch(() => suggestStyles.value.leaderboard.width, (w) => { try { const s = suggestStyles.value.leaderboard; s.height = Number(w) } catch {} })
watch(() => suggestStyles.value.popupStyle.width, (w) => { try { const s = suggestStyles.value.popupStyle; s.height = Number(w) } catch {} })
watch(() => suggestStyles.value.dailyShop.width, (w) => { try { const s = suggestStyles.value.dailyShop; s.height = Number(w) } catch {} })
watch(() => (suggestAvatarStyle.value ? suggestAvatarStyle.value.width : undefined), (w) => { try { const s = suggestAvatarStyle.value; if (s) s.height = Number(w) } catch {} })

watch(() => suggestStyles.value.navbar.width, (w) => { try { const s = suggestStyles.value.navbar; s.height = Number(w) } catch {} })
const suggestPlacement = ref({ leaderboard: 'inside', avatar: 'inside', navbar: 'inside' })
const suggestAssetPlacements = ref({ leaderboard: [], avatar: [], navbar: [] })
function normalizeSuggestPlacementValue(val) {
  return (val === 'above') ? 'above' : 'inside'
}
function ensureSuggestAssetPlacementsLength(len) {
  try {
    const l = Math.max(0, Number(len) || 0)
    const cur = suggestAssetPlacements.value || {}
    const next = {
      leaderboard: Array.isArray(cur.leaderboard) ? [...cur.leaderboard] : [],
      avatar: Array.isArray(cur.avatar) ? [...cur.avatar] : [],
      navbar: Array.isArray(cur.navbar) ? [...cur.navbar] : []
    }
    const defL = normalizeSuggestPlacementValue('inside')
    const defA = normalizeSuggestPlacementValue('inside')
    const defN = normalizeSuggestPlacementValue('inside')
    for (let i = 0; i < l; i++) {
      next.leaderboard[i] = normalizeSuggestPlacementValue(next.leaderboard[i] ?? defL)
      next.avatar[i] = normalizeSuggestPlacementValue(next.avatar[i] ?? defA)
      next.navbar[i] = normalizeSuggestPlacementValue(next.navbar[i] ?? defN)
    }
    next.leaderboard.length = l
    next.avatar.length = l
    next.navbar.length = l
    suggestAssetPlacements.value = next
  } catch {}
}
function getPlacementForIndex(target, index) {
  try {
    const t = (target === 'leaderboard' || target === 'avatar' || target === 'navbar') ? target : null
    if (!t) return 'inside'
    const idx = Number.isFinite(Number(index)) ? Number(index) : 0
    const arr = suggestAssetPlacements.value && Array.isArray(suggestAssetPlacements.value[t]) ? suggestAssetPlacements.value[t] : []
    return normalizeSuggestPlacementValue(arr[idx])
  } catch { return 'inside' }
}
function setPlacementForIndex(target, index, placement) {
  try {
    const t = (target === 'leaderboard' || target === 'avatar' || target === 'navbar') ? target : null
    if (!t) return
    const idx = Number.isFinite(Number(index)) ? Number(index) : 0
    const p = normalizeSuggestPlacementValue(placement)
    ensureSuggestAssetPlacementsLength(Math.max(idx + 1, Array.isArray(suggestAssetSrcs.value) ? suggestAssetSrcs.value.length : 0))
    const next = { ...suggestAssetPlacements.value }
    const arr = Array.isArray(next[t]) ? [...next[t]] : []
    arr[idx] = p
    next[t] = arr
    suggestAssetPlacements.value = next
    if (activeSuggestAssetIndex.value === idx) {
      suggestPlacement.value = { ...suggestPlacement.value, [t]: p }
    }
  } catch {}
}
function hasAnyPlacementAbove(target) {
  try {
    const t = (target === 'leaderboard' || target === 'avatar' || target === 'navbar') ? target : null
    if (!t) return false
    const arr = suggestAssetPlacements.value && Array.isArray(suggestAssetPlacements.value[t]) ? suggestAssetPlacements.value[t] : []
    return arr.some(p => normalizeSuggestPlacementValue(p) === 'above')
  } catch { return false }
}
loadActiveVariantIntoBuffer()
watch(suggestDevice, (dev, prev) => { try { setActiveSuggestAsset(activeSuggestAssetIndex.value) } catch {} })
watch(suggestAvatarDevice, () => { try { setActiveSuggestAsset(activeSuggestAssetIndex.value) } catch {} })
watch(suggestCosmeticDevice, (dev, prev) => { try { setActiveSuggestAsset(activeSuggestAssetIndex.value) } catch {} })
const hoverPlacementLeaderboard = ref(false)
const hoverPlacementAvatar = ref(false)
const hoverPlacementNavbar = ref(false)
const hoverToggleLeaderboard = ref(false)
const hoverToggleAvatar = ref(false)
const hoverToggleNavbar = ref(false)
function toggleBorder(target) {
  try {
    const v = suggestVariants.value[activeVariantIndex.value]
    if (target === 'leaderboard') {
      removeLeaderboardBorder.value = !removeLeaderboardBorder.value
      if (v && v.flags) v.flags.removeLeaderboardBorder = !!removeLeaderboardBorder.value
    } else if (target === 'avatar') {
      removeAvatarBorder.value = !removeAvatarBorder.value
      if (v && v.flags) v.flags.removeProfilePopupBorder = !!removeAvatarBorder.value
    } else if (target === 'navbar') {
      removeNavbarBorder.value = !removeNavbarBorder.value
      if (v && v.flags) v.flags.removeNavbarBorder = !!removeNavbarBorder.value
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
function bumpNumber(target, key, delta) { try { if (!target || !key) return; const next = Number(target[key] ?? 0); target[key] = next + Number(delta || 0) } catch {} }
function togglePlacement(target){ try { const idx = activeSuggestAssetIndex.value; const current = getPlacementForIndex(target, idx); const next = (current === 'above') ? 'inside' : 'above'; setPlacementForIndex(target, idx, next); const v = suggestVariants.value[activeVariantIndex.value]; if (v && v.flags) { if (target === 'leaderboard') v.flags.leaderboardPlacement = String(next); else if (target === 'avatar') v.flags.profilePopupPlacement = String(next); else if (target === 'navbar') v.flags.navbarPlacement = String(next); } } catch {} }
function getPlacementImg(target, hover){ try { const idx = activeSuggestAssetIndex.value; const isAbove = (getPlacementForIndex(target, idx) === 'above'); if (isAbove) return aboveIcon; return hover ? aboveIcon : insideIcon } catch { return insideIcon } }
function openSuggestEditor() { currentEditingLocalId.value = null; currentEditingServerId.value = null; showSuggestionEditor.value = true; try { syncWeeklyHeight() } catch {} ; try { showPurchasePreview.value = true } catch { showPurchasePreview = true } ; try { suggestAssetSrcs.value = []; suggestAssetStyles.value = []; suggestAssetPlacements.value = { leaderboard: [], avatar: [], navbar: [] }; suggestPlacement.value = { leaderboard: 'inside', avatar: 'inside', navbar: 'inside' }; activeSuggestAssetIndex.value = 0; suggestUrl.value = ''; suggestName.value = ''; previewWindowIndex.value = 0; suggestDevice.value = 'desktop'; suggestAvatarDevice.value = 'desktop'; suggestCosmeticDevice.value = 'desktop'; if (Array.isArray(suggestVariants.value)) { suggestVariants.value.forEach(v => { if (v) { v.assetSrcs = []; v.assetSrc = ''; v.assetStyles = []; v.assetPlacements = { leaderboard: [], avatar: [], navbar: [] } } }) } resetSuggestUsers() } catch {} }
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
    try { if (item && item.meta && item.meta.serverItemId) currentEditingServerId.value = item.meta.serverItemId; else if (item && item._id) currentEditingServerId.value = item._id } catch {}
    try { suggestPrice.value = getItemPrice(item) } catch {}
    try { suggestName.value = String(item && item.name || '').trim() } catch {}
    const variants = []
    if (Array.isArray(item.variants) && item.variants.length > 0) {
      for (const v of item.variants) {
        const a = Array.isArray(v.assets) ? v.assets[0] : null
        const col = (a && a.collectionStyle) || (a && a.style) || {}
        const colMobile = (a && a.collectionStyleMobile) || (a && a.collectionStyle) || (a && a.style) || {}
        const lead = (a && a.leaderboardStyle) || (a && a.style) || {}
        const nav = (a && a.navbarStyle) || (a && a.style) || {}
        const large = (a && a.largeAvatarStyle) || (a && a.profilePopupStyle) || (a && a.style) || {}
        const largeMobile = (a && (a.largeAvatarStyleMobile || a.largeAvatarStyle || a.profilePopupStyle || a.style)) || {}
        const cosmetic = (a && a.cosmeticPreviewStyle) || (a && a.style) || {}
        const cosmeticMobile = (a && (a.cosmeticPreviewStyleMobile || a.cosmeticPreviewStyle || a.style)) || {}
        const daily = (a && a.dailyStyle) || (a && a.style) || {}
        const flags = {
          removeLeaderboardBorder: !!(v && (v.removeLeaderboardBorder || v.removeNavbarBorder) || (item.meta && item.meta.removeLeaderboardBorder)),
          removeProfilePopupBorder: !!(v && (v.removeProfilePopupBorder || v.removeNavbarBorder) || (item.meta && (item.meta.removeProfilePopupBorder || item.meta.removeNavbarBorder))),
          leaderboardPlacement: String(((a && a.meta && a.meta.leaderboardPlacement) || (item.meta && item.meta.leaderboardPlacement) || 'inside')),
          profilePopupPlacement: String(((a && a.meta && (a.meta.profilePopupPlacement ?? a.meta.navbarPlacement)) || (item.meta && (item.meta.profilePopupPlacement ?? item.meta.navbarPlacement)) || 'inside')),
          navbarPlacement: String(((a && a.meta && a.meta.navbarPlacement) || (item.meta && item.meta.navbarPlacement) || 'inside')),
          largeAvatarHeight: Number(((a && a.meta && a.meta.largeAvatarHeight) || (item.meta && item.meta.largeAvatarHeight) || 250))
        }
        const assets = Array.isArray(v && v.assets) ? v.assets : []
        const assetSrcs = assets.map(a => (a && a.src) || '').filter(s => !!s)
        const baseSet = normalizeSuggestStyleSet({ dailyShop: { ...daily }, collectionPreviewDesktop: { ...col }, collectionPreviewMobile: { ...colMobile }, collection: { ...cosmetic }, cosmeticDesktop: { ...cosmetic }, cosmeticMobile: { ...cosmeticMobile }, leaderboard: { ...lead }, navbar: { ...nav }, avatarDesktop: { ...large }, avatarMobile: { ...largeMobile }, avatar: { ...large }, popupStyle: { ...(a && (a.popupStyleStyle || a.style) || {}) } }, makeSuggestStyleSet(DEFAULT_SUGGEST_STYLE))
        const assetStyles = assets.map(x => normalizeSuggestStyleSet({ dailyShop: (x && (x.dailyStyle || x.style)) || {}, collectionPreviewDesktop: (x && (x.collectionStyle || x.style)) || {}, collectionPreviewMobile: (x && (x.collectionStyleMobile || x.collectionStyle || x.style)) || {}, collection: (x && (x.cosmeticPreviewStyle || x.style)) || {}, cosmeticDesktop: (x && (x.cosmeticPreviewStyle || x.style)) || {}, cosmeticMobile: (x && (x.cosmeticPreviewStyleMobile || x.cosmeticPreviewStyle || x.style)) || {}, leaderboard: (x && (x.leaderboardStyle || x.style)) || {}, navbar: (x && (x.navbarStyle || x.style)) || {}, avatarDesktop: (x && (x.largeAvatarStyle || x.profilePopupStyle || x.style)) || {}, avatarMobile: (x && (x.largeAvatarStyleMobile || x.largeAvatarStyle || x.profilePopupStyle || x.style)) || {}, avatar: (x && (x.largeAvatarStyle || x.profilePopupStyle || x.style)) || {}, popupStyle: (x && (x.popupStyleStyle || x.style)) || {} }, baseSet))
        const assetPlacements = {
          leaderboard: assets.map(x => normalizeSuggestPlacementValue((x && x.meta && x.meta.leaderboardPlacement) || flags.leaderboardPlacement || 'inside')),
          avatar: assets.map(x => normalizeSuggestPlacementValue(((x && x.meta && (x.meta.profilePopupPlacement ?? x.meta.navbarPlacement)) || flags.profilePopupPlacement || 'inside'))),
          navbar: assets.map(x => normalizeSuggestPlacementValue((x && x.meta && x.meta.navbarPlacement) || flags.navbarPlacement || 'inside'))
        }
        variants.push({ name: (v && v.name) || 'Style', assetSrcs, assetSrc: assetSrcs[0] || (a && a.src) || '', assetStyles, assetPlacements, styles: { dailyShop: { ...daily }, collectionPreviewDesktop: { ...col }, collectionPreviewMobile: { ...colMobile }, collection: { ...cosmetic }, cosmeticDesktop: { ...cosmetic }, cosmeticMobile: { ...cosmeticMobile }, leaderboard: { ...lead }, navbar: { ...nav }, avatarDesktop: { ...large }, avatarMobile: { ...largeMobile }, avatar: { ...large }, popupStyle: { ...(a && (a.popupStyleStyle || a.style) || {}) } }, flags })
      }
    } else {
      const assets = Array.isArray(item.assets) ? item.assets : []
      const a = assets[0] || null
      const col = (a && a.collectionStyle) || (a && a.style) || {}
      const colMobile = (a && a.collectionStyleMobile) || (a && a.collectionStyle) || (a && a.style) || {}
      const lead = (a && a.leaderboardStyle) || (a && a.style) || {}
      const nav = (a && a.navbarStyle) || (a && a.style) || {}
      const large = (a && a.largeAvatarStyle) || (a && a.profilePopupStyle) || (a && a.style) || {}
      const largeMobile = (a && (a.largeAvatarStyleMobile || a.largeAvatarStyle || a.profilePopupStyle || a.style)) || {}
      const cosmetic = (a && a.cosmeticPreviewStyle) || (a && a.style) || {}
      const cosmeticMobile = (a && (a.cosmeticPreviewStyleMobile || a.cosmeticPreviewStyle || a.style)) || {}
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
      const assetSrcs = assets.map(a => (a && a.src) || '').filter(s => !!s)
      const baseSet = normalizeSuggestStyleSet({ dailyShop: { ...daily }, collectionPreviewDesktop: { ...col }, collectionPreviewMobile: { ...colMobile }, collection: { ...cosmetic }, cosmeticDesktop: { ...cosmetic }, cosmeticMobile: { ...cosmeticMobile }, leaderboard: { ...lead }, navbar: { ...nav }, avatarDesktop: { ...large }, avatarMobile: { ...largeMobile }, avatar: { ...large }, popupStyle: { ...pop } }, makeSuggestStyleSet(DEFAULT_SUGGEST_STYLE))
      const assetStyles = assets.map(x => normalizeSuggestStyleSet({ dailyShop: (x && (x.dailyStyle || x.style)) || {}, collectionPreviewDesktop: (x && (x.collectionStyle || x.style)) || {}, collectionPreviewMobile: (x && (x.collectionStyleMobile || x.collectionStyle || x.style)) || {}, collection: (x && (x.cosmeticPreviewStyle || x.style)) || {}, cosmeticDesktop: (x && (x.cosmeticPreviewStyle || x.style)) || {}, cosmeticMobile: (x && (x.cosmeticPreviewStyleMobile || x.cosmeticPreviewStyle || x.style)) || {}, leaderboard: (x && (x.leaderboardStyle || x.style)) || {}, navbar: (x && (x.navbarStyle || x.style)) || {}, avatarDesktop: (x && (x.largeAvatarStyle || x.profilePopupStyle || x.style)) || {}, avatarMobile: (x && (x.largeAvatarStyleMobile || x.largeAvatarStyle || x.profilePopupStyle || x.style)) || {}, avatar: (x && (x.largeAvatarStyle || x.profilePopupStyle || x.style)) || {}, popupStyle: (x && (x.popupStyleStyle || x.style)) || {} }, baseSet))
      const assetPlacements = {
        leaderboard: assets.map(x => normalizeSuggestPlacementValue((x && x.meta && x.meta.leaderboardPlacement) || flags.leaderboardPlacement || 'inside')),
        avatar: assets.map(x => normalizeSuggestPlacementValue(((x && x.meta && (x.meta.profilePopupPlacement ?? x.meta.navbarPlacement)) || flags.profilePopupPlacement || 'inside'))),
        navbar: assets.map(x => normalizeSuggestPlacementValue((x && x.meta && x.meta.navbarPlacement) || flags.navbarPlacement || 'inside'))
      }
      variants.push({ name: 'Style 1', assetSrcs, assetSrc: assetSrcs[0] || (a && a.src) || '', assetStyles, assetPlacements, styles: { dailyShop: { ...daily }, collectionPreviewDesktop: { ...col }, collectionPreviewMobile: { ...colMobile }, collection: { ...cosmetic }, cosmeticDesktop: { ...cosmetic }, cosmeticMobile: { ...cosmeticMobile }, leaderboard: { ...lead }, navbar: { ...nav }, avatarDesktop: { ...large }, avatarMobile: { ...largeMobile }, avatar: { ...large }, popupStyle: { ...pop } }, flags })
    }
    suggestVariants.value = variants.length ? variants : [ makeVariant('Style 1') ]
    activeVariantIndex.value = 0
    loadActiveVariantIntoBuffer()
    const a0Assets = (Array.isArray(item.variants) && item.variants[0] && Array.isArray(item.variants[0].assets)) ? item.variants[0].assets : (Array.isArray(item.assets) ? item.assets : [])
    const a0Srcs = a0Assets.map(a => (a && a.src) || '').filter(s => !!s)
    try { suggestAssetSrcs.value = a0Srcs.map(s => resolveAssetSrc(s)) } catch { suggestAssetSrcs.value = a0Srcs }
    try {
      const v0 = suggestVariants.value[activeVariantIndex.value]
      const baseSet = normalizeSuggestStyleSet((v0 && v0.styles) || makeSuggestStyleSet(DEFAULT_SUGGEST_STYLE))
      const a0Styles = Array.isArray(v0 && v0.assetStyles) ? v0.assetStyles : a0Assets.map(x => normalizeSuggestStyleSet({ dailyShop: (x && (x.dailyStyle || x.style)) || {}, collectionPreviewDesktop: (x && (x.collectionStyle || x.style)) || {}, collectionPreviewMobile: (x && (x.collectionStyleMobile || x.collectionStyle || x.style)) || {}, collection: (x && (x.cosmeticPreviewStyle || x.style)) || {}, cosmeticDesktop: (x && (x.cosmeticPreviewStyle || x.style)) || {}, cosmeticMobile: (x && (x.cosmeticPreviewStyleMobile || x.cosmeticPreviewStyle || x.style)) || {}, leaderboard: (x && (x.leaderboardStyle || x.style)) || {}, navbar: (x && (x.navbarStyle || x.style)) || {}, avatarDesktop: (x && (x.largeAvatarStyle || x.profilePopupStyle || x.style)) || {}, avatarMobile: (x && (x.largeAvatarStyleMobile || x.largeAvatarStyle || x.profilePopupStyle || x.style)) || {}, avatar: (x && (x.largeAvatarStyle || x.profilePopupStyle || x.style)) || {}, popupStyle: (x && (x.popupStyleStyle || x.style)) || {} }, baseSet))
      suggestAssetStyles.value = a0Styles
      activeSuggestAssetIndex.value = 0
      setActiveSuggestAsset(0)
    } catch {}
    try {
      const v = suggestVariants.value[activeVariantIndex.value]
      const lp = String(v && v.flags && v.flags.leaderboardPlacement || 'inside')
      const ap = String(v && v.flags && v.flags.profilePopupPlacement || 'inside')
      const np = String(v && v.flags && v.flags.navbarPlacement || 'inside')
      suggestPlacement.value = { leaderboard: lp, avatar: ap, navbar: np }
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
function onSuggestFile(e) { try { const f = e.target.files && e.target.files[0]; if (!f) return; const name = String(f.name || '').toLowerCase(); const type = String(f.type || '').toLowerCase(); const isWebp = type === 'image/webp' || name.endsWith('.webp'); const isGif = type === 'image/gif' || name.endsWith('.gif'); if (!isWebp && !isGif) { try { alert('Seuls les fichiers WEBP ou GIF sont acceptés.') } catch {} try { e.target.value = '' } catch {} return } const reader = new FileReader(); reader.onload = () => { const data = reader.result; persistBufferIntoActiveVariant(); const v = suggestVariants.value[activeVariantIndex.value]; const list = (v && Array.isArray(v.assetSrcs)) ? v.assetSrcs : (v && v.assetSrc ? [v.assetSrc] : []); const styleList = (v && Array.isArray(v.assetStyles)) ? v.assetStyles : (Array.isArray(suggestAssetStyles.value) ? suggestAssetStyles.value : []); const nextStyle = normalizeSuggestStyleSet(suggestStyles.value); if (v) { v.assetSrcs = [...list, data]; v.assetSrc = v.assetSrcs[0] || ''; v.assetStyles = [...styleList, nextStyle] } suggestAssetSrcs.value = (v && Array.isArray(v.assetSrcs)) ? [...v.assetSrcs] : [data]; suggestAssetStyles.value = (v && Array.isArray(v.assetStyles)) ? [...v.assetStyles] : [...styleList, nextStyle]; activeSuggestAssetIndex.value = suggestAssetStyles.value.length ? (suggestAssetStyles.value.length - 1) : 0; setPlacementForIndex('leaderboard', activeSuggestAssetIndex.value, suggestPlacement.value.leaderboard); setPlacementForIndex('avatar', activeSuggestAssetIndex.value, suggestPlacement.value.avatar); setPlacementForIndex('navbar', activeSuggestAssetIndex.value, suggestPlacement.value.navbar); setActiveSuggestAsset(activeSuggestAssetIndex.value) }; reader.readAsDataURL(f) } catch {} }
function onSuggestUrl() { try { const u = String(suggestUrl.value || '').trim(); if (!u) return; const raw = u.split('?')[0]; const url = raw + (raw.startsWith('/uploads/') ? `?v=${Date.now()}` : ''); persistBufferIntoActiveVariant(); const v = suggestVariants.value[activeVariantIndex.value]; const list = (v && Array.isArray(v.assetSrcs)) ? v.assetSrcs : (v && v.assetSrc ? [v.assetSrc] : []); const styleList = (v && Array.isArray(v.assetStyles)) ? v.assetStyles : (Array.isArray(suggestAssetStyles.value) ? suggestAssetStyles.value : []); const nextStyle = normalizeSuggestStyleSet(suggestStyles.value); if (v) { v.assetSrcs = [...list, url]; v.assetSrc = v.assetSrcs[0] || ''; v.assetStyles = [...styleList, nextStyle] } suggestAssetSrcs.value = (v && Array.isArray(v.assetSrcs)) ? [...v.assetSrcs] : [url]; suggestAssetStyles.value = (v && Array.isArray(v.assetStyles)) ? [...v.assetStyles] : [...styleList, nextStyle]; activeSuggestAssetIndex.value = suggestAssetStyles.value.length ? (suggestAssetStyles.value.length - 1) : 0; setPlacementForIndex('leaderboard', activeSuggestAssetIndex.value, suggestPlacement.value.leaderboard); setPlacementForIndex('avatar', activeSuggestAssetIndex.value, suggestPlacement.value.avatar); setPlacementForIndex('navbar', activeSuggestAssetIndex.value, suggestPlacement.value.navbar); setActiveSuggestAsset(activeSuggestAssetIndex.value) } catch {} }
function centerSuggest(key) { try { const s = (key === 'collection') ? ((suggestCosmeticDevice.value === 'mobile') ? (suggestStyles.value.cosmeticMobile || suggestStyles.value.collection || {}) : (suggestStyles.value.cosmeticDesktop || suggestStyles.value.collection || {})) : (key === 'avatar' ? (suggestAvatarStyle.value || {}) : (suggestStyles.value[key] || {})); if (!s) return; const root = weeklyContainerRef.value; let el = null; if (key === 'leaderboard') { const sel = (suggestPlacement.value.leaderboard === 'above') ? '.preview-card.preview-leaderboard .leaderboard-item .user-avatar-container' : '.preview-card.preview-leaderboard .avatar-img'; el = root && root.querySelector(sel) } else if (key === 'avatar') { const sel = (suggestPlacement.value.avatar === 'above') ? '.preview-card.preview-avatar .profile-avatar-scaler' : '.preview-card.preview-avatar .avatar-img'; el = root && root.querySelector(sel) } else if (key === 'navbar') { const sel = '.preview-card.preview-navbar .navbar-stage'; el = root && root.querySelector(sel) } else if (key === 'dailyShop') { el = root && root.querySelector('.preview-card.preview-daily-shop .item-img-container') } else if (key === 'collectionPreview') { el = root && root.querySelector('.preview-card.preview-collection .item-img-container') } else if (key === 'popupStyle') { el = root && root.querySelector('.preview-card.preview-popup-style .item-img-container') } else { el = root && root.querySelector('.preview-card.preview-item .item-img-container') }
    const rect = el ? el.getBoundingClientRect() : null
    const avatarStageW = (suggestAvatarDevice.value === 'mobile') ? 100 : 351
    const avatarStageH = (suggestAvatarDevice.value === 'mobile') ? 100 : Number(suggestAvatarStageHeight.value || 250)
    const avatarBox = (suggestAvatarDevice.value === 'mobile') ? 100 : 150
    const avatarBoxW = (suggestPlacement.value.avatar === 'above') ? avatarStageW : avatarBox
    const avatarBoxH = (suggestPlacement.value.avatar === 'above') ? avatarStageH : avatarBox
    const cosmeticBoxW = (suggestCosmeticDevice.value === 'mobile') ? 250 : 350
    const cosmeticBoxH = (suggestCosmeticDevice.value === 'mobile') ? 180 : 145
    const boxW = rect ? rect.width : (key === 'leaderboard' ? 57 : key === 'avatar' ? avatarBoxW : key === 'navbar' ? 57 : key === 'collectionPreview' ? (suggestDevice.value === 'mobile' ? 80 : 90) : key === 'collection' ? cosmeticBoxW : key === 'popupStyle' ? 120.5 : key === 'dailyShop' ? 90 : 100)
    const boxH = rect ? rect.height : (key === 'leaderboard' ? 57 : key === 'avatar' ? avatarBoxH : key === 'navbar' ? 57 : key === 'collectionPreview' ? (suggestDevice.value === 'mobile' ? 80 : 90) : key === 'collection' ? cosmeticBoxH : key === 'popupStyle' ? 64 : key === 'dailyShop' ? 90 : 100); const w = Number(s.width) || 50; const h = Number(s.height || s.width) || 50; s.left = Math.round((boxW - w) / 2); s.top = Math.round((boxH - h) / 2) } catch {} }
function getSuggestAssetsForPlacement(target, placement, isYou) {
  try {
    if (isYou === false) return []
    const list = Array.isArray(suggestAssetSrcs.value) ? suggestAssetSrcs.value : []
    return list
      .map((src, si) => ({ src, si }))
      .filter((asset) => getPlacementForIndex(target, asset.si) === placement)
  } catch { return [] }
}
function getSuggestStackStyle(i) { try { const idx = Number(i) || 0; if (idx <= 0) return {}; const delta = Math.min(24, idx * 6); return { marginLeft: delta + 'px', marginTop: delta + 'px' } } catch { return {} } }
function getSuggestStyle(key, assetIndex) {
  try {
    const set = getSuggestStyleSetForIndex(assetIndex)
    let s = set[key] || {}
    if (key === 'collectionPreview') {
      s = (suggestDevice.value === 'mobile') ? (set.collectionPreviewMobile || set.collectionPreview || set.collection || {}) : (set.collectionPreviewDesktop || set.collectionPreview || set.collection || {})
    } else if (key === 'avatar') {
      s = (suggestAvatarDevice.value === 'mobile') ? (set.avatarMobile || DEFAULT_SUGGEST_STYLE) : (set.avatarDesktop || DEFAULT_SUGGEST_STYLE)
    } else if (key === 'collection') {
      s = (suggestCosmeticDevice.value === 'mobile') ? (set.cosmeticMobile || set.collection || {}) : (set.cosmeticDesktop || set.collection || {})
    }
    const style = { position: 'absolute' }
    if (typeof s.top === 'number') style.top = s.top + 'px'
    if (typeof s.left === 'number') style.left = s.left + 'px'
    if (typeof s.width === 'number') style.width = s.width + 'px'
    if (typeof s.height === 'number') style.height = s.height + 'px'
    if (typeof s.rotate === 'number') style.transform = `rotate(${s.rotate}deg)`
    if (typeof s.zIndex === 'number') style.zIndex = s.zIndex
    try {
      const isAvatarAbove = (key === 'avatar' && getPlacementForIndex('avatar', assetIndex) === 'above')
      const isLeaderboardAbove = (key === 'leaderboard' && getPlacementForIndex('leaderboard', assetIndex) === 'above')
      const isNavbarAbove = (key === 'navbar' && getPlacementForIndex('navbar', assetIndex) === 'above')
      if (isAvatarAbove || isLeaderboardAbove || isNavbarAbove) {
        style.zIndex = Math.max(Number(style.zIndex || 0), 100)
      }
    } catch {}
    if (typeof s.objectFit === 'string') style.objectFit = s.objectFit
    if (typeof s.margin === 'number') style.margin = s.margin + 'px'
    if (typeof s.padding === 'number') style.padding = s.padding + 'px'
    if (s.background) style.background = s.background
    if (s.boxShadow) style.boxShadow = s.boxShadow
    if (typeof s.borderWidth === 'number') style.borderWidth = s.borderWidth + 'px'
    if (typeof s.borderStyle === 'string') style.borderStyle = s.borderStyle
    if (s.borderColor) style.borderColor = s.borderColor
    if (typeof s.borderRadius === 'number') style.borderRadius = s.borderRadius + 'px'
    return style
  } catch {
    return { position: 'absolute' }
  }
}
const suggestPreviewBorderColor = ref(null)
function refreshSuggestPreviewBorderColor() { try { const root = weeklyContainerRef.value; const sels = ['.preview-card.preview-collection .item-img-wrapper.large', '.preview-card.preview-daily-shop .item-img-wrapper.large', '.preview-card.preview-avatar .profile-avatar-stage']; let color = ''; for (const s of sels) { const el = root && root.querySelector(s); if (!el) continue; const cs = window.getComputedStyle(el); const c = cs.getPropertyValue('border-color') || cs.borderColor || ''; if (c && c !== 'transparent') { color = c; break } } suggestPreviewBorderColor.value = color || '#00FF80' } catch { suggestPreviewBorderColor.value = '#00FF80' } }
function getPopupWrapperStyle() { try { const c = suggestPreviewBorderColor.value || '#00FF80'; return { borderColor: c } } catch { return {} } }
function getNavbarStageStyle() { try { const hasBorder = !removeNavbarBorder.value; return { position: 'relative', width: '57px', height: '57px', border: hasBorder ? '3px #000 solid' : 'none', borderRadius: '12px', boxShadow: hasBorder ? '0 4px 16px #0002, 0 1.5px 6px #0001' : 'none', overflow: 'hidden' } } catch { return {} } }
function getNavbarAccountBtnStyle() { try { return { position: 'relative', width: '100%', height: '100%' } } catch { return {} } }
const draggingKey = ref(null)
const dragStart = ref({ x: 0, y: 0 })
const initialPos = ref({ top: 0, left: 0 })
let rafId = null
function getDragStyleForKey(key) { try { if (key === 'collection') { return (suggestCosmeticDevice.value === 'mobile') ? (suggestStyles.value.cosmeticMobile || suggestStyles.value.collection || {}) : (suggestStyles.value.cosmeticDesktop || suggestStyles.value.collection || {}) } if (key === 'avatar') { return suggestAvatarStyle.value || {} } return suggestStyles.value[key] || {} } catch { return {} } }
function startDrag(key, assetIndex, e) { try { setActiveSuggestAsset(assetIndex); if (draggingKey.value === key) { endDrag(); return } draggingKey.value = key; dragStart.value = { x: e.clientX, y: e.clientY }; const s = getDragStyleForKey(key); initialPos.value = { top: Number(s.top)||0, left: Number(s.left)||0 }; window.addEventListener('mousemove', onDrag, { passive: true }); setTimeout(() => { window.addEventListener('click', handleDropClick, { once: true }) }, 0) } catch {} }
function handleDropClick() { try { endDrag() } catch {} }
function onDrag(e) { try { if (!draggingKey.value) return; const key = draggingKey.value; const s = getDragStyleForKey(key); const dx = e.clientX - dragStart.value.x; const dy = e.clientY - dragStart.value.y; if (rafId) cancelAnimationFrame(rafId); rafId = requestAnimationFrame(() => { s.left = initialPos.value.left + dx; s.top = initialPos.value.top + dy }) } catch {} }
function endDrag() { try { draggingKey.value = null; window.removeEventListener('mousemove', onDrag) } catch {} }
function startDragTouch(key, assetIndex, e) { try { const t = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]); if (!t) return; e.preventDefault(); setActiveSuggestAsset(assetIndex); if (draggingKey.value === key) { endDragTouch(); return } draggingKey.value = key; dragStart.value = { x: t.clientX, y: t.clientY }; const s = getDragStyleForKey(key); initialPos.value = { top: Number(s.top)||0, left: Number(s.left)||0 }; window.addEventListener('touchmove', onDragTouch, { passive: false }); window.addEventListener('touchend', endDragTouch, { once: true }) } catch {} }
function onDragTouch(e) { try { if (!draggingKey.value) return; const t = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]); if (!t) return; e.preventDefault(); const key = draggingKey.value; const s = getDragStyleForKey(key); const dx = t.clientX - dragStart.value.x; const dy = t.clientY - dragStart.value.y; if (rafId) cancelAnimationFrame(rafId); rafId = requestAnimationFrame(() => { s.left = initialPos.value.left + dx; s.top = initialPos.value.top + dy }) } catch {} }
function endDragTouch() { try { draggingKey.value = null; window.removeEventListener('touchmove', onDragTouch) } catch {} }
function saveSuggestion() {
  try {
    persistBufferIntoActiveVariant()
    const uidAtStart = String((authStore.user && (authStore.user.id || authStore.user._id)) || 'anon')
    const leaderboardPlacement = String(getPlacementForIndex('leaderboard', 0) || 'inside')
    const avatarPlacement = String(getPlacementForIndex('avatar', 0) || 'inside')
    const navbarPlacement = String(getPlacementForIndex('navbar', 0) || 'inside')
    const baseAssetSrcs = (Array.isArray(suggestAssetSrcs.value) && suggestAssetSrcs.value.length) ? suggestAssetSrcs.value : ['']
    const baseNavbarPlacements = baseAssetSrcs.map((_, i) => String(getPlacementForIndex('navbar', i) || 'inside'))
    const baseMeta = {
      leaderboardPlacement,
      leaderboardTarget: leaderboardPlacement === 'inside' ? 'user-avatar' : 'user-avatar-container',
      profilePopupPlacement: avatarPlacement,
      profilePopupTarget: avatarPlacement === 'inside' ? 'profile-avatar' : 'profile-avatar-scaler',
      navbarPlacement,
      navbarTarget: navbarPlacement === 'inside' ? 'avatar-image-container' : 'user-account-wrapper',
      navbarPlacements: baseNavbarPlacements,
      largeAvatarHeight: Number(suggestAvatarStageHeight.value || 250)
    }
    const baseAssetStyles = Array.isArray(suggestAssetStyles.value) ? suggestAssetStyles.value : []
    const baseAssets = baseAssetSrcs.map((src, i) => {
      const set = normalizeSuggestStyleSet(baseAssetStyles[i], suggestStyles.value)
      const lbPlacement = String(getPlacementForIndex('leaderboard', i) || 'inside')
      const avPlacement = String(getPlacementForIndex('avatar', i) || 'inside')
      const nbPlacement = String(getPlacementForIndex('navbar', i) || 'inside')
      return {
        src: src || '',
        style: { ...set.dailyShop },
        collectionStyle: { ...(set.collectionPreviewDesktop || set.collectionPreview || set.collection) },
        collectionStyleMobile: { ...(set.collectionPreviewMobile || set.collectionPreview || set.collection) },
        leaderboardStyle: { ...set.leaderboard },
        navbarStyle: { ...set.navbar },
        navbarStyleMobile: { ...set.navbar },
        largeAvatarStyle: { ...(set.avatarDesktop || DEFAULT_SUGGEST_STYLE) },
        largeAvatarStyleMobile: { ...(set.avatarMobile || DEFAULT_SUGGEST_STYLE) },
        profilePopupStyle: { ...(set.avatarDesktop || DEFAULT_SUGGEST_STYLE) },
        popupStyleStyle: { ...set.popupStyle },
        cosmeticPreviewStyle: { ...(set.cosmeticDesktop || set.collection) },
        cosmeticPreviewStyleMobile: { ...(set.cosmeticMobile || set.cosmeticDesktop || set.collection) },
        dailyStyle: { ...set.dailyShop },
        meta: {
          ...baseMeta,
          leaderboardPlacement: lbPlacement,
          leaderboardTarget: lbPlacement === 'inside' ? 'user-avatar' : 'user-avatar-container',
          profilePopupPlacement: avPlacement,
          profilePopupTarget: avPlacement === 'inside' ? 'profile-avatar' : 'profile-avatar-scaler',
          navbarPlacement: nbPlacement,
          navbarTarget: nbPlacement === 'inside' ? 'avatar-image-container' : 'user-account-wrapper',
          largeAvatarHeight: Number(suggestAvatarStageHeight.value || 250)
        }
      }
    })
    const finalName = String(suggestName.value || '').trim() || 'Suggestion'
    const payload = {
      legacyId: null,
      name: finalName,
      isSuggested: true,
      price: Math.min(500, Math.max(150, Number(suggestPrice.value) || 0)),
      type: 'generic',
      assets: baseAssets,
      backgrounds: { collection: null, leaderboard: null, avatar: null, navbar: null, 'popup-style': null, 'profile-popup': null },
      meta: { ...baseMeta },
      variants: suggestVariants.value.map(v => {
        const vSrcs = (Array.isArray(v.assetSrcs) && v.assetSrcs.length) ? v.assetSrcs : (v.assetSrc ? [v.assetSrc] : [''])
        const vStyles = Array.isArray(v.assetStyles) ? v.assetStyles : []
        const vp = v.assetPlacements || {}
        const vNavbarPlacements = vSrcs.map((_, i) => normalizeSuggestPlacementValue((Array.isArray(vp.navbar) ? vp.navbar[i] : null) || baseNavbarPlacements[i] || 'inside'))
        return {
          name: v.name || 'Style',
          assets: vSrcs.map((src, i) => {
            const set = normalizeSuggestStyleSet(vStyles[i], v.styles || makeSuggestStyleSet(DEFAULT_SUGGEST_STYLE))
            const lbPlacement = normalizeSuggestPlacementValue((Array.isArray(vp.leaderboard) ? vp.leaderboard[i] : null) || 'inside')
            const avPlacement = normalizeSuggestPlacementValue((Array.isArray(vp.avatar) ? vp.avatar[i] : null) || 'inside')
            const nbPlacement = normalizeSuggestPlacementValue((Array.isArray(vp.navbar) ? vp.navbar[i] : null) || baseNavbarPlacements[i] || 'inside')
            return {
              src: src || '',
              style: { ...set.dailyShop },
              collectionStyle: { ...(set.collectionPreviewDesktop || set.collectionPreview || set.collection) },
              collectionStyleMobile: { ...(set.collectionPreviewMobile || set.collectionPreview || set.collection) },
              leaderboardStyle: { ...set.leaderboard },
              navbarStyle: { ...set.navbar },
              navbarStyleMobile: { ...set.navbar },
              largeAvatarStyle: { ...(set.avatarDesktop || DEFAULT_SUGGEST_STYLE) },
              largeAvatarStyleMobile: { ...(set.avatarMobile || DEFAULT_SUGGEST_STYLE) },
              profilePopupStyle: { ...(set.avatarDesktop || DEFAULT_SUGGEST_STYLE) },
              popupStyleStyle: { ...set.popupStyle },
              cosmeticPreviewStyle: { ...(set.cosmeticDesktop || set.collection) },
              cosmeticPreviewStyleMobile: { ...(set.cosmeticMobile || set.cosmeticDesktop || set.collection) },
              dailyStyle: { ...set.dailyShop },
              meta: {
                leaderboardPlacement: String(lbPlacement || 'inside'),
                leaderboardTarget: (String(lbPlacement || 'inside') === 'inside') ? 'user-avatar' : 'user-avatar-container',
                profilePopupPlacement: String(avPlacement || 'inside'),
                profilePopupTarget: (String(avPlacement || 'inside') === 'inside') ? 'profile-avatar' : 'profile-avatar-scaler',
                navbarPlacement: String(nbPlacement || 'inside'),
                navbarTarget: (String(nbPlacement || 'inside') === 'inside') ? 'avatar-image-container' : 'user-account-wrapper',
                largeAvatarHeight: Number(v.flags.largeAvatarHeight || suggestAvatarStageHeight.value || 250)
              }
            }
          }),
          navbarPlacements: vNavbarPlacements,
          backgrounds: { collection: null, leaderboard: null, avatar: null, 'popup-style': null, 'profile-popup': null },
          removeLeaderboardBorder: !!v.flags.removeLeaderboardBorder,
          removeProfilePopupBorder: !!v.flags.removeProfilePopupBorder,
          removeNavbarBorder: !!v.flags.removeNavbarBorder
        }
      })
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
      let editingServerId = currentEditingServerId.value ? String(currentEditingServerId.value) : (payload.meta && payload.meta.serverItemId ? String(payload.meta.serverItemId) : null)
      if (!editingServerId) {
        try {
          const params = []
          const legacyId = Number(payload.legacyId)
          if (Number.isFinite(legacyId)) params.push(`legacyId=${legacyId}`)
          const locId = payload.meta && payload.meta.localItemId
          if (locId) params.push(`localItemId=${encodeURIComponent(String(locId))}`)
          const name = String(payload.name || '').trim()
          if (name && name !== 'Suggestion') params.push(`name=${encodeURIComponent(name)}`)
          if (params.length) {
            const res = await secureApiCall(`/items/suggest/resolve?${params.join('&')}`)
            if (res && res.success && res.item && res.item._id) editingServerId = String(res.item._id)
          }
        } catch {}
      }
      if (editingServerId && !payload.meta.serverItemId) payload.meta.serverItemId = editingServerId

      if (isAdminOnly && isAdminOnly.value) {
        try {
          const endpoint = editingServerId ? (`/items/${editingServerId}`) : '/items'
          const method = editingServerId ? 'PUT' : 'POST'
          const res = await secureApiCall(endpoint, { method, body: JSON.stringify(payload) })
          if (res && res.success) {
            alert(editingServerId ? 'Item mis à jour' : 'Item créé')
            try { window.dispatchEvent(new CustomEvent('items-changed')) } catch {}
            try { await loadDynamicItems() } catch {}
            return
          }
        } catch {}
      } else {
        try {
          const endpoint = editingServerId ? (`/items/suggest/${editingServerId}`) : '/items/suggest'
          const method = editingServerId ? 'PUT' : 'POST'
          const res = await secureApiCall(endpoint, { method, body: JSON.stringify(payload) })
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
            alert(editingServerId ? 'Item mis à jour' : 'Item enregistré et visible dans la Collection')
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
const profilePopupLargeAvatarIsMobile = ref(false)
function updateProfilePopupLargeAvatarIsMobile() {
  try {
    if (window && typeof window.matchMedia === 'function') {
      profilePopupLargeAvatarIsMobile.value = window.matchMedia('(max-width: 1218px)').matches
      return
    }
    if (window && typeof window.innerWidth === 'number') {
      profilePopupLargeAvatarIsMobile.value = window.innerWidth <= 1218
      return
    }
  } catch {}
  profilePopupLargeAvatarIsMobile.value = false
}
function updateIsMobile() {
  try {
    if (window && typeof window.matchMedia === 'function') {
      isMobile.value = window.matchMedia('(max-width: 1218px)').matches
    } else {
      isMobile.value = window.innerWidth <= 1218
    }
  } catch {
    isMobile.value = false
  }
  updateProfilePopupLargeAvatarIsMobile()
}

function isProfilePopupLargeAvatarMobile() {
  return !!profilePopupLargeAvatarIsMobile.value
}
function shouldForceLeaderboardProfilePopupDesktop() {
  return !!showUserProfile.value
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
      syncCurrentUserDynamicVariants()
    })
  } catch {}
  // Écouter les updates de note publique des utilisateurs (profil/leaderboard)
  try { window.addEventListener('user-public-note-changed', handleUserPublicNoteChanged) } catch {}
  try { window.addEventListener('message', handlePopupYouTubeMessage) } catch {}
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
  try { window.removeEventListener('message', handlePopupYouTubeMessage) } catch {}
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
  const mobile = !!isMobile.value
  const s = mobile
    ? ((asset && asset.leaderboardStyleMobile) || asset?.leaderboardStyle || asset?.style || {})
    : ((asset && asset.leaderboardStyle) || asset?.leaderboardStyleMobile || asset?.style || {})
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

    const ps = asset?.profilePopupStyle
    const pt = typeof ps?.top === 'number' ? ps.top : 0
    const pl = typeof ps?.left === 'number' ? ps.left : 0
    const pw = typeof ps?.width === 'number' ? ps.width : 100
    const pr = typeof ps?.rotate === 'number' ? ps.rotate : 0
    const pNonDefault = !(pt === 0 && pl === 0 && pw === 100 && pr === 0)
    if (pNonDefault) return 'profile-avatar-scaler'

    // Heuristique legacy: si largeAvatarStyle non-défaut et aucune cible explicite → scaler
    const mobile = isProfilePopupLargeAvatarMobile()
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

function getDynProfilePopupAssetStyle(asset, preferProfilePopup = false) {
  const isDefault = (s) => {
    if (!s || typeof s !== 'object') return true
    const t = typeof s.top === 'number' ? s.top : 0
    const l = typeof s.left === 'number' ? s.left : 0
    const w = typeof s.width === 'number' ? s.width : 100
    const r = typeof s.rotate === 'number' ? s.rotate : 0
    return t === 0 && l === 0 && w === 100 && r === 0
  }

  // Priorité à largeAvatarStyle si défini (non-défaut), sinon profilePopupStyle
  const forceDesktop = shouldForceLeaderboardProfilePopupDesktop()
  const mobile = !forceDesktop && isProfilePopupLargeAvatarMobile()
  const largeMobile = asset?.largeAvatarStyleMobile
  const largeDesktop = asset?.largeAvatarStyle
  const largeStyle = mobile ? largeMobile : largeDesktop
  const largeIsSet = largeStyle && !isDefault(largeStyle)
  const useLarge = !preferProfilePopup && (mobile ? !!largeMobile : largeIsSet)

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

function getProfilePopupStageInlineStyle(user) {
  try {
    const item = getUserEquippedItemData(user)
    const h = getLargeAvatarHeight(item)
    return `height: ${h}px !important; margin: 0 auto`
  } catch { return '' }
}

function getProfilePopupScalerInlineStyle(user) {
  try {
    const item = getUserEquippedItemData(user)
    const h = getLargeAvatarHeight(item)
    return `height: ${h}px !important`
  } catch { return '' }
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

function getLeaderboardAssetsUnified(item, owner) {
  try {
    if (!item) return []
    if (Array.isArray(item.variants) && item.variants.length > 0) {
      return getDynVariantAssetsForLeaderboard(owner, item)
    }
    return Array.isArray(item.assets) ? item.assets : []
  } catch { return [] }
}
function getLeaderboardAssetsForTargetPlacement(owner, item, target, placement) {
  try {
    const arr = getLeaderboardAssetsUnified(item, owner)
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
    const nm = String(item.name || '').toLowerCase()
    if (nm === 'galaxie' || nm === 'galaxy' || nm === 'coeur' || nm === 'planify' || nm === 'admin planify' || nm === 'prestige' || nm === 'alpha') return true
    if (item.displayType === 'coeur' || item.displayType === 'alpha' || item.displayType === 'admin-planify' || item.displayType === 'galaxie') return true
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
    const nm = String(item.name || '').toLowerCase()
    if (nm === 'galaxie' || nm === 'galaxy' || nm === 'coeur' || nm === 'planify' || nm === 'prestige') return true
    if (item.displayType === 'coeur') return true
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
  const mobile = !!isMobile.value
  const s = mobile
    ? ((asset && asset.leaderboardStyleMobile) || asset?.leaderboardStyle || asset?.style || {})
    : ((asset && asset.leaderboardStyle) || asset?.leaderboardStyleMobile || asset?.style || {})
  const style = {
    position: 'absolute',
    objectFit: s.objectFit || 'contain',
    zIndex: 100,
    pointerEvents: 'none'
  }
  if (typeof s.top === 'number') style.top = s.top + 'px'
  if (typeof s.left === 'number') style.left = (s.left + 0) + 'px'
  if (typeof s.width === 'number') style.width = s.width + 'px'
  if (typeof s.height === 'number') style.height = s.height + 'px'
  if (typeof s.rotate === 'number') style.transform = `rotate(${s.rotate}deg)`
  return style
}

// Déterminer la cible effective (avatar vs container) pour un asset dynamique
function getEffectiveLeaderboardTarget(item, asset, owner) {
  try {
    if (item && item.isDynamic) {
      const explicit = asset && asset.meta && asset.meta.leaderboardTarget
      if (explicit) return String(explicit)
      const legacy = asset && asset.meta && asset.meta.container === 'user-avatar-container'
      if (legacy) return 'user-avatar-container'
      try {
        const itemLevel = item && item.meta && (item.meta.leaderboardTarget || (item.meta.container === 'user-avatar-container' ? 'user-avatar-container' : null))
        if (itemLevel) return String(itemLevel)
      } catch {}
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

const selectedDepartmentLogoSrc = computed(() => {
  try {
    const d = String((selectedUser.value && (selectedUser.value.department || selectedUser.value['etude'])) || '').trim().toUpperCase()
    switch (d) {
      case 'MMI': return mmiPill
      case 'TC': return tcPill
      case 'INFO': return infoPill
      case 'INFOCOM': return infocomPill
      case 'GEA': return geaPill
      default: return null
    }
  } catch { return null }
})

const selectedUserMusicSrc = computed(() => {
  try {
    const u = selectedUser.value || {}
    const raw = u.musicSrc || u.musicUrl || u.musicLink || (u.music && u.music.src) || u.music
    return typeof raw === 'string' ? raw.trim() : ''
  } catch { return '' }
})

const selectedUserMusicTitle = computed(() => {
  try {
    const u = selectedUser.value || {}
    const raw = u.musicTitle || u.musicName || (u.music && u.music.title) || ''
    const title = typeof raw === 'string' ? raw.trim() : ''
    return title || 'Aucune musique'
  } catch { return 'Aucune musique' }
})

function isValidYouTubeUrl(u) {
  try {
    const s = String(u || '').trim()
    return /^https?:\/\/(www\.)?(youtube\.com\/(watch\?v=[^&\s]+|shorts\/[^?\s]+)|youtu\.be\/[^?\s]+)/i.test(s)
  } catch { return false }
}
const popupYouTubeIframeRef = ref(null)
const isPopupYouTube = computed(() => isValidYouTubeUrl(selectedUserMusicSrc.value || ''))
let popupYouTubeProgressTimer = null
let popupClipStart = 0
let popupClipEnd = null
function extractYouTubeId(u) {
  try {
    const s = String(u || '').trim()
    let m = s.match(/[?&]v=([A-Za-z0-9_-]{6,})/)
    if (m && m[1]) return m[1]
    m = s.match(/youtu\.be\/([A-Za-z0-9_-]{6,})/)
    if (m && m[1]) return m[1]
    m = s.match(/shorts\/([A-Za-z0-9_-]{6,})/)
    if (m && m[1]) return m[1]
    return ''
  } catch { return '' }
}
function getPopupYouTubeEmbedUrl(url) {
  try {
    const id = extractYouTubeId(url)
    if (!id) return url
    const origin = typeof window !== 'undefined' ? encodeURIComponent(window.location.origin) : ''
    return `https://www.youtube.com/embed/${id}?enablejsapi=1&playsinline=1&origin=${origin}`
  } catch { return url }
}
function sendPopupYouTubeCommand(cmd, args = []) {
  try {
    const f = popupYouTubeIframeRef?.value
    if (!f || !f.contentWindow) return
    f.contentWindow.postMessage(JSON.stringify({ event: 'command', func: cmd, args }), '*')
  } catch {}
}
function startPopupYouTubeProgressPolling() {
  try { stopPopupYouTubeProgressPolling() } catch {}
  popupYouTubeProgressTimer = setInterval(() => {
    try { sendPopupYouTubeCommand('getCurrentTime') } catch {}
  }, 500)
  try { sendPopupYouTubeCommand('getDuration') } catch {}
}
function stopPopupYouTubeProgressPolling() {
  try {
    if (popupYouTubeProgressTimer) {
      clearInterval(popupYouTubeProgressTimer)
      popupYouTubeProgressTimer = null
    }
  } catch {}
}
function handlePopupYouTubeMessage(e) {
  try {
    const origin = String(e.origin || '')
    if (!/youtube\.com|youtube\-nocookie\.com/i.test(origin)) return
    let data = e.data
    if (typeof data === 'string') { try { data = JSON.parse(data) } catch {} }
    if (!data) return
    if (data.event === 'onReady') {
      sendPopupYouTubeCommand('getDuration')
      sendPopupYouTubeCommand('getCurrentTime')
      sendPopupYouTubeCommand('addEventListener', ['onStateChange'])
      return
    }
    if (data.event === 'onStateChange') {
      const s = Number(data.info)
      if (s === 1 || s === 3) { isPopupPlaying.value = true; startPopupYouTubeProgressPolling() }
      else if (s === 2 || s === 0) { isPopupPlaying.value = false; stopPopupYouTubeProgressPolling() }
    }
    if (data.event === 'infoDelivery' && data.info) {
      const info = data.info || {}
      if (typeof info.currentTime === 'number') popupProgress.value = Number(info.currentTime || 0)
      if (typeof info.duration === 'number' && info.duration > 0) popupDuration.value = Number(info.duration || 0)
      if (typeof popupClipEnd === 'number' && isFinite(popupClipEnd) && info.currentTime >= popupClipEnd - 0.05) {
        sendPopupYouTubeCommand('pauseVideo')
        isPopupPlaying.value = false
        stopPopupYouTubeProgressPolling()
      }
    }
  } catch {}
}
function subscribePopupYouTubePlayer() {
  try {
    const iframe = popupYouTubeIframeRef?.value
    if (!iframe || !iframe.contentWindow) return
    const id = iframe.id || 'leaderboard-youtube-player'
    iframe.contentWindow.postMessage(JSON.stringify({ event: 'listening', id, channel: 'widget' }), '*')
    iframe.contentWindow.postMessage(JSON.stringify({ event: 'listening', id }), '*')
    sendPopupYouTubeCommand('addEventListener', ['onReady'])
    sendPopupYouTubeCommand('addEventListener', ['onStateChange'])
    sendPopupYouTubeCommand('getDuration')
    sendPopupYouTubeCommand('getCurrentTime')
  } catch {}
}

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
  const isYt = isValidYouTubeUrl(selectedUserMusicSrc.value || '')
  const el = popupAudioEl?.value
  let wasPlaying = false
  if (isYt) {
    if (isPopupPlaying.value) { wasPlaying = true; sendPopupYouTubeCommand('pauseVideo') }
  } else if (el && !el.paused) {
    wasPlaying = true
    el.pause()
  }
  const updateProgress = (clientX) => {
    const rect = container.getBoundingClientRect()
    const offsetX = clientX - rect.left
    const width = rect.width
    if (width <= 0) return
    const pct = Math.max(0, Math.min(1, offsetX / width))
    const dur = Number(popupDuration.value) || 0
    popupProgress.value = pct * dur
    if (isYt) {
      if (dur > 0) sendPopupYouTubeCommand('seekTo', [Math.max(0, Math.min(popupProgress.value, dur)), true])
    } else if (el && Number.isFinite(el.duration)) {
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
    if (wasPlaying) {
      if (isYt) sendPopupYouTubeCommand('playVideo')
      else if (el) el.play().catch(() => {})
    }
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
    const isYt = isValidYouTubeUrl(selectedUserMusicSrc.value || '')
    if (next) {
      if (popupMusicVolume.value > 0) { previousPopupVolume.value = popupMusicVolume.value }
      popupMusicVolume.value = 0
      if (el) el.muted = true
      if (isYt) { sendPopupYouTubeCommand('mute'); sendPopupYouTubeCommand('setVolume', [0]) }
    } else {
      popupMusicVolume.value = previousPopupVolume.value > 0 ? previousPopupVolume.value : 60
      if (el) el.muted = false
      if (isYt) { sendPopupYouTubeCommand('unMute'); sendPopupYouTubeCommand('setVolume', [Math.round(Math.max(0, Math.min(100, Number(popupMusicVolume.value) || 0)))]) }
    }
  } catch {}
}

// Variables pour les factions
const factionUsers = ref({ bagnat: [], fermier: [] })
const factionLoading = ref(false)
const userFaction = ref(null)
const justJoinedFaction = ref(null)
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
  if (!selectedUser?.value) return
  const isYt = isValidYouTubeUrl(selectedUserMusicSrc.value || '')
  const start = typeof selectedUser.value.musicStartSeconds === 'number' ? selectedUser.value.musicStartSeconds : 0
  const dur = typeof selectedUser.value.musicDurationSeconds === 'number' ? selectedUser.value.musicDurationSeconds : null
  const end = dur ? start + dur : Infinity
  popupClipStart = start
  popupClipEnd = end

  if (isYt) {
    const v100 = Math.round(Math.max(0, Math.min(100, Number(popupMusicVolume.value) || 0)))
    sendPopupYouTubeCommand('setVolume', [v100])
    if (v100 > 0) sendPopupYouTubeCommand('unMute')
    else sendPopupYouTubeCommand('mute')
    if (!isPopupPlaying.value) {
      sendPopupYouTubeCommand('seekTo', [start, true])
      sendPopupYouTubeCommand('playVideo')
      startPopupYouTubeProgressPolling()
      isPopupPlaying.value = true
    } else {
      sendPopupYouTubeCommand('pauseVideo')
      stopPopupYouTubeProgressPolling()
      isPopupPlaying.value = false
    }
    return
  }

  const el = popupAudioEl.value
  if (!el) return
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
  const v100 = Math.round(Math.max(0, Math.min(100, Number(v) || 0)))
  try { if (el) setPopupElVolume(el, vol) } catch {}
  try {
    if (isValidYouTubeUrl(selectedUserMusicSrc.value || '')) {
      sendPopupYouTubeCommand('setVolume', [v100])
      if (v100 > 0) { sendPopupYouTubeCommand('unMute'); if (isPopupMuted.value) isPopupMuted.value = false }
      else { sendPopupYouTubeCommand('mute') }
    }
  } catch {}
  try {
    localStorage.setItem('musicVolume', String(v100))
  } catch {}
})

watch(selectedUserMusicSrc, (src) => {
  try {
    isPopupPlaying.value = false
    popupProgress.value = 0
    popupDuration.value = 0
    popupClipStart = 0
    popupClipEnd = null
    stopPopupYouTubeProgressPolling()
    if (isValidYouTubeUrl(src || '')) {
      try { subscribePopupYouTubePlayer() } catch {}
    } else {
      const el = popupAudioEl?.value
      if (el) {
        el.pause()
        el.currentTime = 0
        try { el.load() } catch {}
      }
    }
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
    try { sendPopupYouTubeCommand('stopVideo') } catch {}
    try { stopPopupYouTubeProgressPolling() } catch {}
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

function syncCurrentUserDynamicVariants() {
  try {
    const variantsObj = Object.fromEntries(coinsStore.dynamicItemVariants)
    if (selectedUser.value && isCurrentUser(selectedUser.value)) {
      selectedUser.value = { ...selectedUser.value, dynamicItemVariants: variantsObj }
    }
    if (currentUserFactionEntry.value && isCurrentUser(currentUserFactionEntry.value)) {
      currentUserFactionEntry.value = { ...currentUserFactionEntry.value, dynamicItemVariants: variantsObj }
    }
    if (Array.isArray(leaderboardUsers.value) && leaderboardUsers.value.length) {
      leaderboardUsers.value = leaderboardUsers.value.map(u => {
        return isCurrentUser(u) ? { ...u, dynamicItemVariants: variantsObj } : u
      })
    }
    if (factionUsers.value) {
      const bagnat = Array.isArray(factionUsers.value.bagnat)
        ? factionUsers.value.bagnat.map(u => isCurrentUser(u) ? { ...u, dynamicItemVariants: variantsObj } : u)
        : []
      const fermier = Array.isArray(factionUsers.value.fermier)
        ? factionUsers.value.fermier.map(u => isCurrentUser(u) ? { ...u, dynamicItemVariants: variantsObj } : u)
        : []
      factionUsers.value = { ...factionUsers.value, bagnat, fermier }
    }
    if (authStore.user && isCurrentUser(authStore.user)) {
      authStore.user = { ...authStore.user, dynamicItemVariants: variantsObj }
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
    left: '65px',
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

  const normalizedIdRaw = (item && (item.legacyId ?? item.id))
  if (normalizedIdRaw == null) return
  const normalizedIdNum = Number(normalizedIdRaw)
  const useNumericId = Number.isFinite(normalizedIdNum)
  const variantKey = useNumericId ? normalizedIdNum : String(normalizedIdRaw)

  // Mode suggestion: mise à jour locale uniquement, pas d'appel API
  if (showSuggestionEditor.value) {
    try {
      // On met à jour directement le Map local du store sans appeler le setter qui déclenche l'API
      coinsStore.dynamicItemVariants.set(variantKey, idx)
      try { localStorage.setItem('dynamicItemVariants', JSON.stringify(Object.fromEntries(coinsStore.dynamicItemVariants))) } catch {}
      variantUpdateKey.value++
      window.dispatchEvent(new CustomEvent('dynamic-variant-changed', {
        detail: { itemId: variantKey, variantIndex: idx }
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
    if (useNumericId) {
      coinsStore.setDynamicItemVariant(normalizedIdNum, idx)
    } else {
      coinsStore.dynamicItemVariants.set(variantKey, idx)
      try { localStorage.setItem('dynamicItemVariants', JSON.stringify(Object.fromEntries(coinsStore.dynamicItemVariants))) } catch {}
    }
    console.log('✅ Variante sauvegardée dans le store')
    // Forcer la mise à jour en incrémentant la clé
    variantUpdateKey.value++
    console.log('🔄 Clé de mise à jour incrémentée:', variantUpdateKey.value)
    // Déclencher l'événement pour notifier la navbar
    window.dispatchEvent(new CustomEvent('dynamic-variant-changed', {
      detail: { itemId: variantKey, variantIndex: idx }
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
  if (!item && Array.isArray(userServerLocalItems.value)) {
    const usli = userServerLocalItems.value.find(u => Number((typeof u.legacyId !== 'undefined') ? u.legacyId : u.id) === Number(equippedItemId))
    if (usli) {
      item = {
        id: usli.id,
        name: usli.name,
        img: usli.assets && usli.assets[0] ? resolveAssetSrc(usli.assets[0].src) : '',
        isDynamic: true,
        isLocal: true,
        assets: usli.assets || [],
        backgrounds: usli.backgrounds || {},
        variants: usli.variants || [],
        meta: usli.meta || {},
        legacyId: (typeof usli.legacyId !== 'undefined') ? usli.legacyId : usli.id
      }
    }
  }
  if (!item) {
    try {
      if (isCurrentUser(user) && coinsStore.equippedItem) {
        item = coinsStore.equippedItem
      }
    } catch {}
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

const getProfilePopupAvatarBorderStyle = (user) => {
  try {
    const equipped = getUserEquippedItemData(user)
    if (equipped && shouldRemoveProfilePopupBorder(equipped)) {
      return { border: 'none', background: 'transparent' }
    }
    const raw = user && user.selectedBorderColor ? String(user.selectedBorderColor) : ''
    const baseId = raw.split('|')[0] || ''
    const selected = coinsStore.borderColors.find(c => c.id === baseId)
    if (!selected) return {}
    if (selected.gradient) {
      return { border: '5px solid transparent', background: `linear-gradient(white, white) padding-box, ${selected.gradient} border-box` }
    }
    if (selected.color) {
      return { border: `5px solid ${selected.color}` }
    }
    return {}
  } catch {
    return { border: 'none', background: 'transparent' }
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
      syncCurrentUserDynamicVariants()
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
      syncCurrentUserDynamicVariants()
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
const hoverCloseFactionConfirm = ref(false)
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
      justJoinedFaction.value = null
      try { await nextTick() } catch {}
      justJoinedFaction.value = response.faction
      try { window.setTimeout(() => { justJoinedFaction.value = null }, 600) } catch {}

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
      justJoinedFaction.value = response.faction
      try { window.setTimeout(() => { justJoinedFaction.value = null }, 500) } catch {}

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
      justJoinedFaction.value = null
      try { await nextTick() } catch {}
      justJoinedFaction.value = response.faction
      try { window.setTimeout(() => { justJoinedFaction.value = null }, 600) } catch {}

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

 watch(isMobile, (v, prev) => {
  if (!v && prev && leaderboardFilter.value === 'factions') {
    leaderboardFilter.value = 'coins'
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
@media (max-width: 1218px) {
  .collection-search { flex-direction: column; align-items: center; gap: 8px; }
  .collection-search-input { margin: 0 auto; max-width: 250px; }
  .collection-search .info-icon-btn { align-self: center; }
  .collection-search .tab-btn { width: 250px; max-width: 250px; display: block; margin: 4px 0 0; }
}

@media (min-width: 1159px) and (max-width: 1218px) {
  .collection-search { flex-direction: row !important; align-items: center !important; gap: 12px !important; }
  .collection-search-input { margin: 0 !important; max-width: 420px !important; }
  .collection-search .tab-btn { width: auto !important; max-width: none !important; margin: 0 !important; }
  .shop-grid.collection-grid { display: grid !important; grid-template-columns: repeat(5, minmax(200px, 1fr)) !important; gap: 25px !important; }
  .shop-grid.collection-grid .shop-item { width: auto !important; max-width: none !important; margin: 0 !important; }
  .shop-grid.collection-grid .item-img-wrapper { width: 90px !important; height: 90px !important; margin: 0 auto 18px !important; }
}

/* Éditeur de suggestion d'item */
.suggest-editor { background: #f9fafb; border: 2px solid #5bc682; border-radius: 12px; padding: 12px; margin-bottom: 16px; color: #111; }
[data-theme="dark"] .suggest-editor { background: #111; color: #fff; border-color: #333; }
.suggest-toolbar { display: flex; flex-direction: column; gap: 16px; margin-bottom: 12px; max-width: 1180px; margin-left: auto; margin-right: auto; }
.suggest-top-row { display: flex; flex-wrap: nowrap; flex-direction: row; gap: 0px; align-items: center; justify-content: center; width: 100%; }
.suggest-upload-group { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; flex: 1 1 520px; }
.suggest-right-group { display: flex; align-items: center; gap: 16px; }
.suggest-file-btn { display: inline-flex; align-items: center; justify-content: center; padding: 10px 18px; border-radius: 999px; background: #242424; color: #e6e6e6; border: 2px solid #3a3a3a; cursor: pointer; font-weight: 600; font-size: 14px; gap: 8px; }
[data-theme="light"] .suggest-file-btn { background: #e9ecef; color: #222; border-color: #cfcfcf; }
.suggest-file-btn:hover { filter: brightness(1.05); }
.suggest-file-input { display: none; }
.suggest-url-input { min-width: 240px; max-width: 320px; border-radius: 999px; padding: 10px 14px; border: 2px solid #3a3a3a; background: #1f1f1f; color: #fff; }
[data-theme="light"] .suggest-url-input { background: #fff; color: #111; border-color: #cfcfcf; }
.suggest-import-btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 18px; border-radius: 999px; background: #2ea85b; color: #fff; border: none; font-weight: 700; cursor: pointer; }
.suggest-import-btn:hover { filter: brightness(1.05); }
.suggest-meta-group { display: inline-flex; align-items: center; gap: 10px; padding: 8px 12px; border-radius: 999px; border: 2px solid #3a3a3a; background: #2a2a2a; color: #e6e6e6; white-space: nowrap; }
[data-theme="light"] .suggest-meta-group { background: #f1f1f1; border-color: #d6d6d6; color: #222; }
.suggest-style-pill { display: inline-flex; align-items: center; gap: 8px; font-weight: 600; }
.suggest-price-pill { display: inline-flex; align-items: center; gap: 6px; background: #3a3a3a; border-radius: 999px; padding: 6px 10px; }
[data-theme="light"] .suggest-price-pill { background: #e3e3e3; }
.suggest-price-input { width: 80px; border: none; background: transparent; color: inherit; }
.suggest-price-input:focus { outline: none; }
.suggest-name-pill { display: inline-flex; align-items: center; gap: 6px; background: #3a3a3a; border-radius: 999px; padding: 6px 10px; }
[data-theme="light"] .suggest-name-pill { background: #e3e3e3; }
.suggest-name-input { width: 160px; border: none; background: transparent; color: inherit; }
.suggest-name-input:focus { outline: none; }
.price-label { display: inline-flex; align-items: center; gap: 6px; }
.suggest-actions { display: flex; flex-direction: column; gap: 10px; align-items: stretch; min-width: 150px; }
.suggest-stepper { display: inline-flex; align-items: center; gap: 6px; }
.suggest-stepper .stepper-input { position: relative; display: inline-flex; align-items: center; }
.suggest-stepper .stepper-input input { padding-right: 22px; }
.suggest-stepper .stepper-btn { display: none; align-items: center; justify-content: center; width: 18px; height: 12px; border-radius: 4px; border: 1px solid #3a3a3a; background: #2f2f2f; color: #eaeaea; cursor: pointer; font-weight: 700; padding: 0; line-height: 1; position: absolute; right: 4px; }
.suggest-stepper .stepper-btn:first-of-type { top: 3px; }
.suggest-stepper .stepper-btn:last-of-type { bottom: 3px; }
[data-theme="light"] .suggest-stepper .stepper-btn { background: #e9ecef; border-color: #cfcfcf; color: #222; }
@media (max-width: 768px) { .suggest-stepper .stepper-btn { display: inline-flex; } }
@media (max-width: 1024px) { .suggest-stepper .stepper-input input { width: 125px; } }
@media (max-width: 520px) { .suggest-editor .item-actions input[type="number"] { width: 100px; height: 22px; font-size: 12px; padding: 2px 6px; } }
.suggest-save-btn { display: inline-flex; align-items: center; gap: 8px; justify-content: center; padding: 10px 18px; border-radius: 999px; background: #2ea85b; color: #fff; border: none; font-weight: 700; cursor: pointer; }
.suggest-save-btn:hover { filter: brightness(1.05); }
.suggest-close-btn { display: inline-flex; align-items: center; gap: 8px; justify-content: center; padding: 10px 18px; border-radius: 999px; background: #3a3a3a; color: #eaeaea; border: none; font-weight: 600; cursor: pointer; }
[data-theme="light"] .suggest-close-btn { background: #e0e0e0; color: #111; }
.suggest-variants-row { display: flex; justify-content: center; justify-content: flex-start; width: 100%; }
.variants-ui { display: flex; flex-wrap: nowrap; align-items: center; justify-content: center; gap: 10px; width: 100%; min-width: 0; }
.variants-label { font-weight: 600; }
.variant-slider-viewport { overflow: hidden; min-width: 0; padding-right: 2px; width: 345px !important; }
.variant-slider-track { display: flex; flex-wrap: nowrap; gap: 8px; align-items: center; will-change: transform; }
.variant-chips-slider { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; max-width: 100%; min-width: 0; overflow: hidden; }
.variant-arrow { width: 30px; height: 30px; border-radius: 10px; background: #2f2f2f; border: 2px solid #3a3a3a; color: #eaeaea; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; }

@media (min-width: 1025px) {
  .variant-chips-slider { flex: 1 1 auto; }
  .variant-slider-viewport { flex: 1 1 auto; width: auto !important; }
}

@media (max-width: 520px) {
  .suggest-variants-row { width: 100%; }
  .variants-ui { width: 100%; min-width: 0; }
  .variant-slider-track { display: flex; gap: 10px; width: 274px; will-change: transform; flex-direction: row; }
  .variant-chips-slider { justify-content: center; min-width: 0; }
  .variant-slider-viewport { flex: 1 1 auto; width: auto !important; min-width: 0; }
  .variant-arrow { flex: 0 0 30px; }
  .variant-add-chip { flex: 0 0 32px; }
}
.variant-arrow:disabled { opacity: 0.4; cursor: default; }
[data-theme="light"] .variant-arrow { background: #e0e0e0; border-color: #cfcfcf; color: #111; }
.variant-chip { padding: 8px 6px; border-radius: 12px; background: #2c2c2c; border: 2px solid #3a3a3a; color: #eaeaea;  cursor: pointer; white-space: nowrap; }
.variant-chip.active { background: #3bbf6c; border-color: #3bbf6c; color: #fff; }
.variant-add-chip { width: 32px; height: 32px; font-size: 20px; border-radius: 8px; background: #2f2f2f; border: 2px solid #3a3a3a; color: #eaeaea; display: inline-flex; align-items: flex-end; justify-content: center; cursor: pointer; }
.rename-group { display: flex; align-items: center; gap: 6px; }
.variant-name-input { padding: 8px 12px; border-radius: 999px; border: 2px solid #3a3a3a; background: #1f1f1f; color: #fff; width: 160px; }
[data-theme="light"] .variant-name-input { background: #fff; color: #111; border-color: #cfcfcf; }
.variant-actions { display: flex; flex-wrap: nowrap; align-items: center; justify-content: center; gap: 8px; }

@media (min-width: 1025px) {
  .rename-group label { display: flex; flex-direction: row; align-items: center; justify-content: center; gap: 10px; }
}
.suggest-add-btn,
.suggest-dup-btn,
.suggest-remove-btn { display: inline-flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 12px; border: none; font-weight: 600; cursor: pointer; }

@media (min-width: 320px) and (max-width: 442px) {
  .variant-actions { display: flex; flex-direction: row; width: none; }
}

@media (min-width: 390px) {
  .variant-actions { flex-direction: row !important; }
}
.suggest-add-btn { background: #3bbf6c; color: #fff; }
.suggest-dup-btn { background: #4aa3ff; color: #fff; }
.suggest-remove-btn { background: #e25454; color: #fff; }
.btn-icon { display: inline-flex; align-items: center; justify-content: center; width: 16px; height: 16px; }
.btn-icon svg { width: 16px; height: 16px; }
@media (max-width: 980px) {
  .suggest-top-row { justify-content: center; }
  .suggest-right-group { flex-direction: column; align-items: center; width: 100%; gap: 12px; }
  .suggest-actions { flex-direction: row; justify-content: center; width: 100%; }
  .suggest-meta-group { justify-content: center; flex-direction: column; width: 100%; padding: 20px 0px; }
  .suggest-upload-group { justify-content: center; width: 100%; flex: 1 1 89px; margin-bottom: 15px; }
}

@media (min-width: 320px) and (max-width: 980px) {
  .suggest-top-row { flex-direction: column;  }
}
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
  outline: none;
  box-shadow: none;
}
.close-btn:focus,
.close-btn:focus-visible {
  outline: none;
  box-shadow: none;
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
@media (max-width: 1286px) {
  .header-info-row { display: flex; flex-direction: column; }
}
@media (min-width: 1219px) {
  .header-info-row { display: flex; flex-direction: row; }
}
@media (max-width: 1218px) {
  .header-info-row { align-items: center; }
}
@media (max-width: 1218px) {
  .shop-header {
    display: grid;
    grid-template-columns: 1fr;
    grid-template-areas: "title" "tabs" "info";
    align-items: center;
    justify-items: center;
    gap: 0px;
  }
  .header-left, .header-right { display: contents; }
  .shop-title { grid-area: title; }
  .shop-tabs { grid-area: tabs; width: 272px; }
  .header-info-row {
    grid-area: info;
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 20px;
  }
  .weekly-timer { order: 1; }
  .coins-wallet { order: 2; }
  .header-right { margin: 0 !important; }
}
@media (min-width: 1184px) and (max-width: 1218px) {
  .shop-modal .shop-header {
    display: flex !important;
    align-items: baseline !important;
    flex-direction: row;
    justify-content: space-between !important;
    gap: 12px !important;
  }
}
.coins-wallet { background: #ffd84a; border: 2px solid #5bc682; border-radius: 16px; padding: 20px 14px; display: inline-flex; align-items: center; gap: 8px; color: #111; box-shadow: 0 4px 10px rgba(0,0,0,0.12); }
.coins-wallet .coin-icon { width: 22px; height: 22px; }
.coins-wallet .coins-value { font-size: 20px; line-height: 1; }
.header-right { display: flex;    align-items: center; gap: 8px;  justify-content: flex-end; }
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
  border-radius: 16px;
  text-align: center;
  margin-bottom: 20px;
}
@media (max-width: 1218px) {
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
    --weekly-item-img-width: 235px;
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
  @media (min-width: 1025px) {
    .weekly-shop-container .preview-card.preview-item .item-actions {
      width: 340px;
      margin: 10px auto;
    }
  }
  .weekly-shop-container .weekly-section:first-child .shop-item .item-img-wrapper {
    background: #fff;
    border: 5px solid #5bc682;
    border-radius: 30px;
    width: var(--weekly-item-img-width) !important;
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
    width: var(--weekly-item-img-width) !important;
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
.weekly-shop-container .preview-slider-controls { position: relative; display: flex; justify-content: center; align-items: center; margin: 0 auto; margin-bottom: 8px; width: 96%; z-index: 1000; justify-content: space-between; }
.weekly-shop-container .preview-slider-controls .slider-arrow { width: 34px; height: 34px; border-radius: 12px; border: 2px solid #3a3a3a; background: #2a2a2a; color: #eaeaea; font-weight: 800; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 6px 14px rgba(0,0,0,0.35); transition: transform 0.18s ease, filter 0.18s ease, box-shadow 0.18s ease; }
.weekly-shop-container .preview-slider-controls .right-arrow { margin-left: auto; }
.weekly-shop-container .preview-slider-controls .left-arrow { margin-right: auto; }
.weekly-shop-container .preview-slider-controls .slider-arrow:hover { filter: brightness(1.08); transform: translateY(-1px); box-shadow: 0 8px 18px rgba(0,0,0,0.4); }
.weekly-shop-container .preview-slider-controls .slider-arrow:disabled { opacity: 0.5; cursor: default; transform: none; box-shadow: none; }
[data-theme="light"] .weekly-shop-container .preview-slider-controls .slider-arrow { background: #f2f2f2; color: #111; border-color: #cfcfcf; box-shadow: 0 6px 12px rgba(0,0,0,0.15); }
@media (max-width: 1024px) {
  .weekly-shop-container .preview-slider-controls { display: none !important; }
}
.suggest-slider-enter-active, .suggest-slider-leave-active { transition: transform 0.38s ease-in-out; will-change: transform; }
.suggest-slider-move { transition: none !important; }
.slide-left .suggest-slider-enter-from,
.slide-left.suggest-slider-enter-from { transform: translateX(-40px); }
.slide-left .suggest-slider-leave-to,
.slide-left.suggest-slider-leave-to { transform: translateX(40px); }
.slide-right .suggest-slider-enter-from,
.slide-right.suggest-slider-enter-from { transform: translateX(40px); }
.slide-right .suggest-slider-leave-to,
.slide-right.suggest-slider-leave-to { transform: translateX(-40px); }
  .weekly-section:first-child .shop-grid.small-grid { grid-template-columns: repeat(2, 1fr) !important; height: 100%; align-items: stretch; grid-auto-rows: 1fr; gap: 12px !important; width: 658px !important; margin-left: auto; margin-right: auto; }
  @media (max-width: 768px) {
    .weekly-section:first-child .shop-grid.small-grid { gap: 25px !important; }
  }
  @media (max-width: 768px) {
    .weekly-shop-container .item-actions .buy-btn.price-hover {
      width: var(--weekly-item-img-width) !important;
      max-width: var(--weekly-item-img-width) !important;
    }
  }
  @media (min-width: 768px) and (max-width: 1285px) {
    .weekly-shop-container .item-actions .buy-btn.price-hover {
      width: var(--weekly-item-img-width) !important;
      max-width: var(--weekly-item-img-width) !important;
    }
  }
  @media (min-width: 320px) and (max-width: 768px) {
    .weekly-shop-container .shop-grid {
      grid-template-columns: repeat(1, 1fr) !important;
    }
  }
  @media (max-width: 768px) {
    .weekly-shop-container {
      --weekly-item-img-width: 190px;
    }
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
      width: var(--weekly-item-img-width) !important;
    }
    .weekly-shop-container .weekly-section:first-child .item-actions {
      width: var(--weekly-item-img-width) !important;
      max-width: var(--weekly-item-img-width) !important;
      margin: 0 auto;
    }
    .weekly-shop-container .weekly-section:first-child .item-actions .buy-btn,
    .weekly-shop-container .weekly-section:first-child .item-actions .buy-btn.price-hover {
      display: block;
      width: var(--weekly-item-img-width) !important;
      max-width: var(--weekly-item-img-width) !important;
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
      width: var(--weekly-item-img-width) !important;
    }
    .weekly-shop-container .weekly-section:nth-of-type(2) .item-actions .buy-btn,
    .weekly-shop-container .weekly-section:nth-of-type(2) .item-actions .buy-btn.price-hover {
      display: block;
      width: var(--weekly-item-img-width) !important;
      max-width: var(--weekly-item-img-width) !important;
      margin: 0 auto;
    }
    .weekly-shop-container .item-actions .buy-btn.price-hover {
      width: var(--weekly-item-img-width) !important;
      max-width: var(--weekly-item-img-width) !important;
    }
    .weekly-shop-container .item-actions .buy-btn { border-radius: 12px !important; }
    .weekly-shop-container .preview-card.preview-item .jojo-text-preview,
    .weekly-shop-container .weekly-item .jojo-text-preview,
    .weekly-shop-container .jojo-text-preview { top: -7px !important; }
    .preview-card.preview-leaderboard .equipped-angel-wings { top: -46px; left: -30px; }
    .weekly-shop-container .moustache-img-shop { top: 65px !important; left: 50px !important; }
    .weekly-shop-container .gentleman-img-shop { top: 20px !important; left: 37px !important; }
  }
  .weekly-section:first-child .shop-grid .tall-card { height: 100%; display: flex; flex-direction: column; }
  .weekly-section:first-child .shop-grid .tall-card .item-actions { margin-top: auto; }
  .small-grid { display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 12px !important; }
  @media (max-width: 480px) {
    .weekly-shop-container .weekly-section:nth-of-type(2) .shop-grid.small-grid::before {
      content: "";
      display: block;
      height: 6px;
      width: 85%;
      margin: 5px auto 5px;
      background: #E9E9EA;
      border-radius: 999px;
    }
  }
  .weekly-preview { margin-top: 8px; grid-column: 1 / -1; width: 1235.45px; margin-left: auto; margin-right: auto; height: 650px !important; }
  .preview-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; align-items: stretch; justify-items: center; height: 100%; }
  .preview-card { width: 100%; max-width: 390px; }
  .weekly-shop-container .preview-card.preview-navbar .item-img-container,
  .weekly-shop-container .preview-card.preview-navbar .classic-border-preview { border-radius: 0 !important; }
  .preview-card.preview-navbar .item-img-wrapper.large { position: relative; width: 57px; height: 57px; margin: 0 auto; overflow: visible; }
  .preview-slider-viewport { overflow: hidden; }
.preview-slider-track { display: flex; gap: 6px; align-items: stretch; justify-content: flex-start; will-change: transform; }
.preview-slider-track .preview-card { flex: 0 0 390px; max-width: 390px; height: 410px; }
.preview-slider-track .preview-card.preview-item { height: 470px; }
.preview-slider-track .preview-card.preview-item.cosmetic-mobile-card { height: 575px; }
@media (max-width: 1270px) {
  .preview-slider-viewport { overflow: visible !important; width: 100% !important; }
  .preview-slider-track { flex-direction: column; align-items: center; justify-content: flex-start; }
  .preview-slider-track .preview-card { flex: 0 0 auto; width: 100%; margin: 0 auto; }
}
  .preview-card.preview-collection .item-img-wrapper.large { position: relative; width: 90px; height: 90px; background: transparent; overflow: hidden; border: 3px solid rgb(61, 220, 132); border-radius: 50%; margin: 0 auto; }
  .preview-card.preview-collection .item-img-wrapper.large.mobile-mode { width: 80px; height: 80px; }
  .preview-card.preview-collection .item-img-container { position: relative; width: 100%; height: 100%; background: transparent; overflow: visible; border: none; }
  .preview-card.preview-leaderboard { max-width: 390px; }
  .preview-card.preview-avatar { max-width: 390px; }
  .preview-card.preview-avatar.avatar-mobile-card { align-items: center; }
.preview-card.preview-popup-style .item-img-wrapper.large { position: relative; width: 120.5px !important; height: 64px !important; margin: 0 auto; border-radius: 12px; }
  .preview-card.preview-avatar:not(.roi-preview) .profile-avatar-stage { border: none; border-radius: 30px; width: 351px !important; height: 250px !important; box-sizing: border-box; }
  .preview-card.preview-avatar:not(.roi-preview) .profile-avatar-scaler { width: 351px !important; height: 250px !important; display:flex; align-items:center; justify-content:center; border: 5px solid #5bc682; border-radius: 30px; box-sizing: border-box; margin: 0 auto; position: relative; }
  .preview-card.preview-avatar .profile-avatar { width: 150px !important; height: 150px !important; border-width: 5px !important; }
  .preview-card.preview-avatar.avatar-mobile-card .profile-avatar-wrap.profile-popup { display:flex; align-items:center; justify-content:center; width: 224px !important; height: 200px !important; margin: 0 auto; border: 5px solid #5bc682; border-radius: 30px !important; box-sizing: border-box; overflow: visible; scrollbar-width: none; -ms-overflow-style: none; }
  .preview-card.preview-avatar.avatar-mobile-card .profile-avatar-stage,
  .preview-card.preview-avatar.avatar-mobile-card .profile-avatar-scaler { width: 100px !important; height: 110px !important; border-radius: 24px !important; margin: 0 auto !important; overflow: visible; scrollbar-width: none; -ms-overflow-style: none; }
  .preview-card.preview-avatar.avatar-mobile-card .profile-avatar-scaler { border: none !important; display:flex !important; align-items:center; justify-content:center; box-sizing: border-box; overflow: visible; scrollbar-width: none; -ms-overflow-style: none; }
  .preview-card.preview-avatar.avatar-mobile-card .profile-avatar { width: 100px !important; height: 100px !important; border-width: 5px !important; border-radius: 24px !important; }
  .preview-card.preview-avatar.avatar-mobile-card .avatar-img { width: 100px !important; height: 100px !important; }
  .preview-card.preview-avatar.avatar-mobile-card .profile-avatar-wrap.profile-popup::-webkit-scrollbar,
  .preview-card.preview-avatar.avatar-mobile-card .profile-avatar-stage::-webkit-scrollbar,
  .preview-card.preview-avatar.avatar-mobile-card .profile-avatar-scaler::-webkit-scrollbar { width: 0; height: 0; display: none; }
  .preview-card.preview-avatar.roi-preview .profile-avatar-stage { height: 400px !important; }
  .preview-card.preview-avatar.roi-preview .profile-avatar-scaler { width: 345px !important; height: 400px !important; border: 5px solid #5bc682 !important; border-radius: 30px !important; }
  .preview-card.preview-avatar.roi-preview .equipped-roi-overlay { top: 30px; left: 85px; width: 55%; height: 27%; z-index: 15; }
  .preview-card.preview-avatar.gentleman-preview .profile-avatar-stage { height: 400px !important; }
  .preview-card.preview-avatar.gentleman-preview .profile-avatar-scaler { width: 345px !important; height: 400px !important; }
  .preview-card.preview-avatar.vinyle-preview .profile-avatar-stage { height: 400px !important; }
  .preview-card.preview-avatar.vinyle-preview .profile-avatar-scaler { width: 345px !important; height: 400px !important; }
  .preview-card.preview-avatar.vinyle-preview .equipped-vinyle-overlay { left: 50%; top: 52%; width: 115%; height: 115%; transform: translate(-50%, -72%) scale(1.08); }
  .preview-card.preview-avatar.nokia-preview .profile-avatar-stage { height: 400px !important; }
  .preview-card.preview-avatar.nokia-preview .profile-avatar-scaler { width: 345px !important; height: 400px !important; }
  .preview-card.preview-avatar .matrix-char { font-size: 16px; line-height: 16px; }
  .preview-card.preview-avatar .profile-avatar-scaler .equipped-angel-wings { top: -70px; left: 0px; width: 100%; height: 84%; }
  .preview-card.preview-avatar .profile-avatar-scaler .equipped-tomb-raider { position: absolute; top: 0px; left: 50px; width: 71%; height: 45%; z-index: 2; }
.preview-card.preview-avatar .profile-avatar-scaler:has(.equipped-angel-wings) { height: 400px; }
.preview-card.preview-avatar .profile-avatar-wrap:has(.equipped-tomb-raider) { height: 400px; }
preview-card.preview-avatar .profile-avatar-stage:has(.equipped-tomb-raider) { height: 400px; }
preview-card.preview-avatar .profile-avatar-scaler:has(.equipped-tomb-raider) { height: 400px; }
  .preview-card.preview-leaderboard .equipped-roi-overlay { width: 22%; }

preview-card.preview-avatar .profile-avatar-scaler .equipped-cat-ears { position: absolute !important; left: 49% !important; top: 52% !important; width: 55% !important; height: 75% !important; object-fit: contain !important; transform: translate(-50%, -72%) scale(1.25) !important; transform-origin: center bottom !important; pointer-events: none !important; z-index: 16 !important; }
preview-card.preview-avatar .profile-avatar-scaler .equipped-clown-overlay { position: absolute !important; left: 50% !important; top: 72% !important; width: 60% !important; height: 72% !important; object-fit: contain !important; transform: translate(-50%, -85%) scale(1.18) !important; transform-origin: center bottom !important; pointer-events: none !important; z-index: 16 !important; }
preview-card.preview-avatar .profile-avatar-scaler .equipped-vinyle-overlay { position: absolute; left: 50%; top: 36%; width: 30%; height: 48%; object-fit: contain; transform: translate(-50%, -72%) scale(1.05); transform-origin: center bottom; pointer-events: none; z-index: 16; }
  .preview-card.preview-avatar .profile-avatar-scaler .equipped-stars { position: absolute; left: 51%; top: 66%; width: 75%; height: 69%; object-fit: contain; transform: translate(-50%, -72%) scale(1.02); transform-origin: center bottom; pointer-events: none; z-index: 16; }
  .preview-card.preview-avatar .profile-avatar-scaler .equipped-rainbow { position: absolute; left: 50%; top: 76%; width: 48%; height: 53%; object-fit: contain; transform: translate(-50%, -85%) scale(1.3); transform-origin: center bottom; pointer-events: none; z-index: 16; }
  .preview-card.preview-avatar .profile-avatar-scaler .equipped-royal-frame { position: absolute; left: 50%; top: 82%; width: 77%; height: 89%; object-fit: contain; transform: translate(-50%, -85%) scale(1.02); transform-origin: center bottom; pointer-events: none; z-index: 16; }
  .preview-card.preview-avatar .profile-avatar-scaler .equipped-gentleman-overlay { position: absolute; left: 50%; top: 35%; width: 53%; height: 26%; object-fit: contain; transform: translate(-50%, -72%) scale(1.02); transform-origin: center bottom; pointer-events: none; z-index: 16; }
preview-card.preview-avatar .profile-avatar-scaler .equipped-asteroide-overlay { position: absolute; left: 38%; top: 75%; width: 25%; height: 30%; object-fit: contain; transform: translate(-50%, -72%) scale(1.0); transform-origin: center bottom; pointer-events: none; z-index: 16; }
preview-card.preview-avatar .profile-avatar-scaler .equipped-absolute-cinema-overlay { position: absolute; left: 4.5%; top: 5%; width: 34%; height: 70%; object-fit: contain; z-index: 16; }
preview-card.preview-avatar .profile-avatar-scaler .equipped-absolute-cinema-overlay-right { position: absolute; left: 61.5%; top: 5%; width: 34%; height: 70%; object-fit: contain; z-index: 16; }
preview-card.preview-avatar .profile-avatar-scaler .equipped-pate-overlay { position: absolute; left: 20%; top: 78%; width: 35%; height: 35%; object-fit: contain; pointer-events: none; z-index: 16; }
preview-card.preview-avatar .profile-avatar-scaler .equipped-flash-overlay { left: 26%; z-index: 15; }
.preview-card.preview-avatar .profile-avatar .equipped-clown-nose { position: absolute !important; left: 50% !important; top: 52% !important; width: 60% !important; height: auto !important; object-fit: contain !important; transform: translate(-50%, -40%) !important; pointer-events: none !important; z-index: 16 !important; }
.preview-card.preview-avatar .profile-avatar .equipped-moustache-inside { position: absolute !important; left: 50% !important; top: 63% !important; width: 70% !important; transform: translate(-50%, -50%) !important; object-fit: contain !important; z-index: 16 !important; }
.preview-card.preview-avatar .profile-avatar .equipped-spacestars-inside { position: absolute !important; left: 50% !important; top: 50% !important; width: 100% !important; height: 100% !important; transform: translate(-50%, -50%) !important; object-fit: contain !important; z-index: 14 !important; }
.preview-card.preview-avatar .profile-avatar .equipped-lunettes-pixel-inside { position: absolute !important; left: 50% !important; top: 50% !important; width: 100% !important; transform: translate(-50%, -50%) !important; object-fit: contain !important; z-index: 16 !important; }
.preview-card.preview-avatar .profile-avatar .equipped-matrix-glasses { position: absolute !important; left: 50% !important; top: 45% !important; width: 85% !important; transform: translate(-50%, -50%) !important; object-fit: contain !important; z-index: 16 !important; }
.preview-card.preview-avatar .profile-avatar .equipped-dvd-inside { position: absolute !important; left: 50%; top: 55%; width: 80% !important; transform: translate(-50%, -50%) !important; object-fit: contain !important; z-index: 16 !important; animation: dvdBounceShopLarge 4s linear infinite !important; will-change: top, left; backface-visibility: hidden; }
.preview-card.preview-avatar .profile-avatar .equipped-advisory-inside { position: absolute; left: 80%; top: 88%; width: 65%; transform: translate(-50%, -50%); object-fit: contain; z-index: 16; }
.preview-card.preview-avatar .profile-avatar .equipped-target-inside { position: absolute !important; left: 50% !important; top: 50% !important; width: 100% !important; transform: translate(-50%, -50%) !important; object-fit: contain !important; z-index: 16 !important; }
.preview-card.preview-avatar .profile-avatar-scaler .equipped-nokia-inside { position: absolute !important; left: 34% !important; top: 60% !important; width: 26% !important; height: 23% !important; object-fit: contain !important; z-index: 16 !important; }
.preview-card.preview-avatar .profile-avatar-scaler .equipped-daftpunk-overlay { position: absolute; left: 29%; top: 12%; width: 40%; height: 22%; object-fit: contain; z-index: 16; }
.preview-card.preview-avatar .profile-avatar-scaler .equipped-clippy-inside { position: absolute; left: 53%; top: 54%; width: 19%; height: 14%; object-fit: contain; z-index: 16; }
.preview-card.preview-avatar .profile-avatar-scaler .equipped-discord-overlay { position: absolute; left: 19%; top: 16%; width: 55%; height: 74%; object-fit: contain; z-index: 16; }
.preview-card.preview-avatar .equipped-jojo-inside { position: absolute; bottom: -2px; left: 150px; width: 95%; height: 40%; object-fit: contain; pointer-events: none; z-index: 6; animation: jojo-swipe 4.7s ease-in-out infinite; will-change: transform; }
.preview-card.preview-avatar .equipped-jojotext-inside { position: absolute; width: 84%; left: 7%; height: 74%; top: -4%; }
  .preview-card.preview-item .item-img-wrapper {
    background: #fff;
    border: 5px solid #5bc682;
    border-radius: 30px !important;
    width: 350px;
    height: 145px;
    margin: 0 auto 12px;
    position: relative;
  }
  .fenetre-collection .preview-card.preview-item .item-img-wrapper.large.mobile-mode {
    width: 250px !important;
    height: 250px !important;
  }
  .fenetre-collection .preview-card.preview-item .item-img-wrapper.large.mobile-mode .item-img-container {
    width: 240px;
    height: 240px;
  }
  .fenetre-collection .preview-card.preview-item .item-img-wrapper.large:not(.mobile-mode) .item-img-container {
    height: 135px;
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
  [data-theme="dark"] .weekly-preview .item-name,
  [data-theme="dark"] .weekly-preview .item-price { color: #ffffff !important; }
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
  .fenetre-collection .preview-card.preview-avatar .profile-avatar-stage { border: none !important; border-radius: 30px !important; }
  .fenetre-collection .preview-card.preview-avatar .profile-avatar-stage.no-border { border: none !important; }
  .fenetre-collection .preview-card.preview-avatar .profile-avatar.no-border { border: none !important; background: transparent !important; }
  .preview-card.preview-leaderboard .equipped-jojo-inside { position: absolute !important; bottom: -2px !important; left: 58px !important; width: 120% !important; height: 40% !important; object-fit: contain !important; pointer-events: none !important; z-index: 6 !important; }
  .preview-card.preview-leaderboard .equipped-jojotext-inside { position: absolute !important; top: -9px !important; right: 4px !important; width: 95% !important; height: 100% !important; object-fit: contain !important; pointer-events: none !important; z-index: 7 !important; }
  .preview-card.preview-leaderboard .user-avatar-container { width: 50px; height: 50px; position: relative !important; }
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
  @media (max-width: 1265px) {
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
  .leaderboard-container .equipped-clown {
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
  .leaderboard-container .equipped-clown-overlay {
    pointer-events: none !important;
    position: absolute;
    top: -26.7% !important;
    left: -1% !important;
    width: 125% !important;
    height: 127% !important;
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
    top: -19%;
    left: -12%;
    width: 161% !important;
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
    top: -8px !important;
    left: -9px !important;
    width: 134% !important;
    height: 130% !important;
    object-fit: contain !important;
    pointer-events: none !important;
    z-index: 15 !important;
  }
  .leaderboard-container .equipped-alpha{
    position: absolute !important;
    top: 0px !important;
    left: -3px !important;
    width: 110% !important;
    height: 102% !important;
    z-index: 4 !important;
    object-fit: contain !important;
    pointer-events: none !important;
  }
  .leaderboard-container .equipped-admin-planify{
    position: absolute !important;
    top: -2px !important;
    left: 0px !important;
    width: 103% !important;
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
  @media (min-width: 320px) and (max-width: 1218px) {
    .leaderboard-container .equipped-discord {
      position: absolute !important;
      top: 0 !important;
      left: -6px !important;
      width: 113% !important;
      height: 113% !important;
      object-fit: contain !important;
      pointer-events: none !important;
      z-index: 15 !important;
    }
  }

    .leaderboard-container .equipped-discord {
      position: absolute;
      top: 0;
      left: -7px;
      width: 115%;
      height: 115%;
      object-fit: contain;
      pointer-events: none;
      z-index: 15;
    }

  /* Discord - Leaderboard factions uniquement */
  .faction-leaderboard-list .equipped-discord {
    left: -8px !important;
    width: 119% !important;
    height: 115% !important;
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
    top: -8px !important;
    right: 4px !important;
    width: 88% !important;
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
    top: -30%;
    left: -3%;
    width: 131% !important;
    height: 155% !important;
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
    left: 15% !important;
    width: 90% !important;
    height: 90% !important;
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
    top: -46% !important;
    left: -8% !important;
    width: 44% !important;
    height: 48% !important;
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
    top: 44% !important;
    left: 0% !important;
    width: 60% !important;
    height: 70% !important;
    object-fit: contain !important;
    pointer-events: none !important;
    z-index: 3 !important;
  }

  /* Style spécifique pour l'item Chat dans le leaderboard */
  .leaderboard-container .equipped-chat-overlay {
    pointer-events: none !important;
    position: absolute !important;
    top: -34% !important;
    left: 22% !important;
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
    top: -45px !important;
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
    top: -44px !important;
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
    height: 56% !important;
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
@media (min-width: 320px) and (max-width: 1218px) {

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
    grid-template-columns: repeat(2, 1fr);
    gap: 20px !important;
    width: 658px !important;
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
    font-size: 25px !important;
    display: inline-block;
    min-width: 7ch;
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

  @media (min-width: 490px) and (max-width: 768px) {
    .shop-grid.collection-grid {
      display: grid !important;
      grid-template-columns: repeat(2, minmax(200px, 0fr)) !important;
    }
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
  .shop-grid.collection-grid.my-items-grid .item-actions .equip-btn,
  .shop-grid.collection-grid.my-items-grid .item-actions .tab-btn {
    width: 100% !important;
    max-width: 120px !important;
    margin: 0 auto !important;
  }

  .coin-icon {
    width: 22px !important;
    height: 22px !important;
  }

  .shop-tabs {
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 15px !important;
    margin-bottom: 15px !important;
    width: 272px !important;
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
    gap: 0px !important;
    flex-direction: row !important;
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
    left: 24px !important;
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
  /* Desktop weekly override: Jojo text position */
  .weekly-section .shop-item.weekly-item.small-card .jojo-text-preview.jojotext-fade { left: 32px !important; }
  @media (min-width: 769px) and (max-width: 1218px) {
    .weekly-section .shop-item.weekly-item.small-card .jojo-text-preview.jojotext-fade {
      left: 55px !important;
      top: -8px !important;
      width: 49% !important;
    }
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


/* Media query pour les écrans PC à partir de 1159px */
@media (min-width: 1159px) {
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

@media (min-width: 769px) and (max-width: 1158px) {
  .shop-grid.collection-grid {
    display: grid !important;
    grid-template-columns: repeat(3, minmax(200px, 0fr)) !important;
  }

  .collection-search {
    flex-direction: column;
  }

  .collection-search-input {
    padding-right: 60px !important;
  }

  .variant-actions {
    flex-direction: row;
  }

  .variants-ui {
    flex-direction: row;
  }
}

@media (min-width: 900px) and (max-width: 1159px) {
  .shop-grid.collection-grid {
    display: grid !important;
    grid-template-columns: repeat(4, minmax(200px, 0fr)) !important;
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
@media (hover: none) {
  .shop-item:hover { border-color: inherit; transform: none; box-shadow: none; }
}

.shop-item.not-owned {
  opacity: 0.7;
  filter: grayscale(30%);
  border-color: #ccc;
}

.shop-item.owned {
  border-color: #5bc682;
}

@media (max-width: 1183px) {
  .timer-info {
    flex-direction: column !important;
  }
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

.shop-grid.collection-grid.my-items-grid .item-actions .equip-btn,
.shop-grid.collection-grid.my-items-grid .item-actions .tab-btn {
  width: 100% !important;
  max-width: 250px !important;
  margin: 0 auto;
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
@media (min-width: 768px) {
  .weekly-shop-container .item-actions .buy-btn.price-hover .btn-label { font-size: 15px; }
}
@media (max-width: 480px) {
  .weekly-shop-container .item-actions .buy-btn.price-hover .btn-label { font-size: 13px; }
}
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
  gap: 10px;
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

.faction-col.selected {
  width: 364px;
}

.faction-total-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px 20px 0 0;
  padding: 20px;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
  width: 325px;
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
  background: #AB0631 !important;
  color: #fff;
  border: none;
}
.faction-total-card.no-faction {
  animation: factionBlink 1.4s ease-in-out infinite;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
}
@keyframes factionBlink {
  0%, 100% { background: rgba(255, 255, 255, 0.05); }
  50% { background: #00d89e; }
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
.preview-card.preview-leaderboard .equipped-pate-inside { position: absolute !important; top: 48% !important; left: 6% !important; width: 50% !important; height: 43% !important; object-fit: contain !important; pointer-events: none !important; z-index: 3 !important; }
.preview-card.preview-leaderboard .equipped-chat-overlay { position: absolute !important; top: -34% !important; left: 1% !important; width: 25% !important; height: 100% !important; object-fit: contain !important; pointer-events: none !important; z-index: 3 !important; }
.preview-card.preview-leaderboard .equipped-camera-overlay { position: absolute !important; top: 55% !important; left: 0% !important; width: 10% !important; height: 70% !important; object-fit: contain !important; z-index: 3 !important; }
.preview-card.preview-leaderboard .equipped-flash-overlay { position: absolute !important; top: 3% !important; left: -16% !important; width: 50% !important; height: 100% !important; z-index: 3 !important; }
.preview-card.preview-leaderboard .user-avatar-container .equipped-cat-ears { position: absolute !important; left: 56% !important; top: 115% !important; width: 120% !important; height: 120% !important; object-fit: contain !important; transform: translate(-50%, -60%) scale(1.50) !important; transform-origin: center bottom !important; pointer-events: none !important; z-index: 3 !important; }
.preview-card.preview-leaderboard .equipped-cat-ears { position: absolute !important; inset: 0 !important; top: -48px !important; width: 100% !important; height: 100% !important; margin: auto !important; object-fit: contain !important; transform: scale(1.15) !important; transform-origin: center top !important; pointer-events: none !important; z-index: 3 !important; }
  .preview-card.preview-leaderboard .equipped-stars-overlay { position: absolute !important; inset: 0 !important; top: -9px !important; left: 0px !important; width: 94% !important; height: 90% !important; margin: auto !important; object-fit: contain !important; transform: scale(1.22) !important; transform-origin: center top !important; pointer-events: none !important; z-index: 3 !important; }
  .preview-card.preview-leaderboard .user-avatar-container .equipped-royal-frame-overlay { position: absolute !important; left: 49% !important; top: 75% !important; width: 148% !important; height: 147% !important; object-fit: contain !important; transform: translate(-50%, -62%) scale(1.08) !important; transform-origin: center bottom !important; pointer-events: none !important; z-index: 3 !important; }
.preview-card.preview-leaderboard .user-avatar-container .equipped-vinyle-overlay { position: absolute !important; left: 50% !important; top: -2% !important; width: 120% !important; height: 120% !important; object-fit: contain !important; transform: translate(-50%, -62%) scale(1.05) !important; transform-origin: center bottom !important; pointer-events: none !important; z-index: 3 !important; }
.preview-card.preview-leaderboard .user-avatar-container .equipped-dvd-inside, .preview-card.preview-leaderboard .user-avatar .equipped-dvd-inside { position: absolute !important; top: 30%; left: 30%; width: 60% !important; height: 60% !important; object-fit: contain !important; transform: translate(-50%, -50%) !important; pointer-events: none !important; z-index: 3 !important; animation: dvdBounceShop 4s linear infinite !important; will-change: top, left; backface-visibility: hidden; }
.preview-card.preview-leaderboard .user-avatar-container .equipped-nokia-inside { position: absolute !important; left: 14% !important; top: 91% !important; width: 75% !important; height: 140% !important; object-fit: contain !important; transform: translate(-50%, -62%) !important; pointer-events: none !important; z-index: 2 !important; }
.preview-card.preview-leaderboard .user-avatar-container .equipped-clippy-inside { position: absolute !important; left: 74% !important; top: 81% !important; width: 60% !important; height: auto !important; object-fit: contain !important; transform: translate(-50%, -62%) !important; pointer-events: none !important; z-index: 3 !important; }
.preview-card.preview-leaderboard .user-avatar-container .equipped-daftpunk-overlay { position: absolute !important; left: 50% !important; top: -20% !important; width: 80% !important; height: auto !important; object-fit: contain !important; transform: translate(-50%, -50%) !important; pointer-events: none !important; z-index: 4 !important; }
.preview-card.preview-leaderboard .user-avatar-container .equipped-discord-overlay { position: absolute !important; top: -1px !important; left: -20px !important; width: 26% !important; height: 120% !important; object-fit: contain !important; pointer-events: none !important; z-index: 4 !important; }
.preview-card.preview-leaderboard .equipped-discord-overlay { position: absolute !important; top: -5px !important; left: -10px !important; width: 34% !important; height: 132% !important; object-fit: contain !important; pointer-events: none !important; z-index: 4 !important; }
.preview-card.preview-leaderboard .equipped-tomb-raider { position: absolute !important; top: -36px !important; left: -135px !important; width: 116% !important; height: 116% !important; object-fit: contain !important; pointer-events: none !important; z-index: 2 !important; }
/* Clown (preview leaderboard): hair above avatar, nose centered inside */
.preview-card.preview-leaderboard .user-avatar-container .equipped-clown-overlay { position: absolute !important; left: 48% !important; top: 48px !important; width: 51% !important; height: 70% !important; object-fit: contain !important; transform: translate(-50%, -60%) scale(2.6) !important; transform-origin: center bottom !important; pointer-events: none !important; z-index: 3 !important; }
.preview-card.preview-leaderboard .user-avatar .equipped-clown-nose { position: absolute !important; left: 50% !important; top: 52% !important; width: 60% !important; height: auto !important; object-fit: contain !important; transform: translate(-50%, -50%) !important; pointer-events: none !important; z-index: 3 !important; }
.preview-card.preview-leaderboard .equipped-absolute-cinema-overlay { position: absolute !important; top: -10% !important; left: -64% !important; width: 100% !important; height: 100% !important; object-fit: contain !important; pointer-events: none !important; z-index: 15 !important; }
.preview-card.preview-leaderboard .equipped-absolute-cinema-overlay-right { position: absolute !important; top: -10% !important; left: 63% !important; width: 100% !important; height: 100% !important; object-fit: contain !important; pointer-events: none !important; z-index: 15 !important; transform: scaleX(-1) !important; transform-origin: center !important; }

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

/* Thème sombre: noms des items en blanc */
[data-theme="dark"] .shop-item .item-name,
[data-theme="dark"] .leaderboard-container .item-name {
  color: #ffffff !important;
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
  left: 3px;
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
  top: 0%;
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
  top: -3px;
    left: 0px;
    width: 129%;
    height: 110%;
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

  @media (max-width: 1265px) {
    .suggest-toolbar { flex-direction: column; align-items: center; }
    .variant-actions { justify-content: center; flex-direction: column; }
    .variants-ui { flex-direction: column; }
  }

@media (max-width: 1218px) {

      .preview-card.preview-item .item-img-wrapper.large { width: 250px !important; height: 250px !important; }

      }

  @media (max-width: 1262px) {
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
    .preview-card.preview-leaderboard .equipped-camera-overlay { top: 36% !important; left: -1% !important; width: 17% !important; height: 90% !important; object-fit: contain !important; }
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
    .preview-card.preview-avatar .profile-avatar-scaler .equipped-chat-overlay { top: 1% !important; left: 26% !important; width: 86% !important; }
    .preview-card.preview-avatar .profile-avatar-scaler .equipped-pate-inside { top: 56% !important; left: 23% !important; width: 25% !important; height: 20% !important; }
    .preview-card.preview-avatar .profile-avatar-scaler .equipped-daftpunk-overlay { left: 22% !important; top: 11% !important; width: 55% !important; }
    .preview-card.preview-avatar .profile-avatar-scaler .equipped-nokia-inside { left: 28% !important; top: 60% !important; width: 40% !important; height: 23% !important; }
    .preview-card.preview-avatar .profile-avatar-scaler .equipped-clippy-inside { left: 54% !important; top: 48% !important; width: 27% !important; height: 25% !important; }
    .preview-card.preview-leaderboard .equipped-tomb-raider { left: -78px !important; }
    .preview-card.preview-avatar .profile-avatar-scaler .equipped-tomb-raider { left: 34px !important; }
    .preview-card.preview-item img.item-img[alt="Ange"] { position: absolute !important; top: 15% !important; width: 85% !important; left: 8% }
    .preview-card.preview-item .jojo-text-preview { top: 3px !important; left: 13px !important; width: 61% !important; }
    .preview-card.preview-item.cosmetic-mobile-card .jojo-text-preview { top: 10px; }

@media (max-width: 1300px) {
  .preview-card.preview-item .jojo-text-preview { top: 10px !important; }
}
@media (max-width: 768px) {
  .preview-card.preview-item.cosmetic-mobile-card .jojo-text-preview { top: 10px !important; }
  .weekly-shop-container .preview-card.preview-item .jojo-text-preview,
  .weekly-shop-container .weekly-item .jojo-text-preview,
  .weekly-shop-container .jojo-text-preview { top: -10px !important; }
}
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
.profile-popup .public-note-title {
  display: flex;
  justify-content: center;
  text-align: center;
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
  top: 19px !important;
    left: -2px !important;
    width: 102% !important;
    height: 80% !important;
  object-fit: contain !important;
  pointer-events: none !important;
  z-index: 6 !important;
}

/* --- Overrides pop-up Profil (même rendu que Navbar.vue) --- */

/* Taille avatar (popup) */
.profile-popup {
  --profile-avatar-size: 150px;
}

.profile-popup .profile-avatar-stage {
  position: relative;
  width: min(100%, 340px) !important;
  height: auto;
  box-sizing: border-box;
  border-radius: 12px;
  border: none !important;
  display: flex !important;
  align-items: center;
  justify-content: center;
  margin-left: auto;
  margin-right: auto;
}

.profile-popup .profile-avatar-scaler {
  position: relative !important;
  width: 100% !important;
  height: 100% !important;
  display: flex !important;
  align-items: center;
  justify-content: center;
  transform: none !important;
  transform-origin: initial !important;
}

.profile-popup .profile-avatar {
  width: 150px !important;
  height: 150px !important;
  border-width: 5px !important;
  border-style: solid;
  box-sizing: border-box !important;
  line-height: 0;
  box-shadow: none !important;
  overflow: hidden !important;
  border-radius: 24px !important;
  position: relative !important;
  z-index: 2 !important;
}
.profile-popup .profile-avatar.no-border {
  border: none !important;
  background: transparent !important;
}
.profile-popup .profile-avatar .avatar-img {
  display: block !important;
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
  object-position: center !important;
}

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

.profile-popup .matrix-rain-inside { top: 0%; left: 0%; width: 100%; height: 100%; }
.profile-popup .equipped-cat-ears { top: -22%; left: 14%; width: 70%; height: 94%; }
.profile-popup .equipped-stars { top: 9%; left: 23%; width: 55%; height: 80%; position: absolute; z-index: 2; pointer-events: none; }
.profile-popup .equipped-rainbow { top: 17%; left: 25%; width: 62%; height: 65%; }
.profile-popup .equipped-flash-overlay { position: absolute; top: 18%; left: 27%; width: 50%; height: 53%; object-fit: contain; pointer-events: none; z-index: 2; }
.profile-popup .equipped-clown-overlay { top: -11%; left: 24%; width: 66%; height: 100%; }
.profile-popup.leaderboard-profile-popup .equipped-clown-overlay { top: 42% !important; left: 50% !important; transform: translate(-50%, -50%) !important; width: 64% !important; height: 91% !important; }
.profile-popup .equipped-clown-nose { width: 65%; height: 65%; }
.profile-popup .equipped-target-inside { top: -15px; left: -10px; }
.profile-popup .equipped-roi-overlay { top: -26%; left: 22%; width: 63%; height: 56%; }
.profile-popup .equipped-royal-frame { top: 6%; left: 14%; width: 96%; height: 88%; }
.profile-popup .equipped-gentleman-overlay { top: -13%; left: 24%; width: 63%; height: 45%; }
.profile-popup .equipped-moustache-inside { top: 20px; left: 8px; width: 80%; height: 75%; }
.profile-popup .equipped-vinyle-overlay { top: -21%; left: 33%; width: 46%; height: 56%; }
.profile-popup .equipped-advisory-inside { top: 97px; left: 76px; width: 56%; height: 37%; }
.profile-popup .equipped-asteroide-overlay { top: 133px; left: 102px; width: 23%; height: 30%; }
.profile-popup .equipped-absolute-cinema-overlay { left: 24px; top: 8%; width: 30%; height: 70%; }
.profile-popup .equipped-absolute-cinema-overlay-right { left: 214px; top: 8%; width: 30%; height: 70%; }
.profile-popup .equipped-camera-overlay { top: 56%; left: 29%; width: 24%; height: 28%; }
.profile-popup .equipped-chat-overlay { top: -13%; left: 13%; width: 109%; height: 70%; }
.profile-popup .equipped-pate-overlay { pointer-events: none; position: absolute; top: 59%; left: 27%; width: 22%; height: 19%; object-fit: contain; z-index: 15; }
.profile-popup .equipped-nokia-inside { top: 80%; left: 13%; width: 60%; }
.profile-popup .equipped-clippy-inside { top: 38px; left: 74px; }
.leaderboard-container .leaderboard-profile-popup .equipped-daftpunk-overlay { top: -24%; left: 31%; width: 36%; height: 44%; }
.profile-popup .equipped-jojo-inside { bottom: -2px; left: 150px; width: 95%; height: 38%; }
.profile-popup .equipped-jojotext-inside { top: -12px; right: 20px; width: 75%; height: 85%; }
.profile-popup .equipped-galaxie-overlay { top: -36px;
    left: -19px;
    width: 110%;
    height: 136%; }
.profile-popup .equipped-coeur-overlay { top: -12px; left: -23px; }
.profile-popup .equipped-angel-wings { position: absolute; top: -28%; left: 2%; width: 96%; height: 75%; z-index: 0; pointer-events: none; }
.profile-popup .equipped-tomb-raider { position: absolute; top: -73px; left: 0px; width: 102%; height: 71%; z-index: 0; pointer-events: none; }
.profile-popup .equipped-lunettes-pixel-inside { position: absolute; top: 53%; left: 50%; width: 109%; height: 108%; object-fit: contain; transform: translate(-50%, -50%); pointer-events: none; z-index: 1; }

@media (min-width: 320px) and (max-width: 768px) {
  .leaderboard-profile-popup .equipped-roi-overlay { top: -17% !important; left: 19% !important; width: 71% !important; height: 62% !important; }
  .leaderboard-profile-popup .equipped-cat-ears { top: -80px !important; left: 11px !important; width: 89% !important; height: 117% !important; }
  .leaderboard-profile-popup .equipped-angel-wings { top: -12% !important; left: 0% !important; width: 100% !important; height: 75% !important; z-index: 0 !important; }
  .leaderboard-profile-popup .equipped-tomb-raider { top: 12px !important; left: 8% !important; width: 83% !important; height: 43% !important; }
  .leaderboard-profile-popup .equipped-stars { top: 10% !important; left: 18% !important; width: 64% !important; height: 80% !important; }
  .leaderboard-profile-popup .equipped-royal-frame { top: 6% !important; left: -3% !important; width: 132% !important; height: 88% !important; }
  .leaderboard-profile-popup .equipped-rainbow { top: 16% !important; left: 12% !important; width: 94% !important; height: 67% !important; }
  .leaderboard-profile-popup .equipped-gentleman-overlay { top: -1px !important; left: 65px !important; width: 65% !important; height: 55% !important; }
  .leaderboard-profile-popup .equipped-vinyle-overlay { top: 22px !important; left: 70px !important; width: 62% !important; height: 37% !important; }
  .leaderboard-profile-popup .equipped-advisory-inside { width: 75% !important; top: 34% !important; left: 40% !important; }
  .leaderboard-profile-popup .equipped-asteroide-overlay { top: 104px !important; left: 75px !important; width: 25% !important; height: 50% !important; }
  .leaderboard-profile-popup .equipped-absolute-cinema-overlay { top: 14% !important; left: -37% !important; width: 100% !important; height: 60% !important; }
  .leaderboard-profile-popup .equipped-absolute-cinema-overlay-right { top: 14% !important; left: 37% !important; width: 100% !important; height: 60% !important; }
  .leaderboard-profile-popup .equipped-camera-overlay { top: 49% !important; left: 24% !important; width: 26% !important; height: 39% !important; }
  .leaderboard-profile-popup .equipped-flash-overlay { top: 12% !important; left: 32% !important; width: 41% !important; height: 59% !important; }
  .leaderboard-profile-popup .equipped-chat-overlay { top: -18% !important; left: 30% !important; width: 70% !important; height: 90% !important; }
  .leaderboard-profile-popup .equipped-pate-overlay { top: 55% !important; left: 26% !important; width: 18% !important; height: 25% !important; }
  .leaderboard-profile-popup .equipped-daftpunk-overlay { top: 2% !important; left: 27% !important; width: 45% !important; height: 44% !important; }
  .leaderboard-profile-popup .equipped-clippy-inside { top: 51% !important; left: 56% !important; width: 49% !important; height: 50% !important; }
  .leaderboard-profile-popup .equipped-discord-overlay { top: 44px !important; left: 31px !important; width: 72% !important; height: 72% !important; }
  .leaderboard-profile-popup .equipped-jojo-inside { bottom: -2px !important; left: 145px !important; width: 90% !important; height: 40% !important; }
  .leaderboard-profile-popup .equipped-jojotext-inside { top: -5px !important; right: 2px !important; width: 95% !important; height: 74% !important; }
  .leaderboard-profile-popup .equipped-alpha-overlay { top: 42px !important; left: 55px !important; width: 59% !important; height: 65% !important; }
  .leaderboard-profile-popup .equipped-admin-planify-overlay { height: 63% !important; left: -1px !important; top: 18% !important; }
  .profile-popup.leaderboard-profile-popup .equipped-lunettes-pixel-inside { top: 50% !important; left: 50% !important; height: 108% !important; width: 107% !important; }
  .profile-popup.leaderboard-profile-popup .equipped-clown-overlay { top: 42% !important; left: 50% !important; transform: translate(-50%, -50%) !important; width: 81% !important; height: 91% !important; }
  .leaderboard-container .equipped-clown-nose {
    position: absolute !important;
    top: 54% !important;
    left: 48% !important;
    transform: translate(-50%, -50%) !important;
    width: 87% !important;
    height: 40% !important;
    object-fit: contain !important;
    pointer-events: none !important;
    z-index: 16 !important;
  }
  .leaderboard-container .equipped-clown-overlay {
    pointer-events: none !important;
    position: absolute;
    top: -31.7% !important;
    left: -4% !important;
    width: 129% !important;
    height: 129% !important;
    transform: translate(-10%);
    pointer-events: none;
    z-index: 15 !important;
  }
}

@media (min-width: 769px) {
  .leaderboard-profile-popup .equipped-cat-ears { top: -50px !important; left: 9px !important; width: 93% !important; height: 93% !important; }
  .leaderboard-profile-popup .equipped-clown-overlay { top: -12.7% !important; left: 25% !important; width: 63% !important; height: 106% !important; z-index: 15 !important; }
  .leaderboard-profile-popup .equipped-clown-nose { top: 54% !important; left: 50% !important; transform: translate(-50%, -50%) !important; width: 68% !important; height: 43% !important; }
  .leaderboard-profile-popup .equipped-roi-overlay { top: -15% !important; left: 22% !important; width: 63% !important; height: 56% !important; }
  .leaderboard-profile-popup .equipped-angel-wings { top: -43px !important; left: 5px !important; width: 96% !important; height: 70% !important; }
  .leaderboard-profile-popup .equipped-tomb-raider { top: -10% !important; left: 25% !important; width: 47% !important; height: 66% !important; }
  .leaderboard-profile-popup .equipped-stars { top: -3% !important; left: 25% !important; width: 51% !important; height: 106% !important; }
  .leaderboard-profile-popup .equipped-royal-frame { top: 6% !important; left: 17% !important; width: 80% !important; height: 89% !important; }
  .leaderboard-profile-popup .equipped-rainbow { top: 16% !important; left: 26% !important; width: 62% !important; height: 67% !important; }
  .leaderboard-profile-popup .equipped-gentleman-overlay { top: -3px !important; left: 95px; width: 55% !important; height: 55% !important; }
  .leaderboard-profile-popup .equipped-vinyle-overlay { top: -36px; left: 123px; width: 34% !important; height: 65% !important; }
  .leaderboard-profile-popup .equipped-advisory-inside { top: 50px; left: 63px; width: 67% !important; }
  .leaderboard-profile-popup .equipped-asteroide-overlay { top: 105px; left: 104px; width: 20% !important; height: 50% !important; }
  .leaderboard-profile-popup .equipped-absolute-cinema-overlay { top: 1px !important; left: 17px !important; width: 30% !important; height: 75% !important; }
  .leaderboard-profile-popup .equipped-absolute-cinema-overlay-right { top: 1px !important; left: 221px !important; width: 30% !important; height: 75% !important; }
  .leaderboard-profile-popup .equipped-camera-overlay { top: 56% !important; left: 29% !important; width: 23% !important; height: 28% !important; }
  .leaderboard-profile-popup .equipped-flash-overlay { top: 21% !important; left: 20% !important; width: 62% !important; height: 55% !important; }
  .leaderboard-profile-popup .equipped-chat-overlay { top: -56px !important; left: 117px !important; width: 55% !important; }
  .leaderboard-profile-popup .equipped-pate-overlay { top: 55% !important; left: 30% !important; width: 15% !important; height: 25% !important; }
  .leaderboard-profile-popup .equipped-galaxie-overlay { top: -8px !important; left: -19px !important; width: 110% !important; height: 107% !important; }
  .leaderboard-profile-popup .equipped-coeur-overlay { top: 29px !important; }
  .leaderboard-profile-popup .equipped-lunettes-pixel-inside { top: 50% !important; left: 50% !important; height: 108% !important; width: 107% !important; }
  .leaderboard-profile-popup .equipped-clippy-inside { top: 41px !important; left: 84px !important; width: 43% !important; }
  .leaderboard-profile-popup .equipped-daftpunk-overlay { top: 2% !important; left: 32% !important; width: 36% !important; height: 44% !important; }
  .leaderboard-profile-popup .equipped-discord-overlay { top: 46px !important; left: 66px !important; width: 56% !important; height: 70% !important; }
  .leaderboard-profile-popup .equipped-jojo-inside { left: 150px !important; width: 95% !important; height: 38% !important; }
  .leaderboard-profile-popup .equipped-jojotext-inside { top: -12px !important; right: 6px !important; width: 90% !important; height: 85% !important; }
  .leaderboard-profile-popup .equipped-alpha-overlay { top: 45px !important; left: 67px !important; width: 61% !important; height: 63% !important; }
  .leaderboard-profile-popup .equipped-admin-planify-overlay { top: 26px !important; left: 91px !important; width: 46% !important; height: 80% !important; }
}

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
.profile-popup .volume-seek-bar-horizontal { width: 100%; height: 20px; position: relative; cursor: pointer; display: flex; align-items: center; touch-action: none; }
.profile-popup .seek-track-vertical { width: 4px; height: 100%; background: #9ca3af; border-radius: 2px; position: absolute; }
.profile-popup .seek-fill-vertical { width: 4px; background: #3ddc84; border-radius: 2px; position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); pointer-events: none; }
.profile-popup .seek-thumb-vertical { width: 16px; height: 16px; background: #ff0000; border-radius: 50%; position: absolute; left: 50%; transform: translate(-50%, 50%); pointer-events: none; box-shadow: 0 1px 3px rgba(0,0,0,0.3); transition: transform 0.1s; }
.profile-popup .volume-seek-bar-vertical:hover .seek-thumb-vertical { transform: translate(-50%, 50%) scale(1.2); }
.profile-popup .volume-slider-container.horizontal { width: 160px; height: 0; padding: 0; }
.profile-popup .volume-slider-container.horizontal.visible { height: 32px; padding: 6px 10px; }
.profile-popup .volume-seek-bar-horizontal .seek-track-vertical { width: 100%; height: 4px; }
.profile-popup .volume-seek-bar-horizontal .seek-fill-vertical { height: 4px; width: 0; left: 0; top: 50%; bottom: auto; transform: translateY(-50%); }
.profile-popup .volume-seek-bar-horizontal .seek-thumb-vertical { top: 50%; bottom: auto; left: 0; transform: translate(-50%, -50%); }
.profile-popup .volume-seek-bar-horizontal:hover .seek-thumb-vertical { transform: translate(-50%, -50%) scale(1.2); }
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
  position: absolute;
  top: -76px;
  left: -48px;
  width: 197%;
  height: 148%;
  z-index: 0;             /* Derrière la bordure de l’avatar */
  pointer-events: none;
}

/* Tomb Raider – uniquement dans la pop-up profil du leaderboard */
.profile-popup .equipped-tomb-raider {
  position: absolute;
  top: -47px;
  left: 0px;
  width: 102%;
  height: 71%;
  z-index: 0;              /* Derrière la bordure de l’avatar */
  pointer-events: none;
}


.profile-popup .equipped-cat-ears {
  position: absolute;
  top: -101px;
  left: -47px;
  width: 158%;
  height: 155%;
  z-index: 2;           /* Passe au-dessus de la bordure/avatar */
  pointer-events: none; /* Ne capte pas les clics */
}

/* AJOUT: alignements des overlays manquants avec la Navbar */
.profile-popup .equipped-vinyle-overlay {
  position: absolute;
  top: -45px;
  left: 19px;
  width: 82%;
  height: 65%;
  z-index: 2;
  pointer-events: none;
}
.profile-popup .equipped-chat-overlay {
  position: absolute;
  top: -56px;
  left: 117px;
  width: 55%;
  z-index: 2;
  pointer-events: none;
}
/* AJOUT: Clown (profil popup) */
.profile-popup .equipped-clown-overlay {
  position: absolute;
  top: -42px;
  left: 79px;
  width: 65%;
  height: 110%;
  z-index: 2;
  pointer-events: none;
}
.profile-popup .equipped-clown-nose {
  position: absolute;
  width: 65%;
  height: 65%;
  z-index: 2;
  pointer-events: none;
}
/* Valeurs par défaut sûres pour Lunettes pixel en pop-up profil */
.profile-popup .equipped-lunettes-pixel-inside {
  position: absolute !important;
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
  z-index: 2;
  pointer-events: none;
}

/* Ajustements spécifiques de la Navbar reproduits ici pour la pop-up profil */
.profile-popup .equipped-target-inside { top: -15px; left: -10px; }
.profile-popup .equipped-royal-frame { top: -33px; left: -10px; width: 151%; height: 158%; }
.profile-popup .equipped-gentleman-overlay { top: -30px; left: 5px; width: 110%; height: 55%; }
.profile-popup .equipped-advisory-inside { top: 50px; left: 64px; }
.profile-popup .equipped-absolute-cinema-overlay { top: -10px; left: -30px; width: 30%; height: 100%; }
                  .profile-popup .equipped-absolute-cinema-overlay-right { left: 224px; top: -10%; width: 30%; height: 100%; }
.profile-popup .equipped-nokia-inside { top: 80%; left: 15%; width: 60%; }
.profile-popup .equipped-jojo-inside { bottom: -2px; left: 109px; width: 111%; height: 38%; }
.profile-popup .equipped-jojotext-inside { top: -12px; right: 6px; width: 90%; height: 85%; }

/* Ajustements demandés pour la pop-up de profil via leaderboard */
.profile-popup .equipped-advisory-inside { width: 75%; height: 63%; }
.profile-popup .equipped-asteroide-overlay { top: 53px; left: 7px; width: 50%; height: 50%; }
.profile-popup .equipped-flash-overlay { left: 7px; width: 85%; height: 100%; }
.profile-popup .equipped-chat-overlay { width: 101%; }
.profile-popup .equipped-dvd-inside { width: 65%; }

/* Lunettes pixel */
.profile-popup .equipped-lunettes-pixel-inside {
  top: 58px;
  left: 51px;
  width: 95%;
}

/* Nokia: Daft Punk + Clippy */
.profile-popup .equipped-daftpunk-overlay { top: -24%; left: 31%; width: 36%; height: 44%; }
.profile-popup .equipped-clippy-inside { top: 56px; left: 84px; width: 43%; }

/* Discord (leaderboard – pop-up profil) */
.profile-popup .equipped-discord-overlay { top: -6px; left: -15px; width: 120%; height: 121%; }
.profile-popup .equipped-discord { top: -6px; left: -15px; width: 120%; height: 121%; }

/* Galaxie (pop-up profil leaderboard) */
.profile-popup .equipped-galaxie,
.profile-popup .equipped-galaxie-overlay {
      top: -72px;
    left: 30px;
    width: 81%;
    height: 173%;
}

/* Coeur (pop-up profil leaderboard) */
.profile-popup .equipped-coeur,
.profile-popup .equipped-coeur-overlay {
  top: -2px;
    left: -46px;
    width: 128%;
    height: 100%;
}

/* Alpha (pop-up profil leaderboard) */
.profile-popup .equipped-alpha,
.profile-popup .equipped-alpha-overlay {
  top: 17px;
    left: -32px;
    width: 120%;
    height: 80%;
}

/* Leaderboard (hors pop-up) – Coeur */
.leaderboard-container .equipped-coeur,
.leaderboard-container .equipped-coeur-overlay {
  top: -7px;
  left: -8px;
  width: 133%;
  height: 128%;
}

/* Pate (leaderboard – pop-up profil) */
.profile-popup .equipped-pate-overlay {
  pointer-events: none;
  position: absolute;
  top: 55%;
  left: 10%;
  width: 35%;
  height: 35%;
  object-fit: contain;
  z-index: 15;
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
  overflow-y: auto;
  max-height: 600px;
  padding-right: 5px;
  scrollbar-gutter: auto;
}
.leaderboard-list.faction-leaderboard-list .leaderboard-item {
  width: 325px;
  height: 120px ;
  min-height: 120px ;
}
@media (min-width: 1219px) {
  .factions-section .leaderboard-list.faction-leaderboard-list {
    width: 340px;
    max-width: 360px;
    overflow-x: hidden;
    padding-right: 0px !important;
    margin-right: -23px;
    scrollbar-gutter: auto;
  }
  .factions-section .leaderboard-list.faction-leaderboard-list .leaderboard-item {
    width: 325px;
    height: 120px;
    min-height: 120px;
  }


}

@media (min-width: 1025px) and (max-width: 1218px) {
  .leaderboard-list.faction-leaderboard-list {
    width: 275px !important;
  }
}

/* Scrollbars plus fins (leaderboard + factions) */
.leaderboard-list::-webkit-scrollbar,
  .faction-leaderboard-list::-webkit-scrollbar {
    width: 4px !important;
  }

/* Mobile: retirer le scrollbar-gutter sur la liste des factions */
@media (max-width: 1024px) {
  .leaderboard-list.faction-leaderboard-list {
    scrollbar-gutter: auto !important;
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
  width: 98%;
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

.faction-join-enter-active,
.faction-join-leave-active {
  transition: transform 0.35s ease, opacity 0.35s ease;
}
.faction-join-enter-from,
.faction-join-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
.faction-join-enter-to,
.faction-join-leave-from {
  opacity: 1;
  transform: translateY(0);
}

.faction-join-static-enter-active,
.faction-join-static-leave-active {
  transition: none;
}
.faction-join-static-enter-from,
.faction-join-static-leave-to {
  opacity: 1;
  transform: none;
}
.faction-join-static-enter-to,
.faction-join-static-leave-from {
  opacity: 1;
  transform: none;
}

.faction-member-badge {
  width: 325px;
  padding: 10px 15px;
  margin-top: -10px;
  margin-bottom: 15px;
  background: linear-gradient(135deg, #2196F3, #1976D2);
  color: white;
  border-top-left-radius: 0;
  border-top-right-radius: 0;
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
  font-size: 0.8rem;
  text-align: center;
}

.faction-member-badge.just-joined {
  animation: faction-clip-in 0.35s ease both;
}

@keyframes faction-clip-in {
  0% { opacity: 0; transform: translateY(10px); }
  100% { opacity: 1; transform: translateY(0); }
}

@media (max-width: 1218px) {
  .faction-member-badge {
    width: 100%;
    font-size: 0.7rem;
  }
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
        padding: 0px 0px 0px !important;
        width: 100% !important;
        max-width: 107% !important;
        border-radius: 18% 18% 0% 0%;
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: center !important;
  }

  .faction-total-card,
  .faction-total-card.selected {
        width: 275px !important;
        max-width: 275px !important;
        margin: 0 auto !important;
        position: relative !important;
        z-index: 2 !important;
  }


  .faction-member-badge {
    width: 100%;
    font-size: 0.7rem;
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
.faction-leaderboard-list .equipped-vinyle,
.faction-leaderboard-list .equipped-vinyle-overlay {
  left: -11% !important;
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
  position: relative;
}
.popup-delete-confirm h3 {
  margin-top: 0;
  font-size: 2.1em;
  font-family: 'Cobe Heavy', Inter, sans-serif;
}
.popup-delete-confirm p {
  margin-bottom: 18px;
}
.faction-confirm-text {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.faction-confirm-text h3,
.faction-confirm-text p {
  margin: 0;
}
.popup-delete-confirm button {
  background: linear-gradient(90deg, #39ff7a 0%, #6EFF78 100%);
  color: #fff;
  border: none;
  border-radius: 14px;
  padding: 12px 0;
  font-size: 1.2em;
  font-weight: bold;
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
.popup-delete-confirm .close-btn {
  background: transparent;
  box-shadow: none;
  border: none;
}
.popup-delete-confirm .close-btn:hover,
.popup-delete-confirm .close-btn:focus,
.popup-delete-confirm .close-btn:focus-visible {
  background: transparent;
  box-shadow: none;
  border: none;
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
    font-size: 1.5em;
  }
  .popup-delete-confirm {
    background: #fff;
    border-radius: 18px;
    padding: 40px 10px;
    min-width: 300px;
    max-width: 6px;
    min-height: 220px;
    max-height: 80vh;
    box-shadow: 0 2px 24px #0003;
  }
  .faction-delete-actions .btn-cancel-delete,
  .faction-delete-actions .btn-confirm-delete {
    min-width: 110px;
    padding: 10px 18px;
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
  .weekly-section .shop-item.weekly-item.small-card .jojo-text-preview.jojotext-fade[data-v-dfad078d] {
    left: 31px !important;
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
  grid-template-columns: 30% 68% !important;
  gap: 4% !important;
  align-items: start !important;
}
.personal-section { display: flex; flex-direction: column; gap: 20px; order: 1 !important; height: 100%; width: 350px; }
.factions-section { display: flex; flex-direction: column; gap: 10px; order: 2 !important; }
.factions-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

/* Fallback mobile (≤1024px): colonne */
@media (max-width: 1218px) {
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
    width: 277px !important;
    grid-template-columns: none !important;
    gap: 20px !important;
    position: relative !important;
  }

  .factions-grid::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 119.25px;
    background: #1a1a1a;
    z-index: 1;
    pointer-events: none;
  }

  .faction-col {
    padding: 0px 0px 0px 0px !important;
    width: 100% !important;
    max-width: 100% !important;
    border-radius: 18% 18% 0% 0%;
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: center !important;
  }

  /* Centering cards and lists */
  .faction-total-card,
  .faction-total-card.selected {
    width: 277px !important;
    max-width: 275px !important;
    margin: 0 auto !important;
    position: relative !important;
    z-index: 2 !important;
  }

  .leaderboard-list {
    width: 270px !important;
    max-width: 280px !important;
    padding-top: 5px;
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
  }
  .faction-leaderboard-list {
    padding: 0px !important;
  }
  .leaderboard-list.faction-leaderboard-list {
    width: 275px !important;
  }

  .leaderboard-list .leaderboard-item,
  .faction-leaderboard-list .leaderboard-item {
    width: 270px !important;
    max-width: 259px !important;
    height: 120px !important;
    min-height: 120px !important;
    margin: 0 auto 10px auto !important;
    box-sizing: border-box !important;
    overflow: hidden !important;
  }

  .header-close { position: absolute !important; top: 12px !important; right: 16px !important; width: 40px !important; height: 40px !important; padding: 0 !important; }
  .header-close .close-img { width: 32px !important; height: 32px !important; }

  /* Countdown text size on mobile */
  .countdown-text { font-size: 15px !important; }

  .join-faction-btn {
    width: 85% !important;
  }
}

@media (min-width: 1159px) and (max-width: 1183px) {
  .shop-modal.collection-desktop-override .collection-search {
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    gap: 8px !important;
    margin: 0 0 16px !important;
  }
  .shop-modal.collection-desktop-override .collection-search-input {
    margin: 0 auto !important;
    max-width: 250px !important;
  }
  .shop-modal.collection-desktop-override .collection-search .info-icon-btn {
    align-self: center !important;
  }
  .shop-modal.collection-desktop-override .collection-search .tab-btn {
    width: 250px !important;
    max-width: 250px !important;
    display: block !important;
    margin: 4px 0 0 !important;
  }
}

@media (min-width: 1184px) {
  .shop-tabs { width: 372px !important; }
  .shop-modal.collection-desktop-override .shop-header {
    display: flex !important;
    align-items: baseline !important;
    flex-direction: row;
    justify-content: space-between !important;
    gap: 12px !important;
  }
  .shop-modal.collection-desktop-override .header-left {
    display: flex !important;
    flex-direction: column !important;
    gap: 6px !important;
  }
  .shop-modal.collection-desktop-override .shop-title {
    text-align: left !important;
    margin: 0 0 12px 0 !important;
    color: #00c97b !important;
    font-size: 3.4rem !important;
  }
  .shop-modal.collection-desktop-override .header-right {
    display: flex !important;
    align-items: center !important;
    gap: 8px !important;
    justify-content: flex-end !important;
  }
  .shop-modal.collection-desktop-override .shop-tabs {
    display: flex !important;
    gap: 4px !important;
    margin: 0 !important;
    padding: 0 !important;
    align-items: center !important;
    justify-content: flex-start !important;
    flex-direction: row !important;
  }
  .shop-modal.collection-desktop-override .tab-btn {
    padding: 12px 20px !important;
    border: none !important;
    background: #f8f9fa !important;
    border-radius: 10px !important;
    font-size: 15px !important;
    cursor: pointer !important;
    color: #666 !important;
    border: 2px #5150503d solid !important;
    transition: all 0.3s !important;
    position: relative !important;
    width: auto !important;
    max-width: none !important;
    margin: 0 !important;
  }
  .shop-modal.collection-desktop-override .tab-btn:hover {
    background: #e9ecef !important;
    color: #333 !important;
  }
  .shop-modal.collection-desktop-override .tab-btn.active {
    background: #5bc682 !important;
    color: #fff !important;
    border: none !important;
    transform: translateY(-2px) !important;
    box-shadow: 0 4px 12px rgba(0, 201, 123, 0.3) !important;
  }
  .shop-modal.collection-desktop-override .tab-btn:active,
  .shop-modal.collection-desktop-override .tab-btn:focus {
    border: none !important;
    outline: none !important;
  }
  .shop-modal.collection-desktop-override .header-close {
    position: static !important;
    right: auto !important;
    top: auto !important;
    width: 60px !important;
    height: 60px !important;
    padding: 0 !important;
  }
  .shop-modal.collection-desktop-override .header-close .close-img {
    width: 48px !important;
    height: 48px !important;
  }
  .shop-modal.weekly-desktop-override .shop-header,
  .shop-modal.leaderboard-desktop-override .shop-header {
    display: flex !important;
    align-items: baseline !important;
    flex-direction: row;
    justify-content: space-between !important;
    gap: 12px !important;
  }
  .shop-modal.weekly-desktop-override .header-left,
  .shop-modal.leaderboard-desktop-override .header-left {
    display: flex !important;
    flex-direction: column !important;
    gap: 6px !important;
  }
  .shop-modal.weekly-desktop-override .shop-title,
  .shop-modal.leaderboard-desktop-override .shop-title {
    text-align: left !important;
    margin: 0 0 12px 0 !important;
    color: #00c97b !important;
    font-size: 3.4rem !important;
  }
  .shop-modal.weekly-desktop-override .header-right,
  .shop-modal.leaderboard-desktop-override .header-right {
    display: flex !important;
    align-items: center !important;
    gap: 8px !important;
    justify-content: flex-end !important;
  }
  .shop-modal.weekly-desktop-override .shop-tabs,
  .shop-modal.leaderboard-desktop-override .shop-tabs {
    display: flex !important;
    gap: 4px !important;
    margin: 0 !important;
    padding: 0 !important;
    align-items: center !important;
    justify-content: flex-start !important;
    flex-direction: row !important;
  }
  .shop-modal.weekly-desktop-override .tab-btn,
  .shop-modal.leaderboard-desktop-override .tab-btn {
    padding: 12px 20px !important;
    border: none !important;
    background: #f8f9fa !important;
    border-radius: 10px !important;
    font-size: 15px !important;
    cursor: pointer !important;
    color: #666 !important;
    border: 2px #5150503d solid !important;
    transition: all 0.3s !important;
    position: relative !important;
    width: auto !important;
    max-width: none !important;
    margin: 0 !important;
  }
  .shop-modal.weekly-desktop-override .tab-btn:hover,
  .shop-modal.leaderboard-desktop-override .tab-btn:hover {
    background: #e9ecef !important;
    color: #333 !important;
  }
  .shop-modal.weekly-desktop-override .tab-btn.active,
  .shop-modal.leaderboard-desktop-override .tab-btn.active {
    background: #5bc682 !important;
    color: #fff !important;
    border: none !important;
    transform: translateY(-2px) !important;
    box-shadow: 0 4px 12px rgba(0, 201, 123, 0.3) !important;
  }
  .shop-modal.weekly-desktop-override .tab-btn:active,
  .shop-modal.weekly-desktop-override .tab-btn:focus,
  .shop-modal.leaderboard-desktop-override .tab-btn:active,
  .shop-modal.leaderboard-desktop-override .tab-btn:focus {
    border: none !important;
    outline: none !important;
  }
  .shop-modal.weekly-desktop-override .header-close,
  .shop-modal.leaderboard-desktop-override .header-close {
    position: static !important;
    right: auto !important;
    top: auto !important;
    width: 60px !important;
    height: 60px !important;
    padding: 0 !important;
  }
  .shop-modal.weekly-desktop-override .header-close .close-img,
  .shop-modal.leaderboard-desktop-override .header-close .close-img {
    width: 48px !important;
    height: 48px !important;
  }
  .shop-modal.weekly-desktop-override .header-info-row {
    display: flex !important;
    flex-direction: row !important;
    gap: 12px !important;
  }
  .shop-modal.weekly-desktop-override .timer-label { font-size: 20px !important; }
  .shop-modal.weekly-desktop-override .timer-value { font-size: 20px !important; }
  .shop-modal.weekly-desktop-override .coins-wallet .coins-value { font-size: 20px !important; }
  .shop-modal.collection-desktop-override .collection-search {
    display: flex !important;
    align-items: center !important;
    gap: 12px !important;
    margin: 0 0 16px 0 !important;
  }
  .shop-modal.collection-desktop-override .collection-search-input {
    width: 100% !important;
    max-width: 420px !important;
    padding: 10px 12px !important;
    border: 1px solid #E9E9EA !important;
    border-radius: 12px !important;
    background: #fff !important;
    color: #111 !important;
    margin: 0 !important;
  }
  .shop-modal.collection-desktop-override .info-icon-btn {
    background: #fffc !important;
    border: 1px solid #e5e7eb !important;
    border-radius: 999px !important;
    width: 28px !important;
    height: 28px !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    cursor: pointer !important;
  }
  .shop-modal.collection-desktop-override .collection-grid {
    display: grid !important;
    grid-template-columns: repeat(5, minmax(200px, 1fr)) !important;
    gap: 25px !important;
  }
  .shop-modal.collection-desktop-override .collection-grid .shop-item {
    width: auto !important;
    max-width: none !important;
    margin: 0 !important;
  }
  .shop-modal.collection-desktop-override .collection-grid .item-img-wrapper {
    width: 90px !important;
    height: 90px !important;
    margin: 0 auto 18px !important;
  }
}

@media (max-width: 1286px) {


  .weekly-preview .preview-card.preview-item .buy-btn {
    width: 100% !important;
    max-width: 340px !important;
    margin-left: auto !important;
    margin-right: auto !important;
    font-size: 22px !important;
    margin: 10px auto !important;
  }
}

/* Hide mobile filters on Desktop */
@media (min-width: 1219px) {
  .mobile-only-filters { display: none !important; }
}
.profile-left, .profile-right { justify-content: center; }
.profile-left-row { display:flex; gap:40px; justify-content: center; }
.profile-role-with-group { position: relative; display: inline-flex; align-items: center; gap: 15px; }
.profile-role-with-group .profile-outlets-row { display: inline-flex; align-items: center; gap: 10px; }
.profile-role-with-group .profile-role { position: relative; z-index: 2; }
.profile-group-outlet { position: relative; margin-left: 0; border: 4px solid #3ddc84; border-radius: 18px; width: 81px; height: 68px; display:flex; align-items:center; justify-content:center; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow:hidden; }
.profile-group-outlet .group-logo { width: 39px; height: 30px; object-fit: contain; display:block; }
.profile-group-outlet .group-text { font-size: 18px; font-weight: 700; color: #000; }
.profile-dept-outlet { position: relative; margin-left: 0; border: 4px solid #3ddc84; border-radius: 18px; width: 81px; height: 68px; display:flex; align-items:center; justify-content:center; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow:hidden; }
.profile-dept-outlet .dept-logo { width: 51px; height: 26px; object-fit: contain; display:block; }
.profile-dept-outlet .dept-text { font-size: 18px; font-weight: 700; color: #000; }
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
.profile-popup-overlay .profile-popup {
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 2px 24px #0003;
  padding: 28px 32px 32px 32px;
  width: min(900px, calc(100vw - 48px));
  position: relative;
  text-align: center;
  font-family: 'Cobe Heavy', Inter, sans-serif;
  --profile-avatar-size: 140px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  max-height: calc(100dvh - 48px - env(safe-area-inset-top) - env(safe-area-inset-bottom));
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: auto;
}
.profile-popup .profile-avatar-stage { width: 340px !important; height: 200px !important; box-sizing: border-box; border-radius: 24px; border: none !important; display: flex !important; align-items: center; justify-content: center; }
.profile-popup .profile-avatar-scaler { position: static !important; width: auto !important; height: auto !important; transform: none !important; transform-origin: initial !important; }
.profile-popup .profile-avatar { width: 150px !important; height: 150px !important; border-width: 5px !important; border-style: solid !important; box-sizing: border-box; overflow: hidden !important; border-radius: 30px !important; position: relative !important; z-index: 2 !important; line-height: 0; }
.profile-popup .profile-avatar.no-border { border: none !important; border-style: none !important; border-width: 0 !important; background: transparent !important; box-shadow: none !important; }
.profile-popup .profile-avatar .avatar-img { width: 100% !important; height: 100% !important; display: block !important; object-fit: cover !important; object-position: center !important; }
@media (max-width: 768px) {
  .profile-popup.leaderboard-profile-popup { padding: 28px 32px 32px 32px;         max-width: 100%;
        width: min(350px, 100%);
        border-radius: 12px;
        display: flex;
        align-items: center; }
  .profile-popup.leaderboard-profile-popup .profile-card-grid { display: flex; align-items: center; justify-content: center; flex-direction: column; }
  .profile-popup.leaderboard-profile-popup .profile-left,
  .profile-popup.leaderboard-profile-popup .profile-right { width: 100%; max-width: 83%; display: flex; align-items: center; justify-content: center; flex-direction: column; }
  .profile-popup.leaderboard-profile-popup .profile-left-stack { width: 100%; }
  .profile-popup.leaderboard-profile-popup .profile-role-with-group { position: relative; display: inline-flex; align-items: center; gap: 15px; justify-content: center; flex-direction: column; }
  .profile-popup.leaderboard-profile-popup .profile-role-with-group .profile-role { order: 1; }
  .profile-popup.leaderboard-profile-popup .profile-role-with-group .profile-outlets-row { order: 2; display: inline-flex; gap: 15px; justify-content: center; }
  .profile-popup.leaderboard-profile-popup .profile-avatar-stage { width: 100% !important; max-width: 320px !important; margin-left: auto; margin-right: auto; }
  .profile-popup.leaderboard-profile-popup .profile-divider { display: none; }
  .profile-popup.leaderboard-profile-popup .profile-section-title { font-size: 18px !important; }
  .profile-popup .equipped-galaxie-overlay { top: 0px !important; left: -14px !important; width: 108% !important; height: 103% !important; }
  .profile-popup .equipped-coeur-overlay { top: -24px !important; left: -20px; width: 139%; height: 122%; }
  .profile-popup .equipped-admin-planify-overlay { height: 102%; left: -1px; }
}
.profile-popup .equipped-roi-overlay { top: -51%; left: 15%; width: 86%; height: 75%; }
.profile-popup .equipped-cat-ears { top: -76px; left: -59px; width: 133%; height: 117%; }
.profile-popup .equipped-clown-nose { position: absolute; width: 41%; height: 42%; z-index: 2; pointer-events: none; }
.profile-popup .equipped-angel-wings { position: absolute; top: -90px; left: -162px; width: 197%; height: 90%; z-index: 0; pointer-events: none; }
.profile-popup .equipped-tomb-raider { position: absolute; top: -70px; left: 0; width: 102%; height: 71%; z-index: 0; pointer-events: none; }
.profile-popup .equipped-royal-frame, .profile-popup .equipped-royal-frame-overlay { position: absolute; top: -5%; left: -3%; width: 132%; height: 110%; object-fit: contain; pointer-events: none; z-index: 15; }
.profile-popup .equipped-rainbow, .profile-popup .equipped-rainbow-overlay { position: absolute; top: 8%; left: 12%; width: 94%; height: 83%; object-fit: contain; pointer-events: none; z-index: 15; }
.profile-popup .equipped-gentleman-overlay { top: -115px; left: 95px; width: 55%; height: 55%; }
.profile-popup .equipped-vinyle-overlay { position: absolute; top: -36px; left: 125px; width: 85%; height: 65%; z-index: 2; pointer-events: none; }
.profile-popup .equipped-asteroide-overlay { top: 50px; left: 100px; width: 20%; height: 50%; }
.profile-popup .equipped-gentleman-overlay { top: -50px; left: 95px; width: 55%; height: 55%; }
.profile-popup .equipped-asteroide-overlay { top: 105px; left: 108px; width: 20%; height: 50%; }
.leaderboard-container .equipped-absolute-cinema, .leaderboard-container .equipped-absolute-cinema-overlay { position: absolute; top: -10%; left: -31%; width: 100%; height: 100%; object-fit: contain; pointer-events: none; z-index: 15; }
profile-popup .equipped-absolute-cinema-overlay-right { left: 224px; top: -10%; width: 30%; height: 100%; }
.leaderboard-container .equipped-camera-overlay { position: absolute; top: 40%; left: 30%; width: 18%; height: 70%; object-fit: contain; pointer-events: none; z-index: 3; }
.profile-popup .equipped-pate-overlay { position: absolute; top: 60%; left: 21%; width: 33%; height: 25%; object-fit: contain; pointer-events: none; z-index: 15; }
.leaderboard-container .equipped-chat-overlay { position: absolute; top: -13%; left: 17%; width: 108%; height: 70%; object-fit: contain; pointer-events: none; z-index: 3; }
.profile-popup .equipped-lunettes-pixel-inside { top: 50%; left: 50%; height: 108%; width: 107%; }
.leaderboard-container .equipped-clippy-inside { position: absolute; top: 50px; left: 83px; width: 43%; height: 78%; object-fit: contain; pointer-events: none; z-index: 2; }
.leaderboard-container .equipped-daftpunk, .leaderboard-container .equipped-daftpunk-overlay { position: absolute; top: -65%; left: 11%; width: 80%; height: 90%; object-fit: contain; pointer-events: none; z-index: 15; }
.profile-popup .equipped-discord-overlay, .profile-popup .equipped-discord { top: 16px; left: 4px; width: 92%; height: 94%; }
.leaderboard-container .equipped-jojo-inside { position: absolute; bottom: -2px; left: 45px; width: 90%; height: 40%; object-fit: contain; pointer-events: none; z-index: 6; }
.leaderboard-container .equipped-jojotext-inside { position: absolute; top: -7px; right: 2px; width: 95%; height: 100%; object-fit: contain; pointer-events: none; z-index: 7; }

/* Fix alignement item-actions boutique quotidienne */
.weekly-shop-container .item-actions {
  align-items: initial;
}

@media (max-width: 1300px) {
  .weekly-preview .item-name {
    font-size: 22px !important;
  }
  .weekly-preview .item-price {
    font-size: 22px !important;
  }
}
</style>
