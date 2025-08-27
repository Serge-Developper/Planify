<template>
  <div class="admin-item-editor" v-if="isAdmin">
    <h2>Créateur d'items</h2>
    <div style="display:flex;gap:8px;align-items:center;margin:8px 0;">
      <label style="display:flex;align-items:center;gap:6px;">
        <input type="radio" v-model="editorMode" value="items" /> Items dynamiques
      </label>
      <label style="display:flex;align-items:center;gap:6px;">
        <input type="radio" v-model="editorMode" value="border" /> Couleurs de bordure
      </label>
    </div>
    <div class="editor-form" v-if="editorMode==='items'">
      <label>ID (legacy / mapping)
        <input v-model.number="form.legacyId" type="number" min="0" placeholder="ex: 233" />
      </label>
      <label>Nom
        <input v-model="form.name" type="text" placeholder="Nom de l'item" />
      </label>
      <label>Prix
        <input v-model.number="form.price" type="number" min="0" />
      </label>
      <label>Type
        <select v-model="form.type">
          <option value="generic">Générique</option>
          <option value="discord">Discord</option>
          <option value="jojo">Jojo</option>
        </select>
      </label>
      <label>
        Info uniquement (pas de prix)
        <input v-model="form.infoOnly" type="checkbox" />
      </label>
      <label v-if="form.infoOnly">Description d'info
        <textarea v-model="form.infoDescription" placeholder="Comment obtenir cet item ?"></textarea>
      </label>

      <label>
        Disponible en boutique quotidienne
        <input v-model="form.availableInDailyShop" type="checkbox" />
      </label>
      <div class="upload">
        <input ref="fileInput" type="file" multiple accept="image/*" @change="handleFiles" />
        <button class="btn secondary" @click="uploadAssets">Uploader</button>
      </div>
    </div>

    <!-- Formulaire Couleurs de bordure -->
    <div class="editor-form" v-else>
      <label>ID couleur (legacy / mapping)
        <input v-model.number="borderForm.legacyId" type="number" min="0" placeholder="ex: 100" />
      </label>
      <label>Nom
        <input v-model="borderForm.name" type="text" placeholder="Nom de la couleur" />
      </label>
      <label>Prix
        <input v-model.number="borderForm.price" type="number" min="0" />
      </label>
      <label>Identifiant colorId (ex: red, royal-blue)
        <input v-model="borderForm.colorId" type="text" placeholder="ex: red" />
      </label>
      <div class="gradient-ui">
        <div class="grid2">
          <label>Couleur 1
            <input type="color" v-model="grad.c1" />
          </label>
          <label>Opacité 1
            <input type="number" min="0" max="1" step="0.05" v-model.number="grad.o1" />
          </label>
          <label>Couleur 2
            <input type="color" v-model="grad.c2" />
          </label>
          <label>Opacité 2
            <input type="number" min="0" max="1" step="0.05" v-model.number="grad.o2" />
          </label>
          <label>Angle (deg)
            <input type="number" v-model.number="grad.angle" />
          </label>
          <label>
            <input type="checkbox" v-model="grad.enabled" /> Utiliser le dégradé
          </label>
        </div>
        <div class="preview" :style="{ background: gradCss }"></div>
      </div>
      <input v-model="borderForm.color" type="hidden" />
      <input v-model="borderForm.gradient" type="hidden" />
      <label>
        Disponible en boutique quotidienne
        <input v-model="borderForm.availableInDailyShop" type="checkbox" />
      </label>
      <div class="upload">
        <button class="btn primary" @click="saveBorderColor">Enregistrer la couleur</button>
      </div>
    </div>

    <div class="canvas-section" v-if="editorMode==='items'">
      <div class="canvas-tabs">
        <button :class="{active: activeCanvas==='collection'}" @click="activeCanvas='collection'">Collection</button>
        <button :class="{active: activeCanvas==='leaderboard'}" @click="activeCanvas='leaderboard'">Leaderboard</button>
        <button :class="{active: activeCanvas==='navbar'}" @click="activeCanvas='navbar'">Navbar</button>
        <button :class="{active: activeCanvas==='popup-style'}" @click="activeCanvas='popup-style'">Popup Style</button>
      </div>
      <div class="device-tabs" v-if="activeCanvas!=='leaderboard' && activeCanvas!=='navbar' && activeCanvas!=='popup-style'">
        <button :class="{active: activeDevice==='desktop'}" @click="activeDevice='desktop'">Desktop</button>
        <button :class="{active: activeDevice==='mobile'}" @click="activeDevice='mobile'">Mobile</button>
      </div>
      <div class="canvas" :class="{ round: activeCanvas==='collection' }" :style="canvasStyle">
        <div class="bg-fill" :style="bgStyle"></div>
        <img
          v-for="(asset, idx) in activeAssets()"
          :key="idx"
          :src="resolveSrc(asset.src)"
          class="draggable"
          :class="{ selected: selectedIndex === idx }"
          :style="getStyleFor(asset)"
          @mousedown="startDrag($event, asset, idx)"
          @click.stop="selectAsset(idx)"
        />
        <div class="guides"></div>
      </div>
      <div class="tools">
        <button class="btn secondary" @click="addAssetFromUrl">Ajouter par URL</button>
        <button v-if="editorMode==='items' && !isEditing" class="btn primary" @click="saveItem">Enregistrer l'item</button>
        <button v-if="editorMode==='items' && isEditing" class="btn primary" @click="updateItem">Mettre à jour l'item</button>
        <button class="btn outline" @click="testAddToWeekly">Tester en boutique hebdo</button>
        <button class="btn danger" @click="removeFromWeekly">Retirer de la boutique hebdo</button>
        <button class="btn ghost" @click="clearForm">Nouveau</button>
      </div>
      <!-- Gestion des styles (variantes) -->
      <div class="variants-panel">
        <div class="variants-header">
          <h4>Styles de l'item</h4>
          <div class="variants-actions">
            <button class="btn tiny" :class="{ primary: editingVariantIndex===-1 }" @click="editBase">Éditer la base</button>
            <button class="btn tiny outline" @click="addVariant">Ajouter un style</button>
          </div>
        </div>
        <div v-if="form.variants && form.variants.length" class="variants-list">
          <div v-for="(v, vi) in form.variants" :key="vi" class="variant-row">
            <input class="variant-name" v-model="v.name" placeholder="Nom du style (ex: Variante 1)" />
            <div class="variant-buttons">
              <button class="btn tiny" :class="{ primary: editingVariantIndex===vi }" @click="editVariant(vi)">Éditer</button>
              <button class="btn tiny" @click="copyBaseToVariant(vi)">Copier depuis base</button>
              <button class="btn tiny danger" @click="removeVariant(vi)">Supprimer</button>
            </div>
          </div>
        </div>
        <div v-else class="variants-empty">Aucun style. Ajoute un style pour proposer des variantes comme Discord/Jojo.</div>
        
        <!-- Options de variante (quand on édite une variante) -->
        <div v-if="editingVariantIndex >= 0 && form.variants && form.variants[editingVariantIndex]" class="variant-options">
          <h5>Options du style "{{ form.variants[editingVariantIndex].name }}"</h5>
          <div class="variant-option">
            <label>
              <input type="checkbox" v-model="form.variants[editingVariantIndex].textOnly" />
              Texte uniquement (pas d'images)
            </label>
          </div>
          <div v-if="form.variants[editingVariantIndex].textOnly" class="variant-option">
            <label>
              Texte à afficher
              <input type="text" v-model="form.variants[editingVariantIndex].textContent" placeholder="ex: To Be Continued" />
            </label>
          </div>
        </div>
        
        <div class="variants-hint">Contexte d'édition actuel: <b>{{ editingVariantIndex===-1 ? 'Base' : ('Style: '+(((form.variants || [])[editingVariantIndex] && (form.variants || [])[editingVariantIndex].name) || ('#'+(editingVariantIndex+1)))) }}</b></div>
      </div>
      <div class="existing" v-if="existingItems.length">
        <h4>Items enregistrés</h4>
        <ul>
          <li v-for="it in existingItems" :key="it._id">
            <span>#{{ it.legacyId }} — {{ it.name }} ({{ (it.variants || []).length }} styles)</span>
            <button class="btn tiny" @click="editItem(it)">Éditer</button>
            <button class="btn tiny danger" @click="removeItem(it)">Supprimer</button>
          </li>
        </ul>
      </div>
      <div v-if="selectedIndex !== null" class="inspector">
        <h4>Propriétés</h4>
        <div class="grid">
          <label>Top <input type="number" v-model.number="currentStyle.top" /></label>
          <label>Left <input type="number" v-model.number="currentStyle.left" /></label>
          <label>Largeur <input type="number" v-model.number="currentStyle.width" /></label>
          <label>Hauteur <input type="number" v-model.number="currentStyle.height" /></label>
          <label>Rotation <input type="number" v-model.number="currentStyle.rotate" /></label>
          <label>z-index <input type="number" v-model.number="currentStyle.zIndex" /></label>
          <label>Object-fit
            <select v-model="currentStyle.objectFit">
              <option value="contain">contain</option>
              <option value="cover">cover</option>
              <option value="fill">fill</option>
            </select>
          </label>
        </div>
        <div class="bg-controls">
          <label>Fond (CSS color/gradient)
            <input type="text" v-model="bgTextModel" placeholder="ex: #0e0e0e ou linear-gradient(...)" />
          </label>
          <div class="bg-picker-row">
            <label style="display:flex;align-items:center;gap:8px;">
              <span>Couleur</span>
              <input type="color" v-model="bgPickerColor" />
            </label>
            <label style="display:flex;align-items:center;gap:8px;">
              <span>Opacité</span>
              <input type="range" min="0" max="100" step="1" v-model.number="bgPickerAlphaPercent" />
              <span style="min-width:32px;text-align:right;">{{ bgPickerAlphaPercent }}%</span>
            </label>
          </div>
        </div>
        <div class="row nudge-row">
          <button class="btn tiny" @click="nudge(0, -1)">↑</button>
          <button class="btn tiny" @click="nudge(-1, 0)">←</button>
          <button class="btn tiny" @click="nudge(1, 0)">→</button>
          <button class="btn tiny" @click="nudge(0, 1)">↓</button>
        </div>
        <!-- Contrôle de position pour le leaderboard -->
        <div v-if="activeCanvas==='leaderboard' && selectedIndex !== null" class="layer-controls">
          <span>Position sur le leaderboard :</span>
          <button class="btn tiny" @click="setLeaderboardPlacement('below')">Derrière</button>
          <button class="btn tiny" @click="setLeaderboardPlacement('inside')">Dans l'avatar</button>
          <button class="btn tiny" @click="setLeaderboardPlacement('above')">Au-dessus</button>
        </div>
        <!-- Contrôle de position pour la Navbar -->
        <div v-if="activeCanvas==='navbar' && selectedIndex !== null" class="layer-controls">
          <span>Position dans la Navbar :</span>
          <button class="btn tiny" @click="setNavbarPlacement('below')">Derrière</button>
          <button class="btn tiny" @click="setNavbarPlacement('inside')">Dans l'avatar</button>
          <button class="btn tiny" @click="setNavbarPlacement('above')">Au-dessus</button>
        </div>
      </div>
    </div>
    
    <!-- Aperçu simple pour Couleurs de bordure -->
    <div v-else style="margin-top:12px;">
      <h4 style="margin:8px 0;color:#111;">Aperçu de la bordure (3px)</h4>
      <div :style="borderPreviewOuter" style="display:inline-block;">
        <div :style="borderPreviewInner"></div>
      </div>
      <div class="existing" v-if="borderColorsList.length" style="margin-top:12px;">
        <h4>Couleurs enregistrées</h4>
        <ul>
          <li v-for="c in borderColorsList" :key="c.id" style="display:flex;gap:10px;align-items:center;">
            <div :style="{ width:'18px', height:'18px', borderRadius:'4px', background: c.gradient || c.color || '#000' }"></div>
            <span>#{{ c.id }} — {{ c.name }}</span>
            <button class="btn tiny" @click="editBorderColor(c)">Éditer</button>
            <button class="btn tiny danger" @click="deleteBorderColor(c)">Supprimer</button>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { secureApiCall, API_URL } from '@/api'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const isAdmin = computed(() => auth.user && auth.user.role === 'admin')
const editorMode = ref('items') // 'items' | 'border'

const fileInput = ref(null)
const activeCanvas = ref('collection') // collection | leaderboard | avatar | navbar
const activeDevice = ref('desktop') // desktop | mobile
const selectedIndex = ref(null)
const DEFAULT_STYLE = { top: 0, left: 0, width: 100, rotate: 0, objectFit: 'contain', zIndex: 1 }
function getApiOrigin() {
  const api = API_URL || ''
  try {
    if (api.startsWith('http')) return new URL(api).origin
  } catch {}
  if (import.meta && import.meta.env && import.meta.env.DEV) return 'http://localhost:3000'
  return window.location.origin
}
const baseUrl = getApiOrigin()
const existingItems = ref([])
const isEditing = ref(false)
const editingId = ref(null)
// -1 = base, >=0 = index de variante en cours d'édition
const editingVariantIndex = ref(-1)

const form = ref({
  legacyId: null,
  name: '',
  price: 0,
  type: 'generic',
  infoOnly: false,
  infoDescription: '',
  availableInDailyShop: false,
  assets: [],
  backgrounds: { collection: null, leaderboard: null, avatar: null, navbar: null },
  variants: []
})

// Formulaire Couleur de bordure
const borderForm = ref({
  legacyId: 100,
  name: '',
  price: 0,
  colorId: '',
  color: '#000000',
  gradient: '',
  availableInDailyShop: false
})
// UI simple pour dégradé (mêmes principes que matières dynamiques)
const grad = ref({ enabled: false, c1: '#000000', o1: 1, c2: '#ffffff', o2: 1, angle: 45 })
const gradCss = computed(() => {
  const a = Math.max(0, Math.min(1, Number(grad.value.o1)))
  const b = Math.max(0, Math.min(1, Number(grad.value.o2)))
  const c1 = grad.value.c1 || '#000000'
  const c2 = grad.value.c2 || '#ffffff'
  if (grad.value.enabled) {
    const rgba1 = hexToRgba(c1, a)
    const rgba2 = hexToRgba(c2, b)
    return `linear-gradient(${Number(grad.value.angle) || 0}deg, ${rgba1}, ${rgba2})`
  }
  return c1
})
watch(grad, () => {
  // alimenter les champs envoyés à l’API
  if (grad.value.enabled) {
    borderForm.value.gradient = gradCss.value
    borderForm.value.color = grad.value.c1
  } else {
    borderForm.value.gradient = ''
    borderForm.value.color = grad.value.c1
  }
}, { deep: true, immediate: true })

function hexToRgba(hex, alpha) {
  try {
    const h = hex.replace('#','')
    const bigint = parseInt(h.length === 3 ? h.split('').map(ch=>ch+ch).join('') : h, 16)
    const r = (bigint >> 16) & 255
    const g = (bigint >> 8) & 255
    const b = bigint & 255
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  } catch { return hex }
}

const borderColorsList = ref([])
const editingBorderId = ref(null)

const canvasStyle = computed(() => {
  // Dimensions: Collection = 90 (desktop) / 80 (mobile) — Leaderboard = 50 — Navbar = 57 — Popup Style = 120.5x64
  let size = 220
  let width = size
  let height = size
  let borderRadius = '12px'
  let border = '3px solid #e0e0e0'
  
  if (activeCanvas.value === 'collection') {
    size = (activeDevice.value === 'mobile' ? 80 : 90)
    width = size
    height = size
    border = '3px solid #3ddc84'
    borderRadius = '50%'
  } else if (activeCanvas.value === 'leaderboard') {
    size = 50
    width = size
    height = size
  } else if (activeCanvas.value === 'navbar') {
    size = 57
    width = size
    height = size
  } else if (activeCanvas.value === 'avatar') {
    size = 160
    width = size
    height = size
  } else if (activeCanvas.value === 'popup-style') {
    width = 120.5
    height = 64
  }
  
  return {
    position: 'relative',
    width: width + 'px',
    height: height + 'px',
    background: 'transparent',
    overflow: 'hidden',
    border: border,
    borderRadius: borderRadius
  }
})

const bgStyle = computed(() => {
  const ctx = (activeCanvas.value === 'collection' || activeCanvas.value === 'leaderboard' || activeCanvas.value === 'avatar' || activeCanvas.value === 'navbar' || activeCanvas.value === 'popup-style')
    ? activeCanvas.value
    : 'collection'
  let bgs = (form.value && form.value.backgrounds) ? form.value.backgrounds : { collection: null, leaderboard: null, avatar: null, navbar: null, 'popup-style': null }
  if (editingVariantIndex.value !== -1) {
    const v = (form.value.variants || [])[editingVariantIndex.value]
    if (v && v.backgrounds) bgs = v.backgrounds
  }
  const chosen = bgs[ctx] || null
  return {
    position: 'absolute', inset: 0, pointerEvents: 'none',
    background: chosen || 'transparent'
  }
})

// Aperçu simple: cercle avec bordure 3px couleur choisie
const borderPreviewOuter = computed(() => {
  const hasGradient = !!(borderForm.value.gradient && borderForm.value.gradient.trim())
  const borderColor = hasGradient ? 'rgb(224, 224, 224)' : (borderForm.value.color || 'rgb(224, 224, 224)')
  return {
    position: 'relative',
    width: '50px',
    height: '50px',
    background: 'transparent',
    overflow: 'hidden',
    border: `3px solid ${borderColor}`,
    borderRadius: '12px'
  }
})
const borderPreviewInner = computed(() => {
  // L'inner reste neutre; on pourrait l'utiliser plus tard pour simuler un dégradé
  return {
    width: '100%',
    height: '100%',
    borderRadius: '10px',
    background: 'transparent'
  }
})

// Modèle texte pour l'input background selon base/variante
const bgTextModel = computed({
  get() {
    const ctx = (activeCanvas.value === 'collection' || activeCanvas.value === 'leaderboard' || activeCanvas.value === 'avatar' || activeCanvas.value === 'navbar' || activeCanvas.value === 'popup-style')
      ? activeCanvas.value : 'collection'
    const target = editingVariantIndex.value === -1
      ? (form.value.backgrounds || {})
      : (((form.value.variants || [])[editingVariantIndex.value]?.backgrounds) || {})
    return target[ctx] || ''
  },
  set(val) {
    const ctx = (activeCanvas.value === 'collection' || activeCanvas.value === 'leaderboard' || activeCanvas.value === 'avatar' || activeCanvas.value === 'navbar' || activeCanvas.value === 'popup-style')
      ? activeCanvas.value : 'collection'
    if (editingVariantIndex.value === -1) {
      if (!form.value.backgrounds) form.value.backgrounds = { collection: null, leaderboard: null, avatar: null, navbar: null, 'popup-style': null }
      form.value.backgrounds[ctx] = val
    } else {
      const v = (form.value.variants || [])[editingVariantIndex.value]
      if (v) {
        if (!v.backgrounds) v.backgrounds = { collection: null, leaderboard: null, avatar: null, navbar: null, 'popup-style': null }
        v.backgrounds[ctx] = val
      }
    }
  }
})

// Sélecteur couleur + opacité lié au background courant
const bgPickerColor = computed({
  get() {
    const ctx = (activeCanvas.value === 'collection' || activeCanvas.value === 'leaderboard' || activeCanvas.value === 'avatar' || activeCanvas.value === 'navbar' || activeCanvas.value === 'popup-style')
      ? activeCanvas.value : 'collection'
    // Sélectionner la bonne cible (base ou variante)
    let bgs = (form.value && form.value.backgrounds) ? form.value.backgrounds : { collection: null, leaderboard: null, avatar: null, navbar: null, 'popup-style': null }
    if (editingVariantIndex.value !== -1) {
      const v = (form.value.variants || [])[editingVariantIndex.value]
      if (v && v.backgrounds) bgs = v.backgrounds
    }
    const val = bgs[ctx]
    if (typeof val === 'string' && val.startsWith('rgba')) {
      const m = val.match(/rgba\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i)
      if (m) {
        const r = Number(m[1])|0, g = Number(m[2])|0, b = Number(m[3])|0
        const toHex = (n) => n.toString(16).padStart(2,'0')
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`
      }
    }
    if (typeof val === 'string' && val.startsWith('#')) return val
    return '#000000'
  },
  set(hex) {
    const ctx = (activeCanvas.value === 'collection' || activeCanvas.value === 'leaderboard' || activeCanvas.value === 'avatar' || activeCanvas.value === 'navbar' || activeCanvas.value === 'popup-style')
      ? activeCanvas.value : 'collection'
    const a = Math.max(0, Math.min(1, bgPickerAlphaPercent.value / 100))
    const { r, g, b } = hexToRgb(hex)
    if (editingVariantIndex.value === -1) {
      if (!form.value.backgrounds) form.value.backgrounds = { collection: null, leaderboard: null, avatar: null, navbar: null, 'popup-style': null }
      form.value.backgrounds[ctx] = `rgba(${r}, ${g}, ${b}, ${a})`
    } else {
      const v = (form.value.variants || [])[editingVariantIndex.value]
      if (v) {
        if (!v.backgrounds) v.backgrounds = { collection: null, leaderboard: null, avatar: null, navbar: null, 'popup-style': null }
        v.backgrounds[ctx] = `rgba(${r}, ${g}, ${b}, ${a})`
      }
    }
  }
})

const bgPickerAlphaPercent = computed({
  get() {
    const ctx = (activeCanvas.value === 'collection' || activeCanvas.value === 'leaderboard' || activeCanvas.value === 'avatar' || activeCanvas.value === 'navbar' || activeCanvas.value === 'popup-style')
      ? activeCanvas.value : 'collection'
    let bgs = (form.value && form.value.backgrounds) ? form.value.backgrounds : { collection: null, leaderboard: null, avatar: null, navbar: null, 'popup-style': null }
    if (editingVariantIndex.value !== -1) {
      const v = (form.value.variants || [])[editingVariantIndex.value]
      if (v && v.backgrounds) bgs = v.backgrounds
    }
    const val = bgs[ctx]
    if (typeof val === 'string' && val.startsWith('rgba')) {
      const m = val.match(/rgba\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*([0-1]?(?:\.\d+)?)\s*\)/i)
      if (m) return Math.round(parseFloat(m[1]) * 100)
    }
    return 100
  },
  set(p) {
    const ctx = (activeCanvas.value === 'collection' || activeCanvas.value === 'leaderboard' || activeCanvas.value === 'avatar' || activeCanvas.value === 'navbar' || activeCanvas.value === 'popup-style')
      ? activeCanvas.value : 'collection'
    const hex = bgPickerColor.value
    const a = Math.max(0, Math.min(1, Number(p) / 100))
    const { r, g, b } = hexToRgb(hex)
    if (editingVariantIndex.value === -1) {
      if (!form.value.backgrounds) form.value.backgrounds = { collection: null, leaderboard: null, avatar: null, navbar: null, 'popup-style': null }
      form.value.backgrounds[ctx] = `rgba(${r}, ${g}, ${b}, ${a})`
    } else {
      const v = (form.value.variants || [])[editingVariantIndex.value]
      if (v) {
        if (!v.backgrounds) v.backgrounds = { collection: null, leaderboard: null, avatar: null, navbar: null, 'popup-style': null }
        v.backgrounds[ctx] = `rgba(${r}, ${g}, ${b}, ${a})`
      }
    }
  }
})

function hexToRgb(hex) {
  const h = String(hex || '#000').replace('#','')
  const value = h.length === 3 ? h.split('').map(c => c+c).join('') : h
  const int = parseInt(value, 16)
  const r = (int >> 16) & 255
  const g = (int >> 8) & 255
  const b = int & 255
  return { r, g, b }
}

function getActiveStyleKey() {
  const suffix = (activeDevice.value === 'mobile') ? 'Mobile' : ''
  if (activeCanvas.value === 'collection') return 'collectionStyle' + suffix
  if (activeCanvas.value === 'leaderboard') return 'leaderboardStyle' + suffix
  if (activeCanvas.value === 'popup-style') return 'popupStyleStyle'
  return 'navbarStyle' + suffix
}

function ensureStyle(asset) {
  const key = getActiveStyleKey()
  if (!asset) return DEFAULT_STYLE
  if (!asset[key]) asset[key] = { top: 0, left: 0, width: 100, rotate: 0, objectFit: 'contain', zIndex: 1 }
  // S'assurer que les autres contextes existent pour éviter les accès undefined dans des watchers/computed
  if (!asset.style) asset.style = { top: 0, left: 0, width: 100, rotate: 0, objectFit: 'contain', zIndex: 1 }
  if (!asset.collectionStyle) asset.collectionStyle = { top: 0, left: 0, width: 100, rotate: 0, objectFit: 'contain', zIndex: 1 }
  if (!asset.leaderboardStyle) asset.leaderboardStyle = { top: 0, left: 0, width: 100, rotate: 0, objectFit: 'contain', zIndex: 1 }
  if (!asset.navbarStyle) asset.navbarStyle = { top: 0, left: 0, width: 100, rotate: 0, objectFit: 'contain', zIndex: 1 }
  if (!asset.popupStyleStyle) asset.popupStyleStyle = { top: 0, left: 0, width: 100, rotate: 0, objectFit: 'contain', zIndex: 1 }
  if (!asset.collectionStyleMobile) asset.collectionStyleMobile = { top: 0, left: 0, width: 100, rotate: 0, objectFit: 'contain', zIndex: 1 }
  if (!asset.leaderboardStyleMobile) asset.leaderboardStyleMobile = { top: 0, left: 0, width: 100, rotate: 0, objectFit: 'contain', zIndex: 1 }
  if (!asset.navbarStyleMobile) asset.navbarStyleMobile = { top: 0, left: 0, width: 100, rotate: 0, objectFit: 'contain', zIndex: 1 }
  return asset[key]
}

function getStyleFor(asset) {
  if (!asset) return {
    position: 'absolute', top: '0px', left: '0px', width: '100px', height: 'auto', transform: 'rotate(0deg)', objectFit: 'contain', zIndex: 1, pointerEvents: 'auto', cursor: 'move'
  }
  const s = ensureStyle(asset)
  return {
    position: 'absolute',
    top: s.top + 'px',
    left: s.left + 'px',
    width: (s.width || 100) + 'px',
    height: (typeof s.height === 'number' ? s.height + 'px' : (s.height || 'auto')),
    transform: `rotate(${s.rotate || 0}deg)`,
    objectFit: s.objectFit || 'contain',
    zIndex: s.zIndex || 1,
    pointerEvents: 'auto',
    cursor: 'move'
  }
}

function resolveSrc(src) {
  if (!src) return ''
  if (String(src).startsWith('/uploads/')) {
    // Utiliser les nouvelles APIs pour servir les images depuis la base de données
    if (src.startsWith('/uploads/avatars/')) {
      return baseUrl + '/api/uploads/avatars/' + src.split('/').pop()
    } else if (src.startsWith('/uploads/items/')) {
      // Servir en binaire base64 via la route items/uploads
      return baseUrl + '/api/items/uploads/' + src.split('/').pop()
    }
    return baseUrl + src
  }
  return src
}
function activeAssets() {
  try {
    if (editingVariantIndex.value === -1) return Array.isArray(form.value.assets) ? form.value.assets : []
    const variants = Array.isArray(form.value.variants) ? form.value.variants : []
    if (editingVariantIndex.value < 0 || editingVariantIndex.value >= variants.length) return []
    const v = variants[editingVariantIndex.value]
    return Array.isArray(v?.assets) ? v.assets : []
  } catch { return [] }
}


function sanitizeStyle(s) {
  const base = { top: 0, left: 0, width: 100, height: null, rotate: 0, objectFit: 'contain', zIndex: 1 }
  if (!s || typeof s !== 'object') return { ...base }
  return {
    top: typeof s.top === 'number' ? s.top : base.top,
    left: typeof s.left === 'number' ? s.left : base.left,
    width: typeof s.width === 'number' ? s.width : base.width,
    height: typeof s.height === 'number' ? s.height : base.height,
    rotate: typeof s.rotate === 'number' ? s.rotate : base.rotate,
    objectFit: s.objectFit || base.objectFit,
    zIndex: typeof s.zIndex === 'number' ? s.zIndex : base.zIndex
  }
}

function sanitizeAsset(a) {
  if (!a) return { src: '', style: sanitizeStyle(null), collectionStyle: sanitizeStyle(null), collectionStyleMobile: sanitizeStyle(null), leaderboardStyle: sanitizeStyle(null), leaderboardStyleMobile: sanitizeStyle(null), avatarStyle: sanitizeStyle(null), avatarStyleMobile: sanitizeStyle(null), navbarStyle: sanitizeStyle(null), navbarStyleMobile: sanitizeStyle(null), popupStyleStyle: sanitizeStyle(null), meta: {} }
  return {
    src: a.src || '',
    style: sanitizeStyle(a.style),
    collectionStyle: sanitizeStyle(a.collectionStyle),
    collectionStyleMobile: sanitizeStyle(a.collectionStyleMobile),
    leaderboardStyle: sanitizeStyle(a.leaderboardStyle),
    leaderboardStyleMobile: sanitizeStyle(a.leaderboardStyleMobile),
    avatarStyle: sanitizeStyle(a.avatarStyle),
    avatarStyleMobile: sanitizeStyle(a.avatarStyleMobile),
    navbarStyle: sanitizeStyle(a.navbarStyle),
    navbarStyleMobile: sanitizeStyle(a.navbarStyleMobile),
    popupStyleStyle: sanitizeStyle(a.popupStyleStyle),
    meta: a.meta && typeof a.meta === 'object' ? { ...a.meta } : {}
  }
}

function sanitizeItem(it) {
  const clone = JSON.parse(JSON.stringify(it || {}))
  if (!Array.isArray(clone.assets)) clone.assets = []
  clone.assets = clone.assets.map(sanitizeAsset)
  if (!clone.backgrounds) clone.backgrounds = { collection: null, leaderboard: null, avatar: null, navbar: null, 'popup-style': null }
  // S'assurer que tous les backgrounds sont présents
  if (clone.backgrounds) {
    clone.backgrounds.collection = clone.backgrounds.collection || null
    clone.backgrounds.leaderboard = clone.backgrounds.leaderboard || null
    clone.backgrounds.avatar = clone.backgrounds.avatar || null
    clone.backgrounds.navbar = clone.backgrounds.navbar || null
    clone.backgrounds['popup-style'] = clone.backgrounds['popup-style'] || null
  }
  // Conserver et assainir les variantes si présentes
  if (Array.isArray(clone.variants)) {
    clone.variants = clone.variants.map(v => {
      const variant = {
        name: v?.name || 'Style',
        assets: Array.isArray(v?.assets) ? v.assets.map(sanitizeAsset) : [],
        backgrounds: v?.backgrounds || { collection: null, leaderboard: null, avatar: null, navbar: null, 'popup-style': null },
        textOnly: !!v?.textOnly,
        textContent: v?.textContent || ''
      }
      // S'assurer que tous les backgrounds sont présents dans les variantes
      if (variant.backgrounds) {
        variant.backgrounds.collection = variant.backgrounds.collection || null
        variant.backgrounds.leaderboard = variant.backgrounds.leaderboard || null
        variant.backgrounds.avatar = variant.backgrounds.avatar || null
        variant.backgrounds.navbar = variant.backgrounds.navbar || null
        variant.backgrounds['popup-style'] = variant.backgrounds['popup-style'] || null
      }
      // S'assurer que tous les styles sont présents dans les assets des variantes
      if (Array.isArray(variant.assets)) {
        variant.assets = variant.assets.map(asset => {
          if (!asset) return asset
          // S'assurer que tous les styles sont présents
          if (!asset.style) asset.style = { top: 0, left: 0, width: 100, rotate: 0, objectFit: 'contain', zIndex: 1 }
          if (!asset.collectionStyle) asset.collectionStyle = { top: 0, left: 0, width: 100, rotate: 0, objectFit: 'contain', zIndex: 1 }
          if (!asset.collectionStyleMobile) asset.collectionStyleMobile = { top: 0, left: 0, width: 100, rotate: 0, objectFit: 'contain', zIndex: 1 }
          if (!asset.leaderboardStyle) asset.leaderboardStyle = { top: 0, left: 0, width: 100, rotate: 0, objectFit: 'contain', zIndex: 1 }
          if (!asset.leaderboardStyleMobile) asset.leaderboardStyleMobile = { top: 0, left: 0, width: 100, rotate: 0, objectFit: 'contain', zIndex: 1 }
          if (!asset.avatarStyle) asset.avatarStyle = { top: 0, left: 0, width: 100, rotate: 0, objectFit: 'contain', zIndex: 1 }
          if (!asset.avatarStyleMobile) asset.avatarStyleMobile = { top: 0, left: 0, width: 100, rotate: 0, objectFit: 'contain', zIndex: 1 }
          if (!asset.navbarStyle) asset.navbarStyle = { top: 0, left: 0, width: 100, rotate: 0, objectFit: 'contain', zIndex: 1 }
          if (!asset.navbarStyleMobile) asset.navbarStyleMobile = { top: 0, left: 0, width: 100, rotate: 0, objectFit: 'contain', zIndex: 1 }
          if (!asset.popupStyleStyle) asset.popupStyleStyle = { top: 0, left: 0, width: 100, rotate: 0, objectFit: 'contain', zIndex: 1 }
          return asset
        })
      }
      return variant
    })
  } else {
    clone.variants = []
  }
  return clone
}

let dragState = null
function startDrag(e, asset, idx) {
  selectedIndex.value = idx
  const s = ensureStyle(asset)
  dragState = { startX: e.clientX, startY: e.clientY, asset, s }
  window.addEventListener('mousemove', onDrag)
  window.addEventListener('mouseup', stopDrag)
}
function onDrag(e) {
  if (!dragState) return
  const dx = e.clientX - dragState.startX
  const dy = e.clientY - dragState.startY
  dragState.s.left += dx
  dragState.s.top += dy
  dragState.startX = e.clientX
  dragState.startY = e.clientY
}
function stopDrag() {
  window.removeEventListener('mousemove', onDrag)
  window.removeEventListener('mouseup', stopDrag)
  dragState = null
}

// Fonction pour synchroniser les modifications avec les assets de la variante
function syncVariantAssets() {
  if (editingVariantIndex.value === -1) return
  
  const variant = (form.value.variants || [])[editingVariantIndex.value]
  if (!variant || !Array.isArray(variant.assets)) return
  
  // Synchroniser les assets de la variante avec les modifications actuelles
  variant.assets = variant.assets.map(asset => {
    if (!asset) return asset
    // S'assurer que tous les styles sont présents et à jour
    const key = getActiveStyleKey()
    if (!asset[key]) {
      asset[key] = { top: 0, left: 0, width: 100, rotate: 0, objectFit: 'contain', zIndex: 1 }
    }
    return asset
  })
}

function selectAsset(idx) {
  selectedIndex.value = idx
}
function editBase() {
  // Synchroniser les modifications avant de revenir à la base
  syncVariantAssets()
  editingVariantIndex.value = -1
  selectedIndex.value = null
}
function addVariant() {
  if (!Array.isArray(form.value.variants)) form.value.variants = []
  const currentVariants = Array.isArray(form.value.variants) ? form.value.variants : []
  const baseAssets = Array.isArray(form.value.assets) ? JSON.parse(JSON.stringify(form.value.assets)) : []
  const baseBgs = form.value.backgrounds ? JSON.parse(JSON.stringify(form.value.backgrounds)) : { collection: null, leaderboard: null, avatar: null, navbar: null, 'popup-style': null }
  const newVariant = { 
    name: `Variante ${currentVariants.length + 1}`, 
    assets: baseAssets, 
    backgrounds: baseBgs,
    textOnly: false,
    textContent: ''
  }
  // Réassigner le tableau pour forcer la réactivité si besoin
  form.value.variants = [...currentVariants, newVariant]
  // Basculer directement en édition de ce nouveau style
  editingVariantIndex.value = form.value.variants.length - 1
  selectedIndex.value = null
}
function editVariant(i) {
  // Synchroniser les modifications avant de changer de variante
  syncVariantAssets()
  editingVariantIndex.value = i
  selectedIndex.value = null
}
function copyBaseToVariant(i) {
  const v = (form.value.variants || [])[i]
  if (!v) return
  v.assets = JSON.parse(JSON.stringify(form.value.assets || []))
  v.backgrounds = JSON.parse(JSON.stringify(form.value.backgrounds || { collection: null, leaderboard: null, avatar: null, navbar: null, 'popup-style': null }))
}
function removeVariant(i) {
  if (!Array.isArray(form.value.variants)) return
  form.value.variants.splice(i, 1)
  if (editingVariantIndex.value === i) editingVariantIndex.value = -1
}

const currentStyle = computed({
  get() {
    if (selectedIndex.value === null) return DEFAULT_STYLE
    const assets = activeAssets()
    const asset = Array.isArray(assets) ? assets[selectedIndex.value] : null
    if (!asset) return DEFAULT_STYLE
    return ensureStyle(asset)
  },
  set(newValue) {
    if (selectedIndex.value === null) return
    const assets = activeAssets()
    const asset = Array.isArray(assets) ? assets[selectedIndex.value] : null
    if (!asset) return
    
    const key = getActiveStyleKey()
    if (!asset[key]) {
      asset[key] = { top: 0, left: 0, width: 100, rotate: 0, objectFit: 'contain', zIndex: 1 }
    }
    
    // Mettre à jour les propriétés du style
    Object.assign(asset[key], newValue)
  }
})

function nudge(dx, dy) {
  if (selectedIndex.value === null) return
  const assets = activeAssets()
  const asset = Array.isArray(assets) ? assets[selectedIndex.value] : null
  if (!asset) return
  
  const key = getActiveStyleKey()
  if (!asset[key]) {
    asset[key] = { top: 0, left: 0, width: 100, rotate: 0, objectFit: 'contain', zIndex: 1 }
  }
  
  asset[key].left += dx
  asset[key].top += dy
}



function setLeaderboardPlacement(placement) {
  if (selectedIndex.value === null) return
  const assets = activeAssets()
  const asset = Array.isArray(assets) ? assets[selectedIndex.value] : null
  if (!asset) return
  if (!asset.meta) asset.meta = {}
  if (placement !== 'above' && placement !== 'inside') placement = 'below'
  asset.meta.leaderboardPlacement = placement
}

function setNavbarPlacement(placement) {
  if (selectedIndex.value === null) return
  const assets = activeAssets()
  const asset = Array.isArray(assets) ? assets[selectedIndex.value] : null
  if (!asset) return
  if (!asset.meta) asset.meta = {}
  if (placement !== 'above' && placement !== 'inside') placement = 'below'
  asset.meta.navbarPlacement = placement
}

async function handleFiles(e) {}

async function uploadAssets() {
  const input = fileInput.value
  if (!input || !input.files || !input.files.length) return
  const formData = new FormData()
  for (const f of Array.from(input.files)) formData.append('files', f)
  const res = await fetch(`${API_URL}/items/upload`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${auth.user?.token || ''}` },
    body: formData
  })
  const data = await res.json()
  if (data.success) {
    const target = editingVariantIndex.value === -1 ? form.value.assets : ((form.value.variants[editingVariantIndex.value].assets ||= []))
    for (const file of data.files) target.push(sanitizeAsset({ src: file.url, style: { top: 0, left: 0, width: 100, height: 100 } }))
    // Sélectionner automatiquement le dernier asset ajouté
    try { selectedIndex.value = target.length - 1 } catch {}
  } else {
    alert('Upload échoué')
  }
}

function addAssetFromUrl() {
  const url = prompt('URL de l\'image (déjà sur le serveur)')
  if (!url) return
  const target = editingVariantIndex.value === -1 ? form.value.assets : ((form.value.variants[editingVariantIndex.value].assets ||= []))
  target.push(sanitizeAsset({ src: url, style: { top: 0, left: 0, width: 100 } }))
  // Sélectionner automatiquement le dernier asset ajouté
  try { selectedIndex.value = target.length - 1 } catch {}
}

async function saveItem() {
  // Synchroniser les modifications avec les assets de la variante avant la sauvegarde
  syncVariantAssets()
  const payload = sanitizeItem(form.value)
  // Rien à faire de spécial ici: les propriétés *StyleMobile sont déjà dans form.assets via ensureStyle
  const res = await secureApiCall('/items', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
  if (res && res.success) {
    alert('Item créé !')
    // Mettre à jour la liste localement sans recharger (évite d'éventuels caches)
    try {
      if (res.item && res.item._id) {
        existingItems.value = [res.item, ...existingItems.value]
      }
    } catch {}
    form.value = { legacyId: null, name: '', price: 0, type: 'generic', infoOnly: false, infoDescription: '', availableInDailyShop: false, assets: [], backgrounds: { collection: null, leaderboard: null, avatar: null, navbar: null, 'popup-style': null }, variants: [] }
    isEditing.value = false
    editingId.value = null
    selectedIndex.value = null
    try { window.dispatchEvent(new CustomEvent('items-changed')) } catch {}
  } else {
    const msg = (res && res.message) ? res.message : 'Erreur création item'
    if (String(msg).includes('legacyId déjà utilisé')) alert('ID déjà utilisé. Choisissez un autre legacyId.')
    else alert(msg)
  }
}

async function saveBorderColor() {
  const body = {
    id: borderForm.value.colorId || String(borderForm.value.legacyId),
    name: borderForm.value.name || (borderForm.value.colorId || 'Couleur'),
    color: borderForm.value.color || null,
    gradient: borderForm.value.gradient || null,
    price: Number(borderForm.value.price) || 0
  }
  let res
  if (editingBorderId.value) {
    res = await secureApiCall(`/border-colors?id=${encodeURIComponent(editingBorderId.value)}`, { method: 'PUT', body: JSON.stringify(body) })
  } else {
    res = await secureApiCall('/border-colors', { method: 'POST', body: JSON.stringify(body) })
  }
  if (res && res.success) {
    await loadBorderColors()
    alert(editingBorderId.value ? 'Couleur mise à jour !' : 'Couleur enregistrée !')
    editingBorderId.value = null
    borderForm.value = { legacyId: 100, name: '', price: 0, colorId: '', color: '#000000', gradient: '', availableInDailyShop: false }
  } else {
    alert(res?.message || 'Erreur enregistrement couleur')
  }
}

async function loadBorderColors() {
  try {
    const res = await secureApiCall('/border-colors')
    borderColorsList.value = (res && res.success && Array.isArray(res.colors)) ? res.colors : []
  } catch { borderColorsList.value = [] }
}

function editBorderColor(c) {
  if (!c) return
  borderForm.value.legacyId = Number(borderForm.value.legacyId) || 100
  borderForm.value.name = c.name || ''
  borderForm.value.colorId = c.id || ''
  borderForm.value.color = c.color || '#000000'
  borderForm.value.gradient = c.gradient || ''
  borderForm.value.price = typeof c.price === 'number' ? c.price : 0
  editingBorderId.value = c.id
}

async function deleteBorderColor(c) {
  if (!c || !c.id) return
  if (!confirm(`Supprimer la couleur "${c.name}" ?`)) return
  const res = await secureApiCall(`/border-colors?id=${encodeURIComponent(c.id)}`, { method: 'DELETE' })
  if (res && res.success) {
    borderColorsList.value = borderColorsList.value.filter(x => x.id !== c.id)
  } else {
    alert('Suppression échouée')
  }
}

onMounted(async () => { await loadExisting(); await loadBorderColors(); })

async function loadExisting() {
  try {
    const res = await secureApiCall('/items')
    const items = (res && res.success && Array.isArray(res.items)) ? res.items : []
    // Utiliser les items tels que renvoyés par l'API pour ne pas perdre les variantes
    existingItems.value = items
  } catch { existingItems.value = [] }
}

async function removeItem(it) {
  if (!it || !it._id) return
  if (!confirm(`Supprimer l'item "${it.name}" ?`)) return
  const res = await secureApiCall(`/items/${it._id}`, { method: 'DELETE' })
  if (res && res.success) {
    existingItems.value = existingItems.value.filter(x => x._id !== it._id)
    alert('Item supprimé')
  } else {
    alert('Suppression échouée')
  }
}

function editItem(it) {
  if (!it) return
  isEditing.value = true
  editingId.value = it._id
  selectedIndex.value = null
  // Charger la version fraîche du serveur pour garantir la présence des variantes
  secureApiCall(`/items/${it._id}`)
    .then((res) => {
      const src = (res && res.success && res.item) ? res.item : it
      form.value = sanitizeItem(src)
      editingVariantIndex.value = -1
      // Auto-sélection du premier asset si présent
      try { if (Array.isArray(form.value.assets) && form.value.assets.length > 0) selectedIndex.value = 0 } catch {}
    })
    .catch(() => {
      // Fallback en cas d'erreur réseau
      form.value = sanitizeItem(it)
      editingVariantIndex.value = -1
      try { if (Array.isArray(form.value.assets) && form.value.assets.length > 0) selectedIndex.value = 0 } catch {}
    })
}

async function updateItem() {
  if (!isEditing.value || !editingId.value) return
  // Synchroniser les modifications avec les assets de la variante avant la sauvegarde
  syncVariantAssets()
  const payload = sanitizeItem(form.value)
  const res = await secureApiCall(`/items/${editingId.value}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  })
  if (res && res.success) {
    alert('Item mis à jour !')
    // Remplacer l'item dans la liste locale par celui renvoyé par l'API
    try {
      if (res.item && res.item._id) {
        const idx = existingItems.value.findIndex(x => x._id === res.item._id)
        if (idx >= 0) existingItems.value.splice(idx, 1, res.item)
      }
    } catch {}
    // Ne pas recharger le formulaire pour conserver les modifications locales
    try { window.dispatchEvent(new CustomEvent('items-changed')) } catch {}
  } else {
    const msg = (res && res.message) ? res.message : 'Erreur mise à jour'
    alert(msg)
  }
}

// Bouton de test: ajoute cet item dans la boutique hebdo pour aujourd'hui
async function testAddToWeekly() {
  try {
    const payload = JSON.parse(JSON.stringify(form.value))
    // assurer un legacyId présent
    if (typeof payload.legacyId !== 'number' || Number.isNaN(payload.legacyId)) {
      alert('Veuillez définir un ID (legacy) pour l\'item avant le test.')
      return
    }
    const res = await secureApiCall(`/coins/weekly-items/test-add`, {
      method: 'POST',
      body: JSON.stringify({ legacyId: payload.legacyId })
    })
    if (res && res.success) {
      alert('Ajouté pour test. Ouvre la Boutique > Boutique quotidienne pour vérifier.')
      try { window.dispatchEvent(new CustomEvent('items-changed')) } catch {}
    } else {
      alert('Impossible d\'ajouter en test dans la boutique hebdo.')
    }
  } catch (e) {
    alert('Erreur ajout hebdo: ' + (e && e.message ? e.message : e))
  }
}

// Bouton pour retirer un item de la boutique hebdomadaire
async function removeFromWeekly() {
  try {
    const payload = JSON.parse(JSON.stringify(form.value))
    // assurer un legacyId présent
    if (typeof payload.legacyId !== 'number' || Number.isNaN(payload.legacyId)) {
      alert('Veuillez définir un ID (legacy) pour l\'item avant de le retirer.')
      return
    }
    
    if (!confirm(`Retirer l'item "${payload.name}" (ID: ${payload.legacyId}) de la boutique hebdomadaire ?`)) {
      return
    }
    
    const res = await secureApiCall(`/coins/weekly-items/test-remove`, {
      method: 'POST',
      body: JSON.stringify({ legacyId: payload.legacyId })
    })
    if (res && res.success) {
      alert('Item retiré de la boutique hebdomadaire.')
      try { window.dispatchEvent(new CustomEvent('items-changed')) } catch {}
    } else {
      alert('Impossible de retirer l\'item de la boutique hebdo.')
    }
  } catch (e) {
    alert('Erreur retrait hebdo: ' + (e && e.message ? e.message : e))
  }
}

function clearForm() {
  isEditing.value = false
  editingId.value = null
  selectedIndex.value = null
      form.value = { legacyId: null, name: '', price: 0, type: 'generic', infoOnly: false, infoDescription: '', availableInDailyShop: false, assets: [], backgrounds: { collection: null, leaderboard: null, avatar: null, navbar: null, 'popup-style': null }, variants: [] }
}
</script>

<style scoped>
.admin-item-editor { color: #000; padding: 16px; }
.editor-form { display: grid; grid-template-columns: repeat(2, minmax(240px, 360px)); gap: 12px; align-items: end; background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px; }
.editor-form label { display: flex; flex-direction: column; gap: 6px; font-size: 13px; }
.editor-form input, .editor-form select, .editor-form textarea { background: #fff; color: #111; border: 1px solid #d1d5db; border-radius: 8px; padding: 8px 10px; outline: none; transition: border-color .15s ease; }
.editor-form input:focus, .editor-form select:focus, .editor-form textarea:focus { border-color: #3b82f6; }
.upload { display: flex; gap: 8px; align-items: center; }
.canvas-section { margin-top: 16px; }
.canvas-tabs { display: flex; gap: 8px; margin-bottom: 8px; }
.canvas-tabs button { padding: 6px 10px; border-radius: 8px; border: 1px solid #d1d5db; background: #f9fafb; color: #000; transition: all .15s ease; }
.canvas-tabs button.active { border-color: #3b82f6; background: #eff6ff; }
.device-tabs { display: flex; gap: 8px; margin-bottom: 8px; }
.device-tabs button { padding: 4px 10px; border-radius: 8px; border: 1px solid #d1d5db; background: #f9fafb; color: #000; }
.device-tabs button.active { border-color: #3b82f6; background: #eff6ff; }
.canvas { position: relative; background: #fff; border: 1px dashed #e5e7eb; border-radius: 12px; }
.draggable { user-select: none; }
.draggable.selected { outline: 1px dashed #06c; }
.tools { display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap; }
.btn { border: 1px solid #d1d5db; border-radius: 8px; background: #f9fafb; color: #111; padding: 6px 10px; cursor: pointer; transition: all .15s ease; }
.btn:hover { background: #f3f4f6; }
.btn.primary { background: #10b981; color: #fff; border-color: #10b981; }
.btn.primary:hover { background: #0ea371; }
.btn.secondary { background: #111827; color: #fff; border-color: #111827; }
.btn.secondary:hover { background: #0b1220; }
.btn.outline { background: transparent; border-color: #3b82f6; color: #3b82f6; }
.btn.outline:hover { background: #eff6ff; }
.btn.ghost { background: transparent; }
.btn.tiny { padding: 4px 8px; font-size: 12px; }
.btn.danger { border-color: #ef4444; color: #ef4444; background: transparent; }
.btn.danger:hover { background: #fee2e2; }
.existing { display: flex; flex-direction: column; margin-top: 16px; background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 10px; }
.existing ul { list-style: none; padding: 0; margin: 0; display: grid; gap: 6px; }
.existing li { display: flex; gap: 20px; align-items: center; padding: 6px 8px; border: 1px solid #f3f4f6; border-radius: 8px; background: #fafafa; }
.variants-panel { margin-top: 12px; border: 1px solid #e5e7eb; border-radius: 10px; padding: 10px; background: #fff; }
.variants-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.variants-actions { display: flex; gap: 8px; }
.variants-list { display: grid; gap: 8px; }
.variant-row { display: flex; gap: 8px; align-items: center; border: 1px dashed #e5e7eb; padding: 8px; border-radius: 8px; }
.variant-name { flex: 1; background: #fff; color: #111; border: 1px solid #d1d5db; border-radius: 8px; padding: 6px 8px; }
.variant-buttons { display: flex; gap: 6px; }
.variants-empty { color: #6b7280; font-size: 12px; margin-top: 4px; }
.variants-hint { color: #374151; font-size: 12px; margin-top: 10px; }
.variant-options { margin-top: 12px; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px; background: #f9fafb; }
.variant-options h5 { margin: 0 0 8px 0; font-size: 14px; color: #374151; }
.variant-option { margin-bottom: 8px; }
.variant-option label { display: flex; align-items: center; gap: 8px; font-size: 13px; }
.variant-option input[type="text"] { flex: 1; background: #fff; color: #111; border: 1px solid #d1d5db; border-radius: 6px; padding: 6px 8px; }
.inspector { margin-top: 12px; border: 1px solid #e5e7eb; border-radius: 10px; padding: 10px; background: #fff; color: #000; }
.inspector .grid { display: grid; grid-template-columns: repeat(3, minmax(120px, 1fr)); gap: 8px; }
.inspector label { display: flex; flex-direction: column; gap: 4px; font-size: 12px; }
.inspector input, .inspector select { background: #fff; color: #000; border: 1px solid #d1d5db; border-radius: 8px; padding: 6px 8px; }
.inspector .row { display: flex; gap: 6px; margin-top: 8px; }
.nudge-row { justify-content: flex-start; }
.layer-controls { display:flex; gap:8px; align-items:center; margin-top:8px; flex-wrap: wrap; }
/* Ligne du picker de background */
.bg-picker-row { display: flex; gap: 16px; align-items: center; margin-top: 8px; flex-wrap: wrap; }
/* cercle + bordure verte en mode collection */
.canvas.round { border-radius: 50%; border: 3px solid #3ddc84; }
</style>


