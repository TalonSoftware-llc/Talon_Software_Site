// Local mock IdP only. Imported by the dev SSO server and the proofs, not by
// the Next.js routes, so a preview deploy does not ship the fixture password.

export const DEV_PASSWORD = "sample-password";

// Base32 fixture secret for the dev authenticator step. Not a real account.
export const DEV_TOTP_SECRET = "JBSWY3DPEHPK3PXP";
