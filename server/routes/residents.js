const router = require('express').Router();
const pool = require('../db');
const { askAI } = require('../openrouter');

router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    const countRes = await pool.query('SELECT COUNT(*) FROM residents');
    const total = parseInt(countRes.rows[0].count);
    const result = await pool.query('SELECT * FROM residents ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM residents WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { name, email, phone, unit_number, move_in_date, status } = req.body;
    const result = await pool.query(
      'INSERT INTO residents (name, email, phone, unit_number, move_in_date, status) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [name, email, phone, unit_number, move_in_date, status || 'active']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, email, phone, unit_number, move_in_date, status } = req.body;
    const result = await pool.query(
      'UPDATE residents SET name=$1, email=$2, phone=$3, unit_number=$4, move_in_date=$5, status=$6, updated_at=NOW() WHERE id=$7 RETURNING *',
      [name, email, phone, unit_number, move_in_date, status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM residents WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/ai-communicate', async (req, res) => {
  try {
    const { resident, messageType, context } = req.body;
    const prompt = `Draft a professional ${messageType} for HOA resident ${resident.name} (Unit ${resident.unit_number}).
    Context: ${context}
    Make it warm, professional, and appropriate for a community association.`;
    const result = await askAI(prompt, 'You are a professional HOA community manager writing communications to residents.');
    res.json({ message: result });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
