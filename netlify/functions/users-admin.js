const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

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
  inventory: [{
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
    equipped: { type: Boolean, default: false },
    equippedSlot: { type: String, enum: ['avatar', 'border', 'background'], default: 'avatar' }
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

// JWT verification with admin check
const verifyToken = (req, requireAdmin = false) => {
  const authHeader = event.headers.authorization;
  if (!authHeader) {
    throw new Error('Token manquant');
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    throw new Error('Token manquant');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'planify-api',
      audience: 'planify-frontend'
    });
    console.log('🔍 Token décodé:', { username: decoded.username, role: decoded.role, requireAdmin });
    
    if (requireAdmin && decoded.role !== 'admin') {
      console.log('❌ Accès refusé: rôle', decoded.role, 'mais admin requis');
      throw new Error('Accès admin requis');
    }
    return decoded;
  } catch (error) {
    console.log('❌ Erreur token:', error.message);
    throw new Error('Token invalide ou accès insuffisant');
  }
};

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

    // GET /api/users-admin - Get all users or specific user (admin only)
    if (event.httpMethod === 'GET') {
      try {
        const user = verifyToken(req, true); // Require admin

        // Check for userId query param
        const url = new URL(event.path, 'http://localhost');
        const userId = url.searchParams.get('userId');

        if (userId) {
          // Get specific user
          const targetUser = await User.findById(userId, '-password');
          if (!targetUser) {
            return { statusCode: 404, headers, body: JSON.stringify({ error: 'Utilisateur non trouvé' }) };
          }
          
          return { statusCode: 200, headers, body: JSON.stringify({
            success: true,
            user: targetUser
          }) };
        } else {
          // Get all users
          const users = await User.find({}, '-password').sort({ createdAt: -1 });
          
          return { statusCode: 200, headers, body: JSON.stringify({
            success: true,
            users: users
          }) };
        }
      } catch (authError) {
        return { statusCode: 401, headers, body: JSON.stringify({ error: 'Non autorisé' }) };
      }
    }

    // POST /api/users-admin - Admin operations on users
    if (event.httpMethod === 'POST') {
      try {
        const user = verifyToken(req, true); // Require admin
        const { action, userId, ...data } = JSON.parse(event.body || '{}');

        if (!action || !userId) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'Action et userId requis' }) };
        }

        const targetUser = await User.findById(userId);
        if (!targetUser) {
          return { statusCode: 404, headers, body: JSON.stringify({ error: 'Utilisateur non trouvé' }) };
        }

        switch (action) {
          case 'give-item':
            const { itemId } = data;
            if (!itemId) {
              return { statusCode: 400, headers, body: JSON.stringify({ error: 'ItemId requis' }) };
            }

            if (!targetUser.purchasedItems.includes(itemId)) {
              targetUser.purchasedItems.push(itemId);
              await targetUser.save();
            }

            return { statusCode: 200, headers, body: JSON.stringify({
              success: true,
              message: 'Item donné avec succès',
              user: { ...targetUser.toObject(), password: undefined }
            }) };

          case 'remove-item':
            const { itemId: removeItemId } = data;
            if (!removeItemId) {
              return { statusCode: 400, headers, body: JSON.stringify({ error: 'ItemId requis' }) };
            }

            targetUser.purchasedItems = targetUser.purchasedItems.filter(id => id !== removeItemId);
            if (targetUser.equippedItemId === removeItemId) {
              targetUser.equippedItemId = 0; // Reset to default
            }
            await targetUser.save();

            return { statusCode: 200, headers, body: JSON.stringify({
              success: true,
              message: 'Item retiré avec succès',
              user: { ...targetUser.toObject(), password: undefined }
            }) };

          case 'update-coins':
            const { coins } = data;
            if (typeof coins !== 'number') {
              return { statusCode: 400, headers, body: JSON.stringify({ error: 'Nombre de coins requis' }) };
            }

            targetUser.coins = Math.max(0, coins);
            await targetUser.save();

            return { statusCode: 200, headers, body: JSON.stringify({
              success: true,
              message: 'Coins mis à jour',
              user: { ...targetUser.toObject(), password: undefined }
            }) };

          case 'update-role':
            const { role } = data;
            if (!role || !['admin', 'prof', 'delegue', 'eleve', 'etudiant'].includes(role)) {
              return { statusCode: 400, headers, body: JSON.stringify({ error: 'Rôle valide requis (admin/prof/delegue/eleve/etudiant)' }) };
            }

            targetUser.role = role;
            await targetUser.save();

            return { statusCode: 200, headers, body: JSON.stringify({
              success: true,
              message: 'Rôle mis à jour',
              user: { ...targetUser.toObject(), password: undefined }
            }) };

          case 'reset-password':
            const { newPassword } = data;
            if (!newPassword || newPassword.length < 6) {
              return { statusCode: 400, headers, body: JSON.stringify({ error: 'Mot de passe valide requis (6+ caractères)' }) };
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            targetUser.password = hashedPassword;
            await targetUser.save();

            return { statusCode: 200, headers, body: JSON.stringify({
              success: true,
              message: 'Mot de passe réinitialisé'
            }) };

          case 'clear-all-items':
            // Clear all items and reset border color
            targetUser.purchasedItems = [];
            targetUser.equippedItemId = null;
            // Reset any border color related fields if they exist
            await targetUser.save();

            return { statusCode: 200, headers, body: JSON.stringify({
              success: true,
              message: 'Tous les items supprimés et couleur de bordure réinitialisée',
              user: { ...targetUser.toObject(), password: undefined }
            }) };

          default:
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Action non supportée' }) };
        }
      } catch (authError) {
        return { statusCode: 401, headers, body: JSON.stringify({ error: 'Non autorisé' }) };
      }
    }

    // PUT /api/users-admin - Update user (admin only)
    if (event.httpMethod === 'PUT') {
      try {
        const user = verifyToken(req, true); // Require admin
        
        // Get userId from query params or body
        const url = new URL(event.path, 'http://localhost');
        const userIdFromQuery = url.searchParams.get('userId');
        const { userId: userIdFromBody, username, email, coins, role } = JSON.parse(event.body || '{}');
        const userId = userIdFromQuery || userIdFromBody;

        if (!userId) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'UserId requis' }) };
        }

        const targetUser = await User.findById(userId);
        if (!targetUser) {
          return { statusCode: 404, headers, body: JSON.stringify({ error: 'Utilisateur non trouvé' }) };
        }

        // Update fields if provided
        if (username) targetUser.username = username;
        if (email) targetUser.email = email;
        if (typeof coins === 'number') targetUser.coins = Math.max(0, coins);
        if (role && ['user', 'admin'].includes(role)) targetUser.role = role;

        await targetUser.save();

        return { statusCode: 200, headers, body: JSON.stringify({
          success: true,
          message: 'Utilisateur mis à jour',
          user: { ...targetUser.toObject(), password: undefined }
        }) };
      } catch (authError) {
        return { statusCode: 401, headers, body: JSON.stringify({ error: 'Non autorisé' }) };
      }
    }

    // DELETE /api/users-admin - Delete user (admin only)
    if (event.httpMethod === 'DELETE') {
      try {
        const user = verifyToken(req, true); // Require admin
        
        // Get userId from query params or body
        const url = new URL(event.path, 'http://localhost');
        const userId = url.searchParams.get('userId') || JSON.parse(event.body || '{}')?.userId;

        if (!userId) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'UserId requis' }) };
        }

        const deletedUser = await User.findByIdAndDelete(userId);
        if (!deletedUser) {
          return { statusCode: 404, headers, body: JSON.stringify({ error: 'Utilisateur non trouvé' }) };
        }

        return { statusCode: 200, headers, body: JSON.stringify({
          success: true,
          message: 'Utilisateur supprimé'
        }) };
      } catch (authError) {
        return { statusCode: 401, headers, body: JSON.stringify({ error: 'Non autorisé' }) };
      }
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Méthode non autorisée' }) };

  } catch (error) {
    console.error('Erreur API users-admin:', error);
    res.status(500).json({ error: 'Erreur serveur interne' });
  }
};