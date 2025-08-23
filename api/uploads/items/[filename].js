const mongoose = require('mongoose');

// CORS headers
const setCorsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
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

// Schema pour les images stockées
const ImageSchema = new mongoose.Schema({
  filename: String,
  data: Buffer,
  contentType: String,
  uploadDate: { type: Date, default: Date.now }
});

const ItemImage = mongoose.models.ItemImage || mongoose.model('ItemImage', ImageSchema);

module.exports = async (req, res) => {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await connectDB();
    
    if (req.method === 'GET') {
      const { filename } = req.query;
      
      if (!filename) {
        return res.status(400).json({ error: 'Nom de fichier requis' });
      }

      // Chercher l'image dans la base de données
      const image = await ItemImage.findOne({ filename });
      
      if (!image) {
        // Si l'image n'est pas trouvée, retourner une image par défaut ou 404
        return res.status(404).json({ error: 'Image non trouvée' });
      }

      // Servir l'image avec le bon content-type
      res.setHeader('Content-Type', image.contentType || 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache 1 an
      return res.status(200).send(image.data);
    }
    
    return res.status(405).json({ error: 'Méthode non autorisée' });
  } catch (error) {
    console.error('Erreur service image:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};