// @ts-nocheck
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fs = require('fs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path'); // Added for serving static files
const jwt = require('jsonwebtoken');
const User = require('./models/User');

let webpush; try { webpush = require('web-push'); } catch {}
const VAPID_PUBLIC_KEY = process.env.PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.PRIVATE_KEY || process.env.VAPID_PRIVATE_KEY || '';
try { if (webpush && VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) { webpush.setVapidDetails('mailto:admin@planifymmi.fr', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY); } } catch {}

const userRoutes = require('./routes/users');
const eventRoutes = require('./routes/events');
const eventGroupsRoutes = require('./routes/events-groups');
const contactRoutes = require('./routes/contact');
const eventProposalsRoutes = require('./routes/events-proposals');
const usersAdminRoutes = require('./routes/users-admin');
const coinsRoutes = require('./routes/coins-simple');
const itemsRoutes = require('./routes/items');
const subjectsRoutes = require('./routes/subjects');
const factionsRoutes = require('./routes/factions');
// Routeur réel pour les couleurs de bordure
const borderColorsRoutes = require('./routes/border-colors');
const ephemeralPopupsRoutes = require('./routes/ephemeral-popups');
const redeemCodesRouter = require('./routes/redeem-codes');
const questsRoutes = require('./routes/quests');

// AJOUT: Patch Notes (persistés)
const patchNotesRoutes = require('./routes/patch-notes');

const app = express();
let lastMongoError = null;



// Masquer l'en-tête X-Powered-By
try { app.disable('x-powered-by'); } catch {}
// Middleware de sécurité Helmet avec CSP pour autoriser eval()
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-eval'", "'unsafe-inline'"], // Nécessaire pour Vite
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https://api.planifymmi.fr"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://fonts.googleapis.com"],
      frameSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"]
    },
  },
  crossOriginEmbedderPolicy: false
}));

// Rendre les réponses moins exploitables cross-origin
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});

// Rate limiting global anti-abus (conservateur)
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 600,            // 600 requêtes/minute par IP (augmenté pour éviter les 429)
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Exclure les routes admin du rate limiting
    return req.method === 'OPTIONS' || 
           req.path === '/api/health' ||
           req.path.startsWith('/api/users-admin') ||
           req.path.startsWith('/api/border-colors') ||
           req.path.startsWith('/api/items')
  }
});

// === MIDDLEWARE CORS + ORIGIN WHITELIST POUR TOUTES LES ROUTES API ===
const ALLOWED_ORIGINS = new Set([
  'https://planifymmi.fr',
  'https://www.planifymmi.fr',
  'http://localhost:5173',
  'http://localhost',
  'http://127.0.0.1',
  'http://10.0.2.2',
]);

const maintenanceRaw = String(process.env.MAINTENANCE || '').toLowerCase();
const maintenanceEnabled = false;
const maintenanceAllowIps = new Set(
  String(process.env.MAINTENANCE_ALLOW_IPS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
);

function normalizeIp(ip) {
  if (!ip) return '';
  if (ip.startsWith('::ffff:')) return ip.slice(7);
  if (ip === '::1') return '127.0.0.1';
  return ip;
}

function getClientIp(req) {
  const xf = req.headers['x-forwarded-for'];
  if (typeof xf === 'string' && xf.length > 0) return normalizeIp(xf.split(',')[0].trim());
  if (Array.isArray(xf) && xf.length > 0) return normalizeIp(xf[0]);
  return normalizeIp(req.socket?.remoteAddress || req.connection?.remoteAddress || '');
}

function isAllowedMaintenanceIp(req) {
  if (!maintenanceAllowIps.size) return false;
  const ip = getClientIp(req);
  return maintenanceAllowIps.has(ip);
}

function hasValidToken(req) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return false;
  const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
  try {
    const decoded = jwt.verify(token, secret, { issuer: 'planify-api', audience: 'planify-frontend' });
    return !!decoded && typeof decoded !== 'string';
  } catch {
    return false;
  }
}

// Middleware CORS (unifié dev+prod)
app.use((req, res, next) => {
  const origin = req.headers.origin || '';
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    // Uniformiser en 200 (plutôt que 204) et terminer ici
    return res.status(200).end();
  }
  next();
});

// Middleware pour éviter les erreurs 429 - réponse immédiate pour les requêtes OPTIONS
app.options('*', (req, res) => {
  res.status(200).end();
});

if (maintenanceEnabled) {
  app.use((req, res, next) => {
    if (!req.path.startsWith('/api')) return next();
    if (!isAllowedMaintenanceIp(req)) return res.status(503).send('');
    if (req.path === '/api/users/login' || req.path === '/api/maintenance-check' || req.path === '/api/health') return next();
    if (hasValidToken(req)) return next();
    return res.status(401).send('');
  });
}


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

// Appliquer le rate limiter global aux routes API
app.use('/api', apiLimiter);

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



// Ajout: répertoire d'uploads configurable
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(__dirname, 'uploads')
// Servir les fichiers statiques pour /uploads (avatars, music, items, ...)
app.use('/uploads', express.static(UPLOADS_DIR, {
  setHeaders: (res, filePath) => {
    try {
      const origin = res.req && res.req.headers ? (res.req.headers.origin || '') : ''
      if (origin && ALLOWED_ORIGINS.has(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin)
        res.setHeader('Vary', 'Origin')
      } else {
        res.setHeader('Access-Control-Allow-Origin', '*')
      }
      if (filePath && (filePath.endsWith('.png') || filePath.endsWith('.jpg') || filePath.endsWith('.jpeg') || filePath.endsWith('.webp'))) {
        res.setHeader('Cache-Control', 'public, max-age=604800, immutable')
      } else {
        res.setHeader('Cache-Control', 'public, max-age=3600')
      }
    } catch {}
  }
}))

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

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET manquant en production. Refus de démarrer.');
  process.exit(1);
}

mongoose.connect(MONGO_URI_SELECTED, mongoOptions)
  .then(() => { if (process.env.NODE_ENV !== 'production') console.log('Connecté à MongoDB') })
  .catch((err) => { lastMongoError = err; console.error('Erreur MongoDB :', err); });

mongoose.connection.on('error', (err) => { lastMongoError = err; });

// Cacher la racine de l'API (retour neutre)
app.get('/', (req, res) => res.status(404).send(''));

app.get('/api/maintenance-check', (req, res) => {
  res.json({ allow: true });
});

// Routes sans rate limiting
app.use('/api/users', requireDb, userRoutes);
app.use('/api/events', requireDb, eventRoutes);
app.use('/api/events', requireDb, eventGroupsRoutes);
// 
app.use('/api/contact', contactRoutes);
app.use('/api/coins', requireDb, coinsRoutes);
app.use('/api/items', requireDb, itemsRoutes);
app.use('/api/factions', requireDb, factionsRoutes);
app.use('/api/subjects', requireDb, subjectsRoutes);
app.use('/api/users-admin', requireDb, usersAdminRoutes);
app.use('/api/border-colors', requireDb, borderColorsRoutes);
app.use('/api/popups', ephemeralPopupsRoutes);
app.use('/api/redeem-codes', redeemCodesRouter);
app.use('/api/quests', requireDb, questsRoutes);

app.use('/api/events', requireDb, eventProposalsRoutes);

// AJOUT: route Patch Notes
app.use('/api/patch-notes', requireDb, patchNotesRoutes);

// Test direct de l'endpoint static-rules pour diagnostiquer le problème
app.get('/api/subjects/static-rules/test', (req, res) => {
  console.log('🧪 Test direct de l\'endpoint static-rules');
  res.json({ 
    message: 'Test direct fonctionne', 
    timestamp: new Date().toISOString(),
    routes: 'Endpoint de test dans app.js'
  });
});

// Endpoint de diagnostic simple
app.get('/api/health', async (req, res) => {
  // En production, exiger un header secret simple pour éviter l'exposition publique
  if (process.env.NODE_ENV === 'production') {
    const expected = process.env.HEALTHCHECK_KEY || '';
    const received = req.headers['x-healthcheck-key'] || '';
    if (!expected || expected !== received) {
      return res.status(403).json({ ok: false });
    }
  }
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

function getParisNow() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
}

function getParisYMD(date = new Date()) {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return fmt.format(date);
}

async function sendWheelDailyPush() {
  try {
    if (!webpush || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return;
    if (mongoose.connection?.readyState !== 1) return;
    const todayYmd = getParisYMD();
    const users = await User.find({
      'pushPreferences.enabled': true,
      'pushPreferences.wheel': true
    }).select({ pushSubscriptions: 1, wheelNotifyLastYmd: 1 });

    const payload = JSON.stringify({
      title: '🎡 Roue de la fortune',
      body: 'La roue de la fortune est disponible ! Venez la faire tourner.',
      icon: '/planifyFichier_134x.webp?v=2',
      badge: '/planifyFichier_134x.webp?v=2',
      data: { url: '/' }
    });

    for (const user of users) {
      if (user.wheelNotifyLastYmd === todayYmd) continue;
      const subs = Array.isArray(user.pushSubscriptions) ? user.pushSubscriptions : [];
      if (!subs.length) continue;
      let sent = 0;
      for (const sub of subs) {
        try {
          await webpush.sendNotification(sub, payload);
          sent++;
        } catch {}
      }
      if (sent > 0) {
        user.wheelNotifyLastYmd = todayYmd;
        await user.save();
      }
    }
  } catch {}
}

function scheduleWheelPush() {
  const nowParis = getParisNow();
  const next = new Date(nowParis);
  next.setHours(24, 0, 0, 0);
  const waitMs = Math.max(1000, next.getTime() - nowParis.getTime());
  setTimeout(async () => {
    await sendWheelDailyPush();
    scheduleWheelPush();
  }, waitMs);
}

// Middleware de gestion d'erreurs global
app.use((err, req, res, next) => {
  console.error(err.stack);
  const origin = req.headers.origin || '';
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.status(err.status || 500).json({ success: false, message: err?.message || 'Erreur interne' });
});

// Lancement du serveur
const PORT = process.env.PORT || 3000;
const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '0.0.0.0';
app.listen(PORT, HOST, () => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Serveur lancé sur le port ${PORT} (accessible depuis l'émulateur Android)`);
  }
});

scheduleWheelPush();