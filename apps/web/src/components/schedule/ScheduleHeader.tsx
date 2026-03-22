import { CalendarDays, ChevronLeft, ChevronRight, List, LayoutGrid, Plus, ArrowLeft } from "lucide-react";
import { formatWeekRange, formatDateIST, formatMonthYear } from "@/lib/date-utils";

interface ScheduleHeaderProps {
  viewMode: "calendar" | "list";
  calendarView: "week" | "day" | "month";
  weekStart: Date;
  monthDate: Date;
  selectedDay: Date | null;
  onViewModeChange: (mode: "calendar" | "list") => void;
  onCalendarViewChange: (view: "week" | "month") => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onBackToParent: () => void;
  onAddSession: () => void;
  pendingCount: number;
}

export default function ScheduleHeader({
  viewMode,
  calendarView,
  weekStart,
  monthDate,
  selectedDay,
  onViewModeChange,
  onCalendarViewChange,
  onPrevWeek,
  onNextWeek,
  onPrevMonth,
  onNextMonth,
  onToday,
  onBackToParent,
  onAddSession,
  pendingCount,
}: ScheduleHeaderProps) {
  return (
    <div className="space-y-3">
      {/* Top row: title + view toggle + add button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays size={22} className="text-sage" />
          <h1 className="text-2xl font-heading font-bold text-ink">Schedule</h1>
          {pendingCount > 0 && (
            <span className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber text-white text-[10px] font-bold">
              {pendingCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-xl border border-cream-300 overflow-hidden">
            <button
              onClick={() => onViewModeChange("list")}
              className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === "list"
                  ? "bg-sage text-white"
                  : "bg-white text-ink-lighter hover:bg-cream-50"
              }`}
            >
              <List size={14} />
              List
            </button>
            <button
              onClick={() => onViewModeChange("calendar")}
              className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === "calendar"
                  ? "bg-sage text-white"
                  : "bg-white text-ink-lighter hover:bg-cream-50"
              }`}
            >
              <LayoutGrid size={14} />
              Calendar
            </button>
          </div>

          {/* Add session */}
          <button
            onClick={onAddSession}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sage text-white text-xs font-semibold hover:bg-sage-500 transition-all shadow-sm"
          >
            <Plus size={14} />
            Add Session
          </button>
        </div>
      </div>

      {/* Navigation row (calendar only) */}
      {viewMode === "calendar" && (
        <div className="flex items-center justify-between">
          {calendarView === "day" && selectedDay ? (
            /* Day view: back button + day label */
            <div className="flex items-center gap-2">
              <button
                onClick={onBackToParent}
                className="inline-flex items-center gap-1 text-sm text-sage font-medium hover:text-sage-600 transition-colors"
              >
                <ArrowLeft size={16} />
                Back
              </button>
              <span className="text-sm font-medium text-ink">
                {formatDateIST(selectedDay.toISOString())}
              </span>
            </div>
          ) : calendarView === "month" ? (
            /* Month view: prev/next month + label + today */
            <div className="flex items-center gap-2">
              <button
                onClick={onPrevMonth}
                aria-label="Previous month"
                className="p-1.5 rounded-lg border border-cream-300 text-ink-lighter hover:bg-cream-50 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm font-medium text-ink min-w-[160px] text-center">
                {formatMonthYear(monthDate)}
              </span>
              <button
                onClick={onNextMonth}
                aria-label="Next month"
                className="p-1.5 rounded-lg border border-cream-300 text-ink-lighter hover:bg-cream-50 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
              <button
                onClick={onToday}
                className="ml-1 px-2.5 py-1 rounded-lg border border-cream-300 text-xs font-medium text-ink-light hover:bg-cream-50 transition-colors"
              >
                Today
              </button>
            </div>
          ) : (
            /* Week view: prev/next week + label + today */
            <div className="flex items-center gap-2">
              <button
                onClick={onPrevWeek}
                aria-label="Previous week"
                className="p-1.5 rounded-lg border border-cream-300 text-ink-lighter hover:bg-cream-50 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm font-medium text-ink min-w-[160px] text-center">
                {formatWeekRange(weekStart)}
              </span>
              <button
                onClick={onNextWeek}
                aria-label="Next week"
                className="p-1.5 rounded-lg border border-cream-300 text-ink-lighter hover:bg-cream-50 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
              <button
                onClick={onToday}
                className="ml-1 px-2.5 py-1 rounded-lg border border-cream-300 text-xs font-medium text-ink-light hover:bg-cream-50 transition-colors"
              >
                Today
              </button>
            </div>
          )}

          {/* Week/Month toggle (shown when not in day view) */}
          {calendarView !== "day" && (
            <div className="flex rounded-lg border border-cream-300 overflow-hidden">
              <button
                onClick={() => onCalendarViewChange("week")}
                className={`px-3 py-1 text-xs font-medium transition-colors ${
                  calendarView === "week"
                    ? "bg-cream-200 text-ink"
                    : "bg-white text-ink-lighter hover:bg-cream-50"
                }`}
              >
                Week
              </button>
              <button
                onClick={() => onCalendarViewChange("month")}
                className={`px-3 py-1 text-xs font-medium transition-colors ${
                  calendarView === "month"
                    ? "bg-cream-200 text-ink"
                    : "bg-white text-ink-lighter hover:bg-cream-50"
                }`}
              >
                Month
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
