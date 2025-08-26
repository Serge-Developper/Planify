const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

// Modèle User simplifié pour Netlify Functions
const userSchema = new mongoose.Schema({
  username: String,
  coins: { type: Number, default: 0 },
  role: { type: String, default: 'user' },
  year: String,
  groupe: String,
  avatar: {
    filename: String,
    mimetype: String,
    data: String, // base64
    size: Number
  },
  avatarFilename: String, // pour compatibilité avec l'ancien format
  purchasedItems: [{
    itemId: String,
    itemName: String,
    price: Number,
    purchaseDate: { type: Date, default: Date.now }
  }],
  equippedItemId: String,
  lastSpinDate: Date,
  spinCount: { type: Number, default: 0 },
  weeklySpinCount: { type: Number, default: 0 },
  lastWeeklyReset: Date,
  password: String,
  secretQuestions: [{ question: String, answer: String }],
  pendingGifts: [{ id: Number, name: String, adminMessage: String, date: Date }]
});

const User = mongoose.model('User', userSchema);

// Ajout des gifts utilisateur pour les popups
// Schéma étendu si absent
try {
  if (!User.schema.path('pendingGifts')) {
    User.schema.add({ pendingGifts: [{ id: Number, name: String, adminMessage: String, date: Date }] });
  }
} catch {}

// Fonction utilitaire pour créer le dossier d'upload
function ensureUploadDirectory() {
  const uploadDir = path.join(__dirname, '../../public/uploads/avatars');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  return uploadDir;
}

// Middleware d'authentification simplifié
const verifyToken = (event) => {
  console.log('🔍 Vérification du token...');
  console.log('Headers reçus:', event.headers);
  
  const authHeader = event.headers.authorization || event.headers.Authorization;
  console.log('Auth header:', authHeader);
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('❌ Token manquant ou format incorrect');
    throw new Error('Token manquant');
  }

  const token = authHeader.substring(7);
  console.log('Token extrait:', token.substring(0, 20) + '...');
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production');
    console.log('✅ Token valide pour l\'utilisateur:', decoded.userId);
    return decoded;
  } catch (error) {
    console.log('❌ Erreur de vérification du token:', error.message);
    throw new Error('Token invalide');
  }
};

exports.handler = async (event, context) => {
  // Configuration CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  // Gérer les requêtes OPTIONS (preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || '', {
      bufferCommands: false
      // bufferMaxEntries n'est plus supporté dans les versions récentes de Mongoose/MongoDB
    });

    const path = event.path || event.rawPath || '';

    // POST /api/users/secret-questions
    if (event.httpMethod === 'POST' && /\/users\/secret-questions$/.test(path)) {
      try {
        const body = JSON.parse(event.body || '{}')
        const { username, secretQuestions } = body || {}
        if (!username || !Array.isArray(secretQuestions) || secretQuestions.length === 0) {
          return { statusCode: 400, headers, body: JSON.stringify({ success: false, message: 'username et secretQuestions requis' }) }
        }
        const safe = secretQuestions
          .filter((q) => q && typeof q.question === 'string' && typeof q.answer === 'string' && q.question.trim() && q.answer.trim())
          .slice(0, 3)
          .map((q) => ({ question: String(q.question).trim(), answer: String(q.answer).trim() }))
        if (safe.length === 0) {
          return { statusCode: 400, headers, body: JSON.stringify({ success: false, message: 'Aucune entrée valide' }) }
        }
        const userDoc = await User.findOne({ username: String(username) })
        if (!userDoc) {
          return { statusCode: 404, headers, body: JSON.stringify({ success: false, message: 'Utilisateur non trouvé' }) }
        }
        userDoc.secretQuestions = safe
        await userDoc.save()
        return { statusCode: 200, headers, body: JSON.stringify({ success: true }) }
      } catch (e) {
        return { statusCode: 500, headers, body: JSON.stringify({ success: false, message: 'Erreur serveur', details: String(e && e.message || e) }) }
      }
    }

    // GET /api/users/gifts
    if (event.httpMethod === 'GET' && /\/users\/gifts$/.test(path)) {
      const authHeader = event.headers && (event.headers.authorization || event.headers.Authorization);
      if (!authHeader) return { statusCode: 401, headers: headers, body: JSON.stringify({ success: false }) };
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
      const decoded = jwt.verify(token, process.env.JWT_SECRET || '');
      const userId = typeof decoded === 'object' ? decoded.id : decoded;
      const u = await User.findById(userId).lean();
      const gifts = Array.isArray(u?.pendingGifts) ? u.pendingGifts : [];
      return { statusCode: 200, headers: headers, body: JSON.stringify({ success: true, gifts }) };
    }

    // POST /api/users/ack-gift/:id
    if (event.httpMethod === 'POST' && /\/users\/ack-gift\//.test(path)) {
      const authHeader = event.headers && (event.headers.authorization || event.headers.Authorization);
      if (!authHeader) return { statusCode: 401, headers: headers, body: JSON.stringify({ success: false }) };
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
      const decoded = jwt.verify(token, process.env.JWT_SECRET || '');
      const userId = typeof decoded === 'object' ? decoded.id : decoded;
      const giftId = (path.match(/ack-gift\/(\d+)/) || [])[1];
      const doc = await User.findById(userId);
      if (!doc) return { statusCode: 404, headers: headers, body: JSON.stringify({ success: false }) };
      doc.pendingGifts = (doc.pendingGifts || []).filter(g => String(g.id) !== String(giftId));
      await doc.save();
      return { statusCode: 200, headers: headers, body: JSON.stringify({ success: true }) };
    }

    // Route GET /api/users - Récupérer la liste des utilisateurs pour le leaderboard
    if (event.httpMethod === 'GET' && !event.path.includes('/profile')) {
      try {
        // Vérifier l'authentification
        const user = verifyToken(event);
        
        // Récupérer tous les utilisateurs avec leurs coins pour le leaderboard
        const users = await User.find({}, 'username coins role year groupe avatar purchasedItems equippedItemId completedTasks selectedBorderColor')
          .sort({ coins: -1 })
          .limit(50); // Limiter à 50 utilisateurs

        return {
          statusCode: 200,
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            success: true,
            users: users.map(u => ({
              username: u.username,
              coins: u.coins || 0,
              role: u.role,
              year: u.year,
              groupe: u.groupe,
              avatar: u.avatar,
              purchasedItems: u.purchasedItems || [],
              equippedItemId: u.equippedItemId,
              completedTasks: u.completedTasks || 0,
              selectedBorderColor: u.selectedBorderColor
            }))
          })
        };
      } catch (authError) {
        console.error('❌ Erreur auth users:', authError.message);
        return {
          statusCode: 401,
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            success: false,
            message: 'Token invalide ou manquant'
          })
        };
      }
    }

    // Route GET /api/users/profile - Récupérer le profil utilisateur complet
    if (event.httpMethod === 'GET' && event.path.includes('/profile')) {
      try {
        // Vérifier l'authentification
        const decodedUser = verifyToken(event);
        
        // Récupérer l'utilisateur complet depuis la base de données
        const user = await User.findById(decodedUser.userId || decodedUser.id);
        
        if (!user) {
          return {
            statusCode: 404,
            headers: {
              ...headers,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              success: false,
              message: 'Utilisateur non trouvé'
            })
          };
        }

        console.log('✅ Profil utilisateur récupéré:', {
          username: user.username,
          role: user.role,
          year: user.year,
          groupe: user.groupe,
          coins: user.coins
        });

        return {
          statusCode: 200,
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            success: true,
            user: {
              id: user._id,
              username: user.username,
              role: user.role,
              year: user.year,
              groupe: user.groupe,
              coins: user.coins || 0,
              avatar: user.avatar && user.avatar.data ? 
                `data:${user.avatar.mimetype};base64,${user.avatar.data}` : 
                user.avatar, // Fallback pour l'ancien format
              purchasedItems: user.purchasedItems || [],
              equippedItemId: user.equippedItemId,
              lastSpinDate: user.lastSpinDate,
              spinCount: user.spinCount || 0,
              weeklySpinCount: user.weeklySpinCount || 0,
              lastWeeklyReset: user.lastWeeklyReset
            }
          })
        };
      } catch (authError) {
        console.error('❌ Erreur auth profile:', authError.message);
        return {
          statusCode: 401,
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            success: false,
            message: 'Token invalide ou manquant'
          })
        };
      }
    }

    // Route POST /api/users/upload-avatar - Upload d'avatar
    console.log('🔍 Vérification de la route:', event.path, event.httpMethod);
    if (event.httpMethod === 'POST' && (event.path === '/upload-avatar' || event.path.endsWith('/upload-avatar'))) {
      try {
        // Vérifier l'authentification
        const user = verifyToken(event);
        
        // Vérifier que le contenu est multipart/form-data
        if (!event.headers['content-type'] || !event.headers['content-type'].includes('multipart/form-data')) {
          return {
            statusCode: 400,
            headers: {
              ...headers,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              success: false,
              message: 'Le contenu doit être multipart/form-data'
            })
          };
        }

        // Parser le body multipart manuellement
        const boundary = event.headers['content-type'].split('boundary=')[1];
        const body = Buffer.from(event.body, 'base64');
        
        // Extraire le fichier du body multipart
        const parts = body.toString().split('--' + boundary);
        let avatarFile = null;
        
        for (const part of parts) {
          if (part.includes('Content-Disposition: form-data; name="avatar"')) {
            const lines = part.split('\r\n');
            const filenameMatch = lines.find(line => line.includes('filename='));
            if (filenameMatch) {
              const filename = filenameMatch.split('filename=')[1].replace(/"/g, '');
              const contentTypeMatch = lines.find(line => line.includes('Content-Type:'));
              const contentType = contentTypeMatch ? contentTypeMatch.split(': ')[1] : 'image/jpeg';
              
              // Extraire le contenu du fichier
              const fileContentStart = part.indexOf('\r\n\r\n') + 4;
              const fileContent = part.substring(fileContentStart, part.lastIndexOf('\r\n'));
              
              avatarFile = {
                originalname: filename,
                mimetype: contentType,
                buffer: Buffer.from(fileContent, 'binary')
              };
              break;
            }
          }
        }

        if (!avatarFile) {
          return {
            statusCode: 400,
            headers: {
              ...headers,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              success: false,
              message: 'Aucun fichier avatar trouvé'
            })
          };
        }

        // Vérifier le type de fichier
        if (!avatarFile.mimetype.startsWith('image/')) {
          return {
            statusCode: 400,
            headers: {
              ...headers,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              success: false,
              message: 'Seules les images sont autorisées'
            })
          };
        }

        // Vérifier la taille (5MB max)
        if (avatarFile.buffer.length > 5 * 1024 * 1024) {
          return {
            statusCode: 400,
            headers: {
              ...headers,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              success: false,
              message: 'Le fichier est trop volumineux (max 5MB)'
            })
          };
        }

        // Générer un nom de fichier unique
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(avatarFile.originalname);
        const filename = 'avatar-' + uniqueSuffix + fileExtension;
        
        // Créer le dossier d'upload s'il n'existe pas
        const uploadDir = path.join(__dirname, '../../public/uploads/avatars');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        // Sauvegarder le fichier
        const filePath = path.join(uploadDir, filename);
        fs.writeFileSync(filePath, avatarFile.buffer);
        
        // Mettre à jour l'utilisateur dans la base de données
        const avatarPath = `/uploads/avatars/${filename}`;
        await User.findByIdAndUpdate(user.userId, { avatar: avatarPath });
        
        console.log('✅ Avatar uploadé avec succès:', avatarPath);
        
        return {
          statusCode: 200,
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            success: true,
            avatar: avatarPath,
            message: 'Avatar mis à jour avec succès'
          })
        };
        
      } catch (error) {
        console.error('❌ Erreur détaillée upload avatar:', error);
        
        if (error.message === 'Token manquant' || error.message === 'Token invalide') {
          return {
            statusCode: 401,
            headers: {
              ...headers,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              success: false,
              message: 'Token invalide ou manquant'
            })
          };
        } else {
          return {
            statusCode: 500,
            headers: {
              ...headers,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              success: false,
              message: 'Erreur lors de l\'upload de l\'avatar: ' + error.message
            })
          };
        }
      }
    }

    // Méthode non supportée
    return {
      statusCode: 405,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        message: 'Méthode non autorisée'
      })
    };

  } catch (error) {
    console.error('❌ Erreur users:', error);
    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
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