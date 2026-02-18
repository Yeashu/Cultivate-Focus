"use client";

import { type ReactNode } from "react";
import { FocusProvider } from "@/context/focus-context";
import { TimerProvider } from "@/context/timer-context";
import { FloatingTimerWidget } from "@/components/timer/floating-timer-widget";
import { AuthSessionProvider } from "./session-provider";
import { ThemeProvider } from "./theme-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthSessionProvider>
        <FocusProvider>
          <TimerProvider>
            {children}
            <FloatingTimerWidget />
          </TimerProvider>
        </FocusProvider>
      </AuthSessionProvider>
    </ThemeProvider>
  );
}
