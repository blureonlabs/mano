"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Megaphone,
  Send,
  Mail,
  MessageCircle,
  CheckCircle2,
  Users,
} from "lucide-react";

type Channel = "whatsapp" | "email" | "both";

export default function BroadcastPage() {
  const clients = trpc.clients.list.useQuery({ includeAll: true });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [channel, setChannel] = useState<Channel>("both");

  const send = trpc.broadcast.send.useMutation({
    onSuccess: (data) => {
      toast.success(
        `Sent to ${data.total_clients} client${data.total_clients > 1 ? "s" : ""}`
      );
      setSelectedIds([]);
      setSubject("");
      setMessage("");
    },
    onError: (err) => toast.error(err.message),
  });

  function toggleClient(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function selectAll() {
    if (!clients.data) return;
    if (selectedIds.length === clients.data.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(clients.data.map((c) => c.id));
    }
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (selectedIds.length === 0) {
      toast.error("Select at least one client");
      return;
    }
    send.mutate({
      subject: subject || undefined,
      message,
      channel,
      client_ids: selectedIds,
    });
  }

  if (clients.isLoading) {
    return (
      <div className="max-w-3xl space-y-6">
        <div className="h-8 w-48 bg-cream-200 rounded-lg animate-pulse" />
        <div className="h-40 bg-white rounded-2xl border border-cream-300 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Megaphone size={22} className="text-sage" />
          <h1 className="text-2xl font-heading font-bold text-ink">
            Broadcast
          </h1>
        </div>
        <p className="text-sm text-ink-lighter mt-0.5">
          Send a message to multiple clients at once via WhatsApp or email.
        </p>
      </div>

      <form onSubmit={handleSend} className="space-y-5">
        {/* Channel selector */}
        <div className="bg-white rounded-2xl border border-cream-300 shadow-sm p-5 space-y-4">
          <h3 className="text-sm font-semibold text-ink">Channel</h3>
          <div className="flex gap-2">
            {(
              [
                { value: "both", label: "Both", icon: Send },
                { value: "whatsapp", label: "WhatsApp", icon: MessageCircle },
                { value: "email", label: "Email", icon: Mail },
              ] as const
            ).map((ch) => {
              const Icon = ch.icon;
              return (
                <button
                  key={ch.value}
                  type="button"
                  onClick={() => setChannel(ch.value)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5 transition-all ${
                    channel === ch.value
                      ? "bg-sage text-white shadow-md shadow-sage/20"
                      : "bg-cream-100 text-ink-lighter hover:bg-cream-200"
                  }`}
                >
                  <Icon size={14} />
                  {ch.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Client selection */}
        <div className="bg-white rounded-2xl border border-cream-300 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink flex items-center gap-1.5">
              <Users size={14} className="text-sage" />
              Recipients ({selectedIds.length} selected)
            </h3>
            <button
              type="button"
              onClick={selectAll}
              className="text-xs text-sage hover:text-sage-500 font-medium"
            >
              {selectedIds.length === (clients.data?.length ?? 0)
                ? "Deselect all"
                : "Select all"}
            </button>
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {clients.data?.map((c) => (
              <label
                key={c.id}
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-cream-50 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(c.id)}
                  onChange={() => toggleClient(c.id)}
                  className="rounded border-cream-300 text-sage focus:ring-sage/30"
                />
                <span className="text-sm text-ink">{c.full_name}</span>
                {c.email && (
                  <span className="text-xs text-ink-lighter">{c.email}</span>
                )}
              </label>
            ))}
            {(clients.data?.length ?? 0) === 0 && (
              <p className="text-sm text-ink-lighter text-center py-4">
                No clients yet
              </p>
            )}
          </div>
        </div>

        {/* Message */}
        <div className="bg-white rounded-2xl border border-cream-300 shadow-sm p-5 space-y-3">
          {(channel === "email" || channel === "both") && (
            <div>
              <label className="block text-xs font-medium text-ink-light mb-1">
                Subject (email only)
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Schedule update"
                maxLength={200}
                className="w-full px-3 py-2.5 rounded-xl border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage text-sm"
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-ink-light mb-1">
              Message *
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={4}
              maxLength={5000}
              placeholder="Type your message here..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage text-sm transition-shadow resize-none"
            />
            <p className="text-[10px] text-ink-lighter mt-1 text-right">
              {message.length}/5000
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={send.isPending || selectedIds.length === 0 || !message}
          className="bg-sage text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-sage-500 transition-all disabled:opacity-50 shadow-md shadow-sage/20 flex items-center gap-2"
        >
          {send.isPending ? (
            "Sending..."
          ) : (
            <>
              <Send size={14} /> Send to {selectedIds.length} client
              {selectedIds.length !== 1 ? "s" : ""}
            </>
          )}
        </button>

        {send.isSuccess && send.data && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
            <CheckCircle2 size={18} className="text-green-600 mt-0.5" />
            <div className="text-sm text-green-800">
              <p className="font-medium">Broadcast sent</p>
              <p className="text-xs mt-0.5">
                {send.data.email_sent > 0 &&
                  `${send.data.email_sent} email${send.data.email_sent > 1 ? "s" : ""} sent. `}
                {send.data.whatsapp_sent > 0 &&
                  `${send.data.whatsapp_sent} WhatsApp message${send.data.whatsapp_sent > 1 ? "s" : ""} sent.`}
              </p>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
