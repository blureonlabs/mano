"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useCustomTags } from "@/lib/use-custom-tags";
import AddResourceModal from "@/components/resources/AddResourceModal";
import {
  FolderOpen,
  Plus,
  FileText,
  Link as LinkIcon,
  Upload,
  ExternalLink,
  Trash2,
  Tag,
} from "lucide-react";

const TYPE_ICONS: Record<string, typeof FileText> = {
  file: Upload,
  link: LinkIcon,
  worksheet: FileText,
};

const TYPE_COLORS: Record<string, string> = {
  file: "bg-blue-50 text-blue-600",
  link: "bg-amber-50 text-amber",
  worksheet: "bg-sage-50 text-sage",
};

export default function ResourcesPage() {
  const { modalities } = useCustomTags();
  const [showAdd, setShowAdd] = useState(false);
  const [filterModality, setFilterModality] = useState<string>("");

  const resources = trpc.resource.list.useQuery(
    filterModality ? { modality_tag: filterModality } : undefined
  );
  const utils = trpc.useUtils();
  const deleteResource = trpc.resource.delete.useMutation({
    onSuccess: () => utils.resource.list.invalidate(),
  });

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderOpen size={22} className="text-sage" />
          <h1 className="text-2xl font-heading font-bold text-ink">Resources</h1>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-sage text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-sage-500 transition-all shadow-md shadow-sage/20 flex items-center gap-1.5"
        >
          <Plus size={14} /> Add Resource
        </button>
      </div>

      {/* Modality filter */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setFilterModality("")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            !filterModality
              ? "bg-sage text-white"
              : "bg-cream-100 text-ink-lighter hover:bg-cream-200"
          }`}
        >
          All
        </button>
        {modalities.map((m) => (
          <button
            key={m.key}
            onClick={() => setFilterModality(m.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterModality === m.key
                ? "bg-sage text-white"
                : "bg-cream-100 text-ink-lighter hover:bg-cream-200"
            }`}
          >
            {m.name}
          </button>
        ))}
      </div>

      {/* Resource grid */}
      {resources.isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-white rounded-2xl border border-cream-300 animate-pulse" />
          ))}
        </div>
      ) : (resources.data?.length ?? 0) === 0 ? (
        <div className="bg-white rounded-2xl border border-cream-300 shadow-sm p-12 text-center">
          <FolderOpen size={28} className="mx-auto text-ink-lighter mb-3" />
          <p className="text-sm text-ink-lighter font-medium">
            {filterModality ? "No resources match this filter" : "Your resource library is empty"}
          </p>
          <p className="text-xs text-ink-lighter/60 mt-1">
            Add worksheets, links, and files to share with clients
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resources.data?.map((r) => {
            const Icon = TYPE_ICONS[r.resource_type] ?? FileText;
            const typeColor = TYPE_COLORS[r.resource_type] ?? TYPE_COLORS.file;
            const mods = (r.modality_tags ?? [])
              .map((t: string) => modalities.find((m) => m.key === t)?.name ?? t)
              .filter(Boolean);
            const categories = r.category_tags ?? [];

            return (
              <div
                key={r.id}
                className="bg-white rounded-2xl border border-cream-300 shadow-sm p-5 hover:border-sage/40 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium ${typeColor}`}>
                      <Icon size={11} /> {r.resource_type}
                    </span>
                    <h3 className="text-sm font-semibold text-ink truncate">{r.title}</h3>
                  </div>
                  <button
                    onClick={() => deleteResource.mutate({ resource_id: r.id })}
                    className="p-1 text-ink-lighter hover:text-red-600 transition-colors flex-shrink-0"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                {r.description && (
                  <p className="text-xs text-ink-lighter mb-2 line-clamp-2">{r.description}</p>
                )}

                {r.external_url && (
                  <a
                    href={r.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-sage hover:text-sage-600 mb-2"
                  >
                    <ExternalLink size={10} /> Open link
                  </a>
                )}

                {(mods.length > 0 || categories.length > 0) && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {mods.map((m: string) => (
                      <span key={m} className="text-[10px] px-1.5 py-0.5 bg-cream-100 text-ink-lighter rounded">
                        {m}
                      </span>
                    ))}
                    {categories.map((c: string) => (
                      <span key={c} className="text-[10px] px-1.5 py-0.5 bg-sage-50 text-sage rounded flex items-center gap-0.5">
                        <Tag size={8} /> {c}
                      </span>
                    ))}
                  </div>
                )}

                <div className="text-[10px] text-ink-lighter/60 mt-2">
                  Added {formatDate(r.created_at)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AddResourceModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onCreated={() => utils.resource.list.invalidate()}
      />
    </div>
  );
}
