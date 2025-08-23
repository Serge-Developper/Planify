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

// Liste des items disponibles (identique à votre configuration)
const availableItems = [
  { id: 0, name: 'Bordure Classique', price: 0, description: 'Bordure classique par défaut', type: 'border' },
  { id: 1, name: 'Bordure Arc-en-ciel', price: 50, description: 'Bordure colorée arc-en-ciel', type: 'border' },
  { id: 2, name: 'Bordure Dorée', price: 100, description: 'Bordure dorée élégante', type: 'border' },
  { id: 3, name: 'Bordure Néon', price: 75, description: 'Bordure néon lumineuse', type: 'border' },
  { id: 4, name: 'Bordure Galaxy', price: 150, description: 'Bordure galaxy mystérieuse', type: 'border' },
  { id: 5, name: 'Bordure Cristal', price: 200, description: 'Bordure cristal transparente', type: 'border' },
  { id: 6, name: 'Bordure Feu', price: 125, description: 'Bordure feu ardente', type: 'border' },
  { id: 7, name: 'Bordure Glace', price: 125, description: 'Bordure glace cristalline', type: 'border' },
  { id: 8, name: 'Bordure Électrique', price: 175, description: 'Bordure électrique dynamique', type: 'border' },
  { id: 9, name: 'Bordure Nature', price: 80, description: 'Bordure nature verdoyante', type: 'border' }
];

// Route pour récupérer tous les items disponibles
router.get('/', async (req, res) => {
  try {
    res.json({
      success: true,
      items: availableItems
    });
  } catch (error) {
    console.error('Erreur récupération items:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des items'
    });
  }
});

// Route pour récupérer un item spécifique
router.get('/:itemId', async (req, res) => {
  try {
    const itemId = parseInt(req.params.itemId);
    const item = availableItems.find(item => item.id === itemId);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item non trouvé'
      });
    }
    
    res.json({
      success: true,
      item: item
    });
  } catch (error) {
    console.error('Erreur récupération item:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'item'
    });
  }
});

// Route pour offrir un item à un utilisateur (admin seulement)
router.post('/gift', verifyToken, requireAdmin, async (req, res) => {
  try {
    await connectDB();
    
    const { targetUsername, itemId, itemName, adminMessage } = req.body;
    
    if (!targetUsername || itemId === undefined || !itemName) {
      return res.status(400).json({
        success: false,
        message: 'Informations manquantes pour l\'offre'
      });
    }
    
    // Vérifier que l'item existe
    const item = availableItems.find(item => item.id === itemId);
    if (!item) {
      return res.status(400).json({
        success: false,
        message: 'Item invalide'
      });
    }
    
    // Trouver l'utilisateur cible
    const targetUser = await User.findOne({ username: targetUsername });
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur cible non trouvé'
      });
    }
    
    // Vérifier si l'utilisateur a déjà cet item
    const alreadyHasItem = targetUser.purchasedItems.some(item => item.itemId === itemId);
    if (alreadyHasItem) {
      return res.json({
        success: false,
        message: 'L\'utilisateur possède déjà cet item'
      });
    }
    
    // Ajouter l'item à l'utilisateur
    targetUser.purchasedItems.push({
      itemId: itemId,
      itemName: itemName,
      purchaseDate: new Date(),
      equipped: false,
      adminMessage: adminMessage || null,
      adminGiftRead: false
    });
    
    await targetUser.save();
    
    res.json({
      success: true,
      message: `Item "${itemName}" offert avec succès à ${targetUsername}`,
      giftedItem: {
        itemId: itemId,
        itemName: itemName,
        adminMessage: adminMessage
      }
    });
    
  } catch (error) {
    console.error('Erreur offre item:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'offre de l\'item'
    });
  }
});

// Route pour marquer un cadeau comme lu
router.post('/ack-gift/:giftId', verifyToken, async (req, res) => {
  try {
    await connectDB();
    
    const giftId = req.params.giftId;
    const userId = req.user.id || req.user._id;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    // Trouver l'item dans purchasedItems et le marquer comme lu
    const itemIndex = user.purchasedItems.findIndex(item => 
      item._id.toString() === giftId || item.itemId.toString() === giftId
    );
    
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Cadeau non trouvé'
      });
    }
    
    user.purchasedItems[itemIndex].adminGiftRead = true;
    await user.save();
    
    res.json({
      success: true,
      message: 'Cadeau marqué comme lu'
    });
    
  } catch (error) {
    console.error('Erreur acknowledgment cadeau:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du marquage du cadeau'
    });
  }
});

// Route pour récupérer les items d'un utilisateur spécifique (admin seulement)
router.get('/user/:username', verifyToken, requireAdmin, async (req, res) => {
  try {
    await connectDB();
    
    const targetUsername = req.params.username;
    
    const user = await User.findOne({ username: targetUsername });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    res.json({
      success: true,
      user: {
        username: user.username,
        purchasedItems: user.purchasedItems,
        equippedItemId: user.equippedItemId,
        selectedBorderColor: user.selectedBorderColor
      }
    });
    
  } catch (error) {
    console.error('Erreur récupération items utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des items'
    });
  }
});

export default router;
