import { fail, json, actorFromRequest } from "@/prototype/vercel/src/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const actor = await actorFromRequest(request);
    return json({
      mfa: true,
      user: {
        email: actor.email,
        role: actor.role,
        tenantId: actor.tenantId,
        displayName: actor.displayName,
      },
    });
  } catch (error) {
    return fail(error);
  }
}
