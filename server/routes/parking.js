const router = require('express').Router();
const pool = require('../db');
const { askAI } = require('../openrouter');

router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    const countRes = await pool.query('SELECT COUNT(*) FROM parking');
    const total = parseInt(countRes.rows[0].count);
    const result = await pool.query('SELECT * FROM parking ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM parking WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { spot_number, unit_number, vehicle_make, vehicle_model, vehicle_color, license_plate, permit_type, status } = req.body;
    const result = await pool.query(
      'INSERT INTO parking (spot_number, unit_number, vehicle_make, vehicle_model, vehicle_color, license_plate, permit_type, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [spot_number, unit_number, vehicle_make, vehicle_model, vehicle_color, license_plate, permit_type || 'resident', status || 'active']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { spot_number, unit_number, vehicle_make, vehicle_model, vehicle_color, license_plate, permit_type, status } = req.body;
    const result = await pool.query(
      'UPDATE parking SET spot_number=$1, unit_number=$2, vehicle_make=$3, vehicle_model=$4, vehicle_color=$5, license_plate=$6, permit_type=$7, status=$8, updated_at=NOW() WHERE id=$9 RETURNING *',
      [spot_number, unit_number, vehicle_make, vehicle_model, vehicle_color, license_plate, permit_type, status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM parking WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/ai-optimize', async (req, res) => {
  try {
    const { spots } = req.body;
    const summary = spots.slice(0, 15).map(s => `Spot ${s.spot_number}: Unit ${s.unit_number} - ${s.vehicle_make} ${s.vehicle_model} (${s.permit_type})`).join('\n');
    const prompt = `Analyze this HOA parking allocation and suggest optimizations:
    ${summary}

    Provide: utilization analysis, allocation recommendations, visitor parking suggestions, and traffic flow improvements.`;
    const result = await askAI(prompt, 'You are a parking management specialist for residential communities.');
    res.json({ optimization: result });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
