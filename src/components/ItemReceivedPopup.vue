<template>
  <div v-if="show" class="item-received-overlay" @click.self="$emit('close')">
    <div class="item-received-modal">
      <button
        class="close-btn"
        @click="$emit('close')"
        @mouseover="hoverCloseGift = true"
        @mouseleave="hoverCloseGift = false"
        aria-label="Fermer"
      >
        <img :src="hoverCloseGift ? closeHoverImg : closeImg" alt="Fermer" class="close-img" />
      </button>
      
      <div class="item-received-content">
        <div class="gift-icon">🎁</div>
        <h2 class="popup-title">Nouvel item reçu !</h2>
        
        <div class="items-list" :class="colsClass" :style="itemsGridStyle">
          <div v-for="(it, idx) in items" :key="idx" class="item-info">
          <div class="item-preview">
              <div class="item-img-wrapper">
                <div class="item-img-container" :class="{ 'black-bg': isGreenBg(it) }">
                  <!-- Rendus composites inspirés de l'onglet Collection -->
                  <!-- Matrix (animation CSS, même structure que Collection) -->
                  <div v-if="it.name === 'Matrix'" class="matrix-rain-inside-shop">
                    <div class="matrix-column" v-for="(col, ci) in getMatrixColumns(it)" :key="'mc-'+ci" :style="{ left: (ci * 5) + '%', animationDelay: (col.delay) + 's' }">
                      <span v-for="(ch, ri) in col.chars" :key="'mch-'+ri" class="matrix-char">{{ ch }}</span>
                    </div>
                  </div>
                  <div v-else-if="it.name === 'Clown'" class="clown-item-shop">
                    <img :src="clowncheveux" alt="Clown hair" class="clown-hair-shop" />
                    <img :src="clownnose" alt="Clown nose" class="clown-nose-shop" />
                  </div>
                  <div v-else-if="it.name === 'Gentleman'" class="gentleman-item-shop">
                    <img :src="moustache" alt="Moustache" class="moustache-img-shop" />
                    <img :src="gentleman" alt="Gentleman" class="gentleman-img-shop" />
                  </div>
                  <div v-else-if="it.name === 'Espace'" class="espace-item-shop">
                    <img :src="spacestars" alt="Stars" class="spacestars-img-shop" />
                    <img :src="asteroide" alt="Asteroide" class="asteroide-img-shop" />
                  </div>
                  <div v-else-if="it.name === 'Absolute Cinema'" class="absolute-cinema-item-shop">
                    <img :src="bras" alt="Bras" class="absolute-cinema-img-shop" />
                    <img :src="bras" alt="Bras" class="absolute-cinema-img-shop-right" />
                  </div>
                  <div v-else-if="it.name === 'Flash'" class="flash-item-shop">
                    <img :src="flash" alt="Flash" class="flash-img-shop" />
                    <img :src="camera" alt="Camera" class="camera-img-shop" />
                  </div>
                  <!-- Discord -->
                  <div v-else-if="it.name === 'Discord'" class="discord-item-shop">
                    <img :src="discordon" alt="Discord" class="discord-img-shop" />
                  </div>
                  <!-- Jojo -->
                  <div v-else-if="it.name === 'Jojo'" class="jojo-item-shop jojo-bg-anim">
                    <img :src="jojo" alt="Jojo" class="jojo-img-shop jojo-swipe jojo-sepia-anim" :style="getJojoImgStyle()" />
                    <img v-if="false" :src="jojotext" alt="Jojo text" class="jojo-text-preview jojotext-fade" :style="getJojoTextStyle()" />
                  </div>
                  <div v-else-if="it.name === 'Miaou'" class="miaou-item-shop">
                    <img :src="chat" alt="Chat" class="chat-img-shop" />
                    <img :src="pate" alt="Patte" class="pate-img-shop" />
                  </div>
                  <div v-else-if="it.name === '2000'" class="nokia-item-shop">
                    <img :src="nokia" alt="Nokia" class="nokia-img-shop" />
                    <img :src="clippy" alt="Clippy" class="clippy-img-shop" />
                    <img :src="daftpunk" alt="Daft Punk" class="daftpunk-img-shop" />
                  </div>
                  <div v-else-if="it.name === 'DVD'" class="dvd-item-shop">
                    <img :src="dvd" alt="DVD" class="dvd-img-shop" />
                  </div>
                  <div v-else-if="it.name === 'Lunettes pixel'" class="lunettes-pixel-item-shop">
                    <img :src="mlglunette" alt="Lunettes pixel" class="lunettes-pixel-img-shop" />
                  </div>
                  <!-- Étoiles / Cadre royale / Roses / Vinyle -->
                  <div v-else-if="it.name === 'Étoiles'" class="stars-item-shop">
                    <img :src="star" alt="Étoiles" class="stars-img-shop" />
                  </div>
                  <div v-else-if="it.name === 'Cadre royale'" class="royal-frame-item-shop">
                    <img :src="cadre" alt="Cadre royale" class="royal-frame-img-shop" />
                  </div>
                  <div v-else-if="it.name === 'Roses'" class="rainbow-item-shop">
                    <img :src="love" alt="Roses" class="rainbow-img-shop" />
                  </div>
                  <div v-else-if="it.name === 'Vinyle'" class="vinyle-item-shop">
                    <img :src="vinyle" alt="Vinyle" class="vinyle-img-shop" />
                  </div>
                  <!-- Galaxie / Coeur / Prestige / Planify -->
                  <div v-else-if="it.name === 'Galaxie'" class="galaxie-item-shop">
                    <img :src="galaxie" alt="Galaxie" class="galaxie-img-shop" />
                  </div>
                  <div v-else-if="it.name === 'Coeur'" class="coeur-item-shop">
                    <img :src="coeur" alt="Coeur" class="coeur-img-shop" />
                  </div>
                  <div v-else-if="it.name === 'Prestige'" class="alpha-item-shop">
                    <img :src="alphaImg" alt="Prestige" class="alpha-img-shop" />
                  </div>
                  <div v-else-if="it.name === 'Planify'" class="admin-planify-item-shop">
                    <img :src="adminPlanify" alt="Planify" class="admin-planify-img-shop" />
                  </div>
                  <!-- Variantes de bordure: disque rempli couleur/dégradé -->
                  <div v-else-if="isBorderVariant(it)" class="classic-border-preview" :style="getBorderFillStyle(it)"></div>
                  <!-- Items dynamiques (créés via AdminItemEditor) -->
                  <template v-else-if="isDynamic(it)">
                    <div class="dyn-bg" :style="getDynBgStyle(it)"></div>
                    <img v-for="(a, ai) in (it.assets || [])"
                         :key="'gift-dyn-'+ai"
                         :src="resolveAssetSrc(a && a.src)"
                         :style="getDynAssetStyle(a)" />
                  </template>
                  <!-- Fallback image unique -->
                  <img v-else :src="resolveImg(it)" :alt="it.name" class="item-img" />
                </div>
              </div>
            </div>
            <h3 class="item-name">{{ displayName(it) }}</h3>
          </div>
        </div>
        
        <div v-if="adminMessage" class="admin-message">
          <div class="message-icon">💬</div>
          <div class="message-content">
            <p class="message-text">{{ adminMessage }}</p>
            <p class="message-author">— Message de l'équipe Planify</p>
          </div>
        </div>
        
        <div class="popup-actions">
          <button @click="$emit('close')" class="close-popup-btn">
            Merci !
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import oreilleschat from '@/assets/img/oreilleschat.gif'
import clowncheveux from '@/assets/img/clowncheveux.gif'
import clownnose from '@/assets/img/clownnose.gif'
import cash from '@/assets/img/cash.gif'
import target from '@/assets/img/target.gif'
import roi from '@/assets/img/roi.gif'
import matrix from '@/assets/img/matrix.gif'
import angelwings from '@/assets/img/angelwings.gif'
import laracroft from '@/assets/img/laracroft.gif'
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
import daftpunk from '@/assets/img/daftpunk.gif'
import galaxie from '@/assets/img/Galaxie.png'
import coeur from '@/assets/img/Coeur.png'
import alphaImg from '@/assets/img/Alpha.png'
import adminPlanify from '@/assets/img/Admin Planify.png'
import discordon from '@/assets/img/discordon.png'
import jojo from '@/assets/img/tobecontinued.png'
import jojotext from '@/assets/img/jojotext.gif'
import { useCoinsStore } from '@/stores/coins'
import closeImg from '@/assets/img/bouton_supprimer_decocher.png'
import closeHoverImg from '@/assets/img/bouton_supprimer_cocher.png'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  items: { type: Array, default: () => [] },
  adminMessage: {
    type: String,
    default: ''
  }
})

const mapImg = {
  'Oreilles de chat': oreilleschat,
  'Oreillettes de chat': oreilleschat,
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
  'Gentleman': gentleman,
  'Vinyle': vinyle,
  'Advisory': advisory,
  'Espace': spacestars,
  'Absolute Cinema': bras,
  'Flash': flash,
  'Miaou': chat,
  'DVD': dvd,
  'Lunettes pixel': mlglunette,
  '2000': nokia,
  'Discord': discordon,
  'Jojo': jojo,
  'Galaxie': galaxie,
  'Coeur': coeur,
  'Prestige': alphaImg,
  'Alpha': alphaImg,
  'Planify': adminPlanify,
  'Admin Planify': adminPlanify
}

function resolveImg(item) {
  if (!item) return ''
  return item.img || mapImg[item.name] || ''
}

function isDynamic(item) {
  if (!item) return false
  return !!(item.isDynamic || (Array.isArray(item.assets) && item.assets.length))
}

function resolveAssetSrc(path) {
  try {
    if (typeof path === 'string' && path.startsWith('/uploads/')) {
      // Utiliser les nouvelles APIs pour servir les images depuis la base de données
      if (path.startsWith('/uploads/avatars/')) {
        const api = import.meta.env && import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL : '/api'
        const base = api.endsWith('/api') ? api.slice(0, -4) : api.replace('/api','')
        return base + '/api/uploads/avatars/' + path.split('/').pop()
      } else if (path.startsWith('/uploads/items/')) {
        const api = import.meta.env && import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL : '/api'
        const base = api.endsWith('/api') ? api.slice(0, -4) : api.replace('/api','')
        return base + '/api/uploads/items/' + path.split('/').pop()
      }
      const api = import.meta.env && import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL : '/api'
      const base = api.endsWith('/api') ? api.slice(0, -4) : api.replace('/api','')
      return base + path
    }
  } catch {}
  return path || ''
}

function getDynAssetStyle(asset) {
  const s = (asset && asset.collectionStyle) || asset?.style || {}
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
    const bg = item && item.backgrounds ? (item.backgrounds.collection || item.backgrounds.avatar || item.backgrounds.leaderboard || null) : null
    if (!bg) return { display: 'none' }
    return { position: 'absolute', inset: '0', background: bg, zIndex: 0, pointerEvents: 'none' }
  } catch {
    return { display: 'none' }
  }
}

function displayName(item) {
  try {
    const raw = String(item?.name || '')
    return raw.replace(/\s*\(couleur\)\s*$/i, '')
  } catch {
    return item && item.name ? item.name : ''
  }
}

// Store bordures pour les variantes de bordure
const coinsStore = useCoinsStore()

function isBorderVariant(it) {
  if (!it) return false
  try {
    if (String(it.name || '').toLowerCase().startsWith('bordure ')) return true
    if (typeof coinsStore.getBorderColorIdFromItem === 'function') {
      const id = coinsStore.getBorderColorIdFromItem({ id: it.id, name: it.name })
      return !!id
    }
  } catch {}
  return false
}

function getBorderFillStyle(it) {
  try {
    const colorId = typeof coinsStore.getBorderColorIdFromItem === 'function'
      ? coinsStore.getBorderColorIdFromItem({ id: it.id, name: it.name })
      : null
    const color = (coinsStore.borderColors || []).find(c => c.id === colorId)
    if (color) {
      const style = { width: '100%', height: '100%' }
      if (color.gradient) style.background = color.gradient
      else if (color.color) style.background = color.color
      else style.background = '#000'
      return style
    }
  } catch {}
  return { background: '#000', width: '100%', height: '100%' }
}

// Génère une structure stable pour Matrix (copié de Shop)
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

// Helpers Jojo (mêmes positions que Collection)
function getJojoImgStyle() {
  const p = { top: 50, left: 87, width: 90 }
  return { position: 'absolute', top: p.top + 'px', left: p.left + 'px', width: p.width + '%', height: 'auto', objectFit: 'contain' }
}
function getJojoTextStyle() {
  const p = { top: -5, left: 5, width: 90 }
  return { position: 'absolute', top: p.top + 'px', left: p.left + 'px', width: p.width + '%', height: 'auto', objectFit: 'contain' }
}

function isGreenBg(it) {
  return it && (it.name === 'Étoiles' || it.name === 'Espace' || it.name === 'DVD')
}

const itemsGridStyle = computed(() => {
  const n = Array.isArray(props.items) ? props.items.length : 0
  const cols = n <= 1 ? 1 : (n === 2 ? 2 : 3)
  return { display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)` }
})

const colsClass = computed(() => {
  const n = Array.isArray(props.items) ? props.items.length : 0
  return n <= 1 ? 'one-col' : (n === 2 ? 'two-col' : 'three-col')
})

const hoverCloseGift = ref(false)

defineEmits(['close']);
</script>

<style scoped>

.items-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  max-height: 56vh;
  overflow-y: auto;
}


.item-received-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.3s ease-out;
}

.item-received-modal {
  background: white;
  border-radius: 16px;
  padding: 30px;
  max-width: 400px;
  width: 90%;
  max-height: 90vh;
  overflow: auto;
  position: relative;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  animation: slideIn 0.3s ease-out;
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

.item-received-content {
  text-align: center;
}

.gift-icon {
  font-size: 48px;
  animation: bounce 1s ease-in-out;
}

.popup-title {
  color: #111827;
  font-size: 24px;
  font-family: 'Cobe Heavy';
  margin-bottom: 24px;
  margin-top: 0;
}

.item-info {
  margin-bottom: 24px;
}

.item-preview {
  margin-bottom: 12px;
}
/* Style inspiré de l'onglet collection */
.item-img-wrapper { width: 90px; height: 90px; margin: 0 auto 10px; display:flex; align-items:center; justify-content:center; border-radius:12px; }
.item-img-container { position:relative; width:100%; height:100%; display:flex; align-items:center; justify-content:center; border:3px #5bc681 solid; border-radius:50%; overflow:hidden; }
.dyn-bg { position:absolute; inset:0; z-index:0; }
.item-img { max-width:100%; max-height:100%; object-fit:contain; }
.item-placeholder { width: 80px; height: 80px; background:#f3f4f6; border:2px solid #e5e7eb; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:12px; color:#6b7280; text-align:center; padding:8px; }

/* Positions/tailles identiques à l'onglet Collection */
.clown-item-shop { width: 100%; height: 100%; position: relative; top: -3px; left: -1px; }
.clown-hair-shop { max-width: 100%; max-height: 90%; object-fit: contain; position: absolute; top: 5px; left: 11px; }
.clown-nose-shop { max-width: 100%; max-height: 45%; object-fit: contain; position: absolute; top: 37px; left: 28px; }

.gentleman-item-shop { width: 100%; height: 100%; position: relative; top: -2px; left: -4px; }
.moustache-img-shop { max-width: 60%; max-height: 100%; object-fit: contain; position: absolute; top: 35px; left: 20px; }
.gentleman-img-shop { max-width: 80%; max-height: 100%; object-fit: contain; position: absolute; top: 8px; left: 12px; }

.espace-item-shop { width: 100%; height: 100%; position: relative; top: 2px; left: -2px; }
.spacestars-img-shop { max-width: 90%; max-height: 100%; object-fit: contain; position: absolute; top: 0px; left: 5px; }
.asteroide-img-shop { max-width: 100%; max-height: 50%; object-fit: contain; position: absolute; top: 38px; left: 8px; }

.absolute-cinema-item-shop { width: 100%; height: 100%; position: relative; top: -3px; left: 3px; }
.absolute-cinema-img-shop { max-width: 100%; max-height: 70%; object-fit: contain; position: absolute; top: 15px; left: 10px; }
.absolute-cinema-img-shop-right { max-width: 100%; max-height: 70%; object-fit: contain; position: absolute; top: 15px; left: 50px; transform: scaleX(-1); }

.flash-item-shop { width: 100%; height: 100%; position: relative; top: 1px; left: -1px; }
.flash-img-shop { max-width: 100%; max-height: 65%; object-fit: contain; position: absolute; top: 3px; left: 18px; }
.camera-img-shop { max-width: 100%; max-height: 60%; object-fit: contain; position: absolute; top: 35px; left: 11px; }

.miaou-item-shop { width: 100%; height: 100%; position: relative; top: -2px; left: 2px; }
.chat-img-shop { max-width: 73%; max-height: 100%; object-fit: contain; position: absolute; top: 12px; left: 20px; }
.pate-img-shop { max-width: 100%; max-height: 30%; object-fit: contain; position: absolute; top: 50px; left: 10px; }

.nokia-item-shop { width: 100%; height: 100%; position: relative; top: 2px; left: -2px; }
.nokia-img-shop { max-width: 100%; max-height: 50%; object-fit: contain; position: absolute; top: 35px; left: -2px; }
.clippy-img-shop { max-width: 100%; max-height: 35%; object-fit: contain; position: absolute; top: 45px; left: 45px; }
.daftpunk-img-shop { max-width: 60%; max-height: 80%; object-fit: contain; position: absolute; top: 0px; left: 20px; }

.dvd-item-shop { width: 100%; height: 100%; position: relative; top: 1px; left: -3px; }
.dvd-img-shop { position: absolute; top: 30%; left: 30%; width: 60%; height: 60%; object-fit: contain; transform: translate(-50%, -50%); animation: dvdBounceShop 4s linear infinite; }
@keyframes dvdBounceShop { 0% { top: 30%; left: 30%; } 50% { top: 70%; left: 70%; } 100% { top: 30%; left: 30%; } }

.lunettes-pixel-item-shop { width: 100%; height: 100%; position: relative; top: 0px; left: 0px; }
.lunettes-pixel-img-shop { max-width: 100%; max-height: 100%; object-fit: contain; }

/* Matrix: mêmes classes que Collection */
.matrix-rain-inside-shop { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1; }
.matrix-char { font-size: 12px; margin: 2px 0px; }

/* Étoiles (Collection) */
.stars-item-shop { width: 100%; height: 65%; position: relative; top: -3px; left: 1px; }
.stars-img-shop { max-width: 109%; max-height: 115%; object-fit: contain; }

/* Cadre royale (Collection) */
.royal-frame-item-shop { width: 87%; height: 95%; position: relative; top: 9px; left: 0px; }
.royal-frame-img-shop { max-width: 100%; max-height: 100%; object-fit: contain; }

/* Roses (Collection) */
.rainbow-item-shop { width: 75%; height: 90%; position: relative; top: 10px; left: 0px; }
.rainbow-img-shop { max-width: 100%; max-height: 100%; object-fit: contain; }

/* Vinyle (Collection) */
.vinyle-item-shop { width: 100%; height: 70%; position: relative; top: 0px; left: 0px; }
.vinyle-img-shop { max-width: 100%; max-height: 100%; object-fit: contain; }

.item-name {
  color: #374151;
  font-size: 18px;
  margin: 0;
}

.admin-message {
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 24px;
  margin-top: 24px;
  text-align: left;
}

.message-icon {
  font-size: 20px;
  margin-bottom: 8px;
}

.message-content {
  margin-left: 8px;
}

.message-text {
  color: #0c4a6e;
  font-size: 14px;
  line-height: 1.5;
  font-family: 'Cobe Heavy';
  margin: 0 0 8px 0;
  font-style: italic;
}

.message-author {
  color: #0369a1;
  font-size: 12px;
  font-family: 'Cobe Heavy';
  margin: 0;
}

.popup-actions {
  margin-top: 24px;
}

.close-popup-btn {
  background: #6366f1;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-family: 'Cobe Heavy';
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 120px;
}

.close-popup-btn:hover {
  background: #5855eb;
  transform: translateY(-1px);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    transform: translateY(-20px) scale(0.95);
    opacity: 0;
  }
  to {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

@media (max-width: 480px) {

  .items-list {
    grid-template-columns: repeat(2, 1fr) !important;
  }

  .items-list.one-col {
    grid-template-columns: repeat(1, 1fr) !important;
  }


  .item-received-modal {
    padding: 20px;
    margin: 20px;
  }
  
  .popup-title {
    font-size: 20px;
  }
  
  .item-name {
    font-size: 16px;
  }
}
.classic-border-preview { width: 100%; height: 100%; }
.black-bg { background: #70dd92; }
.discord-item-shop { width: 100%; height: 100%; position: relative; }
.discord-img-shop { position: absolute; top: -3px; left: 13px; width: 65%; height: 112%; object-fit: contain; }
.galaxie-item-shop { width: 100%; height: 100%; position: relative; }
.galaxie-img-shop { position: absolute; top: -5px; left: 5px; width: 90%; height: 112%; object-fit: contain; }
.coeur-item-shop { width: 100%; height: 100%; position: relative; }
.coeur-img-shop { position: absolute; top: -5px; left: 8px; width: 80%; height: 112%; object-fit: contain; }
.alpha-item-shop { width: 100%; height: 100%; position: relative; }
.alpha-img-shop { position: absolute; top: -5px; left: 15px; width: 65%; height: 112%; object-fit: contain; }
.admin-planify-item-shop { width: 100%; height: 100%; position: relative; }
.admin-planify-img-shop { position: absolute; top: -5px; left: 15px; width: 65%; height: 112%; object-fit: contain; }

/* Jojo animations */
.jojo-item-shop { position: relative; width: 100%; height: 100%; }
.jojo-img-shop { pointer-events: none; z-index: 2; }
.jojo-text-preview { pointer-events: none; z-index: 3; }
.jojo-bg-anim { animation: jojo-bg-cycle 4.7s steps(1, end) infinite; }
@keyframes jojo-bg-cycle { 0%, 8.99% { background-color: #ffffff; } 9%, 99% { background-color: #f1e5c6; } 100% { background-color: #ffffff; } }
.jojo-sepia-anim { animation: jojo-sepia-cycle 4.7s steps(1, end) infinite; }
@keyframes jojo-sepia-cycle { 0%, 8.99% { filter: sepia(0); } 9%, 99% { filter: sepia(1); } 100% { filter: sepia(0); } }
.jojo-swipe { animation: jojo-swipe 4.7s ease-in-out infinite; will-change: transform; }
@keyframes jojo-swipe { 0% { transform: translateX(0); } 6% { transform: translateX(-60%); } 9% { transform: translateX(-110%); } 62% { transform: translateX(-110%); } 99% { transform: translateX(-110%); } 100% { transform: translateX(0); } }
.jojotext-fade { animation: jojotext-fade 4.7s steps(1, end) infinite; }
@keyframes jojotext-fade { 0%, 8.99% { opacity: 0; } 9% { opacity: 1; } 62% { opacity: 1; } 99% { opacity: 0; } 100% { opacity: 0; } }
</style>
