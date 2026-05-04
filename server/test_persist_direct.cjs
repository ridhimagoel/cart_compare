const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

(async function(){
  try {
    const host = process.env.DB_MYSQL_HOST || '127.0.0.1';
    const port = Number(process.env.DB_MYSQL_PORT || 3306);
    const user = process.env.DB_MYSQL_USER || 'root';
    const password = process.env.DB_MYSQL_PASSWORD || '205Ridhimag@';
    const database = process.env.DB_MYSQL_DATABASE || 'cart_compare';

    console.log('Connecting to DB as', user);
    const conn = await mysql.createConnection({ host, port, user, password, database });

    const queryText = 'iphone 15';
    console.log('Inserting search_history for', queryText);
    const [hRes] = await conn.query('INSERT INTO search_history (user_id, query, results_count, metadata) VALUES (?, ?, ?, ?)', [null, queryText, 1, JSON.stringify({ test: true })]);
    const searchId = hRes.insertId;
    console.log('Inserted search_history id', searchId);

    console.log('Inserting search_results row');
    await conn.query('INSERT INTO search_results (search_history_id, title, price, store, url, metadata) VALUES (?, ?, ?, ?, ?, ?)', [searchId, 'iPhone 15 Direct', 74900, 'Amazon', 'https://example.com', JSON.stringify({})]);
    console.log('Inserted search_results');
    await conn.end();

    console.log('Calling scrape endpoint to verify DB cached response...');
    const resp = await fetch('http://localhost:8081/api/scrape/compare?q=iphone%2015&limit=24&stores=amazon,flipkart');
    const j = await resp.json();
    console.log('Scrape response:', JSON.stringify(j, null, 2));
  } catch (e) {
    console.error('Error in test_persist_direct:', e && e.message ? e.message : e);
    process.exit(1);
  }
})();
