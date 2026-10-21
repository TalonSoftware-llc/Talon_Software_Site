import { Suspense } from "react";
import { TicketList } from "@/components/support/views/Tickets";

export default function TicketsPage() {
  return (
    <Suspense fallback={<p className="text-sm">Loading tickets…</p>}>
      <TicketList />
    </Suspense>
  );
}
