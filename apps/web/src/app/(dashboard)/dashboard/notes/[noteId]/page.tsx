"use client";

import { use } from "react";
import { trpc } from "@/lib/trpc";
import NoteEditor from "@/components/notes/NoteEditor";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

export default function EditNotePage({ params }: { params: Promise<{ noteId: string }> }) {
  const { noteId } = use(params);
  const note = trpc.session.getNoteById.useQuery({ note_id: noteId });

  if (note.isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="h-6 w-24 bg-cream-200 rounded-lg animate-pulse" />
        <div className="bg-white rounded-2xl border border-cream-300 shadow-sm p-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-cream-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (note.error || !note.data) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Link href="/dashboard/notes" className="inline-flex items-center gap-1 text-sm text-sage hover:text-sage-600 transition-colors">
          <ArrowLeft size={14} />
          Back to notes
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700 text-sm">Note not found</p>
        </div>
      </div>
    );
  }

  const n = note.data;
  const sessions = n.sessions as { starts_at: string; ends_at: string; client_id: string; clients: { full_name: string } | null } | null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/dashboard/notes" className="inline-flex items-center gap-1 text-sm text-sage hover:text-sage-600 transition-colors">
        <ArrowLeft size={14} />
        Back to notes
      </Link>

      <div className="flex items-center gap-2">
        <FileText size={22} className="text-sage" />
        <h1 className="text-2xl font-heading font-bold text-ink">Edit Note</h1>
      </div>

      <div className="bg-white rounded-2xl border border-cream-300 shadow-sm p-6">
        <NoteEditor
          sessionId={n.session_id}
          existingNote={{
            id: n.id,
            note_type: n.note_type,
            subjective: n.subjective,
            objective: n.objective,
            assessment: n.assessment,
            plan: n.plan,
            freeform_content: n.freeform_content,
            homework: n.homework,
            techniques_used: n.techniques_used,
            risk_flags: n.risk_flags,
          }}
          sessionInfo={sessions ? {
            clientName: sessions.clients?.full_name ?? "Unknown",
            startsAt: sessions.starts_at,
          } : undefined}
        />
      </div>
    </div>
  );
}
