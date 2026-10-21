"use client";

import { Suspense, use } from "react";
import { PersonProfile } from "@/components/support/views/People";

export default function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <Suspense fallback={null}>
      <PersonProfile id={id} />
    </Suspense>
  );
}
