import express from 'express';
import mongoose from 'mongoose';

const app = express();

// Middleware CORS
app.use((req, res, next) => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['https://planify-snowy.vercel.app'];
  const origin = req.headers.origin;
  
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

app.use(express.json({ limit: '35mb' }));
app.use(express.urlencoded({ limit: '35mb', extended: true }));

// Modèle Event
const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  startDate: {
    type: Date,
    required: true
  },
  endDate: Date,
  location: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Event = mongoose.model('Event', eventSchema);

// Connexion à MongoDB
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('MONGODB_URI manquante');
      return;
    }
    
    await mongoose.connect(mongoUri);
    console.log('Connecté à MongoDB');
  } catch (err) {
    console.error('Erreur MongoDB :', err);
  }
};

// GET /api/events
app.get('/', async (req, res) => {
  try {
    await connectDB();
    const events = await Event.find({}).sort({ startDate: 1 });
    res.json({ success: true, events });
  } catch (error) {
    console.error('Erreur events:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Support explicit path when function is mounted at root
app.get('/api/events', async (req, res) => {
  try {
    await connectDB();
    const events = await Event.find({}).sort({ startDate: 1 });
    res.json({ success: true, events });
  } catch (error) {
    console.error('Erreur events (explicit path):', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

export default app;
