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
  
  // Handle GET request (profil utilisateur)
  if (req.method === 'GET' && !path) {
    try {
      console.log('🔍 Début de la requête pour récupérer les infos utilisateur');
      
      // Import dynamique des modules
      const { MongoClient } = await import('mongodb');
      const jwt = await import('jsonwebtoken');
      
      // Check environment variables
      if (!process.env.MONGODB_URI) {
        console.error('❌ MONGODB_URI manquante');
        throw new Error('MONGODB_URI environment variable is not set');
      }
      
      if (!process.env.JWT_SECRET) {
        console.error('❌ JWT_SECRET manquant');
        throw new Error('JWT_SECRET environment variable is not set');
      }
      
      // Get authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('❌ Token d\'autorisation manquant');
        return res.status(401).json({
          success: false,
          message: 'Token d\'autorisation requis'
        });
      }
      
      const token = authHeader.substring(7);
      
      // Verify JWT token
      let decoded;
      try {
        decoded = jwt.default.verify(token, process.env.JWT_SECRET);
        // Vérifier que decoded est un objet avec les propriétés attendues
        if (typeof decoded === 'string' || !decoded.username || !decoded.userId) {
          throw new Error('Token invalide - structure incorrecte');
        }
        console.log('✅ Token JWT vérifié pour:', decoded.username);
      } catch (jwtError) {
        console.log('❌ Token JWT invalide');
        return res.status(401).json({
          success: false,
          message: 'Token invalide'
        });
      }
      
      // Connect to MongoDB
      console.log('📡 Connexion à MongoDB...');
      const client = new MongoClient(process.env.MONGODB_URI);
      await client.connect();
      console.log('✅ Connexion MongoDB réussie');
      
      const db = client.db();
      const usersCollection = db.collection('users');
      
      // Find user by ID
      const { ObjectId } = await import('mongodb');
      const user = await usersCollection.findOne({ _id: new ObjectId(decoded.userId) });
      
      if (!user) {
        await client.close();
        console.log('❌ Utilisateur non trouvé');
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }
      
      console.log('✅ Utilisateur trouvé:', user.username);
      
      await client.close();
      console.log('📡 Connexion MongoDB fermée');
      
      // Return user info (without sensitive data)
      res.status(200).json({
        success: true,
        user: {
          id: user._id.toString(),
          username: user.username,
          role: user.role || 'Non défini',
          groupe: user.groupe || 'Non défini',
          year: user.year || 'Non définie',
          coins: user.coins || 0,
          avatar: user.avatar || null,
          hasSecretQuestions: user.hasSecretQuestions || false,
          completedTasks: user.completedTasks || 0,
          validations: user.validations || 0,
          equippedItemId: user.equippedItemId || null,
          selectedBorderColor: user.selectedBorderColor || 'default'
        }
      });
      
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des infos utilisateur:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des infos utilisateur',
        error: error.message
      });
    }
  } else {
    console.log('❌ Méthode non autorisée:', req.method);
    res.status(405).json({
      success: false,
      message: 'Méthode non autorisée'
    });
  }
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
