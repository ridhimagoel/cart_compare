#!/usr/bin/env node
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mysql = require('mysql2/promise');

(async function main() {
  const host = process.env.DB_MYSQL_HOST || 'localhost';
  const port = Number(process.env.DB_MYSQL_PORT || 3306);
  const user = process.env.DB_MYSQL_USER || 'cartuser';
  const password = process.env.DB_MYSQL_PASSWORD || '205Ridhimag@';
  const database = process.env.DB_MYSQL_DATABASE || 'cart_compare';

  const conn = await mysql.createConnection({ host, port, user, password, database });
  try {
    console.log('Checking watchlist for target prices...');
    const [rows] = await conn.query('SELECT id, title, target_price FROM watchlist WHERE target_price IS NOT NULL AND alerted = 0');
    const items = rows || [];
    if (!items.length) {
      console.log('No pending watchlist targets found.');
      return process.exit(0);
    }

    for (const it of items) {
      try {
        const wid = it.id;
        const target = it.target_price;
        const [[latestRow]] = await conn.query('SELECT price, store FROM price_history WHERE watchlist_id = ? AND price IS NOT NULL ORDER BY fetched_at DESC LIMIT 1', [wid]);
        const latestPrice = latestRow ? latestRow.price : null;
        const store = latestRow ? latestRow.store : null;
        if (latestPrice != null && Number(latestPrice) <= Number(target)) {
          console.log('Triggering alert for watchlist', wid, it.title, 'latestPrice=', latestPrice, 'target=', target);
          await conn.query('INSERT INTO alerts (watchlist_id, price, store) VALUES (?, ?, ?)', [wid, latestPrice, store || null]);
          await conn.query('UPDATE watchlist SET alerted = 1 WHERE id = ?', [wid]);
        } else {
          console.log('No trigger for', wid, it.title, 'latest=', latestPrice, 'target=', target);
        }
      } catch (e) {
        console.error('Error checking watchlist item', it && it.id, e && e.message ? e.message : e);
      }
    }
  } finally {
    await conn.end();
  }
})().catch((e) => { console.error('Fatal error in check_alerts:', e && e.message ? e.message : e); process.exit(1); });
