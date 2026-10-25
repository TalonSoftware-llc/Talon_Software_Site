/**
 * Local stand-in identities. These are not accounts, not secrets, and not clients.
 * Production passwords never live here. The IdP holds them.
 */

export const clientId = "talon-prototype";
export const redirectUri = "http://127.0.0.1:4318/callback";
export const issuer = "http://localhost:5556";
export const apiAudience = "talon-api";
export const mfaCode = "000000";

export const users = [
  {
    sub: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
    email: "ada.essentials@cedar.example",
    password: "dev-password-ada",
    name: "Ada Sample",
    tenant: "cedar",
    role: "essentials",
  },
  {
    sub: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2",
    email: "drew.essentials@cedar.example",
    password: "dev-password-drew",
    name: "Drew Sample",
    tenant: "cedar",
    role: "essentials",
  },
  {
    sub: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3",
    email: "blake.pro@cedar.example",
    password: "dev-password-blake",
    name: "Blake Sample",
    tenant: "cedar",
    role: "pro",
  },
  {
    sub: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4",
    email: "robin.lead@cedar.example",
    password: "dev-password-robin",
    name: "Robin Sample",
    tenant: "cedar",
    role: "team_lead",
  },
  {
    sub: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1",
    email: "casey.pro@harbor.example",
    password: "dev-password-casey",
    name: "Casey Sample",
    tenant: "harbor",
    role: "pro",
  },
];

export function userByEmail(email) {
  return users.find((user) => user.email === email) ?? null;
}

export function userBySub(sub) {
  return users.find((user) => user.sub === sub) ?? null;
}
