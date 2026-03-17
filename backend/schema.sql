CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at INTEGER NOT NULL,
  
  -- Subscription State
  google_play_token TEXT,
  subscription_status TEXT DEFAULT 'free', -- 'free', 'pro', 'canceled'
  
  -- Profile State
  medication_name TEXT DEFAULT 'Zepbound',
  dose TEXT DEFAULT '5mg',
  injection_day INTEGER DEFAULT 1,
  start_weight REAL,
  weight_unit TEXT DEFAULT 'lbs',
  protein_goal INTEGER DEFAULT 100,
  water_goal INTEGER DEFAULT 8
);
