"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { THERAPY_MODALITIES, type TherapyModalityKey } from "@mano/shared";
import { X, Send, FileText, Link as LinkIcon, Upload } from "lucide-react";

interface ShareResourceModalProps {
  open: boolean;
  clientId: string;
  clientName: string;
  onClose: () => void;
  onShared: () => void;
}

const TYPE_ICONS: Record<string, typeof FileText> = {
  file: Upload,
  link: LinkIcon,
  worksheet: FileText,
};

export default function ShareResourceModal({
  open,
  clientId,
  clientName,
  onClose,
  onShared,
}: ShareResourceModalProps) {
  const [note, setNote] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const resources = trpc.resource.list.useQuery(undefined, { enabled: open });
  const share = trpc.resource.share.useMutation({
    onSuccess: () => {
      onShared();
      onClose();
      setNote("");
      setSelectedId(null);
    },
  });

  function handleShare() {
    if (!selectedId) return;
    share.mutate({
      resource_id: selectedId,
      client_id: clientId,
      note: note || null,
    });
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl border border-cream-300 shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-cream-300">
          <div>
            <h2 className="text-lg font-heading font-bold text-ink">Share Resource</h2>
            <p className="text-xs text-ink-lighter mt-0.5">with {clientName}</p>
          </div>
          <button onClick={onClose} className="p-1 text-ink-lighter hover:text-ink transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Resource list */}
          <div>
            <label className="block text-xs font-medium text-ink-light mb-2">Select resource</label>
            {resources.isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-cream-200 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : (resources.data?.length ?? 0) === 0 ? (
              <div className="bg-cream-50 rounded-xl p-4 text-center">
                <p className="text-sm text-ink-lighter">No resources in your library yet</p>
                <p className="text-xs text-ink-lighter/60 mt-1">
                  Add resources from the Resources page first
                </p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {resources.data?.map((r) => {
                  const Icon = TYPE_ICONS[r.resource_type] ?? FileText;
                  const modalities = (r.modality_tags ?? [])
                    .map((t: string) => THERAPY_MODALITIES[t as TherapyModalityKey]?.name)
                    .filter(Boolean);

                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedId(r.id)}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl border transition-colors ${
                        selectedId === r.id
                          ? "border-sage bg-sage-50"
                          : "border-cream-300 hover:border-sage/40"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon size={14} className="text-ink-lighter flex-shrink-0" />
                        <span className="text-sm font-medium text-ink truncate">{r.title}</span>
                      </div>
                      {modalities.length > 0 && (
                        <div className="flex gap-1 mt-1 ml-[22px]">
                          {modalities.map((m: string) => (
                            <span key={m} className="text-[10px] px-1.5 py-0.5 bg-cream-100 text-ink-lighter rounded">
                              {m}
                            </span>
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Note */}
          {selectedId && (
            <div>
              <label className="block text-xs font-medium text-ink-light mb-1.5">
                Note for client <span className="text-ink-lighter font-normal">(optional)</span>
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g., Please complete this before our next session..."
                rows={2}
                className="w-full px-3.5 py-2.5 rounded-xl border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage text-sm resize-none"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-cream-300 flex items-center gap-3">
          <button
            onClick={handleShare}
            disabled={!selectedId || share.isPending}
            className="bg-sage text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-sage-500 transition-all disabled:opacity-50 shadow-md shadow-sage/20 flex items-center gap-2"
          >
            <Send size={13} />
            {share.isPending ? "Sharing..." : "Share"}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-ink-lighter hover:bg-cream-100 transition-colors"
          >
            Cancel
          </button>
          {share.error && (
            <span className="text-sm text-red-600 ml-auto">{share.error.message}</span>
          )}
        </div>
      </div>
    </div>
  );
}
