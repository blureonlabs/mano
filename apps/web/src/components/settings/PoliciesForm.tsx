import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { ShieldCheck } from "lucide-react";

interface PoliciesFormProps {
  therapist: {
    cancellation_policy: string | null;
    late_policy: string | null;
    rescheduling_policy: string | null;
  };
}

export default function PoliciesForm({ therapist }: PoliciesFormProps) {
  const [cancellation, setCancellation] = useState(therapist.cancellation_policy ?? "");
  const [late, setLate] = useState(therapist.late_policy ?? "");
  const [rescheduling, setRescheduling] = useState(therapist.rescheduling_policy ?? "");
  const [saved, setSaved] = useState(false);

  const utils = trpc.useUtils();
  const update = trpc.therapist.update.useMutation({
    onSuccess: () => {
      utils.therapist.me.invalidate();
      setSaved(true);
    },
  });

  useEffect(() => {
    if (saved) {
      const t = setTimeout(() => setSaved(false), 2000);
      return () => clearTimeout(t);
    }
  }, [saved]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    update.mutate({
      cancellation_policy: cancellation || null,
      late_policy: late || null,
      rescheduling_policy: rescheduling || null,
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
          These policies are shown to clients on your booking page.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="cancellation" className="block text-xs font-medium text-ink-light mb-1.5">
            Cancellation policy
          </label>
          <textarea
            id="cancellation"
            value={cancellation}
            onChange={(e) => setCancellation(e.target.value)}
            rows={2}
            maxLength={1000}
            placeholder="e.g. Cancellations must be made at least 24 hours before the session. Late cancellations will be charged 50% of the session fee."
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
            placeholder="e.g. If you arrive late, the session will still end at the scheduled time. No extensions will be provided."
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
          {saved && (
            <span className="text-sm text-sage font-medium animate-pulse">
              Saved!
            </span>
          )}
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
