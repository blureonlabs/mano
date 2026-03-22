"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { PRACTICE_ROLES } from "@mano/shared";
import { toast } from "sonner";
import {
  UsersRound,
  Plus,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Link as LinkIcon,
  X,
  UserPlus,
} from "lucide-react";

const ROLE_ICONS = {
  owner: ShieldCheck,
  therapist: Shield,
  admin: ShieldAlert,
} as const;

export default function TeamPage() {
  const practice = trpc.practice.me.useQuery();
  const members = trpc.practice.listMembers.useQuery();
  const invitations = trpc.practice.listInvitations.useQuery(undefined, {
    enabled: !!practice.data,
  });
  const onboardingTokens = trpc.onboarding.listTokens.useQuery();
  const utils = trpc.useUtils();

  const [practiceName, setPracticeName] = useState("");
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"therapist" | "admin">("therapist");
  const [inviteNotesAccess, setInviteNotesAccess] = useState(false);
  const [showOnboardingForm, setShowOnboardingForm] = useState(false);
  const [onboardingLabel, setOnboardingLabel] = useState("");

  // Auto-create practice from signup localStorage
  const createPractice = trpc.practice.create.useMutation({
    onSuccess: () => {
      utils.practice.me.invalidate();
      utils.practice.listMembers.invalidate();
      toast.success("Practice created");
    },
    onError: (err) => toast.error(err.message),
  });

  useEffect(() => {
    const pendingName = localStorage.getItem("mano_pending_practice");
    if (pendingName && !practice.data && !practice.isLoading) {
      localStorage.removeItem("mano_pending_practice");
      createPractice.mutate({ name: pendingName });
    }
  }, [practice.data, practice.isLoading]);

  const updateMember = trpc.practice.updateMember.useMutation({
    onSuccess: () => {
      utils.practice.listMembers.invalidate();
      toast.success("Member updated");
    },
    onError: (err) => toast.error(err.message),
  });

  const removeMember = trpc.practice.removeMember.useMutation({
    onSuccess: () => {
      utils.practice.listMembers.invalidate();
      toast.success("Member removed");
    },
    onError: (err) => toast.error(err.message),
  });

  const createInvitation = trpc.practice.createInvitation.useMutation({
    onSuccess: () => {
      utils.practice.listInvitations.invalidate();
      setShowInviteForm(false);
      setInviteEmail("");
      setInviteRole("therapist");
      setInviteNotesAccess(false);
      toast.success("Invitation created");
    },
    onError: (err) => toast.error(err.message),
  });

  const revokeInvitation = trpc.practice.revokeInvitation.useMutation({
    onSuccess: () => {
      utils.practice.listInvitations.invalidate();
      toast.success("Invitation revoked");
    },
    onError: (err) => toast.error(err.message),
  });

  const createOnboardingToken = trpc.onboarding.createToken.useMutation({
    onSuccess: () => {
      utils.onboarding.listTokens.invalidate();
      setShowOnboardingForm(false);
      setOnboardingLabel("");
      toast.success("Onboarding link created");
    },
    onError: (err) => toast.error(err.message),
  });

  const toggleOnboardingToken = trpc.onboarding.toggleToken.useMutation({
    onSuccess: () => {
      utils.onboarding.listTokens.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  }

  if (practice.isLoading) {
    return (
      <div className="max-w-3xl space-y-6">
        <div className="h-8 w-48 bg-cream-200 rounded-lg animate-pulse" />
        <div className="h-40 bg-white rounded-2xl border border-cream-300 animate-pulse" />
      </div>
    );
  }

  // No practice yet — show create prompt
  if (!practice.data) {
    return (
      <div className="max-w-3xl space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <UsersRound size={22} className="text-sage" />
            <h1 className="text-2xl font-heading font-bold text-ink">Team</h1>
          </div>
          <p className="text-sm text-ink-lighter mt-0.5">
            Create a practice to invite therapists and admin staff.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-cream-300 shadow-sm p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-cream-200 mx-auto flex items-center justify-center">
            <UsersRound size={24} className="text-ink-lighter" />
          </div>
          <div>
            <p className="text-sm text-ink font-medium">
              You don't have a practice yet
            </p>
            <p className="text-xs text-ink-lighter mt-1">
              Create one to start managing a team. You'll be the owner with full
              access.
            </p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!practiceName.trim()) return;
              createPractice.mutate({ name: practiceName.trim() });
            }}
            className="flex items-center gap-2 max-w-sm mx-auto"
          >
            <input
              type="text"
              value={practiceName}
              onChange={(e) => setPracticeName(e.target.value)}
              placeholder="Practice name"
              required
              className="flex-1 px-3 py-2.5 rounded-xl border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage text-sm"
            />
            <button
              type="submit"
              disabled={createPractice.isPending}
              className="bg-sage text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-sage-500 transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              <Plus size={14} />
              {createPractice.isPending ? "Creating..." : "Create"}
            </button>
          </form>
        </div>

        {/* Client onboarding section even without practice */}
        <OnboardingSection
          tokens={onboardingTokens.data ?? []}
          showForm={showOnboardingForm}
          label={onboardingLabel}
          onLabelChange={setOnboardingLabel}
          onToggleForm={() => setShowOnboardingForm(!showOnboardingForm)}
          onCreate={() => createOnboardingToken.mutate({ label: onboardingLabel.trim() || undefined })}
          onToggle={(id, active) => toggleOnboardingToken.mutate({ token_id: id, is_active: active })}
          onCopy={copyToClipboard}
          creating={createOnboardingToken.isPending}
        />
      </div>
    );
  }

  const isOwner = practice.data.role === "owner";
  const pendingInvitations = (invitations.data ?? []).filter((i) => i.status === "pending");
  const pastInvitations = (invitations.data ?? []).filter((i) => i.status !== "pending");

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <UsersRound size={22} className="text-sage" />
          <h1 className="text-2xl font-heading font-bold text-ink">Team</h1>
        </div>
        <p className="text-sm text-ink-lighter mt-0.5">
          {practice.data.name} — manage your team members and their access.
        </p>
      </div>

      {/* Invite button */}
      {isOwner && (
        <div>
          {showInviteForm ? (
            <div className="bg-white rounded-2xl border border-cream-300 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-ink">Create invitation</h3>
                <button type="button" onClick={() => setShowInviteForm(false)} className="text-ink-lighter hover:text-ink">
                  <X size={16} />
                </button>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  createInvitation.mutate({
                    email: inviteEmail.trim() || undefined,
                    role: inviteRole,
                    can_view_notes: inviteNotesAccess,
                  });
                }}
                className="space-y-3"
              >
                <div>
                  <label className="block text-xs font-medium text-ink-light mb-1.5">
                    Email <span className="text-ink-lighter font-normal">(optional — leave blank for open link)</span>
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="therapist@example.com"
                    className="w-full px-3 py-2.5 rounded-xl border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage text-sm"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-ink-light mb-1.5">Role</label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as "therapist" | "admin")}
                      className="w-full px-3 py-2.5 rounded-xl border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 text-sm"
                    >
                      <option value="therapist">Therapist</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer mt-5">
                    <input
                      type="checkbox"
                      checked={inviteNotesAccess}
                      onChange={(e) => setInviteNotesAccess(e.target.checked)}
                      className="rounded border-cream-300 text-sage focus:ring-sage/30"
                    />
                    <span className="text-xs text-ink-lighter font-medium">Notes access</span>
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={createInvitation.isPending}
                  className="bg-sage text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-sage-500 transition-all disabled:opacity-50"
                >
                  {createInvitation.isPending ? "Creating..." : "Create Invitation"}
                </button>
              </form>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowInviteForm(true)}
              className="flex items-center gap-2 bg-sage text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-sage-500 transition-all shadow-md shadow-sage/20"
            >
              <UserPlus size={14} />
              Invite team member
            </button>
          )}
        </div>
      )}

      {/* Pending invitations */}
      {pendingInvitations.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-ink-lighter uppercase tracking-wider">Pending invitations</h3>
          <div className="bg-white rounded-2xl border border-cream-300 shadow-sm overflow-hidden divide-y divide-cream-300">
            {pendingInvitations.map((inv) => {
              const inviteUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/invite/${inv.token}`;
              return (
                <div key={inv.id} className="px-6 py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-sm text-ink font-medium truncate">
                      {inv.email || "Open invitation"}
                    </div>
                    <div className="text-xs text-ink-lighter capitalize">
                      {inv.role} &middot; Expires {new Date(inv.expires_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => copyToClipboard(inviteUrl)}
                      className="text-ink-lighter hover:text-sage transition-colors p-1.5 rounded-lg"
                      title="Copy invite link"
                    >
                      <Copy size={14} />
                    </button>
                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => revokeInvitation.mutate({ invitation_id: inv.id })}
                        className="text-ink-lighter hover:text-red-600 transition-colors p-1.5 rounded-lg"
                        title="Revoke"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Members list */}
      <div className="bg-white rounded-2xl border border-cream-300 shadow-sm overflow-hidden divide-y divide-cream-300">
        {members.data?.map((m) => {
          const therapistInfo = m.therapists as {
            full_name: string;
            email: string | null;
            avatar_url: string | null;
          } | null;
          const RoleIcon = ROLE_ICONS[m.role as keyof typeof ROLE_ICONS] ?? Shield;
          const roleInfo = PRACTICE_ROLES[m.role as keyof typeof PRACTICE_ROLES];

          return (
            <div
              key={m.id}
              className="px-6 py-4 flex items-center justify-between hover:bg-cream-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-sage-50 flex items-center justify-center flex-shrink-0">
                  <RoleIcon size={16} className="text-sage" />
                </div>
                <div>
                  <div className="text-sm font-medium text-ink">
                    {therapistInfo?.full_name ?? "Invited member"}
                  </div>
                  <div className="text-xs text-ink-lighter flex items-center gap-2 mt-0.5">
                    <span className="capitalize">{roleInfo?.label ?? m.role}</span>
                    <span className="text-ink-lighter/40">|</span>
                    <span className="inline-flex items-center gap-1">
                      {m.can_view_notes ? (
                        <>
                          <Eye size={10} /> Can view notes
                        </>
                      ) : (
                        <>
                          <EyeOff size={10} /> No notes access
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions (owner only, can't modify self) */}
              {isOwner && m.role !== "owner" && (
                <div className="flex items-center gap-2">
                  <select
                    value={m.role}
                    onChange={(e) =>
                      updateMember.mutate({
                        member_id: m.id,
                        role: e.target.value as "therapist" | "admin",
                      })
                    }
                    className="text-xs px-2 py-1.5 rounded-lg border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30"
                  >
                    <option value="therapist">Therapist</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button
                    type="button"
                    onClick={() =>
                      updateMember.mutate({
                        member_id: m.id,
                        can_view_notes: !m.can_view_notes,
                      })
                    }
                    title={
                      m.can_view_notes ? "Revoke notes access" : "Grant notes access"
                    }
                    className={`p-1.5 rounded-lg transition-colors ${
                      m.can_view_notes
                        ? "text-sage hover:bg-sage-50"
                        : "text-ink-lighter hover:bg-cream-100"
                    }`}
                  >
                    {m.can_view_notes ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("Remove this member from the practice?")) {
                        removeMember.mutate({ member_id: m.id });
                      }
                    }}
                    className="text-ink-lighter hover:text-red-600 transition-colors p-1.5 rounded-lg"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {(members.data?.length ?? 0) === 0 && (
          <div className="p-8 text-center">
            <p className="text-sm text-ink-lighter">No team members yet</p>
          </div>
        )}
      </div>

      {/* Past invitations */}
      {pastInvitations.length > 0 && (
        <details className="group">
          <summary className="text-xs font-semibold text-ink-lighter uppercase tracking-wider cursor-pointer list-none flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="transition-transform group-open:rotate-90">
              <polyline points="9 18 15 12 9 6" />
            </svg>
            Past invitations ({pastInvitations.length})
          </summary>
          <div className="mt-2 bg-white rounded-xl border border-cream-300 overflow-hidden divide-y divide-cream-300">
            {pastInvitations.map((inv) => (
              <div key={inv.id} className="px-4 py-2.5 flex items-center justify-between text-xs">
                <span className="text-ink-lighter">{inv.email || "Open link"}</span>
                <span className={`font-medium px-2 py-0.5 rounded-pill ${
                  inv.status === "accepted" ? "bg-sage-50 text-sage" :
                  inv.status === "revoked" ? "bg-red-50 text-red-600" :
                  "bg-cream-100 text-ink-lighter"
                }`}>
                  {inv.status}
                </span>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Client onboarding links */}
      <OnboardingSection
        tokens={onboardingTokens.data ?? []}
        showForm={showOnboardingForm}
        label={onboardingLabel}
        onLabelChange={setOnboardingLabel}
        onToggleForm={() => setShowOnboardingForm(!showOnboardingForm)}
        onCreate={() => createOnboardingToken.mutate({ label: onboardingLabel.trim() || undefined })}
        onToggle={(id, active) => toggleOnboardingToken.mutate({ token_id: id, is_active: active })}
        onCopy={copyToClipboard}
        creating={createOnboardingToken.isPending}
      />

      {/* Info card */}
      <div className="bg-cream-50 rounded-xl p-4 text-xs text-ink-lighter space-y-1">
        <p className="font-medium text-ink text-sm">Role permissions</p>
        {Object.entries(PRACTICE_ROLES).map(([key, val]) => (
          <p key={key}>
            <span className="font-medium capitalize">{val.label}</span> — {val.description}
          </p>
        ))}
      </div>
    </div>
  );
}

// Client onboarding tokens section
interface OnboardingToken {
  id: string;
  token: string;
  label: string | null;
  is_active: boolean;
  max_uses: number | null;
  use_count: number;
  created_at: string;
}

function OnboardingSection({
  tokens,
  showForm,
  label,
  onLabelChange,
  onToggleForm,
  onCreate,
  onToggle,
  onCopy,
  creating,
}: {
  tokens: OnboardingToken[];
  showForm: boolean;
  label: string;
  onLabelChange: (v: string) => void;
  onToggleForm: () => void;
  onCreate: () => void;
  onToggle: (id: string, active: boolean) => void;
  onCopy: (text: string) => void;
  creating: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
            <LinkIcon size={14} className="text-sage" />
            Client onboarding links
          </h3>
          <p className="text-xs text-ink-lighter mt-0.5">
            Share these links with clients so they can register themselves.
          </p>
        </div>
        <button
          type="button"
          onClick={onToggleForm}
          className="text-xs text-sage font-medium hover:text-sage-600 transition-colors flex items-center gap-1"
        >
          <Plus size={12} />
          Create link
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-cream-300 p-4 flex items-center gap-2">
          <input
            type="text"
            value={label}
            onChange={(e) => onLabelChange(e.target.value)}
            placeholder="Label (e.g. Website, WhatsApp group)"
            className="flex-1 px-3 py-2 rounded-lg border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 text-sm"
          />
          <button
            type="button"
            onClick={onCreate}
            disabled={creating}
            className="bg-sage text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-sage-500 transition-all disabled:opacity-50"
          >
            {creating ? "Creating..." : "Create"}
          </button>
        </div>
      )}

      {tokens.length > 0 && (
        <div className="bg-white rounded-xl border border-cream-300 overflow-hidden divide-y divide-cream-300">
          {tokens.map((t) => {
            const url = `${typeof window !== "undefined" ? window.location.origin : ""}/onboard/${t.token}`;
            return (
              <div key={t.id} className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-ink truncate">
                    {t.label || "Onboarding link"}
                  </div>
                  <div className="text-xs text-ink-lighter">
                    {t.use_count} registered
                    {t.max_uses && ` / ${t.max_uses} max`}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onCopy(url)}
                    className="text-ink-lighter hover:text-sage transition-colors p-1.5 rounded-lg"
                    title="Copy link"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggle(t.id, !t.is_active)}
                    className={`text-xs font-medium px-2 py-1 rounded-lg transition-colors ${
                      t.is_active
                        ? "bg-sage-50 text-sage hover:bg-sage-100"
                        : "bg-cream-100 text-ink-lighter hover:bg-cream-200"
                    }`}
                  >
                    {t.is_active ? "Active" : "Inactive"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
