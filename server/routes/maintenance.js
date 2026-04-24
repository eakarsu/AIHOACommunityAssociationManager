const router = require('express').Router();
const pool = require('../db');
const { askAI } = require('../openrouter');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM maintenance_requests ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM maintenance_requests WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { title, description, unit_number, category, priority, reported_by, status } = req.body;
    const result = await pool.query(
      'INSERT INTO maintenance_requests (title, description, unit_number, category, priority, reported_by, status) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [title, description, unit_number, category, priority || 'medium', reported_by, status || 'open']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { title, description, unit_number, category, priority, reported_by, status } = req.body;
    const result = await pool.query(
      'UPDATE maintenance_requests SET title=$1, description=$2, unit_number=$3, category=$4, priority=$5, reported_by=$6, status=$7, updated_at=NOW() WHERE id=$8 RETURNING *',
      [title, description, unit_number, category, priority, reported_by, status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM maintenance_requests WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/ai-assess', async (req, res) => {
  try {
    const { request } = req.body;
    const prompt = `Assess this HOA maintenance request and provide priority recommendation, estimated cost, and suggested vendor type:
    Title: ${request.title}
    Description: ${request.description}
    Category: ${request.category}
    Unit: ${request.unit_number}
    Current Priority: ${request.priority}

    Provide: priority assessment, estimated cost range, recommended timeline, and suggested vendor type.`;
    const result = await askAI(prompt, 'You are an experienced property maintenance manager.');
    res.json({ assessment: result });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
