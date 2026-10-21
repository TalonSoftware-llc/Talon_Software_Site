import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { buildChrome } from "@/lib/navigation";
import { getRequestSite } from "@/lib/request-site";

export default async function SiteFrame({ children }: { children: React.ReactNode }) {
  const chrome = buildChrome(await getRequestSite());

  return (
    <>
      <Header chrome={chrome} />
      <main className="flex min-h-screen flex-col bg-paper text-ink">
        <div className="mx-auto w-full max-w-6xl flex-grow px-6 py-16">{children}</div>
        <Footer chrome={chrome} />
      </main>
    </>
  );
}
