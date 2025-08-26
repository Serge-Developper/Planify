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
        
        // Netlify encode toujours le body en base64 pour les requêtes binaires
        const isBase64 = event.isBase64Encoded !== false; // Par défaut true
        console.log('📦 Body encoding:', isBase64 ? 'base64' : 'utf8');
        console.log('📦 Raw body length:', event.body.length);
        
        const bodyBuffer = Buffer.from(event.body, isBase64 ? 'base64' : 'utf8');
        
        console.log('📦 Decoded body length:', bodyBuffer.length);
        console.log('📦 Boundary:', boundary);
        
        // Extraire le fichier du body multipart
        const parts = bodyBuffer.toString('binary').split('--' + boundary);
        let avatarFile = null;
        
        for (const part of parts) {
          if (part.includes('Content-Disposition: form-data; name="avatar"')) {
            const lines = part.split('\r\n');
            const filenameMatch = lines.find(line => line.includes('filename='));
            if (filenameMatch) {
              const filename = filenameMatch.split('filename=')[1].replace(/"/g, '');
              const contentTypeMatch = lines.find(line => line.includes('Content-Type:'));
              const contentType = contentTypeMatch ? contentTypeMatch.split(': ')[1] : 'image/png';
              
              console.log('📄 Filename:', filename);
              console.log('📄 Content-Type:', contentType);
              
              // Extraire le contenu du fichier - attention au parsing binaire
              const headerEndIndex = part.indexOf('\r\n\r\n');
              if (headerEndIndex === -1) {
                console.log('❌ Impossible de trouver la fin des headers');
                continue;
              }
              
              const fileContentStart = headerEndIndex + 4;
              // Chercher la fin du contenu (avant le prochain boundary ou la fin)
              let fileContentEnd = part.lastIndexOf('\r\n--');
              if (fileContentEnd === -1 || fileContentEnd < fileContentStart) {
                fileContentEnd = part.length;
                // Enlever les retours à la ligne finaux
                while (fileContentEnd > fileContentStart && (part[fileContentEnd - 1] === '\r' || part[fileContentEnd - 1] === '\n')) {
                  fileContentEnd--;
                }
              }
              
              const fileContent = part.substring(fileContentStart, fileContentEnd);
              
              avatarFile = {
                originalname: filename,
                mimetype: contentType,
                buffer: Buffer.from(fileContent, 'binary')
              };
              
              console.log('📄 File buffer length:', avatarFile.buffer.length);
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
        
        // Vérifier que l'image est valide en essayant de la décoder
        console.log('🔍 Vérification de l\'image avant stockage...');
        console.log('🔍 Buffer length:', avatarFile.buffer.length);
        console.log('🔍 First bytes:', avatarFile.buffer.slice(0, 20).toString('hex'));
        
        // Vérifier la signature du fichier
        const isPNG = avatarFile.buffer[0] === 0x89 && avatarFile.buffer[1] === 0x50;
        const isJPEG = avatarFile.buffer[0] === 0xFF && avatarFile.buffer[1] === 0xD8;
        const isGIF = avatarFile.buffer[0] === 0x47 && avatarFile.buffer[1] === 0x49;
        
        console.log('🔍 Type détecté - PNG:', isPNG, 'JPEG:', isJPEG, 'GIF:', isGIF);
        
        if (!isPNG && !isJPEG && !isGIF) {
          console.error('❌ Format d\'image non reconnu');
          return {
            statusCode: 400,
            headers: {
              ...headers,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              success: false,
              message: 'Format d\'image non reconnu. Utilisez PNG, JPEG ou GIF.'
            })
          };
        }
        
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
        console.log('📏 Taille base64:', base64Image.length);
        
        // Vérifier que l'encodage base64 est valide
        try {
          const testDecode = Buffer.from(base64Image, 'base64');
          console.log('✅ Base64 valide, taille décodée:', testDecode.length);
        } catch (e) {
          console.error('❌ Erreur de validation base64:', e);
        }
        
        // S'assurer que le mimetype est correct
        const cleanMimetype = avatarFile.mimetype.trim();
        const dataUrl = `data:${cleanMimetype};base64,${base64Image}`;
        
        console.log('🖼️ Data URL prefix:', dataUrl.substring(0, 100));
        
        return {
          statusCode: 200,
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            success: true,
            avatar: dataUrl,
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
