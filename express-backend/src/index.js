require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { testConnection } = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const profilesRoutes = require('./routes/profiles');
const coachesRoutes = require('./routes/coaches');
const coursesRoutes = require('./routes/courses');
const sessionsRoutes = require('./routes/sessions');
const schedulesRoutes = require('./routes/schedules');
const reservationsRoutes = require('./routes/reservations');
const subscriptionsRoutes = require('./routes/subscriptions');
const subscriptionTypesRoutes = require('./routes/subscriptionTypes');
const paymentsRoutes = require('./routes/payments');
const equipmentRoutes = require('./routes/equipment');
const userRolesRoutes = require('./routes/userRoles');
const contactMessagesRoutes = require('./routes/contactMessages');
const exportRoutes = require('./routes/export');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Health check
app.get('/health', async (req, res) => {
  const dbConnected = await testConnection();
  res.json({
    status: dbConnected ? 'OK' : 'DB_ERROR',
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profiles', profilesRoutes);
app.use('/api/coaches', coachesRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/schedules', schedulesRoutes);
app.use('/api/reservations', reservationsRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);
app.use('/api/subscription-types', subscriptionTypesRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/user-roles', userRolesRoutes);
app.use('/api/contact-messages', contactMessagesRoutes);
app.use('/api/export', exportRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const startServer = async () => {
  // Test database connection
  const dbConnected = await testConnection();

  if (!dbConnected) {
    console.warn('⚠️  Démarrage sans connexion MySQL. Vérifiez que XAMPP est lancé.');
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
    console.log(`📦 Database: MySQL (XAMPP)`);
  });
};

startServer();
