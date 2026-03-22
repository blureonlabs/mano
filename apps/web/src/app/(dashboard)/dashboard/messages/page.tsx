"use client";

import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { MessageSquare, Search, Send } from "lucide-react";

export default function MessagesPage() {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [messageText, setMessageText] = useState("");
  const threadEndRef = useRef<HTMLDivElement>(null);

  const clients = trpc.clients.list.useQuery();
  const unreadCounts = trpc.message.unreadCounts.useQuery();
  const utils = trpc.useUtils();

  const messages = trpc.message.list.useQuery(
    { client_id: selectedClientId!, limit: 50 },
    { enabled: !!selectedClientId }
  );

  const markRead = trpc.message.markRead.useMutation({
    onSuccess: () => {
      utils.message.unreadCounts.invalidate();
    },
  });

  const sendMessage = trpc.message.send.useMutation({
    onMutate: async ({ client_id, content }) => {
      await utils.message.list.cancel();
      const queryInput = { client_id, limit: 50 };
      const previousData = utils.message.list.getData(queryInput);
      const optimisticMessage = {
        id: `optimistic-${Date.now()}`,
        client_id,
        therapist_id: "",
        sender_type: "therapist" as const,
        content,
        read: true,
        created_at: new Date().toISOString(),
      };
      utils.message.list.setData(queryInput, (old) => {
        if (!old) return old;
        // Messages come in descending order from API, so prepend
        return {
          ...old,
          messages: [optimisticMessage, ...old.messages],
        };
      });
      return { previousData, queryInput };
    },
    onSuccess: (_data, _vars, context) => {
      setMessageText("");
      // Full invalidate to get the real server data
      if (context?.queryInput) {
        utils.message.list.invalidate();
      }
      utils.message.unreadCounts.invalidate();
    },
    onError: (_err, _vars, context) => {
      if (context?.previousData !== undefined && context?.queryInput) {
        utils.message.list.setData(context.queryInput, context.previousData);
      }
    },
  });

  // Mark messages as read when a client is selected
  useEffect(() => {
    if (selectedClientId && unreadCounts.data?.[selectedClientId]) {
      markRead.mutate({ client_id: selectedClientId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClientId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.data]);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedClientId || !messageText.trim()) return;
    sendMessage.mutate({
      client_id: selectedClientId,
      content: messageText.trim(),
    });
  }

  const filteredClients =
    clients.data?.filter((c) =>
      c.full_name.toLowerCase().includes(search.toLowerCase())
    ) ?? [];

  // Sort clients: those with unread messages first, then alphabetically
  const sortedClients = [...filteredClients].sort((a, b) => {
    const aUnread = unreadCounts.data?.[a.id] ?? 0;
    const bUnread = unreadCounts.data?.[b.id] ?? 0;
    if (aUnread > 0 && bUnread === 0) return -1;
    if (bUnread > 0 && aUnread === 0) return 1;
    return a.full_name.localeCompare(b.full_name);
  });

  const selectedClient = clients.data?.find((c) => c.id === selectedClientId);

  // Messages come in descending order from API, reverse for display
  const displayMessages = [...(messages.data?.messages ?? [])].reverse();

  function formatTime(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" }) ===
      now.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" });
    if (isToday) {
      return date.toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    }
    return date.toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  if (clients.isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-40 bg-cream-200 rounded-lg animate-pulse" />
        <div className="h-[600px] bg-white rounded-2xl border border-cream-300 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <MessageSquare size={22} className="text-sage" />
        <h1 className="text-2xl font-heading font-bold text-ink">Messages</h1>
      </div>

      {/* Two-panel layout */}
      <div className="flex h-[calc(100vh-180px)] bg-white rounded-2xl border border-cream-300 shadow-sm overflow-hidden">
        {/* Left panel — client list */}
        <div className="w-[300px] flex-shrink-0 border-r border-cream-300 flex flex-col">
          {/* Search */}
          <div className="p-3 border-b border-cream-300">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-lighter" />
              <input
                type="text"
                placeholder="Search clients..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage text-sm"
              />
            </div>
          </div>

          {/* Client list */}
          <div className="flex-1 overflow-y-auto">
            {sortedClients.length === 0 ? (
              <div className="p-6 text-center text-sm text-ink-lighter">
                {search ? "No clients match your search" : "No clients yet"}
              </div>
            ) : (
              sortedClients.map((client) => {
                const unread = unreadCounts.data?.[client.id] ?? 0;
                const isActive = selectedClientId === client.id;
                return (
                  <button
                    key={client.id}
                    onClick={() => setSelectedClientId(client.id)}
                    className={`w-full text-left px-4 py-3 border-b border-cream-200 transition-colors ${
                      isActive
                        ? "bg-sage-50"
                        : "hover:bg-cream-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-sage-50 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-semibold text-sage">
                          {client.full_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-ink truncate">
                            {client.full_name}
                          </span>
                          {unread > 0 && (
                            <span className="ml-2 bg-sage text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">
                              {unread}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right panel — message thread */}
        <div className="flex-1 flex flex-col min-w-0">
          {!selectedClientId ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-cream-200 mx-auto mb-3 flex items-center justify-center">
                  <MessageSquare size={24} className="text-ink-lighter" />
                </div>
                <p className="text-sm text-ink-lighter">
                  Select a client to view messages
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div className="px-5 py-3.5 border-b border-cream-300 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-sage-50 flex items-center justify-center">
                  <span className="text-sm font-semibold text-sage">
                    {selectedClient?.full_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm font-semibold text-ink">
                  {selectedClient?.full_name}
                </span>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {messages.isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-sm text-ink-lighter">Loading messages...</div>
                  </div>
                ) : displayMessages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-cream-200 mx-auto mb-3 flex items-center justify-center">
                        <MessageSquare size={20} className="text-ink-lighter" />
                      </div>
                      <p className="text-sm text-ink-lighter">
                        No messages yet. Start the conversation.
                      </p>
                    </div>
                  </div>
                ) : (
                  displayMessages.map((msg) => {
                    const isTherapist = msg.sender_type === "therapist";
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isTherapist ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                            isTherapist
                              ? "bg-sage text-white"
                              : "bg-cream-100 text-ink"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {msg.content as string}
                          </p>
                          <p
                            className={`text-[10px] mt-1 ${
                              isTherapist ? "text-white/70" : "text-ink-lighter"
                            }`}
                          >
                            {formatTime(msg.created_at as string)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={threadEndRef} />
              </div>

              {/* Input bar */}
              <form
                onSubmit={handleSend}
                className="px-4 py-3 border-t border-cream-300 flex items-end gap-2"
              >
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(e);
                    }
                  }}
                  placeholder="Type a message..."
                  rows={1}
                  className="flex-1 resize-none px-4 py-2.5 rounded-xl border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage text-sm max-h-32"
                />
                <button
                  type="submit"
                  disabled={sendMessage.isPending || !messageText.trim()}
                  className="bg-sage text-white p-2.5 rounded-xl hover:bg-sage-500 transition-all disabled:opacity-50 flex-shrink-0"
                >
                  <Send size={16} />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
