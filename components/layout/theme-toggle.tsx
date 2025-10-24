"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isReady = typeof resolvedTheme === "string";
  const isDark = resolvedTheme === "dark";

  if (!isReady) {
    return (
      <button
        aria-label="Toggle theme"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-muted)]/60 text-[var(--muted)] transition-colors"
        type="button"
      >
        <Sun className="h-5 w-5" />
      </button>
    );
  }

  return (
    <button
      aria-label="Toggle theme"
      className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-muted)]/60 text-[var(--foreground)] shadow-sm transition-all hover:shadow-md"
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
