const mongoose = require('mongoose');
const User = require('./models/User');

// Configuration de la base de données (à adapter selon votre configuration)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/planify';

async function testAdminMessage() {
  try {
    // Connexion à la base de données
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Trouver un utilisateur de test
    const testUser = await User.findOne({ role: { $ne: 'admin' } });
    if (!testUser) {
      console.log('❌ Aucun utilisateur non-admin trouvé pour le test');
      return;
    }

    console.log(`🧪 Test avec l'utilisateur: ${testUser.username}`);

    // Vérifier la structure actuelle des items
    console.log('📋 Items actuels:', testUser.purchasedItems.length);
    
    // Ajouter un item avec un message admin
    const testItem = {
      itemId: 1,
      itemName: 'Oreillettes de chat',
      purchaseDate: new Date(),
      equipped: false,
      adminMessage: 'Merci d\'avoir contribué au site ! 🎉'
    };

    testUser.purchasedItems.push(testItem);
    await testUser.save();

    console.log('✅ Item ajouté avec message admin');
    console.log('📝 Message:', testItem.adminMessage);

    // Vérifier que l'item a bien été ajouté
    const updatedUser = await User.findById(testUser._id);
    const addedItem = updatedUser.purchasedItems.find(item => item.itemId === 1);
    
    if (addedItem && addedItem.adminMessage) {
      console.log('✅ Test réussi ! L\'item a bien le message admin');
      console.log('📋 Nombre total d\'items:', updatedUser.purchasedItems.length);
    } else {
      console.log('❌ Test échoué ! Le message admin n\'a pas été sauvegardé');
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

// Exécuter le test
testAdminMessage();

