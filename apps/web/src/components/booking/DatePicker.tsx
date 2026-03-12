const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

interface DatePickerProps {
  selectedDate: string; // YYYY-MM-DD
  onSelect: (date: string) => void;
}

function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0] as string;
}

export default function DatePicker({ selectedDate, onSelect }: DatePickerProps) {
  const today = new Date();
  const dates: Date[] = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(d);
  }

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-ink-lighter uppercase tracking-wider">
        Select a date
      </h3>
      <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        {dates.map((d) => {
          const dateStr = toDateStr(d);
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === toDateStr(today);

          return (
            <button
              key={dateStr}
              onClick={() => onSelect(dateStr)}
              className={`flex-shrink-0 w-16 py-2.5 rounded-xl text-center transition-all duration-200 ${
                isSelected
                  ? "bg-sage text-white shadow-md shadow-sage/20 scale-[1.02]"
                  : "bg-white border border-cream-300 text-ink hover:border-sage-200 hover:shadow-sm"
              }`}
            >
              <div
                className={`text-[10px] font-semibold uppercase tracking-wide ${
                  isSelected ? "text-white/70" : "text-ink-lighter"
                }`}
              >
                {isToday ? "Today" : DAYS[d.getDay()]}
              </div>
              <div className="text-[18px] font-heading font-bold leading-tight mt-0.5">
                {d.getDate()}
              </div>
              <div
                className={`text-[10px] mt-0.5 ${
                  isSelected ? "text-white/60" : "text-ink-lighter"
                }`}
              >
                {MONTHS[d.getMonth()]}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
