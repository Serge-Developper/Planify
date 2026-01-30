const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Faction = require('../models/Faction');
const { verifyToken } = require('../middlewares/auth');
const { verifyToken: _v, requireRole } = require('../middlewares/auth');

// Helper: garantit l'existence des deux factions
async function ensureFactions() {
  for (const name of ['Bagnat','Fermier']) {
    await Faction.updateOne(
      { name },
      { $setOnInsert: { name, leaderboardCoinPrice: 1 } },
      { upsert: true }
    );
  }
}

// POST /api/factions/join { faction: 'Bagnat'|'Fermier' }
router.post('/join', verifyToken, async (req, res) => {
  try {
    const desired = String(req.body?.faction || '').trim();
    if (!['Bagnat','Fermier'].includes(desired)) {
      res.status(400).json({ success: false, message: 'Faction invalide' });
      return;
    }

    const userId = req.user.id || req.user._id;
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'Utilisateur introuvable' });
      return;
    }

    await ensureFactions();
    const prev = user.faction || null;

    if (prev === desired) {
      res.json({ success: true, faction: user.faction, coins: Number(user.coins || 0) });
      return;
    }

    // Première adhésion: gratuite
    if (!prev) {
      user.faction = desired;
      user.factionCoins = 0;
      await user.save();
      await Faction.updateOne({ name: desired }, { $inc: { membersCount: 1 } }, { upsert: true });
      res.json({ success: true, faction: user.faction, coins: Number(user.coins || 0) });
      return;
    }

    // Changement de faction: coûte 200 coins
    const CHANGE_COST = 250;
    const wallet = Number(user.coins || 0);
    if (!Number.isFinite(wallet) || wallet < CHANGE_COST) {
      res.status(400).json({
        success: false,
        message: `Coins insuffisants: ${CHANGE_COST} requis`,
        errorCode: 'INSUFFICIENT_COINS',
        required: CHANGE_COST,
        current: wallet
      });
      return;
    }

    user.coins = wallet - CHANGE_COST;
    user.faction = desired;
    user.factionCoins = 0;
    await user.save();

    await Faction.updateOne({ name: prev }, { $inc: { membersCount: -1 } });
    await Faction.updateOne({ name: desired }, { $inc: { membersCount: 1 } }, { upsert: true });

    res.json({ success: true, faction: user.faction, coins: Number(user.coins || 0) });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/factions/leaderboard
router.get('/leaderboard', verifyToken, async (req, res) => {
  try {
    await ensureFactions();

    const baseFilter = {
      role: { $ne: 'admin' },
      $or: [
        { role: { $ne: 'prof' } },
        { role: 'prof', leaderboardEnabled: true }
      ]
    };

    const [bagnatUsers, fermierUsers, factions] = await Promise.all([
      User.find({ ...baseFilter, faction: 'Bagnat' }).lean(),
      User.find({ ...baseFilter, faction: 'Fermier' }).lean(),
      Faction.find({ name: { $in: ['Bagnat','Fermier'] } }).lean()
    ]);

    const bagnatPrice = Number(factions.find(f => f.name === 'Bagnat')?.leaderboardCoinPrice) || 1;
    const fermierPrice = Number(factions.find(f => f.name === 'Fermier')?.leaderboardCoinPrice) || 1;

    const mapUser = (/** @type {any} */ user) => {
      const rawFactionCoins = Number.isFinite(Number(user.factionCoins)) ? Number(user.factionCoins) : 0;
      const realUserCoins = Number(user.leaderboardCoins || user.coins || 0);
      return {
        id: user._id,
        _id: user._id,
        username: user.username,
        role: user.role,
        groupe: user.groupe,
        year: user.year,
        // coins = coins du leaderboard de faction (vraie valeur à afficher)
        coins: rawFactionCoins,
        // garder aussi le général pour usage éventuel côté front
        leaderboardCoins: realUserCoins,
        // exposer explicitement la valeur de faction
        factionCoins: rawFactionCoins,
        completedTasks: user.completedTasks || 0,
        avatar: user.avatar || null,
        avatarVersion: typeof user.avatarVersion === 'number' ? user.avatarVersion : 0,
        avatarCrop: user.avatarCrop || { x: 50, y: 50, scale: 1 },
        selectedBorderColor: user.selectedBorderColor || 'default',
        publicNote: user.publicNote || '',
        equippedItemId: user.equippedItemId || null,
        dynamicItemVariants: (() => {
          const raw = user.dynamicItemVariants || {};
          // Map -> plain object
          if (raw && typeof raw.get === 'function') {
            try {
              return Object.fromEntries(
                Array.from(raw.entries()).map(([k, v]) => [String(k), Number(v)])
              );
            } catch {
              return {};
            }
          }
          // plain object -> normalize keys and numeric values
          if (raw && typeof raw === 'object') {
            const out = {};
            for (const k of Object.keys(raw)) {
              const nk = String(k);
              const nv = Number(raw[k]);
              if (Number.isFinite(nv)) out[nk] = nv;
            }
            return out;
          }
          return {};
        })(),
      };
    };

    const bagnatAll = bagnatUsers.map(u => mapUser(u));
    const fermierAll = fermierUsers.map(u => mapUser(u));

    // Tri par vrais coins du leaderboard des factions
    const sortDesc = (
      /** @type {{ factionCoins?: number, coins?: number, username?: string }} */ a,
      /** @type {{ factionCoins?: number, coins?: number, username?: string }} */ b
    ) => {
      const av = Number(a.factionCoins ?? a.coins ?? 0);
      const bv = Number(b.factionCoins ?? b.coins ?? 0);
      if (bv !== av) return bv - av;
      const an = String(a.username || '').toLowerCase();
      const bn = String(b.username || '').toLowerCase();
      return an.localeCompare(bn);
    };

    const bagnatTop = [...bagnatAll].sort(sortDesc);
    const fermierTop = [...fermierAll].sort(sortDesc);

    // @ts-ignore
    const currentUserId = String(req.user.id || req.user._id || '');

    // Ne pas dépendre du token pour la faction: chercher par ID dans les 2 listes
    const currentUserBagnat = (() => {
      const idx = bagnatAll.findIndex(u => String(u._id) === currentUserId);
      if (idx >= 0) {
        const sorted = [...bagnatAll].sort(sortDesc);
        const rankIdx = sorted.findIndex(u => String(u._id) === currentUserId);
        return { ...bagnatAll[idx], rank: (rankIdx >= 0 ? rankIdx + 1 : idx + 1) };
      }
      return null;
    })();

    const currentUserFermier = (() => {
      const idx = fermierAll.findIndex(u => String(u._id) === currentUserId);
      if (idx >= 0) {
        const sorted = [...fermierAll].sort(sortDesc);
        const rankIdx = sorted.findIndex(u => String(u._id) === currentUserId);
        return { ...fermierAll[idx], rank: (rankIdx >= 0 ? rankIdx + 1 : idx + 1) };
      }
      return null;
    })();

    const factionsOut = [
      {
        name: 'Bagnat',
        totalCoins: Number(factions.find(f => f.name === 'Bagnat')?.totalCoins || 0),
        membersCount: Number(factions.find(f => f.name === 'Bagnat')?.membersCount || 0),
        leaderboardCoinPrice: bagnatPrice
      },
      {
        name: 'Fermier',
        totalCoins: Number(factions.find(f => f.name === 'Fermier')?.totalCoins || 0),
        membersCount: Number(factions.find(f => f.name === 'Fermier')?.membersCount || 0),
        leaderboardCoinPrice: fermierPrice
      }
    ];

    res.json({
      success: true,
      factions: factionsOut,
      bagnatTopUsers: bagnatTop,
      fermierTopUsers: fermierTop,
      currentUserBagnat,
      currentUserFermier
    });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/factions/settings (admin) → lire les prix du leaderboard par faction
router.get('/settings', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    await ensureFactions();
    const docs = await Faction.find({ name: { $in: ['Bagnat','Fermier'] } }).lean();
    const out = {
      Bagnat: { leaderboardCoinPrice: Number(docs.find(d => d.name === 'Bagnat')?.leaderboardCoinPrice) || 1 },
      Fermier: { leaderboardCoinPrice: Number(docs.find(d => d.name === 'Fermier')?.leaderboardCoinPrice) || 1 }
    };
    res.json({ success: true, factions: out });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Erreur chargement réglages factions' });
  }
});

// POST /api/factions/settings (admin) → mettre à jour le prix du leaderboard pour une faction
router.post('/settings', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const name = String(req.body?.name || '').trim();
    const price = Number(req.body?.leaderboardCoinPrice);
    if (!['Bagnat','Fermier'].includes(name)) {
      return res.status(400).json({ success: false, message: 'Faction invalide' });
    }
    if (!Number.isFinite(price) || price < 0) {
      return res.status(400).json({ success: false, message: 'Prix invalide (>= 0 requis)' });
    }
    await ensureFactions();
    const up = await Faction.findOneAndUpdate(
      { name },
      { $set: { leaderboardCoinPrice: price } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();
    res.json({ success: true, faction: { name: up.name, leaderboardCoinPrice: up.leaderboardCoinPrice } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Erreur mise à jour réglages faction' });
  }
});

// Nouvelle route admin: définir manuellement le total de coins d'une faction
router.post('/total-coins', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const name = String(req.body?.name || '').trim();
    const total = Number(req.body?.totalCoins);
    if (!['Bagnat','Fermier'].includes(name)) {
      return res.status(400).json({ success: false, message: 'Faction invalide' });
    }
    if (!Number.isFinite(total) || total < 0) {
      return res.status(400).json({ success: false, message: 'Total invalide (>= 0 requis)' });
    }
    await ensureFactions();
    const up = await Faction.findOneAndUpdate(
      { name },
      { $set: { totalCoins: Math.max(0, total) } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();
    res.json({ success: true, faction: { name: up.name, totalCoins: up.totalCoins, membersCount: up.membersCount } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Erreur mise à jour total faction' });
  }
});

// Supprime la route dupliquée /leaderboard qui était après l’export
module.exports = router;
