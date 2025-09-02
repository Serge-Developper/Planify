// @ts-nocheck
const express = require('express');
const router = express.Router();
const Subject = require('../models/Subject');
const StaticSubjectRule = require('../models/StaticSubjectRule');
const { verifyToken, requireRole } = require('../middlewares/auth');

// Normalisation utilitaire côté API
function normalizeYear(y) {
  if (!y) return '';
  const v = String(y).replace(/\s+/g, '').toUpperCase();
  if (v === 'BUT1' || v === '1') return 'BUT1';
  if (v === 'BUT2' || v === '2') return 'BUT2';
  if (v === 'BUT3' || v === '3') return 'BUT3';
  return v;
}

// Liste des matières dynamiques
router.get('/', verifyToken, async (req, res) => {
  try {
    const list = await Subject.find({}).sort({ name: 1 });
    res.json(list);
  } catch (e) {
    res.status(500).json({ message: 'Erreur lors du chargement des matières', error: String(e.message || e) });
  }
});

// Créer
router.post('/', verifyToken, requireRole(['admin', 'prof']), async (req, res) => {
  try {
    const s = new Subject({ ...req.body, createdBy: req.user.id });
    await s.save();
    res.json(s);
  } catch (e) {
    res.status(400).json({ message: 'Création impossible', error: String(e.message || e) });
  }
});

// Modifier
router.put('/:id', verifyToken, requireRole(['admin', 'prof']), async (req, res) => {
  try {
    const updated = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: 'Matière introuvable' });
    res.json(updated);
  } catch (e) {
    res.status(400).json({ message: 'Mise à jour impossible', error: String(e.message || e) });
  }
});

// Supprimer
router.delete('/:id', verifyToken, requireRole(['admin', 'prof']), async (req, res) => {
  try {
    await Subject.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ message: 'Suppression impossible', error: String(e.message || e) });
  }
});

// === RÈGLES STATIQUES ===
router.get('/rules/static', verifyToken, async (req, res) => {
  try {
    const rules = await StaticSubjectRule.find({}).sort({ subjectName: 1 });
    res.json(rules);
  } catch (e) {
    res.status(500).json({ message: 'Erreur lors du chargement des règles', error: String(e.message || e) });
  }
});

router.post('/rules/static', verifyToken, requireRole(['admin', 'prof']), async (req, res) => {
  try {
    const { subjectName, yearsAllowed = [], groupsAllowed = [], specialitesAllowed = [] } = req.body || {};
    const payload = {
      subjectName,
      yearsAllowed: yearsAllowed.map(normalizeYear),
      groupsAllowed,
      specialitesAllowed,
    };
    const saved = await StaticSubjectRule.findOneAndUpdate(
      { subjectName },
      payload,
      { new: true, upsert: true }
    );
    res.json(saved);
  } catch (e) {
    res.status(400).json({ message: 'Enregistrement de règle impossible', error: String(e.message || e) });
  }
});

router.delete('/rules/static/:name', verifyToken, requireRole(['admin', 'prof']), async (req, res) => {
  try {
    await StaticSubjectRule.deleteOne({ subjectName: req.params.name });
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ message: 'Suppression de règle impossible', error: String(e.message || e) });
  }
});

module.exports = router;

