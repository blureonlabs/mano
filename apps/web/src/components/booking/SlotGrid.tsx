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

export default function SlotGrid({
  slots,
  selectedSlot,
  onSelect,
  loading,
}: SlotGridProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-ink-lighter uppercase tracking-wider">
          Available times
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-11 bg-cream-200 rounded-small animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-ink-lighter uppercase tracking-wider">
          Available times
        </h3>
        <div className="bg-card border border-cream-300 rounded-small p-6 text-center">
          <p className="text-ink-lighter text-sm">
            No available slots on this day
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-ink-lighter uppercase tracking-wider">
        Available times ({slots.length})
      </h3>
      <div className="grid grid-cols-3 gap-2">
        {slots.map((slot) => {
          const isSelected =
            selectedSlot?.start === slot.start &&
            selectedSlot?.end === slot.end;

          return (
            <button
              key={slot.start}
              onClick={() => onSelect(slot)}
              className={`py-2.5 px-3 rounded-small border text-sm font-medium transition-all ${
                isSelected
                  ? "bg-sage text-white border-sage shadow-sm"
                  : "bg-card border-cream-300 text-ink hover:border-sage-200 hover:bg-sage-50"
              }`}
            >
              {formatTime(slot.start)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
