const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Modèle User pour l'authentification - Version corrigée pour questions secrètes
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: false, unique: false },
  role: { type: String, default: 'user' },
  year: String,
  groupe: String,
  coins: { type: Number, default: 0 },
  avatar: {
    filename: String,
    mimetype: String,
    data: String, // base64
    size: Number
  },
  avatarFilename: String, // pour compatibilité avec l'ancien format
  purchasedItems: [{
    itemId: Number,
    itemName: String,
    price: Number,
    purchaseDate: { type: Date, default: Date.now }
  }],
  equippedItemId: Number,
  selectedBorderColor: { type: String, default: 'default' },
  lastSpinDate: Date,
  spinCount: { type: Number, default: 0 },
  weeklySpinCount: { type: Number, default: 0 },
  lastWeeklyReset: Date,
  secretQuestions: [{
    question: String,
    answer: String
  }],
  hasSecretQuestions: { type: Boolean, default: false }
});

const User = mongoose.model('User', userSchema);

// Configuration CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

// Forgot password: récupérer les questions secrètes
const handleForgotQuestions = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { username } = body;
    if (!username) {
      return { statusCode: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ success:false, message:'Identifiant requis' }) };
    }
    const user = await User.findOne({ username });
    if (!user) {
      return { statusCode: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ success:false, message:'Utilisateur introuvable' }) };
    }
    const questions = Array.isArray(user.secretQuestions) ? user.secretQuestions.filter(q => q && q.question).map(q => ({ question: q.question })) : [];
    if (questions.length === 0) {
      return { statusCode: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ success:false, message:'Aucune question secrète définie' }) };
    }
    return { statusCode: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ success:true, questions }) };
  } catch (e) {
    return { statusCode: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ success:false, message:'Erreur serveur' }) };
  }
};

// Forgot password: vérifier les réponses
const handleForgotVerify = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { username, answers } = body;
    if (!username || !Array.isArray(answers)) {
      return { statusCode: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ success:false, message:'Paramètres manquants' }) };
    }
    const user = await User.findOne({ username });
    if (!user) {
      return { statusCode: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ success:false, message:'Utilisateur introuvable' }) };
    }
    const q = Array.isArray(user.secretQuestions) ? user.secretQuestions : [];
    if (q.length === 0) {
      return { statusCode: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ success:false, message:'Aucune question secrète définie' }) };
    }
    const normalize = (s) => String(s || '').trim().toLowerCase();
    const ok = q.length === answers.length && q.every((qq, i) => normalize(qq.answer) === normalize(answers[i]));
    if (!ok) {
      return { statusCode: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ success:false, message:'Réponses incorrectes' }) };
    }
    return { statusCode: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ success:true }) };
  } catch (e) {
    return { statusCode: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ success:false, message:'Erreur serveur' }) };
  }
};

// Forgot password: réinitialiser le mot de passe
const handleForgotReset = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { username, newPassword } = body;
    if (!username || !newPassword || String(newPassword).length < 8) {
      return { statusCode: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ success:false, message:'Paramètres invalides' }) };
    }
    const user = await User.findOne({ username });
    if (!user) {
      return { statusCode: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ success:false, message:'Utilisateur introuvable' }) };
    }
    const hashed = await bcrypt.hash(String(newPassword), 10);
    user.password = hashed;
    await user.save();
    return { statusCode: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ success:true, message:'Mot de passe réinitialisé' }) };
  } catch (e) {
    return { statusCode: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ success:false, message:'Erreur serveur' }) };
  }
};

// Handler pour le login
const handleLogin = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { username, password } = body;

    if (!username || !password) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          success: false, 
          message: 'Nom d\'utilisateur et mot de passe requis' 
        })
      };
    }

    // Rechercher l'utilisateur
    const user = await User.findOne({ username });
    if (!user) {
      return {
        statusCode: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          success: false, 
          message: 'Nom d\'utilisateur ou mot de passe incorrect' 
        })
      };
    }
    
    // Log pour débugger l'avatar
    console.log('🔍 Login - User avatar data:', {
      username: user.username,
      hasAvatar: !!user.avatar,
      avatarLength: user.avatar ? user.avatar.length : 0
    });

    // L'avatar est maintenant directement une data URL string
    const avatarUrl = user.avatar || null;

    // Vérifier le mot de passe
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return {
        statusCode: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          success: false, 
          message: 'Nom d\'utilisateur ou mot de passe incorrect' 
        })
      };
    }

    // Générer le token JWT
    const token = jwt.sign(
      { 
        id: user._id, 
        username: user.username, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
      { expiresIn: '7d' }
    );

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: 'Connexion réussie',
        token,
        user: {
          _id: user._id,
          id: user._id,
          username: user.username,
          // email supprimé
          role: user.role,
          year: user.year,
          groupe: user.groupe,
          coins: user.coins,
          avatar: avatarUrl,
          equippedItemId: user.equippedItemId ?? null,
          selectedBorderColor: user.selectedBorderColor || 'default',
          hasSecretQuestions: user.secretQuestions && user.secretQuestions.length >= 3 && user.secretQuestions.every(q => q.question && q.answer)
        }
      })
    };
  } catch (error) {
    console.error('Erreur login:', error);
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        success: false, 
        message: 'Erreur serveur interne' 
      })
    };
  }
};

// Handler pour l'inscription (email optionnel si créé par un admin/prof)
const handleRegister = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { username, email, password, year, groupe, role: requestedRole } = body;

    if (!username || !password) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          success: false, 
          message: 'Nom d\'utilisateur et mot de passe requis' 
        })
      };
    }

    // Tenter de décoder le token si fourni pour connaître le rôle du créateur
    let creatorRole = null;
    try {
      const authHeader = event.headers && (event.headers.authorization || event.headers.Authorization);
      if (authHeader) {
        const parts = String(authHeader).split(' ');
        const token = parts.length === 2 ? parts[1] : parts[0];
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production'
        );
        if (decoded && typeof decoded === 'object') creatorRole = decoded.role || null;
      }
    } catch {}

    // Vérifier si l'utilisateur existe déjà (par username uniquement)
    const existingUser = await User.findOne({ username });
    
    if (existingUser) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          success: false, 
          message: 'Nom d\'utilisateur ou email déjà utilisé' 
        })
      };
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer le nouvel utilisateur
    let roleToAssign = 'user';
    const allowedRoles = ['admin', 'prof', 'delegue', 'eleve', 'etudiant', 'user'];
    if (creatorRole === 'admin') {
      if (requestedRole && allowedRoles.includes(requestedRole)) roleToAssign = requestedRole;
    } else if (creatorRole === 'prof') {
      // Un prof peut créer uniquement des comptes eleve/delegue
      if (requestedRole && ['eleve', 'delegue'].includes(requestedRole)) roleToAssign = requestedRole; else roleToAssign = 'eleve';
    }

    const newUser = new User({
      username,
      // pas de champ email
      password: hashedPassword,
      year: year || '',
      groupe: groupe || '',
      coins: 1000, // Bonus de bienvenue
      role: roleToAssign
    });

    await newUser.save();

    // Générer le token JWT
    const token = jwt.sign(
      { 
        id: newUser._id, 
        username: newUser.username, 
        role: newUser.role 
      },
      process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
      { expiresIn: '7d' }
    );

    return {
      statusCode: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: 'Inscription réussie',
        token,
        user: {
          _id: newUser._id,
          id: newUser._id,
          username: newUser.username,
          // pas d'email renvoyé
          role: newUser.role,
          year: newUser.year,
          groupe: newUser.groupe,
          coins: newUser.coins,
          avatar: newUser.avatar,
          equippedItemId: newUser.equippedItemId ?? null,
          selectedBorderColor: newUser.selectedBorderColor || 'default',
          hasSecretQuestions: newUser.hasSecretQuestions
        }
      })
    };
  } catch (error) {
    console.error('Erreur register:', error);
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        success: false, 
        message: 'Erreur serveur interne' 
      })
    };
  }
};

// Handler pour vérifier le token
const handleVerifyToken = async (event) => {
  try {
    const authHeader = event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          success: false, 
          message: 'Token manquant' 
        })
      };
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production'
    );

    // Correction du typage de decoded pour supporter JwtPayload
    const userId = typeof decoded === 'string' ? decoded : decoded.id;
    const user = await User.findById(userId);
    if (!user) {
      return {
        statusCode: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          success: false, 
          message: 'Utilisateur non trouvé' 
        })
      };
    }
    
    // Log pour débugger l'avatar lors de la vérification
    console.log('🔍 Verify - User avatar data:', {
      userId: userId,
      username: user.username,
      hasAvatar: !!user.avatar,
      avatarLength: user.avatar ? user.avatar.length : 0
    });

    // L'avatar est maintenant directement une data URL string
    const avatarUrl = user.avatar || null;

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        user: {
          _id: user._id,
          id: user._id,
          username: user.username,
          // email supprimé
          role: user.role,
          year: user.year,
          groupe: user.groupe,
          coins: user.coins,
          avatar: avatarUrl,
          equippedItemId: user.equippedItemId ?? null,
          selectedBorderColor: user.selectedBorderColor || 'default',
          hasSecretQuestions: user.secretQuestions && user.secretQuestions.length >= 3 && user.secretQuestions.every(q => q.question && q.answer)
        }
      })
    };
  } catch (error) {
    return {
      statusCode: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        success: false, 
        message: 'Token invalide' 
      })
    };
  }
};

exports.handler = async (event, context) => {
  // Gérer les requêtes OPTIONS (preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || '', {
      bufferCommands: false
    });

    // Extraire le chemin de la requête
    const path = event.path || event.rawPath || '';
    const endpoint = path.replace('/api/auth/', '');

    // Router selon l'endpoint
    switch (endpoint) {
      case 'login':
        return await handleLogin(event);
      case 'register':
        return await handleRegister(event);
      case 'verify':
        return await handleVerifyToken(event);
      case 'forgot-password-questions':
        return await handleForgotQuestions(event);
      case 'forgot-password-verify':
        return await handleForgotVerify(event);
      case 'forgot-password-reset':
        return await handleForgotReset(event);
      default:
        return {
          statusCode: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            success: false, 
            message: 'Endpoint non trouvé' 
          })
        };
    }

  } catch (error) {
    console.error('❌ Erreur auth:', error);
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        message: 'Erreur serveur interne'
      })
    };
  } finally {
    // Fermer la connexion MongoDB
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  }
};
