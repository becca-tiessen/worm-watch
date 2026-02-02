// backend/src/routes/admin.js
const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool();

// DELETE /api/admin/reports
// Protected — requires x-admin-secret header matching ADMIN_SECRET env var.
//
// Query params (all optional, but at least one should be provided):
//   since  — ISO timestamp. Only delete reports created after this time.
//           e.g. ?since=2026-05-15T20:00:00Z
//   latMin, latMax, lngMin, lngMax — bounding box. Only delete reports inside this box.
//           e.g. ?latMin=49.88&latMax=49.92&lngMin=-97.16&lngMax=-97.10
//
// Examples:
//   Delete everything from the last 2 hours:
//     curl -X DELETE "https://your-backend.onrender.com/api/admin/reports?since=2026-05-15T20:00:00Z" \
//       -H "x-admin-secret: your-secret-here"
//
//   Delete everything in River Heights from the last hour:
//     curl -X DELETE "https://your-backend.onrender.com/api/admin/reports?since=2026-05-15T21:00:00Z&latMin=49.87&latMax=49.90&lngMin=-97.17&lngMax=-97.14" \
//       -H "x-admin-secret: your-secret-here"
//
//   Delete ALL reports (use with care):
//     curl -X DELETE "https://your-backend.onrender.com/api/admin/reports" \
//       -H "x-admin-secret: your-secret-here"

router.delete('/', async (req, res) => {
  // Auth check
  if (req.headers['x-admin-secret'] !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { since, latMin, latMax, lngMin, lngMax } = req.query;

  // Build the WHERE clause dynamically based on what was provided
  const conditions = [];
  const values = [];
  let paramIndex = 1;

  if (since) {
    conditions.push(`created_at >= $${paramIndex}`);
    values.push(new Date(since));
    paramIndex++;
  }
  if (latMin !== undefined) {
    conditions.push(`lat >= $${paramIndex}`);
    values.push(parseFloat(latMin));
    paramIndex++;
  }
  if (latMax !== undefined) {
    conditions.push(`lat <= $${paramIndex}`);
    values.push(parseFloat(latMax));
    paramIndex++;
  }
  if (lngMin !== undefined) {
    conditions.push(`lng >= $${paramIndex}`);
    values.push(parseFloat(lngMin));
    paramIndex++;
  }
  if (lngMax !== undefined) {
    conditions.push(`lng <= $${paramIndex}`);
    values.push(parseFloat(lngMax));
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
  const query = `DELETE FROM reports ${whereClause} RETURNING id`;

  try {
    const { rows } = await pool.query(query, values);
    res.json({
      deleted: rows.length,
      message: rows.length === 0
        ? 'No reports matched those filters.'
        : `Deleted ${rows.length} report${rows.length !== 1 ? 's' : ''}.`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete reports' });
  }
});

module.exports = router;
