const { query } = require('../config/database');

// Cache des rôles pour éviter trop de requêtes
const roleCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Récupérer le rôle d'un utilisateur
const getUserRole = async (userId) => {
  // Vérifier le cache
  const cached = roleCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.role;
  }

  const rows = await query('SELECT role FROM user_roles WHERE user_id = ?', [userId]);
  const role = rows.length > 0 ? rows[0].role : 'member';
  
  // Mettre en cache
  roleCache.set(userId, { role, timestamp: Date.now() });
  
  return role;
};

// Middleware pour vérifier un rôle spécifique
const requireRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Non authentifié' });
      }

      const userRole = await getUserRole(req.user.id);
      req.user.role = userRole;

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({ 
          error: 'Accès refusé',
          required: allowedRoles,
          current: userRole
        });
      }

      next();
    } catch (error) {
      console.error('Role middleware error:', error);
      res.status(500).json({ error: 'Erreur de vérification des permissions' });
    }
  };
};

// Middleware admin uniquement
const requireAdmin = requireRole('admin');

// Middleware coach ou admin
const requireCoachOrAdmin = requireRole('admin', 'coach');

// Middleware membre authentifié (tout rôle)
const requireMember = requireRole('admin', 'coach', 'member');

// Invalider le cache d'un utilisateur
const invalidateRoleCache = (userId) => {
  roleCache.delete(userId);
};

module.exports = { 
  getUserRole, 
  requireRole, 
  requireAdmin, 
  requireCoachOrAdmin, 
  requireMember,
  invalidateRoleCache 
};
