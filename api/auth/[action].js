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
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
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

module.exports = async (req, res) => {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await connectDB();

    // Extract action from Vercel dynamic route parameter
    const { action } = req.query;

    // LOGIN
    if (action === 'login' && req.method === 'POST') {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Nom d\'utilisateur et mot de passe requis' });
      }

      const user = await User.findOne({ username });
      if (!user) {
        return res.status(401).json({ error: 'Identifiants invalides' });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Identifiants invalides' });
      }

      const token = jwt.sign(
        { 
          id: user._id, 
          username: user.username, 
          role: user.role,
          year: user.year,
          groupe: user.groupe
        },
        process.env.JWT_SECRET,
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

      return res.status(200).json({
        _id: user._id,
        username: user.username,
        role: user.role,
        groupe: user.groupe,
        year: user.year,
        token: token,
        hasSecretQuestions: hasSecretQuestions
      });
    }

    // REGISTER
    if (action === 'register' && req.method === 'POST') {
      const { username, email, password } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({ 
          success: false, 
          message: 'Nom d\'utilisateur, email et mot de passe requis' 
        });
      }

      if (password.length < 6) {
        return res.status(400).json({ 
          success: false, 
          message: 'Le mot de passe doit contenir au moins 6 caractères' 
        });
      }

      const existingUser = await User.findOne({ 
        $or: [{ username }, { email }] 
      });

      if (existingUser) {
        return res.status(409).json({ 
          success: false, 
          message: 'Nom d\'utilisateur ou email déjà utilisé' 
        });
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

      return res.status(201).json({
        success: true,
        message: 'Utilisateur créé avec succès',
        user: userWithoutPassword
      });
    }

    // FORGOT PASSWORD QUESTIONS
    if (action === 'forgot-password-questions' && req.method === 'POST') {
      const { username } = req.body;

      if (!username) {
        return res.status(400).json({ error: 'Nom d\'utilisateur requis' });
      }

      const user = await User.findOne({ username });
      if (!user) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }

      const questions = user.secretQuestions && user.secretQuestions.length > 0 
        ? user.secretQuestions.map(sq => ({ question: sq.question }))
        : getDefaultQuestions();

      return res.status(200).json({
        success: true,
        questions: questions
      });
    }

    // FORGOT PASSWORD VERIFY
    if (action === 'forgot-password-verify' && req.method === 'POST') {
      const { username, answers } = req.body;

      if (!username || !answers || !Array.isArray(answers)) {
        return res.status(400).json({ error: 'Nom d\'utilisateur et réponses requis' });
      }

      const user = await User.findOne({ username });
      if (!user) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }

      const userQuestions = user.secretQuestions && user.secretQuestions.length > 0 
        ? user.secretQuestions 
        : getDefaultQuestions();

      if (answers.length !== userQuestions.length) {
        return res.status(400).json({ error: 'Nombre de réponses incorrect' });
      }

      // For default questions, accept any answer (fallback)
      const isValid = userQuestions.length === 3 && userQuestions[0].answer === ""
        ? true // Default questions - always valid for fallback
        : answers.every((answer, index) => {
            const expectedAnswer = userQuestions[index]?.answer?.toLowerCase();
            return expectedAnswer && answer.toLowerCase() === expectedAnswer;
          });

      if (!isValid) {
        return res.status(400).json({ error: 'Réponses incorrectes' });
      }

      return res.status(200).json({
        success: true,
        message: 'Réponses correctes'
      });
    }

    // FORGOT PASSWORD RESET
    if (action === 'forgot-password-reset' && req.method === 'POST') {
      const { username, newPassword } = req.body;

      if (!username || !newPassword) {
        return res.status(400).json({ error: 'Nom d\'utilisateur et nouveau mot de passe requis' });
      }

      const user = await User.findOne({ username });
      if (!user) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }

      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      await User.findByIdAndUpdate(user._id, { 
        password: hashedPassword 
      });

      return res.status(200).json({ 
        success: true,
        message: 'Mot de passe réinitialisé avec succès' 
      });
    }

    return res.status(404).json({ error: 'Route non trouvée' });

  } catch (error) {
    console.error('Erreur API auth:', error);
    res.status(500).json({ error: 'Erreur serveur interne' });
  }
};