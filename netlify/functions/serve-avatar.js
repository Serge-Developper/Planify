const fs = require('fs');
const path = require('path');

exports.handler = async (event, context) => {
  // Configuration CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  // Gérer les requêtes OPTIONS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Extraire le nom du fichier depuis l'URL
    const pathParts = event.path.split('/');
    const filename = pathParts[pathParts.length - 1];
    
    if (!filename) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Filename not found' })
      };
    }

    // Pour Netlify, nous allons stocker les avatars dans une variable d'environnement ou MongoDB
    // Pour l'instant, retournons une image par défaut
    const defaultAvatar = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0MCIgZmlsbD0iIzY2NjY2NiIgLz4KICA8dGV4dCB4PSI1MCIgeT0iNTUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IndoaXRlIiBmb250LXNpemU9IjQwIj4/PC90ZXh0Pgo8L3N2Zz4=';

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000'
      },
      body: defaultAvatar,
      isBase64Encoded: true
    };
    
  } catch (error) {
    console.error('Erreur serve-avatar:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Erreur serveur' })
    };
  }
};