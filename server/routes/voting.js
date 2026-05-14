// Apply pass 5 — additive non-AI feature: voting / ballot management.
// Creates additive tables (idempotent). No existing schema modified.

const router = require('express').Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

let initialized = false;
async function ensureSchema() {
  if (initialized) return;
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS ballots (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      ballot_type VARCHAR(64) DEFAULT 'simple',
      options JSONB NOT NULL DEFAULT '[]',
      opens_at TIMESTAMP,
      closes_at TIMESTAMP,
      status VARCHAR(32) DEFAULT 'draft',
      created_by INTEGER,
      created_at TIMESTAMP DEFAULT NOW()
    )`);
    await pool.query(`CREATE TABLE IF NOT EXISTS ballot_votes (
      id SERIAL PRIMARY KEY,
      ballot_id INTEGER REFERENCES ballots(id) ON DELETE CASCADE,
      voter_id INTEGER NOT NULL,
      choice TEXT NOT NULL,
      weight NUMERIC DEFAULT 1,
      cast_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(ballot_id, voter_id)
    )`);
    initialized = true;
  } catch (e) { console.error('voting schema init failed:', e.message); }
}

router.use(async (_req, _res, next) => { await ensureSchema(); next(); });

// List ballots
router.get('/', async (_req, res) => {
  try {
    const r = await pool.query('SELECT * FROM ballots ORDER BY created_at DESC LIMIT 100');
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM ballots WHERE id = $1', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'ballot not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Create ballot
router.post('/', async (req, res) => {
  try {
    const { title, description, ballot_type, options, opens_at, closes_at, status } = req.body || {};
    if (!title || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ error: 'title and options[] (min 2) required' });
    }
    const r = await pool.query(
      `INSERT INTO ballots (title, description, ballot_type, options, opens_at, closes_at, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [title, description || null, ballot_type || 'simple', JSON.stringify(options),
       opens_at || null, closes_at || null, status || 'draft', req.user.id]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Cast a vote (one per ballot per voter, enforced by UNIQUE constraint)
router.post('/:id/vote', async (req, res) => {
  try {
    const { choice, weight } = req.body || {};
    if (!choice) return res.status(400).json({ error: 'choice is required' });
    const ballotR = await pool.query('SELECT * FROM ballots WHERE id = $1', [req.params.id]);
    if (ballotR.rows.length === 0) return res.status(404).json({ error: 'ballot not found' });
    const ballot = ballotR.rows[0];
    if (ballot.status !== 'open') {
      return res.status(400).json({ error: `ballot status is ${ballot.status}` });
    }
    if (ballot.closes_at && new Date(ballot.closes_at) < new Date()) {
      return res.status(400).json({ error: 'ballot closed' });
    }
    const validChoices = (ballot.options || []).map(o => typeof o === 'string' ? o : o.id || o.value || o.label);
    if (!validChoices.includes(choice)) {
      return res.status(400).json({ error: 'choice not in ballot options' });
    }
    try {
      const r = await pool.query(
        `INSERT INTO ballot_votes (ballot_id, voter_id, choice, weight) VALUES ($1, $2, $3, $4) RETURNING *`,
        [req.params.id, req.user.id, choice, weight || 1]
      );
      res.status(201).json(r.rows[0]);
    } catch (e) {
      if (e.code === '23505') return res.status(409).json({ error: 'already voted' });
      throw e;
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Tally
router.get('/:id/tally', async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT choice, SUM(weight)::float AS weighted_total, COUNT(*)::int AS vote_count
       FROM ballot_votes WHERE ballot_id = $1 GROUP BY choice ORDER BY weighted_total DESC`,
      [req.params.id]
    );
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Open / close ballot (board action)
router.post('/:id/transition', async (req, res) => {
  try {
    const { status } = req.body || {};
    const allowed = ['draft', 'open', 'closed', 'cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: `status must be one of ${allowed.join(', ')}` });
    }
    const r = await pool.query('UPDATE ballots SET status = $1 WHERE id = $2 RETURNING *', [status, req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'ballot not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
