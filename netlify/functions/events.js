const mongoose = require('mongoose');

// MongoDB connection
let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    return;
  }
  
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
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
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  checkedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  archivedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

const Event = mongoose.models.Event || mongoose.model('Event', eventSchema);

// User Schema (for authentication)
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  coins: { type: Number, default: 0 },
  avatar: { type: String, default: null }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

// CORS headers
const setCorsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

// JWT verification
const jwt = require('jsonwebtoken');

const verifyToken = (req) => {
  const authHeader = event.headers.authorization;
  if (!authHeader) {
    throw new Error('Token manquant');
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    throw new Error('Token manquant');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'planify-api',
      audience: 'planify-frontend'
    });
    return decoded;
  } catch (error) {
    throw new Error('Token invalide');
  }
};

exports.handler = async (event, context) => {
  // Headers pour CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };
  
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    await connectDB();

    // GET /api/events - List all events
    if (event.httpMethod === 'GET') {
      const events = await Event.find({}).sort({ date: 1, heure: 1 });
      return res.status(200).json(events);
    }

    // POST /api/events - Create new event
    if (event.httpMethod === 'POST') {
      try {
        const user = verifyToken(req);
        const eventData = JSON.parse(event.body || '{}');
        
        const newEvent = new Event({
          ...eventData,
          createdBy: user.id || user._id
        });
        
        const savedEvent = await newEvent.save();
        return res.status(201).json(savedEvent);
      } catch (authError) {
        return { statusCode: 401, headers, body: JSON.stringify({ error: 'Non autorisé' }) };
      }
    }

    // PUT /api/events - Update event
    if (event.httpMethod === 'PUT') {
      try {
        const user = verifyToken(req);
        const { eventId, ...updateData } = JSON.parse(event.body || '{}');
        
        if (!eventId) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'ID événement requis dans le body' }) };
        }

        const updatedEvent = await Event.findByIdAndUpdate(
          eventId, 
          updateData, 
          { new: true }
        );
        
        if (!updatedEvent) {
          return { statusCode: 404, headers, body: JSON.stringify({ error: 'Événement non trouvé' }) };
        }

        return { statusCode: 200, headers, body: JSON.stringify({
          success: true,
          event: updatedEvent
        }) };
      } catch (authError) {
        return { statusCode: 401, headers, body: JSON.stringify({ error: 'Non autorisé' }) };
      }
    }

    // DELETE /api/events - Delete event
    if (event.httpMethod === 'DELETE') {
      try {
        const user = verifyToken(req);
        const { eventId } = JSON.parse(event.body || '{}');
        
        if (!eventId) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'ID événement requis dans le body' }) };
        }

        const deletedEvent = await Event.findByIdAndDelete(eventId);
        
        if (!deletedEvent) {
          return { statusCode: 404, headers, body: JSON.stringify({ error: 'Événement non trouvé' }) };
        }

        return { statusCode: 200, headers, body: JSON.stringify({ 
          success: true,
          message: 'Événement supprimé' 
        }) };
      } catch (authError) {
        return { statusCode: 401, headers, body: JSON.stringify({ error: 'Non autorisé' }) };
      }
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Méthode non autorisée' }) };

  } catch (error) {
    console.error('Erreur API events:', error);
    res.status(500).json({ error: 'Erreur serveur interne' });
  }
};