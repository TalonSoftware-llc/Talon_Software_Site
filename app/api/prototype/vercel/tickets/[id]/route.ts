import { getDatabase } from "@/prototype/vercel/src/db";
import { actorFromRequest, fail, json, readJson, requestNow } from "@/prototype/vercel/src/request";
import { getTicket, updateTicket } from "@/prototype/vercel/src/tickets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const now = requestNow(request);
    const actor = await actorFromRequest(request);
    return json({ ticket: await getTicket(await getDatabase(), actor, id, now) });
  } catch (error) {
    return fail(error);
  }
}

export async function PATCH(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const now = requestNow(request);
    const body = await readJson(request);
    const actor = await actorFromRequest(request, body);
    return json({ ticket: await updateTicket(await getDatabase(), actor, id, body, now) });
  } catch (error) {
    return fail(error);
  }
}
