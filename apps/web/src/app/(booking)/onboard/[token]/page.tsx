"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import Link from "next/link";

const LOGO_URL =
  "https://bjodimpnpwuuoogwufso.supabase.co/storage/v1/object/public/assets/logo.webp?v=2";

interface OnboardPageProps {
  params: Promise<{ token: string }>;
}

export default function OnboardPage({ params }: OnboardPageProps) {
  const { token } = use(params);
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const tokenData = trpc.onboarding.getByToken.useQuery(
    { token },
    { retry: false }
  );

  const registerClient = trpc.onboarding.registerClient.useMutation();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1. Create client record via onboarding endpoint
      await registerClient.mutateAsync({
        token,
        full_name: fullName,
        email,
        phone: phone || undefined,
      });

      // 2. Create Supabase auth account as client
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            user_type: "client",
            phone: phone || undefined,
          },
        },
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }

    setLoading(false);
  }

  if (tokenData.isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-cream px-4">
        <div className="bg-white p-8 rounded-2xl border border-cream-300 shadow-sm max-w-md w-full space-y-6">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-cream-200 animate-pulse" />
            <div className="h-5 w-48 bg-cream-200 rounded-lg animate-pulse" />
          </div>
        </div>
      </main>
    );
  }

  if (!tokenData.data || !tokenData.data.is_usable) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-cream px-4">
        <div className="bg-white p-8 rounded-2xl border border-cream-300 shadow-sm max-w-md w-full space-y-4 text-center">
          <div className="w-14 h-14 rounded-full bg-cream-200 mx-auto flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ink-lighter">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <h2 className="text-lg font-heading font-semibold text-ink">
            Link unavailable
          </h2>
          <p className="text-sm text-ink-lighter">
            This onboarding link is no longer active or has expired.
          </p>
        </div>
      </main>
    );
  }

  const t = tokenData.data;

  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-cream px-4">
        <div className="bg-white p-8 rounded-2xl border border-cream-300 shadow-sm max-w-md w-full space-y-6 text-center">
          <div className="w-14 h-14 rounded-full bg-sage-50 mx-auto flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-sage">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-heading font-semibold text-ink">
              Welcome, {fullName.split(" ")[0]}!
            </h2>
            <p className="text-sm text-ink-lighter mt-1">
              Your account has been created. You can now view your sessions and intake forms.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Link
              href="/portal"
              className="w-full bg-sage text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-sage-500 transition-all text-center shadow-md shadow-sage/20"
            >
              Go to your portal
            </Link>
            {t.therapist_slug && (
              <Link
                href={`/booking/${t.therapist_slug}`}
                className="w-full border border-cream-300 text-ink py-2.5 rounded-xl text-sm font-semibold hover:bg-cream-50 transition-all text-center"
              >
                Book a session
              </Link>
            )}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-cream px-4">
      <div className="bg-white p-8 rounded-2xl border border-cream-300 shadow-sm max-w-md w-full space-y-6">
        <div className="text-center space-y-4">
          {t.therapist_avatar ? (
            <Image
              src={t.therapist_avatar}
              alt={t.therapist_name}
              width={64}
              height={64}
              className="rounded-full mx-auto ring-4 ring-white shadow-md"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-sage-50 ring-4 ring-white shadow-md mx-auto flex items-center justify-center">
              <Image
                src={LOGO_URL}
                alt="Mano"
                width={32}
                height={32}
                className="rounded-full"
              />
            </div>
          )}
          <div>
            <h1 className="text-xl font-heading font-bold text-ink">
              Register with {t.therapist_name}
            </h1>
            <p className="text-sm text-ink-lighter mt-1">
              Create your account to get started
            </p>
            {t.label && (
              <p className="text-xs text-ink-lighter mt-1">{t.label}</p>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="fullName" className="block text-xs font-medium text-ink-light mb-1.5">
              Full name
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              placeholder="Your full name"
              className="w-full px-3.5 py-2.5 rounded-xl border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage text-sm transition-shadow"
            />
          </div>
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
            <label htmlFor="phone" className="block text-xs font-medium text-ink-light mb-1.5">
              Phone <span className="text-ink-lighter">(optional)</span>
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
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
              minLength={6}
              placeholder="Min 6 characters"
              className="w-full px-3.5 py-2.5 rounded-xl border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage text-sm transition-shadow"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sage text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-sage-500 transition-all disabled:opacity-50 shadow-md shadow-sage/20"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="text-xs text-ink-lighter text-center">
          Already have an account?{" "}
          <Link href="/client/login" className="text-sage font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
