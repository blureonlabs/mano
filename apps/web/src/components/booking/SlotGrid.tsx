interface TimeSlot {
  start: string;
  end: string;
}

interface SlotGridProps {
  slots: TimeSlot[];
  selectedSlot: TimeSlot | null;
  onSelect: (slot: TimeSlot) => void;
  loading: boolean;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
}

function getHour(iso: string): number {
  const d = new Date(iso);
  // Convert to IST
  const ist = new Date(d.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  return ist.getHours();
}

export default function SlotGrid({
  slots,
  selectedSlot,
  onSelect,
  loading,
}: SlotGridProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-ink-lighter uppercase tracking-wider">
          Available times
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-11 bg-cream-200 rounded-xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-ink-lighter uppercase tracking-wider">
          Available times
        </h3>
        <div className="bg-white border border-cream-300 rounded-xl p-8 text-center">
          <div className="w-10 h-10 rounded-full bg-cream-200 mx-auto mb-3 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ink-lighter">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <p className="text-ink-lighter text-sm">
            No available slots on this day
          </p>
          <p className="text-ink-lighter/60 text-xs mt-1">
            Try selecting a different date
          </p>
        </div>
      </div>
    );
  }

  // Group slots by morning / afternoon / evening
  const morning = slots.filter((s) => getHour(s.start) < 12);
  const afternoon = slots.filter((s) => {
    const h = getHour(s.start);
    return h >= 12 && h < 17;
  });
  const evening = slots.filter((s) => getHour(s.start) >= 17);

  const groups = [
    { label: "Morning", icon: "M", slots: morning },
    { label: "Afternoon", icon: "A", slots: afternoon },
    { label: "Evening", icon: "E", slots: evening },
  ].filter((g) => g.slots.length > 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-ink-lighter uppercase tracking-wider">
          Available times
        </h3>
        <span className="text-xs text-ink-lighter">
          {slots.length} slot{slots.length !== 1 ? "s" : ""}
        </span>
      </div>

      {groups.map((group) => (
        <div key={group.label} className="space-y-2">
          <div className="text-[11px] font-medium text-ink-lighter flex items-center gap-1.5">
            {group.label === "Morning" && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            )}
            {group.label === "Afternoon" && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-500">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            )}
            {group.label === "Evening" && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-sage-400">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
            {group.label}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {group.slots.map((slot) => {
              const isSelected =
                selectedSlot?.start === slot.start &&
                selectedSlot?.end === slot.end;

              return (
                <button
                  key={slot.start}
                  onClick={() => onSelect(slot)}
                  className={`py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isSelected
                      ? "bg-sage text-white shadow-md shadow-sage/20"
                      : "bg-white border border-cream-300 text-ink hover:border-sage-300 hover:text-sage hover:shadow-sm"
                  }`}
                >
                  {formatTime(slot.start)}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
