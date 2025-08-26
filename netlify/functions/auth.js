const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Modèle User pour l'authentification - Version corrigée pour questions secrètes
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
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
      hasAvatar: !!user.avatar,
      hasAvatarData: !!(user.avatar && user.avatar.data),
      avatarType: user.avatar ? typeof user.avatar : 'undefined',
      avatarKeys: user.avatar && typeof user.avatar === 'object' ? Object.keys(user.avatar) : [],
      avatarFilename: user.avatarFilename,
      dataLength: user.avatar && user.avatar.data ? user.avatar.data.length : 0
    });

    // Construction correcte de l'avatar pour le retour
    let avatarUrl = null;
    if (user.avatar && typeof user.avatar === 'object' && user.avatar.data && user.avatar.mimetype) {
      // Format avec data et mimetype (nouveau format)
      avatarUrl = `data:${user.avatar.mimetype};base64,${user.avatar.data}`;
      console.log('✅ Avatar data URL construit depuis la DB (login):', avatarUrl.substring(0, 100) + '...');
    } else if (user.avatarFilename) {
      // Format avec filename seulement (fallback)
      avatarUrl = `/uploads/avatars/${user.avatarFilename}`;
      console.log('📁 Avatar filename utilisé (login):', user.avatarFilename);
    }

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
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          year: user.year,
          groupe: user.groupe,
          coins: user.coins,
          avatar: avatarUrl,
          avatarFilename: user.avatarFilename,
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

// Handler pour l'inscription
const handleRegister = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { username, email, password, year, groupe } = body;

    if (!username || !email || !password) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          success: false, 
          message: 'Tous les champs sont requis' 
        })
      };
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ 
      $or: [{ username }, { email }] 
    });
    
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
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      year: year || '',
      groupe: groupe || '',
      coins: 1000, // Bonus de bienvenue
      role: 'user'
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
          id: newUser._id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role,
          year: newUser.year,
          groupe: newUser.groupe,
          coins: newUser.coins,
          avatar: newUser.avatar,
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
      hasAvatar: !!user.avatar,
      hasAvatarData: !!(user.avatar && user.avatar.data),
      avatarType: user.avatar ? typeof user.avatar : 'undefined',
      avatarKeys: user.avatar && typeof user.avatar === 'object' ? Object.keys(user.avatar) : [],
      avatarFilename: user.avatarFilename,
      dataLength: user.avatar && user.avatar.data ? user.avatar.data.length : 0
    });

    // Construction correcte de l'avatar pour le retour
    let avatarUrl = null;
    if (user.avatar && typeof user.avatar === 'object' && user.avatar.data && user.avatar.mimetype) {
      // Format avec data et mimetype (nouveau format)
      avatarUrl = `data:${user.avatar.mimetype};base64,${user.avatar.data}`;
      console.log('✅ Avatar data URL construit depuis la DB:', avatarUrl.substring(0, 100) + '...');
    } else if (user.avatarFilename) {
      // Format avec filename seulement (fallback)
      avatarUrl = `/uploads/avatars/${user.avatarFilename}`;
      console.log('📁 Avatar filename utilisé:', user.avatarFilename);
    }

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          year: user.year,
          groupe: user.groupe,
          coins: user.coins,
          avatar: avatarUrl,
          avatarFilename: user.avatarFilename,
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
