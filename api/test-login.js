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
    
    console.log('🔍 Test login - Username:', username);
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Nom d\'utilisateur et mot de passe requis' });
    }

    // Test simple - accepter n'importe quelle connexion pour le test
    res.json({
      success: true,
      message: 'Test login réussi',
      user: {
        username: username,
        role: 'test',
        token: 'test-token-123'
      }
    });
  } catch (error) {
    console.error('Erreur test login:', error);
    res.status(500).json({ error: 'Erreur serveur interne' });
  }
}
