const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

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

// User Schema
const UserSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  role: { type: String, default: 'user' },
  coins: { type: Number, default: 0 },
  lastSpinDate: Date,
  inventory: [{
    itemId: String,
    itemName: String,
    itemType: String,
    quantity: { type: Number, default: 1 },
    isEquipped: { type: Boolean, default: false },
    acquiredAt: { type: Date, default: Date.now }
  }],
  secretQuestions: [{
    question: String,
    answer: String
  }]
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

// JWT verification
function verifyToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Token manquant');
  }
  
  const token = authHeader.substring(7);
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Token invalide');
  }
}

module.exports = async (req, res) => {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await connectDB();
    
    if (req.method === 'GET') {
      const user = verifyToken(req);
      const userId = user.id || user._id;
      
      const userData = await User.findById(userId).select('coins');
      if (!userData) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }
      
      return res.status(200).json({ 
        success: true, 
        coins: userData.coins || 0 
      });
    }
    
    return res.status(405).json({ error: 'Méthode non autorisée' });
  } catch (error) {
    console.error('Erreur user-coins:', error);
    if (error.message === 'Token manquant' || error.message === 'Token invalide') {
      return res.status(401).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};