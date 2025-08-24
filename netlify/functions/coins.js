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

// Modèle Item pour les items hebdomadaires
const itemSchema = new mongoose.Schema({
  itemId: String,
  name: String,
  description: String,
  price: Number,
  image: String,
  category: String,
  rarity: String,
  isWeekly: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const Item = mongoose.model('Item', itemSchema);

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
  const diff = Number(d) - Number(yearStart);
  return Math.ceil(((diff / 86400000) + 1) / 7);
};

// Configuration CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

// Routeur pour les endpoints coins
const handleCoinsRoute = async (event, path) => {
  const endpoint = path.replace('/api/coins/', '');

  switch (endpoint) {
    case 'user-coins':
      return await handleUserCoins(event);
    case 'spin-status':
      return await handleSpinStatus(event);
    case 'inventory':
      return await handleInventory(event);
    case 'equip':
      return await handleEquip(event);
    case 'weekly-items':
      return await handleWeeklyItems(event);
    default:
      return {
        statusCode: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, message: 'Endpoint non trouvé' })
      };
  }
};

// Handler pour user-coins
const handleUserCoins = async (event) => {
  try {
    const user = verifyToken(event);
    const userDoc = await User.findById(user.id || user._id);
    
    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ coins: userDoc?.coins || 0 })
    };
  } catch (error) {
    return {
      statusCode: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, message: 'Token invalide' })
    };
  }
};

// Handler pour spin-status
const handleSpinStatus = async (event) => {
  try {
    const user = verifyToken(event);
    const userDoc = await User.findById(user.id || user._id);
    
    if (!userDoc) {
      return {
        statusCode: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, message: 'Utilisateur non trouvé' })
      };
    }

    // Vérifier si la semaine a changé
    if (hasWeekChanged(userDoc.lastWeeklyReset)) {
      userDoc.weeklySpinCount = 0;
      userDoc.lastWeeklyReset = new Date();
      await userDoc.save();
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastSpin = userDoc.lastSpinDate ? new Date(userDoc.lastSpinDate) : null;
    const lastSpinDay = lastSpin ? new Date(lastSpin.getFullYear(), lastSpin.getMonth(), lastSpin.getDate()) : null;

    const canSpinToday = !lastSpinDay || lastSpinDay.getTime() !== today.getTime();
    const isWeekendBonus = isWeekend();
    const maxSpinsPerWeek = isWeekendBonus ? 10 : 5;
    const spinsRemaining = Math.max(0, maxSpinsPerWeek - userDoc.weeklySpinCount);

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        canSpin: canSpinToday && spinsRemaining > 0,
        spinsRemaining,
        weeklySpinCount: userDoc.weeklySpinCount,
        maxSpinsPerWeek,
        isWeekend: isWeekendBonus,
        lastSpinDate: userDoc.lastSpinDate
      })
    };
  } catch (error) {
    return {
      statusCode: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, message: 'Token invalide' })
    };
  }
};

// Handler pour inventory
const handleInventory = async (event) => {
  try {
    const user = verifyToken(event);
    const userDoc = await User.findById(user.id || user._id);
    
    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        purchasedItems: userDoc?.purchasedItems || [],
        equippedItemId: userDoc?.equippedItemId
      })
    };
  } catch (error) {
    return {
      statusCode: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, message: 'Token invalide' })
    };
  }
};

// Handler pour equip
const handleEquip = async (event) => {
  try {
    const user = verifyToken(event);
    const body = JSON.parse(event.body || '{}');
    const { itemId } = body;

    if (!itemId) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, message: 'ID de l\'item manquant' })
      };
    }

    const userDoc = await User.findById(user.id || user._id);
    if (!userDoc) {
      return {
        statusCode: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, message: 'Utilisateur non trouvé' })
      };
    }

    const hasItem = userDoc.purchasedItems.some(item => item.itemId === itemId);
    if (!hasItem) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, message: 'Vous ne possédez pas cet item' })
      };
    }

    userDoc.equippedItemId = itemId;
    await userDoc.save();

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: 'Item équipé avec succès',
        equippedItemId: itemId
      })
    };
  } catch (error) {
    return {
      statusCode: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, message: 'Token invalide' })
    };
  }
};

// Handler pour weekly-items
const handleWeeklyItems = async (event) => {
  try {
    const user = verifyToken(event);
    
    const weeklyItems = await Item.find({ 
      isWeekly: true, 
      isActive: true 
    }).sort({ createdAt: -1 }).limit(10);

    if (weeklyItems.length === 0) {
      const defaultItems = [
        {
          itemId: 'weekly-1',
          name: 'Border Classique',
          description: 'Une bordure élégante pour votre profil',
          price: 100,
          image: '/img/border-classic.png',
          category: 'border',
          rarity: 'common',
          isWeekly: true,
          isActive: true
        },
        {
          itemId: 'weekly-2',
          name: 'Avatar Premium',
          description: 'Un avatar exclusif pour la semaine',
          price: 200,
          image: '/img/avatar-premium.png',
          category: 'avatar',
          rarity: 'rare',
          isWeekly: true,
          isActive: true
        },
        {
          itemId: 'weekly-3',
          name: 'Background Étoilé',
          description: 'Un fond d\'écran magique',
          price: 150,
          image: '/img/background-stars.png',
          category: 'background',
          rarity: 'uncommon',
          isWeekly: true,
          isActive: true
        }
      ];

      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          items: defaultItems
        })
      };
    }

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        items: weeklyItems
      })
    };
  } catch (error) {
    return {
      statusCode: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, message: 'Token invalide' })
    };
  }
};

exports.handler = async (event, context) => {
  // Gérer les requêtes OPTIONS (preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || '', {
      bufferCommands: false
    });

    // Extraire le chemin de la requête
    const path = event.path || event.rawPath || '';
    
    // Router vers le bon handler
    return await handleCoinsRoute(event, path);

  } catch (error) {
    console.error('❌ Erreur coins:', error);
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
