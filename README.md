# 🐛 Worm Watch

A crowdsourced cankerworm tracking app for Winnipeg. Report sightings, view real-time heatmaps, and help your neighbours avoid the gooey spots.

**Live at:** [worm-watch.onrender.com](https://worm-watch.onrender.com) _(placeholder - update with your actual URL)_

---

## What is this?

Cankerworms are invasive caterpillars that descend from Winnipeg's elm trees every spring (May–July) on sticky silk threads. They're gross, they get everywhere, and the city doesn't track them in real-time. Worm Watch fills that gap with:

- **Crowdsourced reports** — Tap the map to drop a pin where you saw worms
- **Live heatmap** — See current activity across the city
- **7-day expiry** — Old reports auto-delete; the map stays current
- **Neighbourhood inference** — Automatically tags your report with the nearest neighbourhood
- **Season-aware UI** — Gentle off-season mode when worms aren't active (August–April)

Built with Vue 3, Leaflet.js, Express, and PostgreSQL.

---

## Features

### User-facing
- **Three ways to set location:**
  - GPS (browser geolocation)
  - Pick a neighbourhood from a dropdown (19 Winnipeg areas)
  - Click the map
- **Intensity levels:** 1–5 scale (None → Apocalypse)
- **Context-aware form:** Shows compact confirmation when you click the map, full picker when you use the FAB button
- **Map boundaries:** Locked to Winnipeg — can't zoom out past the city or click outside the valid area
- **Crosshair cursor** on desktop, "tap to report" hint on first load
- **Stats panel:** Weekly activity, total active reports, worst hotspot with zoom-to button
- **Season banner:** Color-coded alerts (Dormant, Watch, Active)
- **Social sharing:** Auto-generated tweet button with emoji intensity and neighbourhood
- **Confetti** when you submit a report (because why not)

### Admin / Developer
- **Rate limiting:** 5 reports per IP per hour (in-memory, no Redis required)
- **Admin nuke endpoint:** DELETE /api/admin/reports with flexible filters (time, bounding box, or both)
- **Auto-expiry:** Reports older than 7 days are filtered out on fetch (no cron needed)
- **CORS-enabled API** for easy testing and integration

---

## Tech Stack

**Frontend:**
- Vue 3 (Composition API)
- Leaflet.js + Leaflet.heat
- Vite

**Backend:**
- Node.js + Express
- PostgreSQL (Neon serverless)
- Hosted on Render

**No frameworks for:** state management (plain refs/composables), styling (scoped CSS), or build tools beyond Vite.

---

## Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL (local or cloud)
- A Neon or other Postgres database URL

### 1. Clone the repo
```bash
git clone https://github.com/becca-tiessen/worm-watch.git
cd worm-watch
```

### 2. Set up the database

**Create the `reports` table:**
```sql
CREATE TABLE reports (
  id SERIAL PRIMARY KEY,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  intensity INTEGER NOT NULL CHECK (intensity >= 1 AND intensity <= 5),
  notes TEXT,
  created_at TIMESTAMP DEFAULT now(),
  expires_at TIMESTAMP DEFAULT (now() + interval '7 days')
);

CREATE INDEX idx_reports_expires_at ON reports (expires_at);
CREATE INDEX idx_reports_created_at ON reports (created_at);
```

**Optional: Seed with sample data**
```sql
INSERT INTO reports (lat, lng, intensity, notes) VALUES
  (49.8994, -97.1353, 3, 'Lots of worms near the Forks'),
  (49.895, -97.14, 5, 'River Heights is a nightmare'),
  (49.88, -97.155, 2, 'A few worms, not too bad');
```

### 3. Configure environment variables

**Backend** (`backend/.env`):
```env
DATABASE_URL=postgresql://user:password@host:port/dbname
ADMIN_SECRET=your-random-secret-string
PORT=3000
```

**Frontend** (`frontend/.env`):
```env
VITE_API_URL=http://localhost:3000
```

### 4. Install dependencies and run

**Terminal 1 — Backend:**
```bash
cd backend
npm install
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`, backend at `http://localhost:3000`.

---

## Deployment

### Backend (Render)
1. Create a new **Web Service** on Render
2. Connect your GitHub repo
3. Set **Root Directory** to `backend`
4. Set **Build Command** to `npm install`
5. Set **Start Command** to `npm start`
6. Add environment variables:
   - `DATABASE_URL` (your Neon or Postgres URL)
   - `ADMIN_SECRET` (random string)

### Frontend (Render)
1. Create a new **Static Site** on Render
2. Connect your GitHub repo
3. Set **Root Directory** to `frontend`
4. Set **Build Command** to `npm install && npm run build`
5. Set **Publish Directory** to `dist`
6. Add environment variable:
   - `VITE_API_URL` (your backend URL, e.g., `https://worm-watch-backend.onrender.com`)

### Database (Neon)
1. Create a new project at [neon.tech](https://neon.tech)
2. Copy the connection string
3. Run the table creation SQL in the Neon SQL Editor
4. Add the connection string to your backend environment variables

---

## Admin Operations

### Deleting Reports (Admin Nuke Endpoint)

The `DELETE /api/admin/reports` endpoint lets you bulk-delete reports. It's protected by the `x-admin-secret` header.

**Authentication:**
```bash
-H "x-admin-secret: your-secret-here"
```

**Examples:**

**Delete all reports from the last 2 hours:**
```bash
curl -X DELETE "https://your-backend.onrender.com/api/admin/reports?since=2026-05-15T20:00:00Z" \
  -H "x-admin-secret: your-secret-here"
```

**Delete reports in a specific neighbourhood (River Heights):**
```bash
curl -X DELETE "https://your-backend.onrender.com/api/admin/reports?latMin=49.87&latMax=49.90&lngMin=-97.17&lngMax=-97.14" \
  -H "x-admin-secret: your-secret-here"
```

**Combine filters (last hour + specific area):**
```bash
curl -X DELETE "https://your-backend.onrender.com/api/admin/reports?since=2026-05-15T21:00:00Z&latMin=49.88&latMax=49.92&lngMin=-97.16&lngMax=-97.10" \
  -H "x-admin-secret: your-secret-here"
```

**Delete ALL reports (use with extreme care):**
```bash
curl -X DELETE "https://your-backend.onrender.com/api/admin/reports" \
  -H "x-admin-secret: your-secret-here"
```

**Response:**
```json
{
  "deleted": 12,
  "message": "Deleted 12 reports."
}
```

**Query Parameters:**
- `since` — ISO 8601 timestamp (e.g., `2026-05-15T20:00:00Z`)
- `latMin`, `latMax`, `lngMin`, `lngMax` — Bounding box coordinates

**Tips:**
- Use `since` with `new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()` in JS to get "2 hours ago"
- Combine filters to be surgical (e.g., delete only recent spam in one area)
- Test with GET first to see what would be deleted (not implemented yet, but you can query the DB directly)

---

## API Reference

### `GET /api/reports`
Returns all non-expired reports (created within the last 7 days).

**Response:**
```json
[
  {
    "lat": 49.8994,
    "lng": -97.1353,
    "intensity": 3,
    "notes": "Lots near the Forks",
    "created_at": "2026-05-15T10:30:00Z"
  }
]
```

### `POST /api/reports`
Submit a new worm sighting.

**Request:**
```json
{
  "lat": 49.8994,
  "lng": -97.1353,
  "intensity": 3,
  "notes": "Optional notes, max 500 chars"
}
```

**Validation:**
- `lat`, `lng`, `intensity` are required
- `intensity` must be 1–5
- Location must be within Winnipeg bounds (49.75–50.05 lat, -97.35 to -96.95 lng)
- Rate limit: 5 reports per IP per hour

**Response:**
```json
{
  "id": 123,
  "created_at": "2026-05-15T10:30:00Z"
}
```

**Errors:**
- `400` — Invalid input
- `429` — Rate limit exceeded

### `GET /api/stats`
Returns aggregate statistics.

**Response:**
```json
{
  "total_reports_this_week": 42,
  "total_active_reports": 28,
  "last_season_total_reports": 156,
  "last_season_peak_intensity": 4
}
```

### `DELETE /api/admin/reports`
Bulk-delete reports (admin only). See [Admin Operations](#admin-operations) above.

---

## Project Structure

```
worm-watch/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── reports.js       # GET/POST reports
│   │   │   ├── stats.js         # Aggregate stats
│   │   │   └── admin.js         # Admin nuke endpoint
│   │   ├── middleware/
│   │   │   └── rateLimiter.js   # In-memory rate limiting
│   │   └── index.js             # Express server
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Map.vue          # Leaflet map + heatmap
│   │   │   ├── ReportForm.vue   # Multi-method location picker
│   │   │   ├── SeasonBanner.vue # Top alert bar
│   │   │   ├── StatsPanel.vue   # Right-side stats
│   │   │   └── ShareButton.vue  # Twitter share
│   │   ├── composables/
│   │   │   ├── useReports.js    # Fetch reports
│   │   │   └── useSeasonStatus.js # Determine season state
│   │   ├── utils/
│   │   │   ├── api.js           # API client
│   │   │   ├── neighbourhoods.js # Neighbourhood data + nearest lookup
│   │   │   ├── intensityLevels.js # 1–5 scale definitions
│   │   │   ├── heatmapUtils.js  # Convert reports to heatmap format
│   │   │   └── confetti.js      # Celebration animation
│   │   ├── styles/
│   │   │   └── App.css          # Global styles
│   │   └── App.vue              # Root component
│   └── package.json
└── README.md
```

---

## How It Works

### Report Lifecycle
1. User taps the map (or uses GPS/neighbourhood dropdown)
2. Form opens with location pre-filled and neighbourhood inferred
3. User picks intensity (1–5) and optionally adds notes
4. Frontend sends POST to `/api/reports`
5. Backend validates, rate-limits, and inserts into PostgreSQL
6. Record gets `expires_at = now() + 7 days` automatically
7. Frontend refetches reports, map updates with new heatmap blob
8. After 7 days, the report is excluded from GET /api/reports (no cron needed)

### Heatmap Rendering
- Reports are converted to `[lat, lng, weight]` tuples
- `weight = intensity / 5` (so intensity 1 = 0.2, intensity 5 = 1.0)
- Leaflet.heat renders with custom gradient (blue → yellow → orange → red)
- `minOpacity: 0.5` ensures even single reports are visible

### Season Detection
- **DORMANT** (Aug–Apr): "All clear. Winnipeg is worm-free. For now."
- **WATCH** (May 1–14): "Season's open. Stay sharp – they could show up any day."
- **ACTIVE** (May 15–Jul 31): "Worms are out there. Check the map before you head out."

Dates are hardcoded in `frontend/src/composables/useSeasonStatus.js`. Adjust if needed.

### Neighbourhood Inference
When you click the map, `getNearestNeighbourhood(lat, lng)` finds the closest neighbourhood centre using squared Euclidean distance. No geocoding API needed — it's just math against a static list of 19 Winnipeg neighbourhoods.

---

## Rate Limiting

The backend enforces **5 reports per IP per hour** using an in-memory sliding window. Old entries are pruned on each request, so the memory footprint stays small even under heavy load.

**Implementation:** `backend/src/middleware/rateLimiter.js`

**How it works:**
- Each IP gets an array of timestamps
- On each POST, timestamps older than 1 hour are discarded
- If the array has 5+ entries, return 429
- Otherwise, add the current timestamp and proceed

**No Redis required.** The rate limiter resets if the server restarts, but that's fine for this use case.

**To test:**
1. Submit 5 reports in quick succession → all succeed
2. Submit a 6th → get 429 error
3. Wait 1 hour (or restart the server) → works again

**To adjust limits:** Edit `WINDOW_MS` and `MAX_REPORTS` in `rateLimiter.js`.

---

## Contributing

Issues and PRs welcome! A few guidelines:

- **Keep it simple.** This is intentionally lightweight — no state management libraries, no heavy frameworks.
- **No user accounts.** Reports are anonymous and ephemeral (7 days max).
- **Winnipeg-only.** The bounding box is hardcoded. If you want to fork for another city, search for `WINNIPEG_BOUNDS` and swap the coordinates.

**Found a bug?** Click the "Report a bug, not worms 🐛" link in the bottom-right corner of the map.

---

## License

MIT — do whatever you want with it. Built as a learning project and a public service.

---

## Credits

- **Leaflet.js** for the map
- **Leaflet.heat** for the heatmap overlay
- **Neon** for serverless Postgres
- **Render** for free hosting
- The people of Winnipeg for dealing with these worms every spring

---

## FAQ

**Q: Why 7 days?**
A: Cankerworm infestations change quickly. Week-old data is stale and misleading.

**Q: Can I delete my report?**
A: No. Reports are anonymous and auto-expire. If you submitted bad data, use the admin nuke endpoint or wait 7 days.

**Q: What if someone spams fake reports?**
A: Rate limiting (5/hour/IP) stops casual abuse. For targeted attacks, use the admin endpoint to nuke recent reports from a specific area.

**Q: Why not use the browser's built-in geolocation for everything?**
A: It's great when it works, but:
- Some users deny location permissions
- GPS is slow and inaccurate indoors
- Neighbourhood dropdown is faster for "I saw worms near River Heights but I'm at home now"

**Q: Can I see historical data?**
A: Not in the UI. The database keeps old records (no auto-deletion), but the frontend only fetches non-expired reports. You could add a "Last Season's Report" archive page if you want.

**Q: Why no user accounts?**
A: Simplicity. Accounts add auth, sessions, password resets, GDPR compliance, etc. Anonymous ephemeral reports are faster to build and easier to moderate.

**Q: Can I fork this for my city?**
A: Yes! Update `WINNIPEG_BOUNDS` in the backend and frontend, swap the neighbourhood list in `frontend/src/utils/neighbourhoods.js`, and adjust the season dates in `useSeasonStatus.js`.

---

**Built with ☕ and mild disgust for cankerworms.**
