"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();

    // 1. Sign up with Supabase Auth
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (!data.user) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
      return;
    }

    // Therapist profile is auto-created by database trigger (handle_new_user)
    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="bg-card p-8 rounded-card shadow-sm max-w-md w-full space-y-6">
        <h1 className="text-2xl font-heading font-bold text-center">
          Create your account
        </h1>
        <p className="text-ink-light text-center">
          Start managing your practice with Mano
        </p>

        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-small text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <input
            type="text"
            placeholder="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-small border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage"
          />
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
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-3 rounded-small border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sage text-white py-3 rounded-small font-medium hover:bg-sage-500 transition-colors disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="text-sm text-ink-lighter text-center">
          Already have an account?{" "}
          <a href="/login" className="text-sage font-medium">
            Sign in
          </a>
        </p>
      </div>
    </main>
  );
}
