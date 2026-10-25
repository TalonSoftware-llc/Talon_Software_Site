# Vercel pathway prototype

Throwaway validation prototype. Not for production. It does not change the marketing site or the support demo.

Isolated API: `/api/prototype/vercel/*`.

Local proof uses embedded Postgres (PGlite) and a local OpenID Connect provider with a password plus authenticator-code step. Production on this pathway would use Neon and the same code path with Microsoft Entra ID or Google Workspace as the issuer. No queue. SLA state is computed from a due time stored on the ticket.

```bash
npm run prototype:vercel:test
npm run prototype:vercel:proof
```

Fixture companies are Sample North and Sample South. The dev password and authenticator secret live in `src/dev-credentials.ts` and are only for this local provider.

See `.env.example`. Do not commit secrets.
