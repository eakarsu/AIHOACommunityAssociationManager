// Apply pass 5 — additive non-AI feature: violation appeals.
// Creates table `violation_appeals` if absent (additive only). No existing schema modified.

const router = require('express').Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

let initialized = false;
async function ensureSchema() {
  if (initialized) return;
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS violation_appeals (
      id SERIAL PRIMARY KEY,
      violation_id INTEGER,
      resident_id INTEGER,
      submitted_by INTEGER,
      reason TEXT NOT NULL,
      supporting_evidence TEXT,
      status VARCHAR(32) DEFAULT 'submitted',
      board_decision TEXT,
      decided_by INTEGER,
      decided_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    )`);
    initialized = true;
  } catch (e) { console.error('appeals schema init failed:', e.message); }
}

router.use(async (_req, _res, next) => { await ensureSchema(); next(); });

// List appeals (filter by violation, resident, or status)
router.get('/', async (req, res) => {
  try {
    const { violation_id, resident_id, status } = req.query;
    const conds = []; const params = [];
    if (violation_id) { conds.push(`violation_id = $${params.length + 1}`); params.push(violation_id); }
    if (resident_id) { conds.push(`resident_id = $${params.length + 1}`); params.push(resident_id); }
    if (status) { conds.push(`status = $${params.length + 1}`); params.push(status); }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const r = await pool.query(`SELECT * FROM violation_appeals ${where} ORDER BY created_at DESC LIMIT 200`, params);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get single appeal
router.get('/:id', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM violation_appeals WHERE id = $1', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'appeal not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Submit a new appeal
router.post('/', async (req, res) => {
  try {
    const { violation_id, resident_id, reason, supporting_evidence } = req.body || {};
    if (!reason || reason.trim().length < 5) {
      return res.status(400).json({ error: 'reason (min 5 chars) is required' });
    }
    const r = await pool.query(
      `INSERT INTO violation_appeals (violation_id, resident_id, submitted_by, reason, supporting_evidence)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [violation_id || null, resident_id || null, req.user.id, reason, supporting_evidence || null]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Decide an appeal
router.post('/:id/decision', async (req, res) => {
  try {
    const { decision, board_decision } = req.body || {};
    const allowed = ['approved', 'denied', 'withdrawn'];
    if (!allowed.includes(decision)) {
      return res.status(400).json({ error: `decision must be one of ${allowed.join(', ')}` });
    }
    const r = await pool.query(
      `UPDATE violation_appeals
       SET status = $1, board_decision = $2, decided_by = $3, decided_at = NOW()
       WHERE id = $4 RETURNING *`,
      [decision, board_decision || null, req.user.id, req.params.id]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'appeal not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
