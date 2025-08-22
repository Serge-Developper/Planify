// @ts-nocheck
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fs = require('fs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const userRoutes = require('./routes/users');
const eventRoutes = require('./routes/events');
const contactRoutes = require('./routes/contact');

const app = express();

// Middleware de sécurité Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// Rate limiting pour les tentatives de connexion
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives max
  message: { message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting général pour l'API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requêtes max
  message: { message: 'Trop de requêtes. Réessayez plus tard.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Ajoute ici le handler global OPTIONS
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// On laisse Plesk gérer les CORS, on supprime la configuration manuelle ici.
// Pour que cela fonctionne en local, on peut activer une configuration simple :
// app.use(cors({
//   origin: ['https://planify.tovmassian.but24.tovmassian.but24.mmi-nancy.fr'],
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
// }));

app.use(express.json({ limit: '10mb' })); // Limite la taille des requêtes

// Middleware pour répondre aux requêtes OPTIONS (préflight CORS)
app.options('*', (req, res) => {
  res.sendStatus(200);
});

// Connexion à MongoDB avec options de sécurité
console.log('MONGO_URI =', process.env.MONGO_URI);
mongoose.connect(process.env.MONGO_URI || '', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
  .then(() => console.log('Connecté à MongoDB'))
  .catch((err) => console.error('Erreur MongoDB :', err));

// Route de test
app.get('/', (req, res) => res.send('API Planifyvrai2 en ligne'));

// Routes avec rate limiting
app.use('/api/users', apiLimiter, userRoutes);
app.use('/api/events', apiLimiter, eventRoutes);
app.use('/api/contact', apiLimiter, contactRoutes);

// Middleware de gestion d'erreurs global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Erreur interne du serveur' });
});

// Lancement du serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur lancé sur le port ${PORT}`);
});
