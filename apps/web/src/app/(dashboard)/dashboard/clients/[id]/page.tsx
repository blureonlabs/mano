"use client";

import { use, useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { NOTE_TEMPLATES, THERAPY_MODALITIES } from "@mano/shared";
import type { Goal, TherapyModalityKey } from "@mano/shared";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  CalendarDays,
  Clock,
  FileText,
  ClipboardList,
  FolderOpen,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Plus,
  Target,
} from "lucide-react";

type Tab = "sessions" | "notes" | "treatment" | "resources";
type NoteTemplate = keyof typeof NOTE_TEMPLATES;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
}

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [activeTab, setActiveTab] = useState<Tab>("sessions");

  const client = trpc.clients.getDetail.useQuery({ id });
  const sessions = trpc.session.byClient.useQuery({ client_id: id });
  const notes = trpc.session.listNotes.useQuery({ client_id: id, limit: 50 });
  const plans = trpc.treatmentPlan.list.useQuery({ client_id: id });

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
    { key: "treatment", label: "Treatment Plan", icon: ClipboardList },
    { key: "resources", label: "Resources", icon: FolderOpen },
  ];

  return (
    <div className="max-w-3xl space-y-6">
      {/* Back link */}
      <Link href="/dashboard/clients" className="inline-flex items-center gap-1 text-sm text-sage hover:text-sage-600 transition-colors">
        <ArrowLeft size={14} /> Back to clients
      </Link>

      {/* Client header */}
      <div className="bg-white rounded-2xl border border-cream-300 shadow-sm p-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-sage-50 flex items-center justify-center flex-shrink-0">
            <span className="text-xl font-semibold text-sage">
              {c.full_name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-heading font-bold text-ink">{c.full_name}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-1">
              {c.email && (
                <span className="inline-flex items-center gap-1 text-xs text-ink-lighter">
                  <Mail size={12} /> {c.email}
                </span>
              )}
              {c.phone && (
                <span className="inline-flex items-center gap-1 text-xs text-ink-lighter">
                  <Phone size={12} /> {c.phone}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-cream-300">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-ink-lighter mb-0.5">
              <CalendarDays size={12} /> Sessions
            </div>
            <div className="text-lg font-heading font-bold text-ink">{c.session_count}</div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs text-ink-lighter mb-0.5">
              <Clock size={12} /> Last session
            </div>
            <div className="text-sm font-medium text-ink">
              {c.last_session
                ? formatDate(c.last_session.starts_at)
                : "None"}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs text-ink-lighter mb-0.5">
              <User size={12} /> Since
            </div>
            <div className="text-sm font-medium text-ink">
              {formatDate(c.created_at)}
            </div>
          </div>
        </div>
      </div>

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
      {activeTab === "sessions" && (
        <div className="bg-white rounded-2xl border border-cream-300 shadow-sm overflow-hidden">
          {sessions.isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-cream-200 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (sessions.data?.length ?? 0) === 0 ? (
            <div className="p-10 text-center">
              <CalendarDays size={20} className="mx-auto text-ink-lighter mb-2" />
              <p className="text-sm text-ink-lighter">No sessions yet</p>
            </div>
          ) : (
            <div className="divide-y divide-cream-300">
              {sessions.data?.map((session) => (
                <div key={session.id} className="px-6 py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-ink-lighter w-6 text-center font-medium">
                      #{session.session_number ?? "—"}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-ink">
                        {formatDate(session.starts_at)}
                      </div>
                      <div className="text-xs text-ink-lighter flex items-center gap-1">
                        <Clock size={10} />
                        {formatTime(session.starts_at)} &middot; {session.duration_mins} min
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/notes/new?session_id=${session.id}`}
                      className="p-1.5 rounded-lg text-ink-lighter hover:bg-cream-100 hover:text-sage transition-colors"
                    >
                      <FileText size={14} />
                    </Link>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-[11px] font-medium ${
                      session.status === "completed"
                        ? "bg-sage-50 text-sage"
                        : session.status === "scheduled"
                        ? "bg-blue-50 text-blue-600"
                        : session.status === "pending_approval"
                        ? "bg-amber-50 text-amber"
                        : "bg-cream-200 text-ink-lighter"
                    }`}>
                      {session.status === "completed" && <CheckCircle2 size={10} />}
                      {session.status === "pending_approval" && <AlertCircle size={10} />}
                      {session.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "notes" && (
        <div className="bg-white rounded-2xl border border-cream-300 shadow-sm overflow-hidden">
          {notes.isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 bg-cream-200 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (notes.data?.length ?? 0) === 0 ? (
            <div className="p-10 text-center">
              <FileText size={20} className="mx-auto text-ink-lighter mb-2" />
              <p className="text-sm text-ink-lighter">No notes yet</p>
              <p className="text-xs text-ink-lighter/60 mt-1">
                Add notes from the sessions tab
              </p>
            </div>
          ) : (
            <div className="divide-y divide-cream-300">
              {notes.data?.map((note) => {
                const sessions = note.sessions as { starts_at: string } | null;
                const template = NOTE_TEMPLATES[note.note_type as NoteTemplate];
                const preview = note.freeform_content || note.subjective || "";
                const hasRiskFlags = note.risk_flags && note.risk_flags.length > 0;

                return (
                  <Link
                    key={note.id}
                    href={`/dashboard/notes/${note.id}`}
                    className="block px-6 py-4 hover:bg-cream-50 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-[11px] font-medium bg-cream-100 text-ink-lighter">
                        <FileText size={10} />
                        {template?.name ?? note.note_type}
                      </span>
                      {hasRiskFlags && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-pill text-[10px] font-medium bg-red-50 text-red-600">
                          <AlertTriangle size={9} /> Risk
                        </span>
                      )}
                      <span className="text-[11px] text-ink-lighter flex items-center gap-1">
                        <Clock size={10} />
                        {sessions
                          ? formatDate(sessions.starts_at)
                          : formatDate(note.created_at)}
                      </span>
                    </div>
                    {preview && (
                      <p className="text-xs text-ink-lighter truncate">
                        {preview.slice(0, 150)}{preview.length > 150 ? "..." : ""}
                      </p>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === "treatment" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">Treatment Plans</h2>
            <Link
              href={`/dashboard/clients/${id}/treatment-plan/new`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sage text-white text-xs font-medium hover:bg-sage-500 transition-colors shadow-sm"
            >
              <Plus size={12} /> New Plan
            </Link>
          </div>

          {plans.isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-24 bg-white rounded-2xl border border-cream-300 animate-pulse" />
              ))}
            </div>
          ) : (plans.data?.length ?? 0) === 0 ? (
            <div className="bg-white rounded-2xl border border-cream-300 shadow-sm p-10 text-center">
              <ClipboardList size={20} className="mx-auto text-ink-lighter mb-2" />
              <p className="text-sm text-ink-lighter">No treatment plans yet</p>
              <p className="text-xs text-ink-lighter/60 mt-1">
                Create a treatment plan to set goals and track progress
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {plans.data?.map((plan) => {
                const goals = (plan.goals as Goal[]) ?? [];
                const completedGoals = goals.filter((g) => g.completed).length;
                const totalGoals = goals.length;
                const modality = THERAPY_MODALITIES[plan.modality as TherapyModalityKey];

                const statusColors: Record<string, string> = {
                  draft: "bg-cream-200 text-ink-lighter",
                  active: "bg-sage-50 text-sage",
                  completed: "bg-blue-50 text-blue-600",
                  archived: "bg-cream-200 text-ink-lighter",
                };

                return (
                  <Link
                    key={plan.id}
                    href={`/dashboard/clients/${id}/treatment-plan/${plan.id}`}
                    className="block bg-white rounded-2xl border border-cream-300 shadow-sm p-5 hover:border-sage/40 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-sm font-semibold text-ink">{plan.title}</h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-pill text-[11px] font-medium ${statusColors[plan.status] ?? statusColors.draft}`}>
                        {plan.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mb-3">
                      {modality && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium bg-cream-100 text-ink-lighter">
                          {modality.name}
                        </span>
                      )}
                      {plan.start_date && (
                        <span className="text-[11px] text-ink-lighter flex items-center gap-1">
                          <CalendarDays size={10} />
                          {formatDate(plan.start_date)}
                        </span>
                      )}
                    </div>

                    {totalGoals > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] text-ink-lighter flex items-center gap-1">
                            <Target size={10} />
                            {completedGoals}/{totalGoals} goals
                          </span>
                        </div>
                        <div className="h-1.5 bg-cream-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-sage rounded-full transition-all"
                            style={{ width: `${totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === "resources" && (
        <div className="bg-white rounded-2xl border border-cream-300 shadow-sm p-10 text-center">
          <FolderOpen size={20} className="mx-auto text-ink-lighter mb-2" />
          <p className="text-sm text-ink-lighter">No shared resources</p>
          <p className="text-xs text-ink-lighter/60 mt-1">
            Resource sharing will be available soon
          </p>
        </div>
      )}
    </div>
  );
}
