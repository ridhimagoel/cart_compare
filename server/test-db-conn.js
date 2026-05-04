const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

(async () => {
  try {
    const pool = mysql.createPool({
      host: process.env.DB_MYSQL_HOST || 'localhost',
      port: Number(process.env.DB_MYSQL_PORT || 3306),
      user: process.env.DB_MYSQL_USER || 'root',
      password: process.env.DB_MYSQL_PASSWORD || '205Ridhimag@',
      database: process.env.DB_MYSQL_DATABASE || 'cart_compare',
      waitForConnections: true,
      connectionLimit: 2,
      queueLimit: 0,
    });

    console.log('Attempting DB connection with:', {
      host: process.env.DB_MYSQL_HOST,
      port: process.env.DB_MYSQL_PORT,
      user: process.env.DB_MYSQL_USER,
      database: process.env.DB_MYSQL_DATABASE,
    });

    const [rows] = await pool.query('SELECT 1 as ok');
    console.log('DB test OK:', rows);
    await pool.end();
    process.exit(0);
  } catch (e) {
    console.error('DB test failed:', e && e.message ? e.message : e);
    process.exit(1);
  }
})();
