import EnterDemo from "@/components/support/EnterDemo";
import { areaHref } from "@/lib/request-site";

export default async function ProDemoPage() {
  const href = await areaHref("support", "/app");
  return <EnterDemo tier="pro" href={href} />;
}
