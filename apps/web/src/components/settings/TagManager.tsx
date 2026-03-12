"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { COMMON_TECHNIQUES, RISK_FLAGS } from "@mano/shared";
import type { CustomTags } from "@mano/shared";
import {
  DEFAULT_MODALITIES,
  DEFAULT_CATEGORIES,
  type ModalityTag,
} from "@/lib/use-custom-tags";
import { Tags, X, Plus, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface TagManagerProps {
  customTags: CustomTags | undefined;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

export default function TagManager({ customTags }: TagManagerProps) {
  const [modalities, setModalities] = useState<ModalityTag[]>(
    customTags?.modalities ?? DEFAULT_MODALITIES
  );
  const [techniques, setTechniques] = useState<string[]>(
    customTags?.techniques ?? [...COMMON_TECHNIQUES]
  );
  const [categories, setCategories] = useState<string[]>(
    customTags?.categories ?? DEFAULT_CATEGORIES
  );
  const [riskFlags, setRiskFlags] = useState<string[]>(
    customTags?.risk_flags ?? [...RISK_FLAGS]
  );

  const [newModality, setNewModality] = useState("");
  const [newTechnique, setNewTechnique] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newRiskFlag, setNewRiskFlag] = useState("");

  const utils = trpc.useUtils();
  const update = trpc.therapist.update.useMutation({
    onSuccess: () => {
      utils.therapist.me.invalidate();
      toast.success("Tags updated");
    },
    onError: (err) => toast.error(err.message),
  });

  function save(
    mods: ModalityTag[],
    techs: string[],
    cats: string[],
    flags: string[]
  ) {
    update.mutate({
      custom_tags: {
        modalities: mods,
        techniques: techs,
        categories: cats,
        risk_flags: flags,
      },
    });
  }

  /* ── Modality handlers ── */
  function addModality() {
    const name = newModality.trim();
    if (!name || modalities.some((m) => m.name.toLowerCase() === name.toLowerCase()))
      return;
    const key = slugify(name);
    const next = [...modalities, { key, name, fullName: name }];
    setModalities(next);
    setNewModality("");
    save(next, techniques, categories, riskFlags);
  }

  function removeModality(key: string) {
    const next = modalities.filter((m) => m.key !== key);
    setModalities(next);
    save(next, techniques, categories, riskFlags);
  }

  function resetModalities() {
    setModalities(DEFAULT_MODALITIES);
    save(DEFAULT_MODALITIES, techniques, categories, riskFlags);
  }

  /* ── Generic string-tag handlers ── */
  function addStringTag(
    value: string,
    list: string[],
    setter: (v: string[]) => void,
    inputSetter: (v: string) => void,
    field: "techniques" | "categories" | "risk_flags"
  ) {
    const v = value.trim();
    if (!v || list.some((t) => t.toLowerCase() === v.toLowerCase())) return;
    const next = [...list, v];
    setter(next);
    inputSetter("");
    const payload = {
      modalities,
      techniques: field === "techniques" ? next : techniques,
      categories: field === "categories" ? next : categories,
      risk_flags: field === "risk_flags" ? next : riskFlags,
    };
    save(payload.modalities, payload.techniques, payload.categories, payload.risk_flags);
  }

  function removeStringTag(
    value: string,
    list: string[],
    setter: (v: string[]) => void,
    field: "techniques" | "categories" | "risk_flags"
  ) {
    const next = list.filter((t) => t !== value);
    setter(next);
    const payload = {
      modalities,
      techniques: field === "techniques" ? next : techniques,
      categories: field === "categories" ? next : categories,
      risk_flags: field === "risk_flags" ? next : riskFlags,
    };
    save(payload.modalities, payload.techniques, payload.categories, payload.risk_flags);
  }

  function resetStringTags(
    defaults: readonly string[] | string[],
    setter: (v: string[]) => void,
    field: "techniques" | "categories" | "risk_flags"
  ) {
    const arr = [...defaults];
    setter(arr);
    const payload = {
      modalities,
      techniques: field === "techniques" ? arr : techniques,
      categories: field === "categories" ? arr : categories,
      risk_flags: field === "risk_flags" ? arr : riskFlags,
    };
    save(payload.modalities, payload.techniques, payload.categories, payload.risk_flags);
  }

  return (
    <div className="bg-white rounded-2xl border border-cream-300 shadow-sm p-6 space-y-6">
      <div>
        <h3 className="flex items-center gap-2 text-base font-heading font-bold text-ink">
          <Tags size={18} className="text-sage" />
          Customize Tags
        </h3>
        <p className="text-xs text-ink-lighter mt-1">
          Add or remove tags used across resources, notes, and treatment plans
        </p>
      </div>

      <TagGroup
        label="Therapy Modalities"
        pills={modalities.map((m) => ({ id: m.key, label: m.name }))}
        onRemove={removeModality}
        inputValue={newModality}
        onInputChange={setNewModality}
        onAdd={addModality}
        onReset={resetModalities}
        placeholder="e.g., Narrative Therapy"
      />

      <TagGroup
        label="Techniques"
        pills={techniques.map((t) => ({ id: t, label: t }))}
        onRemove={(id) => removeStringTag(id, techniques, setTechniques, "techniques")}
        inputValue={newTechnique}
        onInputChange={setNewTechnique}
        onAdd={() =>
          addStringTag(newTechnique, techniques, setTechniques, setNewTechnique, "techniques")
        }
        onReset={() => resetStringTags(COMMON_TECHNIQUES, setTechniques, "techniques")}
        placeholder="e.g., Sand Tray Therapy"
      />

      <TagGroup
        label="Resource Categories"
        pills={categories.map((c) => ({ id: c, label: c }))}
        onRemove={(id) => removeStringTag(id, categories, setCategories, "categories")}
        inputValue={newCategory}
        onInputChange={setNewCategory}
        onAdd={() =>
          addStringTag(newCategory, categories, setCategories, setNewCategory, "categories")
        }
        onReset={() => resetStringTags(DEFAULT_CATEGORIES, setCategories, "categories")}
        placeholder="e.g., Worksheets"
      />

      <TagGroup
        label="Risk Flags"
        pills={riskFlags.map((f) => ({ id: f, label: f }))}
        onRemove={(id) => removeStringTag(id, riskFlags, setRiskFlags, "risk_flags")}
        inputValue={newRiskFlag}
        onInputChange={setNewRiskFlag}
        onAdd={() =>
          addStringTag(newRiskFlag, riskFlags, setRiskFlags, setNewRiskFlag, "risk_flags")
        }
        onReset={() => resetStringTags(RISK_FLAGS, setRiskFlags, "risk_flags")}
        placeholder="e.g., Eating disorder"
        variant="danger"
      />

      {update.isPending && (
        <p className="text-xs text-ink-lighter animate-pulse">Saving...</p>
      )}
    </div>
  );
}

/* ── Reusable tag group ── */

function TagGroup({
  label,
  pills,
  onRemove,
  inputValue,
  onInputChange,
  onAdd,
  onReset,
  placeholder,
  variant,
}: {
  label: string;
  pills: { id: string; label: string }[];
  onRemove: (id: string) => void;
  inputValue: string;
  onInputChange: (v: string) => void;
  onAdd: () => void;
  onReset: () => void;
  placeholder: string;
  variant?: "danger";
}) {
  const pillStyle =
    variant === "danger"
      ? "bg-red-50 text-red-700 border border-red-200"
      : "bg-cream-100 text-ink-light";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-ink-light">{label}</label>
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1 text-[11px] text-ink-lighter hover:text-sage transition-colors"
        >
          <RotateCcw size={10} /> Reset defaults
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {pills.map((pill) => (
          <span
            key={pill.id}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${pillStyle}`}
          >
            {pill.label}
            <button
              type="button"
              onClick={() => onRemove(pill.id)}
              className="text-ink-lighter hover:text-red-500 transition-colors"
            >
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAdd();
            }
          }}
          placeholder={placeholder}
          className="flex-1 px-3 py-1.5 rounded-lg border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage text-xs"
        />
        <button
          type="button"
          onClick={onAdd}
          className="px-3 py-1.5 rounded-lg bg-sage-50 text-sage text-xs font-medium hover:bg-sage-100 transition-colors flex items-center gap-1"
        >
          <Plus size={12} /> Add
        </button>
      </div>
    </div>
  );
}
