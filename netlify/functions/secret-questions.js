const mongoose = require('mongoose');

// Modèle User minimal avec questions secrètes
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  secretQuestions: [
    {
      question: { type: String, required: true },
      answer: { type: String, required: true },
    },
  ],
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, message: 'Méthode non autorisée' }),
    };
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI || '', { bufferCommands: false });

    const body = JSON.parse(event.body || '{}');
    const { username, secretQuestions } = body;

    if (!username || !Array.isArray(secretQuestions) || secretQuestions.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, message: 'Données invalides' }),
      };
    }

    // Sanitize + garder 3 questions max
    const cleaned = secretQuestions
      .filter((q) => q && q.question && q.answer)
      .slice(0, 3)
      .map((q) => ({
        question: String(q.question).trim(),
        answer: String(q.answer).trim(),
      }));

    if (cleaned.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, message: 'Aucune question valide fournie' }),
      };
    }

    const user = await User.findOne({ username });
    if (!user) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ success: false, message: 'Utilisateur non trouvé' }),
      };
    }

    user.secretQuestions = cleaned;
    await user.save();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, message: 'Questions secrètes enregistrées' }),
    };
  } catch (error) {
    console.error('Erreur secret-questions:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, message: 'Erreur serveur interne' }),
    };
  } finally {
    try {
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
      }
    } catch {}
  }
};