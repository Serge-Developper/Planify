const mongoose = require('mongoose');

// Modèle User avec le nouveau schéma d'avatar
const userSchema = new mongoose.Schema({
  username: String,
  coins: { type: Number, default: 0 },
  role: { type: String, default: 'user' },
  year: String,
  groupe: String,
  avatar: {
    filename: String,
    mimetype: String,
    data: String, // base64
    size: Number
  },
  avatarFilename: String, // pour compatibilité avec l'ancien format
  purchasedItems: [{
    itemId: String,
    itemName: String,
    price: Number,
    purchaseDate: { type: Date, default: Date.now }
  }],
  equippedItemId: String,
  lastSpinDate: Date,
  spinCount: { type: Number, default: 0 },
  weeklySpinCount: { type: Number, default: 0 },
  lastWeeklyReset: Date,
  password: String
});

const User = mongoose.model('User', userSchema);

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    console.log('🚀 Début de la migration des avatars...');
    
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || '', {
      bufferCommands: false
    });

    // Trouver tous les utilisateurs avec un avatar au format ancien (string)
    const usersWithOldAvatar = await User.find({
      avatar: { $exists: true, $type: 'string' },
      avatar: { $ne: null, $ne: '' }
    });

    console.log(`📊 ${usersWithOldAvatar.length} utilisateurs trouvés avec un avatar au format ancien`);

    let migratedCount = 0;
    let errorCount = 0;

    for (const user of usersWithOldAvatar) {
      try {
        console.log(`🔄 Migration de l'avatar pour ${user.username}: ${user.avatar}`);
        
        // Convertir l'ancien format vers le nouveau
        const newAvatarData = {
          filename: user.avatar.split('/').pop() || 'avatar.png',
          mimetype: 'image/png', // Par défaut
          data: '', // On ne peut pas récupérer les données du fichier
          size: 0
        };

        // Mettre à jour l'utilisateur
        await User.findByIdAndUpdate(user._id, {
          avatar: newAvatarData,
          avatarFilename: user.avatar // Garder l'ancien chemin pour référence
        });

        console.log(`✅ Avatar migré pour ${user.username}`);
        migratedCount++;
        
      } catch (error) {
        console.error(`❌ Erreur lors de la migration de ${user.username}:`, error);
        errorCount++;
      }
    }

    console.log(`🎉 Migration terminée: ${migratedCount} succès, ${errorCount} erreurs`);

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        message: `Migration terminée: ${migratedCount} avatars migrés, ${errorCount} erreurs`,
        migratedCount,
        errorCount,
        totalProcessed: usersWithOldAvatar.length
      })
    };

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        message: 'Erreur lors de la migration: ' + error.message
      })
    };
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  }
};
