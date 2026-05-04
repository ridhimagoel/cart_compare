#!/usr/bin/env node
// CommonJS migration runner for scripts/db/migrations
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
        // If migration attempts to add columns/indexes that already exist,
        // older MySQL versions may not support IF NOT EXISTS. Treat duplicate
        // column/index errors as non-fatal so migrations are idempotent.
        const dupColumnErrnos = new Set([1060]); // ER_DUP_FIELDNAME
        const dupIndexErrCodes = new Set(['ER_DUP_KEYNAME', 'ER_DUP_KEY']);
        if (e && (dupColumnErrnos.has(e.errno) || dupIndexErrCodes.has(e.code))) {
          console.warn('Non-fatal migration error (already exists), skipping:', e.message);
        } else {
          console.error('Error executing', file, e && e.message ? e.message : e);
          throw e;
        }
      }
    }
    console.log('All migrations applied');
  } finally {
    await conn.end();
  }
}

main().catch(err => {
  console.error(err && err.message ? err.message : err);
  process.exit(1);
});
