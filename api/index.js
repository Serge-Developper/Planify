// @ts-nocheck
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import nodemailer from 'nodemailer';

const app = express();

// Middleware de sécurité Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// Middleware CORS global pour Vercel
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

// Modèle User (copié de votre backend2)
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

// Modèle Item
const itemSchema = new mongoose.Schema({
  legacyId: {
    type: Number,
    unique: true,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    default: 0
  },
  type: {
    type: String,
    enum: ['generic', 'discord', 'jojo'],
    default: 'generic'
  },
  infoOnly: {
    type: Boolean,
    default: false
  },
  infoDescription: String,
  availableInDailyShop: {
    type: Boolean,
    default: false
  },
  assets: [{
    src: String,
    style: {
      top: { type: Number, default: 0 },
      left: { type: Number, default: 0 },
      width: { type: Number, default: 100 },
      height: Number,
      rotate: { type: Number, default: 0 },
      objectFit: { type: String, default: 'contain' },
      zIndex: { type: Number, default: 1 }
    }
  }],
  backgrounds: {
    collection: String,
    leaderboard: String,
    avatar: String,
    navbar: String,
    'popup-style': String
  },
  variants: [{
    name: String,
    assets: [{
      src: String,
      style: {
        top: { type: Number, default: 0 },
        left: { type: Number, default: 0 },
        width: { type: Number, default: 100 },
        height: Number,
        rotate: { type: Number, default: 0 },
        objectFit: { type: String, default: 'contain' },
        zIndex: { type: Number, default: 1 }
      }
    }],
    backgrounds: {
      collection: String,
      leaderboard: String,
      avatar: String,
      navbar: String,
      'popup-style': String
    },
    textOnly: { type: Boolean, default: false },
    textContent: String
  }]
});

const Item = mongoose.model('Item', itemSchema);

// Modèle Event
const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  startDate: {
    type: Date,
    required: true
  },
  endDate: Date,
  location: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Event = mongoose.model('Event', eventSchema);

// Connexion à MongoDB
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('MONGODB_URI manquante');
      return;
    }
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
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
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'Utilisateur non trouvé' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Erreur vérification token:', error);
    res.status(401).json({ success: false, message: 'Token invalide' });
  }
};

// Route de test
app.get('/', (req, res) => {
  res.json({ 
    message: 'API Planify Vercel en ligne',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Routes API simplifiées (basées sur votre backend2)

// GET /api/coins/weekly-items
app.get('/coins/weekly-items', async (req, res) => {
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
app.get('/coins/user-coins', verifyToken, async (req, res) => {
  try {
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

// GET /api/users/leaderboard
app.get('/users/leaderboard', async (req, res) => {
  try {
    await connectDB();
    const users = await User.find({}, 'username coins avatar')
      .sort({ coins: -1 })
      .limit(10);
    
    res.json({
      success: true,
      users: users.map(user => ({
        id: user._id,
        username: user.username,
        coins: user.coins,
        avatar: user.avatar
      }))
    });
  } catch (error) {
    console.error('Erreur leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// GET /api/items
app.get('/items', async (req, res) => {
  try {
    await connectDB();
    const items = await Item.find({});
    res.json({
      success: true,
      items: items
    });
  } catch (error) {
    console.error('Erreur items:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// GET /api/events
app.get('/events', async (req, res) => {
  try {
    await connectDB();
    const events = await Event.find({}).populate('createdBy', 'username');
    res.json({
      success: true,
      events: events
    });
  } catch (error) {
    console.error('Erreur events:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// POST /api/contact
app.post('/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    
    // Configuration email (à adapter selon vos besoins)
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: `Nouveau message de ${name}`,
      text: `Nom: ${name}\nEmail: ${email}\nMessage: ${message}`
    };
    
    await transporter.sendMail(mailOptions);
    
    res.json({
      success: true,
      message: 'Message envoyé avec succès'
    });
  } catch (error) {
    console.error('Erreur contact:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// Middleware de gestion d'erreurs global
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err);
  res.status(500).json({ 
    success: false,
    message: 'Erreur interne du serveur' 
  });
});

// Gestion des routes non trouvées
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'Route non trouvée' 
  });
});

// Connecter à MongoDB au démarrage
connectDB();

export default app;
