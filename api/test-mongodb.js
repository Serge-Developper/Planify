// API de test pour vérifier la connexion MongoDB
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
  
  if (req.method === 'GET') {
    try {
      console.log('🔍 Test de connexion MongoDB...');
      
      // Import dynamique des modules
      const { MongoClient } = await import('mongodb');
      
      // Check environment variables
      if (!process.env.MONGODB_URI) {
        console.error('❌ MONGODB_URI manquante');
        return res.status(500).json({
          success: false,
          message: 'MONGODB_URI environment variable is not set',
          env: Object.keys(process.env).filter(key => key.includes('MONGODB'))
        });
      }
      
      console.log('📡 Connexion à MongoDB...');
      console.log('🔗 URI:', process.env.MONGODB_URI.substring(0, 50) + '...');
      
      const client = new MongoClient(process.env.MONGODB_URI);
      await client.connect();
      console.log('✅ Connexion MongoDB réussie');
      
      // Lister toutes les bases de données
      const adminDb = client.db('admin');
      const databases = await adminDb.admin().listDatabases();
      console.log('📋 Bases de données disponibles:', databases.databases.map(db => db.name));
      
      // Tester avec la base planifyvrai
      const db = client.db('planifyvrai');
      const usersCollection = db.collection('users');
      
      // Compter les utilisateurs
      const userCount = await usersCollection.countDocuments();
      console.log(`👥 Nombre d'utilisateurs: ${userCount}`);
      
      // Lister quelques utilisateurs
      const users = await usersCollection.find({}).limit(5).toArray();
      const userList = users.map(user => ({
        username: user.username,
        role: user.role,
        hasSecretQuestions: user.secretQuestions ? user.secretQuestions.length : 0
      }));
      
      // Tester la recherche de SergeA1
      const sergeA1 = await usersCollection.findOne({ username: 'SergeA1' });
      
      await client.close();
      console.log('📡 Connexion MongoDB fermée');
      
      res.status(200).json({
        success: true,
        message: 'Test MongoDB réussi',
        databases: databases.databases.map(db => db.name),
        userCount: userCount,
        users: userList,
        sergeA1Found: !!sergeA1,
        sergeA1Details: sergeA1 ? {
          username: sergeA1.username,
          role: sergeA1.role,
          secretQuestionsCount: sergeA1.secretQuestions ? sergeA1.secretQuestions.length : 0
        } : null
      });
      
    } catch (error) {
      console.error('❌ Erreur test MongoDB:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du test MongoDB',
        error: error.message,
        env: Object.keys(process.env).filter(key => key.includes('MONGODB'))
      });
    }
  } else {
    res.status(405).json({
      success: false,
      message: 'Méthode non autorisée'
    });
  }
}
