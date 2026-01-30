const jwt = require('jsonwebtoken');

// Définition des types JSDoc pour les middlewares Express
/**
 * @typedef {import('express').Request & { user?: any }} RequestWithUser
 * @typedef {import('express').Response} Response
 * @typedef {import('express').NextFunction} NextFunction
 */

/**
 * @param {RequestWithUser} req
 * @param {Response} res
 * @param {NextFunction} next
 */
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
    const e = /** @type {any} */ (err);
    if (e.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expiré' });
    } else if (e.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token invalide' });
    } else {
      return res.status(403).json({ message: 'Accès refusé' });
    }
  }
}

// Middleware pour vérifier les rôles
/**
 * @param {string[]} roles
 */
function requireRole(roles) {
  /**
   * @param {RequestWithUser} req
   * @param {Response} res
   * @param {NextFunction} next
   */
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