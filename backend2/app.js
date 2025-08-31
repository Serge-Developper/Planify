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

const app = express();



// Gestion globale des erreurs pour éviter un crash silencieux sous Passenger
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

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

// Connexion à MongoDB avec garde si MONGO_URI manquant
const mongoUri = process.env.MONGO_URI;
if (process.env.NODE_ENV !== 'production') {
  console.log('MONGO_URI défini =', Boolean(mongoUri));
}

if (mongoUri && mongoUri.trim().length > 0) {
  mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  })
    .then(() => { if (process.env.NODE_ENV !== 'production') console.log('Connecté à MongoDB'); })
    .catch((err) => console.error('Erreur MongoDB :', err));
} else {
  console.warn('⚠️  MONGO_URI non défini. L\'API démarre sans connexion MongoDB.');
}

// Route de test
app.get('/', (req, res) => res.send('API Planifyvrai2 en ligne'));

// Routes sans rate limiting
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/coins', coinsRoutes);
app.use('/api/items', itemsRoutes);
app.use('/api/users-admin', usersAdminRoutes);

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
