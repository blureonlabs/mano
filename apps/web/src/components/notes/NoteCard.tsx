import Link from "next/link";
import { FileText, Clock, AlertTriangle } from "lucide-react";
import { NOTE_TEMPLATES, type NoteTemplate } from "@mano/shared";

interface NoteCardProps {
  note: {
    id: string;
    note_type: string;
    subjective: string | null;
    freeform_content: string | null;
    risk_flags: string[];
    created_at: string;
    sessions: {
      starts_at: string;
      client_id: string;
      clients: { full_name: string } | null;
    } | null;
  };
}

export default function NoteCard({ note }: NoteCardProps) {
  const template = NOTE_TEMPLATES[note.note_type as NoteTemplate];
  const clientName = note.sessions?.clients?.full_name ?? "Unknown";
  const preview = note.freeform_content || note.subjective || "";
  const hasRiskFlags = note.risk_flags && note.risk_flags.length > 0;

  return (
    <Link
      href={`/dashboard/notes/${note.id}`}
      className="block px-6 py-4 hover:bg-cream-50 transition-colors"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-sage-50 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-xs font-semibold text-sage">
              {clientName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-ink">{clientName}</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-[11px] font-medium bg-cream-100 text-ink-lighter">
                <FileText size={10} />
                {template?.name ?? note.note_type}
              </span>
              {hasRiskFlags && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-pill text-[10px] font-medium bg-red-50 text-red-600">
                  <AlertTriangle size={9} />
                  Risk
                </span>
              )}
            </div>
            {preview && (
              <p className="text-xs text-ink-lighter mt-0.5 truncate max-w-md">
                {preview.slice(0, 120)}{preview.length > 120 ? "..." : ""}
              </p>
            )}
            <div className="flex items-center gap-1 mt-1 text-[11px] text-ink-lighter">
              <Clock size={10} />
              {note.sessions ? (
                new Date(note.sessions.starts_at).toLocaleDateString("en-IN", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  timeZone: "Asia/Kolkata",
                })
              ) : (
                new Date(note.created_at).toLocaleDateString("en-IN", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  timeZone: "Asia/Kolkata",
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
