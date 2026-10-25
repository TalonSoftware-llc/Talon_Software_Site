import Link from "next/link";
import { redirect } from "next/navigation";

import { getSession } from "../../../lib/session";

export default async function NewTicketPage() {
  const session = await getSession();
  if (!session) redirect("/");
  return (
    <>
      <p><Link href="/tickets">Tickets</Link></p>
      <h1>New ticket</h1>
      <form method="post" action="/api/tickets">
        <label htmlFor="subject">Subject</label>
        <input id="subject" name="subject" required maxLength={200} />
        <label htmlFor="body">Details</label>
        <textarea id="body" name="body" required maxLength={4000} rows={5} />
        <label htmlFor="priority">Priority</label>
        <select id="priority" name="priority" defaultValue="normal">
          <option value="low">Low</option>
          <option value="normal">Normal</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
        <button type="submit">Create ticket</button>
      </form>
    </>
  );
}
