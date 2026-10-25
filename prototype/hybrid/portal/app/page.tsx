import Link from "next/link";
import { redirect } from "next/navigation";

import { dataPlane, type Principal } from "../lib/data-plane";
import { roleLabel } from "../lib/labels";
import { getSession } from "../lib/session";

export default async function HomePage() {
  const session = await getSession();
  if (!session) {
    return (
      <>
        <h1>Sign in</h1>
        <p>
          This portal keeps the browser session. The database, tenant check, and role check stay on the data plane.
        </p>
        <p>
          <Link className="button" href="/api/auth/login">Sign in with the test SSO</Link>
        </p>
      </>
    );
  }

  const me = await dataPlane("/me", session.idToken);
  if (me.status === 401) redirect("/api/auth/logout");
  if (me.status !== 200) {
    return <p className="error">The data plane did not accept this session.</p>;
  }
  const principal = me.json as Principal;
  return (
    <>
      <h1>{principal.tenantName}</h1>
      <p>
        {principal.displayName} · {roleLabel(principal.role)} · {principal.email}
      </p>
      <p>
        <Link className="button" href="/tickets">Open tickets</Link>
      </p>
      <form method="post" action="/api/auth/logout">
        <button type="submit">Sign out</button>
      </form>
    </>
  );
}
