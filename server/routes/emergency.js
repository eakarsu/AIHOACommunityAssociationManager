const router = require('express').Router();
const pool = require('../db');
const { askAI } = require('../openrouter');

router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    const countRes = await pool.query('SELECT COUNT(*) FROM emergency_plans');
    const total = parseInt(countRes.rows[0].count);
    const result = await pool.query('SELECT * FROM emergency_plans ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM emergency_plans WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { title, description, emergency_type, severity, contact_person, contact_phone, status } = req.body;
    const result = await pool.query(
      'INSERT INTO emergency_plans (title, description, emergency_type, severity, contact_person, contact_phone, status) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [title, description, emergency_type, severity || 'medium', contact_person, contact_phone, status || 'active']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { title, description, emergency_type, severity, contact_person, contact_phone, status } = req.body;
    const result = await pool.query(
      'UPDATE emergency_plans SET title=$1, description=$2, emergency_type=$3, severity=$4, contact_person=$5, contact_phone=$6, status=$7, updated_at=NOW() WHERE id=$8 RETURNING *',
      [title, description, emergency_type, severity, contact_person, contact_phone, status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM emergency_plans WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/ai-plan', async (req, res) => {
  try {
    const { emergency } = req.body;
    const prompt = `Create a detailed emergency response plan for this HOA scenario:
    Emergency Type: ${emergency.emergency_type}
    Title: ${emergency.title}
    Description: ${emergency.description}
    Severity: ${emergency.severity}

    Include: immediate actions, evacuation procedures, communication plan, resource needs, recovery steps, and prevention measures.`;
    const result = await askAI(prompt, 'You are an emergency management specialist for residential communities.');
    res.json({ plan: result });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
