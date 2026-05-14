const router = require('express').Router();
const { askAI } = require('../openrouter');
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');

// Auth guard for all AI routes
router.use(authenticateToken);

// Helper: persist AI result
async function saveAnalysis(userId, toolName, entityType, entityId, result) {
  try {
    await pool.query(
      'INSERT INTO ai_analyses (user_id, tool_name, entity_type, entity_id, result) VALUES ($1, $2, $3, $4, $5)',
      [userId, toolName, entityType || null, entityId || null, result]
    );
  } catch (err) {
    console.error('Failed to save AI analysis:', err.message);
  }
}

// GET AI analysis history
router.get('/analyses', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM ai_analyses WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// General AI chat for HOA questions
router.post('/chat', aiRateLimiter, async (req, res) => {
  try {
    const { message } = req.body;
    const result = await askAI(message, 'You are an expert AI assistant for HOA and community association management. Provide helpful, professional advice on all aspects of community management including governance, legal compliance, maintenance, finances, and resident relations.');
    await saveAnalysis(req.user.id, 'chat', null, null, result);
    res.json({ response: result });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI Policy Generator
router.post('/generate-policy', aiRateLimiter, async (req, res) => {
  try {
    const { topic, details } = req.body;

    // Inject DB context: recent violations
    let violationContext = '';
    try {
      const violations = await pool.query(
        'SELECT violation_type, COUNT(*) as count FROM violations GROUP BY violation_type ORDER BY count DESC LIMIT 5'
      );
      if (violations.rows.length > 0) {
        const types = violations.rows.map(r => `${r.violation_type} (${r.count})`).join(', ');
        violationContext = `\n\nCurrent violation data for context: ${types}`;
      }
    } catch (_) {}

    const prompt = `Draft a professional HOA policy document for: ${topic}\nDetails: ${details}${violationContext}\n\nInclude: purpose, scope, definitions, rules, enforcement, exceptions, and effective date.`;
    const result = await askAI(prompt, 'You are an HOA governance expert drafting community policies and bylaws.');
    await saveAnalysis(req.user.id, 'generate-policy', null, null, result);
    res.json({ policy: result });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI Conflict Resolution
router.post('/resolve-conflict', aiRateLimiter, async (req, res) => {
  try {
    const { description, parties } = req.body;
    const prompt = `Help resolve this HOA community conflict:\nDescription: ${description}\nParties involved: ${parties}\n\nProvide: analysis of the situation, suggested mediation approach, fair resolution options, and prevention strategies.`;
    const result = await askAI(prompt, 'You are a community mediation expert specializing in HOA dispute resolution.');
    await saveAnalysis(req.user.id, 'resolve-conflict', null, null, result);
    res.json({ resolution: result });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI Legal Compliance Check
router.post('/legal-check', aiRateLimiter, async (req, res) => {
  try {
    const { question, context } = req.body;
    const prompt = `Provide guidance on this HOA legal compliance question:\nQuestion: ${question}\nContext: ${context}\n\nNote: This is general guidance only, not legal advice. Recommend consulting an attorney for specific situations.`;
    const result = await askAI(prompt, 'You are an HOA legal compliance advisor. Always include disclaimers that this is general guidance, not legal advice.');
    await saveAnalysis(req.user.id, 'legal-check', null, null, result);
    res.json({ guidance: result });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI Community Event Planner
router.post('/plan-event', aiRateLimiter, async (req, res) => {
  try {
    const { eventType, budget, attendees, preferences } = req.body;
    const prompt = `Plan an HOA community event:\nType: ${eventType}\nBudget: $${budget}\nExpected Attendees: ${attendees}\nPreferences: ${preferences}\n\nProvide: detailed plan, timeline, budget breakdown, vendor suggestions, logistics, and promotion ideas.`;
    const result = await askAI(prompt, 'You are a community event planner specializing in residential community events.');
    await saveAnalysis(req.user.id, 'plan-event', null, null, result);
    res.json({ plan: result });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI Energy/Sustainability Advisor
router.post('/sustainability', aiRateLimiter, async (req, res) => {
  try {
    const { communitySize, currentPractices, goals } = req.body;
    const prompt = `Provide sustainability recommendations for an HOA community:\nSize: ${communitySize} units\nCurrent Practices: ${currentPractices}\nGoals: ${goals}\n\nProvide: energy saving tips, green initiatives, cost-benefit analysis, and implementation timeline.`;
    const result = await askAI(prompt, 'You are a sustainability consultant for residential communities.');
    await saveAnalysis(req.user.id, 'sustainability', null, null, result);
    res.json({ recommendations: result });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI Board Decision Helper
router.post('/board-decision', aiRateLimiter, async (req, res) => {
  try {
    const { topic, options, considerations, entity_id } = req.body;

    let entityContext = '';
    if (entity_id) {
      try {
        const entity = await pool.query('SELECT * FROM properties WHERE id = $1', [entity_id]);
        if (entity.rows.length > 0) {
          entityContext = `\n\nRelated property data: ${JSON.stringify(entity.rows[0])}`;
        }
      } catch (_) {}
    }

    const prompt = `Help the HOA board make a decision on:\nTopic: ${topic}\nOptions: ${options}\nKey Considerations: ${considerations}${entityContext}\n\nProvide: pros and cons for each option, risk assessment, financial impact, legal considerations, and recommended course of action.`;
    const result = await askAI(prompt, 'You are a strategic advisor for HOA board decision-making.');
    await saveAnalysis(req.user.id, 'board-decision', entity_id ? 'property' : null, entity_id || null, result);
    res.json({ analysis: result });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI Predictive Maintenance — reads actual maintenance data from DB
router.post('/predictive-maintenance', aiRateLimiter, async (req, res) => {
  try {
    const { component_inventory } = req.body;

    // Fetch recent maintenance requests from DB for context
    const recentMaintenance = await pool.query(
      "SELECT title, category, priority, status, created_at FROM maintenance_requests ORDER BY created_at DESC LIMIT 20"
    ).catch(() => ({ rows: [] }));

    const openRequests = recentMaintenance.rows.filter(r => r.status !== 'completed');
    const completedRequests = recentMaintenance.rows.filter(r => r.status === 'completed');

    const systemPrompt = 'You are a community association property management AI specializing in predictive maintenance and capital planning. Return JSON: {"maintenance_schedule": [{"component": "", "last_service": "", "next_service_due": "", "priority": "high|medium|low", "estimated_cost": 0, "action": ""}], "reserve_study_projection": {"1_year": 0, "3_year": 0, "5_year": 0}, "immediate_attention": [{"item": "", "urgency": "", "cost_estimate": 0, "consequence_if_ignored": ""}], "cost_savings_opportunities": [{"opportunity": "", "savings": ""}], "summary": ""}';
    const userPrompt = `Community maintenance analysis:

Current open maintenance requests (${openRequests.length}):
${JSON.stringify(openRequests.slice(0, 10), null, 2)}

Recently completed maintenance (${completedRequests.length}):
${JSON.stringify(completedRequests.slice(0, 5), null, 2)}

Component inventory provided:
${component_inventory || 'Standard community components: roofing, HVAC, plumbing, electrical, landscaping, parking, amenities, fencing'}

Generate predictive maintenance plan and reserve study projections. Return JSON only.`;

    const result = await askAI(userPrompt, systemPrompt);
    await saveAnalysis(req.user.id, 'predictive-maintenance', null, null, result);
    res.json({ analysis: result, context: { open_requests: openRequests.length, total_analyzed: recentMaintenance.rows.length } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI Dues Collection Advisor — reads actual overdue dues data
router.post('/dues-advisor', aiRateLimiter, async (req, res) => {
  try {
    const overdueDues = await pool.query(
      `SELECT d.*, r.name as resident_name, p.address as property_address
       FROM dues_schedules d
       LEFT JOIN residents r ON r.id = d.resident_id
       LEFT JOIN properties p ON p.id = d.property_id
       WHERE d.paid = false AND d.due_date < CURRENT_DATE
       ORDER BY d.due_date ASC LIMIT 20`
    ).catch(() => ({ rows: [] }));

    const prompt = `Analyze these overdue HOA dues and recommend collection strategy:

Overdue accounts (${overdueDues.rows.length}):
${JSON.stringify(overdueDues.rows, null, 2)}

Provide: communication strategy (first notice, second notice, late fee application), escalation timeline, legal options if needed, and prevention strategies for future delinquencies. Be specific about timelines and dollar amounts.`;

    const result = await askAI(prompt, 'You are an HOA financial advisor specializing in dues collection and community finance management.');
    await saveAnalysis(req.user.id, 'dues-advisor', null, null, result);
    res.json({ advice: result, overdue_count: overdueDues.rows.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI Violation Enforcement Advisor — recommends enforcement severity using DB context
router.post('/violation-enforcement-advisor', aiRateLimiter, async (req, res) => {
  try {
    const { violation_id, violation_summary } = req.body;

    let violation = null;
    let priorViolations = [];
    if (violation_id) {
      try {
        const v = await pool.query('SELECT * FROM violations WHERE id = $1', [violation_id]);
        if (v.rows.length > 0) {
          violation = v.rows[0];
          if (violation.resident_id) {
            const prior = await pool.query(
              `SELECT id, violation_type, severity, status, created_at FROM violations
               WHERE resident_id = $1 AND id <> $2 ORDER BY created_at DESC LIMIT 10`,
              [violation.resident_id, violation_id]
            ).catch(() => ({ rows: [] }));
            priorViolations = prior.rows;
          }
        }
      } catch (_) {}
    }

    const systemPrompt = 'You are an HOA enforcement and governance advisor. Recommend a graduated enforcement action consistent with HOA bylaws and applicable state law. Return JSON: {"recommended_action": "verbal_warning|written_warning|fine|hearing|suspension|legal_referral", "severity": "low|medium|high", "rationale": "", "due_process_steps": [""], "fine_amount_suggestion": 0, "appeal_rights": "", "communication_template": "", "follow_up_window_days": 0, "risk_factors": [""]}';
    const userPrompt = `Recommend enforcement action.

Violation record: ${violation ? JSON.stringify(violation) : violation_summary || 'No structured record provided'}

Resident's prior violations (last 10): ${JSON.stringify(priorViolations)}

Return JSON only.`;

    const result = await askAI(userPrompt, systemPrompt);
    await saveAnalysis(req.user.id, 'violation-enforcement-advisor', 'violation', violation_id || null, result);
    res.json({ recommendation: result, prior_violation_count: priorViolations.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI Reserve Study Projector — long-horizon capital reserve planning
router.post('/reserve-study-projector', aiRateLimiter, async (req, res) => {
  try {
    const { current_reserve_balance, monthly_contribution, projection_years, components } = req.body;

    let maintenanceContext = [];
    try {
      const m = await pool.query(
        `SELECT title, category, priority, status, created_at FROM maintenance_requests ORDER BY created_at DESC LIMIT 30`
      );
      maintenanceContext = m.rows;
    } catch (_) {}

    const horizon = parseInt(projection_years) || 20;
    const systemPrompt = 'You are an HOA reserve study analyst. Produce a long-horizon capital reserve projection. Return JSON: {"projection_years": 0, "starting_balance": 0, "monthly_contribution": 0, "annual_breakdown": [{"year": 0, "expected_expenditures": 0, "contributions": 0, "ending_balance": 0, "major_items": [""]}], "fully_funded_pct": 0, "shortfall_year": null, "recommended_special_assessment": 0, "recommended_dues_increase_pct": 0, "summary": ""}';
    const userPrompt = `Project HOA capital reserves over ${horizon} years.

Current reserve balance: $${current_reserve_balance || 0}
Monthly contribution: $${monthly_contribution || 0}
Components and useful life: ${components || 'roofing 20y, HVAC 15y, parking lot 25y, siding 30y, plumbing 50y, painting 7y, amenities 10y'}

Recent maintenance requests for trend signal:
${JSON.stringify(maintenanceContext.slice(0, 15))}

Return JSON only.`;

    const result = await askAI(userPrompt, systemPrompt);
    await saveAnalysis(req.user.id, 'reserve-study-projector', null, null, result);
    res.json({ projection: result });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI Parking Assignment Optimizer
router.post('/parking-assignment-optimizer', aiRateLimiter, async (req, res) => {
  try {
    const { extra_constraints } = req.body;

    let parkingSpots = [];
    let residents = [];
    try {
      const p = await pool.query('SELECT * FROM parking_spots ORDER BY id ASC').catch(() => null);
      if (p && p.rows) parkingSpots = p.rows;
      else {
        const p2 = await pool.query('SELECT * FROM parking ORDER BY id ASC').catch(() => ({ rows: [] }));
        parkingSpots = p2.rows;
      }
    } catch (_) {}
    try {
      const r = await pool.query('SELECT * FROM residents ORDER BY id ASC LIMIT 200');
      residents = r.rows;
    } catch (_) {}

    const systemPrompt = 'You are an HOA parking allocation optimizer. Produce an assignment plan that balances accessibility (mobility needs), proximity to residence, equity (rotation/lottery for premium spots), and operational constraints. Return JSON: {"assignments": [{"spot_id": null, "resident_id": null, "rationale": ""}], "unassigned_residents": [], "unfilled_spots": [], "fairness_score": 0, "policy_recommendations": [""], "summary": ""}';
    const userPrompt = `Optimize parking assignments.

Spots (${parkingSpots.length}): ${JSON.stringify(parkingSpots.slice(0, 100))}

Residents (${residents.length}): ${JSON.stringify(residents.slice(0, 100))}

Extra constraints: ${extra_constraints || 'none provided'}

Return JSON only.`;

    const result = await askAI(userPrompt, systemPrompt);
    await saveAnalysis(req.user.id, 'parking-assignment-optimizer', null, null, result);
    res.json({ plan: result, spots_considered: parkingSpots.length, residents_considered: residents.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Apply pass 4: 503-on-no-key guard.
function requireAiKey(req, res) {
  const k = process.env.OPENROUTER_API_KEY;
  if (!k || /^your[-_].*key[-_]here$/i.test(k) || /^(sk-)?your-/i.test(k) || k.length < 20) {
    res.status(503).json({ error: 'AI service unavailable: OPENROUTER_API_KEY is not configured.' });
    return false;
  }
  return true;
}

// AI Architectural Compliance Scanner — apply pass 4
router.post('/architectural-compliance-scanner', aiRateLimiter, async (req, res) => {
  if (!requireAiKey(req, res)) return;
  try {
    const { request_id, description, design_summary } = req.body || {};
    let request = null;
    if (request_id) {
      try {
        const r = await pool.query('SELECT * FROM architectural_requests WHERE id = $1', [request_id]);
        request = r.rows[0] || null;
      } catch (_) {
        try {
          const r = await pool.query('SELECT * FROM architectural WHERE id = $1', [request_id]);
          request = r.rows[0] || null;
        } catch (__) {}
      }
    }
    const systemPrompt = 'You are an HOA architectural review expert. Compare a homeowner submission against typical CC&R / ARC guidelines (height, setback, materials, color palette, screening, and historical-district rules). Return JSON: {"overall":"approve|approve_with_conditions|deny","compliance_score":0,"findings":[{"rule":"","status":"compliant|violation|unclear","evidence":"","severity":"low|medium|high"}],"conditions":[],"required_documents":[],"appeal_window_days":0,"reviewer_notes":""}';
    const userPrompt = `Review this architectural submission.\n\nRequest record: ${JSON.stringify(request || {})}\n\nDescription: ${description || (request && request.description) || 'not provided'}\n\nDesign summary: ${design_summary || 'not provided'}\n\nReturn JSON only.`;
    const result = await askAI(userPrompt, systemPrompt);
    await saveAnalysis(req.user.id, 'architectural-compliance-scanner', 'architectural', request_id || null, result);
    res.json({ scan: result, request_id: request_id || null });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI Community Engagement & Retention Scoring — apply pass 4
router.post('/community-engagement-scoring', aiRateLimiter, async (req, res) => {
  if (!requireAiKey(req, res)) return;
  try {
    const { window_days = 90 } = req.body || {};
    const days = Math.min(365, Math.max(7, parseInt(window_days) || 90));
    let residents = []; let meetings = []; let comms = [];
    try { residents = (await pool.query('SELECT id, first_name, last_name, move_in_date, status FROM residents ORDER BY id ASC LIMIT 200')).rows; } catch (_) {}
    try { meetings = (await pool.query(`SELECT id, title, meeting_date, attendees FROM meetings WHERE meeting_date > NOW() - INTERVAL '${days} days' ORDER BY meeting_date DESC LIMIT 50`)).rows; } catch (_) {}
    try { comms = (await pool.query(`SELECT id, type, subject, sent_at FROM communications WHERE sent_at > NOW() - INTERVAL '${days} days' ORDER BY sent_at DESC LIMIT 100`)).rows; } catch (_) {}
    const systemPrompt = 'You are an HOA engagement & retention analyst. Score community engagement and flag at-risk residents using meeting attendance, communications volume, complaint trends, and tenure. Return JSON: {"overall_engagement_score":0,"segments":[{"segment":"","share":0,"avg_score":0,"top_traits":[]}],"at_risk_residents":[{"resident_id":null,"reasons":[]}],"recommended_actions":[{"action":"","target":"","expected_lift":""}],"summary":""}';
    const userPrompt = `Assess community engagement over the last ${days} days.\n\nResidents (${residents.length}): ${JSON.stringify(residents.slice(0, 80))}\n\nMeetings (${meetings.length}): ${JSON.stringify(meetings)}\n\nCommunications (${comms.length}): ${JSON.stringify(comms)}\n\nReturn JSON only.`;
    const result = await askAI(userPrompt, systemPrompt);
    await saveAnalysis(req.user.id, 'community-engagement-scoring', null, null, result);
    res.json({ scoring: result, residents_considered: residents.length, window_days: days });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI Predictive HOA Problem Forecast — apply pass 4
router.post('/predictive-hoa-forecast', aiRateLimiter, async (req, res) => {
  if (!requireAiKey(req, res)) return;
  try {
    const { horizon_days = 90 } = req.body || {};
    const horizon = Math.min(540, Math.max(30, parseInt(horizon_days) || 90));
    let violations = []; let maintenance = []; let finances = []; let weatherSeason = new Date().getMonth();
    try { violations = (await pool.query(`SELECT id, type, severity, status, created_at FROM violations WHERE created_at > NOW() - INTERVAL '180 days' ORDER BY created_at DESC LIMIT 200`)).rows; } catch (_) {}
    try { maintenance = (await pool.query(`SELECT id, category, status, priority, created_at FROM maintenance_requests WHERE created_at > NOW() - INTERVAL '180 days' ORDER BY created_at DESC LIMIT 200`)).rows; } catch (_) {
      try { maintenance = (await pool.query(`SELECT id, category, status, priority, created_at FROM maintenance WHERE created_at > NOW() - INTERVAL '180 days' ORDER BY created_at DESC LIMIT 200`)).rows; } catch (__) {}
    }
    try { finances = (await pool.query(`SELECT id, type, amount, due_date, status FROM finances ORDER BY id DESC LIMIT 200`)).rows; } catch (_) {}
    const systemPrompt = 'You are an HOA risk-forecasting AI. Predict the most likely community problems over the planning horizon based on violation, maintenance, finance, and seasonal signals. Return JSON: {"horizon_days":0,"top_risks":[{"category":"violations|maintenance|finance|governance|weather","predicted_event":"","likelihood":"high|medium|low","estimated_impact_usd":0,"earliest_date":"","contributing_signals":[],"mitigation":""}],"early_warnings":[],"recommended_budget_reserve_usd":0,"summary":""}';
    const userPrompt = `Forecast HOA problems for the next ${horizon} days.\n\nMonth-of-year (1-12): ${weatherSeason + 1}\n\nViolations (${violations.length}): ${JSON.stringify(violations.slice(0, 80))}\n\nMaintenance (${maintenance.length}): ${JSON.stringify(maintenance.slice(0, 80))}\n\nFinances (${finances.length}): ${JSON.stringify(finances.slice(0, 50))}\n\nReturn JSON only.`;
    const result = await askAI(userPrompt, systemPrompt);
    await saveAnalysis(req.user.id, 'predictive-hoa-forecast', null, null, result);
    res.json({ forecast: result, horizon_days: horizon });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Apply pass 5: assessment-audit (was deferred in pass 4 due to schema uncertainty;
// implements graceful schema-fallback like other endpoints in this file).
router.post('/assessment-audit', aiRateLimiter, async (req, res) => {
  if (!requireAiKey(req, res)) return;
  try {
    let { property_id, assessments, scope } = req.body || {};
    if (!Array.isArray(assessments) && property_id) {
      try { assessments = (await pool.query('SELECT * FROM assessments WHERE property_id = $1 ORDER BY id DESC LIMIT 50', [property_id])).rows; } catch (_) {}
    }
    if (!Array.isArray(assessments)) {
      // Fallback: derive from finances when no assessments table
      try { assessments = (await pool.query("SELECT id, type, amount, due_date, status FROM finances WHERE type ILIKE '%assess%' ORDER BY id DESC LIMIT 100")).rows; } catch (_) { assessments = []; }
    }
    let properties = [];
    try { properties = (await pool.query('SELECT id, address, square_feet, type FROM properties LIMIT 200')).rows; } catch (_) {}

    const systemPrompt = 'You are an HOA assessment-fairness auditor. Audit a batch of property assessments for fairness, consistency, and legal/financial soundness. Return JSON: {"audit_summary":"","fairness_score":0-100,"red_flags":[{"property_id":null,"issue":"","severity":"low|medium|high"}],"recommended_adjustments":[{"property_id":null,"current_amount":0,"recommended_amount":0,"rationale":""}],"comparable_anomalies":[],"governance_advice":[]}';
    const userPrompt = `Audit these HOA assessments.\n\nScope: ${scope || 'standard fairness audit'}\nFocus property_id: ${property_id || 'all'}\n\nProperties (${properties.length}):\n${JSON.stringify(properties.slice(0, 60))}\n\nAssessments (${assessments.length}):\n${JSON.stringify(assessments.slice(0, 100))}\n\nReturn JSON only.`;
    const result = await askAI(userPrompt, systemPrompt);
    await saveAnalysis(req.user.id, 'assessment-audit', property_id ? 'property' : null, property_id || null, result);
    res.json({ audit: result, considered: { properties: properties.length, assessments: assessments.length } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET AI analyses history (paginated)
router.get('/history', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const [rows, count] = await Promise.all([
      pool.query('SELECT * FROM ai_analyses WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3', [req.user.id, limit, offset]),
      pool.query('SELECT COUNT(*) FROM ai_analyses WHERE user_id = $1', [req.user.id]),
    ]);
    res.json({ data: rows.rows, total: parseInt(count.rows[0].count), page, limit });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
