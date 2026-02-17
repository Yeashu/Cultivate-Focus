"use client";

import { type ReactNode } from "react";
import { FocusProvider } from "@/context/focus-context";
import { AuthSessionProvider } from "./session-provider";
import { ThemeProvider } from "./theme-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthSessionProvider>
        <FocusProvider>{children}</FocusProvider>
      </AuthSessionProvider>
    </ThemeProvider>
  );
}
