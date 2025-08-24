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
                  <img v-for="(asset, ai) in getDynVariantAssets(item)" :key="'dyn-variant-'+item.id+'-'+ai+'-'+variantUpdateKey" :src="resolveAssetSrc(asset.src)" :style="getDynVariantAssetStyle(asset)" />
                </div>
              </template>
              <!-- Items dynamiques: fond + rendu des assets avec positions enregistrées (fallback) -->
              <template v-else-if="item.isDynamic && Array.isArray(item.assets) && item.assets.length">
                <div class="dyn-bg" :style="getDynBgStyle(item)"></div>
                <img v-for="(asset, ai) in item.assets" :key="'dyn-'+item.id+'-'+ai" :src="resolveAssetSrc(asset.src)" :style="getDynAssetStyle(asset)" />
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
        </div>
      </div>
</template>

<script setup lang="ts">
import { ref, defineProps, defineEmits, computed, watch, onMounted, onUnmounted } from 'vue'
import { useCoinsStore } from '@/stores/coins'
import { useAuthStore } from '@/stores/auth'
import { secureApiCall, API_URL } from '@/api'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  close: []
  'equip-item': [item: any]
}>()

const coinsStore = useCoinsStore()
const authStore = useAuthStore()
const userCoins = computed(() => coinsStore.balance || 0)
const user = computed(() => authStore.user || null)

// Variables réactives
const showConfirm = ref(false)
const boughtItemName = ref('')
const hoverCloseShop = ref(false)
const activeTab = ref('main')
const dynamicItems = ref<any[]>([])
const dynamicInfoById = ref(new Map())
const dynamicInfoByName = ref(new Map())
const variantUpdateKey = ref(0)
const weeklyItems = ref<any[]>([])
const timeUntilReset = ref('')
const showWeeklyResetNotification = ref(false)
const isInfoOpen = ref(false)
const infoText = ref('')
const isColorPickerOpen = ref(false)
const hoverCloseColor = ref(false)
const isDiscordPickerOpen = ref(false)
const isJojoPickerOpen = ref(false)
const isDynamicPickerOpen = ref(false)
const discordPickerItem = ref<any>(null)
const jojoPickerItem = ref<any>(null)
const dynamicPickerItem = ref<any>(null)
const hoverCloseStyle = ref(false)
const jojoAnimKey = ref(0)
const leaderboardFilter = ref('coins')
const leaderboardUsers = ref<any[]>([])
const showUserProfile = ref(false)
const selectedUser = ref<any>(null)
const hoverCloseProfile = ref(false)

let weeklyTimer: any = null

// URL de base pour Netlify
const baseUrl = API_URL.endsWith('/api') 
  ? API_URL.slice(0, -4)
  : API_URL.replace('/api', '')

// Imports d'images
const catEars = new URL('@/assets/accounttt.svg', import.meta.url).href
const accountIcon = new URL('@/assets/accounttt.svg', import.meta.url).href
const oreilleschat = new URL('@/assets/img/oreilleschat.gif', import.meta.url).href
const matrix = new URL('@/assets/img/matrix.gif', import.meta.url).href
const angelwings = new URL('@/assets/img/angelwings.gif', import.meta.url).href
const laracroft = new URL('@/assets/img/laracroft.gif', import.meta.url).href
const clowncheveux = new URL('@/assets/img/clowncheveux.gif', import.meta.url).href
const clownnose = new URL('@/assets/img/clownnose.gif', import.meta.url).href
const cash = new URL('@/assets/img/cash.gif', import.meta.url).href
const target = new URL('@/assets/img/target.gif', import.meta.url).href
const roi = new URL('@/assets/img/roi.gif', import.meta.url).href
const star = new URL('@/assets/img/star.gif', import.meta.url).href
const cadre = new URL('@/assets/img/cadre.gif', import.meta.url).href
const love = new URL('@/assets/img/love.gif', import.meta.url).href
const moustache = new URL('@/assets/img/moustache.gif', import.meta.url).href
const gentleman = new URL('@/assets/img/gentleman.gif', import.meta.url).href
const vinyle = new URL('@/assets/img/vinyle.gif', import.meta.url).href
const advisory = new URL('@/assets/img/advisory.gif', import.meta.url).href
const spacestars = new URL('@/assets/img/spacestars.gif', import.meta.url).href
const asteroide = new URL('@/assets/img/asteroide.gif', import.meta.url).href
const bras = new URL('@/assets/img/bras.png', import.meta.url).href
const flash = new URL('@/assets/img/flash.gif', import.meta.url).href
const camera = new URL('@/assets/img/camera.gif', import.meta.url).href
const chat = new URL('@/assets/img/chat.gif', import.meta.url).href
const pate = new URL('@/assets/img/pate.gif', import.meta.url).href
const dvd = new URL('@/assets/img/dvd.png', import.meta.url).href
const mlglunette = new URL('@/assets/img/mlglunette.gif', import.meta.url).href
const nokia = new URL('@/assets/img/nokia.gif', import.meta.url).href
const clippy = new URL('@/assets/img/clippy.gif', import.meta.url).href
const galaxie = new URL('@/assets/img/Galaxie.png', import.meta.url).href
const coeur = new URL('@/assets/img/Coeur.png', import.meta.url).href
const alphaImg = new URL('@/assets/img/Alpha.png', import.meta.url).href
const adminPlanify = new URL('@/assets/img/Admin Planify.png', import.meta.url).href
const daftpunk = new URL('@/assets/img/daftpunk.gif', import.meta.url).href
const closeImg = new URL('@/assets/img/bouton_supprimer_decocher.png', import.meta.url).href
const closeHoverImg = new URL('@/assets/img/bouton_supprimer_cocher.png', import.meta.url).href
const discordon = new URL('@/assets/img/discordon.png', import.meta.url).href
const discordnepasderange = new URL('@/assets/img/discordnepasderange.png', import.meta.url).href
const discordderange = new URL('@/assets/img/discordderange.png', import.meta.url).href
const styleIcon = new URL('@/assets/img/style.png', import.meta.url).href
const jojo = new URL('@/assets/img/tobecontinued.png', import.meta.url).href
const jojotext = new URL('@/assets/img/jojotext.gif', import.meta.url).href
const infoIcon = new URL('@/assets/img/infos_items.png', import.meta.url).href

// Items de la boutique
const shopItems: any[] = [
  { id: 0, name: 'Bordure classique', price: 0, img: '', type: 'classic-border' },
  { id: 1, name: 'Oreilles de chat', price: 150, img: oreilleschat },
  { id: 2, name: 'Clown', price: 120, img: clowncheveux },
  { id: 3, name: 'Cash', price: 50, img: cash },
  { id: 4, name: 'Cible', price: 70, img: target },
  { id: 6, name: 'Roi', price: 170, img: roi },
  { id: 7, name: 'Matrix', price: 500, img: matrix },
  { id: 8, name: 'Ange', price: 600, img: angelwings },
  { id: 9, name: 'Tomb Raider', price: 400, img: laracroft },
  { id: 10, name: 'Étoiles', price: 100, img: star },
  { id: 11, name: 'Cadre royale', price: 230, img: cadre },
  { id: 12, name: 'Roses', price: 180, img: love },
  { id: 13, name: 'Gentleman', price: 150, img: gentleman },
  { id: 14, name: 'Vinyle', price: 90, img: vinyle },
  { id: 15, name: 'Advisory', price: 200, img: advisory },
  { id: 16, name: 'Espace', price: 300, img: spacestars },
  { id: 17, name: 'Absolute Cinema', price: 350, img: bras },
  { id: 18, name: 'Flash', price: 120, img: flash },
  { id: 19, name: 'Miaou', price: 200, img: chat },
  { id: 20, name: 'DVD', price: 110, img: dvd },
  { id: 21, name: 'Lunettes pixel', price: 130, img: mlglunette },
  { id: 22, name: '2000', price: 250, img: nokia },
  { id: 23, name: 'Discord', price: 150, img: discordon, variants: [discordon, discordnepasderange, discordderange], variantIndex: 0 },
  { id: 24, name: 'Jojo', price: 200, img: jojo },
  { id: 25, name: 'Galaxie', img: galaxie },
  { id: 26, name: 'Coeur', img: coeur },
  { id: 27, name: 'Prestige', img: alphaImg },
  { id: 28, name: 'Planify', img: adminPlanify }
]

// Collection de tous les items
const collectionItems = computed((): any[] => {
  return [...shopItems, ...dynamicItems.value]
})

// Image réactive pour Discord
const discordVariants: string[] = [discordon, discordnepasderange, discordderange]
const discordDisplayImg = computed((): string => {
  const idx = coinsStore.discordVariantIndex || 0
  return discordVariants[idx] || discordon
})

// Style d'aperçu pour la bordure classique
const classicBorderStyle = computed((): Record<string, string> => {
  const selected = coinsStore.borderColors.find(c => c.id === coinsStore.selectedBorderColor)
  if (!selected) {
    return { background: '#000', width: '100%', height: '100%' }
  }
  const style: Record<string, string> = { width: '100%', height: '100%' }
  if (selected.gradient) {
    style.background = selected.gradient
  } else if (selected.color) {
    style.background = selected.color
  } else {
    style.background = '#000'
  }
  return style
})

// Fonctions de base
function resolveAssetSrc(path: string): string {
  if (!path) return ''
  if (String(path).startsWith('/uploads/')) {
    if (path.startsWith('/uploads/avatars/')) {
      return getApiOrigin() + '/api/uploads/avatars/' + path.split('/').pop()
    } else if (path.startsWith('/uploads/items/')) {
      return getApiOrigin() + '/api/uploads/items/' + path.split('/').pop()
    }
    return getApiOrigin() + path
  }
  return path
}

function getApiOrigin(): string {
  const api = API_URL || ''
  try {
    if (api.startsWith('http')) return new URL(api).origin
  } catch {}
  return window.location.origin
}

// Fonctions pour les items équipés
const getUserEquippedItemData = (user: any): any => {
  if (!user || user.equippedItemId === null || user.equippedItemId === undefined || user.equippedItemId === 0) {
    return null
  }
  
  const equippedId = Number(user.equippedItemId)
  let item = shopItems.find((item: any) => Number(item.id) === equippedId)
  
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
        variants: dyn.variants || [],
        legacyId: dyn.id
      }
    }
  }
  
  if (!item) return null
  
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
  
  return { ...item, displayType }
}

// Fonctions pour les items dynamiques
function getDynAssetStyle(asset: any): Record<string, string | number> {
  const s = asset?.style || {}
  const style: Record<string, string | number> = { 
    position: 'absolute', 
    objectFit: s.objectFit || 'contain', 
    zIndex: typeof s.zIndex === 'number' ? s.zIndex : 1 
  }
  if (typeof s.top === 'number') style.top = s.top + 'px'
  if (typeof s.left === 'number') style.left = s.left + 'px'
  if (typeof s.width === 'number') style.width = s.width + 'px'
  if (typeof s.height === 'number') style.height = s.height + 'px'
  if (typeof s.rotate === 'number') style.transform = `rotate(${s.rotate}deg)`
  return style
}

function getDynBgStyle(item: any): Record<string, string | number> {
  try {
    const bg = (item && item.backgrounds && item.backgrounds.collection) ? item.backgrounds.collection : null
    if (!bg) return { display: 'none' }
    return { position: 'absolute', inset: '0', background: bg, zIndex: 0, pointerEvents: 'none' }
  } catch {
    return { display: 'none' }
  }
}

function getDynVariantBgStyle(item: any): Record<string, string | number> {
  try {
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

function getDynVariantAssets(item: any): any[] {
  try {
    const variantIndex = coinsStore.getDynamicItemVariant(item.id)
    const variant = item.variants && item.variants[variantIndex]
    if (!variant) return []
    
    if (variant.textOnly) {
      const baseAssets = Array.isArray(item.assets) ? item.assets : []
      return baseAssets.map((asset: any) => ({
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
        popupStyleStyle: variant.assets && variant.assets[0] && variant.assets[0].popupStyleStyle ? variant.assets[0].popupStyleStyle : asset.popupStyleStyle
      }))
    }
    
    if (!Array.isArray(variant.assets)) return []
    return variant.assets
  } catch (e) {
    return []
  }
}

function getDynVariantAssetStyle(asset: any): Record<string, string | number> {
  if (!asset || typeof asset !== 'object') {
    return { position: 'absolute', objectFit: 'contain', zIndex: 1 }
  }
  const s = (asset && asset.collectionStyle) || asset?.style || {}
  const style: Record<string, string | number> = { 
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

// Fonctions pour les items spéciaux
const getRandomMatrixChar = (): string => {
  const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン'
  return chars[Math.floor(Math.random() * chars.length)]
}

function getMatrixColumns(seedObj: any): Array<{delay: string, chars: string[]}> {
  const seed = String(seedObj?.id || seedObj?.name || 'matrix')
  const seededRandom = (s: string) => {
    let h = 0
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
    return () => {
      h = (h * 1664525 + 1013904223) >>> 0
      return (h & 0xfffffff) / 0xfffffff
    }
  }
  const rand = seededRandom(seed)
  const columns: Array<{delay: string, chars: string[]}> = []
  for (let c = 0; c < 20; c++) {
    const delay = (rand() * 2).toFixed(3)
    const chars: string[] = []
    for (let r = 0; r < 5; r++) {
      const charsSet = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン'
      const idx = Math.floor(rand() * charsSet.length)
      chars.push(charsSet[idx])
    }
    columns.push({ delay, chars })
  }
  return columns
}

// Helpers style Jojo
function getJojoImgStyle(): Record<string, string | number> {
  const p = coinsStore.jojoImgPos || { top: 50, left: 87, width: 90 }
  return {
    position: 'absolute',
    top: p.top + 'px',
    left: p.left + 'px',
    width: p.width + '%',
    height: 'auto',
    objectFit: 'contain',
    zIndex: 1
  }
}

function getJojoTextStyle(): Record<string, string | number> {
  const p = coinsStore.jojoTextPos || { top: -5, left: 5, width: 90 }
  return {
    position: 'absolute',
    top: p.top + 'px',
    left: p.left + 'px',
    width: p.width + '%',
    height: 'auto',
    objectFit: 'contain',
    zIndex: 2
  }
}

// Fonctions pour les achats
const buyItem = async (item: any): Promise<void> => {
  try {
    const result = await coinsStore.purchaseItem(item)
    if (!result || !result.success) {
      console.error('Erreur lors de l\'achat:', result?.message)
    }
  } catch (error) {
    console.error('Erreur lors de l\'achat:', error)
  }
}

const equipItem = async (item: any): Promise<void> => {
  try {
    if (coinsStore.isItemEquipped(item.id)) {
      const response = await secureApiCall('/coins/unequip', {
        method: 'POST',
        body: JSON.stringify({ itemId: item.id })
      })
      
      if (response.success) {
        coinsStore.unequipItem()
        emit('equip-item', null)
      }
    } else {
      const response = await secureApiCall('/coins/equip', {
        method: 'POST',
        body: JSON.stringify({ itemId: item.id })
      })
      
      if (response.success) {
        coinsStore.equipItem(item.id)
        emit('equip-item', item)
      }
    }
  } catch (error) {
    console.error('Erreur lors de l\'équipement:', error)
  }
}

// Fonctions pour les popups
const lockBodyScroll = (): void => {
  try { document.body.style.overflow = 'hidden' } catch (e) {}
}

const unlockBodyScroll = (): void => {
  try { document.body.style.overflow = '' } catch (e) {}
}

const openColorPicker = (): void => {
  isColorPickerOpen.value = true
  lockBodyScroll()
}

const closeColorPicker = (): void => {
  isColorPickerOpen.value = false
  unlockBodyScroll()
}

const selectBorderColor = (color: any): void => {
  if (!color || !color.unlocked) return
  coinsStore.selectBorderColor(color.id)
  isColorPickerOpen.value = false
}

const getColorSwatchStyle = (c: any): Record<string, string> => {
  const style: Record<string, string> = { }
  if (c && c.gradient) style.background = c.gradient
  else if (c && c.color) style.background = c.color
  else style.background = '#000'
  return style
}

// Obtenir le prix courant d'un item
const getItemPrice = (item: any): number => {
  return item.price
}

// Fonctions pour les items spéciaux
async function openInfoItem(item: any): Promise<void> {
  const map: Record<string, string> = {
    'Planify': 'Réservé aux administrateurs.',
    'Prestige': 'Distinction réservée aux 10 premiers utilisateurs.',
    'Coeur': "Obtenable en contribuant au site (soutien, aide ou contribution notable).",
    'Galaxie': 'Obtenable via la roue de la fortune.'
  }
  infoText.value = map[item?.name] || 'Informations indisponibles.'
  isInfoOpen.value = true
  lockBodyScroll()
}

function hasInfo(item: any): boolean {
  const price = Number(getItemPrice(item))
  const isSoldItem = !Number.isNaN(price) && price > 0
  if (item?.infoOnly) return true
  if (!isSoldItem && item?.infoDescription) return true
  return false
}

function closeInfoItem(): void {
  isInfoOpen.value = false
  unlockBodyScroll()
}

// Fonctions pour les popups de style
function openDiscordStylePicker(item: any): void {
  discordPickerItem.value = item
  isDiscordPickerOpen.value = true
  lockBodyScroll()
}

function closeDiscordStylePicker(): void {
  isDiscordPickerOpen.value = false
  discordPickerItem.value = null
  unlockBodyScroll()
}

function applyDiscordVariant(idx: number): void {
  if (!discordPickerItem.value) return
  const item = discordPickerItem.value
  if (!item.variants || !item.variants[idx]) return
  item.variantIndex = idx
  try { coinsStore.setDiscordVariantIndex(idx) } catch (e) {}
  closeDiscordStylePicker()
}

function openJojoStylePicker(_item: any): void {
  isJojoPickerOpen.value = true
  lockBodyScroll()
}

function closeJojoStylePicker(): void {
  isJojoPickerOpen.value = false
  unlockBodyScroll()
}

function applyJojoVariant(idx: number): void {
  try { coinsStore.setJojoVariantIndex(idx) } catch (e) {}
  jojoAnimKey.value = jojoAnimKey.value + 1
  closeJojoStylePicker()
}

function openDynamicStylePicker(item: any): void {
  dynamicPickerItem.value = item
  isDynamicPickerOpen.value = true
  lockBodyScroll()
}

function closeDynamicStylePicker(): void {
  isDynamicPickerOpen.value = false
  dynamicPickerItem.value = null
  unlockBodyScroll()
}

function applyDynamicVariant(idx: number): void {
  if (!dynamicPickerItem.value) return
  const item = dynamicPickerItem.value
  
  if (!item.variants || !item.variants[idx]) return
  
  try {
    // Mise à jour locale de l'interface
    variantUpdateKey.value++
    window.dispatchEvent(new CustomEvent('dynamic-variant-changed', { 
      detail: { itemId: item.id, variantIndex: idx } 
    }))
  } catch (e) {
    console.warn('❌ Impossible de sauvegarder la variante:', e)
  }
  
  closeDynamicStylePicker()
}

// Fonctions pour la boutique hebdomadaire
const switchToWeeklyTab = async (): Promise<void> => {
  activeTab.value = 'weekly'
  if (authStore.isLoggedIn) {
    loadWeeklyItems()
  }
}

const loadWeeklyItems = async (): Promise<void> => {
  try {
    const response = await secureApiCall('/coins/weekly-items')
    if (response.success) {
      weeklyItems.value = response.weeklyItems || []
      timeUntilReset.value = response.timeUntilReset || ''
    }
  } catch (error) {
    console.error('Erreur lors du chargement des items hebdomadaires:', error)
  }
}

const updateWeeklyTimer = (): void => {
  if (weeklyTimer) {
    clearInterval(weeklyTimer)
  }
  
  weeklyTimer = setInterval(() => {
    const now = new Date()
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

// Lifecycle hooks
onMounted(() => {
  if (authStore.isLoggedIn) {
    loadWeeklyItems()
    updateWeeklyTimer()
  }
})

onUnmounted(() => {
  if (weeklyTimer) {
    clearInterval(weeklyTimer)
  }
  unlockBodyScroll()
})

// Watchers
watch(() => props.show, (v) => { if (v === true) hoverCloseShop.value = false })
watch(isColorPickerOpen, (v) => { if (v === true) hoverCloseColor.value = false })
watch(activeTab, (newTab) => {
  if (!authStore.isLoggedIn) return
  if (newTab === 'weekly') {
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
}

.close-img {
  width: 32px;
  height: 32px;
  display: block;
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

.shop-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 25px;
  margin-top: 25px;
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

.shop-item.equipped {
  border-color: #fd1515d4;
  border-width: 3px;
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

.dyn-bg { 
  position: absolute; 
  inset: 0; 
  z-index: 0; 
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

.classic-border-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 8px;
  flex-direction: column;
}

.color-change-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 13px;
}

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
}

.color-picker-modal {
  background: #fff;
  border-radius: 12px;
  width: min(550px, 92vw);
  max-height: 90vh;
  overflow: auto;
  box-shadow: 0 20px 40px rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
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
  position: relative;
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

.close-btn-small:hover .close-img { 
  transform: scale(1.18); 
  filter: grayscale(0) brightness(1.1); 
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  padding: 16px;
  overflow-y: auto;
  max-height: 65vh;
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

/* Styles pour les items spéciaux */
.matrix-rain-inside-shop {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.matrix-column {
  position: absolute;
  top: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  animation: matrix-fall 3s linear infinite;
}

.matrix-char {
  font-size: 12px;
  margin: 2px 0px;
  color: #00ff00;
  font-family: monospace;
}

@keyframes matrix-fall {
  0% { transform: translateY(-100%); }
  100% { transform: translateY(100%); }
}

/* Styles pour les items spécifiques */
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

.angel-item-shop {
  width: 100%;
  height: 100%;
  position: relative;
  top: -6px;
  left: -4px;
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

/* Jojo styles */
.jojo-item-shop { 
  position: relative; 
  width: 100%; 
  height: 100%; 
}

.jojo-img-shop { 
  pointer-events: none; 
  z-index: 2; 
}

.jojo-text-preview { 
  pointer-events: none; 
  z-index: 3; 
}

.jojo-bg-anim { 
  animation: jojo-bg-cycle 4.7s steps(1, end) infinite; 
}

@keyframes jojo-bg-cycle {
  0%, 8.99% { background-color: #ffffff; }
  9%, 99% { background-color: #f1e5c6; }
  100% { background-color: #ffffff; }
}

.jojo-sepia-anim { 
  animation: jojo-sepia-cycle 4.7s steps(1, end) infinite; 
}

@keyframes jojo-sepia-cycle {
  0%, 8.99% { filter: sepia(0); }
  9%, 99% { filter: sepia(1); }
  100% { filter: sepia(0); }
}

.jojo-swipe { 
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

.jojotext-fade { 
  animation: jojotext-fade 4.7s steps(1, end) infinite; 
}

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

.classic-border-preview {
  width: 100%;
  height: 100%;
  border-radius: 50%;
}

/* Media queries pour responsive */
@media (max-width: 1024px) {
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
}
</style>
