const express = require('express');
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { requireCoachOrAdmin } = require('../middleware/roles');
const { toDateOnlyString } = require('../utils/dateOnly');

const router = express.Router();

// GET /api/sessions - Lister les sessions
router.get('/', async (req, res) => {
  try {
    const { courseId, date, status } = req.query;

    let sql = `
      SELECT s.*, 
        c.id as course_id, c.name as course_name, c.category, c.duration_minutes, c.max_participants, c.room,
        co.id as coach_id, co.user_id as coach_user_id,
        p.first_name as coach_first_name, p.last_name as coach_last_name
      FROM course_sessions s
      LEFT JOIN courses c ON s.course_id = c.id
      LEFT JOIN coaches co ON c.coach_id = co.id
      LEFT JOIN profiles p ON co.user_id = p.user_id
      WHERE 1=1
    `;
    const values = [];

    if (courseId) { sql += ' AND s.course_id = ?'; values.push(courseId); }
    if (date) { sql += ' AND s.session_date = ?'; values.push(date); }
    if (status) { sql += ' AND s.status = ?'; values.push(status); }

    sql += ' ORDER BY s.session_date ASC, s.start_time ASC';

    const rows = await query(sql, values);

    // Formater la réponse
    const sessions = rows.map(row => ({
      id: row.id,
      course_id: row.course_id,
      schedule_id: row.schedule_id,
      session_date: toDateOnlyString(row.session_date),
      start_time: row.start_time,
      end_time: row.end_time,
      status: row.status,
      notes: row.notes,
      created_at: row.created_at,
      courses: {
        id: row.course_id,
        name: row.course_name,
        category: row.category,
        duration_minutes: row.duration_minutes,
        max_participants: row.max_participants,
        room: row.room,
        coaches: row.coach_id ? {
          id: row.coach_id,
          user_id: row.coach_user_id,
          profiles: {
            first_name: row.coach_first_name,
            last_name: row.coach_last_name
          }
        } : null
      }
    }));

    res.json(sessions);
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des sessions' });
  }
});

// GET /api/sessions/upcoming - Sessions à venir
router.get('/upcoming', async (req, res) => {
  try {
    // IMPORTANT: éviter toISOString() (UTC) qui peut décaler la date et masquer les sessions du "jour".
    // On laisse la base calculer la date courante (timezone serveur).
    const rows = await query(`
      SELECT s.*, 
        c.id as course_id, c.name as course_name, c.category, c.duration_minutes, c.max_participants, c.room,
        co.id as coach_id, p.first_name as coach_first_name, p.last_name as coach_last_name
      FROM course_sessions s
      LEFT JOIN courses c ON s.course_id = c.id
      LEFT JOIN coaches co ON c.coach_id = co.id
      LEFT JOIN profiles p ON co.user_id = p.user_id
      WHERE s.session_date >= CURDATE() AND s.status = 'scheduled'
      ORDER BY s.session_date ASC, s.start_time ASC
      LIMIT 20
    `);

    const sessions = rows.map(row => ({
      id: row.id,
      course_id: row.course_id,
      session_date: toDateOnlyString(row.session_date),
      start_time: row.start_time,
      end_time: row.end_time,
      status: row.status,
      notes: row.notes,
      courses: {
        id: row.course_id,
        name: row.course_name,
        category: row.category,
        duration_minutes: row.duration_minutes,
        max_participants: row.max_participants,
        room: row.room,
        coaches: row.coach_id ? {
          profiles: {
            first_name: row.coach_first_name,
            last_name: row.coach_last_name
          }
        } : null
      }
    }));

    res.json(sessions);
  } catch (error) {
    console.error('Get upcoming sessions error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des sessions' });
  }
});

// GET /api/sessions/my - Sessions du coach connecté (toutes, pas de filtre date)
router.get('/my', authenticate, requireCoachOrAdmin, async (req, res) => {
  try {
    // Trouver l'ID coach (créer si absent)
    let coaches = await query('SELECT id FROM coaches WHERE user_id = ?', [req.user.id]);

    if (coaches.length === 0 && req.user.role === 'coach') {
      const newCoachId = require('crypto').randomUUID();
      await query('INSERT INTO coaches (id, user_id, is_active) VALUES (?, ?, 1)', [newCoachId, req.user.id]);
      coaches = [{ id: newCoachId }];
    }

    if (coaches.length === 0) {
      return res.json([]);
    }

    // Retourner TOUTES les sessions du coach (le front filtre par date/mode)
    const rows = await query(`
      SELECT s.*, c.id as course_id, c.name as course_name, c.category, c.max_participants, c.room
      FROM course_sessions s
      LEFT JOIN courses c ON s.course_id = c.id
      WHERE c.coach_id = ?
      ORDER BY s.session_date ASC, s.start_time ASC
    `, [coaches[0].id]);

    const sessions = rows.map(row => ({
      id: row.id,
      course_id: row.course_id,
      session_date: toDateOnlyString(row.session_date),
      start_time: row.start_time,
      end_time: row.end_time,
      status: row.status,
      notes: row.notes,
      courses: {
        id: row.course_id,
        name: row.course_name,
        category: row.category,
        max_participants: row.max_participants,
        room: row.room
      }
    }));

    res.json(sessions);
  } catch (error) {
    console.error('Get my sessions error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des sessions' });
  }
});

// GET /api/sessions/:id - Obtenir une session par ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const rows = await query(`
      SELECT s.*, 
        c.*, 
        co.id as coach_id, co.user_id as coach_user_id, co.bio as coach_bio,
        p.*
      FROM course_sessions s
      LEFT JOIN courses c ON s.course_id = c.id
      LEFT JOIN coaches co ON c.coach_id = co.id
      LEFT JOIN profiles p ON co.user_id = p.user_id
      WHERE s.id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Session non trouvée' });
    }
    const row = rows[0];
    res.json({
      ...row,
      session_date: toDateOnlyString(row.session_date),
    });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de la session' });
  }
});

// POST /api/sessions - Créer une session
router.post('/', authenticate, requireCoachOrAdmin, async (req, res) => {
  try {
    const { courseId, sessionDate, startTime, endTime, notes, scheduleId } = req.body;

    console.log('[Sessions POST] Request:', { courseId, sessionDate, startTime, endTime, userId: req.user.id, role: req.user.role });

    if (!courseId || !sessionDate || !startTime || !endTime) {
      return res.status(400).json({ error: 'Données manquantes: courseId, sessionDate, startTime et endTime sont requis' });
    }

    // Validation simple des formats (sécurité / intégrité)
    const isValidDate = typeof sessionDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(sessionDate);
    const isValidTime = (t) => typeof t === 'string' && /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(t);

    if (!isValidDate) {
      return res.status(400).json({ error: 'Format de date invalide (attendu: YYYY-MM-DD)' });
    }
    if (!isValidTime(startTime) || !isValidTime(endTime)) {
      return res.status(400).json({ error: 'Format horaire invalide (attendu: HH:mm)' });
    }

    const toMinutes = (t) => {
      const [h, m] = t.split(':');
      return Number(h) * 60 + Number(m);
    };

    if (toMinutes(endTime) <= toMinutes(startTime)) {
      return res.status(400).json({ error: "L'heure de fin doit être après l'heure de début" });
    }

    // Vérifier que le cours existe
    const courseCheck = await query('SELECT id, coach_id, name FROM courses WHERE id = ?', [courseId]);
    if (courseCheck.length === 0) {
      return res.status(404).json({ error: 'Cours non trouvé' });
    }

    console.log('[Sessions POST] Course found:', courseCheck[0]);

    // Vérifier que le coach est propriétaire du cours (si pas admin)
    if (req.user.role === 'coach') {
      // Trouver ou créer le profil coach
      let coaches = await query('SELECT id FROM coaches WHERE user_id = ?', [req.user.id]);
      console.log('[Sessions POST] Coach lookup for user:', req.user.id, 'found:', coaches);

      if (coaches.length === 0) {
        // Créer automatiquement le profil coach
        const newCoachId = require('crypto').randomUUID();
        await query('INSERT INTO coaches (id, user_id, is_active) VALUES (?, ?, 1)', [newCoachId, req.user.id]);
        coaches = [{ id: newCoachId }];
        console.log('[Sessions POST] Created new coach profile:', newCoachId);
      }

      const coachId = coaches[0].id;

      // Si le cours n'a pas de coach_id, l'assigner au coach actuel
      if (!courseCheck[0].coach_id) {
        await query('UPDATE courses SET coach_id = ? WHERE id = ?', [coachId, courseId]);
        console.log('[Sessions POST] Assigned course to coach:', coachId);
      } else if (courseCheck[0].coach_id !== coachId) {
        console.log('[Sessions POST] Access denied - course coach_id:', courseCheck[0].coach_id, 'vs user coach_id:', coachId);
        return res.status(403).json({
          error: 'Vous ne pouvez créer des sessions que pour vos propres cours',
          details: `Ce cours appartient à un autre coach (${courseCheck[0].name})`
        });
      }
    }

    const sessionId = require('crypto').randomUUID();

    await query(
      `INSERT INTO course_sessions (id, course_id, session_date, start_time, end_time, notes, schedule_id, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'scheduled')`,
      [sessionId, courseId, sessionDate, startTime, endTime, notes || null, scheduleId || null]
    );

    console.log('[Sessions POST] Session created:', sessionId);

    const rows = await query('SELECT * FROM course_sessions WHERE id = ?', [sessionId]);
    const row = rows[0];
    res.status(201).json({
      ...row,
      session_date: toDateOnlyString(row?.session_date),
    });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ error: 'Erreur lors de la création de la session: ' + (error?.message || 'unknown') });
  }
});

// PUT /api/sessions/:id - Mettre à jour une session
router.put('/:id', authenticate, requireCoachOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { sessionDate, startTime, endTime, status, notes } = req.body;

    const updates = [];
    const values = [];

    if (sessionDate !== undefined) { updates.push('session_date = ?'); values.push(sessionDate); }
    if (startTime !== undefined) { updates.push('start_time = ?'); values.push(startTime); }
    if (endTime !== undefined) { updates.push('end_time = ?'); values.push(endTime); }
    if (status !== undefined) { updates.push('status = ?'); values.push(status); }
    if (notes !== undefined) { updates.push('notes = ?'); values.push(notes); }

    if (updates.length > 0) {
      values.push(id);
      await query(`UPDATE course_sessions SET ${updates.join(', ')} WHERE id = ?`, values);
    }

    const rows = await query('SELECT * FROM course_sessions WHERE id = ?', [id]);
    const row = rows[0];
    res.json({
      ...row,
      session_date: toDateOnlyString(row?.session_date),
    });
  } catch (error) {
    console.error('Update session error:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la session' });
  }
});

// DELETE /api/sessions/:id - Supprimer une session (admin ou coach propriétaire)
router.delete('/:id', authenticate, requireCoachOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que la session existe et récupérer les infos du cours
    const sessions = await query(`
      SELECT s.id, c.coach_id, co.user_id as coach_user_id 
      FROM course_sessions s
      JOIN courses c ON s.course_id = c.id
      LEFT JOIN coaches co ON c.coach_id = co.id
      WHERE s.id = ?
    `, [id]);

    if (sessions.length === 0) {
      return res.status(404).json({ error: 'Session non trouvée' });
    }

    // Coach ne peut supprimer que les sessions de ses propres cours
    if (req.user.role === 'coach' && sessions[0].coach_user_id !== req.user.id) {
      return res.status(403).json({ error: 'Accès refusé - vous ne pouvez supprimer que les sessions de vos propres cours' });
    }

    // Supprimer les réservations associées
    await query('DELETE FROM reservations WHERE session_id = ?', [id]);

    // Supprimer la session
    await query('DELETE FROM course_sessions WHERE id = ?', [id]);

    res.json({ message: 'Session supprimée avec succès' });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de la session' });
  }
});

module.exports = router;
