"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { X } from "lucide-react";

interface Session {
  id: string;
  starts_at: string;
  ends_at: string;
  duration_mins: number;
  status: string;
  session_type_name: string | null;
  amount_inr: number;
  therapist_name: string;
}

interface UpcomingSessionsListProps {
  sessions: Session[];
  loading: boolean;
}

function formatDateTime(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Asia/Kolkata",
  });
  const time = d.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
  return { date, time };
}

const STATUS_STYLES: Record<string, string> = {
  scheduled: "bg-sage-50 text-sage",
  pending_approval: "bg-amber-50 text-amber-600",
  completed: "bg-cream-100 text-ink-lighter",
};

export default function UpcomingSessionsList({ sessions, loading }: UpcomingSessionsListProps) {
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const utils = trpc.useUtils();

  const cancelMutation = trpc.clientPortal.cancelSession.useMutation({
    onSuccess: (data) => {
      setCancellingId(null);
      utils.clientPortal.upcomingSessions.invalidate();
      utils.clientPortal.pastSessions.invalidate();
      if (data.lateCancellation) {
        toast.info("Session cancelled. This is a late cancellation and may be charged per your therapist's policy.");
      } else {
        toast.success("Session cancelled successfully.");
      }
    },
    onError: (err) => {
      toast.error(err.message || "Failed to cancel session");
    },
  });

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-cream-300 p-4 animate-pulse">
            <div className="h-4 bg-cream-200 rounded w-1/3 mb-2" />
            <div className="h-3 bg-cream-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-cream-300 p-6 text-center">
        <p className="text-sm text-ink-lighter">No upcoming sessions</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {sessions.map((session) => {
          const { date, time } = formatDateTime(session.starts_at);
          const statusStyle = STATUS_STYLES[session.status] ?? "bg-cream-100 text-ink-lighter";

          return (
            <div
              key={session.id}
              className="bg-white rounded-xl border border-cream-300 p-4 flex items-center justify-between gap-4"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-ink">{date}</span>
                  <span className="text-xs text-ink-lighter">{time}</span>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-pill ${statusStyle}`}>
                    {session.status.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-ink-lighter">
                  <span>with {session.therapist_name}</span>
                  {session.session_type_name && (
                    <>
                      <span>&middot;</span>
                      <span>{session.session_type_name}</span>
                    </>
                  )}
                  <span>&middot;</span>
                  <span>{session.duration_mins} min</span>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {session.amount_inr > 0 && (
                  <span className="text-xs font-medium text-ink-lighter whitespace-nowrap">
                    ₹{(session.amount_inr / 100).toLocaleString("en-IN")}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setCancellingId(session.id)}
                  className="text-xs font-medium text-red-500 hover:text-red-700 transition-colors px-2 py-1 rounded hover:bg-red-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cancel confirmation dialog */}
      {cancellingId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-heading font-semibold text-ink">Cancel session?</h3>
              <button
                type="button"
                onClick={() => setCancellingId(null)}
                className="text-ink-lighter hover:text-ink transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-ink-lighter">
              Are you sure you want to cancel this session? Late cancellations may be charged per your therapist&apos;s cancellation policy.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setCancellingId(null)}
                className="px-4 py-2 text-sm font-medium text-ink-lighter hover:text-ink transition-colors rounded-lg hover:bg-cream"
              >
                Keep session
              </button>
              <button
                type="button"
                disabled={cancelMutation.isPending}
                onClick={() => cancelMutation.mutate({ session_id: cancellingId })}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors rounded-lg disabled:opacity-50"
              >
                {cancelMutation.isPending ? "Cancelling..." : "Yes, cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
