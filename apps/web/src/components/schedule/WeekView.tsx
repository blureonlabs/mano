import { useMemo } from "react";
import {
  getWeekDays,
  formatShortDateIST,
  getISTHour,
  getISTMinutes,
  formatHourLabel,
  isSameISTDay,
  makeISTDateTime,
} from "@/lib/date-utils";
import SessionBlock, { BlockedSlotBlock } from "./SessionBlock";

const HOUR_HEIGHT = 60;
const START_HOUR = 8;
const END_HOUR = 21;
const TOTAL_HOURS = END_HOUR - START_HOUR;

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

interface WeekViewProps {
  weekStart: Date;
  sessions: SessionData[];
  blockedSlots: BlockedSlotData[];
  isLoading: boolean;
  onSessionClick: (id: string) => void;
  onEmptySlotClick: (start: string, end: string) => void;
  onBlockedSlotClick: (block: { id: string; start_at: string; end_at: string; reason: string | null }) => void;
  onDayClick: (day: Date) => void;
}

function getBlockPosition(startISO: string, endISO: string) {
  const start = new Date(startISO);
  const end = new Date(endISO);
  const startHour = getISTHour(start) + getISTMinutes(start) / 60;
  const endHour = getISTHour(end) + getISTMinutes(end) / 60;

  const top = (startHour - START_HOUR) * HOUR_HEIGHT;
  const height = (endHour - startHour) * HOUR_HEIGHT;
  return {
    top: Math.max(0, top),
    height: Math.max(HOUR_HEIGHT / 4, height),
  };
}

export default function WeekView({
  weekStart,
  sessions,
  blockedSlots,
  isLoading,
  onSessionClick,
  onEmptySlotClick,
  onBlockedSlotClick,
  onDayClick,
}: WeekViewProps) {
  const days = useMemo(() => getWeekDays(weekStart), [weekStart]);
  const today = new Date();
  const hours = Array.from({ length: TOTAL_HOURS }, (_, i) => START_HOUR + i);

  // Group sessions by day
  const sessionsByDay = useMemo(() => {
    const map = new Map<number, SessionData[]>();
    for (let i = 0; i < 7; i++) map.set(i, []);
    for (const s of sessions) {
      const dayIdx = days.findIndex((d) => isSameISTDay(d, new Date(s.starts_at)));
      if (dayIdx >= 0) map.get(dayIdx)!.push(s);
    }
    return map;
  }, [sessions, days]);

  // Group blocked slots by day
  const blocksByDay = useMemo(() => {
    const map = new Map<number, BlockedSlotData[]>();
    for (let i = 0; i < 7; i++) map.set(i, []);
    for (const b of blockedSlots) {
      const dayIdx = days.findIndex((d) => isSameISTDay(d, new Date(b.start_at)));
      if (dayIdx >= 0) map.get(dayIdx)!.push(b);
    }
    return map;
  }, [blockedSlots, days]);

  function handleCellClick(dayIdx: number, hour: number) {
    const day = days[dayIdx];
    if (!day) return;
    const start = makeISTDateTime(day, hour);
    const end = makeISTDateTime(day, hour + 1);
    onEmptySlotClick(start, end);
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-cream-300 p-6">
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-cream-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-cream-300 overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Day headers */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-cream-300">
            <div className="p-2" /> {/* Time column spacer */}
            {days.map((day, idx) => {
              const { dayName, dateNum } = formatShortDateIST(day);
              const isToday = isSameISTDay(day, today);
              return (
                <button
                  key={idx}
                  onClick={() => onDayClick(day)}
                  className={`p-2 text-center border-l border-cream-300 hover:bg-cream-50 transition-colors ${
                    isToday ? "bg-sage-50/40" : ""
                  }`}
                >
                  <div className="text-[11px] text-ink-lighter uppercase tracking-wide">
                    {dayName}
                  </div>
                  <div className={`text-sm font-semibold ${isToday ? "text-sage" : "text-ink"}`}>
                    {dateNum}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Time grid */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)]">
            {/* Time labels */}
            <div className="relative" style={{ height: `${TOTAL_HOURS * HOUR_HEIGHT}px` }}>
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="absolute right-2 text-[10px] text-ink-lighter -translate-y-1/2"
                  style={{ top: `${(hour - START_HOUR) * HOUR_HEIGHT}px` }}
                >
                  {formatHourLabel(hour)}
                </div>
              ))}
            </div>

            {/* Day columns */}
            {days.map((day, dayIdx) => {
              const isToday = isSameISTDay(day, today);
              const daySessions = sessionsByDay.get(dayIdx) ?? [];
              const dayBlocks = blocksByDay.get(dayIdx) ?? [];

              return (
                <div
                  key={dayIdx}
                  className={`relative border-l border-cream-300 ${isToday ? "bg-sage-50/20" : ""}`}
                  style={{ height: `${TOTAL_HOURS * HOUR_HEIGHT}px` }}
                >
                  {/* Hour lines */}
                  {hours.map((hour) => (
                    <div
                      key={hour}
                      className="absolute left-0 right-0 border-t border-cream-200 cursor-pointer hover:bg-cream-50/50 transition-colors"
                      style={{
                        top: `${(hour - START_HOUR) * HOUR_HEIGHT}px`,
                        height: `${HOUR_HEIGHT}px`,
                      }}
                      onClick={() => handleCellClick(dayIdx, hour)}
                    />
                  ))}

                  {/* Blocked slots */}
                  {dayBlocks.map((block) => {
                    const pos = getBlockPosition(block.start_at, block.end_at);
                    return (
                      <BlockedSlotBlock
                        key={block.id}
                        id={block.id}
                        reason={block.reason}
                        startAt={block.start_at}
                        endAt={block.end_at}
                        top={pos.top}
                        height={pos.height}
                        onClick={onBlockedSlotClick}
                      />
                    );
                  })}

                  {/* Sessions */}
                  {daySessions.map((session) => {
                    const pos = getBlockPosition(session.starts_at, session.ends_at);
                    return (
                      <SessionBlock
                        key={session.id}
                        id={session.id}
                        clientName={session.clients.full_name}
                        startsAt={session.starts_at}
                        endsAt={session.ends_at}
                        status={session.status}
                        sessionTypeName={session.session_type_name}
                        top={pos.top}
                        height={pos.height}
                        onClick={onSessionClick}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
