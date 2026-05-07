const express = require('express');
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { requireAdmin, requireCoachOrAdmin, invalidateRoleCache } = require('../middleware/roles');

const router = express.Router();

// GET /api/coaches - Lister tous les coachs actifs
router.get('/', async (req, res) => {
  try {
    const rows = await query(`
      SELECT c.*, p.first_name, p.last_name, p.email, p.phone, p.avatar_url
      FROM coaches c
      LEFT JOIN profiles p ON c.user_id = p.user_id
      WHERE c.is_active = 1
      ORDER BY c.created_at DESC
    `);

    // Formater pour correspondre à la structure attendue
    const coaches = rows.map(row => ({
      id: row.id,
      user_id: row.user_id,
      hourly_rate: row.hourly_rate,
      is_active: row.is_active,
      specializations: row.specializations ? JSON.parse(row.specializations) : null,
      certifications: row.certifications ? JSON.parse(row.certifications) : null,
      bio: row.bio,
      created_at: row.created_at,
      updated_at: row.updated_at,
      profiles: {
        first_name: row.first_name,
        last_name: row.last_name,
        email: row.email,
        phone: row.phone,
        avatar_url: row.avatar_url
      }
    }));

    res.json(coaches);
  } catch (error) {
    console.error('Get coaches error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des coachs' });
  }
});

// GET /api/coaches/all - Lister tous les coachs (admin)
router.get('/all', authenticate, requireAdmin, async (req, res) => {
  try {
    const rows = await query(`
      SELECT c.*, p.first_name, p.last_name, p.email, p.phone
      FROM coaches c
      LEFT JOIN profiles p ON c.user_id = p.user_id
      ORDER BY c.created_at DESC
    `);

    const coaches = rows.map(row => ({
      id: row.id,
      user_id: row.user_id,
      hourly_rate: row.hourly_rate,
      is_active: row.is_active,
      specializations: row.specializations ? JSON.parse(row.specializations) : null,
      certifications: row.certifications ? JSON.parse(row.certifications) : null,
      bio: row.bio,
      created_at: row.created_at,
      updated_at: row.updated_at,
      profiles: {
        first_name: row.first_name,
        last_name: row.last_name,
        email: row.email,
        phone: row.phone
      }
    }));

    res.json(coaches);
  } catch (error) {
    console.error('Get all coaches error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des coachs' });
  }
});

// GET /api/coaches/:id - Obtenir un coach par ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const rows = await query(`
      SELECT c.*, p.first_name, p.last_name, p.email, p.phone, p.avatar_url
      FROM coaches c
      LEFT JOIN profiles p ON c.user_id = p.user_id
      WHERE c.id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Coach non trouvé' });
    }

    const row = rows[0];
    const coach = {
      id: row.id,
      user_id: row.user_id,
      hourly_rate: row.hourly_rate,
      is_active: row.is_active,
      specializations: row.specializations ? JSON.parse(row.specializations) : null,
      certifications: row.certifications ? JSON.parse(row.certifications) : null,
      bio: row.bio,
      created_at: row.created_at,
      updated_at: row.updated_at,
      profiles: {
        first_name: row.first_name,
        last_name: row.last_name,
        email: row.email,
        phone: row.phone,
        avatar_url: row.avatar_url
      }
    };

    res.json(coach);
  } catch (error) {
    console.error('Get coach error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du coach' });
  }
});

// POST /api/coaches - Créer un coach (admin)
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    // Support both camelCase and snake_case
    const userId = req.body.userId || req.body.user_id;
    const hourlyRate = req.body.hourlyRate || req.body.hourly_rate;
    const { specializations, certifications, bio } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId requis' });
    }

    const coachId = require('crypto').randomUUID();

    // Créer le coach
    await query(
      `INSERT INTO coaches (id, user_id, hourly_rate, specializations, certifications, bio, is_active) 
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [coachId, userId, hourlyRate || 0, JSON.stringify(specializations || []), JSON.stringify(certifications || []), bio || null]
    );

    // Mettre à jour le rôle
    const existingRole = await query('SELECT id FROM user_roles WHERE user_id = ?', [userId]);

    if (existingRole.length > 0) {
      await query('UPDATE user_roles SET role = ? WHERE user_id = ?', ['coach', userId]);
    } else {
      await query('INSERT INTO user_roles (user_id, role) VALUES (?, ?)', [userId, 'coach']);
    }

    // Invalider le cache
    invalidateRoleCache(userId);

    const coaches = await query('SELECT * FROM coaches WHERE id = ?', [coachId]);
    res.status(201).json(coaches[0]);
  } catch (error) {
    console.error('Create coach error:', error);
    res.status(500).json({ error: 'Erreur lors de la création du coach' });
  }
});

// PUT /api/coaches/:id - Mettre à jour un coach
router.put('/:id', authenticate, requireCoachOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { hourlyRate, specializations, certifications, bio, isActive } = req.body;

    // Vérifier les permissions
    const coaches = await query('SELECT user_id FROM coaches WHERE id = ?', [id]);

    if (coaches.length === 0) {
      return res.status(404).json({ error: 'Coach non trouvé' });
    }

    if (req.user.role !== 'admin' && coaches[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const updates = [];
    const values = [];

    if (hourlyRate !== undefined) {
      updates.push('hourly_rate = ?');
      values.push(hourlyRate);
    }
    if (specializations !== undefined) {
      updates.push('specializations = ?');
      values.push(JSON.stringify(specializations));
    }
    if (certifications !== undefined) {
      updates.push('certifications = ?');
      values.push(JSON.stringify(certifications));
    }
    if (bio !== undefined) {
      updates.push('bio = ?');
      values.push(bio);
    }
    if (isActive !== undefined && req.user.role === 'admin') {
      updates.push('is_active = ?');
      values.push(isActive ? 1 : 0);
    }

    if (updates.length > 0) {
      values.push(id);
      await query(`UPDATE coaches SET ${updates.join(', ')} WHERE id = ?`, values);
    }

    const result = await query('SELECT * FROM coaches WHERE id = ?', [id]);
    res.json(result[0]);
  } catch (error) {
    console.error('Update coach error:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du coach' });
  }
});

// DELETE /api/coaches/:id - Supprimer un coach (admin)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Récupérer l'user_id avant suppression
    const coaches = await query('SELECT user_id FROM coaches WHERE id = ?', [id]);

    if (coaches.length === 0) {
      return res.status(404).json({ error: 'Coach non trouvé' });
    }

    const userId = coaches[0].user_id;

    // Supprimer le coach
    await query('DELETE FROM coaches WHERE id = ?', [id]);

    // Remettre le rôle à member
    await query('UPDATE user_roles SET role = ? WHERE user_id = ?', ['member', userId]);

    invalidateRoleCache(userId);

    res.json({ message: 'Coach supprimé avec succès' });
  } catch (error) {
    console.error('Delete coach error:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du coach' });
  }
});

module.exports = router;
