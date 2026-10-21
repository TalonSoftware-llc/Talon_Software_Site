"use client";

import { useEffect } from "react";
import type { PageContext } from "@/lib/support/types";
import { publishPage } from "./store";

export function usePageContext(page: PageContext) {
  const json = JSON.stringify(page);
  useEffect(() => {
    publishPage(JSON.parse(json) as PageContext);
  }, [json]);
}
