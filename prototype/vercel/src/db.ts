import { Pool, neonConfig } from "@neondatabase/serverless";
import { PGlite } from "@electric-sql/pglite";

import { TENANTS, USERS } from "./fixtures";
import { SCHEMA_SQL } from "./schema";

export type Sql = {
  query<T = Record<string, unknown>>(text: string, params?: readonly unknown[]): Promise<T[]>;
};

export type Database = Sql & {
  driver: "pglite" | "neon";
  exec(text: string): Promise<void>;
  transaction<T>(fn: (tx: Sql) => Promise<T>): Promise<T>;
  close(): Promise<void>;
};

export function driverFor(databaseUrl: string | undefined): "pglite" | "neon" {
  if (!databaseUrl) return "pglite";
  let hostname = "";
  try {
    hostname = new URL(databaseUrl).hostname;
  } catch {
    throw new Error("PROTOTYPE_DATABASE_URL is not a valid Postgres URL");
  }
  if (hostname.endsWith(".neon.tech")) return "neon";
  throw new Error("This pathway accepts a Neon URL or local PGlite when the URL is unset");
}

export function sqlStatements(sql: string): string[] {
  return sql
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part.length > 0 && part.split("\n").some((line) => {
      const trimmed = line.trim();
      return trimmed.length > 0 && !trimmed.startsWith("--");
    }));
}

export async function createDatabase(options?: {
  databaseUrl?: string;
  dataDir?: string;
}): Promise<Database> {
  const databaseUrl = options?.databaseUrl ?? process.env.PROTOTYPE_DATABASE_URL;
  const driver = driverFor(databaseUrl);
  if (driver === "neon") return neonDatabase(databaseUrl!);
  const client = options?.dataDir ? new PGlite(options.dataDir) : new PGlite();
  await client.waitReady;
  return pgliteDatabase(client);
}

function pgliteDatabase(client: PGlite): Database {
  const query = async <T>(text: string, params?: readonly unknown[]) => {
    const result = await client.query<T>(text, params ? [...params] : []);
    return result.rows;
  };
  return {
    driver: "pglite",
    query,
    async exec(text: string) {
      await client.exec(text);
    },
    transaction: (fn) => client.transaction((tx) => fn({
      query: async <T>(text: string, params?: readonly unknown[]) => {
        const result = await tx.query<T>(text, params ? [...params] : []);
        return result.rows;
      },
    })),
    close: () => client.close(),
  };
}

function neonDatabase(databaseUrl: string): Database {
  if (typeof WebSocket !== "undefined") {
    neonConfig.webSocketConstructor = WebSocket;
  }
  const pool = new Pool({ connectionString: databaseUrl });
  const query = async <T>(text: string, params?: readonly unknown[]) => {
    const result = await pool.query(text, params ? [...params] : []);
    return result.rows as T[];
  };
  return {
    driver: "neon",
    query,
    async exec(text: string) {
      for (const statement of sqlStatements(text)) {
        await pool.query(statement);
      }
    },
    async transaction(fn) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const result = await fn({
          query: async <T>(text: string, params?: readonly unknown[]) => {
            const rows = await client.query(text, params ? [...params] : []);
            return rows.rows as T[];
          },
        });
        await client.query("COMMIT");
        return result;
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },
    close: () => pool.end(),
  };
}

export async function migrate(db: Database): Promise<void> {
  await db.query(`CREATE TABLE IF NOT EXISTS schema_migrations (id text PRIMARY KEY)`);
  const applied = await db.query<{ id: string }>(
    `SELECT id FROM schema_migrations WHERE id = $1`,
    ["001"],
  );
  if (applied.length > 0) return;
  await db.exec(SCHEMA_SQL);
  await db.query(`INSERT INTO schema_migrations (id) VALUES ($1)`, ["001"]);
}

export async function seed(db: Database): Promise<void> {
  for (const tenant of TENANTS) {
    await db.query(
      `INSERT INTO tenants (id, slug, display_name, idp, oidc_issuer)
       VALUES ($1, $2, $3, 'dev', NULL)
       ON CONFLICT (id) DO NOTHING`,
      [tenant.id, tenant.slug, tenant.displayName],
    );
    await db.query(
      `INSERT INTO tenant_portal (tenant_id, summary) VALUES ($1, $2)
       ON CONFLICT (tenant_id) DO NOTHING`,
      [tenant.id, tenant.portalSummary],
    );
  }
  for (const user of USERS) {
    await db.query(
      `INSERT INTO users (id, tenant_id, email, display_name, role, oidc_sub)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO NOTHING`,
      [user.sub, user.tenantId, user.email, user.displayName, user.role, user.sub],
    );
  }
}

let singleton: Database | null = null;

export function assertPrototypeEnabled(): void {
  if (process.env.VERCEL_ENV === "production") {
    throw new Error("Prototype routes are disabled in production");
  }
}

export async function getDatabase(): Promise<Database> {
  assertPrototypeEnabled();
  if (!singleton) {
    singleton = await createDatabase();
    await migrate(singleton);
    await seed(singleton);
  }
  return singleton;
}

export async function withActor<T>(
  db: Database,
  actor: { tenantId: string; userId: string; role: string },
  fn: (tx: Sql) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.query(`SELECT set_config('app.tenant_id', $1, true)`, [actor.tenantId]);
    await tx.query(`SELECT set_config('app.user_id', $1, true)`, [actor.userId]);
    await tx.query(`SELECT set_config('app.role', $1, true)`, [actor.role]);
    await tx.query(`SET LOCAL ROLE prototype_app`);
    return fn(tx);
  });
}
