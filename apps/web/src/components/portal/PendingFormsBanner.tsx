"use client";

import Link from "next/link";

interface PendingForm {
  id: string;
  access_token: string;
  status: string;
  expires_at: string;
}

interface PendingFormsBannerProps {
  forms: PendingForm[];
}

export default function PendingFormsBanner({ forms }: PendingFormsBannerProps) {
  if (forms.length === 0) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
        <h3 className="text-sm font-semibold text-amber-800">
          {forms.length === 1 ? "1 form to complete" : `${forms.length} forms to complete`}
        </h3>
      </div>
      <div className="space-y-2">
        {forms.map((form) => (
          <Link
            key={form.id}
            href={`/intake/${form.access_token}`}
            className="block bg-white border border-amber-200 rounded-xl px-4 py-3 text-sm font-medium text-amber-700 hover:bg-amber-50 transition-colors"
          >
            Fill intake form &rarr;
          </Link>
        ))}
      </div>
    </div>
  );
}
