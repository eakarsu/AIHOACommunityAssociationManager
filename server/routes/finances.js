const router = require('express').Router();
const pool = require('../db');
const { askAI } = require('../openrouter');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM financial_transactions ORDER BY date DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM financial_transactions WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { description, amount, type, category, date, status } = req.body;
    const result = await pool.query(
      'INSERT INTO financial_transactions (description, amount, type, category, date, status) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [description, amount, type, category, date, status || 'completed']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { description, amount, type, category, date, status } = req.body;
    const result = await pool.query(
      'UPDATE financial_transactions SET description=$1, amount=$2, type=$3, category=$4, date=$5, status=$6, updated_at=NOW() WHERE id=$7 RETURNING *',
      [description, amount, type, category, date, status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM financial_transactions WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/ai-forecast', async (req, res) => {
  try {
    const { transactions } = req.body;
    const summary = transactions.slice(0, 20).map(t => `${t.type}: $${t.amount} - ${t.description} (${t.category})`).join('\n');
    const prompt = `Analyze these HOA financial transactions and provide budget forecasting:
    ${summary}

    Provide: spending trends, budget recommendations, potential savings, and 6-month forecast.`;
    const result = await askAI(prompt, 'You are a financial analyst specializing in HOA and community association budgets.');
    res.json({ forecast: result });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
