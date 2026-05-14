const router = require('express').Router();
const pool = require('../db');
const { askAI } = require('../openrouter');

router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    const countRes = await pool.query('SELECT COUNT(*) FROM meetings');
    const total = parseInt(countRes.rows[0].count);
    const result = await pool.query('SELECT * FROM meetings ORDER BY date DESC LIMIT $1 OFFSET $2', [limit, offset]);
    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM meetings WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { title, description, date, time, location, type, status } = req.body;
    const result = await pool.query(
      'INSERT INTO meetings (title, description, date, time, location, type, status) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [title, description, date, time, location, type || 'board', status || 'scheduled']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { title, description, date, time, location, type, status } = req.body;
    const result = await pool.query(
      'UPDATE meetings SET title=$1, description=$2, date=$3, time=$4, location=$5, type=$6, status=$7, updated_at=NOW() WHERE id=$8 RETURNING *',
      [title, description, date, time, location, type, status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM meetings WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/ai-agenda', async (req, res) => {
  try {
    const { meeting } = req.body;
    const prompt = `Generate a professional meeting agenda for this HOA meeting:
    Title: ${meeting.title}
    Type: ${meeting.type}
    Description: ${meeting.description}
    Date: ${meeting.date}

    Include: call to order, approval of minutes, old business, new business, committee reports, open forum, and adjournment with time estimates.`;
    const result = await askAI(prompt, 'You are an HOA board secretary preparing professional meeting agendas.');
    res.json({ agenda: result });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
