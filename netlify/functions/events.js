const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// Interface pour le payload JWT
/**
 * @typedef {Object} JwtPayload
 * @property {string} id - ID de l'utilisateur
 * @property {string} _id - ID alternatif de l'utilisateur
 */

// Modèle Event pour les devoirs/événements
// Unifie l'ancien schéma (EN) et le schéma actuel (FR)
const eventSchema = new mongoose.Schema({
  // Schéma FR actuel (utilisé par le frontend ListeDevoirs/Admin)
  titre: String,
  description: String,
  type: { type: String }, // 'devoir' | 'exam' | 'examen' | 'archive'
  matiere: String,
  date: String, // yyyy-mm-dd
  heure: String, // HH:mm
  groupe: String,
  groupes: [{ type: String }],
  year: String,
  archivedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  checkedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdBy: String,
  createdAt: { type: Date, default: Date.now },

  // Ancien schéma (legacy EN)
  title: String,
  subject: String,
  dueDate: Date,
  userId: String,
  isCompleted: { type: Boolean, default: false },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' }
});

const Event = mongoose.model('Event', eventSchema);

// Modèle User minimal pour récupérer year/groupe/role
const userSchema = new mongoose.Schema({
  role: String,
  year: String,
  groupe: String
});
const User = mongoose.models.User || mongoose.model('User', userSchema);

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

// Configuration CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

// Handler pour récupérer tous les événements (compat FR)
const handleGetEvents = async (event) => {
  try {
    // Vérifier l'authentification (obligatoire)
    const decoded = verifyToken(event);

    // Filtrage selon l'utilisateur (élève/délégué seulement)
    let mongoFilter = {};
    try {
      const userId = decoded.id || decoded._id;
      if (userId) {
        const u = await User.findById(userId).lean();
        if (u && u.role && u.role !== 'admin' && u.role !== 'prof') {
          const allowedGroups = [];
          if (u.groupe) allowedGroups.push(u.groupe);
          allowedGroups.push('Promo');

          mongoFilter = {
            $and: [
              {
                $or: [
                  { year: { $exists: false } },
                  { year: '' },
                  ...(u.year ? [{ year: u.year }] : [])
                ]
              },
              {
                $or: [
                  { groupe: { $in: allowedGroups } },
                  { groupes: { $in: allowedGroups } },
                  { groupes: { $exists: false } },
                  { groupe: { $exists: false } }
                ]
              }
            ]
          };
        }
      }
    } catch {}

    // Récupérer les événements (filtrés si nécessaire)
    const events = await Event.find(mongoFilter)
      .sort({ date: 1, dueDate: 1, createdAt: 1 })
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

// Handler pour créer un nouvel événement (laisse la compat legacy pour l’instant)
const handleCreateEvent = async (event) => {
  try {
    const user = verifyToken(event);
    const body = JSON.parse(event.body || '{}');

    // Accepter les deux formats d'entrée
    const titre = body.titre ?? body.title;
    const matiere = body.matiere ?? body.subject;
    const type = body.type ?? 'devoir';
    const description = body.description ?? '';
    // date/heure (FR) ou dueDate (legacy)
    const date = body.date ?? (body.dueDate ? new Date(body.dueDate).toISOString().slice(0,10) : '');
    const heure = body.heure ?? '';

    if (!titre || !matiere || (!date && !body.dueDate)) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, message: 'Titre, matière et date requis' })
      };
    }

    const newEvent = new Event({
      titre,
      description,
      type,
      matiere,
      date,
      heure,
      groupe: body.groupe || 'Promo',
      groupes: Array.isArray(body.groupes) ? body.groupes : [],
      year: body.year || '',
      // Legacy mirrors
      title: titre,
      subject: matiere,
      dueDate: body.dueDate ? new Date(body.dueDate) : (date ? new Date(date) : undefined),
      priority: body.priority || 'medium',
      createdBy: user.id || user._id
    });

    await newEvent.save();

    return {
      statusCode: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, message: 'Devoir créé avec succès', event: newEvent })
    };
  } catch (error) {
    return {
      statusCode: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, message: 'Token invalide' })
    };
  }
};

// Handler pour mettre à jour un événement (compat simple)
const handleUpdateEvent = async (event) => {
  try {
    verifyToken(event);
    const body = JSON.parse(event.body || '{}');
    const { eventId } = body;

    if (!eventId) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, message: 'ID de l\'événement manquant' })
      };
    }

    const eventDoc = await Event.findById(eventId);
    if (!eventDoc) {
      return {
        statusCode: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, message: 'Événement non trouvé' })
      };
    }

    // Mettre à jour les champs fournis (FR/legacy)
    const assignIfDefined = (k, v) => { if (v !== undefined) eventDoc[k] = v; };
    assignIfDefined('titre', body.titre ?? body.title);
    assignIfDefined('description', body.description);
    assignIfDefined('type', body.type);
    assignIfDefined('matiere', body.matiere ?? body.subject);
    assignIfDefined('date', body.date);
    assignIfDefined('heure', body.heure);
    assignIfDefined('groupe', body.groupe);
    if (Array.isArray(body.groupes)) eventDoc.groupes = body.groupes;
    assignIfDefined('year', body.year);
    assignIfDefined('title', body.title ?? body.titre);
    assignIfDefined('subject', body.subject ?? body.matiere);
    if (body.dueDate !== undefined) eventDoc.dueDate = new Date(body.dueDate);

    await eventDoc.save();

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, message: 'Événement mis à jour avec succès', event: eventDoc })
    };
  } catch (error) {
    return {
      statusCode: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, message: 'Token invalide' })
    };
  }
};

// Handler pour supprimer un événement (compat URL & query)
const handleDeleteEvent = async (event) => {
  try {
    const decoded = verifyToken(event);
    const body = JSON.parse(event.body || '{}');
    let { eventId } = body;
    // Supporter aussi /api/events/:id et ?eventId=:id
    if (!eventId) {
      const qs = event.queryStringParameters || {};
      if (qs.eventId || qs.id) eventId = qs.eventId || qs.id;
    }
    if (!eventId) {
      const p = event.path || event.rawPath || '';
      const m = p.match(/events\/(?:\.netlify\/functions\/)?events\/([^\/]+)$/) || p.match(/events\/([^\/]+)$/);
      if (m && m[1]) eventId = m[1];
    }

    if (!eventId) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, message: 'ID de l\'événement manquant' })
      };
    }

    const eventDoc = await Event.findById(eventId);
    if (!eventDoc) {
      return {
        statusCode: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, message: 'Événement non trouvé' })
      };
    }

    // Autorisation: seul le créateur ou un admin/prof peut supprimer globalement
    const userId = decoded.id || decoded._id || decoded.userId;
    const isOwner = eventDoc.createdBy && (String(eventDoc.createdBy) === String(userId));
    // Récupérer le rôle de l'utilisateur si besoin
    let role = decoded.role;
    if (!role) {
      try {
        const UserModel = mongoose.models.User || mongoose.model('User', new mongoose.Schema({ role: String }));
        const u = await UserModel.findById(userId).lean();
        role = u?.role;
      } catch {}
    }
    const isPrivileged = role === 'admin' || role === 'prof';
    if (!isOwner && !isPrivileged) {
      return {
        statusCode: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, message: 'Non autorisé à supprimer cet événement' })
      };
    }

    await Event.findByIdAndDelete(eventId);

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, message: 'Événement supprimé avec succès' })
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
    await mongoose.connect(process.env.MONGODB_URI || '', { bufferCommands: false });

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
      body: JSON.stringify({ success: false, message: 'Erreur serveur interne' })
    };
  } finally {
    // Fermer la connexion MongoDB
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  }
};