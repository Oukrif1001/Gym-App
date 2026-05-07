const express = require('express');
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roles');

const router = express.Router();

// GET /api/equipment - Lister les équipements
router.get('/', async (req, res) => {
  try {
    const { category, status } = req.query;

    let sql = 'SELECT * FROM equipment WHERE 1=1';
    const values = [];

    if (category) { sql += ' AND category = ?'; values.push(category); }
    if (status) { sql += ' AND status = ?'; values.push(status); }

    sql += ' ORDER BY category, name';

    const rows = await query(sql, values);
    res.json(rows);
  } catch (error) {
    console.error('Get equipment error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des équipements' });
  }
});

// GET /api/equipment/categories - Lister les catégories
router.get('/categories', async (req, res) => {
  try {
    const rows = await query('SELECT DISTINCT category FROM equipment ORDER BY category');
    const categories = rows.map(row => row.category);
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des catégories' });
  }
});

// GET /api/equipment/:id - Obtenir un équipement par ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await query('SELECT * FROM equipment WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Équipement non trouvé' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Get equipment error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'équipement' });
  }
});

// POST /api/equipment - Créer un équipement (admin)
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, category, quantity, purchaseDate, status, notes } = req.body;

    if (!name || !category) {
      return res.status(400).json({ error: 'Nom et catégorie requis' });
    }

    const equipmentId = require('crypto').randomUUID();

    await query(
      `INSERT INTO equipment (id, name, category, quantity, purchase_date, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [equipmentId, name, category, quantity || 1, purchaseDate, status || 'available', notes]
    );

    const rows = await query('SELECT * FROM equipment WHERE id = ?', [equipmentId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Create equipment error:', error);
    res.status(500).json({ error: 'Erreur lors de la création de l\'équipement' });
  }
});

// PUT /api/equipment/:id - Mettre à jour un équipement (admin)
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, quantity, status, lastMaintenance, nextMaintenance, notes } = req.body;

    const updates = [];
    const values = [];

    if (name !== undefined) { updates.push('name = ?'); values.push(name); }
    if (category !== undefined) { updates.push('category = ?'); values.push(category); }
    if (quantity !== undefined) { updates.push('quantity = ?'); values.push(quantity); }
    if (status !== undefined) { updates.push('status = ?'); values.push(status); }
    if (lastMaintenance !== undefined) { updates.push('last_maintenance = ?'); values.push(lastMaintenance); }
    if (nextMaintenance !== undefined) { updates.push('next_maintenance = ?'); values.push(nextMaintenance); }
    if (notes !== undefined) { updates.push('notes = ?'); values.push(notes); }

    if (updates.length > 0) {
      values.push(id);
      await query(`UPDATE equipment SET ${updates.join(', ')} WHERE id = ?`, values);
    }

    const rows = await query('SELECT * FROM equipment WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (error) {
    console.error('Update equipment error:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'équipement' });
  }
});

// DELETE /api/equipment/:id - Supprimer un équipement (admin)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM equipment WHERE id = ?', [id]);
    res.json({ message: 'Équipement supprimé avec succès' });
  } catch (error) {
    console.error('Delete equipment error:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de l\'équipement' });
  }
});

module.exports = router;
