# Hybrid backend prototype

Throwaway validation prototype. Not for production. It does not change the marketing site, the live portal, DNS, or the Vercel project.

The portal is a Next.js app shaped for Vercel. Postgres runs in Docker on this machine as a stand-in for the existing box. A local OpenID Connect provider (password, then TOTP) stands in for Entra ID and Google Workspace. The portal holds the browser session. The data plane checks the ID token and is the only thing that sets the tenant and role for Postgres row security.

Sample companies: Harbor Sample and Pine Sample. Dev fixtures live in `.env.example`. They are not production credentials.

## Run the proofs

From this directory:

```bash
npm install
npm install --prefix portal
npm test
```

`npm test` starts Postgres, the test SSO, the data plane, and the portal, then checks tenant isolation, SSO with MFA, a ticket stored with an SLA due time, and the Essentials vs Pro role split. It removes the database container when it finishes.

`npm run dev` leaves the services up at http://127.0.0.1:3210. `npm run code -- ada` prints Ada's current one-time code.

No pull request is opened from this work. The branch name is `prototype/hybrid-backend`.
