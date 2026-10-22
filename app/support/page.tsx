import type { Metadata } from "next";
import SupportSignIn from "@/components/support/SupportSignIn";
import { areaHref } from "@/lib/request-site";

export const metadata: Metadata = {
  title: "Sign in | Talon Support",
  description: "Sign-in screen for Talon Support. The preview does not send or store credentials.",
};

export default async function SupportSignInPage() {
  const proHref = await areaHref("support", "/demo/pro");
  const essentialsHref = await areaHref("support", "/demo/essentials");
  return <SupportSignIn proHref={proHref} essentialsHref={essentialsHref} />;
}
