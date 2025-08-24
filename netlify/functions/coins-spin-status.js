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

// Fonction pour vérifier si c'est le weekend
const isWeekend = () => {
  const now = new Date();
  const day = now.getDay();
  return day === 0 || day === 6; // 0 = dimanche, 6 = samedi
};

// Fonction pour vérifier si la semaine a changé
const hasWeekChanged = (lastReset) => {
  if (!lastReset) return true;
  
  const now = new Date();
  const last = new Date(lastReset);
  
  // Vérifier si on est dans une semaine différente
  const nowWeek = getWeekNumber(now);
  const lastWeek = getWeekNumber(last);
  
  return nowWeek !== lastWeek;
};

// Fonction pour obtenir le numéro de semaine
const getWeekNumber = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  // Correction : s'assurer que la soustraction retourne un nombre
  const diff = Number(d) - Number(yearStart);
  return Math.ceil(((diff / 86400000) + 1) / 7);
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

    // Route GET /api/coins/spin-status - Vérifier le statut de spin
    if (event.httpMethod === 'GET') {
      try {
        // Vérifier l'authentification
        const user = verifyToken(event);
        
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

        // Vérifier si la semaine a changé et réinitialiser si nécessaire
        if (hasWeekChanged(userDoc.lastWeeklyReset)) {
          userDoc.weeklySpinCount = 0;
          userDoc.lastWeeklyReset = new Date();
          await userDoc.save();
        }

        // Vérifier si l'utilisateur peut faire un spin aujourd'hui
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const lastSpin = userDoc.lastSpinDate ? new Date(userDoc.lastSpinDate) : null;
        const lastSpinDay = lastSpin ? new Date(lastSpin.getFullYear(), lastSpin.getMonth(), lastSpin.getDate()) : null;

        const canSpinToday = !lastSpinDay || lastSpinDay.getTime() !== today.getTime();
        const isWeekendBonus = isWeekend();
        const maxSpinsPerWeek = isWeekendBonus ? 10 : 5; // Bonus weekend
        const spinsRemaining = Math.max(0, maxSpinsPerWeek - userDoc.weeklySpinCount);

        return {
          statusCode: 200,
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            success: true,
            canSpin: canSpinToday && spinsRemaining > 0,
            spinsRemaining,
            weeklySpinCount: userDoc.weeklySpinCount,
            maxSpinsPerWeek,
            isWeekend: isWeekendBonus,
            lastSpinDate: userDoc.lastSpinDate,
            message: canSpinToday && spinsRemaining > 0 
              ? `Vous pouvez faire ${spinsRemaining} spin${spinsRemaining > 1 ? 's' : ''} cette semaine${isWeekendBonus ? ' (bonus weekend !)' : ''}`
              : !canSpinToday 
                ? 'Vous avez déjà fait un spin aujourd\'hui'
                : 'Vous avez atteint la limite de spins pour cette semaine'
          })
        };
      } catch (authError) {
        console.error('❌ Erreur auth spin-status:', authError.message);
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
    console.error('❌ Erreur spin-status:', error);
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
