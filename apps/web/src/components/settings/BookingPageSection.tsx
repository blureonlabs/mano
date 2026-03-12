import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";

interface BookingPageSectionProps {
  slug: string;
  bookingPageActive: boolean;
}

export default function BookingPageSection({
  slug,
  bookingPageActive,
}: BookingPageSectionProps) {
  const [active, setActive] = useState(bookingPageActive);
  const [copied, setCopied] = useState(false);

  const utils = trpc.useUtils();
  const update = trpc.therapist.update.useMutation({
    onSuccess: () => {
      utils.therapist.me.invalidate();
    },
  });

  useEffect(() => {
    if (copied) {
      const t = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(t);
    }
  }, [copied]);

  function handleToggle() {
    const newVal = !active;
    setActive(newVal);
    update.mutate({ booking_page_active: newVal });
  }

  const bookingUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/booking/${slug}`;

  function handleCopy() {
    navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
  }

  return (
    <section className="bg-white rounded-2xl border border-cream-300 shadow-sm p-6 space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sage">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
          <h2 className="text-lg font-heading font-semibold text-ink">Booking Page</h2>
        </div>
        <p className="text-sm text-ink-lighter">
          Control your public booking page where clients can book sessions.
        </p>
      </div>

      {/* Toggle */}
      <div className="flex items-center justify-between p-4 rounded-xl border border-cream-300 bg-cream-50/50">
        <div>
          <p className="text-sm font-medium text-ink">
            {active ? "Booking page is live" : "Booking page is off"}
          </p>
          <p className="text-xs text-ink-lighter mt-0.5">
            {active
              ? "Clients can view your profile and book sessions"
              : "Your booking page is hidden from clients"}
          </p>
        </div>
        <button
          type="button"
          onClick={handleToggle}
          disabled={update.isPending}
          className={`relative w-12 h-7 rounded-full transition-colors flex-shrink-0 ${
            active ? "bg-sage" : "bg-cream-300"
          }`}
        >
          <span
            className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform shadow-sm ${
              active ? "translate-x-5" : ""
            }`}
          />
        </button>
      </div>

      {/* Booking URL */}
      {active && (
        <div className="space-y-2">
          <label className="block text-xs font-medium text-ink-light">
            Your booking link
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 px-3.5 py-2.5 rounded-xl border border-cream-300 bg-cream-50 text-sm text-ink font-mono truncate">
              /booking/{slug}
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="flex-shrink-0 px-4 py-2.5 rounded-xl border border-cream-300 text-sm font-medium text-ink hover:bg-cream transition-colors"
            >
              {copied ? (
                <span className="text-sage flex items-center gap-1">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  Copied
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  Copy
                </span>
              )}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
