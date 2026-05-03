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
  const conn = await mysql.createConnection({ host, port, user, password, database });
  try {
    const [tables] = await conn.query("SHOW TABLES");
    const key = Object.keys(tables[0] || {})[0];
    if (!tables.length) {
      console.log('No tables found in', database);
      return;
    }
    console.log('Tables:');
    for (const row of tables) {
      const tableName = row[key];
      console.log('-', tableName);
    }
    console.log('\nDetailed schema:');
    for (const row of tables) {
      const tableName = row[key];
      console.log('\n===', tableName, '===');
      const [create] = await conn.query(`SHOW CREATE TABLE \`${tableName}\``);
      if (create && create[0] && (create[0]['Create Table'] || create[0]['Create View'])) {
        console.log(create[0]['Create Table'] || create[0]['Create View']);
      } else {
        console.log('Could not fetch CREATE statement for', tableName, create[0]);
      }
    }
  } finally {
    await conn.end();
  }
}

main().catch(err => {
  console.error(err.message || err);
  process.exit(1);
});
