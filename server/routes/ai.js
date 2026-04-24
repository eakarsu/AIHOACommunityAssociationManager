const router = require('express').Router();
const { askAI } = require('../openrouter');

// General AI chat for HOA questions
router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    const result = await askAI(message, 'You are an expert AI assistant for HOA and community association management. Provide helpful, professional advice on all aspects of community management including governance, legal compliance, maintenance, finances, and resident relations.');
    res.json({ response: result });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI Policy Generator
router.post('/generate-policy', async (req, res) => {
  try {
    const { topic, details } = req.body;
    const prompt = `Draft a professional HOA policy document for: ${topic}\nDetails: ${details}\n\nInclude: purpose, scope, definitions, rules, enforcement, exceptions, and effective date.`;
    const result = await askAI(prompt, 'You are an HOA governance expert drafting community policies and bylaws.');
    res.json({ policy: result });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI Conflict Resolution
router.post('/resolve-conflict', async (req, res) => {
  try {
    const { description, parties } = req.body;
    const prompt = `Help resolve this HOA community conflict:\nDescription: ${description}\nParties involved: ${parties}\n\nProvide: analysis of the situation, suggested mediation approach, fair resolution options, and prevention strategies.`;
    const result = await askAI(prompt, 'You are a community mediation expert specializing in HOA dispute resolution.');
    res.json({ resolution: result });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI Legal Compliance Check
router.post('/legal-check', async (req, res) => {
  try {
    const { question, context } = req.body;
    const prompt = `Provide guidance on this HOA legal compliance question:\nQuestion: ${question}\nContext: ${context}\n\nNote: This is general guidance only, not legal advice. Recommend consulting an attorney for specific situations.`;
    const result = await askAI(prompt, 'You are an HOA legal compliance advisor. Always include disclaimers that this is general guidance, not legal advice.');
    res.json({ guidance: result });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI Community Event Planner
router.post('/plan-event', async (req, res) => {
  try {
    const { eventType, budget, attendees, preferences } = req.body;
    const prompt = `Plan an HOA community event:\nType: ${eventType}\nBudget: $${budget}\nExpected Attendees: ${attendees}\nPreferences: ${preferences}\n\nProvide: detailed plan, timeline, budget breakdown, vendor suggestions, logistics, and promotion ideas.`;
    const result = await askAI(prompt, 'You are a community event planner specializing in residential community events.');
    res.json({ plan: result });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI Energy/Sustainability Advisor
router.post('/sustainability', async (req, res) => {
  try {
    const { communitySize, currentPractices, goals } = req.body;
    const prompt = `Provide sustainability recommendations for an HOA community:\nSize: ${communitySize} units\nCurrent Practices: ${currentPractices}\nGoals: ${goals}\n\nProvide: energy saving tips, green initiatives, cost-benefit analysis, and implementation timeline.`;
    const result = await askAI(prompt, 'You are a sustainability consultant for residential communities.');
    res.json({ recommendations: result });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI Board Decision Helper
router.post('/board-decision', async (req, res) => {
  try {
    const { topic, options, considerations } = req.body;
    const prompt = `Help the HOA board make a decision on:\nTopic: ${topic}\nOptions: ${options}\nKey Considerations: ${considerations}\n\nProvide: pros and cons for each option, risk assessment, financial impact, legal considerations, and recommended course of action.`;
    const result = await askAI(prompt, 'You are a strategic advisor for HOA board decision-making.');
    res.json({ analysis: result });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
