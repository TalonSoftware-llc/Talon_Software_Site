import { NextResponse } from "next/server";

import { getDatabase } from "./db";
import { HttpError } from "./errors";
import { actorFromClaims, findUsersBySub, type Actor } from "./identity";
import { localDev, LOGIN_COOKIE, readLogin, readSession, SESSION_COOKIE } from "./session";

export function json(body: unknown, status = 200, cookies: string[] = []): NextResponse {
  const headers = new Headers();
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("cache-control", "no-store");
  headers.set("x-robots-tag", "noindex");
  headers.set("x-content-type-options", "nosniff");
  for (const cookie of cookies) headers.append("set-cookie", cookie);
  return new NextResponse(JSON.stringify(body), { status, headers });
}

export function fail(error: unknown): NextResponse {
  if (error instanceof HttpError) {
    return json({ error: { code: error.code, message: error.message } }, error.status);
  }
  const disabled = error instanceof Error && error.message === "Prototype routes are disabled in production";
  if (disabled) return json({ error: { code: "not_available", message: "Not found" } }, 404);
  console.error("prototype vercel request failed");
  return json({ error: { code: "internal", message: "Prototype request failed" } }, 500);
}

export function cookieValue(request: Request, name: string): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;
    if (part.slice(0, separator).trim() !== name) continue;
    return decodeURIComponent(part.slice(separator + 1).trim());
  }
  return null;
}

export function setCookie(name: string, value: string, maxAge: number, path: string): string {
  const secure = (process.env.PROTOTYPE_APP_ORIGIN ?? "").startsWith("https://") ? "; Secure" : "";
  return `${name}=${encodeURIComponent(value)}; HttpOnly; SameSite=Lax; Path=${path}; Max-Age=${maxAge}${secure}`;
}

export async function readJson(request: Request): Promise<Record<string, unknown>> {
  const text = await request.text();
  if (text.length > 20_000) throw new HttpError(413, "body_too_large", "Request body is too large");
  if (!text) return {};
  try {
    const parsed = JSON.parse(text) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new HttpError(400, "invalid_json", "Request body must be a JSON object");
    }
    return parsed as Record<string, unknown>;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(400, "invalid_json", "Request body must be JSON");
  }
}

export function requestNow(request: Request): Date {
  const override = request.headers.get("x-prototype-now");
  if (!override || !localDev()) return new Date();
  const date = new Date(override);
  if (Number.isNaN(date.getTime())) throw new HttpError(400, "bad_time", "Invalid prototype clock");
  return date;
}

export function rejectForeignTenant(request: Request, tenantId: string, body?: Record<string, unknown>): void {
  const url = new URL(request.url);
  const claimed = [request.headers.get("x-tenant-id"), url.searchParams.get("tenantId"), body?.tenantId].filter(
    (value): value is string => typeof value === "string" && value.length > 0,
  );
  if (claimed.some((value) => value !== tenantId)) {
    throw new HttpError(403, "tenant_mismatch", "Tenant does not match the signed-in company");
  }
}

export async function actorFromRequest(request: Request, body?: Record<string, unknown>): Promise<Actor> {
  const token = cookieValue(request, SESSION_COOKIE);
  if (!token) throw new HttpError(401, "unauthenticated", "Sign in through the SSO provider");
  const session = await readSession(token);
  const db = await getDatabase();
  const matches = (await findUsersBySub(db, session.sub)).filter((candidate) => candidate.email === session.email);
  if (matches.length !== 1) throw new HttpError(401, "unknown_account", "No portal user for this SSO account");
  const actor = matches[0]!;
  rejectForeignTenant(request, actor.tenantId, body);
  return actor;
}

export async function loginStateFromRequest(request: Request) {
  const token = cookieValue(request, LOGIN_COOKIE);
  if (!token) throw new HttpError(400, "login_expired", "SSO login expired. Start again.");
  return readLogin(token);
}

export { actorFromClaims };
