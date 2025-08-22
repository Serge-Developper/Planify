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
      
      // Base de données simulée avec tous vos vrais utilisateurs
      const usersDatabase = {
        "SergeA'1": {
          _id: '687fc4a170b7c6754e20d097',
          username: "SergeA'1",
          password: 'admin', // Mot de passe en clair pour le test
          role: 'eleve',
          groupe: 'A',
          year: 'BUT1',
          coins: 185,
          secretQuestions: [
            { question: "Quel est le nom de votre premier animal ?", answer: "admin" },
            { question: "Quel est le prénom de votre mère ?", answer: "admin" },
            { question: "Quelle est votre ville de naissance ?", answer: "admin" }
          ]
        },
        "SergeA\"1": {
          _id: '687fc4b170b7c6754e20d09e',
          username: "SergeA\"1",
          password: 'admin',
          role: 'eleve',
          groupe: 'A',
          year: 'BUT1',
          coins: 54,
          secretQuestions: []
        },
        "MaximeB1": {
          _id: '687fc4bb70b7c6754e20d0a5',
          username: "MaximeB1",
          password: 'admin',
          role: 'eleve',
          groupe: 'B',
          year: 'BUT1',
          coins: 10064,
          secretQuestions: []
        },
        "MaximeB'1": {
          _id: '687fc4ce70b7c6754e20d0ac',
          username: "MaximeB'1",
          password: 'admin',
          role: 'eleve',
          groupe: 'B\'',
          year: 'BUT1',
          coins: 20,
          secretQuestions: []
        },
        "MaximeB\"1": {
          _id: '687fc4d970b7c6754e20d0b7',
          username: "MaximeB\"1",
          password: 'admin',
          role: 'eleve',
          groupe: 'B"',
          year: 'BUT1',
          coins: 4550,
          secretQuestions: []
        },
        "SergeA2": {
          _id: '687fc4ee70b7c6754e20d0be',
          username: "SergeA2",
          password: 'admin',
          role: 'eleve',
          groupe: 'A',
          year: 'BUT2',
          coins: 820,
          secretQuestions: []
        },
        "SergeA'2": {
          _id: '687fc4f870b7c6754e20d0c5',
          username: "SergeA'2",
          password: 'admin',
          role: 'eleve',
          groupe: 'A\'',
          year: 'BUT2',
          coins: 10,
          secretQuestions: []
        },
        "SergeA\"2": {
          _id: '687fc50b70b7c6754e20d0cc',
          username: "SergeA\"2",
          password: 'admin',
          role: 'eleve',
          groupe: 'A"',
          year: 'BUT2',
          coins: 90,
          secretQuestions: []
        },
        "MaximeB2": {
          _id: '687fc51470b7c6754e20d0d3',
          username: "MaximeB2",
          password: 'admin',
          role: 'eleve',
          groupe: 'B',
          year: 'BUT2',
          coins: 30,
          secretQuestions: []
        },
        "MaximeB'2": {
          _id: '687fc51e70b7c6754e20d0da',
          username: "MaximeB'2",
          password: 'admin',
          role: 'eleve',
          groupe: 'B\'',
          year: 'BUT2',
          coins: 110,
          secretQuestions: []
        },
        "MaximeB\"2": {
          _id: '687fc53170b7c6754e20d0e5',
          username: "MaximeB\"2",
          password: 'admin',
          role: 'eleve',
          groupe: 'B"',
          year: 'BUT2',
          coins: 220,
          secretQuestions: []
        },
        "SergeA3": {
          _id: '687fc54970b7c6754e20d0ec',
          username: "SergeA3",
          password: 'admin',
          role: 'eleve',
          groupe: 'A',
          year: 'BUT3',
          coins: 40,
          secretQuestions: []
        },
        "SergeA'3": {
          _id: '687fc55570b7c6754e20d0f3',
          username: "SergeA'3",
          password: 'admin',
          role: 'eleve',
          groupe: 'A\'',
          year: 'BUT3',
          coins: 160,
          secretQuestions: []
        },
        "MaximeB3": {
          _id: '687fc56f70b7c6754e20d101',
          username: "MaximeB3",
          password: 'admin',
          role: 'eleve',
          groupe: 'B',
          year: 'BUT3',
          coins: 80,
          secretQuestions: []
        },
        "MaximeB'3": {
          _id: '687fc57870b7c6754e20d108',
          username: "MaximeB'3",
          password: 'admin',
          role: 'eleve',
          groupe: 'B\'',
          year: 'BUT3',
          coins: 25,
          secretQuestions: []
        },
        "MaximeB\"3": {
          _id: '687fc58c70b7c6754e20d10f',
          username: "MaximeB\"3",
          password: 'admin',
          role: 'eleve',
          groupe: 'B"',
          year: 'BUT3',
          coins: 10,
          secretQuestions: []
        },
        "delegueA1": {
          _id: '687fc5a770b7c6754e20d116',
          username: "delegueA1",
          password: 'admin',
          role: 'delegue',
          groupe: 'A',
          year: 'BUT1',
          coins: 30,
          secretQuestions: []
        },
        "delegueA'1": {
          _id: '687fc5af70b7c6754e20d11d',
          username: "delegueA'1",
          password: 'admin',
          role: 'delegue',
          groupe: 'A\'',
          year: 'BUT1',
          coins: 100,
          secretQuestions: []
        }
      };
      
      // Vérifier si l'utilisateur existe
      const user = usersDatabase[username];
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Nom d\'utilisateur ou mot de passe incorrect'
        });
      }
      
      // Vérifier le mot de passe
      if (password !== user.password) {
        return res.status(401).json({
          success: false,
          message: 'Nom d\'utilisateur ou mot de passe incorrect'
        });
      }
      
      // Vérifier les questions secrètes
      const hasSecretQuestions = user.secretQuestions && Array.isArray(user.secretQuestions) && user.secretQuestions.length > 0;
      
      res.status(200).json({
        success: true,
        message: 'Connexion réussie',
        user: {
          id: user._id,
          username: user.username,
          role: user.role,
          groupe: user.groupe,
          coins: user.coins,
          hasSecretQuestions: hasSecretQuestions
        },
        token: 'mock-jwt-token-for-testing'
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

