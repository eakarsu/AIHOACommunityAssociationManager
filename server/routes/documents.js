const router = require('express').Router();
const pool = require('../db');
const { askAI } = require('../openrouter');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM documents ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM documents WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { title, content, category, author, status } = req.body;
    const result = await pool.query(
      'INSERT INTO documents (title, content, category, author, status) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [title, content, category, author, status || 'active']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { title, content, category, author, status } = req.body;
    const result = await pool.query(
      'UPDATE documents SET title=$1, content=$2, category=$3, author=$4, status=$5, updated_at=NOW() WHERE id=$6 RETURNING *',
      [title, content, category, author, status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM documents WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/ai-summarize', async (req, res) => {
  try {
    const { document } = req.body;
    const prompt = `Summarize this HOA document and extract key points:
    Title: ${document.title}
    Category: ${document.category}
    Content: ${document.content}

    Provide: executive summary, key points, action items, and important dates/deadlines.`;
    const result = await askAI(prompt, 'You are an HOA document analyst providing clear, concise summaries.');
    res.json({ summary: result });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
