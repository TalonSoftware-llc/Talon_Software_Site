import { Suspense } from "react";
import { CompromiseFlow } from "@/components/support/views/People";

export default function CompromisedPage() {
  return (
    <Suspense fallback={<p className="text-sm">Loading…</p>}>
      <CompromiseFlow />
    </Suspense>
  );
}
