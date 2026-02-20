// @ts-nocheck
const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { verifyToken, requireRole } = require('../middlewares/auth');
const Item = require('../models/Item');
const User = require('../models/User');

const router = express.Router();

let webpush;
try { webpush = require('web-push'); } catch {}
const VAPID_PUBLIC_KEY = process.env.PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.PRIVATE_KEY || process.env.VAPID_PRIVATE_KEY || '';
try { if (webpush && VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) { webpush.setVapidDetails('mailto:admin@planifymmi.fr', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY); } } catch {}

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

function collectItemAssetSrcs(item) {
  const out = [];
  const assets = Array.isArray(item?.assets) ? item.assets : [];
  for (const a of assets) {
    const src = a && typeof a.src === 'string' ? a.src.trim() : '';
    if (src) out.push(src);
  }
  const variants = Array.isArray(item?.variants) ? item.variants : [];
  for (const v of variants) {
    const vAssets = Array.isArray(v?.assets) ? v.assets : [];
    for (const a of vAssets) {
      const src = a && typeof a.src === 'string' ? a.src.trim() : '';
      if (src) out.push(src);
    }
  }
  return out;
}

function isWebpGifSrc(src) {
  return /\.(webp|gif)(\?|#|$)/i.test(String(src || ''));
}

function buildNotifySources(item) {
  const all = collectItemAssetSrcs(item);
  const preferred = all.filter(isWebpGifSrc);
  const used = preferred.length ? preferred : all;
  const uniq = Array.from(new Set(used.map(s => String(s || '').trim()).filter(Boolean)));
  uniq.sort();
  return uniq;
}

function normalizeNavbarPlacements(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map(v => (v === 'above' || v === 'inside' || v === 'below') ? v : 'below');
}

function buildNotifySig(sources) {
  if (!Array.isArray(sources) || !sources.length) return '';
  return sources.join('|');
}

async function markPoolNotifyState(item, sig, sent) {
  if (!item) return;
  const meta = (item.meta && typeof item.meta === 'object') ? item.meta : {};
  item.meta = { ...meta, poolNotifySig: sig || null, poolNotifiedAt: new Date(), poolNotifySent: !!sent };
  item.markModified('meta');
  try { await item.save(); } catch {}
}

async function hasDuplicateAssetSources(sources, itemId) {
  if (!Array.isArray(sources) || !sources.length) return false;
  const query = {
    _id: { $ne: itemId },
    active: true,
    availableInDailyShop: true,
    $or: [
      { 'assets.src': { $in: sources } },
      { 'variants.assets.src': { $in: sources } }
    ]
  };
  const other = await Item.findOne(query).select('_id').lean();
  return !!other;
}

async function sendNewItemPush(item) {
  try {
    if (!webpush || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return 0;
    if (!item) return 0;
    const users = await User.find({
      'pushPreferences.enabled': true,
      'pushPreferences.shop': true,
      pushSubscriptions: { $elemMatch: { endpoint: { $exists: true, $ne: '' } } }
    }).select({ pushSubscriptions: 1 });
    if (!users || !users.length) return 0;
    const title = '🆕 Nouvel item en boutique';
    const name = String(item.name || '').trim();
    const body = 'Un nouvel item est arrivé !';
    const payload = JSON.stringify({
      title,
      body,
      icon: '/planifyFichier_134x.webp?v=2',
      badge: '/planifyFichier_134x.webp?v=2',
      data: { url: '/boutique' }
    });
    let sent = 0;
    for (const user of users) {
      const subs = Array.isArray(user.pushSubscriptions) ? user.pushSubscriptions : [];
      if (!subs.length) continue;
      const invalid = new Set();
      for (const sub of subs) {
        try {
          await webpush.sendNotification(sub, payload);
          sent++;
        } catch (e) {
          const code = e && e.statusCode;
          if (code === 404 || code === 410) invalid.add(String(sub.endpoint || ''));
        }
      }
      if (invalid.size) {
        user.pushSubscriptions = subs.filter(s => !invalid.has(String(s.endpoint || '')));
        await user.save();
      }
    }
    return sent;
  } catch {
    return 0;
  }
}

async function maybeNotifyNewPoolItem(item, prevAvailableInDailyShop, prevActive) {
  try {
    if (!item) return;
    const nowInPool = !!item.availableInDailyShop && item.active !== false;
    const prevInPool = !!prevAvailableInDailyShop && prevActive !== false;
    if (!nowInPool || prevInPool) return;
    const meta = (item.meta && typeof item.meta === 'object') ? item.meta : {};
    if (meta.poolNotifiedAt) return;
    const sources = buildNotifySources(item);
    const sig = buildNotifySig(sources);
    if (!sig) return;
    const dup = await hasDuplicateAssetSources(sources, item._id);
    if (dup) {
      await markPoolNotifyState(item, sig, false);
      return;
    }
    const sent = await sendNewItemPush(item);
    await markPoolNotifyState(item, sig, sent > 0);
  } catch {}
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

router.get('/admin/all', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const items = await Item.find({}).sort({ createdAt: -1 }).lean();
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
    res.status(500).json({ success: false, message: 'Erreur chargement tous les items', error: String(e) });
  }
});

// Récupération d'un item par ID (admin)
router.get('/:id([0-9a-fA-F]{24})', async (req, res) => {
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
    const normalizedAssets = Array.isArray(assets)
      ? assets.filter(a => a && typeof a.src === 'string' && a.src.trim() !== '')
      : [];
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
      profilePopupStyle: a.profilePopupStyle || null,
      profilePopupStyleMobile: a.profilePopupStyleMobile || null,
      profilePopupStylePc: a.profilePopupStylePc || null,
      largeAvatarStyle: a.largeAvatarStyle || null,
      largeAvatarStyleMobile: a.largeAvatarStyleMobile || null,
      cosmeticPreviewStyle: a.cosmeticPreviewStyle || null,
      cosmeticPreviewStyleMobile: a.cosmeticPreviewStyleMobile || null,
      dailyStyle: a.dailyStyle || null,
      dailyStyleMobile: a.dailyStyleMobile || null,
      meta: a.meta || {}
    }));

    // Variantes optionnelles
    const sanitizedVariants = Array.isArray(variants) ? variants.map(v => {
      const vAssets = Array.isArray(v?.assets)
        ? v.assets.filter(a => a && typeof a.src === 'string' && a.src.trim() !== '')
        : [];
      return {
        name: (v && typeof v.name === 'string') ? v.name : '',
        assets: vAssets.map(a => ({
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
          profilePopupStyle: a && a.profilePopupStyle || null,
          profilePopupStyleMobile: a && a.profilePopupStyleMobile || null,
          profilePopupStylePc: a && a.profilePopupStylePc || null,
          largeAvatarStyle: a && a.largeAvatarStyle || null,
          largeAvatarStyleMobile: a && a.largeAvatarStyleMobile || null,
          cosmeticPreviewStyle: a && a.cosmeticPreviewStyle || null,
          cosmeticPreviewStyleMobile: a && a.cosmeticPreviewStyleMobile || null,
          dailyStyle: a && a.dailyStyle || null,
          dailyStyleMobile: a && a.dailyStyleMobile || null,
          meta: a && typeof a.meta === 'object' ? a.meta : {}
        })),
        backgrounds: {
          collection: (v && v.backgrounds && typeof v.backgrounds.collection === 'string') ? v.backgrounds.collection : null,
          leaderboard: (v && v.backgrounds && typeof v.backgrounds.leaderboard === 'string') ? v.backgrounds.leaderboard : null,
          avatar: (v && v.backgrounds && typeof v.backgrounds.avatar === 'string') ? v.backgrounds.avatar : null,
          navbar: (v && v.backgrounds && typeof v.backgrounds.navbar === 'string') ? v.backgrounds.navbar : null,
          'popup-style': (v && v.backgrounds && typeof v.backgrounds['popup-style'] === 'string') ? v.backgrounds['popup-style'] : null,
          'profile-popup': (v && v.backgrounds && typeof v.backgrounds['profile-popup'] === 'string') ? v.backgrounds['profile-popup'] : null
        },
        navbarPlacements: normalizeNavbarPlacements(v && v.navbarPlacements),
        showText: !!(v && v.showText),
        textOnly: !!(v && v.textOnly),
        textContent: (v && typeof v.textContent === 'string') ? v.textContent.trim() : '',
        removeNavbarBorder: !!(v && v.removeNavbarBorder),
        removeLeaderboardBorder: !!(v && v.removeLeaderboardBorder),
        removeProfilePopupBorder: !!(v && v.removeProfilePopupBorder)
      }
    }) : []

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
            createdBy: req.user?.username || null,
            // Ajout meta item-level à la création
            meta: (incomingMeta && typeof incomingMeta === 'object') ? incomingMeta : {}
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

    // Préparer meta item-level (ex: flags de retrait de bordure)
    const incomingMeta = (req.body && typeof req.body.meta === 'object') ? req.body.meta : {}
    const item = await createItemWithRetry(legacyId);
    // Si des metas sont fournis, les persister
    try {
      if (incomingMeta && Object.keys(incomingMeta).length > 0) {
        item.meta = { ...(item.meta || {}), ...incomingMeta }
        await item.save()
      }
    } catch {}
    res.json({ success: true, item });
    try { setImmediate(() => { maybeNotifyNewPoolItem(item, false, false).catch(() => {}); }); } catch {}
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

    const prevAvailableInDailyShop = !!doc.availableInDailyShop;
    const prevActive = doc.active !== false;
    const oldLegacyId = Number(doc.legacyId);
    const oldName = doc.name;

    // Assainir assets si fournis
    if (Array.isArray(update.assets)) {
      const cleaned = update.assets.filter(a => a && typeof a.src === 'string' && a.src.trim() !== '');
      doc.assets = cleaned.map(a => ({
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
        profilePopupStyle: (a && a.profilePopupStyle) || null,
        profilePopupStyleMobile: (a && a.profilePopupStyleMobile) || null,
        profilePopupStylePc: (a && a.profilePopupStylePc) || null,
        dailyStyle: (a && a.dailyStyle) || null,
        dailyStyleMobile: (a && a.dailyStyleMobile) || null,
        largeAvatarStyle: (a && a.largeAvatarStyle) || null,
        largeAvatarStyleMobile: (a && a.largeAvatarStyleMobile) || null,
        cosmeticPreviewStyle: (a && a.cosmeticPreviewStyle) || null,
        cosmeticPreviewStyleMobile: (a && a.cosmeticPreviewStyleMobile) || null,
        meta: (a && typeof a.meta === 'object') ? a.meta : {}
      }))
      doc.markModified('assets');
    }

    // Assainir variants si fournis
    if (Array.isArray(update.variants)) {
      doc.variants = update.variants.map(v => {
        const vAssets = Array.isArray(v?.assets)
          ? v.assets.filter(a => a && typeof a.src === 'string' && a.src.trim() !== '')
          : [];
        return {
          name: (v && typeof v.name === 'string') ? v.name : '',
          assets: vAssets.map(a => ({
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
            profilePopupStyle: (a && a.profilePopupStyle) || null,
            profilePopupStyleMobile: (a && a.profilePopupStyleMobile) || null,
            profilePopupStylePc: (a && a.profilePopupStylePc) || null,
            dailyStyle: (a && a.dailyStyle) || null,
            dailyStyleMobile: (a && a.dailyStyleMobile) || null,
            largeAvatarStyle: (a && a.largeAvatarStyle) || null,
            largeAvatarStyleMobile: (a && a.largeAvatarStyleMobile) || null,
            cosmeticPreviewStyle: (a && a.cosmeticPreviewStyle) || null,
            cosmeticPreviewStyleMobile: (a && a.cosmeticPreviewStyleMobile) || null,
            meta: (a && typeof a.meta === 'object') ? a.meta : {}
          })),
          backgrounds: (v && v.backgrounds && typeof v.backgrounds === 'object') ? v.backgrounds : {},
          navbarPlacements: normalizeNavbarPlacements(v && v.navbarPlacements),
          showText: !!(v && v.showText),
          textOnly: !!(v && v.textOnly),
          textContent: (v && typeof v.textContent === 'string') ? v.textContent.trim() : '',
          // Flags de bordure par variante (s'ils sont fournis)
          removeNavbarBorder: !!(v && v.removeNavbarBorder),
          removeLeaderboardBorder: !!(v && v.removeLeaderboardBorder),
          removeProfilePopupBorder: !!(v && v.removeProfilePopupBorder)
        }
      })
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
    // Mettre à jour meta item-level si fourni
    if (update.meta && typeof update.meta === 'object') {
      doc.meta = { ...(doc.meta || {}), ...update.meta }
      doc.markModified('meta')
    }

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
    try { setImmediate(() => { maybeNotifyNewPoolItem(item, prevAvailableInDailyShop, prevActive).catch(() => {}); }); } catch {}
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

router.put('/suggest/:id', verifyToken, async (req, res) => {
  try {
    const doc = await Item.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Item introuvable' });

    const requesterId = String((req.user && (req.user.id || req.user._id)) || '');
    const requesterName = String((req.user && (req.user.username || req.user.name)) || '');
    const meta = (doc && typeof doc.meta === 'object') ? doc.meta : {};
    const creatorIds = Array.isArray(meta.creatorIds) ? meta.creatorIds.map(v => String(v)) : [];
    const creatorNames = Array.isArray(meta.creatorUsernames) ? meta.creatorUsernames.map(v => String(v)) : [];
    const isAdmin = String((req.user && req.user.role) || '') === 'admin';
    const isOwner = (requesterName && String(doc.createdBy || '') === requesterName)
      || (requesterId && String(doc.createdBy || '') === requesterId)
      || (requesterId && creatorIds.includes(requesterId))
      || (requesterName && creatorNames.includes(requesterName));

    if (!isAdmin && !isOwner) return res.status(403).json({ success: false, message: 'Non autorisé' });

    const update = req.body || {};
    const prevAvailableInDailyShop = !!doc.availableInDailyShop;
    const prevActive = doc.active !== false;

    if (Array.isArray(update.assets)) {
      const normalizedAssets = update.assets.filter(a => a && typeof a.src === 'string' && a.src.trim() !== '');
      doc.assets = normalizedAssets.map(a => ({
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
        profilePopupStyle: a.profilePopupStyle || null,
        profilePopupStyleMobile: a.profilePopupStyleMobile || null,
        profilePopupStylePc: a.profilePopupStylePc || null,
        largeAvatarStyle: a.largeAvatarStyle || null,
        largeAvatarStyleMobile: a.largeAvatarStyleMobile || null,
        cosmeticPreviewStyle: a.cosmeticPreviewStyle || null,
        cosmeticPreviewStyleMobile: a.cosmeticPreviewStyleMobile || null,
        meta: a.meta || {}
      }));
      doc.markModified('assets');
    }

    if (Array.isArray(update.variants)) {
      doc.variants = update.variants.map(v => {
        const vAssets = Array.isArray(v?.assets)
          ? v.assets.filter(a => a && typeof a.src === 'string' && a.src.trim() !== '')
          : [];
        return {
          name: (v && typeof v.name === 'string') ? v.name : '',
          assets: vAssets.map(a => ({
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
            profilePopupStyle: a && a.profilePopupStyle || null,
            profilePopupStyleMobile: a && a.profilePopupStyleMobile || null,
            profilePopupStylePc: a && a.profilePopupStylePc || null,
            largeAvatarStyle: a && a.largeAvatarStyle || null,
            largeAvatarStyleMobile: a && a.largeAvatarStyleMobile || null,
            cosmeticPreviewStyle: a && a.cosmeticPreviewStyle || null,
            cosmeticPreviewStyleMobile: a && a.cosmeticPreviewStyleMobile || null,
            meta: a && typeof a.meta === 'object' ? a.meta : {}
          })),
          backgrounds: {
            collection: v?.backgrounds?.collection || null,
            leaderboard: v?.backgrounds?.leaderboard || null,
            avatar: v?.backgrounds?.avatar || null,
            navbar: v?.backgrounds?.navbar || null,
            'popup-style': v?.backgrounds?.['popup-style'] || null,
            'profile-popup': v?.backgrounds?.['profile-popup'] || null
          },
          navbarPlacements: normalizeNavbarPlacements(v && v.navbarPlacements),
          showText: !!(v && v.showText),
          textOnly: !!(v && v.textOnly),
          textContent: (v && typeof v.textContent === 'string') ? v.textContent.trim() : '',
          removeNavbarBorder: !!(v && v.removeNavbarBorder),
          removeLeaderboardBorder: !!(v && v.removeLeaderboardBorder),
          removeProfilePopupBorder: !!(v && v.removeProfilePopupBorder)
        };
      });
      doc.markModified('variants');
    }

    if (update.backgrounds && typeof update.backgrounds === 'object') { doc.backgrounds = update.backgrounds; doc.markModified('backgrounds'); }
    if (typeof update.name === 'string') { const n = update.name.trim(); doc.name = n || 'Suggestion'; }
    if (typeof update.price === 'number') doc.price = update.price;
    if (typeof update.type === 'string') doc.type = update.type || 'generic';
    if (typeof update.infoOnly === 'boolean') doc.infoOnly = update.infoOnly;
    if (typeof update.infoDescription === 'string' || update.infoDescription === null) doc.infoDescription = update.infoDescription;

    if (isAdmin && typeof update.availableInDailyShop === 'boolean') doc.availableInDailyShop = update.availableInDailyShop;
    if (isAdmin && typeof update.active === 'boolean') doc.active = update.active;

    const incomingMeta = (update && typeof update.meta === 'object') ? update.meta : {};
    doc.meta = { ...(doc.meta || {}), ...(incomingMeta || {}), isSuggested: true };
    if (!doc.createdBy) doc.createdBy = (req.user && (req.user.username || req.user.name)) || null;

    await doc.save();
    const freshItem = await Item.findById(doc._id).lean();
    res.json({ success: true, item: freshItem });
    try { setImmediate(() => { maybeNotifyNewPoolItem(doc, prevAvailableInDailyShop, prevActive).catch(() => {}); }); } catch {}
  } catch (e) {
    res.status(400).json({ success: false, message: 'Erreur mise à jour suggestion', error: String(e && e.message ? e.message : e) });
  }
});

router.get('/suggest/resolve', verifyToken, async (req, res) => {
  try {
    const legacyId = (typeof req.query.legacyId !== 'undefined') ? Number(req.query.legacyId) : NaN;
    const localItemId = String(req.query.localItemId || '').trim();

    if (!Number.isFinite(legacyId) && !localItemId) {
      return res.status(400).json({ success: false, message: 'Paramètres manquants' });
    }

    const or = [];
    if (Number.isFinite(legacyId)) or.push({ legacyId });
    if (localItemId) or.push({ 'meta.localItemId': localItemId });

    const item = await Item.findOne({ $or: or }).lean();
    if (!item) return res.status(404).json({ success: false, message: 'Item introuvable' });

    const requesterId = String((req.user && (req.user.id || req.user._id)) || '');
    const requesterName = String((req.user && (req.user.username || req.user.name)) || '');
    const meta = (item && typeof item.meta === 'object') ? item.meta : {};
    const creatorIds = Array.isArray(meta.creatorIds) ? meta.creatorIds.map(v => String(v)) : [];
    const creatorNames = Array.isArray(meta.creatorUsernames) ? meta.creatorUsernames.map(v => String(v)) : [];
    const isAdmin = String((req.user && req.user.role) || '') === 'admin';
    const isOwner = (requesterName && String(item.createdBy || '') === requesterName)
      || (requesterId && String(item.createdBy || '') === requesterId)
      || (requesterId && creatorIds.includes(requesterId))
      || (requesterName && creatorNames.includes(requesterName));

    if (!isAdmin && !isOwner) return res.status(403).json({ success: false, message: 'Non autorisé' });

    res.json({ success: true, item });
  } catch (e) {
    res.status(400).json({ success: false, message: 'Erreur résolution suggestion', error: String(e && e.message ? e.message : e) });
  }
});

router.delete('/suggest/:id', verifyToken, async (req, res) => {
  try {
    const doc = await Item.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Item introuvable' });

    const requesterId = String((req.user && (req.user.id || req.user._id)) || '');
    const requesterName = String((req.user && (req.user.username || req.user.name)) || '');
    const meta = (doc && typeof doc.meta === 'object') ? doc.meta : {};
    const creatorIds = Array.isArray(meta.creatorIds) ? meta.creatorIds.map(v => String(v)) : [];
    const creatorNames = Array.isArray(meta.creatorUsernames) ? meta.creatorUsernames.map(v => String(v)) : [];
    const isAdmin = String((req.user && req.user.role) || '') === 'admin';
    const isOwner = (requesterName && String(doc.createdBy || '') === requesterName)
      || (requesterId && String(doc.createdBy || '') === requesterId)
      || (requesterId && creatorIds.includes(requesterId))
      || (requesterName && creatorNames.includes(requesterName));

    if (!isAdmin && !isOwner) return res.status(403).json({ success: false, message: 'Non autorisé' });

    await doc.deleteOne();
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ success: false, message: 'Erreur suppression suggestion', error: String(e && e.message ? e.message : e) });
  }
});

// Suggestion d'un item (utilisateur)
router.post('/suggest', verifyToken, async (req, res) => {
  try {
    let { legacyId, name, price, type, assets, backgrounds, variants, infoOnly, infoDescription } = req.body || {};

    const normalizedPrice = (typeof price === 'number') ? price : (parseFloat(price) || 0);
    const normalizedName = (typeof name === 'string') ? name.trim() : '';
    const finalName = normalizedName || 'Suggestion';

    const normalizedAssets = Array.isArray(assets)
      ? assets.filter(a => a && typeof a.src === 'string' && a.src.trim() !== '')
      : [];
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
      profilePopupStyle: a.profilePopupStyle || null,
      largeAvatarStyle: a.largeAvatarStyle || null,
      largeAvatarStyleMobile: a.largeAvatarStyleMobile || null,
      cosmeticPreviewStyle: a.cosmeticPreviewStyle || null,
      cosmeticPreviewStyleMobile: a.cosmeticPreviewStyleMobile || null,
      meta: a.meta || {}
    }));

    const sanitizedVariants = Array.isArray(variants) ? variants.map(v => {
      const vAssets = Array.isArray(v?.assets)
        ? v.assets.filter(a => a && typeof a.src === 'string' && a.src.trim() !== '')
        : [];
      return {
        name: (v && typeof v.name === 'string') ? v.name : '',
        assets: vAssets.map(a => ({
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
          profilePopupStyle: a && a.profilePopupStyle || null,
          largeAvatarStyle: a && a.largeAvatarStyle || null,
          largeAvatarStyleMobile: a && a.largeAvatarStyleMobile || null,
          cosmeticPreviewStyle: a && a.cosmeticPreviewStyle || null,
          cosmeticPreviewStyleMobile: a && a.cosmeticPreviewStyleMobile || null,
          meta: a && typeof a.meta === 'object' ? a.meta : {}
        })),
        backgrounds: {
          collection: v?.backgrounds?.collection || null,
          leaderboard: v?.backgrounds?.leaderboard || null,
          avatar: v?.backgrounds?.avatar || null,
          navbar: v?.backgrounds?.navbar || null,
          'popup-style': v?.backgrounds?.['popup-style'] || null,
          'profile-popup': v?.backgrounds?.['profile-popup'] || null
        },
        navbarPlacements: normalizeNavbarPlacements(v && v.navbarPlacements),
        showText: !!(v && v.showText),
        textOnly: !!(v && v.textOnly),
        textContent: (v && typeof v.textContent === 'string') ? v.textContent.trim() : '',
        removeNavbarBorder: !!(v && v.removeNavbarBorder),
        removeLeaderboardBorder: !!(v && v.removeLeaderboardBorder),
        removeProfilePopupBorder: !!(v && v.removeProfilePopupBorder)
      };
    }) : [];

    async function nextAvailableLegacyId(startFrom) {
      let current = startFrom;
      while (isReservedLegacyId(current) || await Item.exists({ legacyId: current })) {
        current += 1;
      }
      return current;
    }

    if (typeof legacyId !== 'number' || Number.isNaN(legacyId)) {
      const last = await Item.findOne({}, { legacyId: 1 }).sort({ legacyId: -1 }).lean();
      legacyId = (last && typeof last.legacyId === 'number') ? (last.legacyId + 1) : 3000;
    } else if (isReservedLegacyId(Number(legacyId))) {
      const last = await Item.findOne({}, { legacyId: 1 }).sort({ legacyId: -1 }).lean();
      legacyId = (last && typeof last.legacyId === 'number') ? (last.legacyId + 1) : 3000;
    }
    legacyId = await nextAvailableLegacyId(Number(legacyId));

    const incomingMeta = (req.body && typeof req.body.meta === 'object') ? req.body.meta : {};
    const baseMeta = { ...(incomingMeta || {}), isSuggested: true };

    const doc = await Item.create({
      legacyId: Number(legacyId),
      name: finalName,
      price: normalizedPrice,
      type: (typeof type === 'string' && type) ? type : 'generic',
      infoOnly: !!infoOnly,
      infoDescription: (typeof infoDescription === 'string' ? infoDescription.trim() : null),
      assets: sanitizedAssets,
      backgrounds: (backgrounds && typeof backgrounds === 'object') ? backgrounds : {},
      variants: sanitizedVariants,
      availableInDailyShop: true,
      active: true,
      createdBy: req.user?.username || null,
      meta: baseMeta
    });

    res.json({ success: true, item: doc });
    try { setImmediate(() => { maybeNotifyNewPoolItem(doc, false, false).catch(() => {}); }); } catch {}
  } catch (e) {
    res.status(400).json({ success: false, message: 'Erreur enregistrement suggestion', error: String(e && e.message ? e.message : e) });
  }
});

module.exports = router;


