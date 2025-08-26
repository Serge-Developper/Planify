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
        
        // Extraire le fichier du body multipart - méthode plus robuste
        // Chercher directement dans le buffer sans conversion en string
        const boundaryBuffer = Buffer.from('--' + boundary, 'utf8');
        const boundaryEndBuffer = Buffer.from('--' + boundary + '--', 'utf8');
        
        let avatarFile = null;
        let currentPos = 0;
        
        while (currentPos < bodyBuffer.length) {
          // Chercher le prochain boundary
          const boundaryPos = bodyBuffer.indexOf(boundaryBuffer, currentPos);
          if (boundaryPos === -1) break;
          
          // Passer le boundary et le CRLF
          currentPos = boundaryPos + boundaryBuffer.length;
          if (bodyBuffer[currentPos] === 0x0d && bodyBuffer[currentPos + 1] === 0x0a) {
            currentPos += 2;
          }
          
          // Lire les headers jusqu'à la double ligne vide
          const headersEnd = bodyBuffer.indexOf('\r\n\r\n', currentPos);
          if (headersEnd === -1) continue;
          
          const headersBuffer = bodyBuffer.slice(currentPos, headersEnd);
          const headers = headersBuffer.toString('utf8');
          
          // Vérifier si c'est le champ avatar
          if (!headers.includes('name="avatar"')) {
            currentPos = headersEnd + 4;
            continue;
          }
          
          // Extraire le nom de fichier et le type
          let filename = 'avatar.png';
          let contentType = 'image/png';
          
          const filenameMatch = headers.match(/filename="([^"]+)"/);
          if (filenameMatch) {
            filename = filenameMatch[1];
          }
          
          const contentTypeMatch = headers.match(/Content-Type:\s*(.+)/i);
          if (contentTypeMatch) {
            contentType = contentTypeMatch[1].trim();
          }
          
          console.log('📄 Found avatar field');
          console.log('📄 Filename:', filename);
          console.log('📄 Content-Type:', contentType);
          
          // Le contenu commence après la double ligne vide
          const contentStart = headersEnd + 4;
          
          // Chercher la fin du contenu (prochain boundary)
          const nextBoundarySearch = Buffer.from('\r\n--' + boundary, 'utf8');
          let contentEnd = bodyBuffer.indexOf(nextBoundarySearch, contentStart);
          
          if (contentEnd === -1) {
            // Pas de boundary suivant, chercher le boundary de fin
            const endBoundarySearch = Buffer.from('\r\n--' + boundary + '--', 'utf8');
            contentEnd = bodyBuffer.indexOf(endBoundarySearch, contentStart);
            
            if (contentEnd === -1) {
              console.log('❌ Impossible de trouver la fin du contenu');
              break;
            }
          }
          
          // Extraire le contenu binaire
          const fileBuffer = bodyBuffer.slice(contentStart, contentEnd);
          
          avatarFile = {
            originalname: filename,
            mimetype: contentType,
            buffer: fileBuffer
          };
          
          console.log('📄 File buffer extracted, length:', fileBuffer.length);
          break;
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
