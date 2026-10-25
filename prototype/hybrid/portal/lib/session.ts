import { createHash, randomBytes } from "node:crypto";
import { EncryptJWT, jwtDecrypt } from "jose";
import { cookies } from "next/headers";

function key() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is required");
  return createHash("sha256").update(secret).digest();
}

export function randomToken() {
  return randomBytes(32).toString("base64url");
}

export async function seal(payload: Record<string, string>, expires: string) {
  return new EncryptJWT(payload)
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime(expires)
    .encrypt(key());
}

export async function open(token: string | undefined) {
  if (!token) return null;
  try {
    const { payload } = await jwtDecrypt(token, key());
    return payload;
  } catch {
    return null;
  }
}

export async function getSession() {
  const jar = await cookies();
  const payload = await open(jar.get("hybrid_session")?.value);
  if (!payload || typeof payload.idToken !== "string") return null;
  return { idToken: payload.idToken };
}

export const sessionCookie = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: false,
  path: "/",
};
