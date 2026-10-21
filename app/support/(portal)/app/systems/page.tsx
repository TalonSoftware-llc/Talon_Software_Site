import { redirect } from "next/navigation";
import { areaHref } from "@/lib/request-site";

export default async function LegacySystemsPage() {
  redirect(await areaHref("support", "/website"));
}
