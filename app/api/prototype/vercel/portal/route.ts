import { getDatabase } from "@/prototype/vercel/src/db";
import { readPortal } from "@/prototype/vercel/src/portal";
import { actorFromRequest, fail, json } from "@/prototype/vercel/src/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const actor = await actorFromRequest(request);
    return json({ portal: await readPortal(await getDatabase(), actor) });
  } catch (error) {
    return fail(error);
  }
}
