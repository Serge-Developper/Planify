// Script de test pour vérifier que les dépendances sont accessibles
console.log('Test des dépendances...');

try {
  const jwt = require('jsonwebtoken');
  console.log('✅ jsonwebtoken disponible');
} catch (error) {
  console.log('❌ jsonwebtoken non disponible:', error.message);
}

try {
  const { MongoClient } = require('mongodb');
  console.log('✅ mongodb disponible');
} catch (error) {
  console.log('❌ mongodb non disponible:', error.message);
}

console.log('Test terminé.');
