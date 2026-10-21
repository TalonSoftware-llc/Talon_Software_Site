"use client";

import { use } from "react";
import { ProjectDetail } from "@/components/support/views/Projects";

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <ProjectDetail id={id} />;
}
