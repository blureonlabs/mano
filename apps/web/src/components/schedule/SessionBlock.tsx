import { formatTimeIST } from "@/lib/date-utils";

interface SessionBlockProps {
  id: string;
  clientName: string;
  startsAt: string;
  endsAt: string;
  status: string;
  sessionTypeName: string | null;
  top: number;
  height: number;
  onClick: (id: string) => void;
}

const STATUS_STYLES: Record<string, string> = {
  pending_approval: "border-l-4 border-l-amber bg-amber-50 hover:bg-amber-100/80",
  scheduled: "border-l-4 border-l-sage bg-sage-50 hover:bg-sage-100/60",
  completed: "border-l-4 border-l-cream-400 bg-cream-100 opacity-60",
  cancelled: "border-l-4 border-l-red-300 bg-red-50 opacity-40 line-through",
  no_show: "border-l-4 border-l-red-500 bg-red-50 ring-1 ring-red-200",
};

export default function SessionBlock({
  id,
  clientName,
  startsAt,
  endsAt,
  status,
  sessionTypeName,
  top,
  height,
  onClick,
}: SessionBlockProps) {
  const isCompact = height < 40;

  return (
    <button
      onClick={() => onClick(id)}
      className={`absolute left-0.5 right-0.5 rounded-md px-1.5 py-0.5 text-left overflow-hidden cursor-pointer transition-colors ${STATUS_STYLES[status] ?? STATUS_STYLES.scheduled}`}
      style={{ top: `${top}px`, height: `${Math.max(20, height - 2)}px` }}
      title={`${clientName} · ${formatTimeIST(startsAt)} – ${formatTimeIST(endsAt)}`}
    >
      {isCompact ? (
        <span className="text-[10px] font-medium text-ink truncate block">
          {clientName}
        </span>
      ) : (
        <>
          <span className="text-[11px] font-semibold text-ink truncate block leading-tight">
            {clientName}
          </span>
          <span className="text-[10px] text-ink-lighter truncate block leading-tight">
            {formatTimeIST(startsAt)} – {formatTimeIST(endsAt)}
          </span>
          {sessionTypeName && height >= 56 && (
            <span className="text-[9px] text-ink-lighter truncate block leading-tight mt-0.5">
              {sessionTypeName}
            </span>
          )}
        </>
      )}
    </button>
  );
}

interface BlockedSlotBlockProps {
  id: string;
  reason: string | null;
  startAt: string;
  endAt: string;
  top: number;
  height: number;
  onClick: (block: { id: string; start_at: string; end_at: string; reason: string | null }) => void;
}

export function BlockedSlotBlock({
  id,
  reason,
  startAt,
  endAt,
  top,
  height,
  onClick,
}: BlockedSlotBlockProps) {
  return (
    <button
      onClick={() => onClick({ id, start_at: startAt, end_at: endAt, reason })}
      className="absolute left-0.5 right-0.5 rounded-md px-1.5 py-0.5 text-left overflow-hidden cursor-pointer transition-colors bg-cream-200/60 hover:bg-cream-300/60 border border-dashed border-cream-400"
      style={{
        top: `${top}px`,
        height: `${Math.max(20, height - 2)}px`,
        backgroundImage:
          "repeating-linear-gradient(135deg, transparent, transparent 4px, rgba(0,0,0,0.03) 4px, rgba(0,0,0,0.03) 8px)",
      }}
      title={reason ? `Break: ${reason} (click to edit)` : "Break (click to edit)"}
    >
      <span className="text-[10px] text-ink-lighter truncate block">
        {reason || "Break"}
      </span>
    </button>
  );
}
