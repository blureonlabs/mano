import { X, CheckCircle2, XCircle, UserX, Video, FileText, Clock, IndianRupee } from "lucide-react";
import { formatTimeIST, formatDateIST } from "@/lib/date-utils";
import Link from "next/link";

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
  cancellation_reason: string | null;
  clients: SessionClient;
}

interface SessionDetailPopoverProps {
  session: SessionData;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  onComplete: () => void;
  onCancel: () => void;
  onMarkNoShow: () => void;
  isLoading: boolean;
}

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  pending_approval: { label: "Awaiting approval", className: "bg-amber-50 text-amber" },
  scheduled: { label: "Scheduled", className: "bg-sage-50 text-sage" },
  completed: { label: "Completed", className: "bg-cream-200 text-ink-light" },
  cancelled: { label: "Cancelled", className: "bg-red-50 text-red-600" },
  no_show: { label: "No show", className: "bg-red-50 text-red-600" },
};

const PAYMENT_BADGES: Record<string, { label: string; className: string }> = {
  pending: { label: "Payment pending", className: "bg-amber-50 text-amber" },
  paid: { label: "Paid", className: "bg-sage-50 text-sage" },
  refunded: { label: "Refunded", className: "bg-cream-200 text-ink-light" },
  waived: { label: "Free", className: "bg-sage-50 text-sage" },
};

export default function SessionDetailPopover({
  session,
  onClose,
  onApprove,
  onReject,
  onComplete,
  onCancel,
  onMarkNoShow,
  isLoading,
}: SessionDetailPopoverProps) {
  const s = session;
  const client = s.clients;
  const statusBadge = STATUS_BADGES[s.status] ?? { label: s.status, className: "bg-cream-100 text-ink-light" };
  const paymentBadge = PAYMENT_BADGES[s.payment_status] ?? { label: s.payment_status, className: "bg-cream-100 text-ink-light" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div
        className="bg-white rounded-2xl border border-cream-300 shadow-xl p-6 w-full max-w-md space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-sage-50 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-semibold text-sage">
                {client.full_name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-ink">{client.full_name}</h3>
              <p className="text-xs text-ink-lighter">{client.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-ink-lighter hover:text-ink transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Session details */}
        <div className="bg-cream-50/50 rounded-xl p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm text-ink">
            <Clock size={14} className="text-ink-lighter" />
            <span>{formatDateIST(s.starts_at)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-ink-light">
            <span className="ml-[22px]">
              {formatTimeIST(s.starts_at)} – {formatTimeIST(s.ends_at)} · {s.duration_mins} min
            </span>
          </div>
          {s.session_type_name && (
            <div className="ml-[22px] text-xs text-ink-lighter">{s.session_type_name}</div>
          )}
          {s.amount_inr != null && s.amount_inr > 0 && (
            <div className="flex items-center gap-1 ml-[22px] text-xs text-ink-light">
              <IndianRupee size={10} />
              {(s.amount_inr / 100).toLocaleString("en-IN")}
            </div>
          )}
        </div>

        {/* Status badges */}
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-pill text-xs font-medium ${statusBadge.className}`}>
            {statusBadge.label}
          </span>
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-pill text-xs font-medium ${paymentBadge.className}`}>
            {paymentBadge.label}
          </span>
        </div>

        {/* Cancellation reason */}
        {s.status === "cancelled" && s.cancellation_reason && (
          <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
            Reason: {s.cancellation_reason}
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-1">
          {s.status === "pending_approval" && (
            <>
              <button
                onClick={onApprove}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sage text-white text-xs font-semibold hover:bg-sage-500 transition-all disabled:opacity-50"
              >
                <CheckCircle2 size={14} />
                Approve
              </button>
              <button
                onClick={onReject}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 transition-all disabled:opacity-50"
              >
                <XCircle size={14} />
                Decline
              </button>
            </>
          )}

          {s.status === "scheduled" && (
            <>
              <button
                onClick={onComplete}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sage text-white text-xs font-semibold hover:bg-sage-500 transition-all disabled:opacity-50"
              >
                <CheckCircle2 size={14} />
                Complete
              </button>
              <button
                onClick={onMarkNoShow}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 transition-all disabled:opacity-50"
              >
                <UserX size={14} />
                No Show
              </button>
              <button
                onClick={onCancel}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-cream-300 text-ink-light text-xs font-semibold hover:bg-cream-50 transition-all disabled:opacity-50"
              >
                <XCircle size={14} />
                Cancel
              </button>
              {s.zoom_start_url && (
                <a
                  href={s.zoom_start_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 text-blue-600 text-xs font-semibold hover:bg-blue-100 transition-all"
                >
                  <Video size={14} />
                  Zoom
                </a>
              )}
            </>
          )}

          {(s.status === "scheduled" || s.status === "completed" || s.status === "no_show") && (
            <Link
              href={`/dashboard/notes/new?session_id=${s.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-cream-300 text-ink-light text-xs font-semibold hover:bg-cream-50 transition-all"
            >
              <FileText size={14} />
              Notes
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
