import { cache } from "react";

export type SupportPrincipal = {
  companyId: string;
  companyName: string;
};

/**
 * The support portal's authentication seam.
 * Returns null until a real session provider is wired in here.
 * Do not collect or store passwords, emails, or other credentials in this module.
 * A future layout or page should keep calling this function and then render
 * company data only when it returns a principal.
 */
export const getSupportPrincipal = cache(async (): Promise<SupportPrincipal | null> => {
  return null;
});
