const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { verifyToken } = require('../middlewares/auth');

// Route de test simple
router.get('/test', (req, res) => {
  res.json({ 
    message: 'API coins fonctionne', 
    timestamp: new Date().toISOString() 
  });
});

// Récupérer les coins d'un utilisateur
router.get('/user-coins', verifyToken, async (req, res) => {
  try {
    // @ts-ignore
    const userId = req.user.id || req.user._id;
    
    const user = await User.findById(userId);
    if (!user) {
      res.json({ coins: 0 });
      return;
    }
    
    res.json({ coins: user.coins || 0 });
  } catch (error) {
    console.error('Erreur récupération coins:', error);
    res.json({ coins: 0 });
  }
});

// Récupérer l'inventaire des items achetés
router.get('/inventory', verifyToken, async (req, res) => {
  try {
    // @ts-ignore
    const userId = req.user.id || req.user._id;
    
    const user = await User.findById(userId);
    if (!user) {
      res.json({ purchasedItems: [], equippedItemId: null });
      return;
    }
    
    res.json({ 
      purchasedItems: user.purchasedItems || [],
      equippedItemId: user.equippedItemId
    });
  } catch (error) {
    console.error('Erreur récupération inventaire:', error);
    res.json({ purchasedItems: [], equippedItemId: null });
  }
});

// Acheter un item
router.post('/purchase', verifyToken, async (req, res) => {
  try {
    // @ts-ignore
    const userId = req.user.id || req.user._id;
    const { itemId, itemName, price } = req.body;
    
    if (!itemId || !itemName || !price) {
      res.status(400).json({ 
        success: false, 
        message: 'Informations manquantes pour l\'achat' 
      });
      return;
    }
    
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ 
        success: false, 
        message: 'Utilisateur non trouvé' 
      });
      return;
    }
    
    // Vérifier si l'utilisateur a déjà acheté cet item
    const alreadyPurchased = user.purchasedItems.some(item => item.itemId === itemId);
    if (alreadyPurchased) {
      res.json({ 
        success: false, 
        message: 'Vous avez déjà acheté cet item' 
      });
      return;
    }
    
    // Vérifier si l'utilisateur a assez de coins
    if (user.coins < price) {
      res.json({ 
        success: false, 
        message: 'Coins insuffisants pour cet achat' 
      });
      return;
    }
    
    // Déduire les coins et ajouter l'item
    user.coins -= price;
    user.purchasedItems.push({
      itemId,
      itemName,
      purchaseDate: new Date(),
      equipped: false
    });
    
    await user.save();
    
    res.json({
      success: true,
      message: `Achat réussi ! Vous avez acheté ${itemName}`,
      newCoins: user.coins,
      purchasedItem: {
        itemId,
        itemName,
        purchaseDate: new Date(),
        equipped: false
      }
    });
  } catch (error) {
    console.error('Erreur achat:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de l\'achat' 
    });
  }
});

// Équiper un item
router.post('/equip', verifyToken, async (req, res) => {
  try {
    // @ts-ignore
    const userId = req.user.id || req.user._id;
    const { itemId } = req.body;
    
    if (!itemId) {
      res.status(400).json({ 
        success: false, 
        message: 'ID de l\'item manquant' 
      });
      return;
    }
    
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ 
        success: false, 
        message: 'Utilisateur non trouvé' 
      });
      return;
    }
    
    // Vérifier si l'utilisateur possède cet item
    const item = user.purchasedItems.find(item => item.itemId === itemId);
    if (!item) {
      res.json({ 
        success: false, 
        message: 'Vous ne possédez pas cet item' 
      });
      return;
    }
    
    // Déséquiper tous les items
    user.purchasedItems.forEach(item => {
      item.equipped = false;
    });
    
    // Équiper l'item sélectionné
    item.equipped = true;
    user.equippedItemId = itemId;
    
    await user.save();
    
    res.json({
      success: true,
      message: `Item ${item.itemName} équipé avec succès`,
      equippedItemId: itemId
    });
  } catch (error) {
    console.error('Erreur équipement:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de l\'équipement' 
    });
  }
});

// Déséquiper un item
router.post('/unequip', verifyToken, async (req, res) => {
  try {
    // @ts-ignore
    const userId = req.user.id || req.user._id;
    
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ 
        success: false, 
        message: 'Utilisateur non trouvé' 
      });
      return;
    }
    
    // Déséquiper tous les items
    user.purchasedItems.forEach(item => {
      item.equipped = false;
    });
    // @ts-ignore
    user.equippedItemId = null;
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Item déséquipé avec succès',
      equippedItemId: null
    });
  } catch (error) {
    console.error('Erreur déséquipement:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors du déséquipement' 
    });
  }
});

// Tourner la roue de la fortune
router.post('/spin-wheel', verifyToken, async (req, res) => {
  try {
    // @ts-ignore
    const userId = req.user.id || req.user._id;
    
    const user = await User.findById(userId);
    if (!user) {
      res.json({
        success: true,
        coinsWon: 10,
        newCoins: 10,
        rewardName: "10 coins",
        message: "Félicitations ! Vous avez gagné 10 coins !"
      });
      return;
    }
    
    // Vérifier si l'utilisateur peut tourner la roue (une fois par jour)
    const now = new Date();
    const lastSpin = user.lastSpinDate;
    
    if (lastSpin) {
      const timeDiff = now.getTime() - lastSpin.getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      
      if (hoursDiff < 24) {
        res.json({ 
          message: "Vous avez déjà tourné la roue aujourd'hui. Revenez demain !",
          canSpin: false
        });
        return;
      }
    }
    
    // Récompenses possibles - ÉQUILIBRÉES avec Perdu rare
    const rewards = [
      { coins: 10, probability: 0.15, name: "10 coins" },
      { coins: 20, probability: 0.15, name: "20 coins" },
      { coins: 30, probability: 0.15, name: "30 coins" },
      { coins: 50, probability: 0.15, name: "50 coins" },
      { coins: 70, probability: 0.15, name: "70 coins" },
      { coins: 100, probability: 0.15, name: "100 coins" },
      { coins: 0, probability: 0.10, name: "Perdu" }
    ];
    
    // Tirage au sort
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
    
    // Vérifier si c'est le weekend (samedi = 6, dimanche = 0)
    const dayOfWeek = now.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // 0 = dimanche, 6 = samedi
    
    // Doubler les récompenses pendant les weekends (sauf pour "Perdu")
    let finalCoins = reward.coins;
    let isWeekendBonus = false;
    
    if (isWeekend && reward.coins > 0) {
      finalCoins = reward.coins * 2;
      isWeekendBonus = true;
    }
    
    // Ajouter les coins et mettre à jour la date du dernier spin
    user.coins = (user.coins || 0) + finalCoins;
    user.lastSpinDate = now;
    await user.save();
    
    // Message personnalisé selon le weekend ou non
    let message;
    if (isWeekend && reward.coins > 0) {
      message = `🎉 WEEKEND BONUS x2 ! Vous avez gagné ${finalCoins} coins (${reward.coins} x 2) !`;
    } else if (reward.coins > 0) {
      message = `Félicitations ! Vous avez gagné ${finalCoins} coins !`;
    } else {
      message = `😔 Dommage, vous n'avez rien gagné cette fois-ci !`;
    }
    
    res.json({
      success: true,
      coinsWon: finalCoins,
      newCoins: user.coins,
      rewardName: reward.name,
      isWeekendBonus: isWeekendBonus,
      originalCoins: reward.coins,
      message: message
    });
  } catch (error) {
    console.error('Erreur spin-wheel:', error);
    res.json({
      success: true,
      coinsWon: 10,
      newCoins: 10,
      rewardName: "10 coins",
      message: "Félicitations ! Vous avez gagné 10 coins !"
    });
  }
});

// Vérifier l'état du spin
router.get('/spin-status', verifyToken, async (req, res) => {
  try {
    // @ts-ignore
    const userId = req.user.id || req.user._id;
    
    const user = await User.findById(userId);
    if (!user) {
      res.json({
        success: true,
        canSpin: true,
        lastSpinDate: null
      });
      return;
    }
    
    const now = new Date();
    const lastSpin = user.lastSpinDate;
    let canSpin = true;
    
    if (lastSpin) {
      const timeDiff = now.getTime() - lastSpin.getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      
      if (hoursDiff < 24) {
        canSpin = false;
      }
    }
    
    res.json({
      success: true,
      canSpin,
      lastSpinDate: lastSpin
    });
  } catch (error) {
    console.error('Erreur vérification spin-status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la vérification du statut du spin' 
    });
  }
});

// Récupérer les items de la boutique hebdomadaire (synchronisés pour tous)
router.get('/weekly-items', verifyToken, async (req, res) => {
  try {
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

    // Ajouts de test (mémoire process, non persistant)
    if (global.__WEEKLY_TEST_IDS__ && global.__WEEKLY_TEST_IDS__.size) {
      const ids = Array.from(global.__WEEKLY_TEST_IDS__);
      for (const id of ids) {
        const s = allWeeklyItems.find(x => x.id === id);
        if (s && !weeklyItems.find(x => x.id === id)) weeklyItems.push(s);
      }
    }

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

    res.json({
      success: true,
      weeklyItems,
      timeUntilReset,
      daySeed,
      nextReset: tomorrow.toISOString()
    });

  } catch (error) {
    console.error('Erreur récupération items hebdomadaires:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la récupération des items hebdomadaires',
      weeklyItems: [],
      timeUntilReset: '00:00:00'
    });
  }
});

// Endpoint de test: ajouter un item par legacyId aux items du jour
router.post('/weekly-items/test-add', verifyToken, async (req, res) => {
  try {
    const user = req['user'];
    if (!user || user.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Forbidden' });
      return;
    }
    const body = req.body || {};
    const legacyId = Number(body.legacyId);
    if (!legacyId || Number.isNaN(legacyId)) {
      res.json({ success: false, message: 'legacyId invalide' });
      return;
    }
    if (!global.__WEEKLY_TEST_IDS__) global.__WEEKLY_TEST_IDS__ = new Set();
    global.__WEEKLY_TEST_IDS__.add(legacyId);
    res.json({ success: true });
  } catch (e) {
    res.json({ success: false, message: 'Erreur ajout test' });
  }
});

module.exports = router; 