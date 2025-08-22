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
      const { username, password } = req.body;
      
      // Debug: Log les variables d'environnement
      console.log('🔍 Debug - Variables d\'environnement:');
      console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
      console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
      
      // Validate input
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Nom d\'utilisateur et mot de passe requis'
        });
      }
      
      // Test simple sans MongoDB pour l'instant
      res.status(200).json({
        success: true,
        message: 'Debug: API fonctionne',
        user: {
          username: username,
          role: 'debug',
          hasSecretQuestions: false
        },
        token: 'debug-token'
      });
      
    } catch (error) {
      console.error('Erreur connexion:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la connexion',
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
