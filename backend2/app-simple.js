// Version simplifiée pour tester
const express = require('express');
const app = express();

// Middleware CORS simple
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://planifymmi.fr');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  next();
});

app.use(express.json());

// Route de test simple
app.get('/', (req, res) => {
  res.json({
    message: 'API Planify fonctionne !',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/test', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Test réussi !'
  });
});

// Gestion d'erreurs
app.use((err, req, res, next) => {
  console.error('Erreur:', err);
  res.status(500).json({ 
    error: 'Erreur interne du serveur',
    message: err.message 
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur lancé sur le port ${PORT}`);
});
