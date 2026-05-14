const router = require('express').Router();
const pool = require('../db');
const { askAI } = require('../openrouter');

router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    const countRes = await pool.query('SELECT COUNT(*) FROM maintenance_requests');
    const total = parseInt(countRes.rows[0].count);
    const result = await pool.query('SELECT * FROM maintenance_requests ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
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

    // Fetch related vendors by category
    let vendorContext = '';
    try {
      const vendors = await pool.query(
        'SELECT name, specialty, contact_phone, contract_status FROM vendors WHERE specialty ILIKE $1 LIMIT 3',
        [`%${request.category || ''}%`]
      );
      if (vendors.rows.length > 0) {
        const vendorList = vendors.rows.map(v => `${v.name} (${v.specialty}, status: ${v.contract_status})`).join(', ');
        vendorContext = `\n\nAvailable vendors for this category: ${vendorList}`;
      }
    } catch (_) {}

    const prompt = `Assess this HOA maintenance request and provide priority recommendation, estimated cost, and suggested vendor type:
    Title: ${request.title}
    Description: ${request.description}
    Category: ${request.category}
    Unit: ${request.unit_number}
    Current Priority: ${request.priority}${vendorContext}

    Provide: priority assessment, estimated cost range, recommended timeline, and suggested vendor type/name if available.`;
    const result = await askAI(prompt, 'You are an experienced property maintenance manager.');
    res.json({ assessment: result });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
