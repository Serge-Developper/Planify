require('dotenv').config();
const mongoose = require('mongoose');

console.log('🚀 Test rapide de Mongoose...');

// Test d'import
try {
  console.log('✅ Mongoose importé avec succès');
  console.log('Version Mongoose:', mongoose.version);
  
  // Test de connexion
  mongoose.connect(process.env.MONGO_URI || '', {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  })
  .then(() => {
    console.log('✅ Connexion MongoDB réussie');
    
    // Test du modèle User
    const User = require('./models/User');
    console.log('✅ Modèle User importé avec succès');
    
    // Test de requête simple
    return User.countDocuments();
  })
  .then((count) => {
    console.log(`✅ Requête réussie: ${count} utilisateurs trouvés`);
    console.log('🎉 Tous les tests sont passés!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  });
  
} catch (error) {
  console.error('❌ Erreur d\'import:', error.message);
  process.exit(1);
} 