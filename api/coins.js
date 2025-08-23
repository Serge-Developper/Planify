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

// Appliquer CORS à toutes les routes
router.use(corsMiddleware);

// Route de test simple
router.get('/test', (req, res) => {
  res.json({ 
    message: 'API coins fonctionne', 
    timestamp: new Date().toISOString() 
  });
});

// Récupérer les coins d'un utilisateur
router.get('/user-coins', verifyToken, async (req, res) => {
  try {
    await connectDB();
    
    const userId = req.user.id || req.user._id;
    
    const user = await User.findById(userId);
    if (!user) {
      res.json({ coins: 0 });
      return;
    }
    
    res.json({ coins: user.coins || 0 });
  } catch (error) {
    console.error('Erreur récupération coins:', error);
    res.json({ coins: 0 });
  }
});

// Récupérer l'inventaire des items achetés
router.get('/inventory', verifyToken, async (req, res) => {
  try {
    await connectDB();
    
    const userId = req.user.id || req.user._id;
    
    const user = await User.findById(userId);
    if (!user) {
      res.json({ purchasedItems: [], equippedItemId: null });
      return;
    }
    
    // S'assurer que tous les utilisateurs possèdent l'item "Bordure Classique" (id 0)
    try {
      const hasClassic = (user.purchasedItems || []).some(it => it.itemId === 0)
      if (!hasClassic) {
        user.purchasedItems.push({
          itemId: 0,
          itemName: 'Bordure Classique',
          purchaseDate: new Date(),
          equipped: false
        })
        await user.save()
      }
    } catch (e) {
      console.warn('Impossible d\'ajouter automatiquement Bordure Classique:', e?.message)
    }

    res.json({ 
      purchasedItems: user.purchasedItems || [],
      equippedItemId: user.equippedItemId,
      selectedBorderColor: user.selectedBorderColor || 'default'
    });
  } catch (error) {
    console.error('Erreur récupération inventaire:', error);
    res.json({ purchasedItems: [], equippedItemId: null, selectedBorderColor: 'default' });
  }
});

// Acheter un item
router.post('/purchase', verifyToken, async (req, res) => {
  try {
    await connectDB();
    
    const userId = req.user.id || req.user._id;
    const { itemId, itemName, price } = req.body;
    
    if (!itemId || !itemName || !price) {
      res.status(400).json({ 
        success: false, 
        message: 'Informations manquantes pour l\'achat' 
      });
      return;
    }
    
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ 
        success: false, 
        message: 'Utilisateur non trouvé' 
      });
      return;
    }
    
    // Vérifier si l'utilisateur a déjà acheté cet item
    const alreadyPurchased = user.purchasedItems.some(item => item.itemId === itemId);
    if (alreadyPurchased) {
      res.json({ 
        success: false, 
        message: 'Vous possédez déjà cet item' 
      });
      return;
    }
    
    // Vérifier si l'utilisateur a assez de coins
    if (user.coins < price) {
      res.json({ 
        success: false, 
        message: 'Coins insuffisants' 
      });
      return;
    }
    
    // Effectuer l'achat
    user.coins -= price;
    user.purchasedItems.push({
      itemId: itemId,
      itemName: itemName,
      purchaseDate: new Date(),
      equipped: false
    });
    
    await user.save();
    
    res.json({ 
      success: true, 
      message: 'Achat effectué avec succès',
      newCoins: user.coins,
      purchasedItems: user.purchasedItems
    });
    
  } catch (error) {
    console.error('Erreur achat item:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de l\'achat' 
    });
  }
});

// Équiper un item
router.post('/equip', verifyToken, async (req, res) => {
  try {
    await connectDB();
    
    const userId = req.user.id || req.user._id;
    const { itemId } = req.body;
    
    if (itemId === undefined) {
      res.status(400).json({ 
        success: false, 
        message: 'ID de l\'item manquant' 
      });
      return;
    }
    
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ 
        success: false, 
        message: 'Utilisateur non trouvé' 
      });
      return;
    }
    
    // Vérifier si l'utilisateur possède cet item
    const hasItem = user.purchasedItems.some(item => item.itemId === itemId);
    if (!hasItem) {
      res.json({ 
        success: false, 
        message: 'Vous ne possédez pas cet item' 
      });
      return;
    }
    
    // Équiper l'item
    user.equippedItemId = itemId;
    await user.save();
    
    res.json({ 
      success: true, 
      message: 'Item équipé avec succès',
      equippedItemId: user.equippedItemId
    });
    
  } catch (error) {
    console.error('Erreur équipement item:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de l\'équipement' 
    });
  }
});

// Déséquiper un item
router.post('/unequip', verifyToken, async (req, res) => {
  try {
    await connectDB();
    
    const userId = req.user.id || req.user._id;
    
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ 
        success: false, 
        message: 'Utilisateur non trouvé' 
      });
      return;
    }
    
    // Déséquiper l'item
    user.equippedItemId = null;
    await user.save();
    
    res.json({ 
      success: true, 
      message: 'Item déséquipé avec succès',
      equippedItemId: null
    });
    
  } catch (error) {
    console.error('Erreur déséquipement item:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors du déséquipement' 
    });
  }
});

// Route pour le spin de la roue de la fortune
router.post('/spin', verifyToken, async (req, res) => {
  try {
    await connectDB();
    
    const userId = req.user.id || req.user._id;
    
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ 
        success: false, 
        message: 'Utilisateur non trouvé' 
      });
      return;
    }
    
    // Vérifier si l'utilisateur peut faire un spin (une fois par jour)
    const now = new Date();
    const lastSpin = user.lastSpinDate;
    
    if (lastSpin) {
      const lastSpinDate = new Date(lastSpin);
      const timeDiff = now.getTime() - lastSpinDate.getTime();
      const hoursDiff = timeDiff / (1000 * 3600);
      
      if (hoursDiff < 24) {
        const remainingHours = Math.ceil(24 - hoursDiff);
        res.json({ 
          success: false, 
          message: `Vous devez attendre encore ${remainingHours} heure(s) avant de pouvoir refaire un spin`,
          canSpin: false,
          remainingHours: remainingHours
        });
        return;
      }
    }
    
    // Générer un gain aléatoire (1-50 coins)
    const gain = Math.floor(Math.random() * 50) + 1;
    
    // Mettre à jour les coins et la date du dernier spin
    user.coins += gain;
    user.lastSpinDate = now;
    await user.save();
    
    res.json({ 
      success: true, 
      message: `Félicitations ! Vous avez gagné ${gain} coins !`,
      gain: gain,
      newCoins: user.coins,
      canSpin: false
    });
    
  } catch (error) {
    console.error('Erreur spin:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors du spin' 
    });
  }
});

// Route pour vérifier le statut du spin
router.get('/spin-status', verifyToken, async (req, res) => {
  try {
    await connectDB();
    
    const userId = req.user.id || req.user._id;
    
    const user = await User.findById(userId);
    if (!user) {
      res.json({ canSpin: true });
      return;
    }
    
    const now = new Date();
    const lastSpin = user.lastSpinDate;
    
    if (!lastSpin) {
      res.json({ canSpin: true });
      return;
    }
    
    const lastSpinDate = new Date(lastSpin);
    const timeDiff = now.getTime() - lastSpinDate.getTime();
    const hoursDiff = timeDiff / (1000 * 3600);
    
    if (hoursDiff >= 24) {
      res.json({ canSpin: true });
    } else {
      const remainingHours = Math.ceil(24 - hoursDiff);
      res.json({ 
        canSpin: false, 
        remainingHours: remainingHours 
      });
    }
    
  } catch (error) {
    console.error('Erreur vérification spin:', error);
    res.json({ canSpin: true });
  }
});

export default router;
