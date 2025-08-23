import { MongoClient } from 'mongodb';

export default async function handler(req, res) {
  // Gestion CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

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

    // Debug des questions secrètes
    console.log('🔍 Debug questions secrètes:');
    console.log('- user.secretQuestions:', user.secretQuestions);
    console.log('- user.hasSecretQuestions:', user.hasSecretQuestions);
    console.log('- Nombre de questions:', user.secretQuestions ? user.secretQuestions.length : 0);

    // S'assurer que hasSecretQuestions est à true si l'utilisateur a des questions secrètes
    if (user.secretQuestions && user.secretQuestions.length > 0 && !user.hasSecretQuestions) {
      await db.collection('users').updateOne(
        { username: username },
        { $set: { hasSecretQuestions: true } }
      );
      user.hasSecretQuestions = true;
      console.log('✅ hasSecretQuestions mis à jour à true');
    }

    await client.close();
    
    console.log('Token JWT créé avec succès');
    console.log('=== FIN CONNEXION RÉUSSIE ===');

    // Vérifier si l'utilisateur a des questions secrètes (au moins 1 question)
    const hasSecretQuestions = Boolean(user.secretQuestions && user.secretQuestions.length > 0);
    console.log('🔍 hasSecretQuestions final:', hasSecretQuestions);

    res.json({
      _id: user._id,
      username: user.username,
      role: user.role,
      groupe: user.groupe,
      year: user.year,
      avatar: user.avatar,
      token: token,
      hasSecretQuestions: hasSecretQuestions
    });
  } catch (error) {
    console.error('=== ERREUR CONNEXION ===');
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
}
