const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// Connect to MongoDB
const connectDB = async () => {
  if (mongoose.connections[0].readyState) {
    return;
  }
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    throw error;
  }
};

// User Schema (matching the main one)
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
  purchasedItems: [{ type: Number }],
  equippedItemId: { type: Number, default: null }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

// CORS headers
const setCorsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

module.exports = async (req, res) => {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await connectDB();

    if (req.method === 'POST') {
      // Get current user from token
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: 'Token manquant' });
      }

      const token = authHeader.split(' ')[1];
      if (!token) {
        return res.status(401).json({ error: 'Token manquant' });
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('🔄 Promotion admin demandée par:', decoded.username, 'role actuel:', decoded.role);
        
        const user = await User.findById(decoded.id);
        if (!user) {
          return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        // Promote to admin
        user.role = 'admin';
        await user.save();
        
        console.log('✅ Utilisateur', user.username, 'promu admin');
        
        return res.status(200).json({
          success: true,
          message: `Utilisateur ${user.username} promu administrateur`,
          user: { ...user.toObject(), password: undefined }
        });
      } catch (error) {
        console.log('❌ Erreur token:', error.message);
        return res.status(401).json({ error: 'Token invalide' });
      }
    }

    return res.status(405).json({ error: 'Méthode non autorisée' });

  } catch (error) {
    console.error('Erreur API promote-admin:', error);
    res.status(500).json({ error: 'Erreur serveur interne' });
  }
};