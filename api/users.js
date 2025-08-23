// @ts-nocheck
import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configuration MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connecté');
  } catch (error) {
    console.error('Erreur MongoDB:', error);
  }
};

// Modèle User (identique à votre modèle existant)
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'prof', 'delegue', 'eleve', 'etudiant'], required: true },
  groupe: { type: String, enum: ['A', "A'", 'A"', 'B', "B'", 'B"', 'Promo'], default: null },
  year: { type: String, default: null },
  avatar: { type: String, default: null },
  coins: { type: Number, default: 0 },
  completedTasks: { type: Number, default: 0 },
  validations: { type: Number, default: 0 },
  lastSpinDate: { type: Date, default: null },
  purchasedItems: [{
    itemId: { type: Number, required: true },
    itemName: { type: String, required: true },
    purchaseDate: { type: Date, default: Date.now },
    equipped: { type: Boolean, default: false },
    adminMessage: { type: String, default: null },
    adminGiftRead: { type: Boolean, default: false }
  }],
  equippedItemId: { type: Number, default: null, required: false },
  selectedBorderColor: { type: String, default: 'default' },
  secretQuestions: [{
    question: { type: String, required: true },
    answer: { type: String, required: true }
  }]
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

// Configuration Multer pour les avatars (adaptée pour Vercel)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 35 * 1024 * 1024 }, // 35MB comme dans votre config
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images sont autorisées'), false);
    }
  }
});

// Middleware CORS pour Vercel
const corsMiddleware = (req, res, next) => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['https://planify-snowy.vercel.app'];
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
};

// Middleware d'authentification
const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Token manquant' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id || decoded.userId);
    
    if (!user) {
      return res.status(401).json({ message: 'Utilisateur non trouvé' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Erreur vérification token:', error);
    res.status(401).json({ message: 'Token invalide' });
  }
};

// Appliquer CORS à toutes les routes
router.use(corsMiddleware);

// Route de connexion (identique à votre logique)
router.post('/login', async (req, res) => {
  try {
    await connectDB();
    
    const { username, password } = req.body;
    console.log('=== DÉBUT CONNEXION ===');
    console.log('Tentative de connexion pour:', username);
    
    if (!username || !password) {
      return res.status(400).json({ message: 'Nom d\'utilisateur et mot de passe requis' });
    }
    
    const user = await User.findOne({ username });
    if (!user) {
      console.log(`Utilisateur ${username} non trouvé`);
      return res.status(400).json({ message: 'Nom d\'utilisateur ou mot de passe incorrect' });
    }
    
    console.log('Utilisateur trouvé:', { 
      username: user.username, 
      role: user.role
    });
    
    // Vérifier le mot de passe
    let isValidPassword = false;
    
    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
      console.log('Mot de passe déjà haché, utilisation de bcrypt');
      isValidPassword = await bcrypt.compare(password, user.password);
    } else {
      console.log('Mot de passe en clair, comparaison directe');
      isValidPassword = (user.password === password);
      
      // Si la connexion réussit, hasher le mot de passe
      if (isValidPassword) {
        console.log('Connexion réussie, migration vers bcrypt...');
        const hashedPassword = await bcrypt.hash(password, 12);
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
    
    // Créer le token JWT
    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        role: user.role,
        year: user.year,
        groupe: user.groupe
      },
      process.env.JWT_SECRET,
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
      avatar: user.avatar,
      token: token,
      hasSecretQuestions: Boolean(user.secretQuestions && user.secretQuestions.length === 3)
    });
    
  } catch (error) {
    console.error('=== ERREUR CONNEXION ===');
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

// Route pour upload d'avatar (adaptée de votre logique)
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
      const oldAvatarPath = path.join(process.cwd(), 'public', 'uploads', 'avatars', path.basename(user.avatar));
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

    console.log('✅ Avatar mis à jour:', newAvatarPath);
    
    res.json({ 
      message: 'Avatar mis à jour avec succès',
      avatar: newAvatarPath
    });
    
  } catch (error) {
    console.error('❌ Erreur upload avatar:', error);
    res.status(500).json({ message: 'Erreur lors de l\'upload' });
  }
});

// Route pour récupérer le profil utilisateur
router.get('/profile', verifyToken, async (req, res) => {
  try {
    await connectDB();
    
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    res.json({ user });
    
  } catch (error) {
    console.error('Erreur profil:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route pour le leaderboard (adaptée de votre logique)
router.get('/', async (req, res) => {
  try {
    await connectDB();
    
    console.log('🏆 Chargement du leaderboard...');
    
    // Récupérer tous les utilisateurs avec leurs stats
    const users = await User.find({}, {
      projection: {
        username: 1,
        role: 1,
        groupe: 1,
        year: 1,
        coins: 1,
        avatar: 1,
        completedTasks: 1,
        validations: 1,
        equippedItemId: 1,
        selectedBorderColor: 1,
        purchasedItems: 1
      }
    });
    
    // Formater les données pour le frontend
    const formattedUsers = users.map(user => ({
      username: user.username,
      role: user.role || 'Non défini',
      groupe: user.groupe || 'Non défini',
      year: user.year || 'Non définie',
      coins: user.coins || 0,
      avatar: user.avatar || null,
      completedTasks: user.completedTasks || 0,
      validations: user.validations || 0,
      equippedItemId: user.equippedItemId || null,
      selectedBorderColor: user.selectedBorderColor || 'default',
      purchasedItems: user.purchasedItems || []
    }));
    
    console.log('✅ Leaderboard chargé:', formattedUsers.length, 'utilisateurs');
    
    res.json({
      success: true,
      users: formattedUsers
    });
    
  } catch (error) {
    console.error('❌ Erreur lors du chargement du leaderboard:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur interne du serveur' 
    });
  }
});

// Route pour récupérer un utilisateur spécifique
router.get('/:userId', async (req, res) => {
  try {
    await connectDB();
    
    console.log('👤 Récupération utilisateur:', req.params.userId);
    
    // Récupérer l'utilisateur par ID ou username
    let user;
    if (req.params.userId.match(/^[0-9a-fA-F]{24}$/)) {
      // C'est un ObjectId MongoDB
      user = await User.findById(req.params.userId).select('-password');
    } else {
      // C'est probablement un username
      user = await User.findOne({ username: req.params.userId }).select('-password');
    }
    
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    res.json({
      success: true,
      user: user
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération utilisateur:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur interne du serveur' 
    });
  }
});

export default router;


