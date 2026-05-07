const express = require('express');
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { requireAdmin, invalidateRoleCache } = require('../middleware/roles');

const router = express.Router();

// GET /api/user-roles - Lister les rôles (admin)
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const rows = await query(`
      SELECT r.*, p.first_name, p.last_name, p.email
      FROM user_roles r
      LEFT JOIN profiles p ON r.user_id = p.user_id
      ORDER BY r.created_at DESC
    `);

    const roles = rows.map(row => ({
      id: row.id,
      user_id: row.user_id,
      role: row.role,
      created_at: row.created_at,
      profiles: {
        first_name: row.first_name,
        last_name: row.last_name,
        email: row.email
      }
    }));

    res.json(roles);
  } catch (error) {
    console.error('Get user roles error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des rôles' });
  }
});

// GET /api/user-roles/:userId - Obtenir le rôle d'un utilisateur
router.get('/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;

    // Un utilisateur peut voir son propre rôle, admin peut voir tous les rôles
    if (userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const rows = await query('SELECT * FROM user_roles WHERE user_id = ?', [userId]);

    if (rows.length === 0) {
      return res.json({ user_id: userId, role: 'member' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Get user role error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du rôle' });
  }
});

// PUT /api/user-roles/:userId - Modifier le rôle d'un utilisateur (admin)
router.put('/:userId', authenticate, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!role || !['admin', 'coach', 'member'].includes(role)) {
      return res.status(400).json({ error: 'Rôle invalide' });
    }

    // Empêcher l'admin de modifier son propre rôle
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Vous ne pouvez pas modifier votre propre rôle' });
    }

    // Vérifier si un rôle existe déjà
    const existingRole = await query('SELECT id FROM user_roles WHERE user_id = ?', [userId]);

    if (existingRole.length > 0) {
      // Mettre à jour
      await query('UPDATE user_roles SET role = ? WHERE user_id = ?', [role, userId]);
    } else {
      // Créer
      await query('INSERT INTO user_roles (user_id, role) VALUES (?, ?)', [userId, role]);
    }

    // Invalider le cache
    invalidateRoleCache(userId);

    // Si le rôle devient coach, créer un profil coach si nécessaire
    if (role === 'coach') {
      const existingCoach = await query('SELECT id FROM coaches WHERE user_id = ?', [userId]);

      if (existingCoach.length === 0) {
        const coachId = require('crypto').randomUUID();
        await query('INSERT INTO coaches (id, user_id, is_active) VALUES (?, ?, 1)', [coachId, userId]);
      } else {
        await query('UPDATE coaches SET is_active = 1 WHERE user_id = ?', [userId]);
      }
    } else {
      // Si le rôle n'est plus coach, on désactive son profil coach
      await query('UPDATE coaches SET is_active = 0 WHERE user_id = ?', [userId]);
    }

    const rows = await query('SELECT * FROM user_roles WHERE user_id = ?', [userId]);
    res.json(rows[0]);
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du rôle' });
  }
});

module.exports = router;
