"use client";

import { Suspense } from "react";
import { LockAccount } from "@/components/support/views/Security";

export default function LockPage() {
  return (
    <Suspense fallback={null}>
      <LockAccount />
    </Suspense>
  );
}
