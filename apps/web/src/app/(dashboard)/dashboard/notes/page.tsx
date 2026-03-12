"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { NOTE_TEMPLATES } from "@mano/shared";
import { FileText, Filter, Clock, AlertTriangle } from "lucide-react";

type NoteTemplate = keyof typeof NOTE_TEMPLATES;

export default function NotesPage() {
  const [clientFilter, setClientFilter] = useState<string>("");

  const notes = trpc.session.listNotes.useQuery({
    limit: 50,
    ...(clientFilter ? { client_id: clientFilter } : {}),
  });
  const clients = trpc.clients.list.useQuery();

  if (notes.isLoading) {
    return (
      <div className="max-w-3xl space-y-6">
        <div className="h-8 w-40 bg-cream-200 rounded-lg animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-white rounded-2xl border border-cream-300 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <FileText size={22} className="text-sage" />
          <h1 className="text-2xl font-heading font-bold text-ink">Session Notes</h1>
        </div>
        <p className="text-sm text-ink-lighter mt-0.5">
          {notes.data?.length ?? 0} note{(notes.data?.length ?? 0) !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Client filter */}
      {(clients.data?.length ?? 0) > 0 && (
        <div className="relative">
          <Filter size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-lighter" />
          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage text-sm appearance-none"
          >
            <option value="">All clients</option>
            {clients.data?.map((c) => (
              <option key={c.id} value={c.id}>{c.full_name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Notes list */}
      {(notes.data?.length ?? 0) === 0 ? (
        <div className="bg-white rounded-2xl border border-cream-300 shadow-sm p-10 text-center">
          <div className="w-12 h-12 rounded-full bg-cream-200 mx-auto mb-3 flex items-center justify-center">
            <FileText size={20} className="text-ink-lighter" />
          </div>
          <p className="text-sm text-ink-lighter">No session notes yet</p>
          <p className="text-xs text-ink-lighter/60 mt-1">
            Add notes from the schedule page after completing a session
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-cream-300 shadow-sm overflow-hidden divide-y divide-cream-300">
          {notes.data?.map((note) => {
            const sessions = note.sessions as { starts_at: string; client_id: string; clients: { full_name: string } | null } | null;
            const clientName = sessions?.clients?.full_name ?? "Unknown";
            const template = NOTE_TEMPLATES[note.note_type as NoteTemplate];
            const preview = note.freeform_content || note.subjective || "";
            const hasRiskFlags = note.risk_flags && note.risk_flags.length > 0;

            return (
              <Link
                key={note.id}
                href={`/dashboard/notes/${note.id}`}
                className="block px-6 py-4 hover:bg-cream-50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-sage-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-sage">
                      {clientName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
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
                      <p className="text-xs text-ink-lighter mt-0.5 truncate">
                        {preview.slice(0, 120)}{preview.length > 120 ? "..." : ""}
                      </p>
                    )}
                    <div className="flex items-center gap-1 mt-1 text-[11px] text-ink-lighter">
                      <Clock size={10} />
                      {sessions
                        ? new Date(sessions.starts_at).toLocaleDateString("en-IN", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                            timeZone: "Asia/Kolkata",
                          })
                        : new Date(note.created_at).toLocaleDateString("en-IN", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                            timeZone: "Asia/Kolkata",
                          })
                      }
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
