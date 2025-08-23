import express from 'express';
import mongoose from 'mongoose';

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

// GET /api/coins-weekly-items
app.get('/', async (req, res) => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      return res.status(500).json({ success: false, message: 'Configuration MongoDB manquante' });
    }
    
    await mongoose.connect(mongoUri);
    
    // Pour l'instant, retourner un tableau vide
    // TODO: Implémenter la logique des items hebdomadaires
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

export default app;
