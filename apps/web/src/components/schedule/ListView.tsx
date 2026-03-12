import Link from "next/link";
import {
  CalendarDays,
  Clock,
  Video,
  CheckCircle2,
  XCircle,
  AlertCircle,
  UserX,
  IndianRupee,
  Mail,
  FileText,
} from "lucide-react";
import { formatTimeIST, formatDateIST } from "@/lib/date-utils";

interface SessionClient {
  full_name: string;
  email: string;
  phone: string | null;
}

interface SessionData {
  id: string;
  starts_at: string;
  ends_at: string;
  duration_mins: number;
  status: string;
  payment_status: string;
  amount_inr: number | null;
  session_type_name: string | null;
  zoom_join_url: string | null;
  zoom_start_url: string | null;
  clients: SessionClient;
}

interface ListViewProps {
  sessions: SessionData[];
  isLoading: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onComplete: (id: string) => void;
  onCancel: (id: string) => void;
  onMarkNoShow: (id: string) => void;
  isActing: boolean;
}

function dateKey(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

export default function ListView({
  sessions,
  isLoading,
  onApprove,
  onReject,
  onComplete,
  onCancel,
  onMarkNoShow,
  isActing,
}: ListViewProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-white rounded-2xl border border-cream-300 animate-pulse" />
        ))}
      </div>
    );
  }

  // Sort and group by date
  const sorted = [...sessions].sort(
    (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
  );

  const grouped: Record<string, SessionData[]> = {};
  sorted.forEach((session) => {
    const key = dateKey(session.starts_at);
    if (!grouped[key]) grouped[key] = [];
    grouped[key]!.push(session);
  });

  const dateGroups = Object.entries(grouped);

  if (dateGroups.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-cream-300 shadow-sm p-10 text-center">
        <div className="w-12 h-12 rounded-full bg-cream-200 mx-auto mb-3 flex items-center justify-center">
          <CalendarDays size={20} className="text-ink-lighter" />
        </div>
        <p className="text-sm text-ink-lighter">No sessions this week</p>
        <p className="text-xs text-ink-lighter/60 mt-1">
          Sessions will appear here when clients book through your booking page
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {dateGroups.map(([date, daySessions]) => (
        <div key={date}>
          <div className="text-xs font-semibold text-ink-lighter uppercase tracking-wider mb-3 px-1 flex items-center gap-1.5">
            <CalendarDays size={12} />
            {daySessions[0] ? formatDateIST(daySessions[0].starts_at) : date}
          </div>
          <div className="bg-white rounded-2xl border border-cream-300 shadow-sm overflow-hidden divide-y divide-cream-300">
            {daySessions.map((session) => {
              const client = session.clients;
              return (
                <div key={session.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-sage-50 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-semibold text-sage">
                          {client.full_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-ink">
                          {client.full_name}
                        </div>
                        <div className="text-xs text-ink-lighter flex items-center gap-1">
                          <Clock size={11} />
                          {formatTimeIST(session.starts_at)} &ndash; {formatTimeIST(session.ends_at)} &middot; {session.duration_mins} min
                          {session.amount_inr != null && session.amount_inr > 0 && (
                            <span className="ml-1 text-amber inline-flex items-center gap-0.5">
                              &middot; <IndianRupee size={10} />{(session.amount_inr / 100).toLocaleString("en-IN")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {session.status === "pending_approval" && (
                        <>
                          <button
                            onClick={() => onApprove(session.id)}
                            disabled={isActing}
                            className="px-3.5 py-1.5 rounded-lg bg-sage text-white text-xs font-semibold hover:bg-sage-500 transition-colors shadow-sm flex items-center gap-1"
                          >
                            <CheckCircle2 size={12} />
                            Approve
                          </button>
                          <button
                            onClick={() => onReject(session.id)}
                            disabled={isActing}
                            className="px-3 py-1.5 rounded-lg bg-white border border-cream-300 text-ink-lighter text-xs font-medium hover:text-red-600 hover:border-red-200 transition-colors flex items-center gap-1"
                          >
                            <XCircle size={12} />
                            Decline
                          </button>
                        </>
                      )}

                      {session.status === "scheduled" && (
                        <>
                          {session.zoom_start_url && (
                            <a
                              href={session.zoom_start_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-medium hover:bg-blue-100 transition-colors flex items-center gap-1"
                            >
                              <Video size={12} />
                              Zoom
                            </a>
                          )}
                          <Link
                            href={`/dashboard/notes/new?session_id=${session.id}`}
                            className="px-3 py-1.5 rounded-lg bg-cream-100 text-ink-lighter text-xs font-medium hover:bg-cream-200 transition-colors flex items-center gap-1"
                          >
                            <FileText size={12} />
                            Notes
                          </Link>
                          <button
                            onClick={() => onComplete(session.id)}
                            disabled={isActing}
                            className="px-3 py-1.5 rounded-lg bg-sage-50 text-sage text-xs font-medium hover:bg-sage-100 transition-colors flex items-center gap-1"
                          >
                            <CheckCircle2 size={12} />
                            Done
                          </button>
                          <button
                            onClick={() => onMarkNoShow(session.id)}
                            disabled={isActing}
                            className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-medium hover:bg-red-100 transition-colors flex items-center gap-1"
                          >
                            <UserX size={12} />
                            No Show
                          </button>
                          <button
                            onClick={() => onCancel(session.id)}
                            disabled={isActing}
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
                  <div className="mt-2 ml-14 flex items-center gap-2 flex-wrap">
                    {session.status === "pending_approval" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-[11px] font-medium bg-amber-50 text-amber">
                        <AlertCircle size={10} />
                        Awaiting approval
                      </span>
                    )}
                    {session.status === "completed" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-[11px] font-medium bg-cream-200 text-ink-light">
                        <CheckCircle2 size={10} />
                        Completed
                      </span>
                    )}
                    {session.status === "no_show" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-[11px] font-medium bg-red-50 text-red-600">
                        <UserX size={10} />
                        No show
                      </span>
                    )}
                    {session.status === "cancelled" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-[11px] font-medium bg-red-50 text-red-600">
                        <XCircle size={10} />
                        Cancelled
                      </span>
                    )}
                    {session.status === "scheduled" && (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-[11px] font-medium ${
                        session.payment_status === "paid" || session.payment_status === "waived"
                          ? "bg-sage-50 text-sage"
                          : "bg-amber-50 text-amber"
                      }`}>
                        {session.payment_status === "paid" || session.payment_status === "waived" ? (
                          <CheckCircle2 size={10} />
                        ) : (
                          <AlertCircle size={10} />
                        )}
                        {session.payment_status === "paid" ? "Paid" : session.payment_status === "waived" ? "Free" : "Payment pending"}
                      </span>
                    )}
                    {session.session_type_name && (
                      <span className="px-2 py-0.5 rounded-pill text-[11px] font-medium bg-cream-100 text-ink-lighter">
                        {session.session_type_name}
                      </span>
                    )}
                    {client.email && (
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
  );
}
