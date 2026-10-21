import type { Metadata } from "next";
import { areaHref } from "@/lib/request-site";

export const metadata: Metadata = {
  title: "Talon Engineering",
  description: "Talon Engineering is not open yet.",
};

export default async function EngineeringPage() {
  const contact = await areaHref("main", "/contact");
  const privacy = await areaHref("main", "/privacy");

  return (
    <div className="flex min-h-screen flex-col bg-[#101816] text-[#efeae0]">
      <div
        className="flex flex-1 flex-col justify-center px-6 py-24"
        style={{
          backgroundImage:
            "linear-gradient(rgba(239,234,224,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(239,234,224,0.05) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      >
        <div className="mx-auto w-full max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#9bb8a8]">Coming soon</p>
          <h1 className="mt-6 font-wordmark text-6xl font-medium leading-none tracking-tight text-[#f7f3ea] md:text-7xl">
            Talon Engineering
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-[#efeae0]/75">
            This part of the practice is not open yet. The page will describe the work when there is work to show.
          </p>
          <a
            href={contact}
            className="mt-10 inline-flex items-center justify-center border border-[#efeae0]/40 px-5 py-2.5 text-sm font-semibold text-[#f7f3ea] hover:bg-white/10"
          >
            Contact Talon Software
          </a>
        </div>
      </div>
      <footer className="border-t border-white/10 px-6 py-5 text-center text-xs text-[#efeae0]/50">
        © {new Date().getFullYear()} Talon Software · Vancouver, Washington ·{" "}
        <a href={privacy} className="underline hover:text-[#efeae0]">
          Privacy
        </a>
      </footer>
    </div>
  );
}
