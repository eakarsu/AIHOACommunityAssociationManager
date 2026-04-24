const router = require('express').Router();
const pool = require('../db');
const { askAI } = require('../openrouter');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM violations ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM violations WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { title, description, unit_number, violation_type, severity, reported_by, status } = req.body;
    const result = await pool.query(
      'INSERT INTO violations (title, description, unit_number, violation_type, severity, reported_by, status) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [title, description, unit_number, violation_type, severity || 'medium', reported_by, status || 'open']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { title, description, unit_number, violation_type, severity, reported_by, status } = req.body;
    const result = await pool.query(
      'UPDATE violations SET title=$1, description=$2, unit_number=$3, violation_type=$4, severity=$5, reported_by=$6, status=$7, updated_at=NOW() WHERE id=$8 RETURNING *',
      [title, description, unit_number, violation_type, severity, reported_by, status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM violations WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/ai-letter', async (req, res) => {
  try {
    const { violation } = req.body;
    const prompt = `Draft a professional violation notice letter for this HOA violation:
    Type: ${violation.violation_type}
    Description: ${violation.description}
    Unit: ${violation.unit_number}
    Severity: ${violation.severity}

    Include: formal greeting, violation details, required corrective action, deadline, and consequences of non-compliance.`;
    const result = await askAI(prompt, 'You are an HOA compliance officer drafting formal violation notices.');
    res.json({ letter: result });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
