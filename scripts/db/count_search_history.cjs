#!/usr/bin/env node
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const mysql = require('mysql2/promise');

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_MYSQL_HOST || 'localhost',
      port: Number(process.env.DB_MYSQL_PORT || 3306),
      user: process.env.DB_MYSQL_USER || 'root',
      password: process.env.DB_MYSQL_PASSWORD || '205Ridhimag@',
      database: process.env.DB_MYSQL_DATABASE || 'cart_compare',
    });
    const [rows] = await conn.query('SELECT COUNT(*) AS c FROM search_history');
    console.log('search_history count:', rows[0].c);
    await conn.end();
  } catch (e) {
    console.error('Error checking search_history:', e.message || e);
    process.exit(2);
  }
})();
