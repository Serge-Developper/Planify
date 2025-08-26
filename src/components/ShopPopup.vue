<template>
  <div v-if="show" class="shop-overlay" @click.self="$emit('close')">
    <div class="shop-modal">
      <button class="close-btn" @click="() => { hoverCloseShop = false; $emit('close') }" @mouseover="hoverCloseShop = true" @mouseleave="hoverCloseShop = false">
        <img :src="hoverCloseShop ? closeHoverImg : closeImg" alt="Fermer" class="close-img" />
      </button>
      <h1 class="shop-title">Boutique Planify</h1>
      <div class="coins-balance">
        <img src="@/assets/img/planicoins.png" alt="Coin" class="coin-icon" />
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
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'leaderboard' }" 
          @click="activeTab = 'leaderboard'"
        >
          Leaderboard
        </button>
      </div>
      
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
          <!-- Palette pour Discord: switch d'apparence -->
          <button 
            v-if="item.name === 'Discord' && coinsStore.hasItem(item.id)"
            class="palette-icon"
            type="button"
            @click.stop="openDiscordStylePicker(item)"
            title="Changer le style Discord"
          >
            <img :src="styleIcon" alt="Palette" style="width: 18px; height: 18px; object-fit: contain;" />
          </button>
          <!-- Palette pour Jojo: activer/désactiver le texte -->
          <button 
            v-if="item.name === 'Jojo' && coinsStore.hasItem(item.id)"
            class="palette-icon"
            type="button"
            @click.stop="openJojoStylePicker(item)"
            title="Changer le style Jojo"
          >
            <img :src="styleIcon" alt="Palette" style="width: 18px; height: 18px; object-fit: contain;" />
          </button>
          <!-- Palette pour les items dynamiques avec variantes -->
          <button 
            v-if="item.isDynamic && Array.isArray(item.variants) && item.variants.length > 0 && coinsStore.hasItem(item.id)"
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
                <div v-if="item.id === 0" class="classic-border-preview" :style="classicBorderStyle"></div>

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

                <img v-else-if="item.id !== 0 && item.name !== 'Matrix' && item.name !== 'Clown' && item.name !== 'Cash' && item.name !== 'Roi' && item.name !== 'Cible' && item.name !== 'Étoiles' && item.name !== 'Cadre royale' && item.name !== 'Roses' && item.name !== 'Gentleman' && item.name !== 'Vinyle' && item.name !== 'Advisory' && item.name !== 'Espace' && item.name !== 'Absolute Cinema' && item.name !== 'Flash' && item.name !== 'Miaou' && item.name !== 'DVD' && item.name !== 'Lunettes pixel' && item.name !== '2000' && item.name !== 'Ange' && item.name !== 'Discord' && item.name !== 'Jojo' && item.name !== 'Galaxie' && item.name !== 'Coeur' && item.name !== 'Prestige' && item.name !== 'Planify'" :src="item.img" :alt="item.name" class="item-img" />
              
                <!-- Animation Matrix -->
                <div v-if="item.name === 'Matrix'" class="matrix-rain-inside-shop">
                  <div class="matrix-column" v-for="(col, ci) in getMatrixColumns(item)" :key="'mc-'+ci" :style="{ left: (ci * 5) + '%', animationDelay: (col.delay) + 's' }">
                    <span v-for="(ch, ri) in col.chars" :key="'mch-'+ri" class="matrix-char">{{ ch }}</span>
                  </div>
                </div>
                 <!-- Discord: afficher la bonne image selon l'ID d'item équipé -->
                 <img 
                   v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).displayType === 'discord'"
                   :src="getUserEquippedItemData(user).id === 23 ? discordon : (getUserEquippedItemData(user).id === 233 ? discordnepasderange : discordderange)"
                   alt="Discord"
                   class="equipped-discord"
                 />
                <!-- Galaxie: mêmes positions que Discord mais classe dédiée -->
                <img 
                  v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).name === 'Galaxie'"
                  :src="galaxie"
                  alt="Galaxie"
                  class="equipped-galaxie"
                />
                <!-- Coeur: mêmes positions que Galaxie -->
                <img 
                  v-if="getUserEquippedItemData(user) && (getUserEquippedItemData(user).name === 'Coeur' || getUserEquippedItemData(user).displayType === 'coeur')"
                  :src="coeur"
                  alt="Coeur"
                  class="equipped-coeur"
                />
              
              <!-- Item Clown -->
                <div v-if="item.name === 'Clown'" class="clown-item-shop">
                  <img :src="clowncheveux" :alt="item.name" class="clown-hair-shop" />
                  <img :src="clownnose" alt="Nez de clown" class="clown-nose-shop" />
                </div>
              
              <!-- Item Cash -->
                <div v-if="item.name === 'Cash'" class="cash-animation-shop">
                  <img :src="cash" :alt="item.name" class="cash-img-shop" />
                </div>

              <!-- Item Roi -->
                <div v-if="item.name === 'Roi'" class="roi-item-shop">
                  <img :src="roi" :alt="item.name" class="roi-img-shop" />
                </div>
              
              <!-- Item Ange -->
                <div v-if="item.name === 'Ange'" class="angel-item-shop">
                  <img :src="angelwings" :alt="item.name" class="angel-img-shop" />
                </div>
              
              <!-- Item Discord -->
                <div v-if="item.name === 'Discord'" class="discord-item-shop">
                  <img :src="discordDisplayImg" :alt="item.name" class="discord-img-shop" />
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
          <div class="item-price">
            <template v-if="hasInfo(item) || (item.isDynamic && item.price === 0) || item.name === 'Galaxie' || item.name === 'Planify' || item.name === 'Prestige' || item.name === 'Coeur'">
              <button type="button" class="info-icon-btn" @click.stop="openInfoItem(item)">
                <img :src="infoIcon" alt="Infos" style="width: 18px; height: 18px; object-fit: contain;" />
              </button>
            </template>
            <template v-else>
              <img src="@/assets/img/planicoins.png" alt="Coin" class="coin-icon" />
              {{ getItemPrice(item) }}
            </template>
          </div>
          <div class="item-actions" v-if="item.id !== 0">
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
              <!-- Checkmark pour les items débloqués -->
              <div v-if="coinsStore.hasItem(item.id)" class="checkmark-icon">✓</div>
              <!-- Cadenas pour les items verrouillés -->
              <div v-if="!coinsStore.hasItem(item.id)" class="lock-icon">🔒</div>
              <!-- Icône palette pour Discord et Jojo (aperçu des styles) -->
              <button 
                v-if="item.name === 'Discord' && coinsStore.hasItem(item.id)"
                class="palette-icon"
                type="button"
                @click.stop="openDiscordStylePicker(item)"
                title="Changer le style Discord"
              >
                <img :src="styleIcon" alt="Palette" style="width: 18px; height: 18px; object-fit: contain;" />
              </button>
              <button 
                v-if="item.name === 'Jojo' && coinsStore.hasItem(item.id)"
                class="palette-icon"
                type="button"
                @click.stop="openJojoStylePicker(item)"
                title="Changer le style Jojo"
              >
                <img :src="styleIcon" alt="Palette" style="width: 18px; height: 18px; object-fit: contain;" />
              </button>
              <!-- Palette pour les items dynamiques avec variantes (boutique hebdo) -->
              <button 
                v-if="item.isDynamic && Array.isArray(item.variants) && item.variants.length > 0 && coinsStore.hasItem(item.id)"
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
                  <div class="dyn-bg" :style="getDynVariantBgStyle(item)"></div>
                  <img v-for="(a, ai) in getDynVariantAssets(item)" :key="'dynw-variant-'+item.id+'-'+ai" :src="resolveAssetSrc(a.src)" :style="getDynVariantAssetStyle(a)" />
                </template>
                <img v-if="!item.isDynamic && item.name !== 'Matrix' && item.name !== 'Clown' && item.name !== 'Cash' && item.name !== 'Roi' && item.name !== 'Cible' && item.name !== 'Étoiles' && item.name !== 'Cadre royale' && item.name !== 'Roses' && item.name !== 'Gentleman' && item.name !== 'Vinyle' && item.name !== 'Advisory' && item.name !== 'Espace' && item.name !== 'Absolute Cinema' && item.name !== 'Flash' && item.name !== 'Miaou' && item.name !== 'DVD' && item.name !== 'Lunettes pixel' && item.name !== '2000' && item.name !== 'Tomb Raider' && item.name !== 'Ange' && item.name !== 'Discord' && item.name !== 'Jojo' && item.name !== 'Galaxie' && item.name !== 'Coeur'" :src="item.img" :alt="item.name" class="item-img" />
                
                <!-- Animations spéciales pour les items hebdomadaires -->
                <div v-if="item.name === 'Matrix'" class="matrix-rain-inside-shop">
                  <div class="matrix-column" v-for="(col, ci) in getMatrixColumns(item)" :key="'mw-'+ci" :style="{ left: (ci * 5) + '%', animationDelay: (col.delay) + 's' }">
                    <span v-for="(ch, ri) in col.chars" :key="'mwh-'+ri" class="matrix-char">{{ ch }}</span>
                  </div>
                </div>
                <div v-if="item.name === 'Clown'" class="clown-item-shop">
                  <img :src="clowncheveux" :alt="item.name" class="clown-hair-shop" />
                  <img :src="clownnose" alt="Nez de clown" class="clown-nose-shop" />
                </div>
                <div v-if="item.name === 'Cash'" class="cash-animation-shop">
                  <img :src="cash" :alt="item.name" class="cash-img-shop" />
                </div>
                <div v-if="item.name === 'Roi'" class="roi-item-shop">
                  <img :src="roi" :alt="item.name" class="roi-img-shop" />
                </div>
                <!-- Item Ange -->
                <div v-if="item.name === 'Ange'" class="angel-item-shop">
                  <img :src="angelwings" :alt="item.name" class="angel-img-shop" />
                </div>
                <!-- Item Discord -->
                <div v-if="item.name === 'Discord'" class="discord-item-shop">
                  <img :src="discordDisplayImg" :alt="item.name" class="discord-img-shop" />
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
            <div class="item-price">
              <template v-if="item.infoOnly || item.infoDescription">
                <button type="button" class="info-icon-btn" @click.stop="openInfoItem(item)">
                  <img :src="infoIcon" alt="Infos" style="width: 18px; height: 18px; object-fit: contain;" />
                </button>
              </template>
              <template v-else>
                <img src="@/assets/img/planicoins.png" alt="Coin" class="coin-icon" />
                {{ getItemPrice(item) }}
              </template>
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
            <div v-for="item in borderWeeklyItems" :key="item.id" class="shop-item weekly-item border-item" :class="{ 'equipped': coinsStore.selectedBorderColor === coinsStore.getBorderColorIdFromWeeklyItem(item) }">
              <!-- Icônes comme dans la Collection -->
              <div v-if="coinsStore.hasItem(item.id)" class="checkmark-icon">✓</div>
              <div v-if="!coinsStore.hasItem(item.id)" class="lock-icon">🔒</div>

              <div class="item-img-wrapper">
                <div class="item-img-container">
                  <div class="classic-border-preview" :style="getWeeklyClassicFillStyle(item)"></div>
                </div>
              </div>
              <div class="item-name">{{ getWeeklyColorName(item) }}</div>
              <div class="item-price">
                <template v-if="item.infoOnly || item.infoDescription">
                  <button type="button" class="info-icon-btn" @click.stop="openInfoItem(item)">
                    <img :src="infoIcon" alt="Infos" style="width: 18px; height: 18px; object-fit: contain;" />
                  </button>
                </template>
                <template v-else>
                  <img src="@/assets/img/planicoins.png" alt="Coin" class="coin-icon" />
                  {{ getItemPrice(item) }}
                </template>
              </div>
              <div class="item-actions">
                <button v-if="!coinsStore.hasItem(item.id)" class="buy-btn" :disabled="userCoins < getItemPrice(item)" @click="buyItem(item)">
                  Acheter
                </button>
                <button 
                  v-else-if="coinsStore.selectedBorderColor !== coinsStore.getBorderColorIdFromWeeklyItem(item)" 
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
      <div v-if="activeTab === 'leaderboard'" class="leaderboard-container">
        <!-- Filtres de tri -->
        <div class="leaderboard-filters">
          <button 
            class="filter-btn" 
            :class="{ active: leaderboardFilter === 'coins' }" 
            @click="leaderboardFilter = 'coins'"
          >
            <img src="@/assets/img/planicoins.png" alt="Coin" class="coin-icon" />
            PlanifyCoins
          </button>
          <button 
            class="filter-btn" 
            :class="{ active: leaderboardFilter === 'tasks' }" 
            @click="leaderboardFilter = 'tasks'"
          >
            ✅ Tâches complétées
          </button>
        </div>

        <!-- Liste des utilisateurs -->
        <div class="leaderboard-list">
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
              <div class="user-avatar-container" @click="openLeaderboardProfile(user)">
                <!-- Discord overlay en premier dans le container -->
                 <img 
                  v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).displayType === 'discord'"
                  :src="discordVariants[coinsStore.discordVariantIndex]"
                  :alt="'Discord'"
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
                      v-if="getUserEquippedItemData(user).displayType === 'generic' && getUserEquippedItemData(user).name !== 'Jojo' && getUserEquippedItemData(user).name !== 'Galaxie' && getUserEquippedItemData(user).name !== 'Coeur' && !getUserEquippedItemData(user).isDynamic" 
                      :src="getUserEquippedItemData(user).img" 
                      :alt="getUserEquippedItemData(user).name"
                      :class="getEquippedItemClass(getUserEquippedItemData(user).name)"
                    />
                </template>
                <div class="user-avatar" :style="getAvatarBorderStyle(user)" :class="{ 'jojo-sepia': getUserEquippedItemData(user) && getUserEquippedItemData(user).displayType === 'jojo', 'no-border': getUserEquippedItemData(user) && (getUserEquippedItemData(user).displayType === 'discord' || getUserEquippedItemData(user).name === 'Galaxie' || getUserEquippedItemData(user).name === 'Coeur' || getUserEquippedItemData(user).name === 'Prestige' || getUserEquippedItemData(user).name === 'Planify') }" @click="openLeaderboardProfile(user)">
                  <img 
                    :src="getUserAvatar(user)" 
                    :alt="user.username" 
                    class="avatar-img"
                    :style="(getUserEquippedItemData(user) && getUserEquippedItemData(user).displayType === 'jojo') ? 'filter: sepia(0); animation: jojo-sepia-cycle 4.7s steps(1,end) infinite' : 'filter: sepia(0);'"
                    @error="handleAvatarError"
                    @load="handleAvatarLoad"
                  />
                  
                  <!-- Items équipés selon leur type -->
                  <template v-if="getUserEquippedItemData(user)">
                    <!-- Items dynamiques placés derrière l'avatar (sous bordure) -->
                    <template v-if="getUserEquippedItemData(user).isDynamic && Array.isArray(getUserEquippedItemData(user).variants) && getUserEquippedItemData(user).variants.length > 0">
                      <img v-for="(a, ai) in getDynVariantAssetsForLeaderboard(getUserEquippedItemData(user))"
                           v-if="a && a.meta && a.meta.leaderboardPlacement === 'below'"
                           :key="'dyn-lb-below-'+ai+'-'+dynamicVariantsState"
                           :src="resolveAssetSrc(a.src)"
                           :style="getDynLeaderboardAssetStyle(a)" />
                    </template>
                    <template v-else-if="getUserEquippedItemData(user).isDynamic">
                      <img v-for="(a, ai) in getUserEquippedItemData(user).assets"
                           v-if="a && a.meta && a.meta.leaderboardPlacement === 'below'"
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
                      :key="'lb-jojo-'+coinsStore.jojoVariantIndex"
                    />
                    <img 
              v-if="getUserEquippedItemData(user).name === 'Jojo' && coinsStore.jojoVariantIndex === 1" 
                      :src="jojotext" 
                      alt="Jojo text"
                      class="equipped-jojotext-inside"
                      :key="'lb-jojotext-'+coinsStore.jojoVariantIndex"
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
                    <!-- Items dynamiques placés à l'intérieur de l'avatar -->
                    <template v-if="getUserEquippedItemData(user).isDynamic && Array.isArray(getUserEquippedItemData(user).variants) && getUserEquippedItemData(user).variants.length > 0">
                      <img v-for="(a, ai) in getDynVariantAssetsForLeaderboard(getUserEquippedItemData(user))"
                           v-if="a && a.meta && a.meta.leaderboardPlacement === 'inside'"
                           :key="'dyn-lb-inside-'+ai+'-'+dynamicVariantsState"
                           :src="resolveAssetSrc(a.src)"
                           :style="getDynLeaderboardAssetStyle(a)" />
                    </template>
                    <template v-else-if="getUserEquippedItemData(user).isDynamic">
                      <img v-for="(a, ai) in getUserEquippedItemData(user).assets"
                           v-if="a && a.meta && a.meta.leaderboardPlacement === 'inside'"
                           :key="'dyn-inside-'+ai"
                           :src="resolveAssetSrc(a.src)"
                           :style="getDynLeaderboardAssetStyle(a)" />
                    </template>
                    <!-- Items dynamiques placés au-dessus de l'avatar (par-dessus bordure) -->
                    <template v-if="getUserEquippedItemData(user).isDynamic && Array.isArray(getUserEquippedItemData(user).variants) && getUserEquippedItemData(user).variants.length > 0">
                      <img v-for="(a, ai) in getDynVariantAssetsForLeaderboard(getUserEquippedItemData(user))"
                           v-if="!a || !a.meta || a.meta.leaderboardPlacement === 'above' || (!a.meta.leaderboardPlacement)"
                           :key="'dyn-lb-above-'+ai+'-'+dynamicVariantsState"
                           :src="resolveAssetSrc(a.src)"
                           :style="getDynLeaderboardAssetStyle(a)" />
                    </template>
                    <template v-else-if="getUserEquippedItemData(user).isDynamic">
                      <img v-for="(a, ai) in getUserEquippedItemData(user).assets"
                           v-if="!a || !a.meta || a.meta.leaderboardPlacement === 'above' || (!a.meta.leaderboardPlacement)"
                           :key="'dyn-above-'+ai"
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
                
                <!-- Item Absolute Cinema Right par-dessus l'avatar (positionné en dehors du conteneur) -->
                <img 
                  v-if="getUserEquippedItemData(user) && getUserEquippedItemData(user).displayType === 'absolute-cinema'" 
                  :src="bras" 
                  :alt="getUserEquippedItemData(user).name"
                  class="equipped-absolute-cinema-overlay-right"
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
                {{ formatCoins(user.coins) }} <img src="@/assets/img/planicoins.png" alt="Coin" class="coin-icon-small" />
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
        <div v-if="activeTab === 'leaderboard' && showUserProfile" class="profile-popup-overlay" @click.self="closeLeaderboardProfile">
          <div class="profile-popup">
            <button class="close-btn" @click="closeLeaderboardProfile" @mouseover="hoverCloseProfile = true" @mouseleave="hoverCloseProfile = false">
              <img :src="hoverCloseProfile ? closeHoverImg : closeImg" alt="Fermer" class="close-img" />
            </button>
            <h2>Profil</h2>
            <div class="profile-info">
              <div><strong>Nom d'utilisateur :</strong> {{ selectedUser?.username || selectedUser?.name || 'Utilisateur' }}</div>
              <div><strong>Rôle :</strong> {{ selectedUser?.role ? afficherRole(selectedUser.role) : '—' }}</div>
              <div><strong>Année :</strong> {{ selectedUser?.year ? afficherAnnee(selectedUser.year) : '—' }}</div>
              <div><strong>Groupe :</strong> {{ selectedUser?.groupe || '—' }}</div>
              <div class="coins-profile-row">
                <strong>PlanifyCoins :</strong>
                <span class="coins-value">{{ selectedUser?.coins ?? 0 }}</span>
                <img src="@/assets/img/planicoins.png" alt="Coin" class="coin-icon" />
              </div>
            </div>
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
          <div class="color-picker-modal">
            <div class="color-picker-header">
              <span>Choisir un style Discord</span>
              <button class="close-btn-small" @click="closeDiscordStylePicker" @mouseover="hoverCloseStyle = true" @mouseleave="hoverCloseStyle = false">
                <img :src="hoverCloseStyle ? closeHoverImg : closeImg" alt="Fermer" class="close-img" />
              </button>
            </div>
            <div class="color-grid">
              <div v-for="(v, idx) in (discordPickerItem?.variants || [])" :key="idx" class="color-swatch" @click="applyDiscordVariant(idx)" style="display:flex;align-items:center;justify-content:center;background:#fff;">
                <img :src="v" alt="variante" style="width:50px;height:50px;object-fit:contain;" />
              </div>
            </div>
          </div>
        </div>
      </transition>

      <!-- Popup de sélection de style pour Jojo -->
      <transition name="fade">
        <div v-if="isJojoPickerOpen" class="color-picker-overlay" @click.self="closeJojoStylePicker">
          <div class="color-picker-modal">
            <div class="color-picker-header">
              <span>Choisir un style Jojo</span>
              <button class="close-btn-small" @click="closeJojoStylePicker" @mouseover="hoverCloseStyle = true" @mouseleave="hoverCloseStyle = false">
                <img :src="hoverCloseStyle ? closeHoverImg : closeImg" alt="Fermer" class="close-img" />
              </button>
            </div>
            <div class="color-grid">
              <div class="color-swatch" @click="applyJojoVariant(0)" style="display:flex;align-items:center;justify-content:center;background:#fff;">
                <span style="font-size:12px; color: #000;">Par défaut</span>
              </div>
              <div class="color-swatch" @click="applyJojoVariant(1)" style="display:flex;align-items:center;justify-content:center;background:#fff;">
                <img :src="jojotext" alt="Avec texte" style="width:50px;height:50px;object-fit:contain;" />
              </div>
            </div>
          </div>
        </div>
      </transition>

      <!-- Popup de sélection de style pour les items dynamiques -->
      <transition name="fade">
        <div v-if="isDynamicPickerOpen" class="color-picker-overlay" @click.self="closeDynamicStylePicker">
          <div class="color-picker-modal">
            <div class="color-picker-header">
              <span>Choisir un style pour {{ dynamicPickerItem?.name || 'Item' }}</span>
              <button class="close-btn-small" @click="closeDynamicStylePicker" @mouseover="hoverCloseStyle = true" @mouseleave="hoverCloseStyle = false">
                <img :src="hoverCloseStyle ? closeHoverImg : closeImg" alt="Fermer" class="close-img" />
              </button>
            </div>
            <div class="color-grid">
              <div v-for="(variant, idx) in (dynamicPickerItem?.variants || [])" :key="idx" class="color-swatch" @click="applyDynamicVariant(idx)" style="display:flex;align-items:center;justify-content:center;background:#fff;">
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
          <div class="color-picker-modal">
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
  </div>
</template>

<script setup>
 import { ref, defineProps, defineEmits, computed, watch, onMounted, onUnmounted } from 'vue'
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
import galaxie from '@/assets/img/Galaxie.png'
import coeur from '@/assets/img/Coeur.png'
import alphaImg from '@/assets/img/Alpha.png'
import adminPlanify from '@/assets/img/Admin Planify.png'
 import daftpunk from '@/assets/img/daftpunk.gif'
 import closeImg from '@/assets/img/bouton_supprimer_decocher.png'
 import closeHoverImg from '@/assets/img/bouton_supprimer_cocher.png'
import discordon from '@/assets/img/discordon.png'
import discordnepasderange from '@/assets/img/discordnepasderange.png'
import discordderange from '@/assets/img/discordderange.png'
import styleIcon from '@/assets/img/style.png'
import jojo from '@/assets/img/tobecontinued.png'
import jojotext from '@/assets/img/jojotext.gif'
import infoIcon from '@/assets/img/infos_items.png'

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

// Initialiser le store au montage du composant
onMounted(async () => {
  // N'initialiser que si l'utilisateur est connecté
  if (authStore.isLoggedIn && authStore.user?.token) {
    try {
      await coinsStore.initialize()
      console.log('✅ Store coins initialisé dans ShopPopup')
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation du store:', error)
    }
  }
})

const userCoins = computed(() => coinsStore.balance)
const hoverCloseShop = ref(false)
watch(() => props.show, (v) => { if (v === true) hoverCloseShop.value = false })

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

// Fonction pour obtenir l'ID de l'utilisateur
const getUserId = () => {
  if (!authStore.user) return 'anonymous'
  return authStore.user.id || authStore.user._id || 'anonymous'
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

// Fonction pour obtenir ou créer la computed property pour un item
const getDynamicItemDisplay = (item) => {
  console.log('🔍 getDynamicItemDisplay appelé pour item:', item.id, item.name, 'variants:', item.variants?.length)
  
  if (!dynamicItemDisplays.has(item.id)) {
    console.log('🆕 Création d\'une nouvelle computed property pour item:', item.id)
    const display = computed(() => {
      try {
        const variantIndex = coinsStore.getDynamicItemVariant(item.id)
        console.log('📊 VariantIndex pour item', item.id, ':', variantIndex)
        const variant = item.variants && item.variants[variantIndex]
        console.log('🔍 Variant trouvée:', variant ? 'oui' : 'non', 'assets:', variant?.assets?.length)
        
        if (!variant || !Array.isArray(variant.assets)) {
          console.log('❌ Pas de variante ou pas d\'assets pour item', item.id, 'variantIndex:', variantIndex)
          return { assets: [], background: null }
        }
        console.log('✅ Assets trouvés pour item', item.id, 'variantIndex:', variantIndex, 'assets:', variant.assets.length)
        return {
          assets: variant.assets || [],
          background: variant.backgrounds && variant.backgrounds.collection ? variant.backgrounds.collection : null
        }
      } catch (e) {
        console.error('❌ Erreur dans getDynamicItemDisplay:', e)
        return { assets: [], background: null }
      }
    })
    dynamicItemDisplays.set(item.id, display)
  } else {
    console.log('♻️ Utilisation d\'une computed property existante pour item:', item.id)
  }
  return dynamicItemDisplays.get(item.id)
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
    // Ne pas appeler l'API si l'utilisateur n'est pas connecté
    if (!authStore.isLoggedIn) {
      console.log('⚠️ Pas d\'utilisateur connecté, skip loadDynamicItems dans ShopPopup')
      return
    }
    
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
      // Utiliser la variante sélectionnée depuis le store
      const variantIndex = coinsStore.getDynamicItemVariant(item.id)
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
      // Utiliser la variante sélectionnée depuis le store
      const variantIndex = coinsStore.getDynamicItemVariant(item.id)
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
  if (!path) return ''
  if (String(path).startsWith('/uploads/')) {
    // Utiliser les nouvelles APIs pour servir les images depuis la base de données
    if (path.startsWith('/uploads/avatars/')) {
      return getApiOrigin() + '/api/uploads/avatars/' + path.split('/').pop()
    } else if (path.startsWith('/uploads/items/')) {
      return getApiOrigin() + '/api/items/uploads/' + path.split('/').pop()
    }
    return getApiOrigin() + path
  }
  return path
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
  try { 
    window.addEventListener('items-changed', () => {
      // Ne recharger que si l'utilisateur est connecté
      if (authStore.isLoggedIn) {
        loadDynamicItems()
      }
    }) 
  } catch {}
  // Charger les variantes dynamiques depuis le store
  try { coinsStore.loadDynamicItemVariants() } catch {}
  // Écouter les changements de variantes pour forcer la mise à jour du leaderboard
  try { 
    window.addEventListener('dynamic-variant-changed', (event) => { 
      console.log('📡 ShopPopup: Événement dynamic-variant-changed reçu pour leaderboard:', event.detail)
    }) 
  } catch {}
})
// Recharger les items dynamiques à l'ouverture de la popup
watch(() => props.show, (v) => { if (v && authStore.isLoggedIn) loadDynamicItems() })
onUnmounted(() => {
  try { window.removeEventListener('resize', updateIsMobile) } catch {}
  try { window.removeEventListener('items-changed', loadDynamicItems) } catch {}
  try { window.removeEventListener('dynamic-variant-changed', () => {}) } catch {}
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
  const style = { position: 'absolute', objectFit: s.objectFit || 'contain', zIndex: typeof s.zIndex === 'number' ? s.zIndex : 1 }
  if (typeof s.top === 'number') style.top = s.top + 'px'
  if (typeof s.left === 'number') style.left = s.left + 'px'
  if (typeof s.width === 'number') style.width = s.width + 'px'
  if (typeof s.height === 'number') style.height = s.height + 'px'
  if (typeof s.rotate === 'number') style.transform = `rotate(${s.rotate}deg)`
  return style
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
    // Utiliser la variante sélectionnée depuis le store
    const variantIndex = coinsStore.getDynamicItemVariant(item.id)
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
    // Utiliser la variante sélectionnée depuis le store
    const variantIndex = coinsStore.getDynamicItemVariant(item.id)
    console.log('🔍 getDynVariantAssets pour item', item.id, 'variantIndex:', variantIndex)
    
    const variant = item.variants && item.variants[variantIndex]
    if (!variant) {
      console.log('❌ Pas de variante pour item', item.id)
      return []
    }
    
    // Si c'est un style texte uniquement, retourner les assets de la base avec les styles de la variante
    if (variant.textOnly) {
      console.log('✅ Style texte uniquement pour item', item.id, '- utiliser les assets de la base avec styles de variante')
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
        popupStyleStyle: variant.assets && variant.assets[0] && variant.assets[0].popupStyleStyle ? variant.assets[0].popupStyleStyle : asset.popupStyleStyle
      }))
    }
    
    if (!Array.isArray(variant.assets)) {
      console.log('❌ Pas d\'assets pour item', item.id)
      return []
    }
    console.log('✅ Assets trouvés pour item', item.id, ':', variant.assets.length, 'assets')
    return variant.assets
  } catch (e) {
    console.error('❌ Erreur dans getDynVariantAssets:', e)
    return []
  }
}

// Fonction pour obtenir les assets de la variante sélectionnée pour le leaderboard
function getDynVariantAssetsForLeaderboard(item) {
  try {
    if (!item || !item.variants || !Array.isArray(item.variants)) return []
    
    // Utiliser legacyId si disponible, sinon id (comme dans la navbar)
    const itemId = item.legacyId !== undefined ? item.legacyId : item.id
    const variantIndex = coinsStore.getDynamicItemVariant(itemId)
    
    const variant = item.variants[variantIndex]
    if (!variant) return []
    
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
        popupStyleStyle: variant.assets && variant.assets[0] && variant.assets[0].popupStyleStyle ? variant.assets[0].popupStyleStyle : asset.popupStyleStyle
      }))
    }
    
    if (!Array.isArray(variant.assets)) return []
    return variant.assets
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
  const colorId = coinsStore.getBorderColorIdFromWeeklyItem(item)
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
      const colorId = coinsStore.getBorderColorIdFromWeeklyItem(item)
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
      const colorId = coinsStore.getBorderColorIdFromWeeklyItem(item)
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

async function openLeaderboardProfile(user) {
  try {
    selectedUser.value = user || null
    showUserProfile.value = true
    lockBodyScroll()
    // Charger les infos complètes (rôle, année, groupe...)
    const userId = user?._id || user?.id
    if (userId) {
      const res = await secureApiCall(`/users/${userId}`)
      if (res && (res._id || res.user)) {
        selectedUser.value = res.user || res
      }
    }
  } catch {}
}
function closeLeaderboardProfile() {
  showUserProfile.value = false
  selectedUser.value = null
  unlockBodyScroll()
}

// Helpers d'affichage (labels role/année)
function afficherRole(role) {
  if (!role) return '—'
  const key = String(role).toLowerCase()
  const map = {
    admin: 'Admin',
    prof: 'Professeur',
    professeur: 'Professeur',
    delegue: 'Délégué',
    délégué: 'Délégué',
    eleve: 'Étudiant',
    étudiant: 'Étudiant',
    etudiant: 'Étudiant'
  }
  return map[key] || String(role)
}

function afficherAnnee(year) {
  if (!year) return '—'
  const map = { BUT1: '1ère année', BUT2: '2ème année', BUT3: '3ème année' }
  return map[year] || String(year)
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
    displayType: 'clown',
  },
  {
    id: 3,
    name: 'Cash',
    price: 70,
    img: cash,
  },
  {
    id: 4,
    name: 'Cible',
    price: 100,
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
     displayType: 'gentleman',
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
    displayType: 'discord',
    variants: [discordon, discordnepasderange, discordderange],
    variantIndex: 0,
  }
  ,
  {
    id: 24,
    name: 'Jojo',
    price: 200,
    img: jojo,
    displayType: 'jojo',
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
async function applyDynamicVariant(idx) {
  console.log('🔍 applyDynamicVariant appelé avec idx:', idx, typeof idx)
  
  if (!dynamicPickerItem.value) {
    console.error('❌ Pas d\'item sélectionné')
    return
  }
  
  const item = dynamicPickerItem.value
  console.log('📦 Item sélectionné:', item)
  
  // Vérifier que la variante existe
  if (!item.variants || !Array.isArray(item.variants)) {
    console.error('❌ Pas de variantes pour cet item')
    return
  }
  
  if (!item.variants[idx]) {
    console.error('❌ Variante invalide:', idx, 'pour item', item.id, 'nombre de variantes:', item.variants.length)
    return
  }
  
  // S'assurer que l'ID est un nombre
  const itemId = typeof item.id === 'string' ? parseInt(item.id, 10) : item.id
  const variantIndex = typeof idx === 'string' ? parseInt(idx, 10) : idx
  
  console.log('🎨 Application de la variante', variantIndex, 'pour item', itemId)
  console.log('📊 Types:', { itemId: typeof itemId, variantIndex: typeof variantIndex })
  
  // Vérifier que coinsStore existe et a la méthode
  if (!coinsStore || typeof coinsStore.setDynamicItemVariant !== 'function') {
    console.error('❌ coinsStore.setDynamicItemVariant n\'est pas disponible')
    alert('Erreur: Le système de variantes n\'est pas disponible.')
    return
  }
  
  // Sauvegarder la variante sélectionnée dans le store
  try {
    const result = await coinsStore.setDynamicItemVariant(itemId, variantIndex)
    if (result && result.success) {
      console.log('✅ Variante sauvegardée dans le store')
      // Forcer la mise à jour en incrémentant la clé
      variantUpdateKey.value++
      console.log('🔄 Clé de mise à jour incrémentée:', variantUpdateKey.value)
      // Déclencher l'événement pour notifier la navbar
      window.dispatchEvent(new CustomEvent('dynamic-variant-changed', { 
        detail: { itemId, variantIndex } 
      }))
      console.log('📡 Événement dynamic-variant-changed déclenché')
    } else {
      console.error('❌ Erreur lors de la sauvegarde de la variante:', result?.error)
      // Afficher un message d'erreur à l'utilisateur
      alert('Impossible de sauvegarder la variante. Veuillez réessayer.')
    }
  } catch (e) {
    console.error('❌ Exception lors de la sauvegarde de la variante:', e)
    console.error('📦 Stack trace:', e.stack)
    alert('Une erreur est survenue: ' + (e.message || 'Erreur inconnue'))
  }
  
  // Fermer la popup
  closeDynamicStylePicker()
}

 // Fonctions pour les items équipés
const getUserEquippedItemData = (user) => {
  // Tolérance si user est indéfini ou si aucun item n'est équipé
  if (!user || user.equippedItemId === null || user.equippedItemId === undefined || user.equippedItemId === 0) {
    return null
  }
  
  const equippedId = Number(user.equippedItemId)
  // Chercher d'abord dans le catalogue statique
  let item = shopItems.find(item => Number(item.id) === equippedId)
  // Si pas trouvé, tenter dans les items dynamiques chargés
  if (!item) {
    const dyn = dynamicInfoById.value.get(equippedId)
    if (dyn) {
      item = {
        id: dyn.id,
        name: dyn.name,
        img: dyn.assets && dyn.assets[0] ? resolveAssetSrc(dyn.assets[0].src) : '',
        isDynamic: true,
        assets: dyn.assets || [],
        backgrounds: dyn.backgrounds || {},
        variants: dyn.variants || [], // Ajouter les variantes
        legacyId: dyn.id // Ajouter legacyId pour la compatibilité
      }
    }
  }
  if (!item) {
    console.log('⚠️ Item non trouvé pour equippedItemId:', user.equippedItemId, 'utilisateur:', user?.username)
    return null
  }
  
  console.log('✅ Item équipé trouvé:', item.name, 'pour utilisateur:', user?.username)
  
  // Déterminer le displayType basé sur le nom de l'item
  let displayType = 'generic'
  
  if (item.name === 'Gentleman') displayType = 'gentleman'
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
  else if (item.name === 'Discord' || item.id === 23) displayType = 'discord'
  else if (item.name === 'Galaxie') displayType = 'generic'
  else if (item.name === 'Coeur') displayType = 'coeur'
  else if (item.name === 'Prestige') displayType = 'alpha'
  else if (item.name === 'Planify') displayType = 'admin-planify'
  
  return {
    ...item,
    displayType
  }
}

 const getEquippedItemClass = (itemName) => {
   const classMap = {
     'Oreilles de chat': 'equipped-cat-ears',
     'Clown': 'equipped-clown',
     'Cash': 'equipped-cash',
     'Cible': 'equipped-target',
     'Roi': 'equipped-king',
     'Matrix': 'equipped-matrix',
     'Ange': 'equipped-angel',
     'Tomb Raider': 'equipped-tomb-raider',
     'Étoiles': 'equipped-stars',
     'Cadre royale': 'equipped-royal-frame',
     'Roses': 'equipped-roses',
     'Gentleman': 'equipped-gentleman',
     'Vinyle': 'equipped-vinyl',
     'Advisory': 'equipped-advisory',
     'Espace': 'equipped-space',
     'Absolute Cinema': 'equipped-cinema',
     'Flash': 'equipped-flash',
     'Miaou': 'equipped-meow',
     'DVD': 'equipped-dvd',
    'Lunettes pixel': 'equipped-pixel-glasses',
    '2000': 'equipped-2000',
    'Discord': 'equipped-discord',
    'Galaxie': 'equipped-discord',
    'Coeur': 'equipped-discord',
    'Jojo': 'equipped-jojo-inside'
   }
   return classMap[itemName] || 'equipped-item'
 }

 const getUserAvatar = (user) => {
  const av = user && user.avatar
  if (typeof av === 'string') {
    // Si c'est une data URL, l'utiliser directement
    if (av.startsWith('data:')) {
      return av
    }
    // Si c'est un chemin d'upload
    if (av.startsWith('/uploads/')) {
      const avatarUrl = `${baseUrl}${av}`
      return avatarUrl
    }
  }
  return accountIcon
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
  // Si Discord, Galaxie, Coeur, Alpha ou Admin Planify est équipé, pas de bordure
  const equippedItem = getUserEquippedItemData(user)
  const equippedId = user?.equippedItemId
  
  // Si certains items spéciaux sont équipés, pas de bordure
  if (equippedItem && (equippedItem.displayType === 'discord' || 
      equippedItem.name === 'Galaxie' || 
      equippedItem.name === 'Coeur' || 
      equippedItem.name === 'Prestige' || 
      equippedItem.name === 'Planify')) {
    return { border: '3px solid transparent', background: 'transparent' }
  }
  
  // Si l'item équipé est spécifiquement ces IDs, pas de bordure
  if (equippedId == 25 || equippedId == 26 || equippedId == 27 || equippedId == 28) {
    return { border: '3px solid transparent', background: 'transparent' }
  }
  
  // Si pas de couleur sélectionnée, bordure noire par défaut
  if (!user || !user.selectedBorderColor || user.selectedBorderColor === 'default') {
    return { border: '3px solid #000000' }
  }
  
  // Initialiser les bordures si nécessaire
  if (!coinsStore.borderColors || coinsStore.borderColors.length === 0) {
    coinsStore.initializeBorderColors()
  }
  
  // Extraire l'id de base si encodé avec variantes (ex: "red|dv=1|jv=0")
  const raw = String(user.selectedBorderColor)
  const baseId = raw.split('|')[0] || 'default'
  const selected = coinsStore.borderColors.find(c => c.id === baseId)
  
  if (!selected) {
    return { border: '3px solid #000000' }
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
  
  return { border: '3px solid #000000' }
}

 // Fonctions pour la boutique hebdomadaire
 const switchToWeeklyTab = async () => {
  activeTab.value = 'weekly'
  if (authStore.isLoggedIn) {
    // S'assurer que les items dynamiques sont chargés avant les items hebdomadaires
    if (dynamicInfoById.value.size === 0) {
      await loadDynamicItems()
    }
    loadWeeklyItems()
  }
 }

 const loadWeeklyItems = async () => {
   // Ne pas charger si pas connecté
   if (!authStore.isLoggedIn || !authStore.user?.token) {
     console.log('⚠️ Pas d\'utilisateur connecté, skip loadWeeklyItems')
     return
   }
   
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
          if ((it && it.id === 7) || it?.name === 'Matrix') {
            return { ...it, price: 500, img: fixedImg }
          }
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
              variants: dynamicItem.variants,
              assets: dynamicItem.assets,
              backgrounds: dynamicItem.backgrounds
            }
          }
          
          return { ...it, img: fixedImg }
        })
        weeklyItems.value = patched
        timeUntilReset.value = response.timeUntilReset || ''
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
  const now = new Date()
  // Cible: 01:00 Europe/Paris
  const parisNow = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Paris' }))
  const target = new Date(parisNow)
  target.setHours(1, 0, 0, 0)
  if (parisNow.getHours() >= 1) target.setDate(target.getDate() + 1)
  
  const timeLeft = target.getTime() - parisNow.getTime()
  const hours = Math.floor(timeLeft / (1000 * 60 * 60))
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000)
  
  timeUntilReset.value = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  
  if (timeLeft <= 0) {
    loadWeeklyItems()
  }
   }, 1000)
}

// Fonctions pour le leaderboard
const sortedLeaderboardUsers = computed(() => {
   if (!leaderboardUsers.value || !leaderboardUsers.value.length) return []
   
   return [...leaderboardUsers.value].sort((a, b) => {
     if (leaderboardFilter.value === 'coins') {
       return b.coins - a.coins
     } else {
       return (b.completedTasks || 0) - (a.completedTasks || 0)
     }
   })
 })

 const loadLeaderboardUsers = async () => {
   // Ne pas charger si pas connecté
   if (!authStore.isLoggedIn || !authStore.user?.token) {
     console.log('⚠️ Pas d\'utilisateur connecté, skip loadLeaderboardUsers')
     return
   }
   
   try {
     console.log('🔄 Chargement du leaderboard...')
     const response = await secureApiCall('/users')
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

 // Fonctions pour les achats
 const buyItem = async (item) => {
   try {
     const result = await coinsStore.purchaseItem(item)
     if (!result || !result.success) {
       console.error('Erreur lors de l\'achat:', result?.message)
      } else { playSound(achatSound) }
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
       }
     }
   } catch (error) {
     console.error('Erreur lors de l\'équipement:', error)
   }
 }



 // Lifecycle hooks
 onMounted(() => {
   if (authStore.isLoggedIn) {
     // Initialiser les bordures si nécessaire
     if (!coinsStore.borderColors || coinsStore.borderColors.length === 0) {
       coinsStore.initializeBorderColors()
     }
     loadWeeklyItems()
     loadLeaderboardUsers()
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
   if (newTab === 'leaderboard') {
     loadLeaderboardUsers()
   } else if (newTab === 'weekly') {
     loadWeeklyItems()
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
}

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

  /* Cash - Petit */
  .leaderboard-container .equipped-cash,
  .leaderboard-container .equipped-cash-overlay {
    pointer-events: none !important;
    width: 30px !important;
    height: 30px !important;
    max-width: 30px !important;
    max-height: 30px !important;
  }

  /* Roi - Grand */
  .leaderboard-container .equipped-roi,
  .leaderboard-container .equipped-roi-overlay {
    pointer-events: none !important;
    position: absolute !important;
    top: -79% !important;
    left: 9% !important;
    width: 100%;
    height: 100%;
    transform: translate(-10%) !important;
    pointer-events: none !important;
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
    z-index: 3;
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
    top: -19px !important;
    left: -18px !important;
    width: 170% !important;
    height: 176% !important;
    z-index: 4 !important;
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
    top: -67%;
    left: 0 !important;
    width: 100% !important;
    height: 100% !important;
    object-fit: contain !important;
    pointer-events: none !important;
    z-index: 15 !important;
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
    width: 60% !important;
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

  /* Style spécifique pour l'item Clown Nose dans le leaderboard */
  .leaderboard-container .equipped-clown-nose {
  position: absolute !important;
    top: 54% !important;
    left: 48% !important;
    transform: translate(-50%, -50%) !important;
    width: 87% !important;
    height: 70%;
  object-fit: contain !important;
  pointer-events: none !important;
    z-index: 3 !important;
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
    max-width: 100% !important;
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
    text-align: center;
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
}

.user-avatar-container {
  position: relative;
  width: 50px;
  height: 50px;
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
  max-width: 100%;
    max-height: 70%;
  object-fit: contain;
    position: absolute;
    top: 15px;
    left: 10px;
}

.absolute-cinema-img-shop-right {
  max-width: 100%;
    max-height: 70%;
  object-fit: contain;
    position: absolute;
    top: 15px;
    left: 50px;
  transform: scaleX(-1);
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
    top: -5px;
    left: 8px;
    width: 80%;
    height: 112%;
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
    top: -5px;
    left: 15px;
    width: 65%;
    height: 112%;
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
    top: -5px;
    left: 15px;
    width: 65%;
    height: 112%;
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
  position: absolute;
    top: -33px;
    left: -10px;
    width: 153%;
    height: 153%;
    z-index: 3;
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
  z-index: 2;
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
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
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
    top: 0%;
    left: -8%;
    width: 128%;
    height: 100%;
    z-index: 1;
  }

  .matrix-char {
    font-size: 12px;
    margin: 2px 0px;
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
</style> 