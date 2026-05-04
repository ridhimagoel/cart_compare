#!/usr/bin/env node
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const fs = require('fs');
const mysql = require('mysql2/promise');

async function main() {
  const sqlPath = path.join(__dirname, 'migrations', '004_create_search_results.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  const conn = await mysql.createConnection({
    host: process.env.DB_MYSQL_HOST || 'localhost',
    port: Number(process.env.DB_MYSQL_PORT || 3306),
    user: process.env.DB_MYSQL_USER || 'root',
    password: process.env.DB_MYSQL_PASSWORD || '205Ridhimag@',
    database: process.env.DB_MYSQL_DATABASE || 'cart_compare',
    multipleStatements: true,
  });
  try {
    console.log('Applying migration:', sqlPath);
    await conn.query(sql);
    console.log('Migration applied successfully');
  } catch (e) {
    console.error('Failed to apply migration:', e.message || e);
    process.exit(2);
  } finally {
    await conn.end();
  }
}

main();
