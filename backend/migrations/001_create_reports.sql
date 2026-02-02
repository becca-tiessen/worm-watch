CREATE TABLE reports (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  lat         NUMERIC(9,6) NOT NULL,                    -- latitude of sighting
  lng         NUMERIC(9,6) NOT NULL,                    -- longitude of sighting
  intensity   SMALLINT     NOT NULL DEFAULT 1,          -- 1 (a few) to 5 (massive swarm)
  notes       TEXT,                                     -- optional free-text note
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ  NOT NULL DEFAULT (now() + INTERVAL '14 days')
);

-- Index for fast spatial + time queries
CREATE INDEX idx_reports_location_time ON reports (lat, lng, created_at);
