// @ts-nocheck
const express = require('express');
const { verifyToken, requireRole } = require('../middlewares/auth');
const Subject = require('../models/Subject');
const StaticSubjectRule = require('../models/StaticSubjectRule');

const router = express.Router();

// CRUD matières dynamiques (admin)
router.get('/', verifyToken, requireRole(['admin']), async (req, res) => {
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
router.get('/static-rules', verifyToken, requireRole(['admin']), async (req, res) => {
  const rules = await StaticSubjectRule.find({}).sort({ subjectName: 1 });
  res.json({ success: true, rules });
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

