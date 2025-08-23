// Script pour vérifier les utilisateurs existants
require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');

// Correction du chemin d'accès au modèle User
const User = require(path.join(__dirname, 'models', 'User'));

async function checkUsers() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGO_URI || '');
    console.log('Connecté à MongoDB');

    // Récupérer tous les utilisateurs
    const users = await User.find({});
    console.log(`\n=== ${users.length} UTILISATEURS TROUVÉS ===\n`);

    users.forEach((user, index) => {
      console.log(`${index + 1}. Username: ${user.username}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Groupe: ${user.groupe || 'N/A'}`);
      console.log(`   Year: ${user.year || 'N/A'}`);
      console.log(`   Password: ${user.password.substring(0, 10)}...`);
      console.log(`   Password haché: ${user.password.startsWith('$2a$') || user.password.startsWith('$2b$') ? 'OUI' : 'NON'}`);
      console.log(`   Questions secrètes: ${user.secretQuestions ? user.secretQuestions.length : 0}`);
      console.log('');
    });

    // Vérifier spécifiquement l'utilisateur admin
    const adminUser = await User.findOne({ username: 'admin' });
    if (adminUser) {
      console.log('=== UTILISATEUR ADMIN ===');
      console.log(`Username: ${adminUser.username}`);
      console.log(`Password: ${adminUser.password}`);
      console.log(`Password haché: ${adminUser.password.startsWith('$2a$') || adminUser.password.startsWith('$2b$') ? 'OUI' : 'NON'}`);
    } else {
      console.log('❌ Utilisateur "admin" non trouvé !');
    }

  } catch (error) {
    console.error('Erreur lors de la vérification:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDéconnecté de MongoDB');
  }
}

// Exécuter la vérification
checkUsers(); 