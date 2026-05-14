// Architectural compliance scanner flagging design issues pre-formal review.
// Audit: batch_04.md / AIHOACommunityAssociationManager / Custom Feature Suggestions #2
const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { askAI } = require('../openrouter');
const pool = require('../db');

const router = express.Router();
router.use(authenticateToken);

function parseJSON(t) { try { const m = t.match(/\{[\s\S]*\}/); if (m) return JSON.parse(m[0]); } catch (_) {} return { notes: t }; }

// POST /api/architectural-scanner/prescan
// Body: { request_id?, description, image_urls?, property_id? }
router.post('/prescan', async (req, res) => {
  try {
    const { request_id, description, image_urls = [], property_id } = req.body || {};
    if (!description && image_urls.length === 0) {
      return res.status(400).json({ error: 'description or image_urls required' });
    }

    let covenants = '';
    try {
      const r = await pool.query(`SELECT content FROM documents WHERE category = 'covenant' LIMIT 1`);
      covenants = r.rows[0]?.content || '';
    } catch (_) {}

    const systemPrompt = `You are an HOA architectural-review pre-screen assistant. Compare a proposed
modification against typical HOA covenants (setbacks, color palette, fencing height, roof material, exterior
mods). Flag likely issues and recommend pre-submission fixes. Return STRICT JSON only.`;

    const userPrompt = `Property: ${property_id || 'unspecified'}
Proposal description: ${description || '(see images)'}
Image URLs: ${JSON.stringify(image_urls.slice(0, 6))}
Covenant excerpt (sample): ${(covenants || '').slice(0, 4000)}

Return JSON:
{
  "summary": "...",
  "compliance_score_0_100": 0,
  "likely_issues": [{ "issue": "string", "covenant_reference": "string", "severity": "low|medium|high", "fix_suggestion": "string" }],
  "neighbor_impact_estimate": "low|moderate|high",
  "pre_submission_recommendations": ["..."],
  "additional_documentation_needed": ["..."],
  "disclaimer": "Pre-screen only; formal architectural committee review required."
}`;

    const raw = await askAI(systemPrompt, userPrompt);
    const parsed = parseJSON(raw);

    try {
      await pool.query(
        `INSERT INTO ai_results (user_id, entity_type, entity_id, analysis_type, payload)
         VALUES ($1,$2,$3,$4,$5)`,
        [req.user?.id || null, 'architectural_request', request_id || null, 'architectural_prescan', JSON.stringify(parsed)]
      ).catch(() => {});
    } catch (_) {}

    res.json({ request_id: request_id || null, prescan: parsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/recent', async (_req, res) => {
  try {
    const r = await pool.query(
      `SELECT id, entity_id, payload, created_at FROM ai_results
       WHERE analysis_type = 'architectural_prescan' ORDER BY created_at DESC LIMIT 30`
    ).catch(() => ({ rows: [] }));
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
