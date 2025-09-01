// @ts-nocheck
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { verifyToken, requireRole } = require('../middlewares/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuration multer pour l'upload d'avatars
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/avatars');
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
      const oldAvatarPath = path.join(__dirname, '../uploads/avatars', path.basename(user.avatar));
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
    await user.save();

    console.log('✅ Avatar sauvegardé en DB:', newAvatarPath);

    res.json({ 
      message: 'Avatar mis à jour avec succès',
      avatar: user.avatar
    });
  } catch (error) {
    console.error('❌ Erreur upload avatar:', error);
    res.status(500).json({ message: 'Erreur lors de l\'upload de l\'avatar' });
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
router.get('/test-simple', (req, res) => {
  res.json({ 
    message: 'Route test simple fonctionne',
    timestamp: new Date().toISOString()
  });
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
router.get('/test-avatar', (req, res) => {
  res.json({ 
    message: 'API avatar fonctionnelle',
    timestamp: new Date().toISOString(),
    uploadsDir: path.join(__dirname, '../uploads/avatars'),
    baseUrl: req.protocol + '://' + req.get('host')
  });
});

// Route pour lister tous les avatars
router.get('/list-avatars', async (req, res) => {
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

// Route pour récupérer les informations d'un utilisateur (sans mot de passe)
router.get('/:id', verifyToken, async (req, res) => {
  console.log('--- Appel API /api/users/:id ---');
  console.log('Paramètre id reçu :', req.params.id);
  try {
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
    
    const avatarPath = path.join(__dirname, '../uploads/avatars', path.basename(user.avatar));
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
      'Cache-Control': 'public, max-age=3600', // Cache pendant 1 heure
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
router.get('/avatar-file/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    console.log('🔍 Demande d\'avatar par fichier:', filename);
    
    const avatarPath = path.join(__dirname, '../uploads/avatars', filename);
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
  windowMs: 1 * 60 * 1000, // 1 minute au lieu de 15
  max: 10, // 10 tentatives au lieu de 5
  message: { message: 'Trop de tentatives de connexion. Réessayez dans 1 minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation pour la connexion
const loginValidation = [
  body('username').trim().isLength({ min: 3, max: 50 }).withMessage('Nom d\'utilisateur invalide'),
  body('password').isLength({ min: 6 }).withMessage('Mot de passe trop court'),
];

// Connexion sécurisée (version temporairement moins stricte)
router.post('/login', loginLimiter, async (req, res) => {
  const { username, password } = req.body;
  console.log('=== DÉBUT CONNEXION ===');
  console.log('Tentative de connexion pour:', username);
  console.log('Body reçu:', { username, password: password ? '***' : 'undefined' });
  
  try {
    const user = await User.findOne({ username });
    if (!user) {
      console.log(`Utilisateur ${username} non trouvé`);
      return res.status(400).json({ message: 'Nom d\'utilisateur ou mot de passe incorrect' });
    }
    
    console.log('Utilisateur trouvé:', { 
      username: user.username, 
      role: user.role, 
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
    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        role: user.role,
        year: user.year,
        groupe: user.groupe
      },
      process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
      { 
        expiresIn: '24h',
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
      year: user.year,
      avatar: user.avatar, // Ajouter l'avatar dans la réponse

      token: token,
      hasSecretQuestions: Boolean(user.secretQuestions && user.secretQuestions.length === 3)
    });
  } catch (error) {
    console.error('=== ERREUR CONNEXION ===');
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// Récupérer les questions secrètes d'un utilisateur
router.post('/forgot-password/questions', async (req, res) => {
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
router.post('/forgot-password/verify', async (req, res) => {
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
router.post('/forgot-password/reset', resetPasswordValidation, async (req, res) => {
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
router.get('/all', async (req, res) => {
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

// Route pour modifier un utilisateur
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Ne pas modifier le mot de passe s'il est vide
    if (!updateData.password || updateData.password.trim() === '') {
      delete updateData.password;
    }
    
    const user = await User.findByIdAndUpdate(id, updateData, { new: true });
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    res.json(user);
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
    const user = await User.findByIdAndDelete(id);
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
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
    console.log('📊 Demande de leaderboard pour user:', req.user.username);
    
    // Récupération des utilisateurs en excluant les administrateurs
    const users = await User.find({ role: { $ne: 'admin' } });

    // Garantir que chaque user possède l'item Bordure Classique en base (auto-fix au passage)
    for (const u of users) {
      const hasClassic = (u.purchasedItems || []).some(it => it.itemId === 0)
      if (!hasClassic) {
        u.purchasedItems.push({ itemId: 0, itemName: 'Bordure Classique', purchaseDate: new Date(), equipped: false })
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
      year: user.year,
      coins: user.coins || 0,
      completedTasks: user.completedTasks || 0,
      avatar: user.avatar || null,
      equippedItemId: user.equippedItemId || null,
      selectedBorderColor: user.selectedBorderColor || 'default'
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

// Création d'utilisateurs
router.post('/register', async (req, res) => {
  try {
    const { username, password, role, groupe, year, specialite } = req.body;
    const user = new User({ username, password, role, groupe, year, specialite });
    
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
  const { username, secretQuestions } = req.body;
  if (!username || !secretQuestions || !Array.isArray(secretQuestions) || secretQuestions.length === 0) {
    return res.status(400).json({ message: 'Données invalides' });
  }
  try {
    const user = await User.findOne({ username });
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
    const { username, password, role, groupe, year, specialite } = req.body;
    
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
    if (specialite !== undefined) user.specialite = specialite;
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



// Persister/récupérer les variantes d'items dynamiques (Map<number, number>)
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





module.exports = router; 