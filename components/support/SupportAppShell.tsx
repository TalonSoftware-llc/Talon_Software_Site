"use client";

import Link from "next/link";
import { createContext, useContext, useMemo, useState } from "react";
import { demoCompanies, defaultDemoCompanyId, type DemoCompany } from "@/lib/support/demo-data";

type NavItem = { href: string; path: string; label: string };

const DemoContext = createContext<DemoCompany | null>(null);

export function useDemoCompany(): DemoCompany {
  const company = useContext(DemoContext);
  if (!company) {
    throw new Error("Support demo screens render inside the app shell.");
  }
  return company;
}

export default function SupportAppShell({
  nav,
  currentPath,
  signInHref,
  children,
}: {
  nav: NavItem[];
  currentPath: string;
  signInHref: string;
  children: React.ReactNode;
}) {
  const [companyId, setCompanyId] = useState(defaultDemoCompanyId);
  const company = useMemo(
    () => demoCompanies.find((item) => item.id === companyId) ?? demoCompanies[0],
    [companyId]
  );

  return (
    <DemoContext.Provider value={company}>
      <div className="flex min-h-screen flex-col bg-[#eef1f5] text-ink">
        <p className="bg-[#f3e6c8] px-4 py-2 text-center text-sm text-[#5c4816]">
          Demo preview. Sample data for a fictional company. No one is signed in, and the sign-in screen does not
          save what was typed.
        </p>
        <div className="flex min-h-0 flex-1">
          <aside className="hidden w-60 shrink-0 flex-col border-r border-[#d7dee7] bg-white md:flex">
            <div className="px-5 py-5">
              <p className="font-wordmark text-2xl text-ink">Talon Support</p>
            </div>
            <nav className="flex flex-1 flex-col gap-1 px-3" aria-label="Workspace">
              {nav.map((item) => {
                const active = currentPath === item.path;
                return (
                  <Link
                    key={item.path}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`rounded-md px-3 py-2 text-sm ${active ? "bg-[#e7f0ee] font-semibold text-pine" : "text-ink/75 hover:bg-[#f4f6f8]"}`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-[#d7dee7] p-3">
              <Link href={signInHref} className="block rounded-md px-3 py-2 text-sm text-ink/60 hover:bg-[#f4f6f8]">
                Sign-in screen
              </Link>
            </div>
          </aside>
          <div className="flex min-w-0 flex-1 flex-col">
            <header className="flex items-center justify-between gap-4 border-b border-[#d7dee7] bg-white px-4 py-3 md:px-6">
              <label className="text-sm text-ink/70">
                <span className="mr-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink/40">Workspace</span>
                <select
                  value={company.id}
                  onChange={(event) => setCompanyId(event.target.value)}
                  className="rounded-md border border-[#d7dee7] bg-white px-2 py-1.5 text-sm font-medium text-ink"
                >
                  {demoCompanies.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <nav className="flex gap-3 md:hidden" aria-label="Workspace">
                {nav.map((item) => (
                  <Link key={item.path} href={item.href} className="text-xs font-semibold text-ink/70">
                    {item.label}
                  </Link>
                ))}
              </nav>
            </header>
            <div className="flex-1 px-4 py-6 md:px-8">{children}</div>
          </div>
        </div>
      </div>
    </DemoContext.Provider>
  );
}
