const mongoose = require('mongoose');

// CORS headers
const setCorsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
};

// MongoDB connection
let isConnected = false;
async function connectDB() {
  if (isConnected) return;
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    isConnected = true;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

// Item Schema
const ItemSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  type: String,
  category: String,
  image: String,
  active: { type: Boolean, default: true },
  isWeekly: { type: Boolean, default: false },
  weeklyStartDate: Date,
  weeklyEndDate: Date,
  variants: [{
    name: String,
    price: Number,
    showText: { type: Boolean, default: false },
    textOnly: { type: Boolean, default: false },
    textContent: String,
    image: String
  }],
  createdAt: { type: Date, default: Date.now }
});

const Item = mongoose.models.Item || mongoose.model('Item', ItemSchema);

module.exports = async (req, res) => {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await connectDB();
    
    if (req.method === 'GET') {
      const currentDate = new Date();
      
      // Récupérer les items hebdomadaires actifs
      const weeklyItems = await Item.find({ 
        active: true,
        isWeekly: true,
        weeklyStartDate: { $lte: currentDate },
        weeklyEndDate: { $gte: currentDate }
      }).sort({ createdAt: -1 }).lean();
      
      // Formater les items avec variants
      const itemsWithVariants = weeklyItems.map(item => ({
        ...item,
        variants: Array.isArray(item.variants) ? item.variants.map(v => ({
          ...v,
          showText: !!v.showText,
          textOnly: !!v.textOnly,
          textContent: v.textContent || ''
        })) : []
      }));
      
      return res.status(200).json({ 
        success: true, 
        items: itemsWithVariants 
      });
    }
    
    return res.status(405).json({ error: 'Méthode non autorisée' });
  } catch (error) {
    console.error('Erreur weekly-items:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};