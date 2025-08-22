export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
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
      
      // For now, return a simple response
      // Later we'll add MongoDB connection and real authentication
      res.status(200).json({
        success: true,
        message: 'Connexion réussie',
        user: {
          username: username,
          role: 'user',
          coins: 100
        },
        token: 'fake-jwt-token-for-now'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la connexion'
      });
    }
  } else {
    res.status(405).json({
      success: false,
      message: 'Méthode non autorisée'
    });
  }
}

