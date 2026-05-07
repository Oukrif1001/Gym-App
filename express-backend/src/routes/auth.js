const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { getUserRole } = require('../middleware/roles');

const router = express.Router();

// POST /api/auth/register - Inscription
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    // Vérifier si l'email existe déjà
    const existingUsers = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' });
    }

    // Hasher le mot de passe
    const passwordHash = await bcrypt.hash(password, 10);

    // Créer l'utilisateur
    const userId = require('crypto').randomUUID();
    await query(
      'INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)',
      [userId, email, passwordHash]
    );

    // Créer le profil
    await query(
      'INSERT INTO profiles (user_id, email, first_name, last_name) VALUES (?, ?, ?, ?)',
      [userId, email, firstName || null, lastName || null]
    );

    // Assigner le rôle par défaut (member)
    await query(
      'INSERT INTO user_roles (user_id, role) VALUES (?, ?)',
      [userId, 'member']
    );

    // Générer le JWT
    const token = jwt.sign(
      { userId, email, role: 'member' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Inscription réussie',
      user: {
        id: userId,
        email,
        firstName,
        lastName
      },
      token
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'inscription' });
  }
});

// POST /api/auth/login - Connexion
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    // Récupérer l'utilisateur
    const users = await query('SELECT id, email, password_hash FROM users WHERE email = ?', [email]);
    
    if (users.length === 0) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const user = users[0];

    // Vérifier le mot de passe
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const userId = user.id;
    const role = await getUserRole(userId);

    // Récupérer le profil
    const profiles = await query('SELECT * FROM profiles WHERE user_id = ?', [userId]);
    const profile = profiles[0] || null;

    // Générer le JWT
    const token = jwt.sign(
      { userId, email, role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Connexion réussie',
      user: {
        id: userId,
        email,
        role,
        profile
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
});

// GET /api/auth/me - Obtenir l'utilisateur actuel
router.get('/me', authenticate, async (req, res) => {
  try {
    const profiles = await query('SELECT * FROM profiles WHERE user_id = ?', [req.user.id]);
    const profile = profiles[0] || null;

    const role = await getUserRole(req.user.id);

    res.json({
      id: req.user.id,
      email: req.user.email,
      role,
      profile
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du profil' });
  }
});

// POST /api/auth/logout - Déconnexion (côté client, invalider le token)
router.post('/logout', authenticate, (req, res) => {
  // Le JWT est stateless, donc la déconnexion se fait côté client
  res.json({ message: 'Déconnexion réussie' });
});

// POST /api/auth/change-password - Changer le mot de passe
router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 6 caractères' });
    }

    // Vérifier l'ancien mot de passe
    const users = await query('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    if (currentPassword) {
      const validPassword = await bcrypt.compare(currentPassword, users[0].password_hash);
      if (!validPassword) {
        return res.status(400).json({ error: 'Mot de passe actuel incorrect' });
      }
    }

    // Hasher et mettre à jour le nouveau mot de passe
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await query('UPDATE users SET password_hash = ? WHERE id = ?', [newPasswordHash, req.user.id]);

    res.json({ message: 'Mot de passe modifié avec succès' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Erreur lors du changement de mot de passe' });
  }
});

module.exports = router;
