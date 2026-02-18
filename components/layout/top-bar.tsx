"use client";

import Link from "next/link";
import { LayoutDashboard, Sprout, Timer } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { OnboardingGuide } from "@/components/tutorial/onboarding-guide";
import { UserMenu } from "@/components/layout/user-menu";

export function TopBar() {
  return (
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
        <Link
          href="/dashboard"
          className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--muted)] transition-colors hover:bg-[var(--surface-muted)]/60 hover:text-[var(--foreground)]"
          aria-label="Dashboard"
        >
          <LayoutDashboard className="h-4 w-4" />
        </Link>
        <OnboardingGuide />
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
