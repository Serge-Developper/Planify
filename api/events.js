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
  const authHeader = req.headers.authorization;
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

module.exports = async (req, res) => {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await connectDB();

    // GET /api/events - List all events
    if (req.method === 'GET') {
      const events = await Event.find({}).sort({ date: 1, heure: 1 });
      return res.status(200).json(events);
    }

    // POST /api/events - Create new event
    if (req.method === 'POST') {
      try {
        const user = verifyToken(req);
        const eventData = req.body;
        
        const newEvent = new Event({
          ...eventData,
          createdBy: user.id || user._id
        });
        
        const savedEvent = await newEvent.save();
        return res.status(201).json(savedEvent);
      } catch (authError) {
        return res.status(401).json({ error: 'Non autorisé' });
      }
    }

    // PUT /api/events - Update event
    if (req.method === 'PUT') {
      try {
        const user = verifyToken(req);
        const { eventId, ...updateData } = req.body;
        
        if (!eventId) {
          return res.status(400).json({ error: 'ID événement requis dans le body' });
        }

        const updatedEvent = await Event.findByIdAndUpdate(
          eventId, 
          updateData, 
          { new: true }
        );
        
        if (!updatedEvent) {
          return res.status(404).json({ error: 'Événement non trouvé' });
        }

        return res.status(200).json({
          success: true,
          event: updatedEvent
        });
      } catch (authError) {
        return res.status(401).json({ error: 'Non autorisé' });
      }
    }

    // DELETE /api/events - Delete event
    if (req.method === 'DELETE') {
      try {
        const user = verifyToken(req);
        const { eventId } = req.body;
        
        if (!eventId) {
          return res.status(400).json({ error: 'ID événement requis dans le body' });
        }

        const deletedEvent = await Event.findByIdAndDelete(eventId);
        
        if (!deletedEvent) {
          return res.status(404).json({ error: 'Événement non trouvé' });
        }

        return res.status(200).json({ 
          success: true,
          message: 'Événement supprimé' 
        });
      } catch (authError) {
        return res.status(401).json({ error: 'Non autorisé' });
      }
    }

    return res.status(405).json({ error: 'Méthode non autorisée' });

  } catch (error) {
    console.error('Erreur API events:', error);
    res.status(500).json({ error: 'Erreur serveur interne' });
  }
};