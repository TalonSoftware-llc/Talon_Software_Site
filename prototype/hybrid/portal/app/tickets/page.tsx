import Link from "next/link";
import { redirect } from "next/navigation";

import { dataPlane, type Principal, type Ticket } from "../../lib/data-plane";
import { roleLabel, slaLabel, statusLabel } from "../../lib/labels";
import { getSession } from "../../lib/session";

export default async function TicketsPage() {
  const session = await getSession();
  if (!session) redirect("/");
  const me = await dataPlane("/me", session.idToken);
  if (me.status !== 200) redirect("/");
  const principal = me.json as Principal;
  const listed = await dataPlane("/tickets", session.idToken);
  const tickets = listed.status === 200 ? (listed.json.tickets as Ticket[]) : [];

  return (
    <>
      <p>
        <Link href="/">Home</Link>
      </p>
      <h1>Tickets</h1>
      <p>
        {principal.displayName} sees the {roleLabel(principal.role)} scope for {principal.tenantName}.
      </p>
      {listed.status !== 200 ? <p className="error">Tickets could not be loaded.</p> : null}
      {tickets.length === 0 ? <p>No tickets you can see.</p> : (
        <table>
          <thead>
            <tr>
              <th>Subject</th>
              <th>Status</th>
              <th>SLA</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr key={ticket.id}>
                <td><Link href={`/tickets/${ticket.id}`}>{ticket.subject}</Link></td>
                <td>{statusLabel(ticket.status)}</td>
                <td>{slaLabel(ticket.slaStatus)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p>
        <Link className="button" href="/tickets/new">New ticket</Link>
      </p>
    </>
  );
}
