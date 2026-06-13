-- ============================================================
-- Lead Management System — Initial Schema Migration
-- ============================================================

-- Extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE user_role AS ENUM ('admin', 'manager', 'agent');

CREATE TYPE lead_status AS ENUM (
  'new',
  'contacted',
  'qualified',
  'proposal',
  'negotiation',
  'won',
  'lost'
);

CREATE TYPE lead_source AS ENUM (
  'website',
  'referral',
  'cold_call',
  'email',
  'social_media',
  'event',
  'other'
);

CREATE TYPE activity_action AS ENUM (
  'lead_created',
  'lead_updated',
  'lead_assigned',
  'status_changed',
  'lead_deleted',
  'user_login',
  'user_registered'
);

-- ============================================================
-- USERS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          user_role    NOT NULL DEFAULT 'agent',
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email  ON users(email);
CREATE INDEX idx_users_role   ON users(role);

-- ============================================================
-- LEADS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS leads (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name         VARCHAR(100) NOT NULL,
  email        VARCHAR(255),
  phone        VARCHAR(30),
  source       lead_source  NOT NULL DEFAULT 'other',
  status       lead_status  NOT NULL DEFAULT 'new',
  assigned_to  UUID         REFERENCES users(id) ON DELETE SET NULL,
  created_by   UUID         NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  notes        TEXT,
  enriched     BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_leads_status      ON leads(status);
CREATE INDEX idx_leads_source      ON leads(source);
CREATE INDEX idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX idx_leads_created_by  ON leads(created_by);
CREATE INDEX idx_leads_created_at  ON leads(created_at DESC);

-- Full-text search index over name + email
CREATE INDEX idx_leads_search ON leads USING gin(
  to_tsvector('english', coalesce(name, '') || ' ' || coalesce(email, ''))
);

-- ============================================================
-- ACTIVITY LOGS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS activity_logs (
  id          UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  action      activity_action NOT NULL,
  entity_type VARCHAR(50)    NOT NULL,          -- 'lead' | 'user'
  entity_id   UUID,
  actor_id    UUID           REFERENCES users(id) ON DELETE SET NULL,
  meta        JSONB,                             -- extra context
  created_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_logs_entity    ON activity_logs(entity_type, entity_id);
CREATE INDEX idx_logs_actor     ON activity_logs(actor_id);
CREATE INDEX idx_logs_created   ON activity_logs(created_at DESC);

-- ============================================================
-- ROUND-ROBIN ASSIGNMENT TRACKER
-- ============================================================

CREATE TABLE IF NOT EXISTS assignment_state (
  id              SERIAL PRIMARY KEY,
  last_agent_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed one row
INSERT INTO assignment_state (last_agent_id) VALUES (NULL);

-- ============================================================
-- updated_at trigger helper
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();