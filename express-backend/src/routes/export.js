const express = require('express');
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { requireAdmin, requireCoachOrAdmin } = require('../middleware/roles');
const { toDateOnlyString } = require('../utils/dateOnly');

const router = express.Router();

// GET /api/export/reservations - Export toutes les réservations (Admin/Coach)
router.get('/reservations', authenticate, requireCoachOrAdmin, async (req, res) => {
  try {
    const rows = await query(`
      SELECT 
        r.id as reservation_id,
        r.status,
        DATE_FORMAT(r.booked_at, '%Y-%m-%d %H:%i') as booked_at,
        DATE_FORMAT(r.cancelled_at, '%Y-%m-%d %H:%i') as cancelled_at,
        p.first_name,
        p.last_name,
        COALESCE(p.email, u.email) as email,
        p.phone,
        s.session_date,
        s.start_time,
        s.end_time,
        c.name as course_name,
        c.category,
        c.room,
        coach_p.first_name as coach_first_name,
        coach_p.last_name as coach_last_name
      FROM reservations r
      LEFT JOIN profiles p ON r.user_id = p.user_id
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN course_sessions s ON r.session_id = s.id
      LEFT JOIN courses c ON s.course_id = c.id
      LEFT JOIN coaches co ON c.coach_id = co.id
      LEFT JOIN profiles coach_p ON co.user_id = coach_p.user_id
      ORDER BY r.booked_at DESC
    `);

    const formattedRows = rows.map(row => ({
      ...row,
      session_date: row.session_date ? toDateOnlyString(row.session_date) : null
    }));

    res.json(formattedRows);
  } catch (error) {
    console.error('Export reservations error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'export des réservations' });
  }
});

// GET /api/export/reservations/my - Export mes réservations (Member)
router.get('/reservations/my', authenticate, async (req, res) => {
  try {
    const rows = await query(`
      SELECT 
        r.id as reservation_id,
        r.status,
        DATE_FORMAT(r.booked_at, '%Y-%m-%d %H:%i') as booked_at,
        DATE_FORMAT(r.cancelled_at, '%Y-%m-%d %H:%i') as cancelled_at,
        s.session_date,
        s.start_time,
        s.end_time,
        c.name as course_name,
        c.category,
        c.room,
        p.first_name as coach_first_name,
        p.last_name as coach_last_name
      FROM reservations r
      LEFT JOIN course_sessions s ON r.session_id = s.id
      LEFT JOIN courses c ON s.course_id = c.id
      LEFT JOIN coaches co ON c.coach_id = co.id
      LEFT JOIN profiles p ON co.user_id = p.user_id
      WHERE r.user_id = ?
      ORDER BY r.booked_at DESC
    `, [req.user.id]);

    const formattedRows = rows.map(row => ({
      ...row,
      session_date: row.session_date ? toDateOnlyString(row.session_date) : null
    }));

    res.json(formattedRows);
  } catch (error) {
    console.error('Export my reservations error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'export de vos réservations' });
  }
});

// GET /api/export/courses - Export tous les cours (Admin)
router.get('/courses', authenticate, requireAdmin, async (req, res) => {
  try {
    const rows = await query(`
      SELECT 
        c.id as course_id,
        c.name,
        c.description,
        c.category,
        c.duration_minutes,
        c.max_participants,
        c.difficulty_level,
        c.room,
        c.is_active,
        DATE_FORMAT(c.created_at, '%Y-%m-%d') as created_at,
        p.first_name as coach_first_name,
        p.last_name as coach_last_name
      FROM courses c
      LEFT JOIN coaches co ON c.coach_id = co.id
      LEFT JOIN profiles p ON co.user_id = p.user_id
      ORDER BY c.name
    `);

    res.json(rows);
  } catch (error) {
    console.error('Export courses error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'export des cours' });
  }
});

// GET /api/export/subscriptions - Export tous les abonnements (Admin)
router.get('/subscriptions', authenticate, requireAdmin, async (req, res) => {
  try {
    const rows = await query(`
      SELECT 
        s.id as subscription_id,
        p.first_name,
        p.last_name,
        COALESCE(p.email, u.email) as email,
        st.name as subscription_type,
        st.duration_days,
        st.price,
        DATE_FORMAT(s.start_date, '%Y-%m-%d') as start_date,
        DATE_FORMAT(s.end_date, '%Y-%m-%d') as end_date,
        s.status,
        s.auto_renew,
        DATE_FORMAT(s.created_at, '%Y-%m-%d') as created_at
      FROM subscriptions s
      LEFT JOIN profiles p ON s.user_id = p.user_id
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN subscription_types st ON s.subscription_type_id = st.id
      ORDER BY s.created_at DESC
    `);

    res.json(rows);
  } catch (error) {
    console.error('Export subscriptions error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'export des abonnements' });
  }
});

// GET /api/export/members - Export tous les membres (Admin)
router.get('/members', authenticate, requireAdmin, async (req, res) => {
  try {
    const rows = await query(`
      SELECT 
        p.user_id,
        p.first_name,
        p.last_name,
        p.email,
        p.phone,
        p.date_of_birth,
        p.address,
        DATE_FORMAT(p.created_at, '%Y-%m-%d') as created_at,
        ur.role
      FROM profiles p
      LEFT JOIN user_roles ur ON p.user_id = ur.user_id
      ORDER BY p.created_at DESC
    `);

    const formattedRows = rows.map(row => ({
      ...row,
      date_of_birth: row.date_of_birth ? toDateOnlyString(row.date_of_birth) : null
    }));

    res.json(formattedRows);
  } catch (error) {
    console.error('Export members error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'export des membres' });
  }
});

// GET /api/export/payments - Export tous les paiements (Admin)
router.get('/payments', authenticate, requireAdmin, async (req, res) => {
  try {
    const rows = await query(`
      SELECT 
        pay.id as payment_id,
        p.first_name,
        p.last_name,
        COALESCE(p.email, u.email) as email,
        pay.amount,
        pay.payment_method,
        pay.payment_status,
        pay.transaction_id,
        DATE_FORMAT(pay.payment_date, '%Y-%m-%d %H:%i') as payment_date,
        st.name as subscription_type
      FROM payments pay
      LEFT JOIN profiles p ON pay.user_id = p.user_id
      LEFT JOIN users u ON pay.user_id = u.id
      LEFT JOIN subscriptions s ON pay.subscription_id = s.id
      LEFT JOIN subscription_types st ON s.subscription_type_id = st.id
      ORDER BY pay.payment_date DESC
    `);

    res.json(rows);
  } catch (error) {
    console.error('Export payments error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'export des paiements' });
  }
});

// GET /api/export/payments/my - Export mes paiements (Member)
router.get('/payments/my', authenticate, async (req, res) => {
  try {
    const rows = await query(`
      SELECT 
        pay.id as payment_id,
        pay.amount,
        pay.payment_method,
        pay.payment_status,
        pay.transaction_id,
        DATE_FORMAT(pay.payment_date, '%Y-%m-%d %H:%i') as payment_date,
        st.name as subscription_type,
        st.duration_days
      FROM payments pay
      LEFT JOIN subscriptions s ON pay.subscription_id = s.id
      LEFT JOIN subscription_types st ON s.subscription_type_id = st.id
      WHERE pay.user_id = ?
      ORDER BY pay.payment_date DESC
    `, [req.user.id]);

    res.json(rows);
  } catch (error) {
    console.error('Export my payments error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'export de vos paiements' });
  }
});

// GET /api/export/sessions/my - Export mes sessions (Coach)
router.get('/sessions/my', authenticate, async (req, res) => {
  try {
    const rows = await query(`
      SELECT 
        s.id as session_id,
        c.name as course_name,
        c.category,
        c.room,
        s.session_date,
        s.start_time,
        s.end_time,
        s.status,
        s.notes,
        COUNT(r.id) as total_reservations,
        SUM(CASE WHEN r.status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_reservations,
        SUM(CASE WHEN r.status = 'attended' THEN 1 ELSE 0 END) as attended_count
      FROM course_sessions s
      LEFT JOIN courses c ON s.course_id = c.id
      LEFT JOIN coaches co ON c.coach_id = co.id
      LEFT JOIN reservations r ON s.id = r.session_id
      WHERE co.user_id = ?
      GROUP BY s.id, c.name, c.category, c.room, s.session_date, s.start_time, s.end_time, s.status, s.notes
      ORDER BY s.session_date DESC, s.start_time
    `, [req.user.id]);

    const formattedRows = rows.map(row => ({
      ...row,
      session_date: row.session_date ? toDateOnlyString(row.session_date) : null
    }));

    res.json(formattedRows);
  } catch (error) {
    console.error('Export my sessions error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'export de vos sessions' });
  }
});

// GET /api/export/attendance/:sessionId - Export présences d'une session (Coach)
router.get('/attendance/:sessionId', authenticate, requireCoachOrAdmin, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const rows = await query(`
      SELECT 
        p.first_name,
        p.last_name,
        COALESCE(p.email, u.email) as email,
        p.phone,
        r.status,
        DATE_FORMAT(r.booked_at, '%Y-%m-%d %H:%i') as booked_at
      FROM reservations r
      LEFT JOIN profiles p ON r.user_id = p.user_id
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.session_id = ?
      ORDER BY p.last_name, p.first_name
    `, [sessionId]);

    res.json(rows);
  } catch (error) {
    console.error('Export attendance error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'export des présences' });
  }
});

module.exports = router;
