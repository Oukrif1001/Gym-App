const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roles');

// GET /api/contact-messages - Obtenir tous les messages (admin seulement)
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const messages = await query(
      'SELECT * FROM contact_messages ORDER BY created_at DESC'
    );
    res.json(messages);
  } catch (error) {
    console.error('Error fetching contact messages:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des messages' });
  }
});

// GET /api/contact-messages/stats - Statistiques des messages (admin seulement)
router.get('/stats', authenticate, requireAdmin, async (req, res) => {
  try {
    const [stats] = await query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'unread' THEN 1 ELSE 0 END) as unread,
        SUM(CASE WHEN status = 'read' THEN 1 ELSE 0 END) as read_count
      FROM contact_messages
    `);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
});

// POST /api/contact-messages - Soumettre un message (public)
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    // Validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'Tous les champs obligatoires doivent être remplis' });
    }

    // Validation email basique
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Email invalide' });
    }

    // Validation longueur
    if (name.length > 100) {
      return res.status(400).json({ error: 'Le nom ne doit pas dépasser 100 caractères' });
    }
    if (subject.length > 255) {
      return res.status(400).json({ error: 'Le sujet ne doit pas dépasser 255 caractères' });
    }
    if (message.length > 5000) {
      return res.status(400).json({ error: 'Le message ne doit pas dépasser 5000 caractères' });
    }

    const result = await query(
      `INSERT INTO contact_messages (name, email, phone, subject, message) 
       VALUES (?, ?, ?, ?, ?)`,
      [name.trim(), email.trim(), phone?.trim() || null, subject.trim(), message.trim()]
    );

    res.status(201).json({ 
      message: 'Message envoyé avec succès',
      id: result.insertId 
    });
  } catch (error) {
    console.error('Error creating contact message:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi du message' });
  }
});

// PUT /api/contact-messages/:id/read - Marquer comme lu (admin seulement)
router.put('/:id/read', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    await query(
      'UPDATE contact_messages SET status = ?, read_at = NOW() WHERE id = ?',
      ['read', id]
    );

    res.json({ message: 'Message marqué comme lu' });
  } catch (error) {
    console.error('Error updating message:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du message' });
  }
});

// DELETE /api/contact-messages/:id - Supprimer un message (admin seulement)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query('DELETE FROM contact_messages WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Message non trouvé' });
    }

    res.json({ message: 'Message supprimé avec succès' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du message' });
  }
});

module.exports = router;
