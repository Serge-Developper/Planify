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
  password: String
});

const User = mongoose.model('User', userSchema);

// Fonction utilitaire pour créer le dossier d'upload
function ensureUploadDirectory() {
  const uploadDir = path.join(__dirname, '../../public/uploads/avatars');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  return uploadDir;
}

// Middleware d'authentification simplifié
const verifyToken = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Token manquant');
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production');
    return decoded;
  } catch (error) {
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

    // Route GET /api/users - Récupérer la liste des utilisateurs pour le leaderboard
    if (event.httpMethod === 'GET') {
      try {
        // Vérifier l'authentification
        const user = verifyToken(event);
        
        // Récupérer tous les utilisateurs avec leurs coins pour le leaderboard
        const users = await User.find({}, 'username coins role year groupe')
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
              groupe: u.groupe
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

    // Route POST /api/users/upload-avatar - Upload d'avatar
    if (event.httpMethod === 'POST' && event.path.endsWith('/upload-avatar')) {
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