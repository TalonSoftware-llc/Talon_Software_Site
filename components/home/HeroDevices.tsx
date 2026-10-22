import { AskThread, StatusCluster } from "./snippets";

export default function HeroDevices() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <div className="absolute -right-6 top-6 w-[640px] sm:w-[720px] lg:-right-10 lg:top-10 lg:w-[780px]" style={{ transform: "perspective(1600px) rotateY(-18deg) rotateX(8deg) rotateZ(-2deg)" }}>
        <div className="rounded-[1.6rem] border border-white/10 bg-[#161d27] p-2.5 shadow-[0_50px_90px_-30px_rgba(0,0,0,0.75)]">
          <div className="overflow-hidden rounded-[1.1rem] bg-[#f3f5f7]">
            <div className="flex items-center gap-2 bg-[#1b2430] px-4 py-2.5 text-white/70">
              <span className="font-wordmark text-lg leading-none text-white">Talon</span>
              <span className="text-[10px]">Pro</span>
            </div>
            <div className="grid grid-cols-[7.5rem_minmax(0,1fr)_9.5rem]">
              <div className="space-y-1 bg-[#1b2430] px-3 py-3 text-[11px] text-white/55">
                {["Home", "People", "Requests", "Changes", "Spending", "Report"].map((item) => (
                  <p key={item} className={item === "Home" ? "font-semibold text-white" : ""}>{item}</p>
                ))}
              </div>
              <div className="p-3">
                <StatusCluster procore="Up" />
              </div>
              <div className="border-l border-[#e1e6ec] bg-white p-2">
                <AskThread />
              </div>
            </div>
          </div>
        </div>
        <div className="mx-auto h-3 w-[94%] rounded-b-xl bg-[#243041]" />
        <div className="mx-auto h-1.5 w-[38%] rounded-b-lg bg-[#334155]" />
      </div>
      <div className="absolute bottom-6 left-2 w-[168px] sm:bottom-10 sm:left-6 lg:bottom-16 lg:left-0" style={{ transform: "perspective(900px) rotateY(-14deg) rotateZ(6deg)" }}>
        <div className="rounded-[1.7rem] border border-white/15 bg-[#121820] p-1.5 shadow-[0_24px_50px_-20px_rgba(0,0,0,0.8)]">
          <div className="overflow-hidden rounded-[1.3rem] bg-white px-2.5 pb-3 pt-2">
            <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-[#d5dde6]" />
            <AskThread />
          </div>
        </div>
      </div>
    </div>
  );
}
