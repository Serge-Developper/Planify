import { connectDB } from './lib/mongodb.ts';
import User from './models/User';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'https://planify-snowy.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Connect to MongoDB
    await connectDB();
    
    if (req.method === 'GET') {
      // Get all users
      const users = await User.find({}).select('-password');
      res.status(200).json(users);
    } else if (req.method === 'POST') {
      // Create new user
      const user = new User(req.body);
      await user.save();
      res.status(201).json({ message: 'Utilisateur créé avec succès' });
    } else {
      res.status(405).json({ message: 'Méthode non autorisée' });
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
}
