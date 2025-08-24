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
    
    // Tous les items disponibles pour la boutique hebdomadaire
    const allWeeklyItems = [
      { id: 1, name: 'Oreilles de chat', price: 50, img: 'oreilleschat' },
      { id: 2, name: 'Clown', price: 80, img: 'clowncheveux' },
      { id: 3, name: 'Cash', price: 60, img: 'cash' },
      { id: 4, name: 'Cible', price: 100, img: 'target' },
      { id: 6, name: 'Roi', price: 90, img: 'roi' },
      { id: 7, name: 'Matrix', price: 110, img: 'matrix' },
      { id: 8, name: 'Ange', price: 120, img: 'angelwings' },
      { id: 9, name: 'Tomb Raider', price: 130, img: 'laracroft' },
      { id: 10, name: 'Étoiles', price: 85, img: 'star' },
      { id: 11, name: 'Cadre royale', price: 95, img: 'cadre' },
      { id: 12, name: 'Roses', price: 105, img: 'love' },
      { id: 13, name: 'Gentleman', price: 115, img: 'moustache' },
      { id: 14, name: 'Vinyle', price: 135, img: 'vinyle' },
      { id: 15, name: 'Advisory', price: 145, img: 'advisory' },
      { id: 16, name: 'Espace', price: 155, img: 'spacestars' },
      { id: 17, name: 'Absolute Cinema', price: 165, img: 'bras' },
      { id: 18, name: 'Flash', price: 175, img: 'flash' },
      { id: 19, name: 'Miaou', price: 185, img: 'chat' },
      { id: 20, name: 'DVD', price: 195, img: 'dvd' },
      { id: 21, name: 'Lunettes pixel', price: 205, img: 'mlglunette' },
      { id: 22, name: '2000', price: 215, img: 'nokia' }
    ];

    // Fonction pour obtenir la seed du jour actuel
    function getCurrentDaySeed() {
      const now = new Date();
      const dateString = now.toISOString().split('T')[0];
      return dateString;
    }

    // Fonction pour générer des items aléatoires basés sur une seed
    function getRandomItemsFromSeed(seed, count = 3) {
      let hash = 0;
      for (let i = 0; i < seed.length; i++) {
        const char = seed.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convertir en 32-bit integer
      }
      
      // Utiliser la seed pour mélanger le tableau
      const shuffled = [...allWeeklyItems].sort(() => {
        hash = (hash * 9301 + 49297) % 233280;
        return (hash / 233280) - 0.5;
      });
      
      return shuffled.slice(0, count);
    }

    // Générer les items hebdomadaires pour aujourd'hui
    const daySeed = getCurrentDaySeed();
    let weeklyItems = getRandomItemsFromSeed(daySeed, 3);

    // Calculer le temps jusqu'à la prochaine rotation
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const timeLeft = tomorrow.getTime() - now.getTime();
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
    const timeUntilReset = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        weeklyItems,
        timeUntilReset,
        daySeed,
        nextReset: tomorrow.toISOString()
      })
    };

  } catch (error) {
    console.error('Erreur récupération items hebdomadaires:', error);
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        success: false, 
        message: 'Erreur lors de la récupération des items hebdomadaires',
        weeklyItems: [],
        timeUntilReset: '00:00:00'
      })
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
