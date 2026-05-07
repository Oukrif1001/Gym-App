const express = require('express');
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roles');

const router = express.Router();

// GET /api/schedules - Lister les plannings
router.get('/', async (req, res) => {
  try {
    const { courseId } = req.query;

    let sql = `
      SELECT s.*, c.id as course_id, c.name as course_name, c.category, c.duration_minutes
      FROM course_schedules s
      LEFT JOIN courses c ON s.course_id = c.id
      WHERE s.is_active = 1
    `;
    const values = [];

    if (courseId) { sql += ' AND s.course_id = ?'; values.push(courseId); }

    sql += ' ORDER BY s.day_of_week, s.start_time';

    const rows = await query(sql, values);

    const schedules = rows.map(row => ({
      id: row.id,
      course_id: row.course_id,
      day_of_week: row.day_of_week,
      start_time: row.start_time,
      end_time: row.end_time,
      is_active: row.is_active,
      created_at: row.created_at,
      courses: {
        id: row.course_id,
        name: row.course_name,
        category: row.category,
        duration_minutes: row.duration_minutes
      }
    }));

    res.json(schedules);
  } catch (error) {
    console.error('Get schedules error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des plannings' });
  }
});

// GET /api/schedules/:id - Obtenir un planning par ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const rows = await query(`
      SELECT s.*, c.*
      FROM course_schedules s
      LEFT JOIN courses c ON s.course_id = c.id
      WHERE s.id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Planning non trouvé' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Get schedule error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du planning' });
  }
});

// POST /api/schedules - Créer un planning (admin)
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { courseId, dayOfWeek, startTime, endTime } = req.body;

    if (!courseId || dayOfWeek === undefined || !startTime || !endTime) {
      return res.status(400).json({ error: 'Données manquantes' });
    }

    if (dayOfWeek < 0 || dayOfWeek > 6) {
      return res.status(400).json({ error: 'Jour de la semaine invalide (0-6)' });
    }

    const scheduleId = require('crypto').randomUUID();

    await query(
      `INSERT INTO course_schedules (id, course_id, day_of_week, start_time, end_time, is_active)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [scheduleId, courseId, dayOfWeek, startTime, endTime]
    );

    const rows = await query('SELECT * FROM course_schedules WHERE id = ?', [scheduleId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Create schedule error:', error);
    res.status(500).json({ error: 'Erreur lors de la création du planning' });
  }
});

// PUT /api/schedules/:id - Mettre à jour un planning (admin)
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { dayOfWeek, startTime, endTime, isActive } = req.body;

    const updates = [];
    const values = [];

    if (dayOfWeek !== undefined) { updates.push('day_of_week = ?'); values.push(dayOfWeek); }
    if (startTime !== undefined) { updates.push('start_time = ?'); values.push(startTime); }
    if (endTime !== undefined) { updates.push('end_time = ?'); values.push(endTime); }
    if (isActive !== undefined) { updates.push('is_active = ?'); values.push(isActive ? 1 : 0); }

    if (updates.length > 0) {
      values.push(id);
      await query(`UPDATE course_schedules SET ${updates.join(', ')} WHERE id = ?`, values);
    }

    const rows = await query('SELECT * FROM course_schedules WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (error) {
    console.error('Update schedule error:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du planning' });
  }
});

// DELETE /api/schedules/:id - Supprimer un planning (admin)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM course_schedules WHERE id = ?', [id]);
    res.json({ message: 'Planning supprimé avec succès' });
  } catch (error) {
    console.error('Delete schedule error:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du planning' });
  }
});

module.exports = router;
