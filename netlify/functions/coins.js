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

// Modèles minimaux pour consulter les créations dynamiques
try {
  // Items dynamiques créés via l'éditeur
  const dynItemSchema = new mongoose.Schema({
    legacyId: Number,
    name: String,
    price: Number,
    infoOnly: Boolean,
    infoDescription: String,
    availableInDailyShop: { type: Boolean, default: false },
    active: { type: Boolean, default: true }
  });
  mongoose.model('DynItem', dynItemSchema, 'items');
} catch {}
const DynItem = mongoose.models.DynItem || mongoose.model('DynItem');

try {
  // Couleurs de bordure dynamiques créées via l'éditeur
  const dynBorderSchema = new mongoose.Schema({
    id: String,
    name: String,
    color: String,
    gradient: String,
    price: Number,
    availableInDailyShop: { type: Boolean, default: false }
  });
  mongoose.model('DynBorderColor', dynBorderSchema, 'bordercolors');
} catch {}
const DynBorderColor = mongoose.models.DynBorderColor || mongoose.model('DynBorderColor');

function hashToInt(str) {
  try {
    let h = 0; for (let i = 0; i < String(str).length; i++) { h = ((h << 5) - h) + String(str).charCodeAt(i); h |= 0; }
    return Math.abs(h) + 100000; // éviter collision faible et rester positif
  } catch { return 999999; }
}

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

// Endpoints de test pour la boutique hebdomadaire
const handleWeeklyTestAdd = async (event) => {
  try {
    const user = verifyToken(event);
    ensureFreshOverrides();
    const body = JSON.parse(event.body || '{}');
    // Si c'est un item dynamique (legacyId numérique)
    if (body.legacyId !== undefined) {
      const id = Number(body.legacyId);
      if (!id && id !== 0) {
        return { statusCode: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ success:false, message:'legacyId requis' }) };
      }
      weeklyOverrides.add.add(id);
      weeklyOverrides.remove.delete(id);
    }
    // Si c'est une couleur de bordure dynamique (borderId peut être string ou number)
    if (body.borderId !== undefined) {
      const bid = String(body.borderId);
      if (!bid) {
        return { statusCode: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ success:false, message:'borderId requis' }) };
      }
      weeklyOverrides.addBorders.add(bid);
      weeklyOverrides.removeBorders.delete(bid);
    }
    return { statusCode: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ success:true }) };
  } catch (e) {
    return { statusCode: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ success:false, message:'Non autorisé' }) };
  }
}

const handleWeeklyTestRemove = async (event) => {
  try {
    const user = verifyToken(event);
    ensureFreshOverrides();
    const body = JSON.parse(event.body || '{}');
    if (body.legacyId !== undefined) {
      const id = Number(body.legacyId);
      if (!id && id !== 0) {
        return { statusCode: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ success:false, message:'legacyId requis' }) };
      }
      weeklyOverrides.remove.add(id);
      weeklyOverrides.add.delete(id);
    }
    if (body.borderId !== undefined) {
      const bid = String(body.borderId);
      if (!bid) {
        return { statusCode: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ success:false, message:'borderId requis' }) };
      }
      weeklyOverrides.removeBorders.add(bid);
      weeklyOverrides.addBorders.delete(bid);
    }
    return { statusCode: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ success:true }) };
  } catch (e) {
    return { statusCode: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ success:false, message:'Non autorisé' }) };
  }
}

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

// Overrides temporaires pour la boutique hebdomadaire (réinitialisés chaque jour)
// add/remove: items dynamiques (IDs numériques legacy)
// addBorders/removeBorders: couleurs de bordure (IDs ou colorId sous forme de chaînes)
let weeklyOverrides = { add: new Set(), remove: new Set(), addBorders: new Set(), removeBorders: new Set(), seed: null };
function getTodaySeed() {
  // Jour courant en Europe/Paris avec reset à 01:00
  const fmt = new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  });
  const parts = Object.fromEntries(fmt.formatToParts(new Date()).map(p => [p.type, p.value]));
  let y = Number(parts.year), m = Number(parts.month), d = Number(parts.day);
  const hour = Number(parts.hour);
  if (hour < 1) {
    const date = new Date(Date.UTC(y, m - 1, d));
    date.setUTCDate(date.getUTCDate() - 1);
    y = date.getUTCFullYear();
    m = date.getUTCMonth() + 1;
    d = date.getUTCDate();
  }
  const pad = (n) => String(n).padStart(2, '0');
  return `${y}-${pad(m)}-${pad(d)}`;
}
function ensureFreshOverrides() {
  const seed = getTodaySeed();
  if (weeklyOverrides.seed !== seed) {
    weeklyOverrides = { add: new Set(), remove: new Set(), addBorders: new Set(), removeBorders: new Set(), seed };
  }
}

// Handler racine pour /api/coins (POST action)
const handleCoinsRoot = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, message: 'Méthode non autorisée' })
    };
  }
  try {
    const body = JSON.parse(event.body || '{}');
    const action = body.action;
    if (action === 'spin-wheel') {
      return await handleSpinWheel(event);
    }
    return {
      statusCode: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, message: 'Action non reconnue' })
    };
  } catch (e) {
    return {
      statusCode: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, message: 'Requête invalide' })
    };
  }
};

// Handler spin-wheel
const handleSpinWheel = async (event) => {
  try {
    const user = verifyToken(event);
    const userId = (typeof user === 'object' && user !== null) ? (user.id || user._id) : user;
    const userDoc = await User.findById(userId);
    if (!userDoc) {
      return {
        statusCode: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, message: 'Utilisateur non trouvé' })
      };
    }

    // Reset hebdomadaire si nécessaire
    if (hasWeekChanged(userDoc.lastWeeklyReset)) {
      userDoc.weeklySpinCount = 0;
      userDoc.lastWeeklyReset = new Date();
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastSpin = userDoc.lastSpinDate ? new Date(userDoc.lastSpinDate) : null;
    const lastSpinDay = lastSpin ? new Date(lastSpin.getFullYear(), lastSpin.getMonth(), lastSpin.getDate()) : null;
    const alreadySpunToday = !!lastSpinDay && lastSpinDay.getTime() === today.getTime();

    const weekendBonus = isWeekend();
    const maxSpins = weekendBonus ? 10 : 5;
    if (alreadySpunToday || userDoc.weeklySpinCount >= maxSpins) {
      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          message: 'Vous avez déjà tourné la roue aujourd\'hui.'
        })
      };
    }

    // Table de gains de base
    const baseRewards = [10, 20, 30, 50, 70, 100, 0]; // 0 = Perdu
    const idx = Math.floor(Math.random() * baseRewards.length);
    let coinsWon = baseRewards[idx];
    if (weekendBonus && coinsWon > 0) coinsWon *= 2;

    userDoc.coins = (userDoc.coins || 0) + coinsWon;
    userDoc.lastSpinDate = now;
    userDoc.weeklySpinCount = (userDoc.weeklySpinCount || 0) + 1;
    await userDoc.save();

    const rewardName = coinsWon === 0 ? 'Perdu' : `${coinsWon} coins`;

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: coinsWon === 0 ? 'Dommage, retentez demain !' : `Bravo ! Vous gagnez ${coinsWon} coins !`,
        coinsWon,
        newCoins: userDoc.coins,
        rewardName
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

// Routeur pour les endpoints coins
const handleCoinsRoute = async (event, path) => {
  // Gérer le chemin racine (/api/coins ou /.netlify/functions/coins)
  const isRoot = /\/api\/coins$|\.netlify\/functions\/coins$/.test(path);
  if (isRoot) {
    // Déléguer au gestionnaire racine pour les requêtes POST avec action
    if (event.httpMethod === 'POST') {
      return await handleCoinsRoot(event);
    }
    // GET root -> status
    if (event.httpMethod === 'GET') {
      return await handleSpinStatus(event);
    }
  }

  // Extraire la dernière partie du chemin après /coins/
  const subPathMatch = path.match(/\/coins\/(.+)$/);
  const subPath = subPathMatch ? subPathMatch[1] : '';

  switch (subPath) {
    case 'user-coins':
      return await handleUserCoins(event);
    case 'spin-status':
      return await handleSpinStatus(event);
    case 'inventory':
      return await handleInventory(event);
    case 'purchase':
      return await handlePurchase(event);
    case 'equip':
      return await handleEquip(event);
    case 'unequip':
      return await handleUnequip(event);
    case 'weekly-items':
      return await handleWeeklyItems(event);
    case 'weekly-items/test-add':
      return await handleWeeklyTestAdd(event);
    case 'weekly-items/test-remove':
      return await handleWeeklyTestRemove(event);
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
    let userId;
    if (typeof user === 'object' && user !== null) {
      userId = user.id || user._id;
    } else {
      userId = user;
    }
    const userDoc = await User.findById(userId);
    
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
    let userId;
    if (typeof user === 'object' && user !== null) {
      userId = user.id || user._id;
    } else {
      userId = user;
    }
    const userDoc = await User.findById(userId);
    
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
    let userId;
    if (typeof user === 'object' && user !== null) {
      userId = user.id || user._id;
    } else {
      userId = user;
    }
    const userDoc = await User.findById(userId);

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

// Handler pour achat (items et couleurs de bordure)
const handlePurchase = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ success:false, message:'Méthode non autorisée' }) };
  }
  try {
    const user = verifyToken(event);
    const body = JSON.parse(event.body || '{}');
    const { itemId, itemName, price, type } = body;
    if (typeof itemId === 'undefined' || typeof price === 'undefined') {
      return { statusCode: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ success:false, message:'Paramètres manquants' }) };
    }
    let userId;
    if (typeof user === 'object' && user !== null) userId = user.id || user._id; else userId = user;
    const userDoc = await User.findById(userId);
    if (!userDoc) return { statusCode: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ success:false, message:'Utilisateur non trouvé' }) };

    const cost = Number(price) || 0;
    if ((userDoc.coins || 0) < cost) {
      return { statusCode: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ success:false, message:'Solde insuffisant' }) };
    }

    // Débit
    userDoc.coins = (userDoc.coins || 0) - cost;

    // Si c'est une couleur de bordure, on l'ajoute comme achat traceur mais on débloque côté front/store
    if (type === 'border-color' || type === 'border-gradient') {
      const entry = { itemId: Number(itemId), itemName: String(itemName || 'Couleur'), price: cost, purchaseDate: new Date() };
      userDoc.purchasedItems.push(entry);
      await userDoc.save();
      return { statusCode: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ success:true, message:'Couleur achetée', newCoins: userDoc.coins, purchasedItem: entry }) };
    }

    // Achat item normal
    const purchased = { itemId: Number(itemId), itemName: String(itemName || ''), price: cost, purchaseDate: new Date() };
    userDoc.purchasedItems.push(purchased);
    await userDoc.save();
    return { statusCode: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ success:true, message:'Item acheté', newCoins: userDoc.coins, purchasedItem: purchased }) };
  } catch (error) {
    return { statusCode: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ success:false, message:'Token invalide' }) };
  }
}

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

    let userId;
    if (typeof user === 'object' && user !== null) {
      userId = user.id || user._id;
    } else {
      userId = user;
    }

    const userDoc = await User.findById(userId);
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
  { id: 1, name: 'Oreilles de chat', price: 150, img: 'oreilleschat' },
  { id: 2, name: 'Clown', price: 120, img: 'clowncheveux' },
  { id: 3, name: 'Cash', price: 70, img: 'cash' },
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

    // Fonctions de date/heure pour l'heure de Paris et rotation à 01:00
    function getParisNowParts() {
      const fmt = new Intl.DateTimeFormat('fr-FR', {
        timeZone: 'Europe/Paris',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false
      });
      const parts = fmt.formatToParts(new Date());
      const map = {};
      for (const p of parts) map[p.type] = p.value;
      return {
        year: Number(map.year),
        month: Number(map.month),
        day: Number(map.day),
        hour: Number(map.hour),
        minute: Number(map.minute),
        second: Number(map.second)
      };
    }

    function formatYmd(y, m, d) {
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }

    // Seed du jour (Europe/Paris) avec reset à 01:00
    function getCurrentDaySeed() {
      const p = getParisNowParts();
      let y = p.year, m = p.month, d = p.day;
      if (p.hour < 1) {
        const date = new Date(Date.UTC(y, m - 1, d));
        date.setUTCDate(date.getUTCDate() - 1);
        y = date.getUTCFullYear();
        m = date.getUTCMonth() + 1;
        d = date.getUTCDate();
      }
      return formatYmd(y, m, d);
    }

    function getPreviousDaySeed() {
      const seed = getCurrentDaySeed();
      const [y, m, d] = seed.split('-').map(Number);
      const date = new Date(Date.UTC(y, m - 1, d));
      date.setUTCDate(date.getUTCDate() - 1);
      return formatYmd(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
    }

    // Mélange déterministe basé sur une seed
    function getShuffledFromSeed(seed, array) {
      let hash = 0;
      for (let i = 0; i < seed.length; i++) {
        const char = seed.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // 32-bit
      }
      const shuffled = [...array].sort(() => {
        hash = (hash * 9301 + 49297) % 233280;
        return (hash / 233280) - 0.5;
      });
      return shuffled;
    }

    // Générer les items quotidiens pour aujourd'hui (1h Paris) avec exclusion J+1
    const daySeed = getCurrentDaySeed();
    const prevSeed = getPreviousDaySeed();
    const currentShuffled = getShuffledFromSeed(daySeed, allWeeklyItems);
    const prevTop = getShuffledFromSeed(prevSeed, allWeeklyItems).slice(0, 3);
    const prevIds = new Set(prevTop.map(it => Number(it.id)));
    let weeklyItems = currentShuffled.filter(it => !prevIds.has(Number(it.id))).slice(0, 3);

    // Injecter les items dynamiques éligibles (availableInDailyShop) et les overrides
    try {
      ensureFreshOverrides();
      const removedItems = new Set([...weeklyOverrides.remove].map(Number));
      // Retirer déjà les supprimés de la liste courante
      weeklyItems = weeklyItems.filter(it => !removedItems.has(Number(it.id)));
      // Charger les items dynamiques disponibles pour la boutique quotidienne
      const dynPool = await DynItem.find({ active: true, availableInDailyShop: true }).lean();
      const dynCatalog = dynPool.map(dyn => ({ id: Number(dyn.legacyId), name: dyn.name, price: Number(dyn.price) || 0, infoOnly: !!dyn.infoOnly, infoDescription: dyn.infoDescription || null, isDynamic: true }));

      // Construire le pool combiné statique + dynamiques
      const combinedCatalog = [...allWeeklyItems, ...dynCatalog];

      // Si la sélection courante manque de slots (après exclusion J-1), la compléter depuis combinedCatalog
      if (weeklyItems.length < 3) {
        const missing = 3 - weeklyItems.length;
        const currentIds = new Set(weeklyItems.map(it => Number(it.id)));
        for (const it of combinedCatalog) {
          if (currentIds.has(Number(it.id))) continue;
          if (removedItems.has(Number(it.id))) continue;
          weeklyItems.push(it);
          if (weeklyItems.length >= 3) break;
        }
      }

      // Overrides add: injecter s'ils sont dans le catalogue combiné
      for (const id of weeklyOverrides.add) {
        const exists = weeklyItems.some(x => Number(x.id) === Number(id));
        if (exists) continue;
        const fromCombined = combinedCatalog.find(i => Number(i.id) === Number(id));
        if (fromCombined) weeklyItems.push(fromCombined);
      }
    } catch (e) {
      // silencieux si la collection n'existe pas
    }

    // Ajouter des couleurs de bordure hebdomadaires (statiques + dynamiques)
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

    // Générer des couleurs de bordure aléatoires (3 par jour) avec exclusion J+1
    const borderSeed = daySeed + '-borders';
    const prevBorderSeed = prevSeed + '-borders';
    const shuffledBorders = getShuffledFromSeed(borderSeed, borderColors);
    const prevBordersTop = getShuffledFromSeed(prevBorderSeed, borderColors).slice(0, 3);
    const prevBorderIds = new Set(prevBordersTop.map(b => String(b.id)));
    let weeklyBorderColors = shuffledBorders.filter(b => !prevBorderIds.has(String(b.id))).slice(0, 3).map((c) => ({ ...c, price: 40 }));

    // Ajouter les couleurs de bordure dynamiques (DB) disponibles pour la boutique quotidienne + overrides
    try {
      const dynBorders = await DynBorderColor.find({ availableInDailyShop: true }).lean();
      // Appliquer prix 40 par défaut si non défini
      const normalizedDynBorders = dynBorders.map(b => ({
        id: b.id || hashToInt(b.name || b.color || b.gradient),
        name: b.name || String(b.id || ''),
        type: 'border-color',
        colorId: b.id || String(hashToInt(b.name || '')),
        color: b.color || null,
        gradient: b.gradient || null,
        price: 40
      }));
      // Injecter dynamiques éligibles
      for (const found of normalizedDynBorders) {
        if (!weeklyBorderColors.some(x => String(x.id) === String(found.id))) {
          weeklyBorderColors.push(found);
        }
      }
      // Injecter explicitement demandés via overrides
      for (const bid of weeklyOverrides.addBorders) {
        const found = normalizedDynBorders.find(b => String(b.id) === String(bid) || String(b.colorId) === String(bid));
        if (found && !weeklyBorderColors.some(x => String(x.id) === String(found.id))) {
          weeklyBorderColors.push(found);
        }
      }
      // Également permettre de retirer dynamiques via removeBorders
      const removedBorders = new Set([...weeklyOverrides.removeBorders].map(String));
      weeklyBorderColors = weeklyBorderColors.filter(c => !removedBorders.has(String(c.id)) && !removedBorders.has(String(c.colorId)));
      // NB: sans override, on ne mélange pas dynamiques dans la rotation pour éviter surcharge
    } catch (e) {
      // silencieux: si la collection n'existe pas encore
    }
    // Appliquer overrides bordures (add/remove) du jour
    ensureFreshOverrides();
    const removedBorders = new Set([...weeklyOverrides.removeBorders].map(String));
    weeklyBorderColors = weeklyBorderColors.filter(c => !removedBorders.has(String(c.id)) && !removedBorders.has(String(c.colorId)));

    for (const bid of weeklyOverrides.addBorders) {
      // Chercher d'abord dans la liste statique
      let found = borderColors.find(b => String(b.id) === String(bid) || String(b.colorId) === String(bid));
      // TODO: possibilité d'étendre: charger aussi depuis la collection dynamique en DB si besoin
      if (found && !weeklyBorderColors.some(x => String(x.id) === String(found.id))) {
        weeklyBorderColors.push({ ...found, price: 40 });
      }
    }

    // Combiner les items normaux et les couleurs de bordure
    weeklyItems = [...weeklyItems, ...weeklyBorderColors];

    // Calculer le temps jusqu'à la prochaine rotation (01:00 Europe/Paris)
    const nowMs = Date.now();
    const p = getParisNowParts();
    const secondsOfDay = (p.hour * 3600) + (p.minute * 60) + p.second;
    const resetSeconds = 1 * 3600; // 01:00:00
    let deltaSec;
    if (secondsOfDay < resetSeconds) {
      deltaSec = resetSeconds - secondsOfDay;
    } else {
      deltaSec = (24 * 3600 - secondsOfDay) + resetSeconds;
    }
    const timeLeft = deltaSec * 1000;
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
    const timeUntilReset = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    // Calculer l'horodatage ISO de la prochaine rotation (Europe/Paris 01:00)
    const p2 = getParisNowParts();
    const now = new Date();
    let target = new Date(now);
    if (p2.hour < 1) {
      target.setHours(1, 0, 0, 0);
    } else {
      target.setDate(target.getDate() + 1);
      target.setHours(1, 0, 0, 0);
    }

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        weeklyItems,
        timeUntilReset,
        daySeed,
        nextReset: target.toISOString()
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

// Handler pour unequip
const handleUnequip = async (event) => {
  try {
    const user = verifyToken(event)
    let userId
    if (typeof user === 'object' && user !== null) {
      userId = user.id || user._id
    } else {
      userId = user
    }
    const userDoc = await User.findById(userId)
    if (!userDoc) {
      return { statusCode: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, message: 'Utilisateur non trouvé' }) }
    }
    userDoc.equippedItemId = null
    await userDoc.save()
    return { statusCode: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, message: 'Item déséquipé' }) }
  } catch (error) {
    return { statusCode: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, message: 'Token invalide' }) }
  }
}

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

    // Correction du typage pour récupérer l'ID utilisateur
    let userId;
    if (typeof user === 'object' && user !== null) {
      userId = user.id || user._id;
    }
    if (!userId) {
      return {
        statusCode: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, message: 'Utilisateur non authentifié' })
      };
    }

    const userDoc = await User.findById(userId);
    if (!userDoc) {
      return {
        statusCode: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, message: 'Utilisateur non trouvé' })
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
