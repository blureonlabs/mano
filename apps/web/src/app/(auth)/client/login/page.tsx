"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function ClientLoginPage() {
  return (
    <Suspense>
      <ClientLoginForm />
    </Suspense>
  );
}

function ClientLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/portal";
  const oauthError = searchParams.get("error") === "oauth";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    oauthError ? "OAuth sign-in failed. Please try again." : null
  );
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push(redirect);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-cream px-4">
      <div className="bg-white p-8 rounded-2xl border border-cream-300 shadow-sm max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-heading font-bold text-ink">
            Welcome back
          </h1>
          <p className="text-sm text-ink-lighter mt-1">
            Sign in to view your sessions
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs font-medium text-ink-light mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage text-sm transition-shadow"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-xs font-medium text-ink-light mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
              className="w-full px-3.5 py-2.5 rounded-xl border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage text-sm transition-shadow"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sage text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-sage-500 transition-all disabled:opacity-50 shadow-md shadow-sage/20"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-sm text-ink-lighter text-center">
          Don&apos;t have an account?{" "}
          <Link href="/client/signup" className="text-sage font-medium hover:underline">
            Sign up
          </Link>
        </p>

        <div className="border-t border-cream-300 pt-4">
          <p className="text-xs text-ink-lighter text-center">
            Are you a therapist?{" "}
            <Link href="/login" className="text-sage font-medium hover:underline">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
