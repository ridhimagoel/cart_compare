const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());
app.use(cors());
// Simple CORS headers so the frontend (different port) can call this API during dev
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Simple request logger to help debug incoming calls (prints method, url, body/query)
app.use((req, res, next) => {
  try {
    const info = {
      method: req.method,
      url: req.originalUrl || req.url,
      body: req.body,
      query: req.query,
      time: new Date().toISOString(),
    };
    console.log('[API REQUEST]', JSON.stringify(info));
  } catch (e) {
    console.log('[API REQUEST] error serializing request', e && e.message);
  }
  next();
});

const pool = mysql.createPool({
  host: process.env.DB_MYSQL_HOST || 'localhost',
  port: Number(process.env.DB_MYSQL_PORT || 3306),
  user: process.env.DB_MYSQL_USER || 'root',
  password: process.env.DB_MYSQL_PASSWORD || '205Ridhimag@',
  database: process.env.DB_MYSQL_DATABASE || 'cart_compare',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

let bcrypt;
try {
  bcrypt = require('bcrypt');
} catch (e) {
  // fall back to bcryptjs which is pure-js and easier to install on Windows
  bcrypt = require('bcryptjs');
}
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_me';

// Auth middleware: parses Bearer token and sets req.user_id when valid
function authMiddleware(req, res, next) {
  const auth = req.headers && req.headers.authorization;
  if (!auth) return next();
  const m = String(auth).match(/^Bearer\s+(.+)$/i);
  if (!m) return next();
  try {
    const payload = jwt.verify(m[1], JWT_SECRET);
    if (payload && payload.id) req.user_id = payload.id;
  } catch (e) {
    // ignore invalid token
  }
  return next();
}
app.use(authMiddleware);
app.use(cookieParser());

// Google OAuth2 settings
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_OAUTH_REDIRECT = process.env.GOOGLE_OAUTH_REDIRECT || `http://localhost:4000/auth/google/callback`;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8080';

function getFetch() {
  if (typeof fetch === 'function') return fetch;
  try {
    return require('node-fetch');
  } catch (e) {
    throw new Error('No fetch available; please run on Node 18+ or install node-fetch');
  }
}

app.get('/auth/google', (req, res) => {
  const state = crypto.randomBytes(16).toString('hex');
  res.cookie('oauth_state', state, { httpOnly: true, maxAge: 5 * 60 * 1000 });
  const redirect = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  redirect.searchParams.set('client_id', GOOGLE_CLIENT_ID);
  redirect.searchParams.set('response_type', 'code');
  redirect.searchParams.set('scope', 'openid email profile');
  redirect.searchParams.set('redirect_uri', GOOGLE_OAUTH_REDIRECT);
  redirect.searchParams.set('state', state);
  redirect.searchParams.set('access_type', 'offline');
  redirect.searchParams.set('prompt', 'consent');
  return res.redirect(redirect.toString());
});

app.get('/auth/google/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    const cookieState = req.cookies && req.cookies.oauth_state;
    if (!code || !state || !cookieState || String(state) !== String(cookieState)) {
      return res.status(400).send('Invalid OAuth state');
    }
    const fetch = getFetch();
    const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: String(code),
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_OAUTH_REDIRECT,
        grant_type: 'authorization_code',
      }),
    });
    const tokenJson = await tokenResp.json();
    if (!tokenJson || !tokenJson.access_token) {
      console.error('Google token exchange failed', tokenJson);
      return res.status(500).send('OAuth token exchange failed');
    }
    const accessToken = tokenJson.access_token;
    const userResp = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const userJson = await userResp.json();
    if (!userJson || !userJson.email) {
      console.error('Google userinfo failed', userJson);
      return res.status(500).send('Failed to fetch user info');
    }
    const email = userJson.email;
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    let user = rows && rows[0] ? rows[0] : null;
    if (!user) {
      const randomPassword = crypto.randomBytes(24).toString('hex');
      const hash = await bcrypt.hash(randomPassword, 10);
      const [result] = await pool.query('INSERT INTO users (email, password_hash) VALUES (?, ?)', [email, hash]);
      const [newRows] = await pool.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
      user = newRows && newRows[0] ? newRows[0] : null;
    }
    if (!user) return res.status(500).send('Failed to create or fetch user');
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
    const redirectUrl = new URL(FRONTEND_URL);
    redirectUrl.searchParams.set('token', token);
    return res.redirect(redirectUrl.toString());
  } catch (e) {
    console.error('OAuth callback error', e && e.message);
    return res.status(500).send('OAuth error');
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ ok: false, message: 'email and password required' });
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows && rows[0] ? rows[0] : null;
    if (!user) return res.status(401).json({ ok: false, message: 'invalid credentials' });
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ ok: false, message: 'invalid credentials' });
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ ok: true, token, user: { id: user.id, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: err.message });
  }
});

app.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ ok: false, message: 'email and password required' });
    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query('INSERT INTO users (email, password_hash) VALUES (?, ?)', [email, hash]);
    const userId = result.insertId;
    const token = jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ ok: true, token, user: { id: userId, email } });
  } catch (err) {
    console.error(err);
    if (err && err.code === 'ER_DUP_ENTRY') return res.status(409).json({ ok: false, message: 'email exists' });
    res.status(500).json({ ok: false, message: err.message });
  }
});

app.post('/search-history', async (req, res) => {
  try {
    const { user_id = null, query, results_count = null, metadata = null } = req.body;
    if (!query) return res.status(400).json({ ok: false, message: 'query required' });
    // Prefer authenticated user id when available
    const authUserId = req.user_id || user_id || null;
    // Avoid inserting duplicate rows when the same query was just recorded.
    // If an identical query for the same user (or null user) was created within
    // the last 30 seconds, update that row with new counts/metadata and return it.
    const recentWindowSeconds = 30;
    const [existingRows] = await pool.query(
      'SELECT * FROM search_history WHERE query = ? AND (user_id = ? OR (user_id IS NULL AND ? IS NULL)) AND created_at >= (NOW() - INTERVAL ? SECOND) ORDER BY created_at DESC LIMIT 1',
      [query, authUserId, authUserId, recentWindowSeconds]
    );
    if (existingRows && existingRows[0]) {
      const existing = existingRows[0];
      // merge/update results_count/metadata if provided
      const updatedResultsCount = results_count != null ? results_count : existing.results_count;
      const mergedMetadata = metadata != null ? JSON.stringify(metadata) : existing.metadata;
      await pool.query('UPDATE search_history SET results_count = ?, metadata = ? WHERE id = ?', [updatedResultsCount, mergedMetadata, existing.id]);
      const [rows] = await pool.query('SELECT * FROM search_history WHERE id = ?', [existing.id]);
      const row = rows && rows[0] ? rows[0] : null;
      if (row && row.metadata) row.metadata = row.metadata ? JSON.parse(row.metadata) : null;
      return res.json({ ok: true, id: existing.id, row });
    }

    const [result] = await pool.query(
      'INSERT INTO search_history (user_id, query, results_count, metadata) VALUES (?, ?, ?, ?)',
      [authUserId, query, results_count, metadata ? JSON.stringify(metadata) : null]
    );
    // fetch inserted row to return full data (helps frontend show accurate timestamp/metadata)
    const [rows] = await pool.query('SELECT * FROM search_history WHERE id = ?', [result.insertId]);
    const row = rows && rows[0] ? rows[0] : null;
    if (row && row.metadata) row.metadata = row.metadata ? JSON.parse(row.metadata) : null;
    res.json({ ok: true, id: result.insertId, row });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: err.message });
  }
});

app.get('/search-history', async (req, res) => {
  try {
    const user_id = req.query.user_id || null;
    const limit = Number(req.query.limit || 20);
    const rows = user_id
      ? (await pool.query('SELECT * FROM search_history WHERE user_id = ? ORDER BY created_at DESC LIMIT ?', [user_id, limit]))[0]
      : (await pool.query('SELECT * FROM search_history ORDER BY created_at DESC LIMIT ?', [limit]))[0];
    // parse metadata
    const parsed = rows.map((r) => ({ ...r, metadata: r.metadata ? JSON.parse(r.metadata) : null }));
    res.json({ ok: true, rows: parsed });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: err.message });
  }
});

// Save a batch of search results for a given search_history id
app.post('/search-results', async (req, res) => {
  try {
    const { search_history_id, results } = req.body;
    if (!search_history_id || !Array.isArray(results)) return res.status(400).json({ ok: false, message: 'search_history_id and results[] required' });
    if (!results.length) return res.json({ ok: true, inserted: 0 });

    const values = results.map((r) => [
      search_history_id,
      r.title || null,
      r.price != null ? Number(r.price) : null,
      r.store || null,
      r.url || null,
      r.metadata ? JSON.stringify(r.metadata) : null,
    ]);

    const [result] = await pool.query('INSERT INTO search_results (search_history_id, title, price, store, url, metadata) VALUES ?', [values]);
    res.json({ ok: true, inserted: result.affectedRows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: err.message });
  }
});

// Get stored results for a given search_history id
app.get('/search-results', async (req, res) => {
  try {
    const search_id = req.query.search_id;
    if (!search_id) return res.status(400).json({ ok: false, message: 'search_id required' });
    const rows = (await pool.query('SELECT * FROM search_results WHERE search_history_id = ? ORDER BY fetched_at DESC', [search_id]))[0];
    const parsed = rows.map((r) => ({ ...r, metadata: r.metadata ? JSON.parse(r.metadata) : null }));
    res.json({ ok: true, rows: parsed });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: err.message });
  }
});

// Query stored results with flexible filters (price range, store, text, date range)
app.get('/stored-results', async (req, res) => {
  try {
    const q = req.query.q || null; // text query to search in title
    const minPrice = req.query.min_price != null ? Number(req.query.min_price) : null;
    const maxPrice = req.query.max_price != null ? Number(req.query.max_price) : null;
    const store = req.query.store || null;
    const startDate = req.query.start_date || null; // ISO date
    const endDate = req.query.end_date || null; // ISO date
    const limit = Number(req.query.limit || 100);
    const offset = Number(req.query.offset || 0);

    const clauses = [];
    const params = [];

    if (q) {
      clauses.push('LOWER(title) LIKE ?');
      params.push(`%${String(q).toLowerCase()}%`);
    }
    if (minPrice != null) {
      clauses.push('price >= ?');
      params.push(minPrice);
    }
    if (maxPrice != null) {
      clauses.push('price <= ?');
      params.push(maxPrice);
    }
    if (store) {
      clauses.push('LOWER(store) = ?');
      params.push(String(store).toLowerCase());
    }
    if (startDate) {
      clauses.push('fetched_at >= ?');
      params.push(startDate);
    }
    if (endDate) {
      clauses.push('fetched_at <= ?');
      params.push(endDate);
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

    const sql = `SELECT * FROM search_results ${where} ORDER BY fetched_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [rows] = await pool.query(sql, params);
    const parsed = rows.map((r) => ({ ...r, metadata: r.metadata ? JSON.parse(r.metadata) : null }));
    res.json({ ok: true, rows: parsed });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: err.message });
  }
});

// Simple stats endpoint for aggregated min/max/avg price
app.get('/stored-results/stats', async (req, res) => {
  try {
    const store = req.query.store || null;
    const clauses = [];
    const params = [];
    if (store) {
      clauses.push('LOWER(store) = ?');
      params.push(String(store).toLowerCase());
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const [rows] = await pool.query(`SELECT COUNT(*) as count, MIN(price) as min_price, MAX(price) as max_price, AVG(price) as avg_price FROM search_results ${where}`, params);
    res.json({ ok: true, stats: rows && rows[0] ? rows[0] : {} });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: err.message });
  }
});

// Create a price alert
app.post('/alerts', async (req, res) => {
  try {
    const { watchlist_id = null, price, store = null } = req.body || {};
    if (price == null) return res.status(400).json({ ok: false, message: 'price required' });
    const [result] = await pool.query('INSERT INTO alerts (watchlist_id, price, store) VALUES (?, ?, ?)', [watchlist_id || null, price, store || null]);
    const alertId = result.insertId;
    const [rows] = await pool.query('SELECT * FROM alerts WHERE id = ?', [alertId]);
    const row = rows && rows[0] ? rows[0] : null;
    res.json({ ok: true, id: alertId, row });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: err.message });
  }
});

// List alerts (optionally only pending)
app.get('/alerts', async (req, res) => {
  try {
    const onlyPending = req.query.pending === 'true';
    const limit = Number(req.query.limit || 100);
    const sql = onlyPending ? 'SELECT * FROM alerts WHERE acknowledged = 0 ORDER BY triggered_at DESC LIMIT ?' : 'SELECT * FROM alerts ORDER BY triggered_at DESC LIMIT ?';
    const [rows] = await pool.query(sql, [limit]);
    res.json({ ok: true, rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: err.message });
  }
});

// Acknowledge an alert
app.post('/alerts/:id/ack', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ ok: false, message: 'invalid id' });
    const [result] = await pool.query('UPDATE alerts SET acknowledged = 1 WHERE id = ?', [id]);
    res.json({ ok: true, acknowledged: result.affectedRows === 1 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: err.message });
  }
});

// Simple watchlist API (matches dev middleware endpoint)
app.post('/api/db/watchlist', async (req, res) => {
  try {
    const { title, url = null, store = null } = req.body || {};
    if (!title) return res.status(400).json({ ok: false, message: 'title required' });
    const [result] = await pool.query('INSERT INTO watchlist (title, url, store) VALUES (?, ?, ?)', [title, url, store]);
    const id = result.insertId;
    const [rows] = await pool.query('SELECT * FROM watchlist WHERE id = ?', [id]);
    const row = rows && rows[0] ? rows[0] : null;
    res.json({ ok: true, id, row });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: err.message });
  }
});

app.get('/api/db/watchlist', async (req, res) => {
  try {
    const q = req.query.q ? String(req.query.q) : null;
    const limit = Number(req.query.limit || 50);
    if (q) {
      // try to match by exact url first, then by title LIKE
      const [byUrl] = await pool.query('SELECT * FROM watchlist WHERE url = ? LIMIT 1', [q]);
      if (byUrl && byUrl[0]) return res.json({ ok: true, items: [byUrl[0]] });
      const like = `%${q}%`;
      const [byTitle] = await pool.query('SELECT * FROM watchlist WHERE title LIKE ? ORDER BY created_at DESC LIMIT 10', [like]);
      return res.json({ ok: true, items: byTitle });
    }
    const [rows] = await pool.query('SELECT * FROM watchlist ORDER BY created_at DESC LIMIT ?', [limit]);
    res.json({ ok: true, items: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: err.message });
  }
});

const port = process.env.API_PORT || 4000;
app.listen(port, () => console.log('API server listening on port', port));
