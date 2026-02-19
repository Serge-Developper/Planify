require('dotenv').config();
const express = require('express');
const app = express();

// CORS basique
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  next();
});

// Route de test
app.get('/', (req, res) => {
  res.json({
    status: 'Application démarrée avec succès',
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      MONGO_URI_exists: Boolean(process.env.MONGO_URI),
      MONGO_DB_NAME: process.env.MONGO_DB_NAME
    }
  });
});

// Route de test variables
app.get('/api/test-env', (req, res) => {
  res.json({
    all_env: process.env
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Test app started on port ${PORT}`);
});