#!/usr/bin/env node
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const mysql = require('mysql2/promise');

async function main() {
  const host = process.env.DB_MYSQL_HOST || 'localhost';
  const port = Number(process.env.DB_MYSQL_PORT || 3306);
  const user = process.env.DB_MYSQL_USER || 'cartuser';
  const password = process.env.DB_MYSQL_PASSWORD || '205Ridhimag@';
  const database = process.env.DB_MYSQL_DATABASE || 'cart_compare';

  console.log('Connecting to', host, port, database, 'as', user);
  try {
    const conn = await mysql.createConnection({ host, port, user, password, database });
    const [rows] = await conn.query('SELECT 1 AS ok');
    console.log('Query result:', rows);
    await conn.end();
    process.exit(0);
  } catch (e) {
    console.error('Connection failed:', e.message || e);
    process.exit(2);
  }
}

main();
