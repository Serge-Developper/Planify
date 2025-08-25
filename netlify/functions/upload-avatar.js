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
  avatarFilename: String, // pour compatibilité
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
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
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
    console.log('🚀 Fonction upload-avatar appelée');
    console.log('Méthode:', event.httpMethod);
    console.log('Path:', event.path);
    
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || '', {
      bufferCommands: false
    });

    // Route POST /api/upload-avatar - Upload d'avatar
    if (event.httpMethod === 'POST') {
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
        
        // Dans Netlify Functions, on ne peut pas écrire sur le système de fichiers
        // On va stocker l'image en base64 dans la base de données
        const base64Image = avatarFile.buffer.toString('base64');
        const imageData = {
          filename: filename,
          mimetype: avatarFile.mimetype,
          data: base64Image,
          size: avatarFile.buffer.length
        };
        
        // Mettre à jour l'utilisateur dans la base de données avec l'image en base64
        await User.findByIdAndUpdate(user.userId, { 
          avatar: imageData,
          avatarFilename: filename
        });
        
        console.log('✅ Avatar uploadé avec succès:', filename);
        
        return {
          statusCode: 200,
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            success: true,
            avatar: `data:${avatarFile.mimetype};base64,${base64Image}`,
            filename: filename,
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
    console.error('❌ Erreur upload-avatar:', error);
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
