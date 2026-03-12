"use client";

import { trpc } from "@/lib/trpc";
import {
  CalendarDays,
  Clock,
  Video,
  CheckCircle2,
  XCircle,
  AlertCircle,
  IndianRupee,
  Mail,
} from "lucide-react";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Asia/Kolkata",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
}

function dateKey(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

export default function SchedulePage() {
  const upcoming = trpc.session.upcoming.useQuery({ limit: 30 });
  const pending = trpc.session.pending.useQuery();
  const utils = trpc.useUtils();

  const cancel = trpc.session.cancel.useMutation({
    onSuccess: () => {
      utils.session.upcoming.invalidate();
      utils.session.today.invalidate();
    },
  });

  const complete = trpc.session.complete.useMutation({
    onSuccess: () => {
      utils.session.upcoming.invalidate();
      utils.session.today.invalidate();
    },
  });

  const approve = trpc.session.approve.useMutation({
    onSuccess: () => {
      utils.session.pending.invalidate();
      utils.session.upcoming.invalidate();
      utils.session.today.invalidate();
    },
  });

  const reject = trpc.session.reject.useMutation({
    onSuccess: () => {
      utils.session.pending.invalidate();
    },
  });

  if (upcoming.isLoading) {
    return (
      <div className="max-w-3xl space-y-6">
        <div className="h-8 w-36 bg-cream-200 rounded-lg animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-white rounded-2xl border border-cream-300 animate-pulse" />
        ))}
      </div>
    );
  }

  // Merge pending + upcoming, sort by starts_at
  const allSessions = [
    ...(pending.data ?? []),
    ...(upcoming.data ?? []),
  ].sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());

  // Group sessions by date
  const grouped: Record<string, typeof allSessions> = {};
  allSessions.forEach((session) => {
    const key = dateKey(session.starts_at);
    if (!grouped[key]) grouped[key] = [];
    grouped[key]!.push(session);
  });

  const dateGroups = Object.entries(grouped);
  const pendingCount = pending.data?.length ?? 0;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <CalendarDays size={22} className="text-sage" />
          <h1 className="text-2xl font-heading font-bold text-ink">Schedule</h1>
        </div>
        <p className="text-sm text-ink-lighter mt-0.5">
          {allSessions.length} session{allSessions.length !== 1 ? "s" : ""}
          {pendingCount > 0 && (
            <span className="text-amber font-medium"> ({pendingCount} pending approval)</span>
          )}
        </p>
      </div>

      {dateGroups.length === 0 ? (
        <div className="bg-white rounded-2xl border border-cream-300 shadow-sm p-10 text-center">
          <div className="w-12 h-12 rounded-full bg-cream-200 mx-auto mb-3 flex items-center justify-center">
            <CalendarDays size={20} className="text-ink-lighter" />
          </div>
          <p className="text-sm text-ink-lighter">No upcoming sessions</p>
          <p className="text-xs text-ink-lighter/60 mt-1">
            Sessions will appear here when clients book through your booking page
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {dateGroups.map(([date, sessions]) => (
            <div key={date}>
              <div className="text-xs font-semibold text-ink-lighter uppercase tracking-wider mb-3 px-1 flex items-center gap-1.5">
                <CalendarDays size={12} />
                {sessions && sessions[0] ? formatDate(sessions[0].starts_at) : date}
              </div>
              <div className="bg-white rounded-2xl border border-cream-300 shadow-sm overflow-hidden divide-y divide-cream-300">
                {sessions?.map((session) => {
                  const client = session.clients as { full_name: string; email: string | null; phone: string | null } | null;
                  return (
                    <div key={session.id} className="px-6 py-4">
                      <div className="flex items-center justify-between">
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
                              {session.amount_inr > 0 && (
                                <span className="ml-1 text-amber inline-flex items-center gap-0.5">
                                  &middot; <IndianRupee size={10} />{(session.amount_inr / 100).toLocaleString("en-IN")}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {session.status === "pending_approval" ? (
                            <>
                              <button
                                onClick={() => approve.mutate({ session_id: session.id })}
                                disabled={approve.isPending}
                                className="px-3.5 py-1.5 rounded-lg bg-sage text-white text-xs font-semibold hover:bg-sage-500 transition-colors shadow-sm flex items-center gap-1"
                              >
                                <CheckCircle2 size={12} />
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm("Decline this booking request?")) {
                                    reject.mutate({ session_id: session.id });
                                  }
                                }}
                                disabled={reject.isPending}
                                className="px-3 py-1.5 rounded-lg bg-white border border-cream-300 text-ink-lighter text-xs font-medium hover:text-red-600 hover:border-red-200 transition-colors flex items-center gap-1"
                              >
                                <XCircle size={12} />
                                Decline
                              </button>
                            </>
                          ) : (
                            <>
                              {session.zoom_join_url && (
                                <a
                                  href={session.zoom_join_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-medium hover:bg-blue-100 transition-colors flex items-center gap-1"
                                >
                                  <Video size={12} />
                                  Zoom
                                </a>
                              )}
                              <button
                                onClick={() => complete.mutate({ session_id: session.id })}
                                disabled={complete.isPending}
                                className="px-3 py-1.5 rounded-lg bg-sage-50 text-sage text-xs font-medium hover:bg-sage-100 transition-colors flex items-center gap-1"
                              >
                                <CheckCircle2 size={12} />
                                Done
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm("Cancel this session?")) {
                                    cancel.mutate({ session_id: session.id });
                                  }
                                }}
                                disabled={cancel.isPending}
                                className="px-3 py-1.5 rounded-lg bg-cream-100 text-ink-lighter text-xs font-medium hover:bg-red-50 hover:text-red-600 transition-colors flex items-center gap-1"
                              >
                                <XCircle size={12} />
                                Cancel
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Status badges */}
                      <div className="mt-2 ml-14 flex items-center gap-2">
                        {session.status === "pending_approval" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-[11px] font-medium bg-amber-50 text-amber">
                            <AlertCircle size={10} />
                            Awaiting approval
                          </span>
                        )}
                        {session.status === "scheduled" && (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-[11px] font-medium ${
                            session.payment_status === "paid"
                              ? "bg-sage-50 text-sage"
                              : "bg-amber-50 text-amber"
                          }`}>
                            {session.payment_status === "paid" ? (
                              <CheckCircle2 size={10} />
                            ) : (
                              <AlertCircle size={10} />
                            )}
                            {session.payment_status === "paid" ? "Paid" : "Payment pending"}
                          </span>
                        )}
                        {client?.email && (
                          <span className="text-[11px] text-ink-lighter inline-flex items-center gap-1">
                            <Mail size={10} />
                            {client.email}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
