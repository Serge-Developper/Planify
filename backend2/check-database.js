require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function checkDatabase() {
  try {
    console.log('Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/planifyvrai');
    console.log('Connecté à MongoDB');

    // Vérifier le schéma User
    console.log('\n=== VÉRIFICATION DU SCHÉMA USER ===');
    const userSchema = User.schema.obj;
    console.log('Champs du schéma User:', Object.keys(userSchema));
    console.log('Champ coins défini:', 'coins' in userSchema);

    // Compter tous les utilisateurs
    const totalUsers = await User.countDocuments();
    console.log(`\nTotal d'utilisateurs: ${totalUsers}`);

    // Vérifier les utilisateurs sans champ coins
    const usersWithoutCoins = await User.find({ coins: { $exists: false } });
    console.log(`Utilisateurs sans champ coins: ${usersWithoutCoins.length}`);

    if (usersWithoutCoins.length > 0) {
      console.log('\nUtilisateurs sans coins:');
      usersWithoutCoins.forEach(user => {
        console.log(`- ${user.username} (ID: ${user._id})`);
      });

      // Ajouter le champ coins à ces utilisateurs
      console.log('\nAjout du champ coins...');
      const result = await User.updateMany(
        { coins: { $exists: false } },
        { $set: { coins: 0 } }
      );
      console.log(`Mise à jour effectuée: ${result.modifiedCount} utilisateurs`);
    }

    // Afficher tous les utilisateurs avec leurs coins
    console.log('\n=== UTILISATEURS ET LEURS COINS ===');
    const allUsers = await User.find({}).select('username coins');
    allUsers.forEach(user => {
      console.log(`- ${user.username}: ${user.coins || 0} coins`);
    });

    // Test de récupération d'un utilisateur
    if (allUsers.length > 0) {
      console.log('\n=== TEST DE RÉCUPÉRATION ===');
      const testUser = allUsers[0];
      console.log(`Test avec l'utilisateur: ${testUser.username}`);
      
      const retrievedUser = await User.findById(testUser._id).select('username coins');
      if (retrievedUser) {
        console.log('Utilisateur récupéré:', {
          username: retrievedUser.username,
          coins: retrievedUser.coins,
          hasCoinsField: 'coins' in retrievedUser
        });
      } else {
        console.log('Erreur: Utilisateur non trouvé lors de la récupération');
      }
    }

    console.log('\nScript terminé avec succès');
  } catch (error) {
    console.error('Erreur:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('Déconnecté de MongoDB');
  }
}

checkDatabase(); 