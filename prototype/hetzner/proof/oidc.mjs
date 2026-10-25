import { createHash, randomBytes } from "node:crypto";

import {
  clientId,
  mfaCode,
  redirectUri,
  userByEmail,
  users,
} from "../fixtures.js";

const issuer = "http://127.0.0.1:5556";
const resource = "http://localhost:8787";

const cache = new Map();
let chain = Promise.resolve();

function mutex(fn) {
  const run = chain.then(fn, fn);
  chain = run.then(() => {}, () => {});
  return run;
}

function cookieHeader(jar) {
  return [...jar.entries()].map(([name, value]) => `${name}=${value}`).join("; ");
}

function storeCookies(jar, response) {
  const lines = typeof response.headers.getSetCookie === "function"
    ? response.headers.getSetCookie()
    : [];
  for (const line of lines) {
    const pair = line.split(";")[0];
    const eq = pair.indexOf("=");
    if (eq === -1) continue;
    jar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
  }
}

async function request(url, jar, options = {}) {
  const headers = {
    accept: "application/json",
    cookie: cookieHeader(jar),
    ...(options.headers || {}),
  };
  const response = await fetch(url, { redirect: "manual", ...options, headers });
  storeCookies(jar, response);
  return response;
}

async function follow(start, jar) {
  let url = start;
  for (let hop = 0; hop < 15; hop += 1) {
    const response = await request(url, jar);
    if (response.status >= 300 && response.status < 400) {
      url = new URL(response.headers.get("location"), url).href;
      if (url.startsWith(redirectUri)) return { done: true, url };
      continue;
    }
    const text = await response.text();
    let body = text;
    try {
      body = JSON.parse(text);
    } catch {
      // HTML sign-in page.
    }
    return { done: false, status: response.status, url, body };
  }
  throw new Error("too_many_redirects");
}

export async function loginAttempt({ email, password, code }) {
  const user = userByEmail(email);
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const state = randomBytes(16).toString("base64url");
  const nonce = randomBytes(16).toString("base64url");
  const jar = new Map();
  const authUrl = new URL("/auth", issuer);
  authUrl.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    resource,
    code_challenge: challenge,
    code_challenge_method: "S256",
    state,
    nonce,
  }).toString();

  const landed = await follow(authUrl.href, jar);
  if (landed.done) throw new Error("signed_in_without_mfa");
  const uid = new URL(landed.url).pathname.split("/").filter(Boolean).at(-1);
  if (!uid) throw new Error(`no_interaction:${landed.status}`);

  const passwordResponse = await request(new URL(`/interaction/${uid}/login`, issuer), jar, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const passwordBody = await passwordResponse.json();
  if (passwordResponse.status !== 200) {
    return { error: passwordBody.error || "invalid_login", status: passwordResponse.status, user };
  }

  const mfaResponse = await request(new URL(`/interaction/${uid}/mfa`, issuer), jar, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ code }),
  });
  if (mfaResponse.status !== 303) {
    const mfaBody = await mfaResponse.json().catch(() => ({}));
    return { error: mfaBody.error || "invalid_mfa", status: mfaResponse.status, user };
  }

  const finished = await follow(new URL(mfaResponse.headers.get("location"), issuer).href, jar);
  if (!finished.done) {
    return { error: "no_authorization_code", status: finished.status, body: finished.body, user };
  }
  const callback = new URL(finished.url);
  if (callback.searchParams.get("state") !== state) return { error: "state_mismatch", user };
  const codeParam = callback.searchParams.get("code");
  if (!codeParam) return { error: callback.searchParams.get("error") || "missing_code", user };

  const tokenResponse = await fetch(new URL("/token", issuer), {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: codeParam,
      redirect_uri: redirectUri,
      client_id: clientId,
      code_verifier: verifier,
      resource,
    }),
  });
  const tokenBody = await tokenResponse.json();
  if (!tokenResponse.ok) {
    return { error: tokenBody.error || "token_failed", status: tokenResponse.status, body: tokenBody, user };
  }
  return { accessToken: tokenBody.access_token, idToken: tokenBody.id_token, user };
}

export function login(email) {
  if (cache.has(email)) return Promise.resolve(cache.get(email));
  return mutex(async () => {
    if (cache.has(email)) return cache.get(email);
    const user = users.find((item) => item.email === email);
    const result = await loginAttempt({ email, password: user.password, code: mfaCode });
    if (!result.accessToken) {
      throw new Error(`login_failed:${email}:${result.error}`);
    }
    cache.set(email, result);
    return result;
  });
}

export function claims(jwt) {
  const part = jwt.split(".")[1];
  return JSON.parse(Buffer.from(part, "base64url").toString("utf8"));
}
