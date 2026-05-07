const express = require('express');
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roles');

const router = express.Router();

// GET /api/subscription-types - Lister les types d'abonnement
router.get('/', async (req, res) => {
  try {
    const rows = await query('SELECT * FROM subscription_types WHERE is_active = 1 ORDER BY price');
    
    // Parser le JSON features
    const types = rows.map(row => ({
      ...row,
      features: row.features ? JSON.parse(row.features) : []
    }));

    res.json(types);
  } catch (error) {
    console.error('Get subscription types error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des types d\'abonnement' });
  }
});

// GET /api/subscription-types/all - Tous les types (admin)
router.get('/all', authenticate, requireAdmin, async (req, res) => {
  try {
    const rows = await query('SELECT * FROM subscription_types ORDER BY price');
    
    const types = rows.map(row => ({
      ...row,
      features: row.features ? JSON.parse(row.features) : []
    }));

    res.json(types);
  } catch (error) {
    console.error('Get all subscription types error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des types d\'abonnement' });
  }
});

// GET /api/subscription-types/:id - Obtenir un type par ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await query('SELECT * FROM subscription_types WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Type d\'abonnement non trouvé' });
    }

    const type = {
      ...rows[0],
      features: rows[0].features ? JSON.parse(rows[0].features) : []
    };

    res.json(type);
  } catch (error) {
    console.error('Get subscription type error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du type d\'abonnement' });
  }
});

// POST /api/subscription-types - Créer un type (admin)
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, price, durationMonths, maxClassesPerWeek, features, description } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ error: 'Nom et prix requis' });
    }

    const typeId = require('crypto').randomUUID();

    await query(
      `INSERT INTO subscription_types (id, name, price, duration_months, max_classes_per_week, features, description, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
      [typeId, name, price, durationMonths || 1, maxClassesPerWeek, JSON.stringify(features || []), description]
    );

    const rows = await query('SELECT * FROM subscription_types WHERE id = ?', [typeId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Create subscription type error:', error);
    res.status(500).json({ error: 'Erreur lors de la création du type d\'abonnement' });
  }
});

// PUT /api/subscription-types/:id - Mettre à jour un type (admin)
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, durationMonths, maxClassesPerWeek, features, description, isActive } = req.body;

    const updates = [];
    const values = [];

    if (name !== undefined) { updates.push('name = ?'); values.push(name); }
    if (price !== undefined) { updates.push('price = ?'); values.push(price); }
    if (durationMonths !== undefined) { updates.push('duration_months = ?'); values.push(durationMonths); }
    if (maxClassesPerWeek !== undefined) { updates.push('max_classes_per_week = ?'); values.push(maxClassesPerWeek); }
    if (features !== undefined) { updates.push('features = ?'); values.push(JSON.stringify(features)); }
    if (description !== undefined) { updates.push('description = ?'); values.push(description); }
    if (isActive !== undefined) { updates.push('is_active = ?'); values.push(isActive ? 1 : 0); }

    if (updates.length > 0) {
      values.push(id);
      await query(`UPDATE subscription_types SET ${updates.join(', ')} WHERE id = ?`, values);
    }

    const rows = await query('SELECT * FROM subscription_types WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (error) {
    console.error('Update subscription type error:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du type d\'abonnement' });
  }
});

// DELETE /api/subscription-types/:id - Supprimer un type (admin)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Désactiver plutôt que supprimer (pour garder l'historique)
    await query('UPDATE subscription_types SET is_active = 0 WHERE id = ?', [id]);

    const rows = await query('SELECT * FROM subscription_types WHERE id = ?', [id]);
    res.json({ message: 'Type d\'abonnement désactivé', data: rows[0] });
  } catch (error) {
    console.error('Delete subscription type error:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du type d\'abonnement' });
  }
});

module.exports = router;
