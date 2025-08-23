const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// MongoDB connection
let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    return;
  }
  
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    isConnected = true;
  } catch (error) {
    console.error('Erreur de connexion MongoDB:', error);
    throw error;
  }
};

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
  purchasedItems: [{ type: Number }],
  equippedItemId: { type: Number, default: null }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

// CORS headers
const setCorsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

// JWT verification
const verifyToken = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    throw new Error('Token manquant');
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    throw new Error('Token manquant');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'planify-api',
      audience: 'planify-frontend'
    });
    return decoded;
  } catch (error) {
    throw new Error('Token invalide');
  }
};

module.exports = async (req, res) => {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await connectDB();

    // GET /api/coins - Get user coins and inventory
    if (req.method === 'GET') {
      try {
        const user = verifyToken(req);
        const userId = user.id || user._id;
        
        const userData = await User.findById(userId);
        if (!userData) {
          return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }
        
        return res.status(200).json({
          coins: userData.coins || 0,
          purchasedItems: userData.purchasedItems || [],
          equippedItemId: userData.equippedItemId
        });
      } catch (authError) {
        return res.status(401).json({ error: 'Non autorisé' });
      }
    }

    // POST /api/coins - Handle coin operations
    if (req.method === 'POST') {
      try {
        const user = verifyToken(req);
        const userId = user.id || user._id;
        const { action, ...data } = req.body;

        const userData = await User.findById(userId);
        if (!userData) {
          return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        switch (action) {
          case 'purchase':
            const { itemId, price } = data;
            
            if (!itemId || !price) {
              return res.status(400).json({ 
                success: false, 
                message: 'ItemId et prix requis' 
              });
            }

            // Vérifier si déjà acheté
            if (userData.purchasedItems.includes(itemId)) {
              return res.status(400).json({ 
                success: false, 
                message: 'Item déjà acheté' 
              });
            }

            // Vérifier les coins
            if (userData.coins < price) {
              return res.status(400).json({ 
                success: false, 
                message: 'Coins insuffisants' 
              });
            }

            // Effectuer l'achat
            userData.coins -= price;
            userData.purchasedItems.push(itemId);
            await userData.save();

            return res.status(200).json({
              success: true,
              message: 'Achat effectué',
              coins: userData.coins,
              purchasedItems: userData.purchasedItems
            });

          case 'equip':
            const { itemId: equipItemId } = data;
            
            if (!userData.purchasedItems.includes(equipItemId)) {
              return res.status(400).json({ 
                success: false, 
                message: 'Item non possédé' 
              });
            }

            userData.equippedItemId = equipItemId;
            await userData.save();

            return res.status(200).json({
              success: true,
              message: 'Item équipé',
              equippedItemId: userData.equippedItemId
            });

          default:
            return res.status(400).json({ error: 'Action non supportée' });
        }
      } catch (authError) {
        return res.status(401).json({ error: 'Non autorisé' });
      }
    }

    return res.status(405).json({ error: 'Méthode non autorisée' });

  } catch (error) {
    console.error('Erreur API coins:', error);
    res.status(500).json({ error: 'Erreur serveur interne' });
  }
};