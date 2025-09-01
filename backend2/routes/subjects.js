// @ts-nocheck
const express = require('express')
const router = express.Router()
const { verifyToken, requireRole } = require('../middlewares/auth')
const Subject = require('../models/Subject')
const StaticSubjectRule = require('../models/StaticSubjectRule')

// Liste des matières
router.get('/', verifyToken, requireRole(['admin', 'prof']), async (req, res) => {
  try {
    const list = await Subject.find({}).sort({ createdAt: -1 }).lean()
    res.json({ success: true, subjects: list })
  } catch (e) {
    res.status(500).json({ success: false, message: 'Erreur chargement matières' })
  }
})

// Création d'une matière
router.post('/', verifyToken, requireRole(['admin', 'prof']), async (req, res) => {
  try {
    const body = req.body || {}
    const created = await Subject.create({
      name: String(body.name || '').trim(),
      color: body.color || '#3B82F6',
      color2: body.color2 || null,
      useGradient: !!body.useGradient,
      gradientAngle: Number.isFinite(Number(body.gradientAngle)) ? Number(body.gradientAngle) : 135,
      colorOpacity: Number.isFinite(Number(body.colorOpacity)) ? Number(body.colorOpacity) : 1,
      color2Opacity: Number.isFinite(Number(body.color2Opacity)) ? Number(body.color2Opacity) : 1,
      yearsAllowed: Array.isArray(body.yearsAllowed) ? body.yearsAllowed : [],
      groupsAllowed: Array.isArray(body.groupsAllowed) ? body.groupsAllowed : [],
      specialitesAllowed: Array.isArray(body.specialitesAllowed) ? body.specialitesAllowed : [],
    })
    res.json({ success: true, subject: created })
  } catch (e) {
    res.status(400).json({ success: false, message: 'Erreur création matière' })
  }
})

// Mise à jour
router.put('/:id', verifyToken, requireRole(['admin', 'prof']), async (req, res) => {
  try {
    const update = req.body || {}
    const subject = await Subject.findByIdAndUpdate(req.params.id, update, { new: true })
    if (!subject) return res.status(404).json({ success: false, message: 'Matière introuvable' })
    res.json({ success: true, subject })
  } catch (e) {
    res.status(400).json({ success: false, message: 'Erreur mise à jour matière' })
  }
})

// Suppression
router.delete('/:id', verifyToken, requireRole(['admin', 'prof']), async (req, res) => {
  try {
    const del = await Subject.findByIdAndDelete(req.params.id)
    if (!del) return res.status(404).json({ success: false, message: 'Matière introuvable' })
    res.json({ success: true })
  } catch (e) {
    res.status(400).json({ success: false, message: 'Erreur suppression matière' })
  }
})

// Règles statiques (CRUD minimal)
router.get('/static-rules', verifyToken, requireRole(['admin', 'prof']), async (_req, res) => {
  try {
    const rules = await StaticSubjectRule.find({}).lean()
    res.json({ success: true, rules })
  } catch (e) {
    res.status(500).json({ success: false, message: 'Erreur chargement règles' })
  }
})

router.post('/static-rules', verifyToken, requireRole(['admin', 'prof']), async (req, res) => {
  try {
    const body = req.body || {}
    const subjectName = String(body.subjectName || '').trim()
    if (!subjectName) return res.status(400).json({ success: false, message: 'subjectName requis' })
    const payload = {
      subjectName,
      yearsAllowed: Array.isArray(body.yearsAllowed) ? body.yearsAllowed : [],
      groupsAllowed: Array.isArray(body.groupsAllowed) ? body.groupsAllowed : [],
      specialitesAllowed: Array.isArray(body.specialitesAllowed) ? body.specialitesAllowed : [],
    }
    const up = await StaticSubjectRule.findOneAndUpdate({ subjectName }, payload, { upsert: true, new: true, setDefaultsOnInsert: true })
    res.json({ success: true, rule: up })
  } catch (e) {
    res.status(400).json({ success: false, message: 'Erreur sauvegarde règle' })
  }
})

router.delete('/static-rules', verifyToken, requireRole(['admin', 'prof']), async (req, res) => {
  try {
    const subjectName = String((req.query && req.query.subjectName) || (req.body && req.body.subjectName) || '').trim()
    if (!subjectName) return res.status(400).json({ success: false, message: 'subjectName requis' })
    await StaticSubjectRule.findOneAndDelete({ subjectName })
    res.json({ success: true })
  } catch (e) {
    res.status(400).json({ success: false, message: 'Erreur suppression règle' })
  }
})

module.exports = router

