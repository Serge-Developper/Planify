const mongoose = require('mongoose');

// Schéma utilisateur minimal pour gérer les questions secrètes
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String },
  password: { type: String },
  role: { type: String, default: 'user' },
  year: { type: String },
  groupe: { type: String },
  secretQuestions: [{
    question: { type: String, required: true },
    answer: { type: String, required: true }
  }]
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

// CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

exports.handler = async (event, context) => {
  // Preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ error: 'Méthode non autorisée' }) };
  }

  try {
    // Connexion MongoDB (réutilisable)
    await mongoose.connect(process.env.MONGODB_URI || '', { bufferCommands: false });

    const { username, secretQuestions } = JSON.parse(event.body || '{}');

    if (!username || !Array.isArray(secretQuestions) || secretQuestions.length === 0) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({
        success: false,
        message: 'username et secretQuestions requis'
      }) };
    }

    // Valider contenu et unicité
    const cleaned = secretQuestions
      .filter(q => q && q.question && q.answer)
      .map(q => ({ question: String(q.question).trim(), answer: String(q.answer).trim() }));

    if (cleaned.length === 0) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ success: false, message: 'Aucune question valide' }) };
    }

    const unique = new Set(cleaned.map(q => q.question));
    if (unique.size !== cleaned.length) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ success: false, message: 'Chaque question doit être unique' }) };
    }

    // Mettre à jour l'utilisateur
    const user = await User.findOne({ username });
    if (!user) {
      return { statusCode: 404, headers: corsHeaders, body: JSON.stringify({ success: false, message: 'Utilisateur non trouvé' }) };
    }

    user.secretQuestions = cleaned;
    await user.save();

    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ success: true, message: 'Questions secrètes enregistrées' }) };
  } catch (error) {
    console.error('❌ secret-questions error:', error);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ success: false, message: 'Erreur serveur interne' }) };
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  }
};

