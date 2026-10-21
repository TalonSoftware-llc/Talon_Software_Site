import { getSupportPrincipal } from "@/lib/support/session";

/**
 * Authentication seam for the support portal.
 * getSupportPrincipal() returns null until a real session provider is added.
 * When it starts returning a company, enforce access in this layout.
 * Keep credentials out of the pages.
 */
export default async function SupportLayout({ children }: { children: React.ReactNode }) {
  const principal = await getSupportPrincipal();

  return (
    <div data-support-signed-in={principal ? "yes" : "no"} className="contents">
      {children}
    </div>
  );
}
