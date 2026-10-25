const DEV_ISSUER = "http://127.0.0.1:4180";

const ROWS = [
  ["ada", "sample|ada", "ada@harbor.example", "Ada Sample", "USER_ADA_PASSWORD", "USER_ADA_TOTP_SECRET"],
  ["ben", "sample|ben", "ben@harbor.example", "Ben Sample", "USER_BEN_PASSWORD", "USER_BEN_TOTP_SECRET"],
  ["cara", "sample|cara", "cara@pine.example", "Cara Sample", "USER_CARA_PASSWORD", "USER_CARA_TOTP_SECRET"],
];

export function devIssuer() {
  return DEV_ISSUER;
}

export function devUsers() {
  if (process.env.OIDC_ISSUER !== DEV_ISSUER) {
    throw new Error(`OIDC_ISSUER must be ${DEV_ISSUER} so it matches the Postgres seed`);
  }
  return ROWS.map(([key, sub, email, name, passwordKey, totpKey]) => {
    const password = process.env[passwordKey];
    const totpSecret = process.env[totpKey];
    if (!password || !totpSecret) {
      throw new Error(`missing ${passwordKey} or ${totpKey}`);
    }
    return { key, sub, email, name, password, totpSecret };
  });
}
