const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// Modèle User simplifié pour Netlify Functions
const userSchema = new mongoose.Schema({
  username: String,
  coins: { type: Number, default: 0 },
  role: { type: String, default: 'user' },
  year: String,
  groupe: String,
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

// Middleware d'authentification simplifié
const verifyToken = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Token manquant');
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production');
    return decoded;
  } catch (error) {
    throw new Error('Token invalide');
  }
};

exports.handler = async (event, context) => {
  // Configuration CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  // Gérer les requêtes OPTIONS (preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || '', {
      bufferCommands: false
    });

    // Route POST /api/coins/equip - Équiper un item
    if (event.httpMethod === 'POST') {
      try {
        // Vérifier l'authentification
        const user = verifyToken(event);
        
        // Parser le body de la requête
        const body = JSON.parse(event.body || '{}');
        const { itemId } = body;

        if (!itemId) {
          return {
            statusCode: 400,
            headers: {
              ...headers,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              success: false,
              message: 'ID de l\'item manquant'
            })
          };
        }

        // Récupérer l'utilisateur
        const userDoc = await User.findById(user.id || user._id);
        if (!userDoc) {
          return {
            statusCode: 404,
            headers: {
              ...headers,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              success: false,
              message: 'Utilisateur non trouvé'
            })
          };
        }

        // Vérifier si l'utilisateur possède cet item
        const hasItem = userDoc.purchasedItems.some(item => item.itemId === itemId);
        if (!hasItem) {
          return {
            statusCode: 400,
            headers: {
              ...headers,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              success: false,
              message: 'Vous ne possédez pas cet item'
            })
          };
        }

        // Équiper l'item
        userDoc.equippedItemId = itemId;
        await userDoc.save();

        return {
          statusCode: 200,
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            success: true,
            message: 'Item équipé avec succès',
            equippedItemId: itemId
          })
        };
      } catch (authError) {
        console.error('❌ Erreur auth equip:', authError.message);
        return {
          statusCode: 401,
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            success: false,
            message: 'Token invalide ou manquant'
          })
        };
      }
    }

    // Méthode non supportée
    return {
      statusCode: 405,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        message: 'Méthode non autorisée'
      })
    };

  } catch (error) {
    console.error('❌ Erreur equip:', error);
    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        message: 'Erreur serveur interne'
      })
    };
  } finally {
    // Fermer la connexion MongoDB
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  }
};
