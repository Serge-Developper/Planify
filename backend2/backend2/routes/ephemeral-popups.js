const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middlewares/auth');

// Stockage en mémoire (éphémère - reset au redémarrage du serveur)
let nextId = 1;
let globalPopup = null; // { id, html, createdAt }
const ackedGlobalByUserId = new Set(); // Set(userId) pour ne plus ré-afficher la pop-up globale à cet utilisateur
const popupByUserId = new Map(); // userId -> { id, html, createdAt }

// Admin envoie une pop-up
// body: { target: 'all' | 'user', userId?: string, html: string }
router.post('/send', verifyToken, requireRole(['admin']), (req, res) => {
  try {
    const target = String(req.body?.target || '').toLowerCase();
    const html = String(req.body?.html || '').trim();
    const userId = req.body?.userId ? String(req.body.userId) : '';

    if (!html) { res.status(400).json({ message: 'Contenu de pop-up manquant' }); return; }
    // Autoriser jusqu'à ~800 Ko de contenu (images en dataURL incluses)
    if (html.length > 800000) { res.status(413).json({ message: 'Pop-up trop volumineuse (max ~800ko)' }); return; }

    if (target === 'all') {
      globalPopup = { id: String(nextId++), html, createdAt: Date.now() };
      ackedGlobalByUserId.clear();
      res.json({ ok: true, popup: globalPopup });
      return;
    }

    if (target === 'user') {
      if (!userId) { res.status(400).json({ message: 'userId requis pour target=user' }); return; }
      const popup = { id: String(nextId++), html, createdAt: Date.now() };
      popupByUserId.set(userId, popup);
      res.json({ ok: true, popup });
      return;
    }

    res.status(400).json({ message: 'target invalide' });
    return;
  } catch (e) {
    console.error('Erreur /popups/send:', e);
    res.status(500).json({ message: 'Erreur serveur' });
    return;
  }
});

// Récupérer la pop-up pour l'utilisateur connecté (si disponible)
router.get('/for-me', verifyToken, (req, res) => {
  try {
    /** @type {any} */
    const anyReq = req;
    const userId = String(anyReq.user && anyReq.user.id);

    // Pop-up ciblée utilisateur prioritaire
    const targeted = popupByUserId.get(userId);
    if (targeted) {
      res.json({ id: targeted.id, html: targeted.html, scope: 'user' });
      return;
    }

    // Pop-up globale si non déjà acquittée par cet utilisateur
    if (globalPopup && !ackedGlobalByUserId.has(userId)) {
      res.json({ id: globalPopup.id, html: globalPopup.html, scope: 'all' });
      return;
    }

    res.status(204).end();
    return;
  } catch (e) {
    console.error('Erreur /popups/for-me:', e);
    res.status(500).json({ message: 'Erreur serveur' });
    return;
  }
});

// Acquitter (ne plus afficher) la pop-up pour l'utilisateur
router.post('/ack/:id', verifyToken, (req, res) => {
  try {
    /** @type {any} */
    const anyReq = req;
    const userId = String(anyReq.user && anyReq.user.id);
    const id = String(req.params.id);

    const targeted = popupByUserId.get(userId);
    if (targeted && targeted.id === id) {
      popupByUserId.delete(userId);
      res.json({ ok: true, scope: 'user' });
      return;
    }

    if (globalPopup && globalPopup.id === id) {
      ackedGlobalByUserId.add(userId);
      res.json({ ok: true, scope: 'all' });
      return;
    }

    res.status(404).json({ message: 'Pop-up introuvable' });
    return;
  } catch (e) {
    console.error('Erreur /popups/ack:', e);
    res.status(500).json({ message: 'Erreur serveur' });
    return;
  }
});

module.exports = router;


