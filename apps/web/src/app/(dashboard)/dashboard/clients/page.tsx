"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { CLIENT_STATUSES, CLIENT_CATEGORIES } from "@mano/shared";
import {
  Users,
  Search,
  UserPlus,
  X,
  Mail,
  Phone,
  Trash2,
  Filter,
} from "lucide-react";

type StatusFilter = "active" | "inactive" | "terminated" | "all";

export default function ClientsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const clients = trpc.clients.list.useQuery(
    statusFilter === "all"
      ? { includeAll: true }
      : statusFilter === "active"
      ? undefined
      : { status: statusFilter as "active" | "inactive" | "terminated" }
  );
  const utils = trpc.useUtils();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [newCategory, setNewCategory] = useState<string>("indian");
  const [newClientType, setNewClientType] = useState<string>("irregular");
  const [search, setSearch] = useState("");

  const create = trpc.clients.create.useMutation({
    onSuccess: () => {
      utils.clients.list.invalidate();
      setShowForm(false);
      setName("");
      setEmail("");
      setPhone("");
      setNewCategory("indian");
      setNewClientType("irregular");
    },
  });

  const currentQueryInput =
    statusFilter === "all"
      ? { includeAll: true }
      : statusFilter === "active"
      ? undefined
      : { status: statusFilter as "active" | "inactive" | "terminated" };

  const deactivate = trpc.clients.deactivate.useMutation({
    onMutate: async ({ id }) => {
      await utils.clients.list.cancel();
      const previousData = utils.clients.list.getData(currentQueryInput as any);
      utils.clients.list.setData(currentQueryInput as any, (old) => {
        if (!old) return old;
        return old.filter((c) => c.id !== id);
      });
      return { previousData };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        utils.clients.list.setData(currentQueryInput as any, context.previousData);
      }
    },
    onSettled: () => utils.clients.list.invalidate(),
  });

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    create.mutate({
      full_name: name,
      email: email || null,
      phone: phone || null,
      category: newCategory as "indian" | "nri" | "couple" | "other",
      client_type: newClientType as "regular" | "irregular",
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

  const statusColors: Record<string, string> = {
    active: "bg-sage-50 text-sage",
    inactive: "bg-cream-200 text-ink-lighter",
    terminated: "bg-red-50 text-red-600",
  };

  const categoryColors: Record<string, string> = {
    indian: "bg-sage-50 text-sage",
    nri: "bg-blue-50 text-blue-600",
    couple: "bg-amber-50 text-amber",
    other: "bg-cream-200 text-ink-lighter",
  };

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
            {clients.data?.length ?? 0} client{(clients.data?.length ?? 0) !== 1 ? "s" : ""}
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

      {/* Status filter pills */}
      <div className="flex items-center gap-2">
        <Filter size={14} className="text-ink-lighter" />
        {(["active", "inactive", "terminated", "all"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              statusFilter === status
                ? "bg-sage text-white"
                : "bg-cream-100 text-ink-lighter hover:bg-cream-200"
            }`}
          >
            {status === "all" ? "All" : CLIENT_STATUSES[status]?.label ?? status}
          </button>
        ))}
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-ink-light mb-1">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage text-sm"
              >
                {Object.entries(CLIENT_CATEGORIES).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-light mb-1">Type</label>
              <select
                value={newClientType}
                onChange={(e) => setNewClientType(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage text-sm"
              >
                <option value="irregular">Irregular</option>
                <option value="regular">Regular (fixed slot)</option>
              </select>
            </div>
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
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-ink">
                      {client.full_name}
                    </span>
                    {/* Status badge */}
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-pill text-[10px] font-medium ${statusColors[client.status] ?? statusColors.active}`}>
                      {CLIENT_STATUSES[client.status as keyof typeof CLIENT_STATUSES]?.label ?? client.status}
                    </span>
                    {/* Category badge */}
                    {client.category && client.category !== "indian" && (
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-pill text-[10px] font-medium ${categoryColors[client.category] ?? categoryColors.other}`}>
                        {CLIENT_CATEGORIES[client.category as keyof typeof CLIENT_CATEGORIES]?.label ?? client.category}
                      </span>
                    )}
                    {/* Regular client indicator */}
                    {client.client_type === "regular" && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-pill text-[10px] font-medium bg-blue-50 text-blue-600">
                        Regular
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-ink-lighter flex items-center gap-2 mt-0.5">
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
