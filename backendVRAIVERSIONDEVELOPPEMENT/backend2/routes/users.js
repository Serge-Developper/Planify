// @ts-nocheck
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Coins = require('../models/Coins');
const Faction = require('../models/Faction');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { verifyToken, requireRole } = require('../middlewares/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
let webpush;
try { webpush = require('web-push'); } catch {}
const VAPID_PUBLIC_KEY = process.env.PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.PRIVATE_KEY || process.env.VAPID_PRIVATE_KEY || '';
try { if (webpush && VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) { webpush.setVapidDetails('mailto:admin@planifymmi.fr', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY); } } catch {}

// Dossiers d'uploads unifiés
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(__dirname, '../uploads');
const AVATARS_DIR = path.join(UPLOADS_DIR, 'avatars');
const MUSIC_DIR = path.join(UPLOADS_DIR, 'music');

// Configuration multer pour l'upload d'avatars
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = AVATARS_DIR;
    // Créer le dossier s'il n'existe pas
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Générer un nom unique avec timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 35 * 1024 * 1024, // 35MB max
    files: 100 // Limite le nombre de fichiers
  },
  fileFilter: function (req, file, cb) {
    // Accepter seulement les images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images sont autorisées'), false);
    }
  }
});

// Route pour uploader un avatar
router.post('/upload-avatar', verifyToken, (req, res, next) => {
  upload.single('avatar')(req, res, (err) => {
    if (err) {
      console.error('❌ Erreur multer upload avatar:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ 
          message: 'Fichier trop volumineux. Taille maximum: 35 MB',
          error: 'FILE_TOO_LARGE'
        });
      }
      return res.status(400).json({ 
        message: 'Erreur lors de l\'upload',
        error: err.message 
      });
    }
    next();
  });
}, async (req, res) => {
  try {
    console.log('🚀 Upload avatar demandé pour user:', req.user.id);
    
    if (!req.file) {
      console.log('❌ Aucun fichier reçu');
      return res.status(400).json({ message: 'Aucun fichier uploadé' });
    }

    console.log('📁 Fichier reçu:', req.file.filename, 'Taille:', req.file.size);

    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user) {
      console.log('❌ Utilisateur non trouvé');
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    console.log('✅ Utilisateur trouvé:', user.username);

    // Supprimer l'ancien avatar s'il existe
    if (user.avatar) {
      console.log('🗑️ Suppression ancien avatar:', user.avatar);
      const oldAvatarPath = path.join(AVATARS_DIR, path.basename(user.avatar));
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
        console.log('✅ Ancien avatar supprimé');
      } else {
        console.log('⚠️ Ancien avatar non trouvé sur le disque');
      }
    }

    // Mettre à jour le chemin de l'avatar
    const newAvatarPath = `/uploads/avatars/${req.file.filename}`;
    user.avatar = newAvatarPath;
    // Incrémenter la version d'avatar pour forcer le refresh côté client
    user.avatarVersion = (typeof user.avatarVersion === 'number' ? user.avatarVersion : 0) + 1;
    await user.save();

    console.log('✅ Avatar sauvegardé en DB:', newAvatarPath);

    res.json({ 
      message: 'Avatar mis à jour avec succès',
      avatar: user.avatar,
      avatarVersion: user.avatarVersion
    });
  } catch (error) {
    console.error('❌ Erreur upload avatar:', error);
    res.status(500).json({ message: 'Erreur lors de l\'upload de l\'avatar' });
  }
});

// Assurer l'existence du dossier uploads/music
const musicDir = MUSIC_DIR;
if (!fs.existsSync(musicDir)) {
  fs.mkdirSync(musicDir, { recursive: true });
}

// Configuration multer pour l'upload de musique MP3
const musicStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, musicDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = 'music_' + ((req.user && (req.user._id || req.user.id)) || 'anon') + '_' + Date.now();
    cb(null, base + ext);
  }
});

const musicUpload = multer({
  storage: musicStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  },
  fileFilter: function (req, file, cb) {
    const allowed = ['audio/mpeg', 'audio/mp3'];
    const isOk = allowed.includes(file.mimetype) || /\.mp3$/i.test(file.originalname);
    if (isOk) {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers MP3 sont autorisés'));
    }
  }
});

// Route pour uploader une musique de profil (MP3)
router.post('/upload-music', verifyToken, (req, res, next) => {
  musicUpload.single('music')(req, res, (err) => {
    if (err) {
      console.error('❌ Erreur multer upload musique:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          message: 'Fichier trop volumineux. Taille maximum: 10 MB',
          error: 'FILE_TOO_LARGE'
        });
      }
      return res.status(400).json({
        message: 'Erreur lors de l\'upload de la musique',
        error: err.message
      });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier MP3 uploadé' });
    }
    const bodyTitleRaw = (req.body && typeof req.body.title === 'string') ? req.body.title : '';
    const title = (bodyTitleRaw.trim() || path.parse(req.file.originalname).name)
      .trim()
      .slice(0, 200);

    // Lecture des paramètres de découpe (sans limite 15s)
    const rawStart = typeof req.body.startSeconds !== 'undefined' ? parseFloat(req.body.startSeconds) : null;
    const rawDuration = typeof req.body.durationSeconds !== 'undefined' ? parseFloat(req.body.durationSeconds) : null;

    const startSeconds = Number.isFinite(rawStart) && rawStart >= 0 ? Math.floor(rawStart) : null;
    const durationSeconds = Number.isFinite(rawDuration) && rawDuration > 0 ? Math.floor(rawDuration) : null;

    const userId = req.user.id || req.user._id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const relativePath = `/uploads/music/${req.file.filename}`;
    user.musicSrc = relativePath;
    user.musicTitle = title;
    user.musicStartSeconds = startSeconds;
    user.musicDurationSeconds = durationSeconds;
    await user.save();

    res.json({
      message: 'Musique de profil mise à jour avec succès',
      musicSrc: user.musicSrc,
      musicTitle: user.musicTitle,
      musicStartSeconds: user.musicStartSeconds,
      musicDurationSeconds: user.musicDurationSeconds
    });
  } catch (error) {
    console.error('❌ Erreur upload musique:', error);
    res.status(500).json({ message: 'Erreur lors de l\'upload de la musique' });
  }
});

// Route pour uploader plusieurs fichiers en masse
router.post('/upload-multiple', verifyToken, (req, res, next) => {
  upload.array('files', 100)(req, res, (err) => {
    if (err) {
      console.error('❌ Erreur multer upload multiple:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ 
          message: 'Un ou plusieurs fichiers sont trop volumineux. Taille maximum par fichier: 35 MB',
          error: 'FILE_TOO_LARGE'
        });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ 
          message: 'Trop de fichiers. Maximum: 100 fichiers',
          error: 'TOO_MANY_FILES'
        });
      }
      return res.status(400).json({ 
        message: 'Erreur lors de l\'upload',
        error: err.message 
      });
    }
    next();
  });
}, async (req, res) => {
  try {
    console.log('🚀 Upload multiple demandé pour user:', req.user.id);
    console.log('📁 Nombre de fichiers reçus:', req.files ? req.files.length : 0);
    
    if (!req.files || req.files.length === 0) {
      console.log('❌ Aucun fichier reçu');
      return res.status(400).json({ message: 'Aucun fichier uploadé' });
    }

    const uploadedFiles = [];
    const errors = [];

    for (const file of req.files) {
      try {
        console.log('📁 Traitement fichier:', file.filename, 'Taille:', file.size);
        
        // Générer un nom unique pour éviter les conflits
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const newFilename = 'upload-' + uniqueSuffix + path.extname(file.originalname);
        
        // Renommer le fichier
        const oldPath = file.path;
        const newPath = path.join(path.dirname(oldPath), newFilename);
        
        fs.renameSync(oldPath, newPath);
        
        uploadedFiles.push({
          originalName: file.originalname,
          filename: newFilename,
          size: file.size,
          mimetype: file.mimetype,
          path: `/uploads/avatars/${newFilename}`
        });
        
        console.log('✅ Fichier uploadé avec succès:', newFilename);
      } catch (fileError) {
        console.error('❌ Erreur upload fichier:', file.originalname, fileError);
        errors.push({
          filename: file.originalname,
          error: fileError.message
        });
      }
    }

    console.log('📊 Résumé upload:', {
      total: req.files.length,
      success: uploadedFiles.length,
      errors: errors.length
    });

    res.json({
      message: `Upload terminé: ${uploadedFiles.length} fichiers uploadés avec succès`,
      uploadedFiles: uploadedFiles,
      errors: errors,
      summary: {
        total: req.files.length,
        success: uploadedFiles.length,
        errors: errors.length
      }
    });
  } catch (error) {
    console.error('❌ Erreur upload multiple:', error);
    res.status(500).json({ message: 'Erreur lors de l\'upload multiple' });
  }
});

// Route de test simple
// Désactivé en prod
router.get('/test-simple', (req, res) => {
  return res.status(404).json({ message: 'Not found' });
});

// Route de test avec authentification
router.get('/test-auth', verifyToken, (req, res) => {
  res.json({ 
    message: 'Authentification fonctionne',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

// Route de test du middleware d'authentification
router.get('/test-auth-simple', verifyToken, (req, res) => {
  res.json({ 
    message: 'Middleware auth fonctionne',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

// Route de test pour vérifier l'API
router.get('/test-avatar', verifyToken, requireRole(['admin']), (req, res) => {
  res.json({ message: 'ok' });
});

// Route pour lister tous les avatars
router.get('/list-avatars', verifyToken, async (req, res) => {
  try {
    const users = await User.find({ avatar: { $exists: true, $ne: null } }, 'username avatar');
    res.json({
      users: users,
      count: users.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route pour récupérer tous les utilisateurs (pour l'admin dashboard)
router.get('/admin', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    
    res.json({
      success: true,
      users: users,
      count: users.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la récupération des utilisateurs',
      error: error.message 
    });
  }
});

// Persister/récupérer les variantes d'items dynamiques (Map<number, number>)
// IMPORTANT: placé AVANT la route '/:id' pour éviter les collisions de routing
router.get('/dynamic-item-variants', verifyToken, async (req, res) => {
  try {
    // @ts-ignore
    const userId = req.user.id || req.user._id
    const user = await User.findById(userId)
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' })
    const variants = user.dynamicItemVariants || {}
    res.json({ success: true, variants })
  } catch (e) {
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

router.post('/dynamic-item-variants', verifyToken, async (req, res) => {
  try {
    // @ts-ignore
    const userId = req.user.id || req.user._id
    const { itemId, variantIndex } = req.body || {}
    const id = Number(itemId)
    const idx = Number(variantIndex)
    if (!Number.isFinite(id) || !Number.isFinite(idx)) {
      return res.status(400).json({ success: false, message: 'Paramètres invalides' })
    }
    const user = await User.findById(userId)
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' })
    if (!user.dynamicItemVariants) user.dynamicItemVariants = {}
    // @ts-ignore Map ou objet
    user.dynamicItemVariants.set ? user.dynamicItemVariants.set(String(id), idx) : (user.dynamicItemVariants[id] = idx)
    await user.save()
    res.json({ success: true })
  } catch (e) {
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// Route pour récupérer les informations d'un utilisateur (sans mot de passe)
router.get('/:id([0-9a-fA-F]{24})', verifyToken, async (req, res) => {
  console.log('--- Appel API /api/users/:id ---');
  console.log('Paramètre id reçu :', req.params.id);
  try {
    // Valider l'ObjectId pour éviter des 500 sur un id arbitraire (ex: "dynamic-item-variants")
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'ID invalide' });
    }
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      console.log('Utilisateur non trouvé pour id =', req.params.id);
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    console.log('Utilisateur trouvé :', user);
    res.json(user);
  } catch (error) {
    console.error('Erreur récupération utilisateur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route pour récupérer l'avatar d'un utilisateur
router.get('/avatar/:userId', async (req, res) => {
  // Activer un cache public (busté via ?v)
  res.set('Cache-Control', 'public, max-age=604800, immutable');
  try {
    console.log('🔍 Demande d\'avatar pour userId:', req.params.userId);
    
    const user = await User.findById(req.params.userId);
    if (!user) {
      console.log('❌ Utilisateur non trouvé');
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    if (!user.avatar) {
      console.log('❌ Utilisateur sans avatar');
      return res.status(404).json({ message: 'Avatar non trouvé' });
    }
    
    console.log('✅ Avatar trouvé en DB:', user.avatar);
    
    const avatarPath = path.join(AVATARS_DIR, path.basename(user.avatar));
    console.log('📁 Chemin du fichier:', avatarPath);
    
    if (!fs.existsSync(avatarPath)) {
      console.log('❌ Fichier physique manquant');
      return res.status(404).json({ message: 'Fichier avatar non trouvé' });
    }
    
    console.log('✅ Fichier physique trouvé, envoi...');
    
    // Déterminer le type MIME basé sur l'extension
    const ext = path.extname(avatarPath).toLowerCase();
    let mimeType = 'image/png'; // par défaut
    if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
    else if (ext === '.gif') mimeType = 'image/gif';
    else if (ext === '.webp') mimeType = 'image/webp';
    
    // Ajouter des headers pour éviter le cache navigateur et CORS
    res.set({
      'Content-Type': mimeType,
      'Cache-Control': 'public, max-age=604800, immutable',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    
    res.sendFile(avatarPath);
  } catch (error) {
    console.error('❌ Erreur récupération avatar:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'avatar' });
  }
});

// Route pour récupérer l'avatar directement par chemin (fallback)
router.get('/avatar-file/:filename', verifyToken, async (req, res) => {
  try {
    const filename = req.params.filename;
    console.log('🔍 Demande d\'avatar par fichier:', filename);
    
    const avatarPath = path.join(AVATARS_DIR, filename);
    console.log('📁 Chemin du fichier:', avatarPath);
    
    if (!fs.existsSync(avatarPath)) {
      console.log('❌ Fichier non trouvé');
      return res.status(404).json({ message: 'Fichier avatar non trouvé' });
    }
    
    console.log('✅ Fichier trouvé, envoi...');
    
    // Déterminer le type MIME basé sur l'extension
    const ext = path.extname(avatarPath).toLowerCase();
    let mimeType = 'image/png'; // par défaut
    if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
    else if (ext === '.gif') mimeType = 'image/gif';
    else if (ext === '.webp') mimeType = 'image/webp';
    
    res.set({
      'Content-Type': mimeType,
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*'
    });
    
    res.sendFile(avatarPath);
  } catch (error) {
    console.error('❌ Erreur récupération avatar par fichier:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'avatar' });
  }
});

// Rate limiting spécifique pour la connexion (version test)
const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // 10 tentatives
  message: { message: 'Trop de tentatives de connexion. Réessayez dans 1 minute.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // ne pas compter les succès
  keyGenerator: (req, res) => {
    // Clé = username normalisé + clientId (sinon IP réelle)
    const rawUsername = (req.body && req.body.username) ? String(req.body.username) : '';
    const normalized = normalizeUsernameForStore(rawUsername).toLowerCase().replace(/\s+/g, '');
    const clientId = (req.body && req.body.clientId) ? String(req.body.clientId) : '';
    const xff = (req.headers['x-forwarded-for'] || '').split(',')[0].trim();
    const ip = xff || req.ip || (req.connection && req.connection.remoteAddress) || 'unknown';
    return `${normalized}:${clientId || ip}`;
  }
});

// Validation pour la connexion
const loginValidation = [
  body('username').trim().isLength({ min: 3, max: 50 }).withMessage('Nom d\'utilisateur invalide'),
  body('password').isLength({ min: 6 }).withMessage('Mot de passe trop court'),
];

// Helper pour échapper les caractères spéciaux regex
function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
// Helper pour créer un regex qui autorise des espaces arbitraires entre chaque caractère
function buildSpaceTolerantRegex(fromNoSpace) {
  const parts = String(fromNoSpace).split('').map(ch => escapeRegex(ch));
  const pattern = '^' + parts.join('\\s*') + '$';
  return new RegExp(pattern);
}
// Normaliser pour stockage (réduit espaces multiples à un seul, trim)
function normalizeUsernameForStore(str) {
  return String(str || '').replace(/\s+/g, ' ').trim();
}

// Connexion sécurisée (version temporairement moins stricte)
router.post('/login', loginLimiter, async (req, res) => {
  // Empêcher la mise en cache du login
  try { res.set('Cache-Control', 'no-store'); } catch {}
  const { username, password } = req.body;
  console.log('=== DÉBUT CONNEXION ===');
  console.log('Tentative de connexion pour:', username);
  console.log('Body reçu:', { username, password: password ? '***' : 'undefined' });
  
  try {
    // 1) Première tentative: exact (utile si l'username en base n'a pas d'espaces)
    let user = await User.findOne({ username });
    // 2) Si pas trouvé: tenter correspondance tolérante aux espaces
    if (!user) {
      const compact = String(username || '').replace(/\s+/g, '');
      if (compact) {
        const rx = buildSpaceTolerantRegex(compact);
        user = await User.findOne({ username: { $regex: rx } });
      }
    }
    if (!user) {
      console.log(`Utilisateur ${username} non trouvé`);
      return res.status(400).json({ message: 'Nom d\'utilisateur ou mot de passe incorrect' });
    }
    
    console.log('Utilisateur trouvé:', { 
      username: user.username, 
      role: user.role, 
      specialite: user.specialite,
      passwordStartsWith: user.password.substring(0, 4) 
    });
    
    // Vérifier le mot de passe - gérer la transition bcrypt
    let isValidPassword = false;
    
    // Vérifier si le mot de passe est déjà haché (commence par $2a$ ou $2b$)
    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
      console.log('Mot de passe déjà haché, utilisation de bcrypt');
      // Mot de passe haché - utiliser bcrypt
      isValidPassword = await bcrypt.compare(password, user.password);
    } else {
      console.log('Mot de passe en clair, comparaison directe');
      // Mot de passe en clair - comparaison directe (temporaire)
      isValidPassword = (user.password === password);
      
      // Si la connexion réussit, hasher le mot de passe pour la prochaine fois
      if (isValidPassword) {
        console.log('Connexion réussie, migration vers bcrypt...');
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        user.password = hashedPassword;
        await user.save();
        console.log(`Mot de passe migré vers bcrypt pour ${username}`);
      }
    }
    
    console.log('Résultat validation mot de passe:', isValidPassword);
    
    if (!isValidPassword) {
      console.log(`Mot de passe incorrect pour ${username}`);
      return res.status(400).json({ message: 'Nom d\'utilisateur ou mot de passe incorrect' });
    }

    console.log('User trouvé pour login:', user);
    console.log(`Connexion réussie pour ${username}:`, { role: user.role, groupe: user.groupe, year: user.year, avatar: user.avatar });

    // Créer le token JWT avec une clé secrète forte
    const { rememberMe } = req.body;
    const expiresIn = rememberMe ? '30d' : '24h';
    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        role: user.role,
        year: user.year,
        groupe: user.groupe,
        specialite: user.specialite || '',
        department: user.department || ''
      },
      process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
      {
        expiresIn,
        issuer: 'planify-api',
        audience: 'planify-frontend'
      }
    );

    console.log('Token JWT créé avec succès');
    console.log('=== FIN CONNEXION RÉUSSIE ===');

    res.json({
      _id: user._id,
      username: user.username,
      role: user.role,
      groupe: user.groupe,
      specialite: user.specialite || '',
      department: user.department || '',
      year: user.year,
      avatar: user.avatar || null, // Ajouter l'avatar dans la réponse
      avatarVersion: typeof user.avatarVersion === 'number' ? user.avatarVersion : 0,
      avatarCrop: user.avatarCrop || { xPercent: 50, yPercent: 50, scale: 1 },
      musicTitle: user.musicTitle || null,
      musicSrc: user.musicSrc || null,
      musicStartSeconds: user.musicStartSeconds ?? null,
      musicDurationSeconds: user.musicDurationSeconds ?? null,

      theme: user.theme || 'dark',

      token: token,
      hasSecretQuestions: Boolean(user.secretQuestions && user.secretQuestions.length === 3)
    });
  } catch (error) {
    console.error('=== ERREUR CONNEXION ===');
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// Rate limiters spécifiques
const fpLimiter = rateLimit({ windowMs: 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });

// Récupérer les questions secrètes d'un utilisateur
router.post('/forgot-password/questions', fpLimiter, async (req, res) => {
  const { username } = req.body;
  
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Si l'utilisateur n'a pas encore de questions secrètes, on en crée par défaut
    if (!user.secretQuestions || user.secretQuestions.length === 0) {
      const defaultQuestions = [
        { question: "Quel est le nom de votre premier animal ?", answer: "default" },
        { question: "Quel est le prénom de votre mère ?", answer: "default" },
        { question: "Quelle est votre ville de naissance ?", answer: "default" }
      ];
      
      user.secretQuestions = defaultQuestions;
      await user.save();
    }

    // Retourner seulement les questions (pas les réponses)
    const questions = user.secretQuestions.map(q => ({ question: q.question }));
    res.json({ questions });
  } catch (error) {
    console.error('Erreur lors de la récupération des questions:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Vérifier les réponses aux questions secrètes
router.post('/forgot-password/verify', fpLimiter, async (req, res) => {
  const { username, answers } = req.body;
  
  console.log('=== VÉRIFICATION QUESTIONS SECRÈTES ===');
  console.log('Username reçu:', username);
  console.log('Réponses reçues:', answers);
  console.log('Body complet:', req.body);
  
  try {
    const user = await User.findOne({ username });
    if (!user) {
      console.log('Utilisateur non trouvé:', username);
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    if (!user.secretQuestions || user.secretQuestions.length === 0) {
      console.log('Aucune question secrète configurée pour:', username);
      return res.status(400).json({ message: 'Aucune question secrète configurée' });
    }

    console.log('Questions secrètes de l\'utilisateur:', user.secretQuestions);

    // Vérifier les réponses
    const isCorrect = user.secretQuestions.every((q, index) => {
      const expectedAnswer = q.answer.toLowerCase().trim();
      const providedAnswer = answers[index].toLowerCase().trim();
      const match = expectedAnswer === providedAnswer;
      console.log(`Question ${index + 1}: "${q.question}"`);
      console.log(`  Attendu: "${expectedAnswer}"`);
      console.log(`  Fourni: "${providedAnswer}"`);
      console.log(`  Match: ${match}`);
      return match;
    });

    console.log('Résultat final:', isCorrect);

    if (isCorrect) {
      res.json({ success: true, message: 'Réponses correctes' });
    } else {
      res.json({ success: false, message: 'Réponses incorrectes' });
    }
  } catch (error) {
    console.error('Erreur lors de la vérification:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Validation pour la réinitialisation de mot de passe
const resetPasswordValidation = [
  body('username').trim().isLength({ min: 3, max: 50 }).withMessage('Nom d\'utilisateur invalide'),
  body('newPassword').isLength({ min: 8 }).withMessage('Le nouveau mot de passe doit contenir au moins 8 caractères'),
];

// Réinitialiser le mot de passe sécurisé
router.post('/forgot-password/reset', fpLimiter, resetPasswordValidation, async (req, res) => {
  console.log('=== RÉINITIALISATION MOT DE PASSE ===');
  console.log('Body reçu:', req.body);
  console.log('Username:', req.body.username);
  console.log('NewPassword:', req.body.newPassword);
  console.log('Longueur du mot de passe:', req.body.newPassword?.length);
  
  // Vérifier les erreurs de validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Erreurs de validation:', errors.array());
    return res.status(400).json({ 
      message: 'Données invalides', 
      errors: errors.array() 
    });
  }

  const { username, newPassword } = req.body;
  
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Hasher le nouveau mot de passe
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    user.password = hashedPassword;
    await user.save();

    res.json({ success: true, message: 'Mot de passe mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur lors de la réinitialisation:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route pour créer des utilisateurs de test
router.post('/seed', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    // Supprimer les utilisateurs existants
    await User.deleteMany({});
    
    // Créer des utilisateurs de test
    const usersData = [
      { username: 'admin', password: 'admin123', role: 'admin', groupe: null, year: null },
      { username: 'étudiantA1', password: 'password', role: 'eleve', groupe: 'A', year: 'BUT1' },
      { username: 'étudiantB1', password: 'password', role: 'eleve', groupe: 'B', year: 'BUT1' },
      { username: 'delegueA', password: 'password', role: 'delegue', groupe: 'A', year: 'BUT1' },
      { username: 'prof1', password: 'password', role: 'prof', groupe: null, year: null }
    ];

    const users = await User.insertMany(usersData);
    res.json({ message: `${users.length} utilisateurs créés avec succès`, users: users.map(u => ({ username: u.username, role: u.role, groupe: u.groupe, year: u.year })) });
  } catch (error) {
    console.error('Erreur lors de la création des utilisateurs de test:', error);
    res.status(500).json({ message: 'Erreur lors de la création des utilisateurs de test', error: error.message });
  }
});

// Route pour voir tous les utilisateurs (pour l'admin dashboard)
router.get('/all', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json({ success: true, users, count: users.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des utilisateurs', error: error.message });
  }
});

// router.put('/:id', ...) — Route pour modifier un utilisateur (legacy)
router.put('/:id', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Ne pas modifier le mot de passe s'il est vide
    if (!updateData.password || updateData.password.trim() === '') {
      delete updateData.password;
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Mettre à jour les champs standards
    if (updateData.username) user.username = updateData.username;
    if (updateData.password) {
      const saltRounds = 12;
      user.password = await bcrypt.hash(updateData.password, saltRounds);
    }
    if (updateData.role) user.role = updateData.role;
    if (updateData.groupe !== undefined) user.groupe = updateData.groupe;
    if (updateData.year !== undefined) user.year = updateData.year;
    // Nouveau: support de la spécialité (string forcée)
    if (updateData.specialite !== undefined) user.specialite = String(updateData.specialite || '');

    // Harmoniser les coins si "coins" est fourni, sans modifier le leaderboard ici
    if (typeof updateData.coins === 'number') {
      const c = Math.max(0, updateData.coins);
      user.coins = c;
      // Ne pas modifier leaderboardCoins ici
    }

    await user.save();

    const { password: _, ...userWithoutPassword } = user.toObject();
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ 
      message: 'Erreur lors de la modification de l\'utilisateur',
      error: error.message 
    });
  }
});

// Route pour supprimer un utilisateur
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Supprime et récupère le document supprimé
    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Si l'utilisateur appartenait à une faction, décrémenter son apport et le nombre de membres
    const factionName = user.faction || null;
    const userFactionCoins = Number(user.factionCoins || 0);
    if (factionName) {
      const coinsDelta = Number.isFinite(userFactionCoins) && userFactionCoins > 0 ? -userFactionCoins : 0;
      await Faction.updateOne(
        { name: factionName },
        { $inc: { totalCoins: coinsDelta, membersCount: -1 } },
        { upsert: true }
      );
    }

    res.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    res.status(500).json({
      message: 'Erreur lors de la suppression de l\'utilisateur',
      error: error.message
    });
  }
});

// Route pour récupérer tous les utilisateurs (pour le leaderboard)
router.get('/', verifyToken, async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    console.log('📊 Demande de leaderboard pour user:', req.user.username);
    
    // Récupération des utilisateurs en excluant admin
    // et en excluant les profs qui n'ont pas activé le leaderboard
    const users = await User.find({
      role: { $ne: 'admin' },
      $or: [
        { role: { $ne: 'prof' } },
        { role: 'prof', leaderboardEnabled: true }
      ]
    });

    // Précharger les soldes legacy depuis la collection Coins
    const userIds = users.map(u => u._id);
    const legacyCoinsDocs = await Coins.find({ userId: { $in: userIds } }).lean();
    const legacyCoinsMap = new Map(legacyCoinsDocs.map(d => [String(d.userId), d.coins || 0]));

    // Garantir que chaque user possède Bordure Classique + backfill robuste
    for (const u of users) {
      const hasClassic = (u.purchasedItems || []).some(it => it.itemId === 0)
      if (!hasClassic) {
        u.purchasedItems.push({ itemId: 0, itemName: 'Bordure Classique', purchaseDate: new Date(), equipped: false })
        try { await u.save() } catch (e) { /* ignore */ }
      }
      // Backfill robuste: si leaderboardCoins n'est pas strictement positif,
      // et qu'on trouve un solde positif (legacy ou wallet), on initialise leaderboardCoins une fois.
      const legacyCoins = Number(legacyCoinsMap.get(String(u._id))) || 0;
      const wallet = Number(u.coins) || 0;
      const lb = Number(u.leaderboardCoins);
      const hasPositiveLb = Number.isFinite(lb) && lb > 0;
      if (!hasPositiveLb && (legacyCoins > 0 || wallet > 0)) {
        u.leaderboardCoins = Math.max(legacyCoins, wallet);
        try { await u.save() } catch (e) { /* ignore */ }
      }
    }
    
    console.log(`✅ ${users.length} utilisateurs récupérés (admins exclus)`);
    
    // Transformer les données pour le leaderboard
    const leaderboardUsers = users.map(user => ({
      id: user._id,
      _id: user._id,
      username: user.username,
      role: user.role,
      groupe: user.groupe,
      department: user.department || '',
      year: user.year,
      // Utiliser le porte-monnaie actuel (coins) pour synchroniser avec la navbar
      coins: (Number.isFinite(Number(user.coins)) ? Number(user.coins) : 0),
      completedTasks: user.completedTasks || 0,
      avatar: user.avatar || null,
      // AJOUT: version + recadrage pour le front (ShopPopup.vue)
      avatarVersion: (typeof user.avatarVersion === 'number' ? user.avatarVersion : 0),
      avatarCrop: user.avatarCrop || { x: 50, y: 50, scale: 1 },
      // Fallback utile si avatarVersion n'est pas initialisé
      avatarUpdatedAt: user.avatarUpdatedAt || user.updatedAt || user.createdAt || null,
      musicTitle: user.musicTitle || null,
      musicSrc: user.musicSrc || null,
      musicStartSeconds: user.musicStartSeconds ?? null,
      musicDurationSeconds: user.musicDurationSeconds ?? null,
      equippedItemId: user.equippedItemId || null,
      selectedBorderColor: user.selectedBorderColor || 'default',
      // Ajout de la note publique
      publicNote: user.publicNote || ''
    }));
    
    res.json({
      success: true,
      users: leaderboardUsers,
      count: leaderboardUsers.length
    });
  } catch (error) {
    console.error('❌ Erreur leaderboard:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur',
      error: error.message 
    });
  }
});

// Nouvel endpoint dédié (rétro-compatible) : /api/users/leaderboard
router.get('/leaderboard', verifyToken, async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    console.log('📊 Demande de leaderboard (endpoint dédié) pour user:', req.user.username);

    const users = await User.find({
      role: { $ne: 'admin' },
      $or: [
        { role: { $ne: 'prof' } },
        { role: 'prof', leaderboardEnabled: true }
      ]
    });

    // Précharger les soldes legacy depuis la collection Coins
    const userIds = users.map(u => u._id);
    const legacyCoinsDocs = await Coins.find({ userId: { $in: userIds } }).lean();
    const legacyCoinsMap = new Map(legacyCoinsDocs.map(d => [String(d.userId), d.coins || 0]));

    // Bordure classique + backfill robuste
    for (const u of users) {
      const hasClassic = (u.purchasedItems || []).some(it => it.itemId === 0);
      if (!hasClassic) {
        u.purchasedItems.push({ itemId: 0, itemName: 'Bordure Classique', purchaseDate: new Date(), equipped: false });
        try { await u.save(); } catch (e) { /* ignore */ }
      }
      const legacyCoins = Number(legacyCoinsMap.get(String(u._id))) || 0;
      const wallet = Number(u.coins) || 0;
      const lb = Number(u.leaderboardCoins);
      const hasPositiveLb = Number.isFinite(lb) && lb > 0;
      if (!hasPositiveLb && (legacyCoins > 0 || wallet > 0)) {
        u.leaderboardCoins = Math.max(legacyCoins, wallet);
        try { await u.save(); } catch (e) { /* ignore */ }
      }
    }

    const leaderboardUsers = users.map(user => {
      // Sérialiser proprement dynamicItemVariants (support Map ou objet)
      let dynamicItemVariants = user.dynamicItemVariants || {};
      if (dynamicItemVariants && typeof dynamicItemVariants.get === 'function') {
        try {
          dynamicItemVariants = Object.fromEntries(
            Array.from(dynamicItemVariants.entries()).map(([k, v]) => [String(k), Number(v)])
          );
        } catch (e) {
          dynamicItemVariants = {};
        }
      } else if (dynamicItemVariants && typeof dynamicItemVariants === 'object') {
        const normalized = {};
        for (const k of Object.keys(dynamicItemVariants)) {
          const nk = String(k);
          const nv = Number(dynamicItemVariants[k]);
          if (Number.isFinite(nv)) normalized[nk] = nv;
        }
        dynamicItemVariants = normalized;
      }

      return {
        id: user._id,
        _id: user._id,
        username: user.username,
        role: user.role,
        groupe: user.groupe,
        department: user.department || '',
        year: user.year,
        // Toujours utiliser le score historique (ne baisse jamais)
        coins: (Number.isFinite(Number(user.leaderboardCoins)) ? Number(user.leaderboardCoins) : 0),
        completedTasks: user.completedTasks || 0,
        avatar: user.avatar || null,
        avatarVersion: (typeof user.avatarVersion === 'number' ? user.avatarVersion : 0),
        avatarCrop: user.avatarCrop || { x: 50, y: 50, scale: 1 },
        musicTitle: user.musicTitle || null,
        musicSrc: user.musicSrc || null,
        musicStartSeconds: user.musicStartSeconds ?? null,
        musicDurationSeconds: user.musicDurationSeconds ?? null,
        equippedItemId: user.equippedItemId || null,
        selectedBorderColor: user.selectedBorderColor || 'default',
        publicNote: user.publicNote || '',
        // Exposer les variantes dynamiques par utilisateur
        dynamicItemVariants
      };
    });

    res.json({
      success: true,
      users: leaderboardUsers,
      count: leaderboardUsers.length
    });
  } catch (error) {
    console.error('❌ Erreur leaderboard (endpoint dédié):', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
});

// Mettre à jour la note publique de l'utilisateur connecté
router.put('/me/public-note', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    let { publicNote } = req.body;

    if (typeof publicNote !== 'string') publicNote = '';
    // Sécurité: petite limite de longueur + trim, alignée sur l'UI (60)
    publicNote = String(publicNote).slice(0, 60).trim();

    const updated = await User.findByIdAndUpdate(
      userId,
      { publicNote },
      { new: true }
    ).select('-password');

    if (!updated) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    return res.json(updated);
  } catch (error) {
    console.error('Erreur mise à jour de la note publique:', error);
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Activer/Désactiver son apparition dans le leaderboard (prof uniquement visible dans l'UI)
router.put('/me/leaderboard', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    // Autoriser true/false sous diverses formes (string/bool/num)
    const raw = (req.body && req.body.enabled);
    const enabled = raw === true || raw === 'true' || raw === 1 || raw === '1';

    const updated = await User.findByIdAndUpdate(
      userId,
      { leaderboardEnabled: enabled },
      { new: true }
    ).select('-password');

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }

    return res.json({
      success: true,
      leaderboardEnabled: updated.leaderboardEnabled,
      user: updated
    });
  } catch (error) {
    console.error('❌ Erreur toggle leaderboard:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Mettre à jour le recadrage de l'avatar de l'utilisateur connecté
router.put('/me/avatar-crop', verifyToken, async (req, res) => {
  try {
    const { xPercent, yPercent, scale } = req.body || {};
    const clamp = (n, min, max) => Math.max(min, Math.min(max, Number(n)));

    const cx = clamp(xPercent ?? 50, 0, 100);
    const cy = clamp(yPercent ?? 50, 0, 100);
    const sc = clamp(scale ?? 1, 1, 3);

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });

    user.avatarCrop = { xPercent: cx, yPercent: cy, scale: sc };

    // Incrémenter également la version pour forcer le rafraîchissement si l’URL est stable (avec ?v)
    user.avatarVersion = (typeof user.avatarVersion === 'number' ? user.avatarVersion : 0) + 1;

    await user.save();

    return res.json({
      success: true,
      avatarCrop: user.avatarCrop,
      avatarVersion: user.avatarVersion,
    });
  } catch (err) {
    console.error('❌ Erreur avatar-crop:', err);
    return res.status(500).json({ message: 'Erreur lors de la mise à jour du recadrage' });
  }
});

router.put('/me/theme', verifyToken, async (req, res) => {
  try {
    const t = String((req.body && req.body.theme) || '').toLowerCase();
    const allowed = ['dark', 'light', 'auto'];
    if (!allowed.includes(t)) {
      return res.status(400).json({ message: 'Thème invalide' });
    }
    const userId = req.user.id || req.user._id;
    const updated = await User.findByIdAndUpdate(userId, { theme: t }, { new: true });
    return res.json({ theme: updated.theme });
  } catch (e) {
    return res.status(500).json({ message: 'Erreur mise à jour du thème' });
  }
});

// Création d'utilisateurs (désormais réservé aux admins)
router.post('/register', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { password, role, groupe, year, specialite, department } = req.body;
    let { username } = req.body;
    username = normalizeUsernameForStore(username);
    const user = new User({ username, password, role, groupe, year, specialite: String(specialite || ''), department: String(department || 'MMI') });
    
    // Ajouter automatiquement l'item "Bordure Classique" aux nouveaux utilisateurs
    user.purchasedItems.push({
      itemId: 0,
      itemName: 'Bordure Classique',
      purchaseDate: new Date(),
      equipped: false
    });
    
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ 
      message: 'Erreur lors de la création de l\'utilisateur',
      error: error.message 
    });
  }
});

// Route pour enregistrer les questions secrètes
router.post('/secret-questions', async (req, res) => {
  const { secretQuestions } = req.body;
  let { username } = req.body;
  const compact = String(username || '').replace(/\s+/g, '');
  if (!username || !secretQuestions || !Array.isArray(secretQuestions) || secretQuestions.length === 0) {
    return res.status(400).json({ message: 'Données invalides' });
  }
  try {
    // Autoriser les espaces au matching du username
    let user = await User.findOne({ username });
    if (!user && compact) {
      const rx = buildSpaceTolerantRegex(compact);
      user = await User.findOne({ username: { $regex: rx } });
    }
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    user.secretQuestions = secretQuestions;
    await user.save();
    res.json({ success: true, message: 'Questions secrètes enregistrées' });
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des questions secrètes:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route pour mettre à jour un utilisateur
router.put('/:id', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, role, groupe, year, specialite, department } = req.body;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    // Mettre à jour les champs
    if (username) user.username = username;
    if (password) {
      // Hasher le mot de passe s'il est fourni
      const saltRounds = 12;
      user.password = await bcrypt.hash(password, saltRounds);
    }
    if (role) user.role = role;
    if (groupe !== undefined) user.groupe = groupe;
    if (year !== undefined) user.year = year;
    if (specialite !== undefined) user.specialite = String(specialite || '');
    if (department !== undefined) user.department = String(department || '');
    // plus de mises à jour de variantes ici (on évite d'ajouter ces champs en DB)
    
    await user.save();
    
    // Retourner l'utilisateur sans le mot de passe
    const { password: _, ...userWithoutPassword } = user.toObject();
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Erreur lors de la mise à jour:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route pour supprimer un utilisateur
router.delete('/:id', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    await User.findByIdAndDelete(id);
    res.json({ success: true, message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route pour supprimer un item d'un utilisateur
router.delete('/:id/items/:itemId', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id, itemId } = req.params;
    
    console.log(`🗑️ Suppression item ${itemId} pour utilisateur ${id}`);
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    // Supprimer l'item du tableau purchasedItems
    const initialLength = user.purchasedItems.length;
    user.purchasedItems = user.purchasedItems.filter(item => item.itemId !== parseInt(itemId));
    
    if (user.purchasedItems.length === initialLength) {
      return res.status(404).json({ message: 'Item non trouvé' });
    }
    
    // Si l'item était équipé, le déséquiper
    if (user.equippedItemId === parseInt(itemId)) {
      user.equippedItemId = null;
    }
    
    await user.save();
    
    console.log(`✅ Item ${itemId} supprimé pour ${user.username}`);
    
    res.json({ 
      success: true, 
      message: 'Item supprimé avec succès',
      remainingItems: user.purchasedItems.length
    });
  } catch (error) {
    console.error('❌ Erreur lors de la suppression de l\'item:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route pour supprimer tous les items d'un utilisateur
router.delete('/:id/items', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🗑️ Suppression de tous les items pour utilisateur ${id}`);
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    const itemsCount = user.purchasedItems.length;
    user.purchasedItems = [];
    user.equippedItemId = null;
    // Réinitialiser également la couleur de bordure sélectionnée
    user.selectedBorderColor = 'default';
    
    await user.save();
    
    console.log(`✅ ${itemsCount} items supprimés pour ${user.username}`);
    
    res.json({ 
      success: true, 
      message: 'Tous les items et la couleur de bordure ont été supprimés/réinitialisés avec succès',
      deletedItems: itemsCount
    });
  } catch (error) {
    console.error('❌ Erreur lors de la suppression des items:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route pour modifier les coins d'un utilisateur
router.put('/:id/coins', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { coins } = req.body;
    
    console.log(`🪙 Modification des coins pour utilisateur ${id}: ${coins}`);
    
    if (typeof coins !== 'number' || coins < 0) {
      return res.status(400).json({ message: 'Le nombre de coins doit être un nombre positif' });
    }
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    user.coins = coins;
    await user.save();
    
    console.log(`✅ Coins mis à jour pour ${user.username}: ${coins}`);
    
    res.json({ 
      success: true, 
      message: 'Coins mis à jour avec succès',
      coins: user.coins
    });
  } catch (error) {
    console.error('❌ Erreur lors de la modification des coins:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route pour donner un item à un utilisateur
router.post('/:id/give-item', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { itemId, itemName, adminMessage } = req.body;
    
    console.log(`🎁 Don d'item ${itemId} (${itemName}) pour utilisateur ${id}${adminMessage ? ' avec message' : ''}`);
    
    // Valider correctement l'ID 0 (ne pas utiliser une vérification falsy)
    const isItemIdMissing = itemId === undefined || itemId === null || Number.isNaN(itemId)
    if (isItemIdMissing || !itemName) {
      return res.status(400).json({ message: 'ID et nom de l\'item requis' });
    }
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    // Vérifier si l'utilisateur a déjà cet item
    const alreadyHasItem = user.purchasedItems.some(item => item.itemId === itemId);
    if (alreadyHasItem) {
      return res.status(400).json({ message: 'L\'utilisateur possède déjà cet item' });
    }
    
    // Ajouter l'item à l'utilisateur avec le message optionnel
    user.purchasedItems.push({
      itemId: itemId,
      itemName: itemName,
      purchaseDate: new Date(),
      equipped: false,
      adminMessage: adminMessage || null,
      adminGiftRead: false
    });
    
    await user.save();
    
    console.log(`✅ Item ${itemId} donné à ${user.username}${adminMessage ? ' avec message' : ''}`);
    
    res.json({ 
      success: true, 
      message: `Item ${itemName} donné avec succès`,
      totalItems: user.purchasedItems.length,
      adminMessage: adminMessage
    });
  } catch (error) {
    console.error('❌ Erreur lors du don d\'item:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Acquitter un don (marquer le message admin comme lu pour un item reçu)
router.post('/ack-gift/:itemId', verifyToken, async (req, res) => {
  try {
    // @ts-ignore
    const userId = req.user.id || req.user._id
    const { itemId } = req.params
    const user = await User.findById(userId)
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' })

    const it = (user.purchasedItems || []).find(pi => String(pi.itemId) === String(itemId) && pi.adminGiftRead !== true)
    if (!it) return res.json({ success: true })
    it.adminGiftRead = true
    await user.save()
    res.json({ success: true })
  } catch (e) {
    console.error('❌ Erreur ack-gift:', e)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})



// (Supprimé: doublon de routes dynamic-item-variants déplacées plus haut pour éviter collisions)

// Route pour retirer un item d'un utilisateur
router.post('/:id/remove-item', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { itemId } = req.body;
    
    console.log(`🗑️ Retrait d'item ${itemId} pour utilisateur ${id}`);
    
    if (!itemId) {
      return res.status(400).json({ message: 'ID de l\'item requis' });
    }
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    // Trouver et supprimer l'item
    const itemIndex = user.purchasedItems.findIndex(item => item.itemId === itemId);
    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item non trouvé' });
    }
    
    const removedItem = user.purchasedItems[itemIndex];
    user.purchasedItems.splice(itemIndex, 1);
    
    // Si l'item était équipé, le déséquiper
    if (user.equippedItemId === itemId) {
      user.equippedItemId = null;
    }
    
    await user.save();
    
    console.log(`✅ Item ${itemId} retiré de ${user.username}`);
    
    res.json({ 
      success: true, 
      message: `Item ${removedItem.itemName} retiré avec succès`,
      remainingItems: user.purchasedItems.length
    });
  } catch (error) {
    console.error('❌ Erreur lors du retrait d\'item:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});











router.get('/ping', (req, res) => {
  res.json({ message: 'pong' });
});





router.get('/my-items', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const user = await User.findById(userId);
    if (!user) {
      return res.json({ purchasedItems: [], equippedItemId: null, selectedBorderColor: 'default' });
    }
    res.json({
      purchasedItems: user.purchasedItems || [],
      equippedItemId: user.equippedItemId || null,
      selectedBorderColor: user.selectedBorderColor || 'default'
    });
  } catch (error) {
    res.json({ purchasedItems: [], equippedItemId: null, selectedBorderColor: 'default' });
  }
});

// Compat rétro: mise à jour de l'inventaire utilisateur (équiper/déséquiper, couleur)
router.put('/my-items', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });

    const payload = req.body || {};
    const nextEquipped = Number(payload.equippedItemId);
    const nextColor = typeof payload.selectedBorderColor === 'string' ? payload.selectedBorderColor : null;

    if (Number.isFinite(nextEquipped)) {
      const discordVariantIds = [231, 232];
      let owns = (user.purchasedItems || []).some(pi => Number(pi.itemId) === nextEquipped);
      if (!owns && discordVariantIds.includes(nextEquipped)) {
        owns = (user.purchasedItems || []).some(pi => Number(pi.itemId) === 23);
      }
      if (!owns && nextEquipped === 0) {
        user.purchasedItems = Array.isArray(user.purchasedItems) ? user.purchasedItems : [];
        user.purchasedItems.push({ itemId: 0, itemName: 'Bordure Classique', purchaseDate: new Date(), equipped: false });
        owns = true;
      }
      if (owns) {
        (user.purchasedItems || []).forEach(pi => { pi.equipped = false; });
        user.equippedItemId = nextEquipped;
        const it = (user.purchasedItems || []).find(pi => Number(pi.itemId) === nextEquipped);
        if (it) it.equipped = true;
      }
    }

    if (nextColor) {
      user.selectedBorderColor = nextColor;
    }

    await user.save();
    res.json({
      success: true,
      purchasedItems: user.purchasedItems || [],
      equippedItemId: user.equippedItemId || null,
      selectedBorderColor: user.selectedBorderColor || 'default'
    });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Erreur mise à jour items' });
  }
});

router.get('/push/public-key', (req, res) => {
  const publicKey = process.env.VAPID_PUBLIC_KEY || process.env.PUBLIC_KEY || '';
  const privateKey = process.env.VAPID_PRIVATE_KEY || process.env.PRIVATE_KEY || '';
  const enabled = Boolean(publicKey && privateKey);
  res.json({ success: true, enabled, publicKey: enabled ? publicKey : null });
});

router.post('/push/subscribe', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const subscription = req.body && req.body.subscription ? req.body.subscription : null;
    if (!subscription || !subscription.endpoint || !subscription.keys) return res.status(400).json({ success: false, message: 'Subscription manquante' });
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    user.pushSubscriptions = Array.isArray(user.pushSubscriptions) ? user.pushSubscriptions : [];
    const endpoint = String(subscription.endpoint || '');
    const p256dh = subscription.keys && subscription.keys.p256dh ? String(subscription.keys.p256dh) : '';
    const auth = subscription.keys && subscription.keys.auth ? String(subscription.keys.auth) : '';
    const existing = user.pushSubscriptions.find(s => String(s.endpoint) === endpoint);
    if (existing) {
      existing.keys = { p256dh, auth };
      existing.createdAt = new Date();
    } else {
      user.pushSubscriptions.push({ endpoint, keys: { p256dh, auth }, createdAt: new Date() });
    }
    await user.save();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Erreur abonnement push' });
  }
});

router.post('/push/test', verifyToken, async (req, res) => {
  try {
    if (!webpush || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return res.status(503).json({ success: false, message: 'Push indisponible' });
    const userId = req.user.id || req.user._id;
    const user = await User.findById(userId).select('pushSubscriptions');
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    const subs = Array.isArray(user.pushSubscriptions) ? user.pushSubscriptions : [];
    if (!subs.length) return res.status(400).json({ success: false, message: 'Aucune subscription push' });
    const title = String(req.body?.title || 'Test Planify');
    const body = String(req.body?.body || 'Notification de test');
    const url = String(req.body?.url || '/');
    const payload = JSON.stringify({ title, body, icon: '/planifyFichier_134x.webp?v=2', badge: '/planifyFichier_134x.webp?v=2', data: { url } });
    let sent = 0;
    const invalid = new Set();
    for (const sub of subs) {
      try {
        await webpush.sendNotification(sub, payload);
        sent++;
      } catch (e) {
        const code = e && e.statusCode;
        if (code === 404 || code === 410) invalid.add(String(sub.endpoint || ''));
      }
    }
    if (invalid.size) {
      user.pushSubscriptions = subs.filter(s => !invalid.has(String(s.endpoint || '')));
      await user.save();
    }
    res.json({ success: true, sent });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Erreur test push' });
  }
});

router.get('/me/push-preferences', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const user = await User.findById(userId).select('pushPreferences');
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    res.json({ success: true, pushPreferences: user.pushPreferences || { enabled: false, wheel: false, homework: false, exam: false } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

router.put('/me/push-preferences', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const raw = req.body || {};
    const prefs = {
      enabled: raw.enabled === true || raw.enabled === 'true' || raw.enabled === 1 || raw.enabled === '1',
      wheel: raw.wheel === true || raw.wheel === 'true' || raw.wheel === 1 || raw.wheel === '1',
      homework: raw.homework === true || raw.homework === 'true' || raw.homework === 1 || raw.homework === '1',
      exam: raw.exam === true || raw.exam === 'true' || raw.exam === 1 || raw.exam === '1'
    };
    const updated = await User.findByIdAndUpdate(userId, { pushPreferences: prefs }, { new: true }).select('-password');
    if (!updated) return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    res.json({ success: true, pushPreferences: updated.pushPreferences });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Persistance de l’état de l’éditeur de suggestion d’item
router.get('/suggest-editor-state', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    const state = user.suggestEditorState && typeof user.suggestEditorState === 'object' ? user.suggestEditorState : { variants: [], activeIndex: 0 };
    res.json({ success: true, state });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

router.put('/suggest-editor-state', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    const payload = req.body || {};
    const variants = Array.isArray(payload.variants) ? payload.variants : [];
    const idx = Number(payload.activeIndex);
    user.suggestEditorState = { variants, activeIndex: Number.isFinite(idx) ? idx : 0 };
    await user.save();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Proposers: admin-side list of blocked users
router.get('/blocked-proposers', verifyToken, requireRole(['delegue','prof','admin']), async (req, res) => {
  try {
    const users = await User.find({ proposalBlocked: true }).select('_id username groupe year proposalBlocked');
    res.json({ success: true, users });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Erreur liste bloqués', error: String(e) });
  }
});

// Block/unblock proposals from a user (delegue/prof/admin)
router.post('/:id([0-9a-fA-F]{24})/block-proposals', verifyToken, requireRole(['delegue','prof','admin']), async (req, res) => {
  try {
    const u = await User.findById(req.params.id);
    if (!u) return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });
    u.proposalBlocked = true;
    await u.save();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Erreur blocage', error: String(e) });
  }
});
router.post('/:id([0-9a-fA-F]{24})/unblock-proposals', verifyToken, requireRole(['delegue','prof','admin']), async (req, res) => {
  try {
    const u = await User.findById(req.params.id);
    if (!u) return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });
    u.proposalBlocked = false;
    await u.save();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Erreur déblocage', error: String(e) });
  }
});

// Student-side mute/unmute a proposer (persist per-user)
router.post('/mute-proposer/:id([0-9a-fA-F]{24})', verifyToken, async (req, res) => {
  try {
    const me = await User.findById(req.user.id || req.user._id);
    if (!me) return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    me.mutedProposers = Array.isArray(me.mutedProposers) ? me.mutedProposers : [];
    const target = req.params.id;
    if (!me.mutedProposers.map(String).includes(String(target))) me.mutedProposers.push(target);
    await me.save();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Erreur mute', error: String(e) });
  }
});
router.post('/unmute-proposer/:id([0-9a-fA-F]{24})', verifyToken, async (req, res) => {
  try {
    const me = await User.findById(req.user.id || req.user._id);
    if (!me) return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    me.mutedProposers = Array.isArray(me.mutedProposers) ? me.mutedProposers : [];
    const target = req.params.id;
    me.mutedProposers = me.mutedProposers.filter(x => String(x) !== String(target));
    await me.save();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Erreur unmute', error: String(e) });
  }
});

module.exports = router;