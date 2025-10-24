"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Loader2, LogIn } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
      callbackUrl,
    });

    setSubmitting(false);

    if (result?.error) {
      setError("Unable to sign in with those details. Please try again.");
      return;
    }

    router.push(result?.url ?? callbackUrl);
  };

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <div className="flex flex-col gap-2 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--focus-soft)] text-[var(--focus)]">
          <LogIn className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">
          Welcome back
        </h1>
        <p className="text-sm text-[var(--muted)]">
          Sign in to access your focus tasks and session history.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--muted)]" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)] shadow-sm focus:border-[var(--focus)] focus:outline-none"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--muted)]" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)] shadow-sm focus:border-[var(--focus)] focus:outline-none"
          />
        </div>
        {error ? (
          <div className="rounded-2xl border border-red-300/70 bg-red-50/80 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </div>
        ) : null}
        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--focus)] px-6 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-[var(--focus)]/90 disabled:opacity-70"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
          Sign in
        </button>
      </form>

      <p className="text-center text-sm text-[var(--muted)]">
        Need an account?{" "}
        <Link className="font-medium text-[var(--focus)] hover:underline" href="/register">
          Create one now
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex max-w-md flex-col gap-6">
          <div className="flex items-center justify-center rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-10 text-sm text-[var(--muted)] shadow-sm">
            Preparing sign-in form…
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
