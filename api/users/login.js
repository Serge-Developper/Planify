// API de connexion compatible Vercel serverless
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
  
  // Handle POST login request
  if (req.method === 'POST') {
    try {
      console.log('🔍 Début de la requête de connexion');
      
      // Import dynamique des modules pour éviter les problèmes Vercel
      const { MongoClient } = await import('mongodb');
      const bcrypt = await import('bcryptjs');
      const jwt = await import('jsonwebtoken');
      
      const { username, password } = req.body;
      console.log('📝 Données reçues:', { username, password: password ? '***' : 'undefined' });
      
      // Validate input
      if (!username || !password) {
        console.log('❌ Données manquantes');
        return res.status(400).json({
          success: false,
          message: 'Nom d\'utilisateur et mot de passe requis'
        });
      }
      
      // Check environment variables
      if (!process.env.MONGODB_URI) {
        console.error('❌ MONGODB_URI manquante');
        throw new Error('MONGODB_URI environment variable is not set');
      }
      
      if (!process.env.JWT_SECRET) {
        console.error('❌ JWT_SECRET manquant');
        throw new Error('JWT_SECRET environment variable is not set');
      }
      
      console.log('📡 Connexion à MongoDB...');
      const client = new MongoClient(process.env.MONGODB_URI);
      await client.connect();
      console.log('✅ Connexion MongoDB réussie');
      
      const db = client.db();
      const usersCollection = db.collection('users');
      
      // Find user by username
      console.log('🔍 Recherche utilisateur:', username);
      const user = await usersCollection.findOne({ username: username });
      
      await client.close();
      console.log('📡 Connexion MongoDB fermée');
      
      if (!user) {
        console.log('❌ Utilisateur non trouvé');
        return res.status(401).json({
          success: false,
          message: 'Nom d\'utilisateur ou mot de passe incorrect'
        });
      }
      
      console.log('✅ Utilisateur trouvé:', user.username);
      
      // Verify password
      console.log('🔐 Vérification du mot de passe...');
      const isPasswordValid = await bcrypt.default.compare(password, user.password);
      
      if (!isPasswordValid) {
        console.log('❌ Mot de passe incorrect');
        return res.status(401).json({
          success: false,
          message: 'Nom d\'utilisateur ou mot de passe incorrect'
        });
      }
      
      console.log('✅ Mot de passe correct');
      
      // Generate JWT token
      console.log('🎫 Génération du token JWT...');
      const token = jwt.default.sign(
        { 
          userId: user._id.toString(),
          username: user.username,
          role: user.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      // Check if user has secret questions
      const hasSecretQuestions = user.secretQuestions && Array.isArray(user.secretQuestions) && user.secretQuestions.length > 0;
      console.log('❓ Questions secrètes:', hasSecretQuestions);
      console.log('📋 Détails questions secrètes:', {
        secretQuestions: user.secretQuestions ? user.secretQuestions.length : 0,
        hasSecretQuestions: user.hasSecretQuestions,
        calculatedHasSecretQuestions: hasSecretQuestions
      });
      
      console.log('🎉 Connexion réussie pour:', user.username);
      
      res.status(200).json({
        success: true,
        message: 'Connexion réussie',
        user: {
          id: user._id.toString(),
          username: user.username,
          role: user.role,
          groupe: user.groupe,
          coins: user.coins || 0,
          hasSecretQuestions: hasSecretQuestions
        },
        token: token
      });
      
    } catch (error) {
      console.error('❌ Erreur lors de la connexion:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la connexion',
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

