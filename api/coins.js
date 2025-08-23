const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// MongoDB connection
let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    return;
  }
  
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    isConnected = true;
  } catch (error) {
    console.error('Erreur de connexion MongoDB:', error);
    throw error;
  }
};

// User Schema (complete version for all endpoints)
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  coins: { type: Number, default: 0 },
  avatar: { type: String, default: null },
  role: { type: String, enum: ['admin', 'prof', 'delegue', 'eleve', 'etudiant'], required: true },
  year: { type: String, enum: ['BUT1', 'BUT2', 'BUT3'], default: null },
  groupe: { type: String, enum: ['A', "A'", 'A2', 'B', "B'", 'B2', 'Promo'], default: null },
  secretQuestions: [{
    question: { type: String, required: true },
    answer: { type: String, required: true }
  }],
  purchasedItems: [{
    itemId: { type: Number, required: true },
    itemName: { type: String, required: true },
    purchaseDate: { type: Date, default: Date.now },
    equipped: { type: Boolean, default: false },
    adminMessage: { type: String, default: null }
  }],
  equippedItemId: { type: Number, default: null },
  completedTasks: { type: Number, default: 0 },
  lastSpinDate: { type: Date, default: null },
  selectedBorderColor: { type: String, default: 'default' }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

// CORS headers
const setCorsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

// JWT verification
const verifyToken = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Token manquant');
  }
  const token = authHeader.substring(7);
  return jwt.verify(token, process.env.JWT_SECRET, {
    issuer: 'planify-api',
    audience: 'planify-frontend'
  });
};

// Weekly items data and logic
const getAllWeeklyItems = () => [
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

const getClassicBorderVariants = () => [
  { id: 'red', name: 'Rouge', color: '#ff0000' },
  { id: 'blue', name: 'Bleu', color: '#0066ff' },
  { id: 'green', name: 'Vert', color: '#00cc00' },
  { id: 'purple', name: 'Violet', color: '#9900cc' },
  { id: 'orange', name: 'Orange', color: '#ff6600' },
  { id: 'pink', name: 'Rose', color: '#ff3399' },
  { id: 'cyan', name: 'Cyan', color: '#00cccc' },
  { id: 'yellow', name: 'Jaune', color: '#ffcc00' },
  { id: 'magenta', name: 'Magenta', color: '#cc0099' },
  { id: 'lime', name: 'Vert citron', color: '#66ff00' }
];

const getCurrentDaySeed = () => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

const getRandomItemsFromSeed = (seed, items, count = 3) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  const shuffled = [...items].sort(() => {
    hash = (hash * 9301 + 49297) % 233280;
    return (hash / 233280) - 0.5;
  });
  
  return shuffled.slice(0, count);
};

module.exports = async (req, res) => {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Parse the URL to determine the endpoint
    const urlPath = req.url.split('?')[0]; // Remove query params
    const pathSegments = urlPath.split('/').filter(Boolean);
    
    // Remove 'api' and 'coins' from path
    const endpoint = pathSegments.slice(2).join('/') || 'main';
    
    console.log('🪙 Coins API called:', { method: req.method, endpoint, urlPath, pathSegments });

    // Handle different endpoints
    if (endpoint === 'weekly-items' && req.method === 'GET') {
      // WEEKLY ITEMS ENDPOINT (public)
      const allWeeklyItems = getAllWeeklyItems();
      const daySeed = getCurrentDaySeed();
      const weeklyItems = getRandomItemsFromSeed(daySeed, allWeeklyItems, 3);
      
      // Add test items if any
      if (global.__WEEKLY_TEST_IDS__ && global.__WEEKLY_TEST_IDS__.size) {
        const ids = Array.from(global.__WEEKLY_TEST_IDS__);
        for (const id of ids) {
          const s = allWeeklyItems.find(x => x.id === id);
          if (s && !weeklyItems.find(x => x.id === id)) weeklyItems.push(s);
        }
      }

      const classicBorderVariants = getClassicBorderVariants();
      const weeklyColors = getRandomItemsFromSeed(daySeed + '-colors', classicBorderVariants, 3);

      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(1, 0, 0, 0);
      const timeLeft = tomorrow.getTime() - now.getTime();
      const hours = Math.floor(timeLeft / (1000 * 60 * 60));
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
      const timeUntilReset = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

      return res.status(200).json({
        success: true,
        weeklyItems,
        weeklyColors,
        timeUntilReset,
        daySeed,
        nextReset: tomorrow.toISOString()
      });
    }

    // For all other endpoints, require authentication
    const user = verifyToken(req);
    const userIdString = user.id || user._id;
    
    if (!userIdString || !mongoose.Types.ObjectId.isValid(userIdString)) {
      return res.status(400).json({ 
        success: false, 
        message: 'UserId invalide' 
      });
    }

    await connectDB();
    const userDoc = await User.findById(userIdString);
    
    if (endpoint === 'user-coins' && req.method === 'GET') {
      // USER COINS ENDPOINT
      return res.json({ 
        success: true, 
        coins: userDoc ? userDoc.coins || 0 : 0 
      });
    }
    
    if (endpoint === 'inventory' && req.method === 'GET') {
      // INVENTORY ENDPOINT
      return res.json({ 
        success: true,
        purchasedItems: userDoc ? userDoc.purchasedItems || [] : [],
        equippedItemId: userDoc ? userDoc.equippedItemId : null
      });
    }
    
    if (endpoint === 'spin-status' && req.method === 'GET') {
      // SPIN STATUS ENDPOINT
      if (!userDoc) {
        return res.json({
          success: true,
          canSpin: true,
          lastSpinDate: null
        });
      }

      const now = new Date();
      const lastSpin = userDoc.lastSpinDate;
      let canSpin = true;
      
      if (lastSpin) {
        const timeDiff = now.getTime() - lastSpin.getTime();
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        
        if (hoursDiff < 24) {
          canSpin = false;
        }
      }
      
      return res.json({
        success: true,
        canSpin,
        lastSpinDate: lastSpin
      });
    }
    
    if (endpoint === 'purchase' && req.method === 'POST') {
      // PURCHASE ENDPOINT
      const { itemId, itemName, price, type } = req.body;
      
      if (!itemId || !itemName || !price) {
        return res.status(400).json({ 
          success: false, 
          message: 'Informations manquantes pour l\'achat' 
        });
      }
      
      if (!userDoc) {
        return res.status(404).json({ 
          success: false, 
          message: 'Utilisateur non trouvé' 
        });
      }
      
      // Check if already purchased
      const alreadyPurchased = userDoc.purchasedItems.some(item => item.itemId === itemId);
      if (alreadyPurchased) {
        return res.json({ 
          success: false, 
          message: 'Vous avez déjà acheté cet item' 
        });
      }
      
      // Check if enough coins
      if (userDoc.coins < price) {
        return res.json({ 
          success: false, 
          message: 'Coins insuffisants pour cet achat' 
        });
      }
      
      // Deduct coins and add item
      userDoc.coins -= price;
      const purchasedItem = {
        itemId,
        itemName,
        purchaseDate: new Date(),
        equipped: false
      };
      userDoc.purchasedItems.push(purchasedItem);
      
      await userDoc.save();
      
      return res.json({
        success: true,
        message: `Achat réussi ! Vous avez acheté ${itemName}`,
        newCoins: userDoc.coins,
        purchasedItem
      });
    }

    // MAIN ENDPOINT (spin-wheel, etc.) - keeping existing logic
    if (req.method === 'POST') {
      const { action } = req.body || {};
      
      if (action === 'spin-wheel') {
        if (!userDoc) {
          return res.json({
            success: true,
            coinsWon: 10,
            newCoins: 10,
            rewardName: "10 coins",
            message: "Félicitations ! Vous avez gagné 10 coins !"
          });
        }
        
        // Check if user can spin (once per day)
        const now = new Date();
        const lastSpin = userDoc.lastSpinDate;
        
        if (lastSpin) {
          const timeDiff = now.getTime() - lastSpin.getTime();
          const hoursDiff = timeDiff / (1000 * 60 * 60);
          
          if (hoursDiff < 24) {
            return res.json({ 
              message: "Vous avez déjà tourné la roue aujourd'hui. Revenez demain !",
              canSpin: false
            });
          }
        }
        
        // Possible rewards
        const rewards = [
          { coins: 10, probability: 0.15, name: "10 coins" },
          { coins: 20, probability: 0.15, name: "20 coins" },
          { coins: 30, probability: 0.15, name: "30 coins" },
          { coins: 50, probability: 0.15, name: "50 coins" },
          { coins: 70, probability: 0.15, name: "70 coins" },
          { coins: 100, probability: 0.15, name: "100 coins" },
          { coins: 0, probability: 0.10, name: "Perdu" }
        ];
        
        // Random selection
        const rand = Math.random();
        let cumulative = 0;
        let reward = rewards[0];
        
        for (const r of rewards) {
          cumulative += r.probability;
          if (rand <= cumulative) {
            reward = r;
            break;
          }
        }
        
        // Weekend bonus
        const dayOfWeek = now.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        
        let finalCoins = reward.coins;
        let isWeekendBonus = false;
        
        if (isWeekend && reward.coins > 0) {
          finalCoins = reward.coins * 2;
          isWeekendBonus = true;
        }
        
        // Add coins and update last spin date
        userDoc.coins = (userDoc.coins || 0) + finalCoins;
        userDoc.lastSpinDate = now;
        await userDoc.save();
        
        let message;
        if (isWeekend && reward.coins > 0) {
          message = `🎉 WEEKEND BONUS x2 ! Vous avez gagné ${finalCoins} coins (${reward.coins} x 2) !`;
        } else if (reward.coins > 0) {
          message = `Félicitations ! Vous avez gagné ${finalCoins} coins !`;
        } else {
          message = `😔 Dommage, vous n'avez rien gagné cette fois-ci !`;
        }
        
        return res.json({
          success: true,
          coinsWon: finalCoins,
          newCoins: userDoc.coins,
          rewardName: reward.name,
          isWeekendBonus: isWeekendBonus,
          originalCoins: reward.coins,
          message: message
        });
      }
    }

    // EQUIP ENDPOINT
    if (endpoint === 'equip' && req.method === 'POST') {
      const { itemId } = req.body;
      
      if (!itemId) {
        return res.status(400).json({ 
          success: false, 
          message: 'ID de l\'item manquant' 
        });
      }
      
      if (!userDoc) {
        return res.status(404).json({ 
          success: false, 
          message: 'Utilisateur non trouvé' 
        });
      }
      
      // Check if user owns this item
      const item = userDoc.purchasedItems.find(item => item.itemId === itemId);
      if (!item) {
        return res.json({ 
          success: false, 
          message: 'Vous ne possédez pas cet item' 
        });
      }
      
      // Unequip all items
      userDoc.purchasedItems.forEach(item => {
        item.equipped = false;
      });
      
      // Equip selected item
      item.equipped = true;
      userDoc.equippedItemId = itemId;
      
      await userDoc.save();
      
      return res.json({
        success: true,
        message: `Item ${item.itemName} équipé avec succès`,
        equippedItemId: itemId
      });
    }

    // UNEQUIP ENDPOINT
    if (endpoint === 'unequip' && req.method === 'POST') {
      if (!userDoc) {
        return res.status(404).json({ 
          success: false, 
          message: 'Utilisateur non trouvé' 
        });
      }
      
      // Unequip all items
      userDoc.purchasedItems.forEach(item => {
        item.equipped = false;
      });
      userDoc.equippedItemId = null;
      
      await userDoc.save();
      
      return res.json({
        success: true,
        message: 'Item déséquipé avec succès',
        equippedItemId: null
      });
    }

    // BORDER COLOR ENDPOINT (for border selection and Discord variants)
    if (endpoint === 'border-color' && req.method === 'POST') {
      const { colorId } = req.body;
      
      if (!colorId) {
        return res.status(400).json({ 
          success: false, 
          message: 'ColorId manquant' 
        });
      }
      
      if (!userDoc) {
        return res.status(404).json({ 
          success: false, 
          message: 'Utilisateur non trouvé' 
        });
      }
      
      // Update user's selected border color (this also handles Discord variants)
      userDoc.selectedBorderColor = colorId;
      await userDoc.save();
      
      return res.json({
        success: true,
        message: 'Couleur de bordure mise à jour',
        selectedBorderColor: colorId
      });
    }
    
    return res.status(405).json({ 
      success: false, 
      message: 'Méthode ou endpoint non supporté' 
    });
    
  } catch (authError) {
    console.error('❌ Erreur auth coins:', authError.message);
    return res.status(401).json({ 
      success: false, 
      message: 'Non autorisé' 
    });
  } catch (error) {
    console.error('❌ Erreur coins:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur',
      error: error.message 
    });
  }
};