"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { trpc } from "@/lib/trpc";
import NoteEditor from "@/components/notes/NoteEditor";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

function NewNoteContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  // Check if a note already exists for this session
  const existingNote = trpc.session.getNote.useQuery(
    { session_id: sessionId! },
    { enabled: !!sessionId }
  );

  if (!sessionId) {
    return (
      <div className="bg-white rounded-2xl border border-cream-300 shadow-sm p-10 text-center">
        <div className="w-12 h-12 rounded-full bg-cream-200 mx-auto mb-3 flex items-center justify-center">
          <FileText size={20} className="text-ink-lighter" />
        </div>
        <p className="text-sm text-ink-lighter">No session selected</p>
        <p className="text-xs text-ink-lighter/60 mt-1">
          Add notes from the schedule page by clicking the note icon on a session
        </p>
      </div>
    );
  }

  if (existingNote.isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-cream-300 shadow-sm p-6 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-cream-200 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  const note = existingNote.data;

  return (
    <>
      <div className="flex items-center gap-2">
        <FileText size={22} className="text-sage" />
        <h1 className="text-2xl font-heading font-bold text-ink">
          {note ? "Edit Note" : "New Note"}
        </h1>
      </div>

      <div className="bg-white rounded-2xl border border-cream-300 shadow-sm p-6">
        <NoteEditor
          sessionId={sessionId}
          existingNote={note ? {
            id: note.id,
            note_type: note.note_type,
            subjective: note.subjective,
            objective: note.objective,
            assessment: note.assessment,
            plan: note.plan,
            freeform_content: note.freeform_content,
            homework: note.homework,
            techniques_used: note.techniques_used,
            risk_flags: note.risk_flags,
          } : undefined}
        />
      </div>
    </>
  );
}

export default function NewNotePage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/dashboard/notes" className="inline-flex items-center gap-1 text-sm text-sage hover:text-sage-600 transition-colors">
        <ArrowLeft size={14} />
        Back to notes
      </Link>

      <Suspense fallback={
        <div className="bg-white rounded-2xl border border-cream-300 shadow-sm p-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-cream-200 rounded-xl animate-pulse" />
          ))}
        </div>
      }>
        <NewNoteContent />
      </Suspense>
    </div>
  );
}
