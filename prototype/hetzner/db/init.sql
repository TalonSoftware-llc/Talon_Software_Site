-- Throwaway schema for the Hetzner/Postgres pathway prototype.
-- Sample companies only. team_lead is reserved and has no product surface.

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TYPE portal_role AS ENUM ('essentials', 'pro', 'team_lead');

COMMENT ON TYPE portal_role IS
  'team_lead is a future add-on. This prototype stores the value and does not build team-lead views. A team_lead session is rejected.';

CREATE TABLE tenants (
  id uuid PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  name text NOT NULL
);

CREATE TABLE users (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  email text NOT NULL,
  display_name text NOT NULL,
  role portal_role NOT NULL,
  UNIQUE (tenant_id, email)
);

CREATE TABLE tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  requester_id uuid NOT NULL REFERENCES users(id),
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 8000),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  priority text NOT NULL CHECK (priority IN ('normal', 'urgent', 'dev_already_due')),
  sla_due_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON COLUMN tickets.priority IS
  'dev_already_due exists only so the prototype can show a breached SLA without waiting. The API rejects it unless PROTOTYPE_DEV=1.';

CREATE INDEX tickets_tenant_requester ON tickets (tenant_id, requester_id);

CREATE FUNCTION tickets_keep_sla() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  NEW.sla_due_at = OLD.sla_due_at;
  NEW.tenant_id = OLD.tenant_id;
  NEW.requester_id = OLD.requester_id;
  RETURN NEW;
END $$;

CREATE TRIGGER tickets_keep_sla
  BEFORE UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION tickets_keep_sla();

-- security_invoker so row level security on tickets still applies.
CREATE VIEW tickets_with_sla WITH (security_invoker = true) AS
SELECT
  t.id,
  t.tenant_id,
  t.requester_id,
  t.title,
  t.body,
  t.status,
  t.priority,
  t.sla_due_at,
  t.created_at,
  t.updated_at,
  CASE
    WHEN t.status = 'resolved' AND t.updated_at <= t.sla_due_at THEN 'met'
    WHEN t.status = 'resolved' AND t.updated_at > t.sla_due_at THEN 'met_late'
    WHEN now() > t.sla_due_at THEN 'breached'
    WHEN now() > t.sla_due_at - interval '15 minutes' THEN 'due_soon'
    ELSE 'within_sla'
  END AS sla_state
FROM tickets t;

CREATE TABLE bot_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  scopes text[] NOT NULL,
  token_hash text NOT NULL UNIQUE,
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz
);

CREATE TABLE bot_token_uses (
  id bigserial PRIMARY KEY,
  token_id uuid NOT NULL REFERENCES bot_tokens(id),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  action text NOT NULL,
  at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE stored_files (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  filename text NOT NULL,
  byte_size integer NOT NULL CHECK (byte_size >= 0 AND byte_size <= 100000),
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Present so the pgvector image is actually used. No embeddings are written.
CREATE TABLE kb_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  body text NOT NULL,
  embedding vector(8)
);

INSERT INTO tenants (id, slug, name) VALUES
  ('11111111-1111-4111-8111-111111111111', 'cedar', 'Cedar Sample Co'),
  ('22222222-2222-4222-8222-222222222222', 'harbor', 'Harbor Sample Co');

INSERT INTO users (id, tenant_id, email, display_name, role) VALUES
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', '11111111-1111-4111-8111-111111111111', 'ada.essentials@cedar.example', 'Ada Sample', 'essentials'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', '11111111-1111-4111-8111-111111111111', 'drew.essentials@cedar.example', 'Drew Sample', 'essentials'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3', '11111111-1111-4111-8111-111111111111', 'blake.pro@cedar.example', 'Blake Sample', 'pro'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4', '11111111-1111-4111-8111-111111111111', 'robin.lead@cedar.example', 'Robin Sample', 'team_lead'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1', '22222222-2222-4222-8222-222222222222', 'casey.pro@harbor.example', 'Casey Sample', 'pro');

-- Lookups that happen before a tenant is known. Owner bypasses row security.
CREATE FUNCTION resolve_user(p_id uuid)
RETURNS TABLE (id uuid, tenant_id uuid, email text, role portal_role, tenant_slug text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id, u.tenant_id, u.email, u.role, t.slug
  FROM users u
  JOIN tenants t ON t.id = u.tenant_id
  WHERE u.id = p_id;
$$;

CREATE FUNCTION resolve_bot_token(p_hash text)
RETURNS TABLE (id uuid, tenant_id uuid, scopes text[], revoked_at timestamptz, created_by uuid)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, tenant_id, scopes, revoked_at, created_by
  FROM bot_tokens
  WHERE token_hash = p_hash;
$$;

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets FORCE ROW LEVEL SECURITY;
ALTER TABLE bot_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_tokens FORCE ROW LEVEL SECURITY;
ALTER TABLE bot_token_uses ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_token_uses FORCE ROW LEVEL SECURITY;
ALTER TABLE stored_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE stored_files FORCE ROW LEVEL SECURITY;
ALTER TABLE kb_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_chunks FORCE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;

CREATE FUNCTION app_tenant() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT current_setting('app.tenant_id', true)::uuid
$$;

CREATE FUNCTION app_role() RETURNS text
LANGUAGE sql STABLE AS $$
  SELECT current_setting('app.role', true)
$$;

CREATE FUNCTION app_user() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT current_setting('app.user_id', true)::uuid
$$;

-- Pro and bot tokens see the tenant. Essentials see their own rows.
-- team_lead matches neither branch, so a missed API check still returns nothing.
CREATE POLICY tickets_isolation ON tickets
  USING (
    tenant_id = app_tenant()
    AND (
      app_role() IN ('pro', 'bot')
      OR (app_role() = 'essentials' AND requester_id = app_user())
    )
  )
  WITH CHECK (
    tenant_id = app_tenant()
    AND (
      app_role() IN ('pro', 'bot')
      OR (app_role() = 'essentials' AND requester_id = app_user())
    )
  );

CREATE POLICY files_isolation ON stored_files
  USING (tenant_id = app_tenant() AND app_role() IN ('pro', 'bot', 'essentials'))
  WITH CHECK (tenant_id = app_tenant() AND app_role() IN ('pro', 'bot', 'essentials'));

CREATE POLICY bot_tokens_isolation ON bot_tokens
  USING (tenant_id = app_tenant() AND app_role() = 'pro')
  WITH CHECK (tenant_id = app_tenant() AND app_role() = 'pro');

CREATE POLICY bot_uses_isolation ON bot_token_uses
  USING (tenant_id = app_tenant())
  WITH CHECK (tenant_id = app_tenant() AND app_role() IN ('pro', 'bot', 'essentials'));

CREATE POLICY users_read_own_tenant ON users
  USING (tenant_id = app_tenant());

CREATE POLICY kb_isolation ON kb_chunks
  USING (tenant_id = app_tenant())
  WITH CHECK (tenant_id = app_tenant());

CREATE ROLE talon_app LOGIN PASSWORD 'talon_app_dev_only';
GRANT CONNECT ON DATABASE talon_prototype TO talon_app;
GRANT USAGE ON SCHEMA public TO talon_app;
GRANT SELECT ON tenants, users, tickets, tickets_with_sla, bot_tokens, bot_token_uses, stored_files, kb_chunks TO talon_app;
GRANT INSERT, UPDATE ON tickets, bot_tokens, stored_files TO talon_app;
GRANT INSERT ON bot_token_uses TO talon_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO talon_app;
GRANT EXECUTE ON FUNCTION resolve_user(uuid), resolve_bot_token(text) TO talon_app;

REVOKE ALL ON FUNCTION resolve_user(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION resolve_bot_token(text) FROM PUBLIC;
