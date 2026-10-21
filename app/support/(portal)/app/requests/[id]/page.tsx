"use client";

import { use } from "react";
import { RequestDetail } from "@/components/support/views/Requests";

export default function RequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <RequestDetail id={id} />;
}
