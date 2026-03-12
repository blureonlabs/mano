"use client";

import { use } from "react";
import Link from "next/link";
import PlanEditor from "@/components/treatment-plan/PlanEditor";
import { ArrowLeft, ClipboardList } from "lucide-react";

export default function NewTreatmentPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href={`/dashboard/clients/${id}`} className="inline-flex items-center gap-1 text-sm text-sage hover:text-sage-600 transition-colors">
        <ArrowLeft size={14} /> Back to client
      </Link>

      <div className="flex items-center gap-2">
        <ClipboardList size={22} className="text-sage" />
        <h1 className="text-2xl font-heading font-bold text-ink">New Treatment Plan</h1>
      </div>

      <div className="bg-white rounded-2xl border border-cream-300 shadow-sm p-6">
        <PlanEditor clientId={id} />
      </div>
    </div>
  );
}
