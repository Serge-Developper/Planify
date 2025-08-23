// Script pour réinitialiser le rate limiting
const rateLimit = require('express-rate-limit');

// Créer un nouveau limiter avec un délai plus court pour les tests
const testLoginLimiter = rateLimit.default({
  windowMs: 1 * 60 * 1000, // 1 minute au lieu de 15
  max: 10, // 10 tentatives au lieu de 5
  message: { message: 'Trop de tentatives de connexion. Réessayez dans 1 minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});

console.log('Rate limiting temporairement réduit pour les tests');
console.log('Redémarre le serveur pour appliquer les changements');

module.exports = { testLoginLimiter }; 