// @ts-nocheck
const express = require('express')
const router = express.Router()
const { verifyToken, requireRole } = require('../middlewares/auth')
const BorderColor = require('../models/BorderColor')
const User = require('../models/User')

let webpush
try { webpush = require('web-push') } catch {}
const VAPID_PUBLIC_KEY = process.env.PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY || ''
const VAPID_PRIVATE_KEY = process.env.PRIVATE_KEY || process.env.VAPID_PRIVATE_KEY || ''
try { if (webpush && VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) { webpush.setVapidDetails('mailto:admin@planifymmi.fr', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY) } } catch {}

async function sendNewBorderColorPush(color) {
  try {
    if (!webpush || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return 0
    if (!color) return 0
    const users = await User.find({
      'pushPreferences.enabled': true,
      'pushPreferences.borderColor': true,
      pushSubscriptions: { $elemMatch: { endpoint: { $exists: true, $ne: '' } } }
    }).select({ pushSubscriptions: 1 })
    if (!users || !users.length) return 0
    const title = '🎨 Nouvelle couleur'
    const body = 'Une nouvelle couleur est disponible.'
    const payload = JSON.stringify({
      title,
      body,
      icon: '/planifyFichier_134x.webp?v=2',
      badge: '/planifyFichier_134x.webp?v=2',
      data: { url: '/boutique' }
    })
    let sent = 0
    for (const user of users) {
      const subs = Array.isArray(user.pushSubscriptions) ? user.pushSubscriptions : []
      if (!subs.length) continue
      const invalid = new Set()
      for (const sub of subs) {
        try {
          await webpush.sendNotification(sub, payload)
          sent++
        } catch (e) {
          const code = e && e.statusCode
          if (code === 404 || code === 410) invalid.add(String(sub.endpoint || ''))
        }
      }
      if (invalid.size) {
        user.pushSubscriptions = subs.filter(s => !invalid.has(String(s.endpoint || '')))
        await user.save()
      }
    }
    return sent
  } catch {
    return 0
  }
}

// GET /api/border-colors → liste
router.get('/', async (req, res) => {
  try {
    const colors = await BorderColor.find({}).sort({ createdAt: -1 }).lean()
    res.json({ success: true, colors })
  } catch (e) {
    res.status(500).json({ success: false, message: 'Erreur chargement couleurs' })
  }
})

router.get('/mine', verifyToken, async (req, res) => {
  try {
    const userId = String((req.user && (req.user.id || req.user._id)) || '')
    const username = String((req.user && (req.user.username || req.user.name)) || '')
    const isAdmin = String((req.user && req.user.role) || '') === 'admin'
    const query = isAdmin && String(req.query && req.query.all) === '1'
      ? {}
      : { $or: [{ createdById: userId }, { createdByName: username }] }
    const colors = await BorderColor.find(query).sort({ createdAt: -1 }).lean()
    res.json({ success: true, colors })
  } catch (e) {
    res.status(500).json({ success: false, message: 'Erreur chargement couleurs' })
  }
})

router.put('/mine', verifyToken, async (req, res) => {
  try {
    const id = String((req.body && (req.body.id || req.body.colorId)) || '').trim()
    if (!id) return res.status(400).json({ success: false, message: 'id requis' })
    const doc = await BorderColor.findOne({ id })
    if (!doc) return res.status(404).json({ success: false, message: 'Couleur introuvable' })
    const userId = String((req.user && (req.user.id || req.user._id)) || '')
    const username = String((req.user && (req.user.username || req.user.name)) || '')
    const isAdmin = String((req.user && req.user.role) || '') === 'admin'
    const isOwner = (userId && String(doc.createdById || '') === userId) || (username && String(doc.createdByName || '') === username)
    if (!isAdmin && !isOwner) return res.status(403).json({ success: false, message: 'Non autorisé' })
    const update = {
      name: typeof req.body.name === 'string' ? req.body.name.trim() : doc.name,
      color: typeof req.body.color === 'string' ? req.body.color : doc.color,
      gradient: typeof req.body.gradient === 'string' ? req.body.gradient : (req.body.gradient === null ? null : doc.gradient),
      price: Number.isFinite(Number(req.body.price)) ? Number(req.body.price) : doc.price,
      availableInDailyShop: typeof req.body.availableInDailyShop !== 'undefined' ? !!req.body.availableInDailyShop : doc.availableInDailyShop
    }
    const up = await BorderColor.findOneAndUpdate({ id }, { $set: update }, { new: true })
    res.json({ success: true, color: up })
  } catch (e) {
    res.status(500).json({ success: false, message: 'Erreur mise à jour' })
  }
})

router.delete('/mine', verifyToken, async (req, res) => {
  try {
    const id = String((req.query && req.query.id) || (req.body && req.body.id) || '').trim()
    if (!id) return res.status(400).json({ success: false, message: 'id requis' })
    const doc = await BorderColor.findOne({ id })
    if (!doc) return res.status(404).json({ success: false, message: 'Couleur introuvable' })
    const userId = String((req.user && (req.user.id || req.user._id)) || '')
    const username = String((req.user && (req.user.username || req.user.name)) || '')
    const isAdmin = String((req.user && req.user.role) || '') === 'admin'
    const isOwner = (userId && String(doc.createdById || '') === userId) || (username && String(doc.createdByName || '') === username)
    if (!isAdmin && !isOwner) return res.status(403).json({ success: false, message: 'Non autorisé' })
    await BorderColor.deleteOne({ id })
    try { await User.updateMany({}, { $pull: { purchasedItems: { colorId: id } } }) } catch {}
    res.json({ success: true })
  } catch (e) {
    res.status(500).json({ success: false, message: 'Erreur suppression' })
  }
})

// POST /api/border-colors → créer/mettre à jour (admin)
router.post('/', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const body = req.body || {}
    const id = String(body.id || body.colorId || '').trim()
    const name = String(body.name || id || '').trim()
    if (!id || !name) return res.status(400).json({ success: false, message: 'id et name requis' })
    const payload = {
      id,
      name,
      color: typeof body.color === 'string' ? body.color : null,
      gradient: typeof body.gradient === 'string' ? body.gradient : null,
      legacyId: Number.isFinite(Number(body.legacyId)) ? Number(body.legacyId) : null,
      price: Number.isFinite(Number(body.price)) ? Number(body.price) : 0,
      availableInDailyShop: !!body.availableInDailyShop
    }
    const up = await BorderColor.findOneAndUpdate({ id }, { $set: payload }, { new: true, upsert: true, setDefaultsOnInsert: true })
    res.json({ success: true, color: up })
  } catch (e) {
    res.status(500).json({ success: false, message: 'Erreur création/MAJ' })
  }
})

// PUT /api/border-colors?id=... → mise à jour (admin)
router.put('/', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const id = String((req.query && req.query.id) || (req.body && req.body.id) || '').trim()
    if (!id) return res.status(400).json({ success: false, message: 'id requis' })
    const update = req.body || {}
    const up = await BorderColor.findOneAndUpdate({ id }, update, { new: true })
    if (!up) return res.status(404).json({ success: false, message: 'Couleur introuvable' })
    res.json({ success: true, color: up })
  } catch (e) {
    res.status(500).json({ success: false, message: 'Erreur mise à jour' })
  }
})

// DELETE /api/border-colors?id=... → suppression (admin)
router.delete('/', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const id = String((req.query && req.query.id) || (req.body && req.body.id) || '').trim()
    if (!id) return res.status(400).json({ success: false, message: 'id requis' })
    const del = await BorderColor.findOneAndDelete({ id })
    if (!del) return res.status(404).json({ success: false, message: 'Couleur introuvable' })
    res.json({ success: true })
  } catch (e) {
    res.status(500).json({ success: false, message: 'Erreur suppression' })
  }
})

router.post('/suggest', verifyToken, async (req, res) => {
  try {
    const body = req.body || {}
    const name = String(body.name || '').trim()
    if (!name) return res.status(400).json({ success: false, message: 'name requis' })

    let id = String(body.id || body.colorId || '').trim()
    if (!id) {
      const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
      id = base || `color-${Date.now().toString(36)}`
    }

    let finalId = id
    const existing = await BorderColor.findOne({ id: finalId })
    if (existing) finalId = `${id}-${Date.now().toString(36)}`

    const payload = {
      id: finalId,
      name,
      color: typeof body.color === 'string' ? body.color : null,
      gradient: typeof body.gradient === 'string' ? body.gradient : null,
      legacyId: Number.isFinite(Number(body.legacyId)) ? Number(body.legacyId) : null,
      price: Number.isFinite(Number(body.price)) ? Number(body.price) : 0,
      availableInDailyShop: true,
      createdById: String((req.user && (req.user.id || req.user._id)) || ''),
      createdByName: String((req.user && (req.user.username || req.user.name)) || '')
    }

    const created = await BorderColor.findOneAndUpdate({ id: finalId }, { $set: payload }, { new: true, upsert: true, setDefaultsOnInsert: true })

    await sendNewBorderColorPush(created)

    res.json({ success: true, color: created })
  } catch (e) {
    res.status(500).json({ success: false, message: 'Erreur enregistrement suggestion' })
  }
})

module.exports = router