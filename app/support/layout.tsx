import { getSupportPrincipal } from "@/lib/support/session";

/**
 * Authentication seam for Talon Support.
 * getSupportPrincipal() returns null until a real session provider is added.
 * The sign-in screen does not collect credentials. The app routes are a demo.
 * When a principal exists, enforce access here.
 */
export default async function SupportLayout({ children }: { children: React.ReactNode }) {
  await getSupportPrincipal();
  return children;
}
