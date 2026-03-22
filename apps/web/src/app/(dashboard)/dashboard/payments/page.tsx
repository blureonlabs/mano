"use client";

import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  IndianRupee,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  RotateCcw,
  Ban,
  Receipt,
} from "lucide-react";

type StatusFilter = "all" | "unpaid" | "paid" | "refunded";

type DateRange = "this_month" | "last_month" | "all_time";

function formatPaise(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

function formatDateIST(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

function getMonthRange(offset: number): { start: Date; end: Date } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + offset;
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

export default function PaymentsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateRange, setDateRange] = useState<DateRange>("this_month");
  const [search, setSearch] = useState("");

  // Fetch all invoices (we filter client-side for date range and search)
  const invoices = trpc.payment.list.useQuery(
    statusFilter === "all" ? { limit: 100 } : { status: statusFilter, limit: 100 }
  );

  const utils = trpc.useUtils();

  const currentQueryInput =
    statusFilter === "all" ? { limit: 100 } : { status: statusFilter, limit: 100 };

  const markPaid = trpc.payment.markPaid.useMutation({
    onMutate: async ({ invoice_id }) => {
      await utils.payment.list.cancel();
      const previousData = utils.payment.list.getData(currentQueryInput as any);
      utils.payment.list.setData(currentQueryInput as any, (old) => {
        if (!old) return old;
        return old.map((inv) =>
          inv.id === invoice_id
            ? { ...inv, status: "paid" as const, paid_at: new Date().toISOString() }
            : inv
        );
      });
      return { previousData };
    },
    onSuccess: () => toast.success("Invoice marked as paid"),
    onError: (err, _vars, context) => {
      if (context?.previousData) {
        utils.payment.list.setData(currentQueryInput as any, context.previousData);
      }
      toast.error(err.message || "Failed to mark as paid");
    },
    onSettled: () => utils.payment.list.invalidate(),
  });

  // Client-side filtering by date range and search
  const filtered = useMemo(() => {
    if (!invoices.data) return [];

    let items = invoices.data;

    // Date range filter
    if (dateRange !== "all_time") {
      const offset = dateRange === "this_month" ? 0 : -1;
      const { start, end } = getMonthRange(offset);
      items = items.filter((inv) => {
        const d = new Date(inv.created_at);
        return d >= start && d <= end;
      });
    }

    // Search by client name
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter((inv) => {
        const client = inv.clients as { full_name: string; email: string | null } | null;
        return (
          client?.full_name?.toLowerCase().includes(q) ||
          client?.email?.toLowerCase().includes(q) ||
          inv.invoice_number?.toLowerCase().includes(q)
        );
      });
    }

    return items;
  }, [invoices.data, dateRange, search]);

  // Summary stats
  const stats = useMemo(() => {
    if (!invoices.data) return { totalRevenue: 0, pendingAmount: 0, thisMonth: 0 };

    const { start: monthStart, end: monthEnd } = getMonthRange(0);

    let totalRevenue = 0;
    let pendingAmount = 0;
    let thisMonth = 0;

    for (const inv of invoices.data) {
      if (inv.status === "paid") {
        totalRevenue += inv.total_inr;
        const d = new Date(inv.paid_at || inv.created_at);
        if (d >= monthStart && d <= monthEnd) {
          thisMonth += inv.total_inr;
        }
      } else if (inv.status === "unpaid") {
        pendingAmount += inv.total_inr;
      }
    }

    return { totalRevenue, pendingAmount, thisMonth };
  }, [invoices.data]);

  function handleMarkPaid(invoiceId: string) {
    const paymentId = prompt("Enter Razorpay Payment ID (or any reference):");
    if (!paymentId) return;
    markPaid.mutate({ invoice_id: invoiceId, razorpay_payment_id: paymentId });
  }

  const statusColors: Record<string, string> = {
    paid: "bg-sage-50 text-sage",
    unpaid: "bg-amber-50 text-amber",
    refunded: "bg-cream-200 text-ink-lighter",
  };

  const statusLabels: Record<string, string> = {
    paid: "Paid",
    unpaid: "Unpaid",
    refunded: "Refunded",
  };

  if (invoices.isLoading) {
    return (
      <div className="max-w-4xl space-y-6">
        <div className="h-8 w-40 bg-cream-200 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-white rounded-2xl border border-cream-300 animate-pulse" />
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-white rounded-2xl border border-cream-300 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <IndianRupee size={22} className="text-sage" />
            <h1 className="text-2xl font-heading font-bold text-ink">Payments</h1>
          </div>
          <p className="text-sm text-ink-lighter mt-0.5">
            {invoices.data?.length ?? 0} invoice{(invoices.data?.length ?? 0) !== 1 ? "s" : ""} total
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-cream-300 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-sage-50 flex items-center justify-center">
              <IndianRupee size={14} className="text-sage" />
            </div>
            <span className="text-xs font-medium text-ink-lighter">Total Revenue</span>
          </div>
          <p className="text-xl font-heading font-bold text-ink">{formatPaise(stats.totalRevenue)}</p>
        </div>

        <div className="bg-white rounded-2xl border border-cream-300 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
              <Clock size={14} className="text-amber" />
            </div>
            <span className="text-xs font-medium text-ink-lighter">Pending Amount</span>
          </div>
          <p className="text-xl font-heading font-bold text-ink">{formatPaise(stats.pendingAmount)}</p>
        </div>

        <div className="bg-white rounded-2xl border border-cream-300 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-sage-50 flex items-center justify-center">
              <CheckCircle2 size={14} className="text-sage" />
            </div>
            <span className="text-xs font-medium text-ink-lighter">This Month</span>
          </div>
          <p className="text-xl font-heading font-bold text-ink">{formatPaise(stats.thisMonth)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Date range */}
        <div className="flex items-center gap-2">
          {(
            [
              { key: "this_month", label: "This Month" },
              { key: "last_month", label: "Last Month" },
              { key: "all_time", label: "All Time" },
            ] as const
          ).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setDateRange(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                dateRange === key
                  ? "bg-sage text-white"
                  : "bg-cream-100 text-ink-lighter hover:bg-cream-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Status filter pills */}
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-ink-lighter" />
          {(["all", "paid", "unpaid", "refunded"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === status
                  ? "bg-sage text-white"
                  : "bg-cream-100 text-ink-lighter hover:bg-cream-200"
              }`}
            >
              {status === "all" ? "All" : statusLabels[status]}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-lighter" />
        <input
          type="text"
          placeholder="Search by client name or invoice number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage text-sm"
        />
      </div>

      {/* Invoice List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-cream-300 shadow-sm p-10 text-center">
          <div className="w-12 h-12 rounded-full bg-cream-200 mx-auto mb-3 flex items-center justify-center">
            <Receipt size={20} className="text-ink-lighter" />
          </div>
          <p className="text-sm text-ink-lighter">
            {search || statusFilter !== "all" || dateRange !== "all_time"
              ? "No invoices match your filters"
              : "No invoices yet"}
          </p>
          <p className="text-xs text-ink-lighter/60 mt-1">
            {search
              ? "Try a different search term"
              : "Invoices will appear here when created for sessions"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-cream-300 shadow-sm overflow-hidden">
          {/* Table header */}
          <div className="hidden sm:grid grid-cols-[1fr_1fr_100px_100px_120px] gap-4 px-6 py-3 border-b border-cream-300 bg-cream-50">
            <span className="text-xs font-medium text-ink-lighter">Invoice</span>
            <span className="text-xs font-medium text-ink-lighter">Client</span>
            <span className="text-xs font-medium text-ink-lighter">Amount</span>
            <span className="text-xs font-medium text-ink-lighter">Status</span>
            <span className="text-xs font-medium text-ink-lighter text-right">Action</span>
          </div>

          {/* Table rows */}
          <div className="divide-y divide-cream-300">
            {filtered.map((inv) => {
              const client = inv.clients as { full_name: string; email: string | null } | null;
              return (
                <div
                  key={inv.id}
                  className="px-6 py-4 sm:grid sm:grid-cols-[1fr_1fr_100px_100px_120px] sm:gap-4 sm:items-center hover:bg-cream-50 transition-colors space-y-2 sm:space-y-0"
                >
                  {/* Invoice number + date */}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{inv.invoice_number}</p>
                    <p className="text-xs text-ink-lighter">{formatDateIST(inv.created_at)}</p>
                  </div>

                  {/* Client */}
                  <div className="min-w-0">
                    <p className="text-sm text-ink truncate">{client?.full_name ?? "Unknown"}</p>
                    {client?.email && (
                      <p className="text-xs text-ink-lighter truncate">{client.email}</p>
                    )}
                  </div>

                  {/* Amount */}
                  <div>
                    <p className="text-sm font-semibold text-ink">{formatPaise(inv.total_inr)}</p>
                    {inv.gst_amount_inr > 0 && (
                      <p className="text-[10px] text-ink-lighter">
                        incl. GST {formatPaise(inv.gst_amount_inr)}
                      </p>
                    )}
                  </div>

                  {/* Status badge */}
                  <div>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-pill text-[11px] font-medium ${
                        statusColors[inv.status] ?? statusColors.unpaid
                      }`}
                    >
                      {inv.status === "paid" && <CheckCircle2 size={10} />}
                      {inv.status === "unpaid" && <Clock size={10} />}
                      {inv.status === "refunded" && <RotateCcw size={10} />}
                      {statusLabels[inv.status] ?? inv.status}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end">
                    {inv.status === "unpaid" && (
                      <button
                        onClick={() => handleMarkPaid(inv.id)}
                        disabled={markPaid.isPending}
                        className="text-xs font-medium text-sage hover:text-sage-500 transition-colors flex items-center gap-1 disabled:opacity-50"
                      >
                        <CheckCircle2 size={12} />
                        Mark Paid
                      </button>
                    )}
                    {inv.status === "paid" && (
                      <span className="text-xs text-ink-lighter flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        {inv.paid_at ? formatDateIST(inv.paid_at) : "Paid"}
                      </span>
                    )}
                    {inv.status === "refunded" && (
                      <span className="text-xs text-ink-lighter flex items-center gap-1">
                        <Ban size={12} />
                        Refunded
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
