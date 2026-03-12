"use client";

import { trpc } from "@/lib/trpc";

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

  // Group sessions by date
  const grouped: Record<string, typeof upcoming.data> = {};
  upcoming.data?.forEach((session) => {
    const key = dateKey(session.starts_at);
    if (!grouped[key]) grouped[key] = [];
    grouped[key]!.push(session);
  });

  const dateGroups = Object.entries(grouped);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-ink">Schedule</h1>
        <p className="text-sm text-ink-lighter mt-0.5">
          {upcoming.data?.length ?? 0} upcoming session{(upcoming.data?.length ?? 0) !== 1 ? "s" : ""}
        </p>
      </div>

      {dateGroups.length === 0 ? (
        <div className="bg-white rounded-2xl border border-cream-300 shadow-sm p-10 text-center">
          <div className="w-12 h-12 rounded-full bg-cream-200 mx-auto mb-3 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ink-lighter">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
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
              <div className="text-xs font-semibold text-ink-lighter uppercase tracking-wider mb-3 px-1">
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
                            <div className="text-xs text-ink-lighter">
                              {formatTime(session.starts_at)} &ndash; {formatTime(session.ends_at)} &middot; {session.duration_mins} min
                              {session.amount_inr > 0 && (
                                <span className="ml-1 text-amber">
                                  &middot; ₹{(session.amount_inr / 100).toLocaleString("en-IN")}
                                </span>
                              )}
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
                              Zoom
                            </a>
                          )}
                          <button
                            onClick={() => complete.mutate({ session_id: session.id })}
                            disabled={complete.isPending}
                            className="px-3 py-1.5 rounded-lg bg-sage-50 text-sage text-xs font-medium hover:bg-sage-100 transition-colors"
                          >
                            Done
                          </button>
                          <button
                            onClick={() => {
                              if (confirm("Cancel this session?")) {
                                cancel.mutate({ session_id: session.id });
                              }
                            }}
                            disabled={cancel.isPending}
                            className="px-3 py-1.5 rounded-lg bg-cream-100 text-ink-lighter text-xs font-medium hover:bg-red-50 hover:text-red-600 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>

                      {/* Payment status */}
                      <div className="mt-2 ml-14 flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-[11px] font-medium ${
                          session.payment_status === "paid"
                            ? "bg-sage-50 text-sage"
                            : "bg-amber-50 text-amber"
                        }`}>
                          <span className={`w-1 h-1 rounded-full ${
                            session.payment_status === "paid" ? "bg-sage" : "bg-amber"
                          }`} />
                          {session.payment_status === "paid" ? "Paid" : "Payment pending"}
                        </span>
                        {client?.email && (
                          <span className="text-[11px] text-ink-lighter">{client.email}</span>
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
