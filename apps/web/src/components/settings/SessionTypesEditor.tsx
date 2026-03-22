import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { SESSION_DURATIONS, CLIENT_CATEGORIES } from "@mano/shared";
import type { SessionType } from "@mano/shared";
import { Clock, Plus, Trash2, Pencil, X } from "lucide-react";

interface SessionTypesEditorProps {
  sessionTypes: SessionType[];
  bufferMins: number;
}

interface RateTier {
  client_category: string;
  rate_inr: number;
}

interface SessionTypeFormData {
  name: string;
  duration_mins: number;
  rate_inr: number;
  description: string;
  is_active: boolean;
  rates: RateTier[];
}

const CATEGORY_OPTIONS = Object.entries(CLIENT_CATEGORIES).map(([key, val]) => ({
  value: key,
  label: val.label,
}));

const BUFFER_OPTIONS = [0, 5, 10, 15, 30];

const emptyForm: SessionTypeFormData = {
  name: "",
  duration_mins: 50,
  rate_inr: 0,
  description: "",
  is_active: true,
  rates: [],
};

function paiseToRupees(paise: number): number {
  return paise / 100;
}

function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

function formatRupees(paise: number): string {
  const rupees = paiseToRupees(paise);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(rupees);
}

function getCategoryLabel(category: string): string {
  const entry = CLIENT_CATEGORIES[category as keyof typeof CLIENT_CATEGORIES];
  return entry?.label ?? category;
}

export default function SessionTypesEditor({ bufferMins }: SessionTypesEditorProps) {
  const [buffer, setBuffer] = useState(bufferMins);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SessionTypeFormData>({ ...emptyForm });
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const utils = trpc.useUtils();

  const sessionTypesQuery = trpc.sessionType.list.useQuery();
  const sessionTypes = sessionTypesQuery.data ?? [];

  const createMutation = trpc.sessionType.create.useMutation({
    onSuccess: () => {
      utils.sessionType.list.invalidate();
      toast.success("Session type created");
      closeModal();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.sessionType.update.useMutation({
    onSuccess: () => {
      utils.sessionType.list.invalidate();
      toast.success("Session type updated");
      closeModal();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.sessionType.delete.useMutation({
    onSuccess: () => {
      utils.sessionType.list.invalidate();
      toast.success("Session type deleted");
      setDeleteConfirmId(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const updateBuffer = trpc.therapist.update.useMutation({
    onSuccess: () => {
      utils.therapist.me.invalidate();
      toast.success("Buffer time updated");
    },
    onError: (err) => toast.error(err.message),
  });

  function closeModal() {
    setShowModal(false);
    setEditingId(null);
    setForm({ ...emptyForm });
  }

  function openCreate() {
    setForm({
      ...emptyForm,
      sort_order: sessionTypes.length,
    } as SessionTypeFormData);
    setEditingId(null);
    setShowModal(true);
  }

  function openEdit(st: (typeof sessionTypes)[number]) {
    setForm({
      name: st.name,
      duration_mins: st.duration_mins,
      rate_inr: st.rate_inr,
      description: st.description ?? "",
      is_active: st.is_active,
      rates: (st.session_type_rates ?? []).map((r: { client_category: string; rate_inr: number }) => ({
        client_category: r.client_category,
        rate_inr: r.rate_inr,
      })),
    });
    setEditingId(st.id);
    setShowModal(true);
  }

  function handleSave() {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }

    const rates = form.rates.filter((r) => r.client_category.trim() !== "");

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        name: form.name.trim(),
        duration_mins: form.duration_mins,
        rate_inr: form.rate_inr,
        description: form.description.trim() || null,
        is_active: form.is_active,
        rates,
      });
    } else {
      createMutation.mutate({
        name: form.name.trim(),
        duration_mins: form.duration_mins,
        rate_inr: form.rate_inr,
        description: form.description.trim() || null,
        sort_order: sessionTypes.length,
        rates,
      });
    }
  }

  function addTier() {
    const usedCategories = form.rates.map((r) => r.client_category);
    const available = CATEGORY_OPTIONS.find((c) => !usedCategories.includes(c.value));
    if (!available) {
      toast.error("All client categories already have pricing");
      return;
    }
    setForm({
      ...form,
      rates: [...form.rates, { client_category: available.value, rate_inr: 0 }],
    });
  }

  function removeTier(index: number) {
    setForm({
      ...form,
      rates: form.rates.filter((_, i) => i !== index),
    });
  }

  function updateTier(index: number, field: keyof RateTier, value: string | number) {
    setForm({
      ...form,
      rates: form.rates.map((r, i) => (i === index ? { ...r, [field]: value } : r)),
    });
  }

  function handleBufferChange(newBuffer: number) {
    setBuffer(newBuffer);
    if (newBuffer !== bufferMins) {
      updateBuffer.mutate({ buffer_mins: newBuffer });
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <section className="bg-white rounded-2xl border border-cream-300 shadow-sm p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Clock size={18} className="text-sage" />
            <h2 className="text-lg font-heading font-semibold text-ink">
              Session Types & Pricing
            </h2>
          </div>
          <p className="text-sm text-ink-lighter">
            Client category is set on each client&apos;s profile. The correct rate is
            automatically applied when a session is booked.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-1.5 bg-sage text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-sage-500 transition-all shadow-md shadow-sage/20 shrink-0"
        >
          <Plus size={16} />
          Add Session Type
        </button>
      </div>

      {/* Buffer time */}
      <div className="max-w-xs">
        <label htmlFor="buffer" className="block text-xs font-medium text-ink-light mb-1.5">
          Buffer between sessions
        </label>
        <select
          id="buffer"
          value={buffer}
          onChange={(e) => handleBufferChange(Number(e.target.value))}
          className="w-full px-3.5 py-2.5 rounded-xl border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage text-sm transition-shadow appearance-none"
        >
          {BUFFER_OPTIONS.map((b) => (
            <option key={b} value={b}>
              {b === 0 ? "No buffer" : `${b} minutes`}
            </option>
          ))}
        </select>
      </div>

      {/* Loading state */}
      {sessionTypesQuery.isLoading && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="p-4 rounded-xl border border-cream-300 bg-cream-50/50 animate-pulse">
              <div className="h-5 w-40 bg-cream-200 rounded-lg mb-3" />
              <div className="h-4 w-24 bg-cream-200 rounded-lg mb-4" />
              <div className="h-8 w-full bg-cream-200 rounded-lg" />
            </div>
          ))}
        </div>
      )}

      {/* Session type cards */}
      {!sessionTypesQuery.isLoading && sessionTypes.length === 0 && (
        <div className="text-center py-8 text-ink-lighter text-sm">
          No session types yet. Click &quot;Add Session Type&quot; to create one.
        </div>
      )}

      <div className="space-y-3">
        {sessionTypes.map((st) => (
          <div
            key={st.id}
            className={`rounded-xl border bg-cream-50/50 overflow-hidden ${
              st.is_active ? "border-cream-300" : "border-cream-200 opacity-60"
            }`}
          >
            {/* Card header */}
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <h3 className="text-base font-heading font-semibold text-ink">
                  {st.name}
                </h3>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="flex items-center gap-1 text-xs text-ink-lighter">
                    <Clock size={12} />
                    {st.duration_mins} min
                  </span>
                  {!st.is_active && (
                    <span className="text-[10px] font-medium text-ink-lighter bg-cream-200 px-2 py-0.5 rounded-full uppercase tracking-wide">
                      Inactive
                    </span>
                  )}
                  {st.description && (
                    <span className="text-xs text-ink-lighter italic">
                      {st.description}
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => openEdit(st)}
                className="p-2 text-ink-lighter hover:text-sage transition-colors rounded-lg hover:bg-cream-100"
                title="Edit session type"
                aria-label={`Edit ${st.name}`}
              >
                <Pencil size={16} />
              </button>
            </div>

            {/* Pricing tiers */}
            <div className="border-t border-cream-200">
              {st.session_type_rates && st.session_type_rates.length > 0 ? (
                <div className="divide-y divide-cream-200">
                  {st.session_type_rates.map((rate: { id?: string; client_category: string; rate_inr: number }, idx: number) => (
                    <div
                      key={rate.id ?? idx}
                      className="flex items-center justify-between px-5 py-2.5"
                    >
                      <span className="text-sm text-ink-light">
                        {getCategoryLabel(rate.client_category)}
                      </span>
                      <span className="text-sm font-medium text-ink">
                        {formatRupees(rate.rate_inr)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-between px-5 py-2.5">
                  <span className="text-sm text-ink-lighter">All Categories</span>
                  <span className="text-sm font-medium text-ink">
                    {formatRupees(st.rate_inr)}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Delete confirmation dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" aria-label="Delete session type confirmation" className="bg-white rounded-2xl border border-cream-300 shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-base font-heading font-semibold text-ink mb-2">
              Delete session type?
            </h3>
            <p className="text-sm text-ink-lighter mb-5">
              This action cannot be undone. Any future bookings using this session type
              will need to be updated.
            </p>
            <div className="flex items-center gap-3 justify-end">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-ink-light hover:bg-cream-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteMutation.mutate({ id: deleteConfirmId })}
                disabled={deleteMutation.isPending}
                className="bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-700 transition-all disabled:opacity-50"
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" aria-label={editingId ? "Edit session type" : "Add session type"} className="bg-white rounded-2xl border border-cream-300 shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-cream-200">
              <h3 className="text-base font-heading font-semibold text-ink">
                {editingId ? "Edit Session Type" : "Add Session Type"}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                aria-label="Close"
                className="p-1.5 text-ink-lighter hover:text-ink transition-colors rounded-lg hover:bg-cream-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-ink-light mb-1.5">
                  Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Individual Therapy"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage text-sm transition-shadow"
                />
              </div>

              {/* Duration + Default Rate row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-ink-light mb-1.5">
                    Duration
                  </label>
                  <select
                    value={form.duration_mins}
                    onChange={(e) =>
                      setForm({ ...form, duration_mins: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage text-sm transition-shadow appearance-none"
                  >
                    {SESSION_DURATIONS.map((d) => (
                      <option key={d} value={d}>
                        {d} min
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-light mb-1.5">
                    Default Rate
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-lighter">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={paiseToRupees(form.rate_inr)}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          rate_inr: rupeesToPaise(parseFloat(e.target.value || "0")),
                        })
                      }
                      placeholder="0"
                      className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage text-sm transition-shadow"
                    />
                  </div>
                  {form.rate_inr === 0 && (
                    <p className="text-[10px] text-sage font-medium mt-0.5">Free</p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-ink-light mb-1.5">
                  Description{" "}
                  <span className="text-ink-lighter font-normal">(optional)</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief description shown on booking page"
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage text-sm transition-shadow resize-none"
                />
              </div>

              {/* Active toggle */}
              {editingId && (
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="w-4 h-4 rounded border-cream-300 text-sage focus:ring-sage/30"
                  />
                  <span className="text-sm text-ink-light">Active</span>
                </label>
              )}

              {/* Pricing tiers */}
              <div>
                <label className="block text-xs font-medium text-ink-light mb-2">
                  Category-Specific Pricing
                </label>
                <p className="text-[11px] text-ink-lighter mb-3">
                  Override the default rate for specific client categories. If no
                  category rate is set, the default rate above is used.
                </p>

                {form.rates.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {form.rates.map((tier, idx) => {
                      const usedCategories = form.rates
                        .filter((_, i) => i !== idx)
                        .map((r) => r.client_category);

                      return (
                        <div key={idx} className="flex items-center gap-2">
                          <select
                            value={tier.client_category}
                            onChange={(e) =>
                              updateTier(idx, "client_category", e.target.value)
                            }
                            className="flex-1 px-3 py-2 rounded-xl border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage text-sm transition-shadow appearance-none"
                          >
                            {CATEGORY_OPTIONS.map((opt) => (
                              <option
                                key={opt.value}
                                value={opt.value}
                                disabled={usedCategories.includes(opt.value)}
                              >
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-lighter">
                              ₹
                            </span>
                            <input
                              type="number"
                              min="0"
                              step="100"
                              value={paiseToRupees(tier.rate_inr)}
                              onChange={(e) =>
                                updateTier(
                                  idx,
                                  "rate_inr",
                                  rupeesToPaise(parseFloat(e.target.value || "0"))
                                )
                              }
                              className="w-full pl-7 pr-3 py-2 rounded-xl border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage text-sm transition-shadow"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeTier(idx)}
                            className="p-1.5 text-ink-lighter hover:text-red-500 transition-colors"
                            title="Remove tier"
                            aria-label="Remove pricing tier"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {form.rates.length < CATEGORY_OPTIONS.length && (
                  <button
                    type="button"
                    onClick={addTier}
                    className="flex items-center gap-1 text-sm font-medium text-sage hover:text-sage-500 transition-colors"
                  >
                    <Plus size={14} />
                    Add pricing tier
                  </button>
                )}
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-cream-200 bg-cream-50/30 rounded-b-2xl">
              <div>
                {editingId && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setDeleteConfirmId(editingId);
                    }}
                    className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
                  >
                    Delete
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-ink-light hover:bg-cream-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-sage text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-sage-500 transition-all disabled:opacity-50 shadow-md shadow-sage/20"
                >
                  {isSaving
                    ? "Saving..."
                    : editingId
                      ? "Save Changes"
                      : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
