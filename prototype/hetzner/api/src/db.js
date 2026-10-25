import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
});

const NIL_USER = "00000000-0000-0000-0000-000000000000";

export async function ping() {
  const result = await pool.query("SELECT 1 AS ok");
  return result.rows[0].ok === 1;
}

export async function resolveUser(id) {
  const result = await pool.query(
    "SELECT id, tenant_id, email, role, tenant_slug FROM resolve_user($1::uuid)",
    [id],
  );
  return result.rows[0] ?? null;
}

export async function resolveBotToken(hash) {
  const result = await pool.query(
    "SELECT id, tenant_id, scopes, revoked_at, created_by FROM resolve_bot_token($1)",
    [hash],
  );
  return result.rows[0] ?? null;
}

export async function withTenant(session, fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [session.tenantId]);
    await client.query("SELECT set_config('app.user_id', $1, true)", [session.userId || NIL_USER]);
    await client.query("SELECT set_config('app.role', $1, true)", [session.role]);
    const value = await fn(client);
    await client.query("COMMIT");
    return value;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // The connection is discarded below.
    }
    throw error;
  } finally {
    client.release();
  }
}
