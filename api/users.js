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

// Modèle User
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  coins: {
    type: Number,
    default: 0
  },
  avatar: {
    type: String,
    default: null
  },
  inventory: [{
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item'
    },
    equipped: {
      type: Boolean,
      default: false
    },
    equippedSlot: {
      type: String,
      enum: ['avatar', 'border', 'background'],
      default: 'avatar'
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', userSchema);

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

// GET /api/users/leaderboard
app.get('/leaderboard', async (req, res) => {
  try {
    await connectDB();
    const users = await User.find({}, 'username coins avatar')
      .sort({ coins: -1 })
      .limit(10);
    
    res.json({
      success: true,
      users: users.map(user => ({
        id: user._id,
        username: user.username,
        coins: user.coins,
        avatar: user.avatar
      }))
    });
  } catch (error) {
    console.error('Erreur leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

export default app;
