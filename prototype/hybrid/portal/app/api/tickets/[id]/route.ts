import { NextRequest, NextResponse } from "next/server";

import { dataPlane } from "../../../../lib/data-plane";
import { getSession } from "../../../../lib/session";

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  return !origin || origin === process.env.PORTAL_ORIGIN;
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "sign in" }, { status: 401 });
  const { id } = await context.params;
  const result = await dataPlane(`/tickets/${id}`, session.idToken);
  return NextResponse.json(result.json, { status: result.status });
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "bad origin" }, { status: 403 });
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "sign in" }, { status: 401 });
  const { id } = await context.params;
  const type = request.headers.get("content-type") || "";
  const body = type.includes("application/json")
    ? await request.json()
    : { status: (await request.formData()).get("status") };
  const result = await dataPlane(`/tickets/${id}`, session.idToken, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  if (type.includes("application/x-www-form-urlencoded") && result.status < 300) {
    return NextResponse.redirect(new URL(`/tickets/${id}`, process.env.PORTAL_ORIGIN), 303);
  }
  return NextResponse.json(result.json, { status: result.status });
}
