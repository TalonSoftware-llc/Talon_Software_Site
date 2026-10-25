import { SignJWT, jwtVerify } from "jose";

import { HttpError } from "./errors";

export const SESSION_COOKIE = "talon_prototype_session";
export const LOGIN_COOKIE = "talon_prototype_login";

const encoder = new TextEncoder();

export type LoginState = {
  state: string;
  nonce: string;
  verifier: string;
};

export function localDev(): boolean {
  return process.env.PROTOTYPE_DEV === "1" && !process.env.VERCEL && process.env.NODE_ENV !== "production";
}

function secret(): Uint8Array {
  const configured = process.env.PROTOTYPE_SESSION_SECRET;
  if (configured) {
    if (configured.length < 32) {
      throw new HttpError(500, "weak_secret", "PROTOTYPE_SESSION_SECRET must be at least 32 characters");
    }
    return encoder.encode(configured);
  }
  if (localDev()) return encoder.encode("dev-only-session-secret-not-for-production!!");
  throw new HttpError(500, "missing_secret", "PROTOTYPE_SESSION_SECRET is required");
}

export async function signSession(input: { sub: string; email: string }): Promise<string> {
  return new SignJWT({ email: input.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(input.sub)
    .setIssuer("talon-prototype")
    .setAudience("session")
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret());
}

export async function readSession(token: string): Promise<{ sub: string; email: string }> {
  try {
    const { payload } = await jwtVerify(token, secret(), {
      issuer: "talon-prototype",
      audience: "session",
    });
    if (typeof payload.sub !== "string" || typeof payload.email !== "string") {
      throw new Error("incomplete");
    }
    return { sub: payload.sub, email: payload.email };
  } catch {
    throw new HttpError(401, "unauthenticated", "Sign in through the SSO provider");
  }
}

export async function signLogin(input: LoginState): Promise<string> {
  return new SignJWT({ state: input.state, nonce: input.nonce, verifier: input.verifier })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer("talon-prototype")
    .setAudience("login")
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(secret());
}

export async function readLogin(token: string): Promise<LoginState> {
  try {
    const { payload } = await jwtVerify(token, secret(), {
      issuer: "talon-prototype",
      audience: "login",
    });
    if (
      typeof payload.state !== "string" ||
      typeof payload.nonce !== "string" ||
      typeof payload.verifier !== "string"
    ) {
      throw new Error("incomplete");
    }
    return { state: payload.state, nonce: payload.nonce, verifier: payload.verifier };
  } catch {
    throw new HttpError(400, "login_expired", "SSO login expired. Start again.");
  }
}
