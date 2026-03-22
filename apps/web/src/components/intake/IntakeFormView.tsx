"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import type { IntakeField, IntakeFieldResponse } from "@mano/shared";
import { ClipboardList, CheckCircle2 } from "lucide-react";

export default function IntakeFormView({ token }: { token: string }) {
  const form = trpc.intakeForm.getPublicForm.useQuery({ access_token: token });
  const submit = trpc.intakeForm.submit.useMutation({
    onSuccess: () => setSubmitted(true),
  });

  const [responses, setResponses] = useState<Record<string, string | boolean | string[] | null>>({});
  const [submitted, setSubmitted] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  function setValue(fieldId: string, value: string | boolean | string[] | null) {
    setResponses((prev) => ({ ...prev, [fieldId]: value }));
    setValidationErrors((prev) => {
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const fields = form.data?.form_snapshot ?? [];
    const errors: Record<string, string> = {};

    for (const field of fields) {
      if (!field.required || field.type === "heading") continue;
      const val = responses[field.id];
      if (val === undefined || val === null || val === "") {
        errors[field.id] = `"${field.label}" is required`;
      }
      if (field.type === "consent" && val !== true) {
        errors[field.id] = `You must agree to "${field.label}"`;
      }
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    const payload: IntakeFieldResponse[] = fields
      .filter((f) => f.type !== "heading")
      .map((f) => ({
        field_id: f.id,
        value: responses[f.id] ?? null,
      }));

    submit.mutate({ access_token: token, responses: payload });
  }

  // Loading
  if (form.isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-cream-200 rounded-lg animate-pulse" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-cream-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Error / not found
  if (form.error || !form.data) {
    return (
      <div className="text-center py-12 space-y-3">
        <div className="w-14 h-14 rounded-full bg-cream-200 mx-auto flex items-center justify-center">
          <ClipboardList size={24} className="text-ink-lighter" />
        </div>
        <h2 className="text-lg font-heading font-semibold text-ink">Form Not Found</h2>
        <p className="text-sm text-ink-lighter">
          This intake form link is invalid or has expired.
        </p>
      </div>
    );
  }

  // Already submitted or just submitted
  if (form.data.status === "submitted" || submitted) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="w-16 h-16 rounded-full bg-sage-50 mx-auto flex items-center justify-center">
          <CheckCircle2 size={28} className="text-sage" />
        </div>
        <h2 className="text-2xl font-heading font-bold text-ink">Thank You!</h2>
        <p className="text-sm text-ink-lighter">
          Your intake form has been submitted successfully. Your therapist will review it before your session.
        </p>
      </div>
    );
  }

  const { form_snapshot: fields, form_name, form_description, client_name } = form.data;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-heading font-bold text-ink">{form_name}</h2>
        {form_description && (
          <p className="text-sm text-ink-lighter mt-1">{form_description}</p>
        )}
        {client_name && (
          <p className="text-xs text-ink-lighter mt-2">
            Form for: <span className="font-medium text-ink-light">{client_name}</span>
          </p>
        )}
      </div>

      {/* Fields */}
      {[...fields]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((field) => (
          <FieldRenderer
            key={field.id}
            field={field}
            value={responses[field.id] ?? null}
            onChange={(val) => setValue(field.id, val)}
            error={validationErrors[field.id]}
          />
        ))}

      {/* Submit */}
      {submit.error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
          {submit.error.message}
        </div>
      )}

      <button
        type="submit"
        disabled={submit.isPending}
        className="w-full bg-sage text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-sage-500 transition-all disabled:opacity-50 shadow-md shadow-sage/20"
      >
        {submit.isPending ? "Submitting..." : "Submit Intake Form"}
      </button>
    </form>
  );
}

function FieldRenderer({
  field,
  value,
  onChange,
  error,
}: {
  field: IntakeField;
  value: string | boolean | string[] | null;
  onChange: (val: string | boolean | string[] | null) => void;
  error?: string;
}) {
  const inputCls = `w-full px-3.5 py-2.5 rounded-xl border ${error ? "border-red-300 ring-2 ring-red-100" : "border-cream-300"} bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage text-sm transition-shadow`;

  switch (field.type) {
    case "heading":
      return (
        <div className="pt-4">
          <h3 className="text-base font-heading font-semibold text-ink border-b border-cream-200 pb-2">
            {field.label}
          </h3>
        </div>
      );

    case "text":
      return (
        <div>
          <label className="block text-sm font-medium text-ink-light mb-1.5">
            {field.label} {field.required && <span className="text-red-400">*</span>}
          </label>
          <input
            type="text"
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder ?? undefined}
            className={inputCls}
          />
          {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
      );

    case "textarea":
      return (
        <div>
          <label className="block text-sm font-medium text-ink-light mb-1.5">
            {field.label} {field.required && <span className="text-red-400">*</span>}
          </label>
          <textarea
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            rows={4}
            placeholder={field.placeholder ?? undefined}
            className={`${inputCls} resize-none`}
          />
          {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
      );

    case "select":
      return (
        <div>
          <label className="block text-sm font-medium text-ink-light mb-1.5">
            {field.label} {field.required && <span className="text-red-400">*</span>}
          </label>
          <select
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            className={inputCls}
          >
            <option value="">Select...</option>
            {(field.options ?? []).map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
      );

    case "multi_select":
      return (
        <div>
          <label className="block text-sm font-medium text-ink-light mb-1.5">
            {field.label} {field.required && <span className="text-red-400">*</span>}
          </label>
          <div className="space-y-1.5">
            {(field.options ?? []).map((opt) => {
              const selected = Array.isArray(value) ? value : [];
              const isChecked = selected.includes(opt);
              return (
                <label key={opt} className="flex items-center gap-2.5 text-sm text-ink cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {
                      const next = isChecked
                        ? selected.filter((v) => v !== opt)
                        : [...selected, opt];
                      onChange(next.length > 0 ? next : null);
                    }}
                    className="rounded border-cream-300 text-sage focus:ring-sage/30"
                  />
                  {opt}
                </label>
              );
            })}
          </div>
          {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
      );

    case "date":
      return (
        <div>
          <label className="block text-sm font-medium text-ink-light mb-1.5">
            {field.label} {field.required && <span className="text-red-400">*</span>}
          </label>
          <input
            type="date"
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            className={inputCls}
          />
          {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
      );

    case "yes_no":
      return (
        <div>
          <label className="block text-sm font-medium text-ink-light mb-1.5">
            {field.label} {field.required && <span className="text-red-400">*</span>}
          </label>
          <div className="flex gap-2">
            {["Yes", "No"].map((opt) => {
              const isSelected = value === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => onChange(opt)}
                  className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${
                    isSelected
                      ? "bg-sage text-white shadow-md shadow-sage/20"
                      : "bg-cream-100 text-ink-lighter hover:bg-cream-200"
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
          {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
      );

    case "consent":
      return (
        <div className="bg-cream-50 rounded-xl p-4 space-y-3">
          <h4 className="text-sm font-semibold text-ink">{field.label}</h4>
          {field.agreement_text && (
            <div className="text-xs text-ink-lighter leading-relaxed border border-cream-200 bg-white rounded-xl p-3">
              {field.agreement_text}
            </div>
          )}
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={value === true}
              onChange={(e) => onChange(e.target.checked)}
              className="rounded border-cream-300 text-sage focus:ring-sage/30 mt-0.5"
            />
            <span className="text-sm text-ink">
              I have read and agree to the above {field.required && <span className="text-red-400">*</span>}
            </span>
          </label>
          {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
      );

    default:
      return null;
  }
}
