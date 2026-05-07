const express = require('express');
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { requireAdmin, requireCoachOrAdmin } = require('../middleware/roles');

const router = express.Router();

// GET /api/profiles - Lister tous les profils (admin/coach)
router.get('/', authenticate, requireCoachOrAdmin, async (req, res) => {
  try {
    const rows = await query(`
      SELECT p.*, r.role 
      FROM profiles p
      LEFT JOIN user_roles r ON p.user_id = r.user_id
      ORDER BY p.created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Get profiles error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des profils' });
  }
});

// GET /api/profiles/me - Obtenir son propre profil
router.get('/me', authenticate, async (req, res) => {
  try {
    const rows = await query('SELECT * FROM profiles WHERE user_id = ?', [req.user.id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Profil non trouvé' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Get my profile error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du profil' });
  }
});

// GET /api/profiles/:id - Obtenir un profil par ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await query('SELECT * FROM profiles WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Profil non trouvé' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du profil' });
  }
});

// PUT /api/profiles/me - Mettre à jour son profil
router.put('/me', authenticate, async (req, res) => {
  try {
    const { firstName, lastName, phone, address, dateOfBirth, emergencyContact, emergencyPhone } = req.body;

    await query(
      `UPDATE profiles SET 
        first_name = ?, 
        last_name = ?, 
        phone = ?, 
        address = ?, 
        date_of_birth = ?, 
        emergency_contact = ?, 
        emergency_phone = ?
      WHERE user_id = ?`,
      [
        firstName || null,
        lastName || null,
        phone || null,
        address || null,
        dateOfBirth || null,
        emergencyContact || null,
        emergencyPhone || null,
        req.user.id
      ]
    );

    const rows = await query('SELECT * FROM profiles WHERE user_id = ?', [req.user.id]);
    res.json(rows[0]);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du profil' });
  }
});

// PUT /api/profiles/:userId - Mettre à jour un profil (admin)
router.put('/:userId', authenticate, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { firstName, lastName, phone, email } = req.body;
    const existingProfile = await query('SELECT email FROM profiles WHERE user_id = ?', [userId]);
    const finalEmail = email !== undefined ? email : (existingProfile[0]?.email || null);

    await query(
      `UPDATE profiles SET 
        first_name = ?, 
        last_name = ?, 
        phone = ?, 
        email = ?
      WHERE user_id = ?`,
      [firstName || null, lastName || null, phone || null, finalEmail, userId]
    );

    const rows = await query('SELECT * FROM profiles WHERE user_id = ?', [userId]);
    res.json(rows[0]);
  } catch (error) {
    console.error('Admin update profile error:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du profil' });
  }
});

// DELETE /api/profiles/:userId - Supprimer un utilisateur (admin)
router.delete('/:userId', authenticate, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    // Empêcher l'admin de se supprimer lui-même
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte' });
    }

    // Supprimer l'utilisateur (CASCADE supprimera profile, roles, etc.)
    await query('DELETE FROM users WHERE id = ?', [userId]);

    res.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de l\'utilisateur' });
  }
});

module.exports = router;
