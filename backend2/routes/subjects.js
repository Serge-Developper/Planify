const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middlewares/auth');
const Subject = require('../models/Subject');

// GET /api/subjects
router.get('/', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const list = await Subject.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, subjects: list });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/subjects
router.post('/', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const payload = req.body || {};
    if (!payload.name || !payload.color) { res.status(400).json({ success: false, message: 'name et color requis' }); return; }
    const doc = new Subject(payload);
    await doc.save();
    res.json({ success: true, subject: doc });
  } catch (e) {
    if (e && e.code === 11000) { res.status(409).json({ success: false, message: 'Nom déjà utilisé' }); return; }
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// PUT /api/subjects/:id
router.put('/:id', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body || {};
    const doc = await Subject.findByIdAndUpdate(id, updates, { new: true });
    if (!doc) { res.status(404).json({ success: false, message: 'Matière non trouvée' }); return; }
    res.json({ success: true, subject: doc });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// DELETE /api/subjects/:id
router.delete('/:id', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    await Subject.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

module.exports = router;

