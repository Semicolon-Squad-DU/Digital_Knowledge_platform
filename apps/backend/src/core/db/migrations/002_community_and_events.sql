-- Threaded Comments
CREATE TABLE IF NOT EXISTS comments (
  comment_id  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  entity_type VARCHAR(50) NOT NULL, -- 'archive', 'research', 'project'
  entity_id   UUID NOT NULL,
  parent_id   UUID REFERENCES comments(comment_id) ON DELETE CASCADE, -- threaded replies
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_entity ON comments(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);

-- Reactions (Likes, Claps, etc.)
CREATE TABLE IF NOT EXISTS reactions (
  reaction_id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  entity_type   VARCHAR(50) NOT NULL,
  entity_id     UUID NOT NULL,
  reaction_type VARCHAR(50) NOT NULL, -- 'like', 'love', 'clap', 'insightful'
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, entity_type, entity_id, reaction_type)
);

CREATE INDEX IF NOT EXISTS idx_reactions_entity ON reactions(entity_type, entity_id);

-- Seminars & Events
CREATE TABLE IF NOT EXISTS events (
  event_id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title           VARCHAR(255) NOT NULL,
  description     TEXT NOT NULL,
  speaker         VARCHAR(255) NOT NULL,
  scheduled_at    TIMESTAMPTZ NOT NULL,
  location        VARCHAR(255) NOT NULL,
  total_seats     INTEGER NOT NULL CHECK (total_seats >= 0),
  available_seats INTEGER NOT NULL CHECK (available_seats >= 0),
  materials_url   TEXT, -- recording or slides key
  created_by      UUID NOT NULL REFERENCES users(user_id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Event RSVPs
CREATE TABLE IF NOT EXISTS event_rsvps (
  rsvp_id    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id   UUID NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_rsvps_event ON event_rsvps(event_id);
CREATE INDEX IF NOT EXISTS idx_rsvps_user ON event_rsvps(user_id);
