import type { SupportPrincipal } from "../session";
import { mockRepository } from "./mock";

/**
 * Data seam for Talon Support.
 * Today the only provider is the in-memory demo. Analytics, uptime, and
 * accounting can replace mockRepository later without rewriting pages.
 * The public demo does not call an external service.
 */
export type SupportRepository = typeof mockRepository;

export function getSupportRepository(principal: SupportPrincipal | null): SupportRepository {
  void principal;
  return mockRepository;
}
