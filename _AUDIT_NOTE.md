# Audit Apply Notes — AIHOACommunityAssociationManager

## Source
`/Users/erolakarsu/projects/_AUDIT/reports/batch_04.md` section 20.

## Original Recommendations (AI Counterparts)
- `/violation-enforcement-advisor`
- `/reserve-study-projector`
- `/assessment-audit`
- `/parking-assignment-optimizer`

## Implemented (this pass)
Three new endpoints appended to existing `server/routes/ai.js`, each using existing `askAI`, `saveAnalysis`, `aiRateLimiter`, and DB context queries:

- `POST /api/ai/violation-enforcement-advisor` — pulls violation by `violation_id` plus the resident's prior 10 violations; returns a graduated-enforcement JSON recommendation (action, severity, fine, due-process steps, communication template, follow-up window).
- `POST /api/ai/reserve-study-projector` — pulls last 30 maintenance requests as a trend signal; produces a multi-year capital reserve projection JSON (annual breakdown, fully-funded percentage, shortfall year, dues-increase recommendation).
- `POST /api/ai/parking-assignment-optimizer` — pulls `parking_spots` (or fallback `parking` table) and residents; produces JSON assignment plan with rationale, unassigned/unfilled lists, and fairness score.

All three persist to `ai_analyses`. Schema-name fallback used where table name was uncertain.

Syntax: `node --check` passes.

## Backlog
- `/assessment-audit` — needs assessments schema clarity; deferred.
- Non-AI: payment/billing integration, voting/ballot management, homeowner portal, violation appeal process.
- Custom: agentic community manager, architectural compliance scanner (could call `askAI` on submitted designs), predictive HOA problem forecasting, community engagement & retention scoring.

## Categorization
- MECHANICAL: 3 endpoints (done).
- MECHANICAL but deferred: `/assessment-audit`, `architectural-compliance-scanner` (would need design/file upload context).
- NEEDS-PRODUCT-DECISION: agentic community manager autonomy boundary.
- NEEDS-CREDS: payment/billing integrations.

## Apply pass 3 (frontend)

- Action: UPDATED-FE.
- Existing `client/src/pages/AIAdvanced.jsx` (built for the pass-2 endpoints `/ai/violation-enforcement-advisor`, `/ai/reserve-study-projector`, `/ai/parking-assignment-optimizer`) was present but not imported or routed.
- Wired it: added import + `<Route path="/ai-advanced" element={<AIAdvanced />} />` in `client/src/App.jsx`, plus a sidebar entry `Advanced AI` in `client/src/components/Layout.jsx` under the existing `AI` section.
- Auth pattern: existing `client/src/api.js` already attaches `Authorization: Bearer <localStorage.token>`; 429 surfaces as `__RATE_LIMIT__`, other non-OK (including 503 no-key) surfaces as `Error(err.error)` and renders in the page's inline error block.
- Syntax-checked App.jsx, Layout.jsx, AIAdvanced.jsx with the project's `@babel/parser` (jsx plugin) — all OK.
- No `npm install`, no new deps.
- Log: `_AUDIT/apply3_logs/ab3_63.md`.

## Apply pass 4 (mechanical backlog)

- Action: ALREADY-IMPLEMENTED (this pass found work in place; documenting it).
- Backend: `server/routes/ai.js` contains 3 backlog-driven LLM endpoints with `requireAiKey` 503-on-no-key guards (cap 5):
  1. `POST /api/ai/architectural-compliance-scanner` — review CC&R / ARC compliance.
  2. `POST /api/ai/community-engagement-scoring` — engagement & retention analysis.
  3. `POST /api/ai/predictive-hoa-forecast` — risk forecasting for the next horizon.
- Frontend: `client/src/pages/AIAdvanced.jsx` already declares all three IDs (`architectural-compliance-scanner`, `community-engagement-scoring`, `predictive-hoa-forecast`) with corresponding `endpoint` strings under `/ai/...`; the existing `client/src/api.js` attaches the JWT bearer and surfaces 503 errors in-page.
- Backlog deferred: `/assessment-audit` (schema-clarity blocker), payment/billing integrations (NEEDS-CREDS), agentic community manager autonomy (NEEDS-PRODUCT-DECISION).
- Smoke test: deferred (`start.sh` requires Postgres); previous syntax-check confirmed by earlier pass.
- Log: `_AUDIT/apply4_logs/ab3_63.md`.
