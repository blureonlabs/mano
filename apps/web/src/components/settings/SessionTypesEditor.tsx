import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { SESSION_DURATIONS } from "@mano/shared";
import type { SessionType } from "@mano/shared";
import { Clock, Plus, Trash2 } from "lucide-react";

interface SessionTypesEditorProps {
  sessionTypes: SessionType[];
  bufferMins: number;
}

const BUFFER_OPTIONS = [0, 5, 10, 15, 30];

export default function SessionTypesEditor({ sessionTypes, bufferMins }: SessionTypesEditorProps) {
  const [types, setTypes] = useState<SessionType[]>(
    sessionTypes.length > 0 ? sessionTypes : []
  );
  const [buffer, setBuffer] = useState(bufferMins);

  const utils = trpc.useUtils();

  const updateTypes = trpc.therapist.updateSessionTypes.useMutation({
    onSuccess: () => {
      utils.therapist.me.invalidate();
      toast.success("Session types saved");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateBuffer = trpc.therapist.update.useMutation({
    onSuccess: () => utils.therapist.me.invalidate(),
    onError: (err) => toast.error(err.message),
  });

  function addType() {
    setTypes([
      ...types,
      {
        id: crypto.randomUUID(),
        name: "",
        duration_mins: 50,
        rate_inr: 0,
        description: null,
        is_active: true,
        sort_order: types.length,
      },
    ]);
  }

  function removeType(id: string) {
    if (types.length <= 1) return;
    setTypes(types.filter((t) => t.id !== id));
  }

  function updateType(id: string, field: keyof SessionType, value: unknown) {
    setTypes(types.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const valid = types.filter((t) => t.name.trim() !== "");
    if (valid.length === 0) return;
    updateTypes.mutate({ session_types: valid });
    if (buffer !== bufferMins) {
      updateBuffer.mutate({ buffer_mins: buffer });
    }
  }

  return (
    <section className="bg-white rounded-2xl border border-cream-300 shadow-sm p-6 space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Clock size={18} className="text-sage" />
          <h2 className="text-lg font-heading font-semibold text-ink">Session Types</h2>
        </div>
        <p className="text-sm text-ink-lighter">
          Configure the session types clients can book. Set rates to 0 for free sessions.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Buffer time (global) */}
        <div className="max-w-xs">
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

        {/* Session type cards */}
        <div className="space-y-3">
          {types.map((type, index) => (
            <div
              key={type.id}
              className="p-4 rounded-xl border border-cream-300 bg-cream-50/50 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-ink-lighter uppercase tracking-wide">
                  Type {index + 1}
                </span>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={type.is_active}
                      onChange={(e) => updateType(type.id, "is_active", e.target.checked)}
                      className="w-4 h-4 rounded border-cream-300 text-sage focus:ring-sage/30"
                    />
                    <span className="text-xs text-ink-lighter">Active</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => removeType(type.id)}
                    disabled={types.length <= 1}
                    className="p-1 text-ink-lighter hover:text-red-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Remove session type"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-ink-light mb-1">Name</label>
                  <input
                    type="text"
                    value={type.name}
                    onChange={(e) => updateType(type.id, "name", e.target.value)}
                    placeholder="e.g. Intro Call"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage text-sm transition-shadow"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-light mb-1">Duration</label>
                  <select
                    value={type.duration_mins}
                    onChange={(e) => updateType(type.id, "duration_mins", Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage text-sm transition-shadow appearance-none"
                  >
                    {SESSION_DURATIONS.map((d) => (
                      <option key={d} value={d}>
                        {d} min
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-light mb-1">Rate</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-lighter">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={type.rate_inr / 100}
                      onChange={(e) =>
                        updateType(type.id, "rate_inr", Math.round(parseFloat(e.target.value || "0") * 100))
                      }
                      placeholder="0"
                      className="w-full pl-7 pr-3 py-2 rounded-xl border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage text-sm transition-shadow"
                    />
                  </div>
                  {type.rate_inr === 0 && (
                    <p className="text-[10px] text-sage font-medium mt-0.5">Free</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-light mb-1">
                  Description <span className="text-ink-lighter font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={type.description ?? ""}
                  onChange={(e) => updateType(type.id, "description", e.target.value || null)}
                  placeholder="Brief description shown on booking page"
                  className="w-full px-3 py-2 rounded-xl border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage text-sm transition-shadow"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Add type button */}
        {types.length < 10 && (
          <button
            type="button"
            onClick={addType}
            className="flex items-center gap-1.5 text-sm font-medium text-sage hover:text-sage-500 transition-colors"
          >
            <Plus size={16} />
            Add session type
          </button>
        )}

        {/* Save */}
        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={updateTypes.isPending}
            className="bg-sage text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-sage-500 transition-all disabled:opacity-50 shadow-md shadow-sage/20"
          >
            {updateTypes.isPending ? "Saving..." : "Save Session Types"}
          </button>
          {updateTypes.error && (
            <span className="text-sm text-red-600">{updateTypes.error.message}</span>
          )}
        </div>
      </form>
    </section>
  );
}
