-- Throwaway schema for the hybrid prototype.
-- The data-plane role is hybrid_app. It is not a superuser and cannot bypass RLS.
-- Tenant and role are chosen only by enter_principal(issuer, subject).

CREATE ROLE hybrid_owner NOLOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;
CREATE ROLE hybrid_app LOGIN PASSWORD 'dev-only-hybrid-app'
  NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;
GRANT hybrid_owner TO postgres;

ALTER ROLE hybrid_app SET statement_timeout = '5s';
ALTER ROLE hybrid_app SET search_path = public;

REVOKE CONNECT ON DATABASE hybrid FROM PUBLIC;
GRANT CONNECT ON DATABASE hybrid TO hybrid_app;
GRANT USAGE ON SCHEMA public TO hybrid_app;
ALTER SCHEMA public OWNER TO hybrid_owner;

SET ROLE hybrid_owner;

CREATE TABLE tenants (
  id uuid PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  name text NOT NULL
);

-- team_lead is designed here and intentionally not implemented.
-- A future team lead would see tickets requested by people on their team,
-- inside the same company. There is no team table and no team-lead view.
CREATE TABLE roles (
  name text PRIMARY KEY,
  scope text NOT NULL,
  implemented boolean NOT NULL,
  notes text NOT NULL
);

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  oidc_iss text NOT NULL,
  oidc_sub text NOT NULL,
  email text UNIQUE NOT NULL,
  display_name text NOT NULL,
  UNIQUE (oidc_iss, oidc_sub)
);

CREATE TABLE memberships (
  user_id uuid PRIMARY KEY REFERENCES users (id),
  tenant_id uuid NOT NULL REFERENCES tenants (id),
  role text NOT NULL REFERENCES roles (name)
);

CREATE TABLE sla_policies (
  priority text PRIMARY KEY,
  respond_minutes integer NOT NULL CHECK (respond_minutes > 0),
  resolve_minutes integer NOT NULL CHECK (resolve_minutes >= respond_minutes)
);

CREATE TABLE tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants (id),
  requester_id uuid NOT NULL REFERENCES users (id),
  subject text NOT NULL CHECK (char_length(subject) BETWEEN 1 AND 200),
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 4000),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting', 'resolved')),
  priority text NOT NULL REFERENCES sla_policies (priority),
  respond_due_at timestamptz NOT NULL,
  resolve_due_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (resolve_due_at >= respond_due_at)
);

CREATE INDEX tickets_tenant_updated ON tickets (tenant_id, updated_at DESC);
CREATE INDEX tickets_requester ON tickets (tenant_id, requester_id);

INSERT INTO roles (name, scope, implemented, notes) VALUES
  ('essentials', 'own_tickets', true, 'Sees and updates only tickets they requested.'),
  ('pro', 'tenant_tickets', true, 'Sees and updates every ticket in their company.'),
  ('team_lead', 'team_tickets', false, 'Future add-on. Not implemented: no team table, no view, and ticket_visible does not grant this role any rows.');

INSERT INTO sla_policies (priority, respond_minutes, resolve_minutes) VALUES
  ('urgent', 15, 240),
  ('high', 60, 480),
  ('normal', 240, 1440),
  ('low', 480, 4320);

-- Placeholder minutes for the prototype, not a published customer SLA.

INSERT INTO tenants (id, slug, name) VALUES
  ('11111111-1111-4111-8111-111111111111', 'harbor', 'Harbor Sample'),
  ('22222222-2222-4222-8222-222222222222', 'pine', 'Pine Sample');

-- Subjects match oidc/users.mjs. The IdP does not store tenant or role.
INSERT INTO users (id, oidc_iss, oidc_sub, email, display_name) VALUES
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'http://127.0.0.1:4180', 'sample|ada', 'ada@harbor.example', 'Ada Sample'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2', 'http://127.0.0.1:4180', 'sample|ben', 'ben@harbor.example', 'Ben Sample'),
  ('cccccccc-cccc-4ccc-8ccc-ccccccccccc3', 'http://127.0.0.1:4180', 'sample|cara', 'cara@pine.example', 'Cara Sample');

INSERT INTO memberships (user_id, tenant_id, role) VALUES
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', '11111111-1111-4111-8111-111111111111', 'essentials'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2', '11111111-1111-4111-8111-111111111111', 'pro'),
  ('cccccccc-cccc-4ccc-8ccc-ccccccccccc3', '22222222-2222-4222-8222-222222222222', 'pro');

CREATE FUNCTION sla_status(
  p_status text,
  p_respond_due timestamptz,
  p_resolve_due timestamptz,
  p_as_of timestamptz
) RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_status = 'resolved' THEN 'met'
    WHEN p_as_of > p_resolve_due THEN 'resolve_breached'
    WHEN p_as_of > p_respond_due AND p_status = 'open' THEN 'response_breached'
    ELSE 'within_sla'
  END;
$$;

-- True only for the company and role entered for this transaction.
-- team_lead matches neither branch, so it sees nothing until a future policy is added.
CREATE FUNCTION ticket_visible(p_tenant uuid, p_requester uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT p_tenant = NULLIF(current_setting('app.tenant_id', true), '')::uuid
     AND (
       current_setting('app.role', true) = 'pro'
       OR (
         current_setting('app.role', true) = 'essentials'
         AND p_requester = NULLIF(current_setting('app.user_id', true), '')::uuid
       )
     );
$$;

CREATE FUNCTION enter_principal(p_iss text, p_sub text)
RETURNS TABLE (
  user_id uuid,
  tenant_id uuid,
  tenant_slug text,
  tenant_name text,
  role text,
  email text,
  display_name text
)
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
BEGIN
  SELECT u.id AS user_id,
         t.id AS tenant_id,
         t.slug AS tenant_slug,
         t.name AS tenant_name,
         m.role,
         u.email,
         u.display_name
    INTO r
  FROM users u
  JOIN memberships m ON m.user_id = u.id
  JOIN tenants t ON t.id = m.tenant_id
  JOIN roles ro ON ro.name = m.role AND ro.implemented
  WHERE u.oidc_iss = p_iss
    AND u.oidc_sub = p_sub;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  PERFORM set_config('app.tenant_id', r.tenant_id::text, true);
  PERFORM set_config('app.user_id', r.user_id::text, true);
  PERFORM set_config('app.role', r.role, true);

  user_id := r.user_id;
  tenant_id := r.tenant_id;
  tenant_slug := r.tenant_slug;
  tenant_name := r.tenant_name;
  role := r.role;
  email := r.email;
  display_name := r.display_name;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION enter_principal(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION enter_principal(text, text) TO hybrid_app;
GRANT EXECUTE ON FUNCTION sla_status(text, timestamptz, timestamptz, timestamptz) TO hybrid_app;
GRANT EXECUTE ON FUNCTION ticket_visible(uuid, uuid) TO hybrid_app;

CREATE FUNCTION set_ticket_sla() RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  respond_mins integer;
  resolve_mins integer;
BEGIN
  SELECT respond_minutes, resolve_minutes
    INTO respond_mins, resolve_mins
  FROM sla_policies
  WHERE priority = NEW.priority;

  IF respond_mins IS NULL THEN
    RAISE EXCEPTION 'unknown priority';
  END IF;

  NEW.respond_due_at := NEW.created_at + make_interval(mins => respond_mins);
  NEW.resolve_due_at := NEW.created_at + make_interval(mins => resolve_mins);
  NEW.updated_at := NEW.created_at;
  RETURN NEW;
END;
$$;

CREATE FUNCTION lock_ticket_identity() RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.tenant_id := OLD.tenant_id;
  NEW.requester_id := OLD.requester_id;
  NEW.created_at := OLD.created_at;
  NEW.respond_due_at := OLD.respond_due_at;
  NEW.resolve_due_at := OLD.resolve_due_at;
  NEW.priority := OLD.priority;
  RETURN NEW;
END;
$$;

CREATE FUNCTION touch_updated_at() RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER tickets_sla
  BEFORE INSERT ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION set_ticket_sla();

CREATE TRIGGER tickets_lock
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION lock_ticket_identity();

CREATE TRIGGER tickets_touch
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION touch_updated_at();

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets FORCE ROW LEVEL SECURITY;

CREATE POLICY tickets_isolation ON tickets
  USING (ticket_visible(tenant_id, requester_id))
  WITH CHECK (ticket_visible(tenant_id, requester_id));

COMMENT ON POLICY tickets_isolation ON tickets IS
  'Enforced for hybrid_app, including the table owner when FORCE RLS is on. Superusers still bypass RLS; the data plane is not a superuser.';

GRANT SELECT, INSERT, UPDATE ON tickets TO hybrid_app;
GRANT SELECT ON sla_policies TO hybrid_app;
GRANT SELECT ON roles TO hybrid_app;

-- No SELECT on users, memberships, or tenants for hybrid_app.
-- Those are read only inside enter_principal, which is SECURITY DEFINER.

RESET ROLE;
