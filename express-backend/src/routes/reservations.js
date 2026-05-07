const express = require('express');
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { requireAdmin, requireCoachOrAdmin } = require('../middleware/roles');
const { toDateOnlyString } = require('../utils/dateOnly');

const router = express.Router();

// GET /api/reservations - Lister les réservations (admin)
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { sessionId, userId, status } = req.query;

    let sql = `
      SELECT r.*, 
        p.first_name, p.last_name, COALESCE(p.email, u.email) as email,
        s.session_date, s.start_time, s.end_time,
        c.name as course_name, c.category
      FROM reservations r
      LEFT JOIN profiles p ON r.user_id = p.user_id
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN course_sessions s ON r.session_id = s.id
      LEFT JOIN courses c ON s.course_id = c.id
      WHERE 1=1
    `;
    const values = [];

    if (sessionId) { sql += ' AND r.session_id = ?'; values.push(sessionId); }
    if (userId) { sql += ' AND r.user_id = ?'; values.push(userId); }
    if (status) { sql += ' AND r.status = ?'; values.push(status); }

    sql += ' ORDER BY r.booked_at DESC';

    const rows = await query(sql, values);

    const reservations = rows.map(row => ({
      id: row.id,
      session_id: row.session_id,
      user_id: row.user_id,
      status: row.status,
      booked_at: row.booked_at,
      cancelled_at: row.cancelled_at,
      profiles: {
        first_name: row.first_name,
        last_name: row.last_name,
        email: row.email
      },
      course_sessions: {
        session_date: toDateOnlyString(row.session_date),
        start_time: row.start_time,
        end_time: row.end_time,
        courses: {
          name: row.course_name,
          category: row.category
        }
      }
    }));

    res.json(reservations);
  } catch (error) {
    console.error('Get reservations error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des réservations' });
  }
});

// GET /api/reservations/my - Mes réservations
router.get('/my', authenticate, async (req, res) => {
  try {
    const rows = await query(`
      SELECT r.*,
      s.session_date, s.start_time, s.end_time, s.status as session_status,
      c.name as course_name, c.category, c.room,
      co.id as coach_id, p.first_name as coach_first_name, p.last_name as coach_last_name
      FROM reservations r
      LEFT JOIN course_sessions s ON r.session_id = s.id
      LEFT JOIN courses c ON s.course_id = c.id
      LEFT JOIN coaches co ON c.coach_id = co.id
      LEFT JOIN profiles p ON co.user_id = p.user_id
      WHERE r.user_id = ?
      ORDER BY r.booked_at DESC
        `, [req.user.id]);

    const reservations = rows.map(row => ({
      id: row.id,
      session_id: row.session_id,
      user_id: row.user_id,
      status: row.status,
      booked_at: row.booked_at,
      cancelled_at: row.cancelled_at,
      course_sessions: {
        session_date: toDateOnlyString(row.session_date),
        start_time: row.start_time,
        end_time: row.end_time,
        status: row.session_status,
        courses: {
          name: row.course_name,
          category: row.category,
          room: row.room,
          coaches: row.coach_id ? {
            profiles: {
              first_name: row.coach_first_name,
              last_name: row.coach_last_name
            }
          } : null
        }
      }
    }));

    res.json(reservations);
  } catch (error) {
    console.error('Get my reservations error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des réservations' });
  }
});

// GET /api/reservations/session/:sessionId - Réservations d'une session (coach)
router.get('/session/:sessionId', authenticate, requireCoachOrAdmin, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const rows = await query(`
      SELECT r.*, p.first_name, p.last_name, COALESCE(p.email, u.email) as email, p.phone
      FROM reservations r
      LEFT JOIN profiles p ON r.user_id = p.user_id
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.session_id = ?
      ORDER BY r.booked_at
        `, [sessionId]);

    const reservations = rows.map(row => ({
      id: row.id,
      session_id: row.session_id,
      user_id: row.user_id,
      status: row.status,
      booked_at: row.booked_at,
      cancelled_at: row.cancelled_at,
      profiles: {
        first_name: row.first_name,
        last_name: row.last_name,
        email: row.email,
        phone: row.phone
      }
    }));

    res.json(reservations);
  } catch (error) {
    console.error('Get session reservations error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des réservations' });
  }
});

// POST /api/reservations - Créer une réservation
router.post('/', authenticate, async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId requis' });
    }

    // Vérifier que la session existe et est disponible
    const sessions = await query(`
      SELECT s.*, c.max_participants
      FROM course_sessions s
      LEFT JOIN courses c ON s.course_id = c.id
      WHERE s.id = ? AND s.status = 'scheduled'
      `, [sessionId]);

    if (sessions.length === 0) {
      return res.status(400).json({ error: 'Session non disponible' });
    }

    const session = sessions[0];

    // Vérifier le nombre de places
    const countResult = await query(
      'SELECT COUNT(*) as count FROM reservations WHERE session_id = ? AND status = ?',
      [sessionId, 'confirmed']
    );

    if (countResult[0].count >= session.max_participants) {
      return res.status(400).json({ error: 'Session complète' });
    }

    // Vérifier si l'utilisateur a déjà réservé
    const existingReservations = await query(
      'SELECT id FROM reservations WHERE session_id = ? AND user_id = ? AND status = ?',
      [sessionId, req.user.id, 'confirmed']
    );

    if (existingReservations.length > 0) {
      return res.status(400).json({ error: 'Vous avez déjà réservé cette session' });
    }

    const reservationId = require('crypto').randomUUID();

    await query(
      'INSERT INTO reservations (id, session_id, user_id, status) VALUES (?, ?, ?, ?)',
      [reservationId, sessionId, req.user.id, 'confirmed']
    );

    const rows = await query('SELECT * FROM reservations WHERE id = ?', [reservationId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Create reservation error:', error);
    res.status(500).json({ error: 'Erreur lors de la création de la réservation' });
  }
});

// PUT /api/reservations/:id - Mettre à jour une réservation
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Vérifier que la réservation appartient à l'utilisateur (ou admin/coach)
    const reservations = await query('SELECT user_id FROM reservations WHERE id = ?', [id]);

    if (reservations.length === 0) {
      return res.status(404).json({ error: 'Réservation non trouvée' });
    }

    if (reservations[0].user_id !== req.user.id && !['admin', 'coach'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    let sql = 'UPDATE reservations SET status = ?';
    const values = [status];

    if (status === 'cancelled') {
      sql += ', cancelled_at = NOW()';
    }

    sql += ' WHERE id = ?';
    values.push(id);

    await query(sql, values);

    const rows = await query('SELECT * FROM reservations WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (error) {
    console.error('Update reservation error:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la réservation' });
  }
});

// PUT /api/reservations/:id/attendance - Marquer présence (coach)
router.put('/:id/attendance', authenticate, requireCoachOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { attended } = req.body;

    const status = attended ? 'attended' : 'no_show';

    await query('UPDATE reservations SET status = ? WHERE id = ?', [status, id]);

    const rows = await query('SELECT * FROM reservations WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la présence' });
  }
});

// DELETE /api/reservations/:id - Annuler une réservation
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que la réservation appartient à l'utilisateur (ou admin)
    const reservations = await query('SELECT user_id FROM reservations WHERE id = ?', [id]);

    if (reservations.length === 0) {
      return res.status(404).json({ error: 'Réservation non trouvée' });
    }

    if (reservations[0].user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    // Annuler plutôt que supprimer
    await query(
      'UPDATE reservations SET status = ?, cancelled_at = NOW() WHERE id = ?',
      ['cancelled', id]
    );

    const rows = await query('SELECT * FROM reservations WHERE id = ?', [id]);
    res.json({ message: 'Réservation annulée', data: rows[0] });
  } catch (error) {
    console.error('Cancel reservation error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'annulation de la réservation' });
  }
});

module.exports = router;
