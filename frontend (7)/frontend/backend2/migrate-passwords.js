// Script de migration des mots de passe vers bcrypt
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function migratePasswords() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGO_URI || '');
    console.log('Connecté à MongoDB');

    // Récupérer tous les utilisateurs
    const users = await User.find({});
    console.log(`${users.length} utilisateurs trouvés`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const user of users) {
      // Vérifier si le mot de passe est déjà haché
      if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
        console.log(`Mot de passe déjà haché pour ${user.username}`);
        skippedCount++;
        continue;
      }

      // Hasher le mot de passe
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(user.password, saltRounds);
      
      // Mettre à jour l'utilisateur
      user.password = hashedPassword;
      await user.save();
      
      console.log(`Mot de passe migré pour ${user.username}`);
      migratedCount++;
    }

    console.log(`\nMigration terminée:`);
    console.log(`- ${migratedCount} mots de passe migrés`);
    console.log(`- ${skippedCount} mots de passe déjà hachés`);
    console.log(`- Total: ${users.length} utilisateurs`);

  } catch (error) {
    console.error('Erreur lors de la migration:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Déconnecté de MongoDB');
  }
}

// Exécuter la migration
migratePasswords(); 