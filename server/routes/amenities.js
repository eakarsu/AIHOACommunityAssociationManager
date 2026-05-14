const router = require('express').Router();
const pool = require('../db');
const { askAI } = require('../openrouter');

router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    const countRes = await pool.query('SELECT COUNT(*) FROM amenity_bookings');
    const total = parseInt(countRes.rows[0].count);
    const result = await pool.query('SELECT * FROM amenity_bookings ORDER BY booking_date DESC LIMIT $1 OFFSET $2', [limit, offset]);
    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM amenity_bookings WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { amenity_name, booked_by, booking_date, start_time, end_time, purpose, status } = req.body;
    const result = await pool.query(
      'INSERT INTO amenity_bookings (amenity_name, booked_by, booking_date, start_time, end_time, purpose, status) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [amenity_name, booked_by, booking_date, start_time, end_time, purpose, status || 'confirmed']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { amenity_name, booked_by, booking_date, start_time, end_time, purpose, status } = req.body;
    const result = await pool.query(
      'UPDATE amenity_bookings SET amenity_name=$1, booked_by=$2, booking_date=$3, start_time=$4, end_time=$5, purpose=$6, status=$7, updated_at=NOW() WHERE id=$8 RETURNING *',
      [amenity_name, booked_by, booking_date, start_time, end_time, purpose, status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM amenity_bookings WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/ai-optimize', async (req, res) => {
  try {
    const { bookings } = req.body;
    const summary = bookings.slice(0, 15).map(b => `${b.amenity_name}: ${b.booking_date} ${b.start_time}-${b.end_time} by ${b.booked_by}`).join('\n');
    const prompt = `Analyze these amenity bookings and provide optimization suggestions:
    ${summary}

    Provide: usage patterns, peak hours, underutilized amenities, scheduling recommendations, and capacity optimization tips.`;
    const result = await askAI(prompt, 'You are a facility management expert optimizing amenity usage.');
    res.json({ optimization: result });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
