# Hetzner / Postgres pathway prototype

Throwaway validation prototype. Not for production. Do not merge it.

This Compose stack is a local stand-in for the self-hosted box. It does not connect to the Hetzner server, Tailscale, Vercel, or a real Microsoft or Google tenant. Media bytes go to a Docker volume instead of Backblaze B2.

## What runs

- Postgres 16 with pgvector, row level security, and a stored SLA due time
- A small Node API
- A local OIDC provider with a password step and a dev MFA code (`000000`)

Sample companies are Cedar Sample Co and Harbor Sample Co. Addresses are on `.example`.

## Run the proofs

```bash
cd prototype/hetzner
docker compose up -d --build --wait
node --test proof/pathway.test.mjs
```

`proof.sh` does the same two steps. Ports are bound to `127.0.0.1` only: API `8787`, dev IdP `5556`. Postgres is not published.

Reset the database with `docker compose down -v`.

Dev passwords and the MFA code are fixtures in `fixtures.js`. They are not secrets. Real client passwords would stay at Entra ID or Google Workspace.
