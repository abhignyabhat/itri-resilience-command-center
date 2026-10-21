"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Configure", href: "/configure" },
  { label: "History", href: "/history" },
];

export function Navbar() {
  const pathname = usePathname();
  const [userOpen, setUserOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-gradient-to-r from-itri-950 via-itri-900 to-[#064d78] text-white shadow-sm">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-4 px-4 sm:px-6">
        <Link href="/dashboard" aria-label="ITRI home" className="flex shrink-0 items-center gap-3">
          <Image src="/itri-logo.png" alt="ITRI" width={100} height={36} priority className="h-9 w-auto object-contain" />
          <span className="hidden h-7 w-px bg-white/70 sm:block" />
          <span className="hidden whitespace-nowrap text-sm font-semibold tracking-wide sm:block md:text-base">
            IT Resilience Command Center
          </span>
        </Link>

        <nav aria-label="Main navigation" className="mr-auto flex h-full items-center gap-1 sm:gap-5">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex h-full items-center px-2 text-xs font-medium transition-colors hover:text-cyan-200 sm:px-3 sm:text-sm ${active ? "text-white" : "text-white/90"}`}
              >
                {item.label}
                {active && <span className="absolute inset-x-2 bottom-1 h-[3px] rounded-full bg-cyan-300 sm:inset-x-3" />}
              </Link>
            );
          })}
        </nav>

        <div className="ml-1 flex shrink-0 items-center gap-2 sm:ml-3 sm:gap-4">
          <button
            type="button"
            aria-label="Download report"
            title="Download report"
            className="grid size-9 place-items-center rounded-md border border-white/40 bg-white/5 text-white transition hover:bg-white/15"
          >
            <DownloadIcon />
          </button>

          <div className="relative">
            <button
              type="button"
              aria-expanded={userOpen}
              aria-haspopup="true"
              onClick={() => setUserOpen((open) => !open)}
              className="flex items-center gap-2 rounded-md px-1 py-1 text-sm hover:bg-white/10"
            >
              <span className="grid size-8 place-items-center rounded-full bg-white text-xs font-bold text-itri-800">AB</span>
              <span className="hidden whitespace-nowrap md:block">Abhignya Bhat</span>
              <ChevronIcon open={userOpen} />
            </button>
            {userOpen && (
              <div className="absolute right-0 top-full mt-2 min-w-48 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-800 shadow-xl">
                <p className="font-semibold">Abhignya Bhat</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function DownloadIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v11m0 0 4-4m-4 4-4-4" /><path d="M4 16v4h16v-4" /></svg>;
}

function ChevronIcon({ open }: { open: boolean }) {
  return <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m5 7.5 5 5 5-5" /></svg>;
}
