// @ts-nocheck
const express = require('express')
const router = express.Router()
const { verifyToken, requireRole } = require('../middlewares/auth')
const BorderColor = require('../models/BorderColor')

// GET /api/border-colors → liste
router.get('/', async (req, res) => {
  try {
    const colors = await BorderColor.find({}).sort({ createdAt: -1 }).lean()
    res.json({ success: true, colors })
  } catch (e) {
    res.status(500).json({ success: false, message: 'Erreur chargement couleurs' })
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

module.exports = router

