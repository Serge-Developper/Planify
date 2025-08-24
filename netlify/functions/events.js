const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// Modèle Event pour les devoirs/événements
const eventSchema = new mongoose.Schema({
  title: String,
  description: String,
  type: { type: String, enum: ['devoir', 'examen', 'archive'], default: 'devoir' },
  subject: String,
  dueDate: Date,
  createdAt: { type: Date, default: Date.now },
  userId: String,
  isCompleted: { type: Boolean, default: false },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' }
});

const Event = mongoose.model('Event', eventSchema);

// Middleware d'authentification simplifié
const verifyToken = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Token manquant');
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production');
    return decoded;
  } catch (error) {
    throw new Error('Token invalide');
  }
};

// Extraction robuste de l'identifiant utilisateur depuis le payload JWT
/**
 * @param {import('jsonwebtoken').JwtPayload | string} decoded
 */
function getUserIdFromToken(decoded) {
  try {
    if (!decoded) return '';
    if (typeof decoded === 'string') return decoded || '';
    if (typeof decoded === 'object') {
      // Cas classiques { id, ... } ou { _id, ... }
      if (decoded['id']) return String(decoded['id']);
      if (decoded['_id']) return String(decoded['_id']);
      // Cas { user: { id/_id } }
      if (decoded['user'] && (decoded['user']['id'] || decoded['user']['_id'])) {
        return String(decoded['user']['id'] || decoded['user']['_id']);
      }
    }
  } catch {}
  return '';
}

// Configuration CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

// Handler pour récupérer tous les événements
const handleGetEvents = async (event) => {
  try {
    const decoded = verifyToken(event);
    const userId = getUserIdFromToken(decoded);
    if (!userId) throw new Error('Token invalide');
    
    // Récupérer tous les événements de l'utilisateur
    const events = await Event.find({ userId })
      .sort({ dueDate: 1 })
      .lean();

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        events: events || []
      })
    };
  } catch (error) {
    return {
      statusCode: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, message: 'Token invalide' })
    };
  }
};

// Handler pour créer un nouvel événement
const handleCreateEvent = async (event) => {
  try {
    const decoded = verifyToken(event);
    const userId = getUserIdFromToken(decoded);
    if (!userId) throw new Error('Token invalide');
    const body = JSON.parse(event.body || '{}');
    const { title, description, type, subject, dueDate, priority } = body;

    if (!title || !subject || !dueDate) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, message: 'Titre, matière et date de rendu requis' })
      };
    }

    const newEvent = new Event({
      title,
      description,
      type: type || 'devoir',
      subject,
      dueDate: new Date(dueDate),
      userId,
      priority: priority || 'medium'
    });

    await newEvent.save();

    return {
      statusCode: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: 'Devoir créé avec succès',
        event: newEvent
      })
    };
  } catch (error) {
    return {
      statusCode: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, message: 'Token invalide' })
    };
  }
};

// Handler pour mettre à jour un événement
const handleUpdateEvent = async (event) => {
  try {
    const decoded = verifyToken(event);
    const userId = getUserIdFromToken(decoded);
    if (!userId) throw new Error('Token invalide');
    const body = JSON.parse(event.body || '{}');
    const { eventId, title, description, type, subject, dueDate, isCompleted, priority } = body;

    if (!eventId) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, message: 'ID de l\'événement manquant' })
      };
    }

    const eventDoc = await Event.findOne({ _id: eventId, userId });
    if (!eventDoc) {
      return {
        statusCode: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, message: 'Événement non trouvé' })
      };
    }

    // Mettre à jour les champs fournis
    if (title !== undefined) eventDoc.title = title;
    if (description !== undefined) eventDoc.description = description;
    if (type !== undefined) eventDoc.type = type;
    if (subject !== undefined) eventDoc.subject = subject;
    if (dueDate !== undefined) eventDoc.dueDate = new Date(dueDate);
    if (isCompleted !== undefined) eventDoc.isCompleted = isCompleted;
    if (priority !== undefined) eventDoc.priority = priority;

    await eventDoc.save();

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: 'Événement mis à jour avec succès',
        event: eventDoc
      })
    };
  } catch (error) {
    return {
      statusCode: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, message: 'Token invalide' })
    };
  }
};

// Handler pour supprimer un événement
const handleDeleteEvent = async (event) => {
  try {
    const decoded = verifyToken(event);
    const userId = getUserIdFromToken(decoded);
    if (!userId) throw new Error('Token invalide');
    const body = JSON.parse(event.body || '{}');
    const { eventId } = body;

    if (!eventId) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, message: 'ID de l\'événement manquant' })
      };
    }

    const eventDoc = await Event.findOneAndDelete({ _id: eventId, userId });
    if (!eventDoc) {
      return {
        statusCode: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, message: 'Événement non trouvé' })
      };
    }

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: 'Événement supprimé avec succès'
      })
    };
  } catch (error) {
    return {
      statusCode: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, message: 'Token invalide' })
    };
  }
};

exports.handler = async (event, context) => {
  // Gérer les requêtes OPTIONS (preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || '', {
      bufferCommands: false
    });

    // Router selon la méthode HTTP
    switch (event.httpMethod) {
      case 'GET':
        return await handleGetEvents(event);
      case 'POST':
        return await handleCreateEvent(event);
      case 'PUT':
        return await handleUpdateEvent(event);
      case 'DELETE':
        return await handleDeleteEvent(event);
      default:
        return {
          statusCode: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ success: false, message: 'Méthode non autorisée' })
        };
    }

  } catch (error) {
    console.error('❌ Erreur events:', error);
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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