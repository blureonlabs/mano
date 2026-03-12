"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
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
    <main className="min-h-screen flex items-center justify-center">
      <div className="bg-card p-8 rounded-card shadow-sm max-w-md w-full space-y-6">
        <h1 className="text-2xl font-heading font-bold text-center">
          Welcome back
        </h1>
        <p className="text-ink-light text-center">
          Sign in to your Mano dashboard
        </p>

        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-small text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-small border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-small border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sage text-white py-3 rounded-small font-medium hover:bg-sage-500 transition-colors disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-sm text-ink-lighter text-center">
          Don&apos;t have an account?{" "}
          <a href="/signup" className="text-sage font-medium">
            Sign up
          </a>
        </p>
      </div>
    </main>
  );
}
