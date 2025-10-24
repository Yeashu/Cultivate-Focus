"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { Loader2, LogOut, User } from "lucide-react";
import { useState } from "react";

export function UserMenu() {
  const { data, status } = useSession();
  const [signingOut, setSigningOut] = useState(false);

  if (status === "loading") {
    return (
      <div className="flex h-10 items-center gap-2 rounded-full border border-[var(--border)] px-4 text-sm text-[var(--muted)]">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading…
      </div>
    );
  }

  if (status !== "authenticated" || !data?.user) {
    return (
      <Link
        href="/login"
        className="flex h-10 items-center gap-2 rounded-full border border-[var(--border)] px-4 text-sm font-semibold text-[var(--foreground)] transition-colors hover:border-[var(--foreground)]"
      >
        <User className="h-4 w-4" />
        Sign in
      </Link>
    );
  }

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut({ callbackUrl: "/login" });
    setSigningOut(false);
  };

  return (
    <div className="flex items-center gap-3 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm shadow-sm">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--focus-soft)] text-[var(--focus)]">
          <User className="h-4 w-4" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="font-semibold text-[var(--foreground)]">
            {data.user.name ?? "Focused Friend"}
          </span>
          <span className="text-xs text-[var(--muted)]">{data.user.email}</span>
        </div>
      </div>
      <button
        type="button"
        onClick={handleSignOut}
        disabled={signingOut}
        className="flex items-center gap-2 rounded-full bg-[var(--surface-muted)]/60 px-3 py-1 text-xs font-semibold text-[var(--muted)] transition-colors hover:text-[var(--foreground)] disabled:opacity-70"
      >
        {signingOut ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
        Sign out
      </button>
    </div>
  );
}
