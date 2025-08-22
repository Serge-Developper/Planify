// @ts-nocheck
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

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
      return res.status(400).json({ message: 'Identifiants invalides' });
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
      return res.status(400).json({ message: 'Identifiants invalides' });
    }

    console.log('User trouvé pour login:', user);
    console.log(`Connexion réussie pour ${username}:`, { role: user.role, groupe: user.groupe, year: user.year });

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
  
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    if (!user.secretQuestions || user.secretQuestions.length === 0) {
      return res.status(400).json({ message: 'Aucune question secrète configurée' });
    }

    // Vérifier les réponses
    const isCorrect = user.secretQuestions.every((q, index) => 
      q.answer.toLowerCase().trim() === answers[index].toLowerCase().trim()
    );

    if (isCorrect) {
      res.json({ success: true, message: 'Réponses correctes' });
    } else {
      res.status(400).json({ success: false, message: 'Réponses incorrectes' });
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
  // Vérifier les erreurs de validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
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
router.post('/seed', async (req, res) => {
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

// Route pour voir tous les utilisateurs (debug)
router.get('/all', async (req, res) => {
  try {
    const users = await User.find({}, '-password'); // Exclure les mots de passe
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des utilisateurs', error: error.message });
  }
});

// Création d'utilisateurs
router.post('/register', async (req, res) => {
  const { username, password, role, groupe, year } = req.body;
  const user = new User({ username, password, role, groupe, year });
  await user.save();
  res.json(user);
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
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, role, groupe, year } = req.body;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    // Mettre à jour les champs
    if (username) user.username = username;
    if (password) user.password = password;
    if (role) user.role = role;
    if (groupe !== undefined) user.groupe = groupe;
    if (year !== undefined) user.year = year;
    
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
router.delete('/:id', async (req, res) => {
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

module.exports = router; 