const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

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

// CORS headers
const setCorsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

// JWT verification
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    await connectDB();
    
    const user = verifyToken(req);
    const userId = user.id || user._id;
    
    const { eventId, action } = req.body;
    
    if (!eventId || !action) {
      return res.status(400).json({ error: 'eventId et action requis' });
    }

    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({ error: 'Événement non trouvé' });
    }

    switch (action) {
      case 'check':
        if (!event.checkedBy.includes(userId)) {
          event.checkedBy.push(userId);
          await event.save();
        }
        break;
        
      case 'uncheck':
        event.checkedBy = event.checkedBy.filter(id => !id.equals(userId));
        await event.save();
        break;
        
      case 'archive':
        if (!event.archivedBy.includes(userId)) {
          event.archivedBy.push(userId);
          await event.save();
        }
        break;
        
      case 'unarchive':
        event.archivedBy = event.archivedBy.filter(id => !id.equals(userId));
        await event.save();
        break;
        
      default:
        return res.status(400).json({ error: 'Action non supportée' });
    }

    return res.status(200).json({ 
      message: `Événement ${action}é avec succès`,
      event: event 
    });

  } catch (authError) {
    return res.status(401).json({ error: 'Non autorisé' });
  } catch (error) {
    console.error('Erreur lors de l\'action sur l\'événement:', error);
    res.status(500).json({ error: 'Erreur serveur interne' });
  }
};