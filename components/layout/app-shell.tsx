"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Sprout, Timer, Calendar } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { OnboardingGuide } from "@/components/tutorial/onboarding-guide";
import { UserMenu } from "@/components/layout/user-menu";
import { LoginPrompt } from "@/components/layout/login-prompt";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Timer", href: "/timer", icon: Timer },
  { name: "Planner", href: "/tasks", icon: Calendar },
];

function NavItem({
  href,
  name,
  icon: Icon,
  isActive,
}: {
  href: string;
  name: string;
  icon: typeof LayoutDashboard;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
        isActive
      ? "bg-[var(--surface)] text-[var(--focus)] shadow-md"
          : "text-[var(--muted)] hover:text-[var(--foreground)]"
      }`}
    >
      <Icon className="h-4 w-4" />
      <span>{name}</span>
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="absolute inset-x-0 top-0 -z-10 h-64 bg-gradient-to-b from-[var(--focus-soft)]/50 to-transparent dark:from-[var(--focus-soft)]/30" />
      <div className="mx-auto flex min-h-screen w-full flex-col gap-6 px-4 pb-10 pt-8 sm:px-6 lg:px-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--surface)] shadow-sm">
              <Sprout className="h-6 w-6 text-[var(--focus)]" />
            </div>
            <div>
              <p className="text-sm uppercase tracking-wide text-[var(--muted)]">
                Cultivate Focus
              </p>
              <h1 className="text-2xl font-semibold text-[var(--foreground)]">
                Grow mindful productivity
              </h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <nav className="flex flex-wrap items-center gap-2 rounded-full bg-[var(--surface-muted)]/40 p-1">
              {navigation.map((item) => (
                <NavItem
                  key={item.href}
                  href={item.href}
                  name={item.name}
                  icon={item.icon}
                  isActive={pathname === item.href}
                />
              ))}
            </nav>
            <OnboardingGuide />
            <ThemeToggle />
            <UserMenu />
          </div>
        </header>
        <LoginPrompt />
        <main className="flex-1">
          <div
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm sm:p-6 dark:border-[var(--surface-muted)]/40"
          >
            {children}
          </div>
        </main>
        <footer className="text-sm text-[var(--muted)]">
          © {new Date().getFullYear()} Cultivate Focus. Mindful progress, one session at a time.
        </footer>
      </div>
    </div>
  );
}
