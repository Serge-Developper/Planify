import { MongoClient, ObjectId } from 'mongodb';

export default async function handler(req, res) {
  // Log pour déboguer
  console.log('🔍 API Coins - Méthode:', req.method, 'URL:', req.url);

  // Gestion CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Extraire l'action depuis l'URL
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname.replace('/api/coins/', '');
  
  console.log('📂 Path:', path);

  // Routes qui ne nécessitent pas d'authentification
  if (path === 'weekly-items' && req.method === 'GET') {
    return handleWeeklyItems(req, res);
  }

  // Vérifier l'authentification pour les autres routes
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token d\'authentification requis' });
  }

  const token = authHeader.substring(7);
  let decoded = null;

  try {
    const jwt = await import('jsonwebtoken');
    const jwtSecret = process.env.JWT_SECRET;
    
    if (!jwtSecret) {
      return res.status(500).json({ error: 'JWT_SECRET non configuré' });
    }
    
    decoded = jwt.verify(token, jwtSecret);
    
    if (typeof decoded === 'string') {
      return res.status(401).json({ error: 'Token invalide' });
    }
  } catch (error) {
    return res.status(401).json({ error: 'Token invalide' });
  }

  if (!decoded || !decoded.username) {
    return res.status(401).json({ error: 'Token invalide - pas de username' });
  }

  // Router vers la bonne fonction selon le path
  switch (path) {
    case 'user-coins':
      return handleUserCoins(req, res, decoded);
    case 'inventory':
      return handleInventory(req, res, decoded);
    case 'spin-status':
      return handleSpinStatus(req, res, decoded);
    case 'purchase':
      return handlePurchase(req, res, decoded);
    case 'equip':
      return handleEquip(req, res, decoded);
    case 'unequip':
      return handleUnequip(req, res, decoded);
    case 'spin-wheel':
      return handleSpinWheel(req, res, decoded);
    default:
      return res.status(404).json({ error: 'Route non trouvée' });
  }
}

// Fonction pour récupérer les coins d'un utilisateur
async function handleUserCoins(req, res, decoded) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      return res.status(500).json({ error: 'MONGODB_URI non configuré' });
    }
    const client = await MongoClient.connect(mongoUri);
    const db = client.db();
    
    const user = await db.collection('users').findOne(
      { username: decoded.username },
      { projection: { coins: 1, _id: 0 } }
    );
    
    await client.close();
    
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    res.json({ coins: user.coins || 0 });
  } catch (error) {
    console.error('Erreur récupération coins:', error);
    res.json({ coins: 0 });
  }
}

// Fonction pour récupérer l'inventaire
async function handleInventory(req, res, decoded) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      return res.status(500).json({ error: 'MONGODB_URI non configuré' });
    }
    const client = await MongoClient.connect(mongoUri);
    const db = client.db();
    
    const user = await db.collection('users').findOne(
      { username: decoded.username },
      { projection: { inventory: 1, equippedItems: 1, _id: 0 } }
    );
    
    if (!user) {
      await client.close();
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    let inventory = user.inventory || [];
    
    // S'assurer que l'utilisateur possède "Bordure Classique"
    if (!inventory.some(item => item.name === 'Bordure Classique')) {
      const classicItem = { name: 'Bordure Classique', type: 'border', color: '#000000', rarity: 'common' };
      inventory.push(classicItem);
      
      await db.collection('users').updateOne(
        { username: decoded.username },
        { $addToSet: { inventory: classicItem } }
      );
    }
    
    await client.close();
    
    res.json({ 
      inventory: inventory,
      equippedItems: user.equippedItems || {}
    });
  } catch (error) {
    console.error('Erreur récupération inventaire:', error);
    res.json({ inventory: [], equippedItems: {} });
  }
}

// Fonction pour vérifier le statut du spin
async function handleSpinStatus(req, res, decoded) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      return res.status(500).json({ error: 'MONGODB_URI non configuré' });
    }
    const client = await MongoClient.connect(mongoUri);
    const db = client.db();
    
    const user = await db.collection('users').findOne(
      { username: decoded.username },
      { projection: { lastSpinDate: 1, _id: 0 } }
    );
    
    await client.close();
    
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    const now = new Date();
    const lastSpin = user.lastSpinDate ? new Date(user.lastSpinDate) : null;
    const canSpin = !lastSpin || (now.getTime() - lastSpin.getTime()) >= 24 * 60 * 60 * 1000;
    
    res.json({ 
      canSpin, 
      lastSpinDate: lastSpin, 
      nextSpinAvailable: lastSpin ? new Date(lastSpin.getTime() + 24 * 60 * 60 * 1000) : null 
    });
  } catch (error) {
    console.error('Erreur vérification spin:', error);
    res.json({ canSpin: false, lastSpinDate: null, nextSpinAvailable: null });
  }
}

// Fonction pour les items hebdomadaires
async function handleWeeklyItems(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const allItems = [
    { name: 'Bordure Rouge', type: 'border', color: '#ff0000', price: 100, rarity: 'common' },
    { name: 'Bordure Bleue', type: 'border', color: '#0000ff', price: 100, rarity: 'common' },
    { name: 'Bordure Verte', type: 'border', color: '#00ff00', price: 100, rarity: 'common' },
    { name: 'Bordure Jaune', type: 'border', color: '#ffff00', price: 100, rarity: 'common' },
    { name: 'Bordure Orange', type: 'border', color: '#ffa500', price: 150, rarity: 'uncommon' },
    { name: 'Bordure Violette', type: 'border', color: '#800080', price: 150, rarity: 'uncommon' },
    { name: 'Bordure Rose', type: 'border', color: '#ffc0cb', price: 150, rarity: 'uncommon' },
    { name: 'Bordure Dorée', type: 'border', color: '#ffd700', price: 300, rarity: 'rare' },
    { name: 'Bordure Arc-en-ciel', type: 'border', color: 'linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3)', price: 500, rarity: 'epic' },
    { name: 'Bordure Cristal', type: 'border', color: 'rgba(255, 255, 255, 0.8)', price: 750, rarity: 'legendary' }
  ];

  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const shuffled = [...allItems];
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor((seed + i) % (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  const weeklyItems = shuffled.slice(0, 6);
  res.json({ items: weeklyItems });
}

// Fonction pour acheter un item
async function handlePurchase(req, res, decoded) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const { itemName } = req.body;
    
    if (!itemName) {
      return res.status(400).json({ error: 'Nom de l\'item requis' });
    }

    const allItems = [
      { name: 'Bordure Rouge', type: 'border', color: '#ff0000', price: 100, rarity: 'common' },
      { name: 'Bordure Bleue', type: 'border', color: '#0000ff', price: 100, rarity: 'common' },
      { name: 'Bordure Verte', type: 'border', color: '#00ff00', price: 100, rarity: 'common' },
      { name: 'Bordure Jaune', type: 'border', color: '#ffff00', price: 100, rarity: 'common' },
      { name: 'Bordure Orange', type: 'border', color: '#ffa500', price: 150, rarity: 'uncommon' },
      { name: 'Bordure Violette', type: 'border', color: '#800080', price: 150, rarity: 'uncommon' },
      { name: 'Bordure Rose', type: 'border', color: '#ffc0cb', price: 150, rarity: 'uncommon' },
      { name: 'Bordure Dorée', type: 'border', color: '#ffd700', price: 300, rarity: 'rare' },
      { name: 'Bordure Arc-en-ciel', type: 'border', color: 'linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3)', price: 500, rarity: 'epic' },
      { name: 'Bordure Cristal', type: 'border', color: 'rgba(255, 255, 255, 0.8)', price: 750, rarity: 'legendary' }
    ];

    const itemToBuy = allItems.find(item => item.name === itemName);
    if (!itemToBuy) {
      return res.status(404).json({ error: 'Item non trouvé' });
    }

    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      return res.status(500).json({ error: 'MONGODB_URI non configuré' });
    }
    const client = await MongoClient.connect(mongoUri);
    const db = client.db();
    
    const user = await db.collection('users').findOne({ username: decoded.username });
    if (!user) {
      await client.close();
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    if (user.coins < itemToBuy.price) {
      await client.close();
      return res.status(400).json({ error: 'Coins insuffisants' });
    }
    
    await db.collection('users').updateOne(
      { username: decoded.username },
      { $inc: { coins: -itemToBuy.price }, $addToSet: { inventory: itemToBuy } }
    );
    
    await client.close();
    
    res.json({ 
      success: true, 
      message: 'Achat effectué avec succès', 
      newBalance: user.coins - itemToBuy.price 
    });
  } catch (error) {
    console.error('Erreur achat:', error);
    res.status(500).json({ error: 'Erreur lors de l\'achat' });
  }
}

// Fonction pour équiper un item
async function handleEquip(req, res, decoded) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const { itemName } = req.body;
    
    if (!itemName) {
      return res.status(400).json({ error: 'Nom de l\'item requis' });
    }

    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      return res.status(500).json({ error: 'MONGODB_URI non configuré' });
    }
    const client = await MongoClient.connect(mongoUri);
    const db = client.db();
    
    const user = await db.collection('users').findOne({ username: decoded.username });
    if (!user) {
      await client.close();
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    const hasItem = user.inventory && user.inventory.some(item => item.name === itemName);
    if (!hasItem) {
      await client.close();
      return res.status(400).json({ error: 'Vous ne possédez pas cet item' });
    }
    
    await db.collection('users').updateOne(
      { username: decoded.username },
      { $set: { [`equippedItems.${itemName}`]: true } }
    );
    
    await client.close();
    
    res.json({ success: true, message: 'Item équipé avec succès' });
  } catch (error) {
    console.error('Erreur équipement:', error);
    res.status(500).json({ error: 'Erreur lors de l\'équipement' });
  }
}

// Fonction pour déséquiper un item
async function handleUnequip(req, res, decoded) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const { itemName } = req.body;
    
    if (!itemName) {
      return res.status(400).json({ error: 'Nom de l\'item requis' });
    }

    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      return res.status(500).json({ error: 'MONGODB_URI non configuré' });
    }
    const client = await MongoClient.connect(mongoUri);
    const db = client.db();
    
    await db.collection('users').updateOne(
      { username: decoded.username },
      { $unset: { [`equippedItems.${itemName}`]: "" } }
    );
    
    await client.close();
    
    res.json({ success: true, message: 'Item déséquipé avec succès' });
  } catch (error) {
    console.error('Erreur déséquipement:', error);
    res.status(500).json({ error: 'Erreur lors du déséquipement' });
  }
}

// Fonction pour tourner la roue
async function handleSpinWheel(req, res, decoded) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      return res.status(500).json({ error: 'MONGODB_URI non configuré' });
    }
    const client = await MongoClient.connect(mongoUri);
    const db = client.db();
    
    const user = await db.collection('users').findOne({ username: decoded.username });
    if (!user) {
      await client.close();
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    const now = new Date();
    const lastSpin = user.lastSpinDate ? new Date(user.lastSpinDate) : null;
    const canSpin = !lastSpin || (now.getTime() - lastSpin.getTime()) >= 24 * 60 * 60 * 1000;
    
    if (!canSpin) {
      await client.close();
      return res.status(400).json({ error: 'Vous devez attendre 24h entre chaque tour' });
    }
    
    const rewards = [10, 20, 30, 50, 100, 200];
    const randomReward = rewards[Math.floor(Math.random() * rewards.length)];
    
    await db.collection('users').updateOne(
      { username: decoded.username },
      { $inc: { coins: randomReward }, $set: { lastSpinDate: now } }
    );
    
    await client.close();
    
    res.json({ 
      success: true, 
      reward: randomReward, 
      newBalance: user.coins + randomReward 
    });
  } catch (error) {
    console.error('Erreur spin wheel:', error);
    res.status(500).json({ error: 'Erreur lors du spin' });
  }
}
