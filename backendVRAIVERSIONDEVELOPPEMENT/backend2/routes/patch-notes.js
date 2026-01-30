// ... existing code ...
const express = require('express');
const router = express.Router();
const PatchNote = require('../models/PatchNote');
const { verifyToken, requireRole } = require('../middlewares/auth');

// Liste publique (sans HTML)
router.get('/', async (req, res) => {
  try {
    const notes = await PatchNote.find({ published: true })
      .sort({ createdAt: -1 })
      .select({ title: 1, version: 1, createdAt: 1 });
    res.json({ success: true, notes });
  } catch { res.status(500).json({ success: false, message: 'Erreur serveur' }); }
});

// Dernière note (métadonnées + notify)
router.get('/latest-meta', async (req, res) => {
  try {
    const latest = await PatchNote.findOne({ published: true })
      .sort({ createdAt: -1 })
      .select({ title: 1, version: 1, createdAt: 1, notify: 1 });
    if (!latest) return res.status(204).end();
    res.json({ success: true, latest });
  } catch { res.status(500).json({ success: false, message: 'Erreur serveur' }); }
});

// Détail avec HTML
router.get('/:id', async (req, res) => {
  try {
    const note = await PatchNote.findById(String(req.params.id || ''));
    if (!note || !note.published) return res.status(404).json({ success: false, message: 'Note introuvable' });
    res.json({ success: true, note });
  } catch { res.status(500).json({ success: false, message: 'Erreur serveur' }); }
});

// Création (admin)
router.post('/', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    /** @type {{ title?: string; version?: string; html?: string; notify?: boolean; published?: boolean }} */
    const body = req.body || {};
    const title = body.title;
    const version = body.version;
    const html = body.html;
    const notify = body.notify ?? true;
    const published = body.published ?? true;

    if (!title || !html) return res.status(400).json({ success: false, message: 'title et html requis' });
    if (String(html).length > 800000) return res.status(413).json({ success: false, message: 'Patch note trop volumineux (max ~800ko)' });

    const note = await PatchNote.create({
      title: String(title),
      version: String(version || ''),
      html: String(html),
      notify: !!notify,
      published: !!published
    });
    res.json({ success: true, note });
  } catch { res.status(500).json({ success: false, message: 'Erreur serveur' }); }
});

// Mise à jour (admin)
router.put('/:id', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const id = String(req.params.id || '');

    /** @type {{ title?: string; version?: string; html?: string; notify?: boolean; published?: boolean }} */
    const body = req.body || {};
    const title = body.title;
    const version = body.version;
    const html = body.html;
    const notify = body.notify;
    const published = body.published;

    /** @type {{ title?: string; version?: string; html?: string; notify?: boolean; published?: boolean }} */
    const update = {};
    if (title !== undefined) update.title = String(title);
    if (version !== undefined) update.version = String(version);
    if (html !== undefined) {
      if (String(html).length > 800000) return res.status(413).json({ success: false, message: 'Patch note trop volumineux (max ~800ko)' });
      update.html = String(html);
    }
    if (notify !== undefined) update.notify = !!notify;
    if (published !== undefined) update.published = !!published;

    const note = await PatchNote.findByIdAndUpdate(id, update, { new: true });
    if (!note) return res.status(404).json({ success: false, message: 'Note introuvable' });
    res.json({ success: true, note });
  } catch { res.status(500).json({ success: false, message: 'Erreur serveur' }); }
});

// Suppression (admin)
router.delete('/:id', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const deleted = await PatchNote.findByIdAndDelete(String(req.params.id || ''));
    if (!deleted) return res.status(404).json({ success: false, message: 'Note introuvable' });
    res.json({ success: true });
  } catch { res.status(500).json({ success: false, message: 'Erreur serveur' }); }
});

module.exports = router;