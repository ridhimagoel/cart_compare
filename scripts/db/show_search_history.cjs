#!/usr/bin/env node
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const mysql = require('mysql2/promise');

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_MYSQL_HOST || 'localhost',
      port: Number(process.env.DB_MYSQL_PORT || 3306),
      user: process.env.DB_MYSQL_USER || 'cartuser',
      password: process.env.DB_MYSQL_PASSWORD || '205Ridhimag@',
      database: process.env.DB_MYSQL_DATABASE || 'cart_compare',
    });
    const [rows] = await conn.query('SELECT id, query, results_count, metadata, created_at FROM search_history ORDER BY created_at DESC LIMIT 50');
    console.log('search_history rows:');
    for (const r of rows) {
      console.log(JSON.stringify(r));
    }
    await conn.end();
  } catch (e) {
    console.error('Error showing search_history:', e.message || e);
    process.exit(2);
  }
})();
