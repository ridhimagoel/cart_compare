const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

async function run() {
  const rootUser = process.env.DB_ROOT_USER || process.env.DB_MYSQL_ROOT_USER || 'root';
  const rootPass = process.env.DB_ROOT_PASSWORD || process.env.DB_MYSQL_ROOT_PASSWORD || null;
  if (!rootPass) {
    console.error('Please set DB_ROOT_PASSWORD (or DB_MYSQL_ROOT_PASSWORD) in environment before running this script. Example in PowerShell:');
    console.error("$env:DB_ROOT_USER='root'; $env:DB_ROOT_PASSWORD='your_root_password'; node server/run-init-db.cjs");
    process.exit(1);
  }

  const host = process.env.DB_MYSQL_HOST || 'localhost';
  const port = Number(process.env.DB_MYSQL_PORT || 3306);

  console.log('Connecting as', rootUser, 'to', `${host}:${port}`);

  let conn;
  try {
    conn = await mysql.createConnection({ host, port, user: rootUser, password: rootPass, multipleStatements: true });

    const pwd = process.env.DB_MYSQL_PASSWORD || '205Ridhimag@';
    const sql = `
      CREATE DATABASE IF NOT EXISTS \`cart_compare\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
      CREATE USER IF NOT EXISTS 'cartuser'@'localhost' IDENTIFIED BY '${pwd}';
      CREATE USER IF NOT EXISTS 'cartuser'@'127.0.0.1' IDENTIFIED BY '${pwd}';
      ALTER USER 'cartuser'@'localhost' IDENTIFIED WITH mysql_native_password BY '${pwd}';
      ALTER USER 'cartuser'@'127.0.0.1' IDENTIFIED WITH mysql_native_password BY '${pwd}';
      GRANT ALL PRIVILEGES ON \`cart_compare\`.* TO 'cartuser'@'localhost';
      GRANT ALL PRIVILEGES ON \`cart_compare\`.* TO 'cartuser'@'127.0.0.1';
      FLUSH PRIVILEGES;
    `;

    console.log('Running DB init statements...');
    const [result] = await conn.query(sql);
    console.log('DB init completed. Result:', result && result.affectedRows ? `affectedRows=${result.affectedRows}` : 'ok');
    await conn.end();
    process.exit(0);
  } catch (e) {
    console.error('Failed to run DB init:', e && e.message ? e.message : e);
    if (conn) try { await conn.end(); } catch (_) {}
    process.exit(1);
  }
}

run();
