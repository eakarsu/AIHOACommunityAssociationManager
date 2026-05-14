const router = require('express').Router();
const pool = require('../db');
const { askAI } = require('../openrouter');

router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    const countRes = await pool.query('SELECT COUNT(*) FROM architectural_reviews');
    const total = parseInt(countRes.rows[0].count);
    const result = await pool.query('SELECT * FROM architectural_reviews ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM architectural_reviews WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { title, description, unit_number, requested_by, modification_type, estimated_cost, status } = req.body;
    const result = await pool.query(
      'INSERT INTO architectural_reviews (title, description, unit_number, requested_by, modification_type, estimated_cost, status) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [title, description, unit_number, requested_by, modification_type, estimated_cost, status || 'pending']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { title, description, unit_number, requested_by, modification_type, estimated_cost, status } = req.body;
    const result = await pool.query(
      'UPDATE architectural_reviews SET title=$1, description=$2, unit_number=$3, requested_by=$4, modification_type=$5, estimated_cost=$6, status=$7, updated_at=NOW() WHERE id=$8 RETURNING *',
      [title, description, unit_number, requested_by, modification_type, estimated_cost, status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM architectural_reviews WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/ai-compliance', async (req, res) => {
  try {
    const { review } = req.body;
    const prompt = `Evaluate this architectural modification request for HOA compliance:
    Modification: ${review.title}
    Type: ${review.modification_type}
    Description: ${review.description}
    Unit: ${review.unit_number}
    Estimated Cost: $${review.estimated_cost}

    Assess: compliance with typical HOA guidelines, potential impact on property values, structural concerns, aesthetic compatibility, and recommendation (approve/deny/modify).`;
    const result = await askAI(prompt, 'You are an architectural review board member for a homeowners association.');
    res.json({ compliance: result });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
