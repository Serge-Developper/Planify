const express = require('express');
const router = express.Router();
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
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const { verifyToken, requireRole } = require('../middlewares/auth');
const Event = require('../models/Event');
const EventProposal = require('../models/EventProposal');
const User = require('../models/User');

const proposalsPerDayLimit = 5;
const pendingPerUserLimit = 3;

function normalizeYear(year) {
  if (!year) return '';
  let y = String(year).replace(/\s+/g, '').toUpperCase();
  if (y === 'BUT1' || y === '1') return '1';
  if (y === 'BUT2' || y === '2') return '2';
  if (y === 'BUT3' || y === '3') return '3';
  return y;
}

function possibleYearsFromUserYear(userYear) {
  const normalizedYear = normalizeYear(userYear);
  const possibleYears = [normalizedYear];
  if (normalizedYear === '1') possibleYears.push('BUT1', 'BUT 1', 1);
  if (normalizedYear === '2') possibleYears.push('BUT2', 'BUT 2', 2);
  if (normalizedYear === '3') possibleYears.push('BUT3', 'BUT 3', 3);
  return possibleYears;
}

function canAccessProposal(user, prop) {
  if (!user || !prop) return false;
  const role = String(user.role || '');
  if (role === 'admin' || role === 'prof') return true;

  const userYear = String(user.year || '');
  const userGroup = String(user.groupe || '');
  const userSpec = String(user.specialite || '');

  const years = possibleYearsFromUserYear(userYear);
  if (years.length && !years.includes(prop.year)) return false;

  const groups = new Set([
    String(prop.groupe || ''),
    ...(Array.isArray(prop.groupes) ? prop.groupes.map(String) : [])
  ]);
  if (userGroup) {
    if (!(groups.has(userGroup) || groups.has('Promo'))) return false;
  }

  const pSpec = String(prop.specialite || '');
  if (pSpec) {
    if (!userSpec) return false;
    if (userSpec !== pSpec) return false;
  }

  return true;
}

const uploadsDir = path.join(__dirname, '..', 'uploads', 'events');
try { fs.mkdirSync(uploadsDir, { recursive: true }); } catch {}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '_' + Math.random().toString(36).slice(2);
    const safeName = (file.originalname || '').replace(/[^\w.\-]+/g, '_');
    cb(null, unique + '_' + safeName);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 32 * 1024 * 1024, files: 10 },
  fileFilter: (req, file, cb) => {
    const okExt = /\.(pdf|docx?|zip|rar)$/i.test(file.originalname);
    const okMime = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/zip',
      'application/x-zip-compressed',
      'application/x-rar-compressed',
      'application/x-rar',
      'application/octet-stream'
    ].includes(file.mimetype);
    cb(null, okExt || okMime);
  }
});



router.post('/proposals', verifyToken, async (req, res) => {
  try {
    const start = new Date(); start.setHours(0,0,0,0);
    const daily = await EventProposal.countDocuments({ proposedBy: req.user.id, createdAt: { $gte: start } });
    if (daily >= proposalsPerDayLimit) return res.status(429).json({ success: false, message: 'Limite quotidienne atteinte' });
    const pending = await EventProposal.countDocuments({ proposedBy: req.user.id, status: 'pending' });
    if (pending >= pendingPerUserLimit) return res.status(429).json({ success: false, message: 'Trop de propositions en attente' });
    const b = { ...req.body };
    const description = typeof b.description === 'string' ? sanitizeHtml(b.description) : '';
    const groupes = Array.isArray(b.groupes) ? b.groupes.filter(g => typeof g === 'string' && g.length) : [];
    const groupe = (typeof b.groupe === 'string' && b.groupe.length) ? b.groupe : (groupes[0] || 'Promo');
    const doc = await EventProposal.create({
      titre: String(b.titre || ''), date: String(b.date || ''), heure: String(b.heure || ''),
      groupe, groupes, type: String(b.type || ''), matiere: String(b.matiere || ''),
      specialite: String(b.specialite || ''), year: String(b.year || ''), description,
      submissionEnabled: !!b.submissionEnabled, groupWorkEnabled: !!b.groupWorkEnabled,
      workGroupsDraft: Array.isArray(b.workGroupsDraft) ? b.workGroupsDraft : [],
      attachments: [], proposedBy: req.user.id, status: 'pending'
    });
    try {
      const u = await User.findById(req.user.id)
      if (u) {
        u.achievements = u.achievements || {}
        u.achievements.proposalsCount = Math.max(0, Number(u.achievements.proposalsCount||0)) + 1
        u.achievementsCompleted = Array.isArray(u.achievementsCompleted) ? u.achievementsCompleted : []
        function award(id) { if (!u.achievementsCompleted.includes(id)) u.achievementsCompleted.push(id) }
        const c = u.achievements.proposalsCount
        if (c === 5) award('homework-propose-5')
        if (c === 20) award('homework-propose-20')
        if (c === 50) award('homework-propose-50')
        await u.save()
      }
    } catch {}
    res.json({ success: true, proposal: doc });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Erreur création proposition', error: String(e) });
  }
});

router.get('/proposals', verifyToken, requireRole(['delegue','prof','admin']), async (req, res) => {
  try {
    const list = await EventProposal.find({ status: 'pending' })
      .sort({ createdAt: -1 })
      .populate('proposedBy', 'username groupe year proposalBlocked');
    const visible = list.filter(p => !(p?.proposedBy?.proposalBlocked));
    res.json({ success: true, proposals: visible });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Erreur liste propositions', error: String(e) });
  }
});

router.get('/proposals/count', verifyToken, requireRole(['delegue','prof','admin']), async (req, res) => {
  try {
    const count = await EventProposal.countDocuments({ status: 'pending' });
    res.json({ success: true, count });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Erreur compteur propositions', error: String(e) });
  }
});

router.get('/proposals/feed', verifyToken, async (req, res) => {
  try {
    const all = await EventProposal.find({ status: 'pending' })
      .sort({ createdAt: -1 })
      .populate('proposedBy', 'username groupe year proposalBlocked');
    const filtered = all.filter(p => canAccessProposal(req.user, p));
    res.json({ success: true, proposals: filtered });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Erreur feed propositions', error: String(e) });
  }
});

router.get('/proposals/feed/count', verifyToken, async (req, res) => {
  try {
    const all = await EventProposal.find({ status: 'pending' })
      .populate('proposedBy', 'proposalBlocked');
    const filtered = all.filter(p => canAccessProposal(req.user, p) && !(p?.proposedBy?.proposalBlocked));
    res.json({ success: true, count: filtered.length });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Erreur compteur feed', error: String(e) });
  }
});

// Feed des propositions visibles (pour les étudiants)

// Détail d'une proposition (visionnage par délégué/prof/admin)
router.get('/proposals/:id([0-9a-fA-F]{24})', verifyToken, requireRole(['delegue','prof','admin']), async (req, res) => {
  try {
    const prop = await EventProposal.findById(req.params.id)
      .populate('proposedBy', 'username groupe year');
    if (!prop) return res.status(404).json({ success: false, message: 'Proposition introuvable' });
    res.json({ success: true, proposal: prop });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Erreur détail proposition', error: String(e) });
  }
});

router.post('/proposals/:id/validate', verifyToken, requireRole(['delegue','prof','admin']), async (req, res) => {
  try {
    const prop = await EventProposal.findById(req.params.id);
    if (!prop || prop.status !== 'pending') return res.status(404).json({ success: false, message: 'Proposition introuvable' });
    const ev = await Event.create({
      titre: prop.titre,
      date: prop.date,
      heure: prop.heure,
      groupe: prop.groupe,
      groupes: Array.isArray(prop.groupes) ? prop.groupes : [],
      type: prop.type,
      matiere: prop.matiere,
      specialite: String(prop.specialite || ''),
      year: String(prop.year || ''),
      createdBy: req.user.id,
      description: sanitizeHtml(prop.description || ''),
      attachments: Array.isArray(prop.attachments) ? prop.attachments : [],
      submissionEnabled: !!prop.submissionEnabled,
      checkedBy: Array.isArray(prop.checkedBy) ? prop.checkedBy : [],
      archivedBy: Array.isArray(prop.archivedBy) ? prop.archivedBy : []
    });
    prop.status = 'validated';
    prop.reviewedBy = req.user.id;
    prop.reviewedAt = new Date();
    await prop.save();

    try {
      if (ev && ev.type !== 'exam') {
        const [h, m] = (ev.heure || '').split(':');
        const target = new Date(ev.date);
        target.setHours(Number(h), Number(m || 0), 0, 0);
        const now = new Date();
        const isLate = now > target;
        if (!isLate && Array.isArray(ev.checkedBy) && ev.checkedBy.length) {
          for (const uid of ev.checkedBy) {
            try {
              const u = await User.findById(uid);
              if (u) {
                u.completedTasks = (u.completedTasks || 0) + 1;
                let isOfficial = false;
                try {
                  if (ev && ev.createdBy) {
                    const creator = await User.findById(ev.createdBy);
                    isOfficial = !!creator && String(creator.role || '') === 'delegue';
                  }
                } catch {}
                if (isOfficial) {
                  u.repeatable = u.repeatable || {};
                  function incAndAward(key, threshold, amount) {
                    u.repeatable[key] = Math.max(0, Number(u.repeatable[key] || 0)) + 1;
                    if (u.repeatable[key] >= threshold) {
                      u.repeatable[key] -= threshold;
                      u.coins = (u.coins || 0) + amount;
                      u.achievements = u.achievements || {}; u.achievements.repeatCompleted = Math.max(0, Number(u.achievements.repeatCompleted||0)) + 1;
                    }
                  }
                  incAndAward('tasks10', 10, 50);
                  incAndAward('tasks25', 25, 120);
                  incAndAward('tasks50', 50, 300);
                }
                function award(id) {
                  u.achievementsCompleted = Array.isArray(u.achievementsCompleted) ? u.achievementsCompleted : [];
                  if (!u.achievementsCompleted.includes(id)) u.achievementsCompleted.push(id);
                }
                const t = Math.max(0, Number(u.completedTasks||0));
                if (t === 10) award('tasks-validate-10');
                if (t === 50) award('tasks-validate-50');
                if (t === 100) award('tasks-validate-100');
                if (t === 250) award('tasks-validate-250');
                await u.save();
              }
            } catch {}
          }
        }
      }
    } catch {}

    res.json({ success: true, event: ev });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Erreur validation proposition', error: String(e) });
  }
});
/* bloc de validation supprimé — propositions désactivées */

router.post('/proposals/:id/reject', verifyToken, requireRole(['delegue', 'prof', 'admin']), async (req, res) => {
  try {
    const prop = await EventProposal.findById(req.params.id);
    if (!prop || prop.status !== 'pending') return res.status(404).json({ success: false, message: 'Proposition introuvable' });
    prop.status = 'rejected';
    prop.reviewedBy = req.user.id;
    prop.reviewedAt = new Date();
    prop.rejectionReason = String(req.body?.reason || '');
    await prop.save();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Erreur rejet', error: String(e) });
  }
});

router.post('/proposals/:id/attachments', verifyToken, upload.array('files', 10), async (req, res) => {
  try {
    const prop = await EventProposal.findById(req.params.id);
    if (!prop) return res.status(404).json({ success: false, message: 'Proposition introuvable' });
    const now = new Date();
    const files = (req.files || []).map(f => ({
      filename: f.filename,
      url: `/uploads/events/${f.filename}`,
      mime: f.mimetype,
      size: f.size,
      originalname: f.originalname,
      uploadedBy: req.user.id,
      uploadedAt: now
    }));
    prop.attachments = [...(prop.attachments || []), ...files];
    await prop.save();
    res.json({ success: true, files });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Erreur upload pièces', error: String(e) });
  }
});

// Mettre à jour sa propre proposition (auteur ou délégue/prof/admin) — champs simples et groupes
router.post('/proposals/:id/update-self', verifyToken, async (req, res) => {
  try {
    const prop = await EventProposal.findById(req.params.id);
    if (!prop || prop.status !== 'pending') return res.status(404).json({ success: false, message: 'Proposition introuvable' });

    const requesterId = String(req.user.id || req.user._id);
    const isAuthor = String(prop.proposedBy) === requesterId;
    const isPrivileged = ['delegue','prof','admin'].includes(String(req.user.role || ''));
    if (!isAuthor && !isPrivileged) return res.status(403).json({ success: false, message: 'Non autorisé' });

    const payload = { ...req.body };
    if (typeof payload.description === 'string') payload.description = sanitizeHtml(payload.description);

    if (Array.isArray(payload.groupes)) {
      const groups = payload.groupes.filter(g => typeof g === 'string' && g.length);
      prop.groupes = groups;
      if (!groups.includes(prop.groupe)) prop.groupe = groups[0] || 'Promo';
    }
    if (typeof payload.groupe === 'string' && payload.groupe.length) prop.groupe = payload.groupe;

    ['titre','matiere','date','heure','type','year','specialite'].forEach(k => {
      if (typeof payload[k] === 'string') prop[k] = payload[k];
    });
    if (typeof payload.submissionEnabled === 'boolean') prop.submissionEnabled = payload.submissionEnabled;
    if (typeof payload.description === 'string') prop.description = payload.description;

    await prop.save();
    res.json({ success: true, proposal: prop });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Erreur mise à jour proposition', error: String(e) });
  }
});

// Mes propositions créées
router.get('/proposals/mine', verifyToken, async (req, res) => {
  try {
    const proposals = await EventProposal.find({ proposedBy: req.user.id, status: 'pending' }).sort({ createdAt: -1 });
    res.json({ success: true, proposals });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Erreur liste mes propositions', error: String(e) });
  }
});

// Propositions que j’ai acceptées (liste personnelle)
router.get('/proposals/accepted', verifyToken, async (req, res) => {
  try {
    const proposals = await EventProposal.find({ acceptedBy: req.user.id, status: 'pending' }).sort({ createdAt: -1 });
    res.json({ success: true, proposals });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Erreur liste propositions acceptées', error: String(e) });
  }
});

// Accepter une proposition pour soi (ne crée pas d’événement, pas de points leaderboard)
router.post('/proposals/:id/accept', verifyToken, async (req, res) => {
  try {
    const prop = await EventProposal.findById(req.params.id);
    if (!prop || prop.status !== 'pending') return res.status(404).json({ success: false, message: 'Proposition introuvable' });
    if (!canAccessProposal(req.user, prop)) return res.status(403).json({ success: false, message: 'Proposition non accessible' });
    await EventProposal.updateOne({ _id: prop._id, acceptedBy: { $ne: req.user.id } }, { $addToSet: { acceptedBy: req.user.id } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Erreur acceptation', error: String(e) });
  }
});

// Retirer une proposition de ma liste personnelle
router.post('/proposals/:id/unaccept', verifyToken, async (req, res) => {
  try {
    const prop = await EventProposal.findById(req.params.id);
    if (!prop || prop.status !== 'pending') return res.status(404).json({ success: false, message: 'Proposition introuvable' });
    await EventProposal.updateOne({ _id: prop._id, acceptedBy: req.user.id }, { $pull: { acceptedBy: req.user.id } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Erreur retrait acceptation', error: String(e) });
  }
});

// Suppression d'une proposition par son auteur (étudiant)
router.delete('/proposals/:id', verifyToken, async (req, res) => {
  try {
    const prop = await EventProposal.findById(req.params.id);
    if (!prop || prop.status !== 'pending') {
      return res.status(404).json({ success: false, message: 'Proposition introuvable' });
    }
    const isAuthor = String(prop.proposedBy) === String(req.user.id);
    const isAdmin = String(req.user.role || '') === 'admin';
    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Accès réservé à l’auteur ou à l’admin' });
    }
    await prop.deleteOne();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Erreur suppression proposition', error: String(e) });
  }
});

// Marquer/démarquer une proposition (sans points leaderboard)
router.post('/proposals/:id/check', verifyToken, async (req, res) => {
  try {
    const prop = await EventProposal.findById(req.params.id);
    if (!prop || prop.status !== 'pending') return res.status(404).json({ success: false, message: 'Proposition introuvable' });
    if (prop.type === 'exam') return res.status(403).json({ success: false, message: 'Les examens ne peuvent pas être validés.' });
    const isAuthor = String(prop.proposedBy) === String(req.user.id);
    const isAccepted = Array.isArray(prop.acceptedBy) && prop.acceptedBy.map(String).includes(String(req.user.id));
    if (!isAuthor && !isAccepted) return res.status(403).json({ success: false, message: 'Accès réservé à l’auteur ou aux personnes ayant accepté la proposition' });
    await EventProposal.updateOne({ _id: prop._id, checkedBy: { $ne: req.user.id } }, { $addToSet: { checkedBy: req.user.id } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Erreur validation proposition', error: String(e) });
  }
});
router.post('/proposals/:id/uncheck', verifyToken, async (req, res) => {
  try {
    const prop = await EventProposal.findById(req.params.id);
    if (!prop || prop.status !== 'pending') return res.status(404).json({ success: false, message: 'Proposition introuvable' });
    if (prop.type === 'exam') return res.status(403).json({ success: false, message: 'Les examens ne peuvent pas être (dé)validés.' });
    const isAuthor = String(prop.proposedBy) === String(req.user.id);
    const isAccepted = Array.isArray(prop.acceptedBy) && prop.acceptedBy.map(String).includes(String(req.user.id));
    if (!isAuthor && !isAccepted) return res.status(403).json({ success: false, message: 'Accès réservé à l’auteur ou aux personnes ayant accepté la proposition' });
    await EventProposal.updateOne({ _id: prop._id, checkedBy: req.user.id }, { $pull: { checkedBy: req.user.id } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Erreur dévalidation proposition', error: String(e) });
  }
});

// Archiver une proposition (pour soi)
router.post('/proposals/:id/archive', verifyToken, async (req, res) => {
  try {
    const prop = await EventProposal.findById(req.params.id);
    if (!prop || prop.status !== 'pending') return res.status(404).json({ success: false, message: 'Proposition introuvable' });
    const isAuthor = String(prop.proposedBy) === String(req.user.id);
    const isAccepted = Array.isArray(prop.acceptedBy) && prop.acceptedBy.map(String).includes(String(req.user.id));
    if (!isAuthor && !isAccepted) return res.status(403).json({ success: false, message: 'Accès réservé à l’auteur ou aux personnes ayant accepté la proposition' });
    await EventProposal.updateOne({ _id: prop._id }, { $addToSet: { archivedBy: req.user.id } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Erreur archivage proposition', error: String(e) });
  }
});

// Désarchiver une proposition (pour soi)
router.post('/proposals/:id/unarchive', verifyToken, async (req, res) => {
  try {
    const prop = await EventProposal.findById(req.params.id);
    if (!prop || prop.status !== 'pending') return res.status(404).json({ success: false, message: 'Proposition introuvable' });
    const isAuthor = String(prop.proposedBy) === String(req.user.id);
    const isAccepted = Array.isArray(prop.acceptedBy) && prop.acceptedBy.map(String).includes(String(req.user.id));
    if (!isAuthor && !isAccepted) return res.status(403).json({ success: false, message: 'Accès réservé à l’auteur ou aux personnes ayant accepté la proposition' });
    await EventProposal.updateOne({ _id: prop._id }, { $pull: { archivedBy: req.user.id } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Erreur désarchivage proposition', error: String(e) });
  }
});

module.exports = router;