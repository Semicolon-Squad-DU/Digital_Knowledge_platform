-- DKP Database Schema
-- Version: 1.0

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE user_role AS ENUM (
  'guest', 'member', 'student_author', 'researcher',
  'archivist', 'librarian', 'admin'
);

CREATE TYPE membership_status AS ENUM ('active', 'inactive', 'suspended');

CREATE TYPE access_tier AS ENUM ('public', 'member', 'staff', 'restricted');

CREATE TYPE archive_status AS ENUM ('draft', 'review', 'published', 'archived');

CREATE TYPE project_status AS ENUM (
  'draft', 'pending_review', 'changes_requested', 'published', 'archived'
);

CREATE TYPE borrow_status AS ENUM ('active', 'returned', 'overdue', 'pending');

CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TYPE hold_status AS ENUM ('pending', 'available', 'fulfilled', 'cancelled');

CREATE TYPE fine_status AS ENUM ('pending', 'paid', 'waived');

CREATE TYPE notification_type AS ENUM (
  'due_date_reminder', 'overdue_alert', 'hold_available',
  'project_approved', 'project_changes_requested',
  'access_request_approved', 'access_request_denied',
  'announcement', 'new_upload', 'system'
);

CREATE TYPE audit_action AS ENUM (
  'CREATE', 'UPDATE', 'DELETE', 'ACCESS', 'LOGIN', 'LOGOUT', 'DOWNLOAD', 'STATUS_CHANGE'
);

CREATE TYPE access_request_status AS ENUM ('pending', 'approved', 'denied');

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
  user_id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(255) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255),
  role          user_role NOT NULL DEFAULT 'member',
  department    VARCHAR(255),
  bio           TEXT,
  avatar_url    TEXT,
  membership_status membership_status NOT NULL DEFAULT 'active',
  oauth_provider VARCHAR(50),
  oauth_id       VARCHAR(255),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ============================================================
-- TAGS
-- ============================================================
CREATE TABLE tags (
  tag_id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_en  VARCHAR(100) NOT NULL UNIQUE,
  name_bn  VARCHAR(200)
);

-- ============================================================
-- ARCHIVE ITEMS
-- ============================================================
CREATE TABLE archive_items (
  item_id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title_en     VARCHAR(500) NOT NULL,
  title_bn     VARCHAR(500),
  description  TEXT,
  authors      TEXT[] NOT NULL DEFAULT '{}',
  category     VARCHAR(100) NOT NULL,
  language     VARCHAR(50) NOT NULL DEFAULT 'en',
  access_tier  access_tier NOT NULL DEFAULT 'public',
  status       archive_status NOT NULL DEFAULT 'draft',
  file_url     TEXT NOT NULL,
  file_type    VARCHAR(100) NOT NULL,
  file_size    BIGINT NOT NULL CHECK (file_size > 0 AND file_size <= 524288000),
  version      INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  uploaded_by  UUID NOT NULL REFERENCES users(user_id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_archive_status ON archive_items(status);
CREATE INDEX idx_archive_access_tier ON archive_items(access_tier);
CREATE INDEX idx_archive_uploaded_by ON archive_items(uploaded_by);
CREATE INDEX idx_archive_title_en_trgm ON archive_items USING gin(title_en gin_trgm_ops);

-- Archive item tags (M:N)
CREATE TABLE archive_item_tags (
  item_id UUID NOT NULL REFERENCES archive_items(item_id) ON DELETE CASCADE,
  tag_id  UUID NOT NULL REFERENCES tags(tag_id) ON DELETE CASCADE,
  PRIMARY KEY (item_id, tag_id)
);

-- Archive versions
CREATE TABLE archive_versions (
  version_id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id           UUID NOT NULL REFERENCES archive_items(item_id) ON DELETE CASCADE,
  version_number    INTEGER NOT NULL CHECK (version_number >= 1),
  file_url          TEXT NOT NULL,
  metadata_snapshot JSONB NOT NULL DEFAULT '{}',
  changed_by        UUID NOT NULL REFERENCES users(user_id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (item_id, version_number)
);

-- Access requests for restricted items
CREATE TABLE access_requests (
  request_id  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(user_id),
  item_id     UUID NOT NULL REFERENCES archive_items(item_id),
  reason      TEXT NOT NULL,
  status      access_request_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES users(user_id),
  reviewed_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- RESEARCH REPOSITORY
-- ============================================================
CREATE TABLE labs (
  lab_id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name              VARCHAR(255) NOT NULL UNIQUE,
  description       TEXT,
  head_researcher_id UUID NOT NULL REFERENCES users(user_id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE lab_members (
  lab_id    UUID NOT NULL REFERENCES labs(lab_id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  role      VARCHAR(100) NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (lab_id, user_id)
);

CREATE TABLE research_outputs (
  output_id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title          VARCHAR(500) NOT NULL,
  abstract       TEXT,
  authors        JSONB NOT NULL DEFAULT '[]',
  keywords       TEXT[] NOT NULL DEFAULT '{}',
  doi            VARCHAR(255),
  dkp_identifier VARCHAR(100) NOT NULL UNIQUE,
  file_url       TEXT,
  output_type    VARCHAR(50) NOT NULL DEFAULT 'journal_article',
  lab_id         UUID REFERENCES labs(lab_id),
  published_date DATE,
  journal_name   VARCHAR(255),
  volume         VARCHAR(50),
  issue          VARCHAR(50),
  pages          VARCHAR(50),
  uploaded_by    UUID NOT NULL REFERENCES users(user_id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_research_uploaded_by ON research_outputs(uploaded_by);
CREATE INDEX idx_research_lab_id ON research_outputs(lab_id);

-- ============================================================
-- STUDENT PROJECT SHOWCASE
-- ============================================================
CREATE TABLE student_projects (
  project_id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title            VARCHAR(500) NOT NULL,
  abstract         TEXT NOT NULL,
  team_members     JSONB NOT NULL DEFAULT '[]',
  advisor_id       UUID NOT NULL REFERENCES users(user_id),
  semester         VARCHAR(100) NOT NULL,
  department       VARCHAR(255) NOT NULL,
  technologies     TEXT[] NOT NULL DEFAULT '{}',
  report_url       TEXT,
  video_url        TEXT,
  source_code_url  TEXT,
  thumbnail_url    TEXT,
  status           project_status NOT NULL DEFAULT 'draft',
  advisor_comments TEXT,
  submitted_by     UUID NOT NULL REFERENCES users(user_id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_projects_status ON student_projects(status);
CREATE INDEX idx_projects_advisor ON student_projects(advisor_id);
CREATE INDEX idx_projects_department ON student_projects(department);

-- ============================================================
-- LIBRARY CATALOG
-- ============================================================
CREATE TABLE catalog_items (
  catalog_id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title            VARCHAR(500) NOT NULL,
  isbn             VARCHAR(17) UNIQUE,
  authors          TEXT[] NOT NULL DEFAULT '{}',
  publisher        VARCHAR(255),
  edition          VARCHAR(50),
  year             INTEGER,
  category         VARCHAR(100) NOT NULL,
  total_copies     INTEGER NOT NULL CHECK (total_copies >= 1),
  available_copies INTEGER NOT NULL CHECK (available_copies >= 0),
  borrowed_copies  INTEGER NOT NULL DEFAULT 0 CHECK (borrowed_copies >= 0),
  reservation_count INTEGER NOT NULL DEFAULT 0 CHECK (reservation_count >= 0),
  availability_status VARCHAR(50) DEFAULT 'available',
  shelf_location   VARCHAR(100),
  barcode          VARCHAR(50) UNIQUE,
  cover_url        TEXT,
  description      TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ,
  CONSTRAINT copies_check CHECK (available_copies <= total_copies)
);

CREATE INDEX idx_catalog_title_trgm ON catalog_items USING gin(title gin_trgm_ops);
CREATE INDEX idx_catalog_category ON catalog_items(category);
CREATE INDEX idx_catalog_deleted ON catalog_items(deleted_at) WHERE deleted_at IS NULL;

-- Borrows
CREATE TABLE borrows (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(user_id),
  resource_id     UUID NOT NULL REFERENCES catalog_items(catalog_id),
  borrow_date     DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date        DATE NOT NULL,
  return_date     DATE,
  borrow_status   borrow_status NOT NULL DEFAULT 'pending',
  approval_status approval_status NOT NULL DEFAULT 'pending',
  fine_amount     DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (fine_amount >= 0),
  renewal_count   INTEGER NOT NULL DEFAULT 0 CHECK (renewal_count >= 0),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_borrows_unique_active ON borrows(user_id, resource_id) WHERE borrow_status IN ('active', 'pending');

CREATE INDEX idx_borrows_user ON borrows(user_id);
CREATE INDEX idx_borrows_resource ON borrows(resource_id);
CREATE INDEX idx_borrows_status ON borrows(borrow_status);
CREATE INDEX idx_borrows_due_date ON borrows(due_date);

-- Hold requests
CREATE TABLE hold_requests (
  hold_id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  catalog_id   UUID NOT NULL REFERENCES catalog_items(catalog_id),
  member_id    UUID NOT NULL REFERENCES users(user_id),
  request_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status       hold_status NOT NULL DEFAULT 'pending',
  UNIQUE (catalog_id, member_id, status)
);

CREATE INDEX idx_holds_catalog ON hold_requests(catalog_id);
CREATE INDEX idx_holds_member ON hold_requests(member_id);

-- Wishlist
CREATE TABLE wishlists (
  wishlist_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id   UUID NOT NULL REFERENCES users(user_id),
  catalog_id  UUID NOT NULL REFERENCES catalog_items(catalog_id),
  added_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (member_id, catalog_id)
);

-- Fines
CREATE TABLE fines (
  fine_id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id      UUID NOT NULL REFERENCES users(user_id),
  borrow_id      UUID NOT NULL REFERENCES borrows(id),
  amount         DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  reason         TEXT NOT NULL,
  status         fine_status NOT NULL DEFAULT 'pending',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (borrow_id)
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
  notification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  type            notification_type NOT NULL,
  title           VARCHAR(255) NOT NULL,
  message         TEXT NOT NULL,
  read            BOOLEAN NOT NULL DEFAULT FALSE,
  action_url      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, read) WHERE read = FALSE;

-- Announcements
CREATE TABLE announcements (
  announcement_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_by      UUID NOT NULL REFERENCES users(user_id),
  title           VARCHAR(255) NOT NULL,
  body            TEXT NOT NULL,
  target_role     user_role,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- AUDIT LOG (append-only)
-- ============================================================
CREATE TABLE audit_logs (
  log_id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(user_id),
  action      audit_action NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id   UUID,
  details     JSONB NOT NULL DEFAULT '{}',
  ip_address  INET,
  timestamp   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp);

-- Prevent UPDATE/DELETE on audit_logs
CREATE RULE no_update_audit AS ON UPDATE TO audit_logs DO INSTEAD NOTHING;
CREATE RULE no_delete_audit AS ON DELETE TO audit_logs DO INSTEAD NOTHING;

-- ============================================================
-- REFRESH TOKENS
-- ============================================================
CREATE TABLE refresh_tokens (
  token_id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_archive_updated_at BEFORE UPDATE ON archive_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_catalog_updated_at BEFORE UPDATE ON catalog_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_borrows_updated_at BEFORE UPDATE ON borrows FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_fines_updated_at BEFORE UPDATE ON fines FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_research_updated_at BEFORE UPDATE ON research_outputs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_projects_updated_at BEFORE UPDATE ON student_projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
