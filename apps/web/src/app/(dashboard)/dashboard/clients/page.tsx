"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import {
  Users,
  Search,
  UserPlus,
  X,
  Mail,
  Phone,
  Trash2,
} from "lucide-react";

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
          <div className="flex items-center gap-2">
            <Users size={22} className="text-sage" />
            <h1 className="text-2xl font-heading font-bold text-ink">Clients</h1>
          </div>
          <p className="text-sm text-ink-lighter mt-0.5">
            {clients.data?.length ?? 0} active client{(clients.data?.length ?? 0) !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-sage text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-sage-500 transition-all shadow-md shadow-sage/20 flex items-center gap-1.5"
        >
          {showForm ? (
            <>
              <X size={14} />
              Cancel
            </>
          ) : (
            <>
              <UserPlus size={14} />
              Add Client
            </>
          )}
        </button>
      </div>

      {/* Add client form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-white rounded-2xl border border-cream-300 shadow-sm p-5 space-y-4"
        >
          <h3 className="text-sm font-semibold text-ink flex items-center gap-1.5">
            <UserPlus size={14} className="text-sage" />
            New Client
          </h3>
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
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-lighter" />
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
            <Users size={20} className="text-ink-lighter" />
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
              <Link
                href={`/dashboard/clients/${client.id}`}
                className="flex items-center gap-4 flex-1 min-w-0"
              >
                <div className="w-10 h-10 rounded-full bg-sage-50 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-sage">
                    {client.full_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-ink">
                    {client.full_name}
                  </div>
                  <div className="text-xs text-ink-lighter flex items-center gap-2">
                    {client.email && (
                      <span className="inline-flex items-center gap-1">
                        <Mail size={10} />
                        {client.email}
                      </span>
                    )}
                    {client.phone && (
                      <span className="inline-flex items-center gap-1">
                        <Phone size={10} />
                        {client.phone}
                      </span>
                    )}
                    {!client.email && !client.phone && "No contact info"}
                  </div>
                </div>
              </Link>
              <button
                onClick={() => {
                  if (confirm(`Remove ${client.full_name} from your client list?`)) {
                    deactivate.mutate({ id: client.id });
                  }
                }}
                className="text-xs text-ink-lighter hover:text-red-600 transition-colors flex items-center gap-1 ml-3 flex-shrink-0"
              >
                <Trash2 size={12} />
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
