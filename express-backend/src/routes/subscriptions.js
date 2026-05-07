const express = require('express');
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roles');
const { formatLocalYmd, todayLocalYmd } = require('../utils/dateOnly');

const router = express.Router();

// GET /api/subscriptions - Lister les abonnements (admin)
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { status, userId } = req.query;

    let sql = `
      SELECT s.*, 
        st.name as type_name, st.price, st.duration_months,
        p.first_name, p.last_name, p.email
      FROM subscriptions s
      LEFT JOIN subscription_types st ON s.subscription_type_id = st.id
      LEFT JOIN profiles p ON s.user_id = p.user_id
      WHERE 1=1
    `;
    const values = [];

    if (status) { sql += ' AND s.status = ?'; values.push(status); }
    if (userId) { sql += ' AND s.user_id = ?'; values.push(userId); }

    sql += ' ORDER BY s.created_at DESC';

    const rows = await query(sql, values);

    const subscriptions = rows.map(row => ({
      id: row.id,
      user_id: row.user_id,
      subscription_type_id: row.subscription_type_id,
      start_date: row.start_date,
      end_date: row.end_date,
      status: row.status,
      auto_renew: row.auto_renew,
      created_at: row.created_at,
      updated_at: row.updated_at,
      subscription_types: {
        name: row.type_name,
        price: row.price,
        duration_months: row.duration_months
      },
      profiles: {
        first_name: row.first_name,
        last_name: row.last_name,
        email: row.email
      }
    }));

    res.json(subscriptions);
  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des abonnements' });
  }
});

// GET /api/subscriptions/my - Mes abonnements
router.get('/my', authenticate, async (req, res) => {
  try {
    const rows = await query(`
      SELECT s.*, st.*
      FROM subscriptions s
      LEFT JOIN subscription_types st ON s.subscription_type_id = st.id
      WHERE s.user_id = ?
      ORDER BY s.start_date DESC
    `, [req.user.id]);

    const subscriptions = rows.map(row => ({
      id: row.id,
      user_id: row.user_id,
      subscription_type_id: row.subscription_type_id,
      start_date: row.start_date,
      end_date: row.end_date,
      status: row.status,
      auto_renew: row.auto_renew,
      created_at: row.created_at,
      updated_at: row.updated_at,
      subscription_types: {
        id: row.subscription_type_id,
        name: row.name,
        price: row.price,
        duration_months: row.duration_months,
        max_classes_per_week: row.max_classes_per_week,
        features: row.features ? JSON.parse(row.features) : null
      }
    }));

    res.json(subscriptions);
  } catch (error) {
    console.error('Get my subscriptions error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des abonnements' });
  }
});

// GET /api/subscriptions/my/active - Mon abonnement actif
router.get('/my/active', authenticate, async (req, res) => {
  try {
    // IMPORTANT: "today" doit être basé sur la date locale (pas UTC) pour éviter le -1 jour.
    const today = todayLocalYmd();

    const rows = await query(`
      SELECT s.*, st.*
      FROM subscriptions s
      LEFT JOIN subscription_types st ON s.subscription_type_id = st.id
      WHERE s.user_id = ? AND s.status = 'active' AND s.end_date >= ?
      LIMIT 1
    `, [req.user.id, today]);

    if (rows.length === 0) {
      return res.json(null);
    }

    const row = rows[0];
    const subscription = {
      id: row.id,
      user_id: row.user_id,
      subscription_type_id: row.subscription_type_id,
      start_date: row.start_date,
      end_date: row.end_date,
      status: row.status,
      auto_renew: row.auto_renew,
      subscription_types: {
        id: row.subscription_type_id,
        name: row.name,
        price: row.price,
        duration_months: row.duration_months,
        max_classes_per_week: row.max_classes_per_week,
        features: row.features ? JSON.parse(row.features) : null
      }
    };

    res.json(subscription);
  } catch (error) {
    console.error('Get active subscription error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'abonnement' });
  }
});

// POST /api/subscriptions - Créer un abonnement
router.post('/', authenticate, async (req, res) => {
  try {
    const { subscriptionTypeId, autoRenew } = req.body;

    if (!subscriptionTypeId) {
      return res.status(400).json({ error: 'Type d\'abonnement requis' });
    }

    // Récupérer le type d'abonnement
    const types = await query(
      'SELECT * FROM subscription_types WHERE id = ? AND is_active = 1',
      [subscriptionTypeId]
    );

    if (types.length === 0) {
      return res.status(400).json({ error: 'Type d\'abonnement invalide' });
    }

    const subType = types[0];

    // Calculer les dates (forcer midi pour éviter les effets DST autour de minuit)
    const startDate = new Date();
    startDate.setHours(12, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + subType.duration_months);

    const subscriptionId = require('crypto').randomUUID();

    await query(
      `INSERT INTO subscriptions (id, user_id, subscription_type_id, start_date, end_date, auto_renew, status)
       VALUES (?, ?, ?, ?, ?, ?, 'active')`,
      [
        subscriptionId,
        req.user.id,
        subscriptionTypeId,
        formatLocalYmd(startDate),
        formatLocalYmd(endDate),
        autoRenew ? 1 : 0,
      ]
    );

    const rows = await query('SELECT * FROM subscriptions WHERE id = ?', [subscriptionId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Create subscription error:', error);
    res.status(500).json({ error: 'Erreur lors de la création de l\'abonnement' });
  }
});

// PUT /api/subscriptions/:id - Mettre à jour un abonnement (admin)
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, endDate, autoRenew } = req.body;

    const updates = [];
    const values = [];

    if (status !== undefined) { updates.push('status = ?'); values.push(status); }
    if (endDate !== undefined) { updates.push('end_date = ?'); values.push(endDate); }
    if (autoRenew !== undefined) { updates.push('auto_renew = ?'); values.push(autoRenew ? 1 : 0); }

    if (updates.length > 0) {
      values.push(id);
      await query(`UPDATE subscriptions SET ${updates.join(', ')} WHERE id = ?`, values);
    }

    const rows = await query('SELECT * FROM subscriptions WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (error) {
    console.error('Update subscription error:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'abonnement' });
  }
});

// PUT /api/subscriptions/:id/cancel - Annuler un abonnement
router.put('/:id/cancel', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que l'abonnement appartient à l'utilisateur (ou admin)
    const subscriptions = await query('SELECT user_id FROM subscriptions WHERE id = ?', [id]);

    if (subscriptions.length === 0) {
      return res.status(404).json({ error: 'Abonnement non trouvé' });
    }

    if (subscriptions[0].user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    await query(
      'UPDATE subscriptions SET status = ?, auto_renew = 0 WHERE id = ?',
      ['cancelled', id]
    );

    const rows = await query('SELECT * FROM subscriptions WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'annulation de l\'abonnement' });
  }
});

module.exports = router;
