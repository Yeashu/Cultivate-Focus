"use client";

import type { ReactNode } from "react";
import { TopBar } from "@/components/layout/top-bar";
import { LoginPrompt } from "@/components/layout/login-prompt";

export default function PlannerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)] text-[var(--foreground)]">
      <TopBar />
      <LoginPrompt />
      <main className="flex flex-1 flex-col overflow-hidden">{children}</main>
    </div>
  );
}
