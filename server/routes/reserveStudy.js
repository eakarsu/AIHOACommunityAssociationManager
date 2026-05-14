// Reserve study + long-term capital planner with 10-20 year horizons.
// Audit: batch_04.md / AIHOACommunityAssociationManager / Custom Feature Suggestions #4
const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { askAI } = require('../openrouter');
const pool = require('../db');

const router = express.Router();
router.use(authenticateToken);

function parseJSON(t) { try { const m = t.match(/\{[\s\S]*\}/); if (m) return JSON.parse(m[0]); } catch (_) {} return { notes: t }; }

// POST /api/reserve-study/project { horizon_years?, annual_dues_usd?, current_reserves_usd? }
router.post('/project', async (req, res) => {
  try {
    const { horizon_years = 15, annual_dues_usd, current_reserves_usd } = req.body || {};

    let maintenance = { rows: [] };
    let assets = { rows: [] };
    let finances = { rows: [] };
    try { maintenance = await pool.query(`SELECT * FROM maintenance ORDER BY scheduled_date DESC LIMIT 30`); } catch (_) {}
    try { assets = await pool.query(`SELECT * FROM properties LIMIT 50`); } catch (_) {}
    try { finances = await pool.query(`SELECT * FROM finances ORDER BY period DESC LIMIT 24`); } catch (_) {}

    const systemPrompt = `You are an HOA reserve-study analyst. Project capital expenditures (roofs, paving,
pools, HVAC, fencing, painting) over a multi-year horizon. Identify funding gaps, recommend dues adjustments,
and produce a schedule of special assessments if needed. Return STRICT JSON only.`;

    const userPrompt = `Horizon (years): ${horizon_years}
Annual dues USD: ${annual_dues_usd || 'unspecified'}
Current reserves USD: ${current_reserves_usd || 'unspecified'}
Maintenance history (sample): ${JSON.stringify(maintenance.rows.slice(0, 15))}
Asset inventory (sample): ${JSON.stringify(assets.rows.slice(0, 15))}
Recent financials: ${JSON.stringify(finances.rows.slice(0, 12))}

Return JSON:
{
  "summary": "...",
  "capex_schedule": [{ "year": 0, "item": "string", "estimated_cost_usd": 0, "useful_life_remaining_years": 0 }],
  "funding_projection": [{ "year": 0, "ending_reserve_balance_usd": 0, "funded_pct": 0 }],
  "funding_gap_usd": 0,
  "dues_recommendation": { "current_usd": 0, "recommended_usd": 0, "adjustment_pct": 0 },
  "special_assessments": [{ "year": 0, "amount_per_unit_usd": 0, "purpose": "string" }],
  "risks": ["..."],
  "disclaimer": "Estimate only; commission a licensed reserve study for binding numbers."
}`;

    const raw = await askAI(systemPrompt, userPrompt);
    const parsed = parseJSON(raw);

    try {
      await pool.query(`CREATE TABLE IF NOT EXISTS reserve_studies (
        id SERIAL PRIMARY KEY, user_id INTEGER, horizon_years INT,
        payload JSONB, created_at TIMESTAMPTZ DEFAULT NOW()
      )`);
      await pool.query(
        `INSERT INTO reserve_studies (user_id, horizon_years, payload) VALUES ($1,$2,$3)`,
        [req.user?.id || null, horizon_years, JSON.stringify(parsed)]
      );
    } catch (_) {}

    res.json({ horizon_years, projection: parsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/history', async (_req, res) => {
  try {
    const r = await pool.query(
      `SELECT id, horizon_years, payload, created_at FROM reserve_studies ORDER BY created_at DESC LIMIT 20`
    ).catch(() => ({ rows: [] }));
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
