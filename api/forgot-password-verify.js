// API pour vérifier les réponses aux questions secrètes
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
  
  // Handle POST request to verify secret questions answers
  if (req.method === 'POST') {
    try {
      console.log('🔍 Début de la requête forgot-password-verify');
      
      // Import dynamique des modules pour éviter les problèmes Vercel
      const { MongoClient } = await import('mongodb');
      
      const { username, answers } = req.body;
      console.log('📝 Username reçu:', username);
      console.log('📝 Réponses reçues:', answers);
      
      // Validate input
      if (!username || !answers || !Array.isArray(answers)) {
        console.log('❌ Données manquantes ou invalides');
        return res.status(400).json({
          success: false,
          message: 'Nom d\'utilisateur et réponses requis'
        });
      }
      
      // Check environment variables
      if (!process.env.MONGODB_URI) {
        console.error('❌ MONGODB_URI manquante');
        throw new Error('MONGODB_URI environment variable is not set');
      }
      
      console.log('📡 Connexion à MongoDB...');
      const client = new MongoClient(process.env.MONGODB_URI);
      await client.connect();
      console.log('✅ Connexion MongoDB réussie');
      
      // Utiliser la base de données par défaut de l'URI
      const db = client.db();
      console.log('📋 Base de données utilisée:', db.databaseName);
      
      const usersCollection = db.collection('users');
      
      // Find user by username
      console.log('🔍 Recherche utilisateur:', username);
      const user = await usersCollection.findOne(
        { username: username },
        { projection: { secretQuestions: 1, username: 1 } }
      );
      
      if (!user) {
        console.log('❌ Utilisateur non trouvé');
        await client.close();
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }
      
      console.log('✅ Utilisateur trouvé:', user.username);
      
      // Check if user has secret questions
      if (!user.secretQuestions || !Array.isArray(user.secretQuestions) || user.secretQuestions.length === 0) {
        console.log('❌ Aucune question secrète configurée');
        await client.close();
        return res.status(400).json({
          success: false,
          message: 'Aucune question secrète configurée pour cet utilisateur'
        });
      }
      
      // Verify answers
      console.log('🔍 Vérification des réponses...');
      const correctAnswers = user.secretQuestions.map(q => q.answer.toLowerCase().trim());
      const providedAnswers = answers.map(a => a.toLowerCase().trim());
      
      console.log('📋 Réponses correctes:', correctAnswers);
      console.log('📋 Réponses fournies:', providedAnswers);
      
      // Check if all answers match
      const allCorrect = correctAnswers.every((correctAnswer, index) => {
        const providedAnswer = providedAnswers[index];
        return correctAnswer === providedAnswer;
      });
      
      await client.close();
      console.log('📡 Connexion MongoDB fermée');
      
      if (allCorrect) {
        console.log('✅ Toutes les réponses sont correctes');
        res.status(200).json({
          success: true,
          message: 'Réponses correctes'
        });
      } else {
        console.log('❌ Réponses incorrectes');
        res.status(400).json({
          success: false,
          message: 'Réponses incorrectes'
        });
      }
      
    } catch (error) {
      console.error('❌ Erreur forgot-password-verify:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la vérification des réponses',
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
