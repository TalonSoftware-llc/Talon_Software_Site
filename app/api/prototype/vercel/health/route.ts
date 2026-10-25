import { getDatabase } from "@/prototype/vercel/src/db";
import { fail, json } from "@/prototype/vercel/src/request";
import { oidcConfig } from "@/prototype/vercel/src/oidc-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await getDatabase();
    return json({
      ok: true,
      pathway: "vercel-serverless",
      driver: db.driver,
      auth: oidcConfig() ? "configured" : "unconfigured",
    });
  } catch (error) {
    return fail(error);
  }
}
