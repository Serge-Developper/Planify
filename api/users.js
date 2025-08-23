import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const app = express();

// Middleware CORS
app.use((req, res, next) => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['https://planify-snowy.vercel.app'];
  const origin = req.headers.origin;
  
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

app.use(express.json({ limit: '35mb' }));
app.use(express.urlencoded({ limit: '35mb', extended: true }));

// Modèle User
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  coins: {
    type: Number,
    default: 0
  },
  avatar: {
    type: String,
    default: null
  },
  inventory: [{
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item'
    },
    equipped: {
      type: Boolean,
      default: false
    },
    equippedSlot: {
      type: String,
      enum: ['avatar', 'border', 'background'],
      default: 'avatar'
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  secretQuestions: [{
    question: {
      type: String,
      required: true
    },
    answer: {
      type: String,
      required: true
    }
  }]
});

const User = mongoose.model('User', userSchema);

// Connexion à MongoDB
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('MONGODB_URI manquante');
      return;
    }
    
    await mongoose.connect(mongoUri);
    console.log('Connecté à MongoDB');
  } catch (err) {
    console.error('Erreur MongoDB :', err);
  }
};

// GET /api/users/leaderboard
app.get('/leaderboard', async (req, res) => {
  try {
    await connectDB();
    const users = await User.find({}, 'username coins avatar')
      .sort({ coins: -1 })
      .limit(10);
    
    res.json({
      success: true,
      users: users.map(user => ({
        id: user._id,
        username: user.username,
        coins: user.coins,
        avatar: user.avatar
      }))
    });
  } catch (error) {
    console.error('Erreur leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// Also respond on root (mounted function) with leaderboard data
app.get('/', async (req, res) => {
  try {
    await connectDB();
    const users = await User.find({}, 'username coins avatar')
      .sort({ coins: -1 })
      .limit(10);
    res.json({
      success: true,
      users: users.map(user => ({
        id: user._id,
        username: user.username,
        coins: user.coins,
        avatar: user.avatar
      }))
    });
  } catch (error) {
    console.error('Erreur users root:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// And support explicit path (in case function mounted at root)
app.get('/api/users', async (req, res) => {
  try {
    await connectDB();
    const users = await User.find({}, 'username coins avatar')
      .sort({ coins: -1 })
      .limit(10);
    res.json({
      success: true,
      users: users.map(user => ({
        id: user._id,
        username: user.username,
        coins: user.coins,
        avatar: user.avatar
      }))
    });
  } catch (error) {
    console.error('Erreur users explicit:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Récupérer les questions secrètes d'un utilisateur
app.post('/forgot-password/questions', async (req, res) => {
  const { username } = req.body;
  
  try {
    await connectDB();
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Si l'utilisateur n'a pas encore de questions secrètes, on en crée par défaut
    if (!user.secretQuestions || user.secretQuestions.length === 0) {
      const defaultQuestions = [
        { question: "Quel est le nom de votre premier animal ?", answer: "default" },
        { question: "Quel est le prénom de votre mère ?", answer: "default" },
        { question: "Quelle est votre ville de naissance ?", answer: "default" }
      ];
      
      user.secretQuestions = defaultQuestions;
      await user.save();
    }

    // Retourner seulement les questions (pas les réponses)
    const questions = user.secretQuestions.map(q => ({ question: q.question }));
    res.json({ questions });
  } catch (error) {
    console.error('Erreur lors de la récupération des questions:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Vérifier les réponses aux questions secrètes
app.post('/forgot-password/verify', async (req, res) => {
  const { username, answers } = req.body;
  
  try {
    await connectDB();
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    if (!user.secretQuestions || user.secretQuestions.length === 0) {
      return res.status(400).json({ message: 'Aucune question secrète configurée' });
    }

    // Vérifier les réponses
    const isCorrect = user.secretQuestions.every((q, index) => {
      const expectedAnswer = q.answer.toLowerCase().trim();
      const providedAnswer = answers[index].toLowerCase().trim();
      return expectedAnswer === providedAnswer;
    });

    if (isCorrect) {
      res.json({ success: true, message: 'Réponses correctes' });
    } else {
      res.json({ success: false, message: 'Réponses incorrectes' });
    }
  } catch (error) {
    console.error('Erreur lors de la vérification:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Réinitialiser le mot de passe
app.post('/forgot-password/reset', async (req, res) => {
  const { username, newPassword } = req.body;
  
  if (!username || !newPassword) {
    return res.status(400).json({ message: 'Nom d\'utilisateur et nouveau mot de passe requis' });
  }
  
  if (newPassword.length < 8) {
    return res.status(400).json({ message: 'Le nouveau mot de passe doit contenir au moins 8 caractères' });
  }
  
  try {
    await connectDB();
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Hasher le nouveau mot de passe
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    user.password = hashedPassword;
    await user.save();

    res.json({ success: true, message: 'Mot de passe mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur lors de la réinitialisation:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Routes alternatives avec tirets (pour compatibilité frontend)
app.post('/forgot-password-questions', async (req, res) => {
  const { username } = req.body;
  
  try {
    await connectDB();
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Si l'utilisateur n'a pas encore de questions secrètes, on en crée par défaut
    if (!user.secretQuestions || user.secretQuestions.length === 0) {
      const defaultQuestions = [
        { question: "Quel est le nom de votre premier animal ?", answer: "default" },
        { question: "Quel est le prénom de votre mère ?", answer: "default" },
        { question: "Quelle est votre ville de naissance ?", answer: "default" }
      ];
      
      user.secretQuestions = defaultQuestions;
      await user.save();
    }

    // Retourner seulement les questions (pas les réponses)
    const questions = user.secretQuestions.map(q => ({ question: q.question }));
    res.json({ questions });
  } catch (error) {
    console.error('Erreur lors de la récupération des questions:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Routes avec préfixe /users/ (pour correspondre aux appels frontend)
app.post('/users/forgot-password/questions', async (req, res) => {
  const { username } = req.body;
  
  try {
    await connectDB();
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Si l'utilisateur n'a pas encore de questions secrètes, on en crée par défaut
    if (!user.secretQuestions || user.secretQuestions.length === 0) {
      const defaultQuestions = [
        { question: "Quel est le nom de votre premier animal ?", answer: "default" },
        { question: "Quel est le prénom de votre mère ?", answer: "default" },
        { question: "Quelle est votre ville de naissance ?", answer: "default" }
      ];
      
      user.secretQuestions = defaultQuestions;
      await user.save();
    }

    // Retourner seulement les questions (pas les réponses)
    const questions = user.secretQuestions.map(q => ({ question: q.question }));
    res.json({ questions });
  } catch (error) {
    console.error('Erreur lors de la récupération des questions:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.post('/users/forgot-password/verify', async (req, res) => {
  const { username, answers } = req.body;
  
  try {
    await connectDB();
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    if (!user.secretQuestions || user.secretQuestions.length === 0) {
      return res.status(400).json({ message: 'Aucune question secrète configurée' });
    }

    // Vérifier les réponses
    const isCorrect = user.secretQuestions.every((q, index) => {
      const expectedAnswer = q.answer.toLowerCase().trim();
      const providedAnswer = answers[index].toLowerCase().trim();
      return expectedAnswer === providedAnswer;
    });

    if (isCorrect) {
      res.json({ success: true, message: 'Réponses correctes' });
    } else {
      res.json({ success: false, message: 'Réponses incorrectes' });
    }
  } catch (error) {
    console.error('Erreur lors de la vérification:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.post('/users/forgot-password/reset', async (req, res) => {
  const { username, newPassword } = req.body;
  
  if (!username || !newPassword) {
    return res.status(400).json({ message: 'Nom d\'utilisateur et nouveau mot de passe requis' });
  }
  
  if (newPassword.length < 8) {
    return res.status(400).json({ message: 'Le nouveau mot de passe doit contenir au moins 8 caractères' });
  }
  
  try {
    await connectDB();
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Hasher le nouveau mot de passe
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    user.password = hashedPassword;
    await user.save();

    res.json({ success: true, message: 'Mot de passe mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur lors de la réinitialisation:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.post('/forgot-password-reset', async (req, res) => {
  const { username, newPassword } = req.body;
  
  if (!username || !newPassword) {
    return res.status(400).json({ message: 'Nom d\'utilisateur et nouveau mot de passe requis' });
  }
  
  if (newPassword.length < 8) {
    return res.status(400).json({ message: 'Le nouveau mot de passe doit contenir au moins 8 caractères' });
  }
  
  try {
    await connectDB();
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Hasher le nouveau mot de passe
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    user.password = hashedPassword;
    await user.save();

    res.json({ success: true, message: 'Mot de passe mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur lors de la réinitialisation:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.post('/forgot-password-verify', async (req, res) => {
  const { username, answers } = req.body;
  
  try {
    await connectDB();
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    if (!user.secretQuestions || user.secretQuestions.length === 0) {
      return res.status(400).json({ message: 'Aucune question secrète configurée' });
    }

    // Vérifier les réponses
    const isCorrect = user.secretQuestions.every((q, index) => {
      const expectedAnswer = q.answer.toLowerCase().trim();
      const providedAnswer = answers[index].toLowerCase().trim();
      return expectedAnswer === providedAnswer;
    });

    if (isCorrect) {
      res.json({ success: true, message: 'Réponses correctes' });
    } else {
      res.json({ success: false, message: 'Réponses incorrectes' });
    }
  } catch (error) {
    console.error('Erreur lors de la vérification:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

export default app;
// Force redeploy
