import Link from "next/link";
import { redirect } from "next/navigation";

import { dataPlane, type Ticket } from "../../../lib/data-plane";
import { slaLabel, statusLabel } from "../../../lib/labels";
import { getSession } from "../../../lib/session";

export default async function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/");
  const { id } = await params;
  const result = await dataPlane(`/tickets/${id}`, session.idToken);
  if (result.status === 404) {
    return (
      <>
        <p><Link href="/tickets">Tickets</Link></p>
        <h1>Ticket unavailable</h1>
        <p>That ticket is not available to you.</p>
      </>
    );
  }
  if (result.status !== 200) {
    return <p className="error">The ticket could not be loaded.</p>;
  }
  const ticket = result.json as Ticket;
  return (
    <>
      <p><Link href="/tickets">Tickets</Link></p>
      <h1>{ticket.subject}</h1>
      <p>{ticket.body}</p>
      <p>
        <span data-status={ticket.status}>{statusLabel(ticket.status)}</span>
        {" · "}
        <span data-sla={ticket.slaStatus}>{slaLabel(ticket.slaStatus)}</span>
      </p>
      <p>
        Respond due <time dateTime={ticket.respondDueAt}>{ticket.respondDueAt}</time>
        <br />
        Resolve due <time data-resolve-due={ticket.resolveDueAt} dateTime={ticket.resolveDueAt}>{ticket.resolveDueAt}</time>
      </p>
      <form method="post" action={`/api/tickets/${ticket.id}`}>
        <label htmlFor="status">Status</label>
        <select id="status" name="status" defaultValue={ticket.status}>
          <option value="open">Open</option>
          <option value="in_progress">In progress</option>
          <option value="waiting">Waiting</option>
          <option value="resolved">Resolved</option>
        </select>
        <button type="submit">Update ticket</button>
      </form>
    </>
  );
}
