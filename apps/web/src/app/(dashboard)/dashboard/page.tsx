"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc";
import {
  Clock,
  CalendarDays,
  Users,
  ArrowRight,
  Video,
  CheckCircle2,
  AlertCircle,
  CircleDot,
  FileText,
} from "lucide-react";

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
  const pending = trpc.session.pending.useQuery();
  const clients = trpc.clients.list.useQuery();
  const therapist = trpc.therapist.me.useQuery();
  const utils = trpc.useUtils();

  const approve = trpc.session.approve.useMutation({
    onSuccess: () => {
      utils.session.pending.invalidate();
      utils.session.today.invalidate();
      utils.session.upcoming.invalidate();
    },
  });
  const reject = trpc.session.reject.useMutation({
    onSuccess: () => {
      utils.session.pending.invalidate();
    },
  });

  const todayCount = today.data?.length ?? 0;
  const pendingCount = pending.data?.length ?? 0;
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

      {/* Pending Requests */}
      {pendingCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-amber-200 flex items-center gap-2">
            <AlertCircle size={16} className="text-amber" />
            <h2 className="text-sm font-semibold text-amber-600">
              {pendingCount} Pending Request{pendingCount !== 1 ? "s" : ""}
            </h2>
          </div>
          <div className="divide-y divide-amber-200">
            {pending.data?.map((session) => {
              const client = session.clients as { full_name: string; email: string | null; phone: string | null } | null;
              return (
                <div key={session.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-amber-600">
                        {client?.full_name?.charAt(0)?.toUpperCase() ?? "?"}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-ink">
                        {client?.full_name ?? "Unknown"}
                      </div>
                      <div className="text-xs text-ink-lighter flex items-center gap-1">
                        <CalendarDays size={11} />
                        {formatDate(session.starts_at)} &middot; {formatTime(session.starts_at)} &ndash; {formatTime(session.ends_at)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => approve.mutate({ session_id: session.id })}
                      disabled={approve.isPending}
                      className="px-3.5 py-1.5 rounded-lg bg-sage text-white text-xs font-semibold hover:bg-sage-500 transition-colors shadow-sm"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Decline this booking request?")) {
                          reject.mutate({ session_id: session.id });
                        }
                      }}
                      disabled={reject.isPending}
                      className="px-3.5 py-1.5 rounded-lg bg-white border border-cream-300 text-ink-lighter text-xs font-medium hover:text-red-600 hover:border-red-200 transition-colors"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-cream-300 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-sage-50 flex items-center justify-center">
              <Clock size={16} className="text-sage" />
            </div>
            <span className="text-xs font-semibold text-ink-lighter uppercase tracking-wider">Today</span>
          </div>
          <div className="text-2xl font-heading font-bold text-ink">{todayCount}</div>
          <div className="text-xs text-ink-lighter">session{todayCount !== 1 ? "s" : ""}</div>
        </div>
        <div className="bg-white rounded-2xl border border-cream-300 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <CalendarDays size={16} className="text-blue-600" />
            </div>
            <span className="text-xs font-semibold text-ink-lighter uppercase tracking-wider">Upcoming</span>
          </div>
          <div className="text-2xl font-heading font-bold text-ink">{upcoming.data?.length ?? 0}</div>
          <div className="text-xs text-ink-lighter">scheduled</div>
        </div>
        <div className="bg-white rounded-2xl border border-cream-300 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
              <Users size={16} className="text-purple-600" />
            </div>
            <span className="text-xs font-semibold text-ink-lighter uppercase tracking-wider">Clients</span>
          </div>
          <div className="text-2xl font-heading font-bold text-ink">{clientCount}</div>
          <div className="text-xs text-ink-lighter">active</div>
        </div>
      </div>

      {/* Today's sessions */}
      <div className="bg-white rounded-2xl border border-cream-300 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-cream-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={15} className="text-ink-lighter" />
            <h2 className="text-sm font-semibold text-ink">Today&apos;s Sessions</h2>
          </div>
          <Link href="/dashboard/schedule" className="text-xs text-sage font-medium hover:text-sage-600 transition-colors flex items-center gap-1">
            View all <ArrowRight size={12} />
          </Link>
        </div>

        {todayCount === 0 ? (
          <div className="px-6 py-10 text-center">
            <div className="w-12 h-12 rounded-full bg-cream-200 mx-auto mb-3 flex items-center justify-center">
              <Clock size={20} className="text-ink-lighter" />
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
                      <div className="text-xs text-ink-lighter flex items-center gap-1">
                        <Clock size={11} />
                        {formatTime(session.starts_at)} &ndash; {formatTime(session.ends_at)} &middot; {session.duration_mins} min
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/notes/new?session_id=${session.id}`}
                      className="px-3 py-1.5 rounded-lg bg-cream-100 text-ink-lighter text-xs font-medium hover:bg-cream-200 transition-colors flex items-center gap-1"
                    >
                      <FileText size={12} />
                    </Link>
                    {session.zoom_join_url && (
                      <a
                        href={session.zoom_join_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-medium hover:bg-blue-100 transition-colors flex items-center gap-1"
                      >
                        <Video size={12} />
                        Join
                      </a>
                    )}
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-pill text-xs font-medium ${
                      session.status === "scheduled"
                        ? "bg-sage-50 text-sage"
                        : session.status === "completed"
                        ? "bg-cream-200 text-ink-lighter"
                        : "bg-amber-50 text-amber"
                    }`}>
                      {session.status === "scheduled" && <CircleDot size={10} />}
                      {session.status === "completed" && <CheckCircle2 size={10} />}
                      {session.status === "pending_approval" && <AlertCircle size={10} />}
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
          <div className="px-6 py-4 border-b border-cream-300 flex items-center gap-2">
            <CalendarDays size={15} className="text-ink-lighter" />
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
                      <div className="text-xs text-ink-lighter flex items-center gap-1">
                        <CalendarDays size={11} />
                        {formatDate(session.starts_at)} &middot; {formatTime(session.starts_at)}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-ink-lighter flex items-center gap-1">
                    <Clock size={11} />
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
