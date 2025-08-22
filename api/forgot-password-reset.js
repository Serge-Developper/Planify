// API pour réinitialiser le mot de passe
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGINS || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Handle POST request to reset password
  if (req.method === 'POST') {
    try {
      console.log('🔍 Début de la requête forgot-password-reset');
      
      // Import dynamique des modules pour éviter les problèmes Vercel
      const { MongoClient } = await import('mongodb');
      const bcryptjs = await import('bcryptjs');
      
      const { username, newPassword } = req.body;
      console.log('📝 Username reçu:', username);
      console.log('📝 Nouveau mot de passe reçu (longueur):', newPassword ? newPassword.length : 0);
      
      // Validate input
      if (!username || !newPassword) {
        console.log('❌ Données manquantes');
        return res.status(400).json({
          success: false,
          message: 'Nom d\'utilisateur et nouveau mot de passe requis'
        });
      }
      
      if (newPassword.length < 8) {
        console.log('❌ Mot de passe trop court');
        return res.status(400).json({
          success: false,
          message: 'Le mot de passe doit contenir au moins 8 caractères'
        });
      }
      
      // Check environment variables
      if (!process.env.MONGODB_URI) {
        console.error('❌ MONGODB_URI manquante');
        throw new Error('MONGODB_URI environment variable is not set');
      }
      
      console.log('📡 Connexion à MongoDB...');
      const client = new MongoClient(process.env.MONGODB_URI);
      await client.connect();
      console.log('✅ Connexion MongoDB réussie');
      
      // Utiliser la base de données par défaut de l'URI
      const db = client.db();
      console.log('📋 Base de données utilisée:', db.databaseName);
      
      const usersCollection = db.collection('users');
      
      // Find user by username
      console.log('🔍 Recherche utilisateur:', username);
      const user = await usersCollection.findOne({ username: username });
      
      if (!user) {
        console.log('❌ Utilisateur non trouvé');
        await client.close();
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }
      
      console.log('✅ Utilisateur trouvé:', user.username);
      
      // Hash the new password
      console.log('🔐 Hashage du nouveau mot de passe...');
      const saltRounds = 12;
      const hashedPassword = await bcryptjs.default.hash(newPassword, saltRounds);
      
      // Update user's password
      console.log('💾 Mise à jour du mot de passe...');
      const result = await usersCollection.updateOne(
        { username: username },
        { $set: { password: hashedPassword } }
      );
      
      await client.close();
      console.log('📡 Connexion MongoDB fermée');
      
      if (result.modifiedCount === 1) {
        console.log('✅ Mot de passe mis à jour avec succès');
        res.status(200).json({
          success: true,
          message: 'Mot de passe mis à jour avec succès'
        });
      } else {
        console.log('❌ Erreur lors de la mise à jour');
        res.status(500).json({
          success: false,
          message: 'Erreur lors de la mise à jour du mot de passe'
        });
      }
      
    } catch (error) {
      console.error('❌ Erreur forgot-password-reset:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la réinitialisation du mot de passe',
        error: error.message
      });
    }
  } else {
    console.log('❌ Méthode non autorisée:', req.method);
    res.status(405).json({
      success: false,
      message: 'Méthode non autorisée'
    });
  }
}
