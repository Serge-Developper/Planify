const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
  }],
  inventory: [{
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
    equipped: { type: Boolean, default: false },
    equippedSlot: { type: String, enum: ['avatar', 'border', 'background'], default: 'avatar' }
  }],
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

    const { username, email, password } = req.body;

    // Validation des champs requis
    if (!username || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nom d\'utilisateur, email et mot de passe requis' 
      });
    }

    // Validation du mot de passe
    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Le mot de passe doit contenir au moins 6 caractères' 
      });
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ 
      $or: [{ username }, { email }] 
    });

    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        message: 'Nom d\'utilisateur ou email déjà utilisé' 
      });
    }

    // Hasher le mot de passe
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Créer le nouvel utilisateur
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      coins: 100, // Coins de départ
      purchasedItems: [0], // Item par défaut (bordure classique)
      equippedItemId: 0
    });

    const savedUser = await newUser.save();

    // Retourner l'utilisateur sans le mot de passe
    const { password: _, ...userWithoutPassword } = savedUser.toObject();

    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({ 
        success: false, 
        message: 'Nom d\'utilisateur ou email déjà utilisé' 
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur interne' 
    });
  }
};