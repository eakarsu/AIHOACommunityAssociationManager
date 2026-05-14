const router = require('express').Router();
const pool = require('../db');
const { askAI } = require('../openrouter');

router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    const countRes = await pool.query('SELECT COUNT(*) FROM communications');
    const total = parseInt(countRes.rows[0].count);
    const result = await pool.query('SELECT * FROM communications ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM communications WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { title, content, type, audience, priority, status } = req.body;
    const result = await pool.query(
      'INSERT INTO communications (title, content, type, audience, priority, status) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [title, content, type || 'announcement', audience || 'all', priority || 'normal', status || 'draft']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { title, content, type, audience, priority, status } = req.body;
    const result = await pool.query(
      'UPDATE communications SET title=$1, content=$2, type=$3, audience=$4, priority=$5, status=$6, updated_at=NOW() WHERE id=$7 RETURNING *',
      [title, content, type, audience, priority, status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM communications WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/ai-generate', async (req, res) => {
  try {
    const { type, topic, audience, tone } = req.body;
    const prompt = `Generate a professional HOA ${type} about: ${topic}
    Target Audience: ${audience}
    Tone: ${tone || 'professional and friendly'}

    Make it engaging, informative, and appropriate for community communication. Include a compelling subject line.`;
    const result = await askAI(prompt, 'You are a community communications specialist creating HOA newsletters and announcements.');
    res.json({ content: result });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
