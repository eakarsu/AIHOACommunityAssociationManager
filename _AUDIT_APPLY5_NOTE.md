# Apply Pass 5 — AIHOACommunityAssociationManager

**Date:** 2026-05-08
**Stack:** Node-Express + React (Vite). Postgres. JWT bearer (`authenticateToken`). `aiRateLimiter`. `askAI(prompt, system)` helper. Persistence to `ai_analyses`.
**Source audit:** `/Users/erolakarsu/projects/_AUDIT/reports/batch_04.md` section 20.

## Verified present
- 11 audit-recognized AI endpoints (chat, analyses, generate-policy, resolve-conflict, legal-check, plan-event, sustainability, board-decision, predictive-maintenance, dues-advisor, history).
- Pass 2 added `/violation-enforcement-advisor`, `/reserve-study-projector`, `/parking-assignment-optimizer`.
- Pass 4 added `/architectural-compliance-scanner`, `/community-engagement-scoring`, `/predictive-hoa-forecast`.
- Pass 4 wired `requireAiKey()` 503-on-no-key guard.
- FE `AIAdvanced.jsx` already exposes pass 2-4 endpoints.

## Implemented this pass (3 items: 1 AI + 2 non-AI features)
1. `POST /api/ai/assessment-audit` — fairness audit on a batch of property assessments. Falls back to `finances` table when `assessments` table absent. Closes the last open audit-listed AI gap.
2. `POST /api/violation-appeals` (+ GET, GET/:id, POST /:id/decision) — additive non-AI feature: violation appeal process (was listed in audit gaps as "No violation appeal process"). Auto-creates `violation_appeals` table on first request via `CREATE TABLE IF NOT EXISTS`.
3. `POST /api/ballots` (+ list, vote, tally, transition) — additive non-AI feature: voting/ballot management (was listed in audit gaps as "No voting/ballot management"). Auto-creates `ballots` and `ballot_votes` tables (additive only). UNIQUE constraint enforces one vote per ballot per voter.

All three:
- `authenticateToken` (mounted at the file level for ai.js; per-route for new files).
- 503-on-no-key for the AI endpoint.
- Additive table creation only — no existing schema modified.

### FE
- `client/src/pages/AIAdvanced.jsx` extended with the `assessment-audit` feature card (uses existing dynamic feature-driven UI).
- New page `client/src/pages/AppealsAndBallots.jsx` covers both new non-AI features (Appeals + Ballots tabs).
- Routed at `/governance` in `App.jsx`.

## Deferred / categorization
- NEEDS-CREDS: payment/billing integration (Stripe / ACH), homeowner portal SSO.
- NEEDS-PRODUCT-DECISION: ballot type variants (ranked-choice, weighted-by-property, quorum logic), appeal hearing scheduler.

## Smoke test
- `node --check` PASS for all modified/new server files.
- New tables use `CREATE TABLE IF NOT EXISTS` and won't disturb existing data.

## Cap respected
3 of 5 allowed (1 AI + 2 non-AI). Remaining backlog items are NEEDS-CREDS or NEEDS-PRODUCT-DECISION.
