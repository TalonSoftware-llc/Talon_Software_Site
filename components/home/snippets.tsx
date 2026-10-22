function pill(state: "Up" | "Slow" | "Down" | "Protected"): string {
  if (state === "Down") return "bg-[#f8e8e6] text-[#7a3030]";
  if (state === "Slow") return "bg-[#f8f1de] text-[#6d5420]";
  return "bg-[#e7f3ef] text-[#1f4d45]";
}

export function StatusPill({ children, state }: { children: string; state: "Up" | "Slow" | "Down" | "Protected" }) {
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${pill(state)}`}>{children}</span>;
}

function MiniBars({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  return (
    <div className="mt-2 flex h-7 items-end gap-1" aria-hidden="true">
      {values.map((value) => (
        <div key={value} className="min-w-0 flex-1 rounded-sm bg-pine/80" style={{ height: `${Math.max(14, (value / max) * 100)}%` }} />
      ))}
    </div>
  );
}

export function StatusCluster({ dense = false }: { dense?: boolean }) {
  return (
    <div className={`grid grid-cols-2 items-start gap-2 ${dense ? "" : "gap-3"}`}>
      <article className="rounded-lg border border-[#e1e6ec] bg-white p-3 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/45">Website</h3>
          <StatusPill state="Up">Up</StatusPill>
        </div>
        <MiniBars values={[8, 12, 9, 14, 11, 16]} />
      </article>
      <article className="rounded-lg border border-[#e1e6ec] bg-white p-3 shadow-sm">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/45">Network</h3>
        <ul className="mt-2 space-y-1 text-xs">
          {["Office", "Yard", "Job trailer"].map((name) => (
            <li key={name} className="flex items-center justify-between gap-2">
              <span>{name}</span>
              <StatusPill state="Up">Up</StatusPill>
            </li>
          ))}
        </ul>
      </article>
      <article className="rounded-lg border border-[#e1e6ec] bg-white p-3 shadow-sm">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/45">Systems</h3>
        <ul className="mt-2 space-y-1 text-xs">
          <li className="flex items-center justify-between gap-2"><span>Email</span><StatusPill state="Up">Up</StatusPill></li>
          <li className="flex items-center justify-between gap-2"><span>Procore</span><StatusPill state="Slow">Slow</StatusPill></li>
          <li className="flex items-center justify-between gap-2"><span>Endpoints</span><StatusPill state="Protected">Protected</StatusPill></li>
        </ul>
      </article>
      <article className="rounded-lg border border-[#e1e6ec] bg-white p-3 shadow-sm">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/45">Support</h3>
        <p className="mt-2 text-2xl font-semibold tabular-nums">6</p>
        <p className="text-xs text-ink/55">Open</p>
      </article>
    </div>
  );
}

const slices = [
  { name: "Retainer", share: 42, color: "#1f4d45" },
  { name: "Software", share: 28, color: "#1b2430" },
  { name: "Cloud", share: 18, color: "#3e7c6f" },
  { name: "Security", share: 12, color: "#c4a574" },
];

const rings = slices.map((slice, index) => ({
  ...slice,
  offset: slices.slice(0, index).reduce((sum, item) => sum + item.share, 0),
}));

export function SpendDonut({ size = 128 }: { size?: number }) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <svg width={size} height={size} viewBox="0 0 36 36" aria-hidden="true" className="shrink-0">
        <circle cx="18" cy="18" r="14" fill="none" stroke="#eef2f5" strokeWidth="5" />
        {rings.map((slice) => (
          <circle
            key={slice.name}
            cx="18"
            cy="18"
            r="14"
            fill="none"
            stroke={slice.color}
            strokeWidth="5"
            strokeLinecap="butt"
            pathLength="100"
            strokeDasharray={`${slice.share} ${100 - slice.share}`}
            strokeDashoffset={-slice.offset}
            transform="rotate(-90 18 18)"
          />
        ))}
        <circle cx="18" cy="18" r="8.5" fill="white" />
      </svg>
      <ul className="min-w-[8rem] space-y-1 text-xs">
        {slices.map((slice) => (
          <li key={slice.name} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: slice.color }} />
            <span className="min-w-0 flex-1 font-semibold">{slice.name}</span>
            <span className="tabular-nums text-ink/55">{slice.share}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function RenewalList() {
  const rows = [
    ["Microsoft", "Jan 15"],
    ["Phones", "Dec 1"],
    ["Sage", "Dec 1"],
  ];
  return (
    <ul className="mt-4 divide-y divide-[#eef2f5] text-sm">
      {rows.map(([name, when]) => (
        <li key={name} className="flex items-center justify-between gap-3 py-2">
          <span className="font-semibold">{name}</span>
          <span className="tabular-nums text-ink/55">{when}</span>
        </li>
      ))}
    </ul>
  );
}

export function AskThread({ long = false }: { long?: boolean }) {
  return (
    <div className="flex h-full flex-col rounded-lg border border-[#e1e6ec] bg-white p-3 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/45">Ask</p>
      <div className="mt-3 space-y-2 text-sm">
        <p className="ml-6 rounded-lg bg-[#eef2f5] px-3 py-2">Is email up?</p>
        <p className="mr-4 rounded-lg bg-[#e7f3ef] px-3 py-2 text-ink">Email is up. Procore is slow.</p>
        {long ? <p className="ml-6 rounded-lg bg-[#eef2f5] px-3 py-2">What changed this month?</p> : null}
        {long ? <p className="mr-4 rounded-lg bg-[#e7f3ef] px-3 py-2 text-ink">Four changes. The latest is the restore list.</p> : null}
      </div>
      <div className="mt-auto pt-3">
        <div className="rounded-md border border-[#d5dde6] px-3 py-2 text-xs text-ink/40">Ask anything</div>
      </div>
    </div>
  );
}

export function OnboardSnippet() {
  const fields = [
    ["Name", "New hire"],
    ["Role", "Superintendent"],
    ["Start", "Nov 2"],
  ];
  return (
    <div className="mock-lift rounded-xl border border-[#e1e6ec] bg-white shadow-[0_16px_40px_-24px_rgba(27,36,48,0.55)]" aria-hidden="true">
      <div className="flex items-center justify-between border-b border-[#eef2f5] px-4 py-3">
        <p className="text-sm font-semibold">Onboard user</p>
        <span className="text-ink/35">×</span>
      </div>
      <div className="space-y-3 p-4">
        {fields.map(([label, value]) => (
          <div key={label}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/45">{label}</p>
            <div className="mt-1 rounded-md border border-[#d5dde6] px-3 py-2 text-sm">{value}</div>
          </div>
        ))}
        <div className="inline-flex rounded-md bg-pine px-3 py-2 text-sm font-semibold text-white">Create account</div>
      </div>
    </div>
  );
}

export function ChangesSnippet() {
  const rows = [
    ["Oct 21", "Restore list", "Talon", "Systems"],
    ["Oct 18", "Field tablets", "Talon", "Accounts"],
    ["Oct 11", "Job-cost export", "Automation", "Systems"],
    ["Oct 2", "Yard phones", "Talon", "Network"],
  ];
  return (
    <div className="mock-lift rounded-xl border border-[#e1e6ec] bg-white p-4 shadow-sm" aria-hidden="true">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/45">Changes</p>
      <ul className="mt-3 divide-y divide-[#eef2f5]">
        {rows.map(([day, title, who, category]) => (
          <li key={title} className="flex items-baseline justify-between gap-3 py-2 text-sm">
            <span className="font-semibold">{title}</span>
            <span className="shrink-0 text-xs text-ink/55">{day} · {who} · {category}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ReportSnippet() {
  return (
    <div className="mock-lift rounded-xl border border-[#e1e6ec] bg-white p-4 shadow-sm" aria-hidden="true">
      <div className="flex items-end justify-between">
        <p className="font-serif text-xl text-ink">Report</p>
        <p className="text-sm font-semibold text-ink/50">October</p>
      </div>
      <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/45">Systems</p>
      <div className="mt-2 flex flex-wrap gap-2 text-xs">
        <span>Website <StatusPill state="Up">Up</StatusPill></span>
        <span>Email <StatusPill state="Up">Up</StatusPill></span>
        <span>Procore <StatusPill state="Slow">Slow</StatusPill></span>
      </div>
      <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/45">Changes this month</p>
      <ul className="mt-2 space-y-1 text-sm">
        <li className="flex justify-between gap-3"><span className="font-semibold">Restore list</span><span className="text-ink/55">Oct 21 · Talon</span></li>
        <li className="flex justify-between gap-3"><span className="font-semibold">Sage sync key</span><span className="text-ink/55">Oct 20 · Talon</span></li>
      </ul>
    </div>
  );
}
