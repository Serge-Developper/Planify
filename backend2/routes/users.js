// @ts-nocheck
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Connexion
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(400).json({ message: 'Utilisateur non trouvé' });
  if (user.password !== password) return res.status(400).json({ message: 'Mot de passe incorrect' });

  // Créer le token JWT
  const token = jwt.sign(
    { id: user._id, role: user.role, year: user.year, groupe: user.groupe },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    _id: user._id,
    username: user.username,
    role: user.role,
    groupe: user.groupe,
    year: user.year,
    token: token  // Envoyer le token au client
  });
});

// (Optionnel) Création d'utilisateurs de test
router.post('/register', async (req, res) => {
  const { username, password, role, groupe, year } = req.body;
  const user = new User({ username, password, role, groupe, year });
  await user.save();
  res.json(user);
});

module.exports = router; 