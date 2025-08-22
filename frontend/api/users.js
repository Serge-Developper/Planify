import mongoose from 'mongoose';

// Connexion MongoDB
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connexion MongoDB réussie'))
  .catch(err => console.error('❌ Erreur connexion MongoDB:', err));
}

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'prof', 'delegue', 'eleve', 'etudiant'], required: true },
  groupe: { type: String, enum: ['A', "A'", 'A"', 'B', "B'", 'B"', 'Promo'], default: null },
  year: { type: String, default: null },
  avatar: { type: String, default: null },
  coins: { type: Number, default: 0 },
  completedTasks: { type: Number, default: 0 },
  validations: { type: Number, default: 0 },
  lastSpinDate: { type: Date, default: null },
  purchasedItems: [{
    itemId: { type: Number, required: true },
    itemName: { type: String, required: true },
    purchaseDate: { type: Date, default: Date.now },
    equipped: { type: Boolean, default: false },
    adminMessage: { type: String, default: null },
    adminGiftRead: { type: Boolean, default: false }
  }],
  equippedItemId: { type: Number, default: null, required: false },
  selectedBorderColor: { type: String, default: 'default' },
  secretQuestions: [{
    question: { type: String, required: true },
    answer: { type: String, required: true }
  }]
});

const User = mongoose.model('User', userSchema);

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'GET') {
      const users = await User.find({}, { password: 0 });
      res.status(200).json({ users });
    } else {
      res.status(405).json({ error: 'Méthode non autorisée' });
    }
  } catch (error) {
    console.error('Erreur API users:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
}
