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
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  secretQuestions: [{
    question: { type: String, required: true },
    answer: { type: String, required: true }
  }]
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    await connectDB();
    
    const user = verifyToken(req);
    const userId = user.id || user._id;
    
    const { secretQuestions } = req.body;
    
    if (!secretQuestions || !Array.isArray(secretQuestions) || secretQuestions.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Questions secrètes requises' 
      });
    }

    // Validation des questions
    for (const sq of secretQuestions) {
      if (!sq.question || !sq.answer || sq.question.trim() === '' || sq.answer.trim() === '') {
        return res.status(400).json({ 
          success: false, 
          message: 'Toutes les questions et réponses doivent être remplies' 
        });
      }
    }

    const userData = await User.findById(userId);
    if (!userData) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Mettre à jour les questions secrètes
    userData.secretQuestions = secretQuestions.map(sq => ({
      question: sq.question.trim(),
      answer: sq.answer.trim().toLowerCase() // Stocker en minuscules pour comparaison
    }));

    await userData.save();

    return res.status(200).json({
      success: true,
      message: 'Questions secrètes configurées avec succès'
    });

  } catch (authError) {
    return res.status(401).json({ error: 'Non autorisé' });
  } catch (error) {
    console.error('Erreur lors de la configuration des questions secrètes:', error);
    res.status(500).json({ error: 'Erreur serveur interne' });
  }
};