CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS saves (
  player_id TEXT PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  state_json TEXT NOT NULL,
  highest_night INTEGER NOT NULL DEFAULT 1 CHECK (highest_night BETWEEN 1 AND 99),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_saves_leaderboard ON saves(highest_night DESC, updated_at ASC);
