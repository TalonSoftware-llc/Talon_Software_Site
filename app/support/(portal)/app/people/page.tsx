"use client";

import { Suspense } from "react";
import { PeopleDirectory } from "@/components/support/views/People";

export default function PeoplePage() {
  return (
    <Suspense fallback={null}>
      <PeopleDirectory />
    </Suspense>
  );
}
