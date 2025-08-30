<template>
  <div class="fortune-wheel-wrapper">
    <canvas
      ref="canvas"
      :width="size"
      :height="size"
      class="fortune-canvas"
      :style="{ transform: `translate(${wheelTranslateX}px, ${wheelTranslateY}px)` }"
    ></canvas>
    <button class="spin-btn" :class="{ 'disabled': spinning || disabled }" :disabled="spinning || disabled" @click="requestSpin">TOURNER LA ROUE</button>
  </div>
  
</template>

<script setup>
import { ref, watch, onMounted, nextTick } from 'vue'
import galaxieImgSrc from '@/assets/img/Galaxie.png'
import lancerSound from '@/assets/son/lancerlaroue.mp3'
import perduSound from '@/assets/son/perdu.mp3'
import gagnerSound from '@/assets/son/gagner.mp3'

const props = defineProps({
  segments: {
    type: Array,
    required: true,
    // [{ label: '10 coins', color: '#FFD700' }, ...]
  },
  size: {
    type: Number,
    default: 340
  },
  // Décalage visuel de la roue (position)
  wheelTranslateX: { type: Number, default: 0 },
  wheelTranslateY: { type: Number, default: 0 },
  // Icône Galaxie dans la part
  galaxyIconSrc: { type: String, default: galaxieImgSrc },
  galaxyIconScale: { type: Number, default: 0.22 }, // proportion du diamètre (encore réduit)
  galaxyIconOffsetX: { type: Number, default: 0 }, // en px relatifs au canvas
  galaxyIconOffsetY: { type: Number, default: 0 },
  isWeekend: {
    type: Boolean,
    default: false
  },
  forcedResultIndex: {
    type: Number,
    default: null
  },
  disabled: {
    type: Boolean,
    default: false
  }
})
const emit = defineEmits(['result', 'spin-request'])
function playSound(src) {
  try { const a = new Audio(src); a.volume = 0.7; a.play().catch(() => {}) } catch {}
}

const canvas = ref(null)
const spinning = ref(false)
let angle = 0
let resultIndex = null
let cobeFontLoaded = false

// Cache image Galaxie
let galaxyImg = null
let galaxyLoaded = false

// Animation avancée
let animationStart = null
let animationDuration = 4200 // ms (4.2s)
let startAngle = 0
let finalAngle = 0
let totalTurns = 7 // nombre de tours complets

// Animations weekend supprimées

function loadCobeFont() {
  if (cobeFontLoaded) return Promise.resolve()
  const font = new FontFace('CobeHeavy', 'url(/fonts/Cobe-Heavy.ttf)')
  return font.load().then(loadedFont => {
    document.fonts.add(loadedFont)
    cobeFontLoaded = true
  })
}

function drawWheel() {
  if (!canvas.value) {
    // Réduire les logs pour éviter le spam
    return
  }
  
  // Vérification de sécurité pour les segments
  if (!props.segments || !Array.isArray(props.segments) || props.segments.length === 0) {
    console.error('❌ Segments invalides dans drawWheel:', props.segments)
    return
  }
  
  const ctx = canvas.value.getContext('2d')
  const { size } = props
  ctx.clearRect(0, 0, size, size)
  const cx = size / 2
  const cy = size / 2
  const radius = size / 2 - 10
  const n = props.segments.length
  const arc = (2 * Math.PI) / n

  // Dégradé radial pour la roue
  const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, radius)
  grad.addColorStop(0, '#fff')
  grad.addColorStop(1, '#e0e0e0')
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, 2 * Math.PI)
  ctx.closePath()
  ctx.fillStyle = grad
  ctx.shadowColor = '#aaa'
  ctx.shadowBlur = 16
  ctx.fill()
  ctx.restore()

  // Segments
  for (let i = 0; i < n; i++) {
    const start = angle + i * arc
    const end = start + arc
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    // Légère superposition pour éviter tout interstice au centre
    const eps = 0.002
    ctx.arc(cx, cy, radius, start - eps, end + eps)
    ctx.closePath()
    // Couleur/gradient de la part
    let fillStyle = props.segments[i].color
    const stops = props.segments[i].gradientStops
    if (Array.isArray(stops) && stops.length > 0) {
      const lg = ctx.createLinearGradient(cx - radius, cy, cx + radius, cy)
      const last = stops.length - 1
      stops.forEach((c, idx) => {
        const pos = last > 0 ? idx / last : 0
        try { lg.addColorStop(pos, c) } catch {}
      })
      fillStyle = lg
    } else if (props.segments[i].type === 'galaxy') {
      // Fallback si pas de gradientStops fournis: utilise le gradient Galaxie du store
      const lg = ctx.createLinearGradient(cx - radius, cy, cx + radius, cy)
      lg.addColorStop(0, '#0d0b2d')
      lg.addColorStop(0.5, '#3f0b6d')
      lg.addColorStop(1, '#0b4a6d')
      fillStyle = lg
    }
    ctx.fillStyle = fillStyle
    ctx.globalAlpha = 1
    ctx.fill()
    ctx.restore()
    // Texte
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(start + arc / 2)
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    ctx.font = 'bold 22px "CobeHeavy", Arial, sans-serif'
    ctx.lineWidth = 6
    ctx.strokeStyle = '#fff'
    ctx.shadowColor = '#0008'
    ctx.shadowBlur = 6
    const label = getDisplayLabel(props.segments[i].label)
    ctx.strokeText(label, radius - 18, 0)
    ctx.lineWidth = 1
    ctx.shadowBlur = 0
    ctx.fillStyle = '#222'
    ctx.fillText(label, radius - 18, 0)
    ctx.restore()

    // Icône Galaxie dans la part correspondante
    if (props.segments[i].type === 'galaxy' || /galaxie/i.test(props.segments[i].label)) {
      if (!galaxyImg) {
        galaxyImg = new Image()
        galaxyImg.src = props.galaxyIconSrc || galaxieImgSrc
        galaxyImg.onload = () => { galaxyLoaded = true; drawWheel() }
        galaxyImg.onerror = () => { galaxyLoaded = false }
      }
      if (galaxyLoaded && galaxyImg) {
        ctx.save()
        ctx.translate(cx, cy)
        // Rotation au centre de la tranche, comme le texte
        const rMid = radius * 0.62
        const midAngle = start + arc / 2
        ctx.rotate(midAngle)
        const iconSize = Math.max(30, props.size * props.galaxyIconScale)
        const px = rMid + (props.galaxyIconOffsetX || 0)
        const py = (props.galaxyIconOffsetY || 0)
        ctx.drawImage(galaxyImg, px - iconSize / 2, py - iconSize / 2, iconSize, iconSize)
        ctx.restore()
      }
    }

    // Animations des parts supprimées (aucun effet weekend)
  }
  // Flèche
  ctx.save()
  ctx.translate(cx, cy)
  ctx.beginPath()
  ctx.moveTo(0, -radius + 8)
  ctx.lineTo(-22, -radius - 28)
  ctx.lineTo(22, -radius - 28)
  ctx.closePath()
  ctx.fillStyle = '#ff3c00'
  ctx.shadowColor = '#0007'
  ctx.shadowBlur = 8
  ctx.fill()
  ctx.restore()

  // Animations weekend supprimées
}

// Transformer le label à l'affichage si weekend (x2) pour les cases coins
function getDisplayLabel(raw) {
  // On n'altère plus le label ici. Les valeurs x2 sont déjà fournies côté parent.
  return raw
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3)
}

function requestSpin() {
  if (spinning.value || props.disabled) return
  
  console.log('🎰 Bouton spin cliqué')
  playSound(lancerSound)
  
  // Émettre l'événement pour que le parent gère le backend
  // L'animation sera lancée automatiquement quand forcedResultIndex sera défini
  emit('spin-request')
}

function spin(forcedIndex = null) {
  if (spinning.value) return
  if (!canvas.value) {
    console.log('❌ Canvas non disponible pour le spin')
    return
  }
  
  // Vérification de sécurité pour les segments
  if (!props.segments || !Array.isArray(props.segments) || props.segments.length === 0) {
    console.error('❌ Segments invalides dans spin:', props.segments)
    spinning.value = false
    return
  }
  
  spinning.value = true
  // Choisir un segment imposé ou au hasard
  const hasForced = (typeof forcedIndex === 'number' && forcedIndex >= 0 && forcedIndex < props.segments.length)
  if (hasForced) {
    resultIndex = forcedIndex
  } else {
    resultIndex = Math.floor(Math.random() * props.segments.length)
  }
  const n = props.segments.length
  const arc = (2 * Math.PI) / n
  // Offset aléatoire à l'intérieur du segment (éviter de franchir visuellement le segment voisin)
  const margin = hasForced ? arc * 0.06 : arc * 0.15
  const range = arc - 2 * margin
  const randomOffset = (Math.random() * range) - (range / 2)
  // Angle cible: partir du CENTRE du segment puis appliquer l'offset sécurisé
  const stopAngle = (3 * Math.PI / 2) - ((resultIndex + 0.5) * arc) + randomOffset
  // Angle de départ
  startAngle = angle % (2 * Math.PI)
  // Angle final = angle de départ + nombre de tours + angle cible
  finalAngle = startAngle + totalTurns * 2 * Math.PI + ((stopAngle - startAngle + 2 * Math.PI) % (2 * Math.PI))
  animationStart = null
  requestAnimationFrame(animateSpin)
}

function animateSpin(ts) {
  if (!spinning.value) return
  if (!animationStart) animationStart = ts
  const elapsed = ts - animationStart
  const t = Math.min(elapsed / animationDuration, 1)
  // Ease out cubic pour ralentir à la fin
  angle = startAngle + (finalAngle - startAngle) * easeOutCubic(t)
  drawWheel()
  if (t < 1) {
    requestAnimationFrame(animateSpin)
  } else {
    angle = finalAngle
    drawWheel()
    spinning.value = false
    // Déterminer le segment sous la flèche en se basant sur l'angle final
    const normalized = (angle % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI)
    const n = props.segments.length
    const arc = (2 * Math.PI) / n
    const pos = ((3 * Math.PI / 2 - normalized + 2 * Math.PI) % (2 * Math.PI))
    // Assigner le secteur par appartenance à l'intervalle [i*arc, (i+1)*arc)
    const index = Math.floor(pos / arc) % n

    if (index >= 0 && index < props.segments.length) {
      const seg = props.segments[index]
      if (/perdu/i.test(seg.label)) playSound(perduSound)
      else playSound(gagnerSound)
      emit('result', seg)
    } else {
      console.error('❌ Index invalide calculé:', index, 'pour segments:', props.segments)
      emit('result', props.segments[0] || { label: 'Erreur', color: '#ccc' })
    }
  }
}

onMounted(async () => {
  await loadCobeFont()
  nextTick(() => {
    if (canvas.value) {
      drawWheel()
    } else {
      // Réduire les logs pour éviter le spam
      setTimeout(() => {
        if (canvas.value) {
          drawWheel()
        }
      }, 100)
    }
  })
  // Désactivation de la boucle d'animation idle
})
watch(() => props.segments, (newSegments) => {
  if (canvas.value && !spinning.value && newSegments && Array.isArray(newSegments) && newSegments.length > 0) {
    drawWheel()
  }
}, { deep: true })
// Désactivation de l'animation idle weekend
// Réinitialiser la roue quand le composant est remonté (key change)
watch(() => props.key, () => {
  console.log('🔄 Réinitialisation de la roue (key change)')
  spinning.value = false
  angle = 0
  // Attendre que le canvas soit disponible
  nextTick(() => {
    if (canvas.value) {
      drawWheel()
    } else {
      // Réduire les logs pour éviter le spam
      setTimeout(() => {
        if (canvas.value) {
          drawWheel()
        }
      }, 100)
    }
  })
}, { immediate: true })
// Ajout : quand forcedResultIndex change, lancer le spin sur ce segment
watch(() => props.forcedResultIndex, (val) => {
  if (val !== null && typeof val === 'number') {
    console.log('🎯 Lancement du spin forcé sur l\'index:', val)
    // Réinitialiser l'état avant de lancer le spin
    spinning.value = false
    
    // S'assurer que le canvas est prêt avant de lancer le spin
    if (canvas.value) {
      spin(val)
    } else {
      // Réduire les logs pour éviter le spam
      nextTick(() => {
        if (canvas.value) {
          spin(val)
        } else {
          setTimeout(() => {
            if (canvas.value) {
              spin(val)
            }
          }, 100)
        }
      })
    }
  }
})

// Synchroniser l'état interne avec la prop disabled
watch(() => props.disabled, (val) => {
  if (val && spinning.value) {
    // Si le bouton est désactivé et que l'animation est en cours, 
    // on arrête l'animation et on réinitialise l'état
    spinning.value = false
  }
})
</script>

<style scoped>
.fortune-wheel-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.fortune-canvas {
  border-radius: 50%;
  box-shadow: 0 4px 32px #0003, 0 1.5px 6px #0001;
  background: #fff;
  width: 80%;
  margin-bottom: 18px;
  border: 6px solid #fff;
}
.spin-btn {
  background: linear-gradient(90deg, #ff7e5f, #feb47b);
  color: #fff;
  border: none;
  border-radius: 16px;
  padding: 14px 38px;
  font-size: 1.2em;
  margin-top: 12px;
  cursor: pointer;
  font-family: 'Cobe Heavy', Inter, sans-serif;
  font-weight: bold;
  letter-spacing: 1px;
  box-shadow: 0 2px 12px #0002;
  transition: background 0.2s, transform 0.2s;
}
.spin-btn:active {
  transform: scale(0.97);
}
.spin-btn:disabled {
  background: #aaa;
  cursor: not-allowed;
  opacity: 0.6;
  transform: none;
}

.spin-btn.disabled {
  background: #aaa !important;
  cursor: not-allowed !important;
  opacity: 0.6 !important;
  transform: none !important;
  color: #666 !important;
}
</style> 