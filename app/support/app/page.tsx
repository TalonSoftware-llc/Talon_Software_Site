"use client";

import Home from "@/components/support/views/Home";
import { GetHelp } from "@/components/support/views/Staff";
import { useDemo } from "@/components/support/use-demo";

export default function SupportHomePage() {
  const demo = useDemo();
  return demo.role === "staff" ? <GetHelp /> : <Home />;
}
