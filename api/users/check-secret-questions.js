import { MongoClient } from 'mongodb';

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
  
  // Handle GET request to check if user has secret questions
  if (req.method === 'GET') {
    try {
      const { userId } = req.query;
      
      // Validate input
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'userId requis'
        });
      }
      
      // Connect to MongoDB
      if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI environment variable is not set');
      }
      const client = new MongoClient(process.env.MONGODB_URI);
      await client.connect();
      
      const db = client.db('planifyvrai');
      const usersCollection = db.collection('users');
      
      // Find user and check if they have secret questions
      const user = await usersCollection.findOne(
        { _id: userId },
        { projection: { hasSecretQuestions: 1, secretQuestions: 1 } }
      );
      
      await client.close();
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }
      
      res.status(200).json({
        success: true,
        hasSecretQuestions: user.hasSecretQuestions || false,
        secretQuestions: user.secretQuestions || null
      });
      
    } catch (error) {
      console.error('Erreur vérification questions secrètes:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la vérification des questions secrètes'
      });
    }
  } else {
    res.status(405).json({
      success: false,
      message: 'Méthode non autorisée'
    });
  }
}
