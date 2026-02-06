// @ts-nocheck
const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const User = require('../models/User')
const { verifyToken, requireRole } = require('../middlewares/auth')
const BorderColor = require('../models/BorderColor')
const Faction = require('../models/Faction')
// const PDFDocument = require('pdfkit') // supprimé: on exporte en texte

// Vérifier admin (admin ou prof)
const requireAdminOrProf = [verifyToken, requireRole(['admin', 'prof'])]

// GET /api/users-admin?userId=... → liste des utilisateurs ou détail d'un utilisateur (sans mot de passe)
router.get('/', requireAdminOrProf, async (req, res) => {
  try {
    const userId = (req.query && req.query.userId) ? String(req.query.userId) : ''
    if (userId) {
      const user = await User.findById(userId, '-password')
      if (!user) return res.status(404).json({ success: false, error: 'Utilisateur non trouvé' })
      return res.json({ success: true, user })
    }
    const users = await User.find({}, '-password').sort({ createdAt: -1 })
    return res.json({ success: true, users })
  } catch (e) {
    return res.status(500).json({ success: false, error: 'Erreur serveur' })
  }
})

// POST /api/users-admin → actions admin sur un utilisateur
// body: { action, userId, ... }
router.post('/', requireAdminOrProf, async (req, res) => {
  try {
    const { action, userId, ...data } = req.body || {}
    if (!action || !userId) return res.status(400).json({ success: false, error: 'Action et userId requis' })

    const user = await User.findById(userId)
    if (!user) return res.status(404).json({ success: false, error: 'Utilisateur non trouvé' })

    switch (action) {
      case 'give-item': {
        const itemId = Number(data.itemId)
        const itemName = data.itemName || String(itemId)
        const adminMessage = (data.adminMessage && String(data.adminMessage)) || null
        if (Number.isNaN(itemId)) return res.status(400).json({ success: false, error: 'itemId invalide' })

        const list = Array.isArray(user.purchasedItems) ? user.purchasedItems : []
        const already = list.some((it) => {
          if (typeof it === 'number') return it === itemId
          if (typeof it === 'string') return Number(it) === itemId
          if (it && typeof it === 'object') return Number(it.itemId ?? it.id) === itemId
          return false
        })
        if (!already) {
          list.push({ itemId, itemName, purchaseDate: new Date(), equipped: false, adminMessage })
          user.purchasedItems = list
        }
        await user.save()
        return res.json({ success: true, message: 'Item donné avec succès' })
      }
      case 'remove-item': {
        const removeItemId = Number(data.itemId)
        if (Number.isNaN(removeItemId)) return res.status(400).json({ success: false, error: 'itemId requis' })
        const prev = Array.isArray(user.purchasedItems) ? user.purchasedItems : []
        user.purchasedItems = prev.filter((entry) => {
          if (typeof entry === 'number') return entry !== removeItemId
          if (typeof entry === 'string') return Number(entry) !== removeItemId
          if (entry && typeof entry === 'object') {
            if (typeof entry.itemId !== 'undefined') return Number(entry.itemId) !== removeItemId
            if (typeof entry.id !== 'undefined') return Number(entry.id) !== removeItemId
          }
          return true
        })
        if (Number(user.equippedItemId) === removeItemId) user.equippedItemId = null
        await user.save()
        return res.json({ success: true, message: 'Item retiré avec succès' })
      }
      case 'set-border-color': {
        const colorId = (data && typeof data.colorId === 'string') ? data.colorId.trim() : ''
        const adminMessage = (data && typeof data.adminMessage === 'string' && data.adminMessage.trim()) ? String(data.adminMessage).trim() : null
        if (!colorId) return res.status(400).json({ success: false, error: 'colorId requis' })

        // Définir la couleur sélectionnée immédiate
        user.selectedBorderColor = colorId

        // Chercher la couleur pour le nom/legacyId
        let colorDoc = null
        try { colorDoc = await BorderColor.findOne({ id: colorId }).lean() } catch {}

        const itemName = (colorDoc && colorDoc.name) ? colorDoc.name : `Couleur ${colorId}`
        // ID numérique pour le suivi dans purchasedItems
        let numericId = (colorDoc && typeof colorDoc.legacyId === 'number') ? Number(colorDoc.legacyId) : null
        if (!Number.isFinite(numericId)) {
          // Générer un id négatif déterministe basé sur colorId
          let h = 0
          for (let i = 0; i < colorId.length; i++) { h = (h * 31 + colorId.charCodeAt(i)) >>> 0 }
          numericId = - (100000 + (h % 100000))
        }

        // Éviter les doublons si déjà offert
        const hasAlready = (Array.isArray(user.purchasedItems) ? user.purchasedItems : []).some(pi => String(pi.colorId || '') === colorId)
        if (!hasAlready) {
          const list = Array.isArray(user.purchasedItems) ? user.purchasedItems : []
          list.push({
            itemId: Number(numericId),
            itemName,
            purchaseDate: new Date(),
            equipped: false,
            adminMessage,
            adminGiftRead: false,
            colorId
          })
          user.purchasedItems = list
        }

        await user.save()
        return res.json({ success: true, selectedBorderColor: user.selectedBorderColor })
      }
      case 'clear-border-color': {
        user.selectedBorderColor = 'default'
        await user.save()
        return res.json({ success: true, selectedBorderColor: user.selectedBorderColor })
      }
      case 'update-coins': {
        const coins = Number(data.coins)
        if (!Number.isFinite(coins)) return res.status(400).json({ success: false, error: 'Nombre de coins requis' })
        user.coins = Math.max(0, coins)
        await user.save()
        return res.json({ success: true, message: 'Coins mis à jour', coins: user.coins })
      }
      // AJOUT: ne touche que le wallet, sans modifier le leaderboard
      case 'update-wallet-coins-only': {
        const coins = Number(data.coins)
        if (!Number.isFinite(coins)) return res.status(400).json({ success: false, error: 'Nombre de coins requis' })
        user.coins = Math.max(0, coins)
        await user.save()
        return res.json({ success: true, message: 'Wallet mis à jour', coins: user.coins })
      }
      case 'update-leaderboard-coins': {
        const lb = Number(data.leaderboardCoins)
        if (!Number.isFinite(lb)) return res.status(400).json({ success: false, error: 'Nombre de leaderboard coins requis' })
        user.leaderboardCoins = Math.max(0, lb)
        await user.save()
        return res.json({ success: true, message: 'Leaderboard coins mis à jour', leaderboardCoins: user.leaderboardCoins })
      }
      case 'update-faction-coins': {
        const fc = Number(data.factionCoins)
        if (!Number.isFinite(fc)) return res.status(400).json({ success: false, error: 'Nombre de faction coins requis' })
        const newVal = Math.max(0, fc)
        const prevVal = Number(user.factionCoins || 0)
        const delta = newVal - prevVal
        const factionName = user.faction || null
        user.factionCoins = newVal
        await user.save()
        if (factionName && Number.isFinite(delta) && delta !== 0) {
          await Faction.updateOne({ name: factionName }, { $inc: { totalCoins: delta } }, { upsert: true })
        }
        return res.json({ success: true, message: 'Faction coins mis à jour', factionCoins: user.factionCoins })
      }
      case 'set-avatar-url': {
        const avatarUrl = (data && typeof data.avatar === 'string') ? data.avatar.trim() : ''
        if (!avatarUrl) return res.status(400).json({ success: false, error: 'avatar requis' })
        user.avatar = avatarUrl
        await user.save()
        return res.json({ success: true, avatar: user.avatar })
      }
      case 'update-role': {
        const role = String(data.role || '')
        const allowed = ['admin', 'prof', 'delegue', 'eleve', 'etudiant', 'user']
        if (!allowed.includes(role)) return res.status(400).json({ success: false, error: 'Rôle invalide' })
        user.role = role
        await user.save()
        return res.json({ success: true, message: 'Rôle mis à jour' })
      }
      case 'reset-password': {
        const pwd = data.newPassword
        if (pwd === undefined || pwd === null) return res.status(400).json({ success: false, error: 'Nouveau mot de passe requis' })
        const hashed = await bcrypt.hash(String(pwd), 10)
        user.password = hashed
        await user.save()
        return res.json({ success: true, message: 'Mot de passe réinitialisé' })
      }
      case 'clear-all-items': {
        user.purchasedItems = []
        user.equippedItemId = null
        if (typeof user.selectedBorderColor !== 'undefined') user.selectedBorderColor = 'default'
        await user.save()
        return res.json({ success: true, message: 'Inventaire vidé et bordure réinitialisée' })
      }
      case 'award-achievement': {
        const achievementId = String(data.achievementId || data.id || '').trim()
        if (!achievementId) return res.status(400).json({ success: false, error: 'achievementId requis' })
        user.achievementsCompleted = Array.isArray(user.achievementsCompleted) ? user.achievementsCompleted : []
        if (!user.achievementsCompleted.includes(achievementId)) user.achievementsCompleted.push(achievementId)
        await user.save()
        return res.json({ success: true, message: 'Succès attribué', achievementsCompleted: user.achievementsCompleted })
      }
      default:
        return res.status(400).json({ success: false, error: 'Action non supportée' })
    }
  } catch (e) {
    return res.status(500).json({ success: false, error: 'Erreur serveur' })
  }
})

// PUT /api/users-admin?userId=... → mise à jour champs autorisés
router.put('/', requireAdminOrProf, async (req, res) => {
  try {
    const userId = String((req.query && req.query.userId) || (req.body && req.body.userId) || '')
    if (!userId) return res.status(400).json({ success: false, error: 'UserId requis' })
    const target = await User.findById(userId)
    if (!target) return res.status(404).json({ success: false, error: 'Utilisateur non trouvé' })

    const { username, email, coins, role, password, newPassword, secretQuestions, specialite } = req.body || {}
    if (username !== undefined) target.username = username
    if (email !== undefined) target.email = email
    if (typeof coins === 'number') {
      target.coins = Math.max(0, coins)
      // IMPORTANT: ne pas toucher au leaderboard ici
    }
    const allowed = ['admin','prof','delegue','eleve','etudiant','user']
    if (role && allowed.includes(role)) target.role = role
    if (specialite !== undefined) target.specialite = String(specialite || '')
    if (Array.isArray(secretQuestions)) {
      const safe = secretQuestions
        .filter(q => q && typeof q.question === 'string' && typeof q.answer === 'string' && q.question.trim() && q.answer.trim())
        .slice(0, 3)
        .map(q => ({ question: String(q.question).trim(), answer: String(q.answer).trim() }))
      if (safe.length > 0) target.secretQuestions = safe
      else if (secretQuestions.length === 0) target.secretQuestions = []
    }
    const pwd = (newPassword !== undefined && newPassword !== null) ? newPassword : password
    if (pwd !== undefined && pwd !== null) {
      const hashed = await bcrypt.hash(String(pwd), 10)
      target.password = hashed
    }
    await target.save()
    return res.json({ success: true, message: 'Utilisateur mis à jour' })
  } catch (e) {
    return res.status(500).json({ success: false, error: 'Erreur serveur' })
  }
})

// DELETE /api/users-admin?userId=...
router.delete('/', requireAdminOrProf, async (req, res) => {
  try {
    const userId = String((req.query && req.query.userId) || (req.body && req.body.userId) || '')
    if (!userId) return res.status(400).json({ success: false, error: 'UserId requis' })
    const deleted = await User.findByIdAndDelete(userId)
    if (!deleted) return res.status(404).json({ success: false, error: 'Utilisateur non trouvé' })
    return res.json({ success: true, message: 'Utilisateur supprimé' })
  } catch (e) {
    return res.status(500).json({ success: false, error: 'Erreur serveur' })
  }
})

// Handler OPTIONS local au router (préflights)
router.options('*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*')
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Requested-With')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.status(204).end()
})

// GET /api/users-admin/export → export TEXTE de tous les utilisateurs
router.get('/export', requireAdminOrProf, async (req, res) => {
  try {
    const users = await User.find({}, '-password').sort({ createdAt: -1 }).lean()

    // Précharger les couleurs pour résolution des noms
    let colorDocs = []
    try { colorDocs = await BorderColor.find({}).lean() } catch {}
    const colorMap = new Map(colorDocs.map(c => [String(c.id), c]))

    // CORS + exposition des en-têtes nécessaires côté client
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*')
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition, Content-Type')

    // En-têtes TXT
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="planify_users_export.txt"')

    // Normalisation d'une entrée d'inventaire
    const normalizeEntry = (entry) => {
      if (entry == null) return null
      if (typeof entry === 'number') return { itemId: Number(entry), name: null, colorId: null }
      if (typeof entry === 'string') {
        const num = Number(entry)
        if (Number.isFinite(num)) return { itemId: num, name: null, colorId: null }
        return { itemId: null, name: entry, colorId: null }
      }
      if (typeof entry === 'object') {
        const itemId = (entry.itemId != null) ? Number(entry.itemId) : ((entry.id != null) ? Number(entry.id) : null)
        const name = entry.itemName || entry.name || null
        const colorId = entry.colorId || null
        return { itemId, name, colorId }
      }
      return null
    }

    // Détection d'une entrée « couleur de bordure »
    const isColorLike = (e) => {
      if (!e) return false
      if (e.colorId) return true
      if (typeof e.itemId === 'number' && (e.itemId === 0 || e.itemId >= 100)) return true
      if (e.name && /bordure/i.test(String(e.name))) return true
      return false
    }

    // Résoudre nom de couleur
    const resolveColorName = (e) => {
      if (!e) return null
      if (e.colorId) {
        const doc = colorMap.get(String(e.colorId))
        if (doc && doc.name) return doc.name
        return `Couleur ${e.colorId}`
      }
      if (e.itemId === 0) return 'Bordure Classique'
      if (e.name && /bordure/i.test(String(e.name))) return e.name
      if (typeof e.itemId === 'number') return `Couleur ${e.itemId}`
      return e.name || 'Couleur inconnue'
    }

    const header = 'PlanifyMMI - Export utilisateurs\n'
    const gen = new Date().toLocaleString('fr-FR')

    const lines = users.map((u, idx) => {
      const nom = String(u.username || '').replace(/\r?\n/g, ' ').trim()
      const role = String(u.role || '').replace(/\r?\n/g, ' ').trim()
      const promo = String(u.groupe || '').replace(/\r?\n/g, ' ').trim()
      const annee = String(u.year || '').replace(/\r?\n/g, ' ').trim()
      const specialite = String(u.specialite || '').replace(/\r?\n/g, ' ').trim()
      const coins = Number(u.coins) || 0
      const leaderboard = Number(u.leaderboardCoins) || 0
      const avatar = String(u.avatar || '').trim()

      const purchased = Array.isArray(u.purchasedItems) ? u.purchasedItems.map(normalizeEntry).filter(Boolean) : []
      const colorEntries = purchased.filter(isColorLike)
      const itemEntries = purchased.filter(e => !isColorLike(e))

      const itemNames = itemEntries.map(e => e.name ? String(e.name) : (Number.isFinite(e.itemId) ? `Item ${e.itemId}` : 'Item'))
      const colorNames = colorEntries.map(resolveColorName)

      const selectedColorId = String(u.selectedBorderColor || 'default')
      const selectedColorName = colorMap.get(selectedColorId)?.name || selectedColorId

      const sqCount = Array.isArray(u.secretQuestions) ? u.secretQuestions.length : 0
      const publicNote = String(u.publicNote || '').replace(/\r?\n/g, ' ').trim()

      return [
        `Utilisateur #${idx + 1}: ${nom}`,
        `Rôle: ${role}`,
        `Groupe: ${promo}`,
        `Année: ${annee}`,
        `Spécialité: ${specialite}`,
        `Coins (wallet): ${coins}`,
        `Coins (leaderboard): ${leaderboard}`,
        `Avatar: ${avatar}`,
        `Couleur de bordure sélectionnée: ${selectedColorName}`,
        `Items: ${itemNames.length}`,
        `Couleurs de bordure: ${colorNames.length}`,
        `Liste des items: ${itemNames.length ? itemNames.join(', ') : '-'}`,
        `Liste des couleurs: ${colorNames.length ? colorNames.join(', ') : '-'}`,
        `Note publique: ${publicNote}`,
        `Questions secrètes: ${sqCount}`,
        ''
      ].join('\n')
    }).join('\n')

    const content = `${header}Généré le: ${gen}\n\n${lines}\n`
    return res.status(200).send(content)
  } catch (e) {
    console.error('Erreur export TXT:', e)
    // S’assurer que les erreurs renvoient aussi les en-têtes CORS
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*')
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition, Content-Type')
    return res.status(500).json({ success: false, error: 'Erreur serveur lors de la génération du TXT' })
  }
})
module.exports = router

