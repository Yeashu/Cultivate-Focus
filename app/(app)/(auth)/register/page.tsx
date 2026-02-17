"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, UserPlus } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.message ?? "Could not create your account.");
      setSubmitting(false);
      return;
    }

    const signInResult = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    setSubmitting(false);

    if (signInResult?.error) {
      router.push("/login");
      return;
    }

    router.push("/");
  };

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <div className="flex flex-col gap-2 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--focus-soft)] text-[var(--focus)]">
          <UserPlus className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">
          Create your Cultivate Focus account
        </h1>
        <p className="text-sm text-[var(--muted)]">
          Track your sessions securely by signing up with email and password.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--muted)]" htmlFor="name">
            Name (optional)
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)] shadow-sm focus:border-[var(--focus)] focus:outline-none"
          />
        </div>
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
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)] shadow-sm focus:border-[var(--focus)] focus:outline-none"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--muted)]" htmlFor="confirm-password">
            Confirm password
          </label>
          <input
            id="confirm-password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
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
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          Create account
        </button>
      </form>

      <p className="text-center text-sm text-[var(--muted)]">
        Already registered?{" "}
        <Link className="font-medium text-[var(--focus)] hover:underline" href="/login">
          Sign in instead
        </Link>
      </p>
    </div>
  );
}
