const mongoose = require('mongoose');
const User = require('./models/User');

// Configuration de la base de données
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/planify';

async function addBorderClassicToAllUsers() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Trouver tous les utilisateurs qui n'ont pas encore l'item "Bordure Classique"
    const users = await User.find({
      'purchasedItems.itemId': { $ne: 0 }
    });

    console.log(`📊 ${users.length} utilisateurs trouvés sans l'item "Bordure Classique"`);

    let updatedCount = 0;

    for (const user of users) {
      // Vérifier si l'utilisateur a déjà l'item "Bordure Classique"
      const hasBorderClassic = user.purchasedItems.some(item => item.itemId === 0);
      
      if (!hasBorderClassic) {
        // Ajouter l'item "Bordure Classique"
        user.purchasedItems.push({
          itemId: 0,
          itemName: 'Bordure Classique',
          purchaseDate: new Date(),
          equipped: false
        });

        await user.save();
        updatedCount++;
        console.log(`✅ Ajouté "Bordure Classique" à ${user.username}`);
      }
    }

    console.log(`🎉 Terminé ! ${updatedCount} utilisateurs mis à jour avec l'item "Bordure Classique"`);

  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout de l\'item "Bordure Classique":', error);
  } finally {
    // Fermer la connexion
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

// Exécuter le script
addBorderClassicToAllUsers(); 