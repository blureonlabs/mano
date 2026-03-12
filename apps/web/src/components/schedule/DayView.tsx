import { useMemo } from "react";
import {
  getISTHour,
  getISTMinutes,
  formatHourLabel,
  isSameISTDay,
  makeISTDateTime,
} from "@/lib/date-utils";
import SessionBlock, { BlockedSlotBlock } from "./SessionBlock";

const HOUR_HEIGHT = 64;
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

interface DayViewProps {
  day: Date;
  sessions: SessionData[];
  blockedSlots: BlockedSlotData[];
  isLoading: boolean;
  onSessionClick: (id: string) => void;
  onEmptySlotClick: (start: string, end: string) => void;
  onBlockedSlotClick: (block: { id: string; start_at: string; end_at: string; reason: string | null }) => void;
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

export default function DayView({
  day,
  sessions,
  blockedSlots,
  isLoading,
  onSessionClick,
  onEmptySlotClick,
  onBlockedSlotClick,
}: DayViewProps) {
  const hours = Array.from({ length: TOTAL_HOURS }, (_, i) => START_HOUR + i);

  const daySessions = useMemo(
    () => sessions.filter((s) => isSameISTDay(new Date(s.starts_at), day)),
    [sessions, day]
  );

  const dayBlocks = useMemo(
    () => blockedSlots.filter((b) => isSameISTDay(new Date(b.start_at), day)),
    [blockedSlots, day]
  );

  function handleCellClick(hour: number) {
    const start = makeISTDateTime(day, hour);
    const end = makeISTDateTime(day, hour + 1);
    onEmptySlotClick(start, end);
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-cream-300 p-6 max-w-2xl mx-auto">
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 bg-cream-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-cream-300 overflow-hidden max-w-2xl mx-auto">
      <div className="grid grid-cols-[60px_1fr]">
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

        {/* Day column */}
        <div
          className="relative border-l border-cream-300"
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
              onClick={() => handleCellClick(hour)}
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
      </div>
    </div>
  );
}
