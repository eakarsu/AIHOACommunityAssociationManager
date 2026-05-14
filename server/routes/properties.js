const router = require('express').Router();
const pool = require('../db');
const { askAI } = require('../openrouter');

router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    const countRes = await pool.query('SELECT COUNT(*) FROM properties');
    const total = parseInt(countRes.rows[0].count);
    const result = await pool.query('SELECT * FROM properties ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM properties WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { address, unit_number, type, bedrooms, bathrooms, sqft, owner_name, status } = req.body;
    const result = await pool.query(
      'INSERT INTO properties (address, unit_number, type, bedrooms, bathrooms, sqft, owner_name, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [address, unit_number, type, bedrooms, bathrooms, sqft, owner_name, status || 'occupied']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { address, unit_number, type, bedrooms, bathrooms, sqft, owner_name, status } = req.body;
    const result = await pool.query(
      'UPDATE properties SET address=$1, unit_number=$2, type=$3, bedrooms=$4, bathrooms=$5, sqft=$6, owner_name=$7, status=$8, updated_at=NOW() WHERE id=$9 RETURNING *',
      [address, unit_number, type, bedrooms, bathrooms, sqft, owner_name, status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM properties WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/ai-analyze', async (req, res) => {
  try {
    const { property } = req.body;
    const prompt = `Analyze this HOA property and provide valuation insights and maintenance recommendations:
    Address: ${property.address}, Unit: ${property.unit_number}
    Type: ${property.type}, Size: ${property.sqft} sqft
    Bedrooms: ${property.bedrooms}, Bathrooms: ${property.bathrooms}
    Status: ${property.status}

    Provide market analysis, maintenance tips, and value improvement suggestions.`;
    const result = await askAI(prompt, 'You are a real estate and property management expert.');
    res.json({ analysis: result });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
