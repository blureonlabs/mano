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
  zoomJoinUrl,
}: BookingConfirmationProps) {
  return (
    <div className="text-center space-y-6 py-4">
      {/* Success icon */}
      <div className="relative mx-auto w-16 h-16">
        <div className="absolute inset-0 bg-sage/10 rounded-full animate-ping" />
        <div className="relative w-16 h-16 bg-sage rounded-full flex items-center justify-center shadow-lg shadow-sage/20">
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
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
      </div>

      {/* Title */}
      <div>
        <h2 className="text-2xl font-heading font-bold text-ink mb-1">
          You&apos;re all set!
        </h2>
        <p className="text-sm text-ink-lighter">
          Your session with <span className="font-medium text-ink-light">{therapistName}</span> is confirmed.
        </p>
      </div>

      {/* Session details card */}
      <div className="bg-white border border-cream-300 rounded-xl p-5 text-left space-y-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-sage-50 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sage">
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

        {zoomJoinUrl && (
          <>
            <div className="border-t border-cream-300" />
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                  <polygon points="23 7 16 12 23 17 23 7" />
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium text-ink">Video Call</div>
                <a
                  href={zoomJoinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-sage hover:text-sage-600 font-medium transition-colors"
                >
                  Join Zoom Meeting &rarr;
                </a>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer note */}
      <div className="bg-sage-50/50 border border-sage-100 rounded-xl px-4 py-3">
        <p className="text-xs text-sage-600">
          A confirmation has been sent to your email. You&apos;ll also receive a reminder before the session.
        </p>
      </div>
    </div>
  );
}
