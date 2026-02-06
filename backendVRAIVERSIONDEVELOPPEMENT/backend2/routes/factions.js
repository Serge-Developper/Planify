const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Faction = require('../models/Faction');
const popupsRouter = require('./ephemeral-popups');
const { verifyToken } = require('../middlewares/auth');
const { verifyToken: _v, requireRole } = require('../middlewares/auth');

// Helper: garantit l'existence des deux factions
async function ensureFactions() {
  for (const name of ['Bagnat','Fermier']) {
    await Faction.updateOne(
      { name },
      { $setOnInsert: { name, leaderboardCoinPrice: 1, winnerMessage: DEFAULT_WINNER_MESSAGE, loserMessage: DEFAULT_LOSER_MESSAGE } },
      { upsert: true }
    );
  }
}

const DEFAULT_WINNER_MESSAGE = 'Votre faction a gagné 🎉'
const DEFAULT_LOSER_MESSAGE = 'Votre faction fera mieux la prochaine fois 💪'

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

router.get('/messages', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    await ensureFactions();
    const docs = await Faction.find({ name: { $in: ['Bagnat','Fermier'] } }).lean();
    const ref = docs.find(d => d.name === 'Bagnat') || docs[0] || {};
    const winnerMessage = String(ref.winnerMessage || DEFAULT_WINNER_MESSAGE);
    const loserMessage = String(ref.loserMessage || DEFAULT_LOSER_MESSAGE);
    res.json({ success: true, winnerMessage, loserMessage });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Erreur chargement messages factions' });
  }
});

router.post('/messages', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const winnerMessage = String(req.body?.winnerMessage || '').trim() || DEFAULT_WINNER_MESSAGE;
    const loserMessage = String(req.body?.loserMessage || '').trim() || DEFAULT_LOSER_MESSAGE;
    await ensureFactions();
    await Faction.updateMany(
      { name: { $in: ['Bagnat','Fermier'] } },
      { $set: { winnerMessage, loserMessage } }
    );
    res.json({ success: true, winnerMessage, loserMessage });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Erreur sauvegarde messages factions' });
  }
});

router.post('/monthly-rewards', verifyToken, async (req, res) => {
  try {
    await ensureFactions();
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    const monthKey = `${y}-${String(m).padStart(2,'0')}`;
    if (now.getDate() !== 1) {
      return res.json({ success: false, message: 'Récompenses uniquement le 1er jour du mois' });
    }

    const factions = await Faction.find({ name: { $in: ['Bagnat','Fermier'] } }).lean();
    const already = factions.some(f => String(f.lastMonthlyRewardsMonth || '') === monthKey);
    if (already) {
      return res.json({ success: true, message: 'Récompenses déjà attribuées', month: monthKey });
    }

    const fB = factions.find(f => f.name === 'Bagnat') || {};
    const fF = factions.find(f => f.name === 'Fermier') || {};
    const totalB = Number(fB.totalCoins || 0);
    const totalF = Number(fF.totalCoins || 0);

    const baseFilter = {
      role: { $ne: 'admin' },
      $or: [
        { role: { $ne: 'prof' } },
        { role: 'prof', leaderboardEnabled: true }
      ]
    };

    if (totalB === totalF) {
      const tieHtml = `<div style="font-size:1.1rem;line-height:1.6;">⚖️ Égalité ! Les deux factions sont ex aequo.</div>`;
      const [bUsers, fUsers] = await Promise.all([
        User.find({ ...baseFilter, faction: 'Bagnat' }).select('_id').lean(),
        User.find({ ...baseFilter, faction: 'Fermier' }).select('_id').lean()
      ]);
      const bIds = bUsers.map(u => u._id);
      const fIds = fUsers.map(u => u._id);
      if (popupsRouter && typeof popupsRouter.sendPopupToUsers === 'function') {
        popupsRouter.sendPopupToUsers(bIds, tieHtml);
        popupsRouter.sendPopupToUsers(fIds, tieHtml);
      }
      await Faction.updateMany({ name: { $in: ['Bagnat','Fermier'] } }, { $set: { lastMonthlyRewardsMonth: monthKey } });
      return res.json({ success: true, tie: true, month: monthKey });
    }

    const winning = totalB > totalF ? 'Bagnat' : 'Fermier';
    const losing = winning === 'Bagnat' ? 'Fermier' : 'Bagnat';
    const winnerMessage = String((winning === 'Bagnat' ? fB : fF).winnerMessage || DEFAULT_WINNER_MESSAGE);
    const loserMessage = String((losing === 'Bagnat' ? fB : fF).loserMessage || DEFAULT_LOSER_MESSAGE);
    const WINNER_REWARD = 200;
    const LOSER_REWARD = 80;

    const [winUsers, loseUsers] = await Promise.all([
      User.find({ ...baseFilter, faction: winning }).select('_id').lean(),
      User.find({ ...baseFilter, faction: losing }).select('_id').lean()
    ]);
    const winIds = winUsers.map(u => u._id);
    const loseIds = loseUsers.map(u => u._id);

    if (winIds.length) {
      await User.updateMany(
        { _id: { $in: winIds } },
        { $inc: { coins: WINNER_REWARD }, $addToSet: { achievementsCompleted: 'faction-join' } }
      );
    }
    if (loseIds.length) {
      await User.updateMany({ _id: { $in: loseIds } }, { $inc: { coins: LOSER_REWARD } });
    }

    const winHtml = `<div style="font-size:1.1rem;line-height:1.6;">${winnerMessage}<br/>Vous recevez +${WINNER_REWARD} Planify Coins dans votre wallet.</div>`;
    const loseHtml = `<div style="font-size:1.1rem;line-height:1.6;">${loserMessage}<br/>Vous recevez +${LOSER_REWARD} Planify Coins dans votre wallet.</div>`;
    if (popupsRouter && typeof popupsRouter.sendPopupToUsers === 'function') {
      popupsRouter.sendPopupToUsers(winIds, winHtml);
      popupsRouter.sendPopupToUsers(loseIds, loseHtml);
    }

    await Faction.updateMany({ name: { $in: ['Bagnat','Fermier'] } }, { $set: { lastMonthlyRewardsMonth: monthKey } });
    return res.json({ success: true, winner: winning, month: monthKey, winners: winIds.length, losers: loseIds.length });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Erreur récompenses mensuelles' });
  }
});

// POST /api/factions/monthly-balance — déclencheur léger côté serveur
// Idempotent côté client grâce à localStorage; côté serveur on s'assure juste que les factions existent
router.post('/monthly-balance', verifyToken, async (req, res) => {
  try {
    await ensureFactions();
    res.json({ success: true, message: 'Balance mensuelle déclenchée' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Erreur balance mensuelle' });
  }
});

module.exports = router;
