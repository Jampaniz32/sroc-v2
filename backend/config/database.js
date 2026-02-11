import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
  user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
  password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
  database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'sroc_db',
  port: process.env.MYSQLPORT || process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10,
  idleTimeout: 60000,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  connectTimeout: 20000, // Increased to 20s
  charset: 'UTF8MB4_UNICODE_CI',
  ssl: {
    rejectUnauthorized: false // Common requirement for cloud databases
  }
};

console.log(`📡 Connecting to DB at ${dbConfig.host}:${dbConfig.port}...`);

const pool = mysql.createPool(dbConfig);

// Manejo de erros do pool
pool.on('error', (err) => {
  console.error('⚠️ Unexpected error on idle client:', err.message);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.warn('🔄 Connection lost. Pool will attempt to reconnect on next query.');
  }
});

// Mecanismo de Ping Keep-Alive (cada 30 segundos)
setInterval(async () => {
  try {
    const connection = await pool.getConnection();
    await connection.query('SELECT 1');
    connection.release();
    // console.log('💓 Database keep-alive ping successful');
  } catch (err) {
    console.error('💔 Database keep-alive ping failed:', err.message);
  }
}, 30000);

// Test database connection
pool.getConnection()
  .then(connection => {
    console.log('✅ Database connected successfully');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
  });

export default pool;
