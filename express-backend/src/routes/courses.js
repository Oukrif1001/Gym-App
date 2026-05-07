const express = require('express');
const { query } = require('../config/database');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { requireAdmin, requireCoachOrAdmin } = require('../middleware/roles');

const router = express.Router();

// GET /api/courses - Lister tous les cours actifs
router.get('/', optionalAuth, async (req, res) => {
  try {
    let sql = `
      SELECT c.*, 
        co.id as coach_id, co.user_id as coach_user_id, co.specializations,
        p.first_name as coach_first_name, p.last_name as coach_last_name
      FROM courses c
      LEFT JOIN coaches co ON c.coach_id = co.id
      LEFT JOIN profiles p ON co.user_id = p.user_id
    `;

    // Si pas admin, filtrer uniquement les actifs
    if (!req.user || req.user.role !== 'admin') {
      sql += ' WHERE c.is_active = 1';
    }

    sql += ' ORDER BY c.name';

    const rows = await query(sql);

    // Formater la réponse
    const courses = rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      category: row.category,
      coach_id: row.coach_id,
      duration_minutes: row.duration_minutes,
      max_participants: row.max_participants,
      difficulty_level: row.difficulty_level,
      room: row.room,
      is_active: row.is_active,
      created_at: row.created_at,
      updated_at: row.updated_at,
      coaches: row.coach_id ? {
        id: row.coach_id,
        user_id: row.coach_user_id,
        specializations: row.specializations ? JSON.parse(row.specializations) : null,
        profiles: {
          first_name: row.coach_first_name,
          last_name: row.coach_last_name
        }
      } : null
    }));

    res.json(courses);
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des cours' });
  }
});

// GET /api/courses/my - Cours du coach connecté
router.get('/my', authenticate, requireCoachOrAdmin, async (req, res) => {
  try {
    // Trouver l'ID coach
    const coaches = await query('SELECT id FROM coaches WHERE user_id = ?', [req.user.id]);

    if (coaches.length === 0) {
      return res.json([]);
    }

    const rows = await query(
      'SELECT * FROM courses WHERE coach_id = ? AND is_active = 1 ORDER BY name',
      [coaches[0].id]
    );

    res.json(rows);
  } catch (error) {
    console.error('Get my courses error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des cours' });
  }
});

// GET /api/courses/:id - Obtenir un cours par ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const rows = await query(`
      SELECT c.*, 
        co.id as coach_id, co.user_id as coach_user_id, co.bio as coach_bio, co.specializations,
        p.first_name as coach_first_name, p.last_name as coach_last_name, p.avatar_url as coach_avatar
      FROM courses c
      LEFT JOIN coaches co ON c.coach_id = co.id
      LEFT JOIN profiles p ON co.user_id = p.user_id
      WHERE c.id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Cours non trouvé' });
    }

    const row = rows[0];
    const course = {
      id: row.id,
      name: row.name,
      description: row.description,
      category: row.category,
      coach_id: row.coach_id,
      duration_minutes: row.duration_minutes,
      max_participants: row.max_participants,
      difficulty_level: row.difficulty_level,
      room: row.room,
      is_active: row.is_active,
      created_at: row.created_at,
      updated_at: row.updated_at,
      coaches: row.coach_id ? {
        id: row.coach_id,
        user_id: row.coach_user_id,
        bio: row.coach_bio,
        specializations: row.specializations ? JSON.parse(row.specializations) : null,
        profiles: {
          first_name: row.coach_first_name,
          last_name: row.coach_last_name,
          avatar_url: row.coach_avatar
        }
      } : null
    };

    res.json(course);
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du cours' });
  }
});

// POST /api/courses - Créer un cours
router.post('/', authenticate, requireCoachOrAdmin, async (req, res) => {
  try {
    const { name, description, category, durationMinutes, maxParticipants, difficultyLevel, room, coachId } = req.body;

    if (!name || !category) {
      return res.status(400).json({ error: 'Nom et catégorie requis' });
    }

    let finalCoachId = coachId || null;

    // Si coach (pas admin), utiliser son propre ID (et créer un profil coach si absent)
    if (req.user.role === 'coach') {
      let coaches = await query('SELECT id FROM coaches WHERE user_id = ?', [req.user.id]);

      if (coaches.length === 0) {
        const newCoachId = require('crypto').randomUUID();
        await query('INSERT INTO coaches (id, user_id, is_active) VALUES (?, ?, 1)', [newCoachId, req.user.id]);
        coaches = [{ id: newCoachId }];
      }

      finalCoachId = coaches[0].id;
    }
    // Si admin et coachId fourni, vérifier que le coach existe
    else if (req.user.role === 'admin' && coachId) {
      const coaches = await query('SELECT id FROM coaches WHERE id = ?', [coachId]);
      if (coaches.length === 0) {
        return res.status(400).json({ error: 'Coach non trouvé' });
      }
    }
    // Admin peut créer un cours sans coach (finalCoachId sera null)

    const courseId = require('crypto').randomUUID();

    await query(
      `INSERT INTO courses (id, name, description, category, duration_minutes, max_participants, difficulty_level, room, coach_id, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [courseId, name, description, category, durationMinutes || 60, maxParticipants || 20, difficultyLevel || 'intermediate', room, finalCoachId]
    );

    const rows = await query('SELECT * FROM courses WHERE id = ?', [courseId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ error: 'Erreur lors de la création du cours' });
  }
});

// PUT /api/courses/:id - Mettre à jour un cours
router.put('/:id', authenticate, requireCoachOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category, durationMinutes, maxParticipants, difficultyLevel, room, isActive, coachId } = req.body;

    // Vérifier les permissions
    const courses = await query(`
      SELECT c.coach_id, co.user_id as coach_user_id 
      FROM courses c
      LEFT JOIN coaches co ON c.coach_id = co.id
      WHERE c.id = ?
    `, [id]);

    if (courses.length === 0) {
      return res.status(404).json({ error: 'Cours non trouvé' });
    }

    // Coach ne peut modifier que ses propres cours
    if (req.user.role === 'coach' && courses[0].coach_user_id !== req.user.id) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const updates = [];
    const values = [];

    if (name !== undefined) { updates.push('name = ?'); values.push(name); }
    if (description !== undefined) { updates.push('description = ?'); values.push(description); }
    if (category !== undefined) { updates.push('category = ?'); values.push(category); }
    if (durationMinutes !== undefined) { updates.push('duration_minutes = ?'); values.push(durationMinutes); }
    if (maxParticipants !== undefined) { updates.push('max_participants = ?'); values.push(maxParticipants); }
    if (difficultyLevel !== undefined) { updates.push('difficulty_level = ?'); values.push(difficultyLevel); }
    if (room !== undefined) { updates.push('room = ?'); values.push(room); }
    if (isActive !== undefined && req.user.role === 'admin') { updates.push('is_active = ?'); values.push(isActive ? 1 : 0); }
    if (coachId !== undefined && req.user.role === 'admin') { updates.push('coach_id = ?'); values.push(coachId); }

    if (updates.length > 0) {
      values.push(id);
      await query(`UPDATE courses SET ${updates.join(', ')} WHERE id = ?`, values);
    }

    const rows = await query('SELECT * FROM courses WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du cours' });
  }
});

// DELETE /api/courses/:id - Supprimer un cours (admin ou coach propriétaire)
router.delete('/:id', authenticate, requireCoachOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que le cours existe et récupérer le coach
    const courses = await query(`
      SELECT c.coach_id, co.user_id as coach_user_id 
      FROM courses c
      LEFT JOIN coaches co ON c.coach_id = co.id
      WHERE c.id = ?
    `, [id]);

    if (courses.length === 0) {
      return res.status(404).json({ error: 'Cours non trouvé' });
    }

    // Coach ne peut supprimer que ses propres cours
    if (req.user.role === 'coach' && courses[0].coach_user_id !== req.user.id) {
      return res.status(403).json({ error: 'Accès refusé - vous ne pouvez supprimer que vos propres cours' });
    }

    // Supprimer d'abord les sessions associées et leurs réservations
    const sessions = await query('SELECT id FROM course_sessions WHERE course_id = ?', [id]);
    for (const session of sessions) {
      await query('DELETE FROM reservations WHERE session_id = ?', [session.id]);
    }
    await query('DELETE FROM course_sessions WHERE course_id = ?', [id]);
    await query('DELETE FROM course_schedules WHERE course_id = ?', [id]);
    await query('DELETE FROM courses WHERE id = ?', [id]);

    res.json({ message: 'Cours supprimé avec succès' });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du cours' });
  }
});

module.exports = router;
