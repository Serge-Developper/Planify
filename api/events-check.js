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

// User Schema (for completedTasks)
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    await connectDB();
    
    console.log('🔍 Events-check start:', { method: req.method, body: req.body });
    
    const user = verifyToken(req);
    const userIdString = user.id || user._id;
    
    console.log('🔍 User from token:', { userIdString, userObj: user });
    
    // Validation de l'ObjectId avant conversion
    if (!userIdString || !mongoose.Types.ObjectId.isValid(userIdString)) {
      console.error('❌ Invalid userId:', userIdString);
      return res.status(400).json({ error: 'UserId invalide' });
    }
    
    const userId = new mongoose.Types.ObjectId(userIdString);
    
    console.log('🔍 Events-check debug:', { userIdString, userId, action: req.body.action, eventId: req.body.eventId });
    
    const { eventId, action } = req.body;
    
    if (!eventId || !action) {
      console.error('❌ Missing eventId or action:', { eventId, action });
      return res.status(400).json({ error: 'eventId et action requis' });
    }

    // Validation de l'eventId
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      console.error('❌ Invalid eventId:', eventId);
      return res.status(400).json({ error: 'EventId invalide' });
    }

    console.log('🔍 Searching for event:', eventId);
    const event = await Event.findById(eventId);
    console.log('🔍 Event found:', event ? 'Yes' : 'No', event ? { title: event.titre, checkedBy: event.checkedBy.length } : null);
    
    if (!event) {
      return res.status(404).json({ error: 'Événement non trouvé' });
    }

    switch (action) {
      case 'check':
        if (!event.checkedBy.some(id => id.equals(userId))) {
          // Vérifier si la tâche est en retard
          const [h, m] = (event.heure || '').split(':');
          const target = new Date(event.date);
          target.setHours(Number(h), Number(m || 0), 0, 0);
          const now = new Date();
          const isLate = now > target;

          // Ajouter l'utilisateur à la liste des utilisateurs qui ont validé cette tâche
          event.checkedBy.push(userId);
          await event.save();
          
          // Incrémenter le compteur de tâches complétées seulement si la tâche n'est PAS en retard
          if (!isLate) {
            await User.findByIdAndUpdate(userId, { $inc: { completedTasks: 1 } });
          }
        }
        break;
        
      case 'uncheck':
        if (event.checkedBy.some(id => id.equals(userId))) {
          // Vérifier si la tâche était en retard au moment de la validation
          const [h, m] = (event.heure || '').split(':');
          const target = new Date(event.date);
          target.setHours(Number(h), Number(m || 0), 0, 0);
          const now = new Date();
          const isLate = now > target;

          // Retirer l'utilisateur de la liste des utilisateurs qui ont validé cette tâche
          event.checkedBy = event.checkedBy.filter(id => !id.equals(userId));
          await event.save();
          
          // Décrémenter le compteur de tâches complétées seulement si la tâche n'était PAS en retard
          if (!isLate) {
            await User.findByIdAndUpdate(userId, { $inc: { completedTasks: -1 } });
          }
        }
        break;
        
      case 'archive':
        if (!event.archivedBy.some(id => id.equals(userId))) {
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

    console.log('✅ Events-check réussi:', { action, eventId, userId: userIdString });
    
    return res.status(200).json({ 
      message: `Événement ${action}é avec succès`,
      event: event 
    });

  } catch (authError) {
    console.error('❌ Erreur auth events-check:', authError.message);
    return res.status(401).json({ error: 'Non autorisé' });
  } catch (error) {
    console.error('❌ Erreur events-check:', error);
    res.status(500).json({ error: 'Erreur serveur interne', details: error.message });
  }
};