"use client";

import { type ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { FocusProvider } from "@/context/focus-context";
import { ThemeProvider } from "./theme-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <FocusProvider>
        <AppShell>{children}</AppShell>
      </FocusProvider>
    </ThemeProvider>
  );
}
