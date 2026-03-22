import { useState, useEffect } from "react";

interface TimeSlot {
  start: string;
  end: string;
}

interface BookingFormProps {
  slotStart: string;
  slotEnd: string;
  slots?: TimeSlot[];
  durationMins: number;
  rateInr: number;
  loading: boolean;
  defaultName?: string;
  defaultEmail?: string;
  defaultPhone?: string;
  onSubmit: (data: { name: string; email: string; phone: string }) => void;
  onBack: () => void;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "long",
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

export default function BookingForm({
  slotStart,
  slotEnd,
  slots,
  durationMins,
  rateInr,
  loading,
  defaultName = "",
  defaultEmail = "",
  defaultPhone = "",
  onSubmit,
  onBack,
}: BookingFormProps) {
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [phone, setPhone] = useState(defaultPhone);

  // Update if defaults change (e.g. logged-in client data loads)
  useEffect(() => {
    if (defaultName) setName(defaultName);
  }, [defaultName]);
  useEffect(() => {
    if (defaultEmail) setEmail(defaultEmail);
  }, [defaultEmail]);
  useEffect(() => {
    if (defaultPhone) setPhone(defaultPhone);
  }, [defaultPhone]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({ name, email, phone });
  }

  const allSlots = slots && slots.length > 1 ? slots : [{ start: slotStart, end: slotEnd }];
  const isMulti = allSlots.length > 1;
  const totalAmount = rateInr * allSlots.length;

  return (
    <div className="space-y-5">
      {/* Session summary */}
      <div className="space-y-2">
        {allSlots.map((slot, i) => (
          <div
            key={slot.start}
            className="bg-sage-50/60 border border-sage-100 rounded-xl p-3 flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-sage/10 flex items-center justify-center flex-shrink-0">
              {isMulti ? (
                <span className="text-xs font-bold text-sage">{i + 1}</span>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sage">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-ink">{formatDateTime(slot.start)}</div>
              <div className="text-xs text-ink-light">
                {formatTime(slot.start)} &ndash; {formatTime(slot.end)} &middot; {durationMins} min
              </div>
            </div>
          </div>
        ))}

        {/* Total */}
        {rateInr > 0 && (
          <div className="flex items-center justify-between px-1">
            <span className="text-xs text-ink-lighter">
              {isMulti ? `${allSlots.length} sessions` : "Session fee"}
            </span>
            <span className="text-sm font-semibold text-amber">
              ₹{(totalAmount / 100).toLocaleString("en-IN")}
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={onBack}
          className="text-xs text-sage font-medium hover:text-sage-600 transition-colors"
        >
          &larr; Change slot{isMulti ? "s" : ""}
        </button>
      </div>

      {/* Client details form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <h3 className="text-xs font-semibold text-ink-lighter uppercase tracking-wider">
          Your details
        </h3>

        <div className="space-y-3">
          <div>
            <label htmlFor="name" className="block text-xs font-medium text-ink-light mb-1.5">
              Full name
            </label>
            <input
              id="name"
              type="text"
              placeholder="e.g. Priya Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage text-sm transition-shadow"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-xs font-medium text-ink-light mb-1.5">
              Email address
            </label>
            <input
              id="email"
              type="email"
              placeholder="priya@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage text-sm transition-shadow"
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-xs font-medium text-ink-light mb-1.5">
              Phone number <span className="text-ink-lighter font-normal">(optional)</span>
            </label>
            <input
              id="phone"
              type="tel"
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage text-sm transition-shadow"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-sage text-white py-3 rounded-xl font-semibold text-sm hover:bg-sage-500 transition-all duration-200 disabled:opacity-50 shadow-md shadow-sage/20 hover:shadow-lg hover:shadow-sage/25"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Booking...
            </span>
          ) : isMulti ? (
            `Confirm ${allSlots.length} Bookings`
          ) : (
            "Confirm Booking"
          )}
        </button>
      </form>
    </div>
  );
}
