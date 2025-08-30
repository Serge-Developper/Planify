// @ts-nocheck
const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { verifyToken, requireRole } = require('../middlewares/auth');
const Item = require('../models/Item');
const User = require('../models/User');

const router = express.Router();

// Configuration upload pour assets d'items
const uploadDir = path.join(__dirname, '..', 'uploads', 'items');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${unique}${ext}`);
  }
});
const upload = multer({ storage });

// IDs réservés par le site (items statiques + couleurs/gradients de bordure)
function isReservedLegacyId(id) {
  const staticIds = new Set([
    0, // Bordure classique
    1,2,3,4,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,
    23, // Discord
    24, // Jojo
    25, // Galaxie
    26, // Coeur
    27, // Prestige
    28  // Planify
  ])
  if (staticIds.has(id)) return true
  // Bordures couleur 100..143 (dont variantes), puis 200..231 (dégradés)
  if ((id >= 100 && id <= 143) || (id >= 200 && id <= 231)) return true
  return false
}

// Liste des items (public)
router.get('/', async (req, res) => {
  try {
    const items = await Item.find({ active: true }).sort({ createdAt: -1 }).lean();
    // S'assurer que les variantes sont bien incluses avec tous les champs
    const itemsWithVariants = items.map(item => ({
      ...item,
      variants: Array.isArray(item.variants) ? item.variants.map(v => ({
        ...v,
        showText: !!v.showText,
        textOnly: !!v.textOnly,
        textContent: v.textContent || ''
      })) : []
    }));
    res.json({ success: true, items: itemsWithVariants });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Erreur chargement items' });
  }
});

// Récupération d'un item par legacyId (public)
router.get('/legacy/:legacyId', async (req, res) => {
  try {
    const legacyId = parseInt(req.params.legacyId);
    if (isNaN(legacyId)) {
      return res.status(400).json({ success: false, message: 'legacyId invalide' });
    }
    const item = await Item.findOne({ legacyId, active: true }).lean();
    if (!item) return res.status(404).json({ success: false, message: 'Item introuvable' });
    
    // S'assurer que les variantes sont bien incluses avec tous les champs
    const itemWithVariants = {
      ...item,
      variants: Array.isArray(item.variants) ? item.variants.map(v => ({
        ...v,
        showText: !!v.showText,
        textOnly: !!v.textOnly,
        textContent: v.textContent || ''
      })) : []
    };
    
    res.json({ success: true, item: itemWithVariants });
  } catch (e) {
    res.status(400).json({ success: false, message: 'Erreur chargement item', error: String(e) });
  }
});

// Récupération d'un item par ID (admin)
router.get('/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).lean();
    if (!item) return res.status(404).json({ success: false, message: 'Item introuvable' });
    
    // S'assurer que les variantes sont bien incluses avec tous les champs
    const itemWithVariants = {
      ...item,
      variants: Array.isArray(item.variants) ? item.variants.map(v => ({
        ...v,
        showText: !!v.showText,
        textOnly: !!v.textOnly,
        textContent: v.textContent || ''
      })) : []
    };
    
    res.json({ success: true, item: itemWithVariants });
  } catch (e) {
    res.status(400).json({ success: false, message: 'Erreur chargement item', error: String(e) });
  }
});

// Création d'un item (admin)
router.post('/', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    let { legacyId, name, price, type, assets, backgrounds, availableInDailyShop, active, infoOnly, infoDescription, variants } = req.body;

    // Générer un legacyId si manquant/invalid
    if (typeof legacyId !== 'number' || Number.isNaN(legacyId)) {
      const last = await Item.findOne({}, { legacyId: 1 }).sort({ legacyId: -1 }).lean();
      const base = last && typeof last.legacyId === 'number' ? last.legacyId + 1 : 1000;
      legacyId = base;
    }

    // Si l'admin a explicitement défini l'ID, vérifier collisions
    if (typeof req.body.legacyId === 'number' && !Number.isNaN(req.body.legacyId)) {
      const chosen = Number(req.body.legacyId)
      if (isReservedLegacyId(chosen)) {
        return res.status(409).json({ success: false, message: 'legacyId réservé par le site' })
      }
      const exists = await Item.findOne({ legacyId: chosen }).lean()
      if (exists) {
        return res.status(409).json({ success: false, message: 'legacyId déjà utilisé' })
      }
      legacyId = chosen
    }
    // Normalisations
    const normalizedPrice = (typeof price === 'number') ? price : (parseFloat(price) || 0);
    const normalizedName = (typeof name === 'string') ? name.trim() : '';
    const finalName = normalizedName || `Item ${legacyId}`;
    const normalizedAssets = Array.isArray(assets) ? assets.filter(a => a && typeof a.src === 'string') : [];
    const sanitizedAssets = normalizedAssets.map(a => ({
      src: a.src,
      style: a.style || {},
      collectionStyle: a.collectionStyle || null,
      collectionStyleMobile: a.collectionStyleMobile || null,
      leaderboardStyle: a.leaderboardStyle || null,
      leaderboardStyleMobile: a.leaderboardStyleMobile || null,
      avatarStyle: a.avatarStyle || null,
      avatarStyleMobile: a.avatarStyleMobile || null,
      navbarStyle: a.navbarStyle || null,
      navbarStyleMobile: a.navbarStyleMobile || null,
      popupStyleStyle: a.popupStyleStyle || null,
      meta: a.meta || {}
    }));

    // Variantes optionnelles
    const sanitizedVariants = Array.isArray(variants) ? variants.map(v => ({
      name: (v && typeof v.name === 'string') ? v.name : '',
      assets: Array.isArray(v?.assets) ? v.assets.map(a => ({
        src: a && a.src,
        style: a && a.style || {},
        collectionStyle: a && a.collectionStyle || null,
        collectionStyleMobile: a && a.collectionStyleMobile || null,
        leaderboardStyle: a && a.leaderboardStyle || null,
        leaderboardStyleMobile: a && a.leaderboardStyleMobile || null,
        avatarStyle: a && a.avatarStyle || null,
        avatarStyleMobile: a && a.avatarStyleMobile || null,
        navbarStyle: a && a.navbarStyle || null,
        navbarStyleMobile: a && a.navbarStyleMobile || null,
        popupStyleStyle: a && a.popupStyleStyle || null,
        meta: a && typeof a.meta === 'object' ? a.meta : {}
      })) : [],
      backgrounds: {
        collection: (v && v.backgrounds && typeof v.backgrounds.collection === 'string') ? v.backgrounds.collection : null,
        leaderboard: (v && v.backgrounds && typeof v.backgrounds.leaderboard === 'string') ? v.backgrounds.leaderboard : null,
        avatar: (v && v.backgrounds && typeof v.backgrounds.avatar === 'string') ? v.backgrounds.avatar : null,
        navbar: (v && v.backgrounds && typeof v.backgrounds.navbar === 'string') ? v.backgrounds.navbar : null,
        'popup-style': (v && v.backgrounds && typeof v.backgrounds['popup-style'] === 'string') ? v.backgrounds['popup-style'] : null
      },
      showText: !!(v && v.showText),
      textOnly: !!(v && v.textOnly),
      textContent: (v && typeof v.textContent === 'string') ? v.textContent.trim() : ''
    })) : []

    async function createItemWithRetry(startId, maxRetries = 5) {
      let currentId = startId;
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          // Sauter les IDs réservés et déjà utilisés
          while (isReservedLegacyId(currentId) || await Item.exists({ legacyId: currentId })) {
            currentId += 1;
          }
          return await Item.create({
            legacyId: currentId,
            name: finalName,
            price: normalizedPrice,
            type: (typeof type === 'string' && type) ? type : 'generic',
            infoOnly: !!infoOnly,
            infoDescription: (typeof infoDescription === 'string' ? infoDescription.trim() : null),
            assets: sanitizedAssets,
            backgrounds: (backgrounds && typeof backgrounds === 'object') ? backgrounds : {},
            variants: sanitizedVariants,
            availableInDailyShop: !!availableInDailyShop,
            active: active !== false,
            createdBy: req.user?.username || null
          });
        } catch (err) {
          if (err && err.code === 11000) {
            currentId += 1; // essayer un autre id
            continue;
          }
          throw err;
        }
      }
      throw new Error('Impossible de générer un legacyId unique');
    }

    const item = await createItemWithRetry(legacyId);
    res.json({ success: true, item });
  } catch (e) {
    let msg = 'Erreur création item';
    if (e && e.code === 11000) { // duplicate key (legacyId unique)
      msg = 'legacyId déjà utilisé';
    }
    res.status(400).json({ success: false, message: msg, error: String(e && e.message ? e.message : e) });
  }
});

// Upload d'assets (admin)
router.post('/upload', verifyToken, requireRole(['admin']), upload.array('files', 10), async (req, res) => {
  try {
    const files = (req.files || []).map(f => ({ filename: f.filename, url: `/uploads/items/${f.filename}` }));
    res.json({ success: true, files });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Erreur upload', error: String(e) });
  }
});

// Mise à jour item (admin)
router.put('/:id', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const update = req.body || {};
    // Si on tente de changer legacyId, vérifier réservations/duplications
    if (update && typeof update.legacyId === 'number' && !Number.isNaN(update.legacyId)) {
      const targetId = Number(update.legacyId)
      if (isReservedLegacyId(targetId)) {
        return res.status(409).json({ success: false, message: 'legacyId réservé par le site' })
      }
      const other = await Item.findOne({ legacyId: targetId, _id: { $ne: req.params.id } }).lean()
      if (other) {
        return res.status(409).json({ success: false, message: 'legacyId déjà utilisé' })
      }
    }

    // Charger le document pour une mise à jour sûre
    const doc = await Item.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Item introuvable' });

    const oldLegacyId = Number(doc.legacyId);
    const oldName = doc.name;

    // Assainir assets si fournis
    if (Array.isArray(update.assets)) {
      doc.assets = update.assets.map(a => ({
        src: a && a.src,
        style: (a && a.style) || {},
        collectionStyle: (a && a.collectionStyle) || null,
        collectionStyleMobile: (a && a.collectionStyleMobile) || null,
        leaderboardStyle: (a && a.leaderboardStyle) || null,
        leaderboardStyleMobile: (a && a.leaderboardStyleMobile) || null,
        avatarStyle: (a && a.avatarStyle) || null,
        avatarStyleMobile: (a && a.avatarStyleMobile) || null,
        navbarStyle: (a && a.navbarStyle) || null,
        navbarStyleMobile: (a && a.navbarStyleMobile) || null,
        popupStyleStyle: (a && a.popupStyleStyle) || null,
        meta: (a && typeof a.meta === 'object') ? a.meta : {}
      }))
      doc.markModified('assets');
    }

    // Assainir variants si fournis
    if (Array.isArray(update.variants)) {
      doc.variants = update.variants.map(v => ({
        name: (v && typeof v.name === 'string') ? v.name : '',
        assets: Array.isArray(v?.assets) ? v.assets.map(a => ({
          src: a && a.src,
          style: (a && a.style) || {},
          collectionStyle: (a && a.collectionStyle) || null,
          collectionStyleMobile: (a && a.collectionStyleMobile) || null,
          leaderboardStyle: (a && a.leaderboardStyle) || null,
          leaderboardStyleMobile: (a && a.leaderboardStyleMobile) || null,
          avatarStyle: (a && a.avatarStyle) || null,
          avatarStyleMobile: (a && a.avatarStyleMobile) || null,
          navbarStyle: (a && a.navbarStyle) || null,
          navbarStyleMobile: (a && a.navbarStyleMobile) || null,
          popupStyleStyle: (a && a.popupStyleStyle) || null,
          meta: (a && typeof a.meta === 'object') ? a.meta : {}
        })) : [],
        backgrounds: (v && v.backgrounds && typeof v.backgrounds === 'object') ? v.backgrounds : {},
        showText: !!(v && v.showText),
        textOnly: !!(v && v.textOnly),
        textContent: (v && typeof v.textContent === 'string') ? v.textContent.trim() : ''
      }))
      doc.markModified('variants');
    }

    // Mises à jour simples
    if (typeof update.name === 'string') doc.name = update.name;
    if (typeof update.price === 'number') doc.price = update.price;
    if (typeof update.type === 'string') doc.type = update.type;
    if (typeof update.infoOnly === 'boolean') doc.infoOnly = update.infoOnly;
    if (typeof update.infoDescription === 'string' || update.infoDescription === null) doc.infoDescription = update.infoDescription;
    if (update.backgrounds && typeof update.backgrounds === 'object') { doc.backgrounds = update.backgrounds; doc.markModified('backgrounds'); }
    if (typeof update.availableInDailyShop === 'boolean') doc.availableInDailyShop = update.availableInDailyShop;
    if (typeof update.active === 'boolean') doc.active = update.active;
    if (typeof update.legacyId === 'number' && !Number.isNaN(update.legacyId)) doc.legacyId = Number(update.legacyId);

    const item = await doc.save();

    // Si le legacyId a changé, propager aux utilisateurs (purchasedItems + equippedItemId)
    const newLegacyId = Number(item.legacyId);
    const newName = item.name;
    if (Number.isFinite(oldLegacyId) && Number.isFinite(newLegacyId) && oldLegacyId !== newLegacyId) {
      try {
        // Mettre à jour les itemId dans purchasedItems
        await User.updateMany(
          { 'purchasedItems.itemId': oldLegacyId },
          { $set: { 'purchasedItems.$[elem].itemId': newLegacyId, 'purchasedItems.$[elem].itemName': newName || oldName } },
          { arrayFilters: [{ 'elem.itemId': oldLegacyId }] }
        );
      } catch (e) {
        console.warn('Impossible de mettre à jour purchasedItems pour nouveau legacyId:', e?.message || e);
      }
      try {
        // Mettre à jour equippedItemId et flags equipped
        await User.updateMany({ equippedItemId: oldLegacyId }, { $set: { equippedItemId: newLegacyId } });
        await User.updateMany(
          { 'purchasedItems.itemId': newLegacyId },
          { $set: { 'purchasedItems.$[elem].equipped': true } },
          { arrayFilters: [{ 'elem.itemId': newLegacyId }] }
        );
        await User.updateMany(
          { 'purchasedItems.itemId': oldLegacyId },
          { $set: { 'purchasedItems.$[elem].equipped': false } },
          { arrayFilters: [{ 'elem.itemId': oldLegacyId }] }
        );
      } catch (e) {
        console.warn('Impossible de mettre à jour equippedItemId pour nouveau legacyId:', e?.message || e);
      }
    }

    // Récupérer l'item fraîchement depuis la base de données pour s'assurer de la cohérence
    const freshItem = await Item.findById(item._id).lean();
    res.json({ success: true, item: freshItem });
  } catch (e) {
    res.status(400).json({ success: false, message: 'Erreur mise à jour', error: String(e) });
  }
});

// Suppression item (admin)
router.delete('/:id', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const item = await Item.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Item introuvable' });
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ success: false, message: 'Erreur suppression', error: String(e) });
  }
});

module.exports = router;


