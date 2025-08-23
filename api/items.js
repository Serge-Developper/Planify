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

// Modèle Item
const itemSchema = new mongoose.Schema({
  legacyId: {
    type: Number,
    unique: true,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    default: 0
  },
  type: {
    type: String,
    enum: ['generic', 'discord', 'jojo'],
    default: 'generic'
  },
  infoOnly: {
    type: Boolean,
    default: false
  },
  infoDescription: String,
  availableInDailyShop: {
    type: Boolean,
    default: false
  },
  assets: [{
    src: String,
    style: {
      top: { type: Number, default: 0 },
      left: { type: Number, default: 0 },
      width: { type: Number, default: 100 },
      height: Number,
      rotate: { type: Number, default: 0 },
      objectFit: { type: String, default: 'contain' },
      zIndex: { type: Number, default: 1 }
    }
  }],
  backgrounds: {
    collection: String,
    leaderboard: String,
    avatar: String,
    navbar: String,
    'popup-style': String
  },
  variants: [{
    name: String,
    assets: [{
      src: String,
      style: {
        top: { type: Number, default: 0 },
        left: { type: Number, default: 0 },
        width: { type: Number, default: 100 },
        height: Number,
        rotate: { type: Number, default: 0 },
        objectFit: { type: String, default: 'contain' },
        zIndex: { type: Number, default: 1 }
      }
    }],
    backgrounds: {
      collection: String,
      leaderboard: String,
      avatar: String,
      navbar: String,
      'popup-style': String
    },
    textOnly: { type: Boolean, default: false },
    textContent: String
  }]
});

const Item = mongoose.model('Item', itemSchema);

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

// GET /api/items
app.get('/', async (req, res) => {
  try {
    await connectDB();
    const items = await Item.find({});
    res.json({
      success: true,
      items: items
    });
  } catch (error) {
    console.error('Erreur items:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

export default app;
