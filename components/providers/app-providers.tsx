"use client";

import { type ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { FocusProvider } from "@/context/focus-context";
import { AuthSessionProvider } from "./session-provider";
import { ThemeProvider } from "./theme-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthSessionProvider>
        <FocusProvider>
          <AppShell>{children}</AppShell>
        </FocusProvider>
      </AuthSessionProvider>
    </ThemeProvider>
  );
}
