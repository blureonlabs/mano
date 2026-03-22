"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { DAYS_OF_WEEK } from "@mano/shared";
import { toast } from "sonner";
import {
  Repeat,
  Plus,
  X,
  CalendarDays,
  Clock,
  Trash2,
  User,
} from "lucide-react";

export default function RecurringReservationsPage() {
  const reservations = trpc.recurringReservation.list.useQuery();
  const clients = trpc.clients.list.useQuery();
  const utils = trpc.useUtils();

  const [showForm, setShowForm] = useState(false);
  const [clientId, setClientId] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("10:50");
  const [sessionTypeName, setSessionTypeName] = useState("");
  const [amountInr, setAmountInr] = useState(0);

  const create = trpc.recurringReservation.create.useMutation({
    onSuccess: () => {
      utils.recurringReservation.list.invalidate();
      setShowForm(false);
      setClientId("");
      toast.success("Recurring slot reserved");
    },
    onError: (err) => toast.error(err.message),
  });

  const release = trpc.recurringReservation.release.useMutation({
    onSuccess: () => {
      utils.recurringReservation.list.invalidate();
      toast.success("Slot released");
    },
  });

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    create.mutate({
      client_id: clientId,
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
      session_type_name: sessionTypeName || null,
      amount_inr: amountInr * 100, // convert to paise
    });
  }

  if (reservations.isLoading) {
    return (
      <div className="max-w-3xl space-y-6">
        <div className="h-8 w-48 bg-cream-200 rounded-lg animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-white rounded-2xl border border-cream-300 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Repeat size={22} className="text-sage" />
            <h1 className="text-2xl font-heading font-bold text-ink">Fixed Weekly Slots</h1>
          </div>
          <p className="text-sm text-ink-lighter mt-0.5">
            Reserve recurring time slots for regular clients. These slots are blocked on the calendar and booking page.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-sage text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-sage-500 transition-all shadow-md shadow-sage/20 flex items-center gap-1.5"
        >
          {showForm ? <><X size={14} /> Cancel</> : <><Plus size={14} /> Reserve Slot</>}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-2xl border border-cream-300 shadow-sm p-5 space-y-4">
          <h3 className="text-sm font-semibold text-ink flex items-center gap-1.5">
            <Plus size={14} className="text-sage" /> Reserve a weekly slot
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-ink-light mb-1">Client *</label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-xl border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage text-sm"
              >
                <option value="">Select client...</option>
                {clients.data?.map((c) => (
                  <option key={c.id} value={c.id}>{c.full_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-light mb-1">Day of week *</label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage text-sm"
              >
                {DAYS_OF_WEEK.map((day, i) => (
                  <option key={i} value={i}>{day}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-ink-light mb-1">Start time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-xl border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-light mb-1">End time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-xl border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-light mb-1">Session type</label>
              <input
                type="text"
                value={sessionTypeName}
                onChange={(e) => setSessionTypeName(e.target.value)}
                placeholder="e.g. Regular"
                className="w-full px-3 py-2.5 rounded-xl border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-light mb-1">Fee (₹)</label>
              <input
                type="number"
                min={0}
                value={amountInr}
                onChange={(e) => setAmountInr(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={create.isPending}
            className="bg-sage text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-sage-500 transition-all disabled:opacity-50"
          >
            {create.isPending ? "Reserving..." : "Reserve Slot"}
          </button>
        </form>
      )}

      {/* Reservations list */}
      {(reservations.data?.length ?? 0) === 0 ? (
        <div className="bg-white rounded-2xl border border-cream-300 shadow-sm p-10 text-center">
          <div className="w-12 h-12 rounded-full bg-cream-200 mx-auto mb-3 flex items-center justify-center">
            <Repeat size={20} className="text-ink-lighter" />
          </div>
          <p className="text-sm text-ink-lighter">No recurring slots reserved</p>
          <p className="text-xs text-ink-lighter/60 mt-1">
            Reserve weekly slots for regular clients so their time is always blocked
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-cream-300 shadow-sm overflow-hidden divide-y divide-cream-300">
          {reservations.data?.map((r) => {
            const clientData = r.clients as { full_name: string; email: string | null } | null;
            return (
              <div key={r.id} className="px-6 py-4 flex items-center justify-between hover:bg-cream-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <User size={16} className="text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-ink">
                      {clientData?.full_name ?? "Unknown"}
                    </div>
                    <div className="text-xs text-ink-lighter flex items-center gap-2 mt-0.5">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays size={10} />
                        {DAYS_OF_WEEK[r.day_of_week]}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock size={10} />
                        {r.start_time}–{r.end_time}
                      </span>
                      {r.session_type_name && (
                        <span className="text-ink-lighter/60">{r.session_type_name}</span>
                      )}
                      {r.amount_inr > 0 && (
                        <span className="text-amber font-medium">₹{(r.amount_inr / 100).toLocaleString("en-IN")}</span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (confirm("Release this recurring slot?")) {
                      release.mutate({ id: r.id });
                    }
                  }}
                  className="text-xs text-ink-lighter hover:text-red-600 transition-colors flex items-center gap-1"
                >
                  <Trash2 size={12} /> Release
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
