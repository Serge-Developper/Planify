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
      
      // Validate input
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Nom d\'utilisateur et mot de passe requis'
        });
      }
      
      // Simulation de la base de données pour l'utilisateur SergeA'1
      const mockUser = {
        _id: '687fc4a170b7c6754e20d097',
        username: "SergeA'1",
        password: '$2a$12$Hlbu36TC47RY12Jy5XPa.uHdW2xvXKsmp1l1WllXUKB4CjTH6R1YK', // admin
        role: 'eleve',
        groupe: 'A',
        coins: 10014,
        secretQuestions: [
          { question: "Quel est le nom de votre premier animal?", answer: "admin" },
          { question: "Quel est le prénom de votre mère?", answer: "admin" },
          { question: "Quelle est votre ville de naissance?", answer: "admin" }
        ]
      };
      
      // Vérifier si c'est l'utilisateur correct
      if (username === "SergeA'1" && password === "admin") {
        // Vérifier les questions secrètes
        const hasSecretQuestions = mockUser.secretQuestions && Array.isArray(mockUser.secretQuestions) && mockUser.secretQuestions.length > 0;
        
        res.status(200).json({
          success: true,
          message: 'Connexion réussie',
          user: {
            id: mockUser._id,
            username: mockUser.username,
            role: mockUser.role,
            groupe: mockUser.groupe,
            coins: mockUser.coins,
            hasSecretQuestions: hasSecretQuestions
          },
          token: 'mock-jwt-token-for-testing'
        });
      } else {
        // Rejeter les autres utilisateurs
        res.status(401).json({
          success: false,
          message: 'Nom d\'utilisateur ou mot de passe incorrect'
        });
      }
      
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

