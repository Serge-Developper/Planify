const mongoose = require('mongoose');

// CORS headers
const setCorsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
};

// MongoDB connection
let isConnected = false;
async function connectDB() {
  if (isConnected) return;
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    isConnected = true;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

// JWT verification
const jwt = require('jsonwebtoken');
function verifyToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Token manquant');
  }
  const token = authHeader.substring(7);
  return jwt.verify(token, process.env.JWT_SECRET, {
    issuer: 'planify-api',
    audience: 'planify-frontend'
  });
}

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  coins: { type: Number, default: 0 },
  avatar: { type: String, default: null },
  role: { type: String, enum: ['admin', 'prof', 'delegue', 'eleve', 'etudiant'], required: true },
  year: { type: String, enum: ['BUT1', 'BUT2', 'BUT3'], default: null },
  groupe: { type: String, enum: ['A', "A'", 'A2', 'B', "B'", 'B2', 'Promo'], default: null },
  secretQuestions: [{
    question: { type: String, required: true },
    answer: { type: String, required: true }
  }],
  purchasedItems: [{
    itemId: { type: Number, required: true },
    itemName: { type: String, required: true },
    purchaseDate: { type: Date, default: Date.now },
    equipped: { type: Boolean, default: false },
    adminMessage: { type: String, default: null }
  }],
  equippedItemId: { type: Number, default: null },
  completedTasks: { type: Number, default: 0 },
  lastSpinDate: { type: Date, default: null }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = async (req, res) => {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await connectDB();
    console.log('🛒 Purchase start:', { method: req.method, body: req.body });
    
    const user = verifyToken(req);
    const userIdString = user.id || user._id;
    
    console.log('🛒 User from token:', { userIdString, userObj: user });
    
    if (!userIdString || !mongoose.Types.ObjectId.isValid(userIdString)) {
      console.error('❌ Invalid userId:', userIdString);
      return res.status(400).json({ 
        success: false, 
        message: 'UserId invalide' 
      });
    }
    
    if (req.method === 'POST') {
      const { itemId, itemName, price, type } = req.body;
      
      console.log('🛒 Purchase data:', { itemId, itemName, price, type });
      
      if (!itemId || !itemName || !price) {
        return res.status(400).json({ 
          success: false, 
          message: 'Informations manquantes pour l\'achat' 
        });
      }
      
      const userDoc = await User.findById(userIdString);
      if (!userDoc) {
        return res.status(404).json({ 
          success: false, 
          message: 'Utilisateur non trouvé' 
        });
      }
      
      console.log('🛒 User found:', { username: userDoc.username, coins: userDoc.coins, purchasedItems: userDoc.purchasedItems.length });
      
      // Vérifier si l'utilisateur a déjà acheté cet item
      const alreadyPurchased = userDoc.purchasedItems.some(item => item.itemId === itemId);
      if (alreadyPurchased) {
        return res.json({ 
          success: false, 
          message: 'Vous avez déjà acheté cet item' 
        });
      }
      
      // Vérifier si l'utilisateur a assez de coins
      if (userDoc.coins < price) {
        return res.json({ 
          success: false, 
          message: 'Coins insuffisants pour cet achat' 
        });
      }
      
      // Déduire les coins et ajouter l'item
      userDoc.coins -= price;
      const purchasedItem = {
        itemId,
        itemName,
        purchaseDate: new Date(),
        equipped: false
      };
      userDoc.purchasedItems.push(purchasedItem);
      
      await userDoc.save();
      
      console.log('✅ Purchase successful:', { itemId, itemName, newCoins: userDoc.coins });
      
      return res.json({
        success: true,
        message: `Achat réussi ! Vous avez acheté ${itemName}`,
        newCoins: userDoc.coins,
        purchasedItem
      });
    }
    
    return res.status(405).json({ 
      success: false, 
      message: 'Méthode non autorisée' 
    });
    
  } catch (authError) {
    console.error('❌ Erreur auth purchase:', authError.message);
    return res.status(401).json({ 
      success: false, 
      message: 'Non autorisé' 
    });
  } catch (error) {
    console.error('❌ Erreur purchase:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de l\'achat',
      error: error.message 
    });
  }
};