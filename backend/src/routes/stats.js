const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

// Pool configuration for Neon database
// Explicitly use DATABASE_URL and enable SSL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// GET /api/stats – weekly summary for the StatsPanel, plus all-time and last-season data
// for the off-season retrospective view.
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        -- This week
        (SELECT COUNT(*)::int FROM reports WHERE created_at >= now() - INTERVAL '7 days')
          AS total_reports_this_week,
        (SELECT COALESCE(SUM(intensity), 0)::int FROM reports WHERE created_at >= now() - INTERVAL '7 days')
          AS total_intensity_this_week,
        (SELECT COUNT(*)::int FROM reports WHERE expires_at > now())
          AS total_active_reports,

        -- All time – used to determine first-year vs retrospective
        (SELECT COUNT(*)::int FROM reports)
          AS total_reports_all_time,

        -- Last season (May 1 – July 31 of the previous year).
        -- Returns nulls if no reports exist for that window, which is how
        -- the frontend knows it's still year one.
        (SELECT COUNT(*)::int FROM reports
         WHERE created_at >= make_date(EXTRACT(YEAR FROM now())::int - 1, 5, 1)
           AND created_at <  make_date(EXTRACT(YEAR FROM now())::int - 1, 8, 1))
          AS last_season_total_reports,
        (SELECT MAX(intensity) FROM reports
         WHERE created_at >= make_date(EXTRACT(YEAR FROM now())::int - 1, 5, 1)
           AND created_at <  make_date(EXTRACT(YEAR FROM now())::int - 1, 8, 1))
          AS last_season_peak_intensity,
        (SELECT created_at FROM reports
         WHERE created_at >= make_date(EXTRACT(YEAR FROM now())::int - 1, 5, 1)
           AND created_at <  make_date(EXTRACT(YEAR FROM now())::int - 1, 8, 1)
         ORDER BY created_at DESC LIMIT 1)
          AS last_season_last_report_date
    `);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;
