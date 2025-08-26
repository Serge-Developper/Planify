const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// MongoDB connection
let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    return;
  }
  
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }
    
    await mongoose.connect(mongoUri);
    isConnected = true;
  } catch (error) {
    console.error('Erreur de connexion MongoDB:', error);
    throw error;
  }
};

// Event Schema
const eventSchema = new mongoose.Schema({
  titre: { type: String, required: true },
  date: { type: String, required: true },
  heure: { type: String, required: true },
  groupe: { type: String, required: true },
  groupes: [{ type: String }],
  type: { type: String, required: true },
  matiere: { type: String, required: true },
  year: { type: String, required: true },
  archivedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  checkedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  hiddenBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  description: { type: String, default: '' },
  createdBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

const Event = mongoose.models.Event || mongoose.model('Event', eventSchema);

// User Schema (for completedTasks)
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  coins: { type: Number, default: 0 },
  avatar: { type: String, default: null },
  role: { type: String, enum: ['admin', 'prof', 'delegue', 'eleve', 'etudiant'], required: true },
  year: { type: String, enum: ['BUT1', 'BUT2', 'BUT3'], default: null },
  groupe: { type: String, enum: ['A', "A'", 'A2', 'B', "B'", 'B2', 'Promo'], default: null },
  secretQuestions: [{
    question: { type: String, required: true },
    answer: { type: String, required: true }
  }],
  purchasedItems: [{ type: Number }],
  equippedItemId: { type: Number, default: null },
  completedTasks: { type: Number, default: 0 }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

// JWT verification
const verifyToken = (request) => {
  const authHeader = request.headers?.authorization || request.headers?.Authorization;
  if (!authHeader) {
    throw new Error('Token manquant');
  }

  const parts = authHeader.split(' ');
  const token = parts.length === 2 ? parts[1] : parts[0];
  if (!token) {
    throw new Error('Token manquant');
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is not defined');
  }

  try {
    // Accepter les tokens signés par auth.js (sans issuer/audience spécifiques)
    const decoded = jwt.verify(token, jwtSecret);
    return decoded;
  } catch (error) {
    throw new Error('Token invalide');
  }
};

// Fonction utilitaire pour extraire l'ID utilisateur du token
const getUserId = (user) => {
  if (typeof user === 'string') {
    return user;
  }
  return user.id || user._id || user.userId;
};

exports.handler = async (event, context) => {
  // Headers pour CORS
  const headers = corsHeaders;
  
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Méthode non autorisée' }) };
  }

  try {
    await connectDB();
    
    console.log('🔍 Events-check start:', { method: event.httpMethod, body: JSON.parse(event.body || '{}') });
    
    const user = verifyToken(event);
    const userIdString = getUserId(user);
    
    console.log('🔍 User from token:', { userIdString, userObj: user });
    
    // Validation de l'ObjectId avant conversion
    if (!userIdString || !mongoose.Types.ObjectId.isValid(userIdString)) {
      console.error('❌ Invalid userId:', userIdString);
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'UserId invalide' }) };
    }
    
    const userId = new mongoose.Types.ObjectId(userIdString);
    
    console.log('🔍 Events-check debug:', { userIdString, userId, action: JSON.parse(event.body || '{}').action, eventId: JSON.parse(event.body || '{}').eventId });
    
    const { eventId, action } = JSON.parse(event.body || '{}');
    
    if (!eventId || !action) {
      console.error('❌ Missing eventId or action:', { eventId, action });
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'eventId et action requis' }) };
    }

    // Validation de l'eventId
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      console.error('❌ Invalid eventId:', eventId);
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'EventId invalide' }) };
    }

    console.log('🔍 Searching for event:', eventId);
    const eventDoc = await Event.findById(eventId);
    console.log('🔍 Event found:', eventDoc ? 'Yes' : 'No', eventDoc ? { title: eventDoc.titre, checkedBy: eventDoc.checkedBy.length } : null);
    
    if (!eventDoc) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'Événement non trouvé' }) };
    }

    switch (action) {
      case 'check':
        if (!eventDoc.checkedBy.some(id => id.equals(userId))) {
          // Vérifier si la tâche est en retard
          const [h, m] = (eventDoc.heure || '').split(':');
          const target = new Date(eventDoc.date);
          target.setHours(Number(h), Number(m || 0), 0, 0);
          const now = new Date();
          const isLate = now > target;

          // Ajouter l'utilisateur à la liste des utilisateurs qui ont validé cette tâche
          eventDoc.checkedBy.push(userId);
          await eventDoc.save();
          
          // Incrémenter le compteur de tâches complétées seulement si la tâche n'est PAS en retard
          if (!isLate) {
            await User.findByIdAndUpdate(userId, { $inc: { completedTasks: 1 } });
          }
        }
        break;
        
      case 'uncheck':
        if (eventDoc.checkedBy.some(id => id.equals(userId))) {
          // Vérifier si la tâche était en retard au moment de la validation
          const [h, m] = (eventDoc.heure || '').split(':');
          const target = new Date(eventDoc.date);
          target.setHours(Number(h), Number(m || 0), 0, 0);
          const now = new Date();
          const isLate = now > target;

          // Retirer l'utilisateur de la liste des utilisateurs qui ont validé cette tâche
          eventDoc.checkedBy = eventDoc.checkedBy.filter(id => !id.equals(userId));
          await eventDoc.save();
          
          // Décrémenter le compteur de tâches complétées seulement si la tâche n'était PAS en retard
          if (!isLate) {
            await User.findByIdAndUpdate(userId, { $inc: { completedTasks: -1 } });
          }
        }
        break;
        
      case 'archive':
        if (!eventDoc.archivedBy.some(id => id.equals(userId))) {
          eventDoc.archivedBy.push(userId);
          await eventDoc.save();
        }
        break;
        
      case 'unarchive':
        eventDoc.archivedBy = eventDoc.archivedBy.filter(id => !id.equals(userId));
        await eventDoc.save();
        break;

      case 'hide':
        if (!eventDoc.hiddenBy) eventDoc.hiddenBy = [];
        if (!eventDoc.hiddenBy.some(id => id.equals(userId))) {
          eventDoc.hiddenBy.push(userId);
          await eventDoc.save();
        }
        break;

      case 'unhide':
        if (Array.isArray(eventDoc.hiddenBy)) {
          eventDoc.hiddenBy = eventDoc.hiddenBy.filter(id => !id.equals(userId));
          await eventDoc.save();
        }
        break;
 
      default:
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Action non supportée' }) };
    }

    console.log('✅ Events-check réussi:', { action, eventId, userId: userIdString });
    
    return { statusCode: 200, headers, body: JSON.stringify({ 
      message: `Événement ${action}é avec succès`,
      event: eventDoc 
    }) };

  } catch (error) {
    console.error('❌ Erreur events-check:', error);
    
    // Vérifier si c'est une erreur d'authentification
    if (error.message === 'Token manquant' || error.message === 'Token invalide' || error.message === 'Non autorisé') {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Non autorisé' }) };
    }
    
    return { 
      statusCode: 500, 
      headers, 
      body: JSON.stringify({ 
        error: 'Erreur serveur interne', 
        details: error.message 
      }) 
    };
  }
};