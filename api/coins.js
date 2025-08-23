// @ts-nocheck
import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

const app = express();

// Middleware CORS
app.use((req, res, next) => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['https://planify-snowy.vercel.app'];
  const origin = req.headers.origin;
  
  if (origin && allowedOrigins.includes(origin)) {
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
});

app.use(express.json({ limit: '35mb' }));
app.use(express.urlencoded({ limit: '35mb', extended: true }));

// Modèle User
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  coins: {
    type: Number,
    default: 0
  },
  avatar: {
    type: String,
    default: null
  },
  inventory: [{
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item'
    },
    equipped: {
      type: Boolean,
      default: false
    },
    equippedSlot: {
      type: String,
      enum: ['avatar', 'border', 'background'],
      default: 'avatar'
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', userSchema);

// Connexion à MongoDB
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('MONGODB_URI manquante');
      return;
    }
    
    await mongoose.connect(mongoUri);
    console.log('Connecté à MongoDB');
  } catch (err) {
    console.error('Erreur MongoDB :', err);
  }
};

// Middleware de vérification du token
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Token manquant' });
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({ success: false, message: 'Configuration JWT manquante' });
    }
    
    const decoded = jwt.verify(token, jwtSecret);
    
    // Vérifier que decoded est un objet et contient userId
    if (typeof decoded === 'string' || !decoded.userId) {
      return res.status(401).json({ success: false, message: 'Token invalide' });
    }
    
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'Utilisateur non trouvé' });
    }
    
    // Ajouter user à req
    req.user = user;
    next();
  } catch (error) {
    console.error('Erreur vérification token:', error);
    res.status(401).json({ success: false, message: 'Token invalide' });
  }
};

// GET /api/coins/weekly-items
app.get('/weekly-items', async (req, res) => {
  try {
    await connectDB();
    res.json({
      success: true,
      items: []
    });
  } catch (error) {
    console.error('Erreur weekly-items:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// GET /api/coins/user-coins
app.get('/user-coins', verifyToken, async (req, res) => {
  try {
    // Vérifier que req.user existe
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Utilisateur non authentifié' });
    }
    
    res.json({
      success: true,
      coins: req.user.coins || 0,
      user: {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email
      }
    });
  } catch (error) {
    console.error('Erreur user-coins:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

export default app;
