"use client";

import { use, useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  CalendarDays,
  FileText,
  ClipboardList,
  FolderOpen,
} from "lucide-react";
import {
  ClientHeader,
  SessionsTab,
  NotesTab,
  TreatmentTab,
  ResourcesTab,
  IntakeTab,
} from "@/components/client-detail";

type Tab = "sessions" | "notes" | "treatment" | "resources" | "intake";

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [activeTab, setActiveTab] = useState<Tab>("sessions");

  const client = trpc.clients.getDetail.useQuery({ id });

  if (client.isLoading) {
    return (
      <div className="max-w-3xl space-y-6">
        <div className="h-6 w-24 bg-cream-200 rounded-lg animate-pulse" />
        <div className="h-32 bg-white rounded-2xl border border-cream-300 animate-pulse" />
        <div className="h-64 bg-white rounded-2xl border border-cream-300 animate-pulse" />
      </div>
    );
  }

  if (client.error || !client.data) {
    return (
      <div className="max-w-3xl space-y-6">
        <Link href="/dashboard/clients" className="inline-flex items-center gap-1 text-sm text-sage hover:text-sage-600 transition-colors">
          <ArrowLeft size={14} /> Back to clients
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700 text-sm">Client not found</p>
        </div>
      </div>
    );
  }

  const c = client.data;

  const tabs: { key: Tab; label: string; icon: typeof CalendarDays }[] = [
    { key: "sessions", label: "Sessions", icon: CalendarDays },
    { key: "notes", label: "Notes", icon: FileText },
    { key: "treatment", label: "Treatment", icon: ClipboardList },
    { key: "intake", label: "Intake", icon: ClipboardList },
    { key: "resources", label: "Resources", icon: FolderOpen },
  ];

  return (
    <div className="max-w-3xl space-y-6">
      {/* Back link */}
      <Link href="/dashboard/clients" className="inline-flex items-center gap-1 text-sm text-sage hover:text-sage-600 transition-colors">
        <ArrowLeft size={14} /> Back to clients
      </Link>

      {/* Client header */}
      <ClientHeader clientId={id} client={c} />

      {/* Tabs */}
      <div className="flex gap-1 bg-cream-100 rounded-xl p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-white text-ink shadow-sm"
                  : "text-ink-lighter hover:text-ink"
              }`}
            >
              <Icon size={13} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === "sessions" && <SessionsTab clientId={id} />}
      {activeTab === "notes" && <NotesTab clientId={id} />}
      {activeTab === "treatment" && <TreatmentTab clientId={id} />}
      {activeTab === "resources" && <ResourcesTab clientId={id} clientName={c.full_name} />}
      {activeTab === "intake" && <IntakeTab clientId={id} />}
    </div>
  );
}
