const express = require('express');
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roles');

const router = express.Router();

// GET /api/payments - Lister les paiements (admin)
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { userId, status, limit } = req.query;

    let sql = `
      SELECT pay.*, 
        p.first_name, p.last_name, p.email,
        st.name as subscription_name
      FROM payments pay
      LEFT JOIN profiles p ON pay.user_id = p.user_id
      LEFT JOIN subscriptions s ON pay.subscription_id = s.id
      LEFT JOIN subscription_types st ON s.subscription_type_id = st.id
      WHERE 1=1
    `;
    const values = [];

    if (userId) { sql += ' AND pay.user_id = ?'; values.push(userId); }
    if (status) { sql += ' AND pay.status = ?'; values.push(status); }

    sql += ' ORDER BY pay.created_at DESC';

    if (limit) { sql += ' LIMIT ?'; values.push(parseInt(limit)); }

    const rows = await query(sql, values);

    const payments = rows.map(row => ({
      id: row.id,
      user_id: row.user_id,
      subscription_id: row.subscription_id,
      amount: row.amount,
      payment_method: row.payment_method,
      status: row.status,
      stripe_payment_id: row.stripe_payment_id,
      invoice_number: row.invoice_number,
      notes: row.notes,
      created_at: row.created_at,
      profiles: {
        first_name: row.first_name,
        last_name: row.last_name,
        email: row.email
      },
      subscriptions: row.subscription_id ? {
        subscription_types: {
          name: row.subscription_name
        }
      } : null
    }));

    res.json(payments);
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des paiements' });
  }
});

// GET /api/payments/stats - Statistiques des paiements (admin)
router.get('/stats', authenticate, requireAdmin, async (req, res) => {
  try {
    // Total des paiements
    const allPayments = await query(
      'SELECT SUM(amount) as total, COUNT(*) as count FROM payments WHERE status = ?',
      ['completed']
    );

    const totalRevenue = parseFloat(allPayments[0].total) || 0;
    const totalPayments = parseInt(allPayments[0].count) || 0;

    // Paiements du mois
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthPayments = await query(
      'SELECT SUM(amount) as total, COUNT(*) as count FROM payments WHERE status = ? AND created_at >= ?',
      ['completed', startOfMonth.toISOString()]
    );

    const monthlyRevenue = parseFloat(monthPayments[0].total) || 0;

    res.json({
      totalRevenue,
      totalPayments,
      monthlyRevenue,
      monthlyPayments: parseInt(monthPayments[0].count) || 0
    });
  } catch (error) {
    console.error('Get payment stats error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
});

// GET /api/payments/my - Mes paiements
router.get('/my', authenticate, async (req, res) => {
  try {
    const rows = await query(`
      SELECT pay.*, st.name as subscription_name
      FROM payments pay
      LEFT JOIN subscriptions s ON pay.subscription_id = s.id
      LEFT JOIN subscription_types st ON s.subscription_type_id = st.id
      WHERE pay.user_id = ?
      ORDER BY pay.created_at DESC
    `, [req.user.id]);

    const payments = rows.map(row => ({
      id: row.id,
      user_id: row.user_id,
      subscription_id: row.subscription_id,
      amount: row.amount,
      payment_method: row.payment_method,
      status: row.status,
      invoice_number: row.invoice_number,
      notes: row.notes,
      created_at: row.created_at,
      subscriptions: row.subscription_id ? {
        subscription_types: {
          name: row.subscription_name
        }
      } : null
    }));

    res.json(payments);
  } catch (error) {
    console.error('Get my payments error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des paiements' });
  }
});

// GET /api/payments/:id - Obtenir un paiement par ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const rows = await query(`
      SELECT pay.*, p.*, s.*
      FROM payments pay
      LEFT JOIN profiles p ON pay.user_id = p.user_id
      LEFT JOIN subscriptions s ON pay.subscription_id = s.id
      WHERE pay.id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Paiement non trouvé' });
    }

    // Vérifier l'accès
    if (rows[0].user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du paiement' });
  }
});

// POST /api/payments - Créer un paiement
router.post('/', authenticate, async (req, res) => {
  try {
    const { amount, subscriptionId, paymentMethod, notes } = req.body;

    if (!amount) {
      return res.status(400).json({ error: 'Montant requis' });
    }

    // Générer un numéro de facture
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const paymentId = require('crypto').randomUUID();

    await query(
      `INSERT INTO payments (id, user_id, amount, subscription_id, payment_method, invoice_number, notes, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'completed')`,
      [paymentId, req.user.id, amount, subscriptionId, paymentMethod || 'card', invoiceNumber, notes]
    );

    const rows = await query('SELECT * FROM payments WHERE id = ?', [paymentId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ error: 'Erreur lors de la création du paiement' });
  }
});

// PUT /api/payments/:id - Mettre à jour un paiement (admin)
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const updates = [];
    const values = [];

    if (status !== undefined) { updates.push('status = ?'); values.push(status); }
    if (notes !== undefined) { updates.push('notes = ?'); values.push(notes); }

    if (updates.length > 0) {
      values.push(id);
      await query(`UPDATE payments SET ${updates.join(', ')} WHERE id = ?`, values);
    }

    const rows = await query('SELECT * FROM payments WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (error) {
    console.error('Update payment error:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du paiement' });
  }
});

module.exports = router;
