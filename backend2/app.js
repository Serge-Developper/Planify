// @ts-nocheck
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fs = require('fs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path'); // Added for serving static files

const userRoutes = require('./routes/users');
const eventRoutes = require('./routes/events');
const contactRoutes = require('./routes/contact');
const usersAdminRoutes = require('./routes/users-admin');
const coinsRoutes = require('./routes/coins-simple');
const itemsRoutes = require('./routes/items');
const borderColorsRouter = require('./routes/border-colors');

const app = express();
let lastMongoError = null;



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

// Rate limiting complètement désactivé pour éviter les erreurs 429
// Tous les rate limiters sont commentés pour permettre un fonctionnement normal
console.log('🔄 Rate limiting désactivé pour éviter les erreurs 429');

// === MIDDLEWARE CORS GLOBAL POUR TOUTES LES ROUTES API ===
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://planifymmi.fr');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Gestion optimisée des requêtes OPTIONS pour éviter les erreurs 429
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

// Middleware pour éviter les erreurs 429 - réponse immédiate pour les requêtes OPTIONS
app.options('*', (req, res) => {
  res.status(200).end();
});

// Middleware pour gérer les requêtes OPTIONS (éviter les erreurs 429)
// app.use((req, res, next) => {
//   if (req.method === 'OPTIONS') {
//     res.sendStatus(200);
//   } else {
//     next();
//   }
// });

// CORS géré par Plesk - commenté pour éviter les doublons
// app.use(cors({
//   origin: ['https://planifymmi.fr'],
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
// }));

app.use(express.json({ limit: '35mb' })); // Limite la taille des requêtes
app.use(express.urlencoded({ limit: '35mb', extended: true })); // Pour les formulaires multipart
// Middleware: vérifier l'état de la DB pour éviter des 500 obscurs
function requireDb(req, res, next) {
  const state = mongoose.connection?.readyState;
  if (state !== 1) {
    return res.status(503).json({ success: false, message: 'Base de données indisponible', state });
  }
  next();
}



// Servir les fichiers statiques pour les avatars
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, path) => {
    // Déterminer le type MIME basé sur l'extension
    const ext = require('path').extname(path).toLowerCase();
    let mimeType = 'image/png'; // par défaut
    if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
    else if (ext === '.gif') mimeType = 'image/gif';
    else if (ext === '.webp') mimeType = 'image/webp';
    
    res.set({
      'Content-Type': mimeType,
      'Cache-Control': 'public, max-age=3600', // Cache pendant 1 heure
      'Access-Control-Allow-Origin': '*'
    });
  }
}));

// OPTIONS géré par Plesk - commenté pour éviter les doublons
// app.options('*', (req, res) => {
//   res.sendStatus(200);
// });

// Connexion à MongoDB avec prise en charge de MONGO_URI et MONGODB_URI
const MONGO_URI_SELECTED = process.env.MONGO_URI || process.env.MONGODB_URI || '';
if (process.env.NODE_ENV !== 'production') {
  // Masquer les identifiants éventuels dans les logs
  const masked = MONGO_URI_SELECTED.replace(/\/\/[A-Za-z0-9._%+-]+:[^@]+@/, '//***:***@');
  console.log('Mongo URI utilisé =', masked || '(non défini)');
}
const mongoDbName = process.env.MONGO_DB_NAME || undefined;
const mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 15000,
  socketTimeoutMS: 45000,
  ...(mongoDbName ? { dbName: mongoDbName } : {})
};

mongoose.connect(MONGO_URI_SELECTED, mongoOptions)
  .then(() => { if (process.env.NODE_ENV !== 'production') console.log('Connecté à MongoDB') })
  .catch((err) => { lastMongoError = err; console.error('Erreur MongoDB :', err); });

mongoose.connection.on('error', (err) => { lastMongoError = err; });

// Route de test
app.get('/', (req, res) => res.send('API Planifyvrai2 en ligne'));

// Routes sans rate limiting
app.use('/api/users', requireDb, userRoutes);
app.use('/api/events', requireDb, eventRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/coins', requireDb, coinsRoutes);
app.use('/api/items', requireDb, itemsRoutes);
app.use('/api/users-admin', requireDb, usersAdminRoutes);
app.use('/api/border-colors', borderColorsRouter);

// Endpoint de diagnostic simple
app.get('/api/health', async (req, res) => {
  const state = mongoose.connection?.readyState;
  const states = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  const usedUri = (process.env.MONGO_URI || process.env.MONGODB_URI || '')
    .replace(/:\/\/[A-Za-z0-9._%+-]+:[^@]+@/, '://***:***@');
  res.json({
    ok: true,
    env: {
      node_env: process.env.NODE_ENV || 'development',
      has_jwt_secret: Boolean(process.env.JWT_SECRET),
      has_mongo_uri: Boolean(process.env.MONGO_URI || process.env.MONGODB_URI),
      mongo_uri_preview: usedUri.slice(0, 60) + (usedUri.length > 60 ? '...' : ''),
      mongo_db_name: mongoDbName || null
    },
    mongo: {
      readyState: state,
      state: states[state] || 'unknown',
      lastError: lastMongoError ? String(lastMongoError?.message || lastMongoError) : null
    }
  });
});

// Middleware de gestion d'erreurs global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Erreur interne du serveur' });
});

// Lancement du serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Serveur lancé sur le port ${PORT}`);
  }
});
