import { useState } from "react";

interface BookingFormProps {
  slotStart: string;
  slotEnd: string;
  durationMins: number;
  rateInr: number;
  loading: boolean;
  onSubmit: (data: { name: string; email: string; phone: string }) => void;
  onBack: () => void;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", {
    weekday: "long",
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
  durationMins,
  rateInr,
  loading,
  onSubmit,
  onBack,
}: BookingFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({ name, email, phone });
  }

  return (
    <div className="space-y-5">
      {/* Session summary */}
      <div className="bg-sage-50 border border-sage-200 rounded-small p-4">
        <div className="text-sm font-medium text-sage mb-1">Your session</div>
        <div className="text-ink font-heading font-medium">
          {formatDateTime(slotStart)}
        </div>
        <div className="text-sm text-ink-light">
          {formatTime(slotStart)} &ndash; {formatTime(slotEnd)} &middot; {durationMins} min
        </div>
        {rateInr > 0 && (
          <div className="text-sm font-medium text-amber mt-1">
            ₹{(rateInr / 100).toLocaleString("en-IN")}
          </div>
        )}
      </div>

      {/* Client details form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <h3 className="text-sm font-medium text-ink-lighter uppercase tracking-wider">
          Your details
        </h3>
        <input
          type="text"
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-4 py-3 rounded-small border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage text-sm"
        />
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-3 rounded-small border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage text-sm"
        />
        <input
          type="tel"
          placeholder="Phone number (optional)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full px-4 py-3 rounded-small border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage text-sm"
        />

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-3 rounded-small border border-cream-300 text-ink-light text-sm font-medium hover:bg-cream transition-colors"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-sage text-white py-3 rounded-small font-medium text-sm hover:bg-sage-500 transition-colors disabled:opacity-50"
          >
            {loading ? "Booking..." : "Confirm Booking"}
          </button>
        </div>
      </form>
    </div>
  );
}
