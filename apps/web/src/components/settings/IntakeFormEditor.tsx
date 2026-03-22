"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { INTAKE_TEMPLATES, INTAKE_TEMPLATE_KEYS } from "@mano/shared";
import type { IntakeField, IntakeFieldType } from "@mano/shared";
import { toast } from "sonner";
import {
  ClipboardList,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  GripVertical,
  CheckCircle2,
  FileText,
  Archive,
  Link as LinkIcon,
} from "lucide-react";

const FIELD_TYPE_LABELS: Record<IntakeFieldType, string> = {
  text: "Short Text",
  textarea: "Long Text",
  select: "Dropdown",
  multi_select: "Multi Select",
  date: "Date",
  yes_no: "Yes / No",
  heading: "Section Heading",
  consent: "Consent Checkbox",
};

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-cream-200 text-ink-lighter" },
  active: { label: "Active", className: "bg-sage-50 text-sage" },
  archived: { label: "Archived", className: "bg-ink-lighter/10 text-ink-lighter" },
};

interface Props {
  sessionTypes: { id: string; name: string; intake_form_id?: string | null }[];
}

export default function IntakeFormEditor({ sessionTypes }: Props) {
  const utils = trpc.useUtils();
  const forms = trpc.intakeForm.list.useQuery();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);

  const createForm = trpc.intakeForm.create.useMutation({
    onSuccess: (data) => {
      utils.intakeForm.list.invalidate();
      setExpandedId(data.id);
      toast.success("Form created");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateForm = trpc.intakeForm.update.useMutation({
    onSuccess: () => {
      utils.intakeForm.list.invalidate();
      toast.success("Form saved");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteForm = trpc.intakeForm.delete.useMutation({
    onSuccess: () => {
      utils.intakeForm.list.invalidate();
      toast.success("Form deleted");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateSessionTypes = trpc.therapist.updateSessionTypes.useMutation({
    onSuccess: () => {
      utils.therapist.me.invalidate();
      toast.success("Session type linked");
    },
  });

  function handleCreateFromTemplate(key: string) {
    const template = INTAKE_TEMPLATES[key];
    if (!template) return;

    const fields: IntakeField[] = template.fields.map((f, i) => ({
      id: crypto.randomUUID(),
      type: f.type,
      label: f.label,
      placeholder: f.placeholder ?? null,
      required: f.required ?? false,
      options: f.options ?? null,
      agreement_text: f.agreement_text ?? null,
      sort_order: i,
    }));

    createForm.mutate({
      name: template.name,
      description: template.description,
      form_type: template.form_type,
      status: "draft",
      fields,
    });
    setShowTemplateMenu(false);
  }

  function handleCreateBlank() {
    createForm.mutate({
      name: "New Intake Form",
      form_type: "custom",
      status: "draft",
      fields: [
        {
          id: crypto.randomUUID(),
          type: "heading",
          label: "Section 1",
          placeholder: null,
          required: false,
          options: null,
          agreement_text: null,
          sort_order: 0,
        },
      ],
    });
    setShowTemplateMenu(false);
  }

  return (
    <section className="bg-white rounded-2xl border border-cream-300 shadow-sm p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ClipboardList size={18} className="text-sage" />
            <h2 className="text-lg font-heading font-semibold text-ink">Intake Forms</h2>
          </div>
          <p className="text-sm text-ink-lighter">
            Create intake forms for different therapy types. Link them to session types so clients fill the right form after booking.
          </p>
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowTemplateMenu(!showTemplateMenu)}
            className="bg-sage text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-sage-500 transition-all shadow-md shadow-sage/20 flex items-center gap-1.5"
          >
            <Plus size={14} /> New Form
          </button>
          {showTemplateMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-cream-300 rounded-xl shadow-lg z-20 py-1">
              {INTAKE_TEMPLATE_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleCreateFromTemplate(key)}
                  className="w-full text-left px-4 py-2.5 text-sm text-ink hover:bg-cream-50 transition-colors capitalize"
                >
                  {INTAKE_TEMPLATES[key]!.name}
                </button>
              ))}
              <div className="border-t border-cream-200 my-1" />
              <button
                type="button"
                onClick={handleCreateBlank}
                className="w-full text-left px-4 py-2.5 text-sm text-ink-lighter hover:bg-cream-50 transition-colors"
              >
                Blank form
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Forms list */}
      {forms.isLoading && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 bg-cream-100 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {forms.data?.length === 0 && (
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-full bg-cream-200 mx-auto mb-3 flex items-center justify-center">
            <ClipboardList size={20} className="text-ink-lighter" />
          </div>
          <p className="text-sm text-ink-lighter">No intake forms yet</p>
          <p className="text-xs text-ink-lighter/60 mt-1">
            Create one from a template to get started
          </p>
        </div>
      )}

      {forms.data?.map((form) => {
        const isExpanded = expandedId === form.id;
        const badge = STATUS_BADGES[form.status] ?? STATUS_BADGES.draft!;
        const fieldCount = (form.fields as IntakeField[])?.length ?? 0;

        return (
          <FormCard
            key={form.id}
            form={form}
            isExpanded={isExpanded}
            badge={badge}
            fieldCount={fieldCount}
            sessionTypes={sessionTypes}
            onToggle={() => setExpandedId(isExpanded ? null : form.id)}
            onUpdate={(data) => updateForm.mutate({ id: form.id, ...data })}
            onDelete={() => {
              if (confirm("Delete this form? This cannot be undone.")) {
                deleteForm.mutate({ form_id: form.id });
              }
            }}
            onLinkSessionType={(sessionTypeId) => {
              const updated = sessionTypes.map((st) => ({
                ...st,
                intake_form_id: st.id === sessionTypeId ? form.id : st.intake_form_id ?? null,
              }));
              updateSessionTypes.mutate({ session_types: updated as any });
            }}
            saving={updateForm.isPending}
          />
        );
      })}
    </section>
  );
}

function FormCard({
  form,
  isExpanded,
  badge,
  fieldCount,
  sessionTypes,
  onToggle,
  onUpdate,
  onDelete,
  onLinkSessionType,
  saving,
}: {
  form: any;
  isExpanded: boolean;
  badge: { label: string; className: string };
  fieldCount: number;
  sessionTypes: { id: string; name: string; intake_form_id?: string | null }[];
  onToggle: () => void;
  onUpdate: (data: any) => void;
  onDelete: () => void;
  onLinkSessionType: (sessionTypeId: string) => void;
  saving: boolean;
}) {
  const [editFields, setEditFields] = useState<IntakeField[]>(form.fields ?? []);
  const [editName, setEditName] = useState(form.name);

  const linkedTypes = sessionTypes.filter((st) => st.intake_form_id === form.id);

  function addField(type: IntakeFieldType) {
    setEditFields([
      ...editFields,
      {
        id: crypto.randomUUID(),
        type,
        label: type === "heading" ? "New Section" : "New Field",
        placeholder: null,
        required: type === "consent",
        options: type === "select" || type === "multi_select" ? ["Option 1"] : null,
        agreement_text: type === "consent" ? "I understand and agree to these terms." : null,
        sort_order: editFields.length,
      },
    ]);
  }

  function updateField(id: string, updates: Partial<IntakeField>) {
    setEditFields(editFields.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  }

  function removeField(id: string) {
    setEditFields(editFields.filter((f) => f.id !== id));
  }

  function moveField(idx: number, direction: -1 | 1) {
    const newFields = [...editFields];
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= newFields.length) return;
    [newFields[idx], newFields[targetIdx]] = [newFields[targetIdx]!, newFields[idx]!];
    setEditFields(newFields.map((f, i) => ({ ...f, sort_order: i })));
  }

  return (
    <div className="border border-cream-300 rounded-xl overflow-hidden">
      {/* Header row */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-cream-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <FileText size={16} className="text-sage" />
          <span className="text-sm font-medium text-ink">{form.name}</span>
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-pill ${badge.className}`}>
            {badge.label}
          </span>
          <span className="text-xs text-ink-lighter">{fieldCount} fields</span>
          {linkedTypes.length > 0 && (
            <span className="text-xs text-sage flex items-center gap-1">
              <LinkIcon size={10} /> {linkedTypes.map((st) => st.name).join(", ")}
            </span>
          )}
        </div>
        {isExpanded ? <ChevronUp size={16} className="text-ink-lighter" /> : <ChevronDown size={16} className="text-ink-lighter" />}
      </button>

      {/* Expanded editor */}
      {isExpanded && (
        <div className="border-t border-cream-300 p-5 space-y-4">
          {/* Name */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-ink-light mb-1">Form Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-light mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => onUpdate({ status: e.target.value })}
                className="px-3 py-2 rounded-xl border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 text-sm"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          {/* Link to session type */}
          <div>
            <label className="block text-xs font-medium text-ink-light mb-1">Link to Session Type</label>
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) onLinkSessionType(e.target.value);
              }}
              className="w-full px-3 py-2 rounded-xl border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 text-sm"
            >
              <option value="">Select a session type to link...</option>
              {sessionTypes.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} {st.intake_form_id === form.id ? "(linked)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Fields */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-ink-light uppercase tracking-wider">Fields</h4>
            {editFields.map((field, idx) => (
              <div key={field.id} className="flex items-start gap-2 p-3 bg-cream-50 rounded-xl">
                <div className="flex flex-col gap-0.5 pt-1">
                  <button type="button" onClick={() => moveField(idx, -1)} className="text-ink-lighter hover:text-ink transition-colors" disabled={idx === 0}>
                    <ChevronUp size={12} />
                  </button>
                  <GripVertical size={12} className="text-ink-lighter/40" />
                  <button type="button" onClick={() => moveField(idx, 1)} className="text-ink-lighter hover:text-ink transition-colors" disabled={idx === editFields.length - 1}>
                    <ChevronDown size={12} />
                  </button>
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-cream-200 text-ink-lighter uppercase">
                      {FIELD_TYPE_LABELS[field.type]}
                    </span>
                    {field.type !== "heading" && (
                      <label className="flex items-center gap-1 text-[10px] text-ink-lighter">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => updateField(field.id, { required: e.target.checked })}
                          className="rounded border-cream-300 text-sage focus:ring-sage/30"
                        />
                        Required
                      </label>
                    )}
                  </div>
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) => updateField(field.id, { label: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-cream-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-sage/30"
                    placeholder="Field label"
                  />

                  {(field.type === "text" || field.type === "textarea") && (
                    <input
                      type="text"
                      value={field.placeholder ?? ""}
                      onChange={(e) => updateField(field.id, { placeholder: e.target.value || null })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-cream-200 bg-cream-50 text-xs focus:outline-none focus:ring-2 focus:ring-sage/30"
                      placeholder="Placeholder text (optional)"
                    />
                  )}

                  {(field.type === "select" || field.type === "multi_select") && (
                    <div className="space-y-1">
                      {(field.options ?? []).map((opt, oi) => (
                        <div key={oi} className="flex items-center gap-1">
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const newOpts = [...(field.options ?? [])];
                              newOpts[oi] = e.target.value;
                              updateField(field.id, { options: newOpts });
                            }}
                            className="flex-1 px-2 py-1 rounded-lg border border-cream-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-sage/30"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newOpts = (field.options ?? []).filter((_, i) => i !== oi);
                              updateField(field.id, { options: newOpts });
                            }}
                            className="text-ink-lighter hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => updateField(field.id, { options: [...(field.options ?? []), ""] })}
                        className="text-xs text-sage hover:text-sage-500 font-medium"
                      >
                        + Add option
                      </button>
                    </div>
                  )}

                  {field.type === "consent" && (
                    <textarea
                      value={field.agreement_text ?? ""}
                      onChange={(e) => updateField(field.id, { agreement_text: e.target.value || null })}
                      rows={3}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-cream-300 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-sage/30 resize-none"
                      placeholder="Agreement text..."
                    />
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => removeField(field.id)}
                  className="text-ink-lighter hover:text-red-500 transition-colors mt-1"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}

            {/* Add field */}
            <div className="flex flex-wrap gap-1 pt-2">
              {(Object.keys(FIELD_TYPE_LABELS) as IntakeFieldType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => addField(type)}
                  className="text-[10px] font-medium px-2.5 py-1.5 rounded-lg bg-cream-100 text-ink-lighter hover:bg-cream-200 transition-colors"
                >
                  + {FIELD_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2 border-t border-cream-200">
            <button
              type="button"
              onClick={() => {
                onUpdate({
                  name: editName,
                  fields: editFields.map((f, i) => ({ ...f, sort_order: i })),
                });
              }}
              disabled={saving}
              className="bg-sage text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-sage-500 transition-all disabled:opacity-50 shadow-md shadow-sage/20 flex items-center gap-1.5"
            >
              <CheckCircle2 size={14} />
              {saving ? "Saving..." : "Save Form"}
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="text-xs text-ink-lighter hover:text-red-600 transition-colors flex items-center gap-1"
            >
              <Trash2 size={12} /> Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
