const mongoose = require('mongoose');
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
  purchasedItems: [{
    itemId: { type: Number, required: true },
    itemName: { type: String, required: true },
    purchaseDate: { type: Date, default: Date.now },
    equipped: { type: Boolean, default: false },
    adminMessage: { type: String, default: null }
  }],
  equippedItemId: { type: Number, default: null },
  completedTasks: { type: Number, default: 0 },
  lastSpinDate: { type: Date, default: null },
  selectedBorderColor: { type: String, default: 'default' }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

// JWT verification
const verifyToken = (event) => {
  const authHeader = event.headers.authorization || event.headers.Authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  
  if (!token) {
    throw new Error('Token manquant');
  }
  
  return jwt.verify(token, process.env.JWT_SECRET, {
    issuer: process.env.JWT_ISSUER || 'planify-api',
    audience: process.env.JWT_AUDIENCE || 'planify-frontend'
  });
};
exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    if (event.httpMethod !== 'GET') {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ success: false, message: 'Méthode non autorisée' })
      };
    }

    const user = verifyToken(event);
    const userIdString = user.id || user._id;
    
    if (!userIdString || !mongoose.Types.ObjectId.isValid(userIdString)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, message: 'UserId invalide' })
      };
    }

    await connectDB();
    const userDoc = await User.findById(userIdString);
    
    if (!userDoc) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ success: false, message: 'Utilisateur non trouvé' })
      };
    }

    // Check if user can spin today
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastSpinDate = userDoc.lastSpinDate ? new Date(userDoc.lastSpinDate) : null;
    const canSpin = !lastSpinDate || lastSpinDate < todayStart;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        canSpin: canSpin,
        lastSpinDate: lastSpinDate
      })
    };
    
  } catch (authError) {
    console.error('❌ Erreur auth spin-status:', authError.message);
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ success: false, message: 'Non autorisé' })
    };
  } catch (error) {
    console.error('❌ Erreur spin-status:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        message: 'Erreur serveur',
        error: error.message 
      })
    };
  }
};