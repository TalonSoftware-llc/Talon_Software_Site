import EnterDemo from "@/components/support/EnterDemo";
import { areaHref } from "@/lib/request-site";

export default async function EssentialsDemoPage() {
  const href = await areaHref("support", "/app/requests");
  return <EnterDemo tier="essentials" href={href} />;
}
