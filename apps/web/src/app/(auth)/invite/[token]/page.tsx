"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import Image from "next/image";
import { Shield, ShieldAlert } from "lucide-react";

const LOGO_URL =
  "https://bjodimpnpwuuoogwufso.supabase.co/storage/v1/object/public/assets/logo.webp?v=2";

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

export default function InvitePage({ params }: InvitePageProps) {
  const { token } = use(params);
  const router = useRouter();

  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setAuthEmail(data.user?.email ?? null);
      setAuthChecked(true);
    });
  }, []);

  const invitation = trpc.practice.getInvitationByToken.useQuery(
    { token },
    { retry: false }
  );

  const acceptInvitation = trpc.practice.acceptInvitation.useMutation({
    onSuccess: () => {
      router.push("/dashboard/team");
    },
  });

  if (invitation.isLoading || !authChecked) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-cream px-4">
        <div className="bg-white p-8 rounded-2xl border border-cream-300 shadow-sm max-w-md w-full space-y-6">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-cream-200 animate-pulse" />
            <div className="h-5 w-48 bg-cream-200 rounded-lg animate-pulse" />
            <div className="h-4 w-32 bg-cream-200 rounded-lg animate-pulse" />
          </div>
        </div>
      </main>
    );
  }

  if (!invitation.data || invitation.data.status !== "pending") {
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
            Invalid invitation
          </h2>
          <p className="text-sm text-ink-lighter">
            This invitation link is invalid, expired, or has already been used.
          </p>
          <Link
            href="/login"
            className="inline-block text-sm text-sage font-medium hover:underline"
          >
            Go to login
          </Link>
        </div>
      </main>
    );
  }

  const inv = invitation.data;
  const isExpired = new Date(inv.expires_at) < new Date();
  const RoleIcon = inv.role === "admin" ? ShieldAlert : Shield;

  if (isExpired) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-cream px-4">
        <div className="bg-white p-8 rounded-2xl border border-cream-300 shadow-sm max-w-md w-full space-y-4 text-center">
          <h2 className="text-lg font-heading font-semibold text-ink">
            Invitation expired
          </h2>
          <p className="text-sm text-ink-lighter">
            This invitation has expired. Please ask the practice owner for a new link.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-cream px-4">
      <div className="bg-white p-8 rounded-2xl border border-cream-300 shadow-sm max-w-md w-full space-y-6">
        <div className="text-center space-y-4">
          <Image
            src={LOGO_URL}
            alt="Mano"
            width={48}
            height={48}
            className="rounded-full mx-auto"
          />
          <div>
            <h1 className="text-xl font-heading font-bold text-ink">
              Join {inv.practice_name}
            </h1>
            <p className="text-sm text-ink-lighter mt-1">
              You&apos;ve been invited to join as a team member.
            </p>
          </div>
        </div>

        {/* Invitation details */}
        <div className="bg-cream-50 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-sage-50 flex items-center justify-center">
              <RoleIcon size={18} className="text-sage" />
            </div>
            <div>
              <div className="text-sm font-medium text-ink capitalize">{inv.role}</div>
              <div className="text-xs text-ink-lighter">
                {inv.can_view_notes ? "Can view client notes" : "No notes access"}
              </div>
            </div>
          </div>
        </div>

        {authEmail ? (
          <div className="space-y-4">
            <p className="text-sm text-ink-lighter text-center">
              Logged in as <span className="font-medium text-ink">{authEmail}</span>
            </p>

            {acceptInvitation.error && (
              <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm">
                {acceptInvitation.error.message}
              </div>
            )}

            <button
              type="button"
              onClick={() => acceptInvitation.mutate({ token })}
              disabled={acceptInvitation.isPending}
              className="w-full bg-sage text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-sage-500 transition-all disabled:opacity-50 shadow-md shadow-sage/20"
            >
              {acceptInvitation.isPending ? "Joining..." : "Accept & Join"}
            </button>
          </div>
        ) : (
          <div className="space-y-4 text-center">
            <p className="text-sm text-ink-lighter">
              Sign in or create an account to accept this invitation.
            </p>
            <div className="flex gap-3">
              <Link
                href={`/login?redirect=${encodeURIComponent(`/invite/${token}`)}`}
                className="flex-1 bg-sage text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-sage-500 transition-all text-center shadow-md shadow-sage/20"
              >
                Sign In
              </Link>
              <Link
                href={`/signup?redirect=${encodeURIComponent(`/invite/${token}`)}`}
                className="flex-1 border border-cream-300 text-ink py-2.5 rounded-xl text-sm font-semibold hover:bg-cream-50 transition-all text-center"
              >
                Sign Up
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
