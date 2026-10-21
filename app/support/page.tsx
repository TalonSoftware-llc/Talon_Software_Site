import type { Metadata } from "next";
import SupportSignIn from "@/components/support/SupportSignIn";
import { areaHref } from "@/lib/request-site";

export const metadata: Metadata = {
  title: "Sign in | Talon Support",
  description: "Sign-in screen for Talon Support. The preview does not send or store credentials.",
};

export default async function SupportSignInPage() {
  const demoHref = await areaHref("support", "/app");
  return <SupportSignIn demoHref={demoHref} />;
}
