// @ts-nocheck
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fs = require('fs');

const app = express();

// Middleware CORS global
const whitelist = ['http://localhost:5173', 'http://192.168.1.32:5173'];
const corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true
}
app.use(cors(corsOptions));
app.use(express.json());

// Connexion à MongoDB
console.log('MONGO_URI =', process.env.MONGO_URI);
mongoose.connect(process.env.MONGO_URI || '')
  .then(() => console.log('Connecté à MongoDB'))
  .catch((err) => console.error('Erreur MongoDB :', err));

// Route de test
app.get('/', (req, res) => res.send('API Planifyvrai2 en ligne'));

const eventRoutes = require('./routes/events');
app.use('/api/events', eventRoutes);

const userRoutes = require('./routes/users');
app.use('/api/users', userRoutes);

// Lancement du serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur lancé sur le port ${PORT}`));
