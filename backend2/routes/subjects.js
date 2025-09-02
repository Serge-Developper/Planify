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

// Règles matières statiques (admin)
// Lecture publique des règles (lecture seule)
router.get('/static-rules', async (req, res) => {
  console.log('🔍 GET /static-rules appelé');
  try {
    const rules = await StaticSubjectRule.find({}).sort({ subjectName: 1 });
    console.log('✅ Règles trouvées:', rules.length);
    res.json({ success: true, rules });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des règles:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
});

router.post('/static-rules', verifyToken, requireRole(['admin']), async (req, res) => {
  const { subjectName, yearsAllowed = [], specialitesAllowed = [], groupsAllowed = [] } = req.body || {};
  if (!subjectName) return res.status(400).json({ success: false, message: 'subjectName requis' });
  const rule = await StaticSubjectRule.findOneAndUpdate(
    { subjectName },
    { subjectName, yearsAllowed, specialitesAllowed, groupsAllowed },
    { new: true, upsert: true }
  );
  res.json({ success: true, rule });
});

router.delete('/static-rules/:subjectName', verifyToken, requireRole(['admin']), async (req, res) => {
  await StaticSubjectRule.findOneAndDelete({ subjectName: req.params.subjectName });
  res.json({ success: true });
});

module.exports = router;