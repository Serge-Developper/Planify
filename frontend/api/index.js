require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const userRoutes = require('./routes/users');
const eventRoutes = require('./routes/events');
const contactRoutes = require('./routes/contact');
const coinsRoutes = require('./routes/coins-simple');
const itemsRoutes = require('./routes/items');

const app = express();

// Middleware CORS pour Vercel
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://planify-snowy.vercel.app');
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

// Connexion MongoDB
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connecté à MongoDB'))
  .catch((err) => console.error('❌ Erreur MongoDB :', err));
}

// Route de test
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'API Planify fonctionne correctement',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/coins', coinsRoutes);
app.use('/api/items', itemsRoutes);

// Middleware de gestion d'erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Erreur interne du serveur' });
});

module.exports = app; 
