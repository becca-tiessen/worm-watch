const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const rateLimiter = require('../middleware/rateLimiter');

// Pool configuration for Neon database
// Explicitly use DATABASE_URL and enable SSL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// GET /api/reports – returns all non-expired reports
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT lat, lng, intensity, notes, created_at FROM reports WHERE expires_at > now() ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// POST /api/reports – submit a new sighting
router.post('/', rateLimiter, async (req, res) => {
  const { lat, lng, intensity, notes } = req.body;

  // Basic validation
  if (!lat || !lng || !intensity) {
    return res.status(400).json({ error: 'lat, lng, and intensity are required' });
  }
  if (intensity < 1 || intensity > 5) {
    return res.status(400).json({ error: 'intensity must be between 1 and 5' });
  }

  // Winnipeg bounding box – rejects reports outside the city.
  // These are the actual geographic limits of the Winnipeg metro area.
  const WINNIPEG_BOUNDS = {
    latMin: 49.75,
    latMax: 50.05,
    lngMin: -97.35,
    lngMax: -96.95,
  };
  if (lat < WINNIPEG_BOUNDS.latMin || lat > WINNIPEG_BOUNDS.latMax ||
      lng < WINNIPEG_BOUNDS.lngMin || lng > WINNIPEG_BOUNDS.lngMax) {
    return res.status(400).json({ error: 'Report location must be within Winnipeg' });
  }

  // Cap notes length – no constraint in the DB, so enforce it here.
  if (notes && notes.length > 500) {
    return res.status(400).json({ error: 'Notes must be 500 characters or less' });
  }

  try {
    const { rows } = await pool.query(
      'INSERT INTO reports (lat, lng, intensity, notes) VALUES ($1, $2, $3, $4) RETURNING id, created_at',
      [lat, lng, intensity, notes || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit report' });
  }
});

module.exports = router;
