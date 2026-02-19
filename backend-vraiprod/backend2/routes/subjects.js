// @ts-nocheck
const express = require('express');
const { verifyToken, requireRole } = require('../middlewares/auth');
const Subject = require('../models/Subject');
const StaticSubjectRule = require('../models/StaticSubjectRule');

const router = express.Router();

// CRUD matières dynamiques (admin)
// Liste publique (lecture) pour permettre l'affichage des matières aux non-admins
router.get('/', async (req, res) => {
  const list = await Subject.find({}).sort({ createdAt: -1 });
  res.json({ success: true, subjects: list });
});

router.post('/', verifyToken, requireRole(['admin']), async (req, res) => {
  const s = await Subject.create(req.body || {});
  res.json({ success: true, subject: s });
});

router.put('/:id', verifyToken, requireRole(['admin']), async (req, res) => {
  const s = await Subject.findByIdAndUpdate(req.params.id, req.body || {}, { new: true });
  if (!s) return res.status(404).json({ success: false, message: 'Introuvable' });
  res.json({ success: true, subject: s });
});

router.delete('/:id', verifyToken, requireRole(['admin']), async (req, res) => {
  await Subject.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// === Nouveau namespace propre pour les règles statiques ===
// Lecture publique (utilisée côté front pour filtrer les matières statiques)
router.get('/rules', async (req, res) => {
  try {
    const rules = await StaticSubjectRule.find({}).sort({ subjectName: 1 }).lean();
    res.json({ success: true, rules });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur', error: String(error?.message || error) });
  }
});

// Upsert règle (admin)
router.post('/rules', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { subjectName, yearsAllowed = [], specialitesAllowed = [], groupsAllowed = [], departmentAllowed = [] } = req.body || {};
    if (!subjectName) return res.status(400).json({ success: false, message: 'subjectName requis' });
    const rule = await StaticSubjectRule.findOneAndUpdate(
      { subjectName },
      { subjectName, yearsAllowed, specialitesAllowed, groupsAllowed, departmentAllowed },
      { new: true, upsert: true }
    );
    res.json({ success: true, rule });
  } catch (e) {
    res.status(400).json({ success: false, message: 'Erreur enregistrement règle', error: String(e?.message || e) });
  }
});

// Suppression règle (admin)
router.delete('/rules/:subjectName', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    await StaticSubjectRule.findOneAndDelete({ subjectName: req.params.subjectName });
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ success: false, message: 'Erreur suppression règle', error: String(e?.message || e) });
  }
});

module.exports = router;