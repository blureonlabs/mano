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
    <div className="text-center space-y-6">
      <div className="w-16 h-16 bg-sage-50 rounded-full mx-auto flex items-center justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-sage"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </div>

      <div>
        <h2 className="text-2xl font-heading font-semibold text-ink mb-2">
          Session Booked!
        </h2>
        <p className="text-ink-light text-sm">
          Your session with {therapistName} has been confirmed.
        </p>
      </div>

      <div className="bg-card border border-cream-300 rounded-card p-5 text-left space-y-3">
        <div>
          <div className="text-xs text-ink-lighter uppercase tracking-wider mb-1">
            Date
          </div>
          <div className="text-sm font-medium text-ink">
            {formatDateTime(slotStart)}
          </div>
        </div>
        <div>
          <div className="text-xs text-ink-lighter uppercase tracking-wider mb-1">
            Time
          </div>
          <div className="text-sm font-medium text-ink">
            {formatTime(slotStart)} &ndash; {formatTime(slotEnd)} &middot;{" "}
            {durationMins} min
          </div>
        </div>
        {zoomJoinUrl && (
          <div>
            <div className="text-xs text-ink-lighter uppercase tracking-wider mb-1">
              Video Call
            </div>
            <a
              href={zoomJoinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-sage hover:underline"
            >
              Join Zoom Meeting &rarr;
            </a>
          </div>
        )}
      </div>

      <p className="text-xs text-ink-lighter">
        A confirmation email has been sent to your inbox. You can close this page.
      </p>
    </div>
  );
}
