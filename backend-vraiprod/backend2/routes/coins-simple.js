// Top-of-file additions (typages JSDoc et helper)
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { verifyToken, requireRole } = require('../middlewares/auth');
const Faction = require('../models/Faction');
const { randomInt } = require('crypto');
const spinLocks = new Map(); // Verrou par utilisateur pour éviter les spins concurrents

/**
 * Sélectionne un élément selon ses probabilités via un tirage cryptographique.
 * @param {{ probability: number }[]} rewards
 * @returns {any} L'élément choisi
 */
function pickWeightedCrypto(rewards) {
  if (!Array.isArray(rewards) || rewards.length === 0) return null;
  const SCALE = 1000000;
  const weights = rewards.map(r => {
    const p = Number(r.probability) || 0;
    return Math.max(1, Math.floor(p * SCALE));
  });
  const total = weights.reduce((a, b) => a + b, 0);
  const roll = randomInt(total);
  let acc = 0;
  for (let i = 0; i < rewards.length; i++) {
    acc += weights[i];
    if (roll < acc) return rewards[i];
  }
  return rewards[rewards.length - 1];
}

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
    const userId = safeUserId(req);
    
    const user = await User.findById(userId);
    if (!user) {
      res.json({ coins: 0 });
      return;
    }
  
    // Fallback legacy: tenter de lire le solde depuis la collection Coins si user.coins est vide
    let coins = user.coins || 0;
    if (!coins) {
      try {
        const Coins = require('../models/Coins');
        const legacy = await Coins.findOne({ userId }).lean();
        if (legacy && typeof legacy.coins === 'number') {
          coins = legacy.coins;
        }
      } catch (e) {
        // ignore
      }
    }
  
    res.json({ coins });
  } catch (error) {
    console.error('Erreur récupération coins:', error);
    res.json({ coins: 0 });
  }
});

// Récupérer l'inventaire des items achetés
router.get('/inventory', verifyToken, async (req, res) => {
  try {
    const userId = safeUserId(req);
    
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
      const err = /** @type {any} */ (e);
      console.warn('Impossible d\'ajouter automatiquement Bordure Classique:', err && err.message ? err.message : String(e))
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
    const userId = safeUserId(req);
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
    const userId = safeUserId(req);
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
    const userId = safeUserId(req);
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
    const userId = safeUserId(req);
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
// Route: /unequip
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
    const userId = safeUserId(req);
    
    const user = await User.findById(userId);
    if (!user) {
      res.json({
        success: true,
        canSpin: true,
        lastSpinDate: null,
        protectionReady: false,
        lossStreak: 0
      });
      return;
    }
    
    // Nouvelle logique: reset à minuit (Europe/Paris) pour tous
    const nowParis = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Paris' }))
    const fmtYMDParis = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Paris',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
    const todayParis = fmtYMDParis.format(nowParis)

    const lastSpin = user.lastSpinDate
    let canSpin = true
    if (lastSpin) {
      const lastSpinParisYMD = fmtYMDParis.format(lastSpin)
      canSpin = lastSpinParisYMD !== todayParis
    }

    // Protection prête immédiatement après 2 défaites
    const protectionReady = (user.lossStreak || 0) >= 2
    
    res.json({
      success: true,
      canSpin,
      lastSpinDate: lastSpin,
      protectionReady,
      lossStreak: user.lossStreak || 0
    });
  } catch (error) {
    console.error('Erreur vérification spin-status:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la vérification du statut du spin' 
    });
  }
});

// Route: /test-force-loss
router.post('/quest-reward', verifyToken, async (req, res) => {
  try {
    const userId = safeUserId(req);
    const body = req.body || {};
    const add = Number(body.amount);
    if (!Number.isFinite(add) || add <= 0) {
      return res.status(400).json({ success: false, message: 'Montant invalide' });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }
    user.coins = (user.coins || 0) + add;
    user.leaderboardCoins = (user.leaderboardCoins || 0) + add;
    if (user.faction) {
      user.factionCoins = (user.factionCoins || 0) + add;
      await Faction.updateOne({ name: user.faction }, { $inc: { totalCoins: add } }, { upsert: true });
    }
    await user.save();
    return res.json({
      success: true,
      newCoins: user.coins,
      leaderboardCoins: user.leaderboardCoins,
      factionCoins: user.factionCoins || 0
    });
  } catch (error) {
    console.error('Erreur quest-reward:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});
router.post('/test-force-loss', verifyToken, async (req, res) => {
  try {
    // @ts-ignore
    const userId = req.user.id || req.user._id;
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'Utilisateur introuvable' });
      return; // retourne void (corrige TS2769)
    }

    user.lossStreak = Math.min(2, (user.lossStreak || 0) + 1);
    await user.save();

    res.json({
      success: true,
      lossStreak: user.lossStreak,
      protectionReady: (user.lossStreak || 0) >= 2
    });
    return; // optionnel mais propre
  } catch (error) {
    console.error('Erreur test-force-loss:', error);
    res.status(500).json({ success: false, message: 'Erreur lors du test-force-loss' });
  }
});

// Tourner la roue de la fortune
router.post('/spin-wheel', verifyToken, async (req, res) => {
  let userId;
  try {
    userId = safeUserId(req);

    // Verrou en cours: empêche des requêtes simultanées pour le même utilisateur
    if (spinLocks.has(userId)) {
      return res.status(429).json({ success: false, message: 'Spin déjà en cours, réessayez.' });
    }
    spinLocks.set(userId, true);

    const user = await User.findById(userId);
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé ou token invalide'
      });
      return;
    }

    // Nouvelle logique: un spin par jour, reset à minuit Europe/Paris
    const now = new Date();
    const fmtYMDParis = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Paris',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const todayParis = fmtYMDParis.format(now);
    const lastSpin = user.lastSpinDate;

    // Bloquer si déjà spinné aujourd’hui (protection côté serveur)
    if (lastSpin && fmtYMDParis.format(lastSpin) === todayParis) {
      return res.status(429).json({ success: false, message: 'Vous avez déjà tourné la roue aujourd’hui.' });
    }

    // Déterminer si c'est le weekend (samedi = 6, dimanche = 0) en Europe/Paris
    const parisNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
    const dayOfWeek = parisNow.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // 0 = dimanche, 6 = samedi

    // Protection anti-défaite: active dès 2 pertes consécutives (pas besoin du lendemain)
    const protectionActive = (user.lossStreak || 0) >= 2;

    // Récompenses possibles (alignées avec l'UI)
    const hasGalaxy = Array.isArray(user.purchasedItems) && user.purchasedItems.some(it => Number(it.itemId) === 25);
    const baseRewards = [
      { coins: 20, probability: 0.20, name: '20 coins' },
      { coins: 40, probability: 0.18, name: '40 coins' },
      { coins: 80, probability: 0.15, name: '80 coins' },
      { coins: 120, probability: 0.13, name: '120 coins' },
      { coins: 160, probability: 0.11, name: '160 coins' },
      { coins: 180, probability: 0.10, name: '180 coins' },
      ...(!hasGalaxy ? [{ itemId: 25, probability: 0.01, name: 'Galaxie' }] : []),
      { coins: 0, probability: 0.10, name: 'Perdu' }
    ];
    const weekendRewards = [
      { coins: 30, probability: 0.22, name: '30 coins' },
      { coins: 60, probability: 0.20, name: '60 coins' },
      { coins: 120, probability: 0.18, name: '120 coins' },
      { coins: 180, probability: 0.16, name: '180 coins' },
      { coins: 240, probability: 0.12, name: '240 coins' },
      { coins: 270, probability: 0.06, name: '270 coins' },
      // Galaxie garde une petite probabilité et n'apparaît que si non possédée
      ...(!hasGalaxy ? [{ itemId: 25, probability: 0.01, name: 'Galaxie' }] : []),
      // Réduire la probabilité de "Perdu" le weekend
      { coins: 0, probability: 0.05, name: 'Perdu' }
    ];

    // Filtrer la case Perdu si protection active
    const safeBase = protectionActive ? baseRewards.filter(r => !(r.coins === 0 && /Perdu/i.test(r.name))) : baseRewards;
    const safeWeekend = protectionActive ? weekendRewards.filter(r => !(r.coins === 0 && /Perdu/i.test(r.name))) : weekendRewards;
    const rewards = isWeekend ? safeWeekend : safeBase;

    // Normalisation des probabilités (robuste si Perdu est filtré ou Galaxie absente)
    const totalProb = rewards.reduce((acc, r) => acc + (Number(r.probability) || 0), 0);
    const normalized = totalProb > 0
      ? rewards.map(r => ({ ...r, probability: (Number(r.probability) || 0) / totalProb }))
      : rewards.map(r => ({ ...r, probability: 1 / rewards.length }));

    // Tirage pondéré via générateur cryptographique
    const reward = pickWeightedCrypto(normalized) || normalized[normalized.length - 1];

    // Les weekends: on n'applique PAS de *2 supplémentaire, les montants sont déjà fixés
    const baseCoins = (typeof reward.coins === 'number') ? reward.coins : 0;
    let finalCoins = baseCoins;
    let isWeekendBonus = isWeekend && baseCoins > 0; // pour l'UX (message), sans multiplier
    
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

      // Prix du leaderboard par faction (défaut 1)
      let lbPrice = 1;
      if (user.faction) {
        try {
          const f = await Faction.findOne({ name: user.faction }).lean();
          lbPrice = Number(f?.leaderboardCoinPrice) || 1;
        } catch { lbPrice = 1; }
      }

      // FIX: ne pas multiplier les points du leaderboard par la faction
      user.leaderboardCoins = (user.leaderboardCoins || 0) + finalCoins;

      if (finalCoins > 0 && user.faction) {
        user.factionCoins = (user.factionCoins || 0) + finalCoins;
      }
    }

    // Mettre à jour la lossStreak selon le résultat et la protection
    const wonCoins = typeof reward.coins === 'number' ? reward.coins : 0;
    const isItemReward = !!reward.itemId;
    let protectionUsed = false;
    if (protectionActive) {
      protectionUsed = true;           // protection consommée ce spin
      user.lossStreak = 0;            // reset après un spin protégé
    } else if (isItemReward || wonCoins > 0) {
      // Ne pas reset sur une victoire normale si la protection n'est pas active
      user.lossStreak = user.lossStreak || 0;
    } else {
      user.lossStreak = Math.min(2, (user.lossStreak || 0) + 1); // incrémenter sur défaite
    }

    user.lastSpinDate = now;
    user.repeatable = user.repeatable || {};
    function incAndAward(key, threshold, amount) {
      user.repeatable[key] = Math.max(0, Number(user.repeatable[key] || 0)) + 1;
      if (user.repeatable[key] >= threshold) {
        user.repeatable[key] -= threshold;
        user.coins = (user.coins || 0) + amount; // wallet only
        user.achievements = user.achievements || {}; user.achievements.repeatCompleted = Math.max(0, Number(user.achievements.repeatCompleted||0)) + 1;
      }
    }
    incAndAward('wheel10', 10, 100);
    incAndAward('wheel25', 25, 250);
    incAndAward('wheel50', 50, 500);

    // Succès (roue)
    function award(id) {
      user.achievementsCompleted = Array.isArray(user.achievementsCompleted) ? user.achievementsCompleted : [];
      if (!user.achievementsCompleted.includes(id)) user.achievementsCompleted.push(id);
    }
    user.achievements = user.achievements || {};
    user.achievements.wheelSpinTotal = Math.max(0, Number(user.achievements.wheelSpinTotal||0)) + 1;
    if (user.achievements.wheelSpinTotal === 1) award('ach-wheel-once');
    if (user.achievements.wheelSpinTotal === 10) award('wheel-spin-10');
    if (user.achievements.wheelSpinTotal === 50) award('wheel-spin-50');
    if (user.achievements.wheelSpinTotal === 100) award('wheel-spin-100');

    const lost = !(reward.itemId) && !(typeof reward.coins === 'number' && reward.coins > 0);
    if (lost) {
      user.achievements.wheelLossTotal = Math.max(0, Number(user.achievements.wheelLossTotal||0)) + 1;
      if (user.achievements.wheelLossTotal === 1) award('wheel-first-loss');
      if (user.achievements.wheelLossTotal === 30) award('wheel-lose-30');
    }

    // Weekend counters (Europe/Paris)
    const parisYmd = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
    const y = parisYmd.getFullYear(), m = String(parisYmd.getMonth()+1).padStart(2,'0'), d = String(parisYmd.getDate()).padStart(2,'0');
    const todayYmd = `${y}-${m}-${d}`;
    if (isWeekend) {
      if (user.achievements.wheelWeekendSpinsYmd !== todayYmd) { user.achievements.wheelWeekendSpinsYmd = todayYmd; user.achievements.wheelWeekendSpinsCount = 0; }
      user.achievements.wheelWeekendSpinsCount = Math.max(0, Number(user.achievements.wheelWeekendSpinsCount||0)) + 1;
      if (user.achievements.wheelWeekendSpinsCount === 2) award('wheel-weekend-spin-2');
      if (lost) {
        if (user.achievements.wheelWeekendLossYmd !== todayYmd) { user.achievements.wheelWeekendLossYmd = todayYmd; user.achievements.wheelWeekendLossCount = 0; }
        user.achievements.wheelWeekendLossCount = Math.max(0, Number(user.achievements.wheelWeekendLossCount||0)) + 1;
        if (user.achievements.wheelWeekendLossCount === 2) award('wheel-weekend-lose-2');
      }
    }

    await user.save();

    // Incrément du total de la faction
    if (finalCoins > 0 && user.faction) {
      await Faction.updateOne(
        { name: user.faction },
        { $inc: { totalCoins: finalCoins } },
        { upsert: true }
      );
    }

    // Message personnalisé selon le weekend ou non
    let message;
    if (reward.itemId === 25) {
      message = `🌌 Incroyable ! Vous avez obtenu l'item Galaxie !`;
    } else if (
      isWeekend &&
      typeof reward.coins === 'number' &&
      reward.coins > 0
    ) {
      // BONUS weekend x1.5 (les montants côté serveur sont déjà majorés)
      message = `🎉 WEEKEND BONUS x1.5 ! Vous avez gagné ${finalCoins} coins !`;
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
      message: message,
      protectionUsed,
      lossStreak: user.lossStreak,
      // Protection prête si (et seulement si) on est à 2 pertes, sans attendre le lendemain
      protectionReady: (user.lossStreak || 0) >= 2
    });
  } catch (error) {
    console.error('Erreur spin-wheel:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du spin'
    });
  } finally {
    if (userId) spinLocks.delete(userId);
  }
});

// Récupérer les items de la boutique quotidienne (figés pour la journée, reset à minuit Europe/Paris)
// Route: /weekly-items — accès aux propriétés global via notation indexée
router.get('/weekly-items', verifyToken, async (req, res) => {
  /** @type {import('express').Request} */ (req);
  /** @type {import('express').Response} */ (res);
  try {
    const DailyShop = require('../models/DailyShop');
    /**
     * @typedef {{
     *   id: number,
     *   name: string,
     *   price: number,
     *   img: string,
     *   type?: string,
     *   isDynamic?: boolean,
     *   assets?: any[],
     *   backgrounds?: any
     * }} ShopItem
     */
    // Tous les items disponibles pour la boutique quotidienne (items normaux)
    /** @type {ShopItem[]} */
    const allWeeklyItems = [
      // Items normaux
      { id: 1, name: 'Oreilles de chat', price: 150, img: '/src/assets/img/oreilleschat.gif' },
      { id: 2, name: 'Clown', price: 120, img: '/src/assets/img/clowncheveux.gif' },
      { id: 3, name: 'Cash', price: 50, img: '/src/assets/img/cash.gif' },
      { id: 4, name: 'Cible', price: 90, img: '/src/assets/img/target.gif' },
      { id: 6, name: 'Roi', price: 170, img: '/src/assets/img/roi.gif' },
      { id: 7, name: 'Matrix', price: 500, img: '/src/assets/img/matrix.gif' },
      { id: 8, name: 'Ange', price: 600, img: '/src/assets/img/angelwings.gif' },
      { id: 9, name: 'Tomb Raider', price: 350, img: '/src/assets/img/laracroft.gif' },
      { id: 10, name: 'Étoiles', price: 110, img: '/src/assets/img/star.gif' },
      { id: 11, name: 'Cadre royale', price: 220, img: '/src/assets/img/cadre.gif' },
      { id: 12, name: 'Roses', price: 170, img: '/src/assets/img/love.gif' },
      { id: 13, name: 'Gentleman', price: 170, img: '/src/assets/img/moustache.gif' },
      { id: 14, name: 'Vinyle', price: 100, img: '/src/assets/img/vinyle.gif' },
      { id: 15, name: 'Advisory', price: 145, img: '/src/assets/img/advisory.gif' },
      { id: 16, name: 'Espace', price: 300, img: '/src/assets/img/spacestars.gif' },
      { id: 17, name: 'Absolute Cinema', price: 165, img: '/src/assets/img/bras.png' },
      { id: 18, name: 'Flash', price: 175, img: '/src/assets/img/flash.gif' },
      { id: 19, name: 'Miaou', price: 200, img: '/src/assets/img/chat.gif' },
      { id: 20, name: 'DVD', price: 190, img: '/src/assets/img/dvd.png' },
      { id: 21, name: 'Lunettes pixel', price: 130, img: '/src/assets/img/mlglunette.gif' },
      { id: 22, name: '2000', price: 215, img: '/src/assets/img/nokia.gif' },
      // Ajouts au pool quotidien: Discord et Jojo (hors bordure classique et hors Admin/Alpha/Galaxie/Coeur)
      { id: 23, name: 'Discord', price: 160, img: '/src/assets/img/discord.png' },
      { id: 24, name: 'Jojo', price: 170, img: '/src/assets/img/tobecontinued.png' }
    ];

    // Fonctions robustes heure Europe/Paris (évite double-conversion)
    /** @param {Date=} date */
    function getParisYMD(date = new Date()) {
      const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Paris',
        year: 'numeric', month: '2-digit', day: '2-digit'
      }).formatToParts(date);
      const m = /** @type {Record<string, string>} */ ({});
      for (const p of parts) m[/** @type {string} */ (p.type)] = p.value;
      return { year: Number(m['year']), month: Number(m['month']), day: Number(m['day']) };
    }
    // Seed du jour: 00:00 Europe/Paris
    /** @returns {string} */
    function getCurrentDaySeed() {
      const p = getParisYMD();
      const y = String(p.year);
      const mm = String(p.month).padStart(2, '0');
      const dd = String(p.day).padStart(2, '0');
      return `${y}-${mm}-${dd}`;
    }

    // Mélange déterministe basé sur une seed
    /**
     * @param {string} seed
     * @param {ShopItem[]} items
     * @returns {ShopItem[]}
     */
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
    /**
     * @param {string} seed
     * @param {number=} count
     * @param {ShopItem[]=} items
     * @returns {ShopItem[]}
     */
    function getRandomItemsFromSeed(seed, count = 4, items = allWeeklyItems) {
      const shuffled = getShuffledItemsFromSeed(seed, items);
      return shuffled.slice(0, count);
    }

    // Générer/charger la sélection quotidienne pour aujourd'hui (Europe/Paris)
    const daySeed = getCurrentDaySeed();
    const salt = /** @type {any} */ (global)['__DAILY_REROLL_SALT__'] || null;
    const seedForToday = (salt && String(salt).length)
      ? `${daySeed}|${salt}`
      : daySeed;
    // Empêcher la répétition immédiate (J vs J-1) pour les items normaux
    function getPreviousDaySeed() {
      // Calculer minuit Paris du jour courant, puis reculer d'un jour
      const p = getParisYMD();
      const midnightParisUTC = Date.UTC(p.year, p.month - 1, p.day, 0, 0, 0);
      const prev = new Date(midnightParisUTC - 24 * 60 * 60 * 1000);
      const pp = getParisYMD(prev);
      const y = String(pp.year);
      const mm = String(pp.month).padStart(2, '0');
      const dd = String(pp.day).padStart(2, '0');
      return `${y}-${mm}-${dd}`;
    }

    const prevSeed = getPreviousDaySeed();
    // Construire le pool combiné: statiques + dynamiques marqués "availableInDailyShop"
    /** @type {ShopItem[]} */
    let combinedPool = [...allWeeklyItems];
    try {
      const ItemModel = require('../models/Item');
      const dyn = await ItemModel.find({ active: true, availableInDailyShop: true }).lean();
      const staticIds = new Set(allWeeklyItems.map(i => i.id));
      for (const d of dyn) {  
        const id = Number(d.legacyId);
        if (!Number.isFinite(id) || staticIds.has(id)) continue;
        combinedPool.push(
          /** @type {ShopItem} */ ({
            id,
            name: d.name,
            price: Number(d.price) || 0,
            isDynamic: true,
            img: '',
            assets: Array.isArray(d.assets) ? d.assets : [],
            backgrounds: d.backgrounds || {}
          })
        );
      }
    } catch {}

    const prevItems = getRandomItemsFromSeed(prevSeed, 4, combinedPool);
    const prevIds = new Set(prevItems.map(i => i.id));

    // Lire cache existant
    let cached = await DailyShop.findOne({ daySeed }).lean()
    /** @type {number[]} */ let selectedItemIds = []
    /** @type {number[]} */ let selectedColorIds = []

    if (!cached) {
      // Calcul initial déterministe (éviter la répétition immédiate vs J-1)
      const shuffledToday = getShuffledItemsFromSeed(seedForToday, combinedPool);
      const todaySelection = [];
      for (const it of shuffledToday) {
        if (!prevIds.has(it.id)) {
          todaySelection.push(it);
          if (todaySelection.length === 4) break;
        }
      }
      while (todaySelection.length < 4) {
        for (const it of shuffledToday) {
          if (!todaySelection.find(x => x.id === it.id)) {
            todaySelection.push(it);
            if (todaySelection.length === 4) break;
          }
        }
      }
      selectedItemIds = todaySelection.map(it => Number(it.id))
      // Les couleurs seront calculées ci-dessous (selectedColorIds)
    } else {
      selectedItemIds = Array.isArray(cached.itemIds) ? cached.itemIds.map(Number) : []
      selectedColorIds = Array.isArray(cached.colorIds) ? cached.colorIds.map(Number) : []
      if (selectedItemIds.length < 4) {
        const shuffledToday = getShuffledItemsFromSeed(seedForToday, combinedPool);
        for (const it of shuffledToday) {
          const id = Number(it.id);
          if (!prevIds.has(id) && !selectedItemIds.includes(id)) {
            selectedItemIds.push(id);
            if (selectedItemIds.length === 4) break;
          }
        }
      }
    }
    // (les ajouts de test seront fusionnés plus bas une fois weeklyItems construit)
    
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
    const prevColors = getShuffledItemsFromSeed(prevSeed, borderColorItems).slice(0, 4);
    const prevColorIds = new Set(prevColors.map(c => c.id));

    const shuffledTodayColors = getShuffledItemsFromSeed(seedForToday, borderColorItems);
    /** @type {ShopItem[]} */
    const todayColorSelection = [];
    for (const c of shuffledTodayColors) {
      if (!prevColorIds.has(c.id)) {
        todayColorSelection.push(c);
        if (todayColorSelection.length === 4) break;
      }
    }
    // Sécurité: si moins de 4 couleurs (cas très rare), compléter sans la contrainte
    while (todayColorSelection.length < 4) {
      for (const c of shuffledTodayColors) {
        if (!todayColorSelection.find(x => x.id === c.id)) {
          todayColorSelection.push(c);
          if (todayColorSelection.length === 4) break;
        }
      }
    }
    const selectedBorderColors = todayColorSelection;

    // Si pas de cache: persister la sélection du jour (items + couleurs)
    if (!cached) {
      selectedColorIds = selectedBorderColors.map(c => Number(c.id))
      try {
        await DailyShop.create({ daySeed, itemIds: selectedItemIds, colorIds: selectedColorIds })
      } catch (e) {
        // si concurrence: relire
        const again = await DailyShop.findOne({ daySeed }).lean()
        if (again) {
          selectedItemIds = Array.isArray(again.itemIds) ? again.itemIds.map(Number) : selectedItemIds
          selectedColorIds = Array.isArray(again.colorIds) ? again.colorIds.map(Number) : selectedColorIds
        }
      }
    } else {
      if (selectedColorIds.length < 4) {
        for (const c of selectedBorderColors) {
          const id = Number(c.id)
          if (!selectedColorIds.includes(id)) selectedColorIds.push(id)
          if (selectedColorIds.length === 4) break
        }
      }
      try { await DailyShop.updateOne({ daySeed }, { $set: { itemIds: selectedItemIds.slice(0,4), colorIds: selectedColorIds.slice(0,4) } }) } catch {}
    }

    // Reconstruire la réponse à partir des IDs figés (pour ignorer les ajouts/suppressions dans la journée)
    /** @param {ShopItem[]} pool @param {number[]} ids @returns {ShopItem[]} */
    const pickById = (pool, ids) => {
      const map = new Map(pool.map(p => [Number(p.id), p]))
      /** @type {ShopItem[]} */
      const out = []
      for (const id of ids) {
        const v = map.get(Number(id))
        if (v) out.push(v)
      }
      return out
    }
    /** @type {ShopItem[]} */
    let weeklyItems = pickById(combinedPool, selectedItemIds)
    // Surcharger la sélection couleurs par celle figée si elle existe
    const colorPool = borderColorItems
    const colorsOut = selectedColorIds && selectedColorIds.length
      ? pickById(colorPool, selectedColorIds)
      : selectedBorderColors
    weeklyItems = [...weeklyItems, ...colorsOut];

    // Ajouts de test (mémoire process, non persistant) – injecter après construction
    const G = /** @type {any} */ (global);
    if (G.__WEEKLY_TEST_IDS__ && G.__WEEKLY_TEST_IDS__.size) {
      const ids = Array.from(G.__WEEKLY_TEST_IDS__)
      /** @param {ShopItem[]} arr @param {number} id */
      const hasId = (arr, id) => arr.some(x => Number(x.id) === Number(id))
      for (const id of ids) {
        const found = combinedPool.find(x => Number(x.id) === Number(id))
        if (found && !hasId(weeklyItems, id)) weeklyItems.push(found)
      }
    }

    // Calculer le temps jusqu'à la prochaine rotation à 00:00 (heure Europe/Paris)
    // Méthode robuste (DST): on extrait les parties de date en Europe/Paris puis on calcule en UTC.
    function getParisParts(date = new Date()) {
      const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Paris',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
      }).formatToParts(date);
      const m = /** @type {Record<string, string>} */ ({})
      for (const p of parts) { m[/** @type {string} */ (p.type)] = /** @type {string} */ (p.value); }
      return {
        year: Number(m.year), month: Number(m.month), day: Number(m.day),
        hour: Number(m.hour), minute: Number(m.minute), second: Number(m.second)
      };
    }
    const p = getParisParts();
    const nowUTC = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
    const nextResetUTC = Date.UTC(p.year, p.month - 1, p.day + 1, 0, 0, 0);
    const timeLeft = Math.max(0, nextResetUTC - nowUTC);
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
  /** @type {import('express').Request} */ (req);
  /** @type {import('express').Response} */ (res);
  try {
    const user = /** @type {any} */ (req).user
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
    // Cast global pour TS7053
    const G = /** @type {any} */ (global);
    if (!G.__WEEKLY_TEST_IDS__) G.__WEEKLY_TEST_IDS__ = new Set()
    G.__WEEKLY_TEST_IDS__.add(legacyId)
    res.json({ success: true })
  } catch (e) {
    res.json({ success: false, message: 'Erreur ajout test' })
  }
})

// Endpoint de test: retirer un item par legacyId des items du jour
router.post('/weekly-items/test-remove', verifyToken, async (req, res) => {
  /** @type {import('express').Request} */ (req);
  /** @type {import('express').Response} */ (res);
  try {
    const user = /** @type {any} */ (req).user
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
    // Cast global pour TS7053
    const G = /** @type {any} */ (global);
    if (!G.__WEEKLY_TEST_IDS__) G.__WEEKLY_TEST_IDS__ = new Set()
    G.__WEEKLY_TEST_IDS__.delete(legacyId)
    res.json({ success: true })
  } catch (e) {
    res.json({ success: false, message: 'Erreur retrait test' })
  }
})

// Admin: re-roll immédiat de la boutique quotidienne (supprime la sélection figée du seed courant)
router.post('/weekly-items/reroll', verifyToken, requireRole(['admin']), async (req, res) => {
  /** @type {import('express').Request} */ (req);
  /** @type {import('express').Response} */ (res);
  try {
    const DailyShop = require('../models/DailyShop')
    // Seed tri-jours Europe/Paris (début de période)
    const seed = getCurrentDaySeed();
    await DailyShop.deleteOne({ daySeed: seed });
    // Cast global + randomInt pour le sel de reroll
    const G = /** @type {any} */ (global);
    G['__DAILY_REROLL_SALT__'] = randomInt(0, 1_000_000).toString(36);
    res.json({ success: true, message: 'Sélection tri-jour supprimée et reroll déclenché. Rouvrez la boutique pour voir la nouvelle sélection.' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Erreur lors du re-roll', error: String(e) })
  }
})

// Historique de la boutique quotidienne (items + couleurs) — Admin
router.get('/weekly-items/history', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const DailyShop = require('../models/DailyShop');
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 30));
    const entries = await DailyShop.find({}).sort({ createdAt: -1 }).limit(limit).lean();
    res.json({
      success: true,
      entries: entries.map(e => ({
        daySeed: e.daySeed,
        itemIds: Array.isArray(e.itemIds) ? e.itemIds.map(Number) : [],
        colorIds: Array.isArray(e.colorIds) ? e.colorIds.map(Number) : [],
        createdAt: e.createdAt
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur chargement historique', error: String(error) });
  }
});

router.get('/favorites', verifyToken, async (req, res) => {
  try {
    const userId = safeUserId(req);
    if (!userId) return res.status(401).json({ success: false, favorites: [] });
    const user = await User.findById(userId).lean();
    if (!user) return res.status(404).json({ success: false, favorites: [] });
    const favorites = Array.isArray(user.favorites) ? user.favorites.map(Number).filter(Number.isFinite) : [];
    res.json({ success: true, favorites });
  } catch (error) {
    res.status(500).json({ success: false, favorites: [], message: 'Erreur chargement favoris' });
  }
});

router.put('/favorites', verifyToken, async (req, res) => {
  try {
    const userId = safeUserId(req);
    if (!userId) return res.status(401).json({ success: false, favorites: [] });
    const input = (req.body && Array.isArray(req.body.favorites)) ? req.body.favorites : [];
    const favorites = input.map((n) => Number(n)).filter((n) => Number.isFinite(n));
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, favorites: [] });
    user.favorites = favorites;
    await user.save();
    res.json({ success: true, favorites });
  } catch (error) {
    res.status(500).json({ success: false, favorites: [], message: 'Erreur sauvegarde favoris' });
  }
});

module.exports = router;


/**
 * Typage léger du payload JWT mis dans req.user par verifyToken.
 * Évite les diagnostics TS dans ce fichier JS sans dépendances externes.
 * Accepte id/_id numériques ou ObjectId, et tokens avec `sub`.
 * @typedef {{ id?: string|number|any, _id?: string|number|any, sub?: string|number|any, role?: string, faction?: string }} JwtUser
 */

/** @param {any} req @returns {string|null} */
function safeUserId(req) {
  // ... existing code ...
  const u = /** @type {any} */ (req.user || {});
  /** @type {string|null} */
  let id = null;
  if (typeof u.id === 'string') id = u.id;
  else if (typeof u.id === 'number') id = String(u.id);
  else if (u.id && typeof u.id === 'object' && typeof u.id.toString === 'function') id = u.id.toString();

  /** @type {string|null} */
  let oid = null;
  if (typeof u._id === 'string') oid = u._id;
  else if (u._id && typeof u._id === 'object' && typeof u._id.toString === 'function') oid = u._id.toString();

  const sub = typeof u.sub === 'string' ? u.sub : null;

  return id || oid || sub || null;
  // ... existing code ...
}