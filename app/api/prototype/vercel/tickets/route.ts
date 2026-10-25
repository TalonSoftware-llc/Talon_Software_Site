import { getDatabase } from "@/prototype/vercel/src/db";
import { actorFromRequest, fail, json, readJson, requestNow } from "@/prototype/vercel/src/request";
import { createTicket, listTickets } from "@/prototype/vercel/src/tickets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const now = requestNow(request);
    const actor = await actorFromRequest(request);
    return json({ tickets: await listTickets(await getDatabase(), actor, now) });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const now = requestNow(request);
    const body = await readJson(request);
    const actor = await actorFromRequest(request, body);
    const ticket = await createTicket(await getDatabase(), actor, body, now);
    return json({ ticket }, 201);
  } catch (error) {
    return fail(error);
  }
}
