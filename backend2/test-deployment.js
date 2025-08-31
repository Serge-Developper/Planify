// Script de test pour vérifier le déploiement
const express = require('express');
const app = express();

// Route de test simple
app.get('/test', (req, res) => {
  res.json({
    message: 'API Planify fonctionne !',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3000
  });
});

// Route racine
app.get('/', (req, res) => {
  res.json({
    message: 'API Planify en ligne',
    status: 'OK',
    version: '1.0.0'
  });
});

// Test de connexion MongoDB
app.get('/test-db', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const isConnected = mongoose.connection.readyState === 1;
    res.json({
      database: isConnected ? 'Connecté' : 'Non connecté',
      status: isConnected ? 'OK' : 'ERREUR'
    });
  } catch (error) {
    res.json({
      database: 'Erreur de connexion',
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur de test lancé sur le port ${PORT}`);
});
