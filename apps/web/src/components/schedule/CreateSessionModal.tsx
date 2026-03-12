import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { X } from "lucide-react";
import { toISTDateString } from "@/lib/date-utils";

interface CreateSessionModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateSessionModal({ onClose, onCreated }: CreateSessionModalProps) {
  const clients = trpc.clients.list.useQuery();
  const therapist = trpc.therapist.me.useQuery();

  const [clientId, setClientId] = useState("");
  const [sessionTypeId, setSessionTypeId] = useState("");
  const [date, setDate] = useState(toISTDateString(new Date()));
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("10:50");

  const sessionTypes = useMemo(() => {
    const types = (therapist.data?.session_types ?? []) as {
      id: string; name: string; duration_mins: number; rate_inr: number; is_active: boolean;
    }[];
    return types.filter((t) => t.is_active);
  }, [therapist.data]);

  function computeEndTime(start: string, durationMins: number): string {
    const parts = start.split(":").map(Number);
    const h = parts[0] ?? 0;
    const m = parts[1] ?? 0;
    const totalMins = h * 60 + m + durationMins;
    const endH = Math.floor(totalMins / 60) % 24;
    const endM = totalMins % 60;
    return `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
  }

  // Auto-calculate end time when session type changes
  function handleTypeChange(typeId: string) {
    setSessionTypeId(typeId);
    const type = sessionTypes.find((t) => t.id === typeId);
    if (type && startTime) {
      setEndTime(computeEndTime(startTime, type.duration_mins));
    }
  }

  function handleStartTimeChange(val: string) {
    setStartTime(val);
    const type = sessionTypes.find((t) => t.id === sessionTypeId);
    if (type) {
      setEndTime(computeEndTime(val, type.duration_mins));
    }
  }

  const createSession = trpc.session.create.useMutation({
    onSuccess: () => {
      toast.success("Session created");
      onCreated();
    },
    onError: (err) => toast.error(err.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const starts_at = new Date(`${date}T${startTime}:00+05:30`).toISOString();
    const ends_at = new Date(`${date}T${endTime}:00+05:30`).toISOString();
    createSession.mutate({
      client_id: clientId,
      session_type_id: sessionTypeId || undefined,
      starts_at,
      ends_at,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div
        className="bg-white rounded-2xl border border-cream-300 shadow-xl p-6 w-full max-w-md space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-heading font-semibold text-ink">Add Session</h3>
          <button onClick={onClose} className="p-1 text-ink-lighter hover:text-ink transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Client picker */}
          <div>
            <label className="block text-xs font-medium text-ink-light mb-1">Client</label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-xl border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage text-sm appearance-none"
            >
              <option value="">Select a client...</option>
              {(clients.data ?? []).map((c: { id: string; full_name: string; email: string }) => (
                <option key={c.id} value={c.id}>
                  {c.full_name} ({c.email})
                </option>
              ))}
            </select>
          </div>

          {/* Session type */}
          {sessionTypes.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-ink-light mb-1">Session type</label>
              <select
                value={sessionTypeId}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage text-sm appearance-none"
              >
                <option value="">Default</option>
                {sessionTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.duration_mins} min{t.rate_inr > 0 ? ` · ₹${(t.rate_inr / 100).toLocaleString("en-IN")}` : " · Free"})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date */}
          <div>
            <label className="block text-xs font-medium text-ink-light mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-xl border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage text-sm"
            />
          </div>

          {/* Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-ink-light mb-1">Start</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => handleStartTimeChange(e.target.value)}
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

          {createSession.error && (
            <p className="text-xs text-red-600">{createSession.error.message}</p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={createSession.isPending || !clientId}
              className="flex-1 bg-sage text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-sage-500 transition-all disabled:opacity-50"
            >
              {createSession.isPending ? "Creating..." : "Create Session"}
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
