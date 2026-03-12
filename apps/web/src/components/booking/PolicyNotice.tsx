"use client";

import { useState } from "react";
import { ShieldCheck, ChevronDown, ChevronUp } from "lucide-react";

interface PolicyNoticeProps {
  cancellationPolicy: string | null;
  latePolicy: string | null;
  reschedulingPolicy: string | null;
}

export default function PolicyNotice({
  cancellationPolicy,
  latePolicy,
  reschedulingPolicy,
}: PolicyNoticeProps) {
  const [expanded, setExpanded] = useState(false);

  const hasPolicies = cancellationPolicy || latePolicy || reschedulingPolicy;
  if (!hasPolicies) return null;

  return (
    <div className="bg-cream-50 border border-cream-300 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-cream-100 transition-colors"
      >
        <span className="flex items-center gap-2 text-xs font-medium text-ink-light">
          <ShieldCheck size={14} className="text-sage" />
          Session policies
        </span>
        {expanded ? (
          <ChevronUp size={14} className="text-ink-lighter" />
        ) : (
          <ChevronDown size={14} className="text-ink-lighter" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {cancellationPolicy && (
            <div>
              <div className="text-[11px] font-semibold text-ink-light uppercase tracking-wider mb-0.5">
                Cancellation
              </div>
              <p className="text-xs text-ink-lighter leading-relaxed">{cancellationPolicy}</p>
            </div>
          )}
          {latePolicy && (
            <div>
              <div className="text-[11px] font-semibold text-ink-light uppercase tracking-wider mb-0.5">
                Late arrival
              </div>
              <p className="text-xs text-ink-lighter leading-relaxed">{latePolicy}</p>
            </div>
          )}
          {reschedulingPolicy && (
            <div>
              <div className="text-[11px] font-semibold text-ink-light uppercase tracking-wider mb-0.5">
                Rescheduling
              </div>
              <p className="text-xs text-ink-lighter leading-relaxed">{reschedulingPolicy}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
