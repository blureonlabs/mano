"use client";

import { useMemo } from "react";
import {
  getMonthGrid,
  isSameISTDay,
  toISTDateString,
  getISTMonth,
} from "@/lib/date-utils";

interface SessionData {
  id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  session_type_name: string | null;
  clients: { full_name: string; email: string; phone: string | null };
}

interface BlockedSlotData {
  id: string;
  start_at: string;
  end_at: string;
  reason: string | null;
}

interface MonthViewProps {
  monthDate: Date;
  sessions: SessionData[];
  blockedSlots: BlockedSlotData[];
  isLoading: boolean;
  onDayClick: (day: Date) => void;
}

const DAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const STATUS_DOT: Record<string, string> = {
  pending_approval: "bg-amber",
  scheduled: "bg-sage",
  completed: "bg-cream-400",
  cancelled: "bg-red-300",
  no_show: "bg-red-400",
};

export default function MonthView({
  monthDate,
  sessions,
  blockedSlots,
  isLoading,
  onDayClick,
}: MonthViewProps) {
  const grid = useMemo(() => getMonthGrid(monthDate), [monthDate]);
  const currentMonth = getISTMonth(monthDate);
  const todayStr = toISTDateString(new Date());

  // Group sessions by IST date string for fast lookup
  const sessionsByDate = useMemo(() => {
    const map: Record<string, SessionData[]> = {};
    for (const s of sessions) {
      const dateStr = toISTDateString(new Date(s.starts_at));
      if (!map[dateStr]) map[dateStr] = [];
      map[dateStr]!.push(s);
    }
    return map;
  }, [sessions]);

  // Group blocked slots by date
  const blockedByDate = useMemo(() => {
    const map: Record<string, number> = {};
    for (const b of blockedSlots) {
      const dateStr = toISTDateString(new Date(b.start_at));
      map[dateStr] = (map[dateStr] ?? 0) + 1;
    }
    return map;
  }, [blockedSlots]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-cream-300 shadow-sm p-4">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAY_HEADERS.map((d) => (
            <div key={d} className="text-center text-[11px] font-medium text-ink-lighter py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 42 }).map((_, i) => (
            <div key={i} className="h-20 bg-cream-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-cream-300 shadow-sm p-4">
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAY_HEADERS.map((d) => (
          <div key={d} className="text-center text-[11px] font-medium text-ink-lighter py-1">{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {grid.map((day, i) => {
          const dateStr = toISTDateString(day);
          const dayMonth = getISTMonth(day);
          const isCurrentMonth = dayMonth === currentMonth;
          const isToday = dateStr === todayStr;
          const daySessions = sessionsByDate[dateStr] ?? [];
          const hasBlocked = (blockedByDate[dateStr] ?? 0) > 0;

          // Count by status
          const statusCounts: Record<string, number> = {};
          for (const s of daySessions) {
            statusCounts[s.status] = (statusCounts[s.status] ?? 0) + 1;
          }

          return (
            <button
              key={i}
              onClick={() => onDayClick(day)}
              className={`
                relative h-20 rounded-lg p-1.5 text-left transition-colors
                ${isToday ? "bg-sage-50/50 ring-1 ring-sage/30" : "hover:bg-cream-50"}
                ${!isCurrentMonth ? "opacity-40" : ""}
              `}
            >
              {/* Date number */}
              <span className={`text-xs font-medium ${isToday ? "text-sage font-bold" : "text-ink-light"}`}>
                {day.toLocaleDateString("en-IN", { day: "numeric", timeZone: "Asia/Kolkata" })}
              </span>

              {/* Session dots */}
              {daySessions.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-0.5">
                  {daySessions.length <= 4 ? (
                    daySessions.map((s) => (
                      <span
                        key={s.id}
                        className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[s.status] ?? "bg-cream-300"}`}
                        title={`${s.clients.full_name} (${s.status})`}
                      />
                    ))
                  ) : (
                    <>
                      {daySessions.slice(0, 3).map((s) => (
                        <span
                          key={s.id}
                          className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[s.status] ?? "bg-cream-300"}`}
                        />
                      ))}
                      <span className="text-[9px] text-ink-lighter leading-none">
                        +{daySessions.length - 3}
                      </span>
                    </>
                  )}
                </div>
              )}

              {/* Session count badge (bottom) */}
              {daySessions.length > 0 && (
                <div className="absolute bottom-1.5 right-1.5">
                  <span className="text-[10px] font-medium text-ink-lighter">
                    {daySessions.length}
                  </span>
                </div>
              )}

              {/* Blocked indicator */}
              {hasBlocked && (
                <div className="absolute top-1.5 right-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cream-400 block" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
