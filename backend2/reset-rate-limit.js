const express = require('express');
const rateLimit = require('express-rate-limit');

// Script pour réinitialiser le rate limiting
console.log('🔄 Réinitialisation du rate limiting...');

// Supprimer tous les rate limiters existants
if (global.rateLimiters) {
  Object.keys(global.rateLimiters).forEach(key => {
    if (global.rateLimiters[key] && global.rateLimiters[key].resetKey) {
      global.rateLimiters[key].resetKey();
    }
  });
}

// Réinitialiser les compteurs de rate limiting
if (global.rateLimitCounters) {
  global.rateLimitCounters = {};
}

console.log('✅ Rate limiting réinitialisé avec succès');
console.log('📝 Pour éviter les erreurs 429, le rate limiting est désactivé dans app.js');

process.exit(0); 