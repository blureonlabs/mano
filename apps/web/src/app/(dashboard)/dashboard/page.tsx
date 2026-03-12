"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Asia/Kolkata",
  });
}

export default function TodayPage() {
  const today = trpc.session.today.useQuery();
  const upcoming = trpc.session.upcoming.useQuery({ limit: 5 });
  const clients = trpc.clients.list.useQuery();
  const therapist = trpc.therapist.me.useQuery();

  const todayCount = today.data?.length ?? 0;
  const clientCount = clients.data?.length ?? 0;
  const greeting = getGreeting();

  function getGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  }

  if (today.isLoading) {
    return (
      <div className="max-w-3xl space-y-6">
        <div className="h-8 w-48 bg-cream-200 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-white rounded-2xl border border-cream-300 animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-white rounded-2xl border border-cream-300 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-ink">
          {greeting}{therapist.data ? `, ${therapist.data.display_name || therapist.data.full_name}` : ""}
        </h1>
        <p className="text-sm text-ink-lighter mt-1">
          {todayCount === 0
            ? "No sessions scheduled for today."
            : `You have ${todayCount} session${todayCount !== 1 ? "s" : ""} today.`}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-cream-300 shadow-sm p-5">
          <div className="text-xs font-semibold text-ink-lighter uppercase tracking-wider mb-1">
            Today
          </div>
          <div className="text-2xl font-heading font-bold text-ink">{todayCount}</div>
          <div className="text-xs text-ink-lighter">session{todayCount !== 1 ? "s" : ""}</div>
        </div>
        <div className="bg-white rounded-2xl border border-cream-300 shadow-sm p-5">
          <div className="text-xs font-semibold text-ink-lighter uppercase tracking-wider mb-1">
            Upcoming
          </div>
          <div className="text-2xl font-heading font-bold text-ink">{upcoming.data?.length ?? 0}</div>
          <div className="text-xs text-ink-lighter">scheduled</div>
        </div>
        <div className="bg-white rounded-2xl border border-cream-300 shadow-sm p-5">
          <div className="text-xs font-semibold text-ink-lighter uppercase tracking-wider mb-1">
            Clients
          </div>
          <div className="text-2xl font-heading font-bold text-ink">{clientCount}</div>
          <div className="text-xs text-ink-lighter">active</div>
        </div>
      </div>

      {/* Today's sessions */}
      <div className="bg-white rounded-2xl border border-cream-300 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-cream-300 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">Today&apos;s Sessions</h2>
          <Link href="/dashboard/schedule" className="text-xs text-sage font-medium hover:text-sage-600 transition-colors">
            View all &rarr;
          </Link>
        </div>

        {todayCount === 0 ? (
          <div className="px-6 py-10 text-center">
            <div className="w-12 h-12 rounded-full bg-cream-200 mx-auto mb-3 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ink-lighter">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <p className="text-sm text-ink-lighter">No sessions today</p>
            <p className="text-xs text-ink-lighter/60 mt-1">Enjoy your free day!</p>
          </div>
        ) : (
          <div className="divide-y divide-cream-300">
            {today.data?.map((session) => {
              const client = session.clients as { full_name: string; email: string | null; phone: string | null } | null;
              return (
                <div key={session.id} className="px-6 py-4 flex items-center justify-between hover:bg-cream-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-sage-50 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-sage">
                        {client?.full_name?.charAt(0)?.toUpperCase() ?? "?"}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-ink">
                        {client?.full_name ?? "Unknown"}
                      </div>
                      <div className="text-xs text-ink-lighter">
                        {formatTime(session.starts_at)} &ndash; {formatTime(session.ends_at)} &middot; {session.duration_mins} min
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {session.zoom_join_url && (
                      <a
                        href={session.zoom_join_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-medium hover:bg-blue-100 transition-colors"
                      >
                        Join
                      </a>
                    )}
                    <span className={`px-2.5 py-1 rounded-pill text-xs font-medium ${
                      session.status === "scheduled"
                        ? "bg-sage-50 text-sage"
                        : session.status === "completed"
                        ? "bg-cream-200 text-ink-lighter"
                        : "bg-amber-50 text-amber"
                    }`}>
                      {session.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upcoming sessions */}
      {(upcoming.data?.length ?? 0) > 0 && (
        <div className="bg-white rounded-2xl border border-cream-300 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-cream-300">
            <h2 className="text-sm font-semibold text-ink">Upcoming</h2>
          </div>
          <div className="divide-y divide-cream-300">
            {upcoming.data?.map((session) => {
              const client = session.clients as { full_name: string; email: string | null; phone: string | null } | null;
              return (
                <div key={session.id} className="px-6 py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-cream-200 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-ink-lighter">
                        {client?.full_name?.charAt(0)?.toUpperCase() ?? "?"}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-ink">
                        {client?.full_name ?? "Unknown"}
                      </div>
                      <div className="text-xs text-ink-lighter">
                        {formatDate(session.starts_at)} &middot; {formatTime(session.starts_at)}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-ink-lighter">
                    {session.duration_mins} min
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
