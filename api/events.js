// @ts-nocheck
import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

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

// Modèle Event (identique à votre modèle existant)
const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  location: { type: String, default: '' },
  createdBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Event = mongoose.models.Event || mongoose.model('Event', eventSchema);

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

// Middleware pour vérifier si l'utilisateur est admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Accès refusé - Admin requis' });
  }
  next();
};

// Appliquer CORS à toutes les routes
router.use(corsMiddleware);

// Route pour récupérer tous les événements
router.get('/', async (req, res) => {
  try {
    await connectDB();
    
    const events = await Event.find().sort({ date: 1 });
    
    res.json({
      success: true,
      events: events
    });
    
  } catch (error) {
    console.error('Erreur récupération événements:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des événements'
    });
  }
});

// Route pour créer un événement (admin seulement)
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    await connectDB();
    
    const { title, description, date, location } = req.body;
    
    if (!title || !description || !date) {
      return res.status(400).json({
        success: false,
        message: 'Titre, description et date requis'
      });
    }
    
    const newEvent = new Event({
      title,
      description,
      date: new Date(date),
      location: location || '',
      createdBy: req.user.username
    });
    
    await newEvent.save();
    
    res.status(201).json({
      success: true,
      message: 'Événement créé avec succès',
      event: newEvent
    });
    
  } catch (error) {
    console.error('Erreur création événement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'événement'
    });
  }
});

// Route pour récupérer un événement spécifique
router.get('/:eventId', async (req, res) => {
  try {
    await connectDB();
    
    const event = await Event.findById(req.params.eventId);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Événement non trouvé'
      });
    }
    
    res.json({
      success: true,
      event: event
    });
    
  } catch (error) {
    console.error('Erreur récupération événement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'événement'
    });
  }
});

// Route pour mettre à jour un événement (admin seulement)
router.put('/:eventId', verifyToken, requireAdmin, async (req, res) => {
  try {
    await connectDB();
    
    const { title, description, date, location } = req.body;
    
    const event = await Event.findById(req.params.eventId);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Événement non trouvé'
      });
    }
    
    // Mettre à jour les champs
    if (title) event.title = title;
    if (description) event.description = description;
    if (date) event.date = new Date(date);
    if (location !== undefined) event.location = location;
    
    event.updatedAt = new Date();
    
    await event.save();
    
    res.json({
      success: true,
      message: 'Événement mis à jour avec succès',
      event: event
    });
    
  } catch (error) {
    console.error('Erreur mise à jour événement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de l\'événement'
    });
  }
});

// Route pour supprimer un événement (admin seulement)
router.delete('/:eventId', verifyToken, requireAdmin, async (req, res) => {
  try {
    await connectDB();
    
    const event = await Event.findById(req.params.eventId);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Événement non trouvé'
      });
    }
    
    await Event.findByIdAndDelete(req.params.eventId);
    
    res.json({
      success: true,
      message: 'Événement supprimé avec succès'
    });
    
  } catch (error) {
    console.error('Erreur suppression événement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'événement'
    });
  }
});

export default router;
