"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { THERAPY_MODALITIES, type TherapyModalityKey } from "@mano/shared";
import type { Goal } from "@mano/shared";
import GoalList from "./GoalList";
import { Save, Brain } from "lucide-react";

interface PlanEditorProps {
  clientId: string;
  existingPlan?: {
    id: string;
    title: string;
    modality: string;
    modality_other: string | null;
    presenting_concerns: string | null;
    diagnosis: string | null;
    goals: Goal[];
    status: string;
    start_date: string | null;
    target_end_date: string | null;
    notes: string | null;
  };
}

export default function PlanEditor({ clientId, existingPlan }: PlanEditorProps) {
  const router = useRouter();

  const [title, setTitle] = useState(existingPlan?.title ?? "Treatment Plan");
  const [modality, setModality] = useState<TherapyModalityKey>(
    (existingPlan?.modality as TherapyModalityKey) ?? "cbt"
  );
  const [modalityOther, setModalityOther] = useState(existingPlan?.modality_other ?? "");
  const [concerns, setConcerns] = useState(existingPlan?.presenting_concerns ?? "");
  const [diagnosis, setDiagnosis] = useState(existingPlan?.diagnosis ?? "");
  const [goals, setGoals] = useState<Goal[]>(
    (existingPlan?.goals as Goal[]) ?? []
  );
  const [startDate, setStartDate] = useState(existingPlan?.start_date ?? "");
  const [targetEnd, setTargetEnd] = useState(existingPlan?.target_end_date ?? "");
  const [notes, setNotes] = useState(existingPlan?.notes ?? "");
  const [saved, setSaved] = useState(false);

  const utils = trpc.useUtils();

  const create = trpc.treatmentPlan.create.useMutation({
    onSuccess: () => {
      utils.treatmentPlan.list.invalidate();
      setSaved(true);
      router.push(`/dashboard/clients/${clientId}`);
    },
  });

  const update = trpc.treatmentPlan.update.useMutation({
    onSuccess: () => {
      utils.treatmentPlan.list.invalidate();
      utils.treatmentPlan.getById.invalidate();
      setSaved(true);
    },
  });

  const isPending = create.isPending || update.isPending;

  function handleSave() {
    const payload = {
      title,
      modality,
      modality_other: modality === "other" ? modalityOther || null : null,
      presenting_concerns: concerns || null,
      diagnosis: diagnosis || null,
      goals,
      start_date: startDate || null,
      target_end_date: targetEnd || null,
      notes: notes || null,
    };

    if (existingPlan) {
      update.mutate({ plan_id: existingPlan.id, data: payload });
    } else {
      create.mutate({ client_id: clientId, ...payload });
    }
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <label className="block text-xs font-medium text-ink-light mb-1.5">Plan title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage text-sm"
        />
      </div>

      {/* Modality */}
      <div>
        <label className="flex items-center gap-1.5 text-xs font-medium text-ink-light mb-2">
          <Brain size={13} />
          Therapy modality
        </label>
        <div className="flex flex-wrap gap-1.5">
          {(Object.entries(THERAPY_MODALITIES) as [TherapyModalityKey, { name: string; fullName: string }][]).map(
            ([key, val]) => (
              <button
                key={key}
                type="button"
                onClick={() => setModality(key)}
                title={val.fullName}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  modality === key
                    ? "bg-sage text-white shadow-sm"
                    : "bg-cream-100 text-ink-lighter hover:bg-cream-200"
                }`}
              >
                {val.name}
              </button>
            )
          )}
        </div>
        {modality === "other" && (
          <input
            type="text"
            value={modalityOther}
            onChange={(e) => setModalityOther(e.target.value)}
            placeholder="Specify modality..."
            className="mt-2 w-full px-3.5 py-2 rounded-xl border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage text-sm"
          />
        )}
      </div>

      {/* Presenting concerns */}
      <div>
        <label className="block text-xs font-medium text-ink-light mb-1.5">Presenting concerns</label>
        <textarea
          value={concerns}
          onChange={(e) => setConcerns(e.target.value)}
          placeholder="Client's presenting concerns and reasons for seeking therapy..."
          rows={3}
          className="w-full px-3.5 py-2.5 rounded-xl border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage text-sm resize-none"
        />
      </div>

      {/* Diagnosis (optional) */}
      <div>
        <label className="block text-xs font-medium text-ink-light mb-1.5">
          Diagnosis <span className="text-ink-lighter font-normal">(optional)</span>
        </label>
        <input
          type="text"
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
          placeholder="e.g., Generalized Anxiety Disorder (F41.1)"
          className="w-full px-3.5 py-2.5 rounded-xl border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage text-sm"
        />
      </div>

      {/* Goals */}
      <div>
        <label className="block text-xs font-medium text-ink-light mb-2">Treatment goals</label>
        <GoalList goals={goals} onChange={setGoals} />
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-ink-light mb-1.5">Start date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-light mb-1.5">Target end date</label>
          <input
            type="date"
            value={targetEnd}
            onChange={(e) => setTargetEnd(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage text-sm"
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs font-medium text-ink-light mb-1.5">Additional notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any additional treatment notes..."
          rows={2}
          className="w-full px-3.5 py-2.5 rounded-xl border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage text-sm resize-none"
        />
      </div>

      {/* Save */}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="bg-sage text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-sage-500 transition-all disabled:opacity-50 shadow-md shadow-sage/20 flex items-center gap-2"
        >
          <Save size={14} />
          {isPending ? "Saving..." : existingPlan ? "Update Plan" : "Create Plan"}
        </button>
        {saved && (
          <span className="text-sm text-sage font-medium animate-pulse">Saved!</span>
        )}
        {(create.error || update.error) && (
          <span className="text-sm text-red-600">
            {create.error?.message || update.error?.message}
          </span>
        )}
      </div>
    </div>
  );
}
