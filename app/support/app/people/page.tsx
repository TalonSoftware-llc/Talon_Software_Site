import { Suspense } from "react";
import { PeopleDirectory } from "@/components/support/views/People";

export default function PeoplePage() {
  return (
    <Suspense fallback={<p className="text-sm">Loading people…</p>}>
      <PeopleDirectory />
    </Suspense>
  );
}
