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
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || '*',
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

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Vérifier l'authentification
    const { userId } = verifyToken(event);
    
    // Parser le multipart form data
    const boundary = event.headers['content-type'].split('boundary=')[1];
    const buffer = Buffer.from(event.body, event.isBase64Encoded ? 'base64' : 'utf8');
    
    // Extraire le fichier
    const boundaryBuffer = Buffer.from(`--${boundary}`);
    const parts = [];
    let start = 0;
    
    while (start < buffer.length) {
      const boundaryIndex = buffer.indexOf(boundaryBuffer, start);
      if (boundaryIndex === -1) break;
      
      const nextBoundaryIndex = buffer.indexOf(boundaryBuffer, boundaryIndex + boundaryBuffer.length);
      if (nextBoundaryIndex === -1) break;
      
      const part = buffer.slice(boundaryIndex + boundaryBuffer.length, nextBoundaryIndex);
      parts.push(part);
      start = nextBoundaryIndex;
    }
    
    // Trouver la partie avec le fichier
    let fileBuffer = null;
    let filename = null;
    let mimetype = null;
    
    for (const part of parts) {
      const headerEndIndex = part.indexOf('\r\n\r\n');
      if (headerEndIndex === -1) continue;
      
      const headers = part.slice(0, headerEndIndex).toString();
      if (headers.includes('filename=')) {
        const filenameMatch = headers.match(/filename="(.+?)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
          const ext = filename.split('.').pop().toLowerCase();
          mimetype = `image/${ext === 'jpg' ? 'jpeg' : ext}`;
        }
        fileBuffer = part.slice(headerEndIndex + 4);
        break;
      }
    }
    
    if (!fileBuffer || !filename) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Aucun fichier trouvé' })
      };
    }
    
    // Convertir en base64
    const base64Data = fileBuffer.toString('base64');
    const dataUrl = `data:${mimetype};base64,${base64Data}`;
    
    // Sauvegarder directement la data URL dans user.avatar
    await User.findByIdAndUpdate(userId, { 
      avatar: dataUrl
    });
    
    console.log('✅ Avatar uploadé en base64');
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true,
        avatar: dataUrl
      })
    };
    
  } catch (error) {
    console.error('Erreur upload avatar:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Erreur serveur' })
    };
  }
};
