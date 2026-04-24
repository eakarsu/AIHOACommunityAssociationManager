const router = require('express').Router();
const pool = require('../db');
const { askAI } = require('../openrouter');

router.get('/stats', async (req, res) => {
  try {
    const residents = await pool.query('SELECT COUNT(*) FROM residents');
    const properties = await pool.query('SELECT COUNT(*) FROM properties');
    const maintenance = await pool.query("SELECT COUNT(*) FROM maintenance_requests WHERE status = 'open'");
    const violations = await pool.query("SELECT COUNT(*) FROM violations WHERE status = 'open'");
    const finances = await pool.query('SELECT COALESCE(SUM(amount), 0) as total FROM financial_transactions WHERE type = $1', ['income']);
    const expenses = await pool.query('SELECT COALESCE(SUM(amount), 0) as total FROM financial_transactions WHERE type = $1', ['expense']);
    const meetings = await pool.query("SELECT COUNT(*) FROM meetings WHERE date >= CURRENT_DATE");
    const amenities = await pool.query('SELECT COUNT(*) FROM amenity_bookings');

    res.json({
      totalResidents: parseInt(residents.rows[0].count),
      totalProperties: parseInt(properties.rows[0].count),
      openMaintenance: parseInt(maintenance.rows[0].count),
      openViolations: parseInt(violations.rows[0].count),
      totalIncome: parseFloat(finances.rows[0].total),
      totalExpenses: parseFloat(expenses.rows[0].total),
      upcomingMeetings: parseInt(meetings.rows[0].count),
      totalBookings: parseInt(amenities.rows[0].count),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/ai-insights', async (req, res) => {
  try {
    const stats = req.body;
    const prompt = `Analyze these HOA community stats and provide 3-5 actionable insights with recommendations:
    - Total Residents: ${stats.totalResidents}
    - Total Properties: ${stats.totalProperties}
    - Open Maintenance Requests: ${stats.openMaintenance}
    - Open Violations: ${stats.openViolations}
    - Total Income: $${stats.totalIncome}
    - Total Expenses: $${stats.totalExpenses}
    - Upcoming Meetings: ${stats.upcomingMeetings}

    Format each insight with a title, description, and priority level (high/medium/low).`;

    const result = await askAI(prompt, 'You are an expert HOA community analyst. Provide professional, data-driven insights.');
    res.json({ insights: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
