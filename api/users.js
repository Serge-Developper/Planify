import { connectDB } from './_shared/mongodb.js';
import { User } from './_shared/models.js';
import { handleCors } from './_shared/cors.js';

export default async function handler(req, res) {
  // Handle CORS
  if (handleCors(req, res)) return;

  try {
    await connectDB();

    if (req.method === 'GET') {
      // Leaderboard - top 10 users by coins
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
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('❌ Users API Error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
}