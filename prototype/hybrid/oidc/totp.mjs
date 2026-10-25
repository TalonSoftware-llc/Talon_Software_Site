import { createHmac, timingSafeEqual } from "node:crypto";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32Decode(input) {
  const clean = input.replace(/=+$/g, "").toUpperCase().replace(/\s/g, "");
  let bits = 0;
  let value = 0;
  const out = [];
  for (const char of clean) {
    const index = ALPHABET.indexOf(char);
    if (index < 0) throw new Error("invalid base32");
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      out.push((value >>> bits) & 0xff);
    }
  }
  return Buffer.from(out);
}

export function totpAt(key, atMs, step = 30, digits = 6) {
  const counter = Math.floor(atMs / 1000 / step);
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const hmac = createHmac("sha1", key).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary = hmac.readUInt32BE(offset) & 0x7fffffff;
  return String(binary % 10 ** digits).padStart(digits, "0");
}

export function totp(secret, atMs = Date.now()) {
  return totpAt(base32Decode(secret), atMs);
}

export function verifyTotp(secret, token, window = 1) {
  const code = String(token || "").trim();
  if (!/^\d{6}$/.test(code)) return false;
  const now = Date.now();
  for (let shift = -window; shift <= window; shift += 1) {
    const expected = totp(secret, now + shift * 30_000);
    const left = Buffer.from(code);
    const right = Buffer.from(expected);
    if (timingSafeEqual(left, right)) return true;
  }
  return false;
}

// RFC 6238 SHA-1 vector: T = 59, secret ASCII "12345678901234567890" → 287082.
const rfc = totpAt(Buffer.from("12345678901234567890"), 59_000);
if (rfc !== "287082") {
  throw new Error(`TOTP self-check failed: ${rfc}`);
}
if (base32Decode("MZXW6YTBOI======").toString() !== "foobar") {
  throw new Error("base32 self-check failed");
}
