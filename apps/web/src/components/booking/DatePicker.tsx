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
      <h3 className="text-sm font-medium text-ink-lighter uppercase tracking-wider">
        Select a date
      </h3>
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        {dates.map((d) => {
          const dateStr = toDateStr(d);
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === toDateStr(today);

          return (
            <button
              key={dateStr}
              onClick={() => onSelect(dateStr)}
              className={`flex-shrink-0 w-[68px] py-3 rounded-small border text-center transition-all ${
                isSelected
                  ? "bg-sage text-white border-sage shadow-sm"
                  : "bg-card border-cream-300 text-ink hover:border-sage-200 hover:bg-sage-50"
              }`}
            >
              <div className={`text-[11px] font-medium ${isSelected ? "text-white/80" : "text-ink-lighter"}`}>
                {isToday ? "Today" : DAYS[d.getDay()]}
              </div>
              <div className="text-lg font-heading font-semibold">
                {d.getDate()}
              </div>
              <div className={`text-[11px] ${isSelected ? "text-white/70" : "text-ink-lighter"}`}>
                {MONTHS[d.getMonth()]}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
