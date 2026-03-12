"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";

export default function ClientsPage() {
  const clients = trpc.clients.list.useQuery();
  const utils = trpc.useUtils();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [search, setSearch] = useState("");

  const create = trpc.clients.create.useMutation({
    onSuccess: () => {
      utils.clients.list.invalidate();
      setShowForm(false);
      setName("");
      setEmail("");
      setPhone("");
    },
  });

  const deactivate = trpc.clients.deactivate.useMutation({
    onSuccess: () => utils.clients.list.invalidate(),
  });

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    create.mutate({
      full_name: name,
      email: email || null,
      phone: phone || null,
    });
  }

  const filtered = clients.data?.filter((c) =>
    c.full_name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  if (clients.isLoading) {
    return (
      <div className="max-w-3xl space-y-6">
        <div className="h-8 w-32 bg-cream-200 rounded-lg animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-white rounded-2xl border border-cream-300 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-ink">Clients</h1>
          <p className="text-sm text-ink-lighter mt-0.5">
            {clients.data?.length ?? 0} active client{(clients.data?.length ?? 0) !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-sage text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-sage-500 transition-all shadow-md shadow-sage/20"
        >
          {showForm ? "Cancel" : "+ Add Client"}
        </button>
      </div>

      {/* Add client form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-white rounded-2xl border border-cream-300 shadow-sm p-5 space-y-4"
        >
          <h3 className="text-sm font-semibold text-ink">New Client</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Full name *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="px-3.5 py-2.5 rounded-xl border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage text-sm"
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage text-sm"
            />
            <input
              type="tel"
              placeholder="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage text-sm"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={create.isPending}
              className="bg-sage text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-sage-500 transition-all disabled:opacity-50"
            >
              {create.isPending ? "Adding..." : "Add Client"}
            </button>
            {create.error && (
              <span className="text-sm text-red-600">{create.error.message}</span>
            )}
          </div>
        </form>
      )}

      {/* Search */}
      {(clients.data?.length ?? 0) > 0 && (
        <div className="relative">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-lighter">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage text-sm"
          />
        </div>
      )}

      {/* Client list */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-cream-300 shadow-sm p-10 text-center">
          <div className="w-12 h-12 rounded-full bg-cream-200 mx-auto mb-3 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ink-lighter">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <p className="text-sm text-ink-lighter">
            {search ? "No clients match your search" : "No clients yet"}
          </p>
          <p className="text-xs text-ink-lighter/60 mt-1">
            {search ? "Try a different search term" : "Clients are added automatically when they book a session"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-cream-300 shadow-sm overflow-hidden divide-y divide-cream-300">
          {filtered.map((client) => (
            <div
              key={client.id}
              className="px-6 py-4 flex items-center justify-between hover:bg-cream-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-sage-50 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-sage">
                    {client.full_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="text-sm font-medium text-ink">
                    {client.full_name}
                  </div>
                  <div className="text-xs text-ink-lighter">
                    {[client.email, client.phone].filter(Boolean).join(" · ") || "No contact info"}
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  if (confirm(`Remove ${client.full_name} from your client list?`)) {
                    deactivate.mutate({ id: client.id });
                  }
                }}
                className="text-xs text-ink-lighter hover:text-red-600 transition-colors"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
