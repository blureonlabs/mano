import { useState } from "react";
import { X } from "lucide-react";
import { formatDateIST } from "@/lib/date-utils";

interface AddBreakModalProps {
  defaultStart: string; // ISO datetime
  defaultEnd: string;   // ISO datetime
  onClose: () => void;
  onSave: (data: { start_at: string; end_at: string; reason?: string }) => void;
  isSaving: boolean;
}

function toTimeValue(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
    hour12: false,
  });
}

function toISTDateStr(iso: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).formatToParts(new Date(iso));
  const year = parts.find((p) => p.type === "year")?.value ?? "";
  const month = parts.find((p) => p.type === "month")?.value ?? "";
  const day = parts.find((p) => p.type === "day")?.value ?? "";
  return `${year}-${month}-${day}`;
}

export default function AddBreakModal({
  defaultStart,
  defaultEnd,
  onClose,
  onSave,
  isSaving,
}: AddBreakModalProps) {
  const [startTime, setStartTime] = useState(toTimeValue(defaultStart));
  const [endTime, setEndTime] = useState(toTimeValue(defaultEnd));
  const [reason, setReason] = useState("");

  const dateStr = toISTDateStr(defaultStart);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const start_at = new Date(`${dateStr}T${startTime}:00+05:30`).toISOString();
    const end_at = new Date(`${dateStr}T${endTime}:00+05:30`).toISOString();
    onSave({ start_at, end_at, reason: reason || undefined });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div
        className="bg-white rounded-2xl border border-cream-300 shadow-xl p-6 w-full max-w-sm space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-heading font-semibold text-ink">Add Break</h3>
          <button onClick={onClose} className="p-1 text-ink-lighter hover:text-ink transition-colors">
            <X size={18} />
          </button>
        </div>

        <p className="text-xs text-ink-lighter">{formatDateIST(defaultStart)}</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-ink-light mb-1">Start</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-light mb-1">End</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-light mb-1">
              Reason <span className="text-ink-lighter font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={200}
              placeholder="e.g., Lunch break, Personal time"
              className="w-full px-3 py-2 rounded-xl border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage text-sm"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-sage text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-sage-500 transition-all disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Add Break"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-cream-300 text-sm font-medium text-ink-light hover:bg-cream-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
