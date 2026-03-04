CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  push_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  sender_id TEXT REFERENCES users(id),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS nudges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  sandbox BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  payload JSONB,
  scheduled_at TIMESTAMPTZ,
  triggered BOOLEAN DEFAULT FALSE,
  sandbox BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS game_state (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  state JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed the two fixed users if not present
INSERT INTO users (id) VALUES ('admin'), ('user') ON CONFLICT DO NOTHING;
INSERT INTO game_state (user_id, state) VALUES ('user', '{}') ON CONFLICT DO NOTHING;
