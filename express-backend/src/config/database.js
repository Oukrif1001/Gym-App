const mysql = require('mysql2/promise');

// Configuration de la connexion MySQL
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gym_management',

  // IMPORTANT: éviter tout décalage de jour sur les colonnes DATE/DATETIME/TIMESTAMP.
  // On force mysql2 à renvoyer les dates/heures en string (pas de conversion timezone côté JS).
  dateStrings: true,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Créer le pool de connexions
const pool = mysql.createPool(dbConfig);

// Fonction pour tester la connexion
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Connexion MySQL établie avec succès');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Erreur de connexion MySQL:', error.message);
    return false;
  }
};

// Fonction utilitaire pour exécuter des requêtes
const query = async (sql, params = []) => {
  const [rows] = await pool.execute(sql, params);
  return rows;
};

// Fonction pour obtenir une connexion (pour les transactions)
const getConnection = async () => {
  return await pool.getConnection();
};

module.exports = { 
  pool, 
  query, 
  getConnection, 
  testConnection 
};
