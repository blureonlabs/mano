"use client";

import { trpc } from "@/lib/trpc";
import { CLIENT_STATUSES, CLIENT_CATEGORIES, DAYS_OF_WEEK } from "@mano/shared";
import { toast } from "sonner";
import { formatDate } from "./utils";
import {
  User,
  Mail,
  Phone,
  CalendarDays,
  Clock,
  Repeat,
} from "lucide-react";

interface ClientHeaderProps {
  clientId: string;
  client: {
    full_name: string;
    email: string | null;
    phone: string | null;
    status: string;
    category: string;
    client_type: string;
    session_count: number;
    last_session: { starts_at: string } | null;
    created_at: string;
    recurring_reservations: { id: string; day_of_week: number; start_time: string; end_time: string }[] | null;
  };
}

const statusColors: Record<string, string> = {
  active: "bg-sage-50 text-sage",
  inactive: "bg-cream-200 text-ink-lighter",
  terminated: "bg-red-50 text-red-600",
};

const categoryColors: Record<string, string> = {
  indian: "bg-sage-50 text-sage",
  nri: "bg-blue-50 text-blue-600",
  couple: "bg-amber-50 text-amber",
  other: "bg-cream-200 text-ink-lighter",
};

export default function ClientHeader({ clientId, client: c }: ClientHeaderProps) {
  const utils = trpc.useUtils();

  const updateClient = trpc.clients.update.useMutation({
    onSuccess: () => {
      utils.clients.getDetail.invalidate({ id: clientId });
      utils.clients.list.invalidate();
      toast.success("Client updated");
    },
  });

  const updateStatus = trpc.clients.updateStatus.useMutation({
    onSuccess: () => {
      utils.clients.getDetail.invalidate({ id: clientId });
      utils.clients.list.invalidate();
      toast.success("Status updated");
    },
  });

  return (
    <div className="bg-white rounded-2xl border border-cream-300 shadow-sm p-6">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-full bg-sage-50 flex items-center justify-center flex-shrink-0">
          <span className="text-xl font-semibold text-sage">
            {c.full_name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-heading font-bold text-ink">{c.full_name}</h1>
            {/* Status badge */}
            <span className={`inline-flex items-center px-2 py-0.5 rounded-pill text-[11px] font-medium ${statusColors[c.status] ?? statusColors.active}`}>
              {CLIENT_STATUSES[c.status as keyof typeof CLIENT_STATUSES]?.label ?? c.status}
            </span>
            {/* Category badge */}
            <span className={`inline-flex items-center px-2 py-0.5 rounded-pill text-[11px] font-medium ${categoryColors[c.category] ?? categoryColors.other}`}>
              {CLIENT_CATEGORIES[c.category as keyof typeof CLIENT_CATEGORIES]?.label ?? c.category}
            </span>
            {c.client_type === "regular" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-[11px] font-medium bg-blue-50 text-blue-600">
                <Repeat size={10} /> Regular
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {c.email && (
              <span className="inline-flex items-center gap-1 text-xs text-ink-lighter">
                <Mail size={12} /> {c.email}
              </span>
            )}
            {c.phone && (
              <span className="inline-flex items-center gap-1 text-xs text-ink-lighter">
                <Phone size={12} /> {c.phone}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quick actions: status, type, category */}
      <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-cream-300">
        <div>
          <label className="block text-[10px] font-medium text-ink-lighter mb-1">Status</label>
          <select
            value={c.status}
            onChange={(e) => updateStatus.mutate({ id: clientId, status: e.target.value as "active" | "inactive" | "terminated" })}
            className="px-2.5 py-1.5 rounded-lg border border-cream-300 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-sage/30"
          >
            {Object.entries(CLIENT_STATUSES).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-medium text-ink-lighter mb-1">Type</label>
          <select
            value={c.client_type}
            onChange={(e) => updateClient.mutate({ id: clientId, data: { client_type: e.target.value as "regular" | "irregular" } })}
            className="px-2.5 py-1.5 rounded-lg border border-cream-300 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-sage/30"
          >
            <option value="irregular">Irregular</option>
            <option value="regular">Regular</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-medium text-ink-lighter mb-1">Category</label>
          <select
            value={c.category}
            onChange={(e) => updateClient.mutate({ id: clientId, data: { category: e.target.value as "indian" | "nri" | "couple" | "other" } })}
            className="px-2.5 py-1.5 rounded-lg border border-cream-300 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-sage/30"
          >
            {Object.entries(CLIENT_CATEGORIES).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-cream-300">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-ink-lighter mb-0.5">
            <CalendarDays size={12} /> Sessions
          </div>
          <div className="text-lg font-heading font-bold text-ink">{c.session_count}</div>
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-xs text-ink-lighter mb-0.5">
            <Clock size={12} /> Last session
          </div>
          <div className="text-sm font-medium text-ink">
            {c.last_session
              ? formatDate(c.last_session.starts_at)
              : "None"}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-xs text-ink-lighter mb-0.5">
            <User size={12} /> Since
          </div>
          <div className="text-sm font-medium text-ink">
            {formatDate(c.created_at)}
          </div>
        </div>
      </div>

      {/* Recurring reservations */}
      {c.recurring_reservations && c.recurring_reservations.length > 0 && (
        <div className="mt-4 pt-4 border-t border-cream-300">
          <div className="flex items-center gap-1.5 text-xs text-ink-lighter mb-2">
            <Repeat size={12} /> Fixed weekly slots
          </div>
          <div className="flex flex-wrap gap-2">
            {c.recurring_reservations.map((r) => (
              <span key={r.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 text-xs font-medium">
                <CalendarDays size={11} />
                {DAYS_OF_WEEK[r.day_of_week]} {r.start_time}–{r.end_time}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
