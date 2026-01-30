// @ts-nocheck
const express = require('express');
const router = express.Router();
const RedeemCode = require('../models/RedeemCode');
const User = require('../models/User');
const BorderColor = require('../models/BorderColor');
const { verifyToken, requireRole } = require('../middlewares/auth');

// Helpers
function generateCode(len = 8) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sans O/0/I/1 pour éviter confusion
  let out = '';
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

function normalizeCode(input) {
  return String(input || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

// Admin: créer un code
router.post('/generate', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const body = req.body || {};
    const rewardType = String(body.rewardType || '').trim(); // 'item' | 'border-color'
    const length = Number(body.length) === 10 ? 10 : 8;
    const maxUses = Number.isFinite(Number(body.maxUses)) ? Math.max(1, Number(body.maxUses)) : 1;
    const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;

    if (!['item', 'border-color'].includes(rewardType)) {
      return res.status(400).json({ success: false, message: 'rewardType invalide' });
    }

    const payload = { itemId: null, itemName: null, items: [], colorId: null, colors: [] };

    if (rewardType === 'item') {
      const items = Array.isArray(body.items) ? body.items : null;
      if (items && items.length) {
        // normaliser: accepte number ou { itemId/id, itemName/name }
        const normalized = [];
        const seen = new Set();
        for (const it of items) {
          let id = null, name = null;
          if (typeof it === 'number') {
            id = Number(it);
          } else if (it && typeof it === 'object') {
            id = Number(it.itemId ?? it.id);
            name = (it.itemName ?? it.name) ? String(it.itemName ?? it.name) : null;
          }
          if (Number.isFinite(id) && !seen.has(id)) {
            seen.add(id);
            normalized.push({ itemId: id, itemName: name || `Item ${id}` });
          }
        }
        if (!normalized.length) {
          return res.status(400).json({ success: false, message: 'items[] invalide' });
        }
        payload.items = normalized;
      } else {
        const itemId = Number(body.itemId);
        const itemName = String(body.itemName || '').trim();
        if (!Number.isFinite(itemId) || !itemName) {
          return res.status(400).json({ success: false, message: 'itemId et itemName requis' });
        }
        payload.itemId = itemId;
        payload.itemName = itemName;
      }
    } else if (rewardType === 'border-color') {
      const colors = Array.isArray(body.colors) ? body.colors : null;
      if (colors && colors.length) {
        const normalized = [];
        const seen = new Set();
        for (let cid of colors) {
          if (typeof cid !== 'string') cid = String(cid ?? '');
          cid = cid.trim();
          if (cid && !seen.has(cid)) { seen.add(cid); normalized.push(cid); }
        }
        if (!normalized.length) {
          return res.status(400).json({ success: false, message: 'colors[] invalide' });
        }
        payload.colors = normalized;
      } else {
        const colorId = String(body.colorId || '').trim();
        if (!colorId) return res.status(400).json({ success: false, message: 'colorId requis' });
        payload.colorId = colorId;
      }
    }

    // Générer un code unique
    let code;
    for (let i = 0; i < 10; i++) {
      const candidate = generateCode(length);
      const exists = await RedeemCode.findOne({ code: candidate }).lean();
      if (!exists) { code = candidate; break; }
    }
    if (!code) return res.status(500).json({ success: false, message: 'Impossible de générer un code unique' });

    const doc = await RedeemCode.create({
      code,
      rewardType,
      payload,
      maxUses,
      usedCount: 0,
      expiresAt,
      redeemedBy: [],
      // @ts-ignore
      createdBy: req.user && (req.user._id || req.user.id) ? req.user._id || req.user.id : null
    });

    res.json({ success: true, code: doc.code, redeemCode: doc });
  } catch (e) {
    console.error('Erreur génération code:', e);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Admin: lister les codes
router.get('/', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const list = await RedeemCode.find({}).sort({ createdAt: -1 }).lean();
    res.json({ success: true, codes: list });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Admin: supprimer un code
router.delete('/:id', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const del = await RedeemCode.findByIdAndDelete(id);
    if (!del) return res.status(404).json({ success: false, message: 'Code non trouvé' });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// User: consommer un code
router.post('/redeem', verifyToken, async (req, res) => {
  try {
    // @ts-ignore
    const userId = req.user && (req.user._id || req.user.id) ? (req.user._id || req.user.id) : null;
    if (!userId) return res.status(401).json({ success: false, message: 'Non authentifié' });

    const code = normalizeCode(req.body && req.body.code);
    if (!code) return res.status(400).json({ success: false, message: 'Code invalide' });

    const rc = await RedeemCode.findOne({ code });
    if (!rc) return res.status(404).json({ success: false, message: 'Code introuvable' });
    if (rc.expiresAt && rc.expiresAt.getTime() < Date.now()) {
      return res.status(400).json({ success: false, message: 'Code expiré' });
    }
    if (rc.usedCount >= rc.maxUses) {
      return res.status(400).json({ success: false, message: 'Code déjà utilisé au maximum' });
    }
    // Empêcher un même user de réutiliser le code
    if ((rc.redeemedBy || []).some(r => String(r.userId) === String(userId))) {
      return res.status(400).json({ success: false, message: 'Vous avez déjà utilisé ce code' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });

    if (rc.rewardType === 'item') {
      const items = Array.isArray(rc.payload.items) ? rc.payload.items : null;
      if (items && items.length) {
        const list = Array.isArray(user.purchasedItems) ? user.purchasedItems : [];
        for (const entry of items) {
          const itemId = Number(entry.itemId);
          const itemName = String(entry.itemName || `Item ${itemId}`);
          if (!list.some(it => Number(it.itemId) === itemId)) {
            list.push({ itemId, itemName, purchaseDate: new Date(), equipped: false, adminMessage: null, adminGiftRead: true });
          }
        }
        user.purchasedItems = list;
      } else {
        const itemId = Number(rc.payload.itemId);
        const itemName = String(rc.payload.itemName || `Item ${itemId}`);
        // déjà possédé ?
        const already = (user.purchasedItems || []).some(it => Number(it.itemId) === itemId);
        if (!already) {
          const list = Array.isArray(user.purchasedItems) ? user.purchasedItems : [];
          list.push({
            itemId,
            itemName,
            purchaseDate: new Date(),
            equipped: false,
            adminMessage: null,
            adminGiftRead: true
          });
          user.purchasedItems = list;
        }
      }
    } else if (rc.rewardType === 'border-color') {
      const colors = Array.isArray(rc.payload.colors) ? rc.payload.colors : null;
      if (colors && colors.length) {
        const list = Array.isArray(user.purchasedItems) ? user.purchasedItems : [];
        // Ne pas définir automatiquement selectedBorderColor lors de l'obtention via code

        for (const cidRaw of colors) {
          const colorId = String(cidRaw || '').trim();
          if (!colorId) continue;

          let colorDoc = null;
          try { colorDoc = await BorderColor.findOne({ id: colorId }).lean(); } catch {}
          const itemName = (colorDoc && colorDoc.name) ? colorDoc.name : `Couleur ${colorId}`;

          let numericId = (colorDoc && typeof colorDoc.legacyId === 'number') ? Number(colorDoc.legacyId) : null;
          if (!Number.isFinite(numericId)) {
            let h = 0; for (let i = 0; i < colorId.length; i++) { h = (h * 31 + colorId.charCodeAt(i)) >>> 0 }
            numericId = -(100000 + (h % 100000));
          }
          const hasAlready = list.some(pi => String(pi.colorId || '') === colorId);
          if (!hasAlready) {
            list.push({
              itemId: Number(numericId),
              itemName,
              purchaseDate: new Date(),
              equipped: false,
              adminMessage: null,
              adminGiftRead: true,
              colorId
            });
          }
        }
        user.purchasedItems = list;
      } else {
        const colorId = String(rc.payload.colorId || '').trim();
        if (!colorId) return res.status(400).json({ success: false, message: 'colorId manquant dans le code' });

        // Ne pas sélectionner automatiquement cette couleur; seulement l'ajouter aux purchasedItems

        let colorDoc = null;
        try { colorDoc = await BorderColor.findOne({ id: colorId }).lean(); } catch {}

        const itemName = (colorDoc && colorDoc.name) ? colorDoc.name : `Couleur ${colorId}`;
        let numericId = (colorDoc && typeof colorDoc.legacyId === 'number') ? Number(colorDoc.legacyId) : null;
        if (!Number.isFinite(numericId)) {
          let h = 0; for (let i = 0; i < colorId.length; i++) { h = (h * 31 + colorId.charCodeAt(i)) >>> 0 }
          numericId = -(100000 + (h % 100000));
        }
        const hasAlready = (Array.isArray(user.purchasedItems) ? user.purchasedItems : []).some(pi => String(pi.colorId || '') === colorId);
        if (!hasAlready) {
          const list = Array.isArray(user.purchasedItems) ? user.purchasedItems : [];
          list.push({
            itemId: Number(numericId),
            itemName,
            purchaseDate: new Date(),
            equipped: false,
            adminMessage: null,
            adminGiftRead: true,
            colorId
          });
          user.purchasedItems = list;
        }
      }
    } else {
      return res.status(400).json({ success: false, message: 'Type de récompense non supporté' });
    }

    await user.save();

    // Marquer l’utilisation
    rc.usedCount += 1;
    rc.redeemedBy.push({ userId, at: new Date() });
    await rc.save();

    res.json({ success: true, message: 'Code validé', rewardType: rc.rewardType, payload: rc.payload });
  } catch (e) {
    console.error('Erreur redeem code:', e);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

module.exports = router;