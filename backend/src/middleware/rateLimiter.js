// backend/src/middleware/rateLimiter.js

// In-memory store: { ip -> [timestamp, timestamp, ...] }
// Each array holds the timestamps of recent submissions from that IP.
// Old entries are pruned on each check so it doesn't grow forever.
const submissions = new Map();

const WINDOW_MS = 60 * 60 * 1000;   // 1 hour
const MAX_REPORTS = 5;               // per IP, per window

function rateLimiter(req, res, next) {
  const ip = req.ip || req.socket.remoteAddress;
  const now = Date.now();
  const cutoff = now - WINDOW_MS;

  // Get this IP's recent submissions, prune anything outside the window
  let timestamps = (submissions.get(ip) || []).filter(t => t > cutoff);

  if (timestamps.length >= MAX_REPORTS) {
    return res.status(429).json({
      error: 'Too many reports. Please wait before submitting again.',
    });
  }

  // Record this submission
  timestamps.push(now);
  submissions.set(ip, timestamps);

  next();
}

module.exports = rateLimiter;
