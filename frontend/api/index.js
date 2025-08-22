const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Configuration CORS pour Vercel
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://planify-snowy.vercel.app', 'https://planify.vercel.app']
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language']
}));

// Middleware pour parser le JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/users', require('./routes/users'));
app.use('/api/items', require('./routes/items'));
app.use('/api/events', require('./routes/events'));
app.use('/api/coins', require('./routes/coins-simple'));
app.use('/api/contact', require('./routes/contact'));

// Route de test
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'API Planify fonctionne correctement' });
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erreur interne du serveur' });
});

// Export pour Vercel
module.exports = app; 
