"use client";

import { useState } from "react";

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

interface PastSessionsListProps {
  sessions: Session[];
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

export default function PastSessionsList({ sessions, hasMore, loading, onLoadMore }: PastSessionsListProps) {
  const [expanded, setExpanded] = useState(false);

  if (sessions.length === 0 && !loading) return null;

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm font-medium text-ink-lighter hover:text-ink transition-colors"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform ${expanded ? "rotate-90" : ""}`}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
        Past sessions ({sessions.length}{hasMore ? "+" : ""})
      </button>

      {expanded && (
        <div className="space-y-2">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="bg-white rounded-xl border border-cream-300 px-4 py-3 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-2 text-sm min-w-0">
                <span className="text-ink-lighter">{formatDate(session.starts_at)}</span>
                <span className="text-ink font-medium truncate">
                  {session.session_type_name ?? "Session"}
                </span>
                <span className="text-xs text-ink-lighter">with {session.therapist_name}</span>
              </div>
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-pill whitespace-nowrap ${
                session.status === "completed"
                  ? "bg-sage-50 text-sage"
                  : session.status === "cancelled"
                    ? "bg-red-50 text-red-600"
                    : "bg-cream-100 text-ink-lighter"
              }`}>
                {session.status}
              </span>
            </div>
          ))}
          {hasMore && (
            <button
              type="button"
              onClick={onLoadMore}
              disabled={loading}
              className="w-full text-center py-2 text-sm text-sage font-medium hover:text-sage-600 transition-colors disabled:opacity-50"
            >
              {loading ? "Loading..." : "Load more"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
