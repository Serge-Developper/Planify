// @ts-nocheck
const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const User = require('../models/User')
const { verifyToken, requireRole } = require('../middlewares/auth')

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
      case 'update-coins': {
        const coins = Number(data.coins)
        if (!Number.isFinite(coins)) return res.status(400).json({ success: false, error: 'Nombre de coins requis' })
        user.coins = Math.max(0, coins)
        await user.save()
        return res.json({ success: true, message: 'Coins mis à jour' })
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

    const { username, email, coins, role, password, newPassword, secretQuestions } = req.body || {}
    if (username !== undefined) target.username = username
    if (email !== undefined) target.email = email
    if (typeof coins === 'number') target.coins = Math.max(0, coins)
    const allowed = ['admin','prof','delegue','eleve','etudiant','user']
    if (role && allowed.includes(role)) target.role = role
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

module.exports = router

