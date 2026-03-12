import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";

interface SessionSettingsProps {
  therapist: {
    session_duration_mins: number;
    buffer_mins: number;
    session_rate_inr: number;
  };
}

const DURATION_OPTIONS = [30, 45, 50, 60, 90];
const BUFFER_OPTIONS = [0, 5, 10, 15, 30];

export default function SessionSettings({ therapist }: SessionSettingsProps) {
  const [duration, setDuration] = useState(therapist.session_duration_mins);
  const [buffer, setBuffer] = useState(therapist.buffer_mins);
  const [rateRupees, setRateRupees] = useState(String(therapist.session_rate_inr / 100));
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
    const rate = Math.round(parseFloat(rateRupees || "0") * 100);
    update.mutate({
      session_duration_mins: duration,
      buffer_mins: buffer,
      session_rate_inr: rate,
    });
  }

  return (
    <section className="bg-white rounded-2xl border border-cream-300 shadow-sm p-6 space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sage">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <h2 className="text-lg font-heading font-semibold text-ink">Session Settings</h2>
        </div>
        <p className="text-sm text-ink-lighter">
          Configure your default session duration, buffer time, and rate.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="duration" className="block text-xs font-medium text-ink-light mb-1.5">
              Session duration
            </label>
            <select
              id="duration"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage text-sm transition-shadow appearance-none"
            >
              {DURATION_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  {d} minutes
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="buffer" className="block text-xs font-medium text-ink-light mb-1.5">
              Buffer between sessions
            </label>
            <select
              id="buffer"
              value={buffer}
              onChange={(e) => setBuffer(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage text-sm transition-shadow appearance-none"
            >
              {BUFFER_OPTIONS.map((b) => (
                <option key={b} value={b}>
                  {b === 0 ? "No buffer" : `${b} minutes`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="rate" className="block text-xs font-medium text-ink-light mb-1.5">
              Session rate
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-ink-lighter">
                ₹
              </span>
              <input
                id="rate"
                type="number"
                min="0"
                step="100"
                value={rateRupees}
                onChange={(e) => setRateRupees(e.target.value)}
                placeholder="0"
                className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage text-sm transition-shadow"
              />
            </div>
            <p className="text-[11px] text-ink-lighter mt-1">Set to 0 for free sessions</p>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={update.isPending}
            className="bg-sage text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-sage-500 transition-all disabled:opacity-50 shadow-md shadow-sage/20"
          >
            {update.isPending ? "Saving..." : "Save Settings"}
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
