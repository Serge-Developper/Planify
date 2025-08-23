import { MongoClient } from 'mongodb';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGINS || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Extraire l'action depuis l'URL
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname.replace('/api/coins/', '');
  
  console.log('💰 Coins API - Path:', path, 'Method:', req.method);

  // Routes pour les fonctionnalités coins
  if (path === 'inventory' && req.method === 'GET') {
    return handleInventory(req, res);
  }
  if (path === 'weekly-items' && req.method === 'GET') {
    return handleWeeklyItems(req, res);
  }
  if (path === 'spin-status' && req.method === 'GET') {
    return handleSpinStatus(req, res);
  }
  if (path === 'user-coins' && req.method === 'GET') {
    return handleUserCoins(req, res);
  }
  
  // Route principale pour les coins
  if (req.method === 'GET' && !path) {
    return handleGetCoins(req, res);
  }
  
  // Si on arrive ici, c'est une route non reconnue
  console.log('❌ Route non reconnue:', path, 'Method:', req.method);
  res.status(405).json({
    success: false,
    message: 'Méthode non autorisée'
  });
}

// Fonction pour récupérer l'inventaire
async function handleInventory(req, res) {
  try {
    // Vérifier l'authentification
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
      
      decoded = jwt.default.verify(token, jwtSecret);
      
      if (typeof decoded === 'string') {
        return res.status(401).json({ error: 'Token invalide' });
      }
    } catch (error) {
      return res.status(401).json({ error: 'Token invalide' });
    }

    if (!decoded || !decoded.username) {
      return res.status(401).json({ error: 'Token invalide - pas de username' });
    }

    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      return res.status(500).json({ error: 'MONGODB_URI non configuré' });
    }
    const client = await MongoClient.connect(mongoUri);
    const db = client.db();
    
    const user = await db.collection('users').findOne(
      { username: decoded.username },
      { projection: { purchasedItems: 1, equippedItemId: 1, selectedBorderColor: 1, _id: 0 } }
    );
    
    await client.close();
    
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // S'assurer que l'item "Bordure Classique" est toujours présent
    let inventory = user.purchasedItems || [];
    if (!inventory.some(item => item.itemId === 0)) {
      inventory.push({
        itemId: 0,
        itemName: 'Bordure Classique',
        purchaseDate: new Date(),
        equipped: false
      });
    }

    res.json({
      inventory: inventory,
      equippedItemId: user.equippedItemId || null,
      selectedBorderColor: user.selectedBorderColor || 'default'
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'inventaire:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
}

// Fonction pour récupérer les items hebdomadaires
async function handleWeeklyItems(req, res) {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      return res.status(500).json({ error: 'MONGODB_URI non configuré' });
    }
    const client = await MongoClient.connect(mongoUri);
    const db = client.db();
    
    // Récupérer les items hebdomadaires
    const weeklyItems = await db.collection('weeklyItems').find({}).toArray();
    
    await client.close();
    
    res.json({ weeklyItems: weeklyItems || [] });
  } catch (error) {
    console.error('Erreur lors de la récupération des items hebdomadaires:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
}

// Fonction pour récupérer le statut de spin
async function handleSpinStatus(req, res) {
  try {
    // Vérifier l'authentification
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
      
      decoded = jwt.default.verify(token, jwtSecret);
      
      if (typeof decoded === 'string') {
        return res.status(401).json({ error: 'Token invalide' });
      }
    } catch (error) {
      return res.status(401).json({ error: 'Token invalide' });
    }

    if (!decoded || !decoded.username) {
      return res.status(401).json({ error: 'Token invalide - pas de username' });
    }

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
    
    // Vérifier si l'utilisateur peut tourner aujourd'hui
    let canSpin = true;
    if (lastSpin) {
      const lastSpinDate = new Date(lastSpin);
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const lastSpinDay = new Date(lastSpinDate.getFullYear(), lastSpinDate.getMonth(), lastSpinDate.getDate());
      
      canSpin = lastSpinDay.getTime() !== today.getTime();
    }

    res.json({
      canSpin: canSpin,
      lastSpinDate: lastSpin
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du statut de spin:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
}

// Fonction pour récupérer les coins de l'utilisateur
async function handleUserCoins(req, res) {
  try {
    // Vérifier l'authentification
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
      
      decoded = jwt.default.verify(token, jwtSecret);
      
      if (typeof decoded === 'string') {
        return res.status(401).json({ error: 'Token invalide' });
      }
    } catch (error) {
      return res.status(401).json({ error: 'Token invalide' });
    }

    if (!decoded || !decoded.username) {
      return res.status(401).json({ error: 'Token invalide - pas de username' });
    }

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
    console.error('Erreur lors de la récupération des coins:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
}

// Fonction principale pour gérer les coins (ancienne logique)
async function handleGetCoins(req, res) {
  try {
    console.log('💰 Chargement des coins...');
    
    // Vérifier l'authentification
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
      
      decoded = jwt.default.verify(token, jwtSecret);
      
      if (typeof decoded === 'string') {
        return res.status(401).json({ error: 'Token invalide' });
      }
    } catch (error) {
      return res.status(401).json({ error: 'Token invalide' });
    }

    if (!decoded || !decoded.username) {
      return res.status(401).json({ error: 'Token invalide - pas de username' });
    }

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

    console.log('✅ Coins chargés:', user.coins || 0);
    
    res.json({
      success: true,
      coins: user.coins || 0
    });
  } catch (error) {
    console.error('❌ Erreur lors du chargement des coins:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur interne du serveur' 
    });
  }
}
