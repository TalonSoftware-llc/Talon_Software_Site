// Postgres schema for the throwaway Vercel pathway prototype.
// Ticket and portal rows are forced under row level security.
// The user directory is not: Neon roles cannot be BYPASSRLS, and login has to
// look up one verified IdP subject before the tenant role is applied.
// That lookup is equality on oidc_sub inside findUserBySub, not a list API.

export const SCHEMA_SQL = `
CREATE TABLE tenants (
  id text PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  display_name text NOT NULL,
  idp text NOT NULL CHECK (idp IN ('dev', 'entra', 'google')),
  oidc_issuer text,
  CHECK (
    (idp = 'dev' AND oidc_issuer IS NULL)
    OR (idp IN ('entra', 'google') AND oidc_issuer IS NOT NULL)
  )
);

CREATE TABLE users (
  id text PRIMARY KEY,
  tenant_id text NOT NULL REFERENCES tenants (id),
  email text NOT NULL,
  display_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('essentials', 'pro', 'team_lead')),
  oidc_sub text NOT NULL,
  UNIQUE (tenant_id, email),
  UNIQUE (tenant_id, oidc_sub)
);

CREATE TABLE tickets (
  id text PRIMARY KEY,
  tenant_id text NOT NULL REFERENCES tenants (id),
  requester_id text NOT NULL REFERENCES users (id),
  title text NOT NULL,
  body text NOT NULL,
  status text NOT NULL CHECK (status IN ('open', 'in_progress', 'waiting', 'resolved')),
  priority text NOT NULL CHECK (priority IN ('p1', 'p2', 'p3')),
  sla_due_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE INDEX tickets_tenant_requester ON tickets (tenant_id, requester_id);

CREATE TABLE tenant_portal (
  tenant_id text PRIMARY KEY REFERENCES tenants (id),
  summary text NOT NULL
);

-- team_lead is reserved. No team tables and no team-lead policies.
-- Until that add-on exists, a team_lead is fail-closed to their own tickets.

CREATE ROLE prototype_app NOLOGIN;
GRANT USAGE ON SCHEMA public TO prototype_app;
GRANT SELECT, INSERT, UPDATE ON tickets TO prototype_app;
GRANT SELECT ON tenant_portal TO prototype_app;
GRANT prototype_app TO CURRENT_USER;

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets FORCE ROW LEVEL SECURITY;
ALTER TABLE tenant_portal ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_portal FORCE ROW LEVEL SECURITY;

CREATE POLICY tickets_select ON tickets
  FOR SELECT
  USING (
    tenant_id = current_setting('app.tenant_id', true)
    AND (
      current_setting('app.role', true) = 'pro'
      OR requester_id = current_setting('app.user_id', true)
    )
  );

CREATE POLICY tickets_insert ON tickets
  FOR INSERT
  WITH CHECK (
    tenant_id = current_setting('app.tenant_id', true)
    AND requester_id = current_setting('app.user_id', true)
  );

CREATE POLICY tickets_update ON tickets
  FOR UPDATE
  USING (
    tenant_id = current_setting('app.tenant_id', true)
    AND (
      current_setting('app.role', true) = 'pro'
      OR requester_id = current_setting('app.user_id', true)
    )
  )
  WITH CHECK (
    tenant_id = current_setting('app.tenant_id', true)
  );

CREATE POLICY portal_select ON tenant_portal
  FOR SELECT
  USING (
    tenant_id = current_setting('app.tenant_id', true)
    AND current_setting('app.role', true) = 'pro'
  );
`;
