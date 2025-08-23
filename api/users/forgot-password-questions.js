import { connectDB } from '../_shared/mongodb.js';
import { User } from '../_shared/models.js';
import { handleCors } from '../_shared/cors.js';

export default async function handler(req, res) {
  // Handle CORS
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nom d\'utilisateur requis' 
      });
    }

    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Utilisateur non trouvé' 
      });
    }

    // Si l'utilisateur n'a pas encore de questions secrètes, on en crée par défaut
    if (!user.secretQuestions || user.secretQuestions.length === 0) {
      const defaultQuestions = [
        { question: "Quel est le nom de votre premier animal ?", answer: "default" },
        { question: "Quel est le prénom de votre mère ?", answer: "default" },
        { question: "Quelle est votre ville de naissance ?", answer: "default" }
      ];
      
      user.secretQuestions = defaultQuestions;
      await user.save();
    }

    // Retourner seulement les questions (pas les réponses)
    const questions = user.secretQuestions.map(q => ({ question: q.question }));
    
    res.json({ 
      success: true,
      questions 
    });

  } catch (error) {
    console.error('❌ Forgot Password Questions Error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
}