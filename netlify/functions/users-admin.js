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
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI est manquant dans les variables d\'environnement');
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
  password: { type: String, required: true },
  coins: { type: Number, default: 0 },
  avatar: { type: String, default: null },
  role: { type: String, enum: ['admin', 'prof', 'delegue', 'eleve', 'etudiant'], required: true },
  year: { type: String, enum: ['BUT1', 'BUT2', 'BUT3', ''], default: '' },
  groupe: { type: String, enum: ['A', "A'", 'A2', 'B', "B'", 'B2', 'Promo', ''], default: '' },
  secretQuestions: [{
    question: { type: String, required: true },
    answer: { type: String, required: true }
  }],
  inventory: [{
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
    equipped: { type: Boolean, default: false },
    equippedSlot: { type: String, enum: ['avatar', 'border', 'background'], default: 'avatar' }
  }],
  // Accepter anciens formats (array de nombres) et nouveaux (objets)
  purchasedItems: { type: [mongoose.Schema.Types.Mixed], default: [] },
  equippedItemId: { type: Number, default: null },
  pendingGifts: [{
    id: { type: Number, required: true },
    name: { type: String, required: true },
    adminMessage: { type: String, default: null },
    date: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

// CORS headers
const setCorsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

// Vérification JWT avec contrôle admin (compatible auth.js)
const verifyToken = async (event, requireAdmin = false) => {
  // Accepter différents formats d'entête (Bearer <token> ou token brut)
  const authHeader = (event && event.headers && (event.headers.authorization || event.headers.Authorization)) || null;
  if (!authHeader) throw new Error('Token manquant');
  
  const parts = authHeader.split(' ');
  const token = parts.length === 2 ? parts[1] : parts[0];
  if (!token) throw new Error('Token manquant');

  try {
    const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
    const decoded = jwt.verify(token, secret);
    const payload = typeof decoded === 'object' && decoded !== null ? decoded : {};

    if (requireAdmin) {
      // Vérifier directement le rôle dans le payload
      if (payload.role === 'admin' || payload.role === 'prof') {
        return payload;
      }
      
      // Si pas de rôle dans le payload, vérifier en base
      const userId = payload.id || payload._id;
      if (!userId) throw new Error('Accès admin requis');
      
      const u = await User.findById(userId).lean();
      if (!u || (u.role !== 'admin' && u.role !== 'prof')) {
        throw new Error('Accès admin requis');
      }
      
      // Retourner le payload avec le rôle de la base
      return { ...payload, role: u.role };
    }
    
    return payload;
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
        const user = await verifyToken(event, true); // Require admin

        // Vérifier le paramètre userId dans la query string
        const url = new URL(event.rawUrl || `http://localhost${event.path}${event.queryStringParameters ? '?' + new URLSearchParams(event.queryStringParameters).toString() : ''}`);
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
        // Détail utile pour le front lors du debug
        return { statusCode: 401, headers, body: JSON.stringify({ error: 'Non autorisé' }) };
      }
    }

    // POST /api/users-admin - Admin operations on users
    if (event.httpMethod === 'POST') {
      try {
        const user = await verifyToken(event, true); // Require admin
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
            const { itemId, itemName, adminMessage } = data;
            if (!itemId) return { statusCode: 400, headers, body: JSON.stringify({ error: 'ItemId requis' }) };

            // Construire l'objet d'item enrichi
            const giftObj = { id: Number(itemId), itemId: Number(itemId), itemName: itemName || String(itemId), purchaseDate: new Date(), equipped: false };

            // Normaliser purchasedItems en tableau d'objets si besoin
            const list = Array.isArray(targetUser.purchasedItems) ? targetUser.purchasedItems : [];
            const alreadyHas = list.some((it) => (typeof it === 'object' && it && (it.id === Number(itemId) || it.itemId === Number(itemId))) || it === Number(itemId));
            if (!alreadyHas) {
              list.push(giftObj);
              targetUser.purchasedItems = list;
            }

            // Ajouter dans pendingGifts pour la popup
            if (!Array.isArray(targetUser.pendingGifts)) targetUser.pendingGifts = [];
            targetUser.pendingGifts.push({ id: giftObj.id, name: giftObj.itemName, adminMessage: adminMessage || null, date: new Date() });

            await targetUser.save();

            return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'Item donné avec succès', user: { ...targetUser.toObject(), password: undefined } }) };

          case 'remove-item':
            const { itemId: removeItemId } = data;
            if (!removeItemId) {
              return { statusCode: 400, headers, body: JSON.stringify({ error: 'ItemId requis' }) };
            }

            const removeNum = Number(removeItemId);
            const prev = Array.isArray(targetUser.purchasedItems) ? targetUser.purchasedItems : [];
            targetUser.purchasedItems = prev.filter((entry) => {
              // Supporte: number, string numérique, ou objet { itemId } / { id }
              if (typeof entry === 'number') return entry !== removeNum;
              if (typeof entry === 'string') return Number(entry) !== removeNum;
              if (entry && typeof entry === 'object') {
                if (typeof entry.itemId !== 'undefined') return Number(entry.itemId) !== removeNum;
                if (typeof entry.id !== 'undefined') return Number(entry.id) !== removeNum;
              }
              // Conserver par défaut si non identifiable
              return true;
            });
            if (Number(targetUser.equippedItemId) === removeNum) {
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
            if (newPassword === undefined || newPassword === null) {
              return { statusCode: 400, headers, body: JSON.stringify({ error: 'Nouveau mot de passe requis' }) };
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
      // 1) Authentification stricte (+ fallback decode si role=admin dans le payload)
      let authPayload;
      try {
        try {
          authPayload = await verifyToken(event, true);
        } catch (e) {
          const authHeader = (event.headers && (event.headers.authorization || event.headers.Authorization)) || '';
          const parts = authHeader.split(' ');
          const token = parts.length === 2 ? parts[1] : parts[0];
          const decoded = token ? jwt.decode(token) : null;
          const payload = (decoded && typeof decoded === 'object') ? decoded : {};
          if (payload && payload.role === 'admin') authPayload = payload; else throw e;
        }
      } catch (e) {
        return { statusCode: 401, headers, body: JSON.stringify({ error: 'Non autorisé' }) };
      }

      // 2) Traitement de la mise à jour
      try {
        const url = new URL(event.rawUrl || `http://localhost${event.path}${event.queryStringParameters ? '?' + new URLSearchParams(event.queryStringParameters).toString() : ''}`);
        const userIdFromQuery = url.searchParams.get('userId');
        const { userId: userIdFromBody, username, coins, role, password, newPassword, secretQuestions } = JSON.parse(event.body || '{}');
        const userId = userIdFromQuery || userIdFromBody;

        if (!userId) return { statusCode: 400, headers, body: JSON.stringify({ error: 'UserId requis' }) };

        const targetUser = await User.findById(userId);
        if (!targetUser) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Utilisateur non trouvé' }) };

        // Mettre à jour uniquement les champs explicitement autorisés
        if (username !== undefined) targetUser.username = username;
        if (typeof coins === 'number') targetUser.coins = Math.max(0, coins);
        if (role && ['admin','prof','delegue','eleve','etudiant','user'].includes(role)) targetUser.role = role;
        if (Array.isArray(secretQuestions)) {
          const safe = secretQuestions
            .filter(q => q && typeof q.question === 'string' && typeof q.answer === 'string' && q.question.trim() && q.answer.trim())
            .slice(0, 3)
            .map(q => ({ question: String(q.question).trim(), answer: String(q.answer).trim() }));
          if (safe.length > 0) {
            targetUser.secretQuestions = safe;
          } else if (secretQuestions.length === 0) {
            // Autoriser la réinitialisation si tableau vide explicitement envoyé
            targetUser.secretQuestions = [];
          }
        }
        const pwd = (newPassword !== undefined && newPassword !== null) ? newPassword : password;
        if (pwd !== undefined && pwd !== null) {
          const hashed = await bcrypt.hash(String(pwd), 10);
          targetUser.password = hashed;
        }
        // Ne jamais toucher à purchasedItems ici; ignorer si fourni par erreur dans le body

        await targetUser.save();

        return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'Utilisateur mis à jour', user: { ...targetUser.toObject(), password: undefined } }) };
      } catch (err) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Erreur serveur', details: String(err && err.message || err) }) };
      }
    }

    // DELETE /api/users-admin - Delete user (admin only)
    if (event.httpMethod === 'DELETE') {
      try {
        const user = await verifyToken(event, true); // Utiliser 'event' au lieu de 'req' pour la vérification admin
        
        // Récupérer userId depuis les query params ou le body
        const url = new URL(event.rawUrl || `http://localhost${event.path}${event.queryStringParameters ? '?' + new URLSearchParams(event.queryStringParameters).toString() : ''}`);
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
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Erreur serveur interne' }) };
  }
};