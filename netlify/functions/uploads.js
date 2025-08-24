// Proxy d'uploads pour Netlify → redirige vers l'origine des fichiers (Vercel)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, OPTIONS'
};

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ error: 'Méthode non autorisée' }) };
  }

  try {
    const path = event.path || event.rawPath || '';
    // Exemple: /.netlify/functions/uploads/avatars/filename.png
    const idx = path.indexOf('/uploads/');
    const tail = idx >= 0 ? path.substring(idx + '/uploads/'.length) : '';
    if (!tail) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Chemin de fichier manquant' }) };
    }

    const origin = process.env.UPLOADS_ORIGIN || 'https://planify-snowy.vercel.app';
    const targetUrl = `${origin}/uploads/${tail}`;

    return {
      statusCode: 302,
      headers: { ...corsHeaders, Location: targetUrl },
      body: ''
    };
  } catch (e) {
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Erreur proxy uploads' }) };
  }
};

