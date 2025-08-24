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
    itemId: Number,
    itemName: String,
    price: Number,
    purchaseDate: { type: Date, default: Date.now }
  }],
  equippedItemId: Number,
  selectedBorderColor: { type: String, default: 'default' },
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
  // Supporte à la fois "/api/coins/*" (proxy) et "/.netlify/functions/coins/*"
  const endpoint = (() => {
    if (!path) return '';
    const marker = '/coins/';
    const idx = path.indexOf(marker);
    if (idx !== -1) return path.slice(idx + marker.length);
    return path.replace('/api/coins/', '');
  })();

  switch (endpoint) {
    case 'user-coins':
      return await handleUserCoins(event);
    case 'spin-status':
      return await handleSpinStatus(event);
    case 'spin-wheel':
      return await handleSpinWheel(event);
    case 'inventory':
      return await handleInventory(event);
    case 'equip':
      return await handleEquip(event);
    case 'weekly-items':
      return await handleWeeklyItems(event);
    case 'border-color':
      return await handleBorderColor(event);
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
        equippedItemId: userDoc?.equippedItemId,
        selectedBorderColor: userDoc?.selectedBorderColor || 'default'
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

    // Ajouter des couleurs de bordure hebdomadaires
    const borderColors = [
      { id: 100, name: 'Rouge', price: 50, type: 'border-color', colorId: 'red', img: 'border-red' },
      { id: 101, name: 'Bleu', price: 50, type: 'border-color', colorId: 'blue', img: 'border-blue' },
      { id: 102, name: 'Vert', price: 50, type: 'border-color', colorId: 'green', img: 'border-green' },
      { id: 103, name: 'Jaune', price: 50, type: 'border-color', colorId: 'yellow', img: 'border-yellow' },
      { id: 104, name: 'Violet', price: 50, type: 'border-color', colorId: 'purple', img: 'border-purple' },
      { id: 105, name: 'Orange', price: 50, type: 'border-color', colorId: 'orange', img: 'border-orange' },
      { id: 106, name: 'Rose', price: 50, type: 'border-color', colorId: 'pink', img: 'border-pink' },
      { id: 107, name: 'Cyan', price: 50, type: 'border-color', colorId: 'cyan', img: 'border-cyan' },
      { id: 108, name: 'Or', price: 100, type: 'border-color', colorId: 'gold', img: 'border-gold' },
      { id: 109, name: 'Argent', price: 100, type: 'border-color', colorId: 'silver', img: 'border-silver' },
      { id: 110, name: 'Arc-en-ciel', price: 150, type: 'border-color', colorId: 'rainbow', img: 'border-rainbow' },
      { id: 111, name: 'Feu', price: 75, type: 'border-color', colorId: 'fire', img: 'border-fire' },
      { id: 112, name: 'Glace', price: 75, type: 'border-color', colorId: 'ice', img: 'border-ice' },
      { id: 113, name: 'Océan', price: 75, type: 'border-color', colorId: 'ocean', img: 'border-ocean' },
      { id: 114, name: 'Forêt', price: 75, type: 'border-color', colorId: 'forest', img: 'border-forest' },
      { id: 115, name: 'Galaxie', price: 125, type: 'border-color', colorId: 'galaxy', img: 'border-galaxy' },
      { id: 116, name: 'Aurore', price: 125, type: 'border-color', colorId: 'aurora', img: 'border-aurora' },
      { id: 117, name: 'Volcan', price: 75, type: 'border-color', colorId: 'volcano', img: 'border-volcano' },
      { id: 118, name: 'Cristal', price: 75, type: 'border-color', colorId: 'crystal', img: 'border-crystal' },
      { id: 119, name: 'Minuit', price: 75, type: 'border-color', colorId: 'midnight', img: 'border-midnight' },
      { id: 120, name: 'Aube', price: 75, type: 'border-color', colorId: 'dawn', img: 'border-dawn' },
      { id: 121, name: 'Crépuscule', price: 75, type: 'border-color', colorId: 'dusk', img: 'border-dusk' },
      { id: 122, name: 'Tempête', price: 75, type: 'border-color', colorId: 'storm', img: 'border-storm' },
      { id: 123, name: 'Printemps', price: 75, type: 'border-color', colorId: 'spring', img: 'border-spring' },
      { id: 124, name: 'Été', price: 75, type: 'border-color', colorId: 'summer', img: 'border-summer' },
      { id: 125, name: 'Automne', price: 75, type: 'border-color', colorId: 'autumn', img: 'border-autumn' },
      { id: 126, name: 'Hiver', price: 75, type: 'border-color', colorId: 'winter', img: 'border-winter' },
      { id: 127, name: 'Magenta', price: 50, type: 'border-color', colorId: 'magenta', img: 'border-magenta' },
      { id: 128, name: 'Vert Lime', price: 50, type: 'border-color', colorId: 'lime-green', img: 'border-lime-green' },
      { id: 129, name: 'Bleu Royal', price: 50, type: 'border-color', colorId: 'royal-blue', img: 'border-royal-blue' },
      { id: 130, name: 'Blanc', price: 50, type: 'border-color', colorId: 'white', img: 'border-white' },
      { id: 131, name: 'Bronze', price: 100, type: 'border-color', colorId: 'bronze', img: 'border-bronze' }
    ];

    // Générer des couleurs de bordure aléatoires (2-3 par jour)
    const borderSeed = daySeed + '-borders';
    const shuffledBorders = [...borderColors].sort(() => {
      let hash = 0;
      for (let i = 0; i < borderSeed.length; i++) {
        const char = borderSeed.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      hash = (hash * 9301 + 49297) % 233280;
      return (hash / 233280) - 0.5;
    });
    
    const weeklyBorderColors = shuffledBorders.slice(0, 3); // Toujours 3 couleurs

    // Combiner les items normaux et les couleurs de bordure
    weeklyItems = [...weeklyItems, ...weeklyBorderColors];

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

// Handler pour border-color
const handleBorderColor = async (event) => {
  try {
    const user = verifyToken(event);
    const body = JSON.parse(event.body || '{}');
    const { colorId } = body;

    if (!colorId) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, message: 'ID de couleur manquant' })
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

    // Vérifier si l'utilisateur possède la bordure classique (itemId 0)
    const hasClassicBorder = userDoc.purchasedItems.some(item => item.itemId === 0);
    if (!hasClassicBorder) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, message: 'Vous devez posséder la bordure classique pour changer sa couleur' })
      };
    }

    // Mettre à jour la couleur de bordure sélectionnée
      userDoc.selectedBorderColor = colorId;
      await userDoc.save();
      
    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: 'Couleur de bordure mise à jour avec succès',
        selectedBorderColor: colorId
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

// Handler pour la roue de la fortune
const handleSpinWheel = async (event) => {
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

    // Réinitialiser le compteur hebdomadaire si la semaine a changé
    if (hasWeekChanged(userDoc.lastWeeklyReset)) {
      userDoc.weeklySpinCount = 0;
      userDoc.lastWeeklyReset = new Date();
      await userDoc.save();
    }

    const now = new Date();

    // Empêcher plus d'un spin par jour
    const lastSpin = userDoc.lastSpinDate ? new Date(userDoc.lastSpinDate) : null;
    if (lastSpin) {
      const sameDay = lastSpin.toDateString() === now.toDateString();
      if (sameDay) {
        return {
          statusCode: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: false,
            canSpin: false,
            message: "Vous avez déjà tourné la roue aujourd'hui. Revenez demain !"
          })
        };
      }
    }

    // Récompenses possibles (avec une faible probabilité de "Perdu")
    const rewards = [
      { coins: 10, probability: 0.15, name: '10 coins' },
      { coins: 20, probability: 0.15, name: '20 coins' },
      { coins: 30, probability: 0.15, name: '30 coins' },
      { coins: 50, probability: 0.15, name: '50 coins' },
      { coins: 70, probability: 0.15, name: '70 coins' },
      { coins: 100, probability: 0.15, name: '100 coins' },
      { coins: 0, probability: 0.10, name: 'Perdu' }
    ];

    // Tirage au sort pondéré
    const rand = Math.random();
    let cumulative = 0;
    let reward = rewards[0];
    for (const r of rewards) {
      cumulative += r.probability;
      if (rand <= cumulative) { reward = r; break; }
    }

    // Bonus weekend (x2) sauf si Perdu
    const weekend = isWeekend();
    const originalCoins = reward.coins;
    const finalCoins = weekend && reward.coins > 0 ? reward.coins * 2 : reward.coins;
    const isWeekendBonus = weekend && reward.coins > 0;

    // Mise à jour utilisateur
    userDoc.coins = (userDoc.coins || 0) + finalCoins;
    userDoc.lastSpinDate = now;
    userDoc.weeklySpinCount = (userDoc.weeklySpinCount || 0) + 1;
    await userDoc.save();

    // Message
    let message;
    if (finalCoins > 0 && isWeekendBonus) {
      message = `🎉 WEEKEND BONUS x2 ! Vous avez gagné ${finalCoins} coins (${originalCoins} x 2) !`;
    } else if (finalCoins > 0) {
      message = `Félicitations ! Vous avez gagné ${finalCoins} coins !`;
    } else {
      message = `😔 Dommage, vous n'avez rien gagné cette fois-ci !`;
    }

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        coinsWon: finalCoins,
        newCoins: userDoc.coins,
        rewardName: reward.name,
        isWeekendBonus,
        originalCoins,
        message
      })
    };
  } catch (error) {
    // Token invalide => 401, sinon 500
    const isAuthError = String(error && error.message || '').toLowerCase().includes('token');
    return {
      statusCode: isAuthError ? 401 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, message: isAuthError ? 'Token invalide' : 'Erreur lors du spin' })
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
