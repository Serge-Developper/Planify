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
  
  // Handle POST request to save secret questions
  if (req.method === 'POST') {
    try {
      const { userId, questions } = req.body;
      
      // Validate input
      if (!userId || !questions) {
        return res.status(400).json({
          success: false,
          message: 'userId et questions requis'
        });
      }
      
      // Connect to MongoDB
      if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI environment variable is not set');
      }
      const client = new MongoClient(process.env.MONGODB_URI);
      await client.connect();
      
      const db = client.db('planify');
      const usersCollection = db.collection('users');
      
      // Update user with secret questions
      const result = await usersCollection.updateOne(
        { _id: userId },
        { 
          $set: { 
            secretQuestions: questions,
            hasSecretQuestions: true
          } 
        }
      );
      
      await client.close();
      
      if (result.matchedCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'Questions secrètes sauvegardées avec succès'
      });
      
    } catch (error) {
      console.error('Erreur sauvegarde questions secrètes:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la sauvegarde des questions secrètes'
      });
    }
  } else {
    res.status(405).json({
      success: false,
      message: 'Méthode non autorisée'
    });
  }
}
