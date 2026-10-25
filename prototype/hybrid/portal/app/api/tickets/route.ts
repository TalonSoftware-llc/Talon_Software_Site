import { NextRequest, NextResponse } from "next/server";

import { dataPlane } from "../../../lib/data-plane";
import { getSession } from "../../../lib/session";

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  return !origin || origin === process.env.PORTAL_ORIGIN;
}

async function payload(request: NextRequest) {
  const type = request.headers.get("content-type") || "";
  if (type.includes("application/json")) return request.json();
  const form = await request.formData();
  return {
    subject: form.get("subject"),
    body: form.get("body"),
    priority: form.get("priority"),
  };
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "sign in" }, { status: 401 });
  const result = await dataPlane("/tickets", session.idToken);
  return NextResponse.json(result.json, { status: result.status });
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "bad origin" }, { status: 403 });
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "sign in" }, { status: 401 });
  const body = await payload(request);
  const result = await dataPlane("/tickets", session.idToken, {
    method: "POST",
    body: JSON.stringify(body),
  });
  const form = (request.headers.get("content-type") || "").includes("application/x-www-form-urlencoded");
  if (form && result.status < 300 && result.json.id) {
    return NextResponse.redirect(new URL(`/tickets/${result.json.id}`, process.env.PORTAL_ORIGIN), 303);
  }
  return NextResponse.json(result.json, { status: result.status });
}
