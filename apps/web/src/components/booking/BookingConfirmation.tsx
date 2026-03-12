interface BookingConfirmationProps {
  therapistName: string;
  slotStart: string;
  slotEnd: string;
  durationMins: number;
  zoomJoinUrl: string | null;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
}

export default function BookingConfirmation({
  therapistName,
  slotStart,
  slotEnd,
  durationMins,
}: BookingConfirmationProps) {
  return (
    <div className="text-center space-y-6 py-4">
      {/* Pending icon */}
      <div className="relative mx-auto w-16 h-16">
        <div className="absolute inset-0 bg-amber/10 rounded-full animate-ping" />
        <div className="relative w-16 h-16 bg-amber rounded-full flex items-center justify-center shadow-lg shadow-amber/20">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
      </div>

      {/* Title */}
      <div>
        <h2 className="text-2xl font-heading font-bold text-ink mb-1">
          Request Sent!
        </h2>
        <p className="text-sm text-ink-lighter">
          Your booking request has been sent to{" "}
          <span className="font-medium text-ink-light">{therapistName}</span>.
        </p>
      </div>

      {/* Session details card */}
      <div className="bg-white border border-cream-300 rounded-xl p-5 text-left space-y-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-medium text-ink">
              {formatDateTime(slotStart)}
            </div>
            <div className="text-xs text-ink-lighter mt-0.5">
              {formatTime(slotStart)} &ndash; {formatTime(slotEnd)} &middot; {durationMins} min
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="border-t border-cream-300 pt-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill bg-amber-50 text-amber text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-amber animate-pulse" />
              Awaiting approval
            </span>
          </div>
        </div>
      </div>

      {/* What happens next */}
      <div className="bg-sage-50/50 border border-sage-100 rounded-xl px-4 py-3 text-left">
        <p className="text-xs font-medium text-sage-600 mb-2">What happens next?</p>
        <ol className="text-xs text-sage-600/80 space-y-1.5 list-decimal list-inside">
          <li>{therapistName} will review your request</li>
          <li>You&apos;ll receive a confirmation email once approved</li>
          <li>If not approved, the slot will be released</li>
        </ol>
      </div>
    </div>
  );
}
