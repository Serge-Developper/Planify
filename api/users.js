import { MongoClient } from 'mongodb';

// API pour les fonctionnalités utilisateur (profil, mot de passe oublié, etc.)
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
  const path = url.pathname.replace('/api/users/', '');
  
  console.log('📂 Users API - Path:', path, 'Method:', req.method);

  // Routes qui ne nécessitent pas d'authentification
  if (path === 'login' && req.method === 'POST') {
    return handleLogin(req, res);
  }
  if (path === 'forgot-password/questions' && req.method === 'POST') {
    return handleForgotPasswordQuestions(req, res);
  }
  if (path === 'forgot-password/verify' && req.method === 'POST') {
    return handleForgotPasswordVerify(req, res);
  }
  if (path === 'forgot-password/reset' && req.method === 'POST') {
    return handleForgotPasswordReset(req, res);
  }
  if (path === 'secret-questions' && req.method === 'POST') {
    return handleSecretQuestions(req, res);
  }
  
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

// Fonction pour récupérer les questions secrètes d'un utilisateur
async function handleForgotPasswordQuestions(req, res) {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ error: 'Nom d\'utilisateur requis' });
    }

    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      return res.status(500).json({ error: 'MONGODB_URI non configuré' });
    }

    const client = await MongoClient.connect(mongoUri);
    const db = client.db();
    
    const user = await db.collection('users').findOne(
      { username: username },
      { projection: { secretQuestions: 1, hasSecretQuestions: 1, _id: 0 } }
    );
    
    await client.close();
    
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    if (!user.hasSecretQuestions || !user.secretQuestions) {
      return res.status(400).json({ error: 'Cet utilisateur n\'a pas configuré de questions secrètes' });
    }
    
    res.json({ 
      questions: user.secretQuestions.map(q => q.question),
      hasSecretQuestions: true
    });
  } catch (error) {
    console.error('Erreur récupération questions:', error);
    res.status(500).json({ error: 'Erreur serveur interne' });
  }
}

// Fonction pour vérifier les réponses aux questions secrètes
async function handleForgotPasswordVerify(req, res) {
  try {
    const { username, answers } = req.body;
    
    if (!username || !answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'Nom d\'utilisateur et réponses requis' });
    }

    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      return res.status(500).json({ error: 'MONGODB_URI non configuré' });
    }

    const client = await MongoClient.connect(mongoUri);
    const db = client.db();
    
    const user = await db.collection('users').findOne(
      { username: username },
      { projection: { secretQuestions: 1, _id: 0 } }
    );
    
    await client.close();
    
    if (!user || !user.secretQuestions) {
      return res.status(404).json({ error: 'Utilisateur non trouvé ou questions non configurées' });
    }
    
    // Vérifier les réponses
    const correctAnswers = user.secretQuestions.every((q, index) => 
      q.answer.toLowerCase() === answers[index].toLowerCase()
    );
    
    if (!correctAnswers) {
      return res.status(400).json({ error: 'Réponses incorrectes' });
    }
    
    // Générer un token temporaire pour la réinitialisation
    const jwt = await import('jsonwebtoken');
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({ error: 'JWT_SECRET non configuré' });
    }
    const resetToken = jwt.default.sign(
      { username, type: 'password-reset' },
      jwtSecret,
      { expiresIn: '15m' }
    );
    
    res.json({ 
      success: true, 
      message: 'Réponses correctes',
      resetToken 
    });
  } catch (error) {
    console.error('Erreur vérification réponses:', error);
    res.status(500).json({ error: 'Erreur serveur interne' });
  }
}

// Fonction pour réinitialiser le mot de passe
async function handleForgotPasswordReset(req, res) {
  try {
    const { resetToken, newPassword } = req.body;
    
    if (!resetToken || !newPassword) {
      return res.status(400).json({ error: 'Token et nouveau mot de passe requis' });
    }

    // Vérifier le token
    const jwt = await import('jsonwebtoken');
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({ error: 'JWT_SECRET non configuré' });
    }
    let decoded;
    try {
      decoded = jwt.default.verify(resetToken, jwtSecret);
      if (typeof decoded === 'string' || decoded.type !== 'password-reset') {
        throw new Error('Token invalide');
      }
    } catch (error) {
      return res.status(401).json({ error: 'Token invalide ou expiré' });
    }

    // Hasher le nouveau mot de passe
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.default.hash(newPassword, 10);

    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      return res.status(500).json({ error: 'MONGODB_URI non configuré' });
    }

    const client = await MongoClient.connect(mongoUri);
    const db = client.db();
    
    const result = await db.collection('users').updateOne(
      { username: typeof decoded === 'string' ? '' : decoded.username },
      { $set: { password: hashedPassword } }
    );
    
    await client.close();
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    res.json({ 
      success: true, 
      message: 'Mot de passe réinitialisé avec succès' 
    });
  } catch (error) {
    console.error('Erreur réinitialisation mot de passe:', error);
    res.status(500).json({ error: 'Erreur serveur interne' });
  }
}

// Fonction pour sauvegarder les questions secrètes
async function handleSecretQuestions(req, res) {
  try {
    const { username, questions, answers } = req.body;
    
    if (!username || !questions || !answers || !Array.isArray(questions) || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'Données invalides' });
    }

    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      return res.status(500).json({ error: 'MONGODB_URI non configuré' });
    }

    const client = await MongoClient.connect(mongoUri);
    const db = client.db();
    
    const secretQuestions = questions.map((question, index) => ({
      question,
      answer: answers[index]
    }));
    
    const result = await db.collection('users').updateOne(
      { username: username },
      { 
        $set: { 
          secretQuestions: secretQuestions,
          hasSecretQuestions: true
        } 
      }
    );
    
    await client.close();
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    res.json({ 
      success: true, 
      message: 'Questions secrètes sauvegardées avec succès' 
    });
  } catch (error) {
    console.error('Erreur sauvegarde questions secrètes:', error);
    res.status(500).json({ error: 'Erreur serveur interne' });
  }
}

// Fonction pour la connexion utilisateur
async function handleLogin(req, res) {
  try {
    const { username, password } = req.body;
    console.log('=== DÉBUT CONNEXION ===');
    console.log('Tentative de connexion pour:', username);
    
    if (!username || !password) {
      return res.status(400).json({ message: 'Nom d\'utilisateur et mot de passe requis' });
    }

    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      return res.status(500).json({ error: 'MONGODB_URI non configuré' });
    }

    const client = await MongoClient.connect(mongoUri);
    const db = client.db();
    
    const user = await db.collection('users').findOne({ username });
    
    if (!user) {
      await client.close();
      console.log(`Utilisateur ${username} non trouvé`);
      return res.status(400).json({ message: 'Nom d\'utilisateur ou mot de passe incorrect' });
    }
    
    console.log('Utilisateur trouvé:', { 
      username: user.username, 
      role: user.role
    });
    
    // Vérifier le mot de passe
    const bcrypt = await import('bcryptjs');
    let isValidPassword = false;
    
    // Vérifier si le mot de passe est déjà haché
    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
      console.log('Mot de passe déjà haché, utilisation de bcrypt');
      isValidPassword = await bcrypt.default.compare(password, user.password);
    } else {
      console.log('Mot de passe en clair, comparaison directe');
      isValidPassword = (user.password === password);
      
      // Si la connexion réussit, hasher le mot de passe
      if (isValidPassword) {
        console.log('Connexion réussie, migration vers bcrypt...');
        const saltRounds = 12;
        const hashedPassword = await bcrypt.default.hash(password, saltRounds);
        await db.collection('users').updateOne(
          { username: username },
          { $set: { password: hashedPassword } }
        );
        console.log(`Mot de passe migré vers bcrypt pour ${username}`);
      }
    }
    
    console.log('Résultat validation mot de passe:', isValidPassword);
    
    if (!isValidPassword) {
      await client.close();
      console.log(`Mot de passe incorrect pour ${username}`);
      return res.status(400).json({ message: 'Nom d\'utilisateur ou mot de passe incorrect' });
    }

    // Créer le token JWT
    const jwt = await import('jsonwebtoken');
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      await client.close();
      return res.status(500).json({ error: 'JWT_SECRET non configuré' });
    }

    const token = jwt.default.sign(
      {
        id: user._id,
        username: user.username,
        role: user.role,
        year: user.year,
        groupe: user.groupe
      },
      jwtSecret,
      { 
        expiresIn: '24h',
        issuer: 'planify-api',
        audience: 'planify-frontend'
      }
    );

    // S'assurer que hasSecretQuestions est à true si l'utilisateur a des questions secrètes
    if (user.secretQuestions && user.secretQuestions.length > 0 && !user.hasSecretQuestions) {
      await db.collection('users').updateOne(
        { username: username },
        { $set: { hasSecretQuestions: true } }
      );
      user.hasSecretQuestions = true;
    }

    await client.close();
    
    console.log('Token JWT créé avec succès');
    console.log('=== FIN CONNEXION RÉUSSIE ===');

    res.json({
      _id: user._id,
      username: user.username,
      role: user.role,
      groupe: user.groupe,
      year: user.year,
      avatar: user.avatar,
      token: token,
      hasSecretQuestions: Boolean(user.secretQuestions && user.secretQuestions.length === 3)
    });
  } catch (error) {
    console.error('=== ERREUR CONNEXION ===');
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
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


