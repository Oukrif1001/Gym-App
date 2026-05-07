const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

// Middleware d'authentification JWT
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token manquant' });
    }

    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Vérifier que l'utilisateur existe toujours
      const users = await query('SELECT id, email FROM users WHERE id = ?', [decoded.userId]);
      
      if (users.length === 0) {
        return res.status(401).json({ error: 'Utilisateur non trouvé' });
      }

      req.user = {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role
      };
      
      next();
    } catch (jwtError) {
      return res.status(401).json({ error: 'Token invalide ou expiré' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Erreur d\'authentification' });
  }
};

// Middleware optionnel (n'échoue pas si pas de token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = {
          id: decoded.userId,
          email: decoded.email,
          role: decoded.role
        };
      } catch (jwtError) {
        // Token invalide, continuer sans utilisateur
      }
    }
    
    next();
  } catch (error) {
    next();
  }
};

module.exports = { authenticate, optionalAuth };
