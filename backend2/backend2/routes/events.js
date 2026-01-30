// @ts-nocheck
const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Subject = require('../models/Subject');
const { verifyToken, requireRole } = require('../middlewares/auth');
const fs = require('fs');
const StaticSubjectRule = require('../models/StaticSubjectRule');
const path = require('path');
const multer = require('multer');
let archiver;
try {
  archiver = require('archiver');
} catch (e) {
  archiver = null;
  console.warn('Le module "archiver" est absent. Les ZIP de soumissions seront désactivés.');
}

function ensureDir(p) {
  try { fs.mkdirSync(p, { recursive: true }); } catch {}
}
const uploadsRoot = path.resolve(__dirname, '..', 'uploads');
const eventsUploadDir = path.join(uploadsRoot, 'events');
ensureDir(eventsUploadDir);

// Multer config: pièces jointes d’événements
const storageEvents = multer.diskStorage({
  destination: (req, file, cb) => cb(null, eventsUploadDir),
  filename: (req, file, cb) => {
    const id = req.params.id || 'unknown';
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const ext = path.extname(safeName) || '';
    const base = path.basename(safeName, ext);
    cb(null, `${id}-${Date.now()}-${base}${ext}`);
  }
});

const allowedExts = new Set(['.pdf', '.doc', '.docx', '.zip', '.rar']);
const allowedMimes = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/zip',
  'application/x-zip-compressed',
  'application/x-rar-compressed',
  'application/x-rar'
]);
const uploadEvents = multer({
  storage: storageEvents,
  limits: { fileSize: 25 * 1024 * 1024, files: 5 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExts.has(ext) || allowedMimes.has(file.mimetype)) cb(null, true);
    else cb(new Error('Type de fichier non autorisé (PDF/DOC/DOCX/ZIP/RAR)'));
  }
});

// Lister les pièces jointes d’un événement
router.get('/:id/attachments', verifyToken, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).select('attachments');
    if (!event) return res.status(404).json({ message: 'Événement non trouvé' });
    return res.json(event.attachments || []);
  } catch (e) {
    console.error('GET attachments error:', e);
    return res.status(500).json({ message: 'Erreur serveur lors de la récupération des pièces jointes' });
  }
});

// Sanitation minimale côté serveur pour descriptions HTML
function sanitizeHtml(input) {
  try {
    if (!input) return '';
    let html = String(input);
    // Supprimer balises potentiellement dangereuses
    html = html.replace(/<\s*(script|iframe|object|embed|link|meta)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '');
    html = html.replace(/<\s*(script|iframe|object|embed|link|meta)[^>]*\/>/gi, '');
    // Supprimer les handlers inline (onClick, onError, etc.)
    html = html.replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
    // Neutraliser les href/src="javascript:..."
    html = html.replace(/(href|src)\s*=\s*(['"])\s*javascript:[^'"]*\2/gi, '$1="#"');
    return html;
  } catch {
    return '';
  }
}

// Fonction utilitaire pour normaliser l'année
function normalizeYear(year) {
  if (!year) return '';
  let y = year.replace(/\s+/g, '').toUpperCase();
  if (y === 'BUT1' || y === '1') return '1';
  if (y === 'BUT2' || y === '2') return '2';
  if (y === 'BUT3' || y === '3') return '3';
  return y;
}

// Fonction utilitaire pour normaliser le groupe (insensible à la casse)
function normalizeGroupe(groupe) {
  if (!groupe) return '';
  return groupe.replace(/\s+/g, '').toUpperCase();
}

// AJOUT: Helpers pour gérer l'expiration des examens
function parseTargetDate(ev) {
  const [h, m] = (ev.heure || '').split(':');
  const target = new Date(ev.date);
  target.setHours(Number(h), Number(m || 0), 0, 0);
  return target;
}

async function cleanupExpiredExams() {
  try {
    const exams = await Event.find({ type: 'exam' }).select('_id date heure');
    const now = new Date();
    for (const ev of exams) {
      const target = parseTargetDate(ev);
      if (now > target) {
        await Event.deleteOne({ _id: ev._id });
      }
    }
  } catch (e) {
    console.error('Erreur cleanup examens expirés:', e);
  }
}

// Récupérer tous les événements avec filtrage
router.get('/', verifyToken, async (req, res) => {
  try {
    // AJOUT: supprimer automatiquement les examens expirés avant de renvoyer la liste
    await cleanupExpiredExams();

    const { id: userId, role, year, groupe, specialite } = req.user;
    console.log(`=== RÉCUPÉRATION ÉVÉNEMENTS ===`);
    console.log(`Utilisateur: ${req.user.username}, Rôle: ${role}, Année: ${year}, Groupe: ${groupe}`);
    fs.appendFileSync('debug.log', `User: ${req.user.username}, Role: ${role}, Year: ${year}, Groupe: ${groupe}\\n`);
    const normalizedYear = normalizeYear(year);
    const normalizedGroupe = (groupe || '').toUpperCase();

    let query = {};
    if (role !== 'admin' && role !== 'prof') {
      // Logique pour les étudiants et délégués (pas les profs ni les admins)
      const possibleYears = [normalizedYear];
      if (normalizedYear === '1') possibleYears.push('BUT1', 'BUT 1', 1);
      if (normalizedYear === '2') possibleYears.push('BUT2', 'BUT 2', 2);
      if (normalizedYear === '3') possibleYears.push('BUT3', 'BUT 3', 3);

      query = {
        $and: [
          { year: { $in: possibleYears } },
          {
            $or: [
              { groupe: { $regex: `^${normalizedGroupe}$`, $options: 'i' } },
              { groupe: 'Promo' },
              { groupes: { $in: [groupe, 'Promo'] } }
            ]
          },
          // Filtrage par spécialité: si l'utilisateur a une spécialité, accepter événements sans spécialité ou même spécialité
          ...(specialite ? [{ $or: [ { specialite: { $in: [null, ''] } }, { specialite } ] }] : [])
        ]
      };
    }

    // Filtrage matière via règles statiques (si l'événement correspond à une matière statique connue)
    try {
      const rules = await StaticSubjectRule.find({}).lean();
      const rulesByName = new Map(rules.map(r => [String(r.subjectName).toLowerCase(), r]));
      // Charger aussi les matières dynamiques pour appliquer leurs règles (années / groupes / spécialités)
      const subjects = await Subject.find({}).lean();
      const dynByName = new Map(subjects.map(s => [String(s.name).toLowerCase(), s]));

      const candidateEvents = await Event.find({
        ...(role === 'admin' || role === 'prof' ? {} : query),
        $or: [
          { deletedBy: { $exists: false } },
          { deletedBy: { $size: 0 } },
          { deletedBy: { $nin: [req.user.id] } }
        ]
      });
      const filtered = candidateEvents.filter(ev => {
        const matiereKey = String(ev.matiere || '').toLowerCase();
        const dyn = dynByName.get(matiereKey);
        const rule = rulesByName.get(matiereKey);

        // Helper pour évaluer une règle (statique ou dynamique)
        function passesRule(r) {
          if (!r) return true;
          // Années
          const years = Array.isArray(r.yearsAllowed) ? r.yearsAllowed : [];
          if (years.length && !years.includes(year)) return false;
          // Groupes
          const allowedGroups = Array.isArray(r.groupsAllowed) ? r.groupsAllowed : [];
          const gNorm = (groupe || '').toString();
          if (allowedGroups.length && !(allowedGroups.includes('Promo') || allowedGroups.includes(gNorm))) return false;
          // Spécialités
          const specs = Array.isArray(r.specialitesAllowed) ? r.specialitesAllowed : [];
          if (specs.length) {
            if (!specialite) return false;
            if (!specs.includes(specialite)) return false;
          }
          return true;
        }

        // Appliquer la règle dynamique si elle existe, sinon la statique; si les deux existent, exiger les deux
        if (role === 'admin' || role === 'prof') return true; // prof/admin voient tout
        const dynOk = passesRule(dyn);
        const statOk = passesRule(rule);
        return dynOk && statOk;
      });
      const eventsWithStatus = filtered.map(event => {
        const isArchived = event.archivedBy && event.archivedBy.map(id => id.toString()).includes(userId);
        const isChecked = event.checkedBy && event.checkedBy.map(id => id.toString()).includes(userId);
        return { ...event.toObject(), archived: isArchived, checked: isChecked };
      });
      return res.json(eventsWithStatus);
    } catch (e) {
      // En cas d'erreur règles, fallback au comportement précédent
    }
    // Pour les profs et admins : pas de filtre (voient tous les événements)
    if (role === 'prof' || role === 'admin') {
      console.log(`${role === 'prof' ? 'Professeur' : 'Admin'} - Affichage de tous les événements`);
      fs.appendFileSync('debug.log', `${role === 'prof' ? 'Professeur' : 'Admin'} - Affichage de tous les événements\\n`);
    }
    fs.appendFileSync('debug.log', 'Query utilisée: ' + JSON.stringify(query) + '\\n');
    // Exclure les événements "supprimés" individuellement par cet utilisateur
    // Si on arrive ici, on renvoie sans filtre statique (sécurité)
    const events = await Event.find({
      ...(role === 'admin' || role === 'prof' ? {} : query),
      $or: [
        { deletedBy: { $exists: false } },
        { deletedBy: { $size: 0 } },
        { deletedBy: { $nin: [req.user.id] } }
      ]
    });
    const eventsWithStatus = events.map(event => {
      const isArchived = event.archivedBy && event.archivedBy.map(id => id.toString()).includes(userId);
      const isChecked = event.checkedBy && event.checkedBy.map(id => id.toString()).includes(userId);
      return { ...event.toObject(), archived: isArchived, checked: isChecked };
    });
    res.json(eventsWithStatus);
  } catch (error) {
    console.error('Erreur critique dans GET /events:', error);
    res.status(500).json({ message: "Erreur serveur lors de la récupération des événements.", error: error.message });
  }
});

// Version sans authentification pour debug
router.get('/all', verifyToken, requireRole(['admin', 'prof']), async (req, res) => {
  try {
    const events = await Event.find({});
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des événements.', error: error.message });
  }
});

// Ajouter un événement
router.post('/', verifyToken, requireRole(['admin', 'prof', 'delegue']), async (req, res) => {
  const payload = { ...req.body };
  // Nettoyage des champs facultatifs
  if (payload.specialite === undefined) payload.specialite = '';
  if (typeof payload.description === 'string') {
    payload.description = sanitizeHtml(payload.description);
  }

  // Assurer la présence de `groupe` (champ requis du schéma) à partir de `groupes`
  if (!payload.groupe) {
    if (Array.isArray(payload.groupes) && payload.groupes.length > 0) {
      payload.groupe = payload.groupes.includes('Promo') ? 'Promo' : payload.groupes[0];
    } else {
      payload.groupe = 'Promo'; // valeur par défaut sûre
    }
  }

  const event = new Event({ ...payload, createdBy: req.user.id });
  await event.save();
  res.json(event);
});

// Vider pour SOI (POST): marque l'événement comme supprimé pour l'utilisateur courant
router.post('/:id/delete', verifyToken, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Événement non trouvé' });

    const role = req.user.role;
    const needsSubmission = role === 'eleve' || role === 'etudiant' || role === 'delegue';
    if (needsSubmission && event.submissionEnabled) {
      const mine = (event.submissions || []).find(s => String(s.user) === String(req.user.id));
      const hasFiles = Array.isArray(mine?.files) && mine.files.length > 0;
      if (!hasFiles) {
        return res.status(400).json({ message: 'Cette tâche a une boîte de dépôt activée. Déposez au moins un fichier avant de la masquer.' });
      }
    }

    await Event.updateOne({ _id: req.params.id }, { $addToSet: { deletedBy: req.user.id } });
    return res.json({ message: 'Événement masqué pour cet utilisateur' });
  } catch (e) {
    console.error('Erreur masquage (POST):', e);
    return res.status(500).json({ message: 'Erreur masquage' });
  }
});

// Vider pour SOI (DELETE): marque l'événement comme supprimé pour l'utilisateur courant
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Événement non trouvé' });

    const role = req.user.role;
    const needsSubmission = role === 'eleve' || role === 'etudiant' || role === 'delegue';
    if (needsSubmission && event.submissionEnabled) {
      const mine = (event.submissions || []).find(s => String(s.user) === String(req.user.id));
      const hasFiles = Array.isArray(mine?.files) && mine.files.length > 0;
      if (!hasFiles) {
        return res.status(400).json({ message: 'Cette tâche a une boîte de dépôt activée. Déposez au moins un fichier avant de la masquer.' });
      }
    }

    await Event.updateOne({ _id: req.params.id }, { $addToSet: { deletedBy: req.user.id } });
    return res.json({ message: 'Événement masqué pour cet utilisateur' });
  } catch (error) {
    console.error('Erreur lors du masquage:', error);
    return res.status(500).json({ message: 'Erreur lors du masquage pour cet utilisateur' });
  }
});

// Suppression globale d'un événement (admin seulement)
router.delete('/:id/hard', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Événement non trouvé' });
    await Event.deleteOne({ _id: req.params.id });
    return res.json({ success: true });
  } catch (error) {
    console.error('Erreur suppression HARD:', error);
    return res.status(500).json({ message: 'Erreur suppression' });
  }
});

// Modifier un événement
router.put('/:id', verifyToken, requireRole(['admin', 'prof']), async (req, res) => {
  const payload = { ...req.body };
  // Ne pas écraser la spécialité si non envoyée
  if (Object.prototype.hasOwnProperty.call(payload, 'specialite')) {
    payload.specialite = String(payload.specialite || '');
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'description') && typeof payload.description === 'string') {
    payload.description = sanitizeHtml(payload.description);
  }
  const event = await Event.findByIdAndUpdate(
    req.params.id,
    { $set: payload },
    { new: true }
  );
  res.json(event);
});

// Archiver un événement
router.post('/:id/archive', verifyToken, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Événement non trouvé' });

    const role = req.user.role;
    const needsSubmission = role === 'eleve' || role === 'etudiant' || role === 'delegue';

    if (needsSubmission && event.submissionEnabled) {
      const mine = (event.submissions || []).find(s => String(s.user) === String(req.user.id));
      const hasFiles = Array.isArray(mine?.files) && mine.files.length > 0;
      if (!hasFiles) {
        return res.status(400).json({ success: false, message: 'Déposez au moins un fichier dans la boîte de dépôt avant d’archiver cette tâche.' });
      }
    }

    await Event.updateOne({ _id: req.params.id }, { $addToSet: { archivedBy: req.user.id } });
    res.json({ success: true });
  } catch (e) {
    console.error('Erreur lors de l’archivage:', e);
    res.status(500).json({ success: false, message: 'Erreur lors de l’archivage de la tâche' });
  }
});

// Désarchiver un événement
router.post('/:id/unarchive', verifyToken, async (req, res) => {
  await Event.updateOne({ _id: req.params.id }, { $pull: { archivedBy: req.user.id } });
  res.json({ success: true });
});

// Valider (cocher) un événement
router.post('/:id/check', verifyToken, async (req, res) => {
  try {
    // Récupérer l'événement pour vérifier s'il est en retard
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Événement non trouvé' });
    }

    // AJOUT: interdiction de valider les examens
    if (event.type === 'exam') {
      return res.status(403).json({ success: false, message: 'Les examens ne peuvent pas être validés.' });
    }

    // Vérifier si la tâche est en retard
    const [h, m] = (event.heure || '').split(':');
    const target = new Date(event.date);
    target.setHours(Number(h), Number(m || 0), 0, 0);
    const now = new Date();
    const isLate = now > target;

    // AJOUT: exiger un dépôt pour les tâches NON en retard si une boîte de dépôt est activée
    const role = req.user.role;
    const needsSubmission = role === 'eleve' || role === 'etudiant' || role === 'delegue';
    if (!isLate && needsSubmission && event.submissionEnabled) {
      const mine = (event.submissions || []).find(s => String(s.user) === String(req.user.id));
      const hasFiles = Array.isArray(mine?.files) && mine.files.length > 0;
      if (!hasFiles) {
        return res.status(400).json({ success: false, message: 'Déposez au moins un fichier dans la boîte de dépôt avant de valider cette tâche.' });
      }
    }

    // Mise à jour atomique — n'ajouter que si l'utilisateur n'est pas déjà
    const updateRes = await Event.updateOne(
      { _id: req.params.id, checkedBy: { $ne: req.user.id } },
      { $addToSet: { checkedBy: req.user.id } }
    );

    // Incrémenter uniquement si on vient d'ajouter l'utilisateur et que la tâche n'est PAS en retard
    if (updateRes.modifiedCount > 0 && !isLate) {
      const User = require('../models/User');
      await User.findByIdAndUpdate(req.user.id, { $inc: { completedTasks: 1 } });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de la validation de la tâche:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la validation de la tâche' });
  }
});

// Dévalider (décocher) un événement
router.post('/:id/uncheck', verifyToken, async (req, res) => {
  try {
    // Récupérer l'événement pour vérifier s'il était en retard
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Événement non trouvé' });
    }

    // Cohérence: interdiction aussi pour les examens
    if (event.type === 'exam') {
      return res.status(403).json({ success: false, message: 'Les examens ne peuvent pas être (dé)validés.' });
    }

    // Vérifier si la tâche était en retard au moment de la validation
    const [h, m] = (event.heure || '').split(':');
    const target = new Date(event.date);
    target.setHours(Number(h), Number(m || 0), 0, 0);
    const now = new Date();
    const isLate = now > target;

    // AJOUT: mise à jour atomique — ne retire que si l'utilisateur est bien présent
    const updateRes = await Event.updateOne(
      { _id: req.params.id, checkedBy: req.user.id },
      { $pull: { checkedBy: req.user.id } }
    );

    // Décrémenter uniquement si on vient effectivement de retirer l'utilisateur et que ce n'était pas en retard
    if (updateRes.modifiedCount > 0 && !isLate) {
      const User = require('../models/User');
      await User.findByIdAndUpdate(req.user.id, { $inc: { completedTasks: -1 } });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de la dévalidation de la tâche:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la dévalidation de la tâche' });
  }
});

module.exports = router;
// Uploader des PDF/DOCX pour un événement
router.post('/:id/attachments', verifyToken, requireRole(['admin', 'prof', 'delegue']), uploadEvents.array('files', 10), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Événement non trouvé' });

    const baseUrl = '/uploads/events/';
    const attachments = (req.files || []).map(f => ({
      filename: f.filename,
      url: `${baseUrl}${f.filename}`,
      mime: f.mimetype,
      size: f.size,
      originalname: f.originalname,
      uploadedBy: req.user.id,
      uploadedAt: new Date()
    }));

    event.attachments = [...(event.attachments || []), ...attachments];
    if (!event.archLink && attachments.length > 0) {
      event.archLink = attachments[0].url;
    }
    await event.save();

    return res.json({ success: true, attachments });
  } catch (e) {
    console.error('POST attachments error:', e);
    return res.status(500).json({ message: 'Erreur serveur lors de l’upload des pièces jointes' });
  }
});

// Supprimer une pièce jointe d’un événement
router.delete('/:id/attachments/:filename', verifyToken, requireRole(['admin', 'prof', 'delegue']), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Événement non trouvé' });

    const { filename } = req.params;
    const prev = event.attachments || [];
    const att = prev.find(a => a.filename === filename);
    if (!att) return res.status(404).json({ message: 'Pièce jointe non trouvée' });

    // Retirer du tableau
    event.attachments = prev.filter(a => a.filename !== filename);

    // Ajuster archLink si nécessaire
    if (event.archLink && (event.archLink.endsWith(`/${filename}`) || event.archLink === att.url)) {
      event.archLink = (event.attachments[0]?.url) || '';
    }

    await event.save();

    // Supprimer le fichier sur disque (silencieux)
    try {
      const filePath = path.join(eventsUploadDir, filename);
      const resolved = path.resolve(filePath);
      if (resolved.startsWith(path.resolve(eventsUploadDir))) {
        fs.unlinkSync(resolved);
      }
    } catch (e) {
      console.warn('unlink attachment failed:', e?.message || e);
    }

    return res.json({ success: true, attachments: event.attachments });
  } catch (e) {
    console.error('DELETE attachment error:', e);
    return res.status(500).json({ message: 'Erreur lors de la suppression de la pièce jointe' });
  }
});

// Téléchargement direct d'une pièce jointe avec le nom d'origine
router.get('/:id/attachments/:filename/download', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Événement non trouvé' });

    const { filename } = req.params;
    const att = (event.attachments || []).find(a => a.filename === filename);
    if (!att) return res.status(404).json({ message: 'Pièce jointe non trouvée' });

    const filePath = path.join(eventsUploadDir, filename);
    const resolved = path.resolve(filePath);
    // Sécurité: s'assurer qu'on reste dans /uploads/events
    if (!resolved.startsWith(path.resolve(eventsUploadDir))) {
      return res.status(400).json({ message: 'Chemin invalide' });
    }

    // Envoi du fichier avec nom d'origine
    return res.download(resolved, att?.originalname || filename);
  } catch (e) {
    console.error('DOWNLOAD attachment error:', e);
    return res.status(500).json({ message: 'Erreur lors du téléchargement' });
  }
});

// Répertoire pour soumissions
const submissionsUploadDir = path.join(__dirname, '..', 'uploads', 'submissions');
if (!fs.existsSync(submissionsUploadDir)) {
  fs.mkdirSync(submissionsUploadDir, { recursive: true });
}

// Multer: stockage des soumissions
const storageSubmissions = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, submissionsUploadDir);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '_' + Math.random().toString(36).slice(2);
    cb(null, unique + path.extname(file.originalname));
  }
});
const uploadSubmissions = multer({
  storage: storageSubmissions,
  limits: { fileSize: 25 * 1024 * 1024, files: 10 },
  fileFilter: (req, file, cb) => {
    // Autoriser PDF/DOC/DOCX + archives ZIP/RAR
    const ext = path.extname(file.originalname).toLowerCase();
    const okExt = ['.pdf', '.doc', '.docx', '.zip', '.rar'].includes(ext);
    const okMime = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/zip',
      'application/x-zip-compressed',
      'application/x-rar-compressed',
      'application/x-rar',
      // certains navigateurs envoient application/octet-stream pour .rar/.zip
      'application/octet-stream',
    ].includes(file.mimetype);
    cb(null, okExt || okMime);
  }
});

// Déposer des fichiers (étudiants)
router.post('/:id/submissions', verifyToken, uploadSubmissions.array('files', 10), async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id; // pris depuis verifyToken
    const Event = require('../models/Event');
    const ev = await Event.findById(eventId);
    if (!ev) return res.status(404).json({ error: 'Event not found' });
    if (!ev.submissionEnabled) return res.status(400).json({ error: 'Submissions disabled' });

    const now = new Date();
    const files = (req.files || []).map(f => ({
      filename: f.filename,
      originalname: f.originalname,
      size: f.size,
      mimetype: f.mimetype,
      createdAt: now
    }));

    // Capture optional rich message from student (sanitized HTML)
    const msgRaw = String(req.body?.messageHtml || '');
    const messageHtml = sanitizeHtml(msgRaw);

    const existingIndex = (ev.submissions || []).findIndex(s => String(s.user) === String(userId));
    if (existingIndex === -1) {
      ev.submissions = [...(ev.submissions || []), { user: userId, files, submittedAt: now, messageHtml }];
    } else {
      const prevSubmittedAt = ev.submissions[existingIndex]?.submittedAt || now;
      const already = Array.isArray(ev.submissions[existingIndex].files) ? ev.submissions[existingIndex].files : [];
      // Figer l'heure d'origine sur les anciens fichiers (si manquante)
      already.forEach(f => { if (!f.createdAt) f.createdAt = prevSubmittedAt; });
      ev.submissions[existingIndex].files = [...already, ...files];
      ev.submissions[existingIndex].submittedAt = now; // met à jour le “Dernier dépôt”
      ev.submissions[existingIndex].messageHtml = messageHtml;
    }

    await ev.save();
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal error' });
  }
});

// Lister soumissions (prof/admin)
// GET /:id/submissions (prof/admin) — inclure les retours prof
router.get('/:id/submissions', verifyToken, requireRole(['prof', 'admin']), async (req, res) => {
  try {
    const Event = require('../models/Event');
    const User = require('../models/User');
    const mongoose = require('mongoose');

    const ev = await Event.findById(req.params.id).lean();
    if (!ev) return res.status(404).json({ error: 'Event not found' });

    const due = new Date(`${ev.date}T${(ev.heure || '00:00')}:00.000Z`);
    const submissions = (ev.submissions || []).map(s => {
      const lateMs = Math.max(0, new Date(s.submittedAt).getTime() - due.getTime());
      const lateHours = lateMs / 36e5;
      return { ...s, isLate: lateMs > 0, lateMs, lateHours };
    });

    const ids = submissions.map(s => s.user).filter(Boolean);
    const users = await User.find({ _id: { $in: ids } }, { username: 1, name: 1 }).lean();
    const validIds = new Set(users.map(u => String(u._id)));

    // Supprimer les soumissions dont l'utilisateur n'existe plus (orphelines)
    const orphanSubs = submissions.filter(s => !validIds.has(String(s.user)));
    if (orphanSubs.length > 0) {
      // Supprimer les fichiers du disque
      orphanSubs.forEach(s => {
        (s.files || []).forEach(f => {
          try {
            const filePath = path.join(submissionsUploadDir, f.filename);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          } catch {}
        });
      });
      // Nettoyer l'événement en base
      const evDoc = await Event.findById(req.params.id);
      if (evDoc) {
        evDoc.submissions = (evDoc.submissions || []).filter(s => validIds.has(String(s.user)));
        await evDoc.save();
      }
    }

    // Créer la réponse sans soumissions orphelines
    const usersMap = {};
    users.forEach(u => { usersMap[String(u._id)] = u.name || u.username || '—'; });

    const out = submissions
      .filter(s => validIds.has(String(s.user)))
      .map(s => ({
        user: s.user,
        userName: usersMap[String(s.user)] || '—',
        files: s.files,
        submittedAt: s.submittedAt,
        isLate: s.isLate,
        lateHours: s.lateHours,
        messageHtml: s.messageHtml || '',
        teacherFeedbacks: s.teacherFeedbacks || []
      }));

    res.json(out);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal error' });
  }
});

// Téléchargement toutes les soumissions en ZIP (prof/admin)
router.get('/:id/submissions/zip', verifyToken, requireRole(['prof', 'admin']), async (req, res) => {
  if (!archiver) {
    return res.status(503).json({ message: 'ZIP indisponible sur ce serveur' });
  }
  try {
    const ev = await Event.findById(req.params.id).lean();
    if (!ev) return res.status(404).json({ error: 'Event not found' });

    const archive = archiver('zip', { zlib: { level: 9 } });
    // Retirer extension existante du titre et le normaliser
    const rawTitle = String(ev.titre || ev.matiere || `event_${ev._id}`);
    const noExtTitle = rawTitle.replace(/\.[a-z0-9]{1,8}$/i, '');
    const safeTitle = noExtTitle.replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/^_+|_+$/g, '');
    const dlName = `${safeTitle || `event_${ev._id}`}.zip`;
    
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Disposition', `attachment; filename="${dlName}"; filename*=UTF-8''${encodeURIComponent(dlName)}`);

    // Résoudre le nom des élèves pour les dossiers
    const User = require('../models/User');
    const ids = [...new Set((ev.submissions || []).map(s => s.user).filter(Boolean))];
    const users = await User.find({ _id: { $in: ids } }, { username: 1, name: 1 }).lean();
    const nameById = new Map(users.map(u => [
      String(u._id),
      String(u.name || u.username || `user_${String(u._id)}`)
        .replace(/[^a-zA-Z0-9._-]+/g, '_')
        .replace(/^_+|_+$/g, '')
    ]));

    archive.on('error', err => {
      console.error('ZIP error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'ZIP generation failed' });
      } else {
        try { res.end(); } catch {}
      }
    });

    archive.pipe(res);

    (ev.submissions || []).forEach(s => {
      const folder = (nameById.get(String(s.user)) || `user_${String(s.user)}`) + '/';
      (s.files || []).forEach(f => {
        const filePath = path.join(submissionsUploadDir, f.filename);
        if (fs.existsSync(filePath)) {
          const safeFileName = String(f.originalname || f.filename)
            .replace(/[/\\]+/g, '_')
            .replace(/[^a-zA-Z0-9._-]+/g, '_')
            .replace(/^_+|_+$/g, '');
          const nameInZip = folder + (safeFileName || f.filename);
          archive.file(filePath, { name: nameInZip });
        }
      });
    });

    await archive.finalize();
  } catch (e) {
    console.error(e);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal error' });
    }
  }
});

// Commentaires: liste
router.get('/:id/comments', verifyToken, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('comments.user', 'username');
    if (!event) return res.status(404).json({ message: 'Événement non trouvé' });
    const list = (event.comments || []).map(c => ({
      _id: c._id,
      text: c.text,
      createdAt: c.createdAt,
      userId: c.user?._id || c.user,
      username: c.user?.username || null
    }));
    return res.json({ comments: list });
  } catch (e) {
    console.error('GET comments error:', e);
    return res.status(500).json({ message: 'Erreur serveur lors de la récupération des commentaires' });
  }
});

// Commentaires: ajouter
router.post('/:id/comments', verifyToken, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Événement non trouvé' });
    const text = String(req.body.text || '').trim();
    if (!text) return res.status(400).json({ message: 'Message vide' });
    event.comments = [...(event.comments || []), { user: req.user.id, text, createdAt: new Date() }];
    await event.save();
    return res.json({ success: true });
  } catch (e) {
    console.error('POST comment error:', e);
    return res.status(500).json({ message: 'Erreur serveur lors de l’ajout du commentaire' });
  }
});

// Commentaires: liste
router.get('/:id/comments', verifyToken, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('comments.user', 'username');
    if (!event) return res.status(404).json({ message: 'Événement non trouvé' });
    const list = (event.comments || []).map(c => ({
      _id: c._id,
      text: c.text,
      createdAt: c.createdAt,
      userId: c.user?._id || c.user,
      username: c.user?.username || null
    }));
    return res.json({ comments: list });
  } catch (e) {
    console.error('GET comments error:', e);
    return res.status(500).json({ message: 'Erreur serveur lors de la récupération des commentaires' });
  }
});

// Commentaires: ajouter
router.post('/:id/comments', verifyToken, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Événement non trouvé' });
    const text = String(req.body.text || '').trim();
    if (!text) return res.status(400).json({ message: 'Message vide' });
    event.comments = [...(event.comments || []), { user: req.user.id, text, createdAt: new Date() }];
    await event.save();
    return res.json({ success: true });
  } catch (e) {
    console.error('POST comment error:', e);
    return res.status(500).json({ message: 'Erreur serveur lors de l’ajout du commentaire' });
  }
});

// Soumission de l'utilisateur courant (élève/délégué): liste
router.get('/:id/my-submission', verifyToken, async (req, res) => {
  try {
    const ev = await Event.findById(req.params.id).lean();
    if (!ev) return res.status(404).json({ message: 'Événement non trouvé' });
    const mine = (ev.submissions || []).find(s => String(s.user) === String(req.user.id));
    return res.json({
      files: mine?.files || [],
      submittedAt: mine?.submittedAt || null,
      messageHtml: mine?.messageHtml || '',
      teacherFeedbacks: mine?.teacherFeedbacks || []
    });
  } catch (e) {
    console.error('GET my-submission error:', e);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Supprimer un fichier de soumission (élève/délégué)
router.delete('/:id/my-submission/:filename', verifyToken, async (req, res) => {
  try {
    const ev = await Event.findById(req.params.id);
    if (!ev) return res.status(404).json({ message: 'Événement non trouvé' });
    const idx = (ev.submissions || []).findIndex(s => String(s.user) === String(req.user.id));
    if (idx === -1) return res.status(404).json({ message: 'Soumission non trouvée' });

    const filename = req.params.filename;
    const files = ev.submissions[idx]?.files || [];
    const fileIdx = files.findIndex(f => f.filename === filename);
    if (fileIdx === -1) return res.status(404).json({ message: 'Fichier non trouvé' });

    // Suppression physique
    const filePath = path.join(submissionsUploadDir, filename);
    try {
      const resolved = path.resolve(filePath);
      if (resolved.startsWith(path.resolve(submissionsUploadDir)) && fs.existsSync(resolved)) {
        fs.unlinkSync(resolved);
      }
    } catch (e) {
      console.warn('unlink submission file failed:', e?.message || e);
    }

    // Retirer des métadonnées
    files.splice(fileIdx, 1);
    if (!files.length) {
      ev.submissions.splice(idx, 1);
    } else {
      ev.submissions[idx].files = files;
    }
    await ev.save();
    return res.json({ success: true });
  } catch (e) {
    console.error('DELETE my-submission file error:', e);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Téléchargement individuel d’un fichier de soumission (propriétaire ou prof/admin)
router.get('/:id/submissions/:filename/download', verifyToken, async (req, res) => {
  try {
    const ev = await Event.findById(req.params.id);
    if (!ev) return res.status(404).json({ message: 'Événement non trouvé' });

    const filename = req.params.filename;
    const isPrivileged = req.user.role === 'admin' || req.user.role === 'prof';
    const sub = (ev.submissions || []).find(s => (s.files || []).some(f => f.filename === filename));
    if (!sub) return res.status(404).json({ message: 'Fichier non trouvé' });

    const isOwner = String(sub.user) === String(req.user.id);
    if (!isOwner && !isPrivileged) return res.status(403).json({ message: 'Non autorisé' });

    const f = (sub.files || []).find(ff => ff.filename === filename);
    const filePath = path.join(submissionsUploadDir, filename);
    const resolved = path.resolve(filePath);
    if (!resolved.startsWith(path.resolve(submissionsUploadDir))) {
      return res.status(400).json({ message: 'Chemin invalide' });
    }
    return res.download(resolved, f?.originalname || filename);
  } catch (e) {
    console.error('DOWNLOAD submission file error:', e);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
});

// POST /:id/teacher-feedback (prof/admin) — envoyer retours groupés
router.post('/:id/teacher-feedback', verifyToken, requireRole(['prof', 'admin']), async (req, res) => {
  try {
    const ev = await Event.findById(req.params.id);
    if (!ev) return res.status(404).json({ message: 'Événement non trouvé' });

    const raw = String(req.body?.textHtml || '');
    const textHtml = sanitizeHtml(raw);

    const all = req.body?.all === true;
    let targets = [];
    if (all) {
      targets = [...new Set((ev.submissions || []).map(s => String(s.user)))];
    } else {
      const ids = Array.isArray(req.body?.studentIds) ? req.body.studentIds : [];
      targets = [...new Set(ids.map(id => String(id)))];
    }

    if (!targets.length) {
      return res.status(400).json({ message: 'Aucun destinataire' });
    }

    let sent = 0;
    for (const userId of targets) {
      const idx = (ev.submissions || []).findIndex(s => String(s.user) === String(userId));
      if (idx === -1) continue; // n’envoie qu’aux élèves ayant une soumission
      const arr = Array.isArray(ev.submissions[idx].teacherFeedbacks) ? ev.submissions[idx].teacherFeedbacks : [];
      arr.push({ teacher: req.user.id, textHtml, createdAt: new Date() });
      ev.submissions[idx].teacherFeedbacks = arr;
      sent++;
    }

    await ev.save();
    return res.json({ success: true, sentTo: sent });
  } catch (e) {
    console.error('POST teacher-feedback error:', e);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
});

// PUT /:id/teacher-feedback/:fid (prof/admin) — modifier un retour
router.put('/:id/teacher-feedback/:fid', verifyToken, requireRole(['prof', 'admin']), async (req, res) => {
  try {
    const ev = await Event.findById(req.params.id)
    if (!ev) return res.status(404).json({ message: 'Événement non trouvé' })
    const fid = String(req.params.fid || '')
    const raw = String(req.body?.textHtml || '')
    const textHtml = sanitizeHtml(raw)
    if (!textHtml.trim()) return res.status(400).json({ message: 'Message vide' })

    let found = null
    for (const s of ev.submissions || []) {
      for (const fb of s.teacherFeedbacks || []) {
        if (String(fb._id) === fid) { found = { s, fb }; break }
      }
      if (found) break
    }
    if (!found) return res.status(404).json({ message: 'Commentaire non trouvé' })

    const isAdmin = req.user.role === 'admin'
    const isOwner = String(found.fb.teacher) === String(req.user.id)
    if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Non autorisé' })

    found.fb.textHtml = textHtml
    await ev.save()
    return res.json({ success: true })
  } catch (e) {
    console.error('PUT teacher-feedback error:', e)
    return res.status(500).json({ message: 'Erreur serveur' })
  }
})

// DELETE /:id/teacher-feedback/:fid (prof/admin) — supprimer un retour
router.delete('/:id/teacher-feedback/:fid', verifyToken, requireRole(['prof', 'admin']), async (req, res) => {
  try {
    const ev = await Event.findById(req.params.id)
    if (!ev) return res.status(404).json({ message: 'Événement non trouvé' })
    const fid = String(req.params.fid || '')

    let subIdx = -1, fbIdx = -1, authorId = null
    for (let i = 0; i < (ev.submissions || []).length; i++) {
      const s = ev.submissions[i]
      fbIdx = (s.teacherFeedbacks || []).findIndex(fb => String(fb._id) === fid)
      if (fbIdx !== -1) {
        subIdx = i
        authorId = s.teacherFeedbacks[fbIdx]?.teacher
        break
      }
    }
    if (subIdx === -1 || fbIdx === -1) return res.status(404).json({ message: 'Commentaire non trouvé' })

    const isAdmin = req.user.role === 'admin'
    const isOwner = String(authorId) === String(req.user.id)
    if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Non autorisé' })

    ev.submissions[subIdx].teacherFeedbacks.splice(fbIdx, 1)
    await ev.save()
    return res.json({ success: true })
  } catch (e) {
    console.error('DELETE teacher-feedback error:', e)
    return res.status(500).json({ message: 'Erreur serveur' })
  }
})
// PUT /my-submission/message (élève) — modifier la description du dépôt
router.put('/:id/my-submission/message', verifyToken, async (req, res) => {
  try {
    const ev = await Event.findById(req.params.id);
    if (!ev) return res.status(404).json({ message: 'Événement non trouvé' });
    if (!ev.submissionEnabled) return res.status(400).json({ message: 'Dépôt désactivé' });

    const raw = String(req.body?.messageHtml || '');
    const messageHtml = sanitizeHtml(raw);

    const idx = (ev.submissions || []).findIndex(s => String(s.user) === String(req.user.id));
    if (idx === -1) {
      ev.submissions = [...(ev.submissions || []), {
        user: req.user.id,
        files: [],
        submittedAt: new Date(),
        messageHtml
      }];
    } else {
      ev.submissions[idx].messageHtml = messageHtml;
    }

    await ev.save();
    return res.json({ success: true });
  } catch (e) {
    console.error('PUT my-submission message error:', e);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
});
