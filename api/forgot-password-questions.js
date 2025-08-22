// API simplifiée pour récupérer les questions secrètes
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
  
  // Handle POST request
  if (req.method === 'POST') {
    try {
      console.log('🔍 Début de la requête forgot-password-questions');
      
      const { MongoClient } = await import('mongodb');
      
      const { username } = req.body;
      console.log('📝 Username reçu:', username);
      
      if (!username) {
        return res.status(400).json({
          success: false,
          message: 'Nom d\'utilisateur requis'
        });
      }
      
      if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI environment variable is not set');
      }
      
      const client = new MongoClient(process.env.MONGODB_URI);
      await client.connect();
      
      const db = client.db('planifyvrai');
      const usersCollection = db.collection('users');
      
      const user = await usersCollection.findOne(
        { username: username },
        { projection: { secretQuestions: 1, username: 1 } }
      );
      
      await client.close();
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }
      
      const hasSecretQuestions = user.secretQuestions && Array.isArray(user.secretQuestions) && user.secretQuestions.length > 0;
      
      if (!hasSecretQuestions) {
        return res.status(400).json({
          success: false,
          message: 'Aucune question secrète configurée'
        });
      }
      
      const questions = user.secretQuestions.map(q => ({
        question: q.question
      }));
      
      res.status(200).json({
        success: true,
        message: 'Questions secrètes récupérées',
        username: user.username,
        questions: questions
      });
      
    } catch (error) {
      console.error('❌ Erreur:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur',
        error: error.message
      });
    }
  } else {
    res.status(405).json({
      success: false,
      message: 'Méthode non autorisée'
    });
  }
}
