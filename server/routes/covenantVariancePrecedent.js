const express = require('express');

const router = express.Router();

function findPrecedents(input = {}) {
  const request = input.request || { category: 'fence height', requested_variance: '8 ft cedar privacy fence', hardship: 'corner lot noise exposure' };
  const cases = input.cases || [
    { id: 'ARC-104', category: 'fence height', outcome: 'approved_with_conditions', similarity: 0.86, condition: 'landscape screening required' },
    { id: 'ARC-087', category: 'fence height', outcome: 'denied', similarity: 0.64, condition: 'no hardship documented' },
    { id: 'ARC-142', category: 'exterior materials', outcome: 'approved', similarity: 0.32, condition: 'matching palette' },
  ];
  const matches = cases.filter((c) => c.category === request.category).sort((a, b) => b.similarity - a.similarity);
  return {
    request,
    matches,
    recommendation: matches[0]?.outcome === 'approved_with_conditions' ? 'approve_with_consistent_conditions' : 'board_review',
    fairness_note: 'Apply the same conditions used in the closest approved precedent or document why this case is materially different.',
  };
}

router.get('/', (req, res) => res.json(findPrecedents()));
router.post('/search', (req, res) => res.json(findPrecedents(req.body || {})));

module.exports = router;
