"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Cloud, X } from "lucide-react";

export function LoginPrompt() {
  const { status } = useSession();
  const [dismissed, setDismissed] = useState(false);

  if (status !== "unauthenticated" || dismissed) {
    return null;
  }

  return (
    <div className="mb-6 flex flex-col gap-3 rounded-3xl border border-[var(--border)] bg-[var(--surface-muted)]/60 p-4 text-sm text-[var(--muted)] shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-5">
      <div className="flex items-start gap-3 text-left sm:items-center">
        <Cloud className="mt-1 h-5 w-5 text-[var(--primary)] sm:mt-0" />
        <div>
          <p className="font-medium text-[var(--text-strong)]">
            You&apos;re working offline
          </p>
          <p className="mt-1 text-[var(--muted)]">
            Sign in to sync your focus goals and sessions across every device.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 self-start sm:self-auto">
        <Link
          href="/login"
          className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-[var(--primary-contrast)] shadow-sm transition hover:bg-[var(--primary-accent)]"
        >
          Sign in
        </Link>
        <Link
          href="/register"
          className="rounded-full border border-[var(--border-strong)] px-4 py-2 text-sm font-semibold text-[var(--text-strong)] transition hover:bg-[var(--surface)]"
        >
          Create account
        </Link>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="ml-1 inline-flex h-9 w-9 items-center justify-center rounded-full border border-transparent text-[var(--muted)] transition hover:border-[var(--border)] hover:text-[var(--text-strong)]"
          aria-label="Dismiss prompt"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
