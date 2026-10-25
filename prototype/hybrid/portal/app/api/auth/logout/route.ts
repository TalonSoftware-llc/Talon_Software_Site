import { NextResponse } from "next/server";

import { sessionCookie } from "../../../../lib/session";

function clear() {
  const origin = process.env.PORTAL_ORIGIN || "http://127.0.0.1:3210";
  const response = NextResponse.redirect(new URL("/", origin), 303);
  response.cookies.set("hybrid_session", "", { ...sessionCookie, maxAge: 0 });
  response.cookies.set("hybrid_login", "", { ...sessionCookie, maxAge: 0 });
  return response;
}

export function POST() {
  return clear();
}

export function GET() {
  return clear();
}
