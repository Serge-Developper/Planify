// API simplifiée pour récupérer les questions secrètes d'un utilisateur
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGINS || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Handle POST request to get user's secret questions
  if (req.method === 'POST') {
    try {
      console.log('🔍 Début de la requête forgot-password-questions');
      
      // Import dynamique des modules pour éviter les problèmes Vercel
      const { MongoClient } = await import('mongodb');
      
      const { username } = req.body;
      console.log('📝 Username reçu:', username);
      
      // Validate input
      if (!username) {
        console.log('❌ Username manquant');
        return res.status(400).json({
          success: false,
          message: 'Nom d\'utilisateur requis'
        });
      }
      
      // Check environment variables
      if (!process.env.MONGODB_URI) {
        console.error('❌ MONGODB_URI manquante');
        throw new Error('MONGODB_URI environment variable is not set');
      }
      
      console.log('📡 Connexion à MongoDB...');
      console.log('🔗 URI:', process.env.MONGODB_URI.substring(0, 50) + '...');
      
      const client = new MongoClient(process.env.MONGODB_URI);
      await client.connect();
      console.log('✅ Connexion MongoDB réussie');
      
      // Utiliser la base de données par défaut de l'URI
      const db = client.db();
      console.log('📋 Base de données utilisée:', db.databaseName);
      
      const usersCollection = db.collection('users');
      
      // Compter tous les utilisateurs pour debug
      const totalUsers = await usersCollection.countDocuments();
      console.log(`👥 Nombre total d'utilisateurs: ${totalUsers}`);
      
      // Lister quelques utilisateurs pour debug
      const sampleUsers = await usersCollection.find({}).limit(3).toArray();
      console.log('📋 Exemples d\'utilisateurs:', sampleUsers.map(u => u.username));
      
      // Find user by username
      console.log('🔍 Recherche utilisateur:', username);
      const user = await usersCollection.findOne(
        { username: username },
        { projection: { secretQuestions: 1, hasSecretQuestions: 1, username: 1 } }
      );
      
      await client.close();
      console.log('📡 Connexion MongoDB fermée');
      
      if (!user) {
        console.log('❌ Utilisateur non trouvé');
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé',
          debug: {
            searchedUsername: username,
            totalUsers: totalUsers,
            sampleUsers: sampleUsers.map(u => u.username),
            databaseName: db.databaseName
          }
        });
      }
      
      console.log('✅ Utilisateur trouvé:', user.username);
      
      // Check if user has secret questions
      const hasSecretQuestions = user.secretQuestions && Array.isArray(user.secretQuestions) && user.secretQuestions.length > 0;
      console.log('❓ Questions secrètes:', hasSecretQuestions);
      
      if (!hasSecretQuestions) {
        console.log('❌ Aucune question secrète configurée');
        return res.status(400).json({
          success: false,
          message: 'Aucune question secrète configurée pour cet utilisateur'
        });
      }
      
      // Return only the questions (not the answers)
      const questions = user.secretQuestions.map(q => ({
        question: q.question
      }));
      
      console.log('🎉 Questions secrètes récupérées avec succès');
      
      res.status(200).json({
        success: true,
        message: 'Questions secrètes récupérées',
        username: user.username,
        questions: questions
      });
      
    } catch (error) {
      console.error('❌ Erreur forgot-password-questions:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des questions secrètes',
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
