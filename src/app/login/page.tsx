"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { getLoginDemoHints } from "@/lib/demo-login-hints";

const demoHints = getLoginDemoHints({
  nodeEnv: process.env.NODE_ENV,
  allowDemoLoginHint:
    process.env.NEXT_PUBLIC_ALLOW_DEMO_LOGIN_HINT ??
    process.env.ALLOW_DEMO_LOGIN_HINT,
});

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const result = await authClient.signIn.email({
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    });
    setPending(false);
    if (result.error) {
      setError(result.error.message || "Could not sign in.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4">
      <p className="text-sm font-medium uppercase tracking-wide text-amber-800">
        JobLedger
      </p>
      <h1 className="mt-2 text-3xl font-semibold">Sign in</h1>
      <p className="mt-2 text-stone-600">
        Track job costs. You stay in control of every assignment.
      </p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <label className="block">
          <span className="text-sm font-medium">Email</span>
          <input
            className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-3"
            name="email"
            type="email"
            autoComplete="username"
            defaultValue={demoHints.email}
            required
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Password</span>
          <input
            className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-3"
            name="password"
            type="password"
            autoComplete="current-password"
            defaultValue={demoHints.password}
            required
          />
        </label>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <button
          className="w-full rounded-lg bg-amber-800 px-4 py-3 font-medium text-white disabled:opacity-60"
          type="submit"
          disabled={pending}
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
      {demoHints.showHint && demoHints.hintText ? (
        <p className="mt-6 text-sm text-stone-500">{demoHints.hintText}</p>
      ) : null}
    </main>
  );
}
