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
    
    // S'assurer que tous les utilisateurs possèdent l'item "Bordure Classique" (id 0)
    try {
      const hasClassic = (user.purchasedItems || []).some(it => it.itemId === 0)
      if (!hasClassic) {
        user.purchasedItems.push({
          itemId: 0,
          itemName: 'Bordure Classique',
          purchaseDate: new Date(),
          equipped: false
        })
        await user.save()
      }
    } catch (e) {
      console.warn('Impossible d\'ajouter automatiquement Bordure Classique:', e?.message)
    }

    res.json({ 
      purchasedItems: user.purchasedItems || [],
      equippedItemId: user.equippedItemId,
      selectedBorderColor: user.selectedBorderColor || 'default'
    });
  } catch (error) {
    console.error('Erreur récupération inventaire:', error);
    res.json({ purchasedItems: [], equippedItemId: null, selectedBorderColor: 'default' });
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
      equipped: false,
      adminMessage: null,
      adminGiftRead: true
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
        equipped: false,
        adminMessage: null,
        adminGiftRead: true
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

// Obtenir la couleur de bordure sélectionnée
router.get('/border-color', verifyToken, async (req, res) => {
  try {
    // @ts-ignore
    const userId = req.user.id || req.user._id;
    const user = await User.findById(userId);
    if (!user) {
      res.json({ success: true, selectedBorderColor: 'default' });
      return;
    }
    res.json({ success: true, selectedBorderColor: user.selectedBorderColor || 'default' });
  } catch (error) {
    console.error('Erreur récupération border-color:', error);
    res.json({ success: true, selectedBorderColor: 'default' });
  }
});

// Mettre à jour la couleur de bordure sélectionnée (toujours active, indépendante des items)
router.post('/border-color', verifyToken, async (req, res) => {
  try {
    // @ts-ignore
    const userId = req.user.id || req.user._id;
    const { colorId } = req.body;
    if (!colorId || typeof colorId !== 'string') {
      res.status(400).json({ success: false, message: 'colorId invalide' });
      return;
    }
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
      return;
    }
    user.selectedBorderColor = colorId;
    await user.save();
    res.json({ success: true, selectedBorderColor: user.selectedBorderColor });
  } catch (error) {
    console.error('Erreur MAJ border-color:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour de la couleur' });
  }
});

// Équiper un item
router.post('/equip', verifyToken, async (req, res) => {
  try {
    // @ts-ignore
    const userId = req.user.id || req.user._id;
    const { itemId } = req.body;
    // Accepter itemId = 0 (Bordure classique). Vérification explicite au lieu de `!itemId`.
    const parsedItemId = typeof itemId === 'string' ? parseInt(itemId, 10) : itemId;
    const isMissing = parsedItemId === undefined || parsedItemId === null || Number.isNaN(parsedItemId);
    if (isMissing) {
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
    let item = user.purchasedItems.find(item => item.itemId === parsedItemId);
    // Support des variantes Discord: autoriser l'équipement des IDs 231/232 si l'utilisateur possède l'ID 23
    const discordVariantIds = [231, 232];
    if (!item && discordVariantIds.includes(parsedItemId)) {
      const baseDiscord = user.purchasedItems.find(i => i.itemId === 23);
      if (baseDiscord) {
        item = baseDiscord;
      }
    }
    // Assurer que la Bordure classique (id 0) peut toujours être équipée,
    // même si elle n'est pas encore dans purchasedItems (ajout auto si besoin)
    if (!item && parsedItemId === 0) {
      user.purchasedItems.push({
        itemId: 0,
        itemName: 'Bordure Classique',
        purchaseDate: new Date(),
        equipped: false
      });
      item = user.purchasedItems.find(i => i.itemId === 0);
    }
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
    user.equippedItemId = parsedItemId;
    
    await user.save();
    
    res.json({
      success: true,
      message: `Item ${item.itemName} équipé avec succès`,
      equippedItemId: parsedItemId
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
    
    // Rétablir le timer 24h: autoriser un spin/jour
    const now = new Date();
    const lastSpin = user.lastSpinDate;
    let canSpin = true;
    if (lastSpin) {
      const timeDiff = now.getTime() - lastSpin.getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      if (hoursDiff < 24) canSpin = false;
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
          success: false,
          message: "Vous avez déjà tourné la roue aujourd'hui. Revenez demain !",
          canSpin: false
        });
        return;
      }
    }
    
    // Récompenses possibles
    const hasGalaxy = Array.isArray(user.purchasedItems) && user.purchasedItems.some(it => Number(it.itemId) === 25);
    const rewards = [
      { coins: 10, probability: 0.20, name: '10 coins' },
      { coins: 20, probability: 0.18, name: '20 coins' },
      { coins: 30, probability: 0.15, name: '30 coins' },
      { coins: 50, probability: 0.13, name: '50 coins' },
      { coins: 70, probability: 0.11, name: '70 coins' },
      { coins: 100, probability: 0.10, name: '100 coins' },
      // Galaxie: uniquement si l'utilisateur ne l'a pas encore
      ...(!hasGalaxy ? [{ itemId: 25, probability: 0.01, name: 'Galaxie' }] : []),
      { coins: 0, probability: 0.10, name: 'Perdu' }
    ];
    
    // Tirage au sort standard (Galaxie incluse à 1% si non possédée)
    let reward = rewards[0];
    const rand = Math.random();
    let cumulative = 0;
    for (const r of rewards) {
      cumulative += r.probability;
      if (rand <= cumulative) { reward = r; break; }
    }
    
    // Vérifier si c'est le weekend (samedi = 6, dimanche = 0)
    const dayOfWeek = now.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // 0 = dimanche, 6 = samedi
    
    // Doubler les récompenses pendant les weekends (sauf pour "Perdu" et les items)
    const baseCoins = (typeof reward.coins === 'number') ? reward.coins : 0;
    let finalCoins = baseCoins;
    let isWeekendBonus = false;
    
    if (isWeekend && baseCoins > 0) {
      finalCoins = baseCoins * 2;
      isWeekendBonus = true;
    }
    
    // Appliquer la récompense
    let rewardName = reward.name;
    if (reward.itemId === 25) {
      // Gagner l'item Galaxie (id=25)
      if (!hasGalaxy) {
        user.purchasedItems.push({ itemId: 25, itemName: 'Galaxie', equipped: false });
      }
      finalCoins = 0; // pas de coins en plus
      rewardName = 'Galaxie';
    } else {
      user.coins = (user.coins || 0) + finalCoins;
    }
    user.lastSpinDate = now;
    await user.save();
    
    // Message personnalisé selon le weekend ou non
    let message;
    if (reward.itemId === 25) {
      message = `🌌 Incroyable ! Vous avez obtenu l'item Galaxie !`;
    } else if (
      isWeekend &&
      typeof reward.coins === 'number' &&
      reward.coins > 0
    ) {
      message = `🎉 WEEKEND BONUS x2 ! Vous avez gagné ${finalCoins} coins (${reward.coins} x 2) !`;
    } else if (
      typeof reward.coins === 'number' &&
      reward.coins > 0
    ) {
      message = `Félicitations ! Vous avez gagné ${finalCoins} coins !`;
    } else {
      message = `😔 Dommage, vous n'avez rien gagné cette fois-ci !`;
    }
    
    res.json({
      success: true,
      coinsWon: finalCoins,
      newCoins: user.coins,
      rewardName: rewardName,
      rewardItemId: reward.itemId || null,
      isWeekendBonus: isWeekendBonus,
      originalCoins: baseCoins,
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

// Récupérer les items de la boutique hebdomadaire (synchronisés pour tous)
router.get('/weekly-items', verifyToken, async (req, res) => {
  try {
    // Tous les items disponibles pour la boutique hebdomadaire (items normaux)
    const allWeeklyItems = [
      // Items normaux
      { id: 1, name: 'Oreilles de chat', price: 50, img: '/src/assets/img/oreilleschat.gif' },
      { id: 2, name: 'Clown', price: 80, img: '/src/assets/img/clowncheveux.gif' },
      { id: 3, name: 'Cash', price: 60, img: '/src/assets/img/cash.gif' },
      { id: 4, name: 'Cible', price: 100, img: '/src/assets/img/target.gif' },
      { id: 6, name: 'Roi', price: 90, img: '/src/assets/img/roi.gif' },
      { id: 7, name: 'Matrix', price: 110, img: '/src/assets/img/matrix.gif' },
      { id: 8, name: 'Ange', price: 600, img: '/src/assets/img/angelwings.gif' },
      { id: 9, name: 'Tomb Raider', price: 130, img: '/src/assets/img/laracroft.gif' },
      { id: 10, name: 'Étoiles', price: 100, img: '/src/assets/img/star.gif' },
      { id: 11, name: 'Cadre royale', price: 95, img: '/src/assets/img/cadre.gif' },
      { id: 12, name: 'Roses', price: 105, img: '/src/assets/img/love.gif' },
      { id: 13, name: 'Gentleman', price: 115, img: '/src/assets/img/moustache.gif' },
      { id: 14, name: 'Vinyle', price: 135, img: '/src/assets/img/vinyle.gif' },
      { id: 15, name: 'Advisory', price: 145, img: '/src/assets/img/advisory.gif' },
      { id: 16, name: 'Espace', price: 155, img: '/src/assets/img/spacestars.gif' },
      { id: 17, name: 'Absolute Cinema', price: 165, img: '/src/assets/img/bras.png' },
      { id: 18, name: 'Flash', price: 175, img: '/src/assets/img/flash.gif' },
      { id: 19, name: 'Miaou', price: 200, img: '/src/assets/img/chat.gif' },
      { id: 20, name: 'DVD', price: 195, img: '/src/assets/img/dvd.png' },
      { id: 21, name: 'Lunettes pixel', price: 130, img: '/src/assets/img/mlglunette.gif' },
      { id: 22, name: '2000', price: 215, img: '/src/assets/img/nokia.gif' },
      // Ajouts au pool quotidien: Discord et Jojo (hors bordure classique et hors Admin/Alpha/Galaxie/Coeur)
      { id: 23, name: 'Discord', price: 160, img: '/src/assets/img/discord.png' },
      { id: 24, name: 'Jojo', price: 170, img: '/src/assets/img/tobecontinued.png' }
    ];

    // Fonction pour obtenir la seed du jour actuel (heure Europe/Paris)
    function getCurrentDaySeed() {
      const formatter = new Intl.DateTimeFormat('fr-CA', {
        timeZone: 'Europe/Paris',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      return formatter.format(new Date()); // format YYYY-MM-DD
    }

    // Mélange déterministe basé sur une seed
    function getShuffledItemsFromSeed(seed, items) {
      let hash = 0;
      for (let i = 0; i < seed.length; i++) {
        const char = seed.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convertir en 32-bit integer
      }
      
      // Utiliser la seed pour mélanger le tableau
      const shuffled = [...items].sort(() => {
        hash = (hash * 9301 + 49297) % 233280;
        return (hash / 233280) - 0.5;
      });
      return shuffled;
    }

    // Fonction pour générer N items basés sur une seed, sur un pool donné
    function getRandomItemsFromSeed(seed, count = 3, items = allWeeklyItems) {
      const shuffled = getShuffledItemsFromSeed(seed, items);
      return shuffled.slice(0, count);
    }

    // Générer les items hebdomadaires pour aujourd'hui
    const daySeed = getCurrentDaySeed();
    // Empêcher la répétition immédiate (J vs J-1) pour les items normaux
    function getPreviousDaySeed() {
      const now = new Date();
      const parisNow = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
      parisNow.setDate(parisNow.getDate() - 1);
      const formatter = new Intl.DateTimeFormat('fr-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' });
      return formatter.format(parisNow);
    }

    const prevSeed = getPreviousDaySeed();
    // Construire le pool combiné: statiques + dynamiques marqués "availableInDailyShop"
    let combinedPool = [...allWeeklyItems];
    try {
      const ItemModel = require('../models/Item');
      const dyn = await ItemModel.find({ active: true, availableInDailyShop: true }).lean();
      const staticIds = new Set(allWeeklyItems.map(i => i.id));
      for (const d of dyn) {
        const id = Number(d.legacyId);
        if (!Number.isFinite(id) || staticIds.has(id)) continue;
        combinedPool.push({
          id,
          name: d.name,
          price: Number(d.price) || 0,
          isDynamic: true,
          img: '',
          assets: Array.isArray(d.assets) ? d.assets : [],
          backgrounds: d.backgrounds || {}
        });
      }
    } catch {}

    const prevItems = getRandomItemsFromSeed(prevSeed, 3, combinedPool);
    const prevIds = new Set(prevItems.map(i => i.id));

    const shuffledToday = getShuffledItemsFromSeed(daySeed, combinedPool);
    const todaySelection = [];
    for (const it of shuffledToday) {
      if (!prevIds.has(it.id)) {
        todaySelection.push(it);
        if (todaySelection.length === 3) break;
      }
    }
    // Sécurité: si jamais il manque (très improbable), compléter sans la contrainte
    while (todaySelection.length < 3) {
      for (const it of shuffledToday) {
        if (!todaySelection.find(x => x.id === it.id)) {
          todaySelection.push(it);
          if (todaySelection.length === 3) break;
        }
      }
    }

    let weeklyItems = todaySelection;
    // Ajouts de test (mémoire process, non persistant)
    if (global.__WEEKLY_TEST_IDS__ && global.__WEEKLY_TEST_IDS__.size) {
      const ids = Array.from(global.__WEEKLY_TEST_IDS__)
      // essayer de trouver dans statiques
      for (const id of ids) {
        const s = combinedPool.find(x => x.id === id && !x.isDynamic)
        if (s && !weeklyItems.find(x => x.id === id)) weeklyItems.push(s)
      }
      // essayer de trouver dans dynamiques (si exposés via items dynamiques front)
      try {
        const ItemModel2 = require('../models/Item')
        const dynItems = await ItemModel2.find({ active: true }).sort({ createdAt: -1 })
        for (const d of dynItems) {
          const id = Number(d.legacyId)
          if (ids.includes(id) && !weeklyItems.find(x => x.id === id)) {
            weeklyItems.push({ id, name: d.name, price: Number(d.price) || 0, isDynamic: true, img: '', assets: d.assets || [], backgrounds: d.backgrounds || {} })
          }
        }
      } catch {}
    }
    
    // Ajouter 3 couleurs de bordures aléatoires en plus des items normaux
    // Alignées avec frontend/src/stores/coins.ts -> initializeBorderColors()
    const borderColorItems = [
      // Couleurs unies
      { id: 100, name: 'Bordure Rouge', price: 40, type: 'border-color', borderStyle: '3px solid #FF0000', img: 'border-red' },
      { id: 101, name: 'Bordure Bleu', price: 40, type: 'border-color', borderStyle: '3px solid #0066FF', img: 'border-blue' },
      { id: 102, name: 'Bordure Vert', price: 40, type: 'border-color', borderStyle: '3px solid #00FF00', img: 'border-green' },
      { id: 103, name: 'Bordure Jaune', price: 40, type: 'border-color', borderStyle: '3px solid #FFFF00', img: 'border-yellow' },
      { id: 104, name: 'Bordure Violet', price: 40, type: 'border-color', borderStyle: '3px solid #7A1FFF', img: 'border-purple' },
      { id: 105, name: 'Bordure Orange', price: 40, type: 'border-color', borderStyle: '3px solid #FF8800', img: 'border-orange' },
      { id: 106, name: 'Bordure Rose', price: 40, type: 'border-color', borderStyle: '3px solid #FF2F72', img: 'border-pink' },
      { id: 107, name: 'Bordure Cyan', price: 40, type: 'border-color', borderStyle: '3px solid #00FFFF', img: 'border-cyan' },
      { id: 108, name: 'Bordure Or', price: 40, type: 'border-color', borderStyle: '3px solid #FFD700', img: 'border-gold' },
      { id: 109, name: 'Bordure Argent', price: 40, type: 'border-color', borderStyle: '3px solid #C0C0C0', img: 'border-silver' },
      { id: 129, name: 'Bordure Magenta', price: 40, type: 'border-color', borderStyle: '3px solid #FF00FF', img: 'border-magenta' },
      { id: 130, name: 'Bordure Vert Lime', price: 40, type: 'border-color', borderStyle: '3px solid #00FF80', img: 'border-lime' },
      { id: 131, name: 'Bordure Bleu Royal', price: 40, type: 'border-color', borderStyle: '3px solid #0FA3B1', img: 'border-royal' },
      { id: 132, name: 'Bordure Blanc', price: 40, type: 'border-color', borderStyle: '3px solid #FFFFFF', img: 'border-white' },
      { id: 133, name: 'Bordure Bronze', price: 45, type: 'border-color', borderStyle: '3px solid #CD7F32', img: 'border-bronze' },

      // Variantes supplémentaires (unies/effets simples)
      { id: 111, name: 'Bordure Feu', price: 40, type: 'border-color', borderStyle: '3px solid #FF4D00', img: 'border-fire' },
      { id: 112, name: 'Bordure Glace', price: 40, type: 'border-color', borderStyle: '3px solid #A7E8FF', img: 'border-ice' },
      { id: 114, name: 'Bordure Océan', price: 40, type: 'border-color', borderStyle: '3px solid #0077BE', img: 'border-ocean' },
      { id: 115, name: 'Bordure Forêt', price: 40, type: 'border-color', borderStyle: '3px solid #228B22', img: 'border-forest' },
      { id: 116, name: 'Bordure Désert', price: 40, type: 'border-color', borderStyle: '3px solid #C2B280', img: 'border-desert' },
      { id: 119, name: 'Bordure Volcan', price: 40, type: 'border-color', borderStyle: '3px solid #8B0000', img: 'border-volcano' },
      { id: 120, name: 'Bordure Cristal', price: 40, type: 'border-color', borderStyle: '3px solid #9AD9FF', img: 'border-crystal' },
      { id: 122, name: 'Bordure Aube', price: 40, type: 'border-color', borderStyle: '3px solid #FFDAB9', img: 'border-dawn' },
      { id: 123, name: 'Bordure Crépuscule', price: 40, type: 'border-color', borderStyle: '3px solid #5B4B8A', img: 'border-dusk' },
      { id: 124, name: 'Bordure Tempête', price: 40, type: 'border-color', borderStyle: '3px solid #708090', img: 'border-storm' },
      { id: 125, name: 'Bordure Printemps', price: 40, type: 'border-color', borderStyle: '3px solid #7CFC00', img: 'border-spring' },
      { id: 126, name: 'Bordure Été', price: 40, type: 'border-color', borderStyle: '3px solid #F4C430', img: 'border-summer' },
      { id: 127, name: 'Bordure Automne', price: 40, type: 'border-color', borderStyle: '3px solid #D2691E', img: 'border-autumn' },
      { id: 128, name: 'Bordure Hiver', price: 40, type: 'border-color', borderStyle: '3px solid #ADD8E6', img: 'border-winter' },

      // Variantes à dégradé (considérées premium)
      { id: 110, name: 'Bordure Arc-en-ciel', price: 40, type: 'border-gradient', borderStyle: '3px solid transparent', img: 'border-rainbow' },
      { id: 117, name: 'Bordure Galaxie', price: 40, type: 'border-gradient', borderStyle: '3px solid transparent', img: 'border-galaxy' },
      { id: 118, name: 'Bordure Aurore', price: 40, type: 'border-gradient', borderStyle: '3px solid transparent', img: 'border-aurora' },

      // Dégradés nommés (134-143)
      { id: 134, name: 'Bordure Menthe polaire', price: 40, type: 'border-gradient', borderStyle: '3px solid transparent', img: 'gradient-mint' },
      { id: 135, name: 'Bordure Crépuscule doré', price: 40, type: 'border-gradient', borderStyle: '3px solid transparent', img: 'gradient-sunset' },
      { id: 136, name: 'Bordure Azur Mandarine', price: 40, type: 'border-gradient', borderStyle: '3px solid transparent', img: 'gradient-duo' },
      { id: 137, name: 'Bordure Brume rouge', price: 40, type: 'border-gradient', borderStyle: '3px solid transparent', img: 'gradient-red-fade' },
      { id: 138, name: 'Bordure Brume verte', price: 40, type: 'border-gradient', borderStyle: '3px solid transparent', img: 'gradient-green-fade' },
      { id: 139, name: 'Bordure Brume bleue', price: 40, type: 'border-gradient', borderStyle: '3px solid transparent', img: 'gradient-blue-fade' },
      { id: 140, name: 'Bordure Aube', price: 40, type: 'border-gradient', borderStyle: '3px solid transparent', img: 'gradient-yellow-fade' },
      { id: 141, name: 'Bordure Lagune', price: 40, type: 'border-gradient', borderStyle: '3px solid transparent', img: 'gradient-cyan-fade' },
      { id: 142, name: 'Bordure Orchidée', price: 40, type: 'border-gradient', borderStyle: '3px solid transparent', img: 'gradient-magenta-fade' },
      { id: 143, name: 'Bordure Néon', price: 40, type: 'border-gradient', borderStyle: '3px solid transparent', img: 'gradient-instagram' },

      // Palette g200-g231
      { id: 200, name: 'Bordure Neige', price: 40, type: 'border-gradient', borderStyle: '3px solid transparent', img: 'g200' },
      { id: 201, name: 'Bordure Gris Urbain', price: 40, type: 'border-gradient', borderStyle: '3px solid transparent', img: 'g201' },
      { id: 202, name: 'Bordure Néon Tricolore', price: 40, type: 'border-gradient', borderStyle: '3px solid transparent', img: 'g202' },
      { id: 203, name: 'Bordure Néon Menthe', price: 40, type: 'border-gradient', borderStyle: '3px solid transparent', img: 'g203' },
      { id: 204, name: 'Bordure Nébuleuse', price: 40, type: 'border-gradient', borderStyle: '3px solid transparent', img: 'g204' },
      { id: 205, name: 'Bordure Soleil', price: 40, type: 'border-gradient', borderStyle: '3px solid transparent', img: 'g205' },
      { id: 206, name: 'Bordure Violet Profond', price: 40, type: 'border-gradient', borderStyle: '3px solid transparent', img: 'g206' },
      { id: 207, name: 'Bordure Magenta Royal', price: 40, type: 'border-gradient', borderStyle: '3px solid transparent', img: 'g207' },
      { id: 208, name: 'Bordure Aurore Boréale', price: 40, type: 'border-gradient', borderStyle: '3px solid transparent', img: 'g208' },
      { id: 209, name: 'Bordure Tropical', price: 40, type: 'border-gradient', borderStyle: '3px solid transparent', img: 'g209' },
      { id: 210, name: 'Bordure Jardin d’été', price: 40, type: 'border-gradient', borderStyle: '3px solid transparent', img: 'g210' },
      { id: 211, name: 'Bordure Crépuscule', price: 40, type: 'border-gradient', borderStyle: '3px solid transparent', img: 'g211' },
      { id: 212, name: 'Bordure Rouge Pastel', price: 40, type: 'border-gradient', borderStyle: '3px solid transparent', img: 'g212' },
      { id: 213, name: 'Bordure Vert Pastel', price: 40, type: 'border-gradient', borderStyle: '3px solid transparent', img: 'g213' },
      { id: 214, name: 'Bordure Bleu Profond', price: 40, type: 'border-gradient', borderStyle: '3px solid transparent', img: 'g214' },
      { id: 215, name: 'Bordure Jaune Pastel', price: 40, type: 'border-gradient', borderStyle: '3px solid transparent', img: 'g215' },
      { id: 216, name: 'Bordure Cyan Pastel', price: 40, type: 'border-gradient', borderStyle: '3px solid transparent', img: 'g216' },
      { id: 217, name: 'Bordure Rose Pastel', price: 40, type: 'border-gradient', borderStyle: '3px solid transparent', img: 'g217' },
      { id: 218, name: 'Bordure Violet Pastel', price: 40, type: 'border-gradient', borderStyle: '3px solid transparent', img: 'g218' },
      { id: 219, name: 'Bordure Fuchsia Pastel', price: 40, type: 'border-gradient', borderStyle: '3px solid transparent', img: 'g219' },
      { id: 220, name: 'Bordure Orange Pastel', price: 40, type: 'border-gradient', borderStyle: '3px solid transparent', img: 'g220' },
      { id: 221, name: 'Bordure Menthe Pastel', price: 40, type: 'border-gradient', borderStyle: '3px solid transparent', img: 'g221' },
      { id: 222, name: 'Bordure Lave', price: 40, type: 'border-gradient', borderStyle: '3px solid transparent', img: 'g222' },
      { id: 223, name: 'Bordure Jungle Nocturne', price: 40, type: 'border-gradient', borderStyle: '3px solid transparent', img: 'g223' },
      { id: 224, name: 'Bordure Océan Nuit', price: 40, type: 'border-gradient', borderStyle: '3px solid transparent', img: 'g224' },
      { id: 225, name: 'Bordure Soleil Éteint', price: 40, type: 'border-gradient', borderStyle: '3px solid transparent', img: 'g225' },
      { id: 226, name: 'Bordure Glacier Nuit', price: 40, type: 'border-gradient', borderStyle: '3px solid transparent', img: 'g226' },
      { id: 227, name: 'Bordure Fuchsia Nuit', price: 40, type: 'border-gradient', borderStyle: '3px solid transparent', img: 'g227' },
      { id: 228, name: 'Bordure Galaxie Nuit', price: 40, type: 'border-gradient', borderStyle: '3px solid transparent', img: 'g228' },
      { id: 229, name: 'Bordure Rose Nuit', price: 40, type: 'border-gradient', borderStyle: '3px solid transparent', img: 'g229' },
      { id: 230, name: 'Bordure Ambre Nuit', price: 40, type: 'border-gradient', borderStyle: '3px solid transparent', img: 'g230' },
      { id: 231, name: 'Bordure Émeraude Nuit', price: 40, type: 'border-gradient', borderStyle: '3px solid transparent', img: 'g231' },
    ];
    
    // Sélectionner 3 couleurs de bordures aléatoires avec la MÊME logique que les items
    // et empêcher la répétition immédiate J vs J-1
    const prevColors = getShuffledItemsFromSeed(prevSeed, borderColorItems).slice(0, 3);
    const prevColorIds = new Set(prevColors.map(c => c.id));

    const shuffledTodayColors = getShuffledItemsFromSeed(daySeed, borderColorItems);
    const todayColorSelection = [];
    for (const c of shuffledTodayColors) {
      if (!prevColorIds.has(c.id)) {
        todayColorSelection.push(c);
        if (todayColorSelection.length === 3) break;
      }
    }
    // Sécurité: si moins de 3 couleurs (cas très rare), compléter sans la contrainte
    while (todayColorSelection.length < 3) {
      for (const c of shuffledTodayColors) {
        if (!todayColorSelection.find(x => x.id === c.id)) {
          todayColorSelection.push(c);
          if (todayColorSelection.length === 3) break;
        }
      }
    }
    const selectedBorderColors = todayColorSelection;
    
    // Combiner les items normaux avec les couleurs de bordures
    weeklyItems = [...weeklyItems, ...selectedBorderColors];

    // Calculer le temps jusqu'à la prochaine rotation à 01:00 (heure Europe/Paris)
    const now = new Date();
    const parisNow = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
    const parisTarget = new Date(parisNow);
    parisTarget.setHours(1, 0, 0, 0);
    if (parisNow.getHours() >= 1) {
      parisTarget.setDate(parisTarget.getDate() + 1);
    }
    const timeLeft = parisTarget.getTime() - parisNow.getTime();
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
    const timeUntilReset = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    res.json({
      success: true,
      weeklyItems,
      timeUntilReset,
      daySeed,
      nextReset: new Date(Date.now() + timeLeft).toISOString()
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
    const user = req['user']
    if (!user || user.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Forbidden' })
      return
    }
    const body = req.body || {}
    const legacyId = Number(body.legacyId)
    if (!legacyId || Number.isNaN(legacyId)) {
      res.json({ success: false, message: 'legacyId invalide' })
      return
    }
    if (!global.__WEEKLY_TEST_IDS__) global.__WEEKLY_TEST_IDS__ = new Set()
    global.__WEEKLY_TEST_IDS__.add(legacyId)
    res.json({ success: true })
  } catch (e) {
    res.json({ success: false, message: 'Erreur ajout test' })
  }
})

// Endpoint de test: retirer un item par legacyId des items du jour
router.post('/weekly-items/test-remove', verifyToken, async (req, res) => {
  try {
    const user = req['user']
    if (!user || user.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Forbidden' })
      return
    }
    const body = req.body || {}
    const legacyId = Number(body.legacyId)
    if (!legacyId || Number.isNaN(legacyId)) {
      res.json({ success: false, message: 'legacyId invalide' })
      return
    }
    if (!global.__WEEKLY_TEST_IDS__) global.__WEEKLY_TEST_IDS__ = new Set()
    global.__WEEKLY_TEST_IDS__.delete(legacyId)
    res.json({ success: true })
  } catch (e) {
    res.json({ success: false, message: 'Erreur retrait test' })
  }
})

module.exports = router; 