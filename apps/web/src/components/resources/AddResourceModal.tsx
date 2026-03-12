"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { THERAPY_MODALITIES, type TherapyModalityKey } from "@mano/shared";
import { X, Upload, Link as LinkIcon, FileText } from "lucide-react";

interface AddResourceModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const RESOURCE_TYPES = [
  { key: "file" as const, label: "File", icon: Upload },
  { key: "link" as const, label: "Link", icon: LinkIcon },
  { key: "worksheet" as const, label: "Worksheet", icon: FileText },
];

const CATEGORY_SUGGESTIONS = [
  "Homework",
  "Psychoeducation",
  "Self-assessment",
  "Coping skills",
  "Journaling",
  "Relaxation",
  "Thought records",
  "Behavioral activation",
  "Mindfulness",
];

export default function AddResourceModal({ open, onClose, onCreated }: AddResourceModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [resourceType, setResourceType] = useState<"file" | "link" | "worksheet">("worksheet");
  const [externalUrl, setExternalUrl] = useState("");
  const [modalityTags, setModalityTags] = useState<string[]>([]);
  const [categoryTags, setCategoryTags] = useState<string[]>([]);

  const create = trpc.resource.create.useMutation({
    onSuccess: () => {
      onCreated();
      onClose();
      resetForm();
    },
  });

  function resetForm() {
    setTitle("");
    setDescription("");
    setResourceType("worksheet");
    setExternalUrl("");
    setModalityTags([]);
    setCategoryTags([]);
  }

  function toggleTag(tag: string, list: string[], setter: (v: string[]) => void) {
    setter(list.includes(tag) ? list.filter((t) => t !== tag) : [...list, tag]);
  }

  function handleSave() {
    create.mutate({
      title,
      description: description || null,
      resource_type: resourceType,
      external_url: externalUrl || null,
      file_url: null,
      modality_tags: modalityTags,
      category_tags: categoryTags,
    });
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl border border-cream-300 shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-cream-300">
          <h2 className="text-lg font-heading font-bold text-ink">Add Resource</h2>
          <button onClick={onClose} className="p-1 text-ink-lighter hover:text-ink transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-ink-light mb-1.5">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Thought Record Worksheet"
              className="w-full px-3.5 py-2.5 rounded-xl border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage text-sm"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-medium text-ink-light mb-2">Type</label>
            <div className="flex gap-2">
              {RESOURCE_TYPES.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setResourceType(key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                    resourceType === key
                      ? "bg-sage text-white shadow-sm"
                      : "bg-cream-100 text-ink-lighter hover:bg-cream-200"
                  }`}
                >
                  <Icon size={13} /> {label}
                </button>
              ))}
            </div>
          </div>

          {/* URL (for link/worksheet types) */}
          {(resourceType === "link" || resourceType === "worksheet") && (
            <div>
              <label className="block text-xs font-medium text-ink-light mb-1.5">
                URL <span className="text-ink-lighter font-normal">(optional)</span>
              </label>
              <input
                type="url"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage text-sm"
              />
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-ink-light mb-1.5">
              Description <span className="text-ink-lighter font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this resource..."
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-xl border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage text-sm resize-none"
            />
          </div>

          {/* Modality tags */}
          <div>
            <label className="block text-xs font-medium text-ink-light mb-2">Modality tags</label>
            <div className="flex flex-wrap gap-1.5">
              {(Object.entries(THERAPY_MODALITIES) as [TherapyModalityKey, { name: string }][]).map(
                ([key, val]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleTag(key, modalityTags, setModalityTags)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                      modalityTags.includes(key)
                        ? "bg-sage text-white"
                        : "bg-cream-100 text-ink-lighter hover:bg-cream-200"
                    }`}
                  >
                    {val.name}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Category tags */}
          <div>
            <label className="block text-xs font-medium text-ink-light mb-2">Category tags</label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORY_SUGGESTIONS.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleTag(cat, categoryTags, setCategoryTags)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                    categoryTags.includes(cat)
                      ? "bg-sage text-white"
                      : "bg-cream-100 text-ink-lighter hover:bg-cream-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-cream-300 flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={!title.trim() || create.isPending}
            className="bg-sage text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-sage-500 transition-all disabled:opacity-50 shadow-md shadow-sage/20"
          >
            {create.isPending ? "Saving..." : "Add Resource"}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-ink-lighter hover:bg-cream-100 transition-colors"
          >
            Cancel
          </button>
          {create.error && (
            <span className="text-sm text-red-600 ml-auto">{create.error.message}</span>
          )}
        </div>
      </div>
    </div>
  );
}
