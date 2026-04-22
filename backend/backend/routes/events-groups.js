// @ts-nocheck
const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const User = require('../models/User');
const { verifyToken } = require('../middlewares/auth');

let webpush;
try { webpush = require('web-push'); } catch {}
const VAPID_PUBLIC_KEY = process.env.PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.PRIVATE_KEY || process.env.VAPID_PRIVATE_KEY || '';
try { if (webpush && VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) { webpush.setVapidDetails('mailto:admin@planifymmi.fr', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY); } } catch {}

// Sanitation minimale côté serveur pour descriptions HTML (aligné avec events.js)
function sanitizeHtml(input) {
  try {
    if (!input) return '';
    let html = String(input);
    html = html.replace(/<\s*(script|iframe|object|embed|link|meta)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '');
    html = html.replace(/<\s*(script|iframe|object|embed|link|meta)[^>]*\/>/gi, '');
    html = html.replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
    html = html.replace(/(href|src)\s*=\s*(['"])\s*javascript:[^'"]*\2/gi, '$1="#"');
    return html;
  } catch { return ''; }
}

function normalizeYear(year) {
  if (!year) return '';
  let y = year.replace(/\s+/g, '').toUpperCase();
  if (y === 'BUT1' || y === '1') return '1';
  if (y === 'BUT2' || y === '2') return '2';
  if (y === 'BUT3' || y === '3') return '3';
  return y;
}

function normalizeGroupe(groupe) {
  if (!groupe) return '';
  return groupe.replace(/\s+/g, '').toUpperCase();
}

function escapeRegex(input) {
  return String(input || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildGroupRegex(groupe) {
  const normalized = normalizeGroupe(groupe);
  if (!normalized) return null;
  const chars = normalized.split('').map(ch => escapeRegex(ch));
  return new RegExp(`^${chars.join('\\s*')}$`, 'i');
}

function buildPossibleYears(year) {
  const normalized = normalizeYear(String(year || ''));
  const list = [];
  if (normalized) list.push(normalized);
  if (normalized === '1') list.push('BUT1', 'BUT 1', 1);
  if (normalized === '2') list.push('BUT2', 'BUT 2', 2);
  if (normalized === '3') list.push('BUT3', 'BUT 3', 3);
  return Array.from(new Set(list));
}

function pickGroupsFromEvent(ev) {
  const list = [];
  if (Array.isArray(ev?.groupes)) {
    for (const g of ev.groupes) {
      if (g) list.push(String(g));
    }
  }
  if (ev?.groupe) list.push(String(ev.groupe));
  return Array.from(new Set(list.filter(Boolean)));
}

function buildGroupClauses(groups) {
  const groupList = Array.from(new Set((Array.isArray(groups) ? groups : []).map(String).filter(Boolean)));
  const regexMap = new Map();
  for (const g of groupList) {
    const r = buildGroupRegex(g);
    if (r) regexMap.set(r.source, r);
  }
  const groupRegexes = Array.from(regexMap.values());
  const clauses = [];
  if (groupList.length) clauses.push({ groupe: { $in: groupList } });
  for (const r of groupRegexes) clauses.push({ groupe: r });
  return { groupList, clauses };
}

async function sendEventUpdatePush(event, notifyGroups) {
  try {
    if (!webpush || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return;
    if (!event) return;
    const prefKey = event.type === 'exam' ? 'exam' : 'homework';
    const possibleYears = buildPossibleYears(event.year);
    if (!possibleYears.length) return;
    const groups = [];
    if (Array.isArray(notifyGroups) && notifyGroups.length) {
      for (const g of notifyGroups) {
        if (g) groups.push(String(g));
      }
    } else {
      if (event.groupe) groups.push(String(event.groupe));
      if (Array.isArray(event.groupes)) {
        for (const g of event.groupes) {
          if (g) groups.push(String(g));
        }
      }
    }
    const normalizedGroups = groups.map(normalizeGroupe).filter(Boolean);
    const hasPromo = normalizedGroups.includes('PROMO');
    const groupList = Array.from(new Set(groups.filter(Boolean)));
    const regexMap = new Map();
    for (const g of groupList) {
      const r = buildGroupRegex(g);
      if (r) regexMap.set(r.source, r);
    }
    const groupRegexes = Array.from(regexMap.values());
    const query = {
      'pushPreferences.enabled': true,
      [`pushPreferences.${prefKey}`]: true,
      year: { $in: possibleYears },
      pushSubscriptions: { $elemMatch: { endpoint: { $exists: true, $ne: '' } } }
    };
    if (!hasPromo && groupList.length) {
      query.$or = [
        { groupe: { $in: groupList } },
        ...groupRegexes.map(r => ({ groupe: r }))
      ];
    }
    if (event.specialite) query.specialite = String(event.specialite);
    const users = await User.find(query).select({ pushSubscriptions: 1 });
    if (!users || !users.length) return;
    const title = '✏️ Modification de la tâche';
    const taskTitle = String(event.titre || '').trim();
    const body = taskTitle ? `Modification : ${taskTitle}` : 'Modification de la tâche';
    const payload = JSON.stringify({
      title,
      body,
      icon: '/planifyFichier_134x.webp?v=2',
      badge: '/planifyFichier_134x.webp?v=2',
      data: { url: '/devoirs' }
    });
    for (const user of users) {
      const subs = Array.isArray(user.pushSubscriptions) ? user.pushSubscriptions : [];
      if (!subs.length) continue;
      const invalid = new Set();
      for (const sub of subs) {
        try {
          await webpush.sendNotification(sub, payload);
        } catch (e) {
          const code = e && e.statusCode;
          if (code === 404 || code === 410) invalid.add(String(sub.endpoint || ''));
        }
      }
      if (invalid.size) {
        user.pushSubscriptions = subs.filter(s => !invalid.has(String(s.endpoint || '')));
        await user.save();
      }
    }
  } catch {}
}

async function sendEventGroupAddedPush(event, notifyGroups, excludeGroups) {
  try {
    if (!webpush || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return;
    if (!event) return;
    const prefKey = event.type === 'exam' ? 'exam' : 'homework';
    const possibleYears = buildPossibleYears(event.year);
    if (!possibleYears.length) return;
    const targetGroups = Array.isArray(notifyGroups) && notifyGroups.length ? notifyGroups : pickGroupsFromEvent(event);
    const normalizedGroups = targetGroups.map(normalizeGroupe).filter(Boolean);
    const hasPromo = normalizedGroups.includes('PROMO');
    const { clauses: includeClauses } = buildGroupClauses(targetGroups);
    const query = {
      'pushPreferences.enabled': true,
      [`pushPreferences.${prefKey}`]: true,
      year: { $in: possibleYears },
      pushSubscriptions: { $elemMatch: { endpoint: { $exists: true, $ne: '' } } }
    };
    if (!hasPromo && includeClauses.length) {
      query.$or = includeClauses;
    }
    if (event.specialite) query.specialite = String(event.specialite);
    if (Array.isArray(excludeGroups) && excludeGroups.length) {
      const { clauses: excludeClauses } = buildGroupClauses(excludeGroups);
      if (excludeClauses.length) query.$nor = excludeClauses;
    }
    const users = await User.find(query).select({ pushSubscriptions: 1 });
    if (!users || !users.length) return;
    const title = event.type === 'exam' ? '📝 Nouvel examen' : '📘 Nouveau devoir';
    const parts = [];
    if (event.matiere) parts.push(String(event.matiere));
    if (event.titre) parts.push(String(event.titre));
    const body = parts.join(' • ') || 'Nouvel événement';
    const payload = JSON.stringify({
      title,
      body,
      icon: '/planifyFichier_134x.webp?v=2',
      badge: '/planifyFichier_134x.webp?v=2',
      data: { url: '/devoirs' }
    });
    for (const user of users) {
      const subs = Array.isArray(user.pushSubscriptions) ? user.pushSubscriptions : [];
      if (!subs.length) continue;
      const invalid = new Set();
      for (const sub of subs) {
        try {
          await webpush.sendNotification(sub, payload);
        } catch (e) {
          const code = e && e.statusCode;
          if (code === 404 || code === 410) invalid.add(String(sub.endpoint || ''));
        }
      }
      if (invalid.size) {
        user.pushSubscriptions = subs.filter(s => !invalid.has(String(s.endpoint || '')));
        await user.save();
      }
    }
  } catch {}
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

// Autoriser l'auteur (et prof/admin) à mettre à jour son événement
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

    const before = event && event.toObject ? event.toObject() : event;

    Object.assign(event, update);
    await event.save();

    res.json({ success: true, event });

    try {
      const b = before || {};
      const a = event || {};
      const norm = (v) => (v == null ? '' : String(v));
      const normArr = (arr) => Array.from(new Set((Array.isArray(arr) ? arr : []).map(String))).sort();
      const pickGroups = (ev) => {
        const list = [];
        if (Array.isArray(ev?.groupes)) {
          for (const g of ev.groupes) {
            if (g) list.push(String(g));
          }
        }
        if (ev?.groupe) list.push(String(ev.groupe));
        return Array.from(new Set(list.filter(Boolean)));
      };
      const changed = (
        norm(b.titre) !== norm(a.titre) ||
        norm(b.matiere) !== norm(a.matiere) ||
        norm(b.date) !== norm(a.date) ||
        norm(b.heure) !== norm(a.heure) ||
        norm(b.description) !== norm(a.description) ||
        norm(b.type) !== norm(a.type) ||
        norm(b.groupe) !== norm(a.groupe) ||
        JSON.stringify(normArr(b.groupes)) !== JSON.stringify(normArr(a.groupes)) ||
        norm(b.year) !== norm(a.year) ||
        norm(b.specialite) !== norm(a.specialite)
      );
      if (changed) {
        const notifyGroups = Array.from(new Set([...pickGroups(b), ...pickGroups(a)]));
        setImmediate(() => { sendEventUpdatePush(a, notifyGroups).catch(() => {}); });
      }
    } catch {}

    return;
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

    const beforeGroups = pickGroupsFromEvent(event);

    if (groups.length === 0) {
      await Event.deleteOne({ _id: event._id });
      return res.json({ success: true, mode: 'hard', message: 'Événement supprimé (aucun groupe)' });
    }

    event.groupes = groups;
    if (!groups.includes(event.groupe)) {
      event.groupe = groups[0] || 'Promo';
    }
    await event.save();

    res.json({ success: true, mode: 'set', message: 'Groupes mis à jour', event });

    try {
      const afterGroups = pickGroupsFromEvent(event);
      const addedGroups = afterGroups.filter(g => !beforeGroups.includes(g));
      if (addedGroups.length) {
        setImmediate(() => { sendEventGroupAddedPush(event, addedGroups, beforeGroups).catch(() => {}); });
      }
    } catch {}

    return;
  } catch (error) {
    console.error('Erreur set-groups:', error);
    return res.status(500).json({ success: false, message: 'Erreur mise à jour des groupes' });
  }
});

module.exports = router;