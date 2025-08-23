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
    
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      return res.status(500).json({ success: false, message: 'Configuration MongoDB manquante' });
    }
    
    await mongoose.connect(mongoUri);
    
    // Pour l'instant, simuler un utilisateur
    // TODO: Implémenter la vraie logique utilisateur
    req.user = {
      _id: decoded.userId || 'default-user-id',
      username: 'user',
      email: 'user@example.com',
      coins: 100
    };
    
    next();
  } catch (error) {
    console.error('Erreur vérification token:', error);
    res.status(401).json({ success: false, message: 'Token invalide' });
  }
};

// GET /api/coins-user-coins
app.get('/', verifyToken, async (req, res) => {
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

export default app;
