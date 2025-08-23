import { MongoClient } from 'mongodb';

// API pour les appels directs à /users (sans /api)
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
  const path = url.pathname.replace('/api/users-direct/', '');
  
  console.log('📂 Users Direct API - Path:', path, 'Method:', req.method);

  // Handle GET request (leaderboard) - route principale
  if (req.method === 'GET' && !path) {
    // Toujours retourner le leaderboard (avec ou sans token)
    return handleLeaderboard(req, res);
  }
  
  // Gérer les routes avec paramètres (ex: /users/{userId})
  if (req.method === 'GET' && path && !path.includes('/')) {
    return handleGetUser(req, res, path);
  }
  
  // Gérer les routes d'acknowledgment de cadeaux
  if (path.startsWith('ack-gift/') && req.method === 'POST') {
    return handleAckGift(req, res, path.replace('ack-gift/', ''));
  }
  
  // Si on arrive ici, c'est une route non reconnue
  console.log('❌ Route non reconnue:', path, 'Method:', req.method);
  res.status(405).json({
    success: false,
    message: 'Méthode non autorisée'
  });
}

// Fonction pour gérer le leaderboard
async function handleLeaderboard(req, res) {
  try {
    console.log('🏆 Chargement du leaderboard...');
    
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      return res.status(500).json({ error: 'MONGODB_URI non configuré' });
    }
    
    const client = await MongoClient.connect(mongoUri);
    const db = client.db();
    
    // Récupérer tous les utilisateurs avec leurs stats
    const users = await db.collection('users').find({}, {
      projection: {
        username: 1,
        role: 1,
        groupe: 1,
        year: 1,
        coins: 1,
        avatar: 1,
        completedTasks: 1,
        validations: 1,
        equippedItemId: 1,
        selectedBorderColor: 1,
        purchasedItems: 1
      }
    }).toArray();
    
    await client.close();
    
    // Formater les données pour le frontend
    const formattedUsers = users.map(user => ({
      username: user.username,
      role: user.role || 'Non défini',
      groupe: user.groupe || 'Non défini',
      year: user.year || 'Non définie',
      coins: user.coins || 0,
      avatar: user.avatar || null,
      completedTasks: user.completedTasks || 0,
      validations: user.validations || 0,
      equippedItemId: user.equippedItemId || null,
      selectedBorderColor: user.selectedBorderColor || 'default',
      purchasedItems: user.purchasedItems || []
    }));
    
    console.log('✅ Leaderboard chargé:', formattedUsers.length, 'utilisateurs');
    
    res.json({
      success: true,
      users: formattedUsers
    });
  } catch (error) {
    console.error('❌ Erreur lors du chargement du leaderboard:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur interne du serveur' 
    });
  }
}

// Fonction pour récupérer un utilisateur spécifique
async function handleGetUser(req, res, userId) {
  try {
    console.log('👤 Récupération utilisateur:', userId);
    
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      return res.status(500).json({ error: 'MONGODB_URI non configuré' });
    }
    
    const client = await MongoClient.connect(mongoUri);
    const db = client.db();
    
    // Récupérer l'utilisateur par ID ou username
    let user;
    if (userId.match(/^[0-9a-fA-F]{24}$/)) {
      // C'est un ObjectId MongoDB
      const { ObjectId } = await import('mongodb');
      user = await db.collection('users').findOne(
        { _id: new ObjectId(userId) },
        { projection: { password: 0 } } // Exclure le mot de passe
      );
    } else {
      // C'est probablement un username
      user = await db.collection('users').findOne(
        { username: userId },
        { projection: { password: 0 } } // Exclure le mot de passe
      );
    }
    
    await client.close();
    
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    res.json({
      success: true,
      user: user
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération utilisateur:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur interne du serveur' 
    });
  }
}

// Fonction pour marquer un cadeau comme lu
async function handleAckGift(req, res, giftId) {
  try {
    console.log('🎁 Acknowledgment cadeau:', giftId);
    
    // Vérifier l'authentification
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token d\'authentification requis' });
    }
    
    const token = authHeader.substring(7);
    const jwt = await import('jsonwebtoken');
    const jwtSecret = process.env.JWT_SECRET;
    
    if (!jwtSecret) {
      return res.status(500).json({ error: 'JWT_SECRET non configuré' });
    }
    
    let decoded;
    try {
      decoded = jwt.default.verify(token, jwtSecret);
    } catch (error) {
      return res.status(401).json({ error: 'Token invalide' });
    }
    
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      return res.status(500).json({ error: 'MONGODB_URI non configuré' });
    }
    
    const client = await MongoClient.connect(mongoUri);
    const db = client.db();
    
    // Marquer le cadeau comme lu
    const userId = typeof decoded === 'string' ? null : decoded.id;
    if (!userId) {
      return res.status(401).json({ error: 'Token invalide' });
    }
    
    const result = await db.collection('users').updateOne(
      { 
        _id: userId,
        'purchasedItems._id': giftId 
      },
      { 
        $set: { 
          'purchasedItems.$.adminGiftRead': true 
        } 
      }
    );
    
    await client.close();
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Cadeau non trouvé' });
    }
    
    res.json({
      success: true,
      message: 'Cadeau marqué comme lu'
    });
  } catch (error) {
    console.error('❌ Erreur lors de l\'acknowledgment du cadeau:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur interne du serveur' 
    });
  }
}
