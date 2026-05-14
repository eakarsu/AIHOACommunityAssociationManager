const router = require('express').Router();
const pool = require('../db');
const { askAI } = require('../openrouter');

router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    const countRes = await pool.query('SELECT COUNT(*) FROM vendors');
    const total = parseInt(countRes.rows[0].count);
    const result = await pool.query('SELECT * FROM vendors ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM vendors WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { name, service_type, phone, email, rating, contract_status, hourly_rate } = req.body;
    const result = await pool.query(
      'INSERT INTO vendors (name, service_type, phone, email, rating, contract_status, hourly_rate) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [name, service_type, phone, email, rating || 0, contract_status || 'active', hourly_rate]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, service_type, phone, email, rating, contract_status, hourly_rate } = req.body;
    const result = await pool.query(
      'UPDATE vendors SET name=$1, service_type=$2, phone=$3, email=$4, rating=$5, contract_status=$6, hourly_rate=$7, updated_at=NOW() WHERE id=$8 RETURNING *',
      [name, service_type, phone, email, rating, contract_status, hourly_rate, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM vendors WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/ai-evaluate', async (req, res) => {
  try {
    const { vendor } = req.body;
    const prompt = `Evaluate this HOA vendor and provide a recommendation:
    Name: ${vendor.name}
    Service: ${vendor.service_type}
    Rating: ${vendor.rating}/5
    Hourly Rate: $${vendor.hourly_rate}
    Contract Status: ${vendor.contract_status}

    Provide: performance assessment, value for money analysis, contract recommendations, and comparison benchmarks.`;
    const result = await askAI(prompt, 'You are a vendor management specialist for community associations.');
    res.json({ evaluation: result });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
