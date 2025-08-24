const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// MongoDB connection
let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    return;
  }
  
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("La variable d'environnement MONGODB_URI n'est pas définie.");
    }
    await mongoose.connect(process.env.MONGODB_URI, {});
    isConnected = true;
  } catch (error) {
    console.error('Erreur de connexion MongoDB:', error);
    throw error;
  }
};

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  coins: { type: Number, default: 0 },
  avatar: { type: String, default: null },
  role: { type: String, enum: ['admin', 'prof', 'delegue', 'eleve', 'etudiant'], required: true },
  year: { type: String, enum: ['BUT1', 'BUT2', 'BUT3'], default: null },
  groupe: { type: String, enum: ['A', "A'", 'A2', 'B', "B'", 'B2', 'Promo'], default: null },
  secretQuestions: [{
    question: { type: String, required: true },
    answer: { type: String, required: true }
  }],
  purchasedItems: [{ type: Number }],
  equippedItemId: { type: Number, default: null }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

// CORS headers
const setCorsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

// Default secret questions
const getDefaultQuestions = () => [
  { question: "Quel est le nom de votre premier animal de compagnie ?", answer: "" },
  { question: "Dans quelle ville êtes-vous né(e) ?", answer: "" },
  { question: "Quel est le nom de votre école primaire ?", answer: "" }
];

exports.handler = async (event, context) => {
  // Headers pour CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };
  
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    await connectDB();

    // Extraire l'action depuis l'URL de la requête (Netlify : via event.queryStringParameters)
    const { action } = event.queryStringParameters || {};

    // LOGIN
    if (action === 'login' && event.httpMethod === 'POST') {
      const { username, password } = JSON.parse(event.body || '{}');

      if (!username || !password) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Nom d\'utilisateur et mot de passe requis' }) };
      }

      const user = await User.findOne({ username });
      if (!user) {
        return { statusCode: 401, headers, body: JSON.stringify({ error: 'Identifiants invalides' }) };
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return { statusCode: 401, headers, body: JSON.stringify({ error: 'Identifiants invalides' }) };
      }

      const token = jwt.sign(
        { 
          id: user._id, 
          username: user.username, 
          role: user.role,
          year: user.year,
          groupe: user.groupe
        },
        process.env.JWT_SECRET || '47313b08ce548d70a55502b72e7441428ab5a7e555eb44224f412bd34b793d44a33a69da07f65714dd5be733ccd08fb2',
        { 
          expiresIn: '24h',
          issuer: 'planify-api',
          audience: 'planify-frontend'
        }
      );

      const { password: _, ...userWithoutPassword } = user.toObject();
      
      // Vérifier si l'utilisateur a des questions secrètes configurées
      const hasSecretQuestions = user.secretQuestions && 
                                user.secretQuestions.length > 0 && 
                                user.secretQuestions.every(q => q.question && q.answer);

      return { statusCode: 200, headers, body: JSON.stringify({
        user: {
          _id: user._id,
          username: user.username,
          role: user.role,
          groupe: user.groupe,
          year: user.year,
          hasSecretQuestions: hasSecretQuestions
        },
        token: token
      }) };
    }

    // REGISTER
    if (action === 'register' && event.httpMethod === 'POST') {
      const { username, email, password } = JSON.parse(event.body || '{}');

      if (!username || !email || !password) {
        return { statusCode: 400, headers, body: JSON.stringify({ 
          success: false, 
          message: 'Nom d\'utilisateur, email et mot de passe requis' 
        }) };
      }

      if (password.length < 6) {
        return { statusCode: 400, headers, body: JSON.stringify({ 
          success: false, 
          message: 'Le mot de passe doit contenir au moins 6 caractères' 
        }) };
      }

      const existingUser = await User.findOne({ 
        $or: [{ username }, { email }] 
      });

      if (existingUser) {
        return { statusCode: 409, headers, body: JSON.stringify({ 
          success: false, 
          message: 'Nom d\'utilisateur ou email déjà utilisé' 
        }) };
      }

      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const newUser = new User({
        username,
        email,
        password: hashedPassword,
        coins: 100,
        purchasedItems: [0],
        equippedItemId: 0
      });

      const savedUser = await newUser.save();
      const { password: _, ...userWithoutPassword } = savedUser.toObject();

      return { statusCode: 201, headers, body: JSON.stringify({
        success: true,
        message: 'Utilisateur créé avec succès',
        user: userWithoutPassword
      }) };
    }

    // FORGOT PASSWORD QUESTIONS
    if (action === 'forgot-password-questions' && event.httpMethod === 'POST') {
      const { username } = JSON.parse(event.body || '{}');

      if (!username) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Nom d\'utilisateur requis' }) };
      }

      const user = await User.findOne({ username });
      if (!user) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Utilisateur non trouvé' }) };
      }

      const questions = user.secretQuestions && user.secretQuestions.length > 0 
        ? user.secretQuestions.map(sq => ({ question: sq.question }))
        : getDefaultQuestions();

      return { statusCode: 200, headers, body: JSON.stringify({
        success: true,
        questions: questions
      }) };
    }

    // FORGOT PASSWORD VERIFY
    if (action === 'forgot-password-verify' && event.httpMethod === 'POST') {
      const { username, answers } = JSON.parse(event.body || '{}');

      if (!username || !answers || !Array.isArray(answers)) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Nom d\'utilisateur et réponses requis' }) };
      }

      const user = await User.findOne({ username });
      if (!user) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Utilisateur non trouvé' }) };
      }

      const userQuestions = user.secretQuestions && user.secretQuestions.length > 0 
        ? user.secretQuestions 
        : getDefaultQuestions();

      if (answers.length !== userQuestions.length) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Nombre de réponses incorrect' }) };
      }

      // For default questions, accept any answer (fallback)
      const isValid = userQuestions.length === 3 && userQuestions[0].answer === ""
        ? true // Default questions - always valid for fallback
        : answers.every((answer, index) => {
            const expectedAnswer = userQuestions[index]?.answer?.toLowerCase();
            return expectedAnswer && answer.toLowerCase() === expectedAnswer;
          });

      if (!isValid) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Réponses incorrectes' }) };
      }

      return { statusCode: 200, headers, body: JSON.stringify({
        success: true,
        message: 'Réponses correctes'
      }) };
    }

    // FORGOT PASSWORD RESET
    if (action === 'forgot-password-reset' && event.httpMethod === 'POST') {
      const { username, newPassword } = JSON.parse(event.body || '{}');

      if (!username || !newPassword) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Nom d\'utilisateur et nouveau mot de passe requis' }) };
      }

      const user = await User.findOne({ username });
      if (!user) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Utilisateur non trouvé' }) };
      }

      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      await User.findByIdAndUpdate(user._id, { 
        password: hashedPassword 
      });

      return { statusCode: 200, headers, body: JSON.stringify({ 
        success: true,
        message: 'Mot de passe réinitialisé avec succès' 
      }) };
    }

    return { statusCode: 404, headers, body: JSON.stringify({ error: 'Route non trouvée' }) };

  } catch (error) {
    console.error('Erreur API auth:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Erreur serveur interne' })
    };
  }
};