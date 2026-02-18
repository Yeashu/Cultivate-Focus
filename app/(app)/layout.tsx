"use client";

import type { ReactNode } from "react";
import { TopBar } from "@/components/layout/top-bar";
import { LoginPrompt } from "@/components/layout/login-prompt";
import { PageFooter } from "@/components/layout/page-footer";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="absolute inset-x-0 top-0 -z-10 h-64 bg-gradient-to-b from-[var(--focus-soft)]/50 to-transparent dark:from-[var(--focus-soft)]/30" />
      <div className="mx-auto flex min-h-screen w-full flex-col gap-6 px-4 pb-10 pt-8 sm:px-6 lg:px-10">
        <TopBar />
        <LoginPrompt />
        <main className="flex-1">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm sm:p-6 dark:border-[var(--surface-muted)]/40">
            {children}
          </div>
        </main>
        <PageFooter />
      </div>
    </div>
  );
}
