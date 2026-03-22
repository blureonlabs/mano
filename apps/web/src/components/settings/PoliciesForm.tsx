import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { ShieldCheck, Clock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface PoliciesFormProps {
  therapist: {
    cancellation_policy: string | null;
    late_policy: string | null;
    rescheduling_policy: string | null;
    cancellation_hours: number;
    min_booking_advance_hours: number;
    no_show_charge_percent: number;
    late_cancel_charge_percent: number;
  };
}

export default function PoliciesForm({ therapist }: PoliciesFormProps) {
  const [cancellation, setCancellation] = useState(therapist.cancellation_policy ?? "");
  const [late, setLate] = useState(therapist.late_policy ?? "");
  const [rescheduling, setRescheduling] = useState(therapist.rescheduling_policy ?? "");
  const [cancellationHours, setCancellationHours] = useState(therapist.cancellation_hours);
  const [minAdvanceHours, setMinAdvanceHours] = useState(therapist.min_booking_advance_hours);
  const [noShowPercent, setNoShowPercent] = useState(therapist.no_show_charge_percent);
  const [lateCancelPercent, setLateCancelPercent] = useState(therapist.late_cancel_charge_percent);

  const utils = trpc.useUtils();
  const update = trpc.therapist.update.useMutation({
    onSuccess: () => {
      utils.therapist.me.invalidate();
      toast.success("Policies saved");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    update.mutate({
      cancellation_policy: cancellation || null,
      late_policy: late || null,
      rescheduling_policy: rescheduling || null,
      cancellation_hours: cancellationHours,
      min_booking_advance_hours: minAdvanceHours,
      no_show_charge_percent: noShowPercent,
      late_cancel_charge_percent: lateCancelPercent,
    });
  }

  return (
    <section className="bg-white rounded-2xl border border-cream-300 shadow-sm p-6 space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck size={18} className="text-sage" />
          <h2 className="text-lg font-heading font-semibold text-ink">Session Policies</h2>
        </div>
        <p className="text-sm text-ink-lighter">
          These policies are shown to clients on your booking page and enforced by the system.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Structured policy rules */}
        <div className="bg-cream-50 rounded-xl p-4 space-y-4">
          <h3 className="text-sm font-semibold text-ink flex items-center gap-1.5">
            <Clock size={14} className="text-sage" />
            Booking & Cancellation Rules
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="cancellationHours" className="block text-xs font-medium text-ink-light mb-1.5">
                Cancellation window (hours)
              </label>
              <input
                id="cancellationHours"
                type="number"
                min={0}
                max={168}
                value={cancellationHours}
                onChange={(e) => setCancellationHours(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage text-sm"
              />
              <p className="text-[10px] text-ink-lighter mt-1">
                Clients cancelling within {cancellationHours}h of session will be flagged as late cancellation
              </p>
            </div>
            <div>
              <label htmlFor="minAdvanceHours" className="block text-xs font-medium text-ink-light mb-1.5">
                Min. advance booking (hours)
              </label>
              <input
                id="minAdvanceHours"
                type="number"
                min={0}
                max={168}
                value={minAdvanceHours}
                onChange={(e) => setMinAdvanceHours(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage text-sm"
              />
              <p className="text-[10px] text-ink-lighter mt-1">
                Clients cannot book slots less than {minAdvanceHours}h away
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="lateCancelPercent" className="block text-xs font-medium text-ink-light mb-1.5">
                Late cancellation charge (%)
              </label>
              <input
                id="lateCancelPercent"
                type="number"
                min={0}
                max={100}
                value={lateCancelPercent}
                onChange={(e) => setLateCancelPercent(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage text-sm"
              />
            </div>
            <div>
              <label htmlFor="noShowPercent" className="block text-xs font-medium text-ink-light mb-1.5">
                No-show charge (%)
              </label>
              <input
                id="noShowPercent"
                type="number"
                min={0}
                max={100}
                value={noShowPercent}
                onChange={(e) => setNoShowPercent(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage text-sm"
              />
            </div>
          </div>
        </div>

        {/* Free-text policies (shown on booking page) */}
        <div>
          <label htmlFor="cancellation" className="block text-xs font-medium text-ink-light mb-1.5">
            Cancellation policy (shown to clients)
          </label>
          <textarea
            id="cancellation"
            value={cancellation}
            onChange={(e) => setCancellation(e.target.value)}
            rows={2}
            maxLength={1000}
            placeholder="e.g. Cancellations must be made at least 36 hours before the session. Late cancellations will be charged full fee."
            className="w-full px-3.5 py-2.5 rounded-xl border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage text-sm transition-shadow resize-none"
          />
        </div>

        <div>
          <label htmlFor="late" className="block text-xs font-medium text-ink-light mb-1.5">
            Late arrival policy
          </label>
          <textarea
            id="late"
            value={late}
            onChange={(e) => setLate(e.target.value)}
            rows={2}
            maxLength={1000}
            placeholder="e.g. If you arrive late, the session will still end at the scheduled time."
            className="w-full px-3.5 py-2.5 rounded-xl border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage text-sm transition-shadow resize-none"
          />
        </div>

        <div>
          <label htmlFor="rescheduling" className="block text-xs font-medium text-ink-light mb-1.5">
            Rescheduling policy
          </label>
          <textarea
            id="rescheduling"
            value={rescheduling}
            onChange={(e) => setRescheduling(e.target.value)}
            rows={2}
            maxLength={1000}
            placeholder="e.g. Sessions can be rescheduled once, at least 12 hours before the original time."
            className="w-full px-3.5 py-2.5 rounded-xl border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage text-sm transition-shadow resize-none"
          />
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={update.isPending}
            className="bg-sage text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-sage-500 transition-all disabled:opacity-50 shadow-md shadow-sage/20"
          >
            {update.isPending ? "Saving..." : "Save Policies"}
          </button>
          {update.error && (
            <span className="text-sm text-red-600">
              {update.error.message}
            </span>
          )}
        </div>
      </form>
    </section>
  );
}
