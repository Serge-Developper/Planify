const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middlewares/auth');
const BorderColor = require('../models/BorderColor');

// GET /api/border-colors
router.get('/', verifyToken, async (req, res) => {
  try {
    const colors = await BorderColor.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, colors });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/border-colors
router.post('/', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id, name, color, gradient, price } = req.body || {};
    if (!id || !name) { res.status(400).json({ success: false, message: 'id et name requis' }); return; }
    const doc = new BorderColor({ id: String(id), name: String(name), color: color || null, gradient: gradient || null, price: Number(price) || 0 });
    await doc.save();
    res.json({ success: true, color: doc });
  } catch (e) {
    if (e && e.code === 11000) { res.status(409).json({ success: false, message: 'Identifiant déjà utilisé' }); return; }
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// PUT /api/border-colors?id=xyz
router.put('/', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.query || {};
    if (!id) { res.status(400).json({ success: false, message: 'id requis' }); return; }
    const updates = {};
    ['name','color','gradient','price'].forEach(k => { if (req.body && req.body[k] !== undefined) updates[k] = req.body[k]; });
    const doc = await BorderColor.findOneAndUpdate({ id: String(id) }, updates, { new: true });
    if (!doc) { res.status(404).json({ success: false, message: 'Couleur non trouvée' }); return; }
    res.json({ success: true, color: doc });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// DELETE /api/border-colors?id=xyz
router.delete('/', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.query || {};
    if (!id) { res.status(400).json({ success: false, message: 'id requis' }); return; }
    await BorderColor.deleteOne({ id: String(id) });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

module.exports = router;

