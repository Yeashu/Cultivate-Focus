"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { LayoutDashboard, Sprout, Timer } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { OnboardingGuide } from "@/components/tutorial/onboarding-guide";
import { UserMenu } from "@/components/layout/user-menu";

const DashboardSidebar = dynamic(
  () =>
    import("@/components/dashboard/dashboard-sidebar").then(
      (mod) => mod.DashboardSidebar
    ),
  { ssr: false }
);

export function TopBar() {
  const pathname = usePathname();
  const isPlanner = pathname === "/";

  const [statsOpen, setStatsOpen] = useState(false);
  const openStats = useCallback(() => setStatsOpen(true), []);
  const closeStats = useCallback(() => setStatsOpen(false), []);

  return (
    <>
      <header className="flex items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface)] shadow-sm">
            <Sprout className="h-5 w-5 text-[var(--focus)]" />
          </div>
          <span className="text-sm font-medium text-[var(--muted)]">
            Cultivate Focus
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/timer"
            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--muted)] transition-colors hover:bg-[var(--surface-muted)]/60 hover:text-[var(--foreground)]"
            aria-label="Timer"
          >
            <Timer className="h-4 w-4" />
          </Link>

          {isPlanner ? (
            <button
              onClick={openStats}
              className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                statsOpen
                  ? "bg-[var(--focus-soft)] text-[var(--focus)]"
                  : "text-[var(--muted)] hover:bg-[var(--surface-muted)]/60 hover:text-[var(--foreground)]"
              }`}
              aria-label="Open garden stats"
              aria-expanded={statsOpen}
            >
              <LayoutDashboard className="h-4 w-4" />
            </button>
          ) : (
            <Link
              href="/dashboard"
              className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--muted)] transition-colors hover:bg-[var(--surface-muted)]/60 hover:text-[var(--foreground)]"
              aria-label="Dashboard"
            >
              <LayoutDashboard className="h-4 w-4" />
            </Link>
          )}

          <OnboardingGuide />
          <ThemeToggle />
          <UserMenu />
        </div>
      </header>

      {isPlanner && (
        <DashboardSidebar isOpen={statsOpen} onClose={closeStats} />
      )}
    </>
  );
}
