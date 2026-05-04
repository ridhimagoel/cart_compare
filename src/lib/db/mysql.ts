import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;

export function initPoolFromEnv() {
  if (pool) return pool;
  const host = process.env.DB_MYSQL_HOST || 'localhost';
  const port = Number(process.env.DB_MYSQL_PORT || 3306);
  const user = process.env.DB_MYSQL_USER || 'root';
  const password = process.env.DB_MYSQL_PASSWORD || '205Ridhimag@';
  const database = process.env.DB_MYSQL_DATABASE || 'cart_compare';

  pool = mysql.createPool({
    host,
    port,
    user,
    password,
    database,
    waitForConnections: true,
    connectionLimit: 10,
  });

  return pool;
}

export async function query(sql: string, params: any[] = []) {
  const p = initPoolFromEnv();
  const [rows] = await p.execute(sql, params);
  return rows as any;
}

export async function ensureTables() {
  const p = initPoolFromEnv();
  await p.execute(`
    CREATE TABLE IF NOT EXISTS purchases (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      title TEXT NOT NULL,
      price DECIMAL(12,2) NOT NULL,
      url TEXT,
      store VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `);

  await p.execute(`
    CREATE TABLE IF NOT EXISTS watchlist (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      title TEXT NOT NULL,
      url TEXT,
      store VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `);

  // Additional tables for price-history, alerts and product stats
  await p.execute(`
    CREATE TABLE IF NOT EXISTS price_history (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      watchlist_id BIGINT NULL,
      title TEXT NOT NULL,
      price DECIMAL(12,2) NULL,
      store VARCHAR(100) NULL,
      fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX (watchlist_id),
      INDEX (fetched_at)
    ) ENGINE=InnoDB;
  `);

  await p.execute(`
    CREATE TABLE IF NOT EXISTS alerts (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      watchlist_id BIGINT NULL,
      price DECIMAL(12,2) NOT NULL,
      store VARCHAR(100) NULL,
      triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      acknowledged TINYINT(1) DEFAULT 0,
      INDEX (watchlist_id),
      INDEX (acknowledged)
    ) ENGINE=InnoDB;
  `);

  await p.execute(`
    CREATE TABLE IF NOT EXISTS product_stats (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      watchlist_id BIGINT NULL,
      avg_price DECIMAL(12,2) NULL,
      stddev_price DECIMAL(12,2) NULL,
      samples INT DEFAULT 0,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX (watchlist_id)
    ) ENGINE=InnoDB;
  `);

  // Add target_price and alerted flag to watchlist if missing
  try {
    await p.execute(`ALTER TABLE watchlist ADD COLUMN IF NOT EXISTS target_price DECIMAL(12,2) NULL`);
    await p.execute(`ALTER TABLE watchlist ADD COLUMN IF NOT EXISTS alerted TINYINT(1) DEFAULT 0`);
  } catch (e) {
    // Some MySQL versions don't support IF NOT EXISTS on ALTER; ignore gracefully
  }
}

export async function addPriceHistory({ watchlist_id, title, price, store }: { watchlist_id?: number; title: string; price?: number | null; store?: string }) {
  const p = initPoolFromEnv();
  const [res]: any = await p.execute('INSERT INTO price_history (watchlist_id, title, price, store) VALUES (?, ?, ?, ?)', [watchlist_id || null, title, price ?? null, store || null]);
  return { id: res.insertId };
}

export async function listPriceHistory(watchlistId?: number, limit = 200) {
  const p = initPoolFromEnv();
  const lim = Math.max(1, Math.min(Math.trunc(Number(limit) || 200), 10000));
  if (watchlistId) {
    const [rows] = await p.execute(`SELECT * FROM price_history WHERE watchlist_id = ? ORDER BY fetched_at DESC LIMIT ${lim}`, [Number(watchlistId)]);
    return rows as any[];
  }
  const [rows] = await p.execute(`SELECT * FROM price_history ORDER BY fetched_at DESC LIMIT ${lim}`);
  return rows as any[];
}

export async function listAlerts(limit = 100) {
  const p = initPoolFromEnv();
  const lim = Math.max(1, Math.min(Math.trunc(Number(limit) || 100), 10000));
  const [rows] = await p.execute(`SELECT * FROM alerts ORDER BY triggered_at DESC LIMIT ${lim}`);
  return rows as any[];
}

export async function ackAlert(id: number) {
  const p = initPoolFromEnv();
  const [res]: any = await p.execute('UPDATE alerts SET acknowledged = 1 WHERE id = ?', [Number(id)]);
  return res.affectedRows === 1;
}

export async function addAlert({ watchlist_id, price, store }: { watchlist_id?: number | null; price: number; store?: string | null }) {
  const p = initPoolFromEnv();
  const [res]: any = await p.execute('INSERT INTO alerts (watchlist_id, price, store) VALUES (?, ?, ?)', [watchlist_id || null, price, store || null]);
  return { id: res.insertId };
}

export async function addPurchase({ title, price, url, store }: { title: string; price: number; url?: string; store?: string }) {
  const p = initPoolFromEnv();
  const [res]: any = await p.execute('INSERT INTO purchases (title, price, url, store) VALUES (?, ?, ?, ?)', [title, price, url || null, store || null]);
  return { id: res.insertId };
}

export async function listPurchases(limit = 50) {
  const p = initPoolFromEnv();
  const lim = Math.max(1, Math.min(Math.trunc(Number(limit) || 50), 10000));
  const [rows] = await p.execute(`SELECT * FROM purchases ORDER BY created_at DESC LIMIT ${lim}`);
  return rows as any[];
}

export async function addWatch({ title, url, store }: { title: string; url?: string; store?: string }) {
  const p = initPoolFromEnv();
  const [res]: any = await p.execute('INSERT INTO watchlist (title, url, store) VALUES (?, ?, ?)', [title, url || null, store || null]);
  return { id: res.insertId };
}

export async function listWatch(limit = 50) {
  const p = initPoolFromEnv();
  const lim = Math.max(1, Math.min(Math.trunc(Number(limit) || 50), 10000));
  const [rows] = await p.execute(`SELECT * FROM watchlist ORDER BY created_at DESC LIMIT ${lim}`);
  return rows as any[];
}

export async function getRecentSearchResults(queryStr: string, maxAgeMinutes = 5, stores?: string[] ) {
  const p = initPoolFromEnv();
  const minutes = Number(maxAgeMinutes || 5);
  // find the most recent search_history row for this exact query within the timeframe
  const [histRows] = await p.execute(
    `SELECT id, created_at FROM search_history WHERE query = ? AND created_at >= (NOW() - INTERVAL ? MINUTE) ORDER BY created_at DESC LIMIT 1`,
    [String(queryStr), minutes]
  );
  const hist = (histRows as any[])[0];
  if (!hist) return null;
  const searchId = hist.id;
  // fetch associated results, optionally filter by stores
  let sql = `SELECT * FROM search_results WHERE search_history_id = ?`;
  const params: any[] = [searchId];
  if (stores && stores.length) {
    const placeholders = stores.map(() => '?').join(',');
    sql += ` AND LOWER(store) IN (${placeholders})`;
    for (const s of stores) params.push(String(s).toLowerCase());
  }
  sql += ` ORDER BY fetched_at DESC`;
  const [rows] = await p.execute(sql, params);
  // parse metadata
  const parsed = (rows as any[]).map((r) => ({ ...r, metadata: r.metadata ? JSON.parse(r.metadata) : null }));
  return { search_history_id: searchId, created_at: hist.created_at, results: parsed };
}

export default {
  initPoolFromEnv,
  ensureTables,
  addPurchase,
  listPurchases,
  addWatch,
  listWatch,
  addAlert,
  ackAlert,
  listAlerts,
};
