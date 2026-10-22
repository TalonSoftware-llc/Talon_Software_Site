import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function SiteFrame({ children, bare = false }: { children: React.ReactNode; bare?: boolean }) {
  return (
    <>
      <Header />
      <main className="flex min-h-screen flex-col bg-paper text-ink">
        {bare ? <div className="flex-grow">{children}</div> : <div className="mx-auto w-full max-w-6xl flex-grow px-6 py-16">{children}</div>}
        <Footer />
      </main>
    </>
  );
}
