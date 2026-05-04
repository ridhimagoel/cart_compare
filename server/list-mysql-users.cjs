const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

(async function(){
  try {
    const host = process.env.DB_MYSQL_HOST || '127.0.0.1';
    const port = Number(process.env.DB_MYSQL_PORT || 3306);
    const user = process.env.DB_MYSQL_USER || process.env.DB_ROOT_USER || 'root';
    const password = process.env.DB_MYSQL_PASSWORD || process.env.DB_ROOT_PASSWORD || null;

    if (!password) {
      console.error('Please set DB_MYSQL_PASSWORD or DB_ROOT_PASSWORD as an env var before running. Example:');
      console.error("$env:DB_MYSQL_PASSWORD='your_root_password'; node server/list-mysql-users.cjs");
      process.exit(1);
    }

    console.log('Connecting to', `${host}:${port}`,'as', user);
    const conn = await mysql.createConnection({ host, port, user, password });
    const [rows] = await conn.query("SELECT user, host, plugin FROM mysql.user ORDER BY user, host");
    console.table(rows);
    await conn.end();
    process.exit(0);
  } catch (e) {
    console.error('Error:', e && e.message ? e.message : e);
    process.exit(1);
  }
})();
