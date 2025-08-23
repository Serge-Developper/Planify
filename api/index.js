// @ts-nocheck
import express from 'express';
import userRoutes from './users.js';
import coinsRoutes from './coins.js';
import itemsRoutes from './items.js';
import eventsRoutes from './events.js';
import contactRoutes from './contact.js';

const app = express();

// Middleware pour parser le JSON
app.use(express.json({ limit: '35mb' }));
app.use(express.urlencoded({ limit: '35mb', extended: true }));

// Middleware CORS global
app.use((req, res, next) => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['https://planify-snowy.vercel.app'];
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
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

// Route de test
app.get('/', (req, res) => {
  res.json({ 
    message: 'API Planify Vercel en ligne',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Routes API
app.use('/users', userRoutes);
app.use('/coins', coinsRoutes);
app.use('/items', itemsRoutes);
app.use('/events', eventsRoutes);
app.use('/contact', contactRoutes);

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

export default app;
