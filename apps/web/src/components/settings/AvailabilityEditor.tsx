import { useState } from "react";
import { trpc } from "@/lib/trpc";

interface AvailabilityRule {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface AvailabilityEditorProps {
  availability: AvailabilityRule[];
}

const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Generate time options in 30-min intervals from 06:00 to 22:00
const TIME_OPTIONS: string[] = [];
for (let h = 6; h <= 22; h++) {
  for (const m of ["00", "30"]) {
    if (h === 22 && m === "30") continue;
    TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:${m}`);
  }
}

function formatTimeLabel(t: string): string {
  const parts = t.split(":").map(Number);
  const h = parts[0] as number;
  const m = parts[1] as number;
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}

export default function AvailabilityEditor({ availability }: AvailabilityEditorProps) {
  // Build initial state: 7 days, merge with existing rules
  const initialDays = Array.from({ length: 7 }, (_, i) => {
    const existing = availability.find((a) => a.day_of_week === i);
    return {
      day_of_week: i,
      is_active: existing?.is_active ?? false,
      start_time: existing?.start_time?.slice(0, 5) ?? "10:00",
      end_time: existing?.end_time?.slice(0, 5) ?? "18:00",
    };
  });

  const [days, setDays] = useState(initialDays);
  const [savingDay, setSavingDay] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const setAvailability = trpc.therapist.setAvailability.useMutation({
    onSuccess: () => {
      utils.therapist.getAvailability.invalidate();
      setSavingDay(null);
    },
    onError: () => {
      setSavingDay(null);
    },
  });

  function saveDay(day: (typeof days)[0]) {
    setSavingDay(day.day_of_week);
    setAvailability.mutate({
      day_of_week: day.day_of_week,
      start_time: day.start_time,
      end_time: day.end_time,
      is_active: day.is_active,
    });
  }

  function handleToggle(dayIndex: number) {
    const updated = days.map((d) =>
      d.day_of_week === dayIndex ? { ...d, is_active: !d.is_active } : d
    );
    setDays(updated);
    const day = updated.find((d) => d.day_of_week === dayIndex);
    if (day) saveDay(day);
  }

  function handleTimeChange(dayIndex: number, field: "start_time" | "end_time", value: string) {
    const updated = days.map((d) =>
      d.day_of_week === dayIndex ? { ...d, [field]: value } : d
    );
    setDays(updated);
    const day = updated.find((d) => d.day_of_week === dayIndex);
    if (day?.is_active) {
      saveDay(day);
    }
  }

  return (
    <section className="bg-white rounded-2xl border border-cream-300 shadow-sm p-6 space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sage">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <h2 className="text-lg font-heading font-semibold text-ink">Availability</h2>
        </div>
        <p className="text-sm text-ink-lighter">
          Set your weekly schedule. Changes save automatically.
        </p>
      </div>

      <div className="space-y-2">
        {/* Header row - desktop */}
        <div className="hidden sm:grid sm:grid-cols-[120px_48px_1fr_1fr_32px] gap-3 px-2 text-[11px] font-semibold text-ink-lighter uppercase tracking-wider">
          <div>Day</div>
          <div></div>
          <div>Start</div>
          <div>End</div>
          <div></div>
        </div>

        {days.map((day) => (
          <div
            key={day.day_of_week}
            className={`flex flex-col sm:grid sm:grid-cols-[120px_48px_1fr_1fr_32px] gap-2 sm:gap-3 items-start sm:items-center p-3 rounded-xl transition-colors ${
              day.is_active ? "bg-sage-50/40" : "bg-cream-50"
            }`}
          >
            {/* Day name */}
            <div className="flex items-center justify-between w-full sm:w-auto">
              <span
                className={`text-sm font-medium ${
                  day.is_active ? "text-ink" : "text-ink-lighter"
                }`}
              >
                <span className="hidden sm:inline">{DAY_LABELS[day.day_of_week]}</span>
                <span className="sm:hidden">{DAY_SHORT[day.day_of_week]}</span>
              </span>
              {/* Toggle - shown inline on mobile */}
              <button
                type="button"
                onClick={() => handleToggle(day.day_of_week)}
                className={`sm:hidden relative w-10 h-6 rounded-full transition-colors ${
                  day.is_active ? "bg-sage" : "bg-cream-300"
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform shadow-sm ${
                    day.is_active ? "translate-x-4" : ""
                  }`}
                />
              </button>
            </div>

            {/* Toggle - desktop */}
            <button
              type="button"
              onClick={() => handleToggle(day.day_of_week)}
              className={`hidden sm:block relative w-10 h-6 rounded-full transition-colors ${
                day.is_active ? "bg-sage" : "bg-cream-300"
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform shadow-sm ${
                  day.is_active ? "translate-x-4" : ""
                }`}
              />
            </button>

            {/* Time selects */}
            {day.is_active ? (
              <div className="flex items-center gap-2 w-full sm:contents">
                <select
                  value={day.start_time}
                  onChange={(e) =>
                    handleTimeChange(day.day_of_week, "start_time", e.target.value)
                  }
                  className="flex-1 sm:w-auto px-2.5 py-2 rounded-lg border border-cream-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage appearance-none"
                >
                  {TIME_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {formatTimeLabel(t)}
                    </option>
                  ))}
                </select>

                <span className="text-ink-lighter text-xs">to</span>

                <select
                  value={day.end_time}
                  onChange={(e) =>
                    handleTimeChange(day.day_of_week, "end_time", e.target.value)
                  }
                  className="flex-1 sm:w-auto px-2.5 py-2 rounded-lg border border-cream-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage appearance-none"
                >
                  {TIME_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {formatTimeLabel(t)}
                    </option>
                  ))}
                </select>

                {/* Saving indicator */}
                <div className="w-6 flex justify-center">
                  {savingDay === day.day_of_week && (
                    <svg className="animate-spin h-4 w-4 text-sage" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-sm text-ink-lighter italic sm:col-span-3">
                Unavailable
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
