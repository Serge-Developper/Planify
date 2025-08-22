// Script pour réinitialiser le mot de passe admin
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function resetAdminPassword() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGO_URI || '');
    console.log('Connecté à MongoDB');

    // Trouver l'utilisateur admin
    const adminUser = await User.findOne({ username: 'admin' });
    if (!adminUser) {
      console.log('❌ Utilisateur "admin" non trouvé !');
      return;
    }

    console.log('Utilisateur admin trouvé:', adminUser.username);

    // Hasher le nouveau mot de passe
    const saltRounds = 12;
    const newPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Mettre à jour le mot de passe
    adminUser.password = hashedPassword;
    await adminUser.save();

    console.log('✅ Mot de passe admin réinitialisé avec succès !');
    console.log('Nouveau mot de passe: admin123');

  } catch (error) {
    console.error('Erreur lors de la réinitialisation:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Déconnecté de MongoDB');
  }
}

// Exécuter la réinitialisation
resetAdminPassword(); 