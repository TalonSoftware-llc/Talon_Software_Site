"use client";

import { useSyncExternalStore } from "react";
import { getDemoState, subscribeDemo, type DemoState } from "./store";

export function useDemo(): DemoState {
  return useSyncExternalStore(subscribeDemo, getDemoState, getDemoState);
}
