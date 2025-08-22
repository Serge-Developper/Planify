const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token d\'accès requis' });
  }

  const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

  try {
    const decoded = jwt.verify(token, secret, {
      issuer: 'planify-api',
      audience: 'planify-frontend'
    });
    
    if (typeof decoded === 'string') {
      return res.status(401).json({ message: 'Token invalide' });
    }
    
    if (decoded.exp && Date.now() >= decoded.exp * 1000) {
      return res.status(401).json({ message: 'Token expiré' });
    }

    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expiré' });
    } else if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token invalide' });
    } else {
      return res.status(403).json({ message: 'Accès refusé' });
    }
  }
}

// Middleware pour vérifier les rôles
function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ message: 'Authentification requise' });
    }

    if (!Array.isArray(roles) || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Permissions insuffisantes' });
    }

    next();
  };
}

module.exports = { verifyToken, requireRole }; 