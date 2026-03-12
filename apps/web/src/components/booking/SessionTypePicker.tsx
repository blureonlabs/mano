import { Clock } from "lucide-react";

interface SessionTypeOption {
  id: string;
  name: string;
  duration_mins: number;
  rate_inr: number;
  description: string | null;
}

interface SessionTypePickerProps {
  sessionTypes: SessionTypeOption[];
  onSelect: (sessionType: SessionTypeOption) => void;
}

export default function SessionTypePicker({ sessionTypes, onSelect }: SessionTypePickerProps) {
  if (sessionTypes.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-ink-lighter">No session types available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-ink">Choose a session type</h3>
      <div className="space-y-2">
        {sessionTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => onSelect(type)}
            className="w-full text-left p-4 rounded-xl border border-cream-300 bg-white hover:border-sage hover:bg-sage-50/30 transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-ink group-hover:text-sage transition-colors">
                {type.name}
              </span>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill bg-cream-100 text-xs text-ink-lighter">
                  <Clock size={10} />
                  {type.duration_mins} min
                </span>
                <span className={`px-2 py-0.5 rounded-pill text-xs font-medium ${
                  type.rate_inr === 0
                    ? "bg-sage-50 text-sage"
                    : "bg-cream-100 text-ink-light"
                }`}>
                  {type.rate_inr === 0 ? "Free" : `₹${(type.rate_inr / 100).toLocaleString("en-IN")}`}
                </span>
              </div>
            </div>
            {type.description && (
              <p className="text-xs text-ink-lighter mt-1">{type.description}</p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
