const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config({ path: '../.env' });

const { authenticateToken } = require('./middleware/auth');
const pool = require('./db');
const { validateRuntime } = require('./governance/runtime');
const governanceRouter = require('./governance/router');

validateRuntime();

// === Batch 04 Gaps & Frontend Mounts ===
const app = express();

// Security middleware
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Global rate limiter
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests' },
}));

// Ensure extra tables exist
if (process.env.ENABLE_LEGACY_SCHEMA_BOOTSTRAP === 'true') pool.query(`
  CREATE TABLE IF NOT EXISTS ai_analyses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    tool_name TEXT,
    entity_type TEXT,
    entity_id INTEGER,
    result TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  );
  CREATE TABLE IF NOT EXISTS dues_schedules (
    id SERIAL PRIMARY KEY,
    resident_id INTEGER,
    property_id INTEGER,
    amount DECIMAL(10,2) NOT NULL,
    due_date DATE NOT NULL,
    paid BOOLEAN DEFAULT false,
    paid_date DATE,
    late_fee DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  );
`).catch(err => console.error('Table init error:', err.message));

// Public auth routes first
app.use('/api/auth', require('./routes/auth'));

// Global auth middleware for all other /api routes
app.use('/api', (req, res, next) => {
  if (req.path.startsWith('/auth')) return next();
  return authenticateToken(req, res, next);
});

// Protected Routes
app.use('/api/residents', require('./routes/residents'));
app.use('/api/properties', require('./routes/properties'));
app.use('/api/maintenance', require('./routes/maintenance'));
app.use('/api/finances', require('./routes/finances'));
app.use('/api/violations', require('./routes/violations'));
app.use('/api/meetings', require('./routes/meetings'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/amenities', require('./routes/amenities'));
app.use('/api/vendors', require('./routes/vendors'));
app.use('/api/communications', require('./routes/communications'));
app.use('/api/architectural', require('./routes/architectural'));
app.use('/api/emergency', require('./routes/emergency'));
app.use('/api/parking', require('./routes/parking'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/dashboard', require('./routes/dashboard'));
// Apply pass 5 backlog: violation appeals + ballots
app.use('/api/violation-appeals', require('./routes/appeals'));
app.use('/api/ballots', require('./routes/voting'));
app.use('/api/reserve-study', require('./routes/reserveStudy'));
app.use('/api/architectural-scanner', require('./routes/architecturalScanner'));
app.use('/api/covenant-variance-precedent', require('./routes/covenantVariancePrecedent'));
app.use('/api/governed-association-records', governanceRouter);

// AI analyses history endpoint (paginated)
app.get('/api/ai-analyses', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const [rows, count] = await Promise.all([
      pool.query('SELECT * FROM ai_analyses WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3', [req.user.id, limit, offset]),
      pool.query('SELECT COUNT(*) FROM ai_analyses WHERE user_id = $1', [req.user.id]),
    ]);
    res.json({ data: rows.rows, total: parseInt(count.rows[0].count), page, limit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Dues management endpoints
app.get('/api/dues', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const { paid, overdue } = req.query;
    let where = '';
    const params = [];
    if (paid !== undefined) { where = ' WHERE paid = $1'; params.push(paid === 'true'); }
    if (overdue === 'true') { where = ' WHERE paid = false AND due_date < CURRENT_DATE'; }
    const [rows, count] = await Promise.all([
      pool.query(`SELECT d.*, r.name as resident_name, p.address as property_address FROM dues_schedules d LEFT JOIN residents r ON r.id = d.resident_id LEFT JOIN properties p ON p.id = d.property_id${where} ORDER BY d.due_date DESC LIMIT $${params.length+1} OFFSET $${params.length+2}`, [...params, limit, offset]),
      pool.query(`SELECT COUNT(*) FROM dues_schedules${where}`, params),
    ]);
    res.json({ data: rows.rows, total: parseInt(count.rows[0].count), page, limit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/dues', authenticateToken, async (req, res) => {
  try {
    const { resident_id, property_id, amount, due_date, notes } = req.body;
    if (!amount || !due_date) return res.status(400).json({ error: 'amount and due_date required' });
    const result = await pool.query(
      'INSERT INTO dues_schedules (resident_id, property_id, amount, due_date, notes) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [resident_id, property_id, amount, due_date, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/dues/:id/pay', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE dues_schedules SET paid = true, paid_date = CURRENT_DATE WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Dues record not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Overdue dues summary
app.get('/api/dues/summary', authenticateToken, async (req, res) => {
  try {
    const [overdue, upcoming, totalCollected] = await Promise.all([
      pool.query("SELECT COUNT(*) as count, SUM(amount) as total FROM dues_schedules WHERE paid = false AND due_date < CURRENT_DATE"),
      pool.query("SELECT COUNT(*) as count, SUM(amount) as total FROM dues_schedules WHERE paid = false AND due_date >= CURRENT_DATE AND due_date <= CURRENT_DATE + INTERVAL '30 days'"),
      pool.query("SELECT SUM(amount) as total FROM dues_schedules WHERE paid = true"),
    ]);
    res.json({
      overdue: { count: parseInt(overdue.rows[0].count), total: parseFloat(overdue.rows[0].total) || 0 },
      upcoming_30_days: { count: parseInt(upcoming.rows[0].count), total: parseFloat(upcoming.rows[0].total) || 0 },
      total_collected: parseFloat(totalCollected.rows[0].total) || 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.SERVER_PORT || 3001;


app.listen(PORT, () => {
  console.log(`🏠 HOA Manager API running on port ${PORT}`);
});
