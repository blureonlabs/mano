"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { NOTE_TEMPLATES, type NoteTemplate } from "@mano/shared";
import { useCustomTags } from "@/lib/use-custom-tags";
import NoteTypeSelector from "./NoteTypeSelector";
import { Save, AlertTriangle, Wrench, BookOpen } from "lucide-react";

interface NoteEditorProps {
  sessionId: string;
  existingNote?: {
    id: string;
    note_type: string;
    subjective: string | null;
    objective: string | null;
    assessment: string | null;
    plan: string | null;
    freeform_content: string | null;
    homework: string | null;
    techniques_used: string[];
    risk_flags: string[];
  };
  sessionInfo?: {
    clientName: string;
    startsAt: string;
  };
  onSaved?: () => void;
}

export default function NoteEditor({ sessionId, existingNote, sessionInfo, onSaved }: NoteEditorProps) {
  const { techniques: availableTechniques, riskFlags: availableRiskFlags } = useCustomTags();
  const [noteType, setNoteType] = useState<NoteTemplate>(
    (existingNote?.note_type as NoteTemplate) ?? "soap"
  );
  const [fields, setFields] = useState<Record<string, string>>({
    subjective: existingNote?.subjective ?? "",
    objective: existingNote?.objective ?? "",
    assessment: existingNote?.assessment ?? "",
    plan: existingNote?.plan ?? "",
    freeform_content: existingNote?.freeform_content ?? "",
  });
  const [homework, setHomework] = useState(existingNote?.homework ?? "");
  const [techniques, setTechniques] = useState<string[]>(existingNote?.techniques_used ?? []);
  const [riskFlags, setRiskFlags] = useState<string[]>(existingNote?.risk_flags ?? []);
  const [saved, setSaved] = useState(false);

  const utils = trpc.useUtils();

  const createNote = trpc.session.createNote.useMutation({
    onSuccess: () => {
      utils.session.listNotes.invalidate();
      utils.session.getNote.invalidate();
      setSaved(true);
      onSaved?.();
    },
  });

  const updateNote = trpc.session.updateNote.useMutation({
    onSuccess: () => {
      utils.session.listNotes.invalidate();
      utils.session.getNoteById.invalidate();
      setSaved(true);
      onSaved?.();
    },
  });

  const isPending = createNote.isPending || updateNote.isPending;

  function handleFieldChange(key: string, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  function toggleTechnique(t: string) {
    setTechniques((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  }

  function toggleRiskFlag(f: string) {
    setRiskFlags((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );
  }

  function handleSave() {
    const payload = {
      note_type: noteType,
      subjective: fields.subjective || null,
      objective: fields.objective || null,
      assessment: fields.assessment || null,
      plan: fields.plan || null,
      freeform_content: fields.freeform_content || null,
      homework: homework || null,
      techniques_used: techniques,
      risk_flags: riskFlags,
    };

    if (existingNote) {
      updateNote.mutate({ note_id: existingNote.id, data: payload });
    } else {
      createNote.mutate({ session_id: sessionId, ...payload });
    }
  }

  const template = NOTE_TEMPLATES[noteType];

  return (
    <div className="space-y-6">
      {/* Session info */}
      {sessionInfo && (
        <div className="flex items-center gap-3 px-4 py-3 bg-cream-50 rounded-xl border border-cream-300">
          <div className="w-8 h-8 rounded-full bg-sage-50 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-sage">
              {sessionInfo.clientName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <div className="text-sm font-medium text-ink">{sessionInfo.clientName}</div>
            <div className="text-xs text-ink-lighter">
              {new Date(sessionInfo.startsAt).toLocaleDateString("en-IN", {
                weekday: "short",
                day: "numeric",
                month: "short",
                timeZone: "Asia/Kolkata",
              })}{" "}
              &middot;{" "}
              {new Date(sessionInfo.startsAt).toLocaleTimeString("en-IN", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
                timeZone: "Asia/Kolkata",
              })}
            </div>
          </div>
        </div>
      )}

      {/* Note type selector */}
      <NoteTypeSelector selected={noteType} onChange={setNoteType} />

      {/* Template fields */}
      <div className="space-y-4">
        {template.fields.map((field) => (
          <div key={field.key}>
            <label className="block text-xs font-medium text-ink-light mb-1.5">
              {field.label}
            </label>
            <textarea
              value={fields[field.key] ?? ""}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              rows={field.key === "freeform_content" ? 8 : 4}
              className="w-full px-3.5 py-2.5 rounded-xl border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage text-sm transition-shadow resize-none"
            />
          </div>
        ))}
      </div>

      {/* Homework */}
      <div>
        <label className="flex items-center gap-1.5 text-xs font-medium text-ink-light mb-1.5">
          <BookOpen size={13} />
          Homework / Tasks for client
        </label>
        <textarea
          value={homework}
          onChange={(e) => setHomework(e.target.value)}
          placeholder="Worksheets, exercises, readings to share with client..."
          rows={2}
          className="w-full px-3.5 py-2.5 rounded-xl border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage text-sm transition-shadow resize-none"
        />
      </div>

      {/* Techniques used */}
      <div>
        <label className="flex items-center gap-1.5 text-xs font-medium text-ink-light mb-2">
          <Wrench size={13} />
          Techniques used
        </label>
        <div className="flex flex-wrap gap-1.5">
          {availableTechniques.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => toggleTechnique(t)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                techniques.includes(t)
                  ? "bg-sage-50 text-sage border border-sage/30"
                  : "bg-cream-100 text-ink-lighter hover:bg-cream-200 border border-transparent"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Risk flags */}
      <div>
        <label className="flex items-center gap-1.5 text-xs font-medium text-ink-light mb-2">
          <AlertTriangle size={13} className="text-red-500" />
          Risk flags
        </label>
        <div className="flex flex-wrap gap-1.5">
          {availableRiskFlags.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => toggleRiskFlag(f)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                riskFlags.includes(f)
                  ? "bg-red-50 text-red-600 border border-red-200"
                  : "bg-cream-100 text-ink-lighter hover:bg-cream-200 border border-transparent"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="bg-sage text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-sage-500 transition-all disabled:opacity-50 shadow-md shadow-sage/20 flex items-center gap-2"
        >
          <Save size={14} />
          {isPending ? "Saving..." : existingNote ? "Update Note" : "Save Note"}
        </button>
        {saved && (
          <span className="text-sm text-sage font-medium animate-pulse">Saved!</span>
        )}
        {(createNote.error || updateNote.error) && (
          <span className="text-sm text-red-600">
            {createNote.error?.message || updateNote.error?.message}
          </span>
        )}
      </div>
    </div>
  );
}
