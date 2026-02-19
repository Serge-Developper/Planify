// @ts-nocheck
const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const { verifyToken } = require('../middlewares/auth');

// Sanitation minimale côté serveur pour descriptions HTML (aligné avec events.js)
function sanitizeHtml(input) {
  try {
    if (!input) return '';
    let html = String(input);
    html = html.replace(/<\s*(script|iframe|object|embed|link|meta)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '');
    html = html.replace(/<\s*(script|iframe|object|embed|link|meta)[^>]*\/>/gi, '');
    html = html.replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
    html = html.replace(/(href|src)\s*=\s*(["'])\s*javascript:[^\2]*\2/gi, '$1="#"');
    return html;
  } catch { return ''; }
}

// Lister les événements créés par l'utilisateur (quel que soit le groupe)
router.get('/mine', verifyToken, async (req, res) => {
  try {
    const userId = String(req.user.id || req.user._id);
    const events = await Event.find({ createdBy: userId }).sort({ date: 1, heure: 1 });
    res.json({ success: true, events });
  } catch (error) {
    console.error('Erreur GET /events/mine:', error);
    res.status(500).json({ success: false, message: 'Erreur récupération de vos événements' });
  }
});

// Autoriser l’auteur (et prof/admin) à mettre à jour son événement
router.post('/:id/update-self', verifyToken, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Événement non trouvé' });

    const requesterId = String(req.user.id || req.user._id);
    const isOwner = event.createdBy && String(event.createdBy) === requesterId;
    const isPrivileged = req.user.role === 'admin' || req.user.role === 'prof';
    // Fallback legacy: autoriser le délégué du même groupe/année si l'auteur est inconnu
    const sameGroup = Array.isArray(event.groupes)
      ? event.groupes.includes(String(req.user.groupe || ''))
      : String(event.groupe || '') === String(req.user.groupe || '');
    const sameYear = String(event.year || '') === String(req.user.year || '');
    const isDelegueOfSameCohort = !event.createdBy && req.user.role === 'delegue' && sameGroup && sameYear;

    if (!isOwner && !isPrivileged && !isDelegueOfSameCohort) {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }

    const allowed = ['titre', 'date', 'heure', 'type', 'matiere', 'description', 'archLink', 'year', 'specialite'];
    const update = {};
    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        update[key] = req.body[key];
      }
    }
    if (typeof update.description === 'string') {
      update.description = sanitizeHtml(update.description);
    }
    if (typeof update.specialite === 'string' || update.specialite === null) {
      update.specialite = String(update.specialite || '');
    }

    Object.assign(event, update);
    await event.save();

    return res.json({ success: true, event });
  } catch (error) {
    console.error('Erreur update-self:', error);
    return res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour' });
  }
});

// Suppression définitive (autorisé: auteur, prof, admin)
router.post('/:id/hard-delete', verifyToken, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Événement non trouvé' });

    const requesterId = String(req.user.id || req.user._id);
    const isOwner = event.createdBy && String(event.createdBy) === requesterId;
    const isPrivileged = req.user.role === 'admin' || req.user.role === 'prof';
    if (!isOwner && !isPrivileged) {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }

    await Event.deleteOne({ _id: event._id });
    return res.json({ success: true, message: 'Événement supprimé définitivement' });
  } catch (error) {
    console.error('Erreur hard-delete:', error);
    return res.status(500).json({ success: false, message: 'Erreur suppression définitive' });
  }
});

// Suppression partielle par groupes (autorisé: auteur de l'événement, prof, admin)
router.post('/:id/delete-groups', verifyToken, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Événement non trouvé' });

    const requesterId = String(req.user.id || req.user._id);
    const isOwner = event.createdBy && String(event.createdBy) === requesterId;
    const isPrivileged = req.user.role === 'admin' || req.user.role === 'prof';
    if (!isOwner && !isPrivileged) {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }

    let groups = Array.isArray(req.body?.groups) ? req.body.groups : [];
    groups = groups.filter(g => typeof g === 'string' && g.length);
    if (!groups.length) {
      return res.status(400).json({ success: false, message: 'Aucun groupe spécifié' });
    }

    const currentGroups = Array.isArray(event.groupes) && event.groupes.length
      ? event.groupes
      : (event.groupe ? [event.groupe] : []);

    // Retirer les groupes demandés
    const remaining = currentGroups.filter(g => !groups.includes(g));

    if (remaining.length === 0) {
      await Event.deleteOne({ _id: event._id });
      return res.json({ success: true, mode: 'hard', message: 'Événement supprimé (tous les groupes retirés)' });
    }

    event.groupes = remaining;
    if (!remaining.includes(event.groupe)) {
      event.groupe = remaining[0] || 'Promo';
    }
    await event.save();

    return res.json({ success: true, mode: 'partial', message: 'Groupes retirés de cet événement', event });
  } catch (error) {
    console.error('Erreur delete-groups:', error);
    return res.status(500).json({ success: false, message: 'Erreur suppression par groupes' });
  }
});

// Définir les groupes d'un événement (remplacement complet). Si liste vide, supprime l'événement.
router.post('/:id/set-groups', verifyToken, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Événement non trouvé' });

    const requesterId = String(req.user.id || req.user._id);
    const isOwner = event.createdBy && String(event.createdBy) === requesterId;
    const isPrivileged = req.user.role === 'admin' || req.user.role === 'prof';
    if (!isOwner && !isPrivileged) {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }

    let groups = Array.isArray(req.body?.groups) ? req.body.groups : [];
    groups = groups.filter(g => typeof g === 'string' && g.length);

    if (groups.length === 0) {
      await Event.deleteOne({ _id: event._id });
      return res.json({ success: true, mode: 'hard', message: 'Événement supprimé (aucun groupe)' });
    }

    event.groupes = groups;
    // Cohérence du champ legacy
    if (!groups.includes(event.groupe)) {
      event.groupe = groups[0] || 'Promo';
    }
    await event.save();

    return res.json({ success: true, mode: 'set', message: 'Groupes mis à jour', event });
  } catch (error) {
    console.error('Erreur set-groups:', error);
    return res.status(500).json({ success: false, message: 'Erreur mise à jour des groupes' });
  }
});

module.exports = router;


