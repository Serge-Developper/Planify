const mongoose = require('mongoose');

// Modèle User simplifié pour récupérer les avatars
const userSchema = new mongoose.Schema({
  username: String,
  avatar: {
    filename: String,
    mimetype: String,
    data: String, // base64
    size: Number
  },
  avatarFilename: String
});

const User = mongoose.model('User', userSchema);

exports.handler = async (event, context) => {
  // Configuration CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
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
    console.log('🚀 Fonction avatars appelée');
    console.log('Path:', event.path);
    
    // Extraire le nom du fichier depuis le path
    // Le path sera quelque chose comme /.netlify/functions/avatars/avatar-123456.png
    const pathParts = event.path.split('/');
    const filename = pathParts[pathParts.length - 1];
    
    if (!filename || filename === 'avatars') {
      return {
        statusCode: 400,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'Nom de fichier manquant'
        })
      };
    }

    console.log('📁 Recherche de l\'avatar:', filename);

    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || '', {
      bufferCommands: false
    });

    // Rechercher l'utilisateur avec cet avatar
    const user = await User.findOne({
      $or: [
        { 'avatar.filename': filename },
        { avatarFilename: filename }
      ]
    });

    if (!user || !user.avatar || !user.avatar.data) {
      console.log('❌ Avatar non trouvé pour:', filename);
      return {
        statusCode: 404,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'Avatar non trouvé'
        })
      };
    }

    console.log('✅ Avatar trouvé, taille:', user.avatar.size);

    // Convertir la data base64 en buffer
    const imageBuffer = Buffer.from(user.avatar.data, 'base64');
    
    // Déterminer le type MIME
    const mimetype = user.avatar.mimetype || 'image/png';

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': mimetype,
        'Cache-Control': 'public, max-age=31536000', // Cache pour 1 an
        'Content-Length': imageBuffer.length.toString()
      },
      body: imageBuffer.toString('base64'),
      isBase64Encoded: true
    };

  } catch (error) {
    console.error('❌ Erreur avatars:', error);
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