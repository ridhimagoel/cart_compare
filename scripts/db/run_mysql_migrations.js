#!/usr/bin/env node
// Simple migration runner for the SQL files in scripts/db/migrations
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function main() {
  const dir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort();

  const host = process.env.DB_MYSQL_HOST || 'localhost';
  const port = Number(process.env.DB_MYSQL_PORT || 3306);
  const user = process.env.DB_MYSQL_USER || 'cartuser';
  const password = process.env.DB_MYSQL_PASSWORD || '205Ridhimag@';
  const database = process.env.DB_MYSQL_DATABASE || 'cart_compare';

  console.log('Connecting to', host, port, database, 'as', user);
  const conn = await mysql.createConnection({ host, port, user, password, database, multipleStatements: true });

  try {
    for (const file of files) {
      const fp = path.join(dir, file);
      console.log('Running', file);
      const sql = fs.readFileSync(fp, 'utf8');
      try {
        await conn.query(sql);
        console.log('OK', file);
      } catch (e) {
        console.error('Error executing', file, e);
        throw e;
      }
    }
    console.log('All migrations applied');
  } finally {
    await conn.end();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
