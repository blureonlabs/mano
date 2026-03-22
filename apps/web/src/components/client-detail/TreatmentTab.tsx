"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { THERAPY_MODALITIES } from "@mano/shared";
import type { Goal, TherapyModalityKey } from "@mano/shared";
import { formatDate } from "./utils";
import {
  CalendarDays,
  ClipboardList,
  Plus,
  Target,
} from "lucide-react";

interface TreatmentTabProps {
  clientId: string;
}

export default function TreatmentTab({ clientId }: TreatmentTabProps) {
  const plans = trpc.treatmentPlan.list.useQuery({ client_id: clientId });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink">Treatment Plans</h2>
        <Link
          href={`/dashboard/clients/${clientId}/treatment-plan/new`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sage text-white text-xs font-medium hover:bg-sage-500 transition-colors shadow-sm"
        >
          <Plus size={12} /> New Plan
        </Link>
      </div>

      {plans.isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 bg-white rounded-2xl border border-cream-300 animate-pulse" />
          ))}
        </div>
      ) : (plans.data?.length ?? 0) === 0 ? (
        <div className="bg-white rounded-2xl border border-cream-300 shadow-sm p-10 text-center">
          <ClipboardList size={20} className="mx-auto text-ink-lighter mb-2" />
          <p className="text-sm text-ink-lighter">No treatment plans yet</p>
          <p className="text-xs text-ink-lighter/60 mt-1">
            Create a treatment plan to set goals and track progress
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {plans.data?.map((plan) => {
            const goals = (plan.goals as Goal[]) ?? [];
            const completedGoals = goals.filter((g) => g.completed).length;
            const totalGoals = goals.length;
            const modality = THERAPY_MODALITIES[plan.modality as TherapyModalityKey];

            const planStatusColors: Record<string, string> = {
              draft: "bg-cream-200 text-ink-lighter",
              active: "bg-sage-50 text-sage",
              completed: "bg-blue-50 text-blue-600",
              archived: "bg-cream-200 text-ink-lighter",
            };

            return (
              <Link
                key={plan.id}
                href={`/dashboard/clients/${clientId}/treatment-plan/${plan.id}`}
                className="block bg-white rounded-2xl border border-cream-300 shadow-sm p-5 hover:border-sage/40 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm font-semibold text-ink">{plan.title}</h3>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-pill text-[11px] font-medium ${planStatusColors[plan.status] ?? planStatusColors.draft}`}>
                    {plan.status}
                  </span>
                </div>

                <div className="flex items-center gap-3 mb-3">
                  {modality && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium bg-cream-100 text-ink-lighter">
                      {modality.name}
                    </span>
                  )}
                  {plan.start_date && (
                    <span className="text-[11px] text-ink-lighter flex items-center gap-1">
                      <CalendarDays size={10} />
                      {formatDate(plan.start_date)}
                    </span>
                  )}
                </div>

                {totalGoals > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] text-ink-lighter flex items-center gap-1">
                        <Target size={10} />
                        {completedGoals}/{totalGoals} goals
                      </span>
                    </div>
                    <div className="h-1.5 bg-cream-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-sage rounded-full transition-all"
                        style={{ width: `${totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
