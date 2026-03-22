"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { formatDate } from "./utils";
import {
  ClipboardList,
  CheckCircle2,
  AlertCircle,
  Link as LinkIcon,
} from "lucide-react";

interface IntakeTabProps {
  clientId: string;
}

export default function IntakeTab({ clientId }: IntakeTabProps) {
  const intakeResponses = trpc.intakeForm.listResponses.useQuery({ client_id: clientId });

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-ink">Intake Responses</h2>

      {intakeResponses.isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 bg-white rounded-2xl border border-cream-300 animate-pulse" />
          ))}
        </div>
      ) : (intakeResponses.data?.length ?? 0) === 0 ? (
        <div className="bg-white rounded-2xl border border-cream-300 shadow-sm p-10 text-center">
          <ClipboardList size={20} className="mx-auto text-ink-lighter mb-2" />
          <p className="text-sm text-ink-lighter">No intake responses</p>
          <p className="text-xs text-ink-lighter/60 mt-1">
            Intake forms will appear here when the client submits one
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {intakeResponses.data?.map((response) => {
            const formInfo = response.intake_forms as { name: string; form_type: string } | null;
            const fields = (response.form_snapshot ?? []) as { id: string; type: string; label: string }[];
            const answers = (response.responses ?? []) as { field_id: string; value: string | boolean | string[] | null }[];

            return (
              <IntakeResponseCard
                key={response.id}
                formName={formInfo?.name ?? "Intake Form"}
                formType={formInfo?.form_type ?? "custom"}
                status={response.status}
                submittedAt={response.submitted_at}
                createdAt={response.created_at}
                accessToken={response.access_token}
                fields={fields}
                answers={answers}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function IntakeResponseCard({
  formName,
  formType,
  status,
  submittedAt,
  createdAt,
  accessToken,
  fields,
  answers,
}: {
  formName: string;
  formType: string;
  status: string;
  submittedAt: string | null;
  createdAt: string;
  accessToken: string;
  fields: { id: string; type: string; label: string }[];
  answers: { field_id: string; value: string | boolean | string[] | null }[];
}) {
  const [expanded, setExpanded] = useState(false);

  const formTypeColors: Record<string, string> = {
    individual: "bg-sage-50 text-sage",
    couples: "bg-amber-50 text-amber",
    child: "bg-blue-50 text-blue-600",
    family: "bg-purple-50 text-purple-600",
    custom: "bg-cream-200 text-ink-lighter",
  };

  return (
    <div className="bg-white rounded-2xl border border-cream-300 shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-cream-50 transition-colors text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <ClipboardList size={14} className="text-ink-lighter flex-shrink-0" />
          <span className="text-sm font-semibold text-ink truncate">{formName}</span>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-pill text-[11px] font-medium ${formTypeColors[formType] ?? formTypeColors.custom}`}>
            {formType}
          </span>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-[11px] font-medium ${
            status === "submitted" ? "bg-sage-50 text-sage" : "bg-amber-50 text-amber"
          }`}>
            {status === "submitted" && <CheckCircle2 size={10} />}
            {status === "pending" && <AlertCircle size={10} />}
            {status}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[11px] text-ink-lighter">
            {submittedAt ? formatDate(submittedAt) : `Sent ${formatDate(createdAt)}`}
          </span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`text-ink-lighter transition-transform ${expanded ? "rotate-180" : ""}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-cream-300 px-5 py-4 space-y-3">
          {status === "pending" ? (
            <div className="text-center py-4 space-y-2">
              <AlertCircle size={20} className="mx-auto text-amber" />
              <p className="text-sm text-ink-lighter">Form not yet submitted</p>
              <button
                onClick={() => navigator.clipboard.writeText(`${window.location.origin}/intake/${accessToken}`)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cream-100 text-ink-lighter text-xs font-medium hover:bg-cream-200 transition-colors"
              >
                <LinkIcon size={11} /> Copy form link
              </button>
            </div>
          ) : (
            fields
              .filter((f) => f.type !== "heading")
              .map((field) => {
                const answer = answers.find((a) => a.field_id === field.id);
                const displayValue = answer?.value == null
                  ? "\u2014"
                  : typeof answer.value === "boolean"
                  ? answer.value ? "Yes" : "No"
                  : Array.isArray(answer.value)
                  ? answer.value.join(", ")
                  : String(answer.value);

                return (
                  <div key={field.id}>
                    <div className="text-[11px] font-medium text-ink-lighter mb-0.5">{field.label}</div>
                    <div className="text-sm text-ink">{displayValue}</div>
                  </div>
                );
              })
          )}
        </div>
      )}
    </div>
  );
}
