<template>
  <div v-if="show" class="shop-overlay" @click.self="emitClose">
    <div class="shop-modal">
      <button class="close-btn" @click="emitClose" @mouseover="hoverCloseShop = true" @mouseleave="hoverCloseShop = false">
        <img :src="hoverCloseShop ? closeHoverImg : closeImg" alt="Fermer" class="close-img" />
      </button>
      <h1 class="shop-title">Boutique Planify</h1>
      <div class="coins-balance">
        <img src="@/assets/img/planicoins.webp" alt="Coin" class="coin-icon" />
        <span>{{ userCoins }} Planify Coins</span>
      </div>
      
      <!-- Onglets de la boutique -->
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
          Boutique quotidienne
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
      
      
      <!-- Compteur pour la boutique quotidienne -->
      <div v-if="activeTab === 'weekly'" class="weekly-timer">
        <div class="timer-info">
          <span class="timer-label">Nouvelle rotation quotidienne dans :</span>
          <span class="timer-value">{{ timeUntilReset }}</span>
        </div>
      </div>

      <!-- Collection -->
      <div v-if="activeTab === 'main'" class="shop-grid">
        <div 
          v-for="(item, index) in collectionItems" 
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
          
                      <div class="item-img-wrapper" :style="item.name === 'Roi' || item.name === 'Matrix' || item.name === 'Oreilles de chat' || item.name === 'Ange' || item.name === 'Tomb Raider' || item.name === 'Clown' || item.name === 'Cash' || item.name === 'Cible' || item.name === 'Étoiles' || item.name === 'Cadre royale' || item.name === 'Roses' || item.name === 'Gentleman' || item.name === 'Vinyle' || item.name === 'Advisory' || item.name === 'Espace' || item.name === 'Absolute Cinema' || item.name === 'Flash' || item.name === 'Miaou' || item.name === 'DVD' || item.name === 'Lunettes pixel' || item.name === '2000' ? 'background: #fff;' : ''">
              <div class="item-img-container" :key="item.name === 'Jojo' ? 'jj-'+jojoAnimKey : 'imgc-'+index" :class="{ 'black-bg': item.name === 'Étoiles' || item.name === 'Espace' || item.name === 'DVD', 'jojo-bg-anim': item.name === 'Jojo' }">
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
                <div v-if="item.name === 'Cash'" class="cash-animation-shop">
                  <img :src="cash" :alt="item.name" class="cash-img-shop" loading="lazy" />
                </div>

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
                  <img v-if="coinsStore.jojoVariantIndex === 1" :key="'c-jojotext-'+jojoAnimKey" :src="jojotext" alt="Jojo texte" class="jojo-text-preview jojotext-fade" :style="getJojoTextStyle()" />
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
          </div>
          <div class="item-name">{{ item.name }}</div>
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
            <button v-if="coinsStore.hasItem(item.id)" class="equip-btn" :class="{ 'equipped': coinsStore.isItemEquipped(item.id) }" @click="equipItem(item)">
              {{ coinsStore.isItemEquipped(item.id) ? 'Déséquiper' : 'Équiper' }}
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
      <div v-if="activeTab === 'weekly'" class="weekly-shop-container">
              <!-- Items Spéciaux -->
      <div class="weekly-section">
        <h3 class="section-title">Items Spéciaux</h3>
          <div class="shop-grid">
            <div v-for="item in normalWeeklyItems" :key="item.id" class="shop-item weekly-item" :class="{ 'equipped': coinsStore.isItemEquipped(item.id) }">

                 <!-- Bouton Aperçu pour la boutique hebdomadaire (tous items, dyn ou statiques) -->
                 <button 
                class="apercu-icon"
                type="button"
                @click.stop="handlePreviewNavbar(item)"
                title="Aperçu Navbar"
                :style="getApercuIconPos(item)"
              >
                <img :src="apercuIcon" alt="Aperçu" style="width: 18px; height: 18px; object-fit: contain;" />
              </button>

              <!-- Checkmark pour les items débloqués -->
              <div v-if="coinsStore.hasItem(item.id)" class="checkmark-icon">✓</div>
              <!-- Cadenas pour les items verrouillés -->
              <div v-if="!coinsStore.hasItem(item.id)" class="lock-icon">🔒</div>
              <!-- Icône palette pour Discord et Jojo (aperçu des styles) - affichée même si non possédé -->
              <button 
                v-if="item.name === 'Discord'"
                class="palette-icon"
                type="button"
                @click.stop="openDiscordStylePicker(item)"
                title="Changer le style Discord"
              >
                <img :src="styleIcon" alt="Palette" style="width: 18px; height: 18px; object-fit: contain;" />
              </button>
              <button 
                v-if="item.name === 'Jojo'"
                class="palette-icon"
                type="button"
                @click.stop="openJojoStylePicker(item)"
                title="Changer le style Jojo"
              >
                <img :src="styleIcon" alt="Palette" style="width: 18px; height: 18px; object-fit: contain;" />
              </button>
              <!-- Palette pour les items dynamiques avec variantes (boutique hebdo, affichée même si non possédé) -->
              <button 
                v-if="item.isDynamic && Array.isArray(item.variants) && item.variants.length > 0"
                class="palette-icon"
                type="button"
                @click.stop="openDynamicStylePicker(item)"
                title="Changer le style"
              >
                <img :src="styleIcon" alt="Palette" style="width: 18px; height: 18px; object-fit: contain;" />
              </button>
            <div class="item-img-wrapper" :style="item.name === 'Roi' || item.name === 'Matrix' || item.name === 'Oreilles de chat' || item.name === 'Ange' || item.name === 'Tomb Raider' || item.name === 'Clown' || item.name === 'Cash' || item.name === 'Cible' || item.name === 'Étoiles' || item.name === 'Cadre royale' || item.name === 'Roses' || item.name === 'Gentleman' || item.name === 'Vinyle' || item.name === 'Advisory' || item.name === 'Espace' || item.name === 'Absolute Cinema' || item.name === 'Flash' || item.name === 'Miaou' || item.name === 'DVD' || item.name === 'Lunettes pixel' || item.name === '2000' ? 'background: #fff;' : ''">
              <div class="item-img-container" :key="item.name === 'Jojo' ? 'jjw-'+jojoAnimKey : 'imgcw-'+index" :class="{ 'black-bg': item.name === 'Étoiles' || item.name === 'Espace' || item.name === 'DVD', 'jojo-bg-anim': item.name === 'Jojo' }">
                <!-- Dyn background + assets (comme Collection) -->
                <template v-if="item.isDynamic && Array.isArray(item.assets) && item.assets.length">
                  <div class="dyn-bg" :style="getDynBgStyle(item)"></div>
                  <img v-for="(a, ai) in item.assets" :key="'dynw-'+item.id+'-'+ai" :src="resolveAssetSrc(a.src)" :style="getDynWeeklyAssetStyle(a)" />
                </template>
                <!-- Items dynamiques avec variantes (boutique hebdo) -->
                <template v-else-if="item.isDynamic && Array.isArray(item.variants) && item.variants.length > 0">
                  <div class="dyn-bg" :key="'dynw-bg-'+item.id+'-'+variantUpdateKey" :style="getDynVariantBgStyle(item)"></div>
                  <img
                    v-for="(a, ai) in getDynVariantAssets(item)"
                    :key="'dynw-variant-'+item.id+'-'+ai+'-'+variantUpdateKey"
                    :src="resolveAssetSrc(a.src)"
                    :style="getDynVariantAssetStyle(a)"
                  />
                </template>
                <img v-if="!item.isDynamic && item.name !== 'Matrix' && item.name !== 'Clown' && item.name !== 'Cash' && item.name !== 'Roi' && item.name !== 'Cible' && item.name !== 'Étoiles' && item.name !== 'Cadre royale' && item.name !== 'Roses' && item.name !== 'Gentleman' && item.name !== 'Vinyle' && item.name !== 'Advisory' && item.name !== 'Espace' && item.name !== 'Absolute Cinema' && item.name !== 'Flash' && item.name !== 'Miaou' && item.name !== 'DVD' && item.name !== 'Lunettes pixel' && item.name !== '2000' && item.name !== 'Tomb Raider' && item.name !== 'Ange' && item.name !== 'Discord' && item.name !== 'Jojo' && item.name !== 'Galaxie' && item.name !== 'Coeur'" :src="item.img" :alt="item.name" class="item-img" />
                
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
                <div v-if="item.name === 'Cash'" class="cash-animation-shop">
                  <img :src="cash" :alt="item.name" class="cash-img-shop" loading="lazy" />
                </div>
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
                <!-- Item Jojo -->
                <div v-if="item.name === 'Jojo'" class="jojo-item-shop">
                  <img :key="'w-jojo-'+jojoAnimKey" :src="jojo" :alt="item.name" class="jojo-img-shop jojo-swipe jojo-sepia-anim" :style="getJojoImgStyle()" />
                  <img v-if="coinsStore.jojoVariantIndex === 1" :key="'w-jojotext-'+jojoAnimKey" :src="jojotext" alt="Jojo texte" class="jojo-text-preview jojotext-fade" :style="getJojoTextStyle()" />
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
            </div>
            <div class="item-name">{{ item.name }}</div>
            <div class="item-price" :class="{ 'creator-has-name': hasCreatorName(item) }">
              <template v-if="item.infoOnly || item.infoDescription">
                <button type="button" class="info-icon-btn" @click.stop="openInfoItem(item)">
                  <img :src="infoIcon" alt="Infos" style="width: 18px; height: 18px; object-fit: contain;" />
                </button>
              </template>
              <template v-else>
                <img src="@/assets/img/planicoins.webp" alt="Coin" class="coin-icon" />
                {{ getItemPrice(item) }}
              </template>
            </div>
            <div
              v-if="hasCreatorName(item)"
              class="creator-badge"
              :class="{ clickable: (hasCreatorId(item) || hasCreatorName(item)), static: !(hasCreatorId(item) || hasCreatorName(item)) }"
              :title="(hasCreatorId(item) || hasCreatorName(item)) ? 'Voir le profil du créateur' : ''"
            >
              <span class="creator-label">Créé par</span>
              <span class="creator-names-line">
                <template v-for="(name, i) in getCreatorNames(item)" :key="'cr-week-'+i">
                  <span class="creator-name" @click.stop="onCreatorNameClick(name)">{{ name }}</span><span v-if="i < getCreatorNames(item).length - 1">, </span>
                </template>
              </span>
            </div>
            <div class="item-actions">
              <button v-if="!coinsStore.hasItem(item.id)" class="buy-btn" :disabled="userCoins < getItemPrice(item)" @click="buyItem(item)">Acheter</button>
              <button v-else class="equip-btn" :class="{ 'equipped': coinsStore.isItemEquipped(item.id) }" @click="equipItem(item)">
                {{ coinsStore.isItemEquipped(item.id) ? 'Déséquiper' : 'Équiper' }}
              </button>
            </div>
          </div>
        </div>
      </div>

        <!-- Variantes de Bordures Classiques -->
        <div class="weekly-section">
          <h3 class="section-title">Variantes de Bordures Classiques</h3>
          <div class="shop-grid">
            <div v-for="item in borderWeeklyItems" :key="item.id" class="shop-item weekly-item border-item" :class="{ 'equipped': coinsStore.selectedBorderColor === coinsStore.getBorderColorIdFromItem(item) }">
                <!-- Bouton Aperçu pour variantes de bordures classiques -->
                <button 
                  class="apercu-icon"
                  type="button"
                  @click.stop="handlePreviewNavbar(item)"
                  title="Aperçu Navbar"
                  style="top: 8px; left: 10px;"
                >
                  <img :src="apercuIcon" alt="Aperçu" style="width: 18px; height: 18px; object-fit: contain;" />
                </button>
              <!-- Icônes comme dans la Collection -->
              <div v-if="coinsStore.hasItem(item.id)" class="checkmark-icon">✓</div>
              <div v-if="!coinsStore.hasItem(item.id)" class="lock-icon">🔒</div>

              <div class="item-img-wrapper">
                <div class="item-img-container">
                  <!-- aperçu Bordure classique dans les items hebdo -->
                  <div class="classic-border-preview" :style="getWeeklyClassicFillStyle(item)" data-darkreader-ignore></div>
                </div>
              </div>
              <div class="item-name">{{ getWeeklyColorName(item) }}</div>
              <div class="item-price" :class="{ 'creator-has-name': hasCreator(item) }">
                <template v-if="item.infoOnly || item.infoDescription">
                  <button type="button" class="info-icon-btn" @click.stop="openInfoItem(item)">
                    <img :src="infoIcon" alt="Infos" style="width: 18px; height: 18px; object-fit: contain;" />
                  </button>
                </template>
                <template v-else>
                  <img src="@/assets/img/planicoins.webp" alt="Coin" class="coin-icon" />
                  {{ getItemPrice(item) }}
                </template>
              </div>
              <div class="item-actions">
                <button v-if="!coinsStore.hasItem(item.id)" class="buy-btn" :disabled="userCoins < getItemPrice(item)" @click="buyItem(item)">
                  Acheter
                </button>
                <button 
                  v-else-if="coinsStore.selectedBorderColor !== coinsStore.getBorderColorIdFromItem(item)" 
                  class="equip-btn" 
                  :class="{ 'equipped': false }" 
                  @click="handleEquipWeeklyBorder(item)"
                >
                  Équiper
                </button>
                <button 
                  v-else 
                  class="equip-btn" 
                  :class="{ 'equipped': true }" 
                  @click="handleEquipWeeklyBorder(item)"
                >
                  Déséquiper
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- Leaderboard -->
      <div v-if="activeTab === 'leaderboard' && showLeaderboardTab" class="leaderboard-container">
        <!-- Filtres de tri -->
        <div class="leaderboard-filters">
          <button 
            class="filter-btn" 
            :class="{ active: leaderboardFilter === 'coins' }" 
            @click="leaderboardFilter = 'coins'"
          >
            <img src="@/assets/img/planicoins.webp" alt="Coin" class="coin-icon" />
            PlanifyCoins
          </button>
          <button 
            class="filter-btn" 
            :class="{ active: leaderboardFilter === 'tasks' }" 
            @click="leaderboardFilter = 'tasks'"
          >
            ✅ Tâches complétées
          </button>
          <button 
            class="filter-btn" 
            :class="{ active: leaderboardFilter === 'factions' }" 
            @click="leaderboardFilter = 'factions'"
          >
            ⚔️ Factions
          </button>
        </div>

        <!-- Affichage Factions (2 colonnes) -->
        <div v-if="leaderboardFilter === 'factions'" class="factions-leaderboard">
          <div class="factions-columns">
            <!-- Colonne Bagnat -->
            <div class="faction-column">
              <h3 class="faction-title">Bagnat</h3>
              <div class="faction-total-coins">
                <span class="faction-total-label">PlanifyCoins collecté :</span>
                <img src="@/assets/img/planicoins.webp" alt="Coin" class="coin-icon" />
                <span>{{ formatCoins(factionTotalCoins.bagnat) }}</span>
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
                          <div class="matrix-column" v-for="i in 20" :key="'f-bagnat-list-mx-'+i" :style="{ left: (i * 5) + '%', animationDelay: (Math.random() * 2) + 's' }">
                            <span v-for="j in 5" :key="'f-bagnat-list-mx-ch-'+j" class="matrix-char">{{ getRandomMatrixChar() }}</span>
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
            <div class="faction-column">
              <h3 class="faction-title">Fermier</h3>
              <div class="faction-total-coins">
                <span class="faction-total-label">PlanifyCoins collecté :</span>
                <img src="@/assets/img/planicoins.webp" alt="Coin" class="coin-icon" />
                <span>{{ formatCoins(factionTotalCoins.fermier) }}</span>
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
                            v-if="getUserEquippedItemData(user).displayType === 'dvd'" 
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

        <!-- Liste des utilisateurs (affichage normal) -->
        <div v-if="leaderboardFilter !== 'factions'" class="leaderboard-list">
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
              v-if="getUserEquippedItemData(user).name === 'Jojo'" 
                      :src="jojo" 
                      alt="Jojo"
                      class="equipped-jojo-inside"
                      :key="'lb-jojo-'+getJojoVariantIndexForUser(user)"
                    />
                    <img 
              v-if="getUserEquippedItemData(user).name === 'Jojo' && getJojoVariantIndexForUser(user) === 1" 
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
                {{ user.completedTasks || 0 }} tâches
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
            <h2>Profil</h2>

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
                           && getUserEquippedItemData(selectedUser).name !== 'Miaou'" 
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

            <div class="profile-info">
              <div><strong>Nom d'utilisateur :</strong> {{ selectedUser?.username || selectedUser?.name || 'Utilisateur' }}</div>
              <div><strong>Rôle :</strong> {{ selectedUser?.role ? afficherRole(selectedUser.role) : '—' }}</div>
              <div><strong>Année :</strong> {{ selectedUser?.year ? afficherAnnee(selectedUser.year) : '—' }}</div>
              <div><strong>Groupe :</strong> {{ selectedUser?.groupe || '—' }}</div>
              <div class="coins-profile-row">
                <strong>PlanifyCoins :</strong>
                <span class="coins-value">{{ (selectedUser?.leaderboardCoins ?? selectedUser?.coins ?? 0) }}</span>
                <img src="@/assets/img/planicoins.webp" alt="Coin" class="coin-icon" />
              </div>
              <div v-if="selectedUser?.specialite"><strong>Spécialité :</strong> {{ afficherSpecialite(selectedUser.specialite) }}</div>
            </div>

            <!-- Musique de profil (si disponible) -->
            <div v-if="showUserProfile && selectedUser" class="leaderboard-profile-music">
              <div v-if="selectedUser.musicSrc" class="profile-music-block">
                <img :src="vinylePopup" alt="Vinyle" class="vinyle-gif" />
                <div class="marquee popup-big-title" :title="selectedUser.musicTitle || ''">
                  <span>{{ selectedUser.musicTitle || 'Sans titre' }}</span>
                </div>

                <div class="popup-audio-controls">
                  <button type="button" class="btn btn-icon" @click="togglePopupPlay" :title="isPopupPlaying ? 'Pause' : 'Lire'">
                    <svg v-if="!isPopupPlaying" viewBox="0 0 24 24" class="icon">
                      <polygon points="8,5 19,12 8,19" fill="currentColor" />
                    </svg>
                    <svg v-else viewBox="0 0 24 24" class="icon">
                      <rect x="6" y="5" width="5" height="14" fill="currentColor" />
                      <rect x="13" y="5" width="5" height="14" fill="currentColor" />
                    </svg>
                  </button>
                </div>


                <!-- Audio de la pop-up -->
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
 <div class="popup-volume" style="display:flex;  justify-content: center; align-items:center; gap:8px; margin-top:8px;">
                  <span style="font-size:12px; color:#000;">Volume</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    v-model.number="popupMusicVolume"
                    aria-label="Volume musique pop-up"
                    style="width:140px;"
                  />
                  <span style="width:36px; text-align:right; font-size:12px; color:#000;">{{ Math.round(popupMusicVolume) }}%</span>
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
      </transition>
      <!-- Popup d'infos pour items non achetables (Planify / Prestige / Cœur / Galaxie) -->
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

      <!-- Popup de sélection de style pour Discord -->
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

      <!-- Popup de sélection de style pour Jojo -->
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
                <span style="font-size:12px; color: #000;">Par défaut</span>
              </div>
              <div class="color-swatch" data-darkreader-ignore @click="applyJojoVariant(1)" style="display:flex;align-items:center;justify-content:center;background:#fff;">
                <img :src="jojotext" alt="Avec texte" style="width:50px;height:50px;object-fit:contain;" />
              </div>
            </div>
          </div>
        </div>
      </transition>

      <!-- Popup de sélection de style pour les items dynamiques -->
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
                    <img v-for="(asset, ai) in (variant.assets || [])" :key="ai" :src="resolveAssetSrc(asset.src)" :style="getDynVariantPreviewStyle(asset)" />
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>
      </transition>

      <!-- Popup de sélection de couleur pour la Bordure classique -->
      <transition name="fade">
        <div v-if="isColorPickerOpen" class="color-picker-overlay" @click.self="closeColorPicker">
          <div class="color-picker-modal" data-darkreader-ignore>
            <div class="color-picker-header">
              <span>Choisir une couleur</span>
              <button class="close-btn-small" @click="() => { hoverCloseColor = false; closeColorPicker() }" @mouseover="hoverCloseColor = true" @mouseleave="hoverCloseColor = false">
                <img :src="hoverCloseColor ? closeHoverImg : closeImg" alt="Fermer" class="close-img" />
              </button>
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
    </div>
    <!-- Modale de confirmation de changement de faction -->
    <div v-if="factionConfirmVisible" class="popup-overlay" @click="cancelConfirmFaction">
      <div class="popup-content popup-delete-confirm faction-delete-confirm" @click.stop>
        <h3>Confirmation de changement de faction</h3>
        <p>
          Êtes-vous sûr de vouloir rejoindre {{ pendingFaction }} ?
          Cette action coûte 200 Planify Coins.
        </p>
        <div class="faction-delete-actions">
          <button @click="cancelConfirmFaction" class="btn-cancel-delete">Non</button>
          <button @click="confirmJoinFaction" :disabled="joiningFaction" class="btn-confirm-delete">Oui</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
 import { ref, defineProps, defineEmits, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCoinsStore } from '@/stores/coins'
import { useAuthStore } from '@/stores/auth'
import { secureApiCall, API_URL } from '@/api'
// Icône remplacée par planicoins.png
import catEars from '@/assets/accounttt.svg' // Utilisé comme placeholder
import accountIcon from '@/assets/accounttt.svg' // Icône par défaut pour les avatars
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
import discordon from '@/assets/img/discordon.webp'
import discordnepasderange from '@/assets/img/discordnepasderange.webp'
import discordderange from '@/assets/img/discordderange.webp'
import styleIcon from '@/assets/img/style.webp'
import jojo from '@/assets/img/tobecontinued.webp'
import jojotext from '@/assets/img/jojotext.gif'
import infoIcon from '@/assets/img/infos_items.webp'
import apercuIcon from '@/assets/aperçu-icon.webp'

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
watch(() => props.show, (v) => { if (v === true) hoverCloseShop.value = false })

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
    const res = await secureApiCall('/items')
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
        variants: Array.isArray(it.variants) ? it.variants : [],
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
  } catch {
    dynamicItems.value = []
    dynamicInfoById.value = new Map()
    dynamicInfoByName.value = new Map()
    dynamicItemDisplays.clear()
  }
}

// Collection de tous les items (achetés et non achetés)
const collectionItems = computed(() => {
  return [...shopItems, ...dynamicItems.value]
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
    } catch {
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
    } catch {
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
  // Charger les variantes dynamiques depuis le store
  try { coinsStore.loadDynamicItemVariants() } catch {}
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
// Recharger les items dynamiques à l'ouverture de la popup
watch(() => props.show, (v) => { if (v && authStore.isLoggedIn) loadDynamicItems() })
onUnmounted(() => {
  try { window.removeEventListener('resize', updateIsMobile) } catch {}
  try { window.removeEventListener('items-changed', loadDynamicItems) } catch {}
  try { window.removeEventListener('dynamic-variant-changed', () => {}) } catch {}
  try { window.removeEventListener('user-public-note-changed', handleUserPublicNoteChanged) } catch {}
})

function getDynAssetStyle(asset) {
  const mobile = !!isMobile.value
  const s = mobile
    ? ((asset && asset.collectionStyleMobile) || asset?.collectionStyle || asset?.style || {})
    : ((asset && asset.collectionStyle) || asset?.style || {})
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
  // Leaderboard: même style pour desktop et mobile
  const s = (asset && asset.leaderboardStyle) || asset?.style || {}
  // Pour être sûr que les overlays "au-dessus" passent bien devant, relever le z-index par défaut
  const style = { position: 'absolute', objectFit: s.objectFit || 'contain', zIndex: typeof s.zIndex === 'number' ? s.zIndex : 15 }
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
  } catch {}
  return 'profile-avatar'
}

function getProfilePopupAssetsUnified(item) {
  if (item && Array.isArray(item.variants) && item.variants.length > 0) {
    // Réutilise les assets de la variante courante (déjà présents dans ShopPopup.vue)
    return getDynVariantAssetsForLeaderboard(item)
  }
  return Array.isArray(item && item.assets) ? item.assets : []
}

function getProfilePopupAssetsForTargetPlacement(item, target, placement) {
  try {
    const arr = getProfilePopupAssetsUnified(item)
    return (Array.isArray(arr) ? arr : []).filter((a) => {
      const t = getEffectiveProfilePopupTarget(item, a)
      if (t !== target) return false
      const p = (a && a.meta && (a.meta.profilePopupPlacement ?? a.meta.navbarPlacement)) || 'below'
      return p === placement
    })
  } catch { return [] }
}

function getDynProfilePopupAssetStyle(asset) {
  // Priorité: style profil, sinon fallback leaderboard/style générique
  const s = (asset && (asset.profilePopupStyle || asset.leaderboardStyle || asset.style)) || {}
  const style = { position: 'absolute', objectFit: s.objectFit || 'contain', zIndex: typeof s.zIndex === 'number' ? s.zIndex : undefined, pointerEvents: 'none' }
  if (typeof s.top === 'number') style.top = s.top + 'px'
  if (typeof s.left === 'number') style.left = s.left + 'px'
  if (typeof s.width === 'number') style.width = s.width + 'px'
  if (typeof s.height === 'number') style.height = s.height + 'px'
  if (typeof s.rotate === 'number') style.transform = `rotate(${s.rotate}deg)`
  if (typeof style.zIndex !== 'number') {
    const placement = asset && asset.meta && (asset.meta.profilePopupPlacement ?? asset.meta.navbarPlacement)
    style.zIndex = (placement === 'above') ? 15 : 1
  }
  return style
}

// Détermine si la bordure doit être retirée dans la pop-up Profil (aligné avec Navbar.vue)
function shouldRemoveProfilePopupBorder(item) {
  try {
    if (!item) return false
    const itemId = (item.legacyId !== undefined) ? item.legacyId : item.id
    const vi = (typeof coinsStore.getDynamicItemVariant === 'function') ? coinsStore.getDynamicItemVariant(itemId) : 0
    const variant = Array.isArray(item.variants) ? item.variants[vi] : null
    if (variant && (variant.removeProfilePopupBorder === true || variant.removeNavbarBorder === true)) return true
    if (item.meta && (item.meta.removeProfilePopupBorder === true || item.meta.removeNavbarBorder === true)) return true
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
    if (variant && (variant.removeLeaderboardBorder === true || variant.removeNavbarBorder === true || variant.removeProfilePopupBorder === true)) return true
    if (item.meta && (item.meta.removeLeaderboardBorder === true || item.meta.removeNavbarBorder === true || item.meta.removeProfilePopupBorder === true)) return true
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
    if (variant && (variant.removeLeaderboardBorder === true || variant.removeNavbarBorder === true || variant.removeProfilePopupBorder === true)) return false
    if (item.meta && (item.meta.removeLeaderboardBorder === true || item.meta.removeNavbarBorder === true || item.meta.removeProfilePopupBorder === true)) return false
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
    // Utiliser la variante sélectionnée depuis le store (legacyId prioritaire)
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

function getDynVariantAssets(item) {
  try {
    // Utiliser la variante sélectionnée depuis le store (legacyId prioritaire)
    const itemId = (typeof item.legacyId !== 'undefined') ? item.legacyId : item.id
    const variantIndex = coinsStore.getDynamicItemVariant(itemId)
    const variant = item.variants && item.variants[variantIndex]
    if (!variant) {
      return []
    }
    // Si c'est un style texte uniquement, retourner les assets de la base avec les styles de la variante
    if (variant.textOnly) {
      const baseAssets = Array.isArray(item.assets) ? item.assets : []
      return baseAssets.map(asset => ({
        ...asset,
        style: variant.assets?.[0]?.style ?? asset.style,
        collectionStyle: variant.assets?.[0]?.collectionStyle ?? asset.collectionStyle,
        collectionStyleMobile: variant.assets?.[0]?.collectionStyleMobile ?? asset.collectionStyleMobile,
      }))
    }
    return Array.isArray(variant.assets) ? variant.assets : []
  } catch {
    return []
  }
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
      const baseMeta = (baseBySrc && baseBySrc.meta) ? baseBySrc.meta : (baseByIndex && baseByIndex.meta ? baseByIndex.meta : {})
      const mergedMeta = (a && a.meta) ? { ...baseMeta, ...a.meta } : baseMeta
      return { ...a, meta: mergedMeta }
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
  // Utiliser les styles de popup style s'ils existent, sinon fallback sur collection
  const s = (asset && asset.popupStyleStyle) || (asset && asset.collectionStyle) || asset?.style || {}
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

// Fonction pour l'affichage des assets des variantes dans la Collection (même logique que l'Admin Editor)
function getDynVariantAssetStyle(asset) {
  if (!asset || typeof asset !== 'object') {
    return { position: 'absolute', objectFit: 'contain', zIndex: 1 }
  }
  // Utiliser les styles de la Collection (comme dans l'Admin Editor)
  const s = (asset && asset.collectionStyle) || asset?.style || {}
  const style = { 
    position: 'absolute', 
    objectFit: s.objectFit || 'contain', 
    zIndex: typeof s.zIndex === 'number' ? s.zIndex : 1,
    pointerEvents: 'auto',
    cursor: 'move'
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
const lockBodyScroll = () => {
  try { document.body.style.overflow = 'hidden' } catch (e) {}
}
const unlockBodyScroll = () => {
  try { document.body.style.overflow = '' } catch (e) {}
}
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

// Obtenir le prix courant d'un item (priorité au prix hebdomadaire s'il existe)
const getItemPrice = (item) => {
  const override = weeklyPriceMap.value.get(item.id)
  return typeof override !== 'undefined' ? override : item.price
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

// Variables pour le leaderboard
const leaderboardFilter = ref('coins')
const leaderboardUsers = ref([])
const showUserProfile = ref(false)
const selectedUser = ref(null)
const hoverCloseProfile = ref(false)

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
const popupMusicVolume = ref(Math.max(0, Math.min(100, Number(localStorage.getItem('musicVolume') ?? 60))))
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
  const el = e.target
  if (el._clipEnd !== undefined && el.currentTime >= el._clipEnd - 0.05) {
    el.pause()
    isPopupPlaying.value = false
  }
}
function onPopupLoadedMetadata(e) {
  try {
    const el = e && e.target ? e.target : popupAudioEl.value
    if (!el) return
    const vol = Math.max(0, Math.min(1, (Number(popupMusicVolume.value) || 0) / 100))
    // Toujours démuter l'élément sur iOS et régler le volume en natif
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
const isDiscordPickerOpen = ref(false)
const discordPickerItem = ref(null)
  const hoverCloseStyle = ref(false)
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
  const p = coinsStore.jojoImgPos || { top: 50, left: 87, width: 90 }
  return {
    position: 'absolute',
    top: p.top + 'px',
    left: p.left + 'px',
    width: p.width + '%',
    height: 'auto',
    objectFit: 'contain'
  }
}
function getJojoTextStyle() {
  const p = coinsStore.jojoTextPos || { top: -5, left: 5, width: 90 }
  return {
    position: 'absolute',
    top: p.top + 'px',
    left: p.left + 'px',
    width: p.width + '%',
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
  // Forcer un re-render pour resynchroniser les animations (Collection uniquement)
  jojoAnimKey.value = jojoAnimKey.value + 1
  closeJojoStylePicker()
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
    const id = (user && (user.id || user._id)) || ''
    if (!id) return accountIcon

    // version de cache-busting: avatarVersion prioritaire, sinon fallback sur avatarUpdatedAt (timestamp)
    const v = (typeof user.avatarVersion === 'number' && user.avatarVersion >= 0)
      ? user.avatarVersion
      : (user && user.avatarUpdatedAt ? (Date.parse(user.avatarUpdatedAt) || 0) : 0)
    const qs = (v !== null && v !== undefined) ? `?v=${encodeURIComponent(v)}` : ''

    // Route API standard (préférée, répond avec image/gif et no-store)
    const url = `${API_URL}/users/avatar/${encodeURIComponent(id)}${qs}`

    // Fallback: si l’avatar est un chemin statique déjà connu
    if (user && typeof user.avatar === 'string' && user.avatar.startsWith('/uploads/')) {
      const baseUrl = API_URL.replace(/\/api$/, '')
      const altV = (typeof user.avatarVersion === 'number' && user.avatarVersion >= 0)
        ? user.avatarVersion
        : (user && user.avatarUpdatedAt ? (Date.parse(user.avatarUpdatedAt) || 0) : 0)
      const altQs = (altV !== null && altV !== undefined) ? `?v=${encodeURIComponent(altV)}` : ''
      return `${baseUrl}${user.avatar}${altQs}`
    }

    // Dernier recours: URL API
    return url
  } catch (e) {
    console.error('getUserAvatar error:', e)
    return accountIcon
  }
}

 const handleAvatarError = (event) => {
   event.target.src = accountIcon
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
    const seed = String(seedObj?.id || seedObj?.name || 'matrix')
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
  if (authStore.isLoggedIn) {
    if (dynamicInfoById.value.size === 0) {
      await loadDynamicItems()
    }
    loadWeeklyItems()
  }
}

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
          const isDiscord = (it && it.id === 23) || it?.name === 'Discord'
          // Ne pas surcharger le prix: garder les prix renvoyés par l'API
          if (isDiscord) {
            return { ...it, img: fixedImg, variants: [discordon, discordnepasderange, discordderange], variantIndex: coinsStore.discordVariantIndex || 0 }
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
        weeklyItems.value = patched
        timeUntilReset.value = response.timeUntilReset || ''
        try { nextResetAt.value = Date.parse(response.nextReset) || 0 } catch { nextResetAt.value = 0 }
        updateWeeklyTimer()
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
    console.log('🔄 Chargement du leaderboard...')
    const response = await secureApiCall('/users/leaderboard')
    console.log('📊 Réponse leaderboard:', response)
    
    if (response.success && response.users) {
      leaderboardUsers.value = response.users
      console.log('✅ Leaderboard chargé:', leaderboardUsers.value.length, 'utilisateurs')
   } else {
      console.warn('⚠️ Pas de données leaderboard disponibles')
     leaderboardUsers.value = []
   }
 } catch (error) {
    console.error('Erreur lors du chargement du leaderboard:', error)
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
    userFaction.value = authStore.user?.faction || userFaction.value || null
    currentUserFactionEntry.value = userFaction.value === 'Bagnat'
      ? (resp?.currentUserBagnat || null)
      : userFaction.value === 'Fermier'
        ? (resp?.currentUserFermier || null)
        : null

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
      userFaction.value = response.faction || null
    }
  } catch (error) {
    console.error('Erreur lors du chargement de la faction utilisateur:', error)
  }
}

// Afficher l'encart "moi" uniquement si je ne suis pas déjà dans le top 10 de ma faction
const shouldShowPinnedMe = (faction) => {
  return false
}

// Fonction pour rejoindre une faction
const factionConfirmVisible = ref(false)
const pendingFaction = ref(null)
const CHANGE_COST = 200

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
  if (authStore.isLoggedIn) {
    loadWeeklyItems()
    loadLeaderboardUsers()
    loadFactionUsers()
    loadUserFaction()
    updateWeeklyTimer()
    loadDynamicItems()
  }
})

 onUnmounted(() => {
   if (weeklyTimer) {
     clearInterval(weeklyTimer)
   }
    // Sécurité: réactiver le scroll de la page si la popup était ouverte
    unlockBodyScroll()
 })

 // Watchers
 watch(activeTab, (newTab) => {
   if (!authStore.isLoggedIn) return
   if (newTab === 'leaderboard' && showLeaderboardTab.value) {
     loadLeaderboardUsers()
   } else if (newTab === 'weekly') {
     loadWeeklyItems()
   }
 })

 // Charger les factions quand on sélectionne l'onglet factions
 watch(leaderboardFilter, (newFilter) => {
   if (!authStore.isLoggedIn) return
   if (newFilter === 'factions') {
     loadFactionUsers()
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

 <style>
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
  overscroll-behavior: contain;
  touch-action: none;
}

.shop-modal {
  background: #fff;
  border-radius: 20px;
  padding: 50px;
  max-width: 1200px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  scrollbar-gutter: stable;
}

/* Scrollbar interne – décale visuellement et évite le débord sur coins arrondis */
.shop-modal::-webkit-scrollbar { width: 10px; }
.shop-modal::-webkit-scrollbar-track { background: transparent; margin: 12px 0; }
.shop-modal::-webkit-scrollbar-thumb { background: #cfcfcf; border-radius: 8px; }

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

.shop-title {
  text-align: center;
  margin-bottom: 20px;
  color: #00c97b;
  font-size: 3rem;
}

.coins-balance {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 25px;
  padding: 12px;
  border-radius: 12px;
  color: rgb(0, 0, 0);
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
    gap: 10px;
    margin-bottom: 25px;
    margin-left: 25px;
    border-bottom: 2px solid #f0f0f0;
    padding-bottom: 15px;
    align-items: center;
    justify-content: center;
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
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  padding: 15px;
  border-radius: 12px;
  margin-bottom: 20px;
  text-align: center;
}

.timer-info {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
}


  
  .timer-value {
    font-size: 20px;
  }

  .weekly-shop-container {
  display: flex;
  flex-direction: column;
    gap: 30px;
  }

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
    grid-template-columns: repeat(3, 1fr);
    gap: 25px;
    margin-top: 25px;
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
    width: 16px !important;
    height: 16px !important;
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
    width: 152% !important;
    height: 149% !important;
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
    top: -31%;
    left: -5%;
    width: 137% !important;
    height: 159% !important;
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
    top: -6%;
    left: 15%;
    width: 100% !important;
    height: 100% !important;
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
  .leaderboard-container .equipped-dvd-inside {
    position: absolute !important;
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
    top: 31%;
    left: 0%;
    width: 60% !important;
    height: 100% !important;
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
  grid-template-columns: repeat(5, 1fr);
  gap: 25px;
  margin-top: 25px;
}

/* Tailles PC pour les items */


/* Media query pour les écrans de 320px à 768px - Collection centrée en colonne */
@media (min-width: 320px) and (max-width: 1024px) {

  .leaderboard-empty {
    text-align: center;
  }

  .join-faction-btn {
    max-width: 70%;
  }

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
    margin-top: 20px !important;
    padding: 0 15px !important;
  }
  
  .shop-item {
    width: 100% !important;
    max-width: 280px !important;
    margin: 0 auto !important;
    text-align: center !important;
  }
  
  .item-img-wrapper {
    width: 80px !important;
    height: 80px !important;
    margin: 0 auto 15px !important;
  }
  
  .item-img-container {
    width: 80px !important;
    height: 80px !important;
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
    margin-bottom: 20px !important;
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
    top: 30px !important;
    left: -2px !important;
  }
  
  .clippy-img-shop {
    max-width: 100% !important;
    max-height: 35% !important;
    object-fit: contain !important;
    position: absolute !important;
    top: 37px !important;
    left: 40px !important;
  }
  
  .daftpunk-img-shop {
    max-width: 60% !important;
    max-height: 80% !important;
    object-fit: contain !important;
    position: absolute !important;
    top: 0 !important;
    left: 16px !important;
  }
  
  .spacestars-img-shop {
    max-width: 90% !important;
    max-height: 100% !important;
    object-fit: contain !important;
    position: absolute !important;
    top: 4% !important;
    left: 5px !important;
  }
  
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
    min-height: 150px;
    display: flex;
    align-items: center;
    background: #fff;
    height: 130px;
    padding: 15px;
    border-radius: 12px;
    box-shadow: 0 2px 8px #0000001a;
    transition: transform .2s;
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
    left: 8px !important;
    width: 72% !important;
    height: auto !important;
    object-fit: contain !important;
  }

  .jojo-img-shop {
    position: absolute !important;
    top: 50px !important;
    left: 78px !important;
    width: 90% !important;
    height: auto !important;
    object-fit: contain;
  }

  .discord-img-shop {
    position: absolute !important;
    top: -3px !important;
    left: 12px !important;
    width: 65% !important;
    height: 112% !important;
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

@media (min-width: 340px) and (max-width: 1024px) {

 
  
  .leaderboard-item {
    display: flex;
    align-items: center;
    gap: 0px;
    background: #fff;
    height: 130px;
    width: 100% !important;
    max-width: 100% !important;
    margin: 0 auto;
    padding: 15px;
    border-radius: 12px;
    box-shadow: 0 2px 8px #0000001a;
    transition: transform .2s;
    box-sizing: border-box;
    overflow: hidden;          /* clip des overlays */
  }
}

/* Media query pour les écrans PC à partir de 1025px */
@media (min-width: 1025px) {
  .shop-grid {
        /* display: flex !important; */
        flex-direction: column !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 20px !important;
        margin-top: 20px !important;
        padding: 0 15px !important;
    }

    .shop-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 25px;
    margin-top: 25px;
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
.jojo-bg-anim { animation: jojo-bg-cycle 4.7s steps(1, end) infinite; }
@keyframes jojo-bg-cycle {
  0%, 8.99% { background-color: #ffffff; }
  9%, 99% { background-color: #f1e5c6; }
  100% { background-color: #ffffff; }
}
/* Filtre sépia + timings pour l'aperçu Collection de Jojo */
/* Filtre sépia synchronisé avec le moment d'arrivée de la flèche (même timing que Navbar) */
.jojo-sepia-anim { animation: jojo-sepia-cycle 4.7s steps(1, end) infinite; }
@keyframes jojo-sepia-cycle {
  0%, 8.99% { filter: sepia(0); }
  9%, 99% { filter: sepia(1); }
  100% { filter: sepia(0); }
}
/* Animation d'arrivée de droite à gauche (comme Navbar) */
.jojo-swipe { animation: jojo-swipe 4.7s ease-in-out infinite; will-change: transform; }
@keyframes jojo-swipe {
  0% { transform: translateX(0); }
  6% { transform: translateX(-60%); }
  9% { transform: translateX(-110%); }
  62% { transform: translateX(-110%); }
  99% { transform: translateX(-110%); }
  100% { transform: translateX(0); }
}

/* Jojotext apparait uniquement quand la flèche est arrivée (9%) */
.jojotext-fade { animation: jojotext-fade 4.7s steps(1, end) infinite; }
@keyframes jojotext-fade {
  0%, 8.99% { opacity: 0; }
  9% { opacity: 1; }
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
  gap: 8px;
}

.buy-btn, .equip-btn {
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

.leaderboard-container {
  background: #f8f9fa;
  border-radius: 15px;
  padding: 20px;
  margin-top: 20px;
}

.leaderboard-filters {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  justify-content: center;
}

.filter-btn {
  padding: 10px 20px;
  border: none;
  background: #e9ecef;
  border: 2px #5150503d solid;
  border-radius: 8px;
  cursor: pointer;
  color: #666;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 5px;
}

.filter-btn:hover {
  background: #dee2e6;
  color: #333;
}

.filter-btn.active {
  background: #5bc682;
  color: white;
  border: none !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 201, 123, 0.3);
}

.leaderboard-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.leaderboard-item {
  display: flex;
  align-items: center;
  gap: 15px;
  background: white;
  height: 130px;
  padding: 15px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}



.leaderboard-position {
  font-size: 18px;
  font-weight: bold;
  min-width: 40px;
  text-align: center;
}

.medal {
  font-size: 24px;
}

.position {
  color: #666;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 20px;
  flex: 1;
  position: relative; /* Nécessaire pour les items dynamiques overlay */
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
  top: -3px;
  left: -1px;
}

.clown-hair-shop {
  max-width: 100%;
    max-height: 90%;
    object-fit: contain;
    position: absolute;
    top: 5px;
    left: 11px;
}

.clown-nose-shop {
  max-width: 100%;
    max-height: 45%;
    object-fit: contain;
    position: absolute;
    top: 37px;
    left: 28px;
}

.cash-animation-shop {
  width: 100%;
    height: 90%;
  position: relative;
    top: 3px;
    left: 0px;
}

.cash-img-shop {
  max-width: 100%;
  max-height: 100%;
    object-fit: contain;
}

.roi-item-shop {
  width: 100%;
    height: 90%;
    position: relative;
    top: 0px;
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
  width: 87%;
    height: 95%;
  position: relative;
    top: 9px;
    left: 0px;
}

.royal-frame-img-shop {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.rainbow-item-shop {
  width: 75%;
    height: 90%;
  position: relative;
    top: 10px;
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
  left: -4px;
}

.moustache-img-shop {
  max-width: 60%;
    max-height: 100%;
    object-fit: contain;
  position: absolute;
    top: 35px;
    left: 20px;
}

.gentleman-img-shop {
  max-width: 80%;
    max-height: 100%;
    object-fit: contain;
  position: absolute;
    top: 8px;
    left: 12px;
}

.vinyle-item-shop {
  width: 100%;
    height: 70%;
    position: relative;
    top: 0px;
    left: 0px;
}

.vinyle-img-shop {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

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
  max-width: 90%;
    max-height: 100%;
    object-fit: contain;
  position: absolute;
    top: 0px;
    left: 5px;
}

.asteroide-img-shop {
  max-width: 100%;
    max-height: 50%;
    object-fit: contain;
  position: absolute;
    top: 38px;
    left: 8px;
}

.absolute-cinema-item-shop {
    width: 100%;
    height: 100%;
  position: relative;
  top: -3px;
  left: 3px;
}

.absolute-cinema-img-shop {
  max-width: 100% !important;
    max-height: 70% !important;
  object-fit: contain !important;
    position: absolute !important;
    top: 15px !important;
    left: 10px !important;
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
    max-width: 85%;
    max-height: 100%;
    object-fit: contain;
    position: absolute;
    top: 23px;
    left: 10px;
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
    top: -3px;
    left: 13px;
    width: 65%;
    height: 112%;
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
  top: 1px;
  left: -1px;
}

.flash-img-shop {
  max-width: 100%;
    max-height: 65%;
    object-fit: contain;
  position: absolute;
    top: 3px;
    left: 18px;
}

.camera-img-shop {
  max-width: 100%;
    max-height: 60%;
    object-fit: contain;
      position: absolute;
    top: 35px;
    left: 11px;
}

.miaou-item-shop {
  width: 100%;
  height: 100%;
  position: relative;
  top: -2px;
  left: 2px;
}

.chat-img-shop {
  max-width: 73%;
    max-height: 100%;
    object-fit: contain;
    position: absolute;
    top: 12px;
    left: 20px;
}

.pate-img-shop {
  max-width: 100%;
    max-height: 30%;
  object-fit: contain;
    position: absolute;
    top: 50px;
    left: 10px;
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
  top: 2px;
  left: -2px;
}

.nokia-img-shop {
  max-width: 100%;
    max-height: 50%;
  object-fit: contain;
    position: absolute;
    top: 35px;
    left: -2px;
}

.clippy-img-shop {
  max-width: 100%;
    max-height: 35%;
  object-fit: contain;
    position: absolute;
    top: 45px;
    left: 45px;
}

.daftpunk-img-shop {
  max-width: 60%;
    max-height: 80%;
  object-fit: contain;
    position: absolute;
    top: 0px;
    left: 20px;
}

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
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
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
  top: 0;
  left: 0;
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
  top: 0;
  left: 0;
    width: 100%;
  height: 100%;
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
  top: -53px;
  left: -35px;
  width: 220%;
  height: 148%;
    object-fit: contain;
    pointer-events: none;
  z-index: 15;
}

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

.equipped-roi-overlay {
  position: absolute;
  top: -59px;
  left: -4px;
  width: 130%;
  height: 130%;
  transform: translate(-10%);
  pointer-events: none;
  z-index: 3;
}

.equipped-gentleman-overlay {
  position: absolute;
  top: -30px;
  left: 0px;
  width: 120%;
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
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 3;
}

.equipped-camera-overlay {
    position: absolute;
  top: 0;
  left: 0;
  width: 100%;
    height: 100%;
  z-index: 3;
  }

.equipped-chat-overlay {
    position: absolute;
  top: 0;
  left: 0;
  width: 100%;
    height: 100%;
  z-index: 3;
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
  top: -7px;
    left: -1px;
    width: 130%;
    height: 120%;
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
    z-index: 2000;
    overscroll-behavior: contain; /* empêche le scroll arrière-plan sur mobile */
    touch-action: none;
  }

  .color-picker-modal {
    background: #fff;
    border-radius: 12px;
    width: min(550px, 92vw);
    max-height: 90vh;
    overflow: auto; /* conserve les bords arrondis et scrolle en interne */
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
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
    overscroll-behavior: contain; /* limite l'effet de rebond et le scroll parent */
  }

  @media (max-width: 480px) {
    .color-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      max-height: 60vh;
    }
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
.profile-avatar { position: relative; width: 110px; height: 110px; border-radius: 12px !important; overflow: hidden; border: 5px solid #000; background: #fff; }
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
  border-radius: 12px;
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
  border-radius: 12px !important;
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
.profile-popup .leaderboard-profile-music,
.profile-popup .public-note-section {
  position: relative;
  z-index: 20;
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

/* Assure que l’avatar (et donc sa bordure) est au-dessus des overlays dans la popup leaderboard */
.profile-popup .profile-avatar {
  position: relative !important;
  z-index: 2 !important;
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
  top: -67px !important;
  left: -28px !important;
  width: 153% !important;
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
  top: -33px !important;
  left: -1px !important;
  width: 130% !important;
  height: 130% !important;
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
.profile-popup .equipped-advisory-inside { top: 43px; left: 36px; }
.profile-popup .equipped-absolute-cinema-overlay { top: -10px; left: -30px; width: 30%; height: 100%; }
                  .profile-popup .equipped-absolute-cinema-overlay-right { left: 100px; top: -10px; width: 30%; height: 100%; }
.profile-popup .equipped-nokia-inside { top: 80%; left: 15%; width: 60% !important; }
.profile-popup .equipped-jojo-inside { bottom: -2px; left: 109px; width: 111%; height: 38%; }
.profile-popup .equipped-jojotext-inside { top: -12px; right: 6px; width: 90%; height: 85%; }

/* Ajustements demandés pour la pop-up de profil via leaderboard */
.profile-popup .equipped-advisory-inside { width: 61%; height: 63%; }
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

.factions-columns {
    display: flex;
    gap: 20px;
    width: 100%;
    align-items: flex-start;
    justify-content: center;
}

.faction-column {
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
  width: 300px !important;
  max-width: 300px !important;
  overflow-x: hidden;
  overflow-y: visible !important;  /* pas de scroll vertical */
}
.leaderboard-list.faction-leaderboard-list .leaderboard-item {
  width: 300px !important;
  height: 130px !important;
  min-height: 130px !important;
}



/* Espacement entre le bloc utilisateur et la liste de la faction */
.faction-column .leaderboard-item + .faction-leaderboard-list {
  margin-top: 15px;
}

/* Cartes identiques au général */
.faction-leaderboard-list .leaderboard-item {
  display: flex;
  align-items: center;
  gap: 15px;
  background: #fff;
  height: 130px;
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
  
  .faction-column {
   padding: 12px;
        width: 165% !important;
        max-width: 164.5% !important;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
  }


  .faction-member-badge {
    width: 80%;
  }

  .faction-leaderboard-list {
    width: 270.10px;
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
  animation: none; /* pas d’animation permanente */
  background: linear-gradient(90deg, #ffe17a, #fff3c2, #ffe17a);
  -webkit-background-clip: text;
  background-clip: text;
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
.faction-column > .leaderboard-item {
  display: flex;
  align-items: center;
  gap: 15px;
  background: #fff;
  height: 130px;
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
  overscroll-behavior: contain;
  touch-action: none;
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
  font-weight: bold;
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
  overscroll-behavior: contain;
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
</style>